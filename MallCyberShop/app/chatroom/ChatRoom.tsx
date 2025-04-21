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
import { Message, ChatRoomProps, UserProfile, REALTIME_LISTEN_TYPES } from './types';
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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    const channel = subscribeToMessages();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, selectedParticipant]);

  const fetchMessages = async () => {
    try {
      const query = supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          room_id,
          user_id,
          recipient_id,
          is_private,
          profile:profiles!messages_user_id_fkey (
            name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatType === 'individual' && selectedParticipant) {
        // For private chats, get messages between the two users
        query.or(`and(user_id.eq.${currentUser.id},recipient_id.eq.${selectedParticipant}),and(user_id.eq.${selectedParticipant},recipient_id.eq.${currentUser.id})`);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

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

  const subscribeToMessages = () => {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === REALTIME_LISTEN_TYPES.INSERT) {
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
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }
      )
      .subscribe();
  };

  const handleSendMessage = async (content: string) => {
    try {
      const messageData = {
        content,
        room_id: roomId,
        user_id: currentUser.id,
        recipient_id: chatType === 'individual' ? selectedParticipant : null,
        is_private: chatType === 'individual'
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
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
          {chatType === 'individual' && selectedParticipant ? 'Private Chat' : 'Group Chat'}
        </Text>
      </View>

      {/* <ParticipantList
        roomId={roomId}
        onParticipantClick={handleParticipantSelect}
        selectedParticipant={selectedParticipant}
        currentUserId={currentUser.id}
      /> */}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
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
          contentContainerStyle={styles.messagesContainer}
          inverted={false}
        />
      )}

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
