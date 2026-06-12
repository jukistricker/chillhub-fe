'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { setSearchQuery, toggleSidebar } from '@/store/slices/uiSlice'
import { toggleTheme } from '@/store/slices/themeSlice'
import { logoutUser } from '@/store/slices/authSlice'
import { searchVideos } from '@/store/slices/videosSlice'
import { Menu, Search, Moon, Sun, LogOut, User } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { theme } = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const { user, isAuthenticated } = useAppSelector(state => state.auth)
  const { searchQuery } = useAppSelector(state => state.ui)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      dispatch(setSearchQuery(searchValue))
      dispatch(searchVideos(searchValue) as any)
      router.push('/')
    }
  }

  const handleLogout = () => {
    dispatch(logoutUser() as any)
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">▶</span>
            </div>
            <span className="hidden sm:inline">YouTube Clone</span>
          </Link>
        </div>

        {/* Middle Section - Search */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-md mx-4"
        >
          <div className="flex w-full bg-muted rounded-full border border-border">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="px-4 py-2 hover:bg-muted-foreground/10 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search */}
          <button
            onClick={() => setSearchValue(searchQuery)}
            className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.profileImage}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors"
            >
              <User size={18} />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
