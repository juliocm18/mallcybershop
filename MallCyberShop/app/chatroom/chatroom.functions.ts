import { Message } from "./types";

export  const transformMessage = (msg: any): Message => ({
    id: msg.id,
    content: msg.content,
    created_at: msg.created_at,
    room_id: msg.room_id,
    user_id: msg.user_id,
    recipient_id: msg.recipient_id,
    is_private: msg.is_private,
    message_type: msg.message_type || 'text',
    media_info: msg.media_info || undefined,
    location_info: msg.location_info || undefined,
    user: {
      name: msg.user?.name || 'Unknown',
      avatar_url: msg.user?.avatar_url
    }
  });