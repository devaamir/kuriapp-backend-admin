const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const toKuri = (row) => ({
    id: row.id,
    name: row.name,
    monthlyAmount: Number(row.monthly_amount),
    description: row.description,
    duration: row.duration,
    startDate: row.start_date,
    kuriTakenDate: row.kuri_taken_date,
    adminId: row.admin_id,
    memberIds: row.member_ids,
    status: row.status,
    type: row.type,
    createdBy: row.created_by,
    winners: row.winners,
    payments: row.payments,
    nominations: row.nominations,
});

// GET all kuris
router.get('/', async (req, res) => {
    const { userId } = req.query;
    try {
        let result;
        if (userId) {
            result = await pool.query(
                `SELECT * FROM kuris WHERE admin_id=$1 OR created_by=$1 OR member_ids @> $2 ORDER BY created_at DESC`,
                [userId, JSON.stringify([userId])]
            );
        } else {
            result = await pool.query(`SELECT * FROM kuris ORDER BY created_at DESC`);
        }
        res.json(result.rows.map(toKuri));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// GET single kuri
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM kuris WHERE id=$1`, [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, error: 'Kuri not found' });

        const kuri = toKuri(result.rows[0]);

        // Populate members
        const memberIds = kuri.memberIds || [];
        let members = [];
        if (memberIds.length > 0) {
            const usersResult = await pool.query(
                `SELECT id, name, email, role, status, unique_code, avatar, is_dummy FROM users WHERE id = ANY($1)`,
                [memberIds]
            );
            const userMap = Object.fromEntries(usersResult.rows.map(u => [u.id, u]));
            members = memberIds.map(mid => {
                const u = userMap[mid];
                if (u) return { ...u, uniqueCode: u.unique_code, isDummy: u.is_dummy };
                return { id: mid, name: `Member ${mid.substring(0, 8)}`, role: 'member', status: 'inactive', uniqueCode: '#PENDING', avatar: 'https://ui-avatars.com/api/?name=Placeholder&background=94a3b8&color=fff', isDummy: true };
            });
        }

        res.json({ ...kuri, members });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// CREATE kuri
router.post('/', authenticate, async (req, res) => {
    const { name, monthlyAmount, description, duration, startDate, memberIds, status, type, kuriTakenDate } = req.body;
    if (!name || !monthlyAmount)
        return res.status(400).json({ success: false, error: 'Name and monthly amount are required' });

    try {
        const id = 'k_' + Date.now();
        const creatorId = req.user.id;
        const members = memberIds || [creatorId];

        const result = await pool.query(
            `INSERT INTO kuris (id, name, monthly_amount, description, duration, start_date, kuri_taken_date, admin_id, member_ids, status, type, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
            [id, name, Number(monthlyAmount), description || '', duration || '', startDate || '', kuriTakenDate || '',
             creatorId, JSON.stringify(members), status || 'pending', type || 'new', creatorId]
        );
        res.status(201).json(toKuri(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// UPDATE kuri
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const existing = await pool.query(`SELECT * FROM kuris WHERE id=$1`, [id]);
        if (existing.rows.length === 0)
            return res.status(404).json({ success: false, error: 'Kuri not found' });

        const current = existing.rows[0];
        const b = req.body;

        const result = await pool.query(
            `UPDATE kuris SET
               name = $1, monthly_amount = $2, description = $3, duration = $4,
               start_date = $5, kuri_taken_date = $6, admin_id = $7, member_ids = $8,
               status = $9, type = $10, winners = $11, payments = $12, nominations = $13
             WHERE id = $14 RETURNING *`,
            [
                b.name ?? current.name,
                b.monthlyAmount ?? current.monthly_amount,
                b.description ?? current.description,
                b.duration ?? current.duration,
                b.startDate ?? current.start_date,
                b.kuriTakenDate ?? current.kuri_taken_date,
                b.adminId ?? current.admin_id,
                JSON.stringify(b.memberIds ?? current.member_ids),
                b.status ?? current.status,
                b.type ?? current.type,
                JSON.stringify(b.winners ?? current.winners),
                JSON.stringify(b.payments ?? current.payments),
                JSON.stringify(b.nominations ?? current.nominations),
                id
            ]
        );
        res.json(toKuri(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// DELETE kuri
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(`DELETE FROM kuris WHERE id=$1 RETURNING id`, [req.params.id]);
        if (result.rows.length === 0)
            return res.status(404).json({ success: false, error: 'Kuri not found' });
        res.json({ success: true, message: 'Kuri deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
