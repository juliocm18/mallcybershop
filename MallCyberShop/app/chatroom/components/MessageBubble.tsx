import React from 'react';
import { View, Text, Image } from 'react-native';
import { MessageBubbleProps } from '../types';
import { styles } from '../styles';

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {formatTime(message.created_at)}
        </Text>
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
