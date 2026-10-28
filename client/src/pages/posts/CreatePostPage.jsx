import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { documentAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import {
  PenLine,
  HelpCircle,
  FileText,
  MessageSquare,
  Send,
  Loader2,
  Upload,
  BookOpen,
  Tag,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  FileCheck,
  X,
} from 'lucide-react'
import Badge from '@/components/common/Badge'

const MAX_PDF_BYTES = 10 * 1024 * 1024

const SUBJECT_OPTIONS = [
  'C�ng ngh? ph?n m?m',
  'Co s? d? li?u',
  'L?p tr�nh Web',
  'Tr� tu? nh�n t?o',
  'Ki?n tr�c m�y t�nh',
  'An to�n th�ng tin',
  'C?u tr�c d? li?u & Gi?i thu?t',
  'M?ng m�y t�nh',
  'To�n cao c?p / Gi?i t�ch',
  'Kh�c',
]

const POST_TYPES = [
  { value: 'question', label: 'Câu hỏi / Hỏi đáp', icon: HelpCircle, color: 'text-amber-500' },
  { value: 'document', label: 'Chia sẻ tài liệu', icon: FileText, color: 'text-emerald-500' },
  { value: 'discussion', label: 'Thảo luận', icon: MessageSquare, color: 'text-purple-500' },
]

export default function CreatePostPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type')
  const defaultType = POST_TYPES.some((t) => t.value === initialType) ? initialType : 'question'

  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [form, setForm] = useState({
    title: '',
    content: '',
    post_type: defaultType,
    subject: '',
    tags: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
        setPdfFile(file)
      } else {
        toast.error('Chỉ chấp nhận file PDF.')
      }
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || form.title.trim().length > 300) {
      toast.error('Tiêu đề phải có từ 1 đến 300 ký tự.')
      return
    }
    const tags = form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    if (form.post_type === 'document') {
      if (!pdfFile) return toast.error('Vui lòng chọn đúng một file PDF.')
      if (pdfFile.size < 1 || pdfFile.size > MAX_PDF_BYTES) {
        return toast.error('PDF phải lớn hơn 0 byte và không vượt quá 10 MiB.')
      }
      if (!/\.pdf$/i.test(pdfFile.name) || (pdfFile.type && pdfFile.type !== 'application/pdf')) {
        return toast.error('Chỉ chấp nhận file PDF.')
      }
      if (
        form.content.length > 5000 ||
        form.subject.length > 200 ||
        tags.length > 12 ||
        tags.some((tag) => tag.length > 40)
      ) {
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

  const tagsList = form.tags.split(',').map((t) => t.trim()).filter(Boolean)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-700 via-green-600 to-emerald-600 text-white flex items-center justify-center shadow-glow-green">
          <PenLine className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Tạo bài viết &amp; Chia sẻ tài liệu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Đặt câu hỏi bài tập, đóng góp tài liệu PDF 10MB hoặc mở chủ đề thảo luận học thuật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═══════════════════════════════════════════════
            CỘT TRÁI (FORM SOẠN THẢO - GROVELYN NUMBERED SECTIONS): 7 Cols
            ═══════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 card p-6 sm:p-7 space-y-6">
          {/* Section 1: Đây là gì */}
          <div className="space-y-4 pb-4 border-b border-surface-border">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-primary-600 dark:text-primary-400">1</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đây là gì</h3>
                <p className="text-[11px] text-slate-500">Lựa chọn hình thức và đặt tiêu đề để người đọc dễ dàng nhận biết.</p>
              </div>
            </div>

            {/* Chọn hình thức đăng bài */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Hình thức bài đăng
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {POST_TYPES.map(({ value, label, icon: Icon, color }) => {
                  const isSelected = form.post_type === value
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={loading}
                      onClick={() => setForm((prev) => ({ ...prev, post_type: value }))}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-200 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md scale-[1.02]'
                          : 'bg-surface-card border-surface-border text-slate-600 dark:text-slate-300 hover:bg-surface-muted'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? '' : color}`} />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tiêu đề */}
            <div className="space-y-1.5">
              <label htmlFor="post-title" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Tiêu đề bài viết <span className="text-rose-500">*</span>
              </label>
              <input
                id="post-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={300}
                placeholder="Ví dụ: Đề cương tóm tắt Giải tích 2, thắc mắc về React Hook..."
                className="input rounded-xl"
                required
              />
            </div>

            {/* Môn học */}
            <div className="space-y-1.5">
              <label htmlFor="post-subject" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary-500" />
                <span>Môn học / Lĩnh vực</span>
              </label>
              <input
                id="post-subject"
                name="subject"
                value={form.subject}
                maxLength={200}
                onChange={handleChange}
                placeholder="Ví dụ: Công nghệ phần mềm, CSDL, Giải tích..."
                className="input text-xs sm:text-sm rounded-xl"
              />
            </div>
          </div>

          {/* Section 2: Nội dung & Tệp đính kèm */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-primary-600 dark:text-primary-400">2</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Nội dung &amp; Tệp đính kèm</h3>
                <p className="text-[11px] text-slate-500">Mô tả chi tiết và đính kèm tài liệu PDF (tối đa 10 MiB) nếu có.</p>
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="space-y-1.5">
              <label htmlFor="post-content" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {form.post_type === 'document' ? 'Mô tả tóm tắt tài liệu' : 'Nội dung chi tiết'}
              </label>
              <textarea
                id="post-content"
                name="content"
                value={form.content}
                onChange={handleChange}
                maxLength={form.post_type === 'document' ? 5000 : undefined}
                placeholder={
                  form.post_type === 'document'
                    ? 'Mô tả tóm tắt giáo trình, đề cương, dạng bài tập hoặc lưu ý khi ôn thi...'
                    : 'Trình bày chi tiết đề bài, thắc mắc hoặc chủ đề thảo luận...'
                }
                className="input rounded-xl resize-y"
                rows={5}
              />
            </div>

            {/* Upload PDF Box (For Document Type - Grovelyn Image 4 Style) */}
            {form.post_type === 'document' && (
              <div className="space-y-3 p-5 bg-gradient-to-br from-emerald-500/5 via-surface-card to-teal-500/5 rounded-2xl border-2 border-dashed border-emerald-500/30">
                <label htmlFor="pdf-file" className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  Tệp tài liệu PDF <span className="text-rose-500">*</span>
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-xl border border-dashed text-center transition-all ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-surface-border bg-surface-card hover:bg-surface-muted/50'
                  }`}
                >
                  <input
                    id="pdf-file"
                    type="file"
                    accept=".pdf,application/pdf"
                    required
                    disabled={loading}
                    onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-2xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Kéo thả tệp hoặc bấm để chọn
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Báo cáo PDF, slide bài giảng, đề thi. Tối đa 10 MB.
                  </p>

                  {pdfFile && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      <span className="truncate max-w-xs">{pdfFile.name}</span>
                      <span className="text-slate-400">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-1.5">
              <label htmlFor="post-tags" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary-500" />
                <span>Tags (phân cách bằng dấu phẩy)</span>
              </label>
              <input
                id="post-tags"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="react, tailwind, ontap..."
                className="input text-xs sm:text-sm rounded-xl"
              />
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-surface-border">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate(-1)}
              className="btn-secondary flex-1 rounded-xl text-xs sm:text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : form.post_type === 'document' ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Chia sẻ PDF</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Đăng bài</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ═══════════════════════════════════════════════
            CỘT PHẢI (LIVE PREVIEW CARD & CHECKLIST): 5 Cols
            ═══════════════════════════════════════════════ */}
        <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <div className="card p-5 space-y-4 bg-gradient-to-b from-surface-card to-surface-muted/50 border-surface-border">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Eye className="w-4 h-4 text-primary-500" />
                <span>Xem trước thẻ bài viết</span>
              </span>
              <span className="text-[11px] text-primary-600 font-semibold bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full">
                Thời gian thực
              </span>
            </div>

            {/* Live Preview Card */}
            <div className="card p-4 sm:p-5 bg-surface-card border border-surface-border shadow-bento space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full avatar-gradient-ring p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {user?.full_name || 'Tác giả'}
                    </span>
                    <span className="text-[10px] text-slate-400">Vừa xong</span>
                  </div>
                </div>
                <Badge type={form.post_type} />
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">
                {form.title.trim() || 'Tiêu đề bài viết sẽ hiển thị ở đây...'}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                {form.content.trim() || 'Nội dung chi tiết hoặc mô tả tài liệu sẽ xuất hiện ở đây.'}
              </p>

              {form.post_type === 'document' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold truncate">
                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{pdfFile ? pdfFile.name : 'Chưa đính kèm file PDF'}</span>
                  </div>
                  <span className="badge-free text-[10px]">Miễn phí</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {form.subject && (
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full">
                    {form.subject}
                  </span>
                )}
                {tagsList.map((tag, i) => (
                  <span key={i} className="text-[10px] text-slate-400 font-mono">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className="pt-2 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Tiêu chí sẵn sàng đăng:
              </span>
              <div className="space-y-1.5 text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${form.title.trim().length >= 1 ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span>Tiêu đề bài viết (1 - 300 ký tự)</span>
                </div>
                {form.post_type === 'document' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${pdfFile ? 'text-emerald-500' : 'text-slate-300'}`} />
                    <span>Đã chọn đúng 1 file PDF (tối đa 10 MB)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${form.subject.trim() ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span>Gắn mã môn học giúp bạn học dễ tìm kiếm</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
