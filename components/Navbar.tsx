"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSearchQuery, toggleSidebar } from "@/store/slices/uiSlice";
import { logoutUser } from "@/store/slices/authSlice";
import { fetchMedias } from "@/store/slices/mediasSlice";
import { useTheme } from "next-themes";
// Import thêm Bell
import { Menu, Search, Moon, Sun, LogOut, User, Video, Bell } from "lucide-react"; 
import { useSignalR } from "@/providers/SignalRProvider"; // Hook SignalR của bạn
import { notificationService } from "@/services/notification.service";
import { UserNotification } from "@/types/notification";

// Hàm tiện ích format thời gian (tương tự YouTube)
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
};

export default function Navbar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { searchQuery } = useAppSelector((state) => state.ui);

  // === NOTIFICATION STATES ===
  const { connection } = useSignalR();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lắng nghe Realtime SignalR
  useEffect(() => {
    if (connection) {
      connection.on("ReceiveNotification", (incomingData: any) => {
        // Tăng số lượng huy hiệu (badge) lên 1
        setUnreadCount((prev) => prev + 1);

        // Map data trả về từ Worker Kafka/SignalR thành dạng Model FE
        const newNoti: UserNotification = {
          id: Math.random().toString(), // ID tạm vì BE không trả về ID qua SignalR
          userId: user?.id || "",
          mediaId: incomingData.mediaId,
          title: incomingData.message, // Thuộc tính 'message' từ BE SendAsync
          thumbnail: incomingData.thumbnail,
          isRead: false,
          createdAt: incomingData.createdAt,
        };

        // Chèn vào đầu danh sách nếu người dùng đang mở popup
        setNotifications((prev) => [newNoti, ...prev]);
      });
    }

    return () => {
      connection?.off("ReceiveNotification");
    };
  }, [connection, user?.id]);

  // Click Outside để đóng Dropdown Thông báo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      dispatch(setSearchQuery(searchValue));
      dispatch(fetchMedias({ search: searchValue, cursor: null, pageSize: 12 }) as any);
      router.push("/");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser() as any);
    router.push("/");
  };

  // Hàm xử lý khi ấn vào quả chuông
  const handleToggleBell = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);

    // Nếu MỞ dropdown thông báo -> Gọi API fetch và Mark all read
    if (nextState) {
      try {
        // 1. Fetch 10 items (PageSize 10 đã config mặc định ở BE và Service)
        const res = await notificationService.getNotifications();
        
        // BE trả về cấu trúc ResponseDto -> data -> items
        if (res.data?.items) {
          setNotifications(res.data.items);
        }

        // 2. Mark All as Read (Chỉ gọi nếu có thông báo chưa đọc để đỡ rác BE)
        if (unreadCount > 0 || res.data?.items?.some((n: any) => !n.isRead)) {
          await notificationService.markAllAsRead();
          setUnreadCount(0); // Clear badge trên FE
        }
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center w-48 h-12">
              <img
                src={
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
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="flex w-full bg-muted rounded-full border border-border overflow-hidden">
            <input
              type="text"
              placeholder="Search videos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors border-l border-border"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          </div>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search */}
          <button
            onClick={() => setSearchValue(searchQuery)}
            className="sm:hidden p-2 hover:bg-muted rounded-full transition-colors"
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
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <Moon size={20} />
            ) : theme === "dark" || resolvedTheme === "dark" ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-4 ml-2">
              {/* Nút Upload Video */}
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

              {/* NÚT CHUÔNG THÔNG BÁO TẠI ĐÂY */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleToggleBell}
                  className="p-2 hover:bg-muted rounded-full transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell size={20} className={unreadCount > 0 ? "animate-[ring_1s_ease-in-out_infinite] origin-top" : ""} />
                  
                  {/* Badge đếm số lượng chưa đọc */}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-background">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Khung Dropdown hiển thị thông báo */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[350px] max-h-[480px] bg-background border border-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-border font-semibold flex justify-between items-center">
                      <span>Thông báo</span>
                    </div>

                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-muted-foreground text-sm">
                          Bạn chưa có thông báo nào.
                        </div>
                      ) : (
                        notifications.map((noti, index) => (
                          <Link
                            key={noti.id || index}
                            href={`/watch?v=${noti.mediaId}`} // Chuyển hướng xem video
                            className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/40 last:border-0"
                          >
                            <img
                              src={noti.thumbnail || "/placeholder-thumbnail.jpg"}
                              alt="thumbnail"
                              className="w-14 h-14 rounded-full object-cover shrink-0"
                            />
                            <div className="flex flex-col gap-1">
                              <span className="text-sm line-clamp-2 leading-snug">
                                {noti.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(noti.createdAt)}
                              </span>
                            </div>
                            
                            {/* Chấm xanh nhạt cho thông báo chưa đọc (nếu có lịch sử) */}
                            {!noti.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                            )}
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar User */}
              <img
                src={user.avatarUrl || "/default-avatar.svg"}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-border transition-all"
              />
              
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-muted rounded-full transition-colors text-red-500 hover:text-red-600 hidden sm:block"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors font-medium ml-2"
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