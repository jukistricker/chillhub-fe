"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import MainLayout from "@/components/MainLayout";
import { Play, Loader2, History as HistoryIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { MediaHistory } from "@/types/history";
import { clearHistoryState, fetchMediaHistories } from "@/store/slices/historySlice";

function HistoryVideoCard({ history }: { history: MediaHistory }) {
  const router = useRouter();

  const handleVideoClick = () => {
    router.push(`/watch/${history.mediaId}`);
  };

  const progressPercent = history.duration > 0 
    ? Math.min(100, Math.round((history.progress / history.duration) * 100)) 
    : 0;

  return (
    // ĐỔI Ở ĐÂY: flex-row thay vì flex-col. 
    // Trên mobile (màn quá nhỏ) thì có thể co lại thành cột, từ sm trở lên sẽ nằm ngang
    <div className="group flex flex-col sm:flex-row gap-4 p-2 rounded-xl hover:bg-accent/40 transition-colors">
      
      {/* Thumbnail Section - Set cứng width để không bị phình to */}
      <div
        className="relative overflow-hidden rounded-xl bg-muted aspect-video w-full sm:w-56 md:w-64 flex-shrink-0 cursor-pointer"
        onClick={handleVideoClick}
      >
        {history.thumbnail ? (
          <img
            src={history.thumbnail}
            alt={history.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <Play size={24} className="opacity-40" />
          </div>
        )}
        
        {/* Thời lượng Video */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
          {(() => {
            const totalSeconds = Math.floor(history.duration / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${String(seconds).padStart(2, "0")}`;
          })()}
        </div>

        {/* Thanh Progress Đỏ */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
                className="h-full bg-red-600" 
                style={{ width: `${progressPercent}%` }}
            />
        </div>
      </div>

      {/* Info Section - flex-1 để chiếm hết chiều ngang còn lại */}
      <div className="flex flex-col py-1 flex-1 min-w-0">
        <h3
          className="font-semibold line-clamp-2 text-foreground cursor-pointer hover:text-primary transition-colors text-base md:text-lg leading-tight mb-2"
          onClick={handleVideoClick}
          title={history.title}
        >
          {history.title}
        </h3>
        
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="hover:text-foreground cursor-pointer transition-colors font-medium">
            {history.fullName}
          </span>
          {/* Bạn có thể thêm views hoặc thời gian xem ở đây nếu Backend trả về */}
        </div>
        
        {/* Tuỳ chọn: Thêm đoạn mô tả ngắn (line-clamp-2) nếu muốn giống YouTube hơn */}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const dispatch = useAppDispatch();

  const {
    items: histories,
    loading,
    error,
    nextCursor,
    hasMore,
  } = useAppSelector((state) => state.histories);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    dispatch(clearHistoryState()); 
    dispatch(fetchMediaHistories({ cursor: null, pageSize: 12 }) as any);
  }, [dispatch]);

  // Infinite Scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      dispatch(
        fetchMediaHistories({
          cursor: nextCursor,
          pageSize: 12,
        }) as any
      );
    }
  }, [inView, hasMore, loading, nextCursor, dispatch]);

  return (
    <MainLayout>
      <div className="w-full h-full pb-12 max-w-7xl mx-auto">
        
        {/* Header trang History */}
        <div className="p-4 sm:px-6 pt-6 pb-2">
            <h1 className="text-2xl font-bold flex items-center gap-3">
                <HistoryIcon className="h-6 w-6" />
                Watch History
            </h1>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
            Failed to load history. {error}
          </div>
        )}

        {/* Loading State của trang đầu tiên */}
        {loading && histories.length === 0 && (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your history...</p>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {/* Videos List (Đã bỏ Grid) */}
        {histories.length > 0 && (
          // Căn giữa list và giới hạn độ rộng max-w-4xl để tránh bị kéo giãn quá mức trên màn hình Ultrawide
          <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto"> 
            <div className="flex flex-col gap-4">
              {histories.map((history) => (
                <HistoryVideoCard key={history.id} history={history} />
              ))}
            </div>

            {/* Khu vực kiểm soát Infinite Scroll chân trang */}
            <div ref={ref} className="flex justify-center pt-8 min-h-[50px]">
              {loading && histories.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading older history...</span>
                </div>
              )}

              {!hasMore && histories.length > 0 && (
                <span className="text-sm text-muted-foreground italic">
                  You have reached the end of your history
                </span>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && histories.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <HistoryIcon size={48} className="text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">Keep track of what you watch</p>
            <p className="text-sm text-muted-foreground mt-2">Videos you watch will show up here</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}