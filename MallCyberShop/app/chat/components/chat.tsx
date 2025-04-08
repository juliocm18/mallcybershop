import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { MessageChat, } from './types';
import { useRouter } from 'expo-router';
import { Message, UserProfile } from '../models';
import { sendMessage, updateMessageLike } from '../api/functions';
import LottieView from 'lottie-react-native';
import heartAnimation from '../../../assets/animations/hearth.json';

export const generatePastelColor = (seed: string): { backgroundColor: string; color: string } => {
  // Usamos el ID del usuario como semilla para generar un color consistente
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Generamos tonos pastel (valores HSL con alta luminosidad y saturación)
  const h = Math.abs(hash) % 360; // Matiz (0-359)
  const s = 70 + Math.abs(hash % 30); // Saturación (70-100%)
  const l = 80 + Math.abs(hash % 15); // Luminosidad (80-95%)

  const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;

  // Determinamos el color del texto basado en la luminosidad del fondo
  // Si la luminosidad es mayor a 60%, el texto será oscuro (negro o casi negro), de lo contrario será claro (blanco o casi blanco)
  const textColor = l > 60 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 95%)';

  return {
    backgroundColor,
    color: textColor
  };
};

export interface ChatProps {
  chatType: 'group' | 'private';
  chatId: string;
  title?: string;
  users?: UserProfile[];
  currentUser?: UserProfile;
  recipientUser?: UserProfile;
  initialMessages?: MessageChat[];
  onBack?: () => void;
  onUserSelect?: (user: UserProfile) => void;
}

export const CHAT_TYPES = {
  GROUP: 'group',
  PRIVATE: 'private'
};

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
};

export const USER_STATUS = {
  ONLINE: 'online',
  TYPING: 'typing',
  OFFLINE: 'offline'
};

