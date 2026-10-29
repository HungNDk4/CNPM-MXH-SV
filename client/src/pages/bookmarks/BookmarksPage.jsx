import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookmarkAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import { Bookmark, FileText, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

export default function BookmarksPage() {
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'document' | 'discussion' | 'question'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['bookmarks', page],
    queryFn: async () => (await bookmarkAPI.getAll({ page, limit: 20 })).data,
    keepPreviousData: true,
  })

  const rawPosts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  // Tab filtering client-side
  const posts = useMemo(() => {
    if (activeTab === 'all') return rawPosts
    return rawPosts.filter((p) => p.post_type === activeTab)
  }, [rawPosts, activeTab])

  // Counts for tabs
  const counts = useMemo(() => {
    const doc = rawPosts.filter((p) => p.post_type === 'document').length
    const dis = rawPosts.filter((p) => p.post_type === 'discussion').length
    const q = rawPosts.filter((p) => p.post_type === 'question').length
    return { all: rawPosts.length, document: doc, discussion: dis, question: q }
  }, [rawPosts])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Grovelyn Inspired Clean Minimal Header (Image 3) ── */}
      <div className="space-y-2 pt-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          Bài viết đã lưu
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
          Bài đăng và tài liệu bạn bấm Lưu để xem lại sau. Chỉ mình bạn thấy danh sách này.
        </p>

        {/* Category Tabs (Like Grovelyn: Bài đăng 0 / Dự án 3) */}
        <div className="flex items-center gap-6 pt-4 border-b border-surface-border text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'all'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Tất cả</span>
            <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-muted text-slate-600 dark:text-slate-300">
              {counts.all}
            </span>
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'document'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Tài liệu PDF</span>
            <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-muted text-slate-600 dark:text-slate-300">
              {counts.document}
            </span>
            {activeTab === 'document' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discussion')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'discussion'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Thảo luận</span>
            <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-muted text-slate-600 dark:text-slate-300">
              {counts.discussion}
            </span>
            {activeTab === 'discussion' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('question')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'question'
                ? 'text-primary-600 dark:text-primary-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Hỏi đáp</span>
            <span className="ml-1.5 text-xs px-2 py-0.5 rounded-full bg-surface-muted text-slate-600 dark:text-slate-300">
              {counts.question}
            </span>
            {activeTab === 'question' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
            )}
          </button>
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
        /* Grovelyn Clean Empty State (Image 3) */
        <div className="card p-12 text-center bg-surface-card border border-surface-border rounded-2xl shadow-2xs">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chưa lưu bài đăng nào.{' '}
            Bấm <strong>Lưu</strong> dưới một bài ở{' '}
            <Link to="/" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Trang chủ
            </Link>{' '}
            để xem lại sau.
          </p>
        </div>
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
