import axios, { AxiosInstance } from "axios";
import {
  User,
  Video,
  VideoDetail,
  ChannelDetail,
  Comment,
} from "@/types";
import {
  delay,
  simulateError,
  mockUsers,
  mockVideos,
  mockChannels,
  mockComments,
} from "./mockData";

// Create axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  timeout: 10000,
});

// API Service Class
class APIService {
  // Auth APIs
  async login(email: string, password: string): Promise<User> {
    try {
      await delay(800);

      // Mock API call
      if (simulateError(0.05)) {
        throw new Error("Login failed");
      }

      // Simulate finding user by email
      const user = Object.values(mockUsers).find((u) => u.email === email);
      if (!user) {
        throw new Error("User not found");
      }

      return user;
    } catch (error) {
      // Return mock user on error
      return mockUsers.currentUser;
    }
  }

  async signup(
    username: string,
    email: string,
    password: string
  ): Promise<User> {
    try {
      await delay(800);

      if (simulateError(0.05)) {
        throw new Error("Signup failed");
      }

      // Create mock new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        email,
        profileImage:
          "https://images.unsplash.com/photo-1535713566543-de1a3e64b537?w=150&h=150&fit=crop",
        subscriberCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };

      return newUser;
    } catch (error) {
      // Return default mock user on error
      return mockUsers.currentUser;
    }
  }

  async logout(): Promise<void> {
    try {
      await delay(300);
      // Mock logout
    } catch (error) {
      // Silent fail
    }
  }

  // Videos APIs
  async fetchVideos(page: number = 1, limit: number = 12): Promise<{
    videos: Video[];
    total: number;
  }> {
    try {
      await delay(600);

      if (simulateError(0.05)) {
        throw new Error("Failed to fetch videos");
      }

      const start = (page - 1) * limit;
      const end = start + limit;
      const videos = mockVideos.slice(start, end);

      return {
        videos,
        total: mockVideos.length,
      };
    } catch (error) {
      // Return all mock videos on error
      return {
        videos: mockVideos,
        total: mockVideos.length,
      };
    }
  }

  async fetchVideoDetail(videoId: string): Promise<VideoDetail> {
    try {
      await delay(500);

      if (simulateError(0.05)) {
        throw new Error("Failed to fetch video details");
      }

      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      return {
        ...video,
        comments: mockComments,
        isSubscribed: false,
        videoUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    } catch (error) {
      // Return mock video detail on error
      return {
        ...mockVideos[0],
        comments: mockComments,
        isSubscribed: false,
        videoUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  async searchVideos(query: string): Promise<Video[]> {
    try {
      await delay(400);

      if (simulateError(0.05)) {
        throw new Error("Search failed");
      }

      const results = mockVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(query.toLowerCase()) ||
          v.description.toLowerCase().includes(query.toLowerCase())
      );

      return results;
    } catch (error) {
      // Return all videos on error
      return mockVideos;
    }
  }

  async likeVideo(videoId: string): Promise<Video> {
    try {
      await delay(300);

      if (simulateError(0.05)) {
        throw new Error("Failed to like video");
      }

      const video = mockVideos.find((v) => v.id === videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      return {
        ...video,
        isLiked: !video.isLiked,
        likes: video.isLiked ? video.likes - 1 : video.likes + 1,
      };
    } catch (error) {
      // Return original video on error
      return mockVideos.find((v) => v.id === videoId) || mockVideos[0];
    }
  }

  async addComment(videoId: string, content: string): Promise<Comment> {
    try {
      await delay(500);

      if (simulateError(0.05)) {
        throw new Error("Failed to add comment");
      }

      const newComment: Comment = {
        id: `comment_${Date.now()}`,
        userId: "currentUser",
        userName: mockUsers.currentUser.username,
        userImage: mockUsers.currentUser.profileImage,
        content,
        likes: 0,
        isLiked: false,
        createdAt: new Date().toISOString().split("T")[0],
        replies: [],
      };

      return newComment;
    } catch (error) {
      // Return mock comment on error
      return {
        id: `comment_${Date.now()}`,
        userId: "currentUser",
        userName: mockUsers.currentUser.username,
        userImage: mockUsers.currentUser.profileImage,
        content,
        likes: 0,
        isLiked: false,
        createdAt: new Date().toISOString().split("T")[0],
        replies: [],
      };
    }
  }

  // Channel APIs
  async fetchChannelDetail(channelId: string): Promise<ChannelDetail> {
    try {
      await delay(600);

      if (simulateError(0.05)) {
        throw new Error("Failed to fetch channel");
      }

      const channel = mockChannels[channelId];
      if (!channel) {
        throw new Error("Channel not found");
      }

      return channel;
    } catch (error) {
      // Return first mock channel on error
      return Object.values(mockChannels)[0];
    }
  }

  async subscribeChannel(channelId: string): Promise<ChannelDetail> {
    try {
      await delay(300);

      if (simulateError(0.05)) {
        throw new Error("Failed to subscribe");
      }

      const channel = mockChannels[channelId];
      if (!channel) {
        throw new Error("Channel not found");
      }

      return {
        ...channel,
        isSubscribed: !channel.isSubscribed,
        subscriberCount: channel.isSubscribed
          ? channel.subscriberCount - 1
          : channel.subscriberCount + 1,
      };
    } catch (error) {
      // Return original channel on error
      return mockChannels[channelId] || Object.values(mockChannels)[0];
    }
  }
}

export const apiService = new APIService();
