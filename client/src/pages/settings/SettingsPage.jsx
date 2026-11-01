import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userAPI, authAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import {
  User,
  ShieldCheck,
  FileEdit,
  HelpCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  ExternalLink,
  Trash2,
  Send,
  Eye,
  Sun,
  Moon,
  Globe,
  GraduationCap,
  BookOpen,
  Image as ImageIcon,
  Camera,
} from 'lucide-react'

const FAQ_ITEMS = [
  {
    q: 'Mỗi người được lưu bao nhiêu dung lượng?',
    a: 'Mỗi tài khoản có 100 MB cho tệp tài liệu và đồ án PDF. Ảnh bìa và ảnh đại diện không tính vào dung lượng này.',
  },
  {
    q: 'Dự án và tài liệu riêng tư thì ai xem được?',
    a: 'Chỉ có bạn và những thành viên được cấp quyền mới có thể xem. Tài liệu công khai sẽ xuất hiện trên bảng tin học tập cộng đồng.',
  },
  {
    q: 'Làm sao mời bạn bè tham gia?',
    a: 'Bạn có thể vào trang hồ sơ cá nhân, bấm "Chia sẻ hồ sơ" để sao chép liên kết gửi cho bạn bè trong trường, lớp học hoặc Zalo/Discord.',
  },
  {
    q: 'Tôi quên email đăng nhập thì sao?',
    a: 'Vui lòng liên hệ với ban quản trị sinh viên qua khung Góp ý bên dưới hoặc thông qua tài khoản quản trị viên để được hỗ trợ khôi phục.',
  },
]

const PRESET_BANNERS = [
  {
    id: 'garden-code',
    title: 'Khu vườn Công nghệ',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    desc: 'Bản mạch xanh lá & công nghệ tối ưu',
  },
  {
    id: 'cozy-library',
    title: 'Thư viện Yên tĩnh',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80',
    desc: 'Không gian học tập & nghiên cứu tập trung',
  },
  {
    id: 'cyber-dark',
    title: 'Kỷ nguyên Lập trình',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    desc: 'Matrix xanh dương & mã nguồn số',
  },
  {
    id: 'minimal-nature',
    title: 'Mầm Xanh Học Thuật',
    url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200&auto=format&fit=crop&q=80',
    desc: 'Tươi sáng, năng động và tạo cảm hứng',
  },
]

