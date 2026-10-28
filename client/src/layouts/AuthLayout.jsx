import { Outlet, Link } from 'react-router-dom'
import { GraduationCap, Sun, Moon, Sparkles } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 relative overflow-hidden">
      {/* Background Campus Glow blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar */}
      <div className="flex justify-between items-center p-2 max-w-md w-full mx-auto relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          Mạng xã hội sinh viên 2026
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-surface-card border border-surface-border hover:bg-surface-muted transition-colors shadow-2xs"
          title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Center Auth Container */}
      <div className="w-full max-w-md mx-auto my-auto relative z-10 py-6">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 text-white transition-transform group-hover:scale-105 duration-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center gap-1.5">
                Mini Study Network
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Học tập • Thảo luận • Chia sẻ tài liệu</p>
            </div>
          </Link>
        </div>

        {/* Auth Bento card */}
        <div className="card shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-surface-border rounded-3xl p-6 sm:p-8 backdrop-blur-sm animate-slide-up">
          <Outlet />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500 relative z-10">
        © 2026 Mini Study Network — Campus Pop Edition.
      </div>
    </div>
  )
}
