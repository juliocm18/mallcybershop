import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  status?: {
    is_online: boolean;
    last_seen: string;
  };
  roomId?: string;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  room_id: string;
  user_id: string;
  recipient_id?: string;
  is_private: boolean;
  user: {
    name: string;
    avatar_url?: string;
  };
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  is_private: boolean;
  type: 'group' | 'individual';
  participants?: User[];
  last_message?: Message;
}

export interface ChatRoomProps {
  roomId: string;
  currentUser: {
    id: string;
  };
  chatType?: 'group' | 'individual';
  recipientId?: string;
  onParticipantSelect?: (user: UserProfile & { roomId: string }) => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export interface ParticipantListProps {
  roomId: string;
  currentUserId: string;
  onParticipantClick: (participant: UserProfile) => void;
  selectedParticipant?: string;
}

export interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  recipientId?: string;
}

export const REALTIME_LISTEN_TYPES = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
} as const;

export interface UserStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
}

export interface OnlineUsersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: UserProfile & { roomId: string }) => void;
  currentUserId: string;
}
