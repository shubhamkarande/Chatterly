import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    db,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc
} from '../services/firebase';
import { ChatState, Chat, Message, User } from '../types';

const initialState: ChatState = {
    chats: [],
    activeChat: null,
    messages: {},
    loading: false,
    error: null,
    typingUsers: {},
    onlineUsers: [],
};

// Async thunks
export const fetchChats = createAsyncThunk(
    'chat/fetchChats',
    async (userId: string, { rejectWithValue }) => {
        try {
            const chatsRef = collection(db, 'chats');
            const q = query(
                chatsRef,
                where('participants', 'array-contains', userId),
                orderBy('updatedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const chats: Chat[] = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const chat: Chat = {
                    id: docSnap.id,
                    participants: data.participants,
                    isGroup: data.isGroup || false,
                    groupName: data.groupName,
                    groupAvatar: data.groupAvatar,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    createdBy: data.createdBy,
                    admins: data.admins,
                };

                // Get last message
                if (data.lastMessage) {
                    chat.lastMessage = {
                        ...data.lastMessage,
                        timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                    };
                }

                // Get participant details
                const participantDetails: User[] = [];
                for (const pid of data.participants) {
                    if (pid !== userId) {
                        const userDoc = await getDoc(doc(db, 'users', pid));
                        if (userDoc.exists()) {
                            participantDetails.push(userDoc.data() as User);
                        }
                    }
                }
                chat.participantDetails = participantDetails;

                chats.push(chat);
            }

            return chats;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch chats');
        }
    }
);

export const createChat = createAsyncThunk(
    'chat/createChat',
    async ({
        participants,
        isGroup = false,
        groupName,
        createdBy
    }: {
        participants: string[];
        isGroup?: boolean;
        groupName?: string;
        createdBy: string;
    }, { rejectWithValue }) => {
        try {
            // For 1-on-1 chats, check if chat already exists
            if (!isGroup && participants.length === 2) {
                const chatsRef = collection(db, 'chats');
                const q = query(
                    chatsRef,
                    where('participants', 'array-contains', participants[0])
                );
                const snapshot = await getDocs(q);

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    if (!data.isGroup &&
                        data.participants.length === 2 &&
                        data.participants.includes(participants[1])) {
                        // Chat already exists
                        return { id: docSnap.id, ...data } as Chat;
                    }
                }
            }

            // Create new chat
            const chatData = {
                participants,
                isGroup,
                groupName: groupName || null,
                groupAvatar: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy,
                admins: isGroup ? [createdBy] : null,
            };

            const docRef = await addDoc(collection(db, 'chats'), chatData);

            return {
                id: docRef.id,
                ...chatData,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as Chat;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create chat');
        }
    }
);

export const sendMessage = createAsyncThunk(
    'chat/sendMessage',
    async ({
        chatId,
        senderId,
        senderName,
        type,
        content,
        imageUrl
    }: {
        chatId: string;
        senderId: string;
        senderName: string;
        type: 'text' | 'image';
        content: string;
        imageUrl?: string;
    }, { rejectWithValue }) => {
        try {
            const messageData = {
                chatId,
                senderId,
                senderName,
                type,
                content,
                imageUrl: imageUrl || null,
                timestamp: serverTimestamp(),
                readBy: [senderId],
                reactions: {},
                edited: false,
                deleted: false,
            };

            // Add message to messages subcollection
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const docRef = await addDoc(messagesRef, messageData);

            // Update last message in chat
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: {
                    id: docRef.id,
                    senderId,
                    senderName,
                    type,
                    content: type === 'image' ? '📷 Photo' : content,
                    timestamp: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            });

            return {
                id: docRef.id,
                ...messageData,
                timestamp: new Date(),
            } as Message;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to send message');
        }
    }
);

// Add reaction to a message
export const addReaction = createAsyncThunk(
    'chat/addReaction',
    async ({
        chatId,
        messageId,
        emoji,
        userId
    }: {
        chatId: string;
        messageId: string;
        emoji: string;
        userId: string;
    }, { rejectWithValue }) => {
        try {
            const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            const reactions = messageDoc.data().reactions || {};

            // Toggle reaction
            if (reactions[emoji]?.includes(userId)) {
                // Remove reaction
                reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
                if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                }
            } else {
                // Add reaction
                if (!reactions[emoji]) {
                    reactions[emoji] = [];
                }
                reactions[emoji].push(userId);
            }

            await updateDoc(messageRef, { reactions });

            return { chatId, messageId, reactions };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to add reaction');
        }
    }
);

// Edit a message
export const editMessage = createAsyncThunk(
    'chat/editMessage',
    async ({
        chatId,
        messageId,
        newContent,
        userId
    }: {
        chatId: string;
        messageId: string;
        newContent: string;
        userId: string;
    }, { rejectWithValue }) => {
        try {
            const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            if (messageDoc.data().senderId !== userId) {
                throw new Error('Not authorized to edit this message');
            }

            await updateDoc(messageRef, {
                content: newContent,
                edited: true,
            });

            return { chatId, messageId, content: newContent, edited: true };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to edit message');
        }
    }
);

// Delete a message
export const deleteMessage = createAsyncThunk(
    'chat/deleteMessage',
    async ({
        chatId,
        messageId,
        userId
    }: {
        chatId: string;
        messageId: string;
        userId: string;
    }, { rejectWithValue }) => {
        try {
            const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);

            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            if (messageDoc.data().senderId !== userId) {
                throw new Error('Not authorized to delete this message');
            }

            await updateDoc(messageRef, {
                content: 'This message was deleted',
                deleted: true,
                imageUrl: null,
            });

            return { chatId, messageId, deleted: true };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete message');
        }
    }
);

