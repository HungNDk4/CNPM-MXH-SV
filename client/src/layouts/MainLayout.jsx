import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { authAPI, notificationAPI } from '@/services/api'
import toast from 'react-hot-toast'
import {
  Search,
  X,
  Plus,
  Bookmark,
  Bell,
  Shield,
  LogOut,
  MessageSquare,
  CornerDownRight,
  Heart,
  User,
  GraduationCap,
  Sun,
  Moon,
} from 'lucide-react'

const EVENT_CONFIG = {
  comment: {
    label: 'Đã bình luận về bài viết của bạn',
    icon: MessageSquare,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  reply: {
    label: 'Đã trả lời bình luận của bạn',
    icon: CornerDownRight,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  like_post: {
    label: 'Đã thích bài viết của bạn',
    icon: Heart,
    iconColor: 'text-rose-500',
  },
  like_comment: {
    label: 'Đã thích bình luận của bạn',
    icon: Heart,
    iconColor: 'text-rose-500',
  },
  follow: {
    label: 'Đã bắt đầu theo dõi bạn',
    icon: User,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => (await notificationAPI.getUnreadCount()).data.data.count,
    refetchInterval: 30000,
  })

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => (await notificationAPI.getAll({ page: 1, limit: 10 })).data.data,
    enabled: open,
  })

  const markAll = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
      toast.success('Đã đánh dấu đọc tất cả thông báo!')
    },
  })

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await notificationAPI.markAsRead(item.id)
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
      } catch { /* ignore */ }
    }
    setOpen(false)
    if (item.post_id) {
      navigate(`/posts/${item.post_id}`)
    }
  }

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Thông báo"
        className="relative min-w-10 min-h-10 px-2.5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3.5 border-b border-surface-border bg-surface-muted/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span>Thông báo</span>
              {unreadCount > 0 && <span className="text-primary-600 dark:text-primary-400 text-xs">({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {isLoading ? (
              <p className="p-4 text-xs text-slate-500 dark:text-slate-400 text-center">Đang tải thông báo...</p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">Không có thông báo nào.</p>
            ) : (
              notifications.map((item) => {
                const config = EVENT_CONFIG[item.event_type] || {
                  label: 'Bạn có thông báo mới',
                  icon: Bell,
                  iconColor: 'text-primary-600 dark:text-primary-400',
                }
                const EventIcon = config.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 text-xs flex gap-2.5 items-start cursor-pointer transition-colors ${
                      !item.is_read
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                        : 'hover:bg-surface-muted'
                    }`}
                  >
                    <span className={`shrink-0 mt-0.5 ${config.iconColor}`}>
                      <EventIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className={`leading-snug break-words ${!item.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {config.label}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {!item.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MainLayout() {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      navigate(`/?search=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/')
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout(refreshToken)
    } catch { /* ignore */ }
    logout()
    navigate('/login')
    toast.success('Đăng xuất thành công.')
  }

  return (
    <div className="min-h-screen bg-surface text-slate-800 dark:text-slate-100 transition-colors duration-150">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-surface-card/95 backdrop-blur-md border-b border-surface-border shadow-2xs transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0" aria-label="Mini Study Network — Trang chủ">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg hidden sm:inline tracking-tight">Mini Study Network</span>
            <span className="font-bold text-primary-600 text-sm sm:hidden font-mono tracking-tight">MSN</span>
          </Link>

          {/* Global Search Bar (Keep hidden lg:flex and exact placeholder for test contract) */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-md mx-4 relative" role="search">
            <Search className="absolute inset-y-0 left-0 pl-3.5 my-auto w-8 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, tài liệu..."
              className="input pl-9 pr-8 py-2 text-sm w-full bg-surface-muted/60 border-surface-border focus:bg-surface-card"
              maxLength={100}
              aria-label="Tìm kiếm bài viết, tài liệu"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  if (searchParams.get('search')) {
                    navigate('/')
                  }
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
                aria-label="Xóa từ khóa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Nav actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Theme Toggle Button (available to all) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="min-w-9 min-h-10 px-2 sm:min-w-10 sm:px-2.5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" aria-hidden="true" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Đăng bài */}
                <Link
                  to="/posts/create"
                  aria-label="Đăng bài"
                  className="btn-primary text-sm px-3 sm:px-4 py-2 min-w-10 min-h-10 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng bài</span>
                </Link>

                {/* Bài viết đã lưu */}
                <Link
                  to="/bookmarks"
                  aria-label="Bài viết đã lưu"
                  className="min-w-10 min-h-10 px-2.5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Bài viết đã lưu"
                >
                  <Bookmark className="w-5 h-5" aria-hidden="true" />
                </Link>

                {/* Chuông thông báo */}
                <NotificationDropdown />

                {/* Admin Link */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/audit-logs"
                    aria-label="Quản trị hệ thống"
                    className="min-w-10 min-h-10 px-2 sm:px-2.5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold gap-1.5"
                    title="Nhật ký kiểm duyệt"
                  >
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                    <span className="hidden md:inline">Quản trị</span>
                  </Link>
                )}

                {/* Trang cá nhân */}
                <Link to={`/profile/${user?.id}`} aria-label="Trang cá nhân" className="flex items-center justify-center min-w-10 min-h-10 hover:opacity-85 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold flex items-center justify-center overflow-hidden border border-primary-200 dark:border-primary-800 text-xs shadow-subtle">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'Avatar'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      user?.full_name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                </Link>

                {/* Đăng xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Đăng xuất"
                  className="min-w-10 min-h-10 px-1.5 sm:px-2.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-xs sm:text-sm px-2.5 sm:px-4 py-2 min-h-10 flex items-center shrink-0">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-xs sm:text-sm px-2.5 sm:px-4 py-2 min-h-10 flex items-center shrink-0">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
