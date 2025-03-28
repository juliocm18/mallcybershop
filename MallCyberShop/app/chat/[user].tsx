import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Chat } from './components/chat';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { UserChat, Message } from './components/types';

const PrivateChatScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Extraer parámetros con valores por defecto
  const userId = params.userId as string || 'unknown';
  const userName = params.userName as string || 'Usuario';
  const userStatus = params.userStatus as 'online' | 'offline' | 'typing' || 'online';

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      
      // Simular carga de datos (reemplazar con tu lógica real)
      setTimeout(() => {
        setCurrentUser({
          id: userId,
          name: userName,
          status: userStatus,
          lastSeen: new Date().toISOString()
        });

        // Mensajes de ejemplo
        setMessages([
          {
            id: '1',
            text: `¡Hola! Soy ${userName}`,
            sender: userId,
            isMe: false,
            time: new Date(Date.now() - 86400000), // 1 día atrás
            status: 'read'
          },
          {
            id: '2',
            text: 'Hola, ¿cómo estás?',
            sender: 'me',
            isMe: true,
            time: new Date(Date.now() - 43200000), // 12 horas atrás
            status: 'read'
          },
          {
            id: '3',
            text: '¿Vas a ir a la reunión mañana?',
            sender: userId,
            isMe: false,
            time: new Date(Date.now() - 3600000), // 1 hora atrás
            status: 'delivered'
          }
        ]);

        setIsLoading(false);
      }, 500);
    };

    loadInitialData();

    // Configurar opciones de navegación
    navigation.setOptions({
      title: userName,
    });
  }, [userId, userName, userStatus]);

  const handleBackPress = () => {
    router.push('/chat/group');
  };

  if (isLoading || !currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C5A" />
      </View>
    );
  }

  return (
    <Chat
      chatType="private"
      chatId={`private_${userId}`}
      currentUser={currentUser}
      initialMessages={messages}
      onBack={handleBackPress}
    />
  );
};

export default PrivateChatScreen;