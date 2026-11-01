import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import PostCard from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import { PlusCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MyPostsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'document' | 'discussion' | 'question'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-authored-posts', user?.id, page],
    queryFn: async () => {
      if (!user?.id) return { data: [], pagination: { total: 0, totalPages: 1 } }
      const res = await postAPI.getAll({ author_id: user.id, page, limit: 20 })
      return res.data || { data: [], pagination: { total: 0, totalPages: 1 } }
    },
    enabled: Boolean(user?.id),
    keepPreviousData: true,
  })

  const rawPosts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  // Client filtering by tab
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

  const deleteMutation = useMutation({
    mutationFn: (id) => postAPI.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa bài viết thành công!')
      queryClient.invalidateQueries({ queryKey: ['my-authored-posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['trending-topics'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết. Vui lòng thử lại!')
    },
  })

  const handleDeletePost = (id, title) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" không? Hành động này không thể hoàn tác.`)) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Page Header (Synchronized Clean Style) ── */}
      <div className="space-y-1.5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-[#E7E7E7]">
              Bài đăng của tôi
            </h1>
            <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] max-w-2xl leading-relaxed mt-1">
              Quản lý các tài liệu, câu hỏi và bài thảo luận bạn đã đóng góp cho cộng đồng sinh viên.
            </p>
          </div>
          <Link
            to="/posts/create"
            className="btn-primary self-start sm:self-auto py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2 rounded-xl shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng bài mới</span>
          </Link>
        </div>

        {/* Category Tabs (Like BookmarksPage: Tất cả / Tài liệu PDF / Thảo luận / Hỏi đáp) */}
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
          <p className="text-slate-700 dark:text-slate-300 font-medium">Không thể tải danh sách bài đăng.</p>
          <button type="button" onClick={() => refetch()} className="btn-secondary text-sm inline-flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center bg-surface-card border border-surface-border rounded-2xl shadow-2xs space-y-2">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Bạn chưa có bài đăng nào trong mục này.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bấm{' '}
            <Link to="/posts/create" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Đăng bài mới
            </Link>{' '}
            để chia sẻ câu hỏi, đồ án hoặc tài liệu học tập với mọi người.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
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
