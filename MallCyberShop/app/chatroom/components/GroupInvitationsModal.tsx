import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import Modal from 'react-native-modal';
import { supabase } from '../../supabase';
import { Ionicons } from '@expo/vector-icons';

interface GroupInvitationsModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
  onInvitationAccepted: (roomId: string) => void;
}

interface GroupInvitation {
  id: string;
  room_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  room: {
    name: string;
    description?: string;
    image_url?: string;
  };
  inviter: {
    name: string;
    avatar_url?: string;
  };
}

const GroupInvitationsModal: React.FC<GroupInvitationsModalProps> = ({
  isVisible,
  onClose,
  currentUserId,
  onInvitationAccepted
}) => {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      fetchInvitations();
    }
  }, [isVisible]);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select(`
          id,
          room_id,
          status,
          created_at,
          room:rooms (name, description, image_url),
          inviter:profiles!group_invitations_invited_by_fkey (name, avatar_url)
        `)
        .eq('user_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setInvitations(data as unknown as GroupInvitation[]);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      Alert.alert('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, roomId: string, accept: boolean) => {
    setLoading(true);
    try {
      // Update invitation status
      const newStatus = accept ? 'accepted' : 'declined';
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: newStatus })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // If accepted, add user to room participants
      if (accept) {
        const { error: joinError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: currentUserId,
            role: 'member',
            joined_at: new Date().toISOString()
          });

        if (joinError) throw joinError;

        // Notify parent component
        onInvitationAccepted(roomId);
      }

      // Update local state
      setInvitations(prevInvitations => 
        prevInvitations.filter(invitation => invitation.id !== invitationId)
      );

      Alert.alert(
        'Success', 
        accept ? 'You have joined the group' : 'Invitation declined'
      );
    } catch (error) {
      console.error('Error handling invitation:', error);
      Alert.alert('Error', 'Failed to process invitation');
    } finally {
      setLoading(false);
    }
  };

  const renderInvitationItem = ({ item }: { item: GroupInvitation }) => (
    <View style={styles.invitationItem}>
      <View style={styles.invitationHeader}>
        <View style={styles.groupImageContainer}>
          {item.room.image_url ? (
            <Image source={{ uri: item.room.image_url }} style={styles.groupImage} />
          ) : (
            <View style={[styles.groupImage, styles.defaultGroupImage]}>
              <Text style={styles.groupImageText}>{item.room.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.room.name}</Text>
          <Text style={styles.invitedBy}>Invited by {item.inviter.name}</Text>
        </View>
      </View>
      
      {item.room.description && (
        <Text style={styles.description} numberOfLines={2}>
          {item.room.description}
        </Text>
      )}
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleInvitation(item.id, item.room_id, false)}
          disabled={loading}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleInvitation(item.id, item.room_id, true)}
          disabled={loading}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Group Invitations</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {loading && invitations.length === 0 ? (
          <ActivityIndicator style={styles.loader} size="large" color="#4a6ea9" />
        ) : (
          <FlatList
            data={invitations}
            renderItem={renderInvitationItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="mail-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No pending invitations</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  invitationItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  invitationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  groupImageContainer: {
    marginRight: 12,
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultGroupImage: {
    backgroundColor: '#4a6ea9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImageText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  invitedBy: {
    fontSize: 14,
    color: '#777',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  acceptButton: {
    backgroundColor: '#4a6ea9',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: '#f0f0f0',
  },
  declineButtonText: {
    color: '#666',
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default GroupInvitationsModal;
