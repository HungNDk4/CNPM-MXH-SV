import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import PostCard from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import {
  PlusCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Heart,
  MessageSquare,
  Eye,
  Search,
  X,
  ArrowUpDown,
  FileQuestion,
  Trash2,
} from 'lucide-react'

export default function MyPostsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'document' | 'discussion' | 'question'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'hidden' | 'deleted'
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [postToDelete, setPostToDelete] = useState(null) // { id, title }
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'engagement'

  // 1. Fetch Real Personal Statistics (A.1)
  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError: isStatsError,
  } = useQuery({
    queryKey: ['my-post-stats', user?.id],
    queryFn: async () => {
      const res = await postAPI.getMyStats()
      return res.data?.data || { total_posts: 0, total_likes: 0, total_comments: 0, total_views: 0 }
    },
    enabled: Boolean(user?.id),
    staleTime: 30000,
  })

  const stats = statsData || { total_posts: 0, total_likes: 0, total_comments: 0, total_views: 0 }

  // BE-11: owner-only server pagination and global ordering.
  // Never send author_id; backend derives ownership from JWT.
  const queryParams = {
    page,
    limit: 10,
    sort: sortBy,
    ...(activeTab !== 'all' ? { type: activeTab } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(appliedSearch ? { search: appliedSearch } : {}),
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-authored-posts', user?.id, page, activeTab, statusFilter, appliedSearch, sortBy],
    queryFn: async () => {
      const res = await postAPI.getMyPosts(queryParams)
      return res.data || { data: [], pagination: { total: 0, totalPages: 1 } }
    },
    enabled: Boolean(user?.id),
    keepPreviousData: true,
  })

  const rawPosts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => postAPI.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa bài viết thành công!')
      setPostToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['my-authored-posts'] })
      queryClient.invalidateQueries({ queryKey: ['my-post-stats'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['posts-category-counts'] })
      queryClient.invalidateQueries({ queryKey: ['trending-topics'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết. Vui lòng thử lại!')
    },
  })

  const handleDeletePost = (id, title) => {
    setPostToDelete({ id, title })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setAppliedSearch(searchTerm.trim())
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(1)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-[#E7E7E7]">
              Bài đăng của tôi
            </h1>
            <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] max-w-2xl leading-relaxed mt-1">
              Quản lý bài đã đăng, kể cả bài bị ẩn hoặc đã xóa. Các trạng thái không công khai không thể tương tác.
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
      </div>

      {/* ── A.1 Overview Statistics (KPI Cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Posts */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
              Tổng bài đăng
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
              {isStatsLoading ? '…' : stats.total_posts}
            </span>
          </div>
          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
            Đang hiển thị công khai
          </p>
        </div>

        {/* KPI 2: Total Likes */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
              Lượt thích nhận
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500/20" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
              {isStatsLoading ? '…' : stats.total_likes}
            </span>
          </div>
          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
            Từ các sinh viên khác
          </p>
        </div>

        {/* KPI 3: Total Comments */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
              Bình luận nhận
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
              {isStatsLoading ? '…' : stats.total_comments}
            </span>
          </div>
          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
            Tương tác trong luồng
          </p>
        </div>

        {/* KPI 4: Total Views */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
              Lượt xem bài viết
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
              {isStatsLoading ? '…' : stats.total_views}
            </span>
          </div>
          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
            Tổng lượt tiếp cận thật
          </p>
        </div>
      </div>

      {/* ── Filters Bar: Category Tabs & Search & Sort ── */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs space-y-4">
        {/* Row 1: Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
          {[
            { id: 'all', label: 'Tất cả bài viết' },
            { id: 'document', label: 'Tài liệu PDF' },
            { id: 'discussion', label: 'Thảo luận' },
            { id: 'question', label: 'Hỏi đáp' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#16a34a] text-white dark:bg-[#2ECC71] dark:text-[#18191A] font-bold shadow-2xs'
                  : 'bg-[#F2F4EF] dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Owner-only status filter, including moderation outcomes */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label htmlFor="my-posts-status" className="font-semibold text-[#56614f] dark:text-[#B0B3B8]">Trạng thái bài:</label>
          <select
            id="my-posts-status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="input max-w-xs text-xs"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang công khai</option>
            <option value="hidden">Đã bị Admin ẩn</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>

        {/* Row 2: Search Input & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2 border-t border-[#E2E7DE] dark:border-[#3E4042]">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF] dark:bg-[#18191A] text-[#06110a] dark:text-white placeholder-[#56614f] dark:placeholder-[#B0B3B8] focus:bg-white dark:focus:bg-[#303132] focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Search className="w-4 h-4 text-[#56614f] dark:text-[#B0B3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#56614f] dark:text-[#B0B3B8]" />
            <span className="text-xs text-[#56614f] dark:text-[#B0B3B8]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF] dark:bg-[#18191A] text-[#06110a] dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="newest">Mới nhất</option>
              <option value="engagement">Tương tác cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Search Filter Indicator ── */}
      {appliedSearch && (
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/20">
          <span>
            Đang lọc theo từ khóa: <strong className="font-bold">"{appliedSearch}"</strong>
          </span>
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}

      {/* ── Post Listing & UX States ── */}
      {isLoading ? (
        <div className="space-y-4" role="status">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-16 space-y-4" role="alert">
          <p className="text-slate-700 dark:text-slate-300 font-medium">Không thể tải danh sách bài đăng.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Thử lại
          </button>
        </div>
      ) : rawPosts.length === 0 ? (
        <div className="card p-12 text-center bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] rounded-2xl shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#303132] text-slate-400 dark:text-[#B0B3B8] flex items-center justify-center mx-auto">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#06110a] dark:text-white">
            {appliedSearch ? 'Không tìm thấy bài viết phù hợp' : 'Bạn chưa có bài đăng nào trong mục này'}
          </h3>
          <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] max-w-sm mx-auto">
            {appliedSearch
              ? 'Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
              : 'Chia sẻ ngay những tài liệu, đồ án hay câu hỏi của bạn để cùng giao lưu với cộng đồng sinh viên.'}
          </p>
          {appliedSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="btn-secondary text-xs px-4 py-2 mt-2 rounded-xl"
            >
              Xóa bộ lọc
            </button>
          ) : (
            <Link
              to="/posts/create"
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 rounded-xl shadow-xs mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng bài ngay</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rawPosts.map((post) => (
            post.status !== 'active' ? (
              <article key={post.id} className="card p-5 space-y-2" aria-label={`Bài không công khai: ${post.title}`}>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${post.status === 'hidden'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
                  {post.status === 'hidden' ? 'Đã bị Admin ẩn' : 'Đã xóa'}
                </span>
                <h3 className="font-bold text-content">{post.title}</h3>
                <p className="text-sm text-content-secondary">
                  Bài này không hiển thị công khai và không thể truy cập, chỉnh sửa hoặc tương tác.
                </p>
              </article>
            ) : (
              <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
            )
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 inline-flex items-center gap-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Trang trước
              </button>
              <span className="text-xs sm:text-sm font-medium text-[#56614f] dark:text-[#B0B3B8] px-3 sm:px-4 py-1.5 rounded-xl bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] shadow-2xs">
                Trang <strong className="text-[#06110a] dark:text-white">{page}</strong> / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-secondary text-xs sm:text-sm px-3 sm:px-4 py-2 inline-flex items-center gap-1.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal (Bento/Modern UI) */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-[#06110a] dark:text-white">
                  Xác nhận xóa bài viết
                </h3>
                <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] leading-relaxed">
                  Bạn có chắc chắn muốn xóa bài viết <strong className="text-[#06110a] dark:text-white">"{postToDelete.title}"</strong> không? Hành động này sẽ chuyển trạng thái bài viết thành đã xóa.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E2E7DE] dark:border-[#3E4042]">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                disabled={deleteMutation.isPending}
                className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  deleteMutation.mutate(postToDelete.id)
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
