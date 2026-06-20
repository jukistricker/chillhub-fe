'use client'

import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { store, useAppDispatch } from '@/store'
import { useEffect } from 'react'
import { userInfo, logoutUser } from '@/store/slices/authSlice' 
import { authService } from '@/services/auth.service'

// Tạo một component mồi để chạy logic check Auth và Refresh Token ngầm
function AuthHydration({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Kiểm tra và lấy thông tin user ngay khi vào app
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(userInfo());
    }

    // 2. Thiết lập cấu hình tự động Refresh Token mỗi 10 phút
    const TEN_MINUTES = 10 * 60 * 1000;

    const triggerRefresh = async () => {
      const hasToken = localStorage.getItem("access_token");
      if (!hasToken) return;

      try {
        console.log("🔄 Hệ thống tự động kích hoạt làm mới Token...");
        await authService.refreshToken();
        console.log("✅ Làm mới Token tự động thành công!");
      } catch (error) {
        console.error("❌ Tự động làm mới Token thất bại:", error);
        
        // Nếu refresh token cũng hết hạn -> Thực hiện logout sạch sẽ
        if (typeof window !== 'undefined') {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        dispatch(logoutUser.fulfilled(null, ''));
      }
    };

    // Tạo vòng lặp chạy ngầm mỗi 10 phút
    const interval = setInterval(triggerRefresh, TEN_MINUTES);

    // Clear interval để tránh memory leak khi component unmount
    return () => clearInterval(interval);
  }, [dispatch]);

  return <>{children}</>;
}

interface RootLayoutClientProps {
  children: React.ReactNode
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <Provider store={store}>
      {/* Bọc AuthHydration ngay dưới Provider để gọi được useAppDispatch */}
      <AuthHydration>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </AuthHydration>
    </Provider>
  )
}