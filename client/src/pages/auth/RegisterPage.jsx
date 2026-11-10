import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, User, Mail, Lock, School, BookOpen, ArrowRight, Eye, EyeOff } from 'lucide-react'

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
      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn gia nhập OwlMate 🎉')
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-[26px] font-black text-content tracking-tight">
          Tạo tài khoản OwlMate
        </h2>
        <p className="text-content-muted text-xs sm:text-sm leading-relaxed">
          Đăng ký miễn phí để chia sẻ tài liệu ôn thi, làm đồ án và kết nối bạn bè.
        </p>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-2.5 pt-0.5">
        {/* Họ và tên */}
        <div className="space-y-1">
          <label htmlFor="full_name" className="text-xs font-bold text-content block">
            Họ và tên <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="input pl-10 pr-4 py-2 text-sm rounded-xl"
              required
              autoComplete="name"
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
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
              placeholder="ten@student.edu.vn"
              className="input pl-10 pr-4 py-2 text-sm rounded-xl"
              required
              autoComplete="email"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Mật khẩu with Show/Hide toggle */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-bold text-content block">
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
              className="input pl-10 pr-11 py-2 text-sm rounded-xl"
              required
              autoComplete="new-password"
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

        {/* Trường Đại học */}
        <div className="space-y-1">
          <label htmlFor="university" className="text-xs font-bold text-content block">
            Trường Đại học / Cao đẳng
          </label>
          <div className="relative">
            <input
              id="university"
              name="university"
              type="text"
              value={form.university}
              onChange={handleChange}
              placeholder="ĐH Bách Khoa, UIT, HUST, ĐHKHTN..."
              className="input pl-10 pr-4 py-2 text-sm rounded-xl"
              autoComplete="organization"
            />
            <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Chuyên ngành học */}
        <div className="space-y-1">
          <label htmlFor="major" className="text-xs font-bold text-content block">
            Chuyên ngành học
          </label>
          <div className="relative">
            <input
              id="major"
              name="major"
              type="text"
              value={form.major}
              onChange={handleChange}
              placeholder="Khoa học Máy tính / CNPM / Hệ thống..."
              className="input pl-10 pr-4 py-2 text-sm rounded-xl"
            />
            <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 py-3 inline-flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/20 rounded-xl transition-all cursor-pointer text-sm"
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
      <div className="pt-3 border-t border-surface-border text-center">
        <p className="text-content-muted text-xs sm:text-sm">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold hover:underline transition-colors ml-1"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
