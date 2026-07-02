"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchSubscribers, resetSubscribers } from "@/store/slices/subscriberSlice";
import MainLayout from "@/components/MainLayout";
import { useInView } from "react-intersection-observer";
import { Loader2, Search, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SubscriptionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { subscribers, nextCursor, hasNextPage, loading, error } = useAppSelector(
    (state) => state.subscribers
  );

  const [searchTerm, setSearchTerm] = useState("");
  
  // Hook cho Infinite Scroll
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // 1. Fetch dữ liệu khi search hoặc lần đầu mount
  useEffect(() => {
    dispatch(resetSubscribers());
    dispatch(
      fetchSubscribers({
        isDescending: true,
        pageSize: 12,
        search: searchTerm || null,
      })
    );
  }, [dispatch, searchTerm]);

  // 2. Tự động fetch thêm khi cuộn đến cuối
  useEffect(() => {
    if (inView && hasNextPage && !loading && nextCursor) {
      dispatch(
        fetchSubscribers({
          cursor: nextCursor,
          isDescending: true,
          pageSize: 12,
          search: searchTerm || null,
        })
      );
    }
  }, [inView, hasNextPage, loading, nextCursor, dispatch, searchTerm]);

  const defaultAvatar = "/default-avatar.svg"
 
  return (
    <MainLayout>
      <div className="w-full font-sans text-foreground pb-12 pt-6">
        <div className="max-w-[1280px] mx-auto px-6">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Subscriptions
            </h1>
            
        
          </div>

          {/* Error Message */}
          {error && <div className="text-red-500 mb-4 px-2">{error}</div>}

          {/* List Subscriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="group flex items-center gap-4 p-4 bg-muted/20 border border-border/40 rounded-2xl hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => router.push(`/channel/${sub.channelId}`)}
              >
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden flex-shrink-0 border border-border/20">
                  <img 
                      src={sub.channel.avatarUrl||defaultAvatar} 
                      alt={sub.channel.fullName} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <UserCircle size={32} />
                    </div>
                  
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold truncate group-hover:text-amber-500 transition-colors">
                    {sub.channel.fullName}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">@{sub.channel.username}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Indicator & Infinite Scroll Trigger */}
          <div ref={ref} className="flex justify-center pt-12 min-h-[100px]">
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <span>Loading...</span>
              </div>
            )}
            
            {!loading && subscribers.length === 0 && !error && (
              <div className="text-muted-foreground italic">
                No channels subscribed or found.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}