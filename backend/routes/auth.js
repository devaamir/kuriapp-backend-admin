const express = require('express');
const router = express.Router();
const pool = require('../db');

// REGISTER
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ success: false, error: 'Please provide all fields' });

    try {
        // Check if active user exists
        const existing = await pool.query(
            `SELECT id, status FROM users WHERE email = $1`, [email]
        );

        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            if (user.status !== 'inactive')
                return res.status(400).json({ success: false, error: 'User already exists' });

            // Reactivate inactive user
            const reactivated = await pool.query(
                `UPDATE users SET name=$1, password=$2, status='active' WHERE id=$3 RETURNING id, name, email, role, unique_code, avatar`,
                [name, password, user.id]
            );
            const u = reactivated.rows[0];
            return res.status(201).json({
                success: true,
                token: `mock-jwt-token-${u.id}-${Date.now()}`,
                user: { id: u.id, name: u.name, email: u.email, role: u.role, uniqueCode: u.unique_code, avatar: u.avatar }
            });
        }

        const id = 'u_' + Date.now();
        const uniqueCode = '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

        const result = await pool.query(
            `INSERT INTO users (id, name, email, password, role, status, unique_code, avatar)
             VALUES ($1,$2,$3,$4,'member','active',$5,$6)
             RETURNING id, name, email, role, unique_code, avatar`,
            [id, name, email, password, uniqueCode, avatar]
        );
        const u = result.rows[0];
        res.status(201).json({
            success: true,
            token: `mock-jwt-token-${u.id}-${Date.now()}`,
            user: { id: u.id, name: u.name, email: u.email, role: u.role, uniqueCode: u.unique_code, avatar: u.avatar }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ success: false, error: 'Please provide email and password' });

    try {
        const result = await pool.query(
            `SELECT * FROM users WHERE email=$1 AND password=$2 AND status != 'inactive'`,
            [email, password]
        );
        if (result.rows.length === 0)
            return res.status(401).json({ success: false, error: 'Invalid credentials' });

        const u = result.rows[0];
        res.json({
            success: true,
            token: `mock-jwt-token-${u.id}-${Date.now()}`,
            user: { id: u.id, name: u.name, email: u.email, role: u.role, uniqueCode: u.unique_code, avatar: u.avatar, status: u.status }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
