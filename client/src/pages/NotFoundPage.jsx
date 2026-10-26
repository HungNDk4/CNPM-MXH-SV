import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center">
      <div className="animate-slide-up space-y-4">
        <p className="text-8xl font-black text-primary">404</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trang không tồn tại</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Trang bạn tìm kiếm đã được di chuyển hoặc không tồn tại.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
