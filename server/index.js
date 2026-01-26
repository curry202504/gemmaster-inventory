const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// 1. 加载配置
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.error('[错误] 找不到 .env 文件');
}

// 2. 引入模块
const { db } = require('./db');
const { sendSms } = require('./sms');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// 内存存验证码
const verificationCodes = new Map();

// --- 辅助函数：短信频控检查 ---
function checkSmsRateLimit(phone) {
  const now = Date.now();
  
  // 规则1: 1分钟内只能发1条
  const lastLog = db.prepare('SELECT timestamp FROM sms_logs WHERE phone = ? AND status = ? ORDER BY timestamp DESC LIMIT 1').get(phone, 'SUCCESS');
  if (lastLog && (now - lastLog.timestamp < 60 * 1000)) {
    const waitSeconds = Math.ceil((60 * 1000 - (now - lastLog.timestamp)) / 1000);
    return `发送太频繁，请 ${waitSeconds} 秒后再试`;
  }

  // 规则2: 24小时内只能发10条 (自然日)
  const startOfDay = new Date().setHours(0,0,0,0);
  const dailyCount = db.prepare('SELECT count(*) as count FROM sms_logs WHERE phone = ? AND status = ? AND timestamp > ?').get(phone, 'SUCCESS', startOfDay);
  
  if (dailyCount.count >= 10) {
    return '今日短信额度已用完，请明天再试';
  }

  return null; // 通过检查
}

// --- 接口定义 ---

// 1. 发送验证码接口 (含频控)
app.post('/api/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: '手机号不能为空' });

    // Step 1: 检查频控
    const limitError = checkSmsRateLimit(phone);
    if (limitError) {
      console.warn(`[频控拦截] ${phone}: ${limitError}`);
      return res.status(429).json({ error: limitError });
    }

    // Step 2: 生成验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    verificationCodes.set(phone, { code, expiresAt });

    // Step 3: 发送短信
    const success = await sendSms(phone, code);
    
    // Step 4: 记录日志到数据库
    const status = success ? 'SUCCESS' : 'FAILED';
    db.prepare('INSERT INTO sms_logs (phone, status, timestamp) VALUES (?, ?, ?)').run(phone, status, Date.now());

    if (success) {
      res.json({ success: true, message: '验证码已发送' });
    } else {
      res.status(500).json({ error: '短信发送失败' });
    }
  } catch (err) {
    console.error('发送接口报错:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 2. 注册接口
app.post('/api/register', (req, res) => {
  try {
    const { phone, username, password, code } = req.body;

    const record = verificationCodes.get(phone);
    if (!record) return res.status(400).json({ error: '请先获取验证码' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: '验证码已过期' });
    if (record.code !== code) return res.status(400).json({ error: '验证码错误' });

    const existing = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(400).json({ error: '该手机号已注册，请直接登录' });

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    const insert = db.prepare('INSERT INTO users (phone, username, password_hash) VALUES (?, ?, ?)');
    const result = insert.run(phone, username, hash);
    
    verificationCodes.delete(phone);
    
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// 3. 登录接口
app.post('/api/login', (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(400).json({ error: '账号不存在' });

    const validPass = bcrypt.compareSync(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: '密码错误' });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { id: user.id, username: user.username, phone: user.phone } 
    });
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});

// 4. 找回密码接口 (重置密码)
app.post('/api/reset-password', (req, res) => {
  try {
    const { phone, password, code } = req.body;

    // 校验验证码
    const record = verificationCodes.get(phone);
    if (!record) return res.status(400).json({ error: '请先获取验证码' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: '验证码已过期' });
    if (record.code !== code) return res.status(400).json({ error: '验证码错误' });

    // 检查用户是否存在
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user) return res.status(400).json({ error: '该手机号未注册' });

    // 更新密码
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE phone = ?').run(hash, phone);
    
    verificationCodes.delete(phone);
    
    res.json({ success: true, message: '密码重置成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '重置失败' });
  }
});

app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`✅ 后端服务启动成功 (含频控保护)`);
  console.log(`🌍 监听地址: http://localhost:${PORT}`);
  console.log(`-------------------------------------------`);
});