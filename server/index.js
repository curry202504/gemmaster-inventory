const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// 1. 加载环境变量
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// 2. 引入数据库与业务模块
const { db, initUserCategories } = require('./db');
const { sendSms } = require('./sms');
const PaymentService = require('./payment');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'gem_master_prod_secret_888';
const isProduction = process.env.NODE_ENV === 'production';

// 3. 配置中间件
app.use(cors()); 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 4. 静态文件托管
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

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

// 发送验证码 (已修复提示语，强制真实发送)
// 发送验证码 (无条件真实发送版)
app.post('/api/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '手机号必填' });
    
    // 频控：1分钟1条
    const lastLog = db.prepare("SELECT timestamp FROM sms_logs WHERE phone = ? AND status = 'SUCCESS' ORDER BY timestamp DESC LIMIT 1").get(phone);
    if (lastLog && (Date.now() - lastLog.timestamp < 60000)) {
      return res.status(429).json({ error: '发送太频繁，请1分钟后再试' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, { code, expiresAt: Date.now() + 300000 });
    
    // 【强制真实发送】不管环境如何，直接调阿里云
    const success = await sendSms(phone, code);
    
    db.prepare('INSERT INTO sms_logs (phone, status, timestamp) VALUES (?, ?, ?)').run(phone, success ? 'SUCCESS' : 'FAILED', Date.now());
    
    if (success) {
      res.json({ success: true, message: '短信已发送，请查收' });
    } else {
      res.status(500).json({ error: '短信发送失败，请检查手机号或联系管理员' });
    }
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: '短信服务异常' }); 
  }
});

// 注册 (SaaS初始化)
app.post('/api/register', (req, res) => {
  const { phone, username, password, code } = req.body;
  const record = verificationCodes.get(phone);
  
  if (!record) return res.status(400).json({ error: '请先获取验证码' });
  if (record.code !== code) return res.status(400).json({ error: '验证码错误' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: '验证码已失效' });
  
  const hash = bcrypt.hashSync(password, 10);
  const threeDaysLater = Date.now() + (3 * 24 * 60 * 60 * 1000);

  try {
    const info = db.prepare('INSERT INTO users (phone, username, password_hash, vip_expiry) VALUES (?, ?, ?, ?)').run(phone, username, hash, threeDaysLater);
    const newUserId = info.lastInsertRowid;

    // 为该用户初始化专属分类
    initUserCategories(newUserId);

    verificationCodes.delete(phone);
    console.log(`✅ 新用户注册成功: ${phone} (ID: ${newUserId})`);
    res.json({ success: true });
  } catch (err) { 
    console.error(err);
    res.status(400).json({ error: '该手机号已被注册' }); 
  }
});

// 登录
app.post('/api/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    
    if (!user) return res.status(400).json({ error: '手机号未注册' });

    if (bcrypt.compareSync(password, user.password_hash)) {
      const token = jwt.sign(
        { id: user.id, username: user.username, phone: user.phone }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
      );
      
      const isVip = user.vip_expiry > Date.now();
      res.json({ success: true, token, user: { id: user.id, username: user.username, phone: user.phone, vip: isVip } });
    } else {
      res.status(400).json({ error: '密码错误' });
    }
  } catch (error) {
    res.status(500).json({ error: '系统内部错误' });
  }
});

app.post('/api/reset-password', (req, res) => {
  const { phone, code, newPassword } = req.body;
  const record = verificationCodes.get(phone);
  if (!record || record.code !== code) return res.status(400).json({ error: '验证码无效' });

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) return res.status(400).json({ error: '该手机号未注册' });

  const hash = bcrypt.hashSync(newPassword, 10);
  try {
    db.prepare('UPDATE users SET password_hash = ? WHERE phone = ?').run(hash, phone);
    verificationCodes.delete(phone);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '密码重置失败' });
  }
});

// ==========================================
// 2. 核心库存管理模块 (SaaS 隔离)
// ==========================================

// 获取分类
app.get('/api/categories', authenticate, (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user.id);
  res.json(categories.map(c => ({ ...c, fields: JSON.parse(c.fields) })));
});

// 获取产品
app.get('/api/products', authenticate, (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE user_id = ?').all(req.user.id);
  res.json(products.map(p => ({
    id: p.id,
    name: p.name,
    categoryId: p.category_id,
    createdAt: p.created_at
  })));
});

// 获取库存
app.get('/api/items', authenticate, (req, res) => {
  const items = db.prepare('SELECT * FROM stock_items WHERE user_id = ?').all(req.user.id);
  res.json(items.map(i => ({
    id: i.id,
    productId: i.product_id,
    quantity: i.quantity,
    customValues: JSON.parse(i.custom_values),
    listingStatus: i.listing_status,
    updatedAt: i.updated_at
  })));
});

