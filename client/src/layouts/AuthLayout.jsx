import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  GraduationCap,
  Sun,
  Moon,
  Sparkles,
  Users,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore()
  const location = useLocation()
  const isLogin = location.pathname.includes('/login')

  // ═════════════════════════════════════════════════════════════════
  // 1. TRANG ĐĂNG NHẬP: CHIA 2 NỬA (SPLIT SCREEN SHOWCASE + FORM TRÀN CHÌM VÀO NỀN)
  // ═════════════════════════════════════════════════════════════════
  if (isLogin) {
    return (
      <div className="min-h-screen bg-surface flex flex-col md:flex-row relative">
        {/* CỘT TRÁI: SHOWCASE ĐỒ HỌA MẠNG XÃ HỘI HỌC TẬP (NỬA MÀN HÌNH) */}
        <div className="hidden md:flex md:w-1/2 xl:w-[52%] flex-col justify-between p-8 lg:p-12 xl:p-14 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden select-none">
          {/* Ambient Glows */}
          <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Back to feed */}
          <div className="flex items-center justify-between relative z-10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-primary/25 text-white transition-transform group-hover:scale-105 duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-white text-lg tracking-tight block">
                  Mini Study Network
                </span>
                <span className="text-slate-400 text-xs">Mạng xã hội sinh viên</span>
              </div>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 transition-colors border border-white/10"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem bảng tin</span>
            </Link>
          </div>

          {/* Center Showcase */}
          <div className="space-y-8 my-auto py-10 relative z-10 max-w-xl">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Campus Pop Edition 2026</span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-snug">
                Nơi dự án và tri thức của bạn lớn lên.
              </h1>
              <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
                Mạng xã hội học tập kết nối hàng nghìn sinh viên: cùng làm đồ án, giải đáp thắc mắc bài tập và chia sẻ tài liệu PDF ôn thi hoàn toàn miễn phí.
              </p>
            </div>

            {/* Bento Highlights */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-300">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Kho tài liệu PDF</h4>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Slide môn học, đề cương và đồ án mẫu đã kiểm duyệt.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Cộng đồng sinh viên</h4>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Kết nối sinh viên ĐHBK, UIT, ĐHKHTN, HUST và các trường trên toàn quốc.
                </p>
              </div>
            </div>

            {/* Testimonial */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-white/10 to-transparent border-l-4 border-emerald-400 backdrop-blur-sm">
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "Nền tảng giúp mình tìm được tài liệu môn Công nghệ Phần mềm và kết nối được với nhiều bạn cùng chí hướng."
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded-full bg-primary-600 text-[10px] font-bold flex items-center justify-center text-white">
                  H
                </div>
                <span className="text-xs font-bold text-white">Nguyễn Hùng</span>
                <span className="text-[11px] text-slate-400">• UIT</span>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 relative z-10 pt-4 border-t border-white/10">
            <span>© 2026 Mini Study Network</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Hệ thống bảo mật
              </span>
              <span>Học thuật miễn phí</span>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM ĐĂNG NHẬP TRÀN CHÌM TRỰC TIẾP VÀO NỀN (KHÔNG CARD HỘP NỔI, KHÔNG DƯ CHỮ) */}
        <div className="w-full md:w-1/2 xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-y-auto bg-surface">
          {/* Top Bar: Mobile Logo + Theme toggle */}
          <div className="flex items-center justify-between w-full max-w-md mx-auto">
            <Link to="/" className="md:hidden flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                Mini Study Network
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-surface-card border border-surface-border hover:bg-surface-muted transition-colors shadow-2xs cursor-pointer ml-auto"
              title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>

          {/* Form Container: CHÌM TRỰC TIẾP VÀO NỀN (KHÔNG CARD NỔI, KHÔNG SHADOW HỘP) */}
          <div className="w-full max-w-md mx-auto my-auto py-8 animate-fade-in">
            <Outlet />
          </div>

          {/* Footer */}
          <div className="w-full max-w-md mx-auto text-center py-2 text-xs text-slate-400 dark:text-slate-500">
            Mạng xã hội học tập phi thương mại dành cho sinh viên.
          </div>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. TRANG ĐĂNG KÝ: FORM CŨ (CĂN GIỮA MÀN HÌNH, CARD BENTO TẬP TRUNG)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Campus Glow blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top action bar */}
      <div className="flex justify-between items-center p-2 max-w-lg w-full mx-auto relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 border border-primary-200/50">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mạng xã hội sinh viên 2026</span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-surface-card border border-surface-border hover:bg-surface-muted transition-colors shadow-2xs cursor-pointer"
          title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Center Auth Container (Form cũ căn giữa màn hình) */}
      <div className="w-full max-w-lg mx-auto my-auto relative z-10 py-6">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-primary/25 text-white transition-transform group-hover:scale-105 duration-200">
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
        <div className="card shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-surface-border rounded-3xl p-6 sm:p-8 backdrop-blur-sm animate-slide-up bg-surface-card">
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
