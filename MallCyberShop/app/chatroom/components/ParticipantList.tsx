import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/app/supabase';
import { styles } from '../styles';
import { ParticipantListProps, UserProfile } from '../types';

export const ParticipantList: React.FC<ParticipantListProps> = ({
  roomId,
  onParticipantClick,
  selectedParticipant,
  currentUserId
}) => {
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
    const channel = subscribeToParticipants();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId]);

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          user_id,
          profile:profiles!room_participants_user_id_fkey (
            id,
            name,
            avatar_url,
            status:user_status!user_status_user_id_fkey (
              is_online,
              last_seen
            )
          )
        `)
        .eq('room_id', roomId)
        .neq('user_id', currentUserId);

      if (error) throw error;

      const formattedParticipants: UserProfile[] = (data || []).map(item => ({
        id: item.profile.id,
        name: item.profile.name || 'Anonymous',
        avatar_url: item.profile.avatar_url,
        status: {
          is_online: item.profile.status?.is_online || false,
          last_seen: item.profile.status?.last_seen || new Date().toISOString()
        }
      }));

      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToParticipants = () => {
    return supabase
      .channel('room-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();
  };

  if (loading) {
    return (
      <View style={[styles.participantListContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color="#0084ff" />
      </View>
    );
  }

  return (
    <View style={styles.participantListContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.participantListContainer}
      >
        {participants.map((participant) => (
          <TouchableOpacity
            key={participant.id}
            style={[
              styles.participantItem,
              selectedParticipant === participant.id && styles.selectedParticipant
            ]}
            onPress={() => onParticipantClick(participant)}
          >
            <View style={[
              styles.participantAvatarContainer,
              participant.status?.is_online && styles.onlineIndicator
            ]}>
              <Image
                source={
                  participant.avatar_url
                    ? { uri: participant.avatar_url }
                    : require('./default-avatar.png')
                }
                style={styles.participantAvatar}
              />
            </View>
            <Text style={styles.participantName} numberOfLines={1}>
              {participant.name || 'Anonymous'}
            </Text>
            {participant.status?.is_online && (
              <View style={styles.onlineBadge} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
