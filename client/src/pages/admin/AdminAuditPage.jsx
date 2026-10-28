import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminAPI } from '@/services/api'
import { Shield, Zap, Search, RotateCw, ClipboardList, Inbox, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle } from 'lucide-react'

const STATUS_BADGES = {
  active: {
    label: 'Công khai (active)',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  hidden: {
    label: 'Bị ẩn (hidden)',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  deleted: {
    label: 'Đã xóa (deleted)',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
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
      {/* ── Campus Pop Admin Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-rose-500/10 border border-indigo-500/20 p-6 md:p-8 backdrop-blur-sm">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              <Shield className="w-3.5 h-3.5" />
              Bảng điều khiển Quản trị viên
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              Quản trị viên — Nhật ký kiểm duyệt (EXT-03)
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
              Ghi nhận toàn bộ thao tác ẩn/xóa bài viết vi phạm, bảo toàn tính minh bạch và toàn vẹn của mạng xã hội sinh viên.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Quyền hạn tối cao
            </span>
          </div>
        </div>
      </div>

      {/* ── Control Grid: Quick Moderation & Filter ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick Action Bento Card */}
        <section className="card space-y-4 border border-surface-border shadow-xs" aria-labelledby="quick-mod-title">
          <div className="flex items-center gap-2.5 border-b border-surface-border pb-3">
            <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 id="quick-mod-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                Kiểm duyệt bài viết nhanh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ẩn hoặc xóa bài viết vi phạm tiêu chuẩn cộng đồng</p>
            </div>
          </div>

          <form onSubmit={handleModerateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="mod-post-id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Mã bài viết (Post ID) <span className="text-rose-500">*</span>
              </label>
              <input
                id="mod-post-id"
                type="number"
                min="1"
                required
                value={modPostId}
                onChange={e => setModPostId(e.target.value)}
                placeholder="Nhập ID bài viết (ví dụ: 12)..."
                className="input py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Hành động kiểm duyệt</span>
              <div className="grid grid-cols-2 gap-3 text-xs pt-0.5">
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  modStatus === 'hidden'
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                    : 'border-surface-border hover:bg-surface-muted text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="modStatus"
                    value="hidden"
                    checked={modStatus === 'hidden'}
                    onChange={() => setModStatus('hidden')}
                    className="accent-amber-500"
                  />
                  <span>Ẩn bài viết (hidden)</span>
                </label>
                <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  modStatus === 'deleted'
                    ? 'border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold'
                    : 'border-surface-border hover:bg-surface-muted text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="modStatus"
                    value="deleted"
                    checked={modStatus === 'deleted'}
                    onChange={() => setModStatus('deleted')}
                    className="accent-rose-500"
                  />
                  <span>Xóa bài viết (deleted)</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={moderateMutation.isPending}
              className="btn-primary text-xs py-2.5 w-full flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/20"
            >
              {moderateMutation.isPending ? 'Đang xử lý...' : 'Xác nhận kiểm duyệt'}
            </button>
          </form>
        </section>

        {/* Filter Logs Bento Card */}
        <section className="card space-y-4 border border-surface-border shadow-xs flex flex-col justify-between" aria-labelledby="filter-logs-title">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-surface-border pb-3">
              <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Search className="w-4 h-4" />
              </span>
              <div>
                <h2 id="filter-logs-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Lọc nhật ký kiểm duyệt
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tra cứu nhanh lịch sử tác vụ theo ID bài viết</p>
              </div>
            </div>

            <form onSubmit={handleApplyFilter} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="filter-post-id" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Tìm theo Post ID
                </label>
                <input
                  id="filter-post-id"
                  type="number"
                  min="1"
                  value={filterPostId}
                  onChange={e => setFilterPostId(e.target.value)}
                  placeholder="Nhập Post ID cần tra cứu..."
                  className="input py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-secondary text-xs py-2.5 flex-1 font-bold">
                  Lọc nhật ký
                </button>
                {appliedPostId && (
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="btn-secondary text-xs py-2.5 px-4 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Mọi hành động kiểm duyệt đều được lưu vết vĩnh viễn và không thể chỉnh sửa hoặc xóa bỏ.</span>
          </div>
        </section>
      </div>

      {/* ── Table of Audit Logs Bento Card ── */}
      <section className="card space-y-4 border border-surface-border shadow-xs overflow-hidden" aria-label="Bảng nhật ký kiểm duyệt">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <ClipboardList className="w-4 h-4" />
            </span>
            Danh sách sự kiện kiểm duyệt ({pagination?.total || 0})
          </h2>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-primary hover:text-primary-dark inline-flex items-center gap-1 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">Đang tải nhật ký kiểm duyệt...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-rose-500 text-sm font-medium">Không thể tải nhật ký kiểm duyệt.</p>
            <button type="button" onClick={() => refetch()} className="btn-secondary text-xs">
              Thử lại
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-muted flex items-center justify-center text-slate-400">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-sm font-medium">Chưa có sự kiện kiểm duyệt nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-surface-border bg-surface-muted/50 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-3.5 font-bold"># Mã Log</th>
                  <th className="py-3 px-3.5 font-bold">Admin ID</th>
                  <th className="py-3 px-3.5 font-bold">Mã bài viết</th>
                  <th className="py-3 px-3.5 font-bold">Trạng thái trước</th>
                  <th className="py-3 px-3.5 font-bold">Trạng thái mới</th>
                  <th className="py-3 px-3.5 font-bold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/60">
                {logs.map((log) => {
                  const prevBadge = STATUS_BADGES[log.previous_status] || { label: log.previous_status, color: 'text-slate-500' }
                  const newBadge = STATUS_BADGES[log.new_status] || { label: log.new_status, color: 'text-slate-500' }
                  return (
                    <tr key={log.id} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400 font-semibold">#{log.id}</td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Admin #{log.actor_admin_id}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <Link
                          to={`/posts/${log.post_id}`}
                          className="text-primary hover:text-primary-dark font-mono font-bold inline-flex items-center gap-1 hover:underline"
                          title="Xem bài viết"
                        >
                          Bài #{log.post_id}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${prevBadge.color}`}>
                          {prevBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${newBadge.color}`}>
                          {newBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
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
          <nav aria-label="Phân trang nhật ký" className="flex items-center justify-between pt-4 border-t border-surface-border text-xs">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary py-1.5 px-3.5 text-xs disabled:opacity-40 inline-flex items-center gap-1 font-semibold rounded-xl"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Trước
            </button>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Trang <strong className="text-slate-900 dark:text-slate-100">{page}</strong> / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary py-1.5 px-3.5 text-xs disabled:opacity-40 inline-flex items-center gap-1 font-semibold rounded-xl"
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
