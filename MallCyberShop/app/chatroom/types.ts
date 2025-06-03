import { User } from '@supabase/supabase-js';

export interface UserAlias {
  id: string;
  user_id: string;
  target_user_id: string;
  alias: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  status?: {
    is_online: boolean;
    last_seen: string;
  };
  roomId?: string;
  alias?: string; // Custom alias set by the current user
}

export type MessageType = 'text' | 'image' | 'pdf' | 'video' | 'audio' | 'location';

export interface MediaInfo {
  url: string;
  filename?: string;
  filesize?: number;
  duration?: number; // For audio/video in seconds
  thumbnail_url?: string; // For video thumbnails
}

export interface LocationInfo {
  url: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  room_id: string;
  user_id: string;
  recipient_id?: string;
  is_private: boolean;
  message_type: MessageType;
  media_info?: MediaInfo;
  location_info?: LocationInfo;
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

interface Profile {
  name: string;
  avatar_url?: string;
}

export interface RoomResponse {
  id: string;
  type: 'group' | 'individual';
  name?: string;
  created_by: string;
  recipient_id?: string;
  creator: Profile | null;
  recipient: Profile | null;
}

export interface RoomDetails {
  id: string;
  type: 'group' | 'individual';
  name?: string;
  created_by: string;
  recipient_id?: string;
  creator?: Profile;
  recipient?: Profile;
}

export interface ChatRoomProps {
  //roomId: string;
  currentUser: {
    id: string;
    name?: string;
  };
  chatType?: 'group' | 'individual';
  recipientId?: string;
  onParticipantSelect?: (user: UserProfile & { roomId: string }) => void;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  currentUserId: string;
  onUserPress?: (user: UserProfile) => void;
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
  last_seen?: string;
}

export interface OnlineUsersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (user: UserProfile & { roomId: string }) => void;
  currentUserId: string;
  chatType: 'individual' | 'group';
}
