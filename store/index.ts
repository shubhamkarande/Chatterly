import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import chatSlice from './slices/chatSlice';
import socketSlice from './slices/socketSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    chat: chatSlice,
    socket: socketSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/setSocket', 'auth/setUser', 'chat/setChats', 'chat/addMessage', 'chat/setMessages'],
        ignoredPaths: [
          'socket.instance',
          'auth.user.lastSeen',
          'chat.chats',
          'chat.messages',
          'chat.currentChat'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;