import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { createChat } from '../../src/store/chatSlice';
import { User } from '../../src/types';
import { db, collection, getDocs } from '../../src/services/firebase';

export default function NewGroupScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);

    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [step, setStep] = useState<'select' | 'name'>('select');

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
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const toggleUser = (uid: string) => {
        setSelectedUsers((prev) =>
            prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
        );
    };

    const handleNext = () => {
        if (selectedUsers.length < 2) {
            Alert.alert('Error', 'Please select at least 2 participants for a group');
            return;
        }
        setStep('name');
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        if (!user) return;

        setCreating(true);
        try {
            const result = await dispatch(createChat({
                participants: [user.uid, ...selectedUsers],
                isGroup: true,
                groupName: groupName.trim(),
                createdBy: user.uid,
            })).unwrap();

            router.replace(`/chat/${result.id}`);
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to create group');
            setCreating(false);
        }
    };

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedUsers.includes(item.uid);

        return (
            <TouchableOpacity
                onPress={() => toggleUser(item.uid)}
                style={{
                    flexDirection: 'row',
                    padding: 16,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: '#1e293b',
                    backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                }}
            >
                {/* Avatar */}
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

                {/* User info */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                        {item.name}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
                        {item.email}
                    </Text>
                </View>

                {/* Checkbox */}
                <View
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0ea5e9' : '#64748b',
                        backgroundColor: isSelected ? '#0ea5e9' : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    if (step === 'name') {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 24 }}>
                <TouchableOpacity
                    onPress={() => setStep('select')}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 18, marginLeft: 12 }}>Back</Text>
                </TouchableOpacity>

                <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
                    Name your group
                </Text>
                <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
                    {selectedUsers.length} participants selected
                </Text>

                <TextInput
                    placeholder="Enter group name"
                    placeholderTextColor="#64748b"
                    value={groupName}
                    onChangeText={setGroupName}
                    style={{
                        backgroundColor: '#1e293b',
                        borderRadius: 12,
                        padding: 16,
                        color: '#fff',
                        fontSize: 18,
                        marginBottom: 24,
                    }}
                    autoFocus
                />

                <TouchableOpacity
                    onPress={handleCreateGroup}
                    disabled={!groupName.trim() || creating}
                    style={{
                        backgroundColor: groupName.trim() ? '#0ea5e9' : '#334155',
                        paddingVertical: 16,
                        borderRadius: 12,
                        alignItems: 'center',
                    }}
                >
                    {creating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                            Create Group
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Header */}
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>New Group</Text>
                    <TouchableOpacity onPress={handleNext} disabled={selectedUsers.length < 2}>
                        <Text
                            style={{
                                color: selectedUsers.length >= 2 ? '#0ea5e9' : '#64748b',
                                fontSize: 16,
                                fontWeight: '600'
                            }}
                        >
                            Next
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
                    {selectedUsers.length} of {users.length} selected
                </Text>
            </View>

            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
                <View style={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
                    {selectedUsers.map((uid) => {
                        const selectedUser = users.find((u) => u.uid === uid);
                        if (!selectedUser) return null;
                        return (
                            <TouchableOpacity
                                key={uid}
                                onPress={() => toggleUser(uid)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#1e293b',
                                    borderRadius: 20,
                                    paddingVertical: 6,
                                    paddingLeft: 6,
                                    paddingRight: 12,
                                }}
                            >
                                <View
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 14,
                                        backgroundColor: '#0ea5e9',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 8,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                        {selectedUser.name.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={{ color: '#fff', fontSize: 14 }}>{selectedUser.name}</Text>
                                <Ionicons name="close" size={16} color="#64748b" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Users list */}
            <FlatList
                data={users}
                keyExtractor={(item) => item.uid}
                renderItem={renderUserItem}
            />
        </View>
    );
}
