import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { adminAPI } from '@/services/api'
import AdminLayoutNav from '@/components/admin/AdminLayoutNav'
import {
  Users, Search, RotateCcw, Lock, Unlock, ShieldCheck,
  ChevronLeft, ChevronRight, ClipboardList, X, AlertTriangle,
} from 'lucide-react'

const accountStatus = (active) => active
  ? { label: 'Đang hoạt động', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' }
  : { label: 'Đã khóa', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' }

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN')
}

const errorText = (error) => error?.response?.data?.message || 'Không thể kết nối máy chủ.'

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [draftSearch, setDraftSearch] = useState('')
  const [search, setSearch] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [target, setTarget] = useState(null)
  const [reason, setReason] = useState('')

  const params = { page, limit: 10, status, ...(search ? { search } : {}) }
  const accounts = useQuery({
    queryKey: ['admin-accounts', page, status, search],
    queryFn: async () => (await adminAPI.getAccounts(params)).data,
    retry: false,
  })
  const audit = useQuery({
    queryKey: ['admin-account-audit', auditPage],
    queryFn: async () => (await adminAPI.getAccountAuditLogs({ page: auditPage, limit: 8 })).data,
    retry: false,
  })
  const changeStatus = useMutation({
    mutationFn: ({ id, isActive, note }) => adminAPI.setAccountStatus(id, isActive, note),
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Trạng thái tài khoản đã được cập nhật.')
      setTarget(null)
      setReason('')
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-account-audit'] })
    },
    onError: (error) => toast.error(errorText(error)),
  })

  const rows = accounts.data?.data || []
  const pagination = accounts.data?.pagination || { total: 0, totalPages: 1 }
  const auditRows = audit.data?.data || []
  const auditPagination = audit.data?.pagination || { total: 0, totalPages: 1 }
  const canSubmit = reason.trim().length >= 5 && reason.trim().length <= 500 &&
    !/[\x00-\x1f\x7f]/.test(reason) && !changeStatus.isPending

  function submitFilter(event) {
    event.preventDefault()
    setSearch(draftSearch.trim())
    setPage(1)
  }

  function openAction(account) {
    setTarget(account)
    setReason('')
  }

  function submitAction(event) {
    event.preventDefault()
    if (!target || !canSubmit) return
    if (target.id === user?.id && target.is_active) return
    changeStatus.mutate({ id: target.id, isActive: !target.is_active, note: reason.trim() })
  }

  return (
    <main className="max-w-6xl mx-auto space-y-6 pb-12">
      <AdminLayoutNav
        title="Quản lý tài khoản người dùng"
        subtitle="Theo dõi tài khoản, khóa hoặc mở khóa có lý do và lịch sử kiểm duyệt được lưu trên máy chủ."
      />

      <section className="card space-y-4" aria-label="Bộ lọc tài khoản">
        <h2 className="flex items-center gap-2 font-bold text-content"><Users size={18} /> Danh sách tài khoản</h2>
        <form onSubmit={submitFilter} className="flex flex-col md:flex-row gap-3">
          <label className="flex-1 space-y-1 text-xs font-semibold text-content-secondary">
            Tìm theo tên hoặc email
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-content-secondary" />
              <input
                className="input w-full pl-9" value={draftSearch} maxLength={100}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder="Tên hoặc email người dùng"
              />
            </div>
          </label>
          <label className="md:w-48 space-y-1 text-xs font-semibold text-content-secondary">
            Trạng thái
            <select className="input w-full" value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </select>
          </label>
          <button className="btn-primary self-end" type="submit">Lọc tài khoản</button>
        </form>
        <div className="flex justify-between items-center text-xs text-content-secondary">
          <span>Tìm thấy {pagination.total} tài khoản</span>
          {search && <button type="button" className="font-bold text-emerald-600" onClick={() => {
            setSearch(''); setDraftSearch(''); setPage(1)
          }}>Xóa tìm kiếm</button>}
        </div>

        {accounts.isLoading ? (
          <p role="status" className="py-8 text-center text-content-secondary">Đang tải tài khoản...</p>
        ) : accounts.isError ? (
          <div role="alert" className="py-8 text-center space-y-3">
            <p>Không thể tải danh sách tài khoản. {errorText(accounts.error)}</p>
            <button type="button" className="btn-secondary" onClick={() => accounts.refetch()}>
              <RotateCcw size={15} /> Thử lại
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-content-secondary">Không có tài khoản nào phù hợp.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((account) => {
              const { label, color } = accountStatus(account.is_active)
              const selfLock = account.id === user?.id && account.is_active
              return (
                <article key={account.id} className="rounded-2xl border border-surface-border p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold text-content truncate">{account.full_name}</p>
                    <p className="text-xs text-content-secondary break-all">{account.email}</p>
                    <p className="text-xs text-content-secondary">
                      #{account.id} · {account.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'} · Tham gia {dateLabel(account.created_at)}
                    </p>
                    <span className={`inline-flex text-xs font-bold rounded-full px-2.5 py-1 ${color}`}>{label}</span>
                  </div>
                  <button type="button" className="btn-secondary text-sm inline-flex items-center gap-2 shrink-0"
                    onClick={() => openAction(account)} disabled={selfLock}
                    title={selfLock ? 'Không được tự khóa tài khoản Admin của bạn' : undefined}>
                    {account.is_active ? <Lock size={16} /> : <Unlock size={16} />}
                    {account.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          <button type="button" className="btn-secondary" disabled={page <= 1}
            onClick={() => setPage((x) => Math.max(1, x - 1))} aria-label="Trang tài khoản trước">
            <ChevronLeft size={16} />
          </button>
          <span>Trang {page} / {Math.max(1, pagination.totalPages)}</span>
          <button type="button" className="btn-secondary" disabled={page >= pagination.totalPages}
            onClick={() => setPage((x) => Math.min(pagination.totalPages, x + 1))}
            aria-label="Trang tài khoản sau">
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <section className="card space-y-4" aria-label="Lịch sử khóa và mở khóa tài khoản">
        <h2 className="font-bold text-content flex gap-2 items-center">
          <ClipboardList size={18} /> Nhật ký kiểm duyệt tài khoản
        </h2>
        {audit.isLoading ? (
          <p role="status" className="text-sm text-content-secondary">Đang tải nhật ký...</p>
        ) : audit.isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-content-secondary">Không tải được nhật ký. {errorText(audit.error)}</p>
            <button type="button" className="btn-secondary" onClick={() => audit.refetch()}>Thử lại</button>
          </div>
        ) : auditRows.length === 0 ? (
          <p className="text-sm text-content-secondary">Chưa có thao tác khóa/mở khóa nào.</p>
        ) : (
          <div className="space-y-3">
            {auditRows.map((row) => (
              <div key={row.id} className="rounded-xl border border-surface-border p-3 space-y-1">
                <p className="font-semibold text-sm text-content">
                  Admin #{row.actor_admin_id} {row.new_active ? 'mở khóa' : 'khóa'} tài khoản #{row.target_user_id}
                </p>
                <p className="text-xs text-content-secondary">{dateLabel(row.created_at)}</p>
                <p className="text-sm text-content-secondary whitespace-pre-wrap break-words">{row.reason}</p>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center items-center gap-3 text-sm">
          <button type="button" className="btn-secondary" disabled={auditPage <= 1}
            onClick={() => setAuditPage((x) => Math.max(1, x - 1))} aria-label="Trang nhật ký trước">
            <ChevronLeft size={16} />
          </button>
          <span>Trang {auditPage} / {Math.max(1, auditPagination.totalPages)}</span>
          <button type="button" className="btn-secondary" disabled={auditPage >= auditPagination.totalPages}
            onClick={() => setAuditPage((x) => Math.min(auditPagination.totalPages, x + 1))}
            aria-label="Trang nhật ký sau">
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {target && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="account-action-title"
            className="card w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h2 id="account-action-title" className="font-extrabold text-lg text-content flex items-center gap-2">
                {target.is_active ? <Lock size={20} /> : <ShieldCheck size={20} />}
                {target.is_active ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa'}
              </h2>
              <button type="button" className="btn-secondary" disabled={changeStatus.isPending}
                onClick={() => setTarget(null)} aria-label="Đóng hộp thoại"><X size={17} /></button>
            </div>
            <p className="text-sm text-content-secondary">
              {target.full_name} · {target.email}
            </p>
            <p className="text-xs text-content-secondary flex items-center gap-2">
              <AlertTriangle size={16} />
              Khóa sẽ vô hiệu hóa phiên đăng nhập của tài khoản. Mở khóa không khôi phục phiên cũ.
            </p>
            <form className="space-y-4" onSubmit={submitAction}>
              <label className="block space-y-1 text-sm font-semibold text-content-secondary">
                Lý do kiểm duyệt (5–500 ký tự)
                <textarea required minLength={5} maxLength={500} className="input w-full min-h-28"
                  value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể cho thao tác này" />
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-secondary" disabled={changeStatus.isPending}
                  onClick={() => setTarget(null)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={!canSubmit}>
                  {changeStatus.isPending ? 'Đang xử lý...' : (target.is_active ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
