import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './chat.styles';
import { Message, UserChat, ChatProps } from './types';

const { width } = Dimensions.get('window');

export const generatePastelColor = (seed: string): string => {
  // Usamos el ID del usuario como semilla para generar un color consistente
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Generamos tonos pastel (valores HSL con alta luminosidad y saturación)
  const h = Math.abs(hash) % 360; // Matiz (0-359)
  const s = 70 + Math.abs(hash % 30); // Saturación (70-100%)
  const l = 80 + Math.abs(hash % 15); // Luminosidad (80-95%)

  return `hsl(${h}, ${s}%, ${l}%)`;
};

export const Chat: React.FC<ChatProps> = ({
  chatType,
  chatId,
  title = 'Chat',
  users = [],
  currentUser,
  initialMessages = [],
  onBack,
  onUserSelect,
}) => {
  // Estado local para mensajes
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  // Función para obtener el color del avatar
  const getAvatarColor = useCallback((userId: string) => {
    return generatePastelColor(userId);
  }, []);
  // Efecto para combinar mensajes iniciales con los de ejemplo si no hay iniciales
  useEffect(() => {
    if (initialMessages.length === 0) {
      const exampleMessages: Message[] = [
        {
          id: '1',
          text: chatType === 'group' ? '¡Hola a todos!' : `¡Hola! Soy ${currentUser?.name || 'Usuario'}`,
          sender: chatType === 'group' ? '1' : currentUser?.id || '1',
          isMe: false,
          time: new Date(Date.now() - 3600000),
          status: 'delivered'
        },
        {
          id: '2',
          text: chatType === 'group' ? '¿Cómo están?' : '¿Cómo estás?',
          sender: 'me',
          isMe: true,
          time: new Date(Date.now() - 1800000),
          status: 'read'
        }
      ];
      setMessages(exampleMessages);
    }
  }, [chatType, currentUser, initialMessages]);

  // Formatear hora del mensaje
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Enviar mensaje
  const handleSend = useCallback(() => {
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      isMe: true,
      time: new Date(),
      status: 'sent'
    };

    setMessages(prev => [newMsg, ...prev]);
    setNewMessage('');
  }, [newMessage]);

  // Cerrar sidebar
  const handleCloseSidebar = useCallback(() => {
    setShowUsers(false);
  }, []);

  // Seleccionar usuario para chat privado
  const handleUserPress = useCallback((userId: string) => {
    setShowUsers(false);
    const userSelected = users.find(user => user.id === userId)
    if (!userSelected) {
      return
    }
    if (onUserSelect) {
      onUserSelect(userSelected);
    }
  }, [onUserSelect]);

  // Determinar qué icono mostrar en el header
  const getHeaderIcon = () => {
    if (onBack) {
      return (
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      );
    }

    if (chatType === 'group') {
      return (
        <TouchableOpacity onPress={() => setShowUsers(true)}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      );
    }

    return <View style={{ width: 28 }} />;
  };

  // Renderizar mensaje individual
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const messageTime = formatTime(item.time);
    const sender = chatType === 'group'
      ? users.find(u => u.id === item.sender) || { id: item.sender, name: item.sender, status: 'online' }
      : item.isMe
        ? { id: currentUser?.id || '0', name: 'Tú', status: 'online' }
        : currentUser || { id: '', name: 'Usuario', status: 'online' };

    return (
      <View style={[
        styles.messageRow,
        item.isMe ? styles.myMessageRow : styles.otherMessageRow,
      ]}>
        {!item.isMe && chatType === 'group' && (
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => handleUserPress(sender.id)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {sender.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.messageColumn}>
          {!item.isMe && chatType === 'group' && (
            <Text style={styles.senderName}>{sender.name}</Text>
          )}
          <View style={styles.messageWithTime}>
            <View style={[
              styles.messageBubble,
              item.isMe ? styles.myBubble : styles.otherBubble,
            ]}>
              <Text style={item.isMe ? styles.myText : styles.otherText}>
                {item.text}
                {item.isMe && item.status === 'sent' && ' ✓'}
                {item.isMe && item.status === 'delivered' && ' ✓✓'}
              </Text>
            </View>
            <Text style={[
              styles.timeText,
              item.isMe ? styles.myTimeText : styles.otherTimeText
            ]}>
              {messageTime}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [chatType, currentUser, formatTime, handleUserPress, users]);

  // Renderizar item de usuario en el sidebar
  const renderUserItem = useCallback(({ item }: { item: UserChat }) => {
    const avatarColor = getAvatarColor(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => item.id !== currentUser?.id && handleUserPress(item.id)}
      >
        <View style={[styles.userAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.userAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userStatus}>
            {item.status === 'typing' ? 'Escribiendo...' :
              item.status === 'online' ? 'En línea' : 'Desconectado'}
          </Text>
        </View>
        {item.id !== currentUser?.id && (
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.status === 'online' ? '#4CAF50' : '#ccc' }
          ]} />
        )}
      </TouchableOpacity>
    );
  }, [handleUserPress, currentUser, getAvatarColor]);


  const renderSidebar = () => {
    if (chatType !== 'group' || !showUsers || !currentUser) return null;

    const myAvatarColor = getAvatarColor(currentUser.id);

    return (
      <View style={styles.sidebar}>
        {/* Tu perfil */}
        <View style={styles.myProfileContainer}>
          <View style={[styles.myProfileAvatar, { backgroundColor: myAvatarColor }]}>
            <Text style={styles.myProfileAvatarText}>
              {currentUser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.myProfileInfo}>
            <Text style={styles.myProfileName}>{currentUser.name}</Text>
            <Text style={styles.myProfileStatus}>
              {currentUser.status === 'online' ? 'En línea' : 'Desconectado'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeSidebarButton}
          onPress={() => setShowUsers(false)}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sidebarTitle}>Miembros ({users.length})</Text>

        <FlatList
          data={users.filter(user => user.id !== currentUser.id)}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.userList}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sidebar de usuarios (solo para grupo) */}
      {renderSidebar()}

      {/* Contenido principal del chat */}
      <TouchableWithoutFeedback onPress={handleCloseSidebar}>
        <View style={[
          styles.chatContainer,
          chatType === 'group' && showUsers && styles.chatContainerShifted
        ]}>
          {/* Cabecera */}
          <View style={styles.header}>
            {getHeaderIcon()}

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {chatType === 'private' && currentUser ? currentUser.name : title}
              </Text>
              {chatType === 'private' && currentUser?.status === 'typing' && (
                <Text style={styles.typingIndicator}>Escribiendo...</Text>
              )}
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* Lista de mensajes */}
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            inverted
          />

          {/* Entrada de mensaje */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={!newMessage.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={newMessage.trim() ? "#fff" : "#ccc"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};