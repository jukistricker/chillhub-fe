'use client'

import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { store, useAppDispatch } from '@/store'
import { useEffect } from 'react'
import { userInfo, logoutUser } from '@/store/slices/authSlice' 
import { authService } from '@/services/auth.service'
import { SignalRProvider } from '@/providers/SignalRProvider' // 1. IMPORT Ở ĐÂY

// Tạo một component mồi để chạy logic check Auth và Refresh Token ngầm
function AuthHydration({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(userInfo());
    }

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
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        dispatch(logoutUser.fulfilled(null, ''));
      }
    };

    const interval = setInterval(triggerRefresh, TEN_MINUTES);
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
      <AuthHydration>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* 2. BỌC SIGNALRPROVIDER TẠI ĐÂY */}
          <SignalRProvider>
            {children}
          </SignalRProvider>
        </ThemeProvider>
      </AuthHydration>
    </Provider>
  )
}