// 文件名: server/index.js
const path = require('path');
// 兼容本地和服务器：先找根目录，找不到再找当前目录
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const { db, initUserCategories } = require('./db');
const { sendSms } = require('./sms');
const PaymentService = require('./payment');

// ==========================================
// 数据库无损热升级
// ==========================================
try { 
  db.exec("ALTER TABLE stock_movements ADD COLUMN custom_values TEXT DEFAULT '{}'"); 
} catch(e) {}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'gem_master_prod_secret_888';

// ==========================================
// 中间件配置
// ==========================================
app.use(cors()); 
app.use(bodyParser.json({limit: '50mb'})); 
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件托管 (前端页面)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// 缓存验证码
const verificationCodes = new Map();

// JWT 身份核验中间件
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
// 1. 用户与认证模块
// ==========================================
app.post('/api/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '手机号必填' });
    
    // 简单的频控：1分钟内不能重复发送
    const lastLog = db.prepare("SELECT timestamp FROM sms_logs WHERE phone = ? AND status = 'SUCCESS' ORDER BY timestamp DESC LIMIT 1").get(phone);
    if (lastLog && (Date.now() - lastLog.timestamp < 60000)) {
      return res.status(429).json({ error: '发送太频繁，请1分钟后再试' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, { code, expiresAt: Date.now() + 300000 }); // 5分钟有效
    
    const success = await sendSms(phone, code);
    db.prepare('INSERT INTO sms_logs (phone, status, timestamp) VALUES (?, ?, ?)').run(phone, success ? 'SUCCESS' : 'FAILED', Date.now());
    
    if (success) {
      res.json({ success: true, message: '短信已发送，请查收' });
    } else {
      res.status(500).json({ error: '短信发送失败，请检查手机号或联系管理员' });
    }
  } catch (err) { 
    res.status(500).json({ error: '短信服务异常' }); 
  }
});

app.post('/api/register', (req, res) => {
  const { phone, username, password, code } = req.body;
  const record = verificationCodes.get(phone);
  
  if (!record) return res.status(400).json({ error: '请先获取验证码' });
  if (record.code !== code) return res.status(400).json({ error: '验证码错误' });
  if (Date.now() > record.expiresAt) return res.status(400).json({ error: '验证码已失效' });
  
  const hash = bcrypt.hashSync(password, 10);
  // 新用户默认赠送 3 天体验期
  const threeDaysLater = Date.now() + (3 * 24 * 60 * 60 * 1000);

  try {
    // 写入数据库，默认为老板角色 (OWNER)
    const info = db.prepare('INSERT INTO users (phone, username, password_hash, vip_expiry, role) VALUES (?, ?, ?, ?, ?)').run(phone, username, hash, threeDaysLater, 'OWNER');
    // 初始化默认的黄金珠宝分类
    initUserCategories(info.lastInsertRowid);
    verificationCodes.delete(phone);
    res.json({ success: true });
  } catch (err) { 
    res.status(400).json({ error: '该手机号已被注册' }); 
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(400).json({ error: '手机号未注册，请先注册！' });

    if (bcrypt.compareSync(password, user.password_hash)) {
      // 确定数据归属：老板是自己，员工是上级
      const ownerId = user.role === 'OWNER' || !user.role ? user.id : user.parent_id;
      const finalRole = user.role || 'OWNER'; 
      
      const token = jwt.sign(
        { id: user.id, username: user.username, phone: user.phone, role: finalRole, ownerId: ownerId }, 
        JWT_SECRET, 
        { expiresIn: '30d' }
      );
      
      // 查验主账号的 VIP 状态
      const ownerUser = db.prepare('SELECT vip_expiry FROM users WHERE id = ?').get(ownerId);
      const isVip = ownerUser && ownerUser.vip_expiry > Date.now();
      
      res.json({ 
        success: true, 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          phone: user.phone, 
          vip: isVip, 
          vip_expiry: ownerUser ? ownerUser.vip_expiry : 0, 
          role: finalRole 
        } 
      });
    } else {
      res.status(400).json({ error: '密码错误，请确认是否输入有误！' });
    }
  } catch (error) {
    res.status(500).json({ error: '系统内部错误' });
  }
});

