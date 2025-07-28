import { SupabaseAuthService } from '@/services/supabaseAuthService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { NotificationService } from '../../services/notificationService';
import { RootState } from '../../store';


export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await SupabaseAuthService.signOut();
              router.replace('/auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const toggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (enabled) {
      await NotificationService.registerForPushNotifications();
    } else {
      await NotificationService.cancelAllNotifications();
    }
  };

  const toggleOnlineStatus = async (isOnline: boolean) => {
    setOnlineStatus(isOnline);
    if (user) {
      await SupabaseAuthService.updateUserStatus(user.uid, isOnline);
    }
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 border-b border-gray-100"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-gray-900">{title}</Text>
        {subtitle && <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>}
      </View>
      {rightComponent || (onPress && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />)}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-4 py-6 border-b border-gray-200">
        <Text className="text-xl font-bold">Settings</Text>
      </View>

      {/* Profile Section */}
      <View className="px-4 py-6 border-b border-gray-200">
        <View className="flex-row items-center">
          <Image
            source={{
              uri: user?.photoURL || 'https://via.placeholder.com/80x80?text=User',
            }}
            className="w-16 h-16 rounded-full"
          />
          <View className="ml-4 flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {user?.displayName}
            </Text>
            <Text className="text-gray-600">{user?.email}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="pencil" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Options */}
      <View className="mt-4">
        <SettingItem
          icon="notifications"
          title="Notifications"
          subtitle="Receive push notifications for new messages"
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f3f4f6'}
            />
          }
        />

        <SettingItem
          icon="radio"
          title="Online Status"
          subtitle="Show when you're online to other users"
          rightComponent={
            <Switch
              value={onlineStatus}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={onlineStatus ? '#ffffff' : '#f3f4f6'}
            />
          }
        />

        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle="Switch to dark theme"
          onPress={() => Alert.alert('Coming Soon', 'Dark mode will be available in a future update')}
        />

        <SettingItem
          icon="shield-checkmark"
          title="Privacy & Security"
          subtitle="Manage your privacy settings"
          onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon')}
        />

        <SettingItem
          icon="help-circle"
          title="Help & Support"
          subtitle="Get help or contact support"
          onPress={() => Alert.alert('Help', 'For support, please email: support@chatterly.com')}
        />

        <SettingItem
          icon="information-circle"
          title="About"
          subtitle="App version and information"
          onPress={() => Alert.alert('About Chatterly', 'Version 1.0.0\nReal-time conversations made simple')}
        />
      </View>

      {/* Sign Out Button */}
      <View className="mt-8 px-4">
        <TouchableOpacity
          className="bg-red-500 rounded-lg py-4 items-center"
          onPress={handleSignOut}
        >
          <Text className="text-white font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}