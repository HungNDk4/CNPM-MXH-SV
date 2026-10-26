import { Outlet, Link } from 'react-router-dom'
import { GraduationCap, Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4">
      <div className="flex justify-end p-2 max-w-md w-full mx-auto">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-surface-card border border-surface-border hover:bg-surface-muted transition-colors shadow-xs"
          title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-sm text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight">Mini Study Network</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Mạng học tập sinh viên</p>
            </div>
          </Link>
        </div>

        {/* Auth card */}
        <div className="card shadow-sm animate-slide-up">
          <Outlet />
        </div>
      </div>

      <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
        © 2026 Mini Study Network. Tất cả quyền được bảo lưu.
      </div>
    </div>
  )
}
