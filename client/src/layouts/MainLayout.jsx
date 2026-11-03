import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { notificationAPI, authAPI } from '@/services/api'
import SidebarDock from '@/components/layout/SidebarDock'
import MobileBottomBar from '@/components/layout/MobileBottomBar'
import NotificationDropdown from '@/components/layout/NotificationDropdown'
import UserMenuDropdown from '@/components/layout/UserMenuDropdown'
import BrandLogo from '@/components/common/BrandLogo'
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
  const { user, isAuthenticated, logout, refreshToken } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const handleLogout = async () => {
    try {
      if (refreshToken) await authAPI.logout(refreshToken)
    } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [unreadCount, setUnreadCount] = useState(0)

  // Global keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault()
        document.getElementById('global-search-input')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
        const res = await notificationAPI.getUnreadCount()
        if (isMounted) setUnreadCount(res.data?.data?.count || 0)
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
    <div className="min-h-screen bg-surface flex flex-col transition-colors duration-200 relative">
      {/* ── Top Header Navigation Bar (Sticky Clean Surface) ── */}
      <header className="sticky top-0 z-50 bg-surface-card border-b border-surface-border shadow-card transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            title="OwlMate"
          >
            <BrandLogo size={38} showText={true} />
          </Link>

          {/* Search stays on member mobile; hide on narrow guest header to prevent overflow. */}
          <form
            onSubmit={handleSearchSubmit}
            className={`flex-1 min-w-0 max-w-lg relative mx-0 sm:mx-2 ${isAuthenticated ? 'block' : 'hidden sm:block'}`}
            role="search"
          >
            <input
              id="global-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm..."
              className="input pl-9 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm w-full rounded-full bg-[#F2F4EF] dark:bg-[#18191A] border-[#E2E7DE] dark:border-[#3E4042] focus:bg-white dark:focus:bg-[#303132] shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#56614f] dark:text-[#B0B3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchInput ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Xóa từ khóa"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-[20px] px-1 text-[11px] font-semibold text-[#56614f] dark:text-[#B0B3B8] bg-white dark:bg-[#303132] border border-[#E2E7DE] dark:border-[#3E4042] rounded shadow-2xs pointer-events-none">
                /
              </kbd>
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
                className="w-10 h-10 flex items-center justify-center text-content-muted hover:text-content hover:bg-surface-muted rounded-xl transition-all cursor-pointer border border-surface-border"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-[#5bd13a]" aria-hidden="true" />
                ) : (
                  <Moon className="w-5 h-5 text-[#69736B]" aria-hidden="true" />
                )}
              </button>
            )}

            {isAuthenticated ? (
              <>
                {/* Bookmark Shortcut */}
                <Link
                  to="/bookmarks"
                  aria-label="Bài viết đã lưu"
                  className="w-10 h-10 hidden md:flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-surface-muted rounded-xl transition-all"
                  title="Bài viết đã lưu"
                >
                  <Bookmark className="w-5 h-5" />
                </Link>

                {/* Notification Dropdown (Desktop & tablet; mobile uses bottom navigation bar) */}
                <div className="hidden sm:block">
                  <NotificationDropdown />
                </div>

                {/* User Menu Dropdown (Grovelyn Image 2 Style) */}
                <UserMenuDropdown
                  user={user}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onLogout={handleLogout}
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
      <div className="flex-1 flex w-full relative z-10">
        {/* Left Slim Dock Sidebar */}
        <SidebarDock
          isAuthenticated={isAuthenticated}
          user={user}
        />

        {/* Content Outlet (Grovelyn Standard: max-w-7xl px-4 sm:px-6) */}
        <main id="noi-dung" className="flex-1 w-full max-w-7xl mx-auto px-4 pb-24 pt-6 sm:px-6 md:pb-12 animate-fade-in">
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
