import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentAPI, postAPI } from '@/services/api'
import toast from 'react-hot-toast'

const MAX_PDF_BYTES = 10 * 1024 * 1024
const POST_TYPES = [
  { value: 'question', label: '❓ Câu hỏi / Hỏi đáp' },
  { value: 'document', label: '📄 Chia sẻ tài liệu' },
  { value: 'discussion', label: '💬 Thảo luận' },
]

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const [form, setForm] = useState({
    title: '', content: '', post_type: 'question', subject: '', tags: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || form.title.trim().length > 300) {
      toast.error('Tiêu đề phải có từ 1 đến 300 ký tự.')
      return
    }
    const tags = form.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    if (form.post_type === 'document') {
      if (!pdfFile) return toast.error('Vui lòng chọn đúng một file PDF.')
      if (pdfFile.size < 1 || pdfFile.size > MAX_PDF_BYTES) {
        return toast.error('PDF phải lớn hơn 0 byte và không vượt quá 10 MiB.')
      }
      if (!/\.pdf$/i.test(pdfFile.name) ||
          (pdfFile.type && pdfFile.type !== 'application/pdf')) {
        return toast.error('Chỉ chấp nhận file PDF.')
      }
      if (form.content.length > 5000 || form.subject.length > 200 ||
          tags.length > 12 || tags.some(tag => tag.length > 40)) {
        return toast.error('Mô tả, môn học hoặc tags vượt quá giới hạn.')
      }
    }
    setLoading(true)
    try {
      let response
      if (form.post_type === 'document') {
        const multipart = new FormData()
        multipart.append('title', form.title.trim())
        multipart.append('description', form.content)
        multipart.append('subject', form.subject)
        multipart.append('tags', JSON.stringify(tags))
        multipart.append('file', pdfFile)
        response = await documentAPI.upload(multipart)
      } else {
        response = await postAPI.create({
          title: form.title.trim(),
          content: form.content,
          post_type: form.post_type,
          subject: form.subject,
          tags,
        })
      }
      const postId = response.data?.data?.id
      if (!postId) throw new Error('Thiếu ID bài viết trong phản hồi.')
      toast.success(form.post_type === 'document' ? 'Chia sẻ PDF thành công!' : 'Đăng bài thành công!')
      navigate(form.post_type === 'document' ? '/documents/' + postId : '/posts/' + postId)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Đăng bài thất bại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gradient mb-6">✏️ Tạo bài viết mới</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Loại bài viết</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {POST_TYPES.map(({ value, label }) => (
              <button key={value} type="button" disabled={loading}
                onClick={() => setForm(prev => ({ ...prev, post_type: value }))}
                aria-pressed={form.post_type === value}
                className={'py-2.5 px-3 rounded-xl text-sm font-medium border transition-all duration-200 ' +
                  (form.post_type === value
                    ? 'bg-primary-600/30 border-primary-500 text-primary-300'
                    : 'bg-surface border-surface-border text-slate-400 hover:border-slate-500')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="post-title" className="text-sm font-medium text-slate-300 mb-1.5 block">
            Tiêu đề <span className="text-red-400">*</span>
          </label>
          <input id="post-title" name="title" value={form.title} onChange={handleChange}
            maxLength={300} placeholder="Nhập tiêu đề bài viết..." className="input" required />
        </div>
        <div>
          <label htmlFor="post-content" className="text-sm font-medium text-slate-300 mb-1.5 block">
            {form.post_type === 'document' ? 'Mô tả tài liệu' : 'Nội dung'}
          </label>
          <textarea id="post-content" name="content" value={form.content} onChange={handleChange}
            maxLength={form.post_type === 'document' ? 5000 : undefined}
            placeholder="Mô tả chi tiết..." className="input resize-none" rows={5} />
        </div>
        {form.post_type === 'document' && (
          <div className="space-y-3 p-4 bg-surface rounded-xl border border-surface-border">
            <label htmlFor="pdf-file" className="text-sm font-medium text-slate-300 block">
              Chọn một PDF <span className="text-red-400">*</span>
            </label>
            <input id="pdf-file" type="file" accept=".pdf,application/pdf"
              required disabled={loading}
              onChange={event => setPdfFile(event.target.files?.[0] ?? null)}
              className="input text-sm" />
            <p className="text-xs text-slate-400">
              Miễn phí · 1 PDF/bài · tối đa 10 MiB (10.485.760 byte).
              Không nhập link Google Drive hoặc giá tiền.
            </p>
            {pdfFile && <p className="text-xs text-slate-300 break-all">
              Đã chọn: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MiB)
            </p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="post-subject" className="text-sm font-medium text-slate-300 mb-1.5 block">Môn học</label>
            <input id="post-subject" name="subject" value={form.subject}
              maxLength={200} onChange={handleChange}
              placeholder="CNPM, Giải tích..." className="input text-sm" />
          </div>
          <div>
            <label htmlFor="post-tags" className="text-sm font-medium text-slate-300 mb-1.5 block">Tags (phân cách bằng dấu phẩy)</label>
            <input id="post-tags" name="tags" value={form.tags} onChange={handleChange}
              placeholder="java, oop, react" className="input text-sm" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" disabled={loading} onClick={() => navigate(-1)}
            className="btn-secondary flex-1">Hủy</button>
          <button type="submit" disabled={loading}
            className="btn-primary flex-1">
            {loading ? 'Đang xử lý...' : form.post_type === 'document' ? '📄 Chia sẻ PDF' : '🚀 Đăng bài'}
          </button>
        </div>
      </form>
    </div>
  )
}