// Mute/unmute a chat
export const toggleMuteChat = createAsyncThunk(
    'chat/toggleMuteChat',
    async ({
        chatId,
        userId,
        muted
    }: {
        chatId: string;
        userId: string;
        muted: boolean;
    }, { rejectWithValue }) => {
        try {
            // Store mute preference per user in a subcollection
            const muteRef = doc(db, 'chats', chatId, 'userPrefs', userId);
            await setDoc(muteRef, { muted }, { merge: true });

            return { chatId, muted };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to toggle mute');
        }
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setChats: (state, action: PayloadAction<Chat[]>) => {
            state.chats = action.payload;
        },
        setActiveChat: (state, action: PayloadAction<Chat | null>) => {
            state.activeChat = action.payload;
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            const { chatId } = action.payload;
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            // Check if message already exists
            const exists = state.messages[chatId].some(m => m.id === action.payload.id);
            if (!exists) {
                state.messages[chatId].push(action.payload);
                // Sort by timestamp
                state.messages[chatId].sort((a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
            }
        },
        setMessages: (state, action: PayloadAction<{ chatId: string; messages: Message[] }>) => {
            state.messages[action.payload.chatId] = action.payload.messages;
        },
        updateMessage: (state, action: PayloadAction<{ chatId: string; messageId: string; updates: Partial<Message> }>) => {
            const { chatId, messageId, updates } = action.payload;
            if (state.messages[chatId]) {
                const msgIndex = state.messages[chatId].findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    state.messages[chatId][msgIndex] = { ...state.messages[chatId][msgIndex], ...updates };
                }
            }
        },
        updateChat: (state, action: PayloadAction<Partial<Chat> & { id: string }>) => {
            const index = state.chats.findIndex(c => c.id === action.payload.id);
            if (index !== -1) {
                state.chats[index] = { ...state.chats[index], ...action.payload };
            }
        },
        setTypingUser: (state, action: PayloadAction<{ chatId: string; userId: string; isTyping: boolean }>) => {
            const { chatId, userId, isTyping } = action.payload;
            if (!state.typingUsers[chatId]) {
                state.typingUsers[chatId] = [];
            }
            if (isTyping && !state.typingUsers[chatId].includes(userId)) {
                state.typingUsers[chatId].push(userId);
            } else if (!isTyping) {
                state.typingUsers[chatId] = state.typingUsers[chatId].filter(id => id !== userId);
            }
        },
        setOnlineUsers: (state, action: PayloadAction<string[]>) => {
            state.onlineUsers = action.payload;
        },
        addOnlineUser: (state, action: PayloadAction<string>) => {
            if (!state.onlineUsers.includes(action.payload)) {
                state.onlineUsers.push(action.payload);
            }
        },
        removeOnlineUser: (state, action: PayloadAction<string>) => {
            state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
        },
        clearMessages: (state, action: PayloadAction<string>) => {
            delete state.messages[action.payload];
        },
    },
    extraReducers: (builder) => {
        // Fetch chats
        builder.addCase(fetchChats.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchChats.fulfilled, (state, action) => {
            state.loading = false;
            state.chats = action.payload;
        });
        builder.addCase(fetchChats.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Create chat
        builder.addCase(createChat.fulfilled, (state, action) => {
            const exists = state.chats.some(c => c.id === action.payload.id);
            if (!exists) {
                state.chats.unshift(action.payload);
            }
        });

        // Send message
        builder.addCase(sendMessage.fulfilled, (state, action) => {
            const { chatId } = action.payload;
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            const exists = state.messages[chatId].some(m => m.id === action.payload.id);
            if (!exists) {
                state.messages[chatId].push(action.payload);
            }
        });

        // Add reaction
        builder.addCase(addReaction.fulfilled, (state, action) => {
            const { chatId, messageId, reactions } = action.payload;
            if (state.messages[chatId]) {
                const msgIndex = state.messages[chatId].findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    state.messages[chatId][msgIndex].reactions = reactions;
                }
            }
        });

        // Edit message
        builder.addCase(editMessage.fulfilled, (state, action) => {
            const { chatId, messageId, content, edited } = action.payload;
            if (state.messages[chatId]) {
                const msgIndex = state.messages[chatId].findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    state.messages[chatId][msgIndex].content = content;
                    state.messages[chatId][msgIndex].edited = edited;
                }
            }
        });

        // Delete message
        builder.addCase(deleteMessage.fulfilled, (state, action) => {
            const { chatId, messageId, deleted } = action.payload;
            if (state.messages[chatId]) {
                const msgIndex = state.messages[chatId].findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    state.messages[chatId][msgIndex].content = 'This message was deleted';
                    state.messages[chatId][msgIndex].deleted = deleted;
                    state.messages[chatId][msgIndex].imageUrl = undefined;
                }
            }
        });

        // Toggle mute
        builder.addCase(toggleMuteChat.fulfilled, (state, action) => {
            const { chatId, muted } = action.payload;
            const chatIndex = state.chats.findIndex(c => c.id === chatId);
            if (chatIndex !== -1) {
                state.chats[chatIndex].muted = muted;
            }
        });
    },
});

export const {
    setChats,
    setActiveChat,
    addMessage,
    setMessages,
    updateMessage,
    updateChat,
    setTypingUser,
    setOnlineUsers,
    addOnlineUser,
    removeOnlineUser,
    clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;

