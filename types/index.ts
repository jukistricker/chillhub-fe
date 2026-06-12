// User & Auth Types
export interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string;
  subscriberCount: number;
  createdAt: string;
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

export interface VideoDetail extends Video {
  comments: Comment[];
  isSubscribed: boolean;
  videoUrl: string;
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

// Videos State
export interface VideosState {
  videos: Video[];
  videoDetail: VideoDetail | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Channels State
export interface ChannelsState {
  channels: Channel[];
  channelDetail: ChannelDetail | null;
  loading: boolean;
  error: string | null;
}

// Theme State
export interface ThemeState {
  theme: 'light' | 'dark';
}

// UI State
export interface UIState {
  sidebarOpen: boolean;
  searchQuery: string;
}

// Root State Type
export interface RootState {
  auth: AuthState;
  videos: VideosState;
  channels: ChannelsState;
  theme: ThemeState;
  ui: UIState;
}
