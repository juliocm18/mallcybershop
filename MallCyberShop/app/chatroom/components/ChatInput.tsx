import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatInputProps } from '../types';
import { styles } from '../styles';

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    try {
      setSending(true);
      await onSendMessage(message.trim());
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message..."
        multiline
        maxLength={500}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!message.trim() || sending || disabled) && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={!message.trim() || sending || disabled}
      >
        {sending ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Ionicons name="send" size={24} color="#ffffff" />
        )}
      </TouchableOpacity>
    </View>
  );
};
