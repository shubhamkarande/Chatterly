import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { register, clearError } from '../../src/store/authSlice';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useAppDispatch();
    const { loading, error } = useAppSelector((state) => state.auth);

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        try {
            await dispatch(register({ email: email.trim(), password, name: name.trim() })).unwrap();
        } catch (err: any) {
            Alert.alert('Registration Failed', err || 'Please try again');
        }
    };

    return (
        <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f172a']}
            style={{ flex: 1 }}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 48,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo */}
                    <View style={{ alignItems: 'center', marginBottom: 40 }}>
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 20,
                                backgroundColor: '#0ea5e9',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                                shadowColor: '#0ea5e9',
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.4,
                                shadowRadius: 16,
                                elevation: 8,
                            }}
                        >
                            <Ionicons name="chatbubbles" size={40} color="#fff" />
                        </View>
                        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }}>
                            Create Account
                        </Text>
                        <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
                            Join Chatterly today
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={{ gap: 16 }}>
                        <View>
                            <Text style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14 }}>Full Name</Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#1e293b',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                    paddingHorizontal: 16,
                                }}
                            >
                                <Ionicons name="person-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Enter your name"
                                    placeholderTextColor="#64748b"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    style={{
                                        flex: 1,
                                        color: '#fff',
                                        paddingVertical: 16,
                                        paddingHorizontal: 12,
                                        fontSize: 16,
                                    }}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14 }}>Email</Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#1e293b',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                    paddingHorizontal: 16,
                                }}
                            >
                                <Ionicons name="mail-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Enter your email"
                                    placeholderTextColor="#64748b"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={{
                                        flex: 1,
                                        color: '#fff',
                                        paddingVertical: 16,
                                        paddingHorizontal: 12,
                                        fontSize: 16,
                                    }}
                                />
                            </View>
                        </View>

                        <View>
                            <Text style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14 }}>Password</Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#1e293b',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                    paddingHorizontal: 16,
                                }}
                            >
                                <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Create a password"
                                    placeholderTextColor="#64748b"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    style={{
                                        flex: 1,
                                        color: '#fff',
                                        paddingVertical: 16,
                                        paddingHorizontal: 12,
                                        fontSize: 16,
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="#64748b"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View>
                            <Text style={{ color: '#94a3b8', marginBottom: 8, fontSize: 14 }}>Confirm Password</Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#1e293b',
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                    paddingHorizontal: 16,
                                }}
                            >
                                <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#64748b"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    style={{
                                        flex: 1,
                                        color: '#fff',
                                        paddingVertical: 16,
                                        paddingHorizontal: 12,
                                        fontSize: 16,
                                    }}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleRegister}
                            disabled={loading}
                            style={{
                                backgroundColor: '#0ea5e9',
                                paddingVertical: 16,
                                borderRadius: 12,
                                marginTop: 8,
                                shadowColor: '#0ea5e9',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 }}>
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sign in link */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
                        <Text style={{ color: '#64748b' }}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={{ color: '#0ea5e9', fontWeight: '600' }}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}
