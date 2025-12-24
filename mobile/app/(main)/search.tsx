import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../src/store';
import { Chat, Message } from '../../src/types';
import {
    db,
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from '../../src/services/firebase';

type SearchResult = {
    type: 'chat' | 'message';
    chat?: Chat;
    message?: Message;
    chatId?: string;
    chatName?: string;
};

export default function SearchScreen() {
    const router = useRouter();
    const { user } = useAppSelector((state) => state.auth);
    const { chats } = useAppSelector((state) => state.chat);

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        const searchTimer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [searchQuery]);

    const performSearch = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const searchResults: SearchResult[] = [];
            const queryLower = searchQuery.toLowerCase();

            // Search in chat names and participant names
            chats.forEach((chat) => {
                const chatName = chat.isGroup
                    ? chat.groupName || 'Group'
                    : chat.participantDetails?.[0]?.name || 'Unknown';

                if (chatName.toLowerCase().includes(queryLower)) {
                    searchResults.push({
                        type: 'chat',
                        chat,
                    });
                }
            });

            // Search in messages (limited to recent messages)
            for (const chat of chats.slice(0, 5)) {
                const messagesRef = collection(db, 'chats', chat.id, 'messages');
                const q = query(
                    messagesRef,
                    orderBy('timestamp', 'desc')
                );

                const snapshot = await getDocs(q);

                snapshot.docs.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.content?.toLowerCase().includes(queryLower) && !data.deleted) {
                        const chatName = chat.isGroup
                            ? chat.groupName || 'Group'
                            : chat.participantDetails?.[0]?.name || 'Unknown';

                        searchResults.push({
                            type: 'message',
                            message: {
                                id: docSnap.id,
                                ...data,
                                timestamp: data.timestamp?.toDate() || new Date(),
                            } as Message,
                            chatId: chat.id,
                            chatName,
                        });
                    }
                });
            }

            setResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getChatName = (chat: Chat) => {
        if (chat.isGroup) {
            return chat.groupName || 'Group Chat';
        }
        return chat.participantDetails?.[0]?.name || 'Unknown User';
    };

    const renderResult = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity
            onPress={() => {
                if (item.type === 'chat' && item.chat) {
                    router.push(`/chat/${item.chat.id}`);
                } else if (item.type === 'message' && item.chatId) {
                    router.push(`/chat/${item.chatId}`);
                }
            }}
            style={{
                flexDirection: 'row',
                padding: 16,
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: '#1e293b',
            }}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: item.type === 'chat' ? '#0ea5e9' : '#6366f1',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Ionicons
                    name={item.type === 'chat' ? 'chatbubble' : 'document-text'}
                    size={20}
                    color="#fff"
                />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {item.type === 'chat' ? getChatName(item.chat!) : item.chatName}
                </Text>
                {item.type === 'message' && item.message && (
                    <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }} numberOfLines={1}>
                        {item.message.content}
                    </Text>
                )}
            </View>

            <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Search Input */}
            <View style={{ padding: 16 }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#1e293b',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                    }}
                >
                    <Ionicons name="search" size={20} color="#64748b" />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search chats and messages..."
                        placeholderTextColor="#64748b"
                        style={{
                            flex: 1,
                            padding: 12,
                            color: '#fff',
                            fontSize: 16,
                        }}
                        autoFocus
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#64748b" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                </View>
            ) : results.length > 0 ? (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => `${item.type}-${item.chat?.id || item.message?.id}-${index}`}
                    renderItem={renderResult}
                />
            ) : searchQuery.length >= 2 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Ionicons name="search" size={48} color="#334155" />
                    <Text style={{ color: '#64748b', fontSize: 16, marginTop: 16 }}>
                        No results found for "{searchQuery}"
                    </Text>
                </View>
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Ionicons name="search" size={48} color="#334155" />
                    <Text style={{ color: '#64748b', fontSize: 16, marginTop: 16 }}>
                        Type at least 2 characters to search
                    </Text>
                </View>
            )}
        </View>
    );
}
