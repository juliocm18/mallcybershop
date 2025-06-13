import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../../supabase';
import { UserProfile } from '../types';

interface UserAliasModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  currentUserId: string;
}

export const UserAliasModal: React.FC<UserAliasModalProps> = ({
  isVisible,
  onClose,
  user,
  currentUserId
}) => {
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Fetch existing alias when modal opens
  useEffect(() => {
    if (isVisible && user) {
      fetchExistingAlias();
    }
  }, [isVisible, user]);

  const fetchExistingAlias = async () => {
    if (!user || !currentUserId) return;
    
    try {
      setInitializing(true);
      const { data, error } = await supabase
        .from('user_aliases')
        .select('alias')
        .eq('user_id', currentUserId)
        .eq('target_user_id', user.id)
        .single();

      if (data && !error) {
        setAlias(data.alias);
      } else {
        setAlias('');
      }
    } catch (error) {
      console.error('Error fetching alias:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handleSaveAlias = async () => {
    if (!user || !currentUserId) return;
    
    try {
      setLoading(true);

      // Check if an alias already exists
      const { data: existingAlias } = await supabase
        .from('user_aliases')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('target_user_id', user.id)
        .single();

      let result;
      
      if (existingAlias) {
        // Update existing alias
        if (alias.trim() === '') {
          // Delete alias if empty
          result = await supabase
            .from('user_aliases')
            .delete()
            .eq('id', existingAlias.id);
        } else {
          // Update alias
          result = await supabase
            .from('user_aliases')
            .update({ alias: alias.trim() })
            .eq('id', existingAlias.id);
        }
      } else if (alias.trim() !== '') {
        // Create new alias
        result = await supabase
          .from('user_aliases')
          .insert({
            user_id: currentUserId,
            target_user_id: user.id,
            alias: alias.trim()
          });
      }

      if (result?.error) {
        throw result.error;
      }

      Alert.alert(
        'Success',
        alias.trim() === '' 
          ? `Alias removed for ${user.name}` 
          : `Alias set for ${user.name}`
      );
      onClose();
    } catch (error) {
      console.error('Error saving alias:', error);
      Alert.alert('Error', 'Failed to save alias. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {alias ? 'Editar Alias' : 'Asignar Alias'}
          </Text>
          
          {initializing ? (
            <ActivityIndicator size="small" color="#fb8436" style={styles.loader} />
          ) : (
            <>
              <Text style={styles.userInfo}>
                User: {user?.name || 'Unknown'}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter custom alias"
                value={alias}
                onChangeText={setAlias}
                autoCapitalize="words"
              />
              
              <Text style={styles.helperText}>
                Este alias solo será visible para ti. Deja vacío para eliminar alias.
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveAlias}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {alias.trim() === '' ? 'Eliminar' : 'Guardar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
    fontStyle: 'italic'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    padding: 10,
    marginRight: 10
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16
  },
  saveButton: {
    backgroundColor: '#fb8436',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center'
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  loader: {
    marginVertical: 20
  }
});
