import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminAPI } from '@/services/api'
import AdminLayoutNav from '@/components/admin/AdminLayoutNav'
import {
  FileText,
  Eye,
  Heart,
  MessageSquare,
  ShieldCheck,
  EyeOff,
  Trash2,
  Sparkles,
  RotateCcw,
  TrendingUp,
  FileQuestion,
  BookOpen,
  ArrowRight,
} from 'lucide-react'

export default function AdminOverviewPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await adminAPI.getOverview()
      return res.data?.data
    },
    staleTime: 30000,
  })

  const metrics = data?.metrics || {
    total_posts: 0,
    active_posts: 0,
    hidden_posts: 0,
    deleted_posts: 0,
    total_likes: 0,
    total_comments: 0,
    total_views: 0,
    engagement: 0,
  }

  const postsByType = data?.posts_by_type || {
    question: 0,
    document: 0,
    discussion: 0,
  }

  const dailyTrends = data?.daily_trends || []

  // Max value for SVG bar scaling
  const maxTrendCount = Math.max(...dailyTrends.map((t) => t.count), 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AdminLayoutNav
        title="Tổng quan hệ thống & Hoạt động nội dung"
        subtitle="Theo dõi toàn diện các chỉ số bài đăng, mức độ tương tác và xu hướng xuất bản nội dung của sinh viên."
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-[#303132]" />
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-16 space-y-4 bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042]">
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            Không thể tải dữ liệu tổng quan quản trị.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-secondary text-xs sm:text-sm inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── B.1 Post Status KPI Grid ── */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#56614f] dark:text-[#B0B3B8]">
              Trạng thái nội dung bài đăng
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Total Posts */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Tổng bài trong DB
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
                    {metrics.total_posts}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Bao gồm cả bài ẩn & đã xóa
                </p>
              </div>

              {/* Active Posts */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Đang công khai
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {metrics.active_posts}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Hiển thị trên bảng tin
                </p>
              </div>

              {/* Hidden Posts */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Đang bị ẩn (hidden)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <EyeOff className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                    {metrics.hidden_posts}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Tạm dừng hiển thị
                </p>
              </div>

              {/* Deleted Posts */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Đã xóa (deleted)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                    {metrics.deleted_posts}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Đã gỡ khỏi hệ thống
                </p>
              </div>
            </div>
          </div>

          {/* ── B.1 Interaction Metrics KPI Grid ── */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#56614f] dark:text-[#B0B3B8]">
              Tương tác cộng đồng sinh viên
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Total Likes */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Tổng lượt thích
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
                    {metrics.total_likes}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Đã xác nhận trong DB
                </p>
              </div>

              {/* Total Comments */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Tổng bình luận
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
                    {metrics.total_comments}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Bình luận đang active
                </p>
              </div>

              {/* Total Views */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Tổng lượt xem
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-white tabular-nums">
                    {metrics.total_views}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Lượt xem bài viết thật
                </p>
              </div>

              {/* Engagement Score */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
                    Tổng lượt tương tác
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400 tabular-nums">
                    {metrics.engagement}
                  </span>
                </div>
                <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] mt-1">
                  Thích + Bình luận
                </p>
              </div>
            </div>
          </div>

          {/* ── Middle Grid: Activity Trends (B.5) & Post Type Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Trends Bar Chart (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E7DE] dark:border-[#3E4042] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
                    Xu hướng tạo bài viết trong 14 ngày qua
                  </h3>
                </div>
                <span className="text-xs text-[#56614f] dark:text-[#B0B3B8]">
                  Số lượng bài / ngày
                </span>
              </div>

              {dailyTrends.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#56614f] dark:text-[#B0B3B8]">
                  Chưa có dữ liệu bài viết mới trong 14 ngày gần nhất.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* CSS/SVG Responsive Bar Chart */}
                  <div className="flex items-end gap-2 h-44 pt-6 pb-2 px-2 border-b border-[#E2E7DE] dark:border-[#3E4042]">
                    {dailyTrends.map((t, idx) => {
                      const heightPercent = Math.max((t.count / maxTrendCount) * 100, 8)
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded-md bg-[#06110a] text-white text-[10px] font-bold whitespace-nowrap pointer-events-none z-20">
                            {t.count} bài viết ({t.date})
                          </div>
                          {/* Count on top of bar */}
                          <span className="text-[10px] font-bold text-[#56614f] dark:text-[#B0B3B8] tabular-nums">
                            {t.count}
                          </span>
                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[28px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-[#16a34a] dark:to-[#2ECC71] group-hover:brightness-110 transition-all cursor-pointer"
                          />
                          {/* Date label */}
                          <span className="text-[9px] text-[#56614f] dark:text-[#B0B3B8] truncate max-w-[42px] mt-1">
                            {t.date.split('-').slice(1).join('/')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#56614f] dark:text-[#B0B3B8]">
                    <span>Dữ liệu thực tế từ cơ sở dữ liệu MySQL</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Tối đa: {maxTrendCount} bài/ngày
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Post Type Distribution Breakdown (1 col) */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-[#E2E7DE] dark:border-[#3E4042] pb-3">
                  <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
                    Phân bổ loại bài viết
                  </h3>
                  <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] mt-0.5">
                    Các bài viết đang công khai
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Document */}
                  <div className="p-3 rounded-xl bg-[#F2F4EF] dark:bg-[#303132] border border-[#E2E7DE] dark:border-[#3E4042] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#06110a] dark:text-white">
                          Tài liệu PDF
                        </p>
                        <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8]">
                          Tài liệu & đề tài
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-extrabold text-[#06110a] dark:text-white tabular-nums">
                      {postsByType.document}
                    </span>
                  </div>

                  {/* Discussion */}
                  <div className="p-3 rounded-xl bg-[#F2F4EF] dark:bg-[#303132] border border-[#E2E7DE] dark:border-[#3E4042] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#06110a] dark:text-white">
                          Thảo luận
                        </p>
                        <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8]">
                          Kinh nghiệm & chia sẻ
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-extrabold text-[#06110a] dark:text-white tabular-nums">
                      {postsByType.discussion}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="p-3 rounded-xl bg-[#F2F4EF] dark:bg-[#303132] border border-[#E2E7DE] dark:border-[#3E4042] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <FileQuestion className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#06110a] dark:text-white">
                          Hỏi đáp bài tập
                        </p>
                        <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8]">
                          Thắc mắc học tập
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-extrabold text-[#06110a] dark:text-white tabular-nums">
                      {postsByType.question}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shortcut Link to Manage Posts */}
              <Link
                to="/admin/posts"
                className="btn-primary text-xs py-2.5 w-full flex items-center justify-center gap-1.5 font-bold rounded-xl mt-4"
              >
                <span>Xem danh sách quản lý</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

