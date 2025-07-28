import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { ChatService } from '../../../services/chatService';
import { RootState } from '../../../store';

interface Participant {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isOnline: boolean;
}

export default function GroupSettingsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentChat } = useSelector((state: RootState) => state.chat);
  const { onlineUsers } = useSelector((state: RootState) => state.socket);
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groupName, setGroupName] = useState(currentChat?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    // Load participants data
    // This would typically fetch from Firestore
    // For now, we'll use mock data
    setParticipants([]);
  }, [id]);

  const updateGroupName = async () => {
    if (!groupName.trim() || !id) return;

    try {
      await ChatService.updateChatName(id, groupName);
      setIsEditingName(false);
      Alert.alert('Success', 'Group name updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (!id) return;

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatService.removeParticipantFromGroup(id, participantId);
              setParticipants(prev => prev.filter(p => p.id !== participantId));
              Alert.alert('Success', 'Member removed from group');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const leaveGroup = async () => {
    if (!id || !user) return;

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
              await ChatService.removeParticipantFromGroup(id, user.uid);
              router.replace('/(tabs)');
              Alert.alert('Success', 'You have left the group');
            } catch (error) {
              Alert.alert('Error', 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const deleteGroup = async () => {
    if (!id) return;

    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatService.deleteChat(id);
              router.replace('/(tabs)');
              Alert.alert('Success', 'Group deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  const renderParticipant = ({ item }: { item: Participant }) => (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <View className="relative">
        <Image
          source={{
            uri: item.photoURL || 'https://via.placeholder.com/50x50?text=User',
          }}
          className="w-12 h-12 rounded-full"
        />
        {item.isOnline && (
          <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      <View className="flex-1 ml-3">
        <Text className="font-semibold text-gray-900">{item.displayName}</Text>
        <Text className="text-gray-600 text-sm">{item.email}</Text>
      </View>

      {item.id !== user?.uid && (
        <TouchableOpacity
          onPress={() => removeParticipant(item.id)}
          className="p-2"
        >
          <Ionicons name="remove-circle-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold">Group Settings</Text>
      </View>

      {/* Group Info */}
      <View className="px-4 py-6 border-b border-gray-200">
        <View className="items-center mb-4">
          <Image
            source={{
              uri: currentChat?.avatar || 'https://via.placeholder.com/80x80?text=Group',
            }}
            className="w-20 h-20 rounded-full"
          />
          <TouchableOpacity className="mt-2">
            <Text className="text-primary-600 font-medium">Change Photo</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {isEditingName ? (
            <View className="flex-1 flex-row items-center">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2"
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group name"
                maxLength={50}
              />
              <TouchableOpacity
                onPress={updateGroupName}
                className="bg-primary-600 rounded-lg px-3 py-2 mr-1"
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsEditingName(false);
                  setGroupName(currentChat?.name || '');
                }}
                className="bg-gray-400 rounded-lg px-3 py-2"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-1 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                {currentChat?.name}
              </Text>
              <TouchableOpacity onPress={() => setIsEditingName(true)}>
                <Ionicons name="pencil" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Participants */}
      <View className="py-4">
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-lg font-semibold text-gray-900">
            Members ({participants.length})
          </Text>
          <TouchableOpacity>
            <Ionicons name="person-add" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-gray-500">No members to display</Text>
            </View>
          }
        />
      </View>

      {/* Actions */}
      <View className="px-4 py-4 space-y-3">
        <TouchableOpacity
          className="bg-orange-500 rounded-lg py-4 items-center"
          onPress={leaveGroup}
        >
          <Text className="text-white font-semibold text-base">Leave Group</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-500 rounded-lg py-4 items-center"
          onPress={deleteGroup}
        >
          <Text className="text-white font-semibold text-base">Delete Group</Text>
        </TouchableOpacity>
      </View>

      <View className="h-8" />
    </ScrollView>
  );
}