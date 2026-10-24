import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { commentAPI, likeAPI, postAPI, bookmarkAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

const MAX_COMMENT = 2000
const TYPES = {
  question: '❓ Hỏi đáp',
  discussion: '💬 Thảo luận',
}
const stamp = value => {
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
      className={'btn-secondary min-h-10 px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ' + (bookmarked ? 'text-amber-400 border-amber-600/50 bg-amber-950/20' : '')}
      aria-label={bookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
    >
      <span aria-hidden="true">{bookmarked ? '🔖' : '📑'}</span>
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
    onSuccess: response => {
      setLiked(Boolean(response.data.liked))
      qc.invalidateQueries({ queryKey: key })
    },
    onError: error => toast.error(error.response?.data?.message || 'Không thể cập nhật lượt thích.'),
  })
  // Backend currently provides a count but no viewer-specific initial like state.
  // An unknown state must not be presented as an already-liked/unliked item.
  const label = liked === null ? 'Thích / Bỏ thích' : liked ? 'Đã thích' : 'Thích'
  const item = targetType === 'post' ? 'bài viết' : 'bình luận'
  return (
    <div className="flex items-center flex-wrap gap-2 text-sm">
      <button type="button" className={'btn-secondary min-h-10 px-3 py-2 text-sm ' + (liked ? 'text-pink-300' : '')}
        aria-label={'Thích hoặc bỏ thích ' + item} aria-pressed={liked === null ? 'mixed' : liked}
        title={liked === null ? 'Chưa có dữ liệu về trạng thái thích ban đầu của tài khoản' : undefined}
        onClick={() => toggle.mutate()} disabled={toggle.isPending}>
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span> {toggle.isPending ? 'Đang lưu...' : label}
      </button>
      <span className="text-slate-400" aria-live="polite">
        {isLoading ? '…' : isError ? 'Chưa tải được số thích' : String(count ?? 0) + ' lượt thích'}
      </span>
    </div>
  )
}

function CommentItem({ comment, user, depth, create, remove }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [reply, setReply] = useState('')
  const replies = Array.isArray(comment.replies) ? comment.replies : []
  const canRemove = Number(user?.id) === Number(comment.user_id) || user?.role === 'admin'
  const submitReply = async event => {
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
    <li className={depth ? 'ml-2 sm:ml-6 border-l-2 border-primary-800 pl-3 sm:pl-5' : ''}>
      <div className="rounded-xl bg-surface border border-surface-border p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden shadow" aria-hidden="true">
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
                <Link className="font-semibold text-sm text-primary-300 hover:text-primary-200 break-words"
                  to={'/profile/' + comment.author.id}>
                  {comment.author.full_name || 'Sinh viên'}
                </Link>
              ) : <span className="font-semibold text-sm">Sinh viên</span>}
              <span className="text-xs text-slate-500 ml-2">{stamp(comment.created_at)}</span>
            </div>
          </div>
          {canRemove && (
            <button type="button" className="text-xs text-red-300 hover:text-red-200 disabled:opacity-50 min-h-10 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label={'Xóa bình luận #' + comment.id} onClick={deleteItem}
              disabled={remove.isPending}>Xóa</button>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-slate-200 leading-6">{comment.content}</p>
        <div className="flex gap-3 items-center flex-wrap">
          <LikeButton targetType="comment" targetId={comment.id} />
          {depth === 0 && (
            <button type="button" className="text-xs text-primary-300 hover:text-primary-200 min-h-10 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-label="Trả lời bình luận" onClick={() => setReplyOpen(value => !value)}>
              {replyOpen ? 'Hủy trả lời' : '↩ Trả lời'}
            </button>
          )}
        </div>
        {replyOpen && (
          <form onSubmit={submitReply} className="space-y-2">
            <label htmlFor={'reply-' + comment.id} className="text-sm text-slate-300">Nội dung trả lời</label>
            <textarea id={'reply-' + comment.id} className="input resize-y" rows={3}
              value={reply} onChange={e => setReply(e.target.value)}
              maxLength={MAX_COMMENT} placeholder="Viết câu trả lời..." required />
            <button type="submit" className="btn-primary text-sm"
              disabled={!reply.trim() || create.isPending}>
              {create.isPending ? 'Đang gửi...' : 'Gửi trả lời'}
            </button>
          </form>
        )}
      </div>
      {depth === 0 && replies.length > 0 && (
        <ul aria-label="Các câu trả lời" className="space-y-3 mt-3">
          {replies.map(item => (
            <CommentItem key={item.id} comment={item} user={user} depth={1}
              create={create} remove={remove} />
          ))}
        </ul>
      )}
    </li>
  )
}

