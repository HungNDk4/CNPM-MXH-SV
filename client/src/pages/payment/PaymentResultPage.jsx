import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowLeft, RefreshCw, FileCheck } from 'lucide-react'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const status   = params.get('status')
  const orderId  = params.get('order_id')
  const code     = params.get('code')

  const isSuccess = status === 'success'

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center p-8 rounded-3xl border border-surface-border shadow-xl shadow-slate-900/5 dark:shadow-black/40 animate-slide-up space-y-6">
        {isSuccess ? (
          <>
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Thanh toán thành công!</h2>
              {orderId && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-surface-border text-xs text-slate-600 dark:text-slate-400">
                  <span>Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">#{orderId}</span>
                </div>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3 text-left">
              <FileCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Bạn đã được mở khóa quyền truy cập và có thể tải tài liệu về máy bất cứ lúc nào.</span>
            </div>
          </>
        ) : (
          <>
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-rose-500/25">
                <XCircle className="w-10 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Thanh toán thất bại</h2>
              {code && (
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Mã phản hồi: <span className="font-mono font-bold text-rose-500">{code}</span>
                </p>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Giao dịch chưa được hoàn tất hoặc đã bị hủy bởi người dùng/cổng thanh toán.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/" className="btn-secondary inline-flex items-center justify-center gap-2 text-sm py-2.5 px-5 rounded-2xl font-bold">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
          {!isSuccess && (
            <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2 text-sm py-2.5 px-5 rounded-2xl font-bold shadow-md shadow-primary/25">
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
