import { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { setActiveChat, setMessages, toggleMuteChat } from '../../src/store/chatSlice';
import socketService from '../../src/services/socket';
import { Message, Chat } from '../../src/types';
import MessageActions from '../../src/components/MessageActions';
import {
    db,
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    getDoc,
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    addDoc,
    serverTimestamp,
    updateDoc,
} from '../../src/services/firebase';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const flatListRef = useRef<FlatList>(null);

    const { user } = useAppSelector((state) => state.auth);
    const { messages, typingUsers, onlineUsers, chats } = useAppSelector((state) => state.chat);

    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const [typingTimeout, setTypingTimeoutState] = useState<NodeJS.Timeout | null>(null);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showMessageActions, setShowMessageActions] = useState(false);

    const chatMessages = id ? messages[id] || [] : [];
    const chatTypingUsers = id ? typingUsers[id] || [] : [];
    const isMuted = chats.find(c => c.id === id)?.muted || false;

    // Fetch chat details
    useEffect(() => {
        if (!id) return;

        const fetchChat = async () => {
            try {
                const chatDoc = await getDoc(doc(db, 'chats', id));
                if (chatDoc.exists()) {
                    const data = chatDoc.data();
                    const chatData: Chat = {
                        id: chatDoc.id,
                        participants: data.participants,
                        isGroup: data.isGroup || false,
                        groupName: data.groupName,
                        groupAvatar: data.groupAvatar,
                        createdAt: data.createdAt?.toDate() || new Date(),
                        updatedAt: data.updatedAt?.toDate() || new Date(),
                        createdBy: data.createdBy,
                        admins: data.admins,
                    };

                    // Get participant details for 1-on-1 chats
                    if (!data.isGroup) {
                        const otherUserId = data.participants.find((p: string) => p !== user?.uid);
                        if (otherUserId) {
                            const userDoc = await getDoc(doc(db, 'users', otherUserId));
                            if (userDoc.exists()) {
                                chatData.participantDetails = [userDoc.data() as any];
                            }
                        }
                    }

                    setChat(chatData);
                    dispatch(setActiveChat(chatData));

                    // Set navigation title with header options
                    const title = data.isGroup
                        ? data.groupName || 'Group Chat'
                        : chatData.participantDetails?.[0]?.name || 'Chat';

                    navigation.setOptions({
                        title,
                        headerRight: () => (
                            <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
                                {data.isGroup && (
                                    <TouchableOpacity onPress={() => router.push('/chat/group-info')}>
                                        <Ionicons name="information-circle-outline" size={24} color="#0ea5e9" />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={handleToggleMute}>
                                    <Ionicons
                                        name={isMuted ? "notifications-off" : "notifications-outline"}
                                        size={24}
                                        color={isMuted ? "#ef4444" : "#0ea5e9"}
                                    />
                                </TouchableOpacity>
                            </View>
                        ),
                    });
                }
            } catch (error) {
                console.error('Error fetching chat:', error);
            }
        };

        fetchChat();
        socketService.joinChat(id);

        return () => {
            socketService.leaveChat(id);
            dispatch(setActiveChat(null));
        };
    }, [id, user?.uid, navigation, dispatch, isMuted]);

    // Real-time messages listener
    useEffect(() => {
        if (!id) return;

        const messagesRef = collection(db, 'chats', id, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: Message[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                msgs.push({
                    id: doc.id,
                    chatId: id,
                    senderId: data.senderId,
                    senderName: data.senderName,
                    type: data.type,
                    content: data.content,
                    imageUrl: data.imageUrl,
                    timestamp: data.timestamp?.toDate() || new Date(),
                    readBy: data.readBy,
                    reactions: data.reactions,
                    edited: data.edited,
                    deleted: data.deleted,
                });
            });
            dispatch(setMessages({ chatId: id, messages: msgs }));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, dispatch]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatMessages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages.length]);

    const handleToggleMute = async () => {
        if (!id || !user) return;
        dispatch(toggleMuteChat({ chatId: id, userId: user.uid, muted: !isMuted }));
    };

    const handleTyping = useCallback(() => {
        if (!id) return;

        socketService.sendTyping(id);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        const timeout = setTimeout(() => {
            socketService.stopTyping(id);
        }, 2000);

        setTypingTimeoutState(timeout);
    }, [id, typingTimeout]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !id || !user || sending) return;

        const messageText = inputText.trim();
        setInputText('');
        setSending(true);

        try {
            socketService.stopTyping(id);

            const messageData = {
                chatId: id,
                senderId: user.uid,
                senderName: user.name,
                type: 'text' as const,
                content: messageText,
                timestamp: serverTimestamp(),
                readBy: [user.uid],
                reactions: {},
                edited: false,
                deleted: false,
            };

            const messagesRef = collection(db, 'chats', id, 'messages');
            await addDoc(messagesRef, messageData);

            await updateDoc(doc(db, 'chats', id), {
                lastMessage: {
                    senderId: user.uid,
                    senderName: user.name,
                    type: 'text',
                    content: messageText,
                    timestamp: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            });

            socketService.sendMessage(id, 'text', messageText);
        } catch (error) {
            console.error('Error sending message:', error);
            setInputText(messageText);
        } finally {
            setSending(false);
        }
    };

    const handleSendImage = async () => {
        if (!id || !user) return;

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (result.canceled || !result.assets[0]) return;

        setSending(true);
        try {
            const uri = result.assets[0].uri;
            const response = await fetch(uri);
            const blob = await response.blob();

            const fileName = `chat_${id}_${Date.now()}`;
            const storageRef = ref(storage, `chat-images/${fileName}`);
            await uploadBytes(storageRef, blob);
            const imageUrl = await getDownloadURL(storageRef);

            const messageData = {
                chatId: id,
                senderId: user.uid,
                senderName: user.name,
                type: 'image' as const,
                content: '📷 Photo',
                imageUrl,
                timestamp: serverTimestamp(),
                readBy: [user.uid],
                reactions: {},
                edited: false,
                deleted: false,
            };

            const messagesRef = collection(db, 'chats', id, 'messages');
            await addDoc(messagesRef, messageData);

            await updateDoc(doc(db, 'chats', id), {
                lastMessage: {
                    senderId: user.uid,
                    senderName: user.name,
                    type: 'image',
                    content: '📷 Photo',
                    timestamp: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
            });

            socketService.sendMessage(id, 'image', '📷 Photo', imageUrl);
        } catch (error) {
            console.error('Error sending image:', error);
        } finally {
            setSending(false);
        }
    };

    const handleMessageLongPress = (message: Message) => {
        if (message.deleted) return;
        setSelectedMessage(message);
        setShowMessageActions(true);
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderReactions = (reactions: { [emoji: string]: string[] } | undefined) => {
        if (!reactions || Object.keys(reactions).length === 0) return null;

        return (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 }}>
                {Object.entries(reactions).map(([emoji, users]) => (
                    <View
                        key={emoji}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                        }}
                    >
                        <Text style={{ fontSize: 14 }}>{emoji}</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 12, marginLeft: 2 }}>
                            {users.length}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isOwn = item.senderId === user?.uid;
        const showDate = index === 0 ||
            new Date(item.timestamp).toDateString() !==
            new Date(chatMessages[index - 1]?.timestamp).toDateString();

        return (
            <View>
                {showDate && (
                    <View style={{ alignItems: 'center', marginVertical: 16 }}>
                        <Text style={{ color: '#64748b', fontSize: 12, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                            {new Date(item.timestamp).toLocaleDateString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                )}
                <Pressable
                    onLongPress={() => handleMessageLongPress(item)}
                    style={{
                        flexDirection: 'row',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        marginVertical: 4,
                        marginHorizontal: 12,
                    }}
                >
                    <View
                        style={{
                            maxWidth: '75%',
                            backgroundColor: item.deleted ? '#334155' : (isOwn ? '#0ea5e9' : '#1e293b'),
                            borderRadius: 16,
                            borderBottomRightRadius: isOwn ? 4 : 16,
                            borderBottomLeftRadius: isOwn ? 16 : 4,
                            padding: 12,
                            opacity: item.deleted ? 0.7 : 1,
                        }}
                    >
                        {chat?.isGroup && !isOwn && !item.deleted && (
                            <Text style={{ color: '#0ea5e9', fontSize: 12, marginBottom: 4, fontWeight: '600' }}>
                                {item.senderName}
                            </Text>
                        )}
                        {item.type === 'image' && item.imageUrl && !item.deleted ? (
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={{ width: 200, height: 200, borderRadius: 8 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ color: item.deleted ? '#94a3b8' : '#fff', fontSize: 16, fontStyle: item.deleted ? 'italic' : 'normal' }}>
                                {item.content}
                            </Text>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' }}>
                            {item.edited && !item.deleted && (
                                <Text style={{ color: isOwn ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: 10, marginRight: 4 }}>
                                    edited
                                </Text>
                            )}
                            <Text
                                style={{
                                    color: isOwn ? 'rgba(255,255,255,0.7)' : '#64748b',
                                    fontSize: 11,
                                }}
                            >
                                {formatTime(item.timestamp)}
                            </Text>
                        </View>
                        {renderReactions(item.reactions)}
                    </View>
                </Pressable>
            </View>
        );
    };

    const getOtherUserOnline = () => {
        if (chat?.isGroup || !chat?.participantDetails?.[0]) return false;
        return onlineUsers.includes(chat.participantDetails[0].uid);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            {/* Header subtitle - online status */}
            {!chat?.isGroup && getOtherUserOnline() && (
                <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 16, paddingBottom: 8 }}>
                    <Text style={{ color: '#22c55e', fontSize: 12 }}>Online</Text>
                </View>
            )}

            {/* Muted indicator */}
            {isMuted && (
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="notifications-off" size={14} color="#92400e" />
                    <Text style={{ color: '#92400e', fontSize: 12, marginLeft: 6 }}>This chat is muted</Text>
                </View>
            )}

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={chatMessages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={{ paddingVertical: 8 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />

            {/* Typing indicator */}
            {chatTypingUsers.length > 0 && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>
                        Someone is typing...
                    </Text>
                </View>
            )}

            {/* Input */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#1e293b',
                    backgroundColor: '#0f172a',
                }}
            >
                <TouchableOpacity
                    onPress={handleSendImage}
                    disabled={sending}
                    style={{ padding: 8 }}
                >
                    <Ionicons name="image-outline" size={24} color="#0ea5e9" />
                </TouchableOpacity>

                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#1e293b',
                        borderRadius: 24,
                        marginHorizontal: 8,
                        paddingHorizontal: 16,
                    }}
                >
                    <TextInput
                        placeholder="Type a message..."
                        placeholderTextColor="#64748b"
                        value={inputText}
                        onChangeText={(text) => {
                            setInputText(text);
                            handleTyping();
                        }}
                        style={{
                            flex: 1,
                            color: '#fff',
                            paddingVertical: 12,
                            fontSize: 16,
                        }}
                        multiline
                        maxLength={1000}
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSendMessage}
                    disabled={!inputText.trim() || sending}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: inputText.trim() ? '#0ea5e9' : '#334155',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={20} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            {/* Message Actions Modal */}
            <MessageActions
                visible={showMessageActions}
                message={selectedMessage}
                chatId={id || ''}
                userId={user?.uid || ''}
                onClose={() => {
                    setShowMessageActions(false);
                    setSelectedMessage(null);
                }}
            />
        </KeyboardAvoidingView>
    );
}
