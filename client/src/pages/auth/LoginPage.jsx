import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

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
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>Đăng nhập</span>
          
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
          Đăng nhập vào mạng xã hội học tập để tiếp tục thảo luận và tải tài liệu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 shadow-2xs transition-all"
              required
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 shadow-2xs transition-all"
              required
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 py-3.5 inline-flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/25 rounded-2xl transition-all cursor-pointer text-sm"
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

      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 text-center">
        <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold hover:underline transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
