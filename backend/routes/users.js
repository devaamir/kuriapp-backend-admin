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

// GET all users
router.get('/', (req, res) => {
    const users = readUsers();
    // Remove passwords from response
    const safeUsers = users.map(u => {
        const { password, ...rest } = u;
        return rest;
    });
    res.json(safeUsers);
});

// CREATE user
router.post('/', (req, res) => {
    const { name, email, password, role, isDummy } = req.body;

    if (!name || !email) {
        return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const newUser = {
        id: 'u_' + Date.now(),
        name,
        email,
        password: password || '123456', // Default password if not provided
        role: role || 'member',
        status: 'active',
        lastLogin: 'Never',
        uniqueCode: '#' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        isDummy: isDummy || false
    };

    users.unshift(newUser); // Add to beginning
    writeUsers(users);

    res.status(201).json(newUser);
});

// UPDATE user
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const users = readUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    writeUsers(users);

    res.json(updatedUser);
});

// DELETE user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const users = readUsers();
    const filteredUsers = users.filter(u => u.id !== id);

    if (users.length === filteredUsers.length) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    writeUsers(filteredUsers);
    res.json({ success: true, message: 'User deleted' });
});

module.exports = router;
