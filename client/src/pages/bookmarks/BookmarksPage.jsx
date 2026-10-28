import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookmarkAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import { Bookmark, FileText, ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react'

export default function BookmarksPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['bookmarks', page],
    queryFn: async () => (await bookmarkAPI.getAll({ page, limit: 10 })).data,
    keepPreviousData: true,
  })

  const posts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Campus Pop Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-blue-500/10 border border-amber-500/20 p-6 md:p-8 backdrop-blur-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Kho lưu trữ cá nhân
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <span className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/25">
                <Bookmark className="w-6 h-6 fill-current" />
              </span>
              Bài viết đã lưu
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl">
              Nơi lưu trữ các câu hỏi, tài liệu ôn tập và thảo luận chất lượng cao bạn đã đánh dấu để học tập sau.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Tổng cộng: <strong className="text-slate-900 dark:text-slate-100 text-sm font-bold">{pagination.total}</strong> bài
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-4" role="status">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-16 space-y-4" role="alert">
          <p className="text-slate-700 dark:text-slate-300 font-medium">Không thể tải danh sách bài viết đã lưu.</p>
          <button type="button" onClick={() => refetch()} className="btn-secondary text-sm inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Chưa có bài viết nào được lưu"
          description="Khi duyệt bảng tin hoặc xem bài viết, bạn có thể bấm nút Bookmark để lưu lại những nội dung bổ ích tại đây."
          actionText="Khám phá bảng tin"
          actionHref="/"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} initialBookmarked />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 px-4 py-1.5 rounded-xl bg-surface-card border border-surface-border shadow-2xs">
                Trang <strong className="text-slate-900 dark:text-slate-100">{page}</strong> / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