const PRESET_AVATARS = [
  {
    id: 'dev-guy',
    name: 'Coder Nam',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4,c0aede,d1d4f9',
  },
  {
    id: 'dev-girl',
    name: 'Coder Nữ',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Bella&backgroundColor=b6e3f4,ffd5dc,d1d4f9',
  },
  {
    id: 'cat-pro',
    name: 'Mèo Lập trình',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Garfield&backgroundColor=d1d4f9',
  },
  {
    id: 'human-hacker',
    name: 'Chuyên gia IT',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&clothingGraphic=react',
  },
  {
    id: 'human-scholar',
    name: 'Nghiên cứu sinh',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&eyebrows=defaultNatural',
  },
]

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'account'
  const { user, setUser } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Profile data fetch
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      const res = await userAPI.getMyProfile()
      return res.data?.data || res.data
    },
    enabled: !!user?.id,
  })

  // State for Profile Info
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [university, setUniversity] = useState('')
  const [major, setMajor] = useState('')

  // State for Avatar customization
  const [avatarMode, setAvatarMode] = useState('character') // 'character' | 'custom' | 'initials'
  const [avatarPreview, setAvatarPreview] = useState('')
  const [customAvatarInput, setCustomAvatarInput] = useState('')

  // State for Banner customization
  const [bannerPreview, setBannerPreview] = useState('')
  const [customBannerInput, setCustomBannerInput] = useState('')

  // Sync profile data to form state
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '')
      setBio(profileData.bio || '')
      setUniversity(profileData.university || '')
      setMajor(profileData.major || '')
      const curAvatar = profileData.avatar_url || user?.avatar_url || ''
      setAvatarPreview(curAvatar)
      setCustomAvatarInput(curAvatar)
      const curBanner = profileData.cover_url || ''
      setBannerPreview(curBanner)
      setCustomBannerInput(curBanner)
    }
  }, [profileData, user])

  // Profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userAPI.updateProfile(data),
    onSuccess: (res) => {
      const updated = res.data?.data || res.data
      toast.success('Đã cập nhật hồ sơ thành công!')
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (setUser && updated) {
        setUser({ ...user, ...updated })
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại!')
    },
  })

  // Save Avatar mutation
  const handleSaveAvatar = (newUrl) => {
    const finalUrl = newUrl !== undefined ? newUrl : avatarPreview
    updateProfileMutation.mutate(
      { avatar_url: finalUrl },
      {
        onSuccess: () => {
          toast.success('Đã lưu ảnh đại diện!')
        },
      }
    )
  }

  // Save Banner mutation
  const handleSaveBanner = (newUrl) => {
    const finalUrl = newUrl !== undefined ? newUrl : bannerPreview
    updateProfileMutation.mutate(
      { cover_url: finalUrl },
      {
        onSuccess: () => {
          toast.success('Đã lưu ảnh bìa mới!')
        },
      }
    )
  }

  // Save Profile info
  const handleSaveProfileInfo = (e) => {
    e?.preventDefault()
    updateProfileMutation.mutate({
      full_name: fullName.trim(),
      bio: bio.trim(),
      university: university.trim(),
      major: major.trim(),
    })
  }

  // Password mutation
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại!')
    },
  })

  const handleChangePassword = (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại!')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự trở lên!')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!')
      return
    }
    changePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    })
  }

  // Posts management query
  const { data: myPostsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['my-posts-management', user?.id],
    queryFn: async () => {
      const res = await postAPI.getPosts({ author_id: user?.id, limit: 30 })
      return res.data?.data?.posts || res.data?.posts || []
    },
    enabled: activeTab === 'posts' && !!user?.id,
  })

  const deletePostMutation = useMutation({
    mutationFn: (id) => postAPI.deletePost(id),
    onSuccess: () => {
      toast.success('Đã xóa bài viết!')
      queryClient.invalidateQueries({ queryKey: ['my-posts-management'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Xóa bài viết thất bại!')
    },
  })

  // FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')

  const handleSendFeedback = (e) => {
    e.preventDefault()
    if (!feedbackText.trim()) return
    toast.success('Cảm ơn bạn! Phản hồi đã được gửi đến ban quản trị.')
    setFeedbackText('')
  }

  const setTab = (tab) => {
    setSearchParams({ tab })
  }

  const navItems = [
    { id: 'account', label: 'Tài khoản', icon: User, desc: 'Ảnh đại diện, ảnh bìa, thông tin & giao diện' },
    { id: 'security', label: 'Mật khẩu & bảo mật', icon: ShieldCheck, desc: 'Đổi mật khẩu và an toàn tài khoản' },
    { id: 'posts', label: 'Bài đăng & hoạt động', icon: FileEdit, desc: 'Quản lý, chỉnh sửa hoặc gỡ bài viết' },
    { id: 'help', label: 'Trợ giúp & phản hồi', icon: HelpCircle, desc: 'Giải đáp thắc mắc và góp ý' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#E4E6EB] tracking-tight">
          Cài đặt tài khoản & hệ thống
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-[#B0B3B8] mt-1">
          Quản lý thông tin hồ sơ, tùy biến giao diện, kiểm soát bảo mật và bài viết sinh viên.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Nav Menu */}
        <aside className="lg:col-span-4">
          <nav className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-2 space-y-1.5 shadow-sm sticky top-24">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-start gap-3.5 p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-[#163D29] dark:text-[#2ECC71] font-semibold border-l-4 border-primary-600 dark:border-[#2ECC71]'
                      : 'text-slate-600 dark:text-[#B0B3B8] hover:bg-slate-50 dark:hover:bg-[#303132] hover:text-slate-900 dark:hover:text-[#E4E6EB]'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${isActive ? 'text-primary-600 dark:text-[#2ECC71]' : 'text-slate-400 dark:text-[#B0B3B8]'}`} />
                  <div>
                    <div className="text-sm font-bold leading-tight">{item.label}</div>
                    <div className="text-xs text-slate-400 dark:text-[#B0B3B8]/80 mt-0.5 line-clamp-1">{item.desc}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="lg:col-span-8">
          {/* TAB 1: TÀI KHOẢN (Gộp Avatar + Banner + Thông tin + Giao diện) */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              {/* PHẦN 1: ẢNH ĐẠI DIỆN */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Ảnh đại diện</h2>
                    <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">Chọn nhân vật đại diện hoặc tải liên kết ảnh của bạn</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#303132] text-slate-600 dark:text-[#B0B3B8]">
                    Tùy biến
                  </span>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Live preview */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <img
                        src={avatarPreview || user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix'}
                        alt="Preview Avatar"
                        className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-[#3E4042] shadow-sm object-cover bg-slate-100 dark:bg-[#303132]"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-[#B0B3B8] mt-2 font-medium">Xem trước</span>
                  </div>

                  {/* Mode switcher & presets */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#303132] rounded-xl text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => setAvatarMode('character')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                          avatarMode === 'character'
                            ? 'bg-white dark:bg-[#242526] text-primary-600 dark:text-[#2ECC71] shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-[#B0B3B8]'
                        }`}
                      >
                        Nhân vật
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarMode('custom')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                          avatarMode === 'custom'
                            ? 'bg-white dark:bg-[#242526] text-primary-600 dark:text-[#2ECC71] shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-[#B0B3B8]'
                        }`}
                      >
                        Ảnh của bạn
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarMode('initials')
                          const initialAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || user?.full_name || 'SV')}&backgroundColor=2ECC71,16a34a`
                          setAvatarPreview(initialAvatar)
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                          avatarMode === 'initials'
                            ? 'bg-white dark:bg-[#242526] text-primary-600 dark:text-[#2ECC71] shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-[#B0B3B8]'
                        }`}
                      >
                        Chữ cái đầu
                      </button>
                    </div>

                    {avatarMode === 'character' && (
                      <div className="grid grid-cols-5 gap-2.5 pt-1">
                        {PRESET_AVATARS.map((av) => (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setAvatarPreview(av.url)}
                            className={`p-1.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 bg-slate-50 dark:bg-[#303132] ${
                              avatarPreview === av.url
                                ? 'border-primary-600 dark:border-[#2ECC71] bg-primary-50/50 dark:bg-[#163D29]'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-[#3E4042]'
                            }`}
                          >
                            <img src={av.url} alt={av.name} className="w-10 h-10 rounded-full object-cover" />
                            <span className="text-[10px] text-slate-500 dark:text-[#B0B3B8] truncate w-full text-center">
                              {av.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {avatarMode === 'custom' && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-[#E4E6EB]">
                          Đường dẫn ảnh đại diện (URL)
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="avatar_url"
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={customAvatarInput}
                            onChange={(e) => {
                              setCustomAvatarInput(e.target.value)
                              if (e.target.value.startsWith('http')) {
                                setAvatarPreview(e.target.value)
                              }
                            }}
                            className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    )}

                    {avatarMode === 'initials' && (
                      <p className="text-xs text-slate-500 dark:text-[#B0B3B8]">
                        Hệ thống tự động tạo avatar chữ cái viết tắt theo tên <strong className="text-slate-700 dark:text-[#E4E6EB]">{fullName || user?.full_name}</strong>.
                      </p>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveAvatar(avatarPreview)}
                        disabled={updateProfileMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu ảnh đại diện'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: ẢNH BÌA */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Ảnh bìa</h2>
                    <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">Tỷ lệ khuyến nghị 3:1 (ví dụ 1200 x 400 px)</p>
                  </div>
                  <ImageIcon className="w-5 h-5 text-slate-400 dark:text-[#B0B3B8]" />
                </div>

                {/* Banner preview */}
                <div className="mt-4 relative rounded-xl overflow-hidden aspect-[3/1] bg-slate-100 dark:bg-[#303132] border border-slate-200 dark:border-[#3E4042]">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-[#B0B3B8] p-4 text-center">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-xs">Chưa cài đặt ảnh bìa cá nhân</span>
                    </div>
                  )}
                </div>

                {/* Banner presets */}
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-700 dark:text-[#E4E6EB]">Chọn mẫu có sẵn:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                    {PRESET_BANNERS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setBannerPreview(preset.url)
                          setCustomBannerInput(preset.url)
                        }}
                        className={`group relative rounded-lg overflow-hidden border-2 transition-all text-left ${
                          bannerPreview === preset.url
                            ? 'border-primary-600 dark:border-[#2ECC71] ring-2 ring-primary-500/20'
                            : 'border-transparent hover:border-slate-300 dark:hover:border-[#3E4042]'
                        }`}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-14 object-cover" />
                        <div className="p-1.5 bg-slate-50 dark:bg-[#303132]">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-[#E4E6EB] truncate">{preset.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom banner URL */}
                <div className="mt-4 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#E4E6EB]">Hoặc dán URL ảnh bìa tùy chọn:</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customBannerInput}
                    onChange={(e) => {
                      setCustomBannerInput(e.target.value)
                      if (e.target.value.startsWith('http')) {
                        setBannerPreview(e.target.value)
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => handleSaveBanner(bannerPreview)}
                    disabled={updateProfileMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu ảnh bìa'}
                  </button>
                </div>
              </div>

              {/* PHẦN 3: THÔNG TIN HỒ SƠ */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
                <div className="pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Thông tin hồ sơ</h2>
                  <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">
                    Thông tin hiển thị công khai trên hồ sơ sinh viên và thẻ bài viết
                  </p>
                </div>

                <form onSubmit={handleSaveProfileInfo} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-[#E4E6EB] mb-1.5">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-[#E4E6EB]">Tiểu sử ngắn</label>
                      <span className="text-[11px] text-slate-400 dark:text-[#B0B3B8]">{bio.length}/160</span>
                    </div>
                    <textarea
                      id="bio"
                      rows={3}
                      maxLength={160}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Giới thiệu chuyên môn học tập, mối quan tâm nghiên cứu..."
                      className="w-full text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#E4E6EB] mb-1.5">
                        Trường học / Viện đào tạo
                      </label>
                      <div className="relative">
                        <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          id="university"
                          type="text"
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder="ĐH Công nghệ Thông tin..."
                          className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-[#E4E6EB] mb-1.5">
                        Chuyên ngành đào tạo
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          id="major"
                          type="text"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          placeholder="Kỹ thuật Phần mềm..."
                          className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      {updateProfileMutation.isPending ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>

              {/* PHẦN 4: NGÔN NGỮ VÀ GIAO DIỆN */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
                <div className="pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Ngôn ngữ và giao diện</h2>
                  <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">Tùy chỉnh chế độ hiển thị sáng/tối và ngôn ngữ hệ thống</p>
                </div>

                <div className="mt-5 space-y-5">
                  {/* Theme Switcher */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-[#E4E6EB]">Chế độ giao diện</h4>
                      <p className="text-xs text-slate-500 dark:text-[#B0B3B8]">Chuyển đổi giữa giao diện Sáng và Tối (Facebook Dark Mode)</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#303132] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          if (isDark) toggleTheme()
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          !isDark
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 dark:text-[#B0B3B8] hover:text-slate-900 dark:hover:text-[#E4E6EB]'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        Sáng
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isDark) toggleTheme()
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isDark
                            ? 'bg-[#242526] text-[#2ECC71] shadow-xs'
                            : 'text-slate-500 dark:text-[#B0B3B8] hover:text-slate-900 dark:hover:text-[#E4E6EB]'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-[#2ECC71]" />
                        Tối
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-[#3E4042] pt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-[#E4E6EB]">Ngôn ngữ hiển thị</h4>
                      <p className="text-xs text-slate-500 dark:text-[#B0B3B8]">Ngôn ngữ mặc định cho toàn bộ ứng dụng</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#303132] rounded-xl text-xs font-semibold text-slate-700 dark:text-[#E4E6EB]">
                      <Globe className="w-3.5 h-3.5 text-primary-600 dark:text-[#2ECC71]" />
                      Tiếng Việt (Mặc định)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MẬT KHẨU & BẢO MẬT */}
          {activeTab === 'security' && (
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
              <div className="pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Đổi mật khẩu tài khoản</h2>
                <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">
                  Hãy dùng mật khẩu mạnh kết hợp chữ, số và ký tự đặc biệt để bảo vệ tài khoản.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E4E6EB] mb-1.5">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="current_password"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E4E6EB] mb-1.5">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="new_password"
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#E4E6EB] mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="confirm_password"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: BÀI ĐĂNG & HOẠT ĐỘNG */}
          {activeTab === 'posts' && (
            <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Bài đăng & hoạt động</h2>
                  <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">
                    Xem danh sách các bài đã đăng, mở xem chi tiết hoặc xóa bài viết.
                  </p>
                </div>
                <Link
                  to="/create"
                  className="px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Đăng bài mới
                </Link>
              </div>

              <div className="mt-6">
                {isPostsLoading ? (
                  <div className="py-12 text-center text-slate-400 dark:text-[#B0B3B8] text-sm">Đang tải danh sách bài đăng...</div>
                ) : !myPostsData || myPostsData.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileEdit className="w-10 h-10 text-slate-300 dark:text-[#B0B3B8]/40 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-[#B0B3B8] font-medium text-sm">Bạn chưa có bài đăng nào.</p>
                    <Link to="/create" className="text-xs text-primary-600 dark:text-[#2ECC71] hover:underline font-semibold mt-1 inline-block">
                      Tạo bài viết đầu tiên ngay
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-[#3E4042]">
                    {myPostsData.map((p) => (
                      <div key={p.id} className="py-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/posts/${p.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-[#E4E6EB] hover:text-primary-600 dark:hover:text-[#2ECC71] line-clamp-1 transition-colors"
                          >
                            {p.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 dark:text-[#B0B3B8]">
                            <span>{new Date(p.created_at).toLocaleDateString('vi-VN')}</span>
                            <span>•</span>
                            <span>{p.likes_count || 0} thích</span>
                            <span>•</span>
                            <span>{p.comments_count || 0} bình luận</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            to={`/posts/${p.id}`}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-[#B0B3B8] dark:hover:text-[#E4E6EB] hover:bg-slate-100 dark:hover:bg-[#303132] transition-colors"
                            title="Xem bài"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
                                deletePostMutation.mutate(p.id)
                              }
                            }}
                            className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Xóa bài"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TRỢ GIÚP & PHẢN HỒI */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              {/* FAQ Accordion */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
                <div className="pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Câu hỏi thường gặp (FAQ)</h2>
                  <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">
                    Những thắc mắc phổ biến của sinh viên khi sử dụng mạng học tập Mini Study Network
                  </p>
                </div>

                <div className="mt-4 divide-y divide-slate-100 dark:divide-[#3E4042]">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isExpanded = expandedFaq === idx
                    return (
                      <div key={idx} className="py-3.5">
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                          className="w-full flex items-center justify-between gap-3 text-left font-semibold text-sm text-slate-800 dark:text-[#E4E6EB] hover:text-primary-600 dark:hover:text-[#2ECC71] transition-colors"
                        >
                          <span>{item.q}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 text-xs text-slate-600 dark:text-[#B0B3B8] leading-relaxed bg-slate-50 dark:bg-[#303132] p-3 rounded-xl">
                            {item.a}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Feedback Form */}
              <div className="bg-white dark:bg-[#242526] rounded-2xl border border-slate-200 dark:border-[#3E4042] p-6 shadow-sm">
                <div className="pb-4 border-b border-slate-100 dark:border-[#3E4042]">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-[#E4E6EB]">Góp ý & Báo lỗi</h2>
                  <p className="text-xs text-slate-500 dark:text-[#B0B3B8] mt-0.5">
                    Gửi phản hồi trực tiếp để ban quản trị tiếp tục hoàn thiện trải nghiệm học tập
                  </p>
                </div>

                <form onSubmit={handleSendFeedback} className="mt-4 space-y-4">
                  <textarea
                    rows={4}
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Mô tả sự cố hoặc ý tưởng cải tiến của bạn..."
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3E4042] bg-white dark:bg-[#303132] text-slate-900 dark:text-[#E4E6EB] focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Gửi góp ý
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
