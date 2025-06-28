// services/conversationService.js
import { supabase } from './supabase-client.js';

export class ConversationService {
  // Create a new conversation
  static async createConversation(title = 'New Conversation') {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: user.id,
          title: title.length > 255 ? title.substring(0, 255) : title
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data;
  }

  // Get all conversations for the current user
  static async getConversations() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    return data || [];
  }

  // Get a specific conversation with its messages
  static async getConversation(conversationId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError) {
      throw new Error(`Failed to fetch conversation: ${convError.message}`);
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new Error(`Failed to fetch messages: ${msgError.message}`);
    }

    return {
      ...conversation,
      messages: messages || []
    };
  }

  // Add a message to a conversation
  static async addMessage(conversationId, content, role = 'user') {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          content,
          role
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return data;
  }

  // Update conversation title
  static async updateConversationTitle(conversationId, title) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('conversations')
      .update({ 
        title: title.length > 255 ? title.substring(0, 255) : title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`);
    }

    return data;
  }

  // Delete a conversation
  static async deleteConversation(conversationId) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }

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
  static async searchConversations(query) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search conversations: ${error.message}`);
    }

    return data || [];
  }
}