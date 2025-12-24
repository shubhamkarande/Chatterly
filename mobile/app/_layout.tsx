import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { store, useAppDispatch, useAppSelector } from '../src/store';
import { onAuthChange, getUserById } from '../src/services/firebase';
import { setUser } from '../src/store/authSlice';
import socketService from '../src/services/socket';
import { User } from '../src/types';

function RootLayoutNav() {
    const segments = useSegments();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const [isReady, setIsReady] = useState(false);

    // Handle auth state changes
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const idToken = await firebaseUser.getIdToken();
                    const userData = await getUserById(firebaseUser.uid);

                    const user: User = {
                        uid: firebaseUser.uid,
                        name: userData?.name || firebaseUser.displayName || '',
                        email: firebaseUser.email || '',
                        photoURL: userData?.photoURL || firebaseUser.photoURL,
                        online: true,
                    };

                    dispatch(setUser({ user, token: idToken }));

                    // Connect to socket
                    socketService.connect(idToken);
                } catch (error) {
                    console.error('Error getting user data:', error);
                    dispatch(setUser({ user: null, token: null }));
                }
            } else {
                dispatch(setUser({ user: null, token: null }));
                socketService.disconnect();
            }
            setIsReady(true);
        });

        return () => unsubscribe();
    }, [dispatch]);

    // Handle navigation based on auth state
    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(main)');
        }
    }, [user, segments, isReady, router]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: '#0f172a' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                    contentStyle: { backgroundColor: '#0f172a' },
                }}
            >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(main)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="chat/[id]"
                    options={{
                        headerShown: true,
                        headerBackTitle: 'Back',
                    }}
                />
                <Stack.Screen
                    name="chat/group-info"
                    options={{
                        title: 'Group Info',
                        presentation: 'modal',
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <Provider store={store}>
            <RootLayoutNav />
        </Provider>
    );
}
