"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import MainLayout from "@/components/MainLayout";
import { Play, Loader2 } from "lucide-react"; // Đã bỏ Heart icon vì YouTube không dùng icon ở đây
import { Media } from "@/types/media";
import { fetchMedias } from "@/store/slices/mediasSlice";
import { useInView } from "react-intersection-observer";
import { formatDate } from "@/lib/dateUtils";
import { MediaType } from "@/types/enum";
import { formatViews } from "@/lib/videoUtils";

function VideoCard({ media }: { media: Media }) {
  const router = useRouter();

  const handleVideoClick = () => {
    router.push(`/watch/${media.id}`);
  };

  

  const defaultAvatar =
    "https://ui-avatars.com/api/?name=CH&background=F59E0B&color=000000&font-size=0.4&bold=true";
  const userAvatar = media.user?.avatarUrl || defaultAvatar;

  return (
    <div className="group cursor-pointer flex flex-col gap-3">
      {/* Thumbnail Section */}
      <div
        className="relative overflow-hidden rounded-xl bg-muted aspect-video"
        onClick={handleVideoClick}
      >
        {media.thumbnail ? (
          <img
            src={media.thumbnail}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <Play size={24} className="opacity-40" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
          {(() => {
            const totalSeconds = Math.floor(media.duration / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            return `${minutes}:${String(seconds).padStart(2, "0")}`;
          })()}
        </div>
      </div>

      {/* Info Section (YouTube Style: Avatar + Details) */}
      <div className="flex items-start gap-3 pr-4">
        {/* User Avatar */}
        <div className="flex-shrink-0 mt-0.5" onClick={() => router.push(`/channel/${media.userId}`)}>
          <img
            src={userAvatar}
            alt={media.user?.fullName || "User"}
            className="w-9 h-9 rounded-full object-cover border border-border/50"
          />
        </div>

        {/* Video Details */}
        <div className="flex flex-col overflow-hidden">
          <h3
            className="font-semibold line-clamp-2 text-foreground cursor-pointer hover:text-primary transition-colors text-base leading-tight mb-1"
            onClick={handleVideoClick}
            title={media.title}
          >
            {media.title}
          </h3>

          <div className="text-sm text-muted-foreground flex flex-col">
            <b>
              <span className="hover:text-foreground cursor-pointer transition-colors truncate" onClick={() => router.push(`/channel/${media.userId}`)}>
                {media.user?.fullName || "Unknown User"}
              </span>
            </b>
            <div className="flex items-center flex-wrap">
              <span>{formatViews(media.viewCount)} views</span>
              <span className="mx-1.5 text-[10px]">•</span>
              <span>{formatDate(media.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const dispatch = useAppDispatch();

  const {
    items: medias,
    loading,
    error,
    nextCursor,
    hasMore,
    search,
  } = useAppSelector((state) => state.medias);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    dispatch(fetchMedias({ type:MediaType.Video,cursor: null, pageSize: 12, search: "" }) as any);
  }, [dispatch]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      dispatch(
        fetchMedias({
          type: MediaType.Video,
          cursor: nextCursor,
          pageSize: 12,
          search: search || "",
        }) as any,
      );
    }
  }, [inView, hasMore, loading, nextCursor, search, dispatch]);

  return (
    <MainLayout>
      <div className="w-full h-full pb-12">
        {/* Error Display */}
        {error && (
          <div className="m-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
            Failed to load videos. {error}
          </div>
        )}

        {/* Loading State của trang đầu tiên */}
        {loading && medias.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {medias.length > 0 && (
          <div className="p-4 sm:p-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-x-4 sm:gap-y-8">
              {medias.map((media) => (
                <VideoCard key={media.id} media={media} />
              ))}
            </div>

            {/* Khu vực kiểm soát Infinite Scroll chân trang */}
            <div ref={ref} className="flex justify-center pt-6 min-h-[50px]">
              {loading && medias.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Loading more videos...</span>
                </div>
              )}

              {!hasMore && medias.length > 0 && (
                <span className="text-sm text-muted-foreground italic">
                  You have reached the end of the feed
                </span>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && medias.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <Play size={48} className="text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No videos found</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
