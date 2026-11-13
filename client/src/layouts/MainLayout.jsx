import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { notificationAPI, authAPI, postAPI } from '@/services/api'
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
  FileText,
  HelpCircle,
  MessageSquare,
  ArrowRight,
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchContainerRef = useRef(null)

  // Auto scroll to top on any route / search query change (except specific hash anchor)
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname, location.search])
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 250)
    return () => clearTimeout(handler)
  }, [searchInput])

  // Click outside to dismiss quick search preview
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Quick search preview query
  const { data: searchPreviewData = [], isLoading: isSearchPreviewLoading } = useQuery({
    queryKey: ['quick-search-preview', debouncedSearch],
    queryFn: async () => {
      const res = await postAPI.getAll({ search: debouncedSearch, limit: 5 })
      return res.data?.data || []
    },
    enabled: Boolean(debouncedSearch && debouncedSearch.length >= 2),
    staleTime: 30000,
    retry: false,
  })

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
    setIsSearchOpen(false)
    const term = searchInput.trim()
    if (location.pathname === '/search') {
      if (term) {
        navigate(`/search?search=${encodeURIComponent(term)}`)
      } else {
        navigate('/search')
      }
    } else {
      // Retain homepage search path contract (?search=...) for Playwright fe66-p3 e2e test
      if (term) {
        navigate(`/?search=${encodeURIComponent(term)}`)
      } else {
        navigate('/')
      }
    }
  }

  const handleViewAllResults = () => {
    setIsSearchOpen(false)
    const term = (debouncedSearch || searchInput).trim()
    if (term) {
      navigate(`/search?search=${encodeURIComponent(term)}`)
    } else {
      navigate('/search')
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setIsSearchOpen(false)
    navigate('/')
  }

  const handleSelectPreviewItem = (item) => {
    setIsSearchOpen(false)
    if (item.post_type === 'document') {
      navigate(`/documents/${item.id}`)
    } else {
      navigate(`/posts/${item.id}`)
    }
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

          {/* Search Bar - Responsive, Quick Preview Dropdown & Clickable / Shortcut */}
          <div
            ref={searchContainerRef}
            className={`flex-1 min-w-0 max-w-lg relative mx-1.5 sm:mx-3 ${isAuthenticated ? 'block' : 'hidden sm:block'}`}
          >
            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full"
              role="search"
            >
              <input
                id="global-search-input"
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setIsSearchOpen(true)
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsSearchOpen(false)
                }}
                autoComplete="off"
                placeholder="Tìm kiếm..."
                className="w-full bg-[#F0F5EF] dark:bg-[#1E2E28] border border-[#DCE5DC] dark:border-[#2C3B35] text-[#123D35] dark:text-[#E2E8F0] placeholder-[#52675A] dark:placeholder-[#A8B9AF] rounded-xl sm:rounded-2xl pl-8 sm:pl-10 pr-7 sm:pr-10 py-1.5 sm:py-2 text-xs sm:text-sm focus:bg-white dark:focus:bg-[#17231F] focus:border-[#16A34A] dark:focus:border-[#4ADE80] focus:ring-2 focus:ring-[#16A34A]/20 dark:focus:ring-[#4ADE80]/20 outline-none transition-all shadow-2xs font-medium"
              />
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#52675A] dark:text-[#A8B9AF] absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchInput ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[#52675A] hover:text-[#123D35] dark:text-[#A8B9AF] dark:hover:text-white p-0.5 cursor-pointer"
                  aria-label="Xóa từ khóa"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <kbd
                  onClick={() => document.getElementById('global-search-input')?.focus()}
                  title="Nhấn phím / trên bàn phím để tìm nhanh"
                  aria-label="Phím tắt tìm kiếm"
                  className="hidden sm:inline-flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-[20px] px-1 text-[11px] font-bold text-[#52675A] dark:text-[#A8B9AF] bg-white dark:bg-[#17231F] hover:bg-[#F0F5EF] dark:hover:bg-[#1E2E28] hover:border-[#16A34A] dark:hover:border-[#4ADE80] border border-[#DCE5DC] dark:border-[#2C3B35] rounded-md shadow-2xs cursor-pointer transition-colors"
                >
                  /
                </kbd>
              )}
            </form>

            {/* Quick Search Preview Floating Panel */}
            {isSearchOpen && debouncedSearch.length >= 2 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#17231F] border border-[#DCE5DC] dark:border-[#2C3B35] rounded-2xl shadow-xl shadow-emerald-950/10 dark:shadow-black/50 z-50 overflow-hidden animate-slide-up">
                <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-[#52675A] dark:text-[#A8B9AF] border-b border-[#DCE5DC]/80 dark:border-[#2C3B35]/80 flex items-center justify-between bg-[#F0F5EF]/60 dark:bg-[#1E2E28]/60">
                  <span>Gợi ý tìm kiếm nhanh</span>
                  {isSearchPreviewLoading && <span className="text-[10px] lowercase font-normal">Đang tìm kiếm...</span>}
                </div>

                {searchPreviewData.length > 0 ? (
                  <div className="divide-y divide-[#DCE5DC]/50 dark:divide-[#2C3B35]/50 max-h-72 overflow-y-auto">
                    {searchPreviewData.map((item) => {
                      const Icon = item.post_type === 'document' ? FileText : item.post_type === 'question' ? HelpCircle : MessageSquare
                      const typeBadgeColor = item.post_type === 'document' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : item.post_type === 'question' ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' : 'text-purple-600 bg-purple-50 dark:bg-purple-950/40'
                      const typeLabel = item.post_type === 'document' ? 'Tài liệu' : item.post_type === 'question' ? 'Hỏi đáp' : 'Thảo luận'

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectPreviewItem(item)}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-[#F0F5EF] dark:hover:bg-[#1E2E28] transition-colors flex items-start gap-2.5 cursor-pointer group"
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${typeBadgeColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-semibold text-[#123D35] dark:text-white line-clamp-1 group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#52675A] dark:text-[#A8B9AF] mt-0.5">
                              <span className="font-medium text-[#123D35]/80 dark:text-white/80">{item.author?.full_name || 'Thành viên'}</span>
                              {item.subject && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{item.subject}</span>
                                </>
                              )}
                              <span>·</span>
                              <span className="capitalize">{typeLabel}</span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : !isSearchPreviewLoading ? (
                  <div className="px-4 py-6 text-center text-xs text-[#52675A] dark:text-[#A8B9AF]">
                    Không tìm thấy bài viết phù hợp với "{debouncedSearch}". Nhấn Enter để tìm trên toàn bộ hệ thống.
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleViewAllResults}
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-[#16A34A] dark:text-[#4ADE80] hover:bg-[#F0F5EF] dark:hover:bg-[#1E2E28] transition-colors border-t border-[#DCE5DC]/80 dark:border-[#2C3B35]/80 flex items-center justify-between text-left cursor-pointer"
                >
                  <span>Xem trang tìm kiếm chi tiết cho "{debouncedSearch}"</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

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
                  className="w-9 h-9 hidden sm:flex items-center justify-center text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white hover:bg-[#F0F5EF] dark:hover:bg-[#1E2E28] rounded-xl transition-all cursor-pointer border border-[#DCE5DC] dark:border-[#2C3B35] group active:scale-95"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4.5 h-4.5 text-[#FFD45C] group-hover:rotate-90 transition-transform duration-300" aria-hidden="true" />
                  ) : (
                    <Moon className="w-4.5 h-4.5 text-[#52675A] group-hover:-rotate-45 transition-transform duration-300" aria-hidden="true" />
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
        {/* Subtle Brand Identity Gradient Accent Line (OwlMate Signature) */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 opacity-80" />
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
