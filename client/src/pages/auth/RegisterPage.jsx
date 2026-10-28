import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2, User, Mail, Lock, School, BookOpen, ArrowRight } from 'lucide-react'

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
      toast.success('Đăng ký thành công! Chào mừng bạn 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: 'full_name', label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true, icon: User },
    { id: 'email', label: 'Email sinh viên', type: 'email', placeholder: 'abc@university.edu.vn', required: true, icon: Mail },
    { id: 'password', label: 'Mật khẩu', type: 'password', placeholder: 'Tối thiểu 6 ký tự', required: true, icon: Lock },
    { id: 'university', label: 'Trường đại học', type: 'text', placeholder: 'ĐH Bách Khoa HCM', required: false, icon: School },
    { id: 'major', label: 'Ngành học', type: 'text', placeholder: 'Công nghệ phần mềm', required: false, icon: BookOpen },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Tạo tài khoản</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Tham gia cộng đồng học tập năng động ngay hôm nay 🚀
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
          className="btn-primary w-full mt-4 py-2.5 inline-flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/25 rounded-2xl transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đăng ký...
            </>
          ) : (
            <>
              Đăng ký ngay
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-surface-border text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary hover:text-primary-dark font-bold hover:underline transition-colors">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
