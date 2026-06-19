import { store } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import axios, { AxiosInstance } from 'axios';

// Mở rộng interface của Axios
declare module 'axios' {
  export interface AxiosRequestConfig {
    requireAuth?: boolean;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const requireAuth = config.requireAuth ?? false;

    if (requireAuth && typeof window !== 'undefined') {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log("response",response)
    return response;
  },
  (error) => {
    // Ném lỗi ra ngoài kèm theo message từ backend (nếu có)
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Kiểm tra lỗi 401
    if (error.response?.status === 401) {
      // 1. Xóa token ở localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("access_token");
      }
      
      store.dispatch(logoutUser.fulfilled(null, '')); 
      
    }
    
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export default api;