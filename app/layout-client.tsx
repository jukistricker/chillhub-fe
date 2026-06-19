'use client'

import { Provider } from 'react-redux'
import { ThemeProvider } from 'next-themes'
import { store, useAppDispatch } from '@/store'
import { useEffect } from 'react'
import { userInfo } from '@/store/slices/authSlice'

// Tạo một component mồi để chạy logic check Auth
function AuthHydration({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Mỗi khi web load/reload, check xem có token không
    const token = localStorage.getItem("access_token");
    if (token) {
      dispatch(userInfo());
    }
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