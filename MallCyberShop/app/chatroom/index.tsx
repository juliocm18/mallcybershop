import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { supabase } from '@/app/supabase';
import { User } from '@supabase/supabase-js';
import { ChatRoom } from './ChatRoom';
import { styles } from './styles';

export default function ChatRoomScreen() {
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    console.log("estoy aqui")
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log(user)
      setCurrentUser(user);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!currentUser) {
    return null; // Or render a login screen
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ChatRoom
        roomId="749646af-04ad-44ee-b1f2-2ad0e684a6d3" // You can make this dynamic based on your needs
        currentUser={currentUser}
        chatType="group"
        onParticipantSelect={(participant) => {
          console.log('Selected participant:', participant);
          // Handle participant selection
        }}
      />
    </View>
  );
}
