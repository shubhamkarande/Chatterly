import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  text: string;
  createdAt: Date; // Keep as Date for GiftedChat compatibility
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  avatar?: string;
  createdAt: Date; // Keep as Date for now, but we'll be careful with serialization
  updatedAt: Date;
}

export interface TypingUser {
  userId: string;
  userName: string;
  chatId: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  typingUsers: TypingUser[];
  isLoading: boolean;
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: {},
  typingUsers: [],
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const index = state.chats.findIndex(chat => chat.id === action.payload.id);
      if (index !== -1) {
        state.chats[index] = action.payload;
      }
    },
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
      state.messages[action.payload.chatId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<{ chatId: string; message: Message }>) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(message);
      
      // Update last message in chat
      const chatIndex = state.chats.findIndex(chat => chat.id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = message;
        state.chats[chatIndex].updatedAt = message.createdAt;
      }
    },
    updateMessage: (state, action: PayloadAction<{ chatId: string; messageId: string; updates: Partial<Message> }>) => {
      const { chatId, messageId, updates } = action.payload;
      const messages = state.messages[chatId];
      if (messages) {
        const messageIndex = messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.messages[chatId][messageIndex] = { ...messages[messageIndex], ...updates };
        }
      }
    },
    setTypingUsers: (state, action: PayloadAction<TypingUser[]>) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action: PayloadAction<TypingUser>) => {
      const exists = state.typingUsers.find(
        user => user.userId === action.payload.userId && user.chatId === action.payload.chatId
      );
      if (!exists) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ userId: string; chatId: string }>) => {
      state.typingUsers = state.typingUsers.filter(
        user => !(user.userId === action.payload.userId && user.chatId === action.payload.chatId)
      );
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const chatIndex = state.chats.findIndex(chat => chat.id === action.payload);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount += 1;
      }
    },
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const chatIndex = state.chats.findIndex(chat => chat.id === action.payload);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setChats,
  addChat,
  updateChat,
  setCurrentChat,
  setMessages,
  addMessage,
  updateMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  incrementUnreadCount,
  resetUnreadCount,
  setLoading,
} = chatSlice.actions;

export default chatSlice.reducer;