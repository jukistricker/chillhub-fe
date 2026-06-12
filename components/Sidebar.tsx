'use client'

import Link from 'next/link'
import { useAppSelector } from '@/store'
import { Home, Flame, Music, Play, Settings, LogOut } from 'lucide-react'

export default function Sidebar() {
  const { sidebarOpen } = useAppSelector(state => state.ui)
  const { isAuthenticated } = useAppSelector(state => state.auth)

  if (!sidebarOpen) return null

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] bg-background border-r border-border overflow-y-auto">
      <div className="p-4 space-y-2">
        {/* Main Navigation */}
        <nav className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Home size={20} />
            <span>Home</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Flame size={20} />
            <span>Trending</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Music size={20} />
            <span>Music</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Play size={20} />
            <span>Subscriptions</span>
          </Link>
        </nav>

        <hr className="border-border my-4" />

        {/* Explore Section */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">Explore</h3>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <span>Popular</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <span>Movies</span>
          </Link>
        </div>

        <hr className="border-border my-4" />

        {/* Settings Section */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">More</h3>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </aside>
  )
}
