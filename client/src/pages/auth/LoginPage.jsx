import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.data)
      toast.success(`Chào mừng trở lại, ${data.data.user.full_name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Switcher Tabs (Grovelyn style) */}
      <div className="flex p-1 bg-surface-muted rounded-2xl border border-surface-border text-xs font-bold">
        <button
          type="button"
          className="flex-1 py-2 text-center rounded-xl bg-surface-card text-primary-600 dark:text-primary-400 shadow-2xs transition-all"
        >
          Đăng nhập
        </button>
        <Link
          to="/register"
          className="flex-1 py-2 text-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Đăng ký tài khoản
        </Link>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Chào mừng bạn!</span>
          <Sparkles className="w-5 h-5 text-amber-500" />
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Đăng nhập vào mạng xã hội học tập để tiếp tục thảo luận và tải tài liệu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Email sinh viên <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ten@student.edu.vn hoặc email cá nhân"
              className="input pl-10 py-2.5 text-sm"
              required
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input pl-10 py-2.5 text-sm"
              required
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 py-3 inline-flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/25 rounded-2xl transition-all cursor-pointer"
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

      <div className="pt-4 border-t border-surface-border text-center">
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold hover:underline transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
