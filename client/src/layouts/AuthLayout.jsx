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
import BrandLogo, { BrandIcon } from '@/components/common/BrandLogo'

export default function AuthLayout() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="min-h-screen bg-[#F8F9F6] dark:bg-[#12161A] text-[#123D35] dark:text-[#E2E8F0] flex flex-col md:flex-row relative selection:bg-[#45C878]/25 transition-colors duration-200">
      {/* ── CỘT TRÁI: BRAND SHOWCASE (DESKTOP) ── */}
      <aside
        aria-label="Giới thiệu Owl Mate"
        className="hidden md:flex md:w-[46%] xl:w-[45%] flex-col justify-between p-8 lg:p-12 xl:p-14 bg-[#EEF3EF] dark:bg-[#151D20] border-r border-[#DCE5DF] dark:border-[#223136] relative overflow-hidden select-none transition-colors duration-200"
      >
        {/* Subtle decorative ambient lights (restrained & non-intrusive) */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#45C878]/10 dark:bg-[#45C878]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-72 h-72 bg-[#FFD45C]/15 dark:bg-[#FFD45C]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Brand Logo & Back to feed */}
        <div className="flex items-center justify-between relative z-10">
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
            title="Owl Mate — Trang chủ"
          >
            <BrandLogo size={42} showText={true} />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-[#123D35] dark:bg-white/10 dark:hover:bg-white/15 dark:text-[#E2E8F0] border border-[#D5E0D8] dark:border-white/15 shadow-2xs transition-all backdrop-blur-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Xem bảng tin</span>
          </Link>
        </div>

        {/* Center Showcase Content */}
        <div className="space-y-6 my-auto py-4 relative z-10 max-w-lg">
          {/* Owl Mate Mascot Anchor */}
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-[#1C2824] border border-[#D5E0D8] dark:border-[#2A3C35] p-2.5 shadow-sm flex items-center justify-center shrink-0">
              <BrandIcon size={64} />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E1F3E7] dark:bg-[#1B3527] text-[#1D7D46] dark:text-[#45C878] border border-[#C5E5CE] dark:border-[#27533B]">
                <Sparkles className="w-3 h-3 text-[#F5A623]" />
                <span>Nền tảng học thuật sinh viên</span>
              </div>
              <p className="text-xs font-semibold text-[#4A6056] dark:text-[#9FB3A9]">
                Cùng học, cùng trưởng thành mỗi ngày.
              </p>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="space-y-2.5">
            <h1 className="text-2xl lg:text-3xl font-black text-[#123D35] dark:text-white tracking-tight leading-snug">
              Nơi dự án &amp; tri thức <br />
              <span className="text-[#239B57] dark:text-[#4ade80]">
                cùng bạn lớn lên.
              </span>
            </h1>
            <p className="text-[#3F554C] dark:text-[#9FB3A9] text-xs sm:text-sm leading-relaxed">
              Mạng xã hội học tập kết nối sinh viên các trường đại học: cùng giải đáp bài tập, lập nhóm làm đồ án và chia sẻ tài liệu ôn thi hoàn toàn miễn phí.
            </p>
          </div>

          {/* Tối đa 2 điểm nổi bật (Gọn gàng, không để card hoặc testimonial rời rạc chiếm diện tích) */}
          <div className="grid grid-cols-1 gap-2.5 pt-1">
            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#1B2529] border border-[#DCE5DF] dark:border-[#26373E] shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E1F3E7] dark:bg-[#1D3528] text-[#1D7D46] dark:text-[#45C878] border border-[#C5E5CE] dark:border-[#28573D] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-bold text-xs text-[#123D35] dark:text-[#EAF2ED]">
                  Kho tài liệu PDF chuẩn hóa
                </h2>
                <p className="text-[11px] text-[#4A6056] dark:text-[#9FB3A9] leading-snug">
                  Đề cương, slide bài giảng &amp; tài liệu đồ án mẫu từ cộng đồng sinh viên.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/90 dark:bg-[#1B2529] border border-[#DCE5DF] dark:border-[#26373E] shadow-2xs flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FEF5DC] dark:bg-[#382E17] text-[#B87A08] dark:text-[#FFD45C] border border-[#FDE5A3] dark:border-[#58451D] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="font-bold text-xs text-[#123D35] dark:text-[#EAF2ED]">
                  Cộng đồng học thuật gắn kết
                </h2>
                <p className="text-[11px] text-[#4A6056] dark:text-[#9FB3A9] leading-snug">
                  Hỏi đáp bài tập, kết nối đồng đội làm đề tài từ ĐHBK, UIT, HUST, ĐHKHTN...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Footer */}
        <div className="flex items-center justify-between text-xs text-[#5A6E64] dark:text-[#8FA399] relative z-10 pt-3 border-t border-[#DCE5DF] dark:border-[#223136]">
          <span>© 2026 Owl Mate</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[#1D7D46] dark:text-[#45C878] font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              An toàn &amp; Bảo mật
            </span>
            <span className="text-[11px]">Học thuật phi thương mại</span>
          </div>
        </div>
      </aside>

      {/* ── CỘT PHẢI: FORM CARD CHỨA NỘI DUNG (LOGIN / REGISTER) ── */}
      <main className="w-full md:w-[54%] xl:w-[55%] flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-y-auto min-h-screen">
        {/* Top Header Controls: Mobile Brand + Theme switch */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto pt-1 sm:pt-0 pb-3 sm:pb-0">
          <Link to="/" className="md:hidden flex items-center gap-2" title="Owl Mate">
            <BrandLogo size={34} showText={true} />
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            className="p-2 rounded-xl text-[#5A6E64] dark:text-[#94A3B8] hover:text-[#123D35] dark:hover:text-white bg-white dark:bg-[#1B2327] border border-[#DCE5DF] dark:border-[#29373D] hover:bg-[#F2F6F3] dark:hover:bg-[#222E33] transition-colors shadow-2xs cursor-pointer ml-auto"
            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#FFD45C]" />
            ) : (
              <Moon className="w-4 h-4 text-[#5A6E64]" />
            )}
          </button>
        </div>

        {/* Center Container: CARD FORM NẰM GỌN GÀNG, TẬP TRUNG */}
        <div className="w-full max-w-md mx-auto my-auto py-4 sm:py-6">
          <div className="bg-white dark:bg-[#1B2327] border border-[#E3E8E4] dark:border-[#29373D] shadow-lg shadow-emerald-950/[0.03] dark:shadow-black/35 rounded-3xl p-6 sm:p-8">
            <Outlet />
          </div>
        </div>

        {/* Bottom copyright footer */}
        <footer className="w-full max-w-md mx-auto text-center py-2 text-xs text-[#64766D] dark:text-[#8A9C93] font-medium">
          Owl Mate — <span className="uppercase tracking-wider font-semibold">LEARN TOGETHER. GROW SMARTER.</span>
        </footer>
      </main>
    </div>
  )
}
