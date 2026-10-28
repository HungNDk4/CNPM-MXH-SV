import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { postAPI, followAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'
import {
  BookOpen,
  PenSquare,
  Search,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  HelpCircle,
  FileText,
  MessageSquare,
  GraduationCap,
  Bookmark,
  Shield,
  Compass,
  CheckCircle2,
  Users,
  FileCheck,
  TrendingUp,
  DownloadCloud,
} from 'lucide-react'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'

const FILTERS = [
  { label: 'Tất cả', value: 'all', icon: Compass },
  { label: 'Hỏi đáp', value: 'question', icon: HelpCircle },
  { label: 'Tài liệu', value: 'document', icon: FileText },
  { label: 'Thảo luận', value: 'discussion', icon: MessageSquare },
]

const POPULAR_TAGS = ['CNPM', 'Java', 'React', 'Giải tích', 'CSDL', 'OOP', 'Python', 'KTMT']

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const [filter, setFilter] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKeyword = searchParams.get('search') || ''
  const selectedSubject = searchParams.get('subject') || ''
  const [page, setPage] = useState(1)

  // ADR-002: Guest only allowed document metadata
  const activeType = isAuthenticated ? filter : 'document'
  const visibleFilters = isAuthenticated ? FILTERS : FILTERS.filter((item) => item.value === 'document')

  // Query posts with search, filter, subject, pagination
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', activeType, isAuthenticated, searchKeyword, selectedSubject, page],
    queryFn: () =>
      postAPI
        .getAll({
          page,
          limit: 10,
          ...(activeType === 'all' ? {} : { type: activeType }),
          ...(searchKeyword ? { search: searchKeyword } : {}),
          ...(selectedSubject ? { subject: selectedSubject } : {}),
        })
        .then((response) => response.data),
    retry: false,
    keepPreviousData: true,
  })

  // EXT-02: Query real follow stats for authenticated user
  const { data: followStats } = useQuery({
    queryKey: ['follow-stats', user?.id],
    queryFn: async () => (await followAPI.getFollowStats(user.id)).data.data,
    enabled: Boolean(isAuthenticated && user?.id),
    retry: false,
  })

  const pagination = data?.pagination
  const totalPages = pagination?.totalPages || 1
  const posts = data?.data || []

  const handleFilterChange = (val) => {
    setFilter(val)
    setPage(1)
  }

  const handleTagClick = (tag) => {
    const next = new URLSearchParams(searchParams)
    if (selectedSubject === tag) {
      next.delete('subject')
    } else {
      next.set('subject', tag)
    }
    setSearchParams(next)
    setPage(1)
  }

  const removeSearchFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next)
    setPage(1)
  }

  const removeSubjectFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('subject')
    setSearchParams(next)
    setPage(1)
  }

  const clearAllFilters = () => {
    setSearchParams({})
    setPage(1)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ═══════════════════════════════════════════════
          CỘT CHÍNH (MAIN FEED): Tạo bài & Danh sách bài
          ═══════════════════════════════════════════════ */}
      <div className="lg:col-span-8 space-y-5">
        {/* Quick Post Composer Card (Grovelyn Image 1 / Kilogram Style) */}
        {isAuthenticated ? (
          <div className="card p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-500/30 shadow-bento space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-full avatar-gradient-ring p-[2px] shrink-0">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden text-xs font-bold text-white">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Avatar'}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    user?.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
              </div>

              <Link
                to="/posts/create"
                className="flex-1 bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white rounded-full px-5 py-3 text-xs sm:text-sm text-left transition-all border border-white/10 cursor-pointer shadow-inner truncate backdrop-blur-sm"
              >
                Hôm nay bạn cần giải đáp môn gì, {user?.full_name ? user.full_name.split(' ').slice(-1)[0] : 'bạn'}?
              </Link>
            </div>

            {/* Quick Action Pills */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs gap-2 flex-wrap sm:flex-nowrap relative z-10">
              <Link
                to="/posts/create?type=question"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-semibold transition-colors border border-amber-500/30"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Đặt câu hỏi</span>
              </Link>

              <Link
                to="/posts/create?type=document"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold transition-colors border border-emerald-500/30"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Chia sẻ PDF</span>
              </Link>

              <Link
                to="/posts/create?type=discussion"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 font-semibold transition-colors border border-purple-500/30"
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Thảo luận</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-5 bg-gradient-to-r from-primary-600 to-indigo-700 text-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Tham gia Mini Study Network</h3>
                <p className="text-xs text-indigo-100">
                  Cộng đồng sinh viên chia sẻ tài liệu PDF, giải đáp bài tập và kết nối chuyên ngành.
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 pt-1">
              <Link to="/login" className="btn-secondary bg-white text-slate-900 border-none font-bold text-xs py-2 px-4 rounded-xl">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary bg-slate-900 hover:bg-black text-white font-bold text-xs py-2 px-4 rounded-xl">
                Đăng ký thành viên
              </Link>
            </div>
          </div>
        )}

        {/* ── Category Filter Pills ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-2">
            {visibleFilters.map(({ label, value, icon: Icon }) => {
              const isActive = activeType === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange(value)}
                  aria-pressed={isActive}
                  className={`text-xs sm:text-sm py-2 px-4 rounded-full font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-2xs ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.02]'
                      : 'bg-surface-card hover:bg-surface-muted text-slate-600 dark:text-slate-300 border border-surface-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Active Filters Bar ── */}
        {(searchKeyword || selectedSubject) && (
          <div className="flex items-center justify-between bg-surface-card border border-surface-border px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-bento">
            <div className="flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
              <span className="text-slate-400 font-medium">Đang lọc:</span>
              {searchKeyword && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  <Search className="w-3.5 h-3.5" />
                  <span>"{searchKeyword}"</span>
                  <button
                    type="button"
                    onClick={removeSearchFilter}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {selectedSubject && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Môn: {selectedSubject}</span>
                  <button
                    type="button"
                    onClick={removeSubjectFilter}
                    className="hover:text-red-500 font-bold ml-1 cursor-pointer"
                    aria-label="Xóa bộ lọc môn học"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline shrink-0 ml-2 font-bold cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* ── Posts Stream ── */}
        {isLoading ? (
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : isError ? (
          <div className="card text-center py-14 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="font-bold text-slate-800 dark:text-slate-100">Không thể tải bài viết. Vui lòng thử lại.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-secondary text-xs inline-flex items-center gap-2"
            >
              Thử lại
            </button>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Không tìm thấy bài viết nào"
            description={
              searchKeyword || selectedSubject
                ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bấm xóa bộ lọc môn học để xem thêm bài viết.'
                : 'Chưa có bài viết nào trong chuyên mục này. Hãy là người đầu tiên chia sẻ kiến thức!'
            }
            actionLabel={isAuthenticated ? 'Đăng bài viết mới' : 'Đăng nhập để chia sẻ'}
            actionLink={isAuthenticated ? '/posts/create' : '/login'}
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav aria-label="Phân trang" className="card flex items-center justify-between py-3 px-5 rounded-2xl">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-1.5 disabled:opacity-40"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trang trước</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Trang <strong className="text-slate-900 dark:text-white font-bold">{page}</strong> / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary text-xs sm:text-sm py-2 px-4 inline-flex items-center gap-1.5 disabled:opacity-40"
              aria-label="Trang sau"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          CỘT PHẢI (RIGHT SIDEBAR WIDGETS): Campus Info
          ═══════════════════════════════════════════════ */}
      <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
        {/* User Mini Profile (if authenticated) */}
        {isAuthenticated && (
          <div className="card p-5 space-y-3.5 bg-gradient-to-b from-surface-card to-surface-muted/60">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${user?.id}`} className="avatar-gradient-ring p-[2px] shrink-0">
                <div className="w-12 h-12 rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-sm font-bold text-primary-600">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/profile/${user?.id}`} className="font-bold text-slate-900 dark:text-white text-sm hover:underline block truncate">
                  {user?.full_name || 'Thành viên'}
                </Link>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.university || user?.major || 'Sinh viên học tập'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-border text-center">
              <Link to={`/profile/${user?.id}`} className="p-2 rounded-xl bg-surface-card hover:bg-surface-muted transition-colors border border-surface-border">
                <span className="block font-bold text-sm text-slate-900 dark:text-white">
                  {followStats?.followers ?? 0}
                </span>
                <span className="text-[11px] text-slate-400">Người theo dõi</span>
              </Link>
              <Link to={`/profile/${user?.id}`} className="p-2 rounded-xl bg-surface-card hover:bg-surface-muted transition-colors border border-surface-border">
                <span className="block font-bold text-sm text-slate-900 dark:text-white">
                  {followStats?.following ?? 0}
                </span>
                <span className="text-[11px] text-slate-400">Đang theo dõi</span>
              </Link>
            </div>
          </div>
        )}

        {/* Popular Subject Tags Widget */}
        <div className="card p-5 space-y-3.5">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Môn học phổ biến</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chọn môn học để lọc nhanh tài liệu và câu hỏi ôn thi:</p>

          <div className="flex flex-wrap gap-2 pt-1">
            {POPULAR_TAGS.map((tag) => {
              const isSelected = selectedSubject === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-glow-indigo scale-105'
                      : 'bg-surface-muted hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-300 border border-surface-border'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Community Stats Widget */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Hoạt động học tập</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center py-1.5 border-b border-surface-border">
              <span>Tổng bài viết & tài liệu</span>
              <span className="font-bold text-slate-900 dark:text-white">{pagination?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-surface-border">
              <span>Định dạng hỗ trợ</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">PDF chuẩn (10MB)</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span>Chế độ xem</span>
              <span className="font-bold text-primary-600 dark:text-primary-400">
                {FILTERS.find((f) => f.value === activeType)?.label || activeType}
              </span>
            </div>
          </div>
        </div>

        {/* PDF Standard & Guidelines */}
        <div className="card p-5 space-y-2.5 bg-gradient-to-br from-emerald-500/5 via-surface-card to-teal-500/5 border-emerald-500/20">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Quy chuẩn chia sẻ tài liệu</span>
          </div>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Tối đa <strong>1 file PDF</strong> cho mỗi bài viết (giới hạn <strong>10 MiB</strong>).</li>
            <li>Khách vãng lai xem thông tin; đăng nhập để tải an toàn.</li>
            <li>Nội dung tài liệu được kiểm duyệt an toàn bởi Ban quản trị.</li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
