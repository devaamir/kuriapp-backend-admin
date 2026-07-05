const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const ACCESS_EXPIRY = '1h';
const REFRESH_EXPIRY = '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateTokens(user) {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
    return { accessToken, refreshToken };
}

async function storeRefreshToken(userId, token) {
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO NOTHING`,
        [userId, token, expiresAt]
    );
}

// REGISTER
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ success: false, error: 'Please provide all fields' });

    try {
        const existing = await pool.query(
            `SELECT id, status FROM users WHERE email = $1`, [email]
        );

        let u;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        if (existing.rows.length > 0) {
            const user = existing.rows[0];
            if (user.status !== 'inactive')
                return res.status(400).json({ success: false, error: 'User already exists' });

            const reactivated = await pool.query(
                `UPDATE users SET name=$1, password=$2, status='active' WHERE id=$3 RETURNING id, name, email, role, unique_code, avatar`,
                [name, hashedPassword, user.id]
            );
            u = reactivated.rows[0];
        } else {
            const id = 'u_' + Date.now();
            const uniqueCode = '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

            const result = await pool.query(
                `INSERT INTO users (id, name, email, password, role, status, unique_code, avatar)
                 VALUES ($1,$2,$3,$4,'member','active',$5,$6)
                 RETURNING id, name, email, role, unique_code, avatar`,
                [id, name, email, hashedPassword, uniqueCode, avatar]
            );
            u = result.rows[0];
        }

        const { accessToken, refreshToken } = generateTokens(u);
        await storeRefreshToken(u.id, refreshToken);

        res.status(201).json({
            success: true,
            token: accessToken,
            refreshToken,
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
            `SELECT * FROM users WHERE email=$1 AND status != 'inactive'`,
            [email]
        );
        if (result.rows.length === 0)
            return res.status(401).json({ success: false, error: 'Invalid credentials' });

        const u = result.rows[0];
        const isHashed = u.password?.startsWith('$2b$') || u.password?.startsWith('$2a$');
        let valid;
        if (isHashed) {
            valid = await bcrypt.compare(password, u.password);
        } else {
            // plaintext password still in DB — check it and rehash on the fly
            valid = password === u.password;
            if (valid) {
                const hashed = await bcrypt.hash(password, SALT_ROUNDS);
                await pool.query(`UPDATE users SET password=$1 WHERE id=$2`, [hashed, u.id]);
            }
        }
        if (!valid)
            return res.status(401).json({ success: false, error: 'Invalid credentials' });

        const { accessToken, refreshToken } = generateTokens(u);
        await storeRefreshToken(u.id, refreshToken);

        res.json({
            success: true,
            token: accessToken,
            refreshToken,
            user: { id: u.id, name: u.name, email: u.email, role: u.role, uniqueCode: u.unique_code, avatar: u.avatar, status: u.status }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// REFRESH TOKEN
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ success: false, error: 'Refresh token required' });

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const stored = await pool.query(
            `SELECT * FROM refresh_tokens WHERE token=$1 AND expires_at > NOW()`,
            [refreshToken]
        );
        if (stored.rows.length === 0)
            return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });

        const userResult = await pool.query(
            `SELECT id, name, email, role, unique_code, avatar, status FROM users WHERE id=$1 AND status != 'inactive'`,
            [payload.id]
        );
        if (userResult.rows.length === 0)
            return res.status(401).json({ success: false, error: 'User not found or deactivated' });

        const u = userResult.rows[0];
        const accessToken = jwt.sign(
            { id: u.id, email: u.email, role: u.role },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_EXPIRY }
        );

        res.json({ success: true, token: accessToken });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
            return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// LOGOUT
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await pool.query(`DELETE FROM refresh_tokens WHERE token=$1`, [refreshToken]).catch(() => {});
    }
    res.json({ success: true });
});

module.exports = router;
