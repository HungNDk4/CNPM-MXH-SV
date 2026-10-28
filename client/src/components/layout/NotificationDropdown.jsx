import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationAPI } from '@/services/api'
import toast from 'react-hot-toast'
import {
  Bell,
  MessageSquare,
  CornerDownRight,
  Heart,
  User,
  ArrowRight,
  CheckCheck,
} from 'lucide-react'

const EVENT_CONFIG = {
  comment: {
    label: 'Đã bình luận về bài viết của bạn',
    icon: MessageSquare,
    iconColor: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50',
  },
  reply: {
    label: 'Đã trả lời bình luận của bạn',
    icon: CornerDownRight,
    iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
  },
  like_post: {
    label: 'Đã thích bài viết của bạn',
    icon: Heart,
    iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50',
  },
  like_comment: {
    label: 'Đã thích bình luận của bạn',
    icon: Heart,
    iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50',
  },
  follow: {
    label: 'Đã bắt đầu theo dõi bạn',
    icon: User,
    iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
  },
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => (await notificationAPI.getUnreadCount()).data.data.count,
    refetchInterval: 30000,
  })

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: async () => (await notificationAPI.getAll({ page: 1, limit: 10 })).data.data,
    enabled: open,
  })

  const markAll = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
      toast.success('Đã đánh dấu đọc tất cả thông báo!')
    },
  })

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await notificationAPI.markAsRead(item.id)
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
      } catch { /* ignore */ }
    }
    setOpen(false)
    if (item.post_id) {
      navigate(`/posts/${item.post_id}`)
    }
  }

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Thông báo"
        className="relative min-w-10 min-h-10 px-2.5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm animate-pulse-slow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-card border border-surface-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-muted/50">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                <Bell className="w-4 h-4" />
              </span>
              <span>Thông báo</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
            {isLoading ? (
              <p className="p-6 text-xs text-slate-500 dark:text-slate-400 text-center">Đang tải thông báo...</p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bạn chưa có thông báo mới nào.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const config = EVENT_CONFIG[item.event_type] || {
                  label: 'Bạn có thông báo mới',
                  icon: Bell,
                  iconColor: 'text-primary-500 bg-primary-50 dark:bg-primary-950/50',
                }
                const EventIcon = config.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 text-xs flex gap-3 items-start cursor-pointer transition-colors ${
                      !item.is_read
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/50'
                        : 'hover:bg-surface-muted/70'
                    }`}
                  >
                    <span className={`shrink-0 p-2 rounded-xl mt-0.5 ${config.iconColor}`}>
                      <EventIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`leading-snug break-words ${!item.is_read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {config.label}
                      </p>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 block">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {!item.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-600 dark:bg-primary-400 shrink-0 mt-2 shadow-sm" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div className="p-2.5 bg-surface-muted/60 border-t border-surface-border text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1.5 py-1"
            >
              <span>Mở trung tâm thông báo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
