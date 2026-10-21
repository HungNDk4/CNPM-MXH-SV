import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { postAPI } from '@/services/api'
import PostCard from '@/components/PostCard'
import { useAuthStore } from '@/stores/authStore'

const FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hỏi đáp', value: 'question' },
  { label: 'Tài liệu', value: 'document' },
  { label: 'Thảo luận', value: 'discussion' },
]

export default function HomePage() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const [filter, setFilter] = useState('all')
  // ADR-002 OPEN: guest may only request public document metadata.
  const activeType = isAuthenticated ? filter : 'document'
  const visibleFilters = isAuthenticated ? FILTERS : FILTERS.filter(item => item.value === 'document')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', activeType, isAuthenticated],
    queryFn: () => postAPI.getAll({
      limit: 20,
      ...(activeType === 'all' ? {} : { type: activeType }),
    }).then(response => response.data),
    retry: false,
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Hero banner */}
        <div className="card bg-gradient-to-br from-primary-900/50 to-accent-600/20 border-primary-800/50">
          <h1 className="text-2xl font-bold text-gradient mb-2">📚 Mini Study Network</h1>
          <p className="text-slate-400 text-sm">Chia sẻ tài liệu, hỏi đáp, học cùng nhau.</p>
          {!isAuthenticated && <p className="text-xs text-amber-300 mt-2">Khách có thể xem tài liệu miễn phí. Đăng nhập để tải PDF hoặc tham gia hỏi đáp.</p>}
          <Link to="/posts/create" className="btn-primary inline-block mt-4 text-sm">
            ✏️ Đăng bài mới
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {visibleFilters.map(({ label, value }) => (
            <button key={value} type="button" onClick={() => setFilter(value)}
              aria-pressed={activeType === value}
              className={'btn-secondary text-sm py-1.5 px-4 ' +
                (activeType === value ? 'border-primary-500 text-primary-300' : '')}>
              {label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"/>
                <div className="h-3 bg-slate-700 rounded w-1/2"/>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card text-center text-slate-400 py-10">
            ❌ Không thể tải bài viết. Vui lòng thử lại.
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="card text-center text-slate-400 py-10">
            📭 Chưa có bài viết nào. Hãy là người đầu tiên!
          </div>
        ) : (
          data?.data?.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-3">🔥 Trending Tags</h3>
          <div className="flex flex-wrap gap-2">
            {['CNPM', 'Java', 'React', 'Giải tích', 'CSDL', 'OOP', 'Python'].map(tag => (
              <span key={tag} className="badge-type cursor-pointer hover:bg-primary-700/40 transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-200 mb-3">📊 Thống kê</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Tổng bài viết</span>
              <span className="text-slate-200 font-medium">{data?.pagination?.total || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Tài liệu miễn phí</span>
              <span className="text-emerald-400 font-medium">
                {activeType === 'document' ? (data?.pagination?.total ?? 0) : '—'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
