import { cn } from '@/lib/utils'

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={cn('animate-pulse bg-slate-200/80 dark:bg-slate-700/60 rounded-xl', className)}
      {...props}
    />
  )
}

export function PostCardSkeleton() {
  return (
    <div className="card space-y-4 p-5 animate-pulse" role="status" aria-label="Đang tải bài viết">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-md w-4/5" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-surface-border">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-24" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-24" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-20" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Đang tải hồ sơ">
      <div className="card space-y-4 p-6">
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
        <div className="flex gap-4 items-end -mt-12 px-4">
          <div className="w-24 h-24 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-surface-card" />
          <div className="space-y-2 pb-2">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-48" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
