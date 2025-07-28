import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Chat, Message } from '../store/slices/chatSlice';

export class ChatService {
  static async createChat(participants: string[], isGroup: boolean, name?: string): Promise<string> {
    const chatData = {
      participants,
      isGroup,
      name: name || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
    };

    const docRef = await addDoc(collection(db, 'chats'), chatData);
    return docRef.id;
  }

  static async sendMessage(chatId: string, message: Omit<Message, 'id' | 'createdAt'>): Promise<string> {
    const messageData = {
      ...message,
      createdAt: serverTimestamp(),
      chatId,
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    
    // Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: messageData,
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  static subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats: Chat[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        unreadCount: 0, // Calculate this based on user's last read timestamp
      } as Chat));
      
      callback(chats);
    });
  }

  static subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      } as Message));
      
      callback(messages);
    });
  }

  static async uploadMedia(file: Blob, fileName: string, type: 'image' | 'video' | 'audio'): Promise<string> {
    const storageRef = ref(storage, `media/${type}s/${Date.now()}_${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  static async addParticipantToGroup(chatId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'chats', chatId), {
      participants: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
  }

  static async removeParticipantFromGroup(chatId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'chats', chatId), {
      participants: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
  }

  static async updateChatName(chatId: string, name: string): Promise<void> {
    await updateDoc(doc(db, 'chats', chatId), {
      name,
      updatedAt: serverTimestamp(),
    });
  }

  static async deleteChat(chatId: string): Promise<void> {
    // Delete all messages in the chat
    const messagesQuery = query(collection(db, 'messages'), where('chatId', '==', chatId));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Delete the chat
    await deleteDoc(doc(db, 'chats', chatId));
  }

  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'messages', messageId), {
      [`readBy.${userId}`]: serverTimestamp(),
    });
  }

  static async searchUsers(searchTerm: string): Promise<any[]> {
    // Note: Firestore doesn't support full-text search natively
    // You might want to use Algolia or implement a different search strategy
    const q = query(
      collection(db, 'users'),
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}