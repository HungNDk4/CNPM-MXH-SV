import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { notificationAPI } from '@/services/api'
import SidebarDock from '@/components/layout/SidebarDock'
import MobileBottomBar from '@/components/layout/MobileBottomBar'
import NotificationDropdown from '@/components/layout/NotificationDropdown'
import UserMenuDropdown from '@/components/layout/UserMenuDropdown'
import {
  GraduationCap,
  Search,
  Plus,
  Bookmark,
  Sun,
  Moon,
  X,
} from 'lucide-react'

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [unreadCount, setUnreadCount] = useState(0)

  // Sync search input when url param changes
  useEffect(() => {
    setSearchInput(searchParams.get('search') || '')
  }, [searchParams])

  // Polling unread notifications (30s) when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0)
      return
    }

    let isMounted = true
    const fetchUnread = async () => {
      try {
        const { data } = await notificationAPI.getUnreadCount()
        if (isMounted) setUnreadCount(data.unread_count || 0)
      } catch {
        // silent fail for polling
      }
    }

    fetchUnread()
    const timer = setInterval(fetchUnread, 30000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [isAuthenticated])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const term = searchInput.trim()
    if (term) {
      navigate(`/?search=${encodeURIComponent(term)}`)
    } else {
      navigate('/')
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col transition-colors duration-200">
      {/* ── Top Header Navigation Bar (Sticky Glassmorphic) ── */}
      <header className="sticky top-0 z-50 bg-surface-card/90 backdrop-blur-md border-b border-surface-border shadow-2xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            title="Mini Study Network"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-primary/25 transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-none">
                <span>Mini Study</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                  Network
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">
                Mạng học tập sinh viên
              </p>
            </div>
          </Link>

          {/* Center Global Search Pill */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-lg relative mx-2 hidden sm:block"
            role="search"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm bài viết, tài liệu..."
              className="input pl-10 pr-9 py-2 text-xs sm:text-sm w-full rounded-full bg-surface-muted/70 border-surface-border focus:bg-surface-card shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Xóa từ khóa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Theme Toggle Button (For guest only; authenticated users switch inside UserMenuDropdown) */}
            {!isAuthenticated && (
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-surface-muted rounded-xl transition-all"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" aria-hidden="true" />
                )}
              </button>
            )}

            {isAuthenticated ? (
              <>
                {/* Nút Tạo bài viết */}
                <Link
                  to="/posts/create"
                  aria-label="Đăng bài"
                  className="btn-primary text-xs sm:text-sm px-3.5 sm:px-4 py-2 min-h-10 hidden sm:inline-flex items-center gap-1.5 rounded-full"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Đăng bài</span>
                </Link>

                {/* Bookmark Shortcut */}
                <Link
                  to="/bookmarks"
                  aria-label="Bài viết đã lưu"
                  className="w-10 h-10 hidden md:flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-surface-muted rounded-xl transition-all"
                  title="Bài viết đã lưu"
                >
                  <Bookmark className="w-5 h-5" />
                </Link>

                {/* Notification Dropdown Center */}
                <NotificationDropdown />

                {/* User Menu Dropdown (Grovelyn Image 2 Style) */}
                <UserMenuDropdown
                  user={user}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onLogout={logout}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary px-3 py-2 rounded-xl transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl shadow-xs"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main App Body (with Slim Dock on Left) ── */}
      <div className="flex-1 flex w-full">
        {/* Left Slim Dock Sidebar */}
        <SidebarDock
          isAuthenticated={isAuthenticated}
          user={user}
        />

        {/* Content Outlet */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-20 md:pb-8 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <MobileBottomBar
        isAuthenticated={isAuthenticated}
        user={user}
        unreadCount={unreadCount}
      />
    </div>
  )
}
