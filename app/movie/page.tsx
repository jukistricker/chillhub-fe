"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import MainLayout from "@/components/MainLayout";
import { Play, Star, Flame, Popcorn, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { Media } from "@/types/media";
import { fetchMedias, resetPagination } from "@/store/slices/mediasSlice";
import { MediaType } from "@/types/enum";

// ==========================================
// COMPONENT 1: CARD DỌC CHO TRENDING 
// ==========================================
function TrendingMovieCard({ movie }: { movie: Media }) {
  const router = useRouter();

  return (
    <div 
      className="group relative flex-shrink-0 w-48 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer snap-start shadow-lg"
      onClick={() => router.push(`/watch/${movie.id}`)}
    >
      {movie.thumbnail ? (
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
          <Popcorn size={40} className="text-slate-600" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
      
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-primary/90 p-4 rounded-full text-white backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform">
          <Play fill="currentColor" size={24} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-lg line-clamp-2 leading-tight mb-1">
          {movie.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-1 font-medium text-amber-400">
            <Star size={12} fill="currentColor" />
            {movie.overallRating ? movie.overallRating.toFixed(1) : "NR"}
          </span>
          <span>• {Math.round(movie.duration / 60000)} mins</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT 2: CARD NGANG CHO POPULAR
// ==========================================
function PopularMovieCard({ movie }: { movie: Media }) {
  const router = useRouter();

  return (
    <div 
      className="group cursor-pointer flex flex-col gap-2"
      onClick={() => router.push(`/watch/${movie.id}`)}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        {movie.thumbnail ? (
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play size={24} className="opacity-30" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
          {Math.round(movie.duration / 60000)}m
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </h3>
        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
          <span>{movie.viewCount?.toLocaleString()} views</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Star size={12} className="text-amber-500" />
            {movie.overallRating ? movie.overallRating.toFixed(1) : "NR"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TRANG CHÍNH: MOVIES PAGE
// ==========================================
export default function MoviesPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error, nextCursor, hasMore } = useAppSelector((state) => state.medias);

  // Hook hỗ trợ nhận diện khi cuộn tới cuối trang
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // 1. Fetch dữ liệu lần đầu
  useEffect(() => {
    dispatch(resetPagination());
    // Lần đầu tiên: Lấy 20 bản ghi
    dispatch(fetchMedias({ type: MediaType.Movie, pageSize: 20, isDescending: true }) as any);
  }, [dispatch]);

  // 2. Load More (Infinite Scroll)
  useEffect(() => {
    if (inView && hasMore && !loading && items.length > 0) {
      // Các lần cuộn tiếp theo: Chỉ lấy 10 bản ghi
      dispatch(
        fetchMedias({
          type: MediaType.Movie,
          cursor: nextCursor,
          pageSize: 10,
          isDescending: true,
        }) as any
      );
    }
  }, [inView, hasMore, loading, nextCursor, items.length, dispatch]);

  // 3. Phân tách mảng dữ liệu cực mượt bằng useMemo (Chỉ tính toán lại khi mảng items thay đổi)
  const trendingMovies = useMemo(() => items.slice(0, 10), [items]);
  const popularMovies = useMemo(() => items.slice(10), [items]);

  return (
    <MainLayout>
      <div className="w-full h-full pb-12 overflow-x-hidden">
        
        {/* === PHẦN 1: TRENDING (10 BẢN GHI ĐẦU) === */}
        <section className="pt-6 pb-8 pl-4 sm:pl-6 lg:pl-8 bg-gradient-to-b from-background to-muted/20">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="text-rose-500" size={28} />
            <h1 className="text-2xl font-bold tracking-tight">Trending Movies</h1>
          </div>

          {loading && items.length === 0 ? (
            <div className="flex gap-4 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-48 sm:w-56 aspect-[2/3] bg-muted animate-pulse rounded-2xl flex-shrink-0" />
              ))}
            </div>
          ) : trendingMovies.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar -mr-4 pr-4">
              {trendingMovies.map((movie) => (
                <TrendingMovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Không có phim thịnh hành lúc này.</p>
          )}
        </section>

        {/* === PHẦN 2: POPULAR (TỪ BẢN GHI SỐ 11 TRỞ ĐI) === */}
        <section className="px-4 sm:px-6 lg:px-8 py-8 min-h-[50vh]">
          <div className="flex items-center gap-2 mb-6">
            <Popcorn className="text-primary" size={24} />
            <h2 className="text-xl font-bold tracking-tight">Popular on Chillhub</h2>
          </div>

          {error && items.length === 0 && (
            <div className="text-destructive mb-4">Lỗi: {error}</div>
          )}

          {popularMovies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
              {popularMovies.map((movie) => (
                <PopularMovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Vuốt lên để xem thêm các phim khác.
            </div>
          ) : null}

          {/* === KHU VỰC CUỘN TẢI THÊM === */}
          <div ref={ref} className="flex justify-center pt-8 mt-8 border-t border-border/50">
            {loading && items.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Đang tải thêm phim...</span>
              </div>
            )}
            {!hasMore && items.length > 0 && (
              <span className="text-sm text-muted-foreground italic">
                Bạn đã xem hết danh sách phim.
              </span>
            )}
          </div>
        </section>

      </div>
    </MainLayout>
  );
}