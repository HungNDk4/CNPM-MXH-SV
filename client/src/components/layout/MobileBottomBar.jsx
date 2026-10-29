import { Link, useLocation } from 'react-router-dom'
import { Compass, Bookmark, Bell, Plus, User, LogIn } from 'lucide-react'

export default function MobileBottomBar({ isAuthenticated, user, unreadCount = 0 }) {
  const location = useLocation()
  const path = location.pathname

  const isCurrent = (route) => {
    if (route === '/' && path === '/') return true
    if (route !== '/' && path.startsWith(route)) return true
    return false
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-card/95 backdrop-blur-lg border-t border-surface-border px-3 py-2 flex items-center justify-around shadow-2xl transition-colors"
      aria-label="Điều hướng dưới màn hình"
    >
      {/* Trang chủ */}
      <Link
        to="/"
        className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
          isCurrent('/') ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px]">Trang chủ</span>
      </Link>

      {/* Đã lưu */}
      {isAuthenticated && (
        <Link
          to="/bookmarks"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
            isCurrent('/bookmarks') ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px]">Đã lưu</span>
        </Link>
      )}

      {/* Nút Tạo bài nổi ở giữa */}
      {isAuthenticated ? (
        <Link
          to="/posts/create"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white shadow-glow-indigo active:scale-95 transition-transform -mt-5 border-2 border-surface-card"
          aria-label="Đăng bài mới"
        >
          <Plus className="w-6 h-6" />
        </Link>
      ) : null}

      {/* Thông báo */}
      {isAuthenticated && (
        <Link
          to="/notifications"
          className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
            isCurrent('/notifications') ? 'text-sky-600 dark:text-sky-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px]">Thông báo</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      )}

      {/* Profile hoặc Login */}
      {isAuthenticated ? (
        <Link
          to={`/profile/${user?.id}`}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
            isCurrent(`/profile/${user?.id}`) ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-700">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <span className="text-[10px]">Tôi</span>
        </Link>
      ) : (
        <Link
          to="/login"
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-primary-600 dark:text-primary-400 font-medium"
        >
          <LogIn className="w-5 h-5" />
          <span className="text-[10px]">Đăng nhập</span>
        </Link>
      )}
    </nav>
  )
}
