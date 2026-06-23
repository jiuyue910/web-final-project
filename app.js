import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js'; // 引入你的資料庫模組

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());

// 聯結前端（指到最外層的 client/dist）
app.use(express.static(path.join(process.cwd(), '../client/dist')));

// ==========================================
// 1. 取得所有成員名單
// ==========================================
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// 2. 新增成員
// ==========================================
app.post('/api/users', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "請提供姓名" });
    db.run("INSERT INTO users (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name });
    });
});

// ==========================================
// 3. 刪除成員
// ==========================================
app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "成員刪除成功", affectedRows: this.changes });
    });
});

// ==========================================
// 4. 取得所有人的課表資料
// ==========================================
app.get('/api/schedules', (req, res) => {
    db.all("SELECT * FROM schedules", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const result = {};
        rows.forEach(row => {
            if (!result[row.user_id]) result[row.user_id] = {};
            if (!result[row.user_id][row.day_of_week]) result[row.user_id][row.day_of_week] = {};
            result[row.user_id][row.day_of_week][row.period] = row.is_busy;
        });
        res.json(result);
    });
});

// ==========================================
// 5. 儲存/更新某個使用者的完整課表
// ==========================================
app.post('/api/schedules/save', (req, res) => {
    const { userId, userSchedule } = req.body;
    if (!userId) return res.status(400).json({ error: "缺少使用者 ID" });
    db.run("DELETE FROM schedules WHERE user_id = ?", [userId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!userSchedule || Object.keys(userSchedule).length === 0) {
            return res.json({ message: "課表已成功清空儲存" });
        }
        const stmt = db.prepare("INSERT INTO schedules (user_id, day_of_week, period) VALUES (?, ?, ?)");
        try {
            for (const day in userSchedule) {
                for (const period in userSchedule[day]) {
                    if (userSchedule[day][period] === 1) {
                        stmt.run(userId, parseInt(day), parseInt(period));
                    }
                }
            }
            stmt.finalize();
            res.json({ message: "課表更新成功！" });
        } catch (error) {
            res.status(500).json({ error: "寫入資料庫失敗" });
        }
    });
});

// 萬用路由導向前端
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), '../client/dist/index.html'));
});

export default app;