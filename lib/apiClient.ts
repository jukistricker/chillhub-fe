import { store } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Mở rộng interface của Axios để nhận thêm flag cấu hình phục vụ luồng refresh
declare module 'axios' {
  export interface AxiosRequestConfig {
    requireAuth?: boolean;
    _retry?: boolean; // Đánh dấu request đã được thử lại sau khi refresh token
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Các biến phục vụ hàng đợi (Queue) chống spam API refresh-token khi nhiều API cùng lỗi 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor
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

// 2. Response Interceptor (Gộp làm 1 để tránh xung đột dữ liệu)
api.interceptors.response.use(
  (response) => {
    // Trả trực tiếp data về cho Service đỡ phải gọi .data nhiều lần
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Kiểm tra lỗi 401 và request này chưa từng được retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Nếu đang trong quá trình refresh token, cho các request sau xếp hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest); // Gọi lại request cũ với token mới
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (typeof window !== 'undefined') {
        const currentAccessToken = localStorage.getItem("access_token") || '';
        const currentRefreshToken = localStorage.getItem("refresh_token") || ''; // Đảm bảo bạn có lưu refresh_token khi Login/Signup thành công nhé

        try {
          // Gọi API refresh token. 
          // Dùng axios gốc (axios.post) thay vì instance 'api' để tránh bị interceptor này chặn đè tiếp gây lặp vô hạn (Infinite Loop).
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            accessToken: currentAccessToken,
            refreshToken: currentRefreshToken
          });

          // Giả định Backend .NET trả về object chứa { accessToken, refreshToken }
          const { accessToken, refreshToken } = response.data; 

          // Cập nhật lại Storage
          localStorage.setItem("access_token", accessToken);
          if (refreshToken) {
            localStorage.setItem("refresh_token", refreshToken);
          }

          // Cập nhật token mới cho request hiện tại
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Giải phóng hàng đợi cho các API đang chờ
          processQueue(null, accessToken);

          // Thực thi lại request lỗi ban đầu
          return api(originalRequest);

        } catch (refreshError) {
          // Nếu API refresh token cũng tạch (Hết hạn cả đôi) -> Logout sạch sẽ
          processQueue(refreshError, null);
          
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          store.dispatch(logoutUser.fulfilled(null, '')); 
          
          // Bạn có thể redirect về trang chủ hoặc login tùy ý ở đây
          // window.location.href = '/';

          const message = (refreshError as any).response?.data?.message || (refreshError as any).message;
          return Promise.reject(new Error(message));
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Đối với các lỗi khác không phải 401, hoặc luồng refresh thất bại hoàn toàn
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

export default api;