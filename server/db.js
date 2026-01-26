const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbPath = path.resolve(__dirname, process.env.DB_PATH || 'database.sqlite');
const db = new Database(dbPath);

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 新增：短信发送日志表 (用于频控)
  CREATE TABLE IF NOT EXISTS sms_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS' or 'FAILED'
    timestamp INTEGER NOT NULL -- 存毫秒时间戳
  );
`);

console.log('[数据库] 表结构同步完成 (含短信日志表)');

module.exports = { db };