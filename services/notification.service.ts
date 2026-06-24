import api from '@/lib/apiClient';



export const notificationService = {
  // Fetch danh sách thông báo (mặc định pageSize = 10 theo BE của bạn)
  getNotifications: async (cursor: string | null = null, pageSize = 10) => {
    const params = new URLSearchParams({ PageSize: pageSize.toString() });
    if (cursor) params.append('Cursor', cursor);
    
    // api (axios instance) đã được cấu hình tự đính kèm Token
    const response = await api.get(`/notifications?${params.toString()}`,{requireAuth:true});
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    return await api.patch('/notifications/read-all', {}, { requireAuth: true });
  }
};