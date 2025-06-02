import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, Clipboard, Modal, TextInput } from 'react-native';
import { MessageBubbleProps } from '../types';
import { styles } from '../styles';
import { MessageReactions } from './MessageReactions';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/supabase';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, currentUserId }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', message.id)
                .eq('user_id', currentUserId); // Ensure the user can only delete their own messages

              if (error) {
                console.error('Error deleting message:', error);
                Alert.alert('Error', 'Failed to delete message. Please try again.');
              } else {
                // Message deleted successfully
                setShowOptions(false);
              }
            } catch (error) {
              console.error('Error in deleteMessage:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  const openReportModal = () => {
    setShowReportModal(true);
    setShowOptions(false);
  };
  
  const submitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting this message.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('message_reports')
        .insert({
          message_id: message.id,
          reporter_id: currentUserId,
          reason: reportReason,
          status: 'pending' // Initial status
        });

      if (error) {
        console.error('Error reporting message:', error);
        Alert.alert('Error', 'Failed to report message. Please try again.');
      } else {
        Alert.alert('Thank you', 'Your report has been submitted and will be reviewed.');
        setShowReportModal(false);
        setReportReason('');
      }
    } catch (error) {
      console.error('Error in reportMessage:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {!isOwnMessage && (
        <View style={styles.messageAvatarContainer}>
          <Image
            source={
              message.user?.avatar_url
                ? { uri: message.user.avatar_url }
                : require('./default-avatar.png')
            }
            style={styles.messageAvatar}
          />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && message.user?.name && (
          <Text style={styles.messageUserName}>{message.user.name}</Text>
        )}
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(message.created_at)}
          </Text>
          <TouchableOpacity onPress={toggleOptions} style={styles.messageOptionsButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
          </TouchableOpacity>
        </View>
        
        {/* Message reactions */}
        {currentUserId && (
          <MessageReactions 
            messageId={message.id} 
            currentUserId={currentUserId} 
          />
        )}
        
        {/* Message options */}
        {showOptions && (
          <View style={[
            styles.messageOptionsContainer,
            isOwnMessage ? styles.ownMessageOptions : styles.otherMessageOptions
          ]}>
            <TouchableOpacity style={styles.messageOption} onPress={copyMessage}>
              <Ionicons name="copy-outline" size={18} color="#666" />
              <Text style={styles.messageOptionText}>Copy</Text>
            </TouchableOpacity>
            {isOwnMessage && (
              <TouchableOpacity style={styles.messageOption} onPress={deleteMessage} disabled={isDeleting}>
                <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                <Text style={[styles.messageOptionText, { color: '#ff6b6b' }]}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.messageOption} onPress={openReportModal}>
              <Ionicons name="flag-outline" size={18} color="#666" />
              <Text style={styles.messageOptionText}>Report</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Report Modal */}
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
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            <View style={{
              width: '80%',
              backgroundColor: 'white',
              borderRadius: 10,
              padding: 20,
              elevation: 5
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
                Report Message
              </Text>
              <Text style={{ marginBottom: 10 }}>
                Please provide a reason for reporting this message:
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 5,
                  padding: 10,
                  marginBottom: 15,
                  height: 100,
                  textAlignVertical: 'top'
                }}
                multiline
                placeholder="Enter reason here..."
                value={reportReason}
                onChangeText={setReportReason}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  style={{
                    padding: 10,
                    marginRight: 10
                  }}
                  onPress={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                >
                  <Text style={{ color: '#666' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fb8436',
                    padding: 10,
                    borderRadius: 5
                  }}
                  onPress={submitReport}
                >
                  <Text style={{ color: 'white' }}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      {isOwnMessage && (
        <View style={styles.messageAvatarContainer}>
          <Image
            source={
              message.user?.avatar_url
                ? { uri: message.user.avatar_url }
                : require('./default-avatar.png')
            }
            style={styles.messageAvatar}
          />
        </View>
      )}
    </View>
  );
};
