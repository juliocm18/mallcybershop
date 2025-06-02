import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/app/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

interface CreateGroupModalProps {
  isVisible: boolean;
  onClose: () => void;
  onGroupCreated: (groupId: string) => void;
  currentUserId: string;
}

type GroupType = 'open' | 'closed';

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isVisible,
  onClose,
  onGroupCreated,
  currentUserId
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('open');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState('500');
  const [errors, setErrors] = useState<{name?: string; image?: string}>({});

  const resetForm = () => {
    setGroupName('');
    setDescription('');
    setGroupType('open');
    setGroupImage(null);
    setMaxParticipants('500');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: {name?: string; image?: string} = {};
    
    // Validate group name (required, 3-50 characters)
    if (!groupName.trim()) {
      newErrors.name = 'Group name is required';
    } else if (groupName.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    } else if (groupName.trim().length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    }
    
    // Validate image size if selected
    if (groupImage && groupImage.length > 5 * 1024 * 1024) { // 5MB in bytes
      newErrors.image = 'Image size must be less than 5MB';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Resize image to reduce size
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setGroupImage(manipResult.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadGroupImage = async (groupId: string): Promise<string | null> => {
    if (!groupImage) return null;
    
    try {
      // Convert URI to Blob
      const response = await fetch(groupImage);
      const blob = await response.blob();
      
      // Generate a unique filename
      const fileExt = groupImage.split('.').pop();
      const fileName = `${groupId}_${Date.now()}.${fileExt}`;
      const filePath = `group_images/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('group_images')
        .upload(filePath, blob);
      
      if (error) throw error;
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('group_images')
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const createGroup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // 1. Create the group in the rooms table
      const { data: newGroup, error: groupError } = await supabase
        .from('rooms')
        .insert({
          name: groupName.trim(),
          description: description.trim() || null,
          type: 'group',
          created_by: currentUserId,
          is_private: groupType === 'closed',
          max_participants: parseInt(maxParticipants)
        })
        .select('id')
        .single();
      
      if (groupError || !newGroup) {
        throw groupError || new Error('Failed to create group');
      }
      
      // 2. Upload group image if provided
      if (groupImage) {
        const imageUrl = await uploadGroupImage(newGroup.id);
        
        if (imageUrl) {
          // Update the group with the image URL
          const { error: updateError } = await supabase
            .from('rooms')
            .update({ image_url: imageUrl })
            .eq('id', newGroup.id);
          
          if (updateError) {
            console.error('Error updating group image:', updateError);
          }
        }
      }
      
      // 3. Add creator as super admin
      const { error: roleError } = await supabase
        .from('room_participants')
        .insert({
          room_id: newGroup.id,
          user_id: currentUserId,
          role: 'super_admin',
          joined_at: new Date().toISOString()
        });
      
      if (roleError) {
        console.error('Error adding creator as super admin:', roleError);
      }
      
      // 4. Notify success and close modal
      onGroupCreated(newGroup.id);
      handleClose();
      
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Group</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.formContainer}>
          {/* Group Image */}
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {groupImage ? (
                <Image source={{ uri: groupImage }} style={styles.groupImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                  <Text style={styles.placeholderText}>Add Group Image</Text>
                </View>
              )}
            </TouchableOpacity>
            {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
          </View>
          
          {/* Group Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name (3-50 characters)"
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          
          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter group description (max 200 characters)"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
          </View>
          
          {/* Group Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={groupType}
                onValueChange={(itemValue) => setGroupType(itemValue as GroupType)}
                style={styles.picker}
              >
                <Picker.Item label="Open - Anyone can join" value="open" />
                <Picker.Item label="Closed - By invitation only" value="closed" />
              </Picker>
            </View>
          </View>
          
          {/* Max Participants */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Maximum Participants</Text>
            <TextInput
              style={styles.input}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="Maximum number of participants"
              keyboardType="numeric"
            />
          </View>
          
          {/* Create Button */}
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={createGroup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create Group</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
    maxHeight: '90%',
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
  formContainer: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 8,
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  createButton: {
    backgroundColor: '#4a6ea9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 4,
  },
});

export default CreateGroupModal;
