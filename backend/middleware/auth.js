require('dotenv').config();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token)
        return res.status(401).json({ success: false, error: 'No token provided' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT id, name, email, role, unique_code, avatar, status FROM users WHERE id=$1`,
            [payload.id]
        );

        if (result.rows.length === 0)
            return res.status(401).json({ success: false, error: 'Invalid token' });

        const user = result.rows[0];
        if (user.status === 'inactive')
            return res.status(403).json({ success: false, error: 'Account has been deactivated' });

        req.user = { ...user, uniqueCode: user.unique_code };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError')
            return res.status(401).json({ success: false, error: 'Token expired' });
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};

module.exports = { authenticate };
