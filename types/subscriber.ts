import { CursorRequest } from "./base";

export interface ChannelUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface Subscriber {
  id: string;
  subscriberId: string;
  channelId: string;
  isNotice: boolean;
  createdAt: string;
  channel: ChannelUser; 
}

export interface SubscriberFilterRequest extends CursorRequest {
  subscriberId?: string; 
  channelId?: string | null;
}