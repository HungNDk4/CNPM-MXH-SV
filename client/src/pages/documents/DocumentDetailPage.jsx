import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

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

  if (isLoading) return <div className="card text-slate-400">Đang tải thông tin tài liệu...</div>
  if (isError) return (
    <div className="card text-center py-12 space-y-3">
      <p className="text-slate-300">
        {error?.response?.status === 404 ? 'Tài liệu không tồn tại hoặc đã bị ẩn.' : 'Không thể tải thông tin tài liệu.'}
      </p>
      <Link to="/" className="btn-secondary inline-block">Về trang chủ</Link>
    </div>
  )
  if (!post || post.post_type !== 'document' || Number(post.price) !== 0 ||
      post.status !== 'active') {
    return <div className="card text-center text-slate-400">Tài liệu không khả dụng.</div>
  }

  return (
    <article className="max-w-3xl mx-auto space-y-5">
      <Link to="/" className="text-sm text-primary-400 hover:text-primary-300">← Danh sách tài liệu</Link>
      <div className="card space-y-5">
        <div className="flex justify-between gap-3 items-start flex-wrap">
          <span className="badge-type">📄 Tài liệu PDF</span>
          <span className="badge-free">✅ Miễn phí</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 break-words">{post.title}</h1>
        <p className="text-sm text-slate-400">
          Người chia sẻ: {post.author?.full_name || 'Sinh viên'}
          {post.created_at ? ' · ' + new Date(post.created_at).toLocaleDateString('vi-VN') : ''}
        </p>
        {post.subject && <p className="text-sm text-slate-300">📚 Môn học: {post.subject}</p>}
        {post.content && <p className="text-slate-300 whitespace-pre-wrap break-words">{post.content}</p>}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, idx) => <span className="badge-type" key={idx}>#{tag}</span>)}
          </div>
        )}
        <div className="pt-5 border-t border-surface-border space-y-3">
          {isAuthenticated ? (
            <button type="button" className="btn-primary"
              onClick={download} disabled={downloading}>
              {downloading ? 'Đang tải PDF...' : '⬇️ Tải PDF'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-300">Bạn cần đăng nhập để tải PDF. Thông tin tài liệu được xem miễn phí.</p>
              <Link to="/login" className="btn-primary inline-block">Đăng nhập để tải</Link>
            </div>
          )}
          <p className="text-xs text-slate-500">
            File chỉ tải qua API xác thực; link lưu trữ riêng tư không được công khai.
          </p>
        </div>
      </div>
    </article>
  )
}
