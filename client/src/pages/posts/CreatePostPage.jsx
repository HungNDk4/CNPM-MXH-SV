import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { documentAPI, postAPI } from '@/services/api'
import toast from 'react-hot-toast'
import { PenLine, HelpCircle, FileText, MessageSquare, Send, Loader2, Upload, BookOpen, Tag } from 'lucide-react'

const MAX_PDF_BYTES = 10 * 1024 * 1024

const POST_TYPES = [
  { value: 'question', label: 'Câu hỏi / Hỏi đáp', icon: HelpCircle },
  { value: 'document', label: 'Chia sẻ tài liệu', icon: FileText },
  { value: 'discussion', label: 'Thảo luận', icon: MessageSquare },
]

export default function CreatePostPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type')
  const defaultType = POST_TYPES.some(t => t.value === initialType) ? initialType : 'question'

  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const [form, setForm] = useState({
    title: '', content: '', post_type: defaultType, subject: '', tags: '',
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <PenLine className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo bài viết mới</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Chia sẻ thắc mắc, thảo luận chuyên môn hoặc đóng góp tài liệu học tập.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5 block">
            Chọn hình thức đăng bài
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {POST_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                onClick={() => setForm(prev => ({ ...prev, post_type: value }))}
                aria-pressed={form.post_type === value}
                className={
                  'flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl text-sm font-medium border transition-all duration-200 cursor-pointer ' +
                  (form.post_type === value
                    ? 'bg-primary/10 border-primary text-primary font-semibold shadow-xs'
                    : 'bg-surface-card border-surface-border text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600')
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="post-title" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            Tiêu đề <span className="text-red-500">*</span>
          </label>
          <input
            id="post-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={300}
            placeholder="Tiêu đề tóm tắt ngắn gọn câu hỏi hoặc tài liệu..."
            className="input"
            required
          />
        </div>

        <div>
          <label htmlFor="post-content" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            {form.post_type === 'document' ? 'Mô tả chi tiết tài liệu' : 'Nội dung chi tiết'}
          </label>
          <textarea
            id="post-content"
            name="content"
            value={form.content}
            onChange={handleChange}
            maxLength={form.post_type === 'document' ? 5000 : undefined}
            placeholder={
              form.post_type === 'document'
                ? 'Mô tả tóm tắt nội dung tài liệu, giáo trình hoặc đề cương...'
                : 'Trình bày chi tiết câu hỏi, code hoặc thắc mắc của bạn...'
            }
            className="input resize-none"
            rows={5}
          />
        </div>

        {form.post_type === 'document' && (
          <div className="space-y-3 p-4 bg-surface-muted/40 rounded-xl border border-surface-border">
            <label htmlFor="pdf-file" className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
              Tải file PDF lên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="pdf-file"
                type="file"
                accept=".pdf,application/pdf"
                required
                disabled={loading}
                onChange={event => setPdfFile(event.target.files?.[0] ?? null)}
                className="input text-sm cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Miễn phí · 1 file PDF/bài · tối đa 10 MiB (10.485.760 byte).
            </p>
            {pdfFile && (
              <p className="text-xs font-medium text-primary break-all flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Đã chọn: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MiB)
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="post-subject" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              Môn học
            </label>
            <input
              id="post-subject"
              name="subject"
              value={form.subject}
              maxLength={200}
              onChange={handleChange}
              placeholder="CNPM, Giải tích, CSDL..."
              className="input text-sm"
            />
          </div>
          <div>
            <label htmlFor="post-tags" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Tags (phân cách bằng dấu phẩy)
            </label>
            <input
              id="post-tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="react, cnpm, ontap"
              className="input text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-surface-border">
          <button
            type="button"
            disabled={loading}
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : form.post_type === 'document' ? (
              <>
                <Upload className="w-4 h-4" />
                Chia sẻ PDF
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Đăng bài
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
