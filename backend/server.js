const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

const SECRET_KEY = 'sewahtku_secret_key_pro_max';

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File Upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });


// Middleware JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });
    jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
        if (err) return res.status(500).json({ error: 'Failed to authenticate' });
        req.adminId = decoded.id;
        next();
    });
};

// --- ROUTES ---

// Submit Multi-Item Order
app.post('/api/orders', upload.single('payment_proof'), (req, res) => {
    const { customer_name, whatsapp, duration, total_price, items } = req.body;
    const parsedItems = JSON.parse(items);
    const payment_proof = req.file ? req.file.filename : null;

    // 1. Insert into orders table
    const orderSql = `INSERT INTO orders (customer_name, whatsapp, duration, total_price, payment_proof) VALUES (?, ?, ?, ?, ?)`;
    db.run(orderSql, [customer_name, whatsapp, duration, total_price, payment_proof], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const orderId = this.lastID;
        
        // 2. Insert all items
        const itemSql = `INSERT INTO order_items (order_id, product_name, quantity, price_per_unit) VALUES (?, ?, ?, ?)`;
        const stmt = db.prepare(itemSql);
        
        parsedItems.forEach(item => {
            stmt.run([orderId, item.name, item.quantity, item.price]);
        });
        
        stmt.finalize();
        res.json({ message: 'Order PRO MAX Berhasil!', id: orderId });
    });
});

// Admin Dashboard - Get All Orders with Items
app.get('/api/admin/orders', verifyToken, (req, res) => {
    const sql = `
        SELECT o.*, 
        (SELECT GROUP_CONCAT(product_name || ' (' || quantity || ')') FROM order_items WHERE order_id = o.id) as items_summary
        FROM orders o ORDER BY created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ orders: rows });
    });
});

// Update Order Status
app.put('/api/admin/orders/:id', verifyToken, (req, res) => {
    const { status } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Status updated' });
    });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admins WHERE username = ?", [username], (err, admin) => {
        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            return res.status(401).json({ error: 'Auth Gagal' });
        }
        const token = jwt.sign({ id: admin.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token });
    });
});

app.listen(PORT, HOST, () => {
    console.log(`Server PRO MAX running on http://${HOST}:${PORT}`);
});
