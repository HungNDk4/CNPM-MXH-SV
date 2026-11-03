import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.data)
      toast.success(`Chào mừng trở lại, ${data.data.user.full_name}! 👋`)
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E1F3E7] dark:bg-[#1D3528] text-[#1D7D46] dark:text-[#45C878] border border-[#C5E5CE] dark:border-[#28573D]">
          <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
          <span>Tài khoản sinh viên</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#123D35] dark:text-white tracking-tight">
          Chào mừng bạn trở lại
        </h2>
        <p className="text-[#4A6056] dark:text-[#9FB3A9] text-xs sm:text-sm leading-relaxed">
          Tiếp tục hành trình học hỏi và chia sẻ cùng cộng đồng.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Email */}
        <div className="space-y-1.5">
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
              placeholder="ví dụ: hung@student.edu.vn"
              className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
              required
              autoComplete="email"
            />
            <Mail className="w-4 h-4 text-[#7A8E84] dark:text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold text-[#123D35] dark:text-[#E2E8F0] block">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-[#FAFCFA] dark:bg-[#222D32] border border-[#D8E1DB] dark:border-[#33444C] text-[#123D35] dark:text-white rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-sm focus:bg-white dark:focus:bg-[#263339] focus:border-[#21A65B] dark:focus:border-[#4ade80] focus:ring-2 focus:ring-[#21A65B]/20 outline-none transition-all placeholder:text-[#8D9F95] dark:placeholder:text-[#64748B] font-medium"
              required
              autoComplete="current-password"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 sm:py-3.5 px-4 inline-flex items-center justify-center gap-2 font-bold text-sm text-white bg-[#1F8A4D] hover:bg-[#18733F] dark:bg-[#2EB86B] dark:hover:bg-[#25A15C] dark:text-[#0A1F16] rounded-xl shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21A65B]/40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-4 border-t border-[#E3E8E4] dark:border-[#29373D] text-center">
        <p className="text-[#5A6E64] dark:text-[#94A3B8] text-xs sm:text-sm">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="text-[#1F8A4D] hover:text-[#18733F] dark:text-[#4ade80] dark:hover:text-[#86efac] font-bold hover:underline transition-colors ml-1"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
