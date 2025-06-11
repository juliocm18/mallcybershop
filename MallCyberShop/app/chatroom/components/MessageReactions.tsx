import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../supabase';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user_name: string;
}

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, currentUserId }) => {
  const [reactions, setReactions] = useState<{ [key: string]: Reaction[] }>({});
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [totalReactions, setTotalReactions] = useState(0);

  useEffect(() => {
    fetchReactions();

    // Subscribe to reaction changes
    const subscription = supabase
      .channel(`message-reactions-${messageId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `message_id=eq.${messageId}`
      }, () => {
        fetchReactions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [messageId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          id,
          message_id,
          user_id,
          emoji,
          created_at,
          profiles:user_id (name)
        `)
        .eq('message_id', messageId);

      if (error) throw error;

      if (data) {
        // Group reactions by emoji
        const groupedReactions: { [key: string]: Reaction[] } = {};
        let count = 0;
        
        data.forEach((item: any) => {
          const reaction: Reaction = {
            id: item.id,
            message_id: item.message_id,
            user_id: item.user_id,
            emoji: item.emoji,
            created_at: item.created_at,
            user_name: item.profiles?.name || 'Unknown User'
          };
          
          if (!groupedReactions[reaction.emoji]) {
            groupedReactions[reaction.emoji] = [];
          }
          
          groupedReactions[reaction.emoji].push(reaction);
          count++;
        });
        
        setReactions(groupedReactions);
        setTotalReactions(count);
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  };

  const addReaction = async (emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const userReactionWithEmoji = Object.values(reactions)
        .flat()
        .find(r => r.user_id === currentUserId && r.emoji === emoji);

      if (userReactionWithEmoji) {
        // Remove the reaction if it exists
        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', userReactionWithEmoji.id);
      } else {
        // Add new reaction
        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            emoji: emoji,
            created_at: new Date().toISOString()
          });
      }

      // Explicitly fetch reactions to update UI immediately
      await fetchReactions();
      
      // Close reaction picker
      setShowReactionPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const renderReactionButton = (emoji: string, count: number, hasReacted: boolean) => {
    return (
      <TouchableOpacity 
        style={[styles.reactionButton, hasReacted && styles.reactionButtonActive]}
        onPress={() => addReaction(emoji)}
      >
        <Text style={styles.emojiText}>{emoji}</Text>
        {count > 0 && (
          <Text style={styles.reactionCount}>{count}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Existing reactions */}
      <View style={styles.reactionsContainer}>
        {Object.entries(reactions).map(([emoji, users]) => {
          const hasUserReacted = users.some(r => r.user_id === currentUserId);
          return renderReactionButton(emoji, users.length, hasUserReacted);
        })}
      </View>
      
      {/* Add reaction button */}
      <TouchableOpacity 
        style={styles.addReactionButton}
        onPress={() => setShowReactionPicker(true)}
      >
        <Ionicons name="add-circle-outline" size={16} color="#777" />
      </TouchableOpacity>

      {/* Reaction picker modal */}
      <Modal
        transparent
        visible={showReactionPicker}
        animationType="fade"
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReactionPicker(false)}
        >
          <View style={styles.reactionPickerContainer}>
            {AVAILABLE_REACTIONS.map(emoji => (
              <TouchableOpacity 
                key={emoji}
                style={styles.reactionPickerItem}
                onPress={() => addReaction(emoji)}
              >
                <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  reactionButtonActive: {
    backgroundColor: '#e6f7ff',
    borderColor: '#4a6ea9',
    borderWidth: 1,
  },
  emojiText: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: '#666',
  },
  addReactionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionPickerItem: {
    padding: 8,
    marginHorizontal: 4,
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },
});
