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
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-gradient text-lg">Mini Study Network</span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, tài liệu..."
              className="input py-2 text-sm"
            />
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/posts/create" className="btn-primary text-sm py-2">
                  + Đăng bài
                </Link>
                <Link to={`/profile/${user?.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </Link>
                <button onClick={handleLogout} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-secondary text-sm py-2">Đăng nhập</Link>
                <Link to="/register" className="btn-primary text-sm py-2">Đăng ký</Link>
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
