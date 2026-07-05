const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all users
router.get('/', async (req, res) => {
    const { includeInactive } = req.query;
    try {
        const query = includeInactive === 'true'
            ? `SELECT id, name, email, role, status, unique_code, avatar, is_dummy, last_login FROM users WHERE role != 'admin' ORDER BY created_at DESC`
            : `SELECT id, name, email, role, status, unique_code, avatar, is_dummy, last_login FROM users WHERE role != 'admin' AND status != 'inactive' ORDER BY created_at DESC`;
        const result = await pool.query(query);
        res.json(result.rows.map(u => ({ ...u, uniqueCode: u.unique_code, isDummy: u.is_dummy })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// CREATE user
router.post('/', async (req, res) => {
    const { name, email, password, role, isDummy } = req.body;
    if (!name || !email)
        return res.status(400).json({ success: false, error: 'Name and email are required' });

    try {
        const existing = await pool.query(`SELECT id FROM users WHERE email=$1`, [email]);
        if (existing.rows.length > 0)
            return res.status(400).json({ success: false, error: 'User already exists' });

        const id = 'u_' + Date.now();
        const uniqueCode = '#' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

        const result = await pool.query(
            `INSERT INTO users (id, name, email, password, role, status, unique_code, avatar, is_dummy, last_login)
             VALUES ($1,$2,$3,$4,$5,'active',$6,$7,$8,'Never')
             RETURNING *`,
            [id, name, email, password || '123456', role || 'member', uniqueCode, avatar, isDummy || false]
        );
        const u = result.rows[0];
        res.status(201).json({ ...u, uniqueCode: u.unique_code, isDummy: u.is_dummy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// UPDATE user
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users SET
               name = COALESCE($1, name),
               email = COALESCE($2, email),
               password = COALESCE($3, password),
               role = COALESCE($4, role),
               status = COALESCE($5, status)
             WHERE id = $6 RETURNING *`,
            [name, email, password, role, status, id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, error: 'User not found' });
        const u = result.rows[0];
        res.json({ ...u, uniqueCode: u.unique_code, isDummy: u.is_dummy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// DELETE user (soft delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const userCheck = await pool.query(`SELECT id FROM users WHERE id=$1`, [id]);
        if (userCheck.rows.length === 0)
            return res.status(404).json({ success: false, error: 'User not found' });

        // Check active kuris
        const kuriCheck = await pool.query(
            `SELECT id, name, status FROM kuris WHERE (status='active' OR status='pending') AND (member_ids @> $1 OR admin_id=$2)`,
            [JSON.stringify([id]), id]
        );
        if (kuriCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'You are an active Kuri member. Please contact the administrator to proceed.',
                activeKuris: kuriCheck.rows
            });
        }

        await pool.query(
            `UPDATE users SET status='inactive', deactivated_at=$1 WHERE id=$2`,
            [new Date().toISOString(), id]
        );
        res.json({ success: true, message: 'Account deactivated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