function Comments({ postId }) {
  const user = useAuthStore(state => state.user)
  const [draft, setDraft] = useState('')
  const qc = useQueryClient()
  const key = ['fe01-comments', postId]
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: key,
    queryFn: async () => (await commentAPI.getByPost(postId)).data.data,
    retry: false,
  })
  const create = useMutation({
    mutationFn: fields => commentAPI.create({ post_id: postId, ...fields }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Đã đăng bình luận.') },
    onError: error => toast.error(error.response?.data?.message || 'Không thể đăng bình luận.'),
  })
  const remove = useMutation({
    mutationFn: id => commentAPI.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Đã xóa bình luận.') },
    onError: error => toast.error(error.response?.data?.message || 'Không thể xóa bình luận.'),
  })
  const submit = async event => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || create.isPending) return
    try {
      await create.mutateAsync({ content, parent_id: null })
      setDraft('')
    } catch { /* Shown by onError. */ }
  }
  const roots = Array.isArray(data) ? data.filter(item => item.parent_id == null) : []
  const count = roots.reduce((n, item) => n + 1 + (Array.isArray(item.replies) ? item.replies.length : 0), 0)

  return (
    <section className="card space-y-5" aria-labelledby="fe01-comments-title">
      <h2 id="fe01-comments-title" className="text-xl font-bold">
        💬 Bình luận {isLoading ? '' : '(' + count + ')'}
      </h2>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="fe01-comment-input" className="block text-sm text-slate-300">Viết bình luận</label>
        <textarea id="fe01-comment-input" value={draft} onChange={e => setDraft(e.target.value)}
          maxLength={MAX_COMMENT} rows={4} className="input resize-y"
          placeholder="Chia sẻ ý kiến của bạn..." required />
        <div className="flex flex-wrap justify-between gap-2 items-center">
          <span className="text-xs text-slate-500">{draft.length}/{MAX_COMMENT} ký tự</span>
          <button type="submit" className="btn-primary" disabled={!draft.trim() || create.isPending}>
            {create.isPending ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </div>
      </form>
      <div className="border-t border-surface-border pt-5">
        {isLoading ? <p role="status" className="text-slate-400">Đang tải bình luận...</p> :
          isError ? (
            <div role="alert" className="space-y-2">
              <p className="text-slate-400">Không thể tải bình luận.</p>
              <button type="button" className="btn-secondary text-sm" onClick={() => refetch()}>Thử lại</button>
            </div>
          ) : roots.length === 0 ? (
            <p className="text-slate-400 text-sm">Chưa có bình luận. Hãy bắt đầu cuộc trò chuyện!</p>
          ) : (
            <ul aria-label="Danh sách bình luận" className="space-y-4">
              {roots.map(item => (
                <CommentItem key={item.id} comment={item} user={user} depth={0}
                  create={create} remove={remove} />
              ))}
            </ul>
          )}
      </div>
    </section>
  )
}

