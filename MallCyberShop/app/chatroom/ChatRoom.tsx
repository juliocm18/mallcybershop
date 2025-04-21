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
import { Message, ChatRoomProps, UserProfile, REALTIME_LISTEN_TYPES, RoomDetails } from './types';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { ParticipantList } from './components/ParticipantList';
import { OnlineUsersDrawer } from './components/OnlineUsersDrawer';
import { styles } from './styles';
import { Ionicons } from '@expo/vector-icons';

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
        // First check if room exists
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
          .eq('id', roomId)
          .single();

        if (error) {
          console.error('Error fetching room:', error);
          setRoomName('Chat Room'); // Default fallback
          return;
        }
        if (!room) {
          console.log('No room found with id:', roomId);
          setRoomName('Chat Room'); // Default fallback
          return;
        }        

        console.log('Room data:', JSON.stringify(room, null, 2)); // Debug log

        // Transform the Supabase response to match our RoomDetails type
        const roomDetails: RoomDetails = {
          id: room.id,
          type: room.type,
          name: room.name,
          created_by: room.created_by,
          recipient_id: room.recipient_id,
          creator: room.creator ? { 
            name: room.creator.name, 
            avatar_url: room.creator.avatar_url 
          } : undefined,
          recipient: room.recipient ? { 
            name: room.recipient.name, 
            avatar_url: room.recipient.avatar_url 
          } : undefined
        };

        //console.log('Room details:', JSON.stringify(roomDetails, null, 2)); // Debug log

        if (roomDetails && roomDetails.type === 'individual') {
          const creatorName = roomDetails.creator?.name || 'Unknown';
          const recipientName = roomDetails.recipient?.name || 'Unknown';
          console.log('Names:', { creatorName, recipientName }); // Debug log
          setRoomName(`Chat between ${creatorName} and ${recipientName}`);
        } else if (roomDetails?.name) {
          setRoomName(roomDetails.name);
        } else {
          setRoomName('Chat Room'); // Default fallback
        }
      } catch (error) {
        console.error('Error fetching room details:', error);
        setRoomName('Chat Room'); // Default fallback
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

      {/* <ParticipantList
        roomId={roomId}
        onParticipantClick={handleParticipantSelect}
        selectedParticipant={selectedParticipant}
        currentUserId={currentUser.id}
      /> */}

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
