import { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { fetchChats, createChat } from '../../src/store/chatSlice';
import { Chat, User } from '../../src/types';
import {
    db,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs
} from '../../src/services/firebase';

export default function ChatsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { chats, loading, onlineUsers } = useAppSelector((state) => state.chat);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            dispatch(fetchChats(user.uid));
        }
    }, [user?.uid, dispatch]);

    // Real-time listener for chats
    useEffect(() => {
        if (!user?.uid) return;

        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, () => {
            dispatch(fetchChats(user.uid));
        });

        return () => unsubscribe();
    }, [user?.uid, dispatch]);

    const onRefresh = useCallback(async () => {
        if (user?.uid) {
            setRefreshing(true);
            await dispatch(fetchChats(user.uid));
            setRefreshing(false);
        }
    }, [user?.uid, dispatch]);

    const getChatTitle = (chat: Chat) => {
        if (chat.isGroup) {
            return chat.groupName || 'Group Chat';
        }
        const otherUser = chat.participantDetails?.[0];
        return otherUser?.name || 'Unknown User';
    };

    const getChatAvatar = (chat: Chat) => {
        if (chat.isGroup) {
            return chat.groupAvatar;
        }
        return chat.participantDetails?.[0]?.photoURL;
    };

    const isOnline = (chat: Chat) => {
        if (chat.isGroup) return false;
        const otherUserId = chat.participants.find(p => p !== user?.uid);
        return otherUserId ? onlineUsers.includes(otherUserId) : false;
    };

    const formatTime = (date?: Date) => {
        if (!date) return '';
        const now = new Date();
        const messageDate = new Date(date);

        if (messageDate.toDateString() === now.toDateString()) {
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }

        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderChatItem = ({ item }: { item: Chat }) => (
        <TouchableOpacity
            onPress={() => router.push(`/chat/${item.id}`)}
            style={{
                flexDirection: 'row',
                padding: 16,
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: '#1e293b',
            }}
        >
            {/* Avatar */}
            <View style={{ position: 'relative' }}>
                {getChatAvatar(item) ? (
                    <Image
                        source={{ uri: getChatAvatar(item) as string }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                    />
                ) : (
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: '#0ea5e9',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600' }}>
                            {getChatTitle(item).charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                {/* Online indicator */}
                {isOnline(item) && (
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: '#22c55e',
                            borderWidth: 2,
                            borderColor: '#0f172a',
                        }}
                    />
                )}
            </View>

            {/* Chat info */}
            <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                        {getChatTitle(item)}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 12 }}>
                        {formatTime(item.lastMessage?.timestamp)}
                    </Text>
                </View>
                <Text
                    style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}
                    numberOfLines={1}
                >
                    {item.lastMessage?.content || 'No messages yet'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && chats.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {chats.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Ionicons name="chatbubbles-outline" size={80} color="#334155" />
                    <Text style={{ color: '#94a3b8', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                        No conversations yet
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                        Start a new chat from the Contacts tab
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item.id}
                    renderItem={renderChatItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0ea5e9"
                        />
                    }
                />
            )}
        </View>
    );
}
