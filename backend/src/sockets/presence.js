const { db } = require('../firebase/admin');

// Store presence timers for heartbeat
const presenceTimers = new Map();

/**
 * Handle presence-related socket events
 */
const setupPresenceHandlers = (io, socket, user) => {
    console.log(`Setting up presence handlers for ${user.uid}`);

    // Heartbeat to keep connection alive and update last seen
    socket.on('heartbeat', async () => {
        try {
            await db.collection('users').doc(user.uid).update({
                online: true,
                lastSeen: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
            });
        } catch (error) {
            console.error('Heartbeat error:', error);
        }
    });

    // Get online status of specific users
    socket.on('get-presence', async ({ userIds }) => {
        try {
            const onlineStatuses = {};

            for (const userId of userIds) {
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const data = userDoc.data();
                    onlineStatuses[userId] = {
                        online: data.online || false,
                        lastSeen: data.lastSeen?.toDate() || null,
                    };
                }
            }

            socket.emit('presence-update', onlineStatuses);
        } catch (error) {
            console.error('Error getting presence:', error);
        }
    });

    // Subscribe to presence changes of specific users
    socket.on('subscribe-presence', ({ userIds }) => {
        userIds.forEach((userId) => {
            socket.join(`presence:${userId}`);
        });
    });

    socket.on('unsubscribe-presence', ({ userIds }) => {
        userIds.forEach((userId) => {
            socket.leave(`presence:${userId}`);
        });
    });
};

/**
 * Broadcast presence change to subscribers
 */
const broadcastPresenceChange = (io, userId, online, lastSeen = null) => {
    io.to(`presence:${userId}`).emit('presence-change', {
        userId,
        online,
        lastSeen,
    });
};

module.exports = { setupPresenceHandlers, broadcastPresenceChange };
