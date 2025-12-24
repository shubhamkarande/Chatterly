import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { store } from '../store';
import { addMessage, setTypingUser, addOnlineUser, removeOnlineUser, updateChat } from '../store/chatSlice';
import { Message, SocketEvents } from '../types';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3001';

class SocketService {
    private socket: Socket | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(token: string) {
        if (this.socket?.connected) {
            return;
        }

        this.token = token;

        this.socket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
        });

        this.setupListeners();
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            this.reconnectAttempts++;
        });

        // Message events
        this.socket.on('new-message', (message: Message) => {
            const formattedMessage = {
                ...message,
                timestamp: new Date(message.timestamp),
            };
            store.dispatch(addMessage(formattedMessage));

            // Update chat's last message
            store.dispatch(updateChat({
                id: message.chatId,
                lastMessage: formattedMessage,
                updatedAt: new Date(),
            }));
        });

        // Typing events
        this.socket.on('user-typing', ({ chatId, userId }: { chatId: string; userId: string }) => {
            store.dispatch(setTypingUser({ chatId, userId, isTyping: true }));
        });

        this.socket.on('user-stopped-typing', ({ chatId, userId }: { chatId: string; userId: string }) => {
            store.dispatch(setTypingUser({ chatId, userId, isTyping: false }));
        });

        // Presence events
        this.socket.on('user-online', ({ userId }: { userId: string }) => {
            store.dispatch(addOnlineUser(userId));
        });

        this.socket.on('user-offline', ({ userId }: { userId: string }) => {
            store.dispatch(removeOnlineUser(userId));
        });

        // Read receipts
        this.socket.on('message-read', ({ chatId, messageId, userId }: { chatId: string; messageId: string; userId: string }) => {
            // Handle read receipt update
            console.log(`Message ${messageId} read by ${userId}`);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.token = null;
    }

    // Chat room events
    joinChat(chatId: string) {
        if (this.socket?.connected) {
            this.socket.emit('join-chat', { chatId });
        }
    }

    leaveChat(chatId: string) {
        if (this.socket?.connected) {
            this.socket.emit('leave-chat', { chatId });
        }
    }

    // Message events
    sendMessage(chatId: string, type: 'text' | 'image', content: string, imageUrl?: string) {
        if (this.socket?.connected) {
            this.socket.emit('send-message', { chatId, type, content, imageUrl });
        }
    }

    // Typing events
    sendTyping(chatId: string) {
        if (this.socket?.connected) {
            this.socket.emit('typing', { chatId });
        }
    }

    stopTyping(chatId: string) {
        if (this.socket?.connected) {
            this.socket.emit('stop-typing', { chatId });
        }
    }

    // Mark message as read
    markAsRead(chatId: string, messageId: string) {
        if (this.socket?.connected) {
            this.socket.emit('mark-read', { chatId, messageId });
        }
    }

    // Check connection status
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    // Get socket instance
    getSocket(): Socket | null {
        return this.socket;
    }
}

export const socketService = new SocketService();
export default socketService;
