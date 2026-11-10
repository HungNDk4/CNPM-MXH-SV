import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import PostCard from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import {
  Search,
  FileText,
  HelpCircle,
  MessageSquare,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'

const POPULAR_SUBJECTS = [
  'Tất cả môn',
  'Công nghệ phần mềm',
  'Cơ sở dữ liệu',
  'Lập trình Web',
  'Trí tuệ nhân tạo',
  'Kiến trúc máy tính',
  'An toàn thông tin',
]

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const rawKeyword = searchParams.get('search') || searchParams.get('q') || ''
  const [inputVal, setInputVal] = useState(rawKeyword)

  const activeType = searchParams.get('type') || ''
  const selectedSubject = searchParams.get('subject') || ''
  const sortBy = searchParams.get('sort') || 'newest'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  // Synchronize local input if URL search param changes
  useEffect(() => {
    setInputVal(rawKeyword)
  }, [rawKeyword])

  // When not logged in, guests can only view free document posts (ADR-002)
  const effectiveType = isAuthenticated ? activeType : 'document'

  // Query posts matching current search filters
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search-results', rawKeyword, effectiveType, selectedSubject, sortBy, page, isAuthenticated],
    queryFn: async () => {
      const params = { page, limit: 10, sort: sortBy }
      if (rawKeyword) params.search = rawKeyword
      if (effectiveType) params.type = effectiveType
      if (selectedSubject && selectedSubject !== 'Tất cả môn') params.subject = selectedSubject
      return (await postAPI.getAll(params)).data
    },
    keepPreviousData: true,
    retry: false,
  })

  // Concurrently query category totals for tab counts
  const { data: categoryCounts } = useQuery({
    queryKey: ['search-category-counts', rawKeyword, selectedSubject, isAuthenticated],
    queryFn: async () => {
      const baseParams = { page: 1, limit: 10 }
      if (rawKeyword) baseParams.search = rawKeyword
      if (selectedSubject && selectedSubject !== 'Tất cả môn') baseParams.subject = selectedSubject

      if (!isAuthenticated) {
        const docRes = await postAPI.getAll({ ...baseParams, type: 'document' })
        const docTotal = docRes.data?.pagination?.total ?? 0
        return { all: docTotal, document: docTotal, question: 0, discussion: 0 }
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
      }
    },
    staleTime: 30000,
    keepPreviousData: true,
    retry: false,
  })

  const posts = data?.data || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  const counts = categoryCounts || {
    all: pagination.total || 0,
    document: 0,
    question: 0,
    discussion: 0,
  }

  // Filter tabs definition (verified with backend capabilities)
  const tabs = isAuthenticated
    ? [
        { id: '', label: 'Tất cả', count: counts.all },
        { id: 'document', label: 'Tài liệu PDF', count: counts.document, icon: FileText },
        { id: 'question', label: 'Hỏi đáp', count: counts.question, icon: HelpCircle },
        { id: 'discussion', label: 'Thảo luận', count: counts.discussion, icon: MessageSquare },
      ]
    : [{ id: 'document', label: 'Tài liệu PDF miễn phí', count: counts.document, icon: FileText }]

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    const trimmed = inputVal.trim()
    if (trimmed) {
      nextParams.set('search', trimmed)
      nextParams.delete('q')
    } else {
      nextParams.delete('search')
      nextParams.delete('q')
    }
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleClear = () => {
    setInputVal('')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('search')
    nextParams.delete('q')
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleTabChange = (typeVal) => {
    const nextParams = new URLSearchParams(searchParams)
    if (typeVal) {
      nextParams.set('type', typeVal)
    } else {
      nextParams.delete('type')
    }
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleSubjectChange = (sub) => {
    const nextParams = new URLSearchParams(searchParams)
    if (sub && sub !== 'Tất cả môn') {
      nextParams.set('subject', sub)
    } else {
      nextParams.delete('subject')
    }
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handleSortChange = (newSort) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('sort', newSort)
    nextParams.set('page', '1')
    setSearchParams(nextParams)
  }

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(newPage))
    setSearchParams(nextParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Page Header & Search Bar ── */}
      <div className="space-y-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06110a] dark:text-[#E7E7E7] flex items-center gap-2.5">
            <Search className="w-6 h-6 sm:w-7 sm:h-7 text-[#16a34a] dark:text-[#2ECC71]" />
            <span>Tìm kiếm học thuật</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] mt-1 leading-relaxed">
            Tra cứu bài viết, tài liệu học tập PDF, câu hỏi đáp và chủ đề thảo luận trên toàn bộ hệ thống OwlMate.
          </p>
        </div>

        {/* Dedicated Search Input Field */}
        <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Nhập từ khóa tìm kiếm (tiêu đề, nội dung, mã môn, môn học)..."
            className="w-full bg-white dark:bg-[#1E2E28] border border-[#DCE5DC] dark:border-[#2C3B35] text-[#123D35] dark:text-[#E2E8F0] placeholder-[#52675A] dark:placeholder-[#A8B9AF] rounded-2xl pl-11 pr-24 py-3 text-sm focus:bg-white dark:focus:bg-[#17231F] focus:border-[#16A34A] dark:focus:border-[#4ADE80] focus:ring-2 focus:ring-[#16A34A]/20 dark:focus:ring-[#4ADE80]/20 outline-none transition-all shadow-xs font-medium"
          />
          <Search className="w-5 h-5 text-[#52675A] dark:text-[#A8B9AF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#16A34A] hover:bg-[#15803d] text-white dark:bg-[#2ECC71] dark:hover:bg-[#27ae60] dark:text-[#18191A] text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              Tìm
            </button>
          </div>
        </form>

        {/* ── Category Tabs with Real Totals ── */}
        <div className="flex items-center gap-4 sm:gap-6 pt-2 border-b border-[#E2E7DE] dark:border-[#3E4042] text-sm font-semibold overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = (effectiveType === tab.id) || (!isAuthenticated && tab.id === 'document')
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`pb-3 relative transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-[#16a34a] dark:text-[#2ECC71] font-bold'
                    : 'text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] tabular-nums font-extrabold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#16a34a]/10 text-[#16a34a] dark:bg-[#22c55e]/20 dark:text-[#2ECC71]'
                      : 'bg-[#F2F4EF] dark:bg-[#303132] text-[#56614f] dark:text-[#B0B3B8]'
                  }`}
                >
                  {tab.count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#16a34a] dark:bg-[#22c55e] rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Subject Filter Pills & Sort Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none -mx-1 px-1">
          <span className="text-[11px] font-bold text-[#56614f] dark:text-[#B0B3B8] shrink-0 mr-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#16a34a]" />
            Môn học:
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

        {/* Sort Selector */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-[#56614f] dark:text-[#B0B3B8] font-medium bg-white dark:bg-[#242526] px-2.5 py-1 rounded-xl border border-[#E2E7DE] dark:border-[#3E4042]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="bg-transparent font-bold text-[#06110a] dark:text-white outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white dark:bg-[#303132]">Mới nhất</option>
              <option value="popular" className="bg-white dark:bg-[#303132]">Sôi nổi nhất</option>
            </select>
          </label>
        </div>
      </div>

      {/* ── Search Results List ── */}
      {isLoading ? (
        <div className="space-y-4" role="status">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center space-y-3 bg-surface-card border border-surface-border rounded-2xl">
          <p className="text-rose-500 font-semibold text-sm">Không thể tải kết quả tìm kiếm.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn-secondary px-4 py-2 text-xs rounded-xl"
          >
            Thử lại
          </button>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          variant="search"
          icon={Search}
          title="Không tìm thấy bài viết phù hợp"
          description={
            rawKeyword
              ? `Không có kết quả nào khớp với "${rawKeyword}". Hãy thử từ khóa khác hoặc lọc lại môn học nhé!`
              : 'Hãy nhập từ khóa vào ô tìm kiếm ở trên để bắt đầu tra cứu nội dung học tập.'
          }
          actionText="Xóa bộ lọc tìm kiếm"
          onAction={handleClear}
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8] px-1">
            Hiển thị {posts.length} trên tổng số {pagination.total} kết quả
          </div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6 border-t border-[#E2E7DE] dark:border-[#3E4042]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="btn-secondary p-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#56614f] dark:text-[#B0B3B8]">
            Trang {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="btn-secondary p-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
