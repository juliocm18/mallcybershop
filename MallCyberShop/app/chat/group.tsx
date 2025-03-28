import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Chat } from './components/chat';
import { useRouter } from 'expo-router';
import { UserChat, Message } from './components/types';

const GroupChatScreen: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const currentUser: UserChat = {
    id: 'user-123', // ID único
    name: 'Tu Nombre',
    status: 'online'
  };
  // Datos de ejemplo para el chat grupal
  const groupUsers: UserChat[] = [
    { id: '1', name: 'María', status: 'online', lastSeen: new Date().toISOString() },
    { id: '2', name: 'Juan', status: 'typing', lastSeen: new Date().toISOString() },
    { id: '3', name: 'Pedro', status: 'online', lastSeen: new Date().toISOString() },
    currentUser
  ];

  // Mensajes iniciales de ejemplo
  const initialMessages: Message[] = [
    {
      id: '1',
      text: '¡Hola a todos! ¿Cómo están?',
      sender: '1',
      isMe: false,
      time: new Date(Date.now() - 3600000),
      status: 'delivered'
    },
    {
      id: '2',
      text: '¿Alguien ha revisado el último proyecto?',
      sender: '3',
      isMe: false,
      time: new Date(Date.now() - 1800000),
      status: 'delivered'
    },
    {
      id: '3',
      text: 'Sí, yo lo revisé ayer por la tarde',
      sender: '4',
      isMe: true,
      time: new Date(Date.now() - 900000),
      status: 'read'
    }
  ];

  const handleUserPress = (user: UserChat) => {
    setIsLoading(true);
    setTimeout(() => {
      router.push({
        pathname: '/chat/[user]',
        params: { 
          user: user.id,
          userName: user.name,
          userStatus: user.status
        }
      });
      setIsLoading(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C5A" />
      </View>
    );
  }

  return (
    <Chat
      chatType="group"
      chatId="group1"
      title="Ciudad"
      users={groupUsers}
      initialMessages={initialMessages}
      currentUser={currentUser}
      onUserSelect={handleUserPress}
    />
  );
};

export default GroupChatScreen;