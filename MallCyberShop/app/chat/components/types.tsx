export interface Message {
    id: string;
    text: string;
    sender: string; // ID del usuario
    isMe: boolean;
    time: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
  }
  
  export interface UserChat {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'typing';
    lastSeen?: string;
  }
  
  export interface ChatProps {
    chatType: 'group' | 'private';
    chatId: string;
    title?: string;
    users?: UserChat[];
    currentUser?: UserChat;
    initialMessages?: Message[];
    onBack?: () => void;
    onUserSelect?: (user: UserChat) => void;
  }