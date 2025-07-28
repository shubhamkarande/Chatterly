import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { supabase } from "../../config/supabase";
import { SupabaseAuthService } from "../../services/supabaseAuthService";
import { SupabaseChatService } from "../../services/supabaseChatService";
import { RootState } from "../../store";

interface Contact {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isOnline: boolean;
}

export default function ContactsScreen() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  // Remove unused onlineUsers for now
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Loading all users...");
      const users = await SupabaseAuthService.searchUsers("");
      console.log("Found users:", users.length, users);
      const filteredUsers = users.filter((u) => u.uid !== user?.uid);
      console.log(
        "Filtered users (excluding current user):",
        filteredUsers.length
      );
      setContacts(
        filteredUsers.map((u) => ({
          id: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          isOnline: u.isOnline,
        }))
      );
    } catch (error) {
      console.warn("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const searchUsers = async (query: string) => {
    if (query.length === 0) {
      loadAllUsers();
      return;
    }

    setLoading(true);
    try {
      const users = await SupabaseAuthService.searchUsers(query);
      const filteredUsers = users.filter((u) => u.uid !== user?.uid);
      setContacts(
        filteredUsers.map((u) => ({
          id: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          isOnline: u.isOnline,
        }))
      );
    } catch (error) {
      Alert.alert("Error", "Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load all users when component mounts
    loadAllUsers();

    // Set up real-time subscription to users table
    const subscription = supabase
      .channel("users-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        (payload) => {
          console.log("User table changed:", payload);
          // Reload users when someone new signs up
          loadAllUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAllUsers]);

  const startChat = async (contact: Contact) => {
    if (!user) return;

    try {
      console.log('Creating chat between:', user.uid, 'and', contact.id);
      const chatId = await SupabaseChatService.createChat(
        [user.uid, contact.id],
        false,
        contact.displayName // Use contact name as chat name
      );
      console.log('Chat created with ID:', chatId);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Failed to create chat:', error);
      Alert.alert("Error", "Failed to start chat");
    }
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
      onPress={() => startChat(item)}
    >
      <View className="relative">
        <Image
          source={{
            uri: item.photoURL || "https://via.placeholder.com/50x50?text=User",
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

      <Ionicons name="chatbubble-outline" size={20} color="#3b82f6" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-xl font-bold">Contacts</Text>
            <Text className="text-sm text-gray-500">
              {contacts.length} users found
            </Text>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={async () => {
                console.log("Current user:", user);
                await loadAllUsers();
              }}
              className="bg-primary-600 px-3 py-1 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchUsers(text);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                loadAllUsers();
              }}
              className="ml-2"
            >
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              {loading
                ? "Loading users..."
                : searchQuery.length > 0
                ? "No users found matching your search"
                : "No users available yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}