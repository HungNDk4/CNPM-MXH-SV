import { useSearchParams, Link } from 'react-router-dom'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const status   = params.get('status')
  const orderId  = params.get('order_id')
  const code     = params.get('code')

  const isSuccess = status === 'success'

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card max-w-md w-full text-center animate-slide-up">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">Thanh toán thành công!</h2>
            <p className="text-slate-400 mb-2 text-sm">Mã đơn hàng: <span className="text-slate-200 font-mono">#{orderId}</span></p>
            <p className="text-slate-400 text-sm mb-6">Bạn đã được cấp quyền truy cập tài liệu.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-2">Thanh toán thất bại</h2>
            {code && <p className="text-slate-500 text-sm mb-2">Mã lỗi VNPay: <span className="font-mono">{code}</span></p>}
            <p className="text-slate-400 text-sm mb-6">Giao dịch không thành công. Vui lòng thử lại.</p>
          </>
        )}

        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-secondary">Về trang chủ</Link>
          {!isSuccess && <Link to="/" className="btn-primary">Thử lại</Link>}
        </div>
      </div>
    </div>
  )
}
