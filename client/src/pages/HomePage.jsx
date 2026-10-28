import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { postAPI, followAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'
import QuickComposerModal from '@/components/feed/QuickComposerModal'
import {
  BookOpen,
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
  Users,
  TrendingUp,
  DownloadCloud,
} from 'lucide-react'
import { PostCardSkeleton } from '@/components/common/Skeleton'

const POPULAR_SUBJECTS = [
  'Tất cả môn',
  'Công nghệ phần mềm',
  'Cơ sở dữ liệu',
  'Lập trình Web',
  'Trí tuệ nhân tạo',
  'Kiến trúc máy tính',
  'An toàn thông tin',
]

const FILTER_TABS = [
  { label: 'Tất cả bài viết', value: '', icon: BookOpen },
  { label: 'Thảo luận', value: 'discussion', icon: MessageSquare },
  { label: 'Hỏi đáp', value: 'question', icon: HelpCircle },
  { label: 'Tài liệu PDF', value: 'document', icon: FileText },
]

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()

  // Quick Composer State (Image 4 Style)
  const [composerOpen, setComposerOpen] = useState(false)

  // Featured active students derived safely from feed posts
  const featuredStudents = useMemo(() => {
    const list = []
    const seen = new Set()
    const items = data?.data || []
    for (const item of items) {
      if (item.author && !seen.has(item.author.id)) {
        seen.add(item.author.id)
        list.push({
          id: item.author.id,
          full_name: item.author.full_name,
          avatar_url: item.author.avatar_url,
          university: item.author.university,
          major: item.subject || 'Công nghệ thông tin',
        })
        if (list.length >= 6) break
      }
    }
    return list
  }, [data])
  const [composerType, setComposerType] = useState('discussion')

  // URL query params
  const activeType = searchParams.get('type') || ''
  const searchKeyword = searchParams.get('search') || ''
  const selectedSubject = searchParams.get('subject') || ''
  const [page, setPage] = useState(1)

  // When not logged in, guests can only view free document posts (ADR-002 / ADR-011)
  const effectiveType = isAuthenticated ? activeType : 'document'

  // Query posts with React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', effectiveType, searchKeyword, selectedSubject, page, isAuthenticated],
    queryFn: async () => {
      const params = { page, limit: 10 }
      if (effectiveType) params.type = effectiveType
      if (searchKeyword) params.search = searchKeyword
      if (selectedSubject) params.subject = selectedSubject
      return (await postAPI.getAll(params)).data
    },
    keepPreviousData: true,
    retry: 1,
  })

  // Query popular active students
  const { data: popularUsersData } = useQuery({
    queryKey: ['suggested-students'],
    queryFn: async () => {
      if (!user?.id) return []
      try {
        const res = await followAPI.getFollowing(user.id, { page: 1, limit: 5 })
        return res.data?.data || []
      } catch {
        return []
      }
    },
    enabled: Boolean(user?.id),
  })

  const posts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  // Guest view: only document posts allowed without login
  const visibleFilters = isAuthenticated
    ? FILTER_TABS
    : [{ label: 'Tài liệu PDF miễn phí', value: 'document', icon: FileText }]

  const handleFilterChange = (typeVal) => {
    const nextParams = new URLSearchParams(searchParams)
    if (typeVal) {
      nextParams.set('type', typeVal)
    } else {
      nextParams.delete('type')
    }
    setSearchParams(nextParams)
    setPage(1)
  }

  const handleSubjectChange = (subjectVal) => {
    const nextParams = new URLSearchParams(searchParams)
    if (subjectVal && subjectVal !== 'Tất cả môn') {
      nextParams.set('subject', subjectVal)
    } else {
      nextParams.delete('subject')
    }
    setSearchParams(nextParams)
    setPage(1)
  }

  const removeSearchFilter = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('search')
    setSearchParams(nextParams)
    setPage(1)
  }

  const removeSubjectFilter = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('subject')
    setSearchParams(nextParams)
    setPage(1)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* ═══════════════════════════════════════════════
          CỘT CHÍNH (MAIN FEED): Tạo bài & Danh sách bài
          ═══════════════════════════════════════════════ */}
      <div className="lg:col-span-8 space-y-5">
        {/* Quick Post Composer Card (Grovelyn Image 4 Style) */}
        {isAuthenticated ? (
          <>
            <div className="card p-4 sm:p-5 bg-surface-card border border-surface-border shadow-bento space-y-3.5 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full avatar-gradient-ring p-[2px] shrink-0">
                  <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
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

                <button
                  type="button"
                  onClick={() => {
                    setComposerType('discussion')
                    setComposerOpen(true)
                  }}
                  className="flex-1 bg-surface-muted hover:bg-surface-border/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full px-5 py-2.5 text-xs sm:text-sm text-left transition-all border border-surface-border cursor-pointer shadow-inner truncate"
                >
                  Hôm nay bạn cần giải đáp môn gì, {user?.full_name ? user.full_name.split(' ').slice(-1)[0] : 'bạn'}?
                </button>
              </div>

              {/* Quick Action Pills (Inspired by Image 4) */}
              <div className="flex items-center justify-between pt-2.5 border-t border-surface-border text-xs gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setComposerType('question')
                      setComposerOpen(true)
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold transition-colors border border-amber-500/20"
                  >
                    <HelpCircle className="w-4 h-4 text-amber-500" />
                    <span>Đặt câu hỏi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposerType('document')
                      setComposerOpen(true)
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold transition-colors border border-emerald-500/20"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>Chia sẻ PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setComposerType('discussion')
                      setComposerOpen(true)
                    }}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-semibold transition-colors border border-sky-500/20"
                  >
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    <span>Thảo luận</span>
                  </button>
                </div>

                <Link
                  to="/posts/create"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold ml-auto hidden sm:inline"
                >
                  Trang tạo bài đầy đủ &rarr;
                </Link>
              </div>
            </div>

            {/* Quick Composer Modal */}
            <QuickComposerModal
              isOpen={composerOpen}
              onClose={() => setComposerOpen(false)}
              user={user}
              initialType={composerType}
            />
          </>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-7 shadow-xl shadow-blue-900/10 border border-blue-400/20">
            {/* Ambient Background Glow Inside Banner */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-sky-100 border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cộng đồng học thuật sinh viên 2026</span>
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  Khám phá & Chia sẻ kho tri thức đại học
                </h3>
                <p className="text-xs sm:text-sm text-sky-100/90 max-w-xl leading-relaxed">
                  Hơn 1,200+ tài liệu PDF, đồ án mẫu và đề cương ôn thi được sinh viên chia sẻ hoàn toàn miễn phí.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to="/login"
                  className="bg-white hover:bg-slate-100 text-blue-950 font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-950/80 hover:bg-black text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl border border-white/20 transition-all active:scale-[0.98]"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Category Filter Pills ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex gap-2">
            {visibleFilters.map(({ label, value, icon: Icon }) => {
              const isActive = (effectiveType === value) || (!isAuthenticated && value === 'document')
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
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{selectedSubject}</span>
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
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.delete('search')
                next.delete('subject')
                setSearchParams(next)
                setPage(1)
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium underline cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* ── Feed List ── */}
        {isLoading ? (
          <div className="space-y-4" role="status" aria-label="Đang tải danh sách bài viết">
            {[1, 2, 3].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="card text-center py-16 space-y-4 border border-rose-500/20 bg-rose-500/5">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Không thể tải dữ liệu bảng tin</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
              Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền hoặc đăng nhập tài khoản.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-primary text-xs px-5 py-2 rounded-xl"
            >
              Thử lại ngay
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="card text-center py-20 space-y-4 bg-surface-card border border-surface-border shadow-bento">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Không tìm thấy bài viết nào</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
              {searchKeyword || selectedSubject
                ? 'Không có kết quả nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử từ khóa khác nhé!'
                : 'Hiện chưa có bài viết nào trong danh mục này. Hãy là người đầu tiên chia sẻ kiến thức!'}
            </p>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setComposerType('discussion')
                  setComposerOpen(true)
                }}
                className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm py-2.5 px-5 rounded-full"
              >
                <span>Tạo bài viết ngay</span>
              </button>
            ) : (
              <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm py-2.5 px-5 rounded-full">
                <span>Đăng nhập để đăng bài</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-surface-border text-xs sm:text-sm">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-secondary py-2 px-4 rounded-xl disabled:opacity-40 flex items-center gap-1 font-semibold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Trang trước</span>
                </button>

                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Trang <strong className="text-slate-900 dark:text-slate-100 font-bold">{page}</strong> / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary py-2 px-4 rounded-xl disabled:opacity-40 flex items-center gap-1 font-semibold"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          CỘT PHẢI (SIDE WIDGETS): Môn học, Bạn bè, Thống kê
          ═══════════════════════════════════════════════ */}
      <div className="hidden lg:block lg:col-span-4 space-y-5 sticky top-20">
        {/* Widget 1: Bộ lọc nhanh theo Môn học (Subject Pills) */}
        <div className="card p-5 space-y-3 bg-surface-card border border-surface-border shadow-bento">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>Chủ đề & Môn học</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Hot</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {POPULAR_SUBJECTS.map((sub) => {
              const isSelected = selectedSubject === sub || (sub === 'Tất cả môn' && !selectedSubject)
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubjectChange(sub)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white font-bold shadow-xs'
                      : 'bg-surface-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-surface-border'
                  }`}
                >
                  {sub}
                </button>
              )
            })}
          </div>
        </div>

        {/* Widget 2: Đang học & Sinh viên cùng trường (Kilogram & Grovelyn Style) */}
        {/* Widget 2: Sinh viên nổi bật */}
        {true && (
          <div className="card p-5 space-y-3.5 bg-surface-card border border-surface-border shadow-bento">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Sinh viên nổi bật</span>
              </h3>
              <Link to="/profile/2" className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                Xem thêm
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { id: 2, name: 'Nguyễn Hùng', uni: 'UIT - Kỹ thuật Phần mềm', active: 'Vừa hoàn thành Đồ án tốt nghiệp' },
                { id: 3, name: 'Trần Quốc Bảo', uni: 'ĐHBK - Khoa học Máy tính', active: 'Vừa đăng tài liệu MySQL nâng cao' },
                { id: 4, name: 'Nguyễn Thu Hà', uni: 'ĐHKHTN - Công nghệ Thông tin', active: 'Vừa chia sẻ bộ slide Fullstack' },
              ].map((student) => (
                <Link
                  key={student.id}
                  to={`/profile/${student.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-muted transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full avatar-gradient-ring p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center font-bold text-primary-600 text-xs">
                      {(student.full_name || student.name || 'U')[0]}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-primary-600 truncate">
                      {student.full_name || student.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{student.university ? `${student.university}${student.major ? ' • ' + student.major : ''}` : (student.uni || 'Sinh viên')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Widget 3: Thống kê sinh viên tuần này */}
        <div className="card p-5 space-y-3 bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-surface-card border border-primary-500/20">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Mạng xã hội học tập</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Hơn <strong>1,200+</strong> tài liệu PDF ôn thi và đồ án môn học được sinh viên đóng góp và tải về hoàn toàn miễn phí.
          </p>
        </div>
      </div>
    </div>
  )
}
