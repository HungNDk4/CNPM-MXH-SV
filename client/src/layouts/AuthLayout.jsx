import { Outlet, Link } from 'react-router-dom'
import {
  Sun,
  Moon,
  Users,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import BrandLogo from '@/components/common/BrandLogo'

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row relative selection:bg-emerald-500/20">
      {/* ── CỘT TRÁI: SHOWCASE ĐỒ HỌA THƯƠNG HIỆU OWLMATE (SPLIT SCREEN 50%) ── */}
      <div className="hidden md:flex md:w-1/2 xl:w-[48%] flex-col justify-between p-8 lg:p-12 xl:p-14 bg-gradient-to-br from-[#0b241e] via-[#123D35] to-[#081a15] border-r border-[#1a4a40] text-white relative overflow-hidden select-none">
        {/* Glow ambient background orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#45C878]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 bg-[#FFD45C]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand & Back to feed */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
            <BrandLogo size={44} showText={true} textClassName="[&_span]:text-white [&_p]:text-emerald-200/70" />
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/15 backdrop-blur-sm shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Xem bảng tin</span>
          </Link>
        </div>

        {/* Center Showcase Content */}
        <div className="space-y-7 my-auto py-6 relative z-10 max-w-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-emerald-300 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD45C]" />
              <span>Cộng đồng học thuật sinh viên đại học</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-snug">
              Nơi dự án &amp; tri thức <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#45C878] via-[#86efac] to-[#FFD45C]">
                cùng bạn lớn lên.
              </span>
            </h1>
            <p className="text-emerald-100/75 text-sm xl:text-[15px] leading-relaxed">
              Mạng xã hội học tập sinh viên: cùng làm đồ án, giải đáp thắc mắc bài tập và chia sẻ tài liệu PDF ôn thi hoàn toàn miễn phí.
            </p>
          </div>

          {/* Bento Highlights (Academic Features) */}
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#45C878]/40 transition-colors space-y-1.5 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-[#45C878]/20 border border-[#45C878]/40 flex items-center justify-center text-[#45C878]">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Kho tài liệu PDF</h4>
              <p className="text-[11px] text-emerald-100/60 leading-normal">
                Slide môn học, đề cương và mẫu SRS đồ án sinh viên chia sẻ.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#45C878]/40 transition-colors space-y-1.5 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-[#FFD45C]/20 border border-[#FFD45C]/40 flex items-center justify-center text-[#FFD45C]">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">Mạng lưới sinh viên</h4>
              <p className="text-[11px] text-emerald-100/60 leading-normal">
                Kết nối bạn học ĐHBK, UIT, HUST, ĐHKHTN, ĐH CNTT và nhiều trường khác.
              </p>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white/5 border border-white/10 border-l-4 border-l-[#45C878] backdrop-blur-xs space-y-2">
            <div className="flex items-center gap-1 text-amber-300 text-xs">
              {'★'.repeat(5)}
              <span className="text-[11px] text-emerald-200/80 ml-1 font-semibold">5.0 Sinh viên đánh giá</span>
            </div>
            <p className="text-xs text-emerald-50 italic leading-relaxed">
              "Nền tảng giúp mình tìm được tài liệu môn Công nghệ Phần mềm và kết nối được với nhiều bạn cùng làm đồ án môn học."
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-[#21A65B] text-[10px] font-bold flex items-center justify-center text-white ring-1 ring-white/30">
                H
              </div>
              <span className="text-xs font-bold text-white">Nguyễn Hùng</span>
              <span className="text-[11px] text-emerald-200/60">• Sinh viên UIT</span>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="flex items-center justify-between text-xs text-emerald-200/60 relative z-10 pt-4 border-t border-white/10">
          <span>© 2026 OwlMate</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#45C878] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Hệ thống an toàn
            </span>
            <span>Học thuật phi thương mại</span>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: FORM CARD CHỨA NỘI DUNG LOGIN / REGISTER ── */}
      <div className="w-full md:w-1/2 xl:w-[52%] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-y-auto bg-surface min-h-screen">
        {/* Top Header Mobile Brand + Theme switch */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto pt-1 sm:pt-0">
          <Link to="/" className="md:hidden flex items-center gap-2">
            <BrandLogo size={36} showText={true} />
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="p-2 rounded-xl text-content-muted hover:text-content bg-surface-card border border-surface-border hover:bg-surface-muted transition-colors shadow-2xs cursor-pointer ml-auto"
            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
          </button>
        </div>

        {/* Center Container: CARD FORM NẰM GỌN GÀNG, CĂN GIỮA ĐẸP MẮT */}
        <div className="w-full max-w-md mx-auto my-auto py-2 sm:py-3">
          <div className="card shadow-xl shadow-slate-900/5 dark:shadow-black/30 border border-surface-border rounded-3xl p-5 sm:p-7 bg-surface-card">
            <Outlet />
          </div>
        </div>

        {/* Bottom copyright footer */}
        <div className="w-full max-w-md mx-auto text-center py-2 text-xs text-content-muted font-medium">
          OwlMate — <span className="uppercase tracking-wider font-semibold">LEARN TOGETHER. GROW SMARTER.</span>
        </div>
      </div>
    </div>
  )
}
