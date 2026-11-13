import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postAPI, documentAPI } from '@/services/api'
import Modal from '@/components/common/Modal'
import {
  MessageSquare,
  HelpCircle,
  FileText,
  FileUp,
  X,
  Loader2,
  Sparkles,
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
  'Khác',
]

export default function QuickComposerModal({ isOpen, onClose, user, initialType = 'discussion' }) {
  const queryClient = useQueryClient()
  const [postType, setPostType] = useState(initialType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('Công nghệ phần mềm')
  const [tagsInput, setTagsInput] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    // Parse tags
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

      // Reset and close
      setTitle('')
      setContent('')
      setTagsInput('')
      setPdfFile(null)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể đăng bài viết lúc này.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-4">
        {/* Header Avatar & User Name */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full avatar-gradient-ring p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
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

          
        </div>

        {/* Post Type Selector Tabs (Inspired by Image 4) */}
        <div className="flex items-center gap-2 p-1 bg-surface-muted rounded-2xl border border-surface-border text-xs">
          <button
            type="button"
            onClick={() => setPostType('discussion')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
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
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
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
            className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
              postType === 'document'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tài liệu PDF</span>
          </button>
        </div>

        {/* Composer Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Title */}
          <div className="space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                postType === 'question'
                  ? 'Đặt tiêu đề câu hỏi ngắn gọn, rõ ràng...'
                  : postType === 'document'
                  ? 'Tên tài liệu, giáo trình hoặc đề cương ôn tập...'
                  : 'Chủ đề bạn muốn thảo luận cùng mọi người...'
              }
              className="input py-2 text-sm font-semibold rounded-xl bg-surface-muted/50 border-surface-border focus:bg-surface-card"
              required
            />
          </div>

          {/* Content Textarea (Image 4 Style) */}
          <div className="space-y-1">
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bạn đang làm gì, vừa học được gì? Chia sẻ kiến thức, bài tập hoặc kinh nghiệm của bạn..."
              className="input py-2.5 text-sm rounded-xl resize-none bg-surface-muted/50 border-surface-border focus:bg-surface-card"
            />
          </div>

          {/* Subject & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                Gắn với môn học / chủ đề
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input py-1.5 text-xs rounded-xl bg-surface-muted/50 border-surface-border"
              >
                {SUBJECT_OPTIONS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                Tags liên quan (cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="java, oop, cnpm..."
                className="input py-1.5 text-xs rounded-xl bg-surface-muted/50 border-surface-border"
              />
            </div>
          </div>

          {/* Attachment Box (Image 4 Style) */}
          {postType === 'document' && (
            <div className="p-3.5 rounded-2xl bg-surface-muted/60 border border-dashed border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="quick-pdf-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-card hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-2xs"
                >
                  <FileUp className="w-4 h-4" />
                  <span>{pdfFile ? 'Thay đổi file PDF' : 'Đính kèm file PDF'}</span>
                </label>
                <span className="text-[11px] text-slate-500">Tối đa 1 tệp, dưới 10 MB</span>
              </div>
              <input
                id="quick-pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              {pdfFile && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="truncate font-semibold max-w-xs">{pdfFile.name}</span>
                  <span className="text-[11px] text-emerald-600 shrink-0">
                    ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Helper Guidelines (Image 4 Style) */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
            Đăng nội dung học tập hoặc tài liệu bạn có quyền chia sẻ. Không quảng cáo thuần tuý, không đăng thông tin mật hoặc vi phạm bản quyền.
          </p>

          {/* Footer Actions (Image 4 Style: Huỷ & Đăng) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary text-xs py-2 px-4 rounded-full font-semibold"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs py-2 px-6 rounded-full font-bold shadow-md shadow-primary/25 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <span>Đăng bài</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

