'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useAppSelector } from '@/store'
// import { toast } from 'sonner' // Hoặc react-toastify tùy bạn dùng thư viện nào

interface SignalRContextType {
  connection: HubConnection | null
  isConnected: boolean
}

const SignalRContext = createContext<SignalRContextType>({ connection: null, isConnected: false })

export const useSignalR = () => useContext(SignalRContext)

export const SignalRProvider = ({ children }: { children: React.ReactNode }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!isAuthenticated) {
      if (connection) {
        connection.stop()
        setConnection(null)
        setIsConnected(false)
      }
      return
    }

    const HUB_URL = `${process.env.NEXT_PUBLIC_API_URL}/hubs/notifications`

    // 1. Khởi tạo cấu hình Connection Hub
    const newConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        // Tự động truyền token lên BE qua Header nếu Hub có attribute [Authorize]
        accessTokenFactory: () => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token') || ''
          }
          return ''
        }
      })
      .withAutomaticReconnect() // Tự động kết nối lại nếu bị rớt mạng chập chờn
      .configureLogging(LogLevel.Information)
      .build()

    setConnection(newConnection)
  }, [isAuthenticated])

  useEffect(() => {
    if (!connection) return

    // 2. Tiến hành Start kết nối
    const startHubConnection = async () => {
      try {
        await connection.start()
        setIsConnected(true)
        console.log('%cSignalR Connected Successfully!', 'color: #10b981; font-weight: bold;')

        // 3. ĐĂNG KÝ LẮNG NGHE SỰ KIỆN TỪ BACKEND
        // Tên chuỗi "ReceiveNotification" phải KHỚP CHÍNH XÁC với chuỗi định nghĩa ở SendAsync() của BE
        connection.on('ReceiveNotification', (notificationData: any) => {
          console.log('Thông báo mới nhận được từ BE:', notificationData)
          
          // Bạn có thể bắn Toast thông báo real-time ở góc màn hình tại đây:
          // toast.success(notificationData.title || "Bạn có thông báo mới!")
          
          // Hoặc dispatch một Action Redux để tăng số lượng badge thông báo trên thanh Navbar:
          // dispatch(addNotification(notificationData))
        })

      } catch (err) {
        console.error('SignalR Connection Error: ', err)
        setIsConnected(false)
        // Thử kết nối lại sau 5 giây nếu lỗi
        setTimeout(() => startHubConnection(), 5000)
      }
    }

    startHubConnection()

    // Clean up: Hủy đăng ký lắng nghe và ngắt kết nối khi component bị unmount tránh memory leak
    return () => {
      connection.off('ReceiveNotification')
      connection.stop()
    }
  }, [connection])

  return (
    <SignalRContext.Provider value={{ connection, isConnected }}>
      {children}
    </SignalRContext.Provider>
  )
}