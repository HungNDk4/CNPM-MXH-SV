import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react'

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
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 dark:bg-emerald-950/40 text-primary-700 dark:text-[#4ade80] border border-primary-200/60 dark:border-emerald-800/40">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Chào mừng trở lại!</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-content tracking-tight">
          Đăng nhập
        </h2>
        <p className="text-content-muted text-xs sm:text-sm leading-relaxed">
          Đăng nhập vào OwlMate để tiếp tục thảo luận và khám phá tài liệu ôn thi.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold text-content block">
            Email sinh viên / Cá nhân <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ten@student.edu.vn hoặc email cá nhân"
              className="input pl-10 pr-4 py-3 text-sm rounded-2xl"
              required
              autoComplete="email"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold text-content block">
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
              className="input pl-10 pr-11 py-3 text-sm rounded-2xl"
              required
              autoComplete="current-password"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-content transition-colors cursor-pointer p-1"
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
          className="btn-primary w-full mt-2 py-3.5 inline-flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/20 rounded-2xl transition-all cursor-pointer text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang xác thực...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập vào OwlMate</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-4 border-t border-surface-border text-center">
        <p className="text-content-muted text-xs sm:text-sm">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            state={location.state}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold hover:underline transition-colors ml-1"
          >
            Đăng ký tài khoản ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
