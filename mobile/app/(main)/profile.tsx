import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { logout, updateProfile } from '../../src/store/authSlice';
import { storage, ref, uploadBytes, getDownloadURL, db, doc, updateDoc } from '../../src/services/firebase';

export default function ProfileScreen() {
    const dispatch = useAppDispatch();
    const { user, loading } = useAppSelector((state) => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [uploading, setUploading] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logout()),
                },
            ]
        );
    };

    const handleSaveProfile = async () => {
        if (!user?.uid || !name.trim()) return;

        try {
            await dispatch(updateProfile({
                uid: user.uid,
                data: { name: name.trim() }
            })).unwrap();
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error || 'Failed to update profile');
        }
    };

    const handlePickImage = async () => {
        if (!user?.uid) return;

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            try {
                setUploading(true);
                const uri = result.assets[0].uri;
                const response = await fetch(uri);
                const blob = await response.blob();

                const storageRef = ref(storage, `avatars/${user.uid}`);
                await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(storageRef);

                await updateDoc(doc(db, 'users', user.uid), {
                    photoURL: downloadURL,
                });

                await dispatch(updateProfile({
                    uid: user.uid,
                    data: { photoURL: downloadURL }
                })).unwrap();

                Alert.alert('Success', 'Profile photo updated');
            } catch (error) {
                console.error('Error uploading image:', error);
                Alert.alert('Error', 'Failed to upload image');
            } finally {
                setUploading(false);
            }
        }
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: '#0f172a' }}
            contentContainerStyle={{ padding: 24 }}
        >
            {/* Profile Photo */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
                    <View style={{ position: 'relative' }}>
                        {user?.photoURL ? (
                            <Image
                                source={{ uri: user.photoURL }}
                                style={{ width: 120, height: 120, borderRadius: 60 }}
                            />
                        ) : (
                            <View
                                style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: '#0ea5e9',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#fff" size="large" />
                                ) : (
                                    <Text style={{ color: '#fff', fontSize: 48, fontWeight: '600' }}>
                                        {user?.name?.charAt(0).toUpperCase() || '?'}
                                    </Text>
                                )}
                            </View>
                        )}
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: '#1e293b',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: '#0f172a',
                            }}
                        >
                            <Ionicons name="camera" size={18} color="#0ea5e9" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={{ backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                {/* Name */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>NAME</Text>
                    {isEditing ? (
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={{
                                color: '#fff',
                                fontSize: 16,
                                backgroundColor: '#0f172a',
                                borderRadius: 8,
                                padding: 12,
                            }}
                            autoFocus
                        />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 16 }}>{user?.name}</Text>
                    )}
                </View>

                {/* Email */}
                <View>
                    <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>EMAIL</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 16 }}>{user?.email}</Text>
                </View>
            </View>

            {/* Edit/Save Button */}
            {isEditing ? (
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setIsEditing(false);
                            setName(user?.name || '');
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: '#334155',
                            padding: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSaveProfile}
                        disabled={loading}
                        style={{
                            flex: 1,
                            backgroundColor: '#0ea5e9',
                            padding: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                        }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={{
                        backgroundColor: '#1e293b',
                        padding: 16,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                    }}
                >
                    <Ionicons name="create-outline" size={20} color="#0ea5e9" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#0ea5e9', fontWeight: '600' }}>Edit Profile</Text>
                </TouchableOpacity>
            )}

            {/* Logout Button */}
            <TouchableOpacity
                onPress={handleLogout}
                style={{
                    backgroundColor: '#dc2626',
                    padding: 16,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>

            {/* App Info */}
            <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={{ color: '#64748b', fontSize: 12 }}>Chatterly v1.0.0</Text>
                <Text style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
                    Real-time conversations made simple
                </Text>
            </View>
        </ScrollView>
    );
}
