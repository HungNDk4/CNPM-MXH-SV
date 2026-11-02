import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có nội dung nào trong danh mục này.',
  actionLabel,
  actionLink,
  onAction,
  className = '',
}) {
  return (
    <div className={cn('card text-center py-16 px-6 space-y-4 max-w-lg mx-auto', className)}>
      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-bento">
        <Icon className="w-8 h-8" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
