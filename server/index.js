const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// 加载环境变量
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// 引入数据库与业务模块
const { db } = require('./db');
const { sendSms } = require('./sms');
const PaymentService = require('./payment');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 托管前端静态文件
app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'gem_master_prod_secret_888';
const verificationCodes = new Map();

// --- 中间件：JWT 身份校验 ---
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '请先登录' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(403).json({ error: '登录失效，请重新登录' });
  }
};

// ==========================================
// 1. 用户账户与安全模块
// ==========================================

app.post('/api/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '手机号必填' });
    
    // 频控检查：1分钟内只能发1条
    const lastLog = db.prepare('SELECT timestamp FROM sms_logs WHERE phone = ? AND status = "SUCCESS" ORDER BY timestamp DESC LIMIT 1').get(phone);
    if (lastLog && (Date.now() - lastLog.timestamp < 60000)) return res.status(429).json({ error: '发送太频繁' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, { code, expiresAt: Date.now() + 300000 });
    
    const success = await sendSms(phone, code);
    db.prepare('INSERT INTO sms_logs (phone, status, timestamp) VALUES (?, ?, ?)').run(phone, success ? 'SUCCESS' : 'FAILED', Date.now());
    
    res.json({ success });
  } catch (err) { res.status(500).json({ error: '验证码发送异常' }); }
});

app.post('/api/register', (req, res) => {
  const { phone, username, password, code } = req.body;
  const record = verificationCodes.get(phone);
  if (!record || record.code !== code) return res.status(400).json({ error: '验证码错误或已失效' });
  
  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (phone, username, password_hash) VALUES (?, ?, ?)').run(phone, username, hash);
    verificationCodes.delete(phone);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: '该手机号已被注册' }); }
});

app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (user && bcrypt.compareSync(password, user.password_hash)) {
    const token = jwt.sign({ id: user.id, username: user.username, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });
    const isVip = user.vip_expiry > Date.now();
    res.json({ success: true, token, user: { id: user.id, username: user.username, phone: user.phone, vip: isVip } });
  } else {
    res.status(400).json({ error: '手机号或密码不正确' });
  }
});

// ==========================================
// 2. 核心库存管理模块 (数据库版)
// ==========================================

// 获取全部分类
app.get('/api/categories', authenticate, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  // 解析 JSON 字段
  const result = categories.map(c => ({ ...c, fields: JSON.parse(c.fields) }));
  res.json(result);
});

// 获取全部产品
app.get('/api/products', authenticate, (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// 获取全部库存项
app.get('/api/items', authenticate, (req, res) => {
  const items = db.prepare('SELECT * FROM stock_items').all();
  const result = items.map(i => ({ ...i, customValues: JSON.parse(i.custom_values) }));
  res.json(result);
});

// 新建产品
app.post('/api/products', authenticate, (req, res) => {
  const { name, categoryId } = req.body;
  const info = db.prepare('INSERT INTO products (name, category_id, created_at) VALUES (?, ?, ?)').run(name, categoryId, Date.now());
  res.json({ id: info.lastInsertRowid, name, categoryId });
});

// 办理入库 (增加库存)
app.post('/api/items', authenticate, (req, res) => {
  const { productId, customValues, listingStatus } = req.body;
  const valStr = JSON.stringify(customValues);
  
  // 检查是否存在相同规格的项，若有则累加
  const existing = db.prepare('SELECT * FROM stock_items WHERE product_id = ? AND custom_values = ? AND listing_status = ?')
    .get(productId, valStr, listingStatus);

  if (existing) {
    db.prepare('UPDATE stock_items SET quantity = quantity + 1, updated_at = ? WHERE id = ?')
      .run(Date.now(), existing.id);
    res.json({ success: true, action: 'increment' });
  } else {
    db.prepare('INSERT INTO stock_items (product_id, quantity, custom_values, listing_status, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(productId, 1, valStr, listingStatus, Date.now());
    res.json({ success: true, action: 'insert' });
  }
});

// 办理出库 (减少库存)
app.post('/api/items/outbound', authenticate, (req, res) => {
  const { itemId } = req.body;
  const item = db.prepare('SELECT * FROM stock_items WHERE id = ?').get(itemId);
  
  if (!item || item.quantity <= 0) return res.status(400).json({ error: '库存不足' });

  if (item.quantity === 1) {
    db.prepare('DELETE FROM stock_items WHERE id = ?').run(itemId);
  } else {
    db.prepare('UPDATE stock_items SET quantity = quantity - 1, updated_at = ? WHERE id = ?').run(Date.now(), itemId);
  }
  res.json({ success: true });
});

// ==========================================
// 3. 支付与订阅模块
// ==========================================

app.post('/api/pay/create', authenticate, async (req, res) => {
  try {
    const { planId, isRecurring } = req.body;
    const { orderId, amount, payUrl } = await PaymentService.createPayment(req.user.id, planId, isRecurring);
    db.prepare('INSERT INTO orders (id, user_id, amount, product_name, created_at, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(orderId, req.user.id, amount, planId, Date.now(), 'PENDING');
    res.json({ payUrl });
  } catch (e) { res.status(500).json({ error: '支付系统对接异常' }); }
});

app.post('/api/alipay-notify', (req, res) => {
  const params = req.body;
  if (params.trade_status === 'TRADE_SUCCESS') {
    const orderId = params.out_trade_no;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (order && order.status === 'PENDING') {
      db.prepare('UPDATE orders SET status = "PAID", paid_at = ? WHERE id = ?').run(Date.now(), orderId);
      const duration = order.product_name === 'plan_year' ? (366 * 86400000) : (31 * 86400000);
      db.prepare('UPDATE users SET vip_expiry = CASE WHEN vip_expiry > ? THEN vip_expiry + ? ELSE ? + ? END WHERE id = ?')
        .run(Date.now(), duration, Date.now(), duration, order.user_id);
    }
  }
  res.send('success');
});

// ==========================================
// 4. 路由兜底
// ==========================================
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ AurumFlow (御流) 全功能后端启动 | 端口: ${PORT}`);
});