import { HelpCircle, FileText, MessageSquare, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const TYPE_BADGE_CONFIG = {
  question: {
    label: 'Hỏi đáp',
    icon: HelpCircle,
    className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    iconColor: 'text-amber-500',
  },
  document: {
    label: 'Tài liệu',
    icon: FileText,
    className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    iconColor: 'text-emerald-500',
  },
  discussion: {
    label: 'Thảo luận',
    icon: MessageSquare,
    className: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200/80 dark:border-green-800/60',
    iconColor: 'text-green-500',
  },
}

export default function Badge({
  type,
  label,
  icon: CustomIcon,
  variant,
  className = '',
  size = 'md',
}) {
  const config = type ? TYPE_BADGE_CONFIG[type] : null
  const displayLabel = label || config?.label || 'Chung'
  const Icon = CustomIcon || config?.icon

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  let colorClasses = config?.className || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  if (variant === 'free') {
    colorClasses = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
  } else if (variant === 'paid') {
    colorClasses = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shadow-2xs shrink-0',
        sizeClasses[size],
        colorClasses,
        className
      )}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  )
}