export const Chat: React.FC<ChatProps> = ({
  chatType,
  chatId,
  title = 'Chat',
  users = [],
  currentUser,
  recipientUser,
  initialMessages = [],
  onBack,
  onUserSelect,
}) => {

  const [messages, setMessages] = useState<MessageChat[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [activeAnimationId, setActiveAnimationId] = useState<number | null>(null);
  const animationRefs = useRef<{ [key: string]: LottieView | null }>({});
  const router = useRouter();
  // Función para obtener el color del avatar
  const getAvatarColor = useCallback((userId: string) => {
    return generatePastelColor(userId);
  }, []);
  // // Efecto para combinar mensajes iniciales con los de ejemplo si no hay iniciales
  // useEffect(() => {
  //   if (initialMessages.length === 0) {
  //     const exampleMessages: MessageChat[] = [
  //       {
  //         id: '1',
  //         chatId,
  //         text: chatType === 'group' ? '¡Hola a todos!' : `¡Hola! Soy ${currentUser?.name || 'Usuario'}`,
  //         senderId: chatType === 'group' ? '1' : currentUser?.id || '1',
  //         isMe: false,
  //         time: new Date(Date.now() - 3600000),
  //         status: 'delivered',
  //         createdBy: chatType === 'group' ? '1' : currentUser?.id || '1',
  //         updatedBy: chatType === 'group' ? '1' : currentUser?.id || '1',

  //       },
  //       {
  //         id: '2',
  //         chatId,
  //         text: chatType === 'group' ? '¿Cómo están?' : '¿Cómo estás?',
  //         senderId: 'me',
  //         isMe: true,
  //         time: new Date(Date.now() - 1800000),
  //         status: 'read',
  //         createdBy: currentUser?.id || '1',
  //         updatedBy: currentUser?.id || ''
  //       }
  //     ];
  //     setMessages(exampleMessages);
  //   }
  // }, [chatType, currentUser, initialMessages]);

  // Formatear hora del mensaje
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const handleLike = useCallback(async (messageId: number) => {
    if (!currentUser?.id) return;

    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          const isLiked = !msg.isLiked;

          // Solo mostrar animación si estamos dando like (no al quitar like)
          if (isLiked && !msg.isLiked) {
            setActiveAnimationId(messageId);
            setTimeout(() => setActiveAnimationId(null), 2000);
          }

          // Actualizar el mensaje localmente
          const updatedMsg: MessageChat = {
            ...msg,
            isLiked,
            likes: isLiked && currentUser.id
              ? [...(msg.likes || []), currentUser.id]
              : (msg.likes || []).filter(id => id !== currentUser.id)
          };

          if (!currentUser.id) return updatedMsg;

          // Enviar la actualización al servidor
          updateMessageLike(messageId, currentUser.id, isLiked)
            .catch(console.error);

          return updatedMsg;
        }
        return msg;
      });
    });
  }, [currentUser]);

  // Enviar mensaje
  const handleSend = useCallback(async () => {
    if (!newMessage.trim()
      // || !currentUser?.id
    ) return;

    const newMsg: Message = {
      chatId,
      text: newMessage,
      senderId: currentUser?.id || 'bb353e09-30b2-46d6-9cf7-2c88a2e55434',
      time: new Date(),
      status: 'sent'
    };
    try {
      const saveMessage = await sendMessage(newMsg);
      setMessages(prev => [{ ...newMsg, id: saveMessage?.id, isMe: true, senderName: currentUser?.name || 'Yo' }, ...prev] as MessageChat[]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, currentUser]);

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

    if (chatType === CHAT_TYPES.GROUP) {
      return (
        <TouchableOpacity onPress={() => setShowUsers(true)}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      );
    }

    return <View style={{ width: 28 }} />;
  };

  // Renderizar mensaje individual
  const renderMessage = useCallback(({ item }: { item: MessageChat }) => {
    if (!item.id) return null;
    console.log("item---> renderMessage---> ", item)
    const messageTime = formatTime(item.time);

    const avatarColor = getAvatarColor(item.senderId || '');
    // const isLikedByMe = item.likes?.includes(currentUser?.id || '') || false;
    const isLikedByMe = false;


    return (
      <View style={[
        styles.messageRow,
        item.isMe ? styles.myMessageRow : styles.otherMessageRow,
      ]}>
        {!item.isMe && chatType === CHAT_TYPES.GROUP && (
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => handleUserPress(item.senderId || '')}
          >
            <View style={[styles.avatar, { backgroundColor: avatarColor.backgroundColor }]}>
              <Text style={[styles.avatarText, { color: avatarColor.color }]}>
                {item?.senderName?.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.messageColumn}>
          {!item.isMe && chatType === CHAT_TYPES.GROUP && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <View style={styles.messageWithTime}>
            <View style={[
              styles.messageBubble,
              item.isMe ? styles.myBubble : styles.otherBubble,
            ]}>
              <Text style={item.isMe ? styles.myText : styles.otherText}>
                {item.text}
              </Text>
              <View style={styles.messageFooter}>
                <Text style={[
                  styles.timeText,
                  item.isMe ? styles.myTimeText : styles.otherTimeText
                ]}>
                  {messageTime}
                </Text>

                {/* Botón de like */}
                <TouchableOpacity
                  onPress={() => handleLike(item?.id || 0)}
                  style={styles.likeButton}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name="heart"
                    size={16}
                    color={isLikedByMe ? "#ff3e3e" : "#ccc"}
                    solid={isLikedByMe}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* Estado del mensaje (checkmarks) debajo del texto */}
            {/* {item.isMe && (
              <View style={styles.messageStatusContainer}>
                <Text style={[
                  styles.messageStatusText,
                  item.status === MESSAGE_STATUS.SENT && styles.sentStatus,
                  item.status === MESSAGE_STATUS.DELIVERED && styles.deliveredStatus,
                ]}>
                  {item.status === MESSAGE_STATUS.SENT && '✓'}
                  {item.status === MESSAGE_STATUS.DELIVERED && '✓✓'}
                </Text>
              </View>
            )}
            <Text style={[
              styles.timeText,
              item.isMe ? styles.myTimeText : styles.otherTimeText
            ]}>
              {messageTime} {item.isMe && (<Text style={[
                styles.messageStatusText,
                item.status === MESSAGE_STATUS.SENT && styles.sentStatus,
                item.status === MESSAGE_STATUS.DELIVERED && styles.deliveredStatus,
              ]}>
                {item.status === MESSAGE_STATUS.SENT && '✓'}
                {item.status === MESSAGE_STATUS.DELIVERED && '✓✓'}
              </Text>)}
            </Text> */}
            {item.id && activeAnimationId === item.id && (
              <View style={styles.likeAnimationContainer}>
                <LottieView
                  ref={ref => animationRefs.current[item.id || 0] = ref}
                  source={heartAnimation}
                  autoPlay
                  loop={false}
                  style={styles.likeAnimation}
                  onAnimationFinish={() => setActiveAnimationId(null)}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }, [messages, chatType, currentUser, handleLike, activeAnimationId]);

  // Renderizar item de usuario en el sidebar
  const renderUserItem = useCallback(({ item }: { item: UserProfile }) => {
    const avatarColor = getAvatarColor(item.id || '0');

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => item.id !== currentUser?.id && handleUserPress(item.id || '')}
      >
        <View style={[styles.userAvatar, { backgroundColor: avatarColor.backgroundColor }]}>
          <Text style={[styles.userAvatarText, { color: avatarColor.color }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userStatus}>
            {item.status === USER_STATUS.TYPING ? 'Escribiendo...' :
              item.status === USER_STATUS.ONLINE ? 'En línea' : 'Desconectado'}
          </Text>
        </View>
        {item.id !== currentUser?.id && (
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.status === USER_STATUS.ONLINE ? '#4CAF50' : '#ccc' }
          ]} />
        )}
      </TouchableOpacity>
    );
  }, [handleUserPress, currentUser, getAvatarColor]);


  const renderSidebar = () => {
    if (chatType !== 'group' || !showUsers) return null;

    // TypeScript now knows currentUser is defined here
    const myAvatarColor = getAvatarColor(currentUser?.id || '0');

    return (
      <View style={styles.sidebar}>
        {/* Tu perfil */}
        <View style={styles.myProfileContainer}>
          <View style={[styles.myProfileAvatar, { backgroundColor: myAvatarColor.backgroundColor }]}>
            <Text style={[styles.myProfileAvatarText, { color: myAvatarColor.color }]}>
              {currentUser?.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.myProfileInfo}>
            <Text style={styles.myProfileName}>{currentUser?.name}</Text>
            <Text style={styles.myProfileStatus}>
              {currentUser?.status === USER_STATUS.ONLINE ? 'En línea' : 'Desconectado'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeSidebarButton}
          onPress={() => setShowUsers(false)}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sidebarTitle}>Conectados ({users.length})</Text>

        <FlatList
          data={users.filter(user => user.id !== currentUser?.id)}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id || ''}
          contentContainerStyle={styles.userList}
        />
        <View style={styles.footerButtonContainer}>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => {
              // Aquí colocas la lógica para navegar a la pantalla de inicio
              router.push("/home/home");
              setShowUsers(false); // Opcional: cerrar el sidebar al navegar
            }}
          >
            <Text style={styles.backToHomeButtonText}>Volver a inicio</Text>
          </TouchableOpacity>
        </View>
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
          chatType === CHAT_TYPES.GROUP && showUsers && styles.chatContainerShifted
        ]}>
          {/* Cabecera */}
          <View style={styles.header}>
            {getHeaderIcon()}

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {chatType === CHAT_TYPES.PRIVATE && recipientUser ? recipientUser.name : title}
              </Text>
              {chatType === CHAT_TYPES.PRIVATE && recipientUser?.status === USER_STATUS.TYPING && (
                <Text style={styles.typingIndicator}>Escribiendo...</Text>
              )}
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* Lista de mensajes */}
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
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