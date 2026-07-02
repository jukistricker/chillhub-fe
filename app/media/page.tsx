'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image' // <-- Tối ưu hoá ảnh chuẩn Next.js
import { useAppDispatch, useAppSelector } from '@/store'
import MainLayout from '@/components/MainLayout'
import { Video, Play, Loader2, Edit2, X, Upload, Image as ImageIcon } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'
import { useInView } from 'react-intersection-observer'
import { formatViews } from '@/lib/videoUtils'
import { Media } from '@/types/media'
import { imageService } from '@/lib/imageUtils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
const API_QUEUE_WORKER = process.env.NEXT_PUBLIC_QUEUE_WORKER_URL

export default function ManageMediaPage() {
  const router = useRouter()
  
  // Auth State
  const { user: currentUser, isAuthenticated } = useAppSelector(state => state.auth)
  const channelId = currentUser?.id

  // Infinite Scroll State
  const [mediaItems, setMediaItems] = useState<Media[]>([])
  const [videosLoading, setVideosLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Dialog & Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<Media | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  // Redirect nếu chưa đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // 1. Fetch danh sách video đầu tiên của CHÍNH MÌNH
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

  // 2. Fetch thêm video (Infinite Scroll)
  useEffect(() => {
    if (inView && hasMore && !videosLoading && channelId && nextCursor) {
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
  }, [inView, hasMore, videosLoading, nextCursor, channelId])

  // ================= MỞ DIALOG =================
  const handleOpenEdit = (media: Media, e: React.MouseEvent) => {
    e.stopPropagation() // Ngăn việc click xuyên qua component cha (đi tới trang watch)
    setEditingMedia(media)
    setEditTitle(media.title)
    setEditDescription(media.description || '')
    setThumbnailPreview(media.thumbnail || null)
    setThumbnailFile(null)
    setIsDialogOpen(true)
  }

  // ================= ĐÓNG DIALOG =================
  const handleCloseDialog = () => {
    if (isSaving) return
    setIsDialogOpen(false)
    setEditingMedia(null)
  }

  // ================= CHỌN ẢNH TỪ MÁY =================
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      // Tạo url preview để hiển thị ngay lập tức
      const previewUrl = URL.createObjectURL(file)
      setThumbnailPreview(previewUrl)
    }
  }

  // ================= LƯU MEDIA =================
  const handleSaveMedia = async () => {
    if (!editingMedia) return
    setIsSaving(true)

    try {
      let finalThumbnailUrl = editingMedia.thumbnail

      // Nếu có chọn ảnh mới -> gọi lên Worker bằng axios =))
      if (thumbnailFile) {
        const urls = await imageService.uploadImages([thumbnailFile])
        finalThumbnailUrl = urls[0]
      }

      // TODO: Thay thế bằng API PUT/PATCH thực tế của dự án bạn
      
      await fetch(`${API_QUEUE_WORKER}/api/media`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        //   'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          thumbnail: finalThumbnailUrl
        })
      })
      

      // Cập nhật lại UI tạm thời (Nên làm sau khi API trả về thành công)
      setMediaItems(prev => prev.map(m => {
        if (m.id === editingMedia.id) {
          return { ...m, title: editTitle, description: editDescription, thumbnail: finalThumbnailUrl }
        }
        return m
      }))

      handleCloseDialog()
    } catch (error) {
      console.error("Lỗi khi lưu Media:", error)
      alert("Có lỗi xảy ra khi cập nhật video!")
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser) return null // Hoặc render Loading layout

  return (
    <MainLayout>
      <div className="w-full font-sans text-foreground pb-12">
        {/* HEADER QUẢN LÝ */}
        <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Studio Quản Lý</h1>
            <p className="text-muted-foreground mt-1 text-sm">Quản lý và chỉnh sửa video của bạn</p>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div className="max-w-[1280px] mx-auto px-6 mt-8">
          {mediaItems.length === 0 && !videosLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
              <Video size={48} className="stroke-[1.5]" />
              <p>Bạn chưa đăng tải video nào.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {mediaItems.map((video) => (
                  <div 
                    key={video.id} 
                    className="group cursor-pointer space-y-2 flex flex-col w-full relative"
                    onClick={() => router.push(`/watch/${video.id}`)}
                  >
                    {/* Nút Edit Video đè lên trên ảnh */}
                    <button 
                      onClick={(e) => handleOpenEdit(video, e)}
                      className="absolute top-2 right-2 z-10 p-2 bg-black/70 hover:bg-amber-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
                      title="Chỉnh sửa video"
                    >
                      <Edit2 size={16} />
                    </button>

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
                            const totalSeconds = Math.floor(video.duration / 1000)
                            const minutes = Math.floor(totalSeconds / 60)
                            const seconds = totalSeconds % 60
                            return `${minutes}:${String(seconds).padStart(2, "0")}`
                          })()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                        <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                          <Play size={18} className="fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="px-1 flex flex-col flex-1">
                      <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-amber-500 transition-colors pr-6">
                        {video.title}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-1.5 flex flex-col space-y-0.5">
                        <span>{formatViews(video.viewCount)} lượt xem</span>
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Khu vực Infinite Scroll */}
              <div ref={ref} className="flex justify-center pt-8 min-h-[60px]">
                {videosLoading && mediaItems.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    <span>Đang tải thêm...</span>
                  </div>
                )}
                {!hasMore && mediaItems.length > 0 && (
                  <span className="text-sm text-muted-foreground italic">
                    Đã hiển thị hết video
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DIALOG CHỈNH SỬA MEDIA */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">Chỉnh sửa Video</h2>
              <button 
                onClick={handleCloseDialog}
                disabled={isSaving}
                className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto">
              
              {/* Box Upload Thumbnail */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Thumbnail (Hình thu nhỏ)</label>
                <div 
                  className="relative aspect-video w-full max-w-sm border-2 border-dashed border-zinc-700 rounded-xl overflow-hidden bg-zinc-800 hover:bg-zinc-800/80 transition cursor-pointer flex flex-col items-center justify-center group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {thumbnailPreview ? (
                    <>
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <span className="text-white text-sm font-medium flex items-center gap-2">
                          <Upload size={16} /> Đổi ảnh khác
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-zinc-500 group-hover:text-amber-500 transition">
                      <ImageIcon size={32} className="mb-2" />
                      <span className="text-sm font-medium">Click để tải ảnh lên</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleThumbnailChange}
                  />
                </div>
              </div>

              {/* Form Input Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Tiêu đề (bắt buộc)</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nhập tiêu đề video..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition placeholder:text-zinc-600"
                />
              </div>

              {/* Form Input Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">Mô tả</label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Giới thiệu về video của bạn..."
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition placeholder:text-zinc-600 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
              <button
                onClick={handleCloseDialog}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveMedia}
                disabled={isSaving || !editTitle.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-50 disabled:bg-zinc-700 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang lưu...
                  </>
                ) : 'Lưu thay đổi'}
              </button>
            </div>

          </div>
        </div>
      )}
    </MainLayout>
  )
}