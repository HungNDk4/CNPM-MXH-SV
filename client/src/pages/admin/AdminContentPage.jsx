import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ShieldCheck, Search, Eye, ChevronLeft, ChevronRight, X, AlertTriangle, ClipboardList } from 'lucide-react'
import { adminAPI } from '@/services/api'

const LABELS = {
  active: 'Công khai', hidden: 'Đã ẩn', deleted: 'Đã xóa',
  question: 'Hỏi đáp', discussion: 'Thảo luận', document: 'Tài liệu PDF',
}
const EMPTY = { search: '', status: '', type: '', author_id: '' }
const showError = (err) => err.response?.data?.message || 'Không thể kết nối máy chủ.'

export default function AdminContentPage() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(EMPTY)
  const [filters, setFilters] = useState(EMPTY)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [action, setAction] = useState('')
  const [reason, setReason] = useState('')
  const params = { page, limit: 10, ...Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '')
  ) }

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

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      <header className="rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 p-6 md:p-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck size={15} /> Quản trị viên
        </span>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-content">Quản lý nội dung</h1>
            <p className="mt-2 text-sm text-content-secondary">Tìm bài viết, xem nội dung và kiểm duyệt có lý do.</p>
          </div>
          <Link className="btn-secondary text-sm inline-flex items-center gap-2" to="/admin/audit-logs">
            <ClipboardList size={16} /> Nhật ký kiểm duyệt
          </Link>
        </div>
      </header>

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
    </div>
  )
}
