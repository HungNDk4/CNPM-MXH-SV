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
  Settings,
  HelpCircle,
  Globe,
  FileEdit,
  Folder,
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
        className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white dark:hover:bg-[#17231F] text-[#123D35] dark:text-white transition-all duration-150 border border-transparent hover:border-[#DCE5DC]/60 dark:hover:border-[#2C3B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] cursor-pointer"
        aria-label="Menu tài khoản"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#16A34A]/40 dark:border-[#4ADE80]/40 shadow-2xs">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || 'Avatar'}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full bg-[#123D35] dark:bg-[#244B3C] text-white dark:text-[#4ADE80] flex items-center justify-center text-xs font-bold">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="hidden xl:flex flex-col text-left">
          <span className="text-xs font-bold text-[#123D35] dark:text-white max-w-[110px] truncate leading-tight">
            {user?.full_name || 'Thành viên'}
          </span>
          <span className="text-[10px] font-semibold text-[#52675A] dark:text-[#A8B9AF] leading-tight">
            {user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#52675A] dark:text-[#A8B9AF] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#17231F] border border-[#DCE5DC] dark:border-[#2C3B35] rounded-2xl shadow-xl shadow-emerald-950/5 dark:shadow-black/40 z-50 overflow-hidden animate-slide-up">
          {/* Header Banner */}
          <div className="p-4 bg-surface-muted border-b border-surface-border text-content relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-full avatar-gradient-ring flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-sm font-bold text-content border border-surface-border">
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
                <h4 className="font-bold text-sm truncate text-content leading-tight">
                  {user?.full_name || 'Thành viên'}
                </h4>
                <p className="text-[11px] text-content-muted truncate mt-0.5">
                  {user?.university || user?.major || 'Sinh viên học tập'}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] bg-surface-card border border-surface-border text-content-muted px-2 py-0.5 rounded-full font-medium">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{user?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Sections (Theo đúng chuẩn Grovelyn Image 1) */}
          <div className="p-2 space-y-1 text-xs">
            {/* TÀI KHOẢN */}
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-content-muted uppercase">
              Tài khoản
            </div>

            {/* Cài đặt và quyền riêng tư */}
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-content hover:bg-surface-muted transition-colors font-medium"
            >
              <Settings className="w-4 h-4 text-[#56614f] dark:text-[#929292]" />
              <span>Cài đặt và quyền riêng tư</span>
            </Link>

            {/* Trợ giúp */}
            <Link
              to="/settings?tab=help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-content hover:bg-surface-muted transition-colors font-medium"
            >
              <HelpCircle className="w-4 h-4 text-[#56614f] dark:text-[#929292]" />
              <span>Trợ giúp</span>
            </Link>

            {/* Chế độ Sáng / Tối */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-content hover:bg-surface-muted transition-colors font-medium text-left cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-[#2ECC71]" /> : <Moon className="w-4 h-4 text-[#56614f]" />}
                <span>Giao diện {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
              </span>
              <span className="text-[10px] font-bold text-content-muted bg-surface-muted px-2 py-0.5 rounded-md border border-surface-border">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* QUẢN LÝ */}
            <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold tracking-wider text-content-muted uppercase border-t border-surface-border">
              Quản lý
            </div>

            {/* Bài đăng và hoạt động */}
            <Link
              to="/my-posts"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-content hover:bg-surface-muted transition-colors font-medium"
            >
              <FileEdit className="w-4 h-4 text-[#56614f] dark:text-[#929292]" />
              <span>Bài đăng và hoạt động</span>
            </Link>

            {/* Dự án / Tài liệu của bạn */}
            <Link
              to="/bookmarks"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-content hover:bg-surface-muted transition-colors font-medium"
            >
              <Folder className="w-4 h-4 text-[#56614f] dark:text-[#929292]" />
              <span>Tài liệu đã lưu</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors font-semibold"
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Bảng quản trị hệ thống</span>
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
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold text-left cursor-pointer"
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
