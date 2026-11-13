import { Link, useLocation } from 'react-router-dom'
import { Home, Bookmark, Bell, PlusCircle, LogIn } from 'lucide-react'

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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F0F5EF] dark:bg-[#17231F] border-t border-[#DCE5DC] dark:border-[#2C3B35] h-16 flex items-stretch shadow-sm transition-colors select-none"
      aria-label="Điều hướng dưới màn hình"
    >
      {/* 1. Trang chủ */}
      <Link
        to="/"
        className={`relative flex flex-col items-center justify-center gap-1 transition-colors h-full flex-1 pt-1 ${
          isCurrent('/')
            ? 'text-[#123D35] dark:text-[#4ADE80] font-bold'
            : 'text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white'
        }`}
        title="Trang chủ"
        aria-label="Trang chủ"
      >
        <span className="relative flex h-6 items-center justify-center">
          <Home className={`w-5 h-5 stroke-[2.2] ${isCurrent('/') ? 'text-[#16A34A] dark:text-[#4ADE80]' : ''}`} />
        </span>
        <span className="text-[11px] leading-none">Trang chủ</span>
        {isCurrent('/') && (
          <span className="absolute bg-[#16A34A] dark:bg-[#4ADE80] inset-x-4 top-0 h-[3px] rounded-b-full transition-all" />
        )}
      </Link>

      {/* 2. Đã lưu */}
      <Link
        to="/bookmarks"
        className={`relative flex flex-col items-center justify-center gap-1 transition-colors h-full flex-1 pt-1 ${
          isCurrent('/bookmarks')
            ? 'text-[#123D35] dark:text-[#4ADE80] font-bold'
            : 'text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white'
        }`}
        title="Đã lưu"
        aria-label="Đã lưu"
      >
        <span className="relative flex h-6 items-center justify-center">
          <Bookmark className={`w-5 h-5 stroke-[2.2] ${isCurrent('/bookmarks') ? 'text-[#16A34A] dark:text-[#4ADE80]' : ''}`} />
        </span>
        <span className="text-[11px] leading-none">Đã lưu</span>
        {isCurrent('/bookmarks') && (
          <span className="absolute bg-[#16A34A] dark:bg-[#4ADE80] inset-x-4 top-0 h-[3px] rounded-b-full transition-all" />
        )}
      </Link>

      {/* 3. Nút Đăng bài */}
      <Link
        to="/posts/create"
        className={`relative flex flex-col items-center justify-center gap-1 transition-colors h-full flex-1 pt-1 ${
          isCurrent('/posts/create')
            ? 'text-[#123D35] dark:text-[#4ADE80] font-bold'
            : 'text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white'
        }`}
        title="Đăng bài"
        aria-label="Đăng bài mới"
      >
        <span className="relative flex h-6 items-center justify-center">
          <PlusCircle className={`w-[26px] h-[26px] stroke-[2.2] ${isCurrent('/posts/create') ? 'text-[#16A34A] dark:text-[#4ADE80]' : ''}`} />
        </span>
        <span className="text-[11px] leading-none">Đăng bài</span>
        {isCurrent('/posts/create') && (
          <span className="absolute bg-[#16A34A] dark:bg-[#4ADE80] inset-x-4 top-0 h-[3px] rounded-b-full transition-all" />
        )}
      </Link>

      {/* 4. Thông báo */}
      <Link
        to="/notifications"
        className={`relative flex flex-col items-center justify-center gap-1 transition-colors h-full flex-1 pt-1 ${
          isCurrent('/notifications')
            ? 'text-[#123D35] dark:text-[#4ADE80] font-bold'
            : 'text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white'
        }`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <span className="relative flex h-6 items-center justify-center">
          <Bell className={`w-5 h-5 stroke-[2.2] ${isCurrent('/notifications') ? 'text-[#16A34A] dark:text-[#4ADE80]' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#F0F5EF] dark:ring-[#17231F]" />
          )}
        </span>
        <span className="text-[11px] leading-none">Thông báo</span>
        {isCurrent('/notifications') && (
          <span className="absolute bg-[#16A34A] dark:bg-[#4ADE80] inset-x-4 top-0 h-[3px] rounded-b-full transition-all" />
        )}
      </Link>

      {/* 5. Hồ sơ cá nhân / Đăng nhập */}
      {isAuthenticated ? (
        <Link
          to={`/profile/${user?.id}`}
          className={`relative flex flex-col items-center justify-center gap-1 transition-colors h-full flex-1 pt-1 ${
            isCurrent(`/profile/${user?.id}`)
              ? 'text-[#123D35] dark:text-[#4ADE80] font-bold'
              : 'text-[#52675A] dark:text-[#A8B9AF] hover:text-[#123D35] dark:hover:text-white'
          }`}
          title="Hồ sơ cá nhân"
          aria-label="Hồ sơ cá nhân"
        >
          <span className="relative flex h-6 items-center justify-center">
            <div
              className={`w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold ${
                isCurrent(`/profile/${user?.id}`)
                  ? 'ring-1.5 ring-[#16A34A] dark:ring-[#4ADE80]'
                  : 'bg-[#DCE5DC] dark:bg-[#2C3B35] text-[#123D35] dark:text-[#E2E8F0]'
              }`}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </span>
          <span className="text-[11px] leading-none">Tôi</span>
          {isCurrent(`/profile/${user?.id}`) && (
            <span className="absolute bg-[#16A34A] dark:bg-[#4ADE80] inset-x-4 top-0 h-[3px] rounded-b-full transition-all" />
          )}
        </Link>
      ) : (
        <Link
          to="/login"
          className="relative flex flex-col items-center justify-center gap-1 transition-colors h-full flex-1 pt-1 text-[#52675A] dark:text-[#A8B9AF] hover:text-[#16A34A] dark:hover:text-[#4ADE80]"
          title="Đăng nhập"
          aria-label="Đăng nhập"
        >
          <span className="relative flex h-6 items-center justify-center">
            <LogIn className="w-5 h-5 stroke-[2.2]" />
          </span>
          <span className="text-[11px] leading-none">Đăng nhập</span>
        </Link>
      )}
    </nav>
  )
}
