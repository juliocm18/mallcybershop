import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  SafeAreaView
} from 'react-native';
import { supabase } from '@/app/supabase';
import { Message, ChatRoomProps, UserProfile, RoomDetails, RoomResponse } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { OnlineUsersDrawer } from './components/OnlineUsersDrawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const ChatRoom: React.FC<ChatRoomProps> = ({
  roomId,
  currentUser,
  recipientId,
  onParticipantSelect,
  chatType = 'group'
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef(new Set<string>());
  const flatListRef = useRef<FlatList>(null);

  const addMessage = (newMessage: Message) => {
    // Check if message already exists
    if (!messageIdsRef.current.has(newMessage.id)) {
      messageIdsRef.current.add(newMessage.id);
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const transformMessage = (msg: any): Message => ({
    id: msg.id,
    content: msg.content,
    created_at: msg.created_at,
    room_id: msg.room_id,
    user_id: msg.user_id,
    recipient_id: msg.recipient_id,
    is_private: msg.is_private,
    user: {
      name: msg.user?.name || 'Unknown',
      avatar_url: msg.user?.avatar_url
    }
  });

  const fetchMessages = async () => {
    try {
      if (!actualRoomId) {
        console.log('No valid room ID available yet');
        return;
      }

      let query = supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          room_id,
          user_id,
          recipient_id,
          is_private,
          user:profiles!messages_user_id_fkey (
            name,
            avatar_url
          )
        `)
        .eq('room_id', actualRoomId)
        .order('created_at', { ascending: true });

      if (chatType === 'individual') {
        // For private chats, get messages between both users in either direction
        query = query.or(
          `and(user_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),` +
          `and(user_id.eq.${recipientId},recipient_id.eq.${currentUser.id})`
        );
      }

      const { data: messages, error } = await query;

      if (error) {
        throw error;
      }

      if (messages) {
        const transformedMessages = messages.map(transformMessage);
        messageIdsRef.current = new Set(transformedMessages.map(msg => msg.id));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Subscribe to new messages in the room
    const channel = supabase
      .channel('room_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${actualRoomId}`
        },
        (payload) => {
          //console.log('New message received:', payload);
          // Fetch the complete message with user info
          const fetchNewMessage = async () => {
            const { data: newMessage } = await supabase
              .from('messages')
              .select(`
                id,
                content,
                created_at,
                room_id,
                user_id,
                recipient_id,
                is_private,
                user:profiles!messages_user_id_fkey (
                  name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (newMessage) {
              const transformedMessage = transformMessage(newMessage);
              addMessage(transformedMessage);
            }
          };
          fetchNewMessage();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [actualRoomId]);

  const handleSendMessage = async (content: string) => {
    try {
      console.log('Sending message:', content);

      if (!actualRoomId) {
        console.error('No valid room ID available');
        return;
      }

      const messageData = {
        content,
        room_id: actualRoomId,
        user_id: currentUser.id,
        recipient_id: chatType === 'individual' ? recipientId : null,
        is_private: chatType === 'individual'
      };

      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          id,
          content,
          created_at,
          room_id,
          user_id,
          recipient_id,
          is_private,
          user:profiles!messages_user_id_fkey (
            name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      if (newMessage) {
        const transformedMessage = transformMessage(newMessage);
        addMessage(transformedMessage);
      }

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const department = (await AsyncStorage.getItem("department"));
      const country = (await AsyncStorage.getItem("country"));
      const roomPublicName = `${country} - ${department} Chat`;
      
      let roomData: RoomResponse | null = null;

      // Check if this is an individual chat or public chat
      if (recipientId) {
        // Individual chat - check both directions for existing room
        const { data: existingRoom, error: findError } = await supabase
          .from('rooms')
          .select(`
            id,
            type,
            name,
            created_by,
            recipient_id,
            creator:profiles!rooms_created_by_fkey (
              name,
              avatar_url
            ),
            recipient:profiles!rooms_recipient_id_fkey (
              name,
              avatar_url
            )
          `)
          .eq('type', 'individual')
          .or(`and(created_by.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(created_by.eq.${recipientId},recipient_id.eq.${currentUser.id})`)
          .single() as { data: RoomResponse | null; error: any };

        if (findError && findError.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error finding individual room:', findError);
          setRoomName('Private Chat Error');
          return;
        }

        if (existingRoom) {
          roomData = existingRoom;
        } else {
          // Create new individual chat room only if no existing room was found
          const { data: newRoom, error: createError } = await supabase
            .from('rooms')
            .insert({
              type: 'individual',
              created_by: currentUser.id,
              recipient_id: recipientId,
              is_private: true
            })
            .select(`
              id,
              type,
              name,
              created_by,
              recipient_id,
              creator:profiles!rooms_created_by_fkey (
                name,
                avatar_url
              ),
              recipient:profiles!rooms_recipient_id_fkey (
                name,
                avatar_url
              )
            `)
            .single() as { data: RoomResponse | null; error: any };

          if (createError || !newRoom) {
            console.error('Error creating individual room:', createError);
            setRoomName('Private Chat Error');
            return;
          }

          roomData = newRoom;
        }
      } else {
        // Public chat
        const { data: roomChat, error: roomError } = await supabase
          .from('rooms')
          .select(`
            id,
            type,
            name,
            created_by,
            recipient_id,
            creator:profiles!rooms_created_by_fkey (
              name,
              avatar_url
            ),
            recipient:profiles!rooms_recipient_id_fkey (
              name,
              avatar_url
            )
          `)
          .eq('name', roomPublicName)
          .eq('type', 'group')
          .single() as { data: RoomResponse | null; error: any };

        roomData = roomChat;
        if (!roomData) {
          // Create new public room
          const { data: newRoom, error: createError } = await supabase
            .from('rooms')
            .insert({
              type: 'group',
              name: roomPublicName,
              created_by: 'bb353e09-30b2-46d6-9cf7-2c88a2e55434',
              is_private: false
            })
            .select(`
              id,
              type,
              name,
              created_by,
              recipient_id,
              creator:profiles!rooms_created_by_fkey (
                name,
                avatar_url
              ),
              recipient:profiles!rooms_recipient_id_fkey (
                name,
                avatar_url
              )
            `)
            .single() as { data: RoomResponse | null; error: any };

          if (createError || !newRoom) {
            console.error('Error creating public room:', createError);
            setRoomName('Public Chat Error');
            return;
          }

          roomData = newRoom;
        }
      }

      if (!roomData) {
        console.error('No room data available');
        setRoomName('Chat Error');
        return;
      }

      // Transform the Supabase response to match our RoomDetails type
      const roomDetails: RoomDetails = {
        id: roomData.id,
        type: roomData.type,
        name: roomData.name,
        created_by: roomData.created_by,
        recipient_id: roomData.recipient_id,
        creator: roomData.creator || undefined,
        recipient: roomData.recipient || undefined
      };

      // Store the actual room ID
      setActualRoomId(roomDetails.id);

      //console.log("room details", roomDetails);

      if (roomDetails.type === 'individual') {
        //console.log('Individual room details:');
        const creatorName = roomDetails.creator?.name || 'Unknown';
        const recipientName = roomDetails.recipient?.name || 'Unknown';
        setRoomName(`${creatorName.split(' ')[0]} & ${recipientName.split(' ')[0]}`);
      } else if (roomDetails.name) {
        setRoomName(roomDetails.name);
      } else {
        setRoomName('Chat Room');
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
      setRoomName('Chat Room');
    }
  };

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();

    fetchRoomDetails();

    return () => {
    };
  }, [actualRoomId, chatType, recipientId]);

  const handleParticipantSelect = (participant: UserProfile) => {
    setSelectedParticipant(participant.id);
    if (onParticipantSelect && 'roomId' in participant) {
      onParticipantSelect(participant as UserProfile & { roomId: string });
    }
    setIsDrawerOpen(false); // Close drawer after selection
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      isOwnMessage={item.user_id === currentUser.id}
    />
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.roomName}>{roomName}</Text>
            <TouchableOpacity
              style={styles.participantsButton}
              onPress={() => setIsDrawerOpen(true)}
            >
              <Ionicons name="people" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.messagesContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0084ff" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMessage}
              contentContainerStyle={{ paddingVertical: 16 }}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={loading || !!error}
        />
      </SafeAreaView>

      <OnlineUsersDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUserSelect={handleParticipantSelect}
        currentUserId={currentUser.id}
        chatType={chatType}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5ef', // Light orange background
  },
  header: {
    backgroundColor: '#fb8436',
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  participantsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantsButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageItem: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#fb8436',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessageText: {
    color: '#ffffff',
    fontSize: 16,
  },
  otherMessageText: {
    color: '#333333',
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999999',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#faf7f7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#fb8436',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    fontSize: 16,
  },
});
