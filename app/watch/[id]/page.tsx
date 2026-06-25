"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  batchSubscribe,
  batchUnsubscribe,
  checkMediaReaction,
  fetchMedias,
  getSubscriberStatus,
} from "@/store/slices/mediasSlice";
import { subscribeChannel } from "@/store/slices/channelsSlice";
import MainLayout from "@/components/MainLayout";
import {
  ThumbsUp,
  Share2,
  MoreVertical,
  Bell,
  ThumbsDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Check,
  Star,
  Loader2,
} from "lucide-react";
import Hls from "hls.js";
import { MediaType, ReactionType } from "@/types/enum";
import {
  createComment,
  fetchComments,
  resetComments,
  toggleRepliesVisible,
} from "@/store/slices/commentSlice";
import { formatDate } from "@/lib/dateUtils";
import { Media } from "@/types/media";
import { RecommendedVideoCard } from "@/components/ui/RecommendVideoCard";

function formatCount(num: number) {
  if (!num) return "0";
  if (num >= 1_000_000_000_000)
    return `${(num / 1_000_000_000_000).toFixed(1)}T`;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

const metadataWorkerUrl = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mediaId = params.id as string;
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [recommending, setRecommending] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecommending(true);
        // Nhớ đổi domain/port cho đúng với môi trường dev/prod của bạn
        const res = await fetch(`${API_BASE_URL}/media/recommend/${mediaId}`, {
          method: "GET",
          headers: {
            "accept": "*/*",
          }
        });
        if (res.ok) {
          const result = await res.json();
          // API của bạn bọc mảng trong trường "data"
          setRecommendations(result.data || []);
        }
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        setRecommending(false);
      }
    };

    if (mediaId) {
      fetchRecommendations();
    }
  }, [mediaId]);

  // States mới cho Rating & Comments
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const { items, loading, error } = useAppSelector((state) => state.medias);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const media = items.length > 0 ? items[0] : null;

  // States cho Video Player
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [qualities, setQualities] = useState<number[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [videoError, setVideoError] = useState("");

  const { isSubscribed, subscribing } = useAppSelector((state) => state.medias);

  const {
    items: commentItems,
    nextCursor,
    loading: commentsLoading,
    loadingMore,
  } = useAppSelector((state) => state.comments);

  // State quản lý text (Giữ nguyên của bạn)
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    fullName: string;
    isSelf:boolean
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

const handleReplyClick = (comment: any) => {
  const rootId = comment.referenceCommentId ?? comment.id;
  const isSelf = comment.userId === user?.id; // ✅ Check có phải chính mình không

  setReplyingTo({
    id: rootId,
    fullName: comment.userFullName,
    isSelf, 
  });

  setCommentText(`@${comment.userFullName} `);

  setTimeout(() => {
    textareaRef.current?.focus();
  }, 50);
};

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!isAuthenticated || !user?.id) {
      router.push("/login");
      return;
    }

    try {
      await dispatch(
        createComment({
          userId: user.id,
          entityId: mediaId,
          description: commentText,
          referenceCommentId: replyingTo?.id,
          createdAt: new Date().toISOString(),
        }) as any,
      ).unwrap();

      setCommentText("");
      setReplyingTo(null); // Reset trạng thái reply sau khi gửi xong
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  };

  useEffect(() => {
    if (media) {
      setLocalLikeCount(media.likeCount || 0);
      setLocalDislikeCount(media.dislikeCount || 0);
    }
  }, [media]);
  // Fetch Media Data
  useEffect(() => {
    if (mediaId) {
      dispatch(fetchMedias({ id: mediaId }) as any);
      dispatch(
        fetchComments({ entityId: mediaId, referenceCommentId: null }) as any,
      );
    }
  }, [mediaId, dispatch]);

  const handleLoadMoreComments = () => {
    if (nextCursor && !loadingMore) {
      dispatch(fetchComments({ entityId: mediaId, cursor: nextCursor }) as any);
    }
  };


const loadingReplies = useAppSelector((state) => state.comments.loadingReplies);

