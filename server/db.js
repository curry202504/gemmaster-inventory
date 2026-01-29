const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// ==========================================
// 1. 初始化表结构 (SaaS模式：全员增加 user_id)
// ==========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    username TEXT,
    password_hash TEXT NOT NULL,
    vip_expiry INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch() * 1000)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sms_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    status TEXT,
    timestamp INTEGER
  )
`);

// 分类表 (每个人有自己的分类配置)
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER, 
    name TEXT NOT NULL,
    icon TEXT,
    fields TEXT DEFAULT '[]'
  )
`);

// 产品表
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    category_id INTEGER,
    created_at INTEGER,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )
`);

// 库存项表
db.exec(`
  CREATE TABLE IF NOT EXISTS stock_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 0,
    custom_values TEXT, 
    listing_status TEXT DEFAULT 'unlisted',
    updated_at INTEGER,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);

// 库存流水表
db.exec(`
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_id INTEGER,
    item_id INTEGER,
    type TEXT, 
    quantity INTEGER,
    weight REAL,
    timestamp INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    amount TEXT,
    product_name TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at INTEGER,
    paid_at INTEGER
  )
`);

// ==========================================
// 2. 辅助函数：为新用户初始化默认分类
// ==========================================

const initUserCategories = (userId) => {
  console.log(`🔧 [SaaS系统] 正在为用户 ID:${userId} 初始化私有分类...`);
  const insert = db.prepare('INSERT INTO categories (user_id, name, icon, fields) VALUES (?, ?, ?, ?)');
  
  // 只有克重 (支持小数)
  const fieldWeight = { key: 'weight', label: '克重 (g)', type: 'number', step: '0.01' };
  // 只有圈口
  const fieldSize = { key: 'size', label: '圈口/尺寸', type: 'text' };

  // 1. 戒指
  insert.run(userId, '戒指', 'Ring', JSON.stringify([fieldWeight, fieldSize]));
  
  // 2. 手链
  insert.run(userId, '手链', 'Bracelet', JSON.stringify([fieldWeight, fieldSize]));
  
  // 3. 其他
  insert.run(userId, '项链', 'Necklace', JSON.stringify([fieldWeight]));
  insert.run(userId, '耳饰', 'Earring', JSON.stringify([fieldWeight]));
  insert.run(userId, '金条', 'GoldBar', JSON.stringify([fieldWeight]));
  
  console.log(`✅ [SaaS系统] 用户 ID:${userId} 分类初始化完成`);
};

console.log('📦 [数据库] SaaS 架构初始化成功');

module.exports = { db, initUserCategories };