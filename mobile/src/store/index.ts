import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './authSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for serialization check (dates)
                ignoredActions: ['chat/setMessages', 'chat/addMessage'],
                ignoredPaths: ['chat.messages', 'chat.chats'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
