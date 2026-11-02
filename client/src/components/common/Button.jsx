import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2'

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-glow-indigo focus-visible:ring-primary-500/40 rounded-xl',
    secondary: 'bg-surface-card hover:bg-surface-muted text-slate-700 dark:text-slate-200 border border-surface-border hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs focus-visible:ring-slate-400/30 rounded-xl',
    ghost: 'hover:bg-surface-muted text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-glow-rose focus-visible:ring-rose-500/40 rounded-xl',
    pill: 'rounded-full px-4 py-1.5 text-xs font-semibold bg-surface-muted text-slate-700 dark:text-slate-200 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/40 dark:hover:text-primary-300 border border-surface-border',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-8 gap-1.5',
    md: 'text-sm px-4 py-2 min-h-10 gap-2',
    lg: 'text-base px-5 py-2.5 min-h-12 gap-2.5',
  }

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
}
