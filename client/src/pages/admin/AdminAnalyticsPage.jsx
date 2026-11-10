import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminAPI } from '@/services/api'
import AdminLayoutNav from '@/components/admin/AdminLayoutNav'
import Badge from '@/components/common/Badge'
import {
  Heart,
  MessageSquare,
  Eye,
  BarChart3,
  Trophy,
  RotateCcw,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileQuestion,
  Info,
} from 'lucide-react'

export default function AdminAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await adminAPI.getAnalytics()
      return res.data?.data
    },
    staleTime: 30000,
  })

  const topLiked = data?.top_liked || []
  const topCommented = data?.top_commented || []
  const topViewed = data?.top_viewed || []
  const byType = data?.by_type || []

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <AdminLayoutNav
        title="Phân tích tương tác & Hiệu suất nội dung"
        subtitle="Xác định những bài viết được cộng đồng sinh viên quan tâm nhất và so sánh hiệu quả theo từng loại nội dung."
      />

      {/* ── Metric Definition Notice ── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] text-xs text-[#56614f] dark:text-[#B0B3B8] flex items-start gap-3 shadow-2xs">
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#06110a] dark:text-white">
            Quy chuẩn tính toán tương tác (Campus Pop Standard):
          </p>
          <p>
            <strong>Điểm tương tác (Engagement)</strong> = <em>Tổng lượt thích</em> + <em>Tổng bình luận thực tế</em>. Lượt xem phản ánh độ tiếp cận độc lập và không được gộp vào điểm tương tác nhằm đảm bảo tính khách quan của dữ liệu.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200 dark:bg-[#303132]" />
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-16 space-y-4 bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042]">
          <p className="text-slate-700 dark:text-slate-300 font-semibold">
            Không thể tải dữ liệu phân tích tương tác.
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
          {/* ── Rankings Bento Grid: Top 5 Liked, Commented, Viewed ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Top Liked */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E7DE] dark:border-[#3E4042] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 fill-rose-500/20" />
                  </div>
                  <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
                    Nhiều lượt thích nhất
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  Top 5
                </span>
              </div>

              {topLiked.length === 0 ? (
                <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] py-8 text-center">
                  Chưa có bài viết nào được thích.
                </p>
              ) : (
                <div className="space-y-3">
                  {topLiked.map((post, idx) => {
                    const postUrl = post.post_type === 'document' ? `/documents/${post.id}` : `/posts/${post.id}`
                    return (
                      <div
                        key={post.id}
                        className="p-3 rounded-xl bg-[#F2F4EF]/60 dark:bg-[#303132]/50 border border-[#E2E7DE] dark:border-[#3E4042] flex items-center gap-3"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-600/30 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-[#18191A] text-[#56614f] dark:text-[#B0B3B8]'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#06110a] dark:text-white hover:text-rose-500 line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] truncate mt-0.5">
                            {post.author_name}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 font-bold text-xs text-rose-600 dark:text-rose-400 tabular-nums">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          <span>{post.like_count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 2. Top Commented */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E7DE] dark:border-[#3E4042] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
                    Sôi nổi thảo luận nhất
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                  Top 5
                </span>
              </div>

              {topCommented.length === 0 ? (
                <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] py-8 text-center">
                  Chưa có bình luận nào trên các bài viết.
                </p>
              ) : (
                <div className="space-y-3">
                  {topCommented.map((post, idx) => {
                    const postUrl = post.post_type === 'document' ? `/documents/${post.id}` : `/posts/${post.id}`
                    return (
                      <div
                        key={post.id}
                        className="p-3 rounded-xl bg-[#F2F4EF]/60 dark:bg-[#303132]/50 border border-[#E2E7DE] dark:border-[#3E4042] flex items-center gap-3"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-600/30 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-[#18191A] text-[#56614f] dark:text-[#B0B3B8]'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#06110a] dark:text-white hover:text-sky-500 line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] truncate mt-0.5">
                            {post.author_name}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 font-bold text-xs text-sky-600 dark:text-sky-400 tabular-nums">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.comment_count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 3. Top Viewed */}
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E7DE] dark:border-[#3E4042] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Eye className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
                    Lượt xem cao nhất
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Top 5
                </span>
              </div>

              {topViewed.length === 0 ? (
                <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] py-8 text-center">
                  Chưa có lượt xem nào được ghi nhận.
                </p>
              ) : (
                <div className="space-y-3">
                  {topViewed.map((post, idx) => {
                    const postUrl = post.post_type === 'document' ? `/documents/${post.id}` : `/posts/${post.id}`
                    return (
                      <div
                        key={post.id}
                        className="p-3 rounded-xl bg-[#F2F4EF]/60 dark:bg-[#303132]/50 border border-[#E2E7DE] dark:border-[#3E4042] flex items-center gap-3"
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-600/30 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-[#18191A] text-[#56614f] dark:text-[#B0B3B8]'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            to={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#06110a] dark:text-white hover:text-amber-500 line-clamp-1"
                          >
                            {post.title}
                          </Link>
                          <p className="text-[10px] text-[#56614f] dark:text-[#B0B3B8] truncate mt-0.5">
                            {post.author_name}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 font-bold text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{post.view_count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Engagement by Post Type Comparison Table ── */}
          <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E7DE] dark:border-[#3E4042] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-[#06110a] dark:text-white">
                  So sánh hiệu quả tương tác theo Loại nội dung
                </h3>
              </div>
              <span className="text-xs text-[#56614f] dark:text-[#B0B3B8]">
                Dữ liệu bài viết công khai
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E7DE] dark:border-[#3E4042] bg-[#F2F4EF]/50 dark:bg-[#18191A]/50 text-[#56614f] dark:text-[#B0B3B8] font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Loại nội dung</th>
                    <th className="py-3 px-4 text-center">Số bài viết</th>
                    <th className="py-3 px-4 text-center">Lượt xem</th>
                    <th className="py-3 px-4 text-center">Lượt thích</th>
                    <th className="py-3 px-4 text-center">Bình luận</th>
                    <th className="py-3 px-4 text-right">Tổng tương tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7DE] dark:divide-[#3E4042]">
                  {byType.map((row) => {
                    const labelMap = {
                      document: 'Tài liệu PDF',
                      discussion: 'Thảo luận',
                      question: 'Hỏi đáp bài tập',
                    }

                    return (
                      <tr
                        key={row.post_type}
                        className="hover:bg-[#F2F4EF]/40 dark:hover:bg-[#303132]/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#06110a] dark:text-white">
                          <div className="flex items-center gap-2">
                            <Badge type={row.post_type} />
                            <span>{labelMap[row.post_type] || row.post_type}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-[#06110a] dark:text-white tabular-nums">
                          {row.post_count}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[#56614f] dark:text-[#B0B3B8] tabular-nums">
                          {row.total_views}
                        </td>
                        <td className="py-3.5 px-4 text-center text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                          {row.total_likes}
                        </td>
                        <td className="py-3.5 px-4 text-center text-sky-600 dark:text-sky-400 font-semibold tabular-nums">
                          {row.total_comments}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#16a34a] dark:text-[#2ECC71] tabular-nums text-sm">
                          {row.engagement}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

