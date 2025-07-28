import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold text-primary-600 mb-4">Chatterly</Text>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="text-gray-500 mt-4">Loading...</Text>
    </View>
  );
}