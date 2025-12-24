require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/auth');
const chatsRoutes = require('./routes/chats');

// Socket handlers
const { setupChatHandlers, getOnlineUsers } = require('./sockets/chat');
const { setupPresenceHandlers } = require('./sockets/presence');
const { verifySocketToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        onlineUsers: getOnlineUsers().length,
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatsRoutes);

// Socket.io authentication middleware
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error('Authentication required'));
    }

    const user = await verifySocketToken(token);

    if (!user) {
        return next(new Error('Invalid token'));
    }

    socket.user = user;
    next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`User connected: ${user.uid} (${user.email})`);

    // Setup handlers
    setupChatHandlers(io, socket, user);
    setupPresenceHandlers(io, socket, user);

    // Send current online users list
    socket.emit('online-users', getOnlineUsers());
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║         Chatterly Backend Server          ║
╠═══════════════════════════════════════════╣
║  Status: Running                          ║
║  Port: ${PORT}                               ║
║  Socket.io: Enabled                       ║
╚═══════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
