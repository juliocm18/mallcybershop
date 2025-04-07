import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Chat, USER_STATUS } from './components/chat';
import { useRouter } from 'expo-router';
import { MessageChat } from './components/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './models';
import { createChat, getChatByCountryAndCity, getChatMessages, getOnlineUsersByChatLocation } from './api/functions';

const GroupChatScreen: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [department, setDepartment] = useState('La Libertad');
  const [country, setCountry] = useState('Perú');
  const [title, setTitle] = useState('');
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    const loadLocationZone = async () => {
      const department = (await AsyncStorage.getItem("department") || "La Libertad");
      const country = (await AsyncStorage.getItem("country") || "Perú");
      setDepartment(department);
      setCountry(country);
      setTitle(`${country} - ${department}`);
    }
    loadLocationZone();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await getOnlineUsersByChatLocation(chatId, true);
      setUsers(users);
    };
    if (chatId) {
      loadUsers();
    }
  }, [chatId]);

  useEffect(() => {
    const loadMessages = async () => {
      const chat = await getChatByCountryAndCity(country, department);
      if (chat && chat.id) {
        setChatId(chat.id);
        const messages = await getChatMessages(chat.id);
        setMessages(messages.map(message => ({
          ...message,
          isMe: message.senderId === currentUser?.id,
          sender: currentUser || { id: '', name: 'Usuario', status: 'online' }
        })));
      } else {
        setMessages([]);
        const chat = await createChat({
          name: title,
          type: 'group',
          country: country,
          city: department
        }); 
        if (chat && chat.id) {
          setChatId(chat.id);
        }
      }
    };
    if (country && department && currentUser) {
      loadMessages();
    }
  }, [country, department, currentUser]);

  const handleUserPress = (user: UserProfile) => {
    setIsLoading(true);
    setTimeout(() => {
      if (!user.id) return;
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
      chatId={chatId}
      title={title}
      users={users}
      initialMessages={messages}
      currentUser={currentUser!}
      onUserSelect={handleUserPress}
    />
  );
};

export default GroupChatScreen;