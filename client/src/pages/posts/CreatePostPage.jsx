import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postAPI } from '@/services/api'
import toast from 'react-hot-toast'

const POST_TYPES = [
  { value: 'question',    label: '❓ Câu hỏi / Hỏi đáp' },
  { value: 'document',    label: '📄 Chia sẻ tài liệu' },
  { value: 'discussion',  label: '💬 Thảo luận' },
]

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', content: '', post_type: 'question',
    subject: '', price: 0, file_url: '', file_name: '', tags: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề.')
    setLoading(true)
    try {
      const payload = {
        ...form,
        price: form.post_type === 'document' ? parseFloat(form.price) || 0 : 0,
        tags:  form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      const { data } = await postAPI.create(payload)
      toast.success('Đăng bài thành công!')
      navigate(`/posts/${data.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng bài thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gradient mb-6">✏️ Tạo bài viết mới</h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Post type */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Loại bài viết</label>
          <div className="grid grid-cols-3 gap-2">
            {POST_TYPES.map(({ value, label }) => (
              <button
                key={value} type="button"
                onClick={() => setForm(p => ({ ...p, post_type: value }))}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  form.post_type === value
                    ? 'bg-primary-600/30 border-primary-500 text-primary-300'
                    : 'bg-surface border-surface-border text-slate-400 hover:border-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">
            Tiêu đề <span className="text-red-400">*</span>
          </label>
          <input name="title" value={form.title} onChange={handleChange}
            placeholder="Nhập tiêu đề bài viết..."
            className="input" required />
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">Nội dung</label>
          <textarea name="content" value={form.content} onChange={handleChange}
            placeholder="Mô tả chi tiết..."
            className="input resize-none" rows={5} />
        </div>

        {/* Document fields */}
        {form.post_type === 'document' && (
          <div className="space-y-4 p-4 bg-surface rounded-xl border border-surface-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thông tin tài liệu</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Link tài liệu</label>
                <input name="file_url" value={form.file_url} onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                  className="input text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Giá (VNĐ)</label>
                <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                  placeholder="0 = Miễn phí"
                  className="input text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Subject & Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Môn học</label>
            <input name="subject" value={form.subject} onChange={handleChange}
              placeholder="CNPM, Giải tích..." className="input text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Tags (phân cách bằng dấu phẩy)</label>
            <input name="tags" value={form.tags} onChange={handleChange}
              placeholder="java, oop, react" className="input text-sm" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
            Hủy
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Đang đăng...' : '🚀 Đăng bài'}
          </button>
        </div>
      </form>
    </div>
  )
}
