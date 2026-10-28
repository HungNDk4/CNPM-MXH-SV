import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userAPI, followAPI, postAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import PostCard from '@/components/PostCard'
import { PostCardSkeleton } from '@/components/common/Skeleton'
import EmptyState from '@/components/common/EmptyState'
import {
  Users,
  User,
  GraduationCap,
  Calendar,
  Edit3,
  Lock,
  FileText,
  Check,
  Plus,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Share2,
  Code2,
  Flame,
  MessageSquare,
  HelpCircle,
  FileUp,
  MapPin,
  ExternalLink,
  Laptop,
} from 'lucide-react'
import Modal from '@/components/common/Modal'

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
}

function FollowUsersModal({ type, userId, onClose }) {
  const [page, setPage] = useState(1)
  const isFollowers = type === 'followers'
  const title = isFollowers ? 'Người theo dõi' : 'Đang theo dõi'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['follow-list', type, userId, page],
    queryFn: async () => {
      const fn = isFollowers ? followAPI.getFollowers : followAPI.getFollowing
      return (await fn(userId, { page, limit: 10 })).data
    },
    enabled: Boolean(userId),
  })

  const users = data?.data || []
  const pagination = data?.pagination

  return (
    <Modal
      isOpen={Boolean(type)}
      onClose={onClose}
      title={title}
      icon={isFollowers ? Users : User}
    >
      <div className="space-y-4">
        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {isLoading ? (
            <p className="text-center text-slate-500 py-6 text-sm">Đang tải danh sách...</p>
          ) : isError ? (
            <p className="text-center text-rose-500 py-6 text-sm">Không thể tải danh sách.</p>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">Chưa có ai trong danh sách.</p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-muted transition-colors group"
              >
                <div className="w-10 h-10 rounded-full avatar-gradient-ring p-[1.5px] shrink-0">
                  <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-xs font-bold text-primary-600">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      u.full_name?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary-600 text-sm truncate">
                    {u.full_name}
                  </p>
                  {u.university && (
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary-500" />
                      <span>{u.university}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-slate-500">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            >
              Trước
            </button>
            <span>
              Trang {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function ProfilePage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const validId = /^[1-9]\d*$/.test(id || '')
  const isOwner = Number(currentUser?.id) === Number(id)

  const [activeTab, setActiveTab] = useState('posts') // 'posts' | 'documents' | 'about' | 'edit' | 'security'
  const [followModalType, setFollowModalType] = useState(null) // 'followers' | 'following' | null

  // Query profile
  const { data: profile, isLoading, isError, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => (await userAPI.getProfile(id)).data.data,
    enabled: validId,
    retry: false,
  })

  // EXT-02: Query follow stats
  const { data: followStats } = useQuery({
    queryKey: ['follow-stats', id],
    queryFn: async () => (await followAPI.getFollowStats(id)).data.data,
    enabled: validId && Boolean(currentUser),
  })

  // Query User's Posts from API
  const { data: userPostsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['profile-posts', id],
    queryFn: async () => (await postAPI.getAll({ user_id: id, limit: 30 })).data,
    enabled: validId,
  })

  const userPosts = userPostsData?.data || []
  const userDocuments = userPosts.filter((p) => p.post_type === 'document')

  // ── Dynamic Logic Derived for Profile Widgets (Grovelyn & Kilogram style) ──
  // 1. Công cụ & Kỹ năng: lấy từ tags của các bài viết thực tế của user, fallback theo major
  const derivedSkills = useMemo(() => {
    const rawTags = userPosts.flatMap((p) => {
      if (Array.isArray(p.tags)) return p.tags
      if (typeof p.tags === 'string') {
        try {
          const parsed = JSON.parse(p.tags)
          if (Array.isArray(parsed)) return parsed
        } catch {
          return p.tags.split(',').map((s) => s.trim())
        }
      }
      return []
    }).filter(Boolean)

    const uniqueTags = Array.from(new Set(rawTags))
    if (uniqueTags.length > 0) return uniqueTags.slice(0, 10)

    const m = (profile?.major || '').toLowerCase()
    if (m.includes('máy tính') || m.includes('phần mềm') || m.includes('thông tin')) {
      return ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'Linux']
    }
    if (m.includes('kinh tế') || m.includes('quản trị') || m.includes('marketing')) {
      return ['Excel', 'PowerPoint', 'Data Analysis', 'Marketing', 'Teamwork', 'Git']
    }
    return ['Office', 'Git', 'Thuyết trình', 'Làm việc nhóm', 'Nghiên cứu tài liệu']
  }, [userPosts, profile?.major])

  // 2. Mình có thể góp ý về: lấy từ các môn học (subject) mà user đã từng đăng bài
  const derivedAdviceTopics = useMemo(() => {
    const subjects = Array.from(new Set(userPosts.map((p) => p.subject).filter(Boolean)))
    if (subjects.length >= 2) {
      return [
        { title: subjects[0], desc: `Kinh nghiệm làm bài tập và tài liệu ôn thi môn ${subjects[0]}.` },
        { title: subjects[1], desc: `Tài liệu tóm tắt và giải đáp câu hỏi chuyên sâu về ${subjects[1]}.` },
      ]
    }
    if (subjects.length === 1) {
      return [
        { title: subjects[0], desc: `Kinh nghiệm làm bài tập và tài liệu môn ${subjects[0]}.` },
        { title: 'Kỹ năng học tập & Đồ án', desc: `Chia sẻ phương pháp tự học và hoàn thành đồ án môn học ${profile?.major || ''}.` },
      ]
    }
    return [
      { title: profile?.major ? `Chuyên ngành ${profile.major}` : 'Kỹ năng học tập đại học', desc: 'Trao đổi phương pháp học tập, giải bài tập và làm việc nhóm.' },
      { title: 'Tài liệu & Đồ án môn học', desc: 'Đóng góp slide bài giảng, đề cương và tài liệu ôn tập hữu ích.' },
    ]
  }, [userPosts, profile?.major])

  // 3. Chăm chỉ học tập: Thống kê định lượng thực tế từ backend
  const learningStats = useMemo(() => {
    const totalLikes = userPosts.reduce((acc, p) => acc + (Number(p.likes_count) || 0), 0)
    return {
      totalPosts: userPosts.length,
      totalDocuments: userDocuments.length,
      totalLikes,
    }
  }, [userPosts, userDocuments])

  // EXT-02: Mutation Follow / Unfollow
  const followMutation = useMutation({
    mutationFn: async () => {
      if (followStats?.is_following) {
        return (await followAPI.unfollow(id)).data
      } else {
        return (await followAPI.follow(id)).data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-stats', id] })
      toast.success(followStats?.is_following ? 'Đã bỏ theo dõi.' : 'Đã theo dõi người dùng!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Thao tác không thành công.')
    },
  })

  // State for Edit Profile form
  const [editForm, setEditForm] = useState({
    full_name: '',
    avatar_url: '',
    university: '',
    major: '',
    bio: '',
  })

  // Sync profile into editForm when loaded
  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || '',
        university: profile.university || '',
        major: profile.major || '',
        bio: profile.bio || '',
      })
    }
  }, [profile])

  // Mutation: Update Profile
  const updateProfileMutation = useMutation({
    mutationFn: (data) => userAPI.updateProfile(data),
    onSuccess: (response) => {
      const updated = response.data.data
      queryClient.setQueryData(['profile', id], updated)
      if (isOwner) {
        updateUser(updated)
      }
      toast.success('Cập nhật hồ sơ thành công!')
      setActiveTab('about')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật hồ sơ.')
    },
  })

  // State for Change Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  // Mutation: Change Password
  const changePasswordMutation = useMutation({
    mutationFn: (data) => userAPI.changePassword(data),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      setActiveTab('about')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể đổi mật khẩu.')
    },
  })

  // Handle Edit Submit
  const handleEditSubmit = (e) => {
    e.preventDefault()
    const trimmedName = editForm.full_name.trim()
    if (!trimmedName) {
      toast.error('Họ tên không được để trống.')
      return
    }

    const payload = {
      full_name: trimmedName,
      bio: editForm.bio.trim() || null,
      university: editForm.university.trim() || null,
      major: editForm.major.trim() || null,
      avatar_url: editForm.avatar_url.trim() || null,
    }

    if (payload.avatar_url) {
      try {
        const parsed = new URL(payload.avatar_url)
        if (parsed.protocol !== 'https:') {
          toast.error('Ảnh đại diện phải là liên kết HTTPS hợp lệ (https://...).')
          return
        }
      } catch {
        toast.error('Đường dẫn ảnh đại diện không hợp lệ.')
        return
      }
    }

    updateProfileMutation.mutate(payload)
  }

  // Handle Password Submit
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (!passwordForm.current_password) {
      toast.error('Vui lòng nhập mật khẩu hiện tại.')
      return
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (passwordForm.new_password === passwordForm.current_password) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Mật khẩu xác nhận không khớp.')
      return
    }

    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    })
  }

  // Invalid ID check
  if (!validId) {
    return (
      <section className="card text-center py-16 space-y-4 max-w-lg mx-auto" role="alert">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Đường dẫn hồ sơ không hợp lệ</h1>
        <p className="text-slate-500 text-sm">ID người dùng phải là số nguyên dương.</p>
        <Link to="/" className="btn-secondary inline-block">Về trang chủ</Link>
      </section>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse" role="status">
        <div className="card p-6 space-y-4">
          <div className="h-36 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
          <div className="flex items-center gap-4 px-4">
            <div className="w-24 h-24 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-surface-card -mt-12" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error 404 / 500
  if (isError) {
    return (
      <section className="card text-center py-16 space-y-4 max-w-lg mx-auto" role="alert">
        <User className="w-10 h-10 text-slate-400 mx-auto" />
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {error?.response?.status === 404
            ? 'Người dùng không tồn tại hoặc đã bị khóa.'
            : 'Không thể tải thông tin hồ sơ.'}
        </h1>
        <Link to="/" className="btn-secondary inline-block">Về trang chủ</Link>
      </section>
    )
  }

  const initialLetter = profile.full_name?.[0]?.toUpperCase() || 'U'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Profile Header Card (Inspired by Grovelyn Image 5 & X Image 3) ── */}
      <section className="card overflow-hidden p-0 border border-surface-border shadow-bento bg-surface-card" aria-label="Thông tin tổng quan hồ sơ">
        {/* Campus Cover Banner with Organic Gradients */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Thành viên từ {formatDate(profile.created_at)}</span>
          </div>
        </div>

        {/* Profile Info Row with Overlapping Avatar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar with Status Ring */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full avatar-gradient-ring p-1 shrink-0 shadow-xl bg-surface-card">
                <div className="w-full h-full rounded-full bg-surface-card flex items-center justify-center overflow-hidden text-4xl font-black text-primary-600 border-4 border-surface-card">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <span>{initialLetter}</span>
                  )}
                </div>
              </div>

              {/* Status Badge (Inspired by Image 5) */}
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-surface-card flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Đang học
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 self-center sm:self-end pt-2 flex-wrap">
              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`btn-secondary text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-2 ${
                      activeTab === 'edit' ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 font-bold border-primary-300' : ''
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Chỉnh sửa thông tin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('security')}
                    className={`btn-secondary text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-2 ${
                      activeTab === 'security' ? 'bg-primary-50 dark:bg-primary-950 text-primary-600 font-bold border-primary-300' : ''
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Đổi mật khẩu</span>
                  </button>
                </>
              )}

              {!isOwner && currentUser && (
                <button
                  type="button"
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`text-xs sm:text-sm py-2.5 px-6 rounded-full font-bold transition-all shadow-sm flex items-center gap-2 ${
                    followStats?.is_following
                      ? 'btn-secondary text-slate-700 dark:text-slate-200'
                      : 'btn-primary shadow-glow-indigo'
                  }`}
                >
                  {followMutation.isPending ? (
                    'Đang xử lý...'
                  ) : followStats?.is_following ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Theo dõi</span>
                    </>
                  )}
                </button>
              )}

              {!isOwner && !currentUser && (
                <Link to="/login" className="btn-secondary text-xs sm:text-sm py-2 px-4 rounded-xl">
                  Đăng nhập để theo dõi
                </Link>
              )}
            </div>
          </div>

          {/* User Names & Bio */}
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white break-words tracking-tight">
                {profile.full_name}
              </h1>
              <span className="badge-type">Sinh viên</span>
            </div>

            {(profile.university || profile.major) && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary-500 shrink-0" />
                <span>{profile.university ? `${profile.university}` : ''} {profile.major ? `· ${profile.major}` : ''}</span>
              </p>
            )}

            {profile.bio && (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pt-1 max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Follow Stats Counters (Inspired by Grovelyn Image 5) */}
          <div className="flex items-center justify-center sm:justify-start gap-6 pt-3 border-t border-surface-border text-sm flex-wrap">
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                {userPosts.length}
              </strong>
              <span>bài đăng</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                {userDocuments.length}
              </strong>
              <span>tài liệu</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => currentUser && setFollowModalType('followers')}
              disabled={!currentUser}
              className="hover:text-primary-600 transition-colors cursor-pointer disabled:cursor-default inline-flex items-center gap-1 text-xs"
              title={currentUser ? 'Xem danh sách người theo dõi' : 'Đăng nhập để xem'}
            >
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                {followStats?.followers ?? 0}
              </strong>
              <span className="text-slate-500 font-semibold">Người theo dõi</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => currentUser && setFollowModalType('following')}
              disabled={!currentUser}
              className="hover:text-primary-600 transition-colors cursor-pointer disabled:cursor-default inline-flex items-center gap-1 text-xs"
              title={currentUser ? 'Xem danh sách đang theo dõi' : 'Đăng nhập để xem'}
            >
              <strong className="text-slate-900 dark:text-white font-black text-sm">
                {followStats?.following ?? 0}
              </strong>
              <span className="text-slate-500 font-semibold">Đang theo dõi</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid (8 Cols Left Feed/Tabs + 4 Cols Right Widgets) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tabs & Dynamic Content */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tabs Bar (Matching Grovelyn Image 5 & X Image 3) */}
          <div className="flex gap-2 p-1.5 bg-surface-card rounded-2xl border border-surface-border shadow-2xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Bài đăng ({userPosts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`py-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tài liệu PDF ({userDocuments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`py-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-surface-muted'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Giới thiệu & Học vấn</span>
            </button>
          </div>

          {/* TAB 1: User Posts Feed */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {isLoadingPosts ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : userPosts.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Chưa có bài viết nào"
                  description={
                    isOwner
                      ? 'Bạn chưa đăng bài viết nào. Hãy chia sẻ câu hỏi hoặc kiến thức bổ ích đầu tiên nhé!'
                      : 'Thành viên này chưa đăng bài viết nào trên cộng đồng.'
                  }
                  actionText={isOwner ? 'Đăng bài viết mới' : 'Khám phá bảng tin'}
                  actionHref={isOwner ? '/posts/create' : '/'}
                />
              ) : (
                userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}

          {/* TAB 2: User Documents Feed */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {isLoadingPosts ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              ) : userDocuments.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Chưa có tài liệu PDF nào"
                  description={
                    isOwner
                      ? 'Bạn chưa chia sẻ tài liệu nào. Tải lên slide, đề cương hoặc giáo trình ôn thi ngay nào!'
                      : 'Thành viên này chưa chia sẻ tài liệu PDF nào.'
                  }
                  actionText={isOwner ? 'Chia sẻ tài liệu PDF' : 'Khám phá bảng tin'}
                  actionHref={isOwner ? '/posts/create?type=document' : '/'}
                />
              ) : (
                userDocuments.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}

          {/* TAB 3: About & Education */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-surface-border pb-3">
                  <GraduationCap className="w-5 h-5 text-primary-600" />
                  <span>Thông tin Học vấn & Chuyên ngành</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl bg-surface-muted/60 border border-surface-border space-y-1">
                    <span className="text-slate-400 block text-xs">Trường Đại học / Cao đẳng</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                      {profile.university || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-muted/60 border border-surface-border space-y-1">
                    <span className="text-slate-400 block text-xs">Chuyên ngành học tập</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                      {profile.major || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-surface-border pb-3">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <span>Tiểu sử cá nhân</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'Người dùng chưa viết phần giới thiệu bản thân.'}
                </p>
              </div>

              {isOwner && (
                <div className="card p-6 space-y-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-surface-border pb-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Số dư ví học tập</span>
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Số dư hiện tại dùng để giao dịch tài liệu:</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                        {Number(profile.wallet_balance || 0).toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Edit Profile Form (Preserving Playwright selectors!) */}
          {activeTab === 'edit' && isOwner && (
            <div className="card p-6 space-y-5">
              <div className="border-b border-surface-border pb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary-600" />
                  <span>Chỉnh sửa thông tin cá nhân</span>
                </h3>
                <p className="text-xs text-slate-500">Cập nhật hồ sơ hiển thị công khai trên mạng xã hội</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="full_name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="input text-sm py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="university" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Trường Đại học
                    </label>
                    <input
                      id="university"
                      type="text"
                      value={editForm.university}
                      onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                      placeholder="ĐH Bách Khoa TP.HCM"
                      className="input text-sm py-2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="major" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Ngành học
                    </label>
                    <input
                      id="major"
                      type="text"
                      value={editForm.major}
                      onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                      placeholder="Khoa học Máy tính"
                      className="input text-sm py-2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="bio" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Tiểu sử
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Giới thiệu về bản thân, sở thích nghiên cứu..."
                    className="input text-sm py-2 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="avatar_url" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Link ảnh đại diện (HTTPS)
                  </label>
                  <input
                    id="avatar_url"
                    type="url"
                    value={editForm.avatar_url}
                    onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="input text-sm py-2"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    className="btn-secondary text-xs py-2 px-4 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary text-xs py-2 px-6 rounded-xl font-bold shadow-md shadow-primary/25"
                  >
                    {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: Change Password Form (Preserving Playwright selectors!) */}
          {activeTab === 'security' && isOwner && (
            <div className="card p-6 space-y-5">
              <div className="border-b border-surface-border pb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary-600" />
                  <span>Đổi mật khẩu tài khoản</span>
                </h3>
                <p className="text-xs text-slate-500">Bảo vệ tài khoản với mật khẩu tối thiểu 6 ký tự</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="current_password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="current_password"
                    type="password"
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="••••••••"
                    className="input text-sm py-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new_password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="••••••••"
                    className="input text-sm py-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm_password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    className="input text-sm py-2"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('about')}
                    className="btn-secondary text-xs py-2 px-4 rounded-xl"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="btn-primary text-xs py-2 px-6 rounded-xl font-bold shadow-md shadow-primary/25"
                  >
                    {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Widgets (Derived from Real Backend Data) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Widget 1: Đang làm gì */}
          <div className="card p-5 space-y-3 bg-surface-card border border-surface-border shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Đang làm gì</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {profile.bio || `Sinh viên ${profile.major || 'chuyên ngành'} tại ${profile.university || 'trường đại học'}. Tích cực tham gia trao đổi bài học, tải lên tài liệu và chia sẻ kinh nghiệm học tập.`}
            </p>
          </div>

          {/* Widget 2: Mình có thể góp ý về (Derived from subjects & major) */}
          <div className="card p-5 space-y-3 bg-surface-card border border-surface-border shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Mình có thể góp ý về</span>
            </h4>
            <div className="space-y-2 text-xs">
              {derivedAdviceTopics.map((topic, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border ${
                    idx === 0
                      ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-200/60 dark:border-primary-800/60 text-primary-700 dark:text-primary-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <p className="font-bold">{topic.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{topic.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Công cụ và kỹ năng (Derived from post tags & major) */}
          <div className="card p-5 space-y-3 bg-surface-card border border-surface-border shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Công cụ & Kỹ năng</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {derivedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-muted border border-surface-border text-slate-700 dark:text-slate-300 hover:border-primary-300 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Widget 4: Chăm chỉ học tập (Real metrics from user posts & likes) */}
          <div className="card p-5 space-y-3 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-surface-card border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>Chăm chỉ học tập</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-surface-card/80 p-2 rounded-xl border border-surface-border">
                <span className="block text-base font-black text-slate-900 dark:text-white">{learningStats.totalPosts}</span>
                <span className="text-[10px] text-slate-500 font-medium">Bài viết</span>
              </div>
              <div className="bg-surface-card/80 p-2 rounded-xl border border-surface-border">
                <span className="block text-base font-black text-slate-900 dark:text-white">{learningStats.totalDocuments}</span>
                <span className="text-[10px] text-slate-500 font-medium">Tài liệu PDF</span>
              </div>
              <div className="bg-surface-card/80 p-2 rounded-xl border border-surface-border">
                <span className="block text-base font-black text-rose-500">{learningStats.totalLikes}</span>
                <span className="text-[10px] text-slate-500 font-medium">Lượt thích</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
              Thống kê hoạt động học tập thực tế và tương tác từ cộng đồng sinh viên.
            </p>
          </div>
        </div>
      </div>

      {/* Followers / Following Modal */}
      {followModalType && (
        <FollowUsersModal
          type={followModalType}
          userId={id}
          onClose={() => setFollowModalType(null)}
        />
      )}
    </div>
  )
}
