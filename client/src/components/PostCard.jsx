import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { likeAPI, bookmarkAPI, commentAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import {
  FileText,
  MessageSquare,
  Heart,
  Bookmark,
  BookmarkCheck,
  Share2,
  Check,
  DownloadCloud,
  Send,
  Folder,
  ArrowRight,
  CornerDownRight,
  HelpCircle,
  Trash2,
  Flag,
} from 'lucide-react'
import Badge from '@/components/common/Badge'
import ReportPostModal from '@/components/post/ReportPostModal'

/**
 * Format relative timestamp in Vietnamese (e.g. "Vừa xong", "15 phút trước", "2 giờ trước")
 */
function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Vừa xong'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} ngày trước`

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function PostCard({ post, initialBookmarked = false, onDelete }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuthStore()

  // Input ref for comment composer auto-focus
  const commentInputRef = useRef(null)

  // Like & Bookmark state
  const [likesCount, setLikesCount] = useState(Number(post.like_count) || 0)
  const [isLiked, setIsLiked] = useState(post.is_liked !== undefined ? Boolean(post.is_liked) : false)
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked || (post.is_bookmarked !== undefined ? Boolean(post.is_bookmarked) : false))
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null) // { id: number, authorName: string }
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [showComments, setShowComments] = useState(true)

  // Sync state if props change (from optimized feed query)
  useEffect(() => {
    if (typeof post.is_liked === 'boolean') {
      setIsLiked(post.is_liked)
    }
    if (typeof post.is_bookmarked === 'boolean') {
      setIsBookmarked(post.is_bookmarked)
    }
  }, [post.is_liked, post.is_bookmarked])

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

  // Synchronize local like count directly from post DTO
  useEffect(() => {
    if (typeof post.like_count === 'number') {
      setLikesCount(post.like_count)
    }
  }, [post.like_count])

  // Fetch comments to populate inline thread & exact real comment count
  const { data: rawComments = [] } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      try {
        const res = await commentAPI.getByPost(post.id)
        return Array.isArray(res.data?.data) ? res.data.data : []
      } catch {
        return []
      }
    },
    enabled: true, // Always enabled so comments load reliably for everyone
    staleTime: 30000,
  })

  // De-duplicate comments list to prevent duplicated renders
  const uniqueComments = useMemo(() => {
    const seen = new Set()
    return rawComments.filter((c) => {
      if (!c?.id || seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [rawComments])

  // Total comment count calculation from real database records (root + replies)
  const totalComments = useMemo(() => {
    const directCount = uniqueComments.length + uniqueComments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)
    return Math.max(Number(post.comment_count) || 0, directCount)
  }, [uniqueComments, post.comment_count])

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => likeAPI.toggle('post', post.id),
    onSuccess: (res) => {
      const liked = Boolean(res.data?.liked)
      setIsLiked(liked)
      setLikesCount((prev) => (liked ? prev + 1 : Math.max(0, prev - 1)))
      qc.invalidateQueries({ queryKey: ['post-like-count', post.id] })
      qc.invalidateQueries({ queryKey: ['fe01-likes', 'post', post.id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post-detail', String(post.id)] })
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
      qc.invalidateQueries({ queryKey: ['posts'] })
      qc.invalidateQueries({ queryKey: ['post-detail', String(post.id)] })
      toast.success(saved ? 'Đã lưu bài viết vào Bookmark!' : 'Đã bỏ lưu bài viết.')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể lưu bài viết.')
    },
  })

  // Inline Quick Comment & Reply mutation
  const commentMutation = useMutation({
    mutationFn: (data) => commentAPI.create(data),
    onSuccess: () => {
      setCommentText('')
      setReplyingTo(null)
      qc.invalidateQueries({ queryKey: ['post-comments', post.id] })
      qc.invalidateQueries({ queryKey: ['fe01-comments', post.id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Đã gửi bình luận!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể gửi bình luận.')
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

  const handleReplyClick = (targetComment, rootParentId = null) => {
    const effectiveParentId = rootParentId || targetComment.parent_id || targetComment.id
    setReplyingTo({
      id: effectiveParentId,
      authorName: targetComment.author?.full_name || 'thành viên',
    })
    setCommentText(`@${targetComment.author?.full_name || 'thành viên'} `)
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 50)
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để bình luận.')
      return
    }
    const trimmed = commentText.trim()
    if (!trimmed) return
    commentMutation.mutate({
      post_id: post.id,
      content: trimmed,
      parent_id: replyingTo ? replyingTo.id : null,
    })
  }

  const handleCommentButtonClick = (e) => {
    e.preventDefault()
    setShowComments(true)
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 50)
  }

  // Display top root comments (up to 2 in feed, rest linked to detail page)
  const displayComments = uniqueComments.slice(0, 2)

  return (
    <article className="scroll-mt-24 overflow-hidden rounded-[22px] border border-[#E2E7DE] dark:border-[#3E4042] bg-white dark:bg-[#242526] p-4 sm:p-5 shadow-xs transition-all hover:border-[#16a34a]/30 dark:hover:border-[#22c55e]/30">
      {/* ── Top Header: Author + Meta + Badge ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Author Avatar (clean, authentic: no fake online indicator) */}
          <div className="relative shrink-0">
            {authorProfileUrl ? (
              <Link
                to={authorProfileUrl}
                className="block"
                title={`Xem trang cá nhân ${post.author?.full_name || 'Tác giả'}`}
              >
                <div className="relative w-11 h-11 rounded-full bg-[#f2f4ef] dark:bg-[#303132] flex items-center justify-center overflow-hidden text-sm font-bold text-[#16a34a] dark:text-[#2ECC71] border border-[#e2e7de] dark:border-[#3e4042] shrink-0 aspect-square">
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
              </Link>
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#f2f4ef] dark:bg-[#303132] text-[#16a34a] dark:text-[#2ECC71] font-bold flex items-center justify-center shrink-0 border border-[#e2e7de] dark:border-[#3e4042] text-sm">
                {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Author Details & Subtitle */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {authorProfileUrl ? (
                <Link
                  to={authorProfileUrl}
                  className="text-[15px] sm:text-[15.5px] font-bold text-[#06110a] dark:text-[#E4E6EB] hover:text-[#16a34a] dark:hover:text-[#22c55e] transition-colors truncate"
                >
                  {post.author?.full_name || 'Thành viên'}
                </Link>
              ) : (
                <span className="text-[15px] sm:text-[15.5px] font-bold text-[#06110a] dark:text-[#E4E6EB] truncate">
                  {post.author?.full_name || 'Thành viên'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#56614f] dark:text-[#B0B3B8] font-normal truncate">
              <span className="truncate">
                {post.author?.university && post.author?.major
                  ? `${post.author.university} · ${post.author.major}`
                  : post.author?.university || post.author?.major || 'Sinh viên'}
              </span>
              <span>·</span>
              <span className="shrink-0">{formatRelativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Right Corner: Post Type Badge & Share & Author Delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge type={post.post_type} />
          <button
            type="button"
            onClick={handleShareClick}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#56614f] dark:text-[#B0B3B8] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all duration-200 active:scale-90 cursor-pointer group"
            title="Sao chép liên kết bài viết"
            aria-label="Chia sẻ liên kết bài viết"
          >
            <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
          </button>
          {currentUser && currentUser.id !== (post.author?.id || post.user_id) && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsReportModalOpen(true)
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#56614f] dark:text-[#B0B3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-200 active:scale-90 cursor-pointer"
              title="Báo cáo bài viết"
              aria-label="Báo cáo bài viết"
            >
              <Flag className="w-4 h-4" />
            </button>
          )}
          {onDelete && (currentUser?.id === (post.author?.id || post.user_id) || currentUser?.role === 'admin') && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete(post.id)
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#56614f] dark:text-[#B0B3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all duration-200 active:scale-90 cursor-pointer"
              title="Xóa bài viết"
              aria-label="Xóa bài viết"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Body: Title & Content Preview ── */}
      <div className="mt-3">
        <Link to={postUrl} className="group/title block">
          <h3 className="text-base sm:text-[17px] font-bold text-[#06110a] dark:text-[#E4E6EB] group-hover/title:text-[#16a34a] dark:group-hover/title:text-[#22c55e] transition-colors leading-snug line-clamp-2">
            {post.title}
          </h3>
        </Link>
        {post.content && (
          <p className="mt-1 text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#B0B3B8] line-clamp-3 leading-relaxed">
            {post.content}
          </p>
        )}
      </div>

      {/* ── Document PDF Visual Bento Card (Rendered only when post_type === 'document') ── */}
      {post.post_type === 'document' && (
        <Link
          to={postUrl}
          className="mt-3.5 block rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] bg-[#f9faf8] dark:bg-[#1f2022] p-3.5 sm:p-4 transition-all duration-200 hover:border-[#16a34a]/50 dark:hover:border-[#22c55e]/50 group/doc shadow-2xs"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#16a34a] dark:bg-[#22c55e] text-white dark:text-[#06110a] flex items-center justify-center shrink-0 shadow-xs group-hover/doc:scale-105 transition-transform">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#15803d] dark:text-[#4ade80] bg-[#dcfce7] dark:bg-[#14532d]/40 px-2 py-0.5 rounded-full font-mono border border-[#bbf7d0] dark:border-[#166534]">
                    TÀI LIỆU PDF
                  </span>
                  <span className="text-[11px] text-[#56614f] dark:text-[#B0B3B8]">Bản mới nhất</span>
                </div>
                <p className="text-sm font-bold text-[#06110a] dark:text-[#E4E6EB] truncate max-w-sm mt-0.5">
                  {post.title}
                </p>
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
              <div className="w-8 h-8 rounded-full bg-white dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8] flex items-center justify-center group-hover/doc:bg-[#16a34a] group-hover/doc:text-white dark:group-hover/doc:bg-[#22c55e] dark:group-hover/doc:text-[#06110a] transition-colors border border-[#E2E7DE] dark:border-[#3E4042]">
                <DownloadCloud className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ── Academic Pathway & Subject Pill ── */}
      {post.subject && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#374151] dark:text-[#d1d5db] font-medium">
          <Folder className="w-3.5 h-3.5 text-[#16a34a] dark:text-[#22c55e] shrink-0" />
          <Link
            to={`/?subject=${encodeURIComponent(post.subject)}`}
            className="font-bold text-[#06110a] dark:text-white hover:text-[#16a34a] dark:hover:text-[#22c55e] transition-colors hover:underline"
          >
            {post.subject}
          </Link>
          {tagsList.length > 0 && (
            <span className="text-[#6b7280] dark:text-[#9ca3af]">· {tagsList[0]}</span>
          )}
          <ArrowRight className="w-3 h-3 text-[#9ca3af] shrink-0" />
        </div>
      )}

      {/* ── Question Context Prompt Hint (Campus Pop Academic) ── */}
      {post.post_type === 'question' && (
        <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {totalComments === 0
              ? 'Chưa có câu trả lời - Hãy là người đầu tiên giải đáp!'
              : `${totalComments} câu trả lời từ cộng đồng sinh viên`}
          </span>
        </div>
      )}

      {/* ── Media Images Preview (Rendered when image attachments exist) ── */}
      {post.images && Array.isArray(post.images) && post.images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-[#E2E7DE] dark:border-[#3E4042]">
          {post.images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative aspect-video bg-[#f2f4ef] dark:bg-[#303132] overflow-hidden">
              <img src={img} alt={`Hình ảnh ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* ── Tags Pill List ── */}
      {tagsList.length > 1 && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
          {tagsList.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[11px] text-[#56614f] dark:text-[#B0B3B8] bg-[#f2f4ef] dark:bg-[#303132] px-2.5 py-0.5 rounded-full font-mono border border-[#e2e7de] dark:border-[#3e4042]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Social Stats Bar (Verified Real Data Only) ── */}
      <div className="mt-3.5 flex items-center justify-between text-xs text-[#56614f] dark:text-[#B0B3B8] px-0.5">
        {/* Left: Authentic Like Count (Hidden when 0) */}
        {likesCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="font-semibold tabular-nums text-[#06110a] dark:text-[#e4e6eb]">
              {likesCount} lượt thích
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Right: Authentic Comment & View summary */}
        <div className="flex items-center gap-2">
          {totalComments > 0 && (
            <>
              <span>{totalComments} bình luận</span>
              <span>·</span>
            </>
          )}
          <span>{post.view_count || 0} lượt xem</span>
        </div>
      </div>

      {/* ── 3-Action Grid Bar (Bold & Saturated Contrast Buttons) ── */}
      <div className="mt-2 grid grid-cols-3 gap-1.5 border-t pt-1 border-[#E2E7DE] dark:border-[#3E4042]">
        {/* Like Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={likeMutation.isPending}
          className={`group flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] sm:text-[14px] font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
            isLiked
              ? 'text-rose-700 dark:text-rose-200 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:hover:bg-rose-900/80 border border-rose-300 dark:border-rose-700 shadow-xs font-bold'
              : 'text-[#374151] dark:text-[#D1D5DB] hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/60'
          }`}
          aria-label={isLiked ? 'Bỏ thích' : 'Thích bài viết'}
        >
          <Heart className={`w-4 h-4 transition-all duration-200 group-hover:scale-115 active:scale-125 ${isLiked ? 'fill-rose-600 text-rose-600 scale-110' : 'group-hover:text-rose-600'}`} />
          <span>Thích</span>
        </button>

        {/* Comment Button (Toggles inline discussion / focuses comment composer) */}
        <button
          type="button"
          onClick={handleCommentButtonClick}
          className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] sm:text-[14px] font-semibold transition-all duration-200 text-[#374151] dark:text-[#D1D5DB] hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-950/60 active:scale-95 cursor-pointer"
          aria-label="Xem bình luận"
        >
          <MessageSquare className="w-4 h-4 transition-transform duration-200 group-hover:scale-115 group-hover:text-blue-600" />
          <span>Bình luận</span>
        </button>

        {/* Bookmark Button (Keep exact test aria-label hook) */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          disabled={bookmarkMutation.isPending}
          className={`group flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] sm:text-[14px] font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
            isBookmarked
              ? 'text-amber-800 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900/80 border border-amber-300 dark:border-amber-700 shadow-xs font-bold'
              : 'text-[#374151] dark:text-[#D1D5DB] hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-950/60'
          }`}
          aria-label={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 fill-amber-600 text-amber-600 transition-transform duration-200 group-hover:scale-115" aria-hidden="true" />
          ) : (
            <Bookmark className="w-4 h-4 transition-transform duration-200 group-hover:scale-115 group-hover:text-amber-600" aria-hidden="true" />
          )}
          <span>{isBookmarked ? 'Bỏ lưu' : 'Lưu'}</span>
        </button>
      </div>

      {/* ── Inline Quick Comment & Discussion Thread Area ── */}
      {showComments && (
        <div className="mt-2.5 pt-2.5 border-t border-[#E2E7DE] dark:border-[#3E4042] space-y-3">
          {/* Display Comments List (top comments and their replies) */}
          {displayComments.length > 0 && (
            <div className="space-y-3 pl-1">
              {displayComments.map((comment) => (
                <div key={comment.id} className="relative pl-2.5">
                  {/* Parent Comment Header & Body */}
                  <div className="flex items-start gap-2.5">
                    <div className="relative w-8 h-8 rounded-full bg-[#f2f4ef] dark:bg-[#303132] flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-[#16a34a] border border-[#e2e7de] dark:border-[#3e4042]">
                      <span>{comment.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                      {comment.author?.avatar_url && (
                        <img
                          src={comment.author.avatar_url}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#06110a] dark:text-[#e4e6eb]">
                          {comment.author?.full_name || 'Thành viên'}
                        </span>
                        <span className="text-[11px] text-[#56614f] dark:text-[#B0B3B8]">
                          · {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-[#1f2937] dark:text-[#d1d5db] mt-0.5 leading-relaxed break-words">
                        {comment.content}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleReplyClick(comment, comment.id)}
                        className="mt-1 text-[11px] font-semibold text-[#16a34a] dark:text-[#22c55e] hover:underline cursor-pointer"
                      >
                        Trả lời
                      </button>
                    </div>
                  </div>

                  {/* Downward Branching Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-5 pl-4 border-l-2 border-[#16a34a]/30 dark:border-[#22c55e]/30 mt-2 space-y-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="relative flex items-start gap-2 pt-1">
                          <div className="relative w-6 h-6 rounded-full bg-[#f2f4ef] dark:bg-[#303132] flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold text-[#16a34a] border border-[#e2e7de] dark:border-[#3e4042]">
                            <span>{reply.author?.full_name?.[0]?.toUpperCase() || 'U'}</span>
                            {reply.author?.avatar_url && (
                              <img
                                src={reply.author.avatar_url}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11.5px] font-bold text-[#06110a] dark:text-[#e4e6eb]">
                                {reply.author?.full_name || 'Thành viên'}
                              </span>
                              <span className="text-[10px] text-[#56614f] dark:text-[#B0B3B8]">
                                · {formatRelativeTime(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-[#1f2937] dark:text-[#d1d5db] leading-relaxed break-words">
                              {reply.content}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleReplyClick(reply, comment.id)}
                              className="mt-0.5 text-[10.5px] font-semibold text-[#16a34a] dark:text-[#22c55e] hover:underline cursor-pointer"
                            >
                              Trả lời
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* More comments link directing to full post discussion */}
          {totalComments > displayComments.length && (
            <div className="pl-3 text-xs">
              <Link
                to={postUrl}
                className="font-bold text-[#16a34a] dark:text-[#4ade80] hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Xem toàn bộ {totalComments} bình luận trong bài viết</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Replying Banner Indicator */}
          {replyingTo && (
            <div className="flex items-center justify-between text-[11px] text-[#15803d] dark:text-[#4ade80] bg-[#dcfce7]/70 dark:bg-[#14532d]/40 px-3 py-1 rounded-lg border border-[#bbf7d0] dark:border-[#166534] ml-3 mr-1">
              <span>Đang trả lời <strong>@{replyingTo.authorName}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null)
                  setCommentText('')
                }}
                className="hover:text-red-500 font-bold ml-2 text-xs cursor-pointer"
                title="Hủy trả lời"
              >
                × Hủy
              </button>
            </div>
          )}

          {/* Quick Reply Composer Row (Pill Input + Green Submit Button) */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pl-3">
            {/* Current User Avatar */}
            <div className="relative w-8 h-8 rounded-full bg-[#f2f4ef] dark:bg-[#303132] flex items-center justify-center shrink-0 overflow-hidden text-xs font-bold text-[#16a34a] border border-[#e2e7de] dark:border-[#3e4042]">
              <span>{currentUser?.full_name?.[0]?.toUpperCase() || 'B'}</span>
              {currentUser?.avatar_url && (
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>

            {/* Pill-shaped text input */}
            <div className="flex-1 flex items-center rounded-full bg-[#f2f4ef] dark:bg-[#18191a] border border-[#e2e7de] dark:border-[#3e4042] px-3.5 py-1 focus-within:border-[#16a34a] dark:focus-within:border-[#22c55e] transition-colors">
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyingTo ? `Trả lời @${replyingTo.authorName}...` : 'Trả lời nhanh trong luồng...'}
                className="w-full bg-transparent text-xs sm:text-[13px] text-[#06110a] dark:text-white placeholder-[#8c9688] dark:placeholder-[#70757d] outline-none"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || commentMutation.isPending}
                className="w-7 h-7 rounded-full bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:hover:bg-[#22c55e] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-2xs ml-1"
                aria-label="Gửi trả lời"
                title="Gửi bình luận"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      <ReportPostModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        postId={post.id}
        postTitle={post.title}
      />
    </article>
  )
}
