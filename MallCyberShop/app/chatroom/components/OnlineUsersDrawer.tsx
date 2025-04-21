import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/supabase';
import { styles } from '../styles';
import { UserProfile } from '../types';

interface OnlineUsersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (participant: UserProfile) => void;
  currentUserId: string;
}

export const OnlineUsersDrawer: React.FC<OnlineUsersDrawerProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  currentUserId,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchOnlineUsers();
      const channel = subscribeToUserStatus();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen]);

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          avatar_url,
          status:user_status (
            is_online,
            last_seen
          )
        `)
        .neq('id', currentUserId);

      if (error) throw error;

      const formattedUsers: UserProfile[] = (data || []).map((user: any) => ({
        id: user.id,
        name: user.name || 'Anonymous',
        avatar_url: user.avatar_url,
        status: {
          is_online: user.status?.is_online || false,
          last_seen: user.status?.last_seen || new Date().toISOString()
        }
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUserStatus = () => {
    return supabase
      .channel('online-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
        },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();
  };

  const handleUserSelect = async (user: UserProfile) => {
    try {
      // Check if a private room already exists between these users
      const { data: existingRooms, error: findError } = await supabase
        .from('rooms')
        .select('id')
        .eq('type', 'individual')
        .eq('is_private', true)
        .or(`and(created_by.eq.${currentUserId},recipient_id.eq.${user.id}),and(created_by.eq.${user.id},recipient_id.eq.${currentUserId})`);

      if (findError) throw findError;

      //console.log('Existing rooms:', existingRooms); // Debug log

      if (existingRooms && existingRooms.length > 0) {
        onUserSelect({ ...user, roomId: existingRooms[0].id });
      } else {
        // Create a new private room
        const { data: newRoom, error } = await supabase
          .from('rooms')
          .insert({
            name: `Chat with ${user.name}`,
            type: 'individual',
            created_by: currentUserId,
            recipient_id: user.id,
            is_private: true
          })
          .select()
          .single();

        if (error) throw error;
        onUserSelect({ ...user, roomId: newRoom.id });
      }

      onClose();
    } catch (error) {
      console.error('Error creating private chat:', error);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.drawerContainer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Online Users</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.drawerCloseButton}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.drawerUserList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading users...</Text>
            </View>
          ) : (
            users.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.drawerUserItem}
                onPress={() => handleUserSelect(user)}
              >
                <View style={styles.drawerUserAvatarContainer}>
                  <Image
                    source={
                      user.avatar_url
                        ? { uri: user.avatar_url }
                        : require('./default-avatar.png')
                    }
                    style={styles.drawerUserAvatarImage}
                  />
                  {user.status?.is_online && (
                    <View style={styles.onlineBadge} />
                  )}
                </View>
                <View>
                  <Text style={styles.drawerUserName}>{user.name}</Text>
                  <Text style={styles.drawerUserStatus}>
                    {user.status?.is_online ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
