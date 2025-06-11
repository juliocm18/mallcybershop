import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '../../supabase';

interface TypingIndicatorProps {
  roomId: string;
  currentUserId: string;
}

interface TypingUser {
  user_id: string;
  name: string;
  timestamp: number;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ roomId, currentUserId }) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [dots] = useState(new Animated.Value(0));

  // Animation for the typing dots
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dots, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false
        }),
        Animated.timing(dots, {
          toValue: 2,
          duration: 300,
          useNativeDriver: false
        }),
        Animated.timing(dots, {
          toValue: 3,
          duration: 300,
          useNativeDriver: false
        }),
        Animated.timing(dots, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false
        })
      ])
    );

    if (typingUsers.length > 0) {
      animation.start();
    } else {
      animation.stop();
    }

    return () => {
      animation.stop();
    };
  }, [typingUsers.length]);

  // Subscribe to typing indicators
  useEffect(() => {
    // Subscribe to typing status channel
    const typingChannel = supabase
      .channel(`typing-${roomId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== currentUserId) {
          handleTypingEvent(payload);
        }
      })
      .subscribe();

    // Cleanup function to remove stale typing indicators
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prevUsers => 
        prevUsers.filter(user => now - user.timestamp < 5000)
      );
    }, 1000);

    return () => {
      typingChannel.unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [roomId, currentUserId]);

  const handleTypingEvent = (payload: { user_id: string; name: string }) => {
    setTypingUsers(prevUsers => {
      // Remove this user if they're already in the list
      const filteredUsers = prevUsers.filter(u => u.user_id !== payload.user_id);
      
      // Add the user with the current timestamp
      return [
        ...filteredUsers,
        { 
          user_id: payload.user_id, 
          name: payload.name,
          timestamp: Date.now() 
        }
      ];
    });
  };

  // Generate the typing text based on who is typing
  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  // Generate the dots string based on animation value
  const getDots = () => {
    const dotsValue = dots.interpolate({
      inputRange: [0, 1, 2, 3],
      outputRange: ['', '.', '..', '...']
    });
    
    return dotsValue;
  };

  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {getTypingText()}
        <Animated.Text>{getDots()}</Animated.Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  text: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  }
});
