import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postAPI, documentAPI } from '@/services/api'
import {
  MessageSquare,
  HelpCircle,
  FileText,
  UploadCloud,
  FileCheck,
  X,
  Loader2,
  Send,
  Upload,
} from 'lucide-react'

const SUBJECT_OPTIONS = [
  'Công nghệ phần mềm',
  'Cơ sở dữ liệu',
  'Lập trình Web',
  'Trí tuệ nhân tạo',
  'Kiến trúc máy tính',
  'An toàn thông tin',
  'Cấu trúc dữ liệu & Giải thuật',
  'Mạng máy tính',
  'Toán cao cấp / Giải tích',
  'Khác',
]

export default function InlineComposer({ user, onPostSuccess }) {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [postType, setPostType] = useState('discussion') // 'discussion' | 'question' | 'document'
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('Công nghệ phần mềm')
  const [tagsInput, setTagsInput] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleOpenWithType = (type) => {
    setPostType(type)
    setIsExpanded(true)
  }

  const handleCancel = () => {
    setIsExpanded(false)
    setTitle('')
    setContent('')
    setPdfFile(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Dung lượng file tối đa là 10 MB.')
          return
        }
        setPdfFile(file)
      } else {
        toast.error('Chỉ chấp nhận file định dạng PDF.')
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      toast.error('Chỉ chấp nhận file định dạng PDF.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng file tối đa là 10 MB.')
      return
    }

    setPdfFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error('Vui lòng nhập tiêu đề bài viết.')
      return
    }

    const rawTags = tagsInput
      .split(/[,;\s]+/)
      .map((t) => t.replace(/^#/, '').trim().toLowerCase())
      .filter((t) => t.length > 0)
    const tags = Array.from(new Set(rawTags)).slice(0, 8)

    setIsSubmitting(true)
    try {
      if (postType === 'document') {
        if (!pdfFile) {
          toast.error('Bài viết loại tài liệu bắt buộc phải đính kèm file PDF.')
          setIsSubmitting(false)
          return
        }

        const formData = new FormData()
        formData.append('title', trimmedTitle)
        formData.append('description', content.trim())
        formData.append('subject', subject)
        formData.append('tags', JSON.stringify(tags.length ? tags : ['tailieu']))
        formData.append('file', pdfFile)

        await documentAPI.upload(formData)
        toast.success('Đã tải lên tài liệu PDF thành công! 🎉')
      } else {
        await postAPI.create({
          title: trimmedTitle,
          content: content.trim(),
          post_type: postType,
          subject,
          tags: tags.length ? tags : ['hoctap'],
        })
        toast.success('Đăng bài viết thành công! 🎉')
      }

      // Reset form
      handleCancel()
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      if (onPostSuccess) onPostSuccess()
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể đăng bài viết lúc này.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. TRẠNG THÁI THU GỌN (COMPACT BAR BAN ĐẦU TRONG CỘT 2)
  // ═══════════════════════════════════════════════════════════════════════
  if (!isExpanded) {
    return (
      <div className="card p-4 sm:p-5 bg-surface-card border border-surface-border shadow-bento space-y-3.5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full avatar-gradient-ring p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                user?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenWithType('discussion')}
            className="flex-1 bg-surface-muted hover:bg-surface-border/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full px-5 py-2.5 text-xs sm:text-sm text-left transition-all border border-surface-border cursor-pointer shadow-inner truncate"
          >
            Hôm nay bạn cần giải đáp môn gì, {user?.full_name ? user.full_name.split(' ').slice(-1)[0] : 'bạn'}?
          </button>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center justify-between pt-2.5 border-t border-surface-border text-xs gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenWithType('question')}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold transition-colors border border-amber-500/20 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Đặt câu hỏi</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenWithType('document')}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold transition-colors border border-emerald-500/20 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Chia sẻ PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenWithType('discussion')}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-300 font-semibold transition-colors border border-green-500/20 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-green-500" />
              <span>Thảo luận</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Đăng trực tiếp tại đây
          </span>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. TRẠNG THÁI MỞ RỘNG (INLINE COMPOSER - LÀ 1 PHẦN CỦA CỘT 2, KHÔNG PHẢI POPUP)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="card p-5 sm:p-6 bg-surface-card border-2 border-primary-500/40 shadow-bento rounded-3xl space-y-4 animate-fade-in transition-all">
      {/* User Header */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full avatar-gradient-ring p-[2px] shrink-0">
            <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || 'Avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                user?.full_name?.[0]?.toUpperCase() || 'U'
              )}
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {user?.full_name || 'Bạn'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Chia sẻ với cộng đồng sinh viên</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-surface-muted transition-colors cursor-pointer"
          title="Đóng bảng đăng bài"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Selector: Thảo luận, Hỏi đáp, Tài liệu PDF */}
      <div className="flex items-center gap-2 p-1 bg-surface-muted rounded-2xl border border-surface-border text-xs">
        <button
          type="button"
          onClick={() => setPostType('discussion')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            postType === 'discussion'
              ? 'bg-primary-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Thảo luận</span>
        </button>

        <button
          type="button"
          onClick={() => setPostType('question')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            postType === 'question'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Hỏi đáp</span>
        </button>

        <button
          type="button"
          onClick={() => setPostType('document')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            postType === 'document'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Tài liệu PDF</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              postType === 'document'
                ? 'Tiêu đề tài liệu, giáo trình hoặc đề thi...'
                : postType === 'question'
                ? 'Tiêu đề câu hỏi bài tập cần giải đáp...'
                : 'Chủ đề bạn muốn thảo luận cùng mọi người...'
            }
            maxLength={300}
            className="input rounded-xl text-sm font-medium"
            required
            autoFocus
          />
        </div>

        {/* Content Textarea */}
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'document'
                ? 'Mô tả tóm tắt nội dung tài liệu, môn học, dạng bài tập hoặc lưu ý khi ôn thi...'
                : 'Bạn đang làm gì, vừa học được gì? Chia sẻ kiến thức, bài tập hoặc kinh nghiệm của bạn...'
            }
            rows={4}
            className="input rounded-xl text-sm leading-relaxed resize-y"
          />
        </div>

        {/* Upload Box for Document Type */}
        {postType === 'document' && (
          <div className="space-y-2 p-4 bg-emerald-500/5 rounded-2xl border-2 border-dashed border-emerald-500/30">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center p-5 rounded-xl border border-dashed text-center transition-all ${
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
                disabled={isSubmitting}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Kéo thả file PDF vào đây hoặc <span className="text-primary-600 dark:text-primary-400 underline">bấm để chọn</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Chỉ file PDF · Tối đa 10 MB
              </p>

              {pdfFile && (
                <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span className="truncate max-w-xs">{pdfFile.name}</span>
                  <span className="text-slate-400">({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subject & Tags Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Gắn với môn học / chủ đề
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input text-xs rounded-xl cursor-pointer"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tags liên quan (cách nhau dấu phẩy)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="java, oop, cnpm..."
              className="input text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Helper Note */}
        <p className="text-[11px] text-slate-400 leading-tight pt-1">
          Đăng nội dung học tập hoặc tài liệu bạn có quyền chia sẻ. Không quảng cáo thuần tuý, không đăng thông tin mật hoặc vi phạm bản quyền.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="btn-secondary text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary text-xs px-5 py-2 inline-flex items-center gap-2 rounded-xl cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đăng...</span>
              </>
            ) : postType === 'document' ? (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Tải lên PDF</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Đăng bài</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

