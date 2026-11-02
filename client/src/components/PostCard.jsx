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
    <article className="scroll-mt-24 overflow-hidden rounded-[20px] border border-[#E2E7DE] dark:border-[#3E4042] bg-white dark:bg-[#242526] p-4 sm:p-5 shadow-xs transition-all hover:border-[#16a34a]/40 dark:hover:border-[#22c55e]/40">
      {/* ── Top Header: Author + Meta ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          {/* Avatar with Gradient Ring */}
          {authorProfileUrl ? (
            <Link
              to={authorProfileUrl}
              className="shrink-0 avatar-gradient-ring p-[2px]"
              title={`Xem trang cá nhân ${post.author?.full_name || 'Tác giả'}`}
            >
              <div className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-[#16a34a] dark:text-[#2ECC71]">
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
            <div className="w-10 h-10 rounded-full bg-surface-muted text-[#16a34a] dark:text-[#2ECC71] font-bold flex items-center justify-center shrink-0 border border-surface-border">
              {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          {/* Author Details */}
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {authorProfileUrl ? (
                <Link
                  to={authorProfileUrl}
                  className="text-[14.5px] sm:text-[15px] font-bold text-content hover:text-[#16a34a] dark:hover:text-[#22c55e] transition-colors"
                >
                  {post.author?.full_name || 'Thành viên'}
                </Link>
              ) : (
                <span className="text-[14.5px] sm:text-[15px] font-bold text-content">
                  {post.author?.full_name || 'Thành viên'}
                </span>
              )}

              {(post.author?.university || post.author?.major) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-content-muted">
                  <span>·</span>
                  <GraduationCap className="w-3.5 h-3.5 text-[#16a34a] dark:text-[#2ECC71]" />
                  <span className="truncate max-w-[140px]">{post.author?.university || post.author?.major}</span>
                </span>
              )}
            </div>

            <span className="text-[11px] text-content-muted">
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
          <h2 className="font-bold text-content group-hover/title:underline decoration-2 underline-offset-2 transition-all line-clamp-2 text-[18px] sm:text-[19px] leading-snug tracking-tight">
            {post.title}
          </h2>
        </Link>

        {post.content && (
          <p className="text-xs sm:text-sm text-content-muted line-clamp-3 leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* ── Document PDF Visual Bento Card ── */}
      {post.post_type === 'document' && (
        <Link
          to={postUrl}
          className="mt-4 block rounded-2xl border border-surface-border bg-surface-muted/50 p-4 transition-all duration-200 hover:border-[#16a34a]/40 dark:hover:border-[#22c55e]/40 group/doc shadow-card"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#16a34a] dark:bg-[#22c55e] text-white dark:text-[#06110a] flex items-center justify-center shadow-xs group-hover/doc:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#15803d] dark:text-[#4ade80] bg-[#dcfce7] dark:bg-[#14532d]/40 px-2 py-0.5 rounded-full font-mono border border-[#bbf7d0] dark:border-[#166534]">
                    TÀI LIỆU PDF
                  </span>
                  <span className="text-[11px] text-content-muted">Bản mới nhất</span>
                </div>
                <h4 className="text-sm font-bold text-content truncate max-w-sm mt-0.5">
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
              <div className="w-8 h-8 rounded-full bg-surface-muted text-content-muted flex items-center justify-center group-hover/doc:bg-[#16a34a] group-hover/doc:text-white dark:group-hover/doc:bg-[#22c55e] dark:group-hover/doc:text-[#06110a] transition-colors border border-surface-border">
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
            <span className="inline-flex items-center gap-1.5 text-xs text-[#15803d] dark:text-[#4ade80] bg-[#dcfce7] dark:bg-[#14532d]/40 px-3 py-1 rounded-full border border-[#bbf7d0] dark:border-[#166534] font-semibold shadow-2xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{post.subject}</span>
            </span>
          )}

          {tagsList.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] text-content-muted bg-surface-muted px-2.5 py-1 rounded-full font-mono border border-surface-border transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* View counter */}
        <div className="flex items-center gap-1.5 text-xs text-content-muted font-medium">
          <Eye className="w-3.5 h-3.5" />
          <span>{post.view_count || 0} lượt xem</span>
        </div>
      </div>

      {/* ── Reaction Stats Row ── */}
      {(likesCount > 0 || (post.comment_count !== undefined && post.comment_count > 0)) && (
        <div className="mt-3.5 flex items-center justify-between text-[13px] text-[#56614f] dark:text-[#B0B3B8] px-1">
          <span>{likesCount > 0 ? `${likesCount} lượt thích` : ''}</span>
          <span>{post.comment_count !== undefined && post.comment_count > 0 ? `${post.comment_count} bình luận` : ''}</span>
        </div>
      )}

      {/* ── Grovelyn Grid-4 Action Bar ── */}
      <div className="mt-2.5 grid grid-cols-4 gap-1 border-t pt-1.5 border-[#E2E7DE] dark:border-[#3E4042]">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={likeMutation.isPending}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-colors max-sm:h-12 max-sm:flex-col max-sm:gap-0.5 max-sm:text-xs hover:bg-[#F2F4EF] dark:hover:bg-[#171717] cursor-pointer ${
            isLiked
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
          }`}
          aria-label={isLiked ? 'Bỏ thích' : 'Thích bài viết'}
        >
          <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>Thích</span>
        </button>

        {/* Comment Button (Links to discussion/detail) */}
        <Link
          to={postUrl}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-colors max-sm:h-12 max-sm:flex-col max-sm:gap-0.5 max-sm:text-xs hover:bg-[#F2F4EF] dark:hover:bg-[#171717] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white"
          aria-label="Xem bình luận"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Bình luận</span>
        </Link>

        {/* Bookmark Button (Keep exact test aria-label hook) */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          disabled={bookmarkMutation.isPending}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-colors max-sm:h-12 max-sm:flex-col max-sm:gap-0.5 max-sm:text-xs hover:bg-[#F2F4EF] dark:hover:bg-[#171717] cursor-pointer ${
            isBookmarked
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
          }`}
          aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span>Lưu</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShareClick}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] sm:text-[15px] font-semibold transition-colors max-sm:h-12 max-sm:flex-col max-sm:gap-0.5 max-sm:text-xs hover:bg-[#F2F4EF] dark:hover:bg-[#171717] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white cursor-pointer"
          aria-label="Chia sẻ liên kết bài viết"
          title="Sao chép liên kết bài viết"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>
      </div>
    </article>
  )
}
