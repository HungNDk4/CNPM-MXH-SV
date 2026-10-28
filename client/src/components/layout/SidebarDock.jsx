import { Link, useLocation } from 'react-router-dom'
import {
  Compass,
  Bookmark,
  Bell,
  PlusCircle,
  Shield,
  GraduationCap,
  Sun,
  Moon,
  FolderGit2,
  BookOpen,
} from 'lucide-react'

const SHORTCUT_SUBJECTS = [
  { label: 'CNPM', color: 'from-blue-500 to-indigo-600' },
  { label: 'CSDL', color: 'from-emerald-500 to-teal-600' },
  { label: 'OOP', color: 'from-purple-500 to-pink-600' },
  { label: 'KTMT', color: 'from-amber-500 to-orange-600' },
]

export default function SidebarDock({ isAuthenticated, user, theme, toggleTheme, unreadCount = 0 }) {
  const location = useLocation()
  const path = location.pathname

  const isCurrent = (route) => {
    if (route === '/' && path === '/') return true
    if (route !== '/' && path.startsWith(route)) return true
    return false
  }

  return (
    <aside
      className="hidden md:flex flex-col items-center justify-between w-20 py-5 bg-surface-card border-r border-surface-border sticky top-16 h-[calc(100vh-4rem)] z-40 transition-colors"
      aria-label="Thanh điều hướng nhanh"
    >
      {/* Top Icons */}
      <div className="flex flex-col items-center gap-4 w-full px-2">
        {/* Trang chủ */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group ${
            isCurrent('/')
              ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-300 shadow-2xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
          }`}
          title="Trang chủ"
        >
          <Compass className={`w-5 h-5 transition-transform group-hover:scale-110 ${isCurrent('/') ? 'text-primary-600 dark:text-primary-400' : ''}`} />
          <span className="text-[10px] leading-tight tracking-tight">Trang chủ</span>
        </Link>

        {/* Đã lưu */}
        {isAuthenticated && (
          <Link
            to="/bookmarks"
            className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group ${
              isCurrent('/bookmarks')
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
            }`}
            title="Bài viết đã lưu"
          >
            <Bookmark className={`w-5 h-5 transition-transform group-hover:scale-110 ${isCurrent('/bookmarks') ? 'text-amber-600 dark:text-amber-400 fill-amber-500/20' : ''}`} />
            <span className="text-[10px] leading-tight tracking-tight">Đã lưu</span>
          </Link>
        )}

        {/* Thông báo */}
        {isAuthenticated && (
          <Link
            to="/notifications"
            className={`relative flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group ${
              isCurrent('/notifications')
                ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
            }`}
            title="Trung tâm thông báo"
          >
            <Bell className={`w-5 h-5 transition-transform group-hover:scale-110 ${isCurrent('/notifications') ? 'text-sky-600 dark:text-sky-400' : ''}`} />
            <span className="text-[10px] leading-tight tracking-tight">Thông báo</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* Tạo bài */}
        {isAuthenticated && (
          <Link
            to="/posts/create"
            className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group ${
              isCurrent('/posts/create')
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
            }`}
            title="Tạo bài viết mới"
          >
            <PlusCircle className={`w-5 h-5 transition-transform group-hover:scale-110 ${isCurrent('/posts/create') ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span className="text-[10px] leading-tight tracking-tight">Đăng bài</span>
          </Link>
        )}

        {/* Admin Audit */}
        {user?.role === 'admin' && (
          <Link
            to="/admin/audit-logs"
            className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group ${
              isCurrent('/admin/audit-logs')
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
            }`}
            title="Quản trị kiểm duyệt"
          >
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] leading-tight tracking-tight">Quản trị</span>
          </Link>
        )}

        {/* Divider */}
        <div className="w-8 h-[1px] bg-surface-border my-1" />

        {/* Subject Shortcuts */}
        <div className="flex flex-col items-center gap-2">
          {SHORTCUT_SUBJECTS.map((sub) => (
            <Link
              key={sub.label}
              to={`/?subject=${encodeURIComponent(sub.label)}`}
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${sub.color} text-white font-mono text-[11px] font-bold flex items-center justify-center shadow-2xs hover:scale-110 hover:shadow-md transition-all duration-200`}
              title={`Lọc môn học ${sub.label}`}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Theme Toggle */}
      <div className="flex flex-col items-center pb-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted transition-colors"
          title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>
    </aside>
  )
}
