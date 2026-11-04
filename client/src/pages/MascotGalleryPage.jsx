import React from 'react'
import EmptyState, { OwlMascotArt } from '@/components/common/EmptyState'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const MASCOT_VARIANTS = [
  {
    variant: 'feed',
    title: 'Bảng tin đang yên ắng',
    description: 'Hiện chưa có bài viết nào trong danh mục này. Hãy là người đầu tiên khơi nguồn thảo luận học tập!',
    actionLabel: 'Tạo bài viết ngay',
    actionLink: '/posts/create',
    subtitle: 'Feed Empty (Đọc sách bên tách cà phê)',
  },
  {
    variant: 'search',
    title: 'Không tìm thấy bài viết phù hợp',
    description: 'Không có kết quả nào khớp với từ khóa tìm kiếm. Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc môn học nhé!',
    actionLabel: 'Xóa bộ lọc tìm kiếm',
    actionLink: '/search',
    subtitle: 'Search Empty (Kính lúp & Cuộn giấy da cổ)',
  },
  {
    variant: 'notifications',
    title: 'Không có thông báo mới',
    description: 'Khi có bạn học bình luận, thích bài viết hoặc theo dõi bạn, thông báo sẽ hiển thị tại đây.',
    actionLabel: 'Khám phá cộng đồng',
    actionLink: '/',
    subtitle: 'Notifications Empty (Chuông vàng học đường & Zzz)',
  },
  {
    variant: 'documents',
    title: 'Chưa có tài liệu PDF nào',
    description: 'Tải lên slide bài giảng, đề cương ôn tập hoặc giáo trình học phần để chia sẻ cùng bạn bè.',
    actionLabel: 'Chia sẻ tài liệu PDF',
    actionLink: '/posts/create?type=document',
    subtitle: 'Documents Empty (Tập tài liệu PDF & Thư mục xanh)',
  },
  {
    variant: 'profile',
    title: 'Chưa có hoạt động học thuật',
    description: 'Bắt đầu đăng bài chia sẻ kiến thức hoặc tương tác trong cộng đồng để xây dựng hồ sơ học tập.',
    actionLabel: 'Khám phá bài viết hay',
    actionLink: '/',
    subtitle: 'Profile Empty (Mũ tốt nghiệp cử nhân)',
  },
  {
    variant: 'bookmarks',
    title: 'Chưa có bài viết nào được lưu',
    description: 'Bấm Lưu bài dưới bất kỳ bài viết hoặc tài liệu nào ở Trang chủ để lưu vào danh sách ôn tập cá nhân.',
    actionLabel: 'Khám phá Bảng tin',
    actionLink: '/',
    subtitle: 'Bookmarks Empty (Sách cài dải ruy băng)',
  },
]

export default function MascotGalleryPage() {
  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] dark:text-[#4ADE80] hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về trang chủ</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] dark:bg-[#14532D]/40 text-[#16A34A] dark:text-[#4ADE80] flex items-center justify-center border border-[#BBF7D0] dark:border-[#166534]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06110a] dark:text-white tracking-tight">
              Hệ Thống Linh Vật OwlMate Mascot System
            </h1>
            <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8]">
              Bộ minh họa vector SVG chính thức của OwlMate Campus với 6 biến thể học thuật đặc thù
            </p>
          </div>
        </div>
      </div>

      {/* Grid of All 6 Mascot Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MASCOT_VARIANTS.map((item) => (
          <div
            key={item.variant}
            className="flex flex-col rounded-2xl border border-[#E2E7DE] dark:border-[#3E4042] bg-white dark:bg-[#242526] p-5 shadow-xs transition-all hover:border-[#16A34A]/50 dark:hover:border-[#4ADE80]/50"
          >
            {/* Header Tag */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E7DE] dark:border-[#3E4042] mb-3">
              <span className="text-[11px] font-bold text-[#16A34A] dark:text-[#4ADE80] bg-[#DCFCE7] dark:bg-[#14532D]/40 px-2.5 py-0.5 rounded-full border border-[#BBF7D0] dark:border-[#166534] font-mono">
                variant="{item.variant}"
              </span>
              <span className="text-[10px] font-medium text-[#56614f] dark:text-[#B0B3B8]">
                {item.subtitle.split('(')[1]?.replace(')', '') || ''}
              </span>
            </div>

            {/* Mascot Illustration */}
            <div className="py-2 flex items-center justify-center">
              <OwlMascotArt variant={item.variant} className="w-36 h-36" />
            </div>

            {/* Text & Content */}
            <div className="text-center space-y-1.5 flex-1 flex flex-col justify-between pt-2">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#06110a] dark:text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-[#56614f] dark:text-[#B0B3B8] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3">
                <Link
                  to={item.actionLink}
                  className="w-full text-xs font-bold py-2 px-4 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>{item.actionLabel}</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

