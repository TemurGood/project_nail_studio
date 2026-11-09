const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT,
            date TEXT,
            time TEXT,
            client_name TEXT,
            client_phone TEXT
        )
    `);
}
initDb().catch(console.error);

// Услуги
app.get('/api/services', (req, res) => {
    const services = [
        { id: 1, name: 'Классический гигиенический маникюр (без покрытия)', price: '100 000 сум', duration: '45 мин' },
        { id: 2, name: 'Маникюр + Однотонное гелевое покрытие', price: '180 000 сум', duration: '1.5 часа' },
        { id: 3, name: 'Маникюр + Френч / Лунный дизайн', price: '220 000 сум', duration: '2 часа' },
        { id: 4, name: 'Наращивание ногтей (гель / полигель)', price: '320 000 сум', duration: '2.5 часа' },
        { id: 5, name: 'Сложный арт-дизайн (стемпинг, стразы, фигурки)', price: '280 000 сум', duration: '2 часа' },
        { id: 6, name: 'Премиум уход (Японский маникюр + СПА)', price: '200 000 сум', duration: '1 час 15 мин' }
    ];
    res.json(services);
});

// Добавить запись
app.post('/api/appointments', async (req, res) => {
    try {
        const { service, date, time, client_name, client_phone } = req.body;
        
        if (!service || !date || !time || !client_name || !client_phone) {
            return res.status(400).json({ error: 'Заполните все поля!' });
        }

        await db.execute({
            sql: `INSERT INTO appointments (service, date, time, client_name, client_phone) VALUES (?, ?, ?, ?, ?)`,
            args: [service, date, time, client_name, client_phone]
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить записи (для админки)
app.get('/api/appointments', async (req, res) => {
    try {
        const rs = await db.execute(`SELECT * FROM appointments ORDER BY id DESC`);
        res.json(rs.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
}

module.exports = app;