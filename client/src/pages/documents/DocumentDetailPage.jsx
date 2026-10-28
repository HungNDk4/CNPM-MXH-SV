import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  BookOpen,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  ShieldCheck,
  FileCheck,
  Lock,
  Sparkles,
  DownloadCloud,
} from 'lucide-react'

export default function DocumentDetailPage() {
  const { id } = useParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
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
      toast.success('Đã bắt đầu tải tài liệu PDF!')
    } catch (err) {
      toast.error(
        err.response?.status === 404
          ? 'Tài liệu không còn khả dụng.'
          : err.response?.data?.message || err.message || 'Không thể tải PDF.'
      )
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card text-center py-20 space-y-4 max-w-2xl mx-auto" role="status">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
        <p className="text-slate-500 font-medium">Đang tải thông tin tài liệu...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card text-center py-16 space-y-4 max-w-2xl mx-auto" role="alert">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <p className="text-slate-800 dark:text-slate-200 font-bold text-lg">
          {error?.response?.status === 404 ? 'Tài liệu không tồn tại hoặc đã bị ẩn.' : 'Không thể tải thông tin tài liệu.'}
        </p>
        <Link to="/" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
      </div>
    )
  }

  if (!post || post.post_type !== 'document' || Number(post.price) !== 0 || post.status !== 'active') {
    return (
      <div className="card text-center py-16 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
        Tài liệu không khả dụng hoặc đã bị gỡ.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh sách tài liệu</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Main Document View (8 Cols) ── */}
        <article className="lg:col-span-8 card p-6 sm:p-8 space-y-6">
          {/* Header Badges */}
          <div className="flex justify-between gap-3 items-center flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Tài liệu PDF sinh viên</span>
            </span>
            <span className="badge-free inline-flex items-center gap-1.5 px-3 py-1 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Miễn phí tải</span>
            </span>
          </div>

          {/* Title (Heading hook for tests) */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white break-words leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Author Card */}
          <div className="flex items-center gap-3.5 py-4 border-y border-surface-border">
            <div className="w-12 h-12 rounded-full avatar-gradient-ring p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-sm font-bold text-primary-600">
                {post.author?.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Tác giả'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  post.author?.full_name?.[0]?.toUpperCase() || 'S'
                )}
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {post.author?.full_name || 'Sinh viên'}
              </p>
              {post.created_at && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Đăng ngày {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                </p>
              )}
            </div>
          </div>

          {/* Subject info */}
          {post.subject && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/50 text-sm font-semibold text-primary-700 dark:text-primary-300">
              <BookOpen className="w-4 h-4 text-primary-500" />
              <span>Môn học: <strong className="font-bold">{post.subject}</strong></span>
            </div>
          )}

          {/* Content Description */}
          {post.content && (
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </div>
          )}

          {/* Tags */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {post.tags.map((tag, idx) => (
                <span className="text-xs font-mono bg-surface-muted text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-surface-border" key={idx}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Download Action Section */}
          <div className="pt-6 border-t border-surface-border space-y-4">
            {isAuthenticated ? (
              <div className="card p-5 bg-gradient-to-r from-emerald-500/10 via-surface-card to-teal-500/5 border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-glow-emerald shrink-0">
                    <DownloadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tài liệu đã sẵn sàng</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">File định dạng PDF (tối đa 10 MB)</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-glow-emerald text-white px-6 py-3 text-sm font-bold rounded-xl inline-flex items-center gap-2 self-stretch sm:self-auto justify-center"
                  onClick={download}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tải PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Tải PDF xuống</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Bạn cần đăng nhập tài khoản sinh viên để tải file PDF.</span>
                </p>
                <Link to="/login" className="btn-primary text-xs sm:text-sm inline-block">
                  Đăng nhập để tải
                </Link>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center sm:text-left">
              File được kiểm duyệt an toàn, truyền tải qua giao thức riêng tư và không để lộ liên kết công khai.
            </p>
          </div>
        </article>

        {/* ── Right Column: Info & Safety Standards (4 Cols) ── */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="card p-5 space-y-3.5 bg-gradient-to-b from-surface-card to-surface-muted/50">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Tiêu chuẩn bảo mật tài liệu</span>
            </div>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
              <li>Lưu trữ phân vùng bảo vệ riêng biệt.</li>
              <li>Xác thực chữ ký SHA-256 chống giả mạo file.</li>
              <li>Chặn truy cập trái phép và kiểm tra quyền tác giả.</li>
            </ul>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Gợi ý học tập</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sau khi tham khảo tài liệu, bạn có thể chia sẻ câu hỏi hoặc ghi chú ôn tập lên bảng tin để thảo luận cùng bạn bè.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
