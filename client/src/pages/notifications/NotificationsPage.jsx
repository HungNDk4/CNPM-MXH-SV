import EmptyState from '@/components/common/EmptyState'
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
    color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/60',
  },
  reply: {
    label: 'đã trả lời bình luận của bạn',
    icon: CornerDownRight,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60',
  },
  like_post: {
    label: 'đã thích bài viết của bạn',
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
  },
  like_comment: {
    label: 'đã thích bình luận của bạn',
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60',
  },
  follow: {
    label: 'đã bắt đầu theo dõi bạn',
    icon: User,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60',
  },
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data: inboxPage, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications-page-list', page],
    queryFn: async () => (await notificationAPI.getAll({ page, limit: 30 })).data,
    keepPreviousData: true,
  })
  const notifications = inboxPage?.data || []
  const totalPages = Math.max(1, inboxPage?.pagination?.totalPages || 1)
  const totalNotifications = inboxPage?.pagination?.total ?? notifications.length
  const { data: unreadResponse } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => (await notificationAPI.getUnreadCount()).data,
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
    } else if (item.event_type === 'follow' && item.actor_id) {
      navigate(`/profile/${item.actor_id}`)
    }
  }

  const unreadCount = unreadResponse?.data?.count ?? notifications.filter((n) => !n.is_read).length
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
        {/* Page Header (Synchronized Clean Style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-[#E7E7E7]">
              Trung tâm thông báo
            </h1>
            <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] leading-relaxed">
              {unreadCount > 0
                ? `Bạn có ${unreadCount} thông báo chưa đọc`
                : 'Bạn đã cập nhật tất cả thông báo'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl shrink-0"
            >
              <CheckCheck className="w-4 h-4 text-[#16a34a] dark:text-[#2ECC71]" />
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
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                filter === tab.id
                  ? 'bg-[#06110a] dark:bg-[#22c55e] text-white dark:text-[#06110a] border-transparent font-bold shadow-xs'
                  : 'bg-white dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8] border-[#E2E7DE] dark:border-[#3E4042] hover:bg-[#F2F4EF] dark:hover:bg-[#262626] hover:text-[#06110a] dark:hover:text-white'
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
                <div className="w-10 h-10 rounded-full bg-surface-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-muted rounded w-2/3" />
                  <div className="h-3 bg-surface-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card p-8 text-center space-y-3">
            <p className="text-sm text-rose-600 dark:text-rose-400">Không thể tải thông báo.</p>
            <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => refetch()}>Thử lại</button>
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
                color: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 border-primary-200 dark:border-primary-800/60',
              }
              const EventIcon = config.icon

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`card p-4 transition-colors duration-150 flex items-start gap-3.5 cursor-pointer ${
                    !item.is_read
                      ? 'bg-[#dcfce7]/40 dark:bg-[#14532d]/25 border-[#bbf7d0] dark:border-[#166534]/50'
                      : 'bg-surface-card border-surface-border hover:bg-slate-50/80 dark:hover:bg-[#303132]'
                  }`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    {item.actor?.avatar_url ? (
                      <img
                        src={item.actor.avatar_url}
                        alt={item.actor?.full_name || 'Avatar'}
                        className="w-10 h-10 rounded-full object-cover border border-[#E2E7DE] dark:border-[#3E4042]"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border shadow-2xs ${config.color}`}>
                        {item.actor?.full_name?.[0]?.toUpperCase() || <EventIcon className="w-5 h-5" />}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-[#242526] shadow-xs ${config.color}`}>
                      <EventIcon className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                        <span className="font-bold text-slate-900 dark:text-white mr-1">
                          {item.actor?.full_name || 'Một bạn học'}
                        </span>
                        <span>{config.label}</span>
                        {item.targetPost?.title && (
                          <span className="text-[#16a34a] dark:text-[#2ECC71] font-semibold ml-1 line-clamp-1 inline">
                            "{item.targetPost.title}"
                          </span>
                        )}
                      </p>
                      {!item.is_read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] dark:bg-[#22c55e] shrink-0 shadow-sm" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                      {item.post_id ? (
                        <span className="text-[#16a34a] dark:text-[#2ECC71] hover:underline flex items-center gap-1 font-semibold">
                          <span>Xem bài viết</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : item.event_type === 'follow' && item.actor_id ? (
                        <span className="text-[#16a34a] dark:text-[#2ECC71] hover:underline flex items-center gap-1 font-semibold">
                          <span>Xem trang cá nhân</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {totalPages > 1 && (
          <nav aria-label="Phân trang thông báo" className="flex items-center justify-between gap-3 border-t border-surface-border pt-4 text-xs">
            <span className="text-content-secondary">Trang {page}/{totalPages} · {totalNotifications} thông báo</span>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary px-3 py-2" disabled={page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</button>
              <button type="button" className="btn-secondary px-3 py-2" disabled={page >= totalPages || isLoading} onClick={() => setPage((p) => p + 1)}>Sau</button>
            </div>
          </nav>
        )}
        <p className="text-[11px] text-content-secondary">Bộ lọc loại hoạt động và thống kê bên phải áp dụng cho trang hiện tại.</p>
      </div>

      {/* ── Right Column: Gamification & Profile Insight Widget ── */}
      <div className="lg:col-span-4 space-y-5">
        {/* Tổng quan tương tác học tập */}
        <div className="card p-5 space-y-4 bg-surface-card border border-surface-border rounded-[20px] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-[#16a34a] dark:text-[#2ECC71]">
              <TreePine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Tổng quan tương tác</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ghi nhận các phản hồi và kết nối từ cộng đồng sinh viên
              </p>
            </div>
          </div>

          <div className="py-4 text-center space-y-2 bg-surface-card rounded-xl border border-surface-border">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-[#16a34a] dark:text-[#2ECC71] shadow-2xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {totalNotifications} <span className="text-xs font-sans font-semibold text-[#16a34a] dark:text-[#2ECC71]">thông báo</span>
            </div>
            <p className="text-[11px] text-slate-500 px-4">
              Tổng số thông báo hiện có; phân loại bên dưới chỉ tính trên trang đang xem.
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
        <div className="card p-5 space-y-3 bg-gradient-to-b from-surface-card to-surface-muted/40 border border-surface-border rounded-[20px] shadow-xs">
          <div className="flex items-center gap-2 text-content font-bold text-sm">
            <Calendar className="w-4 h-4 text-[#16a34a] dark:text-[#2ECC71]" />
            <span>Mẹo học tập hiệu quả</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Trả lời thắc mắc của bạn học và chia sẻ đề cương thi là cách tốt nhất để củng cố kiến thức cho chính mình.
          </p>
          <Link
            to="/"
            className="text-xs font-semibold text-[#16a34a] dark:text-[#2ECC71] hover:underline inline-flex items-center gap-1"
          >
            <span>Duyệt câu hỏi mới</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
