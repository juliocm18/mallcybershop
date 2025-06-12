import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { UserProfile } from '../types';

// Define the structure of the data returned from Supabase
interface ProfileData {
  id: string;
  name: string;
  avatar_url: string | null;
  status: string | null;
}

interface RoomParticipantWithProfile {
  user_id: string;
  role: 'super_admin' | 'admin' | 'member';
  joined_at: string;
  profiles: ProfileData;
}

interface GroupMembersModalProps {
  isVisible: boolean;
  onClose: () => void;
  roomId: string;
  currentUserId: string;
  isGroupClosed: boolean;
}

// Define a custom GroupMember interface that doesn't extend UserProfile
interface GroupMember {
  id: string;
  name: string;
  avatar_url: string | null;
  //status: any; // Using any to avoid type conflicts
  role: 'super_admin' | 'admin' | 'member';
  joined_at: string;
}

interface UserSearchResult extends UserProfile {
  isSelected: boolean;
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isVisible,
  onClose,
  roomId,
  currentUserId,
  isGroupClosed
}) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'member'>('member');
  const [selectedTab, setSelectedTab] = useState<'members' | 'invite'>('members');
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  
  useEffect(() => {
    if (isVisible) {
      fetchMembers();
      fetchUserRole();
    }
  }, [isVisible, roomId]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', currentUserId)
        .single();

      if (error) throw error;
      if (data) {
        setUserRole(data.role as 'super_admin' | 'admin' | 'member');
      }
    } catch (error) {
      console.error('GroupMembersModal: fetchUserRole: Error fetching user role:', error);
    }
  };

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          user_id,
          role,
          joined_at,
          profiles:user_id(id, name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('role', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedMembers: GroupMember[] = data.map(item => {
          // The profiles field from Supabase is a nested object, not an array
          const profileData = item.profiles as unknown as {
            id: string;
            name: string;
            avatar_url: string | null;
          };
          
          return {
            id: profileData?.id || item.user_id,
            name: profileData?.name || 'Unknown User',
            avatar_url: profileData?.avatar_url || null,
            role: item.role as 'super_admin' | 'admin' | 'member',
            joined_at: item.joined_at as string
          };
        });
        setMembers(formattedMembers);
      }
    } catch (error) {
      console.error('GroupMembersModal: fetchMembers: Error fetching members:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search for users by name or ID
      const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .ilike('name', `%${query}%`)
      .limit(10);
    

      if (error) throw error;

      if (data) {
        // Filter out current members
        const memberIds = members.map(member => member.id);
        const filteredUsers = data
          .filter((user: UserProfile) => {
            // Ensure user is an object with an id property
            return user && typeof user === 'object' && 'id' in user && !memberIds.includes(user.id as string);
          })
          .map((user: UserProfile) => ({
            id: user.id as string,
            name: user.name as string,
            avatar_url: user.avatar_url as string | null,
            isSelected: invitedUsers.includes(user.id as string)
          }));

        setSearchResults(filteredUsers as UserSearchResult[]);
      }
    } catch (error) {
      console.error('GroupMembersModal: searchUsers: Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (invitedUsers.includes(userId)) {
      setInvitedUsers(invitedUsers.filter(id => id !== userId));
    } else {
      setInvitedUsers([...invitedUsers, userId]);
    }

    // Update search results to reflect selection
    setSearchResults(prevResults =>
      prevResults.map(user => {
        if (user.id === userId) {
          return { ...user, isSelected: !user.isSelected };
        }
        return user;
      })
    );
  };

  const inviteUsers = async () => {
    if (invitedUsers.length === 0) return;

    setIsLoading(true);
    try {
      // For closed groups, create invitations
      if (isGroupClosed) {
        const invitations = invitedUsers.map(userId => ({
          room_id: roomId,
          user_id: userId,
          invited_by: currentUserId,
          status: 'pending',
          created_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('group_invitations')
          .insert(invitations);

        if (error) throw error;

        Alert.alert('Success', 'Invitations sent successfully');
      } else {
        // For open groups, add users directly
        const newMembers = invitedUsers.map(userId => ({
          room_id: roomId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('room_participants')
          .insert(newMembers);

        if (error) throw error;

        Alert.alert('Alerta', 'Usuarios agregados al grupo');
      }

      // Reset state
      setInvitedUsers([]);
      setSearchResults([]);
      setSearchQuery('');
      fetchMembers();
      setSelectedTab('members');
    } catch (error) {
      console.error('Error inviting users:', error);
      Alert.alert('Error', 'Failed to invite users');
    } finally {
      setIsLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (userRole !== 'super_admin') {
      Alert.alert('Permission Denied', 'Only the super admin can change user roles');
      return;
    }

    try {
      const { error } = await supabase
        .from('room_participants')
        .update({ role: newRole })
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setMembers(prevMembers =>
        prevMembers.map(member => {
          if (member.id === userId) {
            return { ...member, role: newRole };
          }
          return member;
        })
      );

      Alert.alert('Success', `User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error changing user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const removeUser = async (userId: string) => {
    // Check permissions
    if (userRole === 'member') {
      Alert.alert('Permission Denied', 'You do not have permission to remove members');
      return;
    }

    // Super admin can remove anyone except themselves
    // Admin can only remove members
    const targetMember = members.find(member => member.id === userId);
    if (!targetMember) return;

    if (userRole === 'admin' && targetMember.role !== 'member') {
      Alert.alert('Permission Denied', 'Admins can only remove regular members');
      return;
    }

    if (userId === currentUserId) {
      Alert.alert(
        'Confirm Leave',
        'Are you sure you want to leave this group?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Leave', 
            style: 'destructive',
            onPress: () => leaveGroup(userId)
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Confirmar',
      `¿Estás seguro de que quieres remover ${targetMember.name} del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => confirmRemoveUser(userId)
        }
      ]
    );
  };

  const confirmRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setMembers(prevMembers => prevMembers.filter(member => member.id !== userId));
      Alert.alert('Alerta', 'Usuario removido del grupo');
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Failed to remove user');
    }
  };

  const leaveGroup = async (userId: string) => {
    try {
      // Check if user is the last super admin
      if (userRole === 'super_admin') {
        const superAdmins = members.filter(member => member.role === 'super_admin');
        if (superAdmins.length === 1) {
          // Find an admin to promote
          const admins = members.filter(member => member.role === 'admin');
          if (admins.length > 0) {
            // Promote the first admin to super admin
            const { error: promoteError } = await supabase
              .from('room_participants')
              .update({ role: 'super_admin' })
              .eq('room_id', roomId)
              .eq('user_id', admins[0].id);

            if (promoteError) throw promoteError;
          } else {
            Alert.alert(
              'Cannot Leave',
              'You are the only super admin. Please assign another super admin before leaving.',
              [{ text: 'OK' }]
            );
            return;
          }
        }
      }

      // Remove user from group
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;

      Alert.alert('Success', 'You have left the group');
      onClose();
    } catch (error) {
      console.error('Error leaving group:', error);
      Alert.alert('Error', 'Failed to leave the group');
    }
  };

  const renderMemberItem = ({ item }: { item: GroupMember }) => {
    const isCurrentUser = item.id === currentUserId;
    const canModify = 
      (userRole === 'super_admin') || 
      (userRole === 'admin' && item.role === 'member');

    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.memberName}>
              {item.name} {isCurrentUser && '(You)'}
            </Text>
            <Text style={styles.memberRole}>
              {item.role === 'super_admin' ? 'Super Admin' : 
               item.role === 'admin' ? 'Admin' : 'Member'}
            </Text>
          </View>
        </View>

        {canModify && !isCurrentUser && (
          <View style={styles.actionButtons}>
            {userRole === 'super_admin' && item.role !== 'super_admin' && (
              <TouchableOpacity 
                style={styles.roleButton}
                onPress={() => changeUserRole(item.id, item.role === 'admin' ? 'member' : 'admin')}
              >
                <Text style={styles.roleButtonText}>
                  {item.role === 'admin' ? 'Demote' : 'Make Admin'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeUser(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        )}

        {isCurrentUser && (
          <TouchableOpacity 
            style={styles.leaveButton}
            onPress={() => removeUser(item.id)}
          >
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSearchItem = ({ item }: { item: UserSearchResult }) => (
    <TouchableOpacity 
      style={[styles.searchItem, item.isSelected && styles.selectedSearchItem]}
      onPress={() => toggleUserSelection(item.id)}
    >
      <View style={styles.memberInfo}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.memberName}>{item.name}</Text>
      </View>
      <Ionicons 
        name={item.isSelected ? "checkmark-circle" : "add-circle-outline"} 
        size={24} 
        color={item.isSelected ? "#4a6ea9" : "#999"} 
      />
    </TouchableOpacity>
  );

  const canInviteUsers = userRole === 'super_admin' || 
                       (userRole === 'admin' && !isGroupClosed);

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
          <Text style={styles.title}>Miembros de grupo</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'members' && styles.activeTab]}
            onPress={() => setSelectedTab('members')}
          >
            <Text style={[styles.tabText, selectedTab === 'members' && styles.activeTabText]}>
              Miembros
            </Text>
          </TouchableOpacity>
          
          {canInviteUsers && (
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'invite' && styles.activeTab]}
              onPress={() => setSelectedTab('invite')}
            >
              <Text style={[styles.tabText, selectedTab === 'invite' && styles.activeTabText]}>
                {isGroupClosed ? 'Invitar' : 'Agregar'} Usuarios
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {selectedTab === 'members' ? (
          <>
            {isLoading && members.length === 0 ? (
              <ActivityIndicator style={styles.loader} size="large" color="#4a6ea9" />
            ) : (
              <FlatList
                data={members}
                renderItem={renderMemberItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No members found</Text>
                }
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  searchUsers(text);
                }}
                placeholder={`Buscar Usuarios por email o id...`}
                autoCapitalize="none"
              />
            </View>

            {isLoading && searchResults.length === 0 ? (
              <ActivityIndicator style={styles.loader} size="large" color="#4a6ea9" />
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderSearchItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  searchQuery ? (
                    <Text style={styles.emptyText}>No se encontraron usuario</Text>
                  ) : (
                    <Text style={styles.emptyText}>Buscar usuarios para agregar</Text>
                  )
                }
              />
            )}

            {invitedUsers.length > 0 && (
              <TouchableOpacity 
                style={styles.inviteButton} 
                onPress={inviteUsers}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.inviteButtonText}>
                    {isGroupClosed ? 'Send Invitations' : 'Add to Group'} ({invitedUsers.length})
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4a6ea9',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#4a6ea9',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#4a6ea9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  roleButtonText: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  leaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  leaveButtonText: {
    fontSize: 12,
    color: '#ff6b6b',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedSearchItem: {
    backgroundColor: '#f0f7ff',
  },
  inviteButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    margin: 16,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
});

export default GroupMembersModal;
