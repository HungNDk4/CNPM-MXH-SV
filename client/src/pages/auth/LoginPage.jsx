import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

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
      toast.success(`Chào mừng, ${data.data.user.full_name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Đăng nhập</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Chào mừng trở lại! 👋</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Email</label>
          <input
            id="email" name="email" type="email"
            value={form.email} onChange={handleChange}
            placeholder="student@university.edu.vn"
            className="input" required
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Mật khẩu</label>
          <input
            id="password" name="password" type="password"
            value={form.password} onChange={handleChange}
            placeholder="••••••••"
            className="input" required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 inline-flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đăng nhập...
            </>
          ) : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-5">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
