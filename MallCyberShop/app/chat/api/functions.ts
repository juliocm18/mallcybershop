import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

import { Chat, Message, UserProfile, UserSession } from '../models';
import { supabase } from '@/app/supabase';


const TABLES = {
  USER_SESSION: 'user_session',
  CHAT: 'chat',
  USER_PROFILE: 'user_profile',
  MESSAGE: 'message'
};

// Helper function to generate encrypted chat ID from title
const generateChatId = (title: string): string => {
  const hash = createHash('sha256')
    .update(title + uuidv4())
    .digest('hex')
    .slice(0, 32);
  return hash;
};

// Create a new chat (group or private)
export const createChat = async (
  {
    name,
    type,
    country,
    city,

  }: Chat
): Promise<Chat | null> => {
  try {

    const chat: Chat = {
      name,
      type,
      country,
      city,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // Insert chat
    const { data: chatData, error: chatError } = await supabase
      .from(TABLES.CHAT)
      .insert(chat)
      .select()
      .single();

    if (chatError) throw chatError;

    return chatData;
  } catch (error) {
    console.error('Error creating chat:', error);
    return null;
  }
};

// Get all chats for a user
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CHAT)
      .select(`
        *,
        messages:message(
          id,
          text,
          senderId: sender_id,
          time,
          status
        )
      `)
      .eq('status', 'active')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
};

// Get chat messages
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MESSAGE)
      .select('*')
      .eq('chatId', chatId)
      .order('time', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (message: Omit<Message, 'id' | 'time' | 'status'>): Promise<Message | null> => {
  try {
    const newMessage: Message = {
      ...message,
      time: new Date(),
      status: 'sending'
    };

    const { data, error } = await supabase
      .from(TABLES.MESSAGE)
      .insert(newMessage)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

// Update user session status
export const updateSessionStatus = async (
  userId: string,
  status: Partial<UserSession>
): Promise<UserSession | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_SESSION)
      .upsert({
        userId,
        ...status,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating session status:', error);
    return null;
  }
};

// Get chat participants
export const getOnlineUsersByChatLocation = async (
  chatId: string,
  includeTyping: boolean = true
): Promise<UserProfile[]> => {
  try {
    // Obtener ubicación del chat
    const { data: chat, error: chatError } = await supabase
      .from(TABLES.CHAT)
      .select('country, city')
      .eq('id', chatId)
      .single();

    if (chatError) throw chatError;
    if (!chat || !chat.country || !chat.city) return [];

    // Consulta base
    let query = supabase
      .from(TABLES.USER_PROFILE)
      .select(`
        *,
        user_session:user_id (
          isOnline,
          typing,
          last_seen_at
        )
      `)
      .eq('country', chat.country)
      .eq('city', chat.city)
      .eq('user_session.isOnline', true);

    // Filtro adicional para typing si se solicita
    if (!includeTyping) {
      query = query.eq('user_session.typing', false);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    return users?.map(user => ({
      ...user,
      status: user.user_session?.typing ? 'typing' : 'online',
      lastSeen: user.user_session?.last_seen_at || user.lastSeen
    })) || [];
  } catch (error) {
    console.error('Error fetching online users:', error);
    return [];
  }
};

// Get a specific chat by ID
export const getChat = async (chatId: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CHAT)
      .select(`
        *,
        messages:message(
          id,
          senderId: sender_id,
          text,
          time,
          status
        )
      `)
      .order('time', { ascending: false })
      .eq('id', chatId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
};

export const getChatByCountryAndCity = async (country: string, city: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CHAT)
      .select(`
        *,
        messages:message(
          id,
          senderId: sender_id,
          text,
          time,
          status
        )
      `)
      .order('time', { ascending: false })
      .limit(100)
      .eq('country', country)
      .eq('city', city)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
};

export const getChatByRecipientId = async (recipientId: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CHAT)
      .select(`
        *,
        messages:message(
          id,
          senderId: sender_id,
          text,
          time,
          status
        )
      `)
      .order('time', { ascending: false })
      .limit(100)
      .eq('recipient_id', recipientId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILE)
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILE)
      .update({
        ...profile,
        updatedAt: new Date().toISOString()
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<UserProfile | null> => {
  try {

    const {data: { session }} = await supabase.auth.getSession();

    if (!session) return null;
    const userId = session.user.id;

    const profile = await getUserProfile(userId);

    if (!profile) return null;
    return profile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Update message like status
export const updateMessageLike = async (
  messageId: string,
  userId: string,
  isLiked: boolean
): Promise<Message | null> => {
  try {
    // Primero obtenemos el mensaje actual para trabajar con sus likes
    const { data: currentMessage, error: fetchError } = await supabase
      .from(TABLES.MESSAGE)
      .select('id, likes, is_liked')
      .eq('id', messageId)
      .single();

    if (fetchError) throw fetchError;
    if (!currentMessage) return null;

    // Procesamos el array de likes
    let updatedLikes = currentMessage.likes || [];
    
    if (isLiked) {
      // Añadimos el usuario si no está ya en el array
      if (!updatedLikes.includes(userId)) {
        updatedLikes = [...updatedLikes, userId];
      }
    } else {
      // Eliminamos el usuario del array
      updatedLikes = updatedLikes.filter((id: string) => id !== userId);
    }

    // Actualizamos el mensaje
    const { data: updatedMessage, error: updateError } = await supabase
      .from(TABLES.MESSAGE)
      .update({
        is_liked: isLiked,
        likes: updatedLikes,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updatedMessage;
  } catch (error) {
    console.error('Error updating message like:', error);
    return null;
  }
};
  