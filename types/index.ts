import { SubscribersState } from "@/store/slices/subscriberSlice";
import { MediaHistory } from "./history";
import { Media } from "./media";
import { CategoriesState } from "@/store/slices/categorySlice";

// User & Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider?: string;
  externalId?: string;
  lang: number;
  roles: { id: string; name: string }[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number; // in seconds
  views: number;
  likes: number;
  isLiked: boolean;
  channelId: string;
  channelName: string;
  channelImage: string;
  createdAt: string;
  userId: string;
}

export interface MediaDetail extends Media {
  comments: Comment[];
  isSubscribed: boolean;
  videoUrl: string; // Đường dẫn file stream từ BE
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
  replies: Comment[];
}

// Channel Types
export interface Channel {
  id: string;
  name: string;
  description: string;
  image: string;
  bannerImage: string;
  subscriberCount: number;
  isSubscribed: boolean;
  videoCount: number;
  userId: string;
  createdAt: string;
}

export interface ChannelDetail extends Channel {
  videos: Video[];
}

export interface MediaState {
  items: Media[];
  nextCursor: string | null;
  pageSize: number;
  isDescending: boolean;
  search: string;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  selectedMedia: Media | null;
  isSubscribed: boolean;
  isNoticed: boolean;
  subscribing: boolean;
}


// Channels State
export interface ChannelsState {
  channels: Channel[];
  channelDetail: ChannelDetail | null;
  loading: boolean;
  error: string | null;
}

export interface MediaHistoryState {
  items: MediaHistory[];
  loading: boolean;
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

// UI State
export interface UIState {
  sidebarOpen: boolean;
  searchQuery: string;
}

// Root State Type
export interface RootState {
  auth: AuthState;
  medias: MediaState;
  channels: ChannelsState;
  ui: UIState;
  histories: MediaHistoryState
  comments: any
  subscribers: SubscribersState
  categories: CategoriesState
}
