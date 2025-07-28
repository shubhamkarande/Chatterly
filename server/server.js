const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*", // Configure this properly for production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store online users and their socket IDs
const onlineUsers = new Map();
const userSockets = new Map();

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const { userId, token } = socket.handshake.auth;
  
  if (!userId) {
    return next(new Error('Authentication error'));
  }
  
  // In production, verify the token with Firebase Admin SDK
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`);
  
  // Add user to online users
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    lastSeen: new Date(),
  });
  userSockets.set(socket.id, socket.userId);
  
  // Broadcast user online status
  socket.broadcast.emit('user_online', socket.userId);
  
  // Send current online users to the newly connected user
  socket.emit('online_users', Array.from(onlineUsers.keys()));

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Handle joining chat rooms
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Handle leaving chat rooms
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    const { chatId, message } = data;
    
    // Add timestamp and sender info
    const messageWithMetadata = {
      ...message,
      id: Date.now().toString(),
      createdAt: new Date(),
      user: {
        ...message.user,
        _id: socket.userId,
      },
    };

    // Broadcast message to all users in the chat room
    socket.to(`chat_${chatId}`).emit('new_message', {
      ...messageWithMetadata,
      chatId,
    });

    console.log(`Message sent in chat ${chatId} by user ${socket.userId}`);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_typing', {
      userId: socket.userId,
      userName: 'User', // Get from user data
      chatId,
    });
  });

  socket.on('stop_typing', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user_stop_typing', {
      userId: socket.userId,
      chatId,
    });
  });

  // Handle presence updates
  socket.on('update_presence', (data) => {
    const { isOnline } = data;
    
    if (isOnline) {
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        lastSeen: new Date(),
      });
      socket.broadcast.emit('user_online', socket.userId);
    } else {
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit('user_offline', socket.userId);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Remove user from online users
    onlineUsers.delete(socket.userId);
    userSockets.delete(socket.id);
    
    // Broadcast user offline status
    socket.broadcast.emit('user_offline', socket.userId);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    onlineUsers: onlineUsers.size 
  });
});

// Get online users endpoint
app.get('/online-users', (req, res) => {
  res.json({
    count: onlineUsers.size,
    users: Array.from(onlineUsers.keys())
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Chatterly Socket.io server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});