import { Outlet, Link } from 'react-router-dom'
import {
  GraduationCap,
  Sun,
  Moon,
  Users,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row relative">
      {/* ── CỘT TRÁI: SHOWCASE ĐỒ HỌA MẠNG XÃ HỘI HỌC TẬP (SPLIT SCREEN 50%) ── */}
      <div className="hidden md:flex md:w-1/2 xl:w-[50%] flex-col justify-between p-8 lg:p-12 xl:p-14 bg-gradient-to-br from-slate-950 via-[#0d1e13] to-[#07140c] text-white relative overflow-hidden select-none">
        {/* Ambient Glows */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand & Back to feed */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight block">
                Mini Study Network
              </span>
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

        {/* Center Showcase Content */}
        <div className="space-y-6 my-auto py-8 relative z-10 max-w-xl">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-snug">
              Nơi dự án và tri thức của bạn lớn lên.
            </h1>
            <p className="text-slate-300 text-sm xl:text-base leading-relaxed">
              Mạng xã hội học tập kết nối hàng nghìn sinh viên: cùng làm đồ án, giải đáp thắc mắc bài tập và chia sẻ tài liệu PDF ôn thi hoàn toàn miễn phí.
            </p>
          </div>

          {/* Bento Highlights */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-300">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Kho tài liệu PDF</h4>
              <p className="text-[11px] text-slate-400 leading-tight">
                Slide môn học, đề cương và đồ án mẫu đã kiểm duyệt.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Cộng đồng sinh viên</h4>
              <p className="text-[11px] text-slate-400 leading-tight">
                Kết nối sinh viên ĐHBK, UIT, ĐHKHTN, HUST và các trường trên toàn quốc.
              </p>
            </div>
          </div>

          {/* Testimonial Quote */}
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

      {/* ── CỘT PHẢI: FORM CHỨA NÚT VÀ CÁC TRƯỜNG NẰM TRONG 1 BENTO CARD (CHO CẢ LOGIN & REGISTER) ── */}
      <div className="w-full md:w-1/2 xl:w-[50%] flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-y-auto bg-surface">
        {/* Top Header Mobile Brand + Theme switch */}
        <div className="flex items-center justify-between w-full max-w-lg mx-auto">
          <Link to="/" className="md:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white">
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

        {/* Center Container: NẰM TRONG 1 CARD FORM ĐỒNG BỘ CHO CẢ LOGIN & REGISTER */}
        <div className="w-full max-w-lg mx-auto my-auto py-6">
          <div className="card shadow-xl shadow-slate-900/5 dark:shadow-black/40 border border-surface-border rounded-3xl p-6 sm:p-8 bg-surface-card">
            <Outlet />
          </div>
        </div>

        {/* Bottom copyright footer */}
        <div className="w-full max-w-lg mx-auto text-center py-2 text-xs text-slate-400 dark:text-slate-500">
          Mạng xã hội học tập phi thương mại dành cho sinh viên.
        </div>
      </div>
    </div>
  )
}
