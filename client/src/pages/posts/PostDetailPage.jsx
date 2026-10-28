import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { commentAPI, likeAPI, postAPI, bookmarkAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Heart,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  CornerDownRight,
  Send,
  HelpCircle,
  FileText,
  BookOpen,
  Eye,
  AlertCircle,
  Lock,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import Badge, { TYPE_BADGE_CONFIG } from '@/components/common/Badge'

const MAX_COMMENT = 2000
const TYPE_CONFIG = {
  question: {
    label: 'Hỏi đáp',
    icon: HelpCircle,
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  },
  discussion: {
    label: 'Thảo luận',
    icon: MessageSquare,
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
  },
  document: {
    label: 'Tài liệu',
    icon: FileText,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  },
}

const stamp = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function BookmarkButton({ postId }) {
  const qc = useQueryClient()
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const [bookmarked, setBookmarked] = useState(false)

  const toggle = useMutation({
    mutationFn: () => (bookmarked ? bookmarkAPI.remove(postId) : bookmarkAPI.save(postId)),
    onSuccess: (res) => {
      const isSaved = res.data.data.bookmarked
      setBookmarked(isSaved)
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
      toast.success(isSaved ? 'Đã lưu bài viết!' : 'Đã bỏ lưu bài viết.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể lưu bài viết.')
    },
  })

  if (!authenticated) return null

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      className={`btn-secondary min-h-10 px-4 py-2 text-xs sm:text-sm flex items-center gap-2 rounded-xl transition-all ${
        bookmarked
          ? 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40'
          : ''
      }`}
      aria-label={bookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
    >
      {bookmarked ? (
        <BookmarkCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" aria-hidden="true" />
      ) : (
        <Bookmark className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
      )}
      <span>{toggle.isPending ? 'Đang lưu...' : bookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
    </button>
  )
}

function LikeButton({ targetType, targetId }) {
  const qc = useQueryClient()
  const [liked, setLiked] = useState(null)
  const key = ['fe01-likes', targetType, targetId]

  const { data: count, isLoading, isError } = useQuery({
    queryKey: key,
    queryFn: async () => (await likeAPI.count(targetType, targetId)).data.data.count,
    enabled: Boolean(targetId),
    retry: false,
  })

  const toggle = useMutation({
    mutationFn: () => likeAPI.toggle(targetType, targetId),
    onSuccess: (response) => {
      setLiked(Boolean(response.data.liked))
      qc.invalidateQueries({ queryKey: key })
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Không thể cập nhật lượt thích.'),
  })

  const label = liked === null ? 'Thích / Bỏ thích' : liked ? 'Đã thích' : 'Thích'
  const item = targetType === 'post' ? 'bài viết' : 'bình luận'

  return (
    <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm">
      <button
        type="button"
        className={`btn-secondary min-h-10 px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-2 rounded-xl transition-all ${
          liked
            ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40'
            : 'text-slate-700 dark:text-slate-200'
        }`}
        aria-label={'Thích hoặc bỏ thích ' + item}
        aria-pressed={liked === null ? 'mixed' : liked}
        title={liked === null ? 'Chưa có dữ liệu về trạng thái thích ban đầu của tài khoản' : undefined}
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
      >
        <Heart
          className={`w-4 h-4 transition-transform ${liked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'}`}
          aria-hidden="true"
        />
        <span className="font-semibold">{toggle.isPending ? 'Đang lưu...' : label}</span>
      </button>
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium" aria-live="polite">
        {isLoading ? '…' : isError ? 'Chưa tải được số thích' : `${count ?? 0} lượt thích`}
      </span>
    </div>
  )
}

function CommentItem({ comment, user, depth, create, remove }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [reply, setReply] = useState('')
  const replies = Array.isArray(comment.replies) ? comment.replies : []
  const canRemove = Number(user?.id) === Number(comment.user_id) || user?.role === 'admin'

  const submitReply = async (event) => {
    event.preventDefault()
    const content = reply.trim()
    if (!content || create.isPending) return
    try {
      await create.mutateAsync({ content, parent_id: comment.id })
      setReply('')
      setReplyOpen(false)
    } catch { /* Shared mutation displays the HTTP error. */ }
  }

  const deleteItem = async () => {
    if (!window.confirm('Bạn muốn xóa bình luận này?')) return
    try { await remove.mutateAsync(comment.id) } catch { /* Shown by onError. */ }
  }

  return (
    <li className={depth ? 'ml-3 sm:ml-8 mt-3 pl-3 sm:pl-4 border-l-2 border-indigo-500/20 dark:border-indigo-500/30' : ''}>
      <div className={`rounded-2xl p-4 sm:p-5 space-y-3 transition-all shadow-bento ${
        depth === 0
          ? 'bg-surface-card border border-surface-border'
          : 'bg-surface-muted/50 border border-surface-border'
      }`}>
        {/* Comment Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full avatar-gradient-ring p-[1.5px] shrink-0" aria-hidden="true">
              <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
                {comment.author?.avatar_url ? (
                  <img
                    src={comment.author.avatar_url}
                    alt={comment.author.full_name || 'Sinh viên'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  comment.author?.full_name?.[0]?.toUpperCase() || 'S'
                )}
              </div>
            </div>
            <div className="min-w-0">
              {comment.author?.id ? (
                <Link
                  className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors break-words"
                  to={'/profile/' + comment.author.id}
                >
                  {comment.author.full_name || 'Sinh viên'}
                </Link>
              ) : (
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Sinh viên</span>
              )}
              <span className="text-[11px] text-slate-400 ml-2">{stamp(comment.created_at)}</span>
            </div>
          </div>

          {canRemove && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-2 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              aria-label={'Xóa bình luận #' + comment.id}
              onClick={deleteItem}
              disabled={remove.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          )}
        </div>

        {/* Comment Body */}
        <p className="whitespace-pre-wrap break-words text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed pl-0.5">
          {comment.content}
        </p>

        {/* Actions Row */}
        <div className="flex gap-3 items-center flex-wrap pt-1 border-t border-surface-border/50">
          <LikeButton targetType="comment" targetId={comment.id} />
          {depth === 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 transition-colors"
              aria-label="Trả lời bình luận"
              onClick={() => setReplyOpen((value) => !value)}
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>{replyOpen ? 'Hủy trả lời' : 'Trả lời'}</span>
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyOpen && (
          <form onSubmit={submitReply} className="space-y-2 mt-3 pt-3 border-t border-surface-border">
            <label htmlFor={'reply-' + comment.id} className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Nội dung trả lời
            </label>
            <textarea
              id={'reply-' + comment.id}
              className="input resize-y text-xs sm:text-sm rounded-xl"
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={MAX_COMMENT}
              placeholder="Viết câu trả lời thảo luận..."
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyOpen(false)}
                className="btn-secondary text-xs py-1.5 px-3 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-1.5 px-4 rounded-xl"
                disabled={create.isPending}
              >
                Gửi trả lời
              </button>
            </div>
          </form>
        )}
      </div>

      {replies.length > 0 && (
        <ul className="space-y-3">
          {replies.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              user={user}
              depth={depth + 1}
              create={create}
              remove={remove}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function Comments({ postId }) {
  const qc = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const [root, setRoot] = useState('')
  const key = ['fe01-comments', postId]

  const { data, isLoading, isError, error } = useQuery({
    queryKey: key,
    queryFn: async () => (await commentAPI.getByPost(postId)).data.data,
    enabled: Boolean(postId && authenticated),
    retry: false,
  })

  const create = useMutation({
    mutationFn: ({ content, parent_id }) => commentAPI.create(postId, { content, parent_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      toast.success('Bình luận đã được gửi.')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể gửi bình luận.'),
  })

  const remove = useMutation({
    mutationFn: (commentId) => commentAPI.delete(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      toast.success('Bình luận đã được xóa.')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xóa bình luận.'),
  })

  const submitRoot = async (event) => {
    event.preventDefault()
    const content = root.trim()
    if (!content || create.isPending) return
    try {
      await create.mutateAsync({ content, parent_id: null })
      setRoot('')
    } catch { /* toast shown */ }
  }

  const comments = Array.isArray(data) ? data : []

  return (
    <section className="card p-5 sm:p-7 space-y-6" aria-label="Bình luận và thảo luận">
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span>Bình luận ({comments.length})</span>
        </h2>
      </div>

      {/* Input box */}
      <form onSubmit={submitRoot} className="space-y-3">
        <label htmlFor="root-comment" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          Viết bình luận của bạn
        </label>
        <textarea
          id="root-comment"
          className="input resize-y text-xs sm:text-sm rounded-2xl"
          rows={3}
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          maxLength={MAX_COMMENT}
          placeholder="Tham gia thảo luận hoặc đặt câu hỏi mở rộng..."
          required
        />
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-400">Tối đa 2.000 ký tự</span>
          <button
            type="submit"
            disabled={create.isPending || !root.trim()}
            className="btn-primary text-xs sm:text-sm py-2 px-5 rounded-xl inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{create.isPending ? 'Đang gửi...' : 'Gửi bình luận'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <p className="text-center text-slate-400 text-xs py-8">Đang tải bình luận...</p>
      ) : isError ? (
        <p className="text-center text-rose-500 text-xs py-8">Không thể tải bình luận.</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 space-y-2 text-slate-400">
          <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-xs">Chưa có bình luận nào. Hãy là người đầu tiên trao đổi!</p>
        </div>
      ) : (
        <ul className="space-y-4 pt-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              depth={0}
              create={create}
              remove={remove}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const validId = /^[1-9]\d*$/.test(String(id || ''))

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '', subject: '', tags: '' })

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['post-detail', id],
    queryFn: async () => (await postAPI.getById(id)).data.data,
    enabled: Boolean(validId && authenticated),
    retry: false,
  })

  const canModify = authenticated && post && (Number(user?.id) === Number(post.user_id) || user?.role === 'admin')

  const startEdit = () => {
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      subject: post.subject || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '',
    })
    setIsEditing(true)
  }

  const editPostMutation = useMutation({
    mutationFn: (payload) => postAPI.update(post.id, payload),
    onSuccess: (res) => {
      toast.success('Đã cập nhật bài viết thành công!')
      setIsEditing(false)
      qc.invalidateQueries({ queryKey: ['post-detail', id] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật bài viết.')
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: () => postAPI.delete(post.id),
    onSuccess: () => {
      toast.success('Đã xóa bài viết thành công.')
      navigate('/')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết.')
    },
  })

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editForm.title.trim()) {
      toast.error('Tiêu đề không được để trống.')
      return
    }
    const tagsArray = editForm.tags
      ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []

    editPostMutation.mutate({
      title: editForm.title.trim(),
      content: editForm.content.trim() || null,
      subject: editForm.subject.trim() || null,
      tags: tagsArray.length > 0 ? tagsArray : null,
    })
  }

  const handleDeletePost = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
      deletePostMutation.mutate()
    }
  }

  if (!validId) return (
    <section className="card text-center py-14 space-y-4" role="alert">
      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Đường dẫn bài viết không hợp lệ.</h1>
      <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
    </section>
  )

  if (!authenticated) return (
    <section className="card text-center py-14 space-y-4 max-w-xl mx-auto">
      <Lock className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng nhập để xem bài viết</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Bài hỏi đáp và thảo luận dành cho thành viên đã đăng nhập.</p>
      <Link to="/login" className="btn-primary inline-block">Đăng nhập ngay</Link>
    </section>
  )

  if (isLoading) return (
    <section className="card max-w-3xl mx-auto space-y-4 animate-pulse p-6" role="status">
      <p className="text-slate-500 text-sm">Đang tải bài viết...</p>
      <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
    </section>
  )

  if (isError) return (
    <section className="card text-center py-14 space-y-4 max-w-2xl mx-auto" role="alert">
      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        {error?.response?.status === 404
          ? 'Bài viết không tồn tại.'
          : error?.response?.status === 403
          ? 'Bạn không có quyền xem bài viết.'
          : 'Không thể tải bài viết.'}
      </h1>
      <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
    </section>
  )

  if (!post || post.status !== 'active' || !TYPE_CONFIG[post.post_type]) return (
    <section className="card text-center py-14 space-y-4 max-w-2xl mx-auto">
      <h1 className="font-bold text-xl text-slate-900 dark:text-white">Bài viết không khả dụng tại trang này.</h1>
      {post?.post_type === 'document' && post.status === 'active' ? (
        <Link to={'/documents/' + post.id} className="btn-primary inline-block">Xem tài liệu</Link>
      ) : (
        <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
      )}
    </section>
  )

  const tags = Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === 'string') : []

  return (
    <main className="max-w-4xl mx-auto space-y-6">
      {/* Navigation bar */}
      <nav aria-label="Điều hướng bài viết" className="flex items-center justify-between">
        <Link
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          to="/"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bảng tin</span>
        </Link>
      </nav>

      {/* Post or Edit Mode */}
      {isEditing ? (
        <article className="card p-6 sm:p-8 space-y-5 animate-fade-in" aria-label="Chỉnh sửa bài viết">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary-600" />
              <span>Chỉnh sửa bài viết</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn-secondary text-xs"
            >
              Hủy
            </button>
          </div>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-title"
                type="text"
                required
                maxLength={300}
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="input"
                placeholder="Nhập tiêu đề..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-subject" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Môn học
              </label>
              <input
                id="edit-subject"
                type="text"
                maxLength={200}
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                className="input"
                placeholder="Ví dụ: CSDL, Công nghệ phần mềm..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-tags" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Thẻ (phân cách bằng dấu phẩy)
              </label>
              <input
                id="edit-tags"
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                className="input"
                placeholder="react, tailwind, cnpm..."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-content" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Nội dung bài viết
              </label>
              <textarea
                id="edit-content"
                rows={6}
                maxLength={10000}
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                className="input resize-y"
                placeholder="Chi tiết câu hỏi hoặc chủ đề thảo luận..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary text-xs sm:text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={editPostMutation.isPending}
                className="btn-primary text-xs sm:text-sm"
              >
                {editPostMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </article>
      ) : (
        <article className="card p-6 sm:p-8 space-y-6">
          {/* Top meta row */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge type={post.post_type} />
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">{stamp(post.created_at)}</span>
            </div>

            {/* FE-05: Owner/Admin actions */}
            {canModify && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 rounded-xl hover:text-primary-600"
                  aria-label="Sửa bài viết"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa bài viết</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={deletePostMutation.isPending}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  aria-label="Xóa bài viết"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletePostMutation.isPending ? 'Đang xóa...' : 'Xóa bài viết'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Post Title (Heading hook for test) */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug break-words tracking-tight">
            {post.title}
          </h1>

          {/* Author info header */}
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
            <div className="min-w-0 flex-1">
              {post.author?.id ? (
                <Link to={'/profile/' + post.author.id} className="font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors break-words text-sm sm:text-base">
                  {post.author.full_name || 'Sinh viên'}
                </Link>
              ) : (
                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Sinh viên</span>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {post.author?.university || post.author?.major || 'Tác giả bài viết'}
              </p>
            </div>
          </div>

          {/* Subject tag */}
          {post.subject && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 px-3 py-1.5 rounded-full border border-primary-200/60 dark:border-primary-800/60">
              <BookOpen className="w-4 h-4 text-primary-500" />
              <span>Môn học: {post.subject}</span>
            </div>
          )}

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {post.content || <span className="text-slate-400 italic">Bài viết chưa có nội dung.</span>}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2" aria-label="Thẻ bài viết">
              {tags.map((tag, i) => (
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-surface-muted px-3 py-1 rounded-full border border-surface-border" key={tag + i}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Footer Interaction */}
          <div className="border-t border-surface-border pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <LikeButton targetType="post" targetId={post.id} />
              <BookmarkButton postId={post.id} />
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Eye className="w-4 h-4" />
              <span>{post.view_count ?? 0} lượt xem</span>
            </span>
          </div>
        </article>
      )}

      {/* Comments Section */}
      <Comments postId={post.id} />
    </main>
  )
}