export default function PostDetailPage() {
  const { id } = useParams()
  const authenticated = useAuthStore(state => state.isAuthenticated)
  const validId = /^[1-9]\d*$/.test(id || '')
  const { data: post, isLoading, isError, error } = useQuery({
    queryKey: ['fe01-post', id],
    queryFn: async () => (await postAPI.getById(id)).data.data,
    enabled: authenticated && validId,
    retry: false,
    staleTime: 20000,
  })

  if (!validId) return (
    <section className="card text-center py-14 space-y-4" role="alert">
      <h1 className="text-xl font-bold">Đường dẫn bài viết không hợp lệ.</h1>
      <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
    </section>
  )
  if (!authenticated) return (
    <section className="card text-center py-14 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Đăng nhập để xem bài viết</h1>
      <p className="text-slate-400">Bài hỏi đáp và thảo luận dành cho thành viên đã đăng nhập.</p>
      <Link to="/login" className="btn-primary inline-block">Đăng nhập</Link>
    </section>
  )
  if (isLoading) return (
    <section className="card max-w-3xl mx-auto space-y-4 animate-pulse" role="status">
      <p className="text-slate-400">Đang tải bài viết...</p>
      <div className="h-7 bg-slate-700 rounded w-3/4" />
      <div className="h-4 bg-slate-700 rounded w-full" />
    </section>
  )
  if (isError) return (
    <section className="card text-center py-14 space-y-4 max-w-2xl mx-auto" role="alert">
      <h1 className="text-xl font-bold">
        {error?.response?.status === 404 ? 'Bài viết không tồn tại.' :
          error?.response?.status === 403 ? 'Bạn không có quyền xem bài viết.' :
          'Không thể tải bài viết.'}
      </h1>
      <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>
    </section>
  )
  if (!post || post.status !== 'active' || !TYPES[post.post_type]) return (
    <section className="card text-center py-14 space-y-4 max-w-2xl mx-auto">
      <h1 className="font-bold text-xl">Bài viết không khả dụng tại trang này.</h1>
      {post?.post_type === 'document' && post.status === 'active'
        ? <Link to={'/documents/' + post.id} className="btn-primary inline-block">Xem tài liệu</Link>
        : <Link to="/" className="btn-secondary inline-block">Về bảng tin</Link>}
    </section>
  )
  const tags = Array.isArray(post.tags) ? post.tags.filter(tag => typeof tag === 'string') : []
  return (
    <main className="max-w-3xl mx-auto space-y-6">
      <nav aria-label="Điều hướng bài viết">
        <Link className="text-sm text-primary-400 hover:text-primary-300" to="/">← Về bảng tin</Link>
      </nav>
      <article className="card space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <span className="badge-type">{TYPES[post.post_type]}</span>
          <span className="text-slate-500 text-xs">{stamp(post.created_at)}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words">{post.title}</h1>
        <div className="flex items-center gap-3 py-4 border-y border-surface-border">
          <span className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white shrink-0 overflow-hidden shadow" aria-hidden="true">
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
          </span>
          <div className="min-w-0">
            {post.author?.id ?
              <Link to={'/profile/' + post.author.id} className="font-medium hover:text-primary-300 break-words">
                {post.author.full_name || 'Sinh viên'}
              </Link> : <span>Sinh viên</span>}
            <p className="text-xs text-slate-500">Tác giả bài viết</p>
          </div>
        </div>
        {post.subject && <p className="text-sm text-slate-300">📚 Môn học: {post.subject}</p>}
        <p className="whitespace-pre-wrap break-words leading-7 text-slate-200">
          {post.content || <span className="text-slate-500 italic">Bài viết chưa có nội dung.</span>}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Thẻ bài viết">
            {tags.map((tag, i) => <span className="badge-type" key={tag + i}>#{tag}</span>)}
          </div>
        )}
        <div className="border-t border-surface-border pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <LikeButton targetType="post" targetId={post.id} />
            <BookmarkButton postId={post.id} />
          </div>
          <span className="text-xs text-slate-500">👁️ {post.view_count ?? 0} lượt xem</span>
        </div>
      </article>
      <Comments postId={post.id} />
    </main>
  )
}
