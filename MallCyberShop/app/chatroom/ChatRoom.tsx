import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/app/supabase';
import { Message, ChatRoomProps, UserProfile, RoomDetails, RoomResponse } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { OnlineUsersDrawer } from './components/OnlineUsersDrawer';
import { styles } from './styles';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [selectedParticipant, setSelectedParticipant] = useState<string | undefined>(recipientId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [roomName, setRoomName] = useState<string>('Chat Room');
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
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
          profile:profiles (
            name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatType === 'individual') {
        // For private chats, get messages where either user is sender or recipient
        query = query.or(`and(user_id.eq.${currentUser.id},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${currentUser.id}),and(user_id.eq.${currentUser.id},is_private.eq.true),and(user_id.eq.${recipientId},is_private.eq.true)`);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      //console.log('Fetched messages:', messages); // Debug log

      const transformedData = (messages || []).map((message: any) => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        room_id: message.room_id,
        user_id: message.user_id,
        recipient_id: message.recipient_id,
        is_private: message.is_private,
        user: {
          name: message.profile?.name || 'Unknown',
          avatar_url: message.profile?.avatar_url
        }
      })).reverse();

      setMessages(transformedData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
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
          filter: chatType === 'individual' 
            ? `room_id=eq.${roomId}`
            : `room_id=eq.${roomId}`
        },
        async (payload) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            content: payload.new.content,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            room_id: payload.new.room_id,
            recipient_id: payload.new.recipient_id,
            is_private: payload.new.is_private,
            user: {
              name: userData?.name || 'Unknown',
              avatar_url: userData?.avatar_url
            }
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Fetch initial messages
    fetchMessages();

    const fetchRoomDetails = async () => {
      try {
        const department = (await AsyncStorage.getItem("department"));
        const country = (await AsyncStorage.getItem("country"));
        const roomPublicName = `${country} - ${department} Chat`;
        
        let roomData: RoomResponse | null = null;

        // Check if this is an individual chat or public chat
        if (recipientId) {
          // Individual chat
          const { data: room, error } = await supabase
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
            .eq('created_by', currentUser.id)
            .eq('recipient_id', recipientId)
            .single() as { data: RoomResponse | null; error: any };

          if (!room) {
            // Create new individual chat room
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
          } else {
            roomData = room;
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

        console.log("room details", roomDetails);

        if (roomDetails.type === 'individual') {
          console.log('Individual room details:');
          const creatorName = roomDetails.creator?.name || 'Unknown';
          const recipientName = roomDetails.recipient?.name || 'Unknown';
          setRoomName(`${creatorName} & ${recipientName}`);
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

    fetchRoomDetails();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, chatType, recipientId]);

  const handleSendMessage = async (content: string) => {
    try {
      const messageData = {
        content,
        room_id: roomId,
        user_id: currentUser.id,
        recipient_id: chatType === 'individual' ? recipientId : null,
        is_private: chatType === 'individual'
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

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
        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {roomName}
        </Text>
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
