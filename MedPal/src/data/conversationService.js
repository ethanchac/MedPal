// services/conversationService.js
import { db, auth } from './firebase-client.js';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export class ConversationService {
  // Create a new conversation
  static async createConversation(title = 'New Conversation') {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const conversationData = {
      user_id: user.uid,
      title: title.length > 255 ? title.substring(0, 255) : title,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'conversations'), conversationData);

    return {
      id: docRef.id,
      ...conversationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Get all conversations for the current user
  static async getConversations() {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const conversationsRef = collection(db, 'conversations');

    // Try with orderBy first (requires index)
    try {
      const q = query(
        conversationsRef,
        where('user_id', '==', user.uid),
        orderBy('updated_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const conversations = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
        });
      });

      return conversations;
    } catch (error) {
      // Fallback: If index is building, fetch without orderBy and sort client-side
      if (error.code === 'failed-precondition') {
        console.warn('Index is building, using fallback query...');
        const q = query(conversationsRef, where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const conversations = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          conversations.push({
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
          });
        });

        // Sort client-side
        conversations.sort((a, b) => {
          const dateA = new Date(a.updated_at);
          const dateB = new Date(b.updated_at);
          return dateB - dateA;
        });

        return conversations;
      }
      throw error;
    }
  }

  // Get a specific conversation with its messages
  static async getConversation(conversationId) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversationData = conversationDoc.data();

    if (conversationData.user_id !== user.uid) {
      throw new Error('Access denied');
    }

    // Get messages
    const messagesRef = collection(db, 'messages');

    let messages = [];
    try {
      const q = query(
        messagesRef,
        where('conversation_id', '==', conversationId),
        orderBy('created_at', 'asc')
      );

      const messagesSnapshot = await getDocs(q);

      messagesSnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
        });
      });
    } catch (error) {
      // Fallback: If index is building, fetch without orderBy and sort client-side
      if (error.code === 'failed-precondition') {
        console.warn('Messages index is building, using fallback query...');
        const q = query(messagesRef, where('conversation_id', '==', conversationId));
        const messagesSnapshot = await getDocs(q);

        messagesSnapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
          });
        });

        // Sort client-side
        messages.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;
        });
      } else {
        throw error;
      }
    }

    return {
      id: conversationDoc.id,
      ...conversationData,
      created_at: conversationData.created_at?.toDate?.()?.toISOString() || conversationData.created_at,
      updated_at: conversationData.updated_at?.toDate?.()?.toISOString() || conversationData.updated_at,
      messages
    };
  }

  // Add a message to a conversation
  static async addMessage(conversationId, content, role = 'user') {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists() || conversationDoc.data().user_id !== user.uid) {
      throw new Error('Conversation not found or access denied');
    }

    const messageData = {
      conversation_id: conversationId,
      content,
      role,
      created_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);

    return {
      id: docRef.id,
      ...messageData,
      created_at: new Date().toISOString()
    };
  }

  // Update conversation title
  static async updateConversationTitle(conversationId, title) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists() || conversationDoc.data().user_id !== user.uid) {
      throw new Error('Conversation not found or access denied');
    }

    await updateDoc(conversationRef, {
      title: title.length > 255 ? title.substring(0, 255) : title,
      updated_at: serverTimestamp()
    });

    const updatedDoc = await getDoc(conversationRef);
    const data = updatedDoc.data();

    return {
      id: conversationId,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
    };
  }

  // Delete a conversation
  static async deleteConversation(conversationId) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);

    if (!conversationDoc.exists() || conversationDoc.data().user_id !== user.uid) {
      throw new Error('Conversation not found or access denied');
    }

    // Delete all messages in the conversation
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('conversation_id', '==', conversationId));
    const messagesSnapshot = await getDocs(q);

    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete the conversation
    await deleteDoc(conversationRef);

    return true;
  }

  // Generate a title from the first message
  static generateTitleFromMessage(message) {
    if (!message || typeof message !== 'string') {
      return 'New Conversation';
    }

    // Clean and truncate the message to create a title
    const cleanMessage = message.trim().replace(/\s+/g, ' ');
    
    if (cleanMessage.length <= 50) {
      return cleanMessage;
    }

    // Find the last space before the 50-character limit
    const truncated = cleanMessage.substring(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 20) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  // Search conversations
  static async searchConversations(searchQuery) {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get all conversations for the user
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('user_id', '==', user.uid),
      orderBy('updated_at', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversations = [];

    // Filter conversations by title (client-side since Firestore doesn't support full-text search)
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        conversations.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
        });
      }
    });

    return conversations;
  }
}