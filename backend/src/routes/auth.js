const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../firebase/admin');

const router = express.Router();

/**
 * Verify Firebase token
 * POST /api/auth/verify
 */
router.post('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: userDoc.data(),
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

/**
 * Update push token
 * POST /api/auth/push-token
 */
router.post('/push-token', verifyToken, async (req, res) => {
    try {
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ error: 'Push token required' });
        }

        await db.collection('users').doc(req.user.uid).update({
            pushToken,
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating push token:', error);
        res.status(500).json({ error: 'Failed to update push token' });
    }
});

module.exports = router;
