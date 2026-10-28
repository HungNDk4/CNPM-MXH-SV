import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import {
  Bell,
  CheckCheck,
  MessageSquare,
  CornerDownRight,
  Heart,
  User,
  ArrowRight,
  Sparkles,
  TreePine,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react'
import { Skeleton } from '@/components/common/Skeleton'

const EVENT_CONFIG = {
  comment: {
    label: 'đã bình luận về bài viết của bạn',
    icon: MessageSquare,
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  reply: {
    label: 'đã trả lời bình luận của bạn',
    icon: CornerDownRight,
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  like_post: {
    label: 'đã thích bài viết của bạn',
    icon: Heart,
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  like_comment: {
    label: 'đã thích bình luận của bạn',
    icon: Heart,
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  follow: {
    label: 'đã bắt đầu theo dõi bạn',
    icon: User,
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-page-list'],
    queryFn: async () => (await notificationAPI.getAll({ page: 1, limit: 30 })).data.data,
  })

  const markAll = useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-page-list'] })
      toast.success('Đã đánh dấu đọc tất cả thông báo!')
    },
  })

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await notificationAPI.markAsRead(item.id)
        queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
        queryClient.invalidateQueries({ queryKey: ['notifications-list'] })
        queryClient.invalidateQueries({ queryKey: ['notifications-page-list'] })
      } catch { /* ignore */ }
    }
    if (item.post_id) {
      navigate(`/posts/${item.post_id}`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'comment') return n.event_type === 'comment' || n.event_type === 'reply'
    if (filter === 'like') return n.event_type === 'like_post' || n.event_type === 'like_comment'
    if (filter === 'follow') return n.event_type === 'follow'
    return true
  })

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ── Left/Center Column: Notifications Feed ── */}
      <div className="lg:col-span-8 space-y-4">
        {/* Header Banner */}
        <div className="card p-5 bg-gradient-to-r from-primary-500/10 via-surface-card to-indigo-500/10 border-primary-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-glow-indigo">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Trung tâm thông báo
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {unreadCount > 0
                  ? `Bạn có ${unreadCount} thông báo chưa đọc`
                  : 'Bạn đã cập nhật tất cả thông báo'}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl"
            >
              <CheckCheck className="w-4 h-4 text-primary-600" />
              <span>Đánh dấu đã đọc tất cả</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'comment', label: 'Bình luận & Trả lời' },
            { id: 'like', label: 'Lượt thích' },
            { id: 'follow', label: 'Người theo dõi' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                filter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-surface-card text-slate-600 dark:text-slate-300 border-surface-border hover:bg-surface-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Cards List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4 flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card text-center py-20 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-muted flex items-center justify-center text-slate-400">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Không có thông báo nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Khi có người bình luận bài viết, thích thảo luận hoặc theo dõi bạn, thông báo sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((item) => {
              const config = EVENT_CONFIG[item.event_type] || {
                label: 'đã gửi thông báo cho bạn',
                icon: Bell,
                badge: 'bg-primary-500/10 text-primary-600 border-primary-500/20',
              }
              const EventIcon = config.icon

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`card p-4 transition-all duration-200 flex items-start gap-3.5 cursor-pointer hover:shadow-bento-hover hover:-translate-y-0.5 ${
                    !item.is_read
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/60 dark:border-indigo-800/40'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs mt-0.5">
                    <EventIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                        <span className="font-bold text-primary-600 dark:text-primary-400 mr-1">
                          {item.actor?.full_name || 'Thành viên'}
                        </span>
                        <span>{config.label}</span>
                      </p>
                      {!item.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary-600 dark:bg-primary-400 shrink-0 shadow-sm" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                      {item.post_id && (
                        <span className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium">
                          <span>Xem chi tiết</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Right Column: Gamification & Profile Insight Widget (Grovelyn Image 3) ── */}
      <div className="lg:col-span-4 space-y-5">
        {/* Vườn học tập tuần này */}
        <div className="card p-5 space-y-4 bg-gradient-to-b from-surface-card to-surface-muted/60 border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Vườn học tập tuần này</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Mỗi lượt tương tác học tập với bạn là một chiếc lá xanh
              </p>
            </div>
          </div>

          <div className="py-4 text-center space-y-2 bg-surface-card rounded-xl border border-surface-border">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {notifications.length} <span className="text-xs font-sans font-semibold text-emerald-600 dark:text-emerald-400">tương tác</span>
            </div>
            <p className="text-[11px] text-slate-500 px-4">
              Bạn đang kết nối rất tích cực với bạn học trong tuần này!
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 py-1 border-b border-surface-border">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Lượt thích bài
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {notifications.filter((n) => n.event_type === 'like_post').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 py-1 border-b border-surface-border">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Bình luận trao đổi
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {notifications.filter((n) => n.event_type === 'comment' || n.event_type === 'reply').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 py-1">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Người theo dõi mới
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {notifications.filter((n) => n.event_type === 'follow').length}
              </span>
            </div>
          </div>
        </div>

        {/* Lời nhắc học tập */}
        <div className="card p-5 space-y-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-800/40">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            <Calendar className="w-4 h-4" />
            <span>Mẹo học tập hiệu quả</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Trả lời thắc mắc của bạn học và chia sẻ đề cương thi là cách tốt nhất để củng cố kiến thức cho chính mình.
          </p>
          <Link
            to="/"
            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Duyệt câu hỏi mới</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
