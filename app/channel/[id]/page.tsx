'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { batchSubscribe, batchUnsubscribe, getSubscriberStatus } from '@/store/slices/mediasSlice'
import MainLayout from '@/components/MainLayout'
import { Video, Info, Bell, Play, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'
import { useInView } from 'react-intersection-observer'
import { formatViews } from '@/lib/videoUtils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const channelId = params.id as string

  // State cục bộ lưu dữ liệu Profile & Điều hướng
  const [channelUser, setChannelUser] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'videos' | 'about'>('videos')

  // State phục vụ cấu trúc Infinite Scroll cho danh sách Media
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Lấy trạng thái Auth & Đăng ký từ Redux Store toàn cục
  const { user: currentUser, isAuthenticated } = useAppSelector(state => state.auth)
  const { isSubscribed, subscribing } = useAppSelector(state => state.medias)
  const isBelong = isAuthenticated && currentUser?.id == channelId

  // Hook theo dõi phần tử cuối trang để trigger load dữ liệu
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // 1. Fetch thông tin Profile của Channel (Chỉ chạy một lần khi vào trang)
  useEffect(() => {
    if (!channelId) return

    const fetchChannelProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/auth?Id=${channelId}`, { headers: { accept: '*/*' } })
        const userData = await res.json()
        if (userData?.status === 200 && userData.data?.items?.length > 0) {
          setChannelUser(userData.data.items[0])
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin Channel:', err)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchChannelProfile()
  }, [channelId])

  // 2. Fetch danh sách video đầu tiên (Khởi tạo / Reset khi đổi kênh)
  useEffect(() => {
    if (!channelId) return

    const fetchInitialMedias = async () => {
      setVideosLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/media?UserId=${channelId}&type=2&pageSize=12`, { headers: { accept: '*/*' } })
        const mediaData = await res.json()
        
        if (mediaData?.status === 200 && mediaData.data?.items) {
          setMediaItems(mediaData.data.items)
          setNextCursor(mediaData.data.nextCursor || null)
          setHasMore(mediaData.data.hasMore ?? false)
        }
      } catch (err) {
        console.error('Error when fetching video:', err)
      } finally {
        setVideosLoading(false)
      }
    }

    fetchInitialMedias()
  }, [channelId])

  // 3. Tự động fetch thêm video khi cuộn xuống cuối trang (Infinite Scroll)
  useEffect(() => {
    if (inView && hasMore && !videosLoading && channelId && nextCursor && activeTab === 'videos') {
      const fetchMoreMedias = async () => {
        setVideosLoading(true)
        try {
          const res = await fetch(
            `${API_BASE_URL}/media?UserId=${channelId}&type=2&cursor=${nextCursor}&pageSize=12`, 
            { headers: { accept: '*/*' } }
          )
          const mediaData = await res.json()
          
          if (mediaData?.status === 200 && mediaData.data?.items) {
            setMediaItems(prev => [...prev, ...mediaData.data.items])
            setNextCursor(mediaData.data.nextCursor || null)
            setHasMore(mediaData.data.hasMore ?? false)
          }
        } catch (err) {
          console.error('Error when fetching video:', err)
        } finally {
          setVideosLoading(false)
        }
      }

      fetchMoreMedias()
    }
  }, [inView, hasMore, videosLoading, nextCursor, channelId, activeTab])

  // 4. Đồng bộ trạng thái subscribe từ hệ thống đối với Channel này
  useEffect(() => {
    if (isAuthenticated && currentUser?.id && channelId) {
      dispatch(getSubscriberStatus(channelId) as any)
    }
  }, [isAuthenticated, currentUser?.id, channelId, dispatch])

  // 5. Xử lý logic Đăng ký / Hủy đăng ký kênh
  const handleSubscribeToggle = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!currentUser?.id || !channelId) return

    if (isSubscribed) {
      dispatch(batchUnsubscribe({
        subscriberId: currentUser.id,
        channelId: channelId,
        createdAt: new Date().toISOString()
      }) as any)
    } else {
      dispatch(batchSubscribe({
        subscriberId: currentUser.id,
        channelId: channelId,
        isNotice: true,
        createdAt: new Date().toISOString()
      }) as any)
    }
  }

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-amber-500"></div>
        </div>
      </MainLayout>
    )
  }

  if (!channelUser) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)] text-muted-foreground">
          Channel not found.
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="w-full font-sans text-foreground pb-12">
        {/* BANNER KÊNH */}
        <div className="w-full h-32 sm:h-48 md:h-56 bg-gradient-to-r from-zinc-800 via-stone-900 to-neutral-800 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <span className="text-zinc-700/40 text-7xl font-black select-none tracking-widest uppercase text-center max-w-full px-4 truncate">
            {channelUser.fullName}
          </span>
        </div>

        {/* THÔNG TIN CHỦ KÊNH */}
        <div className="max-w-[1280px] mx-auto px-6 pt-6 flex flex-col md:flex-row gap-6 items-start">
          <img 
            src={channelUser.avatarUrl || "/default-avatar.svg"} 
            alt={channelUser.fullName} 
            className="w-24 h-24 md:w-40 md:h-40 rounded-full object-cover border border-border/40 shadow-sm"
          />
          
          <div className="flex-1 space-y-2 pt-2 w-full">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">{channelUser.fullName}</h1>
            
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground/90">@{channelUser.username}</span>
              
            </div>

            {/* NÚT ĐĂNG KÝ (SUBSCRIBE) */}
            {!isBelong &&(
            <div className="pt-3">
              
                <button
  disabled={subscribing}
  onClick={handleSubscribeToggle}
  className={`px-4 py-2 rounded-full font-medium transition-colors ${
    isSubscribed 
      ? "bg-stone-200 text-stone-800 hover:bg-stone-300" // Style khi Đã đăng ký (Hiện nút Hủy)
      : "bg-amber-500 text-white hover:bg-amber-600"         // Style khi Chưa đăng ký (Hiện nút Đăng ký)
  }`}
>
  {subscribing ? (
    <span className="flex items-center gap-1">Processing...</span>
  ) : isSubscribed ? (
    "Unsubscribe"
  ) : (
    "Subscribe"
  )}
</button>
              
            </div>
            )}
            {isBelong&&(
              <div className="pt-3">
              <button
              className='px-4 py-2 rounded-full font-medium transition-colors bg-amber-500 text-white hover:bg-amber-600'
               onClick={() => router.push(`/profile`)}>
                {"Change Profile"}
              </button>
            </div>
            )}
          </div>
        </div>

        {/* ĐIỀU HƯỚNG TABS */}
        <div className="max-w-[1280px] mx-auto px-6 mt-6 border-b border-border/60">
          <div className="flex gap-6 text-sm font-bold">
            <button 
              onClick={() => setActiveTab('videos')}
              className={`pb-3 relative transition-colors ${activeTab === 'videos' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Video
              {activeTab === 'videos' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`pb-3 relative transition-colors ${activeTab === 'about' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Introduce
              {activeTab === 'about' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></div>}
            </button>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH DƯỚI TABS */}
        <div className="max-w-[1280px] mx-auto px-6 mt-6">
          {activeTab === 'videos' ? (
            mediaItems.length === 0 && !videosLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
                <Video size={48} className="stroke-[1.5]" />
                <p>This channel hasn't uploaded any video.</p>
              </div>
            ) : (
              <>
                {/* GRID VIDEO CHUẨN YOUTUBE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                  {mediaItems.map((video) => (
                    <div 
                      key={video.id} 
                      className="group cursor-pointer space-y-2 flex flex-col w-full"
                      onClick={() => router.push(`/watch/${video.id}`)}
                    >
                      {/* Thumbnail section */}
                      <div className="relative aspect-video w-full bg-zinc-900 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                        <img 
                          src={video.thumbnail || 'https://picsum.photos/500/300'} 
                          alt={video.title} 
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                          loading="lazy"
                        />
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
                            {(() => {
                              const totalSeconds = Math.floor(video.duration / 1000);
                              const minutes = Math.floor(totalSeconds / 60);
                              const seconds = totalSeconds % 60;
                              return `${minutes}:${String(seconds).padStart(2, "0")}`;
                            })()}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                            <Play size={18} className="fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Meta thông tin Video */}
                      <div className="px-1 flex flex-col flex-1">
                        <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-amber-500 transition-colors">
                          {video.title}
                        </h3>
                        <div className="text-xs text-muted-foreground mt-1.5 flex flex-col space-y-0.5">
                          <span>{formatViews(video.viewCount)} views</span>
                          <span>{formatDate(video.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Khu vực kiểm soát Infinite Scroll chân trang giống HomePage */}
                <div ref={ref} className="flex justify-center pt-8 min-h-[60px]">
                  {videosLoading && mediaItems.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                      <span>Loading...</span>
                    </div>
                  )}

                  {!hasMore && mediaItems.length > 0 && (
                    <span className="text-sm text-muted-foreground italic">
                      You have reached the end of this channel
                    </span>
                  )}
                </div>
              </>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start py-4">
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-bold">Description</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  Welcome to channel of {channelUser.fullName}!
                </p>
              </div>
              <div className="bg-muted/40 border border-border/40 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Infomations</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Info size={16} />
                    <span>Joined at {formatDate(channelUser.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}