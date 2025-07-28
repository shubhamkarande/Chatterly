import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import {
    addMessage,
    addTypingUser,
    removeTypingUser
} from '../store/slices/chatSlice';
import {
    addOnlineUser,
    removeOnlineUser,
    setConnectionStatus,
    setOnlineUsers,
    setSocket
} from '../store/slices/socketSlice';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl = 'wss://your-socket-server.com'; // Replace with your server URL

  connect(userId: string, token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      auth: {
        userId,
        token,
      },
      transports: ['websocket'],
    });

    store.dispatch(setSocket(this.socket));

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      store.dispatch(setSocket(null));
      store.dispatch(setConnectionStatus(false));
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      store.dispatch(setConnectionStatus(true));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      store.dispatch(setConnectionStatus(false));
    });

    // Message events
    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage({
        chatId: message.chatId,
        message: {
          ...message,
          createdAt: new Date(message.createdAt),
        },
      }));
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      store.dispatch(addTypingUser({
        userId: data.userId,
        userName: data.userName,
        chatId: data.chatId,
      }));
    });

    this.socket.on('user_stop_typing', (data) => {
      store.dispatch(removeTypingUser({
        userId: data.userId,
        chatId: data.chatId,
      }));
    });

    // Presence events
    this.socket.on('user_online', (userId) => {
      store.dispatch(addOnlineUser(userId));
    });

    this.socket.on('user_offline', (userId) => {
      store.dispatch(removeOnlineUser(userId));
    });

    this.socket.on('online_users', (users) => {
      store.dispatch(setOnlineUsers(users));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  // Message methods
  sendMessage(chatId: string, message: any) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { chatId, message });
    }
  }

  joinChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Typing methods
  startTyping(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing', { chatId });
    }
  }

  stopTyping(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { chatId });
    }
  }

  // Presence methods
  updatePresence(isOnline: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('update_presence', { isOnline });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
export default socketService;