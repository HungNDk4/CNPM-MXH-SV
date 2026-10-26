import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { postAPI, followAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'
import {
  BookOpen,
  PenSquare,
  Info,
  Search,
  X,
  Inbox,
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
  ExternalLink,
  Users,
  Lightbulb,
  FileCheck,
} from 'lucide-react'

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
      {/* ═══════════════════════════════════════════════
          CỘT TRÁI (LEFT SIDEBAR): Profile & Điều hướng
          ═══════════════════════════════════════════════ */}
      <aside className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
        {/* Profile Card */}
        {isAuthenticated ? (
          <div className="card overflow-hidden p-0 border border-surface-border shadow-xs">
            {/* Header cover gradient */}
            <div className="h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-600 relative" />

            <div className="px-4 pb-4 pt-0">
              {/* Avatar overlapping banner */}
              <div className="relative -mt-9 mb-2.5 flex items-end justify-between">
                <Link
                  to={`/profile/${user?.id}`}
                  className="w-16 h-16 rounded-full border-4 border-surface-card bg-surface-muted text-primary-600 font-bold text-xl flex items-center justify-center overflow-hidden shadow-xs hover:opacity-90 transition-opacity"
                  title="Xem trang cá nhân"
                >
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
                </Link>

                <Link
                  to={`/profile/${user?.id}`}
                  className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline pb-1 inline-flex items-center gap-1"
                >
                  Hồ sơ <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Name & Academic info */}
              <div>
                <Link
                  to={`/profile/${user?.id}`}
                  className="font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-base block truncate leading-snug"
                >
                  {user?.full_name || 'Sinh viên'}
                </Link>
                {(user?.university || user?.major) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                    <GraduationCap className="w-3.5 h-3.5 shrink-0 text-primary-600 dark:text-primary-400" />
                    <span className="truncate">{user?.university || user?.major}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Mạng học tập sinh viên</p>
                )}
              </div>

              {/* Real Follow Stats counters */}
              <div className="mt-3 py-2.5 px-3 bg-surface-muted/60 dark:bg-slate-800/50 rounded-xl border border-surface-border grid grid-cols-2 text-center text-xs">
                <Link to={`/profile/${user?.id}`} className="hover:text-primary-600 transition-colors" title="Xem người theo dõi">
                  <span className="block font-bold text-sm text-slate-900 dark:text-slate-100">
                    {followStats?.followers ?? 0}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Người theo dõi</span>
                </Link>
                <div className="border-l border-surface-border">
                  <Link to={`/profile/${user?.id}`} className="hover:text-primary-600 transition-colors" title="Xem đang theo dõi">
                    <span className="block font-bold text-sm text-slate-900 dark:text-slate-100">
                      {followStats?.following ?? 0}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Đang theo dõi</span>
                  </Link>
                </div>
              </div>

              {/* Navigation list */}
              <nav className="mt-4 pt-3 border-t border-surface-border space-y-1" aria-label="Điều hướng nhanh">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400"
                >
                  <Compass className="w-4 h-4" />
                  <span>Bảng tin học tập</span>
                </Link>

                <Link
                  to="/bookmarks"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-muted transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-slate-400" />
                  <span>Bài viết đã lưu</span>
                </Link>

                <Link
                  to="/posts/create"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-surface-muted transition-colors"
                >
                  <PenSquare className="w-4 h-4 text-slate-400" />
                  <span>Đăng bài / Chia sẻ PDF</span>
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin/audit-logs"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Quản trị kiểm duyệt</span>
                  </Link>
                )}
              </nav>
            </div>
          </div>
        ) : (
          /* Guest Card */
          <div className="card space-y-3.5 p-5 border border-surface-border shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Chào mừng bạn!</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Khách xem tài liệu tự do</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Đăng nhập để đặt câu hỏi, chia sẻ tài liệu ôn tập và tham gia thảo luận cùng sinh viên.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link to="/login" className="btn-secondary text-xs py-2 text-center">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn-primary text-xs py-2 text-center">
                Đăng ký
              </Link>
            </div>
          </div>
        )}

        {/* Quick Filter Shortcuts (LinkedIn style) */}
        <div className="card p-4 space-y-2.5 border border-surface-border shadow-xs hidden sm:block">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Phân loại bài viết
          </h3>
          <div className="space-y-1">
            {visibleFilters.map(({ label, value, icon: Icon }) => {
              const isActive = activeType === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange(value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-surface-muted'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </span>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              )
            })}
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          CỘT GIỮA (CENTER FEED): Tạo bài & Dòng tin
          ═══════════════════════════════════════════════ */}
      <main className="lg:col-span-8 xl:col-span-6 space-y-4">
        {/* Grovelyn / Facebook Create Post Prompt Box */}
        {isAuthenticated ? (
          <div className="card p-4 sm:p-5 border border-surface-border shadow-xs space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold flex items-center justify-center shrink-0 overflow-hidden border border-surface-border shadow-2xs">
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

              <Link
                to="/posts/create"
                className="flex-1 bg-surface-muted hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full px-4 py-2.5 text-xs sm:text-sm text-left transition-colors border border-surface-border cursor-pointer shadow-2xs truncate"
              >
                Xin chào {user?.full_name ? user.full_name.split(' ').slice(-1)[0] : ''}! Bạn muốn chia sẻ câu hỏi hay tài liệu gì hôm nay?
              </Link>
            </div>

            {/* Quick action buttons linking to CreatePost with query type */}
            <div className="flex items-center justify-between pt-2.5 border-t border-surface-border/70 text-xs text-slate-600 dark:text-slate-300">
              <Link
                to="/posts/create?type=question"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors font-medium text-blue-600 dark:text-blue-400"
                title="Tạo câu hỏi / hỏi đáp bài tập"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Đặt câu hỏi</span>
              </Link>

              <Link
                to="/posts/create?type=document"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors font-medium text-emerald-600 dark:text-emerald-400"
                title="Tải lên và chia sẻ tài liệu PDF"
              >
                <FileText className="w-4 h-4" />
                <span>Chia sẻ PDF</span>
              </Link>

              <Link
                to="/posts/create?type=discussion"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-medium text-purple-600 dark:text-purple-400"
                title="Mở chủ đề thảo luận học thuật"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Thảo luận</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-4 sm:p-5 border border-surface-border shadow-xs space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold flex items-center justify-center shrink-0 border border-primary-200 dark:border-primary-800/60 shadow-2xs">
                <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>

              <Link
                to="/login"
                className="flex-1 bg-surface-muted hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full px-4 py-2.5 text-xs sm:text-sm text-left transition-colors border border-surface-border cursor-pointer shadow-2xs truncate"
              >
                Bạn muốn đặt câu hỏi hay chia sẻ tài liệu? Đăng nhập để bắt đầu...
              </Link>
            </div>

            {/* Quick action buttons linking to login */}
            <div className="flex items-center justify-between pt-2.5 border-t border-surface-border/70 text-xs text-slate-600 dark:text-slate-300">
              <Link
                to="/login"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors font-medium text-blue-600 dark:text-blue-400"
                title="Đăng nhập để đặt câu hỏi"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Đặt câu hỏi</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors font-medium text-emerald-600 dark:text-emerald-400"
                title="Đăng nhập để chia sẻ tài liệu PDF"
              >
                <FileText className="w-4 h-4" />
                <span>Chia sẻ PDF</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-medium text-purple-600 dark:text-purple-400"
                title="Đăng nhập để mở thảo luận"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Thảo luận</span>
              </Link>
            </div>
          </div>
        )}

        {/* Filter tabs */}
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
                  className={`text-xs sm:text-sm py-2 px-3.5 rounded-xl font-medium transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-xs font-semibold'
                      : 'bg-surface-card hover:bg-surface-muted text-slate-600 dark:text-slate-300 border border-surface-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchKeyword || selectedSubject) && (
          <div className="flex items-center justify-between bg-surface-card border border-surface-border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Đang lọc theo:</span>
              {searchKeyword && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  <Search className="w-3 h-3" />
                  <span>"{searchKeyword}"</span>
                  <button
                    type="button"
                    onClick={removeSearchFilter}
                    className="hover:text-red-600 font-bold ml-1 cursor-pointer"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSubject && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-surface-muted text-slate-700 dark:text-slate-300 border border-surface-border">
                  <BookOpen className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  <span>Môn: {selectedSubject}</span>
                  <button
                    type="button"
                    onClick={removeSubjectFilter}
                    className="hover:text-red-600 font-bold ml-1 cursor-pointer"
                    aria-label="Xóa bộ lọc môn học"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline shrink-0 ml-2 font-medium cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card bg-surface-card border border-surface-border rounded-xl p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card bg-surface-card border border-surface-border text-center text-slate-500 dark:text-slate-400 py-12 space-y-3 rounded-xl shadow-xs">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-slate-800 dark:text-slate-100 font-medium text-sm">Không thể tải bài viết. Vui lòng thử lại.</p>
            <button type="button" onClick={() => refetch()} className="btn-secondary text-xs inline-flex items-center gap-1.5">
              Thử lại
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="card bg-surface-card border border-surface-border text-center text-slate-500 dark:text-slate-400 py-16 space-y-3 rounded-xl shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-surface-muted flex items-center justify-center text-slate-400">
              <Inbox className="w-7 h-7" />
            </div>
            <p className="text-slate-800 dark:text-slate-100 font-semibold text-base">Không tìm thấy bài viết nào.</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchKeyword || selectedSubject
                ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc môn học của bạn.'
                : 'Chưa có bài viết nào trong chuyên mục này. Hãy là người đầu tiên chia sẻ!'}
            </p>
            {isAuthenticated && (
              <Link to="/posts/create" className="btn-primary inline-flex items-center gap-1.5 text-xs mt-2">
                <PenSquare className="w-3.5 h-3.5" />
                Đăng bài đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Feed Enrichment: Static study topics suggestion when feed has 2 or fewer posts */}
            {posts.length <= 2 && !searchKeyword && !selectedSubject && (
              <div className="card p-4 sm:p-5 border border-dashed border-primary-200 dark:border-primary-900 bg-primary-50/40 dark:bg-primary-950/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Gợi ý chủ đề thảo luận (Chủ đề tham khảo)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-surface-card px-2 py-0.5 rounded border border-surface-border">
                    Chủ đề gợi ý
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Bảng tin hiện có ít bài viết. Bạn có thể bấm để lọc hoặc mở đầu bài viết mới về các môn học thường gặp:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleTagClick('CNPM')}
                    className="p-3 bg-surface-card border border-surface-border hover:border-primary-300 dark:hover:border-primary-700 rounded-xl text-left transition-colors shadow-2xs group cursor-pointer"
                  >
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors block">
                      📚 Công nghệ phần mềm
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Kiến trúc phần mềm, mẫu thiết kế, kiểm thử hệ thống
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTagClick('Giải tích')}
                    className="p-3 bg-surface-card border border-surface-border hover:border-primary-300 dark:hover:border-primary-700 rounded-xl text-left transition-colors shadow-2xs group cursor-pointer"
                  >
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors block">
                      📐 Giải tích & Đại số
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      Ôn tập bài tập toán cao cấp, chuỗi, vi tích phân
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTagClick('CSDL')}
                    className="p-3 bg-surface-card border border-surface-border hover:border-primary-300 dark:hover:border-primary-700 rounded-xl text-left transition-colors shadow-2xs group cursor-pointer"
                  >
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors block">
                      🗄️ Cơ sở dữ liệu
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                      SQL, chuẩn hóa quan hệ BCNF, chỉ mục indexing
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination (FE-03) */}
        {totalPages > 1 && (
          <nav aria-label="Phân trang" className="card bg-surface-card border border-surface-border flex items-center justify-between py-2.5 px-4 rounded-xl shadow-xs">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary text-xs sm:text-sm py-1.5 px-3 inline-flex items-center gap-1 disabled:opacity-40"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trang trước</span>
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Trang <strong className="text-slate-900 dark:text-white font-semibold">{page}</strong> / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary text-xs sm:text-sm py-1.5 px-3 inline-flex items-center gap-1 disabled:opacity-40"
              aria-label="Trang sau"
            >
              <span>Trang sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}
      </main>

      {/* ═══════════════════════════════════════════════
          CỘT PHẢI (RIGHT SIDEBAR): Môn học & Thống kê
          ═══════════════════════════════════════════════ */}
      <aside className="hidden xl:block xl:col-span-3 space-y-4 xl:sticky xl:top-20">
        {/* Popular Subject Tags */}
        <div className="card p-4 sm:p-5 border border-surface-border shadow-xs space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Môn học phổ biến</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Bấm để lọc bài viết và tài liệu theo môn học:</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {POPULAR_TAGS.map((tag) => {
              const isSelected = selectedSubject === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-xs font-semibold'
                      : 'bg-surface-muted hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 border border-surface-border'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        </div>

        {/* Study Community Stats */}
        <div className="card p-4 sm:p-5 border border-surface-border shadow-xs space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span>Bảng tin hôm nay</span>
          </h3>
          <div className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <div className="flex justify-between items-center py-1.5 border-b border-surface-border/60">
              <span>Tổng bài viết</span>
              <span className="text-slate-900 dark:text-white font-semibold">{pagination?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-surface-border/60">
              <span>Trang hiện tại</span>
              <span className="text-slate-900 dark:text-white font-semibold">{page} / {totalPages}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span>Đang lọc</span>
              <span className="text-primary-600 dark:text-primary-400 font-semibold">
                {FILTERS.find((f) => f.value === activeType)?.label || activeType}
              </span>
            </div>
          </div>
        </div>

        {/* Verified Academic Guidelines & PDF Upload rules */}
        <div className="card p-4 border border-surface-border shadow-xs space-y-2.5 bg-surface-muted/30">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Quy chuẩn chia sẻ tài liệu</span>
          </h4>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-4">
            <li>File PDF kích thước tối đa <strong>10 MiB</strong> (1 file/bài).</li>
            <li>Tài liệu tải xuống qua luồng xác thực bảo mật.</li>
            <li>Đặt câu hỏi kèm mã môn học hoặc mô tả đề tài rõ ràng.</li>
          </ul>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-surface-border flex items-center justify-between">
            <span>Mini Study Network</span>
            <span>v1.0</span>
          </p>
        </div>
      </aside>
    </div>
  )
}
