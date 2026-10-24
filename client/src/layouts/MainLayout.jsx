import { useState, useRef, useEffect } from 'react'
import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { authAPI, notificationAPI } from '@/services/api'
import toast from 'react-hot-toast'


const EVENT_LABELS = {
  comment: '💬 Đã bình luận về bài viết của bạn',
  reply: '↩️ Đã trả lời bình luận của bạn',
  like_post: '❤️ Đã thích bài viết của bạn',
  like_comment: '❤️ Đã thích bình luận của bạn',
  follow: '👤 Đã bắt đầu theo dõi bạn',
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
        className="relative min-w-10 min-h-10 px-2 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
      >
        <span className="text-xl" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between p-3.5 border-b border-surface-border">
            <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
              <span>🔔</span> Thông báo {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {isLoading ? (
              <p className="p-4 text-xs text-slate-400 text-center">Đang tải thông báo...</p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">Không có thông báo nào.</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 text-xs flex gap-2.5 items-start cursor-pointer transition-colors hover:bg-white/5 ${
                    !item.is_read ? 'bg-primary-950/20' : ''
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {item.event_type === 'comment' ? '💬' : item.event_type === 'reply' ? '↩️' : item.event_type === 'follow' ? '👤' : '❤️'}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className={`text-slate-200 leading-snug break-words ${!item.is_read ? 'font-semibold text-white' : ''}`}>
                      {EVENT_LABELS[item.event_type] || 'Bạn có thông báo mới'}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-400 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MainLayout() {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore()
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
    <div className="min-h-screen bg-surface">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 glass border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0" aria-label="Mini Study Network — Trang chủ">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gradient text-lg hidden sm:inline">Mini Study Network</span>
            <span className="font-bold text-gradient text-sm sm:hidden">MSN</span>
          </Link>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-sm mx-4 sm:mx-8 relative" role="search">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, tài liệu..."
              className="input pl-9 pr-8 py-2 text-sm w-full"
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
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 text-sm"
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </form>

          {/* Nav actions */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Đăng bài */}
                <Link to="/posts/create" aria-label="Đăng bài" className="btn-primary text-sm px-3 sm:px-4 py-2 min-w-10 min-h-10 flex items-center justify-center">
                  <span aria-hidden="true" className="sm:hidden text-lg leading-none">＋</span>
                  <span className="hidden sm:inline">+ Đăng bài</span>
                </Link>

                {/* Bài viết đã lưu */}
                <Link to="/bookmarks" aria-label="Bài viết đã lưu" className="min-w-10 min-h-10 px-2.5 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors" title="Bài viết đã lưu">
                  <span className="text-lg" aria-hidden="true">🔖</span>
                </Link>

                {/* Chuông thông báo */}
                <NotificationDropdown />

                {/* Admin Link */}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin/audit-logs"
                    aria-label="Quản trị hệ thống"
                    className="min-w-10 min-h-10 px-2 sm:px-2.5 flex items-center justify-center text-slate-300 hover:text-primary-300 hover:bg-white/5 rounded-xl transition-colors text-xs font-semibold gap-1"
                    title="Nhật ký kiểm duyệt"
                  >
                    <span className="text-base" aria-hidden="true">🛡️</span>
                    <span className="hidden md:inline">Quản trị</span>
                  </Link>
                )}

                {/* Trang cá nhân */}
                <Link to={`/profile/${user?.id}`} aria-label="Trang cá nhân" className="flex items-center justify-center min-w-10 min-h-10 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold overflow-hidden shadow">
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
                <button type="button" onClick={handleLogout} aria-label="Đăng xuất" className="min-w-10 min-h-10 px-1 sm:px-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
                  <span aria-hidden="true" className="sm:hidden text-xl">↪</span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm px-3 sm:px-5 py-2 min-h-10 flex items-center">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-sm px-3 sm:px-5 py-2 min-h-10 flex items-center">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
