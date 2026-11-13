import { useState } from 'react'
import { Link } from 'react-router-dom'
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
const showError = (err) => err.response?.data?.message || 'Không thể kết nối máy chủ.'

export default function AdminContentPage() {
  const queryClient = useQueryClient()

  // ── Reports State ────────────────────────────────────────────
  const [reportPage, setReportPage] = useState(1)
  const [reportStatusFilter, setReportStatusFilter] = useState('pending')
  const [confirmReportAction, setConfirmReportAction] = useState(null) // { reportId, action: 'approve' | 'dismiss', postTitle }
  const [adminReportReason, setAdminReportReason] = useState('')

  // ── Queries ──────────────────────────────────────────────────
  const reportsQuery = useQuery({
    queryKey: ['admin-reports', reportPage, reportStatusFilter],
    queryFn: async () => (await adminAPI.getReports({
      page: reportPage,
      limit: 10,
      status: reportStatusFilter || undefined,
    })).data,
    retry: false,
  })

  // Global pending reports count for status badge
  const pendingCount = reportsQuery.data?.pagination?.pendingCount ?? 0

  // ── Mutations ────────────────────────────────────────────────
  const handleReportMutation = useMutation({
    mutationFn: ({ reportId, action, reason }) =>
      adminAPI.handleReport(reportId, { action, reason: reason?.trim() || undefined }),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Xử lý báo cáo thành công.')
      setConfirmReportAction(null)
      setAdminReportReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] })
    },
    onError: (err) => toast.error(showError(err)),
  })

  // Reports data
  const reportRows = reportsQuery.data?.data || []
  const reportPagination = reportsQuery.data?.pagination
  const reportPages = Math.max(1, reportPagination?.totalPages || 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AdminLayoutNav
        title="Quản trị viên — Hàng đợi báo cáo"
        subtitle="Tiếp nhận, kiểm tra và xử lý các báo cáo vi phạm tiêu chuẩn cộng đồng từ sinh viên."
      />

      {/* ── Reports Status Filter & Counter ── */}
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-content-secondary">Lọc theo trạng thái:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
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
                    ? 'bg-[#16a34a] text-white shadow-2xs font-bold'
                    : 'bg-surface-muted text-content-secondary hover:text-content hover:bg-surface-border'
                }`}
              >
                {s.label}
                {s.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {s.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {reportPagination && (
          <span className="text-xs font-semibold text-content-secondary">
            {reportPagination.total} báo cáo
          </span>
        )}
      </div>

      {/* ── Reports List ── */}
      <div className="space-y-3">
        {reportsQuery.isLoading ? (
          <div className="card py-14 text-center text-sm text-content-secondary flex flex-col items-center gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-[#16a34a]" />
            <span>Đang tải danh sách báo cáo vi phạm...</span>
          </div>
        ) : reportsQuery.isError ? (
          <div className="card py-10 text-center text-sm text-rose-500">
            Không thể tải hàng đợi báo cáo. Vui lòng thử lại.
          </div>
        ) : !reportRows.length ? (
          <div className="card py-14 text-center text-sm text-content-secondary space-y-2">
            <Flag className="w-8 h-8 text-[#16a34a] mx-auto opacity-60" />
            <p className="font-bold text-slate-800 dark:text-slate-200">
              {reportStatusFilter === 'pending'
                ? 'Tuyệt vời! Không có báo cáo vi phạm nào đang chờ xử lý.'
                : 'Không tìm thấy báo cáo nào trong danh mục này.'}
            </p>
            <p className="text-xs text-slate-500">Môi trường mạng xã hội học thuật đang rất an toàn và tích cực.</p>
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
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      rep.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : rep.status === 'reviewed'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {REPORT_STATUS_LABELS[rep.status] || rep.status}
                  </span>
                </div>
              </div>

              {/* Reported Post Information */}
              <div className="p-3 rounded-xl bg-surface-muted border border-surface-border/60 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-content-secondary flex items-center gap-1">
                      <FileText size={12} /> Bài viết bị báo cáo (ID #{rep.post_id}):
                    </span>
                    <p className="font-bold text-sm text-content truncate mt-0.5">
                      {rep.post?.title || 'Bài viết đã không còn tồn tại hoặc đã xóa'}
                    </p>
                  </div>
                  {rep.post_id && (
                    <Link
                      to={`/posts/${rep.post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 shrink-0"
                    >
                      <Eye size={13} />
                      <span>Xem bài</span>
                    </Link>
                  )}
                </div>
                {rep.post?.author && (
                  <p className="text-xs text-content-secondary flex items-center gap-1">
                    <User size={12} />
                    <span>Tác giả: <strong>{rep.post.author.full_name}</strong> ({rep.post.author.email})</span>
                  </p>
                )}
              </div>

              {/* Reporter Info & Reason */}
              <div className="text-xs space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-content-secondary">
                    Người báo cáo: <strong>{rep.reporter?.full_name || 'Thành viên'}</strong> ({rep.reporter?.email || 'N/A'})
                  </span>
                  <span className="text-content-secondary">
                    Lý do: <strong className="text-rose-600 dark:text-rose-400">{REPORT_REASONS[rep.reason] || rep.reason}</strong>
                  </span>
                </div>
                {rep.details && (
                  <p className="p-2.5 rounded-lg bg-surface-card border border-surface-border text-content leading-relaxed italic">
                    "{rep.details}"
                  </p>
                )}
              </div>

              {/* Actions for Pending Reports */}
              {rep.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border/60">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmReportAction({
                        reportId: rep.id,
                        action: 'dismiss',
                        postTitle: rep.post?.title || `Bài viết #${rep.post_id}`,
                      })
                    }
                    className="btn-secondary px-3 py-1.5 text-xs text-content-secondary hover:text-content inline-flex items-center gap-1 rounded-xl"
                  >
                    <XCircle size={14} />
                    <span>Bác bỏ báo cáo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmReportAction({
                        reportId: rep.id,
                        action: 'approve',
                        postTitle: rep.post?.title || `Bài viết #${rep.post_id}`,
                      })
                    }
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <AlertTriangle size={14} />
                    <span>Duyệt vi phạm (Ẩn bài viết)</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        {/* Reports Pagination */}
        {reportPages > 1 && (
          <div className="flex items-center justify-between pt-3 text-xs">
            <button
              type="button"
              disabled={reportPage <= 1}
              onClick={() => setReportPage((p) => Math.max(1, p - 1))}
              className="btn-secondary px-3 py-1.5 rounded-xl disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Trang trước</span>
            </button>
            <span className="text-content-secondary">
              Trang <strong>{reportPage}</strong> / {reportPages}
            </span>
            <button
              type="button"
              disabled={reportPage >= reportPages}
              onClick={() => setReportPage((p) => p + 1)}
              className="btn-secondary px-3 py-1.5 rounded-xl disabled:opacity-40 flex items-center gap-1"
            >
              <span>Trang sau</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Confirmation Modal for Report Action ── */}
      {confirmReportAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="card max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-border">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="font-bold text-base text-content flex items-center gap-2">
                {confirmReportAction.action === 'approve' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    <span>Xác nhận duyệt vi phạm</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-slate-500" />
                    <span>Xác nhận bác bỏ báo cáo</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setConfirmReportAction(null)
                  setAdminReportReason('')
                }}
                className="text-content-secondary hover:text-content"
              >
                <X size={18} />
              </button>
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
  )
}
