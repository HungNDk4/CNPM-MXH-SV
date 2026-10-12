import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center">
      <div className="animate-slide-up">
        <p className="text-8xl font-bold text-gradient mb-4">404</p>
        <h1 className="text-2xl font-semibold text-slate-200 mb-2">Trang không tồn tại</h1>
        <p className="text-slate-500 mb-8">Trang bạn tìm kiếm đã được di chuyển hoặc không tồn tại.</p>
        <Link to="/" className="btn-primary">← Về trang chủ</Link>
      </div>
    </div>
  )
}
