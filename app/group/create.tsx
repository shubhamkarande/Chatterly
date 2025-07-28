import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const searchResults = await SupabaseAuthService.searchUsers(query);
      const filteredUsers = searchResults.filter(u => u.id !== user?.uid);
      setUsers(filteredUsers);
    } catch (error) {
      Alert.alert('Error', 'Failed to search users');
    }
  };

  const toggleUserSelection = (selectedUser: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      const participants = [user.uid, ...selectedUsers.map(u => u.id)];
      const chatId = await SupabaseChatService.createChat(participants, true, groupName);
      
      Alert.alert('Success', 'Group created successfully!', [
        { text: 'OK', onPress: () => router.replace(`/chat/${chatId}`) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.find(u => u.id === item.id);
    
    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-3 border-b border-gray-100"
        onPress={() => toggleUserSelection(item)}
      >
        <Image
          source={{
            uri: item.photoURL || 'https://via.placeholder.com/50x50?text=User',
          }}
          className="w-12 h-12 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900">{item.displayName}</Text>
          <Text className="text-gray-600 text-sm">{item.email}</Text>
        </View>
        <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
          isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
        }`}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedUser = ({ item }: { item: User }) => (
    <View className="items-center mr-3">
      <View className="relative">
        <Image
          source={{
            uri: item.photoURL || 'https://via.placeholder.com/50x50?text=User',
          }}
          className="w-12 h-12 rounded-full"
        />
        <TouchableOpacity
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center"
          onPress={() => toggleUserSelection(item)}
        >
          <Ionicons name="close" size={12} color="white" />
        </TouchableOpacity>
      </View>
      <Text className="text-xs text-gray-600 mt-1 text-center" numberOfLines={1}>
        {item.displayName}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold">Create Group</Text>
        <TouchableOpacity
          onPress={createGroup}
          disabled={loading || !groupName.trim() || selectedUsers.length === 0}
          className={`px-4 py-2 rounded-lg ${
            loading || !groupName.trim() || selectedUsers.length === 0
              ? 'bg-gray-300'
              : 'bg-primary-600'
          }`}
        >
          <Text className={`font-semibold ${
            loading || !groupName.trim() || selectedUsers.length === 0
              ? 'text-gray-500'
              : 'text-white'
          }`}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 py-4 border-b border-gray-200">
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          placeholder="Group name"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
      </View>

      {selectedUsers.length > 0 && (
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-sm text-gray-600 mb-2">
            Selected ({selectedUsers.length})
          </Text>
          <FlatList
            data={selectedUsers}
            renderItem={renderSelectedUser}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search users to add..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
          />
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              {searchQuery.length < 2
                ? 'Search for users to add to the group'
                : 'No users found'}
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}