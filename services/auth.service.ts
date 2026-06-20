import { API_ENDPOINTS } from '@/configs/api_endpoints';
import api from '@/lib/apiClient';
import { User } from '@/types';
import axios from 'axios';

export const authService = {
  login: async (email: string, password: string): Promise<any> => {
    const response = await api.post<any>(
      '/auth/login', 
      { email, password }
    );
    
    return response.data;
  },

  signup: async (username: string, email: string, password: string): Promise<User> => {
    const response = await api.post<User>(
      '/auth/signup',
      { username, email, password }
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
  await api.post(
    '/auth/logout',
    {}, // Tham số thứ 2: data (body) gửi lên, để trống nếu backend không yêu cầu
    { requireAuth: true } // Tham số thứ 3: config của Axios (Nơi chứa requireAuth)
  ); 
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
},

  info: async (): Promise<any> => {
  const response = await api.get<any>(API_ENDPOINTS.AUTH.INFO, {
    requireAuth: true,
  });
  console.log("response", response.data)
  return response.data;
},
refreshToken: async (): Promise<any> => {
    if (typeof window === 'undefined') return null;

    const currentAccessToken = localStorage.getItem("access_token") || '';
    const currentRefreshToken = localStorage.getItem("refresh_token") || '';

    if (!currentAccessToken || !currentRefreshToken) {
      throw new Error("No tokens found in localStorage");
    }

    // Bắt buộc dùng axios gốc thay vì instance 'api' để tránh bị interceptor chặn ngược lại
    const response = await axios.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
      accessToken: currentAccessToken,
      refreshToken: currentRefreshToken
    });

    const { accessToken, refreshToken } = response.data;

    // Cập nhật lại vào localStorage
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    return response.data;
  }
};