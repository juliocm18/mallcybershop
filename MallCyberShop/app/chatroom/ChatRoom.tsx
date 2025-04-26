import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet
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
          console.log('New message received:', payload);
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
        console.log('Individual room details:');
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
    console.log("handleParticipantSelect", participant)
    setSelectedParticipant(participant.id);
    if (onParticipantSelect && 'roomId' in participant) {
      onParticipantSelect(participant as UserProfile & { roomId: string });
    }
    setIsDrawerOpen(false); // Close drawer after selection
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.roomName}>{roomName}</Text>
          <View style={styles.headerButtons}>
            {chatType === 'individual' && (
              <TouchableOpacity
                style={styles.groupChatButton}
                onPress={() => {
                  router.push('/chatroom');
                }}
              >
                <Text style={styles.groupChatButtonText}>Go to Group Chat</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.participantsButton}
              onPress={() => setIsDrawerOpen(true)}
            >
              <Text style={styles.participantsButtonText}>Participants</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.messageList}>
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
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwnMessage={item.user_id === currentUser.id}
              />
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
      </View>

      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={loading}
      />

      <OnlineUsersDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUserId={currentUser.id}
        onUserSelect={handleParticipantSelect}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  groupChatButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  groupChatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  participantsButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  participantsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  messageList: {
    flex: 1,
    padding: 16,
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
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  },
});
