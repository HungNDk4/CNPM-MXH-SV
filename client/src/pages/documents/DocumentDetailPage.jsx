import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, CheckCircle2, BookOpen, Download, Loader2, AlertCircle, Calendar, User } from 'lucide-react'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const [downloading, setDownloading] = useState(false)
  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['document-detail', id],
    queryFn: async () => {
      const response = await postAPI.getById(id)
      return response.data.data
    },
    retry: false,
  })

  const download = async () => {
    if (!isAuthenticated || !post || downloading) return
    setDownloading(true)
    try {
      const response = await documentAPI.download(post.id)
      const contentType = response.headers['content-type'] || ''
      if (!contentType.includes('application/pdf') || !(response.data instanceof Blob)) {
        throw new Error('Máy chủ không trả về file PDF hợp lệ.')
      }
      const blobUrl = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'tai-lieu-' + post.id + '.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
      toast.success('Đã bắt đầu tải tài liệu.')
    } catch (err) {
      // Backend checks JWT + current document status again on each download.
      toast.error(err.response?.status === 404
        ? 'Tài liệu không còn khả dụng.'
        : err.response?.data?.message || err.message || 'Không thể tải PDF.')
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card text-center py-16 space-y-3" role="status">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-slate-500 dark:text-slate-400">Đang tải thông tin tài liệu...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card text-center py-12 space-y-3" role="alert">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-slate-700 dark:text-slate-300 font-medium">
          {error?.response?.status === 404 ? 'Tài liệu không tồn tại hoặc đã bị ẩn.' : 'Không thể tải thông tin tài liệu.'}
        </p>
        <Link to="/" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>
    )
  }

  if (!post || post.post_type !== 'document' || Number(post.price) !== 0 ||
      post.status !== 'active') {
    return (
      <div className="card text-center py-12 text-slate-500 dark:text-slate-400">
        Tài liệu không khả dụng hoặc đã bị gỡ.
      </div>
    )
  }

  return (
    <article className="max-w-3xl mx-auto space-y-5">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Danh sách tài liệu
      </Link>

      <div className="card space-y-6">
        <div className="flex justify-between gap-3 items-center flex-wrap">
          <span className="badge-type inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Tài liệu PDF
          </span>
          <span className="badge-free inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Miễn phí
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 break-words leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 py-2 border-y border-surface-border">
          <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden shadow-xs" aria-hidden="true">
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.full_name || 'Tác giả'}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              post.author?.full_name?.[0]?.toUpperCase() || <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {post.author?.full_name || 'Sinh viên'}
            </p>
            {post.created_at && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                Đăng ngày {new Date(post.created_at).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>

        {post.subject && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-muted/50 border border-surface-border text-sm font-medium text-slate-700 dark:text-slate-300">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Môn học: <strong className="text-slate-900 dark:text-slate-100">{post.subject}</strong></span>
          </div>
        )}

        {post.content && (
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-base leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </div>
        )}

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map((tag, idx) => (
              <span className="badge-type" key={idx}>#{tag}</span>
            ))}
          </div>
        )}

        <div className="pt-6 border-t border-surface-border space-y-4">
          {isAuthenticated ? (
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-base shadow-sm"
              onClick={download}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tải PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Tải PDF xuống
                </>
              )}
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Bạn cần đăng nhập để tải file PDF. Thông tin tài liệu được xem miễn phí.
              </p>
              <Link to="/login" className="btn-primary inline-block text-sm">
                Đăng nhập để tải
              </Link>
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            File chỉ tải qua API xác thực; link lưu trữ riêng tư không được công khai.
          </p>
        </div>
      </div>
    </article>
  )
}