app.post('/api/reset-password', (req, res) => {
  const { phone, code, newPassword } = req.body;
  if (!phone || !code || !newPassword) return res.status(400).json({ error: '参数不全' });

  const record = verificationCodes.get(phone);
  if (!record || record.code !== code) return res.status(400).json({ error: '验证码无效或已过期' });

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user) return res.status(400).json({ error: '该手机号未注册，无法重置' });

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
// 2. 员工管理模块 (SaaS 多租户)
// ==========================================
app.get('/api/employees', authenticate, (req, res) => {
  if (req.user.role !== 'OWNER') return res.status(403).json({ error: '仅主账号可查看员工' });
  const employees = db.prepare("SELECT id, username, phone, created_at FROM users WHERE parent_id = ? AND role = 'EMPLOYEE'").all(req.user.id);
  res.json(employees);
});

app.post('/api/employees', authenticate, (req, res) => {
  if (req.user.role !== 'OWNER') return res.status(403).json({ error: '仅主账号可添加员工' });
  
  // 必须是年费 VIP 才允许添加员工
  const owner = db.prepare('SELECT vip_expiry FROM users WHERE id = ?').get(req.user.id);
  if (!owner || owner.vip_expiry <= Date.now()) {
     return res.status(403).json({ error: '仅 PRO 年度会员可创建员工子终端' });
  }

  const { phone, username, password } = req.body;
  if (!phone || !username || !password) return res.status(400).json({ error: '信息不全' });

  const hash = bcrypt.hashSync(password, 10);
  try {
    db.prepare('INSERT INTO users (phone, username, password_hash, role, parent_id) VALUES (?, ?, ?, ?, ?)').run(phone, username, hash, 'EMPLOYEE', req.user.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: '该手机号已被注册' });
  }
});

