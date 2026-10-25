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
} from 'lucide-react'

const MAX_COMMENT = 2000
const TYPE_CONFIG = {
  question: {
    label: 'Hỏi đáp',
    icon: HelpCircle,
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  },
  discussion: {
    label: 'Thảo luận',
    icon: MessageSquare,
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  },
  document: {
    label: 'Tài liệu',
    icon: FileText,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  },
}

const stamp = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN')
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
      className={`btn-secondary min-h-9 px-3 py-1.5 text-xs sm:text-sm flex items-center gap-1.5 transition-colors ${
        bookmarked ? 'text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60' : ''
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
        className={`btn-secondary min-h-9 px-3 py-1.5 inline-flex items-center gap-1.5 transition-colors ${
          liked ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60' : 'text-slate-700 dark:text-slate-200'
        }`}
        aria-label={'Thích hoặc bỏ thích ' + item}
        aria-pressed={liked === null ? 'mixed' : liked}
        title={liked === null ? 'Chưa có dữ liệu về trạng thái thích ban đầu của tài khoản' : undefined}
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
      >
        <Heart
          className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
          aria-hidden="true"
        />
        <span>{toggle.isPending ? 'Đang lưu...' : label}</span>
      </button>
      <span className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
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
    <li className={depth ? 'ml-3 sm:ml-7 mt-2 pl-3 sm:pl-4 border-l-2 border-surface-border' : ''}>
      <div className={`rounded-xl p-3.5 sm:p-4 space-y-2.5 transition-all ${
        depth === 0
          ? 'bg-surface-muted/60 border border-surface-border'
          : 'bg-surface-card border border-surface-border shadow-subtle'
      }`}>
        {/* Comment Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold flex items-center justify-center shrink-0 border border-primary-200/60 dark:border-primary-800/60 overflow-hidden text-xs shadow-subtle" aria-hidden="true">
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
            <div className="min-w-0">
              {comment.author?.id ? (
                <Link
                  className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors break-words"
                  to={'/profile/' + comment.author.id}
                >
                  {comment.author.full_name || 'Sinh viên'}
                </Link>
              ) : (
                <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">Sinh viên</span>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-2">{stamp(comment.created_at)}</span>
            </div>
          </div>

          {canRemove && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-1 rounded-md transition-colors disabled:opacity-50 inline-flex items-center gap-1"
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
        <div className="flex gap-3 items-center flex-wrap pt-1">
          <LikeButton targetType="comment" targetId={comment.id} />
          {depth === 0 && (
            <button
              type="button"
              className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-primary-400"
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
            <label htmlFor={'reply-' + comment.id} className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
              Nội dung trả lời
            </label>
            <textarea
              id={'reply-' + comment.id}
              className="input resize-y text-xs sm:text-sm"
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              maxLength={MAX_COMMENT}
              placeholder="Viết câu trả lời..."
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyOpen(false)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary text-xs py-1.5 px-3"
                disabled={!reply.trim() || create.isPending}
              >
                {create.isPending ? 'Đang gửi...' : 'Gửi trả lời'}
              </button>
            </div>
          </form>
        )}
      </div>

      {depth === 0 && replies.length > 0 && (
        <ul aria-label="Các câu trả lời" className="space-y-2.5 mt-2.5">
          {replies.map((item) => (
            <CommentItem
              key={item.id}
              comment={item}
              user={user}
              depth={1}
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
  const user = useAuthStore((state) => state.user)
  const [draft, setDraft] = useState('')
  const qc = useQueryClient()
  const key = ['fe01-comments', postId]

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => (await commentAPI.getByPost(postId)).data.data,
    retry: false,
  })

  const create = useMutation({
    mutationFn: (fields) => commentAPI.create({ post_id: postId, ...fields }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      toast.success('Đã đăng bình luận.')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Không thể đăng bình luận.'),
  })

  const remove = useMutation({
    mutationFn: (id) => commentAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key })
      toast.success('Đã xóa bình luận.')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Không thể xóa bình luận.'),
  })

  const submit = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || create.isPending) return
    try {
      await create.mutateAsync({ content, parent_id: null })
      setDraft('')
    } catch { /* Shown by onError. */ }
  }

  const roots = Array.isArray(data) ? data.filter((item) => item.parent_id == null) : []
  const count = roots.reduce((n, item) => n + 1 + (Array.isArray(item.replies) ? item.replies.length : 0), 0)

  return (
    <section className="card bg-surface-card border border-surface-border rounded-xl p-5 sm:p-6 shadow-sm space-y-5" aria-labelledby="fe01-comments-title">
      <h2 id="fe01-comments-title" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <span>Bình luận</span>
        {!isLoading && <span className="text-slate-500 dark:text-slate-400 text-sm font-normal">({count})</span>}
      </h2>

      {/* Main Comment Form */}
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="fe01-comment-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Viết bình luận
        </label>
        <textarea
          id="fe01-comment-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={3}
          className="input resize-y text-sm bg-surface-muted/60 border-surface-border focus:bg-surface-card"
          placeholder="Chia sẻ ý kiến hoặc câu trả lời của bạn..."
          required
        />
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {draft.length}/{MAX_COMMENT} ký tự
          </span>
          <button
            type="submit"
            className="btn-primary inline-flex items-center gap-1.5 text-sm px-4 py-2"
            disabled={!draft.trim() || create.isPending}
          >
            <Send className="w-4 h-4" />
            <span>{create.isPending ? 'Đang gửi...' : 'Gửi bình luận'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="border-t border-surface-border pt-5">
        {isLoading ? (
          <p role="status" className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">Đang tải bình luận...</p>
        ) : isError ? (
          <div role="alert" className="text-center py-6 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Không thể tải bình luận.</p>
            <button type="button" className="btn-secondary text-xs" onClick={() => refetch()}>
              Thử lại
            </button>
          </div>
        ) : roots.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 space-y-1">
            <p className="text-slate-700 dark:text-slate-200 font-medium text-sm">Chưa có bình luận nào.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Hãy là người đầu tiên chia sẻ câu trả lời hoặc thảo luận!</p>
          </div>
        ) : (
          <ul aria-label="Danh sách bình luận" className="space-y-3 sm:space-y-4">
            {roots.map((item) => (
              <CommentItem
                key={item.id}
                comment={item}
                user={user}
                depth={0}
                create={create}
                remove={remove}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const currentUser = useAuthStore((state) => state.user)
  const validId = /^[1-9]\d*$/.test(id || '')

  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['fe01-post', id],
    queryFn: async () => (await postAPI.getById(id)).data.data,
    enabled: authenticated && validId,
    retry: false,
    staleTime: 20000,
  })

  const canModify = currentUser && post && (Number(currentUser.id) === Number(post.user_id) || currentUser.role === 'admin')

  // Edit State & Mutations
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '', subject: '', tags: '' })

  const startEdit = () => {
    setEditForm({
      title: post.title || '',
      content: post.content || '',
      subject: post.subject || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
    })
    setIsEditing(true)
  }

  const editPostMutation = useMutation({
    mutationFn: (payload) => postAPI.update(post.id, payload),
    onSuccess: (res) => {
      queryClient.setQueryData(['fe01-post', id], res.data.data)
      setIsEditing(false)
      toast.success('Cập nhật bài viết thành công!')
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
    <section className="card bg-surface-card border border-surface-border rounded-xl text-center py-14 space-y-4 shadow-sm" role="alert">
      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Đường dẫn bài viết không hợp lệ.</h1>
      <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
    </section>
  )

  if (!authenticated) return (
    <section className="card bg-surface-card border border-surface-border rounded-xl text-center py-14 space-y-4 max-w-xl mx-auto shadow-sm">
      <Lock className="w-10 h-10 text-primary-600 dark:text-primary-400 mx-auto" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng nhập để xem bài viết</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm">Bài hỏi đáp và thảo luận dành cho thành viên đã đăng nhập.</p>
      <Link to="/login" className="btn-primary inline-block">Đăng nhập ngay</Link>
    </section>
  )

  if (isLoading) return (
    <section className="card bg-surface-card border border-surface-border rounded-xl max-w-3xl mx-auto space-y-4 animate-pulse p-6 shadow-sm" role="status">
      <p className="text-slate-500 dark:text-slate-400 text-sm">Đang tải bài viết...</p>
      <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
    </section>
  )

  if (isError) return (
    <section className="card bg-surface-card border border-surface-border rounded-xl text-center py-14 space-y-4 max-w-2xl mx-auto shadow-sm" role="alert">
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
    <section className="card bg-surface-card border border-surface-border rounded-xl text-center py-14 space-y-4 max-w-2xl mx-auto shadow-sm">
      <h1 className="font-bold text-xl text-slate-900 dark:text-white">Bài viết không khả dụng tại trang này.</h1>
      {post?.post_type === 'document' && post.status === 'active' ? (
        <Link to={'/documents/' + post.id} className="btn-primary inline-block">Xem tài liệu</Link>
      ) : (
        <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
      )}
    </section>
  )

  const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.discussion
  const TypeIcon = typeConfig.icon
  const tags = Array.isArray(post.tags) ? post.tags.filter((tag) => typeof tag === 'string') : []

  return (
    <main className="max-w-3xl mx-auto space-y-5">
      {/* Back button */}
      <nav aria-label="Điều hướng bài viết">
        <Link className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" to="/">
          <ArrowLeft className="w-4 h-4" />
          <span>Về bảng tin</span>
        </Link>
      </nav>

      {isEditing ? (
        <article className="card bg-surface-card border border-surface-border rounded-xl p-5 sm:p-6 shadow-sm space-y-5 animate-fade-in" aria-label="Chỉnh sửa bài viết">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
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
              <label htmlFor="edit-title" className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
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
              <label htmlFor="edit-subject" className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
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
              <label htmlFor="edit-tags" className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
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
              <label htmlFor="edit-content" className="text-sm font-medium text-slate-700 dark:text-slate-300 block">
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
                className="btn-secondary text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={editPostMutation.isPending}
                className="btn-primary text-sm"
              >
                {editPostMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </article>
      ) : (
        <article className="card bg-surface-card border border-surface-border rounded-xl p-5 sm:p-7 shadow-sm space-y-5">
          {/* Top meta row */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${typeConfig.badgeClass}`}>
                <TypeIcon className="w-3.5 h-3.5" />
                {typeConfig.label}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">{stamp(post.created_at)}</span>
            </div>

            {/* FE-05: Owner/Admin actions */}
            {canModify && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 hover:text-primary-600 dark:hover:text-primary-400"
                  aria-label="Sửa bài viết"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={deletePostMutation.isPending}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  aria-label="Xóa bài viết"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletePostMutation.isPending ? 'Đang xóa...' : 'Xóa'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Post Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug break-words tracking-tight">
            {post.title}
          </h1>

          {/* Author info header */}
          <div className="flex items-center gap-3 py-3 border-y border-surface-border">
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold flex items-center justify-center shrink-0 border border-primary-200/60 dark:border-primary-800/60 overflow-hidden text-sm shadow-subtle" aria-hidden="true">
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
            <div className="min-w-0">
              {post.author?.id ? (
                <Link to={'/profile/' + post.author.id} className="font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors break-words text-sm sm:text-base">
                  {post.author.full_name || 'Sinh viên'}
                </Link>
              ) : (
                <span className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Sinh viên</span>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">Tác giả bài viết</p>
            </div>
          </div>

          {/* Subject tag */}
          {post.subject && (
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-surface-muted px-2.5 py-1 rounded-md border border-surface-border">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Môn học: {post.subject}</span>
            </div>
          )}

          {/* Content */}
          <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-800 dark:text-slate-200 text-[15px] sm:text-base">
            {post.content || <span className="text-slate-400 dark:text-slate-500 italic">Bài viết chưa có nội dung.</span>}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1" aria-label="Thẻ bài viết">
              {tags.map((tag, i) => (
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-md" key={tag + i}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Footer Interaction */}
          <div className="border-t border-surface-border pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <LikeButton targetType="post" targetId={post.id} />
              <BookmarkButton postId={post.id} />
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
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
