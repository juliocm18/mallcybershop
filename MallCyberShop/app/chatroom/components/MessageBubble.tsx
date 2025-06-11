import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Clipboard, Modal, TextInput, Linking, ActivityIndicator, StyleSheet, Dimensions, Platform, SafeAreaView } from 'react-native';
import { MessageBubbleProps } from '../types';
import { styles as baseStyles } from '../styles';
import { MessageReactions } from './MessageReactions';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../supabase';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
// We'll use these modules without type checking for now
// @ts-ignore
import { Audio, ResizeMode, Video, VideoFullscreenUpdate } from 'expo-av';
// @ts-ignore
import * as MediaLibrary from 'expo-media-library';
// @ts-ignore
import * as Sharing from 'expo-sharing';
// @ts-ignore
import * as IntentLauncher from 'expo-intent-launcher';

const mediaStyles = StyleSheet.create({
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  mediaCaption: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  documentContainer: {
    backgroundColor: '#f7f7f7',
    padding: 10,
    borderRadius: 10,
  },
  documentIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
  },
  documentInfo: {
    marginLeft: 10,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDurationText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 5,
  },
  videoPlayer: {
    width: 250,
    height: 150,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
  },
  audioContainer: {
    width: 200,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f7f7f7',
  },
  audioPlayButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    marginLeft: 10,
  },
  audioWaveform: {
    width: '100%',
    height: 20,
    flexDirection: 'row',
  },
  audioWaveformBar: {
    width: 10,
    backgroundColor: '#666',
    marginHorizontal: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  locationContainer: {
    width: 200,
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f7f7f7',
  },
  locationHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    padding: 10,
  },
  locationFooter: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationLink: {
    fontSize: 12,
    color: '#4a6ea9',
  },
  fullImageModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    resizeMode: 'contain',
  },
  closeFullImageButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  downloadFullImageButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  downloadProgressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  downloadProgressText: {
    fontSize: 12,
    color: '#fff',
  },
  downloadProgressBarContainer: {
    width: 100,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#333',
    marginTop: 5,
  },
  downloadProgressBar: {
    height: 5,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
  },
});

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, currentUserId, onUserPress, onMessageDeleted }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [audioPlaybackPosition, setAudioPlaybackPosition] = useState(0);
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const audioPlaybackTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch user alias when component mounts
  useEffect(() => {
    const fetchUserAlias = async () => {
      // Only fetch alias for other users' messages
      if (!isOwnMessage && message.user_id) {
        try {
          const { data, error } = await supabase
            .from('user_aliases')
            .select('alias')
            .eq('user_id', currentUserId)
            .eq('target_user_id', message.user_id)
            .single();

          if (data && !error) {
            setUserAlias(data.alias);
          }
        } catch (error) {
          console.error('Error fetching user alias:', error);
        }
      }
    };

    fetchUserAlias();
  }, [currentUserId, message.user_id, isOwnMessage]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const copyMessage = () => {
    Clipboard.setString(message.content);
    Alert.alert('Copied', 'Message copied to clipboard');
    setShowOptions(false);
  };

  const deleteMessage = async () => {
    if (!currentUserId || message.user_id !== currentUserId) return;

    Alert.alert(
      'Eliminar Mensaje',
      '¿Estás seguro de que quieres eliminar este mensaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', message.id)
                .eq('user_id', currentUserId);

              if (error) {
                console.error('Error deleting message:', error);
                Alert.alert('Error', 'No se pudo eliminar el mensaje. Por favor, intenta de nuevo.');
              } else {
                // Message deleted successfully
                setShowOptions(false);
                // Call the callback to update the parent component
                if (onMessageDeleted) {
                  onMessageDeleted(message.id);
                }
              }
            } catch (error) {
              console.error('Error in deleteMessage:', error);
              Alert.alert('Error', 'Un error inesperado ocurrió. Por favor, intenta de nuevo.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const openReportModal = () => {
    setShowReportModal(true);
    setShowOptions(false);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Por favor, proporcione un motivo para reportar este mensaje.');
      return;
    }

    try {
      const { error } = await supabase
        .from('message_reports')
        .insert({
          message_id: message.id,
          reporter_id: currentUserId,
          reason: reportReason,
          status: 'pending', // Initial status
        });

      if (error) {
        console.error('Error reporting message:', error);
        Alert.alert('Error', 'No se pudo reportar el mensaje. Por favor, intenta de nuevo.');
      } else {
        Alert.alert('Gracias', 'Tu reporte ha sido enviado y será revisado.');
        setShowReportModal(false);
        setReportReason('');
      }
    } catch (error) {
      console.error('Error in reportMessage:', error);
      Alert.alert('Error', 'Un error inesperado ocurrió. Por favor, intenta de nuevo.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };


  const downloadFile = async () => {
    if (!message.media_info?.url) return;

    try {
      setDownloadProgress(0);

      const url = message.media_info.url;
      const fileName = message.media_info.filename || 'downloaded_file.png';

      // Descargar en cache temporal
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (progress) => {
          if (progress.totalBytesExpectedToWrite > 0) {
            const progressPercent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress(Math.round(progressPercent * 100));
          }
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error('No se pudo descargar el archivo correctamente.');
      }

      const uri = result.uri;

      // Solicitar permisos para galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede guardar la imagen sin permiso.');
        return;
      }

      // Crear asset multimedia
      const asset = await MediaLibrary.createAssetAsync(uri);

      if (Platform.OS === 'android') {
        // En Android, guardamos en álbum "Download"
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } else {
        // En iOS, solo crear asset ya la galería lo detecta
        // Opcional: podrías crear álbum personalizado también si quieres
      }

      Alert.alert('Descarga completa', 'La imagen se guardó en tu galería.');
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'No se pudo descargar el archivo');
    }
  };

  const downloadFile2 = async () => {
    console.log("message.media_info", message.media_info);
    if (!message.media_info?.url) return;

    try {
      setDownloadProgress(0);

      const url = message.media_info.url;
      const fileName = message.media_info.filename || 'downloaded_file';
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (progress) => {
          if (progress.totalBytesExpectedToWrite > 0) {
            const progressPercent = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
            setDownloadProgress(Math.round(progressPercent * 100));
          }
        },
      );

      const result = await downloadResumable.downloadAsync();

      if (result) {
        Alert.alert('Download Complete1', `File saved to ${result.uri}`, [
          { text: 'OK' },
        ]);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const openLocation = async () => {
    try {
      if (!message.location_info) {
        Alert.alert('Error', 'Location information not available');
        return;
      }

      // Try to open in Google Maps or Apple Maps
      const { latitude, longitude } = message.location_info;
      let url = '';

      if (Platform.OS === 'ios') {
        url = `maps:?q=${latitude},${longitude}`;
      } else {
        url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      }

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web URL
        await Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        );
      }
    } catch (error) {
      console.error('Error opening location:', error);
      Alert.alert('Error', 'Failed to open location');
    }
  };

  const handlePlayAudio = async () => {
    try {
      if (isAudioPlaying && audioSound) {
        await audioSound.stopAsync();
        setIsAudioPlaying(false);
        return;
      }

      if (message.media_info?.url) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: message.media_info.url },
          { shouldPlay: true },
        );

        setAudioSound(newSound);
        setIsAudioPlaying(true);

        // Use type any for status to avoid TypeScript errors
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsAudioPlaying(false);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio file');
    }
  };

  // openLocation function is already defined above

  const openPdfPreview = async () => {
    try {
      if (!message.media_info?.url) {
        Alert.alert('Error', 'PDF URL not available');
        return;
      }
      const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(message.media_info.url)}`;
      // Use WebBrowser to open the PDF in an in-app browser
      await WebBrowser.openBrowserAsync(viewerUrl);
    } catch (error) {
      console.error('Error opening PDF preview:', error);
      Alert.alert('Error', 'Failed to open PDF preview');
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <TouchableOpacity onPress={() => setShowFullImage(true)}>
            <Image
              source={{ uri: message.media_info?.url }}
              style={mediaStyles.imageMessage}
              resizeMode="cover"
            />
            {message.media_info?.filename && (
              <Text style={mediaStyles.mediaCaption}>
                {/*{message.media_info.filename} */}
                ({formatFileSize(message.media_info.filesize)})
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'pdf':
        return (
          <TouchableOpacity style={mediaStyles.documentContainer} onPress={openPdfPreview}>
            <View style={mediaStyles.documentIconContainer}>
              <MaterialIcons name="picture-as-pdf" size={36} color="#e74c3c" />
            </View>
            <View style={mediaStyles.documentInfo}>
              <Text style={mediaStyles.documentTitle} numberOfLines={1}>
                {message.media_info?.filename || 'Document.pdf'}
              </Text>
              <Text style={mediaStyles.documentMeta}>
                PDF • {formatFileSize(message.media_info?.filesize)}
              </Text>
            </View>
            <Ionicons name="eye-outline" size={24} color="#fb8436" />
          </TouchableOpacity>
        );

      case 'video':
        return (
          <View style={mediaStyles.videoContainer}>
            {showVideoPlayer && message.media_info?.url ? (
              <Video
                source={{ uri: message.media_info.url }}
                style={mediaStyles.videoPlayer}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
                onFullscreenUpdate={async ({ fullscreenUpdate }) => {
                  if (fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_DISMISS) {
                    setShowVideoPlayer(false);
                  }
                }}
              />
            ) : (
              <TouchableOpacity onPress={() => setShowVideoPlayer(true)}>
                <View style={mediaStyles.videoPlaceholder}>
                  <Image source={{ uri: message.media_info?.thumbnail_url || message.media_info?.url }} style={mediaStyles.videoThumbnail} onError={() => console.log('Error loading thumbnail')} />
                  <View style={mediaStyles.playIconOverlay}>
                    <Ionicons name="play-circle" size={48} color="#ffffff" />
                  </View>
                  {message.media_info?.duration && (
                    <View style={mediaStyles.videoDurationBadge}>
                      <Ionicons name="time-outline" size={12} color="#ffffff" />
                      <Text style={mediaStyles.videoDurationText}>
                        {formatDuration(message.media_info.duration)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            {message.media_info?.filename && !showVideoPlayer && (
              <Text style={mediaStyles.mediaCaption}>
                {message.media_info.filename} ({formatFileSize(message.media_info.filesize)})
              </Text>
            )}
          </View>
        );

      case 'audio':
        return (
          <View style={mediaStyles.audioContainer}>
            <TouchableOpacity style={mediaStyles.audioPlayButton} onPress={handlePlayAudio}>
              {isAudioPlaying ? (
                <Ionicons name="pause" size={24} color="#ffffff" />
              ) : (
                <Ionicons name="play" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
            <View style={mediaStyles.audioInfo}>
              <View style={mediaStyles.audioWaveform}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      mediaStyles.audioWaveformBar,
                      { height: 3 + Math.random() * 12 },
                    ]}
                  />
                ))}
              </View>
              <Text style={mediaStyles.audioDuration}>
                {formatDuration(message.media_info?.duration)}
              </Text>
            </View>
          </View>
        );

      case 'location':
        return (
          <TouchableOpacity style={mediaStyles.locationContainer} onPress={openLocation}>
            <View style={mediaStyles.locationHeader}>
              <Ionicons name="location" size={20} color="#e74c3c" />
              <Text style={mediaStyles.locationTitle}>
                {message.location_info?.name || 'Shared Location'}
              </Text>
            </View>
            {message.location_info?.address && (
              <Text style={mediaStyles.locationAddress} numberOfLines={2}>
                {message.location_info.address}
              </Text>
            )}
            <View style={mediaStyles.locationFooter}>
              <Text style={mediaStyles.locationLink}>Open in Maps</Text>
              <Ionicons name="open-outline" size={16} color="#4a6ea9" />
            </View>
          </TouchableOpacity>
        );

      case 'text':
        if (message.content) {
          return (
            <Text style={[baseStyles.messageText, isOwnMessage ? baseStyles.ownMessageText : baseStyles.otherMessageText]}>
              {message.content}
            </Text>
          );
        }

      default:
        return null;
    }
  };

  return (
    <View style={[baseStyles.messageContainer, isOwnMessage ? baseStyles.ownMessageContainer : baseStyles.otherMessageContainer]}>
      {!isOwnMessage && (
        <View style={baseStyles.messageAvatarContainer}>
          <Image
            source={
              message.user?.avatar_url
                ? { uri: message.user.avatar_url }
                : require('./default-avatar.png')
            }
            style={baseStyles.messageAvatar}
          />
        </View>
      )}

      <View style={[baseStyles.messageBubble, isOwnMessage ? baseStyles.ownMessage : baseStyles.otherMessage]}>
        {!isOwnMessage && (
          <TouchableOpacity
            onPress={() => {
              if (onUserPress && message.user) {
                onUserPress({
                  id: message.user_id,
                  name: message.user.name,
                  avatar_url: message.user.avatar_url,
                  alias: userAlias || undefined
                });
              }
            }}
            disabled={isOwnMessage}
          >
            <Text style={baseStyles.messageUserName}>
              {userAlias || message.user?.name || 'Unknown'}
            </Text>
          </TouchableOpacity>
        )}

        {renderMessageContent()}

        <View style={baseStyles.messageFooter}>
          <TouchableOpacity onPress={toggleOptions} style={baseStyles.messageOptionsButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
          </TouchableOpacity>
        </View>

        {currentUserId && (
          <MessageReactions messageId={message.id} currentUserId={currentUserId} />
        )}

        {showOptions && (
          <View style={[baseStyles.messageOptionsContainer, isOwnMessage ? baseStyles.ownMessageOptions : baseStyles.otherMessageOptions]}>
            <TouchableOpacity style={baseStyles.messageOption} onPress={copyMessage}>
              <Ionicons name="copy-outline" size={18} color="#666" />
              <Text style={baseStyles.messageOptionText}>Copiar</Text>
            </TouchableOpacity>
            {isOwnMessage && (
              <TouchableOpacity style={baseStyles.messageOption} onPress={deleteMessage} disabled={isDeleting}>
                <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                <Text style={[baseStyles.messageOptionText, { color: '#ff6b6b' }]}>
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={baseStyles.messageOption} onPress={openReportModal}>
              <Ionicons name="flag-outline" size={18} color="#666" />
              <Text style={baseStyles.messageOptionText}>Reportar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isOwnMessage && (
        <View style={baseStyles.messageAvatarContainer}>
          <Image
            source={
              message.user?.avatar_url
                ? { uri: message.user.avatar_url }
                : require('./default-avatar.png')
            }
            style={baseStyles.messageAvatar}
          />
        </View>
      )}

      <Modal
        visible={showFullImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <TouchableOpacity
          style={mediaStyles.fullImageModalContainer}
          activeOpacity={1}
          onPress={() => setShowFullImage(false)}
        >
          <Image
            source={{ uri: message.media_info?.url }}
            style={mediaStyles.fullImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={mediaStyles.closeFullImageButton}
            onPress={() => setShowFullImage(false)}
          >
            <Ionicons name="close-circle" size={36} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={mediaStyles.downloadFullImageButton}
            onPress={downloadFile}
          >
            <Ionicons name="download" size={30} color="#ffffff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '80%',
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 20,
            elevation: 5,
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
              Reportar Mensaje
            </Text>
            <Text style={{ marginBottom: 10 }}>
              Por favor, proporcione un motivo para reportar este mensaje:
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 5,
                padding: 10,
                marginBottom: 15,
                height: 100,
                textAlignVertical: 'top',
              }}
              multiline
              placeholder="Ingrese el motivo..."
              value={reportReason}
              onChangeText={setReportReason}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={{
                  padding: 10,
                  marginRight: 10,
                }}
                onPress={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
              >
                <Text style={{ color: '#666' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#fb8436',
                  padding: 10,
                  borderRadius: 5,
                }}
                onPress={submitReport}
              >
                <Text style={{ color: 'white' }}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {downloadProgress > 0 && downloadProgress < 100 && (
        <View style={mediaStyles.downloadProgressContainer}>
          <Text style={mediaStyles.downloadProgressText}>Descargando: {downloadProgress}%</Text>
          <View style={mediaStyles.downloadProgressBarContainer}>
            <View style={[mediaStyles.downloadProgressBar, { width: `${downloadProgress}%` }]} />
          </View>
        </View>
      )}
    </View>
  );
};
