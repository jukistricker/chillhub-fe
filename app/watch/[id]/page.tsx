'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchMedias } from '@/store/slices/mediasSlice'
import { subscribeChannel } from '@/store/slices/channelsSlice'
import MainLayout from '@/components/MainLayout'
import { ThumbsUp, Share2, MoreVertical, Bell } from 'lucide-react'

// Các helper function giữ nguyên
function formatCount(num: number) {
  if (!num) return '0'
  if (num >= 1_000_000_000_000) return `${(num / 1_000_000_000_000).toFixed(1)}T`
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

function formatDate(dateString: string) {
  if (!dateString) return ''
  const now = new Date()
  const date = new Date(dateString)
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const mediaId = params.id as string
  
  const [commentText, setCommentText] = useState('')
  const [liking, setLiking] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  // Lấy dữ liệu từ store.items thay vì currentMedia
  const { items, loading, error } = useAppSelector(state => state.medias)
  const { user, isAuthenticated } = useAppSelector(state => state.auth)

  // Lấy media đầu tiên từ list (vì fetch với ID chỉ trả về 1 item)
  const media = items.length > 0 ? items[0] : null

  useEffect(() => {
    if (mediaId) {
        // Gọi thẳng fetchMedias với params id
        dispatch(fetchMedias({ id: mediaId }) as any)
    }
  }, [mediaId, dispatch])

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setLiking(true)
    // await dispatch(likeMedia(mediaId) as any)
    setLiking(false)
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!media) return

    setSubscribing(true)
    await dispatch(subscribeChannel(media.userId) as any)
    setSubscribing(false)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // await dispatch(addComment({ mediaId, content: commentText }) as any)
    setCommentText('')
  }

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
    )
  }

  if (error || !media) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <p className="text-muted-foreground">{error || 'Media not found'}</p>
        </div>
      </MainLayout>
    )
  }

  const defaultAvatar = "https://ui-avatars.com/api/?name=CH&background=FDE047&color=000000&font-size=0.4&bold=true"
  const channelAvatar = media.user?.avatarUrl || defaultAvatar

  return (
    <MainLayout>
      <div className="w-full max-w-[1400px] mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          <div className="lg:col-span-2 space-y-4">
            {/* Player */}
            <div className="relative w-full bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
              <img src={media.thumbnail??''} alt={media.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors cursor-pointer group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-white text-2xl sm:text-3xl ml-1">▶</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2 line-clamp-2">
                {media.title}
              </h1>
            </div>

            {/* User Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push(`/channel/${media.userId}`)}>
                  <img src={channelAvatar} alt={media.user?.fullName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-border/50" />
                  <div>
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {media.user?.fullName || 'User'}
                    </h3>
                  </div>
                </div>
                <button onClick={handleSubscribe} disabled={subscribing} className="ml-2 px-4 py-2 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-sm transition-colors">
                  Subscribe
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pb-2 sm:pb-0">
                <button onClick={handleLike} disabled={liking} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-border/50 text-sm font-semibold transition-colors">
                  <ThumbsUp size={18} />
                  {formatCount(media.likeCount)}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-border/50 text-sm font-semibold transition-colors">
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>

            {/* Desc & Comments... (Giữ nguyên logic cũ của bạn) */}
            <div className="bg-muted rounded-xl p-4 mt-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{media.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg text-foreground">Recommended</h3>
            <div className="text-muted-foreground text-sm">More content coming soon</div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}