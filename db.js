import sqlite3 from 'sqlite3';
import path from 'path';

// 建立或連接到資料庫檔案
const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('資料庫連接失敗:', err.message);
    } else {
        console.log('成功連接到 SQLite 資料庫:', dbPath);
    }
});

// 啟用外鍵限制（確保 ON DELETE CASCADE 刪除成員時能自動連動刪除課表）
db.run("PRAGMA foreign_keys = ON");

// 初始化資料表
db.serialize(() => {
    // 1. 建立使用者資料表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `);

    // 2. 建立課表資料表（外鍵連動 users）
    db.run(`
        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL, -- 1-5 代表週一到週五
            period INTEGER NOT NULL,       -- 1-4 或更多代表第幾節課
            is_busy INTEGER DEFAULT 1,     -- 1 代表有課/忙碌
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
});

// 🔥 老師規格的核心：使用 ES Module 的導出語法
export default db;