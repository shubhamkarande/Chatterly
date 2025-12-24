import { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { createChat } from '../../src/store/chatSlice';
import { User } from '../../src/types';
import { db, collection, getDocs, query, where } from '../../src/services/firebase';

export default function ContactsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { onlineUsers } = useAppSelector((state) => state.chat);

    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const usersList: User[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.uid !== user?.uid) {
                    usersList.push(data as User);
                }
            });

            setUsers(usersList);
            setFilteredUsers(usersList);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = users.filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    }, [fetchUsers]);

    const startChat = async (otherUser: User) => {
        if (!user) return;

        try {
            const result = await dispatch(createChat({
                participants: [user.uid, otherUser.uid],
                isGroup: false,
                createdBy: user.uid,
            })).unwrap();

            router.push(`/chat/${result.id}`);
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to create chat');
        }
    };

    const renderUserItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            onPress={() => startChat(item)}
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
                {item.photoURL ? (
                    <Image
                        source={{ uri: item.photoURL }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                ) : (
                    <View
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: '#6366f1',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
                {/* Online indicator */}
                {onlineUsers.includes(item.uid) && (
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 2,
                            right: 2,
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: '#22c55e',
                            borderWidth: 2,
                            borderColor: '#0f172a',
                        }}
                    />
                )}
            </View>

            {/* User info */}
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {item.name}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
                    {item.email}
                </Text>
            </View>

            <Ionicons name="chatbubble-outline" size={20} color="#0ea5e9" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Search bar */}
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
                        placeholder="Search contacts..."
                        placeholderTextColor="#64748b"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{
                            flex: 1,
                            color: '#fff',
                            paddingVertical: 12,
                            paddingHorizontal: 12,
                            fontSize: 16,
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#64748b" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* New Group button */}
            <TouchableOpacity
                onPress={() => router.push('/(main)/new-group')}
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
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: '#0ea5e9',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="people" size={24} color="#fff" />
                </View>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
                    New Group
                </Text>
            </TouchableOpacity>

            {/* Users list */}
            {filteredUsers.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Ionicons name="people-outline" size={80} color="#334155" />
                    <Text style={{ color: '#94a3b8', fontSize: 18, marginTop: 16, textAlign: 'center' }}>
                        {searchQuery ? 'No users found' : 'No other users yet'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderUserItem}
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
