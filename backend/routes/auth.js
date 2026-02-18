const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// Helper to read users
const readUsers = () => {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to write users
const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// REGISTER
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide all fields' });
    }

    const users = readUsers();

    // Check if user exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const newUser = {
        id: 'u_' + Date.now(),
        name,
        email,
        password, // In production, hash this!
        role: 'member',
        status: 'active',
        uniqueCode: '#' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
    };

    users.push(newUser);
    writeUsers(users);

    // Return success with mock token
    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token: `mock-jwt-token-${newUser.id}-${Date.now()}`,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            uniqueCode: newUser.uniqueCode,
            avatar: newUser.avatar
        }
    });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.json({
        success: true,
        token: `mock-jwt-token-${user.id}-${Date.now()}`,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            uniqueCode: user.uniqueCode,
            avatar: user.avatar
        }
    });
});

module.exports = router;
