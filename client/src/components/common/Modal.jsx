import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  maxWidth = 'max-w-md',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'bg-surface-card border border-surface-border rounded-2xl w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 animate-slide-up',
          maxWidth,
          className
        )}
      >
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />}
            <span>{title}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-muted transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="pt-1">{children}</div>
      </div>
    </div>
  )
}
