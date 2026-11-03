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
      className="hidden md:flex flex-col justify-between w-24 py-4 items-center h-[calc(100vh-4rem)] sticky top-16 bg-[#F0F5EF] dark:bg-[#17231F] border-r border-[#DCE5DC] dark:border-[#2C3B35] transition-colors duration-200 select-none z-30"
      aria-label="Thanh điều hướng nhanh OwlMate"
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
              className={`flex flex-col items-center justify-center gap-1.5 w-20 h-[68px] rounded-2xl border transition-all duration-200 group relative select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0F5EF] dark:focus-visible:ring-offset-[#17231F] ${
                active
                  ? 'bg-[#123D35] dark:bg-[#244B3C] text-white border-[#123D35] dark:border-[#244B3C] shadow-sm'
                  : 'border-transparent text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1F302A] hover:border-[#DCE5DC]/60 dark:hover:border-[#2C3B35]'
              }`}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Bookmark-inspired geometric active ribbon indicator */}
              {active && (
                <span
                  className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-[#16A34A] dark:bg-[#4ADE80] shadow-xs"
                  aria-hidden="true"
                />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 duration-150 ${
                  active ? 'text-[#4ADE80] stroke-[2.4]' : 'stroke-[2]'
                }`}
                aria-hidden="true"
              />
              <span className={`text-[11px] leading-tight font-bold tracking-tight ${active ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Admin Shortcut */}
        {isAuthenticated && user?.role === 'admin' && (
          <Link
            to="/admin"
            className={`flex flex-col items-center justify-center gap-1.5 w-20 h-[68px] rounded-2xl border transition-all duration-200 group relative select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F0F5EF] dark:focus-visible:ring-offset-[#17231F] ${
              isCurrent('/admin')
                ? 'bg-[#123D35] dark:bg-[#244B3C] text-white border-[#123D35] dark:border-[#244B3C] shadow-sm'
                : 'border-transparent text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white hover:bg-white/80 dark:hover:bg-[#1F302A] hover:border-[#DCE5DC]/60 dark:hover:border-[#2C3B35]'
            }`}
            title="Bảng quản trị hệ thống"
            aria-label="Bảng quản trị"
            aria-current={isCurrent('/admin') ? 'page' : undefined}
          >
            {isCurrent('/admin') && (
              <span
                className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full bg-[#16A34A] dark:bg-[#4ADE80] shadow-xs"
                aria-hidden="true"
              />
            )}
            <Shield
              className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 duration-150 ${
                isCurrent('/admin') ? 'text-[#4ADE80] stroke-[2.4]' : 'text-amber-500 stroke-[2]'
              }`}
              aria-hidden="true"
            />
            <span className="text-[11px] leading-tight font-bold tracking-tight">Quản trị</span>
          </Link>
        )}
      </div>

      {/* Bottom Section: User Profile Avatar */}
      <div className="flex flex-col items-center w-full px-2 pt-3 pb-1 border-t border-[#DCE5DC] dark:border-[#2C3B35]">
        {isAuthenticated ? (
          <Link
            to={`/profile/${user?.id || ''}`}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] dark:focus-visible:ring-[#4ADE80] ${
              isCurrent('/profile')
                ? 'ring-2 ring-[#16A34A] dark:ring-[#4ADE80] ring-offset-2 ring-offset-[#F0F5EF] dark:ring-offset-[#17231F]'
                : 'hover:ring-2 hover:ring-[#16A34A]/50 dark:hover:ring-[#4ADE80]/50 ring-offset-2 ring-offset-[#F0F5EF] dark:ring-offset-[#17231F]'
            }`}
            title={`Hồ sơ cá nhân: ${user?.full_name || 'Thành viên'}`}
            aria-label="Hồ sơ cá nhân"
            aria-current={isCurrent('/profile') ? 'page' : undefined}
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || 'Hồ sơ'}
                className="w-full h-full rounded-full object-cover shadow-2xs"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#123D35] dark:bg-[#244B3C] text-white dark:text-[#4ADE80] font-bold text-sm flex items-center justify-center shadow-2xs">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {/* Avatar without artificial online status */}
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center w-11 h-11 rounded-2xl border border-dashed border-[#52675A]/50 dark:border-[#A8B9AF]/40 text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white hover:border-[#16A34A] dark:hover:border-[#4ADE80] hover:bg-white dark:hover:bg-[#1F302A] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
            title="Đăng nhập tài khoản"
            aria-label="Đăng nhập tài khoản"
          >
            <User className="w-5 h-5" />
          </Link>
        )}
      </div>
    </aside>
  )
}
