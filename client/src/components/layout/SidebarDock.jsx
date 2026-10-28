import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Bookmark,
  Bell,
  PlusCircle,
  Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Trang chủ', icon: Home, exact: true },
  { to: '/bookmarks', label: 'Đã lưu', icon: Bookmark, authRequired: true },
  { to: '/notifications', label: 'Thông báo', icon: Bell, authRequired: true },
  { to: '/posts/create', label: 'Đăng bài', icon: PlusCircle, authRequired: true },
]

const SHORTCUT_SUBJECTS = [
  { label: 'CNPM', query: 'Công nghệ phần mềm', color: 'from-blue-600 to-sky-600', full: 'Công nghệ phần mềm' },
  { label: 'CSDL', query: 'Cơ sở dữ liệu', color: 'from-teal-500 to-emerald-600', full: 'Cơ sở dữ liệu' },
  { label: 'OOP',  query: 'Lập trình', color: 'from-sky-500 to-cyan-600', full: 'Lập trình OOP' },
  { label: 'KTMT', query: 'Kiến trúc máy tính', color: 'from-amber-500 to-orange-600', full: 'Kiến trúc máy tính' },
]

export default function SidebarDock({ isAuthenticated, user }) {
  const location = useLocation()

  const isCurrent = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <aside
      className="hidden md:flex flex-col justify-between w-20 py-4 items-center h-[calc(100vh-4rem)] sticky top-16 bg-surface-card/60 backdrop-blur-md border-r border-surface-border/60 transition-colors duration-200 select-none z-30"
      aria-label="Thanh điều hướng nhanh"
    >
      {/* Top Main Nav Icons */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {NAV_ITEMS.map((item) => {
          if (item.authRequired && !isAuthenticated) return null
          const active = isCurrent(item.to, item.exact)
          const Icon = item.icon

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group relative ${
                active
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 shadow-2xs font-bold border border-primary-200/50 dark:border-primary-800/40'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] leading-tight tracking-tight">{item.label}</span>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary-600 rounded-r-full" />
              )}
            </Link>
          )
        })}

        {/* Admin Shortcut */}
        {isAuthenticated && user?.role === 'admin' && (
          <Link
            to="/admin/audit-logs"
            className={`flex flex-col items-center gap-1 w-16 py-2.5 rounded-2xl transition-all duration-200 group ${
              isCurrent('/admin/audit-logs')
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted font-medium'
            }`}
            title="Quản trị kiểm duyệt"
          >
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] leading-tight tracking-tight">Quản trị</span>
          </Link>
        )}

        {/* Divider */}
        <div className="w-8 h-[1px] bg-surface-border my-1" />

        {/* Subject Shortcuts */}
        <div className="flex flex-col items-center gap-2">
          {SHORTCUT_SUBJECTS.map((sub) => (
            <Link
              key={sub.label}
              to={`/?subject=${encodeURIComponent(sub.query || sub.label)}`}
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${sub.color} text-white font-mono text-[11px] font-bold flex items-center justify-center shadow-2xs hover:scale-110 hover:shadow-md transition-all duration-200`}
              title={`Lọc môn học ${sub.full || sub.label}`}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
