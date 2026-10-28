import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userAPI, followAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
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
  X,
  BookOpen,
  Sparkles,
  Share2,
  Code2,
  Flame,
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

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'edit' | 'security'
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
      setActiveTab('overview')
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
      setActiveTab('overview')
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
          <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl w-full" />
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
      {/* ── Profile Header Card (Grovelyn Image 2 & 5 Style with Cover) ── */}
      <section className="card overflow-hidden p-0 border border-surface-border shadow-bento" aria-label="Thông tin tổng quan hồ sơ">
        {/* Cover Banner */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-indigo-900 via-primary-700 to-emerald-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Thành viên từ {formatDate(profile.created_at)}</span>
          </div>
        </div>

        {/* Profile Info Row with Overlapping Avatar */}
        <div className="px-6 sm:px-8 pb-6 pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full avatar-gradient-ring p-1 shrink-0 shadow-xl">
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 self-center sm:self-end pt-2">
              {isOwner && activeTab !== 'edit' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className="btn-secondary text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              )}

              {isOwner && activeTab !== 'security' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="btn-secondary text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Đổi mật khẩu</span>
                </button>
              )}

              {!isOwner && currentUser && (
                <button
                  type="button"
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={`text-xs sm:text-sm py-2.5 px-5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 ${
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
                <GraduationCap className="w-4 h-4 text-primary-500" />
                <span>{profile.university ? `${profile.university}` : ''} {profile.major ? `· ${profile.major}` : ''}</span>
              </p>
            )}

            {profile.bio && (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pt-2 max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Follow Stats Counters */}
          <div className="flex items-center justify-center sm:justify-start gap-6 pt-3 border-t border-surface-border text-sm">
            <button
              type="button"
              onClick={() => currentUser && setFollowModalType('followers')}
              disabled={!currentUser}
              className="hover:text-primary-600 transition-colors cursor-pointer disabled:cursor-default"
              title={currentUser ? 'Xem danh sách người theo dõi' : 'Đăng nhập để xem'}
            >
              <strong className="text-slate-900 dark:text-white font-black text-base mr-1">
                {followStats?.followers ?? 0}
              </strong>
              <span className="text-slate-500 text-xs font-semibold">Người theo dõi</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button
              type="button"
              onClick={() => currentUser && setFollowModalType('following')}
              disabled={!currentUser}
              className="hover:text-primary-600 transition-colors cursor-pointer disabled:cursor-default"
              title={currentUser ? 'Xem danh sách đang theo dõi' : 'Đăng nhập để xem'}
            >
              <strong className="text-slate-900 dark:text-white font-black text-base mr-1">
                {followStats?.following ?? 0}
              </strong>
              <span className="text-slate-500 text-xs font-semibold">Đang theo dõi</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Content Grid (8 Cols Left + 4 Cols Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Tabs Navigation */}
          {isOwner && (
            <div className="flex gap-2 p-1.5 bg-surface-muted rounded-2xl border border-surface-border">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'overview'
                    ? 'bg-surface-card text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Hồ sơ tổng quan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'edit'
                    ? 'bg-surface-card text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Chỉnh sửa thông tin
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  activeTab === 'security'
                    ? 'bg-surface-card text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Đổi mật khẩu
              </button>
            </div>
          )}

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary-600" />
                  <span>Học vấn & Chuyên ngành</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-surface-border">
                    <span className="text-slate-400 block text-xs">Trường Đại học / Cao đẳng:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                      {profile.university || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-muted/60 border border-surface-border">
                    <span className="text-slate-400 block text-xs">Chuyên ngành học tập:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                      {profile.major || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-6 space-y-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500" />
                  <span>Tiểu sử cá nhân</span>
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'Chưa có tiểu sử giới thiệu. Bạn có thể bấm Chỉnh sửa để thêm mục tiêu học tập.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Edit Form */}
          {isOwner && activeTab === 'edit' && (
            <section className="card p-6 sm:p-7 space-y-5" aria-labelledby="edit-profile-title">
              <h2 id="edit-profile-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-surface-border">
                <Edit3 className="w-5 h-5 text-primary-600" />
                <span>Cập nhật thông tin cá nhân</span>
              </h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="full_name" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    maxLength={100}
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="input rounded-xl"
                    placeholder="Nhập họ và tên sinh viên"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="avatar_url" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Đường dẫn ảnh đại diện (HTTPS)
                  </label>
                  <input
                    id="avatar_url"
                    type="url"
                    maxLength={500}
                    value={editForm.avatar_url}
                    onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                    className="input rounded-xl"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-[11px] text-slate-400">
                    Để trống nếu muốn dùng avatar chữ cái mặc định.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="university" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Trường đại học / Cao đẳng
                    </label>
                    <input
                      id="university"
                      type="text"
                      maxLength={200}
                      value={editForm.university}
                      onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                      className="input rounded-xl"
                      placeholder="VD: ĐH Văn Hiến, ĐH Bách Khoa"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="major" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Chuyên ngành học
                    </label>
                    <input
                      id="major"
                      type="text"
                      maxLength={200}
                      value={editForm.major}
                      onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                      className="input rounded-xl"
                      placeholder="VD: Công nghệ phần mềm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="bio" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Tiểu sử cá nhân
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {editForm.bio.length}/1000 ký tự
                    </span>
                  </div>
                  <textarea
                    id="bio"
                    rows={4}
                    maxLength={1000}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="input rounded-xl resize-y"
                    placeholder="Chia sẻ đôi nét về bản thân, sở thích hoặc định hướng nghề nghiệp..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="btn-secondary text-xs sm:text-sm rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary text-xs sm:text-sm rounded-xl"
                  >
                    {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Tab 3: Security */}
          {isOwner && activeTab === 'security' && (
            <section className="card p-6 sm:p-7 space-y-5" aria-labelledby="change-password-title">
              <h2 id="change-password-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-surface-border">
                <Lock className="w-5 h-5 text-primary-600" />
                <span>Đổi mật khẩu tài khoản</span>
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="current_password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="current_password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="input rounded-xl"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new_password" className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new_password"
                    type="password"
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="input rounded-xl"
                    placeholder="••••••••"
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
                    maxLength={72}
                    autoComplete="new-password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="input rounded-xl"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="btn-secondary text-xs sm:text-sm rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="btn-primary text-xs sm:text-sm rounded-xl"
                  >
                    {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* ── Right Column: Skills & Interests Bento Widgets (Grovelyn Image 2) ── */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Kỹ năng & Công cụ */}
          <div className="card p-5 space-y-3.5 bg-gradient-to-b from-surface-card to-surface-muted/50">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Code2 className="w-4 h-4 text-primary-500" />
              <span>Kỹ năng & Môn học quan tâm</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Java', 'React', 'Tailwind', 'Python', 'CSDL', 'OOP', 'Spring Boot', 'Git', 'Vite'].map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-1 rounded-lg bg-surface-card border border-surface-border font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Mục tiêu học tập */}
          <div className="card p-5 space-y-3 bg-gradient-to-br from-amber-500/5 via-surface-card to-orange-500/5 border-amber-500/20">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Chăm chỉ học tập</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tích cực đóng góp tài liệu và giải đáp câu hỏi giúp hồ sơ của bạn nổi bật hơn trong cộng đồng Mini Study Network.
            </p>
          </div>
        </aside>
      </div>

      {/* ── Follow List Modal (EXT-02) ── */}
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
