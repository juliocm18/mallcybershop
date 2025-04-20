import React from 'react';
import { View, Text } from 'react-native';
import { MessageBubbleProps } from '../types';
import { styles } from '../styles';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.messageBubble,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && message.user?.name && (
        <Text style={styles.userName}>{message.user.name}</Text>
      )}
      <Text style={[
        styles.messageText,
        isOwnMessage ? styles.ownMessageText : styles.otherMessageText
      ]}>
        {message.content}
      </Text>
      <Text style={[
        styles.messageTime,
        isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
      ]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
};
