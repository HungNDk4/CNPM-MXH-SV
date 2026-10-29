import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Bookmark,
  PlusCircle,
  Shield,
  LogOut,
  Sun,
  Moon,
  GraduationCap,
  Sparkles,
  ChevronDown,
} from 'lucide-react'

export default function UserMenuDropdown({ user, theme, toggleTheme, onLogout }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

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
        className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-surface-muted transition-all duration-200 border border-transparent hover:border-surface-border"
        aria-label="Menu tài khoản"
      >
        <div className="w-9 h-9 rounded-full avatar-gradient-ring flex items-center justify-center shrink-0 shadow-2xs">
          <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600 dark:text-primary-300">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'Avatar'}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              user?.full_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
        </div>
        <div className="hidden xl:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[110px] truncate leading-tight">
            {user?.full_name || 'Thành viên'}
          </span>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
            {user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
          {/* Header Banner */}
          <div className="p-4 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-full avatar-gradient-ring flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden text-sm font-bold text-white">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    user?.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm truncate text-white leading-tight">
                  {user?.full_name || 'Thành viên'}
                </h4>
                <p className="text-[11px] text-sky-200/80 truncate mt-0.5">
                  {user?.university || user?.major || 'Sinh viên học tập'}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-medium">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>{user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Sections */}
          <div className="p-2 space-y-1 text-xs">
            {/* TÀI KHOẢN */}
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Tài khoản
            </div>
            <Link
              to={`/profile/${user?.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-surface-muted transition-colors font-medium"
            >
              <User className="w-4 h-4 text-primary-500" />
              <span>Hồ sơ cá nhân</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                toggleTheme()
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-surface-muted transition-colors font-medium text-left"
            >
              <span className="flex items-center gap-2.5">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                <span>Giao diện {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-surface-muted px-2 py-0.5 rounded-md">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* QUẢN LÝ */}
            <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase border-t border-surface-border">
              Quản lý
            </div>
            <Link
              to="/bookmarks"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-surface-muted transition-colors font-medium"
            >
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span>Bài viết đã lưu</span>
            </Link>
            <Link
              to="/posts/create"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-surface-muted transition-colors font-medium"
            >
              <PlusCircle className="w-4 h-4 text-emerald-500" />
              <span>Tạo bài viết mới</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin/audit-logs"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors font-semibold"
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Nhật ký kiểm duyệt</span>
              </Link>
            )}

            {/* ĐĂNG XUẤT */}
            <div className="pt-1.5 border-t border-surface-border">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
