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
} from 'lucide-react'

const TYPE_CONFIG = {
  question: {
    label: 'Hỏi đáp',
    icon: HelpCircle,
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  },
  document: {
    label: 'Tài liệu',
    icon: FileText,
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
  },
  discussion: {
    label: 'Thảo luận',
    icon: MessageSquare,
    badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  },
}

export default function PostCard({ post }) {
  const qc = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Like & Bookmark state
  const [likesCount, setLikesCount] = useState(Number(post.like_count) || 0)
  const [isLiked, setIsLiked] = useState(null) // null = unknown until first user interaction
  const [isBookmarked, setIsBookmarked] = useState(false)

  const isFree = !post.price || parseFloat(post.price) === 0
  const typeConfig = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.discussion
  const TypeIcon = typeConfig.icon
  const postUrl = post.post_type === 'document' ? `/documents/${post.id}` : `/posts/${post.id}`
  const authorProfileUrl = post.author?.id ? `/profile/${post.author.id}` : (post.user_id ? `/profile/${post.user_id}` : null)

  const tagsList = Array.isArray(post.tags)
    ? post.tags
    : typeof post.tags === 'string'
    ? post.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => likeAPI.toggle('post', post.id),
    onSuccess: (res) => {
      const liked = Boolean(res.data?.liked)
      setIsLiked(liked)
      setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1))
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
      navigator.clipboard.writeText(fullUrl)
        .then(() => toast.success('Đã sao chép liên kết bài viết!'))
        .catch(() => toast.error('Không thể sao chép liên kết.'))
    } else {
      toast.success('Liên kết bài viết: ' + fullUrl)
    }
  }

  return (
    <article className="card card-hover group transition-all duration-200 bg-surface-card border border-surface-border rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-md">
      {/* ── Top Header & Author info ── */}
      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Author Avatar with link if available */}
        {authorProfileUrl ? (
          <Link to={authorProfileUrl} className="shrink-0" title={`Xem trang cá nhân ${post.author?.full_name || 'Tác giả'}`}>
            <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold flex items-center justify-center overflow-hidden border border-primary-200/60 dark:border-primary-800/60 shadow-xs">
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
          <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold flex items-center justify-center shrink-0 overflow-hidden border border-primary-200/60 dark:border-primary-800/60 shadow-xs">
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
        )}

        {/* Post Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header Metadata */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {authorProfileUrl ? (
                <Link
                  to={authorProfileUrl}
                  className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {post.author?.full_name || 'Thành viên'}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {post.author?.full_name || 'Thành viên'}
                </span>
              )}

              {(post.author?.university || post.author?.major) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  <span>·</span>
                  <GraduationCap className="w-3 h-3 text-slate-400" />
                  <span className="truncate max-w-[150px]">{post.author?.university || post.author?.major}</span>
                </span>
              )}

              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(post.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Type badge */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${typeConfig.badgeClass} shrink-0`}>
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
          </div>

          {/* Title */}
          <Link to={postUrl} className="block group">
            <h2 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 text-[15px] sm:text-base leading-snug">
              {post.title}
            </h2>
          </Link>

          {/* Text preview if available */}
          {post.content && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {post.content}
            </p>
          )}

          {/* Subject & Tags */}
          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.subject && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 bg-surface-muted px-2.5 py-0.5 rounded-md border border-surface-border font-medium">
                  <BookOpen className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  {post.subject}
                </span>
              )}
              {tagsList.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-md font-mono">
                  #{tag}
                </span>
              ))}
            </div>

            {/* View counter & Price badge */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1" title="Lượt xem">
                <Eye className="w-3.5 h-3.5" />
                <span>{post.view_count || 0}</span>
              </span>

              {post.post_type === 'document' && (
                <span className={isFree ? 'badge-free inline-flex items-center gap-1' : 'badge-paid inline-flex items-center gap-1'}>
                  {isFree ? (
                    <>
                      <Check className="w-3 h-3" />
                      Miễn phí
                    </>
                  ) : (
                    `${Number(post.price).toLocaleString('vi-VN')}đ`
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Social Action Bar (Facebook + LinkedIn style) ── */}
      <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-surface-border text-xs text-slate-600 dark:text-slate-300 gap-1">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={likeMutation.isPending}
          className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg hover:bg-surface-muted transition-colors font-medium cursor-pointer ${
            isLiked ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''
          }`}
          aria-label={isLiked ? 'Bỏ thích' : 'Thích bài viết'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          <span>{likesCount > 0 ? `${likesCount} Thích` : 'Thích'}</span>
        </button>

        {/* Comment Button (Links to discussion/detail) */}
        <Link
          to={postUrl}
          className="flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg hover:bg-surface-muted transition-colors font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600"
          aria-label="Xem bình luận"
        >
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>{post.comment_count !== undefined && post.comment_count > 0 ? `${post.comment_count} Bình luận` : 'Bình luận'}</span>
        </Link>

        {/* Bookmark Button */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          disabled={bookmarkMutation.isPending}
          className={`flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg hover:bg-surface-muted transition-colors font-medium cursor-pointer ${
            isBookmarked ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''
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
          className="flex-1 py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg hover:bg-surface-muted transition-colors font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 cursor-pointer"
          aria-label="Chia sẻ liên kết bài viết"
          title="Sao chép liên kết bài viết"
        >
          <Share2 className="w-4 h-4 text-slate-400" />
          <span>Chia sẻ</span>
        </button>
      </div>
    </article>
  )
}
