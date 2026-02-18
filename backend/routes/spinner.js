const express = require('express');
const router = express.Router();

// Store active SSE connections
let clients = [];

// SSE endpoint - clients connect here to receive live spin updates
router.get('/stream/:kuriId', (req, res) => {
    const { kuriId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    const client = { id: clientId, kuriId, res };
    clients.push(client);

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

// POST endpoint - admin sends spin data
router.post('/spin/:kuriId', (req, res) => {
    const { kuriId } = req.params;
    const { easing, speed, rotates, winner, adminId } = req.body;

    if (!easing || !speed || rotates === undefined || !winner || !adminId) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const spinData = { easing, speed, rotates, winner, adminId, timestamp: Date.now() };

    // Broadcast to all clients watching this kuri
    clients
        .filter(c => c.kuriId === kuriId)
        .forEach(c => {
            c.res.write(`data: ${JSON.stringify(spinData)}\n\n`);
        });

    res.json({ success: true, message: 'Spin broadcasted' });
});

module.exports = router;
