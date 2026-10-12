import { Link } from 'react-router-dom'

const TYPE_LABELS = { question: '❓ Hỏi đáp', document: '📄 Tài liệu', discussion: '💬 Thảo luận' }

export default function PostCard({ post }) {
  const isFree = !post.price || parseFloat(post.price) === 0

  return (
    <article className="card-hover group animate-fade-in">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-semibold shrink-0">
          {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-medium text-slate-300">{post.author?.full_name}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500">
              {new Date(post.created_at).toLocaleDateString('vi-VN')}
            </span>
            <span className="badge-type">{TYPE_LABELS[post.post_type]}</span>
          </div>

          {/* Title */}
          <Link to={`/posts/${post.id}`} className="block">
            <h2 className="font-semibold text-slate-100 group-hover:text-primary-400 transition-colors line-clamp-2 text-[15px] leading-snug">
              {post.title}
            </h2>
          </Link>

          {/* Subject */}
          {post.subject && (
            <p className="text-xs text-slate-500 mt-1">📚 {post.subject}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>👁️ {post.view_count}</span>
            </div>

            {/* Price badge */}
            {post.post_type === 'document' && (
              <span className={isFree ? 'badge-free' : 'badge-paid'}>
                {isFree ? '✅ Miễn phí' : `💰 ${Number(post.price).toLocaleString('vi-VN')}đ`}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
