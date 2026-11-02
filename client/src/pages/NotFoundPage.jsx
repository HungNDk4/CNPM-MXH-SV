import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center p-4">
      <div className="card max-w-md w-full p-8 rounded-3xl border border-surface-border shadow-xl shadow-slate-900/5 dark:shadow-black/40 animate-slide-up space-y-6">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 bg-gradient-to-tr from-primary via-purple-600 to-rose-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Compass className="w-12 h-12 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-6xl font-black bg-gradient-to-r from-primary via-purple-600 to-rose-500 bg-clip-text text-transparent">
            404
          </p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Trang không tồn tại</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
            Liên kết bạn truy cập đã bị đổi tên, chuyển đi hoặc không còn tồn tại trên mạng xã hội.
          </p>
        </div>

        <div className="pt-2">
          <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2 text-sm py-2.5 px-6 rounded-2xl font-bold shadow-md shadow-primary/25">
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
