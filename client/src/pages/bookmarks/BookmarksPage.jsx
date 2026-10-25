import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookmarkAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { Bookmark, FileText, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

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
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <span className="p-2 bg-primary/10 text-primary rounded-lg">
              <Bookmark className="w-5 h-5 fill-current" />
            </span>
            Bài viết đã lưu
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Danh sách các câu hỏi, thảo luận và tài liệu bạn đã đánh dấu để xem lại.
          </p>
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-400 self-start sm:self-auto bg-surface-card px-3 py-1.5 rounded-lg border border-surface-border shadow-xs">
          Tổng cộng: <strong className="text-slate-900 dark:text-slate-100">{pagination.total}</strong> bài viết
        </span>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-4" role="status">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
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
        <div className="card text-center py-20 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200">Chưa có bài viết nào được lưu</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            Khi duyệt bảng tin hoặc xem bài viết, bạn có thể bấm nút Bookmark để lưu lại những nội dung bổ ích tại đây.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm mt-2">
            Khám phá bảng tin
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-sm px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400 px-3">
                Trang {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-secondary text-sm px-3 py-1.5 inline-flex items-center gap-1.5"
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
