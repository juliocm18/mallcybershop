import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Modal,
  Text,
  Alert,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/app/supabase';
import { MediaInfo, LocationInfo, MessageType } from '../types';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ChatInputProps {
  onSendMessage: (message: string, messageType: MessageType, mediaInfo?: MediaInfo, locationInfo?: LocationInfo) => Promise<void>;
  disabled?: boolean;
  roomId: string;
  currentUserId: string;
  userName: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, roomId, currentUserId, userName }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingInstance, setRecordingInstance] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Broadcast typing status when user types
  const broadcastTypingStatus = async () => {
    try {
      await supabase
        .channel(`typing-${roomId}`)
        .send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: currentUserId,
            name: userName
          }
        });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  };

  // Debounced typing indicator
  const handleTyping = () => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only broadcast if there's actual content
    if (message.trim().length > 0) {
      broadcastTypingStatus();
    }

    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  };

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    try {
      setSending(true);
      await onSendMessage(message, 'text');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const toggleMediaOptions = () => {
    setShowMediaOptions(!showMediaOptions);
  };

  const pickImage = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
      selectionLimit: 1, // Solo permite una imagen
      mediaTypes: ["images"], // Solo imágenes
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }
    const image = result.assets[0];

    if (image.width > 1000) {
      try {
        const aspectRatio = image.height / image.width;
        const newWidth = 1000;
        const newHeight = Math.round(newWidth * aspectRatio);

        const manipResult = await manipulateAsync(
          image.uri,
          [{ resize: { width: newWidth, height: newHeight } }],
          { compress: 0.7, format: SaveFormat.PNG }
        );

        await uploadAndSendMedia(manipResult.uri, 'image', image.fileName || 'image.png');
        return;
      } catch (error) {
        throw new Error("No se pudo comprimir la imagen");
      }
    }

    // 🔍 Validar tipo de imagen
    if (!["image/png"].includes(image.mimeType || "")) {
      throw new Error("Solo son permitidos PNG.");
    }

    await uploadAndSendMedia(image.uri, 'image', image.fileName || 'image.jpg');
  };

  // Document handling (PDF)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const selectedDoc = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(selectedDoc.uri);

        // Check file size (10MB limit)
        if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Please select a PDF smaller than 10MB');
          return;
        }

        // Upload to Supabase storage
        await uploadAndSendMedia(selectedDoc.uri, 'pdf', selectedDoc.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
    }

    setShowMediaOptions(false);
  };

  // Video handling
  const pickVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'You need to grant permission to access your videos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(selectedVideo.uri);

        // Check file size (10MB limit)
        if (fileInfo.size && fileInfo.size > 15 * 1024 * 1024) {
          Alert.alert('File too large', 'Please select a video smaller than 10MB');
          return;
        }

        // Upload to Supabase storage
        await uploadAndSendMedia(selectedVideo.uri, 'video', selectedVideo.fileName || 'video.mp4');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video');
    }

    setShowMediaOptions(false);
  };

  // Audio recording
  const toggleAudioRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const permissionResult = await Audio.requestPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'You need to grant permission to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      setRecordingInstance(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          // Limit to 5 minutes (300 seconds)
          if (prev >= 300) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingInstance) return;

      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      await recordingInstance.stopAndUnloadAsync();
      const uri = recordingInstance.getURI();
      setRecordingUri(uri);
      setIsRecording(false);

      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);

        // Check file size (10MB limit)
        if (fileInfo.size && fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Audio recording is larger than 10MB');
          return;
        }

        // Upload to Supabase storage
        await uploadAndSendMedia(uri, 'audio', 'audio_recording.m4a', recordingDuration);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  // Location sharing
  const shareLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'You need to grant permission to access your location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Create Google Maps URL
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      // Get address information if possible
      let address = '';
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        if (addressResponse && addressResponse.length > 0) {
          const addressInfo = addressResponse[0];
          address = [
            addressInfo.name,
            addressInfo.street,
            addressInfo.city,
            addressInfo.region,
            addressInfo.country
          ].filter(Boolean).join(', ');
        }
      } catch (error) {
        console.log('Error getting address:', error);
      }

      const locationInfo: LocationInfo = {
        url: googleMapsUrl,
        name: 'My Location',
        address,
        latitude,
        longitude
      };

      await onSendMessage('Shared a location', 'location', undefined, locationInfo);
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location');
    }

    setShowMediaOptions(false);
  };

  const uriToFormData = async (uri: string): Promise<FormData> => {
    const fileExt = uri.split(".").pop() || "png"; // Extraer la extensión
    const fileName = `${Date.now()}.${fileExt}`; // Nombre único

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: `image/${fileExt}`, // Tipo MIME correcto
    } as any); // `as any` evita errores de tipado en React Native

    return formData;
  };


  const uploadAndSendMedia = async (uri: string, type: MessageType, filename: string, duration?: number) => {
    try {
      setSending(true);
      setUploadProgress(0);

      const formData = await uriToFormData(uri); // ✅ Convertir URI a FormData

      const fileExt = uri.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const storageName = "chat-media";
      const filePath = `${storageName}/${fileName}`; // Ruta en Supabase

      let contentType = ``;
      if (type === 'image') {
        contentType = 'image/' + fileExt;
      } else if (type === 'pdf') {
        contentType = 'application/pdf';
      } else if (type === 'video') {
        contentType = 'video/' + fileExt;
      } else if (type === 'audio') {
        contentType = 'audio/' + fileExt;
      }
      const { data, error } = await supabase.storage
        .from(storageName)
        .upload(filePath, formData, {
          contentType,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw new Error("No se pudo comprimir la imagen");

      // ✅ Obtener la URL pública correctamente
      const publicUrl = supabase.storage.from(storageName).getPublicUrl(filePath)
        .data.publicUrl;

      // Create media info object
      const mediaInfo: MediaInfo = {
        url: publicUrl,
        filename,
        filesize: (await FileSystem.getInfoAsync(uri)).size,
        duration: duration // Only for audio/video
      };

      // Send message with media info
      const typeLabel = {
        'image': 'Sent an image',
        'pdf': 'Sent a PDF document',
        'video': 'Sent a video',
        'audio': 'Sent an audio recording'
      }[type];

      await onSendMessage(typeLabel, type, mediaInfo);

    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      Alert.alert('Error', `Failed to upload ${type}`);
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };


  // Upload media to Supabase storage and send message
  const uploadAndSendMedia2 = async (uri: string, type: MessageType, filename: string, duration?: number) => {
    try {
      setSending(true);
      setUploadProgress(0);

      // Generate a unique filename
      const fileExt = filename.split('.').pop();
      const uniqueFilename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const storagePath = `${roomId}/${currentUserId}/${uniqueFilename}`;

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(storagePath, fileContent, {
          contentType: type === 'image' ? 'image/jpeg' :
            type === 'pdf' ? 'application/pdf' :
              type === 'video' ? 'video/mp4' : 'audio/m4a',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(storagePath);

      // Create media info object
      const mediaInfo: MediaInfo = {
        url: publicUrl,
        filename,
        filesize: (await FileSystem.getInfoAsync(uri)).size,
        duration: duration // Only for audio/video
      };

      // Send message with media info
      const typeLabel = {
        'image': 'Sent an image',
        'pdf': 'Sent a PDF document',
        'video': 'Sent a video',
        'audio': 'Sent an audio recording'
      }[type];

      await onSendMessage(typeLabel, type, mediaInfo);

    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      Alert.alert('Error', `Failed to upload ${type}`);
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Upload progress modal */}
      <Modal
        visible={uploadProgress > 0 && uploadProgress < 100}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.progressModalContainer}>
          <View style={styles.progressModal}>
            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Media options modal */}
      <Modal
        visible={showMediaOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMediaOptions(false)}
      >
        <TouchableOpacity
          style={styles.mediaOptionsOverlay}
          activeOpacity={1}
          onPress={() => setShowMediaOptions(false)}
        >
          <View style={styles.mediaOptionsContainer}>
            <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#fb8436" />
              <Text style={styles.mediaOptionText}>Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption} onPress={pickDocument}>
              <Ionicons name="document-outline" size={24} color="#fb8436" />
              <Text style={styles.mediaOptionText}>PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption} onPress={pickVideo}>
              <Ionicons name="videocam-outline" size={24} color="#fb8436" />
              <Text style={styles.mediaOptionText}>Video</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption} onPress={toggleAudioRecording}>
              <Ionicons name="mic-outline" size={24} color="#fb8436" />
              <Text style={styles.mediaOptionText}>Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaOption} onPress={shareLocation}>
              <Ionicons name="location-outline" size={24} color="#fb8436" />
              <Text style={styles.mediaOptionText}>Location</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording {formatDuration(recordingDuration)}</Text>
          </View>
          <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
            <Ionicons name="stop" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={toggleMediaOptions}
          disabled={disabled || isRecording}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fb8436" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            handleTyping();
          }}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={!disabled && !isRecording}
        />

        {message.trim() ? (
          <TouchableOpacity
            style={[
              styles.sendButton,
              (sending || disabled) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={sending || disabled || isRecording}
          >
            {sending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="send" size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.recordButton,
              (disabled) && styles.sendButtonDisabled,
            ]}
            onPress={toggleAudioRecording}
            disabled={disabled}
          >
            <Ionicons name={isRecording ? "stop" : "mic"} size={22} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgb(235 199 199)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#faf7f7',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 48,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#fb8436',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  recordButton: {
    backgroundColor: '#fb8436',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  // Media options styles
  mediaOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  mediaOptionsContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  mediaOption: {
    alignItems: 'center',
    padding: 16,
    width: '20%',
  },
  mediaOptionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
  },
  // Recording styles
  recordingContainer: {
    backgroundColor: '#fff5ef',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#ffece0',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    marginRight: 8,
  },
  recordingText: {
    color: '#ff3b30',
    fontWeight: '500',
  },
  stopRecordingButton: {
    backgroundColor: '#ff3b30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Upload progress styles
  progressModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressModal: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fb8436',
  },
});
