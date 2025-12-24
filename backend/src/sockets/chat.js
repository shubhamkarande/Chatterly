const { db } = require('../firebase/admin');
const { Expo } = require('expo-server-sdk');

// Initialize Expo SDK for push notifications
const expo = new Expo();

// Store active users and their sockets
const activeUsers = new Map(); // Map<userId, Set<socketId>>
const socketToUser = new Map(); // Map<socketId, userId>

/**
 * Handle chat-related socket events
 */
const setupChatHandlers = (io, socket, user) => {
    console.log(`User ${user.uid} connected to chat handlers`);

    // Track user connection
    if (!activeUsers.has(user.uid)) {
        activeUsers.set(user.uid, new Set());
    }
    activeUsers.get(user.uid).add(socket.id);
    socketToUser.set(socket.id, user.uid);

    // Update user online status
    updateUserOnlineStatus(user.uid, true);

    // Join a chat room
    socket.on('join-chat', async ({ chatId }) => {
        try {
            // Verify user is participant of this chat
            const chatDoc = await db.collection('chats').doc(chatId).get();
            if (!chatDoc.exists) {
                socket.emit('error', { message: 'Chat not found' });
                return;
            }

            const chatData = chatDoc.data();
            if (!chatData.participants.includes(user.uid)) {
                socket.emit('error', { message: 'Not authorized to join this chat' });
                return;
            }

            socket.join(chatId);
            console.log(`User ${user.uid} joined chat ${chatId}`);
        } catch (error) {
            console.error('Error joining chat:', error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });

    // Leave a chat room
    socket.on('leave-chat', ({ chatId }) => {
        socket.leave(chatId);
        console.log(`User ${user.uid} left chat ${chatId}`);
    });

    // Send a message
    socket.on('send-message', async ({ chatId, type, content, imageUrl }) => {
        try {
            // Verify user is participant
            const chatDoc = await db.collection('chats').doc(chatId).get();
            if (!chatDoc.exists || !chatDoc.data().participants.includes(user.uid)) {
                socket.emit('error', { message: 'Not authorized' });
                return;
            }

            // Get user info
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.data();

            // Create message
            const messageData = {
                chatId,
                senderId: user.uid,
                senderName: userData?.name || user.name || 'Unknown',
                type,
                content,
                imageUrl: imageUrl || null,
                timestamp: new Date(),
                readBy: [user.uid],
                reactions: {},
                edited: false,
                deleted: false,
            };

            // Save to Firestore
            const messageRef = await db.collection('chats').doc(chatId).collection('messages').add({
                ...messageData,
                timestamp: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
            });

            // Update chat's last message
            await db.collection('chats').doc(chatId).update({
                lastMessage: {
                    id: messageRef.id,
                    senderId: user.uid,
                    senderName: userData?.name || user.name,
                    type,
                    content: type === 'image' ? '📷 Photo' : content,
                    timestamp: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
                },
                updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
            });

            // Broadcast to all participants in the room
            const fullMessage = {
                id: messageRef.id,
                ...messageData,
            };

            io.to(chatId).emit('new-message', fullMessage);

            // Send push notifications to offline participants
            await sendPushNotifications(chatId, user.uid, userData?.name || 'Someone', content, type);

            console.log(`Message sent in chat ${chatId} by ${user.uid}`);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('typing', ({ chatId }) => {
        socket.to(chatId).emit('user-typing', { chatId, userId: user.uid, userName: user.name });
    });

    socket.on('stop-typing', ({ chatId }) => {
        socket.to(chatId).emit('user-stopped-typing', { chatId, userId: user.uid });
    });

    // Mark message as read
    socket.on('mark-read', async ({ chatId, messageId }) => {
        try {
            const messageRef = db.collection('chats').doc(chatId).collection('messages').doc(messageId);
            await messageRef.update({
                readBy: require('firebase-admin').firestore.FieldValue.arrayUnion(user.uid),
            });

            io.to(chatId).emit('message-read', { chatId, messageId, userId: user.uid });
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User ${user.uid} disconnected`);

        // Remove socket from user's active connections
        if (activeUsers.has(user.uid)) {
            activeUsers.get(user.uid).delete(socket.id);

            // If no more active connections, mark user as offline
            if (activeUsers.get(user.uid).size === 0) {
                activeUsers.delete(user.uid);
                updateUserOnlineStatus(user.uid, false);

                // Broadcast offline status
                io.emit('user-offline', { userId: user.uid, lastSeen: new Date() });
            }
        }

        socketToUser.delete(socket.id);
    });

    // Broadcast online status to all users
    io.emit('user-online', { userId: user.uid });
};

/**
 * Update user online status in Firestore
 */
async function updateUserOnlineStatus(userId, online) {
    try {
        const updateData = { online };
        if (!online) {
            updateData.lastSeen = require('firebase-admin').firestore.FieldValue.serverTimestamp();
        }
        await db.collection('users').doc(userId).update(updateData);
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

/**
 * Send push notifications to offline chat participants
 */
async function sendPushNotifications(chatId, senderId, senderName, content, type) {
    try {
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) return;

        const participants = chatDoc.data().participants;
        const messages = [];

        for (const participantId of participants) {
            // Skip sender and online users
            if (participantId === senderId || activeUsers.has(participantId)) {
                continue;
            }

            // Get user's push token
            const userDoc = await db.collection('users').doc(participantId).get();
            const pushToken = userDoc.data()?.pushToken;

            if (pushToken && Expo.isExpoPushToken(pushToken)) {
                messages.push({
                    to: pushToken,
                    sound: 'default',
                    title: senderName,
                    body: type === 'image' ? '📷 Sent a photo' : content,
                    data: { chatId },
                });
            }
        }

        if (messages.length > 0) {
            const chunks = expo.chunkPushNotifications(messages);
            for (const chunk of chunks) {
                try {
                    await expo.sendPushNotificationsAsync(chunk);
                } catch (error) {
                    console.error('Error sending push notifications:', error);
                }
            }
        }
    } catch (error) {
        console.error('Error in sendPushNotifications:', error);
    }
}

/**
 * Get online users list
 */
const getOnlineUsers = () => Array.from(activeUsers.keys());

module.exports = { setupChatHandlers, getOnlineUsers };
