import { API_ENDPOINTS } from '@/configs/api_endpoints';
import api from '@/lib/apiClient';
import { User } from '@/types';

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
    await api.post('/auth/logout',
        { requireAuth: true } 
    ); 
    if (typeof window !== 'undefined') {
      localStorage.removeItem("access_token");
    }
  },

  info: async (): Promise<any> => {
  const response = await api.get<any>(API_ENDPOINTS.AUTH.INFO, {
    requireAuth: true,
  });
  
  return response.data.user;
}
};