import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentAPI, postAPI, commentAPI, likeAPI, bookmarkAPI, adminAPI } from '@/services/api'
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
  ShieldCheck,
  Sparkles,
  DownloadCloud,
  Eye,
  Heart,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  CornerDownRight,
  Send,
  Trash2,
  Lock,
  AlertTriangle,
} from 'lucide-react'

const MAX_COMMENT = 2000

export default function DocumentDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const [downloading, setDownloading] = useState(false)

  // Local engagement state initialized from post data
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  // Comment input states
  const [rootCommentText, setRootCommentText] = useState('')
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyText, setReplyText] = useState('')

  const isAdmin = currentUser?.role === 'admin'

  // Query document metadata (supports admin inspection of suppressed documents)
  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['document-detail', id, isAdmin],
    queryFn: async () => {
      try {
        const response = await postAPI.getById(id)
        return response.data.data
      } catch (err) {
        if (isAdmin && err.response?.status === 404) {
          const res = await adminAPI.getPostDetail(id)
          return res.data.data
        }
        throw err
      }
    },
    retry: false,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  })

  const isSuppressed = Boolean(post && post.status && post.status !== 'active')

  // Synchronize local like and bookmark state when post data arrives
  useEffect(() => {
    if (post) {
      setLikesCount(Number(post.like_count) || 0)
      setIsLiked(Boolean(post.is_liked))
      setIsBookmarked(Boolean(post.is_bookmarked))
    }
  }, [post])

  // Scroll to comments section if URL contains #comments hash
  useEffect(() => {
    if (window.location.hash === '#comments') {
      setTimeout(() => {
        const el = document.getElementById('comments')
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          const input = document.getElementById('document-root-comment')
          input?.focus()
        }
      }, 250)
    }
  }, [id])

  // Query comments for this document only when not suppressed
  const { data: rawComments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['document-comments', id],
    queryFn: async () => {
      try {
        const res = await commentAPI.getByPost(id)
        return res.data?.data || []
      } catch {
        return []
      }
    },
    enabled: Boolean(id && !isSuppressed),
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  })

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => likeAPI.toggle('post', post.id),
    onSuccess: (res) => {
      const nowLiked = Boolean(res.data?.liked)
      setIsLiked(nowLiked)
      setLikesCount((prev) => (nowLiked ? prev + 1 : Math.max(0, prev - 1)))
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post-like-count', post.id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật lượt thích.')
    },
  })

  // Bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: () => (isBookmarked ? bookmarkAPI.remove(post.id) : bookmarkAPI.save(post.id)),
    onSuccess: (res) => {
      const saved = Boolean(res.data?.data?.bookmarked)
      setIsBookmarked(saved)
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success(saved ? 'Đã lưu tài liệu!' : 'Đã bỏ lưu tài liệu.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể lưu tài liệu.')
    },
  })

  // Comment submission mutation
  const commentMutation = useMutation({
    mutationFn: ({ content, parent_id }) => commentAPI.create({ post_id: post.id, content, parent_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document-comments', id] })
      qc.invalidateQueries({ queryKey: ['post-comments', id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
      setRootCommentText('')
      setReplyText('')
      setReplyingToId(null)
      toast.success('Bình luận đã được gửi.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi bình luận.')
    },
  })

  // Comment delete mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => commentAPI.delete(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document-comments', id] })
      qc.invalidateQueries({ queryKey: ['post-comments', id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Đã xóa bình luận.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa bình luận.')
    },
  })

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích tài liệu.')
      return
    }
    likeMutation.mutate()
  }

  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu tài liệu.')
      return
    }
    bookmarkMutation.mutate()
  }

  const handleRootCommentSubmit = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để bình luận.')
      return
    }
    const trimmed = rootCommentText.trim()
    if (!trimmed) return
    commentMutation.mutate({ content: trimmed, parent_id: null })
  }

  const handleReplySubmit = (e, parentId) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để trả lời.')
      return
    }
    const trimmed = replyText.trim()
    if (!trimmed) return
    commentMutation.mutate({ content: trimmed, parent_id: parentId })
  }

  const handleDeleteComment = (commentId) => {
    if (window.confirm('Bạn muốn xóa bình luận này?')) {
      deleteCommentMutation.mutate(commentId)
    }
  }

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

  const isVisible = post && post.post_type === 'document' && Number(post.price) === 0 && (post.status === 'active' || isAdmin)

  if (!isVisible) {
    return (
      <div className="card text-center py-16 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
        Tài liệu không khả dụng hoặc đã bị gỡ.
      </div>
    )
  }

  const commentsList = Array.isArray(rawComments) ? rawComments : []
  const totalCommentsCount = commentsList.length + commentsList.reduce((acc, c) => acc + (c.replies?.length || 0), 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Admin Mode Inspection Banner */}
      {isSuppressed && (
        <div className="card p-4 sm:p-5 border-2 border-amber-500/80 bg-amber-500/10 dark:bg-amber-950/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">Chế độ xem Quản trị viên</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Tài liệu này đang ở trạng thái <strong>{post.status === 'hidden' ? 'Đã ẩn (hidden)' : 'Đã xóa (deleted)'}</strong> và không hiển thị với người dùng thông thường.
              </p>
            </div>
          </div>
          <Link
            to="/admin/posts"
            className="btn-primary text-xs py-2 px-4 rounded-xl shrink-0 whitespace-nowrap"
          >
            Quản trị bài viết &rarr;
          </Link>
        </div>
      )}

      {/* Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh sách tài liệu</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Column: Main Document View & Comments (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-6">
          <article className="card p-6 sm:p-8 space-y-6">
            {/* Header Badges */}
            <div className="flex justify-between gap-3 items-center flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#166534]">
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
              <div className="w-12 h-12 rounded-full avatar-gradient-ring p-[2px] shrink-0 aspect-square">
                <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-sm font-bold text-primary-600 aspect-square">
                  {post.author?.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.full_name || 'Tác giả'}
                      className="w-full h-full object-cover rounded-full aspect-square"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    post.author?.full_name?.[0]?.toUpperCase() || 'S'
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                {post.author?.id ? (
                  <Link
                    to={'/profile/' + post.author.id}
                    className="font-bold text-slate-900 dark:text-white hover:text-[#16a34a] dark:hover:text-[#22c55e] transition-colors break-words text-sm sm:text-base block truncate"
                  >
                    {post.author.full_name || 'Sinh viên'}
                  </Link>
                ) : (
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {post.author?.full_name || 'Sinh viên'}
                  </p>
                )}
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
                <div className="card p-5 bg-surface-card border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#16a34a] dark:bg-[#22c55e] text-white dark:text-[#06110a] flex items-center justify-center shadow-2xs shrink-0">
                      <DownloadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-content text-sm">Tài liệu đã sẵn sàng</h4>
                      <p className="text-xs text-content-muted">File định dạng PDF (tối đa 10 MB)</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-primary px-6 py-3 text-sm font-bold rounded-xl inline-flex items-center gap-2 self-stretch sm:self-auto justify-center"
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

            {/* Engagement Action Bar */}
            <div className="border-t border-surface-border pt-4 flex flex-wrap items-center justify-between gap-4">
              {isSuppressed ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tài liệu đang {post.status === 'hidden' ? 'bị ẩn' : 'đã xóa'} • {likesCount} lượt thích (chỉ đọc)</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={handleLikeClick}
                    disabled={likeMutation.isPending}
                    className={`btn-secondary min-h-10 px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-2 rounded-xl transition-all duration-200 cursor-pointer group active:scale-95 ${
                      isLiked
                        ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 shadow-2xs font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                    }`}
                    aria-label={isLiked ? 'Bỏ thích' : 'Thích tài liệu'}
                  >
                    <Heart
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-115 active:scale-125 ${
                        isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400 group-hover:text-rose-500'
                      }`}
                    />
                    <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-1">
                      ({likesCount})
                    </span>
                  </button>

                  {/* Bookmark Button */}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={handleBookmarkClick}
                      disabled={bookmarkMutation.isPending}
                      className={`btn-secondary min-h-10 px-4 py-2 text-xs sm:text-sm flex items-center gap-2 rounded-xl transition-all duration-200 cursor-pointer group active:scale-95 ${
                        isBookmarked
                          ? 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 shadow-2xs font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:text-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                      }`}
                      aria-label={isBookmarked ? 'Bỏ lưu tài liệu' : 'Lưu tài liệu'}
                    >
                      {isBookmarked ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500 transition-transform duration-200 group-hover:scale-115" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-transform duration-200 group-hover:scale-115" />
                      )}
                      <span>{isBookmarked ? 'Đã lưu' : 'Lưu tài liệu'}</span>
                    </button>
                  )}
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Eye className="w-4 h-4" />
                <span>{post.view_count ?? 0} lượt xem</span>
              </span>
            </div>
          </article>

          {/* ── Comments Section ── */}
          {isSuppressed ? (
            <div className="card p-6 border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl flex items-start gap-3.5 text-amber-900 dark:text-amber-200 text-sm">
              <Lock className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-amber-950 dark:text-amber-100">
                  Khu vực tương tác và bình luận tạm khóa
                </div>
                <div className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                  Tài liệu này đang ở trạng thái <span className="font-mono font-bold text-amber-950 dark:text-amber-100">[{post.status}]</span>. Bạn đang xem với tư cách Quản trị viên phục vụ công tác kiểm duyệt. Theo quy định bảo mật hệ thống, tính năng thích, lưu và bình luận không khả dụng trên nội dung chưa được kích hoạt.
                </div>
              </div>
            </div>
          ) : (
            <section id="comments" className="card p-5 sm:p-7 space-y-6 scroll-mt-24" aria-label="Bình luận và thảo luận tài liệu">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span>Bình luận ({totalCommentsCount})</span>
              </h2>
            </div>

            {/* Comment Form or Guest Login Prompt */}
            {!isAuthenticated ? (
              <div className="p-4 rounded-2xl bg-surface-muted/60 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Đăng nhập để tham gia thảo luận và gửi bình luận về tài liệu này.
                </p>
                <Link to="/login" className="btn-primary text-xs py-2 px-4 rounded-xl shrink-0 inline-flex items-center justify-center">
                  Đăng nhập ngay
                </Link>
              </div>
            ) : (
              <form onSubmit={handleRootCommentSubmit} className="space-y-3">
                <label htmlFor="document-root-comment" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Viết bình luận của bạn
                </label>
                <textarea
                  id="document-root-comment"
                  className="input resize-y text-xs sm:text-sm rounded-2xl"
                  rows={3}
                  value={rootCommentText}
                  onChange={(e) => setRootCommentText(e.target.value)}
                  maxLength={MAX_COMMENT}
                  placeholder="Tham gia thảo luận hoặc đặt câu hỏi về tài liệu này..."
                  required
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Tối đa 2.000 ký tự</span>
                  <button
                    type="submit"
                    disabled={commentMutation.isPending || !rootCommentText.trim()}
                    className="btn-primary text-xs sm:text-sm py-2 px-5 rounded-xl inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{commentMutation.isPending ? 'Đang gửi...' : 'Gửi bình luận'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <p className="text-center text-slate-400 text-xs py-6">Đang tải bình luận...</p>
            ) : commentsList.length === 0 ? (
              <div className="text-center py-8 space-y-2 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">Chưa có bình luận nào cho tài liệu này. Hãy là người đầu tiên trao đổi!</p>
              </div>
            ) : (
              <ul className="space-y-4 pt-1" aria-label="Danh sách bình luận tài liệu">
                {commentsList.map((comment) => {
                  const canRemoveRoot = currentUser?.id && (Number(currentUser.id) === Number(comment.user_id) || currentUser.role === 'admin')
                  const isReplying = replyingToId === comment.id
                  const replies = Array.isArray(comment.replies) ? comment.replies : []

                  return (
                    <li key={comment.id} className="space-y-3">
                      <div className="rounded-2xl p-4 sm:p-5 space-y-3 bg-surface-card border border-surface-border shadow-xs">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full avatar-gradient-ring p-[1.5px] shrink-0">
                              <div className="relative w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600 aspect-square">
                                <span>{comment.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                {comment.author?.avatar_url && (
                                  <img
                                    src={comment.author.avatar_url}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover rounded-full"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {comment.author?.full_name || 'Thành viên'}
                              </span>
                              {comment.created_at && (
                                <span className="text-[11px] text-slate-400 ml-2">
                                  {new Date(comment.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </div>

                          {canRemoveRoot && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deleteCommentMutation.isPending}
                              className="text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                              aria-label={'Xóa bình luận #' + comment.id}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Xóa</span>
                            </button>
                          )}
                        </div>

                        {/* Content */}
                        <p className="whitespace-pre-wrap break-words text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-0.5">
                          {comment.content}
                        </p>

                        {/* Reply trigger button */}
                        {isAuthenticated && (
                          <div className="pt-1 border-t border-surface-border/50">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingToId(isReplying ? null : comment.id)
                                setReplyText('')
                              }}
                              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 py-1 px-2.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <CornerDownRight className="w-3.5 h-3.5" />
                              <span>{isReplying ? 'Hủy' : 'Trả lời'}</span>
                            </button>
                          </div>
                        )}

                        {/* Inline Reply Form */}
                        {isReplying && (
                          <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="space-y-2 pt-2 border-t border-surface-border">
                            <textarea
                              className="input resize-y text-xs sm:text-sm rounded-xl"
                              rows={2}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Viết câu trả lời..."
                              required
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReplyingToId(null)}
                                className="btn-secondary text-xs py-1 px-3 rounded-xl cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="submit"
                                disabled={commentMutation.isPending || !replyText.trim()}
                                className="btn-primary text-xs py-1 px-4 rounded-xl cursor-pointer"
                              >
                                Gửi trả lời
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {/* Nested Replies */}
                      {replies.length > 0 && (
                        <ul className="ml-4 sm:ml-8 space-y-2.5 pl-3 border-l-2 border-emerald-500/20 dark:border-emerald-500/30">
                          {replies.map((reply) => {
                            const canRemoveReply = currentUser?.id && (Number(currentUser.id) === Number(reply.user_id) || currentUser.role === 'admin')
                            return (
                              <li key={reply.id} className="rounded-2xl p-3.5 space-y-2 bg-surface-muted/50 border border-surface-border shadow-2xs">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative w-7 h-7 rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600 border border-surface-border shrink-0 aspect-square">
                                      <span>{reply.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                                      {reply.author?.avatar_url && (
                                        <img src={reply.author.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                      )}
                                    </div>
                                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                      {reply.author?.full_name || 'Thành viên'}
                                    </span>
                                  </div>
                                  {canRemoveReply && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteComment(reply.id)}
                                      disabled={deleteCommentMutation.isPending}
                                      className="text-xs text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                                      aria-label={'Xóa câu trả lời #' + reply.id}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words pl-0.5">
                                  {reply.content}
                                </p>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
        </div>

        {/* ── Right Column: Author Bento, Info & Safety Standards (4 Cols) ── */}
        <aside className="lg:col-span-4 space-y-5 sticky top-20">
          {/* Author Bento Card */}
          <div className="card p-5 space-y-4 bg-surface-card border border-surface-border rounded-[20px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-content-muted">Tác giả tài liệu</div>
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full avatar-gradient-ring p-[2px] shrink-0 aspect-square">
                <div className="relative w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden font-bold text-base text-[#16a34a] dark:text-[#2ECC71] aspect-square">
                  <span>{post.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                  {post.author?.avatar_url && (
                    <img
                      src={post.author.avatar_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover rounded-full aspect-square"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                {post.author?.id ? (
                  <Link
                    to={'/profile/' + post.author.id}
                    className="font-bold text-sm sm:text-base text-content hover:text-[#16a34a] dark:hover:text-[#22c55e] transition-colors block truncate"
                  >
                    {post.author?.full_name || 'Sinh viên'}
                  </Link>
                ) : (
                  <span className="font-bold text-sm sm:text-base text-content block truncate">
                    {post.author?.full_name || 'Sinh viên'}
                  </span>
                )}
                <p className="text-xs text-content-muted truncate">
                  {post.author?.university && post.author?.major
                    ? post.author.university + ' · ' + post.author.major
                    : post.author?.university || post.author?.major || 'Tác giả tài liệu'}
                </p>
              </div>
            </div>
          </div>

          {/* Safety Standards Card */}
          <div className="card p-5 space-y-3.5 bg-gradient-to-b from-surface-card to-surface-muted/50 rounded-[20px] border border-surface-border">
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

          {/* Study Suggestions Card */}
          <div className="card p-5 space-y-3 rounded-[20px] border border-surface-border">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Gợi ý học tập</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sau khi tham khảo tài liệu, bạn có thể tham gia bình luận trao đổi bên dưới hoặc chia sẻ ghi chú lên bảng tin để thảo luận cùng bạn bè.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
