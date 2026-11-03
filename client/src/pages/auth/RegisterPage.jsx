import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, User, Mail, Lock, School, BookOpen, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', university: '', major: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự.')
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setAuth(data.data)
      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn gia nhập Owl Mate 🎉')
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E1F3E7] dark:bg-[#1D3528] text-[#1D7D46] dark:text-[#45C878] border border-[#C5E5CE] dark:border-[#28573D]">
          <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
          <span>Gia nhập cộng đồng Owl Mate</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#123D35] dark:text-white tracking-tight">
          Bắt đầu hành trình tri thức
        </h2>
        <p className="text-[#4A6056] dark:text-[#9FB3A9] text-xs sm:text-sm leading-relaxed">
          Tạo tài khoản để khám phá tài liệu, chia sẻ kiến thức và học cùng bạn bè.
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* ── NHÓM 1: THÔNG TIN TÀI KHOẢN ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F8A4D] dark:text-[#4ade80]">
              Thông tin tài khoản
            </span>
            <div className="flex-1 h-px bg-[#E3E8E4] dark:bg-[#29373D]" />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold text-[#123D35] dark:text-[#E2E8F0] block">
              Email sinh viên hoặc cá nhân <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ví dụ: sinhvien@university.edu.vn"
                className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
                required
                autoComplete="email"
              />
              <Mail className="w-4 h-4 text-[#7A8E84] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mật khẩu with Show/Hide toggle */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-bold text-[#123D35] dark:text-[#E2E8F0] block">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-11 py-2.5 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
                required
                autoComplete="new-password"
              />
              <Lock className="w-4 h-4 text-[#7A8E84] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7A8E84] hover:text-[#123D35] dark:text-[#64748B] dark:hover:text-white transition-colors cursor-pointer p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── NHÓM 2: THÔNG TIN HỌC TẬP ── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F8A4D] dark:text-[#4ade80]">
              Thông tin học tập
            </span>
            <div className="flex-1 h-px bg-[#E3E8E4] dark:bg-[#29373D]" />
          </div>

          {/* Họ và tên với subtext */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="full_name" className="text-xs font-bold text-[#123D35] dark:text-[#E2E8F0] block">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#5A6E64] dark:text-[#94A3B8]">
                Tên bạn muốn mọi người gọi
              </span>
            </div>
            <div className="relative">
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
                required
                autoComplete="name"
              />
              <User className="w-4 h-4 text-[#7A8E84] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Trường Đại học */}
          <div className="space-y-1">
            <label htmlFor="university" className="text-xs font-bold text-[#123D35] dark:text-[#E2E8F0] block">
              Trường Đại học / Cao đẳng
            </label>
            <div className="relative">
              <input
                id="university"
                name="university"
                type="text"
                value={form.university}
                onChange={handleChange}
                placeholder="ĐH Bách Khoa, UIT, HUST..."
                className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
                autoComplete="organization"
              />
              <School className="w-4 h-4 text-[#7A8E84] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Chuyên ngành học */}
          <div className="space-y-1">
            <label htmlFor="major" className="text-xs font-bold text-[#123D35] dark:text-[#E2E8F0] block">
              Chuyên ngành học
            </label>
            <div className="relative">
              <input
                id="major"
                name="major"
                type="text"
                value={form.major}
                onChange={handleChange}
                placeholder="Khoa học Máy tính, CNPM, Hệ thống..."
                className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
              />
              <BookOpen className="w-4 h-4 text-[#7A8E84] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 py-3 sm:py-3.5 px-4 inline-flex items-center justify-center gap-2 font-bold text-sm text-white bg-[#1F8A4D] hover:bg-[#18733F] dark:bg-[#2EB86B] dark:hover:bg-[#25A15C] dark:text-[#0A1F16] rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21A65B]/40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang khởi tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Đăng ký ngay</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-3.5 border-t border-[#E3E8E4] dark:border-[#29373D] text-center">
        <p className="text-[#5A6E64] dark:text-[#94A3B8] text-xs sm:text-sm">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="text-[#1F8A4D] hover:text-[#18733F] dark:text-[#4ade80] dark:hover:text-[#86efac] font-bold hover:underline transition-colors ml-1"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
