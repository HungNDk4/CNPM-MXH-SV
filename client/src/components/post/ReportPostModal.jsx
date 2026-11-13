import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { postAPI } from '@/services/api'
import Modal from '@/components/common/Modal'
import { Flag, AlertTriangle, Loader2, Check } from 'lucide-react'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam hoặc nội dung quảng cáo' },
  { value: 'inappropriate', label: 'Nội dung phản cảm, không phù hợp học tập' },
  { value: 'copyright', label: 'Vi phạm bản quyền học liệu / tài liệu' },
  { value: 'harassment', label: 'Quấy rối, đe dọa hoặc ngôn từ thù địch' },
  { value: 'other', label: 'Lý do khác' },
]

export default function ReportPostModal({ isOpen, onClose, postId, postTitle }) {
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')

  const reportMutation = useMutation({
    mutationFn: (payload) => postAPI.report(postId, payload),
    onSuccess: () => {
      toast.success('Báo cáo bài viết thành công. Ban quản trị sẽ sớm xem xét.')
      setReason('spam')
      setDetails('')
      onClose()
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Không thể gửi báo cáo, vui lòng thử lại sau.'
      toast.error(msg)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason) {
      toast.error('Vui lòng chọn lý do báo cáo.')
      return
    }
    reportMutation.mutate({
      reason,
      details: details.trim() || undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Báo cáo vi phạm"
      icon={Flag}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {postTitle && (
          <div className="p-3 rounded-xl bg-surface-muted border border-surface-border text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
              Bài viết đang báo cáo:
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
              {postTitle}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Lý do báo cáo <span className="text-rose-500">*</span>
          </label>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                  reason === r.value
                    ? 'border-[#16a34a] bg-emerald-50/50 dark:bg-emerald-950/20 text-[#16a34a] dark:text-[#4ade80] font-semibold'
                    : 'border-surface-border hover:bg-surface-muted text-slate-700 dark:text-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-[#16a34a] focus:ring-[#16a34a]"
                />
                <span>{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="report-details" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Chi tiết bổ sung (tùy chọn)
            </label>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {details.length} / 500 ký tự
            </span>
          </div>
          <textarea
            id="report-details"
            rows={3}
            maxLength={500}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Cung cấp thêm ngữ cảnh hoặc chi tiết về vi phạm..."
            className="input text-xs py-2 w-full resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            disabled={reportMutation.isPending}
            className="btn-secondary px-4 py-2 text-xs rounded-xl cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={reportMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Flag className="w-3.5 h-3.5" />
                Gửi báo cáo
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

