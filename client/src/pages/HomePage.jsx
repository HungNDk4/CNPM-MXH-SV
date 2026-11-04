import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { postAPI, followAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'
import InlineComposer from '@/components/feed/InlineComposer'
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
  ArrowUpDown,
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

  // Feed stream tab & sort states (Batch 2)
  const [streamTab, setStreamTab] = useState('for-you') // 'for-you' | 'following' | 'groups'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'popular'

  // URL query params
  const activeType = searchParams.get('type') || ''
  const searchKeyword = searchParams.get('search') || ''
  const selectedSubject = searchParams.get('subject') || ''
  const [page, setPage] = useState(1)

  // When not logged in, guests can only view free document posts (ADR-002 / ADR-011)
  const effectiveType = isAuthenticated ? activeType : 'document'

  // Query posts with React Query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', effectiveType, searchKeyword, selectedSubject, page, sortBy, isAuthenticated],
    queryFn: async () => {
      const params = { page, limit: 10, sort: sortBy }
      if (effectiveType) params.type = effectiveType
      if (searchKeyword) params.search = searchKeyword
      if (selectedSubject) params.subject = selectedSubject
      return (await postAPI.getAll(params)).data
    },
    keepPreviousData: true,
    retry: 1,
  })

  const posts = data?.data || []

  // Query following list if authenticated and user views "Đang theo dõi"
  const { data: followingData } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const res = await followAPI.getFollowing(user.id)
      return res.data?.data || []
    },
    enabled: Boolean(isAuthenticated && user?.id && streamTab === 'following'),
    staleTime: 60000,
  })

  // Persistent category counts cache so tab switching never resets other pills to 0
  const cachedCountsRef = useRef({ all: 0, document: 0, question: 0, discussion: 0 });

  // Global category counts query so pills remain stable across tab switches
  // Global category counts query: fetch exact pagination.total per category from backend
  const { data: categoryCounts } = useQuery({
    queryKey: ['posts-category-counts', searchKeyword, selectedSubject, isAuthenticated],
    queryFn: async () => {
      const baseParams = { page: 1, limit: 10 };
      if (searchKeyword) baseParams.search = searchKeyword;
      if (selectedSubject) baseParams.subject = selectedSubject;

      if (!isAuthenticated) {
        const docRes = await postAPI.getAll({ ...baseParams, type: 'document' });
        const docTotal = docRes.data?.pagination?.total ?? 0;
        return { all: docTotal, document: docTotal, question: 0, discussion: 0 };
      }

      const [allRes, docRes, qRes, disRes] = await Promise.all([
        postAPI.getAll(baseParams),
        postAPI.getAll({ ...baseParams, type: 'document' }),
        postAPI.getAll({ ...baseParams, type: 'question' }),
        postAPI.getAll({ ...baseParams, type: 'discussion' }),
      ]);

      return {
        all: allRes.data?.pagination?.total ?? 0,
        document: docRes.data?.pagination?.total ?? 0,
        question: qRes.data?.pagination?.total ?? 0,
        discussion: disRes.data?.pagination?.total ?? 0,
      };
    },
    staleTime: 60000,
    keepPreviousData: true,
    retry: false,
  });

  // Query real trending topics from DB
  const { data: trendingData } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      try {
        const res = await postAPI.getTrendingTopics();
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const trendingTopics = Array.isArray(trendingData) && trendingData.length > 0 ? trendingData : [];

  // Dynamic counts for Level 2 filter pills (preserves counts across tab switches)
  const counts = useMemo(() => {
    if (categoryCounts) {
      cachedCountsRef.current = categoryCounts;
      return categoryCounts;
    }
    if (cachedCountsRef.current.all > 0) {
      return cachedCountsRef.current;
    }
    const currentTotal = data?.pagination?.total ?? posts.length;
    return {
      all: effectiveType === '' ? currentTotal : 0,
      document: effectiveType === 'document' ? currentTotal : 0,
      question: effectiveType === 'question' ? currentTotal : 0,
      discussion: effectiveType === 'discussion' ? currentTotal : 0,
    };
  }, [categoryCounts, data?.pagination?.total, posts.length, effectiveType]);

  // Processed posts with stream filtering and sorting
  const displayPosts = useMemo(() => {
    let list = [...posts]

    if (streamTab === 'following') {
      const followedIds = new Set((followingData || []).map((f) => f.id || f.following_id))
      list = list.filter((p) => p.author?.id && (followedIds.has(p.author.id) || p.author.id === user?.id))
    } else if (streamTab === 'groups') {
      const projectKeywords = ['đồ án', 'dự án', 'project', 'srs', 'báo cáo', 'tiểu luận', 'bài tập', 'luận văn', 'nghiên cứu', 'tài liệu', 'công nghệ', 'giải thuật', 'hệ điều hành', 'mạng máy tính', 'cơ sở dữ liệu']
      list = list.filter((p) => {
        if (selectedSubject) {
          return (p.subject || '').toLowerCase() === selectedSubject.toLowerCase()
        }
        const text = `${p.title || ''} ${p.content || ''} ${p.subject || ''} ${(p.tags || []).join(' ')}`.toLowerCase()
        return p.post_type === 'document' || projectKeywords.some((kw) => text.includes(kw))
      })
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => {
        const scoreA = (Number(a.like_count) || Number(a.likes_count) || 0) * 2 + (Number(a.comment_count) || Number(a.comments_count) || 0) * 3 + (Number(a.view_count) || 0)
        const scoreB = (Number(b.like_count) || Number(b.likes_count) || 0) * 2 + (Number(b.comment_count) || Number(b.comments_count) || 0) * 3 + (Number(b.view_count) || 0)
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }

    return list
  }, [posts, streamTab, sortBy, selectedSubject, followingData, user?.id])

  // Featured active students derived safely from feed posts
  const featuredStudents = useMemo(() => {
    const list = []
    const seen = new Set()
    for (const item of posts) {
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
  }, [posts])
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  // Guest view: only document posts allowed without login
  const visibleFilters = isAuthenticated
    ? [
        { label: 'Tất cả', value: '', count: counts.all },
        { label: 'Chia sẻ PDF', value: 'document', count: counts.document, icon: FileText },
        { label: 'Hỏi đáp', value: 'question', count: counts.question, icon: HelpCircle },
        { label: 'Thảo luận', value: 'discussion', count: counts.discussion, icon: MessageSquare },
      ]
    : [{ label: 'Tài liệu PDF miễn phí', value: 'document', count: counts.document, icon: FileText }]

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

  const handleTrendingClick = (topicItem) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('search', topicItem.query);
    setSearchParams(nextParams);
    setSearchKeyword(topicItem.query);
    setPage(1);
  };

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
    <div className="grid items-start gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
      {/* ═══════════════════════════════════════════════
          CỘT CHÍNH (MAIN FEED): Tạo bài & Danh sách bài (Tối ưu 700px)
          ═══════════════════════════════════════════════ */}
      <div className="mx-auto flex w-full min-w-0 max-w-[700px] flex-col space-y-4">
        {/* Inline Post Composer (Grovelyn Image 4 Style - Part of Column 2) */}
        {isAuthenticated ? (
          <InlineComposer user={user} onPostSuccess={() => refetch()} />
        ) : (
          <div className="relative overflow-hidden rounded-[22px] bg-[#06110a] dark:bg-[#242526] text-white p-6 sm:p-7 shadow-xs border border-[#213328] dark:border-[#3E4042] transition-colors">
            {/* Subtle decorative leaf SVG background */}
            <svg
              aria-hidden="true"
              viewBox="0 0 300 170"
              preserveAspectRatio="xMidYMid slice"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-30 select-none"
            >
              <path d="M0 0c5.6 -4.7 13.2 -4.7 18.8 0c-5.6 4.7 -13.2 4.7 -18.8 0z" fill="#5bd13a" opacity="0.6" transform="translate(240 25) rotate(45)" />
              <path d="M0 0c6.8 -5.5 16 -5.5 22.8 0c-6.8 5.5 -16 5.5 -22.8 0z" fill="#dcf6cf" opacity="0.5" transform="translate(260 70) rotate(-35)" />
              <circle cx="215" cy="40" r="4" fill="#5bd13a" opacity="0.7" />
              <circle cx="280" cy="115" r="3" fill="#dcf6cf" opacity="0.6" />
            </svg>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 dark:bg-[#163D29] text-white dark:text-[#2ECC71] border border-white/10 dark:border-[#3E4042]">
                  <Sparkles className="w-3.5 h-3.5 text-[#5bd13a]" />
                  <span>Cộng đồng học thuật sinh viên 2026</span>
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  Khám phá &amp; Chia sẻ kho tri thức đại học
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 dark:text-neutral-400 max-w-xl leading-relaxed">
                  Kho tài liệu PDF, đồ án mẫu và đề cương ôn thi được sinh viên chia sẻ hoàn toàn miễn phí.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Link
                  to="/login"
                  className="bg-[#5bd13a] hover:bg-[#6ee04d] text-[#06110a] font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl border border-white/20 transition-all active:scale-[0.98]"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── BỘ LỌC BẢNG TIN (KHOẢNG CÁCH GỌN GÀNG, GẮN KẾT) ── */}
        <div className="space-y-2 pt-0.5">
          {/* ── TẦNG 1: FEED STREAM TABS & SẮP XẾP (GROVELYN COMMUNITY FEED STYLE) ── */}
          <div className="flex items-center justify-between border-b border-[#E2E7DE] dark:border-[#3E4042] pb-0">
            <div role="tablist" aria-label="Bảng tin" className="flex min-w-0 gap-3 sm:gap-7 overflow-x-auto [scrollbar-width:none] flex-1 mr-2">
              <button
                type="button"
                role="tab"
                aria-selected={streamTab === 'for-you'}
                onClick={() => setStreamTab('for-you')}
                className={`-mb-px shrink-0 border-b-[3px] pb-2 pt-0.5 text-xs sm:text-[16px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  streamTab === 'for-you'
                    ? 'border-[#16a34a] dark:border-[#22c55e] text-[#06110a] dark:text-white'
                    : 'border-transparent text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
                }`}
              >
                Dành cho bạn
              </button>

              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={streamTab === 'following'}
                    onClick={() => setStreamTab('following')}
                    className={`-mb-px shrink-0 border-b-[3px] pb-2 pt-0.5 text-xs sm:text-[16px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      streamTab === 'following'
                        ? 'border-[#16a34a] dark:border-[#22c55e] text-[#06110a] dark:text-white'
                        : 'border-transparent text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
                    }`}
                  >
                    Đang theo dõi
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={streamTab === 'groups'}
                    onClick={() => setStreamTab('groups')}
                    className={`-mb-px shrink-0 border-b-[3px] pb-2 pt-0.5 text-xs sm:text-[16px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      streamTab === 'groups'
                        ? 'border-[#16a34a] dark:border-[#22c55e] text-[#06110a] dark:text-white'
                        : 'border-transparent text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
                    }`}
                  >
                    Môn học &amp; Đồ án
                  </button>
                </>
              )}
            </div>

            {/* Sắp xếp bài viết */}
            <label className="relative flex shrink-0 items-center gap-1.5 pb-2 pt-0.5 text-xs sm:text-sm font-semibold text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white cursor-pointer select-none">
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              <span className="sr-only sm:not-sr-only text-xs">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-1 font-bold text-xs sm:text-sm text-[#06110a] dark:text-white outline-none"
              >
                <option value="newest" className="bg-white dark:bg-[#303132] text-[#06110a] dark:text-white">Mới nhất</option>
                <option value="popular" className="bg-white dark:bg-[#303132] text-[#06110a] dark:text-white">Sôi nổi nhất</option>
              </select>
            </label>
          </div>

          {/* ── THANH CHỌN MÔN HỌC TRỰC TIẾP KHI Ở TAB MÔN HỌC & ĐỒ ÁN ── */}
          {streamTab === 'groups' && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none -mx-1 px-1">
              <span className="text-[11px] font-bold text-[#56614f] dark:text-[#B0B3B8] shrink-0 mr-1">
                Lọc môn:
              </span>
              {POPULAR_SUBJECTS.map((sub) => {
                const isSelected = selectedSubject === sub || (sub === 'Tất cả môn' && !selectedSubject)
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSubjectChange(sub)}
                    className={`text-xs px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 font-semibold ${
                      isSelected
                        ? 'bg-[#16a34a] text-white dark:bg-[#2ECC71] dark:text-[#18191A] shadow-2xs font-bold'
                        : 'bg-white dark:bg-[#242526] text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white border border-[#E2E7DE] dark:border-[#3E4042]'
                    }`}
                  >
                    {sub}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── TẦNG 2: PHÂN LOẠI NỘI DUNG (FILTER PILLS WITH TABULAR COUNTS) ── */}
          <div className="-mx-1 flex max-w-full items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none] py-0.5">
            {visibleFilters.map(({ label, value, count, icon: Icon }) => {
              const isActive = (effectiveType === value) || (!isAuthenticated && value === 'document')
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleFilterChange(value)}
                  aria-pressed={isActive}
                  className={`inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#06110a] dark:bg-[#22c55e] text-white dark:text-[#06110a] shadow-xs'
                      : 'border border-[#E2E7DE] dark:border-[#3E4042] bg-white dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8] hover:bg-[#F2F4EF] dark:hover:bg-[#262626] hover:text-[#06110a] dark:hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                  {typeof count === 'number' && (
                    <span
                      className={`text-[11px] tabular-nums font-extrabold ${
                        isActive
                          ? 'text-[#5bd13a] dark:text-[#06110a]'
                          : 'text-[#16a34a] dark:text-[#4ade80]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
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
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#166534]">
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
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#166534]">
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
        ) : streamTab === 'following' && displayPosts.length === 0 ? (
          <div className="card text-center py-16 space-y-4 bg-surface-card border border-surface-border shadow-xs rounded-[20px]">
            <div className="w-14 h-14 rounded-2xl bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80] flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-content text-base sm:text-lg">Chưa có bài viết từ bạn học bạn theo dõi</h3>
              <p className="text-content-muted text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                Khám phá danh sách thành viên tích cực bên cột phải hoặc theo dõi các tác giả chia sẻ tài liệu hữu ích để cập nhật bài viết mới tại đây.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStreamTab('for-you')}
              className="btn-primary text-xs sm:text-sm py-2 px-5 rounded-full inline-flex items-center gap-1.5 mx-auto"
            >
              <span>Xem bảng tin "Dành cho bạn"</span>
            </button>
          </div>
        ) : displayPosts.length === 0 ? (
          <div className="card text-center py-20 space-y-4 bg-surface-card border border-surface-border shadow-card rounded-[20px]">
            <div className="w-16 h-16 rounded-full bg-surface-muted text-content-muted flex items-center justify-center mx-auto border border-surface-border">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-content text-lg">Không tìm thấy bài viết nào</h3>
            <p className="text-content-muted text-xs sm:text-sm max-w-md mx-auto">
              {searchKeyword || selectedSubject
                ? 'Không có kết quả nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử từ khóa khác nhé!'
                : 'Hiện chưa có bài viết nào trong danh mục này. Hãy là người đầu tiên chia sẻ kiến thức!'}
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              {(searchKeyword || selectedSubject) && (
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.delete('search')
                    next.delete('subject')
                    setSearchParams(next)
                    setPage(1)
                  }}
                  className="btn-secondary text-xs sm:text-sm py-2 px-4 rounded-xl"
                >
                  Đặt lại bộ lọc
                </button>
              )}
              {isAuthenticated ? (
                <Link
                  to="/posts/create"
                  className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm py-2.5 px-5 rounded-full"
                >
                  <span>Tạo bài viết ngay</span>
                </Link>
              ) : (
                <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm py-2.5 px-5 rounded-full">
                  <span>Đăng nhập để đăng bài</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPosts.map((post) => (
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
          CỘT PHẢI (SIDE WIDGETS): Môn học, Xu hướng, Bạn bè, Thống kê (Grovelyn Standard: 320px - 340px)
          ═══════════════════════════════════════════════ */}
      <aside aria-label="Cột bên" className="hidden flex-col gap-4 lg:sticky lg:top-20 lg:flex lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-8">
        {/* Widget 1: Bộ lọc nhanh theo Môn học (Subject Pills) */}
        <div className="rounded-[22px] p-5 sm:p-6 space-y-4 bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[17px] sm:text-[18px] text-[#06110a] dark:text-white flex items-center gap-2 tracking-tight">
              <Sparkles className="w-4 h-4 text-[#5bd13a]" />
              <span>Chủ đề &amp; Môn học</span>
            </h3>
            <span className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] font-semibold">Khám phá</span>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {POPULAR_SUBJECTS.map((sub) => {
              const isSelected = selectedSubject === sub || (sub === 'Tất cả môn' && !selectedSubject)
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubjectChange(sub)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold border transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-[#16a34a] text-white dark:bg-[#22c55e] dark:text-[#06110a] border-transparent shadow-2xs'
                      : 'bg-[#F2F4EF] dark:bg-[#303132] hover:bg-[#E2E7DE] dark:hover:bg-[#262626] text-[#56614f] dark:text-[#B0B3B8] border-[#E2E7DE] dark:border-[#3E4042]'
                  }`}
                >
                  {sub}
                </button>
              )
            })}
          </div>
        </div>

        {/* Widget 2: Đang được nói nhiều (Trending Topics - Khung mẫu Grovelyn theo ảnh tham chiếu) */}
        <div className="rounded-[22px] p-5 sm:p-6 space-y-3.5 bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[17px] sm:text-[18px] text-[#06110a] dark:text-white flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-4 h-4 text-[#5bd13a]" />
              <span>Đang được nói nhiều</span>
            </h3>
            <span className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] font-semibold">Xu hướng</span>
          </div>

          <div className="space-y-2.5">
            {trendingTopics.length === 0 ? (
              <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] py-2 text-center">
                Chưa có chủ đề nổi bật nào.
              </p>
            ) : (
              trendingTopics.map((item) => (
                <div
                  key={item.topic}
                  onClick={() => handleTrendingClick(item)}
                  className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-[#F2F4EF] dark:hover:bg-[#171717] transition-colors cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EAF5EC] dark:bg-[#163D29] text-[#16a34a] dark:text-[#2ECC71] flex items-center justify-center font-bold text-sm shrink-0 border border-[#bbf7d0]/40 dark:border-[#3E4042]">
                    #
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#06110a] dark:text-white group-hover:underline truncate">
                      #{item.topic}
                    </p>
                    <p className="text-xs text-[#56614f] dark:text-[#B0B3B8]">
                      {item.count} bài viết
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 3: Tác giả tích cực trong bảng tin */}
        <div className="rounded-[22px] p-5 sm:p-6 space-y-4 bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[17px] sm:text-[18px] text-[#06110a] dark:text-white flex items-center gap-2 tracking-tight">
              <Users className="w-4 h-4 text-[#5bd13a]" />
              <span>Thành viên tích cực</span>
            </h3>
            <span className="text-[11px] text-[#56614f] dark:text-[#B0B3B8] font-medium">Bảng tin</span>
          </div>

          {featuredStudents.length === 0 ? (
            <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] py-3 text-center">
              Chưa có thành viên nào chia sẻ bài viết trong bộ lọc này.
            </p>
          ) : (
            <div className="space-y-2.5">
              {featuredStudents.map((student) => (
                <Link
                  key={student.id}
                  to={`/profile/${student.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F2F4EF] dark:hover:bg-[#171717] transition-colors group"
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-[#F2F4EF] dark:bg-[#303132] border border-[#E2E7DE] dark:border-[#3E4042] flex items-center justify-center overflow-hidden font-bold text-[#06110a] dark:text-[#2ECC71] text-xs">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url}
                          alt={student.full_name || 'U'}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        student.full_name?.[0]?.toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#5bd13a] border-2 border-white dark:border-[#0A0A0A]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#06110a] dark:text-white group-hover:text-[#16a34a] dark:group-hover:text-[#22c55e] truncate">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] truncate">
                      {student.university ? `${student.university}` : student.major}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Widget 4: Thống kê sinh viên tuần này */}
        <div className="rounded-[22px] p-5 sm:p-6 space-y-3.5 bg-gradient-to-br from-[#16a34a]/10 via-[#22c55e]/5 to-surface-card border border-[#16a34a]/20 dark:border-[#22c55e]/20 shadow-xs">
          <div className="flex items-center gap-2 text-[#16a34a] dark:text-[#2ECC71] font-bold text-[15px] tracking-tight">
            <BarChart3 className="w-4 h-4" />
            <span>Mạng xã hội học tập</span>
          </div>
          <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] leading-relaxed">
            Hơn <strong className="text-[#06110a] dark:text-white font-bold">{counts.document || 0}</strong> tài liệu PDF ôn thi và đồ án môn học được sinh viên đóng góp và tải về hoàn toàn miễn phí.
          </p>
        </div>
      </aside>
    </div>
  )
}
