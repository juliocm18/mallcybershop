import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { MessageChat } from './components/types';
import { UserProfile } from './models';
import { createChat, getChatByRecipientId, getChatMessages, getCurrentUser, getUserProfile } from './api/functions';
import { Chat } from './components/chat';

const PrivateChatScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [recipientUser, setRecipientUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  // Extraer parámetros con valores por defecto
  const userId = params.userId as string || 'unknown';

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);

        // Simular carga de datos (reemplazar con tu lógica real)
        const recipientUser = await getUserProfile(userId)
        const currentUser = await getCurrentUser()
        setCurrentUser(currentUser)
        setRecipientUser(recipientUser)
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId]);

  useEffect(() => {
    navigation.setOptions({
      title: recipientUser?.name || 'Usuario',
    });
  }, [recipientUser]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        if (!recipientUser?.id) return;
        let chat = await getChatByRecipientId(recipientUser.id);
        if (!chat?.id) {
          chat = await createChat({
            name: recipientUser.name,
            type: 'private',
            recipientId: recipientUser.id,
            country: recipientUser.country,
            city: recipientUser.city
          });
          if (chat?.id) {
            setChatId(chat.id);
          }
          setMessages([])
        } else {
          const messages = await getChatMessages(chat.id);
          setMessages(messages.map(message => ({
            ...message,
            isMe: message.senderId === currentUser?.id
          })));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading messages:', error);
        setIsLoading(false);
      }
    };

    if (recipientUser) {
      loadMessages();
    }
  }, [recipientUser?.id, currentUser]);

  const handleBackPress = () => {
    router.push('/chat/group');
  };

  if (isLoading || !currentUser || !recipientUser || !chatId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C5A" />
      </View>
    );
  }

  return (
    <Chat
      chatType="private"
      chatId={chatId}
      currentUser={currentUser}
      recipientUser={recipientUser}
      initialMessages={messages}
      onBack={handleBackPress}
    />
  );
};

export default PrivateChatScreen;