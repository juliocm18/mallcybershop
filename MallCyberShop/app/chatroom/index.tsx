import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/app/supabase';
import { User } from '@supabase/supabase-js';
import { ChatRoom } from './ChatRoom';
import { LoginModal } from './components/LoginModal';
import { styles } from './styles';
import { UserProfile } from './types';

export default function ChatRoomScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string>("749646af-04ad-44ee-b1f2-2ad0e684a6d3");
  const [chatType, setChatType] = useState<'group' | 'individual'>('group');
  const [selectedRecipient, setSelectedRecipient] = useState<string | undefined>();

  const updateUserStatus = async (userId: string, isOnline: boolean) => {
    try {
      await supabase
        .from('user_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user);
        updateUserStatus(user.id, true);
      } else {
        setShowLoginModal(true);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        updateUserStatus(user.id, true);
        setShowLoginModal(false);
      } else {
        setShowLoginModal(true);
      }
    });

    // Set up interval to update last_seen
    const statusInterval = setInterval(() => {
      if (currentUser) {
        updateUserStatus(currentUser.id, true);
      }
    }, 30000);

    // Cleanup
    return () => {
      subscription.unsubscribe();
      clearInterval(statusInterval);
      if (currentUser) {
        updateUserStatus(currentUser.id, false);
      }
    };
  }, [currentUser?.id]);

  const handleLoginSuccess = async (userId: string) => {
    await updateUserStatus(userId, true);
  };

  const handleParticipantSelect = (user: UserProfile & { roomId: string }) => {
    setCurrentRoomId(user.roomId);
    setSelectedRecipient(user.id);
    setChatType('individual');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <LoginModal 
        isVisible={showLoginModal} 
        onLoginSuccess={handleLoginSuccess}
      />

      {currentUser && (
        <ChatRoom
          roomId={currentRoomId}
          currentUser={currentUser}
          chatType={chatType}
          recipientId={selectedRecipient}
          onParticipantSelect={handleParticipantSelect}
        />
      )}
    </View>
  );
}