const handleToggleReplies = (comment: any) => {
  if (comment.repliesLoaded) {
    // Đã có data -> chỉ toggle hiện/ẩn
    dispatch(toggleRepliesVisible(comment.id));
  } else {
    // Chưa load -> fetch lần đầu
    dispatch(
      fetchComments({ entityId: mediaId, referenceCommentId: comment.id }) as any
    );
  }
};

  useEffect(() => {
    if (isAuthenticated && user?.id && media?.userId) {
      dispatch(getSubscriberStatus(media.userId) as any);
    }
  }, [isAuthenticated, user?.id, media?.userId, dispatch]);

  useEffect(() => {
    const fetchUserReaction = async () => {
      // Chỉ gọi API khi đã đăng nhập, có User ID và có Media ID
      if (isAuthenticated && user?.id && mediaId) {
        try {
          const actionResult = await dispatch(
            checkMediaReaction({
              UserId: user.id,
              MediaId: mediaId,
            }) as any,
          );

          // Unwrap để lấy payload trả về từ Thunk
          const payload = actionResult.payload;

          // Dựa vào JSON response mẫu của bạn: data.items là một mảng
          if (payload && payload.items && payload.items.length > 0) {
            // Lấy phần tử đầu tiên và set reactionType
            const reactionData = payload.items[0];
            setUserReaction(reactionData.reactionType);
          } else {
            // Không có reaction => Discard
            setUserReaction(ReactionType.Discard);
          }
        } catch (error) {
          console.error("Lỗi khi fetch reaction:", error);
        }
      }
    };

    fetchUserReaction();
  }, [isAuthenticated, user?.id, mediaId, dispatch]);

  // Setup HLS.js
  useEffect(() => {
    if (!media || !mediaId || !videoRef.current) return;

    const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!PUBLIC_URL) {
      setVideoError("Thiếu cấu hình PUBLIC_URL");
      return;
    }

    setVideoError("");
    const video = videoRef.current;
    const source = `${PUBLIC_URL}/${media.folderId}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: false,
        progressive: true,
      });
      hlsRef.current = hls;

      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(source);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const availableQualities = data.levels.map((level) => level.height);
        setQualities(availableQualities);

        const savedTime = localStorage.getItem(`progress-${mediaId}`);
        if (savedTime) video.currentTime = parseFloat(savedTime);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal)
          setVideoError("Không tìm thấy video hoặc ID không hợp lệ.");
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
      video.addEventListener("loadedmetadata", () => {
        const savedTime = localStorage.getItem(`progress-${mediaId}`);
        if (savedTime) video.currentTime = parseFloat(savedTime);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [media, mediaId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isPlaying || !mediaId) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const currentVideoTime = videoRef.current.currentTime;
        localStorage.setItem(
          `progress-${mediaId}`,
          currentVideoTime.toString(),
        );

        if (isAuthenticated) {
          syncProgress(currentVideoTime);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isPlaying, mediaId, isAuthenticated, user]);

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      const finalTime = videoRef.current.currentTime;
      localStorage.setItem(`progress-${mediaId}`, finalTime.toString());
      if (isAuthenticated) {
        syncProgress(finalTime);
      }
    }
  };

  // --- HANDLERS CỦA VIDEO PLAYER ---
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((e) => console.log("Play failed:", e));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100,
      );
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime =
        (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (isMuted && volume === 0) setVolume(0.5);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((e) => console.log(e));
    } else {
      document.exitFullscreen();
    }
  };

  const handleQualityChange = (index: number) => {
    if (hlsRef.current) {
      hlsRef.current.nextLevel = index;
      setCurrentQuality(index);
      setShowSettings(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const m = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2500);
  };

  // --- HANDLERS TƯƠNG TÁC MEDIA GỐC ---
  const [userReaction, setUserReaction] = useState<ReactionType>(
    ReactionType.Discard,
  );
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localDislikeCount, setLocalDislikeCount] = useState(0);
  const [isProcessingReaction, setIsProcessingReaction] = useState(false);
  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsProcessingReaction(true);
    let payloadType = ReactionType.Like;

    if (userReaction === ReactionType.Like) {
      setLocalLikeCount((prev) => prev - 1);
      setUserReaction(ReactionType.Discard);
      payloadType = ReactionType.Discard;
    } else {
      setLocalLikeCount((prev) => prev + 1);
      if (userReaction === ReactionType.Dislike) {
        setLocalDislikeCount((prev) => prev - 1);
      }
      setUserReaction(ReactionType.Like);
      payloadType = ReactionType.Like;
    }

    await syncReaction(payloadType);
    setIsProcessingReaction(false);
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsProcessingReaction(true);
    let payloadType = ReactionType.Dislike;

    if (userReaction === ReactionType.Dislike) {
      setLocalDislikeCount((prev) => prev - 1);
      setUserReaction(ReactionType.Discard);
      payloadType = ReactionType.Discard;
    } else {
      setLocalDislikeCount((prev) => prev + 1);
      if (userReaction === ReactionType.Like) {
        setLocalLikeCount((prev) => prev - 1);
      }
      setUserReaction(ReactionType.Dislike);
      payloadType = ReactionType.Dislike;
    }

    await syncReaction(payloadType);
    setIsProcessingReaction(false);
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!media || !user?.id) return;

    if (isSubscribed) {
      dispatch(
        batchUnsubscribe({
          subscriberId: user.id,
          channelId: media.userId,
          createdAt: new Date().toISOString(),
        }) as any,
      );
    } else {
      // Gọi thunk Đăng ký (Gửi mảng batch request)
      dispatch(
        batchSubscribe({
          subscriberId: user.id,
          channelId: media.userId,
          isNotice: true,
          createdAt: new Date().toISOString(),
        }) as any,
      );
    }
  };

  const syncProgress = async (time: number) => {
    if (!mediaId || !isAuthenticated || !user?.id) return;
    try {
      await fetch(`${metadataWorkerUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: null,
          userId: user.id,
          mediaId: mediaId,
          progress: Math.floor(time),
        }),
      });
      console.log(
        `[Worker Sync] Đã đẩy tiến trình ${Math.floor(time)}s vào hàng đợi.`,
      );
    } catch (error) {
      console.error("Lỗi khi gửi tiến trình xem lên Worker:", error);
    }
  };

  const syncReaction = async (reactionType: ReactionType) => {
    if (!mediaId || !isAuthenticated || !user?.id) return;
    try {
      await fetch(`${metadataWorkerUrl}/api/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mediaId: mediaId,
          reactionType: reactionType,
          createdAt: new Date().toISOString(),
        }),
      });
      const reactionName =
        reactionType === ReactionType.Like
          ? "Like"
          : reactionType === ReactionType.Dislike
            ? "Dislike"
            : "Discard";
      console.log(
        `[Worker Sync] Đã đẩy tương tác ${reactionName} vào hàng đợi.`,
      );
    } catch (error) {
      console.error("Lỗi khi gửi tương tác lên Worker:", error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !media) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">{error || "Media not found"}</p>
        </div>
      </MainLayout>
    );
  }

  const defaultAvatar =
    "https://ui-avatars.com/api/?name=CH&background=FDE047&color=000000&font-size=0.4&bold=true";
  const channelAvatar = media.user?.avatarUrl || defaultAvatar;

  return (
    <MainLayout>
      <div className="w-full max-w-[1400px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* TRÌNH PHÁT VIDEO */}
            <div
              ref={containerRef}
              className="relative w-full bg-black rounded-xl overflow-hidden aspect-video shadow-lg group font-sans select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => isPlaying && setShowControls(false)}
              onDoubleClick={toggleFullscreen}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-contain cursor-pointer"
                poster={media.thumbnail ?? ""}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
              />

              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                  <p className="text-red-500 font-bold uppercase animate-pulse">
                    [ERROR]: {videoError}
                  </p>
                </div>
              )}

              {!isPlaying && !videoError && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-all hover:bg-black/20"
                  onClick={togglePlay}
                >
                  <div className="w-20 h-20 bg-orange-500/90 rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    <Play size={40} className="text-black ml-2 fill-black" />
                  </div>
                </div>
              )}

              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-20 px-4 pb-3 transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full h-1.5 bg-gray-600/50 hover:h-2 transition-all rounded-full cursor-pointer mb-4 group/progress">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress || 0}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute top-0 left-0 h-full bg-[#ff9900] rounded-full pointer-events-none transition-all"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow pointer-events-none scale-0 group-hover/progress:scale-100 transition-transform"
                    style={{ left: `calc(${progress}% - 7px)` }}
                  />
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button
                      onClick={togglePlay}
                      className="hover:text-[#ff9900] transition-colors"
                    >
                      {isPlaying ? (
                        <Pause size={24} className="fill-current" />
                      ) : (
                        <Play size={24} className="fill-current" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 group/volume">
                      <button
                        onClick={toggleMute}
                        className="hover:text-[#ff9900] transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX size={24} />
                        ) : (
                          <Volume2 size={24} />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-0 scale-x-0 origin-left group-hover/volume:w-20 group-hover/volume:scale-x-100 transition-all duration-300 accent-[#ff9900] h-1.5 bg-gray-600 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="text-sm font-semibold tracking-wider font-mono">
                      {formatTime(currentTime)}{" "}
                      <span className="text-white/40 mx-1">/</span>{" "}
                      {formatTime(duration)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 relative">
                    {showSettings && (
                      <div className="absolute bottom-full right-8 mb-4 w-36 bg-[#111] border border-gray-800 rounded-md overflow-hidden shadow-2xl z-20 font-sans">
                        <div className="p-3 border-b border-gray-800 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                          Quality
                        </div>
                        <button
                          onClick={() => handleQualityChange(-1)}
                          className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors text-sm font-semibold ${currentQuality === -1 ? "text-[#ff9900]" : "text-gray-200"}`}
                        >
                          <span>Auto</span>
                          {currentQuality === -1 && <Check size={16} />}
                        </button>
                        {qualities.map((height, index) => (
                          <button
                            key={index}
                            onClick={() => handleQualityChange(index)}
                            className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors text-sm font-semibold ${currentQuality === index ? "text-[#ff9900]" : "text-gray-200"}`}
                          >
                            <span>{height}p</span>
                            {currentQuality === index && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={`hover:text-[#ff9900] transition-all duration-300 ${showSettings ? "text-[#ff9900] rotate-45" : ""}`}
                    >
                      <Settings size={22} />
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="hover:text-[#ff9900] transition-colors ml-2"
                    >
                      {isFullscreen ? (
                        <Minimize size={22} />
                      ) : (
                        <Maximize size={22} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 line-clamp-2">
                {media.title}
              </h1>
            </div>

            {/* User Info & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {media.type == MediaType.Video && (
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => router.push(`/channel/${media.userId}`)}
                  >
                    <img
                      src={channelAvatar}
                      alt={media.user?.fullName}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-border/50"
                    />
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {media.user?.fullName || "User"}
                      </h3>
                    </div>
                  </div>
                  <button
                    disabled={subscribing}
                    onClick={handleSubscribe}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
                      isSubscribed
                        ? "bg-stone-200 text-stone-800 hover:bg-stone-300" 
                        : "bg-amber-500 text-white hover:bg-amber-600" 
                    }`}
                  >
                    {subscribing ? (
                      <span className="flex items-center gap-1">
                        Processing...
                      </span>
                    ) : isSubscribed ? (
                      "Unsubscribe"
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pb-2 sm:pb-0">
                <button
                  onClick={handleLike}
                  disabled={isProcessingReaction}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 
                    ${userReaction === ReactionType.Like ? "bg-primary/20 text-primary" : "bg-muted hover:bg-border/50"}`}
                >
                  <ThumbsUp
                    size={18}
                    className={
                      userReaction === ReactionType.Like ? "fill-current" : ""
                    }
                  />
                  {formatCount(localLikeCount)}
                </button>

                <button
                  onClick={handleDislike}
                  disabled={isProcessingReaction}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 
                    ${userReaction === ReactionType.Dislike ? "bg-primary/20 text-primary" : "bg-muted hover:bg-border/50"}`}
                >
                  <ThumbsDown
                    size={18}
                    className={
                      userReaction === ReactionType.Dislike
                        ? "fill-current"
                        : ""
                    }
                  />
                  {formatCount(localDislikeCount)}
                </button>
              </div>
            </div>

            {/* Desc */}
            <div className="bg-muted rounded-xl p-4 mt-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {media.description}
              </p>
            </div>

            {/* --- RATING SECTION --- */}
            {media.type==MediaType.Movie&&(
              <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-lg font-bold mb-4 text-foreground">
                Đánh giá Video
              </h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      className={`transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-orange-500 text-orange-500"
                          : "text-muted-foreground hover:text-orange-400"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-muted-foreground font-medium">
                  {rating > 0
                    ? `Bạn đã đánh giá ${rating} sao`
                    : "Nhấp để đánh giá"}
                </span>
              </div>
            </div>
            )}

            {/* --- COMMENTS SECTION --- */}
            <div className="mt-8 border-t border-border pt-6 pb-12">
              <h3 className="text-lg font-bold mb-6 text-foreground">
                Comments
              </h3>

              {/* Comment List */}
              <div className="mt-8 bg-[#111] p-4 lg:p-6 rounded-xl border border-gray-800">
                

                {/* Ô nhập bình luận */}
                <div className="flex gap-4 mb-8">
                  <img
                    src={user?.avatarUrl || defaultAvatar}
                    alt="Your Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                  />
                  {replyingTo && (
  <div className={`flex items-center justify-between p-2 rounded mb-2 text-sm
    ${replyingTo.isSelf 
      ? 'bg-yellow-900/40 border border-yellow-700/50'
      : 'bg-gray-800'
    }`}
  >
    <span className="text-gray-300 flex items-center gap-2">
      {replyingTo.isSelf ? (
        <>
          <span>Replying <b className="text-yellow-400">yourself</b></span>
        </>
      ) : (
        <>
          <span>Replying <b className="text-[#ff9900]">@{replyingTo.fullName}</b></span>
        </>
      )}
    </span>
    <button
      onClick={() => {
        setReplyingTo(null);
        setCommentText("");
      }}
      className="text-red-400 hover:text-red-300 text-xs"
    >
      Cancel
    </button>
  </div>
)}
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      ref={textareaRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add Comment..."
                      className="w-full bg-transparent border-b border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-[#ff9900] transition-colors resize-none overflow-hidden pb-1"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                    <div className="flex justify-end gap-3 mt-2">
                      <button
                        onClick={() => setCommentText("")}
                        className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                          commentText.trim()
                            ? "bg-[#ff9900] text-black hover:bg-[#e68a00]"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danh sách bình luận */}
                {commentsLoading ? (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-[#ff9900]"></div>
  </div>
) : (
  <div className="space-y-6">
    {commentItems.map((comment: any) => (
      <div key={comment.id} className="flex gap-4 group">
        <img
          src={comment.userAvatarUrl || defaultAvatar}
          alt={comment.userFullName}
          className="w-10 h-10 rounded-full object-cover border border-gray-800 flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-200">
              {comment.userFullName}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {comment.description}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => handleReplyClick(comment)}
              className="text-xs font-semibold text-gray-500 hover:text-[#ff9900] transition-colors"
            >
              Reply
            </button>

            {comment.hasChildren && (
              <button
                onClick={() => handleToggleReplies(comment)}
                className="text-xs font-semibold text-gray-500 hover:text-[#ff9900] transition-colors flex items-center gap-1"
                disabled={loadingReplies[comment.id]}
              >
                {loadingReplies[comment.id] ? (
                  <span className="animate-spin rounded-full h-3 w-3 border border-gray-500 border-t-[#ff9900] inline-block" />
                ) : comment.repliesVisible ? (
                  "Hide replies"
                ) : (
                  "Show replies"
                )}
              </button>
            )}
          </div>

          {comment.repliesVisible && comment.replies?.length > 0 && (
            <div className="mt-3 space-y-3 border-l-2 border-gray-700 pl-4">
              {comment.replies.map((reply: any) => (
                <div key={reply.id} className="flex gap-3 group">
                  <img
                    src={reply.userAvatarUrl || defaultAvatar}
                    alt={reply.userFullName}
                    className="w-8 h-8 rounded-full object-cover border border-gray-800 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-200">
                        {reply.userFullName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {reply.description}
                    </p>
                    <button
                      onClick={() => handleReplyClick(reply)}
                      className="text-xs font-semibold text-gray-500 hover:text-[#ff9900] transition-colors mt-1"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}

              {comment.repliesCursor && (
                <button
                  onClick={() =>
                    dispatch(fetchComments({
                      entityId: mediaId,
                      referenceCommentId: comment.id,
                      cursor: comment.repliesCursor,
                    }) as any)
                  }
                  className="text-xs text-[#ff9900] hover:underline mt-1"
                >
                  Show more replies
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    ))}

    {/* Load thêm root comments */}
    {nextCursor && (
      <button
        onClick={handleLoadMoreComments}
        disabled={loadingMore}
        className="w-full text-sm text-gray-400 hover:text-[#ff9900] py-2 transition-colors"
      >
        {loadingMore ? "Loading..." : "Show more comments"}
      </button>
    )}
  </div>
)}

                
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
        <h3 className="font-bold text-base text-foreground tracking-wide">Recommended</h3>
        
        {recommending ? (
          <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading recommendations...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            {recommendations.map((media) => (
              <RecommendedVideoCard key={media.id} media={media} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground text-xs italic py-4">
            No recommendations available
          </div>
        )}
      </div>
        </div>
      </div>
    </MainLayout>
  );
}
