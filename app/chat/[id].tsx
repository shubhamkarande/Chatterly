import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { SupabaseChatService } from '../../services/supabaseChatService';
import { RootState } from '../../store';

interface ChatMessage {
  id: string;
  text: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserName, setOtherUserName] = useState('Chat');

  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const msgs = await SupabaseChatService.getMessages(id);
      setMessages(msgs);
      
      // Get other user's name from messages or participants
      const otherMsg = msgs.find((m: any) => m.user_id !== user?.uid);
      if (otherMsg) {
        setOtherUserName(otherMsg.user_name);
      }
    } catch (error) {
      console.warn('Failed to load messages:', error);
    }
  }, [id, user?.uid]);

  useEffect(() => {
    if (id && user) {
      loadMessages();
    }
  }, [id, user, loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;

    try {
      await SupabaseChatService.sendMessage(id, {
        text: newMessage,
        user: {
          _id: user.uid,
          name: user.displayName,
        },
      });
      setNewMessage('');
      loadMessages(); // Reload messages
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ marginRight: 12, padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 18,
            fontWeight: '600',
            color: '#111827'
          }}>
            {otherUserName}
          </Text>
        </View>

        {/* Messages Container */}
        <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              padding: 16,
              paddingBottom: 20,
              minHeight: messages.length === 0 ? '100%' : 'auto'
            }}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: 100
              }}>
                <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
                <Text style={{
                  color: '#6b7280',
                  fontSize: 16,
                  marginTop: 16,
                  textAlign: 'center'
                }}>
                  No messages yet.{'\n'}Start the conversation!
                </Text>
              </View>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={{
                    marginBottom: 12,
                    alignItems: message.user_id === user?.uid ? 'flex-end' : 'flex-start'
                  }}
                >
                  <View
                    style={{
                      maxWidth: '75%',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 18,
                      backgroundColor: message.user_id === user?.uid ? '#007AFF' : '#ffffff',
                      elevation: 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 1,
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: message.user_id === user?.uid ? '#ffffff' : '#111827',
                      lineHeight: 20
                    }}>
                      {message.text}
                    </Text>
                  </View>
                  <Text style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginTop: 4,
                    marginHorizontal: 8
                  }}>
                    {formatTime(message.created_at)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Input Container */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{
            flex: 1,
            marginRight: 12,
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 24,
            backgroundColor: '#f9fafb',
            paddingHorizontal: 16,
            paddingVertical: 8,
            maxHeight: 100
          }}>
            <TextInput
              style={{
                fontSize: 16,
                color: '#111827',
                minHeight: 20,
                maxHeight: 80,
                textAlignVertical: 'top'
              }}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: newMessage.trim() ? '#007AFF' : '#d1d5db',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
            }}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}