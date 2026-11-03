import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Bookmark,
  Bell,
  PlusCircle,
  Shield,
  User,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ', icon: Home, exact: true },
  { to: '/bookmarks', label: 'Đã lưu', icon: Bookmark, authRequired: true },
  { to: '/notifications', label: 'Thông báo', icon: Bell, authRequired: true },
  { to: '/posts/create', label: 'Đăng bài', icon: PlusCircle, authRequired: true },
]

export default function SidebarDock({ isAuthenticated, user }) {
  const location = useLocation()

  const isCurrent = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className="hidden md:flex flex-col justify-between w-24 py-4 items-center h-[calc(100vh-4rem)] sticky top-16 bg-[#F2F4EF] dark:bg-[#18191A] border-r border-[#E2E7DE] dark:border-[#3E4042] transition-colors duration-200 select-none z-30"
      aria-label="Thanh điều hướng nhanh"
    >
      {/* Top Section: Main Nav Icons */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const active = isCurrent(item.to, item.exact)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1.5 w-20 h-[68px] rounded-2xl border transition-colors duration-150 group relative select-none ${
                active
                  ? 'bg-[#06110a] dark:bg-[#163D29] text-white dark:text-[#2ECC71] border-transparent dark:border-[#163D29] shadow-2xs'
                  : 'border-transparent text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-[#E4E6EB] hover:bg-white dark:hover:bg-[#303132]'
              }`}
              title={item.label}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  active ? 'text-[#5bd13a] dark:text-[#2ECC71] stroke-[2.5]' : 'transition-colors'
                }`}
              />
              <span className="text-[11px] leading-tight font-semibold tracking-tight">{item.label}</span>
            </Link>
          )
        })}

        {/* Admin Shortcut */}
        {isAuthenticated && user?.role === 'admin' && (
          <Link
            to="/admin"
            className={`flex flex-col items-center justify-center gap-1.5 w-20 h-[68px] rounded-2xl border transition-colors duration-150 group relative select-none ${
              isCurrent('/admin')
                ? 'bg-[#06110a] dark:bg-[#163D29] text-white dark:text-[#2ECC71] border-transparent dark:border-[#163D29] shadow-2xs'
                : 'border-transparent text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-[#E4E6EB] hover:bg-white dark:hover:bg-[#303132]'
            }`}
            title="Bảng quản trị"
          >
            <Shield className={`w-5 h-5 shrink-0 ${isCurrent('/admin') ? 'text-[#5bd13a] dark:text-[#2ECC71] stroke-[2.5]' : 'text-amber-500'}`} />
            <span className="text-[11px] leading-tight font-semibold tracking-tight">Quản trị</span>
          </Link>
        )}
      </div>

      {/* Bottom Section: User Profile Avatar Button (Positioned at bottom of dock) */}
      <div className="flex flex-col items-center w-full px-2 pt-2 border-t border-[#E2E7DE] dark:border-[#3E4042]">
        {isAuthenticated ? (
          <Link
            to={`/profile/${user?.id || ''}`}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-transform active:scale-95 ${
              isCurrent('/profile')
                ? 'ring-2 ring-[#16a34a] dark:ring-[#2ECC71] ring-offset-2 ring-offset-[#F2F4EF] dark:ring-offset-[#18191A]'
                : 'hover:ring-2 hover:ring-[#16a34a]/40 dark:hover:ring-[#2ECC71]/40 ring-offset-2 ring-offset-[#F2F4EF] dark:ring-offset-[#18191A]'
            }`}
            title="Hồ sơ cá nhân"
            aria-label="Hồ sơ cá nhân"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'Hồ sơ'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#16a34a] dark:bg-[#2ECC71] text-white dark:text-[#18191A] font-bold text-sm flex items-center justify-center shadow-2xs">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center w-12 h-12 rounded-full border border-dashed border-[#56614f]/40 dark:border-[#3E4042] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#16a34a] dark:hover:text-[#2ECC71] hover:border-[#16a34a] transition-colors"
            title="Hồ sơ cá nhân (Đăng nhập)"
            aria-label="Hồ sơ cá nhân"
          >
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </aside>
  )
}
