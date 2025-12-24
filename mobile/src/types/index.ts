// User type
export interface User {
    uid: string;
    name: string;
    email: string;
    photoURL: string | null;
    online: boolean;
    lastSeen?: Date;
    pushToken?: string;
}

// Chat types
export interface Chat {
    id: string;
    participants: string[];
    participantDetails?: User[];
    isGroup: boolean;
    groupName?: string;
    groupAvatar?: string;
    lastMessage?: Message;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    admins?: string[];
    muted?: boolean;
}

// Message types
export type MessageType = 'text' | 'image' | 'system';

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    senderName?: string;
    type: MessageType;
    content: string;
    imageUrl?: string;
    timestamp: Date;
    readBy?: string[];
    reactions?: { [emoji: string]: string[] };
    edited?: boolean;
    deleted?: boolean;
}

// Socket event types
export interface SocketEvents {
    'join-chat': { chatId: string };
    'leave-chat': { chatId: string };
    'send-message': { chatId: string; type: MessageType; content: string; imageUrl?: string };
    'typing': { chatId: string };
    'stop-typing': { chatId: string };
    'new-message': Message;
    'user-typing': { chatId: string; userId: string; userName: string };
    'user-stopped-typing': { chatId: string; userId: string };
    'user-online': { userId: string };
    'user-offline': { userId: string; lastSeen: Date };
    'message-read': { chatId: string; messageId: string; userId: string };
}

// Auth state
export interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
}

// Chat state
export interface ChatState {
    chats: Chat[];
    activeChat: Chat | null;
    messages: { [chatId: string]: Message[] };
    loading: boolean;
    error: string | null;
    typingUsers: { [chatId: string]: string[] };
    onlineUsers: string[];
}
