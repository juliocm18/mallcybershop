import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  TouchableWithoutFeedback,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './chat.styles';
import { MessageChat, } from './types';
import { useRouter } from 'expo-router';
import { Message, UserProfile } from '../models';
import { getCurrentSession, getCurrentUser, sendMessage, updateMessageLike, updateUserSessionStatus, upsertUserProfile } from '../api/functions';
import LottieView from 'lottie-react-native';
import heartAnimation from '../../../assets/animations/hearth.json';
import { globalStyles } from "../../styles";
import { pickImage, uploadImage } from '@/app/company/functions';
import UserFunctions from '@/app/user/functions';
import { useAuth } from '@/app/context/AuthContext';
import { ActivityIndicator } from 'react-native-paper';
import Select from '@/app/components/select';
import gendersData from '@/app/chat/genders.json';

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

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfileData, setUserProfileData] = useState({
    age: '',
    gender: 'hombre'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(currentUser || null);
  const animationRefs = useRef<{ [key: string]: LottieView | null }>({});

  /* User Profile attributes */
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string>('');
  const [userProfileName, setUserProfileName] = useState<string>('');
  const [userProfilePassword, setUserProfilePassword] = useState<string>('');
  const [userProfileEmail, setUserProfileEmail] = useState<string>('');
  const [userProfileAvatar, setUserProfileAvatar] = useState<string | null>(null);
  const [userProfileStatus, setUserProfileStatus] = useState<string>('');
  const [userProfileCity, setUserProfileCity] = useState<string>('');
  const [userProfileCountry, setUserProfileCountry] = useState<string>('');
  const [userProfileAge, setUserProfileAge] = useState<number | null>(null);
  const [userProfileGender, setUserProfileGender] = useState<string>('');
  const [userProfileUserId, setUserProfileUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickImage(); // 📥 Llamamos a la función externa
    if (uri) {
      setUserProfileAvatar(uri); // ✅ Guardamos la imagen en useState
    }
  };


  const handleSave = async () => {
    if (!userProfileName || !userProfileEmail || !userProfileAvatar || !userProfilePassword) {
      Alert.alert("Error", "Campos requeridos");
      return;
    }
    setLoading(true);

    try {
      if (!userProfileAvatar) {
        Alert.alert("Error", "Seleccione un avatar");
        return;
      }
      const uploadedUrl = await uploadImage(userProfileAvatar);
      // console.log("uploadedUrl", uploadedUrl);
      if (uploadedUrl) {
        console.log("📤 Imagen subida con éxito:", uploadedUrl);
      } else {
        return;
      }

      const userCreated = await UserFunctions.save(userProfileEmail, userProfilePassword);
      console.log("userCreated", userCreated)

      const newUserProfile = {
        name: userProfileName,
        avatar: uploadedUrl,
        age: userProfileAge || 0,
        gender: userProfileGender,
        status: 'online' as 'online' | 'offline' | 'typing',
        city: userProfileCity,
        country: userProfileCountry,
        email: userProfileEmail,
        userId: userCreated.id
      };

      const profile = await upsertUserProfile(newUserProfile);
      Alert.alert("Aviso", "Registro creado con éxito");

      const userLogged = await signIn(userProfileEmail, userProfilePassword);
      if(userLogged){
        setIsAuthenticated(true);
        //const profile = await handleUserProfile(session.user);
        console.log("Profile", profile)
        if (profile && profile.id) {
          setCurrentUserProfile(profile);
          await updateUserSessionStatus(profile.id, 'online');
        }
      }
      // if (userLogged && userLogged.id) {
      //   const roles = await RoleFunctions.getByUser(userLogged.id);
      //   roles ? (userLogged.roles = roles) : (userLogged.roles = []);
      // }

      // Limpiar los campos después de un registro exitoso
      //clearFields();

      setShowLoginModal(false);
      //loadCompanies(true);

    } catch (error: any) {
      console.error("Error creating company:", error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  /* User Profile attributes */


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
        if (profile && profile.id) {
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


  // const handleGoogleLogin = async () => {
  //   console.log("handleGoogleLogin")
  // }

  // Manejar inicio de sesión con Google
  //  const handleGoogleLogin = async () => {
  //   try {
  //     const session = await signInWithGoogle();
  //     console.log("Session Google", session)
  //     if (session) {
  //       setIsAuthenticated(true);
  //       const profile = await handleUserProfile(session.user);
  //       console.log("Profile", profile)
  //       if (profile && profile.id) {
  //         setCurrentUserProfile(profile);
  //         await updateUserSessionStatus(profile.id, 'online');
  //       }

  //       setShowLoginModal(false);
  //     }
  //   } catch (error) {
  //     console.error('Error en login con Google:', error);
  //     Alert.alert('Error', error as string || 'Ocurrió un error al iniciar sesión');
  //   }
  // };

  // Manejar el perfil del usuario (crear o actualizar)
  const handleUserProfile = async (user: any) => {
    if (!user) return null;

    // Verificar si ya tiene perfil completo
    const existingProfile = await getCurrentUser();
    console.log("Existing Profile", existingProfile)
    if (existingProfile && existingProfile.age && existingProfile.gender) {
      return existingProfile;
    }

    // Si no tiene perfil completo, mostrar modal para completar datos
    // setUserProfileData({
    //   age: '',
    //   gender: existingProfile?.gender || 'hombre'
    // });
    // setShowProfileModal(true);

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
    if (!currentUserProfile?.id) return;

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
            likes: isLiked && currentUserProfile.id
              ? [...(msg.likes || []), currentUserProfile.id]
              : (msg.likes || []).filter(id => id !== currentUserProfile.id)
          };

          if (!currentUserProfile.id) return updatedMsg;

          // Enviar la actualización al servidor
          updateMessageLike(messageId, currentUserProfile.id, isLiked)
            .catch(console.error);

          return updatedMsg;
        }
        return msg;
      });
    });
  }, [currentUserProfile]);

  // Enviar mensaje
  const handleSend = useCallback(async () => {
    if (!newMessage.trim()) return;

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
                  style={{ opacity: isLikedByMe ? 1 : 0.5 }}
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
                  ref={animationRefs.current[item.id || 0]}
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
        currentUserId={currentUserProfile?.id}
        activeAnimationId={activeAnimationId}
      />
    );
  }, [chatType, currentUserProfile?.id, handleLike, handleUserPress, activeAnimationId, getAvatarColor]);

  // Renderizar item de usuario en el sidebar
  const renderUserItem = useCallback(({ item }: { item: UserProfile }) => {
    const avatarColor = getAvatarColor(item.id || '0');

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => item.id !== currentUserProfile?.id && handleUserPress(item.id || '')}
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
        {item.id !== currentUserProfile?.id && (
          <View style={[
            styles.onlineIndicator,
            { backgroundColor: item.status === USER_STATUS.ONLINE ? '#4CAF50' : '#ccc' }
          ]} />
        )}
      </TouchableOpacity>
    );
  }, [handleUserPress, currentUserProfile, getAvatarColor]);


  const renderSidebar = () => {
    if (chatType !== 'group' || !showUsers) return null;

    // TypeScript now knows currentUser is defined here
    const myAvatarColor = getAvatarColor(currentUserProfile?.id || '0');

    return (
      <View style={styles.sidebar}>
        {/* Tu perfil */}
        <View style={styles.myProfileContainer}>
          <View style={[styles.myProfileAvatar, { backgroundColor: myAvatarColor.backgroundColor }]}>
            <Text style={[styles.myProfileAvatarText, { color: myAvatarColor.color }]}>
              {currentUserProfile?.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.myProfileInfo}>
            <Text style={styles.myProfileName}>{currentUserProfile?.name}</Text>
            <Text style={styles.myProfileStatus}>
              {currentUserProfile?.status === USER_STATUS.ONLINE ? 'En línea' : 'Desconectado'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeSidebarButton}
          onPress={() => setShowUsers(false)}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.sidebarTitle}>Usuarios en linea ({users.length})</Text>

        <FlatList
          data={users.filter(user => user.id !== currentUserProfile?.id)}
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

        <View style={globalStyles.modalContainer}>
          <View style={globalStyles.modalContent}>
            <Text style={globalStyles.modalTitle}>
              Registro de Usuario
            </Text>
            <Text>
              Para enviar mensajes, por favor registrate como usuario.
            </Text>

            <TextInput
              placeholder="Ingrese su nombre completo"
              style={globalStyles.input}
              value={userProfileName}
              onChangeText={setUserProfileName}
            />


            <TextInput
              style={globalStyles.input}
              placeholder="Ingrese su correo electrónico"
              value={userProfileEmail}
              onChangeText={setUserProfileEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />


            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingrese su password"
                value={userProfilePassword}
                onChangeText={setUserProfilePassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={24}
                />
              </TouchableOpacity>
            </View>

            {userProfileAvatar && (
              <Image source={{ uri: userProfileAvatar }} style={styles.logoPreview} />
            )}



            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
            >
              <Text style={styles.imagePickerText}>Seleccione una foto</Text>
            </TouchableOpacity>

            <Select
              label="sexo"
              selectedValue={userProfileGender}
              onValueChange={setUserProfileGender}
              items={gendersData}
            />


            <View style={globalStyles.modalButtonContainer}>
              <TouchableOpacity
                style={globalStyles.modalUpdateButton}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={globalStyles.modalButtonText}>
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={globalStyles.modalCancelButton}
                onPress={() => setShowLoginModal(false)}
                disabled={loading}
              >
                <Text style={globalStyles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </Modal>

      {/* <Modal
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
      </Modal> */}
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