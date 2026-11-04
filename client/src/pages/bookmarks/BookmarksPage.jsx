import EmptyState from '@/components/common/EmptyState'
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
      {/* ── Page Header (Synchronized Clean Style) ── */}
      <div className="space-y-1.5 pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-[#E7E7E7]">
          Bài viết đã lưu
        </h1>
        <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] max-w-2xl leading-relaxed">
          Bài đăng và tài liệu bạn bấm Lưu để xem lại sau. Chỉ mình bạn thấy danh sách này.
        </p>

        {/* Category Tabs (Like Grovelyn: Bài đăng 0 / Dự án 3) */}
        <div className="flex items-center gap-6 pt-4 border-b border-[#E2E7DE] dark:border-[#3E4042] text-sm font-semibold">
          {[
            { id: 'all', label: 'Tất cả', count: counts.all },
            { id: 'document', label: 'Tài liệu PDF', count: counts.document },
            { id: 'discussion', label: 'Thảo luận', count: counts.discussion },
            { id: 'question', label: 'Hỏi đáp', count: counts.question },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setPage(1) }}
              className={`pb-3 relative transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#16a34a] dark:text-[#2ECC71] font-bold'
                  : 'text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] tabular-nums font-extrabold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-[#16a34a]/10 text-[#16a34a] dark:bg-[#22c55e]/20 dark:text-[#2ECC71]'
                    : 'bg-[#F2F4EF] dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8]'
                }`}
              >
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16a34a] dark:bg-[#22c55e] rounded-full" />
              )}
            </button>
          ))}
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
        <div className="card p-12 text-center bg-surface-card border border-surface-border rounded-2xl shadow-2xs space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Chưa có bài viết nào được lưu.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bấm <strong>Lưu bài</strong> dưới bất kỳ bài viết hoặc tài liệu nào ở{' '}
            <Link to="/" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Trang chủ
            </Link>{' '}
            để xem lại tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={{ ...post, is_bookmarked: true }} initialBookmarked />
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
