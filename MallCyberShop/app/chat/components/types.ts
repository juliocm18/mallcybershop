import { Message, UserProfile } from "../models";

export interface MessageChat extends Message {
  isMe: boolean;
  sender?: UserProfile
}

export interface ChatProps {
  chatType: 'group' | 'private';
  chatId: string;
  title?: string;
  users?: UserProfile[];
  currentUser?: UserProfile;
  recipientUser?: UserProfile;
  initialMessages?: MessageChat[];
  onBack?: () => void;
  onUserSelect?: (user: UserProfile) => void;
}

export const CHAT_TYPES = {
  GROUP: 'group',
  PRIVATE: 'private'
};

export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
};

export const USER_STATUS = {
  ONLINE: 'online',
  TYPING: 'typing',
  OFFLINE: 'offline'
};