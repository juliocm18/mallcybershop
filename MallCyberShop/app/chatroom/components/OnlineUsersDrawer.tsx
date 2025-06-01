import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { UserProfile, OnlineUsersDrawerProps } from '../types';
import { supabase } from '@/app/supabase';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export const OnlineUsersDrawer: React.FC<OnlineUsersDrawerProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  currentUserId,
  chatType
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnlineUsers();
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId);

      if (error) {
        console.error('Error fetching online users:', error);
        return;
      }

      if (profiles) {
        setUsers(profiles);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.drawer}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Usuarios en línea</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {chatType === 'individual' && (
              <TouchableOpacity
                style={styles.groupChatButton}
                onPress={() => {
                  onClose();
                  router.push('/chatroom');
                }}
              >
                <Text style={styles.groupChatButtonText}>Ir al chat de grupo</Text>
              </TouchableOpacity>
            )}

            <ScrollView style={styles.userList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#0000ff" />
                </View>
              ) : (
                users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userItem}
                    onPress={() => {
                      onUserSelect({ ...user, roomId: '' });
                      onClose();
                    }}
                  >
                    <Text style={styles.userName}>{user.name}</Text>
                    <View
                      style={[
                        styles.statusDot,
                        user.status?.is_online ? styles.online : styles.offline,
                      ]}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: '#faf7f7',
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(251, 132, 54, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fb8436',
    marginTop: -2,
  },
  groupChatButton: {
    backgroundColor: '#fb8436',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  groupChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  userList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userName: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  online: {
    backgroundColor: '#34C759',
  },
  offline: {
    backgroundColor: '#FF3B30',
  },
});
