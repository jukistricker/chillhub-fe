"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSearchQuery, toggleSidebar } from "@/store/slices/uiSlice";
import { logoutUser } from "@/store/slices/authSlice";
import { Menu, Search, Moon, Sun, LogOut, User, Video } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@base-ui/react"; // Giữ nguyên theo code cũ của bạn
import { fetchMedias } from "@/store/slices/mediasSlice";

export default function Navbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [searchValue, setSearchValue] = useState("");
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { searchQuery } = useAppSelector((state) => state.ui);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      dispatch(setSearchQuery(searchValue));
      
      // (reset cursor về null)
      dispatch(fetchMedias({ search: searchValue, cursor: null, pageSize: 12 }) as any);
      
      router.push("/");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser() as any);
    router.push("/");
  };

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

          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center w-48 h-12">
  <img
    src={
      // Nếu chưa mounted (SSR), ép render cố định một logo mặc định (ví dụ: light)
      // Khi đã mounted, lúc này mới dựa vào resolvedTheme thực tế của trình duyệt
      !mounted 
        ? "/Chill-hub-light.svg" 
        : resolvedTheme === "dark"
          ? "/Chill-hub.svg"
          : "/Chill-hub-light.svg"
    }
    alt="Chillhub"
    className="w-full h-full object-contain object-left"
  />
</Link>
          </div>
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
        <div className="flex items-center gap-3">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleTheme();
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer z-[100]"
            aria-label="Toggle theme"
          >
            {!mounted ? (
               <Moon size={20} /> 
            ) : (theme === "dark" || resolvedTheme === "dark") ? (
               <Sun size={20} />
            ) : (
               <Moon size={20} />
            )}
          </button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            
            <div className="flex items-center gap-2">
              <a 
            href="/upload" 
            onClick={(e) => {
              if (window.location.pathname !== '/upload') {
                window.location.href = '/upload'; 
              }
            }}
          >
            <Video size={20} />
          </a>
              <img
                src={user.avatarUrl || "/default-avatar.png"} // Thêm fallback nhẹ nếu avatar null
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
  );
}