import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import '../global.css';
import { NotificationService } from '../services/notificationService';
import { SupabaseAuthService } from '../services/supabaseAuthService';
import { store } from '../store';
import { setUser } from '../store/slices/authSlice';

export default function RootLayout() {
  useEffect(() => {
    // Initialize notifications
    NotificationService.registerForPushNotifications().catch(error => {
      console.warn('Failed to register for push notifications:', error);
    });

    // Listen for auth state changes
    const unsubscribe = SupabaseAuthService.onAuthStateChanged((user) => {
      store.dispatch(setUser(user));
    });

    return unsubscribe;
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="group/create" />
        <Stack.Screen name="group/[id]/settings" />
      </Stack>
    </Provider>
  );
}