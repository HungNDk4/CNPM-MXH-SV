import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const status   = params.get('status')
  const orderId  = params.get('order_id')
  const code     = params.get('code')

  const isSuccess = status === 'success'

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card max-w-md w-full text-center animate-slide-up space-y-4">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">Thanh toán thành công!</h2>
              {orderId && (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Mã đơn hàng: <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">#{orderId}</span>
                </p>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Bạn đã được cấp quyền truy cập tài liệu.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">Thanh toán thất bại</h2>
              {code && <p className="text-slate-500 dark:text-slate-400 text-xs">Mã phản hồi: <span className="font-mono font-medium">{code}</span></p>}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Giao dịch không thành công hoặc đã bị hủy.</p>
          </>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <Link to="/" className="btn-secondary inline-flex items-center gap-1.5 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
          {!isSuccess && <Link to="/" className="btn-primary text-sm">Thử lại</Link>}
        </div>
      </div>
    </div>
  )
}
