import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Chat, USER_STATUS } from './components/chat';
import { useRouter } from 'expo-router';
import { MessageChat } from './components/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from './models';
import { createChat, getChatByCountryAndCity, getChatMessages, getCurrentUser, getOnlineUsersByChatLocation, updateUserProfile, updateUserSessionStatus } from './api/functions';

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
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.id) {
          setCurrentUser(user);
          await updateUserSessionStatus(user.id, USER_STATUS.ONLINE as 'online' | 'offline' , country, department);
        }
      } catch (error) {
        console.log(error, 'error al cargar el usuario actual');
      }
    };
    if (chatId) {
      loadUsers();
      loadCurrentUser();
    }
  }, [chatId]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const chat = await getChatByCountryAndCity(country, department);
        if (chat && chat.id) {
          setChatId(chat.id);
          const messages = await getChatMessages(chat.id);
          setMessages(messages.map(message => ({
            ...message,
            isMe: message.senderId === (currentUser?.id || 'bb353e09-30b2-46d6-9cf7-2c88a2e55434'),
            sender: { id: message.senderId, name: message.senderName, status: 'online' },
          } as MessageChat)));
        } else {
          setMessages([]);
          const chat = await createChat({
            name: title,
            type: 'group',
            country: country,
            city: department,
          });
          if (chat && chat.id) {
            setChatId(chat.id);
          }
        }
      } catch (error) {
        console.log(error, 'error al cargar los mensajes')
      }

    };
    if (country && department && title) {
      loadMessages();
    }
  }, [title, country, department]);

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