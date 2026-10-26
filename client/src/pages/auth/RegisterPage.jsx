import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

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
    { id: 'full_name', label: 'Họ và tên', type: 'text', placeholder: 'Nguyễn Văn A', required: true },
    { id: 'email', label: 'Email', type: 'email', placeholder: 'abc@university.edu.vn', required: true },
    { id: 'password', label: 'Mật khẩu', type: 'password', placeholder: 'Tối thiểu 6 ký tự', required: true },
    { id: 'university', label: 'Trường đại học', type: 'text', placeholder: 'ĐH Bách Khoa HCM', required: false },
    { id: 'major', label: 'Ngành học', type: 'text', placeholder: 'Công nghệ phần mềm', required: false },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Tạo tài khoản</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Tham gia cộng đồng học tập ngay hôm nay 🚀</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ id, label, type, placeholder, required }) => (
          <div key={id}>
            <label htmlFor={id} className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={id} name={id} type={type}
              value={form[id]} onChange={handleChange}
              placeholder={placeholder}
              className="input" required={required}
            />
          </div>
        ))}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 inline-flex items-center justify-center gap-2">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang đăng ký...
            </>
          ) : 'Đăng ký ngay'}
        </button>
      </form>

      <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-5">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
