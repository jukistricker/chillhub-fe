'use client'

import { useAppSelector } from '@/store'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useAppSelector(state => state.ui)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-1">
        {sidebarOpen && <Sidebar />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
