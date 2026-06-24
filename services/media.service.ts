import api from '@/lib/apiClient';
import { Video, MediaDetail, Comment } from '@/types';
import { MediaCreateRequest } from '@/types/media';
const QUEUE_WORKER_URL = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL||"";
export const mediaService = {
create: async (data: MediaCreateRequest) => {
    const response = await api.post(QUEUE_WORKER_URL, data,{ requireAuth:true});
    return response.data;
  },
  fetchVideos: async (page: number = 1, limit: number = 12): Promise<{ videos: Video[]; total: number }> => {
    const response = await api.get('/videos', {
      params: { page, limit },
      requireAuth: false, 
    });
    return response.data;
  },

  fetchVideoDetail: async (videoId: string): Promise<MediaDetail> => {
    const response = await api.get<MediaDetail>(`/videos/${videoId}`, {
      requireAuth: false,
    });
    return response.data;
  },

  searchVideos: async (query: string): Promise<Video[]> => {
    const response = await api.get<Video[]>('/videos/search', {
      params: { q: query },
      requireAuth: false,
    });
    return response.data;
  },

  likeVideo: async (videoId: string): Promise<Video> => {
    const response = await api.post<Video>(
        `/videos/${videoId}/like`, {
      requireAuth: true,
    }
    );
    return response.data;
  },

  addComment: async (videoId: string, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(
        `/videos/${videoId}/comments`, 
        { content }, 
        { requireAuth: true,}
    );
    return response.data;
  },

  getSubscriberStatus: async (channelId: string) => {
    const response = await api.get(`/subscribers/status/${channelId}`, {
      requireAuth: true,
    });
    console.log("getSubscriberStatus",response.data)
    return response.data; 
  },

  batchSubscribe: async (requests: Array<{ subscriberId: string; channelId: string; isNotice: boolean; createdAt: string }>) => {
    const response = await api.post('/subscribers/batch-subscribe', requests, {
      requireAuth: true,
    });
    return response.data;
  },

  batchUnsubscribe: async (requests: Array<{ subscriberId: string; channelId: string; createdAt: string }>) => {
    const response = await api.post('/subscribers/batch-unsubscribe', requests, {
      requireAuth: true,
    });
    return response.data;
  }
};