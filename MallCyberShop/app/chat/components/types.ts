import { Message, UserProfile } from "../models";

export interface MessageChat extends Message {
  isMe: boolean;
  sender?: UserProfile
}

