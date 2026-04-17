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
    const { includeInactive } = req.query;
    const users = readUsers();
    
    // Filter out inactive users unless explicitly requested
    const filteredUsers = includeInactive === 'true' 
        ? users 
        : users.filter(u => u.status !== 'inactive');
    
    // Remove passwords from response
    const safeUsers = filteredUsers.map(u => {
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

// Helper to read kuris
const readKuris = () => {
    try {
        const KURIS_FILE = path.join(__dirname, '../data/kuris.json');
        const data = fs.readFileSync(KURIS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// DELETE user (soft delete)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user is part of any active Kuri
    const kuris = readKuris();
    const activeKuris = kuris.filter(k => 
        (k.status === 'active' || k.status === 'pending') && 
        (k.memberIds?.includes(id) || k.adminId === id)
    );

    if (activeKuris.length > 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'You are an active Kuri member. Please contact the administrator to proceed.',
            activeKuris: activeKuris.map(k => ({ id: k.id, name: k.name, status: k.status }))
        });
    }

    // Soft delete: Update status to inactive
    users[userIndex].status = 'inactive';
    users[userIndex].deactivatedAt = new Date().toISOString();
    writeUsers(users);

    res.json({ 
        success: true, 
        message: 'Account deactivated successfully' 
    });
});

module.exports = router;
