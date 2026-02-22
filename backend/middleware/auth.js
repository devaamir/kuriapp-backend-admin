const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');

const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const authenticate = (req, res, next) => {
    console.log('Auth headers:', req.headers.authorization);
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        console.log('No token found in headers');
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Extract userId from mock token (format: mock-jwt-token-{userId}-{timestamp})
    const userId = token.split('-')[3];
    
    const users = readUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.user = user;
    next();
};

module.exports = { authenticate };
