import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CreateGroupModal from './components/CreateGroupModal';
import GroupInvitationsModal from './components/GroupInvitationsModal';

interface Group {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  is_private: boolean;
  member_count: number;
  is_member: boolean;
}

interface GroupsScreenProps {
  currentUserId?: string | null;
}

export default function GroupsScreen({ currentUserId: propUserId }: GroupsScreenProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(propUserId || null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isInvitationsModalVisible, setIsInvitationsModalVisible] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Effect for initializing user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      // If prop is provided, use it
      if (propUserId) {
        return propUserId;
      }
      // Otherwise try to get from AsyncStorage
      const userId = await AsyncStorage.getItem('userId');
      setCurrentUserId(userId);
      return userId;
    };

    const initialize = async () => {
      const userId = await fetchCurrentUser();
      if (userId) {
        fetchGroups(userId);
        fetchPendingInvitationsCount(userId);
      }
    };

    initialize();
  }, [propUserId]);

  // Separate effect for Supabase subscriptions to ensure they're only created once
  useEffect(() => {
    if (!currentUserId) return;
    
    // Create unique channel names with user ID to avoid conflicts
    const groupsChannelName = `groups_changes_${currentUserId}`;
    const invitationsChannelName = `invitations_changes_${currentUserId}`;
    
    // Set up real-time subscription for group changes
    const groupsSubscription = supabase
      .channel(groupsChannelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: 'type=eq.group'
      }, () => {
        // Refresh groups when changes occur
        fetchGroups(currentUserId);
      })
      .subscribe();

    // Set up real-time subscription for invitations
    const invitationsSubscription = supabase
      .channel(invitationsChannelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'group_invitations'
      }, () => {
        // Refresh invitations count when changes occur
        fetchPendingInvitationsCount(currentUserId);
      })
      .subscribe();

    return () => {
      // Properly clean up subscriptions when component unmounts or currentUserId changes
      supabase.removeChannel(groupsSubscription);
      supabase.removeChannel(invitationsSubscription);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      // First get groups the user is a member of
      const { data: memberGroups, error: memberError } = await supabase
        .from('room_participants')
        .select('room_id')
        .eq('user_id', currentUserId);

      if (memberError) throw memberError;

      const memberGroupIds = memberGroups.map(item => item.room_id);

      // Use a direct RPC call to bypass RLS policies
      // Create a stored procedure in Supabase if it doesn't exist yet
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_groups');

      if (rpcError) {
        // If RPC fails (likely because the function doesn't exist yet), use a fallback approach
        console.log('RPC failed, using fallback approach:', rpcError);

        // Use service role key in a server function (this is just a placeholder)
        // In a real app, you'd call a server endpoint that uses the service role key
        // For now, we'll just show public groups to avoid the recursion
        const { data, error } = await supabase
          .from('rooms')
          .select(`
            id,
            name,
            description,
            image_url,
            created_at,
            created_by,
            is_private,
            type
          `)
          .eq('type', 'group')
          .eq('is_private', false) // Only get public groups to avoid recursion
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Process the data
        if (data) {
          // Skip getting member counts to avoid triggering recursion
          const groupsWithCounts = data.map(group => ({
            ...group,
            member_count: 0, // We'll skip actual counts for now
            is_member: memberGroupIds.includes(group.id)
          }));

          setGroups(groupsWithCounts);
          setFilteredGroups(groupsWithCounts);
        }
      } else {
        // RPC succeeded, process the data
        const data = rpcData;

        if (data) {
          // Process the data from RPC
          const groupsWithCounts = data.map(group => ({
            ...group,
            is_member: memberGroupIds.includes(group.id)
          }));

          setGroups(groupsWithCounts);
          setFilteredGroups(groupsWithCounts);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitationsCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('group_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingInvitationsCount(count || 0);
    } catch (error) {
      console.error('Error fetching invitations count:', error);
    }
  };

  const handleJoinGroup = async (group: Group) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un grupo');
      return;
    }
  
    if (group.is_member) {
      console.log("🚀 ~ handleJoinGroup ~ group.is_member:", group.is_member)
      router.push({ pathname: '/chatroom', params: { roomIdParam: group.id } });
      return;
    }
  
    if (group.is_private) {
      Alert.alert('Grupo Cerrado', 'Este es un grupo cerrado. Necesitas una invitación para unirte.');
      return;
    }
  
    try {
      const { error } = await supabase
        .from('room_participants')
        .insert({
          room_id: group.id,
          user_id: currentUserId,
          role: 'member',
          joined_at: new Date().toISOString()
        });
  
      if (error) throw error;
  
      setGroups(prev =>
        prev.map(g =>
          g.id === group.id
            ? { ...g, is_member: true, member_count: g.member_count + 1 }
            : g
        )
      );
  
      Alert.alert('Éxito', 'Te has unido al grupo');
  
      router.push({ pathname: '/chatroom', params: { roomIdParam: group.id } });
    } catch (error: any) {
      console.error('Error joining group:', error);
      Alert.alert('Error', error.message || 'No se pudo unir al grupo');
    }
  };
  

  const handleGroupCreated = (groupId: string) => {
    if (currentUserId) {
      fetchGroups(currentUserId);
    }

    // Navigate to the new group's chat room
    router.push({
      pathname: '/chatroom',
      params: { roomIdParam: groupId }
    });
  };

  const handleInvitationAccepted = (roomId: string) => {
    if (currentUserId) {
      fetchGroups(currentUserId);
      fetchPendingInvitationsCount(currentUserId);
    }

    // Navigate to the group's chat room
    router.push({
      pathname: '/chatroom',
      params: { roomId }
    });
  };

  const renderGroupItem = ({ item }: { item: Group }) => {
    //console.log("🚀 ~ renderGroupItem ~ item:", item)

    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => handleJoinGroup(item)}
      >
        <View style={styles.groupHeader}>
          <View style={styles.groupImageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.groupImage} />
            ) : (
              <View style={[styles.groupImage, styles.defaultGroupImage]}>
                <Text style={styles.groupImageText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.groupMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color="#777" />
                <Text style={styles.metaText}>{item.member_count} members</Text>
              </View>
              {item.is_private && (
                <View style={styles.metaItem}>
                  <Ionicons name="lock-closed-outline" size={14} color="#777" />
                  <Text style={styles.metaText}>Closed</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.joinButton, item.is_member && styles.joinedButton]}
            onPress={() => handleJoinGroup(item)}
          >
            <Text style={[styles.joinButtonText, item.is_member && styles.joinedButtonText]}>
              {item.is_member ? 'Abrir' : (item.is_private ? 'Cerrado' : 'Unirse')}
            </Text>
          </TouchableOpacity>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>

    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grupos</Text>
        <View style={styles.headerButtons}>
          {pendingInvitationsCount > 0 && (
            <TouchableOpacity
              style={styles.invitationsButton}
              onPress={() => setIsInvitationsModalVisible(true)}
            >
              <Ionicons name="mail" size={24} color="#4a6ea9" />
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{pendingInvitationsCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar grupos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#4a6ea9" />
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No grupos encontrados que coincidan con su búsqueda' : 'No grupos disponibles'}
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setIsCreateModalVisible(true)}
              >
                <Text style={styles.createFirstButtonText}>Crear Primer Grupo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {currentUserId && (
        <>
          <CreateGroupModal
            isVisible={isCreateModalVisible}
            onClose={() => setIsCreateModalVisible(false)}
            onGroupCreated={handleGroupCreated}
            currentUserId={currentUserId}
          />

          <GroupInvitationsModal
            isVisible={isInvitationsModalVisible}
            onClose={() => setIsInvitationsModalVisible(false)}
            currentUserId={currentUserId}
            onInvitationAccepted={handleInvitationAccepted}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5ef',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invitationsButton: {
    padding: 8,
    marginRight: 8,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#fb8436',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    color: '#fb8436',
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 16,
  },
  groupItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  groupHeader: {
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
    backgroundColor: '#fb8436',
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
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#777',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#fb8436',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  joinedButton: {
    backgroundColor: '#e6f0ff',
    borderWidth: 1,
    borderColor: '#4a6ea9',
  },
  joinedButtonText: {
    color: '#4a6ea9',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  createFirstButton: {
    backgroundColor: '#4a6ea9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
