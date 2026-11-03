import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminAPI } from '@/services/api'
import AdminLayoutNav from '@/components/admin/AdminLayoutNav'
import Badge from '@/components/common/Badge'
import {
  Search,
  X,
  Filter,
  Eye,
  Heart,
  MessageSquare,
  ShieldAlert,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  EyeOff,
  Trash2,
  CheckCircle,
} from 'lucide-react'

const STATUS_CONFIG = {
  active: {
    label: 'Công khai',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  hidden: {
    label: 'Đang ẩn',
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  deleted: {
    label: 'Đã xóa',
    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
}

export default function AdminPostsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'hidden' | 'deleted'
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'question' | 'document' | 'discussion'
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  // Build query params
  const params = useMemo(() => {
    const p = { page, limit: 12 }
    if (statusFilter !== 'all') p.status = statusFilter
    if (typeFilter !== 'all') p.type = typeFilter
    if (appliedSearch) p.search = appliedSearch
    return p
  }, [page, statusFilter, typeFilter, appliedSearch])

  // Fetch admin posts
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-posts', params],
    queryFn: async () => {
      const res = await adminAPI.getPosts(params)
      return res.data
    },
    keepPreviousData: true,
    staleTime: 10000,
  })

  const posts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  // Moderation mutation
  const moderateMutation = useMutation({
    mutationFn: ({ postId, status }) => adminAPI.moderatePost(postId, status),
    onSuccess: (res, vars) => {
      toast.success(res.data.message || 'Cập nhật trạng thái kiểm duyệt thành công!')
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể thực hiện kiểm duyệt bài viết.')
    },
  })

  const handleModerate = (postId, title, targetStatus) => {
    const actionName = targetStatus === 'hidden' ? 'ẨN' : 'XÓA'
    if (
      window.confirm(
        `Bạn có chắc chắn muốn ${actionName} bài viết #${postId} ("${title}")?\n\nLưu ý: Hành động này sẽ được ghi vào nhật ký kiểm duyệt.`
      )
    ) {
      moderateMutation.mutate({ postId, status: targetStatus })
    }
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AdminLayoutNav
        title="Quản lý & Kiểm duyệt bài viết"
        subtitle="Tìm kiếm, lọc trạng thái và kiểm duyệt ẩn/xóa bài viết vi phạm tiêu chuẩn cộng đồng."
      />

      {/* ── Filters Bar ── */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Row 1: Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề bài viết hoặc tên tác giả..."
            className="w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF] dark:bg-[#18191A] text-[#06110a] dark:text-white placeholder-[#56614f] dark:placeholder-[#B0B3B8] focus:bg-white dark:focus:bg-[#303132] focus:outline-none focus:ring-1 focus:ring-primary"
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

        {/* Row 2: Status & Type Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E7DE] dark:border-[#3E4042]">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
            <span className="text-[#56614f] dark:text-[#B0B3B8] mr-1">Trạng thái:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Công khai' },
              { id: 'hidden', label: 'Đang ẩn' },
              { id: 'deleted', label: 'Đã xóa' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStatusFilter(s.id)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-[#16a34a] text-white dark:bg-[#2ECC71] dark:text-[#18191A] font-bold shadow-2xs'
                    : 'bg-[#F2F4EF] dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Post Type Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#56614f] dark:text-[#B0B3B8]">Loại bài:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="text-xs py-1.5 px-2.5 rounded-xl border border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF] dark:bg-[#18191A] text-[#06110a] dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại bài</option>
              <option value="document">Tài liệu PDF</option>
              <option value="discussion">Thảo luận</option>
              <option value="question">Hỏi đáp</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Active Search/Filter Badges ── */}
      {appliedSearch && (
        <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium border border-emerald-500/20">
          <span>
            Đang lọc bài viết có chứa: <strong className="font-bold">"{appliedSearch}"</strong>
          </span>
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
          >
            Xóa tìm kiếm
          </button>
        </div>
      )}

      {/* ── Posts Data Table ── */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-[#303132] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Không thể tải danh sách bài viết quản trị.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
              Không tìm thấy bài viết nào
            </h3>
            <p className="text-xs text-[#56614f] dark:text-[#B0B3B8]">
              Thử thay đổi bộ lọc hoặc xóa từ khóa tìm kiếm để xem các bài viết khác.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF]/50 dark:bg-[#18191A]/50 text-[#56614f] dark:text-[#B0B3B8] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">ID & Bài viết</th>
                  <th className="py-3 px-4">Tác giả</th>
                  <th className="py-3 px-4">Loại bài</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Tương tác</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7DE] dark:divide-[#3E4042]">
                {posts.map((post) => {
                  const statusInfo = STATUS_CONFIG[post.status] || {
                    label: post.status,
                    bg: 'bg-slate-100 text-slate-700',
                  }
                  const postUrl = post.post_type === 'document' ? `/documents/${post.id}` : `/posts/${post.id}`

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-[#F2F4EF]/40 dark:hover:bg-[#303132]/30 transition-colors"
                    >
                      {/* ID & Title */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-mono text-[10px] text-[#56614f] dark:text-[#B0B3B8] pt-0.5">
                            #{post.id}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-[#06110a] dark:text-white hover:text-[#16a34a] dark:hover:text-[#2ECC71] line-clamp-1 inline-flex items-center gap-1 group"
                            >
                              <span>{post.title}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            {post.content && (
                              <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] line-clamp-1 mt-0.5">
                                {post.content}
                              </p>
                            )}
                            <span className="text-[10px] text-[#56614f] dark:text-[#B0B3B8]">
                              {new Date(post.created_at).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-[#06110a] dark:text-white">
                          {post.author?.full_name || 'Không rõ'}
                        </p>
                        <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8]">
                          {post.author?.email || ''}
                        </p>
                      </td>

                      {/* Post Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge type={post.post_type} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.bg}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Engagement Counts */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-3 text-[11px] text-[#56614f] dark:text-[#B0B3B8] tabular-nums">
                          <span className="inline-flex items-center gap-1" title="Lượt thích">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                            {post.like_count}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Bình luận">
                            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                            {post.comment_count}
                          </span>
                          <span className="inline-flex items-center gap-1" title="Lượt xem">
                            <Eye className="w-3.5 h-3.5 text-amber-500" />
                            {post.view_count}
                          </span>
                        </div>
                      </td>

                      {/* Moderation Actions (B.3) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {post.status === 'active' && (
                            <>
                              <button
                                type="button"
                                disabled={moderateMutation.isPending}
                                onClick={() => handleModerate(post.id, post.title, 'hidden')}
                                className="px-2.5 py-1 rounded-lg text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Ẩn bài viết khỏi bảng tin"
                              >
                                <EyeOff className="w-3 h-3" />
                                <span>Ẩn</span>
                              </button>
                              <button
                                type="button"
                                disabled={moderateMutation.isPending}
                                onClick={() => handleModerate(post.id, post.title, 'deleted')}
                                className="px-2.5 py-1 rounded-lg text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Xóa bài viết"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Xóa</span>
                              </button>
                            </>
                          )}

                          {post.status === 'hidden' && (
                            <button
                              type="button"
                              disabled={moderateMutation.isPending}
                              onClick={() => handleModerate(post.id, post.title, 'deleted')}
                              className="px-2.5 py-1 rounded-lg text-rose-700 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                              title="Xóa vĩnh viễn bài viết"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          )}

                          {post.status === 'deleted' && (
                            <span className="text-[10px] text-slate-400 dark:text-[#B0B3B8] italic">
                              Đã xóa
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF]/30 dark:bg-[#18191A]/30 text-xs">
            <span className="text-[#56614f] dark:text-[#B0B3B8]">
              Hiển thị tổng số <strong>{pagination.total}</strong> bài viết
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
              <span className="font-semibold text-[#06110a] dark:text-white px-2">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

