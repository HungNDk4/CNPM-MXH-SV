import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function MainLayout() {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authAPI.logout(refreshToken)
    } catch { /* ignore */ }
    logout()
    navigate('/login')
    toast.success('Đăng xuất thành công.')
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 glass border-b border-surface-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0" aria-label="Mini Study Network — Trang chủ">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gradient text-lg hidden sm:inline">Mini Study Network</span>
            <span className="font-bold text-gradient text-sm sm:hidden">MSN</span>
          </Link>

          {/* Search bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-8">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, tài liệu..."
              className="input py-2 text-sm"
            />
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <Link to="/posts/create" aria-label="Đăng bài" className="btn-primary text-sm px-3 sm:px-5 py-2 min-w-10 min-h-10 flex items-center justify-center">
                  <span aria-hidden="true" className="sm:hidden text-lg leading-none">＋</span>
                  <span className="hidden sm:inline">+ Đăng bài</span>
                </Link>
                <Link to={`/profile/${user?.id}`} aria-label="Trang cá nhân" className="flex items-center justify-center min-w-10 min-h-10 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </Link>
                <button type="button" onClick={handleLogout} aria-label="Đăng xuất" className="min-w-10 min-h-10 px-1 sm:px-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
                  <span aria-hidden="true" className="sm:hidden text-xl">↪</span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm px-3 sm:px-5 py-2 min-h-10 flex items-center">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-sm px-3 sm:px-5 py-2 min-h-10 flex items-center">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  )
}
