import { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../src/store';
import { User } from '../../src/types';
import {
    db,
    doc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
} from '../../src/services/firebase';

export default function GroupInfoScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const router = useRouter();
    const { user } = useAppSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('');
    const [participants, setParticipants] = useState<User[]>([]);
    const [admins, setAdmins] = useState<string[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');

    const isAdmin = user ? admins.includes(user.uid) : false;

    useEffect(() => {
        fetchGroupInfo();
    }, [chatId]);

    const fetchGroupInfo = async () => {
        if (!chatId) return;

        try {
            const chatDoc = await getDoc(doc(db, 'chats', chatId));
            if (!chatDoc.exists()) {
                Alert.alert('Error', 'Group not found');
                router.back();
                return;
            }

            const data = chatDoc.data();
            setGroupName(data.groupName || 'Group Chat');
            setNewName(data.groupName || '');
            setAdmins(data.admins || []);

            // Fetch participant details
            const participantsList: User[] = [];
            for (const uid of data.participants) {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    participantsList.push(userDoc.data() as User);
                }
            }
            setParticipants(participantsList);
        } catch (error) {
            console.error('Error fetching group info:', error);
            Alert.alert('Error', 'Failed to load group info');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (!chatId || !newName.trim()) return;

        try {
            await updateDoc(doc(db, 'chats', chatId), {
                groupName: newName.trim(),
            });
            setGroupName(newName.trim());
            setIsEditing(false);
            Alert.alert('Success', 'Group name updated');
        } catch (error) {
            console.error('Error updating group name:', error);
            Alert.alert('Error', 'Failed to update group name');
        }
    };

    const handleLeaveGroup = async () => {
        if (!chatId || !user) return;

        Alert.alert(
            'Leave Group',
            'Are you sure you want to leave this group?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const chatDoc = await getDoc(doc(db, 'chats', chatId));
                            if (!chatDoc.exists()) return;

                            const currentParticipants = chatDoc.data().participants;
                            const newParticipants = currentParticipants.filter(
                                (p: string) => p !== user.uid
                            );

                            await updateDoc(doc(db, 'chats', chatId), {
                                participants: newParticipants,
                            });

                            router.replace('/(main)');
                        } catch (error) {
                            console.error('Error leaving group:', error);
                            Alert.alert('Error', 'Failed to leave group');
                        }
                    },
                },
            ]
        );
    };

    const renderParticipant = ({ item }: { item: User }) => {
        const isParticipantAdmin = admins.includes(item.uid);
        const isCurrentUser = item.uid === user?.uid;

        return (
            <View
                style={{
                    flexDirection: 'row',
                    padding: 16,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: '#1e293b',
                }}
            >
                {item.photoURL ? (
                    <Image
                        source={{ uri: item.photoURL }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                    />
                ) : (
                    <View
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: '#6366f1',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>
                            {item.name}
                        </Text>
                        {isCurrentUser && (
                            <Text style={{ color: '#64748b', fontSize: 14, marginLeft: 8 }}>
                                (You)
                            </Text>
                        )}
                    </View>
                    {isParticipantAdmin && (
                        <Text style={{ color: '#0ea5e9', fontSize: 12, marginTop: 2 }}>
                            Admin
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            {/* Group Header */}
            <View style={{ alignItems: 'center', padding: 24 }}>
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: '#0ea5e9',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Ionicons name="people" size={40} color="#fff" />
                </View>

                {isEditing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            style={{
                                backgroundColor: '#1e293b',
                                borderRadius: 8,
                                padding: 12,
                                color: '#fff',
                                fontSize: 18,
                                minWidth: 200,
                            }}
                            autoFocus
                        />
                        <TouchableOpacity onPress={handleUpdateName}>
                            <Ionicons name="checkmark" size={24} color="#22c55e" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsEditing(false)}>
                            <Ionicons name="close" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => isAdmin && setIsEditing(true)}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
                            {groupName}
                        </Text>
                        {isAdmin && (
                            <Ionicons name="pencil" size={18} color="#64748b" style={{ marginLeft: 8 }} />
                        )}
                    </TouchableOpacity>
                )}

                <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
                    {participants.length} participants
                </Text>
            </View>

            {/* Participants List */}
            <View style={{ flex: 1 }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
                    PARTICIPANTS
                </Text>
                <FlatList
                    data={participants}
                    keyExtractor={(item) => item.uid}
                    renderItem={renderParticipant}
                />
            </View>

            {/* Leave Group Button */}
            <View style={{ padding: 16 }}>
                <TouchableOpacity
                    onPress={handleLeaveGroup}
                    style={{
                        backgroundColor: '#dc2626',
                        padding: 16,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="exit-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Leave Group</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
