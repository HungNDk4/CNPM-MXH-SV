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
  Search,
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
    let timer = null

    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getUnreadCount()
        if (isMounted) setUnreadCount(res.data?.data?.count || 0)
      } catch (err) {
        // If 401 Unauthorized occurs, stop further polling to avoid console spam
        if (err.response?.status === 401) {
          if (timer) clearInterval(timer)
        }
      }
    }

    fetchUnread()
    timer = setInterval(fetchUnread, 30000)
    return () => {
      isMounted = false
      if (timer) clearInterval(timer)
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
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#17231F]/95 backdrop-blur-md border-b border-[#DCE5DC] dark:border-[#2C3B35] transition-colors duration-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] rounded-xl"
            title="OwlMate"
          >
            <BrandLogo size={38} showText={true} textClassName="hidden sm:flex" />
          </Link>

          {/* Search Bar - Responsive, never squished on mobile */}
          <form
            onSubmit={handleSearchSubmit}
            className={`flex-1 min-w-0 max-w-lg relative mx-1.5 sm:mx-3 ${isAuthenticated ? 'block' : 'hidden sm:block'}`}
            role="search"
          >
            <input
              id="global-search-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full bg-[#F0F5EF] dark:bg-[#1E2E28] border border-[#DCE5DC] dark:border-[#2C3B35] text-[#123D35] dark:text-[#E2E8F0] placeholder-[#52675A] dark:placeholder-[#A8B9AF] rounded-xl sm:rounded-2xl pl-8 sm:pl-10 pr-7 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm focus:bg-white dark:focus:bg-[#17231F] focus:border-[#16A34A] dark:focus:border-[#4ADE80] focus:ring-2 focus:ring-[#16A34A]/20 dark:focus:ring-[#4ADE80]/20 outline-none transition-all shadow-2xs font-medium"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#52675A] dark:text-[#A8B9AF] absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchInput ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[#52675A] hover:text-[#123D35] dark:text-[#A8B9AF] dark:hover:text-white p-0.5"
                aria-label="Xóa từ khóa"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-[20px] px-1 text-[11px] font-bold text-[#52675A] dark:text-[#A8B9AF] bg-white dark:bg-[#17231F] border border-[#DCE5DC] dark:border-[#2C3B35] rounded-md shadow-2xs pointer-events-none">
                /
              </kbd>
            )}
          </form>

          {/* Right Action Bar: Clustered Control Group */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-[#F0F5EF] dark:bg-[#1E2E28] border border-[#DCE5DC] dark:border-[#2C3B35] shadow-2xs">
                {/* 1. Bookmark shortcut */}
                <Link
                  to="/bookmarks"
                  aria-label="Bài viết đã lưu"
                  className="w-9 h-9 hidden md:flex items-center justify-center text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white hover:bg-white dark:hover:bg-[#17231F] rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] cursor-pointer"
                  title="Bài viết đã lưu"
                >
                  <Bookmark className="w-4.5 h-4.5" />
                </Link>

                {/* 2. Notification Dropdown */}
                <div className="hidden sm:block">
                  <NotificationDropdown />
                </div>

                {/* 3. Clustered Divider */}
                <div className="hidden sm:block w-px h-5 bg-[#DCE5DC] dark:bg-[#2C3B35] my-auto mx-0.5" aria-hidden="true" />

                {/* 4. User Menu Dropdown */}
                <UserMenuDropdown
                  user={user}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  onLogout={handleLogout}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Theme Toggle Button for Guests (visible on tablet/desktop; on mobile guest uses login/register) */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                  title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                  className="w-9 h-9 hidden sm:flex items-center justify-center text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white hover:bg-[#F0F5EF] dark:hover:bg-[#1E2E28] rounded-xl transition-all cursor-pointer border border-[#DCE5DC] dark:border-[#2C3B35]"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4.5 h-4.5 text-[#FFD45C]" aria-hidden="true" />
                  ) : (
                    <Moon className="w-4.5 h-4.5 text-[#52675A]" aria-hidden="true" />
                  )}
                </button>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-bold text-[#123D35] dark:text-[#E2E8F0] hover:text-[#16A34A] dark:hover:text-[#4ADE80] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold text-white bg-[#16A34A] hover:bg-[#15803d] dark:bg-[#2ECC71] dark:hover:bg-[#27ae60] dark:text-[#18191A] shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
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
