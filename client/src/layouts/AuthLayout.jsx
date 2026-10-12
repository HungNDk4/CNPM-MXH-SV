import { Outlet, Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4
                    bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))]
                    from-primary-900/20 via-surface to-surface">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <div className="text-left">
              <h1 className="font-bold text-gradient text-xl">Mini Study Network</h1>
              <p className="text-slate-500 text-xs">Mạng học tập sinh viên</p>
            </div>
          </Link>
        </div>

        {/* Auth card */}
        <div className="card animate-slide-up">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
