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
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './chat.styles';
import { MessageChat, } from './types';
import { useRouter } from 'expo-router';
import { Message, UserProfile } from '../models';
import { getCurrentSession, getCurrentUser, sendMessage, signInWithGoogle, updateMessageLike, updateUserSessionStatus, upsertUserProfile } from '../api/functions';
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

  const [messages, setMessages] = useState<MessageChat[]>(() =>
    initialMessages.map(msg => ({
      ...msg,
      formattedTime: new Date(msg.time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }))
  );
  const [newMessage, setNewMessage] = useState('');
  const [showUsers, setShowUsers] = useState(false);
  const [activeAnimationId, setActiveAnimationId] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfileData, setUserProfileData] = useState({
    age: '',
    gender: 'male'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(currentUser || null);
  const animationRefs = useRef<{ [key: string]: LottieView | null }>({});
  const router = useRouter();
  // Función para obtener el color del avatar
  const getAvatarColor = useCallback((userId: string) => {
    return generatePastelColor(userId);
  }, []);
  // // Efecto para combinar mensajes iniciales con los de ejemplo si no hay iniciales
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Verificar la sesión al cargar el componente
  useEffect(() => {
    const checkSession = async () => {
      const session = await getCurrentSession();
      if (session) {
        setIsAuthenticated(true);
        // Obtener o crear el perfil del usuario
        const profile = await handleUserProfile(session.user);
        if (profile) {
          setCurrentUserProfile(profile);
          // Actualizar estado de sesión a "online"
          await updateUserSessionStatus(profile.id, 'online');
        }
      }
    };

    checkSession();

    return () => {
      // Al desmontar el componente, actualizar estado a "offline"
      if (currentUserProfile?.id) {
        updateUserSessionStatus(currentUserProfile.id, 'offline');
      }
    };
  }, []);

   // Manejar inicio de sesión con Google
   const handleGoogleLogin = async () => {
    const result = await signInWithGoogle();
    if (result) {
      // Esperamos un momento para dar tiempo a que Supabase actualice la sesión
      setTimeout(async () => {
        const session = await getCurrentSession();
        if (session?.user) {
          setIsAuthenticated(true);
          const profile = await handleUserProfile(session.user);
          if (profile) {
            setCurrentUserProfile(profile);
            await updateUserSessionStatus(profile.id, 'online');
          }
          setShowLoginModal(false);
        }
      }, 1000); // Pequeño delay para asegurar la actualización
    }
  };

  // Manejar el perfil del usuario (crear o actualizar)
  const handleUserProfile = async (user: any) => {
    if (!user) return null;

    // Verificar si ya tiene perfil completo
    const existingProfile = await getCurrentUser();
    if (existingProfile && existingProfile.age && existingProfile.gender) {
      return existingProfile;
    }

    // Si no tiene perfil completo, mostrar modal para completar datos
    setUserProfileData({
      age: '',
      gender: existingProfile?.gender || 'male'
    });
    setShowProfileModal(true);

    // Crear/actualizar perfil con datos básicos
    const profileData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      avatar: user.user_metadata?.avatar_url,
      status: 'online' as 'online' | 'offline' | 'typing'

    };

    return await upsertUserProfile(profileData);
  };

  // Manejar envío de datos del perfil
  const handleProfileSubmit = async () => {
    if (!userProfileData.age || !userProfileData.gender) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const session = await getCurrentSession();
    if (!session?.user) {
      Alert.alert('Error', 'No hay sesión activa');
      return;
    }

    const profile = await upsertUserProfile({
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.email,
      email: session.user.email,
      avatar: session.user.user_metadata?.avatar_url,
      age: parseInt(userProfileData.age),
      gender: userProfileData.gender,
      status: 'online'
    });

    if (profile) {
      setCurrentUserProfile(profile);
      setShowProfileModal(false);
    }
  };

  // Formatear hora del mensaje
  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    if (!newMessage.trim() || !currentUserProfile?.id) return;

    // Verificar si el usuario está autenticado
    if (!isAuthenticated || !currentUserProfile) {
      setShowLoginModal(true);
      return;
    }

    // Verificar si el perfil está completo
    if (!currentUserProfile.age || !currentUserProfile.gender) {
      setShowProfileModal(true);
      return;
    }

    const newMsg: Message = {
      chatId,
      text: newMessage,
      senderId: currentUserProfile.id as string,
      time: new Date(),
      status: 'sent'
    };
    try {
      const saveMessage = await sendMessage(newMsg);
      setMessages(prev => [{ ...newMsg, id: saveMessage?.id, isMe: true, senderName: currentUserProfile.name || 'Yo' }, ...prev] as MessageChat[]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [newMessage, currentUserProfile, isAuthenticated]);

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


  const MessageItem = React.memo(({ item, isGroup, isMe, onLike, onUserPress, avatarColor, currentUserId, activeAnimationId }: {
    item: MessageChat;
    isGroup: boolean;
    isMe: boolean;
    onLike: (id: number) => void;
    onUserPress: (userId: string) => void;
    avatarColor: { backgroundColor: string; color: string };
    currentUserId?: string;
    activeAnimationId: number | null;
  }) => {
    if (!item.id) return null;

    const messageTime = formatTime(item.time);
    const isLikedByMe = item.likes?.includes(currentUserId || '') || false;

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.otherMessageRow]}>
        {!item.isMe && isGroup && (
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
          {!item.isMe && isGroup && (
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
            </View>
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
  });

  const renderMessage = useCallback(({ item }: { item: MessageChat }) => {
    const avatarColor = getAvatarColor(item.senderId || '');
    return (
      <MessageItem
        item={item}
        isGroup={chatType === CHAT_TYPES.GROUP}
        isMe={item.isMe}
        onLike={handleLike}
        onUserPress={handleUserPress}
        avatarColor={avatarColor}
        currentUserId={currentUser?.id}
        activeAnimationId={activeAnimationId}
      />
    );
  }, [chatType, currentUser?.id, handleLike, handleUserPress, activeAnimationId, getAvatarColor]);

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
      {/* Modales para login y perfil */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Iniciar sesión</Text>
            <Text style={styles.modalText}>
              Para enviar mensajes, por favor inicia sesión con Google.
            </Text>

            <TouchableOpacity
              style={styles.googleLoginButton}
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={24} color="#fff" />
              <Text style={styles.googleLoginButtonText}>Iniciar sesión con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Completa tu perfil</Text>

            <Text style={styles.modalLabel}>Edad</Text>
            <TextInput
              style={styles.modalInput}
              value={userProfileData.age}
              onChangeText={(text) => setUserProfileData({ ...userProfileData, age: text })}
              placeholder="Tu edad"
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Género</Text>
            <View style={styles.genderOptions}>
              <TouchableOpacity
                style={[
                  styles.genderOption,
                  userProfileData.gender === 'male' && styles.genderOptionSelected
                ]}
                onPress={() => setUserProfileData({ ...userProfileData, gender: 'male' })}
              >
                <Text>Hombre</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  userProfileData.gender === 'female' && styles.genderOptionSelected
                ]}
                onPress={() => setUserProfileData({ ...userProfileData, gender: 'female' })}
              >
                <Text>Mujer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderOption,
                  userProfileData.gender === 'other' && styles.genderOptionSelected
                ]}
                onPress={() => setUserProfileData({ ...userProfileData, gender: 'other' })}
              >
                <Text>Otro</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleProfileSubmit}
            >
              <Text style={styles.modalSubmitButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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