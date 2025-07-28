import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SupabaseChatService } from '../../services/supabaseChatService';
import { RootState } from '../../store';
import { Chat, setChats, setLoading } from '../../store/slices/chatSlice';


export default function ChatsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { chats, isLoading } = useSelector((state: RootState) => state.chat);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(setLoading(true));
      const unsubscribe = SupabaseChatService.subscribeToChats(user.uid, (chats) => {
        dispatch(setChats(chats));
        dispatch(setLoading(false));
      });

      return unsubscribe;
    }
  }, [user, dispatch]);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh will be handled by the subscription
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      return 'now';
    } else if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View className="relative">
        <Image
          source={{
            uri: item.avatar || 'https://via.placeholder.com/50x50?text=Chat',
          }}
          className="w-12 h-12 rounded-full"
        />
        {item.unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center">
          <Text className="font-semibold text-gray-900" numberOfLines={1}>
            {item.name || 'Chat'}
          </Text>
          <Text className="text-xs text-gray-500">
            {item.lastMessage && formatTime(item.lastMessage.createdAt)}
          </Text>
        </View>
        <Text className="text-gray-600 mt-1" numberOfLines={1}>
          {item.lastMessage?.text || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold">Chats</Text>
        <TouchableOpacity
          onPress={() => router.push('/group/create')}
          className="p-2"
        >
          <Ionicons name="add" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              No chats yet{'\n'}Start a conversation!
            </Text>
          </View>
        }
      />
    </View>
  );
}