const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { db } = require('../firebase/admin');

const router = express.Router();

/**
 * Get user's chats
 * GET /api/chats
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const chatsSnapshot = await db.collection('chats')
            .where('participants', 'array-contains', req.user.uid)
            .orderBy('updatedAt', 'desc')
            .get();

        const chats = [];

        for (const doc of chatsSnapshot.docs) {
            const data = doc.data();
            const chat = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
            };

            // Get participant details
            if (!data.isGroup) {
                const otherUserId = data.participants.find(p => p !== req.user.uid);
                if (otherUserId) {
                    const userDoc = await db.collection('users').doc(otherUserId).get();
                    if (userDoc.exists) {
                        chat.participantDetails = [userDoc.data()];
                    }
                }
            }

            chats.push(chat);
        }

        res.json({
            success: true,
            chats,
        });
    } catch (error) {
        console.error('Error getting chats:', error);
        res.status(500).json({ error: 'Failed to get chats' });
    }
});

/**
 * Create a new chat
 * POST /api/chats
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { participants, isGroup, groupName } = req.body;

        if (!participants || !Array.isArray(participants) || participants.length < 2) {
            return res.status(400).json({ error: 'At least 2 participants required' });
        }

        // For 1-on-1 chats, check if already exists
        if (!isGroup && participants.length === 2) {
            const existingChats = await db.collection('chats')
                .where('participants', 'array-contains', participants[0])
                .where('isGroup', '==', false)
                .get();

            for (const doc of existingChats.docs) {
                const data = doc.data();
                if (data.participants.includes(participants[1])) {
                    return res.json({
                        success: true,
                        chat: { id: doc.id, ...data },
                        existing: true,
                    });
                }
            }
        }

        // Create new chat
        const chatData = {
            participants,
            isGroup: isGroup || false,
            groupName: isGroup ? groupName : null,
            groupAvatar: null,
            createdAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
            updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid,
            admins: isGroup ? [req.user.uid] : null,
        };

        const chatRef = await db.collection('chats').add(chatData);

        res.status(201).json({
            success: true,
            chat: {
                id: chatRef.id,
                ...chatData,
            },
        });
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

/**
 * Get chat messages
 * GET /api/chats/:chatId/messages
 */
router.get('/:chatId/messages', verifyToken, async (req, res) => {
    try {
        const { chatId } = req.params;
        const { limit = 50, before } = req.query;

        // Verify user is participant
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists || !chatDoc.data().participants.includes(req.user.uid)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        let query = db.collection('chats').doc(chatId).collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(parseInt(limit));

        if (before) {
            const beforeDoc = await db.collection('chats').doc(chatId)
                .collection('messages').doc(before).get();
            if (beforeDoc.exists) {
                query = query.startAfter(beforeDoc);
            }
        }

        const messagesSnapshot = await query.get();

        const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate(),
        })).reverse();

        res.json({
            success: true,
            messages,
        });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

module.exports = router;
