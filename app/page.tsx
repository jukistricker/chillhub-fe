'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchVideos } from '@/store/slices/videosSlice'
import MainLayout from '@/components/MainLayout'
import { Play, Eye } from 'lucide-react'

function VideoCard({ video }: { video: any }) {
  const router = useRouter()

  const handleVideoClick = () => {
    router.push(`/watch/${video.id}`)
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatDate = (date: string) => {
    const now = new Date()
    const videoDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - videoDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-video mb-3" onClick={handleVideoClick}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold line-clamp-2 text-foreground cursor-pointer hover:text-primary transition-colors" onClick={handleVideoClick}>
          {video.title}
        </h3>
        <div className="text-sm text-muted-foreground space-y-0.5">
          <p className="hover:text-foreground cursor-pointer transition-colors">{video.channelName}</p>
          <p className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Eye size={14} /> {formatViews(video.views)} views
            </span>
            <span>•</span>
            <span>{formatDate(video.createdAt)}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { videos, loading, error } = useAppSelector(state => state.videos)

  useEffect(() => {
    dispatch(fetchVideos({ page: 1, limit: 12 }) as any)
  }, [dispatch])

  return (
    <MainLayout>
      <div className="w-full h-full">
        {/* Error Display */}
        {error && (
          <div className="m-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
            Failed to load videos. Showing cached videos.
          </div>
        )}

        {/* Loading State */}
        {loading && videos.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          </div>
        )}

        {/* Videos Grid */}
        {videos.length > 0 && (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <Play size={48} className="text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No videos found</p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
