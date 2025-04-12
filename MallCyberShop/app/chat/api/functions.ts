import { v4 as uuidv4 } from 'uuid';


import { Chat, Message, UserProfile, UserSession } from '../models';
import { supabase } from '@/app/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';

const ENV_REDIRECT_URL = 'exp://192.168.18.22:8081';
const TABLES = {
  USER_SESSION: 'user_session',
  CHAT: 'chat',
  USER_PROFILE: 'user_profile',
  MESSAGE: 'message'
};

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Configura esto al iniciar tu aplicación (por ejemplo, en tu App.tsx o contexto de autenticación)
GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  webClientId: 'TU_CLIENT_ID_GOOGLE_WEB', // ID de cliente para aplicaciones WEB de Google Cloud Console
  // iosClientId: 'TU_CLIENT_ID_GOOGLE_IOS', // ID de cliente para iOS de Google Cloud Console (solo si usas iOS)
  offlineAccess: true, // Opcional: si necesitas refresh tokens
});

// Función mejorada para iniciar sesión con Google
export const signInWithGoogle = async () => {
  try {
    // 1. Verificar servicios de Google Play (Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2. Iniciar sesión
    const { data } = await GoogleSignin.signIn();

    if (!data?.idToken) throw new Error("No se obtuvo token de Google");

    // 3. Autenticar con Supabase
    const { data: { session }, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: data.idToken,
    });

    if (error || !session) throw error || new Error("Sesión no creada");

    return session;
  } catch (error) {
    console.error("Error en login con Google:", error);
    
    // Manejo específico de errores
    switch (error as string) {
      case statusCodes.SIGN_IN_CANCELLED:
        throw new Error("Usuario canceló el login");
      case statusCodes.IN_PROGRESS:
        throw new Error("Operación ya en progreso");
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        throw new Error("Google Play Services no disponible");
      default:
        throw error;
    }
  }
};

// Función para cerrar sesión
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
};

// Función para obtener la sesión actual
export const getCurrentSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
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
    };

    // Insert chat
    const { data: chatData, error: chatError } = await supabase
      .from(TABLES.CHAT)
      .insert({
        ...chat,
        created_at: new Date().toISOString()

      })
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
      .select(`*,
        user_profile: sender_id (user_id, name, avatar)
        `)
      .eq('chat_id', chatId)
      .order('time', { ascending: false })
      .limit(100);

    if (error) throw error;
    const result = data.map((message: any) => ({
      chatId: message.chat_id,
      senderId: message.sender_id,
      senderName: message.user_profile?.name,
      text: message.text,
      time: message.time,
      status: message.status,
      id: message.id
    }))
    return result;
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (message: Omit<Message, 'id' | 'time' | 'status'>): Promise<Message | null> => {
  try {
    const newMessage: any = {
      text: message.text,
      time: new Date(),
      status: 'sent',
      chat_id: message.chatId,
      sender_id: message.senderId,
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
        *
      `)
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
      .eq('user_id', userId)
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

    const { data: { session } } = await supabase.auth.getSession();

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
  messageId: number,
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



// Función para crear o actualizar el perfil del usuario
export const upsertUserProfile = async (userProfile: UserProfile) => {
  try {
    const { data, error } = await supabase
      .from('user_profile')
      .upsert({
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        avatar: userProfile.avatar,
        age: userProfile.age,
        gender: userProfile.gender,
        status: userProfile.status,
        updated_at: new Date().toISOString(),
        userId: userProfile.userId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
};

// Función para actualizar el estado de la sesión del usuario
export const updateUserSessionStatus = async (userId: string, status: 'online' | 'offline') => {
  try {
    const { data, error } = await supabase
      .from('user_session')
      .upsert({
        user_id: userId,
        is_online: status === 'online',
        last_seen_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user session status:', error);
    return null;
  }
};

