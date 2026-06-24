'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store'
// import { updateCurrentUser } from '@/store/slices/authSlice' 
import MainLayout from '@/components/MainLayout'
import { authService } from '@/services/auth.service' // Thay đổi đường dẫn cho đúng với dự án của bạn
import { User, Lock, Globe, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Lấy thông tin auth hiện tại từ Redux Store toàn cục
  const { user: currentUser, isAuthenticated } = useAppSelector(state => state.auth)

  // States cho Form Thông tin cá nhân
  const [fullName, setFullName] = useState('')
  const [lang, setLang] = useState<number>(1) // 0: En, 1: Vi (khớp với LanguageEnum)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // States cho Form Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Kiểm tra quyền truy cập: Nếu chưa login thì đá về trang login
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (currentUser) {
      // Đổ dữ liệu cũ của user vào form xem thông tin (Đã bypass overlap từ turn trước)
      setFullName(currentUser.fullName || '')
      setLang(String(currentUser.lang) === 'En' || Number(currentUser.lang) === 0 ? 0 : 1)
    }
  }, [isAuthenticated, currentUser, router])

  // 1. Xử lý cập nhật thông tin cá nhân (UpdateProfileAsync)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setProfileMessage({ type: 'error', text: 'Họ và tên không được để trống.' })
      return
    }

    setProfileLoading(true)
    setProfileMessage(null)

    try {
      // Thay thế fetch bằng Axios Service gọn gàng
      const result = await authService.updateProfile(fullName, lang);

      if (result.status === 200 || result.success) {
        setProfileMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' })
        // Nếu có action đồng bộ Redux, hãy kích hoạt tại đây:
        // dispatch(updateCurrentUser({ fullName, lang }))
      } else {
        setProfileMessage({ type: 'error', text: result.message || 'Có lỗi xảy ra khi cập nhật.' })
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || 'Lỗi kết nối máy chủ hoặc không có quyền truy cập.'
      setProfileMessage({ type: 'error', text: errorMsg })
    } finally {
      setProfileLoading(false)
    }
  }

  // 2. Xử lý đổi mật khẩu (ChangePasswordAsync)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng điền đầy đủ các trường mật khẩu.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp.' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên.' })
      return
    }

    setPasswordLoading(true)

    try {
      // Thay thế fetch bằng Axios Service gọn gàng
      const result = await authService.changePassword(currentPassword, newPassword);

      if (result.status === 200 || result.success) {
        setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' })
        // Clear trắng form mật khẩu sau khi đổi thành công
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: result.message || 'Đổi mật khẩu thất bại.' })
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.message || 'Mật khẩu hiện tại không chính xác.'
      setPasswordMessage({ type: 'error', text: errorMsg })
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!currentUser) return null

  return (
    <MainLayout>
      <div className="max-w-[800px] mx-auto px-4 py-8 font-sans text-foreground space-y-8">
        
        {/* TIÊU ĐỀ TRANG */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cài đặt tài khoản</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin hồ sơ cá nhân và cấu hình bảo mật mật khẩu của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          
          {/* PHẦN 1: THÔNG TIN CÁ NHÂN */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <User size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold">Thông tin cá nhân</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Email (Chỉ xem - Khóa sửa) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Địa chỉ Email</label>
                <input 
                  type="text" 
                  disabled 
                  value={currentUser.email || ''} 
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-muted-foreground border border-border/40 cursor-not-allowed text-sm font-medium"
                />
              </div>

              {/* Username (Chỉ xem - Khóa sửa) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tên tài khoản (Username)</label>
                <input 
                  type="text" 
                  disabled 
                  value={`@${currentUser.username || ''}`} 
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-200/60 dark:bg-zinc-800 text-muted-foreground border border-border/40 cursor-not-allowed text-sm font-medium"
                />
              </div>

              {/* Họ và tên (Cho sửa) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Họ và tên</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium transition-all outline-none"
                />
              </div>

              {/* Ngôn ngữ hệ thống */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Globe size={14} /> Ngôn ngữ ưu tiên
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value={1}>Tiếng Việt (Vi)</option>
                  <option value={0}>English (En)</option>
                </select>
              </div>

              {/* Thông báo kết quả Form 1 */}
              {profileMessage && (
                <div className={`p-3.5 rounded-xl flex items-start gap-2 text-sm font-medium ${
                  profileMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  {profileMessage.type === 'success' ? <CheckCircle size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {/* Nút lưu thông tin */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-500/50 rounded-xl font-semibold text-sm transition-all shadow-md shadow-amber-500/10 flex items-center gap-2"
                >
                  {profileLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>

          {/* PHẦN 2: ĐỔI MẬT KHẨU */}
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Lock size={20} className="text-amber-500" />
              <h2 className="text-lg font-bold">Bảo mật mật khẩu</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Mật khẩu hiện tại */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium transition-all outline-none"
                />
              </div>

              {/* Mật khẩu mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu mới</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium transition-all outline-none"
                />
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Xác nhận mật khẩu mới</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-medium transition-all outline-none"
                />
              </div>

              {/* Thông báo kết quả Form 2 */}
              {passwordMessage && (
                <div className={`p-3.5 rounded-xl flex items-start gap-2 text-sm font-medium ${
                  passwordMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  {passwordMessage.type === 'success' ? <CheckCircle size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              {/* Nút cập nhật mật khẩu */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 rounded-xl font-semibold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}