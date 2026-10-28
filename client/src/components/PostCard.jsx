import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { likeAPI, bookmarkAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import {
  HelpCircle,
  FileText,
  MessageSquare,
  BookOpen,
  Eye,
  Heart,
  Check,
  GraduationCap,
  Bookmark,
  BookmarkCheck,
  Share2,
  FileCode,
  DownloadCloud,
  Sparkles,
} from 'lucide-react'
import Badge, { TYPE_BADGE_CONFIG } from '@/components/common/Badge'

export default function PostCard({ post, initialBookmarked = false }) {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [likesCount, setLikesCount] = useState(Number(post.like_count) || 0)
  const [isLiked, setIsLiked] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)

  const isFree = !post.price || parseFloat(post.price) === 0
  const postUrl = post.post_type === 'document' ? `/documents/${post.id}` : `/posts/${post.id}`
  const authorProfileUrl = post.author?.id
    ? `/profile/${post.author.id}`
    : post.user_id
    ? `/profile/${post.user_id}`
    : null

  const tagsList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === 'string'
    ? post.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => likeAPI.toggle('post', post.id),
    onSuccess: (res) => {
      const liked = Boolean(res.data?.liked)
      setIsLiked(liked)
      setLikesCount((prev) => (liked ? prev + 1 : Math.max(0, prev - 1)))
      qc.invalidateQueries({ queryKey: ['fe01-likes', 'post', post.id] })
      toast.success(liked ? 'Đã thích bài viết!' : 'Đã bỏ thích bài viết.')
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
      toast.success(saved ? 'Đã lưu bài viết vào Bookmark!' : 'Đã bỏ lưu bài viết.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể lưu bài viết.')
    },
  })

  const handleLikeClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích bài viết.')
      return
    }
    likeMutation.mutate()
  }

  const handleBookmarkClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu bài viết.')
      return
    }
    bookmarkMutation.mutate()
  }

  const handleShareClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const fullUrl = `${window.location.origin}${postUrl}`
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(fullUrl)
        .then(() => toast.success('Đã sao chép liên kết bài viết!'))
        .catch(() => toast.error('Không thể sao chép liên kết.'))
    } else {
      toast.success('Liên kết bài viết: ' + fullUrl)
    }
  }

  return (
    <article className="card card-hover group p-5 sm:p-6 transition-all duration-300">
      {/* ── Top Header: Author + Meta ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          {/* Avatar with Gradient Ring */}
          {authorProfileUrl ? (
            <Link
              to={authorProfileUrl}
              className="shrink-0 avatar-gradient-ring p-[2px] transition-transform duration-200 group-hover:scale-105"
              title={`Xem trang cá nhân ${post.author?.full_name || 'Tác giả'}`}
            >
              <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600 dark:text-primary-300">
                {post.author?.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.full_name || 'Tác giả'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  post.author?.full_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
            </Link>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center shrink-0">
              {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          {/* Author Details */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {authorProfileUrl ? (
                <Link
                  to={authorProfileUrl}
                  className="text-sm font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {post.author?.full_name || 'Thành viên'}
                </Link>
              ) : (
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {post.author?.full_name || 'Thành viên'}
                </span>
              )}

              {(post.author?.university || post.author?.major) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>·</span>
                  <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
                  <span className="truncate max-w-[140px]">{post.author?.university || post.author?.major}</span>
                </span>
              )}
            </div>

            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {new Date(post.created_at).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Category Badge */}
        <Badge type={post.post_type} />
      </div>

      {/* ── Post Content Section ── */}
      <div className="mt-3.5 space-y-2">
        <Link to={postUrl} className="block group/title">
          <h2 className="font-bold text-slate-900 dark:text-white group-hover/title:text-primary-600 dark:group-hover/title:text-primary-400 transition-colors line-clamp-2 text-base sm:text-lg leading-snug">
            {post.title}
          </h2>
        </Link>

        {post.content && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* ── Document PDF Visual Bento Card (Inspired by Grovelyn Image 4 & 5) ── */}
      {post.post_type === 'document' && (
        <Link
          to={postUrl}
          className="mt-4 block rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-surface-card p-4 transition-all duration-200 hover:border-emerald-500/40 hover:shadow-glow-emerald group/doc"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover/doc:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                    TÀI LIỆU PDF
                  </span>
                  <span className="text-[11px] text-slate-400">v1.0 Bản mới nhất</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-sm mt-0.5">
                  {post.title}
                </h4>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className={isFree ? 'badge-free inline-flex items-center gap-1' : 'badge-paid inline-flex items-center gap-1'}>
                {isFree ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Miễn phí</span>
                  </>
                ) : (
                  `${Number(post.price).toLocaleString('vi-VN')}đ`
                )}
              </span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover/doc:bg-emerald-600 group-hover/doc:text-white transition-colors">
                <DownloadCloud className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── Subject & Tag Pills ── */}
      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.subject && (
            <span className="inline-flex items-center gap-1.5 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/40 px-3 py-1 rounded-full border border-primary-200/60 dark:border-primary-800/60 font-semibold shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-primary-500" />
              <span>{post.subject}</span>
            </span>
          )}

          {tagsList.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] text-slate-500 dark:text-slate-400 bg-surface-muted px-2.5 py-1 rounded-full font-mono hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* View counter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
          <Eye className="w-3.5 h-3.5" />
          <span>{post.view_count || 0} lượt xem</span>
        </div>
      </div>

      {/* ── Campus Pop Action Bar ── */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-surface-border text-xs text-slate-600 dark:text-slate-300 gap-1 sm:gap-2">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={likeMutation.isPending}
          className={`flex-1 py-2 px-2.5 flex items-center justify-center gap-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 font-semibold cursor-pointer ${
            isLiked ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'hover:text-rose-600'
          }`}
          aria-label={isLiked ? 'Bỏ thích' : 'Thích bài viết'}
        >
          <Heart className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          <span>{likesCount > 0 ? `${likesCount} Thích` : 'Thích'}</span>
        </button>

        {/* Comment Button (Links to discussion/detail) */}
        <Link
          to={postUrl}
          className="flex-1 py-2 px-2.5 flex items-center justify-center gap-2 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-600 transition-all duration-200 font-semibold text-slate-600 dark:text-slate-300"
          aria-label="Xem bình luận"
        >
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>{post.comment_count !== undefined && post.comment_count > 0 ? `${post.comment_count} Bình luận` : 'Bình luận'}</span>
        </Link>

        {/* Bookmark Button (Keep exact test aria-label hook) */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          disabled={bookmarkMutation.isPending}
          className={`flex-1 py-2 px-2.5 flex items-center justify-center gap-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-200 font-semibold cursor-pointer ${
            isBookmarked ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : 'hover:text-amber-600'
          }`}
          aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
          ) : (
            <Bookmark className="w-4 h-4 text-slate-400" />
          )}
          <span>{isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareClick}
          className="flex-1 py-2 px-2.5 flex items-center justify-center gap-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 transition-all duration-200 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
          aria-label="Chia sẻ liên kết bài viết"
          title="Sao chép liên kết bài viết"
        >
          <Share2 className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </button>
      </div>
    </article>
  )
}
