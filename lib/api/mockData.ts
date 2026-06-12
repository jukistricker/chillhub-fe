import {
  User,
  Video,
  VideoDetail,
  Channel,
  ChannelDetail,
  Comment,
} from "@/types";

// Mock Users
export const mockUsers: Record<string, User> = {
  user1: {
    id: "user1",
    username: "TechTuber",
    email: "tech@example.com",
    profileImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    subscriberCount: 150000,
    createdAt: "2021-01-15",
  },
  user2: {
    id: "user2",
    username: "CodeMaster",
    email: "code@example.com",
    profileImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    subscriberCount: 85000,
    createdAt: "2021-03-20",
  },
  user3: {
    id: "user3",
    username: "CreativeArtist",
    email: "creative@example.com",
    profileImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&h=150&fit=crop",
    subscriberCount: 125000,
    createdAt: "2020-06-10",
  },
  currentUser: {
    id: "currentUser",
    username: "You",
    email: "user@example.com",
    profileImage:
      "https://images.unsplash.com/photo-1535713566543-de1a3e64b537?w=150&h=150&fit=crop",
    subscriberCount: 450,
    createdAt: "2023-01-01",
  },
};

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: "comment1",
    userId: "user2",
    userName: "CodeMaster",
    userImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop",
    content: "This is amazing! Great tutorial, very clear and detailed.",
    likes: 245,
    isLiked: false,
    createdAt: "2024-01-10",
    replies: [
      {
        id: "reply1",
        userId: "user1",
        userName: "TechTuber",
        userImage:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop",
        content: "Thanks! Glad you found it helpful.",
        likes: 52,
        isLiked: false,
        createdAt: "2024-01-11",
        replies: [],
      },
    ],
  },
  {
    id: "comment2",
    userId: "user3",
    userName: "CreativeArtist",
    userImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=48&h=48&fit=crop",
    content: "Loved the production quality. Keep up the great work!",
    likes: 189,
    isLiked: false,
    createdAt: "2024-01-09",
    replies: [],
  },
];

// Mock Videos
export const mockVideos: Video[] = [
  {
    id: "video1",
    title: "Ultimate Guide to Modern React 2024 - Hooks, Context & Performance",
    description: "Learn everything about React in 2024",
    thumbnail:
      "https://images.unsplash.com/photo-1633356713697-fdf0f4a6bcf4?w=320&h=180&fit=crop",
    duration: 1245,
    views: 524000,
    likes: 8900,
    isLiked: false,
    channelId: "channel1",
    channelName: "TechTuber",
    channelImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop",
    createdAt: "2024-01-15",
    userId: "user1",
  },
  {
    id: "video2",
    title: "TypeScript Advanced Patterns - Master the Type System",
    description: "Deep dive into TypeScript type system",
    thumbnail:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=320&h=180&fit=crop",
    duration: 2100,
    views: 312000,
    likes: 5600,
    isLiked: false,
    channelId: "channel2",
    channelName: "CodeMaster",
    channelImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop",
    createdAt: "2024-01-12",
    userId: "user2",
  },
  {
    id: "video3",
    title: "Next.js 14 App Router - Full Tutorial for Beginners",
    description: "Complete guide to Next.js 14 App Router",
    thumbnail:
      "https://images.unsplash.com/photo-1633356713697-fdf0f4a6bcf4?w=320&h=180&fit=crop",
    duration: 1890,
    views: 456000,
    likes: 7200,
    isLiked: false,
    channelId: "channel1",
    channelName: "TechTuber",
    channelImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop",
    createdAt: "2024-01-10",
    userId: "user1",
  },
  {
    id: "video4",
    title: "Web Design Trends 2024 - Beautiful & Modern Websites",
    description: "Latest web design trends and techniques",
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=320&h=180&fit=crop",
    duration: 1500,
    views: 189000,
    likes: 3400,
    isLiked: false,
    channelId: "channel3",
    channelName: "CreativeArtist",
    channelImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=48&h=48&fit=crop",
    createdAt: "2024-01-08",
    userId: "user3",
  },
  {
    id: "video5",
    title: "Redux Toolkit vs Zustand - State Management Showdown",
    description: "Comparing modern state management solutions",
    thumbnail:
      "https://images.unsplash.com/photo-1633356713697-fdf0f4a6bcf4?w=320&h=180&fit=crop",
    duration: 1680,
    views: 267000,
    likes: 4800,
    isLiked: false,
    channelId: "channel2",
    channelName: "CodeMaster",
    channelImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop",
    createdAt: "2024-01-05",
    userId: "user2",
  },
  {
    id: "video6",
    title: "CSS Grid Mastery - Build Complex Layouts",
    description: "Master CSS Grid for responsive layouts",
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=320&h=180&fit=crop",
    duration: 945,
    views: 178000,
    likes: 2900,
    isLiked: false,
    channelId: "channel3",
    channelName: "CreativeArtist",
    channelImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=48&h=48&fit=crop",
    createdAt: "2024-01-03",
    userId: "user3",
  },
];

// Mock Channels
export const mockChannels: Record<string, ChannelDetail> = {
  channel1: {
    id: "channel1",
    name: "TechTuber",
    description:
      "Welcome to TechTuber! I create in-depth tutorials on modern web development, JavaScript, React, and everything web tech. Subscribe for weekly videos!",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    bannerImage:
      "https://images.unsplash.com/photo-1633356713697-fdf0f4a6bcf4?w=1200&h=300&fit=crop",
    subscriberCount: 150000,
    isSubscribed: false,
    videoCount: 285,
    userId: "user1",
    createdAt: "2021-01-15",
    videos: mockVideos.filter((v) => v.userId === "user1"),
  },
  channel2: {
    id: "channel2",
    name: "CodeMaster",
    description:
      "Advanced programming tutorials. From TypeScript to system design. Level up your coding skills!",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    bannerImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=300&fit=crop",
    subscriberCount: 85000,
    isSubscribed: false,
    videoCount: 156,
    userId: "user2",
    createdAt: "2021-03-20",
    videos: mockVideos.filter((v) => v.userId === "user2"),
  },
  channel3: {
    id: "channel3",
    name: "CreativeArtist",
    description:
      "UI/UX Design, Web Design Trends, and Creative Development. Creating beautiful digital experiences.",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&h=150&fit=crop",
    bannerImage:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=300&fit=crop",
    subscriberCount: 125000,
    isSubscribed: false,
    videoCount: 198,
    userId: "user3",
    createdAt: "2020-06-10",
    videos: mockVideos.filter((v) => v.userId === "user3"),
  },
};

// Helper functions for mock API delays
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const simulateError = (probability: number = 0.1) => {
  return Math.random() < probability;
};
