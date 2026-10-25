import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminAPI } from '@/services/api'
import { Shield, Zap, Search, RotateCw, ClipboardList, Inbox, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

const STATUS_BADGES = {
  active: {
    label: 'Công khai (active)',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
  },
  hidden: {
    label: 'Bị ẩn (hidden)',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
  },
  deleted: {
    label: 'Đã xóa (deleted)',
    color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700/60',
  },
}

export default function AdminAuditPage() {
  const queryClient = useQueryClient()

  // Filters & Pagination
  const [page, setPage] = useState(1)
  const [filterPostId, setFilterPostId] = useState('')
  const [appliedPostId, setAppliedPostId] = useState('')

  // Quick moderation form state
  const [modPostId, setModPostId] = useState('')
  const [modStatus, setModStatus] = useState('hidden') // 'hidden' | 'deleted'

  // Query audit logs
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page, appliedPostId],
    queryFn: async () => {
      const params = { page, limit: 10 }
      if (appliedPostId) params.post_id = appliedPostId
      return (await adminAPI.getAuditLogs(params)).data
    },
    retry: false,
  })

  // Mutation: Moderate post
  const moderateMutation = useMutation({
    mutationFn: ({ postId, status }) => adminAPI.moderatePost(postId, status),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Đã áp dụng kiểm duyệt thành công!')
      setModPostId('')
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể thực hiện kiểm duyệt.')
    },
  })

  const handleApplyFilter = (e) => {
    e.preventDefault()
    setAppliedPostId(filterPostId.trim())
    setPage(1)
  }

  const handleClearFilter = () => {
    setFilterPostId('')
    setAppliedPostId('')
    setPage(1)
  }

  const handleModerateSubmit = (e) => {
    e.preventDefault()
    const id = Number(modPostId.trim())
    if (!Number.isSafeInteger(id) || id <= 0) {
      toast.error('ID bài viết phải là số nguyên dương.')
      return
    }
    if (window.confirm(`Bạn có chắc chắn muốn chuyển bài viết #${id} sang trạng thái "${modStatus}"?`)) {
      moderateMutation.mutate({ postId: id, status: modStatus })
    }
  }

  const logs = data?.data || []
  const pagination = data?.pagination
  const totalPages = pagination?.totalPages || 1

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div className="card border-primary/20 bg-gradient-to-r from-primary/5 via-surface-card to-accent/5 space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Quản trị viên — Nhật ký kiểm duyệt (EXT-03)
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Ghi nhận toàn bộ thao tác ẩn/xóa bài viết vi phạm, bảo toàn tính minh bạch và toàn vẹn của hệ thống.
        </p>
      </div>

      {/* ── Control Grid: Quick Moderation & Filter ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Action */}
        <section className="card space-y-3.5" aria-labelledby="quick-mod-title">
          <h2 id="quick-mod-title" className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Kiểm duyệt bài viết nhanh
          </h2>
          <form onSubmit={handleModerateSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="mod-post-id" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Mã bài viết (Post ID) <span className="text-red-500">*</span>
              </label>
              <input
                id="mod-post-id"
                type="number"
                min="1"
                required
                value={modPostId}
                onChange={e => setModPostId(e.target.value)}
                placeholder="Nhập ID bài viết (ví dụ: 12)..."
                className="input py-1.5 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Hành động kiểm duyệt</span>
              <div className="flex gap-4 text-xs pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modStatus"
                    value="hidden"
                    checked={modStatus === 'hidden'}
                    onChange={() => setModStatus('hidden')}
                  />
                  <span className="text-amber-600 dark:text-amber-300 font-medium">Ẩn bài viết (hidden)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modStatus"
                    value="deleted"
                    checked={modStatus === 'deleted'}
                    onChange={() => setModStatus('deleted')}
                  />
                  <span className="text-red-600 dark:text-red-300 font-medium">Xóa bài viết (deleted)</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={moderateMutation.isPending}
              className="btn-primary text-xs py-2 w-full flex items-center justify-center gap-1.5"
            >
              {moderateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận kiểm duyệt'}
            </button>
          </form>
        </section>

        {/* Filter Logs */}
        <section className="card space-y-3.5" aria-labelledby="filter-logs-title">
          <h2 id="filter-logs-title" className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Lọc nhật ký kiểm duyệt
          </h2>
          <form onSubmit={handleApplyFilter} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="filter-post-id" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Tìm theo Post ID
              </label>
              <input
                id="filter-post-id"
                type="number"
                min="1"
                value={filterPostId}
                onChange={e => setFilterPostId(e.target.value)}
                placeholder="Nhập Post ID cần tra cứu..."
                className="input py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button type="submit" className="btn-secondary text-xs py-2 flex-1">
                Lọc nhật ký
              </button>
              {appliedPostId && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="btn-secondary text-xs py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </form>
        </section>
      </div>

      {/* ── Table of Audit Logs ── */}
      <section className="card space-y-4" aria-label="Bảng nhật ký kiểm duyệt">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Danh sách sự kiện kiểm duyệt ({pagination?.total || 0})
          </h2>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-12 text-sm">Đang tải nhật ký kiểm duyệt...</p>
        ) : isError ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-red-500 text-sm">Không thể tải nhật ký kiểm duyệt.</p>
            <button type="button" onClick={() => refetch()} className="btn-secondary text-xs">
              Thử lại
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-surface-muted flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <p className="text-sm">Chưa có sự kiện kiểm duyệt nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-semibold"># Mã Log</th>
                  <th className="py-2.5 px-3 font-semibold">Admin ID</th>
                  <th className="py-2.5 px-3 font-semibold">Mã bài viết</th>
                  <th className="py-2.5 px-3 font-semibold">Trạng thái trước</th>
                  <th className="py-2.5 px-3 font-semibold">Trạng thái mới</th>
                  <th className="py-2.5 px-3 font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {logs.map((log) => {
                  const prevBadge = STATUS_BADGES[log.previous_status] || { label: log.previous_status, color: 'text-slate-500' }
                  const newBadge = STATUS_BADGES[log.new_status] || { label: log.new_status, color: 'text-slate-500' }
                  return (
                    <tr key={log.id} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">#{log.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Admin #{log.actor_admin_id}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          to={`/posts/${log.post_id}`}
                          className="text-primary hover:underline font-mono inline-flex items-center gap-1"
                          title="Xem bài viết"
                        >
                          Bài #{log.post_id}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${prevBadge.color}`}>
                          {prevBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${newBadge.color}`}>
                          {newBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav aria-label="Phân trang nhật ký" className="flex items-center justify-between pt-3 border-t border-surface-border text-xs">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40 inline-flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Trước
            </button>
            <span className="text-slate-500 dark:text-slate-400">
              Trang <strong className="text-slate-800 dark:text-slate-200">{page}</strong> / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40 inline-flex items-center gap-1"
            >
              Sau
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        )}
      </section>
    </div>
  )
}
