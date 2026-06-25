import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Media } from "@/types/media";
import { formatDate } from "@/lib/dateUtils";
import { formatViews } from "@/lib/videoUtils";

export function RecommendedVideoCard({ media }: { media: Media }) {
  const router = useRouter();

  const handleVideoClick = () => {
    router.push(`/watch/${media.id}`);
  };

  const defaultAvatar =
    "https://ui-avatars.com/api/?name=CH&background=F59E0B&color=000000&font-size=0.4&bold=true";
  const userAvatar = media.user?.avatarUrl || defaultAvatar;

  return (
    <div className="group cursor-pointer flex gap-2 overflow-hidden" onClick={handleVideoClick}>
      {/* Thumbnail bên trái - Chiếm cố định kích thước hẹp */}
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-video w-36 sm:w-40 flex-shrink-0">
        {media.thumbnail ? (
          <img
            src={media.thumbnail}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
            <Play size={16} className="opacity-40" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] text-white font-semibold">
          {(() => {
            const totalSeconds = Math.floor(media.duration / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${String(seconds).padStart(2, "0")}`;
          })()}
        </div>
      </div>

      {/* Info Section bên phải (YouTube Style cho sidebar không cần avatar to chiếm chỗ) */}
      <div className="flex flex-col min-w-0 justify-start pt-0.5">
        <h4
          className="font-medium text-sm line-clamp-2 text-foreground leading-tight mb-1 group-hover:text-primary transition-colors"
          title={media.title}
        >
          {media.title}
        </h4>

        <div className="text-xs text-muted-foreground flex flex-col gap-0.5">
          <span 
            className="hover:text-foreground cursor-pointer transition-colors truncate font-medium" 
            onClick={(e) => {
              e.stopPropagation(); // Ngăn kích hoạt nhảy vào trang watch
              router.push(`/channel/${media.user?.id}`);
            }}
          >
            {media.user?.fullName || media.user?.username || "Unknown User"}
          </span>
          <div className="flex items-center flex-wrap text-[11px]">
            <span>{formatViews(media.viewCount || 0)} views</span>
            <span className="mx-1">•</span>
            <span>{formatDate(media.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}