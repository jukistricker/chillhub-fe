import api from '@/lib/apiClient';
import { ChannelDetail } from '@/types';

export const channelService = {
  fetchChannelDetail: async (channelId: string): Promise<ChannelDetail> => {
    const response = await api.get<ChannelDetail>(`/channels/${channelId}`, {
      requireAuth: false,
    });
    return response.data;
  },

  subscribeChannel: async (channelId: string): Promise<ChannelDetail> => {
    const response = await api.post<ChannelDetail>(`/channels/${channelId}/subscribe`,{requireAuth: true});
    return response.data;
  }
};