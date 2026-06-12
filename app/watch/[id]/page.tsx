'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchVideoDetail, likeVideo, addComment } from '@/store/slices/videosSlice'
import { subscribeChannel } from '@/store/slices/channelsSlice'
import MainLayout from '@/components/MainLayout'
import { ThumbsUp, MessageCircle, Share2, MoreVertical, Bell } from 'lucide-react'

function formatNumber(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default function WatchPage() {
  const params = useParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const videoId = params.id as string
  const [commentText, setCommentText] = useState('')
  const [liking, setLiking] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  const { videoDetail, loading, error } = useAppSelector(state => state.videos)
  const { channelDetail } = useAppSelector(state => state.channels)
  const { user, isAuthenticated } = useAppSelector(state => state.auth)

  useEffect(() => {
    dispatch(fetchVideoDetail(videoId) as any)
  }, [videoId, dispatch])

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    setLiking(true)
    await dispatch(likeVideo(videoId) as any)
    setLiking(false)
  }

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!videoDetail) return

    setSubscribing(true)
    await dispatch(subscribeChannel(videoDetail.channelId) as any)
    setSubscribing(false)
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    await dispatch(addComment({ videoId, content: commentText }) as any)
    setCommentText('')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border border-border border-t-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!videoDetail) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Video not found</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="w-full max-w-6xl mx-auto p-4">
        {/* Video Player */}
        <div className="relative w-full bg-black rounded-lg overflow-hidden mb-6 aspect-video">
          <div className="flex items-center justify-center h-full bg-muted">
            <div className="text-center">
              <img
                src={videoDetail.thumbnail}
                alt={videoDetail.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl ml-1">▶</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Title */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {videoDetail.title}
              </h1>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div>
                  <span>{formatNumber(videoDetail.views)} views</span>
                  <span> • {videoDetail.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Channel Info & Actions */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push(`/channel/${videoDetail.channelId}`)}>
                <img
                  src={videoDetail.channelImage}
                  alt={videoDetail.channelName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-foreground">{videoDetail.channelName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(videoDetail.views)} subscribers
                  </p>
                </div>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold transition-colors"
              >
                <Bell size={18} />
                Subscribe
              </button>
            </div>

            {/* Description */}
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                {videoDetail.description}
              </p>
            </div>

            {/* Like & Share Buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={handleLike}
                disabled={liking}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ThumbsUp size={18} className={videoDetail.isLiked ? 'fill-current' : ''} />
                <span className="text-sm font-semibold">{formatNumber(videoDetail.likes)}</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors">
                <Share2 size={18} />
                <span className="text-sm font-semibold">Share</span>
              </button>

              <button className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Comments Section */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-bold text-foreground">
                {videoDetail.comments.length} Comments
              </h3>

              {/* Add Comment Form */}
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} className="flex gap-4 mb-6">
                  <img
                    src={user?.profileImage}
                    alt={user?.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 bg-muted border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    >
                      Comment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 border border-border rounded-lg mb-6">
                  <p className="text-muted-foreground mb-4">Sign in to comment</p>
                  <button
                    onClick={() => router.push('/login')}
                    className="px-4 py-2 border border-border rounded-full hover:bg-muted transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {videoDetail.comments.map((comment) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex gap-3">
                      <img
                        src={comment.userImage}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                            <ThumbsUp size={14} />
                            {formatNumber(comment.likes)}
                          </button>
                          <button className="hover:text-foreground transition-colors">Reply</button>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-12 space-y-2 mt-3 border-l-2 border-border pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3">
                            <img
                              src={reply.userImage}
                              alt={reply.userName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground text-sm">
                                  {reply.userName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {reply.createdAt}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mt-1">
                                {reply.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Recommended Videos */}
          <div className="space-y-2">
            <h3 className="font-bold text-foreground mb-4">Recommended</h3>
            {/* Placeholder for recommended videos */}
            <div className="text-muted-foreground text-sm">
              More videos coming soon
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
