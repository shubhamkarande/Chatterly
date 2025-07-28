import { supabase } from '../config/supabase';
import { Chat } from '../store/slices/chatSlice';

export class SupabaseChatService {
  static async createChat(participants: string[], isGroup: boolean, name?: string): Promise<string> {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        name: name || 'Chat',
        is_group: isGroup,
        participants,
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  static subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
    // Get initial chats
    this.getChats(userId).then(callback);

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${userId}}`,
        },
        () => {
          // Refetch chats when changes occur
          this.getChats(userId).then(callback);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }

  private static async getChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Get chats error:', error);
      return [];
    }

    // Get the last message for each chat separately
    const chatsWithMessages = await Promise.all(
      data.map(async (chat) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('*, users!inner(display_name)')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const lastMessage = messages?.[0];

        return {
          id: chat.id,
          name: chat.name,
          isGroup: chat.is_group,
          participants: chat.participants,
          avatar: chat.avatar_url,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
          unreadCount: 0, // TODO: Calculate unread count
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            text: lastMessage.text,
            createdAt: new Date(lastMessage.created_at),
            user: {
              _id: lastMessage.user_id,
              name: lastMessage.users?.display_name || 'User',
            },
          } : undefined,
        };
      })
    );

    return chatsWithMessages;
  }

  static subscribeToMessages(chatId: string, callback: (messages: any[]) => void) {
    // Get initial messages
    this.getMessages(chatId).then(callback);

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          // Refetch messages when new message arrives
          this.getMessages(chatId).then(callback);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }



  static async sendMessage(chatId: string, messageData: any): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        user_id: messageData.user._id,
        text: messageData.text,
        image_url: messageData.image,
      });

    if (error) throw error;

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);
  }

  static async getMessages(chatId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users!inner(display_name)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Get messages error:', error);
      return [];
    }

    return (data || []).map(msg => ({
      id: msg.id,
      text: msg.text,
      user_id: msg.user_id,
      user_name: msg.users?.display_name || 'User',
      created_at: msg.created_at,
    }));
  }

  static async uploadMedia(file: Blob, fileName: string, type: 'image' | 'file'): Promise<string> {
    const fileExt = fileName.split('.').pop();
    const filePath = `${type}s/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
}