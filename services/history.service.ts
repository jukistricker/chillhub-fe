import api from "@/lib/apiClient";
import { MediaHistoryFilterRequest } from "@/types/history";

export const mediaHistoryService = {
  fetchHistories: async (request: MediaHistoryFilterRequest = {}) => {
    const params: Record<string, any> = {
      pageSize: request.pageSize ?? 12,
      isDescending: request.isDescending ?? true,
    };

    // Chỉ đẩy lên các tham số có giá trị
    if (request.cursor) params.cursor = request.cursor;
    if (request.search) params.search = request.search;
    if (request.id) params.id = request.id;

    const response = await api.get('/media-history', {
      params,
      requireAuth: true, 
    });
    return response.data;
  },
};

