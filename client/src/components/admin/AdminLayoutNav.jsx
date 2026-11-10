import { Link, useLocation } from 'react-router-dom'
import {
  Shield,
  LayoutDashboard,
  FileText,
  BarChart3,
  ClipboardList,
} from 'lucide-react'

const TABS = [
  {
    to: '/admin',
    exact: true,
    label: 'Tổng quan & Xu hướng',
    icon: LayoutDashboard,
    desc: 'Chỉ số hệ thống & biểu đồ hoạt động',
  },
  {
    to: '/admin/posts',
    exact: false,
    label: 'Quản lý bài viết',
    icon: FileText,
    desc: 'Lọc, kiểm duyệt ẩn/xóa nội dung',
  },
  {
    to: '/admin/analytics',
    exact: false,
    label: 'Phân tích tương tác',
    icon: BarChart3,
    desc: 'Xếp hạng bài viết & hiệu suất',
  },
  {
    to: '/admin/audit-logs',
    exact: false,
    label: 'Nhật ký kiểm duyệt',
    icon: ClipboardList,
    desc: 'Lịch sử thao tác quản trị viên',
  },
]

export default function AdminLayoutNav({ title, subtitle }) {
  const location = useLocation()

  const isCurrent = (tab) => {
    if (tab.to === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/overview'
    }
    return location.pathname.startsWith(tab.to)
  }

  return (
    <div className="space-y-6">
      {/* ── Admin Header Banner (Campus Pop Theme) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 border border-emerald-500/20 p-6 md:p-8 backdrop-blur-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>Không gian Quản trị viên</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white">
              {title || 'Quản trị nội dung & Số liệu mạng xã hội'}
            </h1>
            <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] max-w-2xl leading-relaxed">
              {subtitle || 'Kiểm soát tính an toàn, minh bạch dữ liệu và phân tích mức độ tương tác học thuật.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center bg-white dark:bg-[#242526] px-4 py-2 rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] dark:bg-[#22c55e] animate-pulse" />
            <span className="text-xs font-semibold text-[#06110a] dark:text-white">
              Quyền quản trị toàn quyền
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E2E7DE] dark:border-[#3E4042] text-xs font-bold scrollbar-none">
        {TABS.map((tab) => {
          const active = isCurrent(tab)
          const Icon = tab.icon

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                active
                  ? 'bg-[#16a34a] text-white dark:bg-[#2ECC71] dark:text-[#18191A] shadow-xs'
                  : 'bg-white dark:bg-[#242526] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white border border-[#E2E7DE] dark:border-[#3E4042]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

