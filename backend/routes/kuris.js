const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const KURIS_FILE = path.join(__dirname, '../data/kuris.json');

// Helper to read kuris
const readKuris = () => {
    try {
        const data = fs.readFileSync(KURIS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to write kuris
const writeKuris = (kuris) => {
    fs.writeFileSync(KURIS_FILE, JSON.stringify(kuris, null, 2));
};

// GET all kuris (with optional filtering)
router.get('/', (req, res) => {
    const { userId } = req.query;
    const kuris = readKuris();

    if (userId) {
        // Filter: User is Admin OR Member
        const filtered = kuris.filter(k =>
            k.adminId === userId ||
            (k.memberIds && k.memberIds.includes(userId)) ||
            k.createdBy === userId
        );
        return res.json(filtered);
    }

    res.json(kuris);
});

// Helper to read users
const readUsers = () => {
    try {
        const USERS_FILE = path.join(__dirname, '../data/users.json');
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// GET single kuri
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const kuris = readKuris();
    const kuri = kuris.find(k => k.id === id);

    if (!kuri) {
        return res.status(404).json({ success: false, error: 'Kuri not found' });
    }

    // Populate members - include both real users and dummy placeholders
    const users = readUsers();
    const members = (kuri.memberIds || []).map(memberId => {
        const user = users.find(u => u.id === memberId);
        if (user) {
            // Return safe user object (exclude password if it exists)
            const { password, ...safeUser } = user;
            return safeUser;
        }
        // Create placeholder for members without accounts
        return {
            id: memberId,
            name: `Member ${memberId.substring(0, 8)}`,
            email: `placeholder_${memberId}@dummy.local`,
            role: 'member',
            status: 'inactive',
            lastLogin: 'Never',
            avatar: `https://ui-avatars.com/api/?name=Placeholder&background=94a3b8&color=fff`,
            uniqueCode: '#PENDING',
            isDummy: true
        };
    });

    res.json({ ...kuri, members });
});

// CREATE kuri
router.post('/', authenticate, (req, res) => {
    const { name, monthlyAmount, description, duration, startDate, memberIds, status, type, kuriTakenDate } = req.body;

    if (!name || !monthlyAmount) {
        return res.status(400).json({ success: false, error: 'Name and monthly amount are required' });
    }

    const kuris = readKuris();
    const creatorId = req.user.id;

    const newKuri = {
        id: 'k_' + Date.now(),
        name,
        monthlyAmount: Number(monthlyAmount),
        description: description || '',
        duration: duration || '',
        startDate: startDate || '',
        kuriTakenDate: kuriTakenDate || '',
        adminId: creatorId,
        memberIds: memberIds || [creatorId],
        status: status || 'pending',
        type: type || 'new',
        createdBy: creatorId
    };

    kuris.unshift(newKuri);
    writeKuris(kuris);

    res.status(201).json(newKuri);
});

// UPDATE kuri
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const kuris = readKuris();
    const index = kuris.findIndex(k => k.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Kuri not found' });
    }

    const updatedKuri = { ...kuris[index], ...updates };
    kuris[index] = updatedKuri;
    writeKuris(kuris);

    res.json(updatedKuri);
});

// DELETE kuri
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const kuris = readKuris();
    const filteredKuris = kuris.filter(k => k.id !== id);

    if (kuris.length === filteredKuris.length) {
        return res.status(404).json({ success: false, error: 'Kuri not found' });
    }

    writeKuris(filteredKuris);
    res.json({ success: true, message: 'Kuri deleted' });
});

module.exports = router;