// 创建产品 (重名检测)
app.post('/api/products', authenticate, (req, res) => {
  const { name, categoryId } = req.body;
  const userId = req.user.id;
  
  const existing = db.prepare('SELECT id FROM products WHERE name = ? AND category_id = ? AND user_id = ?')
    .get(name, categoryId, userId);
    
  if (existing) {
    return res.status(400).json({ error: '您已添加过同名产品，请勿重复创建' });
  }

  const info = db.prepare('INSERT INTO products (user_id, name, category_id, created_at) VALUES (?, ?, ?, ?)').run(userId, name, categoryId, Date.now());
  res.json({ id: info.lastInsertRowid, name, categoryId });
});

// 删除产品
app.delete('/api/products/:id', authenticate, (req, res) => {
  const productId = req.params.id;
  const userId = req.user.id;
  try {
    const product = db.prepare('SELECT id FROM products WHERE id = ? AND user_id = ?').get(productId, userId);
    if (!product) return res.status(404).json({ error: '产品不存在或无权操作' });

    db.prepare('DELETE FROM stock_items WHERE product_id = ?').run(productId);
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 入库
app.post('/api/items', authenticate, (req, res) => {
  const { productId, customValues, listingStatus } = req.body;
  const valStr = JSON.stringify(customValues);
  const userId = req.user.id;
  
  let itemId = 0;
  const existing = db.prepare('SELECT * FROM stock_items WHERE product_id = ? AND custom_values = ? AND listing_status = ? AND user_id = ?')
    .get(productId, valStr, listingStatus, userId);

  if (existing) {
    db.prepare('UPDATE stock_items SET quantity = quantity + 1, updated_at = ? WHERE id = ?').run(Date.now(), existing.id);
    itemId = existing.id;
  } else {
    const info = db.prepare('INSERT INTO stock_items (user_id, product_id, quantity, custom_values, listing_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, productId, 1, valStr, listingStatus, Date.now());
    itemId = info.lastInsertRowid;
  }

  // 记录流水
  const weight = Number(customValues.weight) || 0;
  db.prepare('INSERT INTO stock_movements (user_id, product_id, item_id, type, quantity, weight, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(userId, productId, itemId, 'IN', 1, weight, Date.now());

  res.json({ success: true, action: 'increment' });
});

// 出库
app.post('/api/items/outbound', authenticate, (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.id;

  const item = db.prepare('SELECT * FROM stock_items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item || item.quantity <= 0) return res.status(400).json({ error: '库存不足' });

  if (item.quantity === 1) {
    db.prepare('DELETE FROM stock_items WHERE id = ?').run(itemId);
  } else {
    db.prepare('UPDATE stock_items SET quantity = quantity - 1, updated_at = ? WHERE id = ?').run(Date.now(), itemId);
  }

  // 记录流水
  const vals = JSON.parse(item.custom_values);
  const weight = Number(vals.weight) || 0;
  db.prepare('INSERT INTO stock_movements (user_id, product_id, item_id, type, quantity, weight, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(userId, item.product_id, itemId, 'OUT', 1, weight, Date.now());

  res.json({ success: true });
});

// 获取今日流水
app.get('/api/reports/daily', authenticate, (req, res) => {
  const startOfDay = new Date().setHours(0,0,0,0);
  const userId = req.user.id;
  
  const logs = db.prepare(`
    SELECT sm.*, p.name as product_name, c.name as category_name 
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE sm.user_id = ? AND sm.timestamp >= ?
    ORDER BY sm.timestamp DESC
  `).all(userId, startOfDay);

  res.json(logs);
});

// ==========================================
// 3. 支付系统 API
// ==========================================

app.post('/api/pay/create', authenticate, async (req, res) => {
  try {
    const { planId, isRecurring } = req.body;
    const { orderId, amount, payUrl } = await PaymentService.createPayment(req.user.id, planId, isRecurring);
    db.prepare('INSERT INTO orders (id, user_id, amount, product_name, created_at, status) VALUES (?, ?, ?, ?, ?, ?)')
      .run(orderId, req.user.id, amount, planId, Date.now(), 'PENDING');
    res.json({ payUrl });
  } catch (e) {
    res.status(500).json({ error: '支付系统对接异常' }); 
  }
});

app.post('/api/alipay-notify', (req, res) => {
  const params = req.body;
  if (params.trade_status === 'TRADE_SUCCESS') {
    const orderId = params.out_trade_no;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (order && order.status === 'PENDING') {
      db.prepare("UPDATE orders SET status = 'PAID', paid_at = ? WHERE id = ?").run(Date.now(), orderId);
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
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API_NOT_FOUND' });
  }
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.send('AurumFlow Backend is Running.');
  }
});

app.listen(PORT, () => {
  console.log(`✅ AurumFlow (SaaS模式) 后端启动 | 端口: ${PORT}`);
  console.log(`🔧 [系统] 模式: ${isProduction ? '🔴 生产 (Production)' : '🟢 开发 (Development)'}`);
  console.log(`🔐 [系统] 密码重置模块: 已加载`);
  console.log(`📦 [系统] 数据库连接: 正常`);
  console.log(`📊 [系统] 报表流水模块: 已加载`);
});