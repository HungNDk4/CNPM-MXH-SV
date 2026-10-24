import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { postAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'

const FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hỏi đáp', value: 'question' },
  { label: 'Tài liệu', value: 'document' },
  { label: 'Thảo luận', value: 'discussion' },
]

const POPULAR_TAGS = ['CNPM', 'Java', 'React', 'Giải tích', 'CSDL', 'OOP', 'Python']

export default function HomePage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const [filter, setFilter] = useState('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKeyword = searchParams.get('search') || ''
  const selectedSubject = searchParams.get('subject') || ''
  const [page, setPage] = useState(1)

  // ADR-002: Guest only allowed document metadata
  const activeType = isAuthenticated ? filter : 'document'
  const visibleFilters = isAuthenticated ? FILTERS : FILTERS.filter(item => item.value === 'document')

  // Query posts with search, filter, subject, pagination
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['posts', activeType, isAuthenticated, searchKeyword, selectedSubject, page],
    queryFn: () => postAPI.getAll({
      page,
      limit: 10,
      ...(activeType === 'all' ? {} : { type: activeType }),
      ...(searchKeyword ? { search: searchKeyword } : {}),
      ...(selectedSubject ? { subject: selectedSubject } : {}),
    }).then(response => response.data),
    retry: false,
    keepPreviousData: true,
  })

  const pagination = data?.pagination
  const totalPages = pagination?.totalPages || 1

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Main Feed ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Hero banner */}
        <div className="card bg-gradient-to-br from-primary-900/50 to-accent-600/20 border-primary-800/50">
          <h1 className="text-2xl font-bold text-gradient mb-2">📚 Mini Study Network</h1>
          <p className="text-slate-400 text-sm">Chia sẻ tài liệu, hỏi đáp, học cùng nhau.</p>
          {!isAuthenticated && (
            <p className="text-xs text-amber-300 mt-2">
              Khách có thể xem tài liệu miễn phí. Đăng nhập để tải PDF hoặc tham gia hỏi đáp.
            </p>
          )}
          <Link to="/posts/create" className="btn-primary inline-block mt-4 text-sm">
            ✏️ Đăng bài mới
          </Link>
        </div>

        {/* Active Filters Display (from Navbar search & Sidebar tags) */}
        {(searchKeyword || selectedSubject) && (
          <div className="flex items-center justify-between bg-surface-card border border-surface-border px-3.5 py-2.5 rounded-xl text-xs sm:text-sm">
            <div className="flex items-center gap-2 flex-wrap text-slate-300">
              <span className="text-slate-400">Đang lọc theo:</span>
              {searchKeyword && (
                <span className="badge-type bg-primary-900/40 border-primary-700/60 text-primary-200 flex items-center gap-1.5">
                  🔍 "{searchKeyword}"
                  <button
                    type="button"
                    onClick={removeSearchFilter}
                    className="hover:text-red-400 font-bold ml-1 cursor-pointer"
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    ✕
                  </button>
                </span>
              )}
              {selectedSubject && (
                <span className="badge-type bg-accent-900/40 border-accent-700/60 text-accent-200 flex items-center gap-1.5">
                  📚 Môn: {selectedSubject}
                  <button
                    type="button"
                    onClick={removeSubjectFilter}
                    className="hover:text-red-400 font-bold ml-1 cursor-pointer"
                    aria-label="Xóa bộ lọc môn học"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-primary-400 hover:text-primary-300 hover:underline shrink-0 ml-2 cursor-pointer"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {visibleFilters.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleFilterChange(value)}
              aria-pressed={activeType === value}
              className={`btn-secondary text-sm py-1.5 px-4 ${
                activeType === value ? 'border-primary-500 text-primary-300' : ''
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card text-center text-slate-400 py-10 space-y-3">
            <p>❌ Không thể tải bài viết. Vui lòng thử lại.</p>
            <button type="button" onClick={() => refetch()} className="btn-secondary text-xs">
              Thử lại
            </button>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="card text-center text-slate-400 py-12 space-y-2">
            <p className="text-2xl">📭</p>
            <p className="text-slate-300 font-medium">Không tìm thấy bài viết nào.</p>
            <p className="text-xs text-slate-500">
              {searchKeyword || selectedSubject
                ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.'
                : 'Chưa có bài viết nào trong mục này.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.data?.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination (FE-03) */}
        {totalPages > 1 && (
          <nav aria-label="Phân trang" className="card flex items-center justify-between py-3 px-4">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              aria-label="Trang trước"
            >
              ← Trang trước
            </button>
            <span className="text-xs text-slate-400">
              Trang <strong className="text-slate-200">{page}</strong> / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage(p => p + 1)}
              className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
              aria-label="Trang sau"
            >
              Trang sau →
            </button>
          </nav>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="space-y-4">
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
            <span>🔥</span> Môn học phổ biến
          </h3>
          <div className="flex flex-wrap gap-2">
            {POPULAR_TAGS.map(tag => {
              const isSelected = selectedSubject === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`badge-type cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-500'
                      : 'hover:bg-primary-700/40 text-slate-300'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
            <span>📊</span> Thống kê bài viết
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Tổng tìm thấy</span>
              <span className="text-slate-200 font-medium">{pagination?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Trang hiện tại</span>
              <span className="text-slate-200 font-medium">{page} / {totalPages}</span>
            </div>
            <div className="flex justify-between">
              <span>Loại hiển thị</span>
              <span className="text-primary-300 font-medium">
                {FILTERS.find(f => f.value === activeType)?.label || activeType}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
