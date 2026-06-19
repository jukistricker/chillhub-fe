'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchChannelDetail, subscribeChannel } from '@/store/slices/channelsSlice'
import MainLayout from '@/components/MainLayout'
import { Bell, Eye } from 'lucide-react'

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function formatDate(date: string) {
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

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const channelId = params.id as string
  const [subscribing, setSubscribing] = useState(false)

  const { channelDetail, loading, error } = useAppSelector(state => state.channels)
  const { isAuthenticated } = useAppSelector(state => state.auth)

  useEffect(() => {
    dispatch(fetchChannelDetail(channelId) as any)
  }, [channelId, dispatch])

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setSubscribing(true)
    await dispatch(subscribeChannel(channelId) as any)
    setSubscribing(false)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading channel...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!channelDetail) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Channel not found</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="w-full">
        {/* Banner */}
        <div className="relative w-full h-48 sm:h-64 bg-muted overflow-hidden">
          <img
            src={channelDetail.bannerImage}
            alt="Channel Banner"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Channel Header */}
        <div className="px-4 sm:px-8 py-8 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end">
            <img
              src={channelDetail.image}
              alt={channelDetail.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-background"
            />

            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                {channelDetail.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground text-sm mb-4">
                <div>
                  <span className="font-semibold text-foreground">
                    {formatNumber(channelDetail.videoCount)}
                  </span>
                  {' '}videos
                </div>
                <span className="hidden sm:inline">•</span>
                <div>
                  <span className="font-semibold text-foreground">
                    {formatNumber(channelDetail.subscriberCount)}
                  </span>
                  {' '}subscribers
                </div>
                <span className="hidden sm:inline">•</span>
                <div>Joined {channelDetail.createdAt}</div>
              </div>

              <p className="text-foreground max-w-2xl line-clamp-2 mb-4">
                {channelDetail.description}
              </p>

              {isAuthenticated ? (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-colors ${
                    channelDetail.isSubscribed
                      ? 'bg-muted text-foreground hover:bg-muted/80'
                      : 'bg-amber-500 text-black hover:bg-amber-600 disabled:bg-amber-500/50'
                  }`}
                >
                  <Bell size={18} />
                  {channelDetail.isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
                >
                  <Bell size={18} />
                  Subscribe
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-4 sm:px-8">
          <div className="flex gap-6">
            <button className="py-4 font-semibold text-foreground border-b-2 border-amber-500">
              Videos
            </button>
            <button className="py-4 text-muted-foreground hover:text-foreground transition-colors">
              Playlists
            </button>
            <button className="py-4 text-muted-foreground hover:text-foreground transition-colors">
              About
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="p-4 sm:p-8">
          {channelDetail.videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {channelDetail.videos.map((video) => (
                <div
                  key={video.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/watch/${video.id}`)}
                >
                  <div className="relative overflow-hidden rounded-lg bg-muted aspect-video mb-3">
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
                    <h3 className="font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {formatNumber(video.views)} views
                      </span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos yet</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
