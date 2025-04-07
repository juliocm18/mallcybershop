export interface UserSession {
    id?: string
    userId: string
    isOnline: boolean
    typing: boolean
    createdAt?: string
    updatedAt?: string
}

export interface UserProfile {
    id?: string;
    name: string;
    avatar?: string;
    status: 'online' | 'offline' | 'typing';
    lastSeen?: string;
    city?: string;
    country?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Chat {
    id?: string
    name: string
    type: 'group' | 'private'
    country?: string
    city?: string
    recipientId?: string
    createdAt?: string
    updatedAt?: string
    status?: 'active' | 'inactive' | 'deleted'
}

export interface Message {
    id?: string;
    chatId: string;
    senderId: string;
    text: string;
    time: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    isLiked?: boolean
    likes?: string[]
    createdAt?:string;
    updatedAt?:string;
}