import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import AdminLayoutNav from '@/components/admin/AdminLayoutNav'
import {
  ShieldCheck,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  ClipboardList,
  Flag,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  User,
  Clock,
} from 'lucide-react'
import { adminAPI } from '@/services/api'

const LABELS = {
  active: 'Công khai', hidden: 'Đã ẩn', deleted: 'Đã xóa',
  question: 'Hỏi đáp', discussion: 'Thảo luận', document: 'Tài liệu PDF',
}
const REPORT_REASONS = {
  spam: 'Spam / Quảng cáo',
  inappropriate: 'Nội dung phản cảm',
  copyright: 'Vi phạm bản quyền',
  harassment: 'Quấy rối / Thù địch',
  other: 'Lý do khác',
}
const REPORT_STATUS_LABELS = {
  pending: 'Chờ xử lý',
  reviewed: 'Đã duyệt (Đã ẩn bài)',
  dismissed: 'Đã bác bỏ',
}
const EMPTY = { search: '', status: '', type: '', author_id: '' }
const showError = (err) => err.response?.data?.message || 'Không thể kết nối máy chủ.'

export default function AdminContentPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'reports' ? 'reports' : 'posts'
  const [activeTab, setActiveTab] = useState(initialTab) // 'posts' | 'reports'

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'reports') {
      setActiveTab('reports')
    } else if (tabParam === 'posts') {
      setActiveTab('posts')
    }
  }, [searchParams])

  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    const nextParams = new URLSearchParams(searchParams)
    if (newTab === 'reports') {
      nextParams.set('tab', 'reports')
    } else {
      nextParams.delete('tab')
    }
    setSearchParams(nextParams)
  }

  // ── Posts Tab State ──────────────────────────────────────────────
  const [draft, setDraft] = useState(EMPTY)
  const [filters, setFilters] = useState(EMPTY)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const params = {
    page,
    limit: 10,
    ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')),
  }

  // ── Reports Tab State ────────────────────────────────────────────
  const [reportPage, setReportPage] = useState(1)
  const [reportStatusFilter, setReportStatusFilter] = useState('pending')
  const [confirmReportAction, setConfirmReportAction] = useState(null) // { reportId, action: 'approve' | 'dismiss', postTitle }
  const [adminReportReason, setAdminReportReason] = useState('')

  // ── Queries ──────────────────────────────────────────────────────
  const listing = useQuery({
    queryKey: ['admin-content', page, filters],
    queryFn: async () => (await adminAPI.getPosts(params)).data,
    retry: false,
  })

  const detail = useQuery({
    queryKey: ['admin-content-detail', selectedId],
    queryFn: async () => (await adminAPI.getPostDetail(selectedId)).data.data,
    enabled: selectedId !== null,
    retry: false,
  })

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', reportPage, reportStatusFilter],
    queryFn: async () => (await adminAPI.getReports({
      page: reportPage,
      limit: 10,
      status: reportStatusFilter || undefined,
    })).data,
    retry: false,
  })

  // Global pending reports count for tab badge
  const pendingCount = reportsQuery.data?.pagination?.pendingCount ?? 0

  // ── Mutations ────────────────────────────────────────────────────
  const moderate = useMutation({
    mutationFn: () => adminAPI.moderatePost(selectedId, action, reason.trim()),
    onSuccess: () => {
      toast.success('Đã kiểm duyệt và ghi nhật ký.')
      setAction('')
      setReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] })
    },
    onError: (err) => toast.error(showError(err)),
  })

  const handleReportMutation = useMutation({
    mutationFn: ({ reportId, action, reason }) =>
      adminAPI.handleReport(reportId, { action, reason: reason?.trim() || undefined }),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Xử lý báo cáo thành công.')
      setConfirmReportAction(null)
      setAdminReportReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-content'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] })
    },
    onError: (err) => toast.error(showError(err)),
  })

  const rows = listing.data?.data || []
  const pagination = listing.data?.pagination
  const pages = Math.max(1, pagination?.totalPages || 1)
  const item = detail.data
  const canSubmit = reason.trim().length >= 5 && reason.trim().length <= 500 && !moderate.isPending

  function applyFilters(event) {
    event.preventDefault()
    setFilters({ ...draft })
    setPage(1)
    setSelectedId(null)
  }
  function selectItem(id) {
    setSelectedId(id)
    setAction('')
    setReason('')
  }
  function startAction(status) {
    setAction(status)
    setReason('')
  }

  // Reports data
  const reportRows = reportsQuery.data?.data || []
  const reportPagination = reportsQuery.data?.pagination
  const reportPages = Math.max(1, reportPagination?.totalPages || 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AdminLayoutNav
        title="Quản lý nội dung & Báo cáo"
        subtitle="Tìm kiếm bài viết, xử lý hàng đợi báo cáo vi phạm và kiểm duyệt học tập an toàn."
      />

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1">
        <button
          type="button"
          onClick={() => handleTabChange('posts')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-2xl transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-[#16a34a] text-white shadow-sm'
              : 'text-content-secondary hover:bg-surface-muted'
          }`}
        >
          <Search size={16} />
          Danh sách bài viết
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-2xl transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#16a34a] text-white shadow-sm'
              : 'text-content-secondary hover:bg-surface-muted'
          }`}
        >
          <Flag size={16} />
          Hàng đợi báo cáo
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: Danh sách bài viết (Existing preserved layout & selectors) ── */}
      {activeTab === 'posts' && (
        <>
          <form onSubmit={applyFilters} className="card space-y-3" aria-label="Bộ lọc nội dung">
            <div className="flex items-center gap-2 font-semibold text-content"><Search size={18} /> Bộ lọc nội dung</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1 text-xs font-medium text-content-secondary">
                Tiêu đề
                <input className="input w-full" placeholder="Tìm theo tiêu đề" maxLength={100}
                  value={draft.search} onChange={e => setDraft(p => ({ ...p, search: e.target.value }))} />
              </label>
              <label className="space-y-1 text-xs font-medium text-content-secondary">
                Trạng thái
                <select className="input w-full" value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))}>
                  <option value="">Tất cả trạng thái</option>
                  {['active','hidden','deleted'].map(s => <option key={s} value={s}>{LABELS[s]}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-content-secondary">
                Loại bài
                <select className="input w-full" value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value }))}>
                  <option value="">Tất cả loại bài</option>
                  {['question','discussion','document'].map(s => <option key={s} value={s}>{LABELS[s]}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-content-secondary">
                ID tác giả
                <input className="input w-full" type="number" min="1" placeholder="Tùy chọn"
                  value={draft.author_id} onChange={e => setDraft(p => ({ ...p, author_id: e.target.value }))} />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className="btn-primary px-4 py-2 text-sm">Áp dụng bộ lọc</button>
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => {
                setDraft(EMPTY); setFilters(EMPTY); setPage(1); setSelectedId(null)
              }}>Xóa lọc</button>
              {pagination && <span className="ml-auto text-xs text-content-secondary">{pagination.total} bài phù hợp</span>}
            </div>
          </form>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <section className="card space-y-3 min-w-0" aria-label="Danh sách bài quản trị">
              <h2 className="font-bold text-content">Danh sách bài viết</h2>
              {listing.isLoading ? <p role="status" className="text-sm text-content-secondary">Đang tải bài viết...</p>
                : listing.isError ? <div role="alert" className="space-y-2 text-sm text-rose-600">
                  <p>{showError(listing.error)}</p>
                  <button className="btn-secondary" type="button" onClick={() => listing.refetch()}>Thử lại</button>
                </div>
                  : !rows.length ? <p className="py-10 text-center text-sm text-content-secondary">Không có bài viết phù hợp.</p>
                    : <div className="space-y-2">
                      {rows.map(post => <article key={post.id} className="rounded-2xl border border-surface-border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-semibold text-content">{post.title}</p>
                            <p className="text-xs text-content-secondary">#{post.id} · {LABELS[post.post_type] || post.post_type} · {post.author?.full_name || 'Không rõ tác giả'}</p>
                            <span className="inline-block rounded-full border border-surface-border px-2 py-0.5 text-xs text-content-secondary">{LABELS[post.status] || post.status}</span>
                          </div>
                          <button className="btn-secondary shrink-0 inline-flex items-center gap-1 px-3 py-2 text-xs" type="button" onClick={() => selectItem(post.id)} aria-label={'Xem bài #' + post.id}>
                            <Eye size={15} /> Xem
                          </button>
                        </div>
                      </article>)}
                    </div>}
              <nav aria-label="Phân trang nội dung" className="flex items-center justify-between border-t border-surface-border pt-3 text-sm">
                <button className="btn-secondary inline-flex items-center gap-1" disabled={page <= 1 || listing.isFetching} onClick={() => setPage(p => p - 1)} type="button"><ChevronLeft size={16} /> Trước</button>
                <span className="text-content-secondary">Trang {page} / {pages}</span>
                <button className="btn-secondary inline-flex items-center gap-1" disabled={page >= pages || listing.isFetching} onClick={() => setPage(p => p + 1)} type="button">Sau <ChevronRight size={16} /></button>
              </nav>
            </section>

            <section className="card space-y-4 min-w-0" aria-label="Chi tiết kiểm duyệt">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-content">Chi tiết bài viết</h2>
                {selectedId !== null && <button type="button" aria-label="Đóng chi tiết" onClick={() => selectItem(null)}><X size={18} /></button>}
              </div>
              {selectedId === null ? <p className="py-10 text-center text-sm text-content-secondary">Chọn một bài viết từ danh sách để xem và xử lý.</p>
                : detail.isLoading ? <p role="status" className="text-sm text-content-secondary">Đang tải chi tiết...</p>
                  : detail.isError ? <p role="alert" className="text-sm text-rose-600">{showError(detail.error)}</p>
                    : item && <>
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-content">{item.title}</h3>
                        <p className="text-xs text-content-secondary">ID {item.id} · {LABELS[item.status]} · {LABELS[item.post_type]}</p>
                        <p className="whitespace-pre-wrap break-words text-sm text-content-secondary">{item.content || 'Không có nội dung mô tả.'}</p>
                        {item.subject && <p className="text-xs text-content-secondary">Môn học: {item.subject}</p>}
                      </div>
                      {item.status === 'deleted' ? <p className="rounded-xl bg-surface-muted p-3 text-sm text-content-secondary">Bài đã xóa. Không hỗ trợ khôi phục.</p>
                        : <div className="flex flex-wrap gap-2">
                          {item.status === 'active' && <button type="button" className="btn-secondary text-sm" disabled={moderate.isPending} onClick={() => startAction('hidden')}>Ẩn bài viết</button>}
                          <button type="button" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={moderate.isPending} onClick={() => startAction('deleted')}>Xóa bài viết</button>
                        </div>}
                      {!!action && <form className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3" onSubmit={e => { e.preventDefault(); if (canSubmit) moderate.mutate() }}>
                        <p className="flex items-center gap-2 text-sm font-semibold text-content"><AlertTriangle size={16} /> Xác nhận {action === 'hidden' ? 'ẩn' : 'xóa'} bài #{selectedId}</p>
                        <label className="block space-y-1 text-xs text-content-secondary">
                          Lý do kiểm duyệt (5–500 ký tự)
                          <textarea aria-label="Lý do kiểm duyệt" className="input min-h-24 w-full" maxLength={500} required value={reason} onChange={e => setReason(e.target.value)} />
                        </label>
                        <div className="flex gap-2">
                          <button type="submit" className="btn-primary text-sm" disabled={!canSubmit}>{moderate.isPending ? 'Đang xử lý...' : 'Xác nhận kiểm duyệt'}</button>
                          <button type="button" className="btn-secondary text-sm" disabled={moderate.isPending} onClick={() => setAction('')}>Hủy</button>
                        </div>
                      </form>}
                    </>}
            </section>
          </div>
        </>
      )}

      {/* ── TAB 2: Hàng đợi báo cáo (Reports Queue) ── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-secondary">Lọc theo trạng thái:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { value: 'pending', label: 'Chờ xử lý', count: pendingCount },
                  { value: 'reviewed', label: 'Đã duyệt' },
                  { value: 'dismissed', label: 'Đã bác bỏ' },
                  { value: '', label: 'Tất cả' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      setReportStatusFilter(s.value)
                      setReportPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      reportStatusFilter === s.value
                        ? 'bg-[#16a34a] text-white shadow-2xs'
                        : 'bg-surface-muted text-content-secondary hover:text-content hover:bg-surface-border'
                    }`}
                  >
                    {s.label}
                    {s.count > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20">
                        {s.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {reportPagination && (
              <span className="text-xs text-content-secondary">
                {reportPagination.total} báo cáo
              </span>
            )}
          </div>

          {/* Reports List */}
          <div className="space-y-3">
            {reportsQuery.isLoading ? (
              <div className="card py-12 text-center text-sm text-content-secondary flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#16a34a]" />
                <span>Đang tải danh sách báo cáo...</span>
              </div>
            ) : reportsQuery.isError ? (
              <div className="card py-8 text-center text-sm text-rose-500">
                Không thể tải hàng đợi báo cáo. Vui lòng thử lại.
              </div>
            ) : !reportRows.length ? (
              <div className="card py-12 text-center text-sm text-content-secondary">
                {reportStatusFilter === 'pending'
                  ? 'Tuyệt vời! Không có báo cáo vi phạm nào đang chờ xử lý.'
                  : 'Không tìm thấy báo cáo nào trong danh mục này.'}
              </div>
            ) : (
              reportRows.map((rep) => (
                <div
                  key={rep.id}
                  className="card p-4 sm:p-5 space-y-3 border border-surface-border hover:border-surface-border/80 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border/60 pb-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-content">Báo cáo #{rep.id}</span>
                      <span className="text-content-secondary">•</span>
                      <span className="text-content-secondary flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(rep.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        rep.status === 'pending'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : rep.status === 'reviewed'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-[#303132] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {REPORT_STATUS_LABELS[rep.status] || rep.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Post Info */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-surface-muted/50 border border-surface-border/40">
                      <span className="font-semibold text-content-secondary block">
                        Bài viết bị báo cáo (ID #{rep.post_id}):
                      </span>
                      <Link
                        to={`/posts/${rep.post_id}`}
                        target="_blank"
                        className="font-bold text-sm text-[#16a34a] hover:underline line-clamp-2 block"
                      >
                        {rep.post?.title || `Bài viết #${rep.post_id}`}
                      </Link>
                      <p className="text-content-secondary text-[11px]">
                        Tác giả: <strong className="text-content">{rep.post?.author?.full_name || 'Không rõ'}</strong> • Trạng thái bài:{' '}
                        <span className="font-semibold">{LABELS[rep.post?.status] || rep.post?.status}</span>
                      </p>
                    </div>

                    {/* Reporter Info & Reason */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-surface-muted/50 border border-surface-border/40">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-content-secondary">Người báo cáo:</span>
                        <span className="font-bold text-content">{rep.reporter?.full_name || 'Người dùng'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-content-secondary">Lý do:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {REPORT_REASONS[rep.reason] || rep.reason}
                        </span>
                      </div>
                      {rep.details && (
                        <div className="pt-1 border-t border-surface-border/50">
                          <span className="text-content-secondary block mb-0.5">Mô tả thêm:</span>
                          <p className="italic text-content break-words bg-white dark:bg-[#202122] p-2 rounded-lg">
                            &ldquo;{rep.details}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for Pending reports */}
                  {rep.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-border/60">
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmReportAction({
                            reportId: rep.id,
                            action: 'dismiss',
                            postTitle: rep.post?.title,
                          })
                        }
                        className="btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer hover:text-slate-700"
                      >
                        <XCircle size={15} />
                        Bác bỏ báo cáo
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmReportAction({
                            reportId: rep.id,
                            action: 'approve',
                            postTitle: rep.post?.title,
                          })
                        }
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                      >
                        <CheckCircle2 size={15} />
                        Duyệt vi phạm (Ẩn bài)
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {reportPages > 1 && (
            <nav aria-label="Phân trang báo cáo" className="card flex items-center justify-between pt-3 text-sm">
              <button
                className="btn-secondary inline-flex items-center gap-1 text-xs"
                disabled={reportPage <= 1 || reportsQuery.isFetching}
                onClick={() => setReportPage((p) => p - 1)}
                type="button"
              >
                <ChevronLeft size={15} /> Trước
              </button>
              <span className="text-content-secondary text-xs">
                Trang {reportPage} / {reportPages}
              </span>
              <button
                className="btn-secondary inline-flex items-center gap-1 text-xs"
                disabled={reportPage >= reportPages || reportsQuery.isFetching}
                onClick={() => setReportPage((p) => p + 1)}
                type="button"
              >
                Sau <ChevronRight size={15} />
              </button>
            </nav>
          )}

          {/* Confirmation Modal for Admin Report Action */}
          {confirmReportAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="bg-surface-card rounded-3xl border border-surface-border p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400 font-bold text-base">
                  <AlertTriangle size={20} />
                  <span>
                    Xác nhận {confirmReportAction.action === 'approve' ? 'Duyệt vi phạm' : 'Bác bỏ báo cáo'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                  {confirmReportAction.action === 'approve'
                    ? `Bạn có chắc chắn muốn duyệt vi phạm cho báo cáo #${confirmReportAction.reportId}? Bài viết sẽ ngay lập tức được chuyển sang trạng thái Ẩn và ghi vào Nhật ký kiểm duyệt.`
                    : `Bạn có chắc chắn muốn bác bỏ báo cáo #${confirmReportAction.reportId}? Bài viết sẽ tiếp tục hiển thị bình thường.`}
                </p>

                {confirmReportAction.action === 'approve' && (
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-content block">Lý do xử lý kiểm duyệt (tùy chọn):</label>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={adminReportReason}
                      onChange={(e) => setAdminReportReason(e.target.value)}
                      placeholder="Ghi chú lý do ẩn bài viết (mặc định theo lý do vi phạm)..."
                      className="input w-full text-xs py-2 resize-none"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReportAction(null)
                      setAdminReportReason('')
                    }}
                    disabled={handleReportMutation.isPending}
                    className="btn-secondary px-4 py-2 text-xs rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={handleReportMutation.isPending}
                    onClick={() =>
                      handleReportMutation.mutate({
                        reportId: confirmReportAction.reportId,
                        action: confirmReportAction.action,
                        reason: adminReportReason,
                      })
                    }
                    className={`px-4 py-2 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 transition-all ${
                      confirmReportAction.action === 'approve'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {handleReportMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
