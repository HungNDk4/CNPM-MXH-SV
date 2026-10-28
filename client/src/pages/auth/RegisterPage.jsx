import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, User, Mail, Lock, School, BookOpen, ArrowRight, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', university: '', major: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự.')
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setAuth(data.data)
      toast.success('Đăng ký tài khoản thành công! Chào mừng bạn gia nhập 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: 'full_name', label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true, icon: User },
    { id: 'email', label: 'Email sinh viên / cá nhân', type: 'email', placeholder: 'abc@student.edu.vn', required: true, icon: Mail },
    { id: 'password', label: 'Mật khẩu', type: 'password', placeholder: 'Tối thiểu 6 ký tự', required: true, icon: Lock },
    { id: 'university', label: 'Trường Đại học / Cao đẳng', type: 'text', placeholder: 'ĐH Bách Khoa TP.HCM', required: false, icon: School },
    { id: 'major', label: 'Chuyên ngành học', type: 'text', placeholder: 'Khoa học Máy tính / CNPM', required: false, icon: BookOpen },
  ]

  return (
    <div className="space-y-6">
      {/* Top Switcher Tabs (Grovelyn style) */}
      <div className="flex p-1 bg-surface-muted rounded-2xl border border-surface-border text-xs font-bold">
        <Link
          to="/login"
          className="flex-1 py-2 text-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Đăng nhập
        </Link>
        <button
          type="button"
          className="flex-1 py-2 text-center rounded-xl bg-surface-card text-primary-600 dark:text-primary-400 shadow-2xs transition-all"
        >
          Đăng ký tài khoản
        </button>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <span>Gia nhập cộng đồng</span>
          <Sparkles className="w-5 h-5 text-emerald-500" />
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Tạo tài khoản miễn phí để chia sẻ tài liệu ôn thi và kết nối cùng bạn bè.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {fields.map(({ id, label, type, placeholder, required, icon: Icon }) => (
          <div key={id} className="space-y-1">
            <label htmlFor={id} className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
              <input
                id={id}
                name={id}
                type={type}
                value={form[id]}
                onChange={handleChange}
                placeholder={placeholder}
                className="input pl-10 py-2.5 text-sm"
                required={required}
              />
              <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 py-3 inline-flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/25 rounded-2xl transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Đăng ký ngay</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-surface-border text-center">
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-bold hover:underline transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