app.delete('/api/employees/:id', authenticate, (req, res) => {
  if (req.user.role !== 'OWNER') return res.status(403).json({ error: '无权操作' });
  db.prepare('DELETE FROM users WHERE id = ? AND parent_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// ==========================================
// 3. 核心库存管理模块
// ==========================================
app.get('/api/categories', authenticate, (req, res) => {
  let categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user.ownerId);
  // 如果没有任何分类，触发兜底初始化
  if (categories.length === 0) {
     initUserCategories(req.user.ownerId);
     categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(req.user.ownerId);
  }
  res.json(categories.map(c => ({ ...c, fields: JSON.parse(c.fields) })));
});

app.get('/api/products', authenticate, (req, res) => {
  const products = db.prepare('SELECT * FROM products WHERE user_id = ?').all(req.user.ownerId);
  res.json(products.map(p => ({
    id: p.id, name: p.name, categoryId: p.category_id, createdAt: p.created_at
  })));
});

app.get('/api/items', authenticate, (req, res) => {
  const items = db.prepare('SELECT * FROM stock_items WHERE user_id = ?').all(req.user.ownerId);
  res.json(items.map(i => ({
    id: i.id, productId: i.product_id, quantity: i.quantity, customValues: JSON.parse(i.custom_values), listingStatus: i.listing_status, updatedAt: i.updated_at
  })));
});

app.post('/api/products', authenticate, (req, res) => {
  const { name, categoryId } = req.body;
  const userId = req.user.ownerId; 
  // 防止同名产品
  const existing = db.prepare('SELECT id FROM products WHERE name = ? AND category_id = ? AND user_id = ?').get(name, categoryId, userId);
  if (existing) return res.status(400).json({ error: '产品已存在' });
  
  const info = db.prepare('INSERT INTO products (user_id, name, category_id, created_at) VALUES (?, ?, ?, ?)').run(userId, name, categoryId, Date.now());
  res.json({ id: info.lastInsertRowid, name, categoryId });
});

app.delete('/api/products/:id', authenticate, (req, res) => {
  if (req.user.role !== 'OWNER') return res.status(403).json({error: '无权删除'});
  const productId = req.params.id;
  const userId = req.user.ownerId;
  db.prepare('DELETE FROM stock_items WHERE product_id = ?').run(productId);
  db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(productId, userId);
  res.json({ success: true });
});

app.post('/api/products/bulk-delete', authenticate, (req, res) => {
  if (req.user.role !== 'OWNER') return res.status(403).json({error: '无权删除，请联系管理员'});
  const { productIds } = req.body;
  const userId = req.user.ownerId;
  if (!Array.isArray(productIds)) return res.status(400).json({error: '参数错误'});

  try {
    const deleteItems = db.prepare('DELETE FROM stock_items WHERE product_id = ?');
    const deleteProd = db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
    
    // 开启事务，保证批量删除的一致性
    const runTx = db.transaction((ids) => {
      for(let id of ids) {
        deleteItems.run(id);
        deleteProd.run(id, userId);
      }
    });
    runTx(productIds);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({error: '批量删除失败'});
  }
});

app.post('/api/items', authenticate, (req, res) => {
  const { productId, customValues, listingStatus } = req.body;
  const valStr = JSON.stringify(customValues);
  const userId = req.user.ownerId; 
  
  let itemId = 0;
  // 查找是否已有完全相同规格的库存记录
  const existing = db.prepare('SELECT * FROM stock_items WHERE product_id = ? AND custom_values = ? AND listing_status = ? AND user_id = ?').get(productId, valStr, listingStatus, userId);

  if (existing) {
    // 有就只加数量
    db.prepare('UPDATE stock_items SET quantity = quantity + 1, updated_at = ? WHERE id = ?').run(Date.now(), existing.id);
    itemId = existing.id;
  } else {
    // 没有就新建一条记录
    const info = db.prepare('INSERT INTO stock_items (user_id, product_id, quantity, custom_values, listing_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(userId, productId, 1, valStr, listingStatus, Date.now());
    itemId = info.lastInsertRowid;
  }

  // 记录流水
  const weight = Number(customValues.weight) || 0;
  db.prepare('INSERT INTO stock_movements (user_id, product_id, item_id, type, quantity, weight, timestamp, custom_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(userId, productId, itemId, 'IN', 1, weight, Date.now(), valStr);
  
  res.json({ success: true, action: 'increment' });
});

app.post('/api/items/outbound', authenticate, (req, res) => {
  const { itemId } = req.body;
  const userId = req.user.ownerId;

  const item = db.prepare('SELECT * FROM stock_items WHERE id = ? AND user_id = ?').get(itemId, userId);
  if (!item || item.quantity <= 0) return res.status(400).json({ error: '库存不足' });

  if (item.quantity === 1) {
    db.prepare('DELETE FROM stock_items WHERE id = ?').run(itemId);
  } else {
    db.prepare('UPDATE stock_items SET quantity = quantity - 1, updated_at = ? WHERE id = ?').run(Date.now(), itemId);
  }

  // 记录出库流水
  const vals = JSON.parse(item.custom_values);
  const weight = Number(vals.weight) || 0;
  db.prepare('INSERT INTO stock_movements (user_id, product_id, item_id, type, quantity, weight, timestamp, custom_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(userId, item.product_id, itemId, 'OUT', 1, weight, Date.now(), item.custom_values);
  
  res.json({ success: true });
});

app.post('/api/bulk-import', authenticate, (req, res) => {
  const { categoryId, items } = req.body;
  const userId = req.user.ownerId;
  if (!categoryId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: '无效的数据格式' });

  try {
    const insertProd = db.prepare('INSERT INTO products (user_id, name, category_id, created_at) VALUES (?, ?, ?, ?)');
    const insertItem = db.prepare('INSERT INTO stock_items (user_id, product_id, quantity, custom_values, listing_status, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
    const insertMove = db.prepare('INSERT INTO stock_movements (user_id, product_id, item_id, type, quantity, weight, timestamp, custom_values) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    const processUpload = db.transaction((rows) => {
        for(let row of rows) {
            if(!row.name) continue; 
            
            let prod = db.prepare('SELECT id FROM products WHERE name = ? AND category_id = ? AND user_id = ?').get(row.name, categoryId, userId);
            let prodId;
            if(!prod) {
                const pInfo = insertProd.run(userId, row.name, categoryId, Date.now());
                prodId = pInfo.lastInsertRowid;
            } else {
                prodId = prod.id;
            }

            const customValues = { weight: row.weight || '0' };
            if(row.size) customValues.size = row.size; 
            const valStr = JSON.stringify(customValues);
            const weightNum = Number(row.weight) || 0;
            
            const status = (row.status === '已上架' || row.status === '上架') ? 'LISTED' : 'UNLISTED';

            let item = db.prepare('SELECT * FROM stock_items WHERE product_id = ? AND custom_values = ? AND listing_status = ? AND user_id = ?').get(prodId, valStr, status, userId);
            let itemId;
            if(item) {
                db.prepare('UPDATE stock_items SET quantity = quantity + 1, updated_at = ? WHERE id = ?').run(Date.now(), item.id);
                itemId = item.id;
            } else {
                const iInfo = insertItem.run(userId, prodId, 1, valStr, status, Date.now());
                itemId = iInfo.lastInsertRowid;
            }
            insertMove.run(userId, prodId, itemId, 'IN', 1, weightNum, Date.now(), valStr);
        }
    });
    
    processUpload(items);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '批量导入失败' });
  }
});

// ==========================================
// 4. 数据报表模块
// ==========================================
app.post('/api/reports/flow', authenticate, (req, res) => {
  const { startDate, endDate } = req.body; 
  const userId = req.user.ownerId;

  let query = `
    SELECT sm.*, p.name as product_name, c.name as category_name 
    FROM stock_movements sm 
    LEFT JOIN products p ON sm.product_id = p.id 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE sm.user_id = ?
  `;
  const params = [userId];

  if (startDate) {
    query += ` AND sm.timestamp >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND sm.timestamp <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY sm.timestamp DESC`;

  try {
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: '查询流水失败' });
  }
});

// ==========================================
// 5. 支付路由
// ==========================================
app.post('/api/pay/create', authenticate, async (req, res) => {
  if (req.user.role !== 'OWNER') return res.status(403).json({error: '子账号不可支付'});
  try {
    const { planId, isMobile } = req.body; 
    // 调用 PaymentService 生成订单链接
    const { orderId, amount, payUrl } = await PaymentService.createPayment(req.user.ownerId, planId, isMobile);
    // 把这条“待支付”的订单写进数据库记录
    db.prepare('INSERT INTO orders (id, user_id, amount, product_name, created_at, status) VALUES (?, ?, ?, ?, ?, ?)').run(orderId, req.user.ownerId, amount, planId, Date.now(), 'PENDING');
    
    res.json({ payUrl });
  } catch (e) {
    console.error("发起支付失败:", e);
    res.status(500).json({ error: e.message || '支付系统对接异常' }); 
  }
});

// 支付宝异步回调：用户付完钱后，支付宝会来敲这个门
app.post('/api/alipay-notify', (req, res) => {
  const params = req.body;
  if (params.trade_status === 'TRADE_SUCCESS') {
    const orderId = params.out_trade_no;
    // 找出这笔订单
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    
    // 如果订单存在且没处理过，就开始“发货”
    if (order && order.status === 'PENDING') {
      db.prepare("UPDATE orders SET status = 'PAID', paid_at = ? WHERE id = ?").run(Date.now(), orderId);
      
      const duration = order.product_name === 'plan_year' ? (366 * 86400000) : (31 * 86400000);
      
      // 更新用户的 VIP 时长：如果没过期就在原来基础上加，如果过期了就从现在开始加
      db.prepare('UPDATE users SET vip_expiry = CASE WHEN vip_expiry > ? THEN vip_expiry + ? ELSE ? + ? END WHERE id = ?').run(Date.now(), duration, Date.now(), duration, order.user_id);
    }
  }
  // 必须返回 success 告诉支付宝“我收到了”，不然它会一直重发
  res.send('success');
});

// ==========================================
// 6. 前端静态文件接管兜底
// ==========================================
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API_NOT_FOUND' });
  if (fs.existsSync(path.join(distPath, 'index.html'))) res.sendFile(path.join(distPath, 'index.html'));
  else res.send('AurumFlow Backend is Running.');
});

app.listen(PORT, () => {
  console.log(`✅ AurumFlow (SaaS模式) 后端启动 | 端口: ${PORT}`);
});