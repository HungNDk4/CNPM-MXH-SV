import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { userAPI, followAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'


const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
            <span>{isFollowers ? '👥' : '👤'}</span> {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-card"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <p className="text-center text-slate-400 py-6 text-sm">Đang tải danh sách...</p>
          ) : isError ? (
            <p className="text-center text-red-400 py-6 text-sm">Không thể tải danh sách.</p>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">Chưa có ai trong danh sách.</p>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-card transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-semibold shrink-0 overflow-hidden shadow">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    u.full_name?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-200 group-hover:text-primary-300 text-sm truncate">{u.full_name}</p>
                  {u.university && <p className="text-xs text-slate-400 truncate">🎓 {u.university}</p>}
                </div>
              </Link>
            ))
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-surface-border text-xs text-slate-400">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Trước
            </button>
            <span>Trang {page} / {pagination.totalPages}</span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
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
        <span className="text-4xl" aria-hidden="true">⚠️</span>
        <h1 className="text-xl font-bold text-slate-100">Đường dẫn hồ sơ không hợp lệ</h1>
        <p className="text-slate-400 text-sm">ID người dùng phải là số nguyên dương.</p>
        <Link to="/" className="btn-secondary inline-block">Về trang chủ</Link>
      </section>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse" role="status">
        <div className="card space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-700" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-700 rounded w-1/4" />
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
        <span className="text-4xl" aria-hidden="true">👤</span>
        <h1 className="text-xl font-bold text-slate-100">
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header Card ── */}
      <section className="card relative overflow-hidden" aria-label="Thông tin tổng quan hồ sơ">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-primary-900/40 via-accent-900/30 to-primary-900/20 pointer-events-none" />
        
        <div className="relative pt-6 sm:pt-8 flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full ring-4 ring-surface-card bg-gradient-brand flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-2xl shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <span>{initialLetter}</span>
            )}
          </div>

          {/* User Meta */}
          <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 break-words">
                {profile.full_name}
              </h1>
              <span className="badge-type">Sinh viên</span>
            </div>
            <p className="text-xs text-slate-400">
              🗓️ Thành viên từ: {formatDate(profile.created_at)}
            </p>
            {/* EXT-02: Follow stats counters */}
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs sm:text-sm text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => currentUser && setFollowModalType('followers')}
                disabled={!currentUser}
                className="hover:text-primary-300 transition-colors cursor-pointer disabled:cursor-default"
                title={currentUser ? 'Xem danh sách người theo dõi' : 'Đăng nhập để xem'}
              >
                <strong className="text-slate-100 font-semibold">{followStats?.followers ?? 0}</strong> Người theo dõi
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => currentUser && setFollowModalType('following')}
                disabled={!currentUser}
                className="hover:text-primary-300 transition-colors cursor-pointer disabled:cursor-default"
                title={currentUser ? 'Xem danh sách đang theo dõi' : 'Đăng nhập để xem'}
              >
                <strong className="text-slate-100 font-semibold">{followStats?.following ?? 0}</strong> Đang theo dõi
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwner && activeTab !== 'edit' && (
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <span>✏️</span> Chỉnh sửa
              </button>
            )}

            {!isOwner && currentUser && (
              <button
                type="button"
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`text-sm py-2 px-4 rounded-xl font-medium transition-all shadow-sm flex items-center gap-1.5 ${
                  followStats?.is_following
                    ? 'bg-surface border border-surface-border text-slate-300 hover:text-red-300 hover:border-red-400/50'
                    : 'bg-primary-600 text-white hover:bg-primary-500'
                }`}
              >
                {followMutation.isPending ? (
                  'Đang xử lý...'
                ) : followStats?.is_following ? (
                  <><span>✓</span> Đang theo dõi</>
                ) : (
                  <><span>+</span> Theo dõi</>
                )}
              </button>
            )}

            {!isOwner && !currentUser && (
              <Link to="/login" className="btn-secondary text-sm">
                Đăng nhập để theo dõi
              </Link>
            )}
          </div>
        </div>

        {/* Bio preview in header */}
        {profile.bio && (
          <p className="mt-5 pt-4 border-t border-surface-border text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}
      </section>

      {/* ── Tabs (Owner only) ── */}
      {isOwner && (
        <nav aria-label="Các mục hồ sơ" className="flex border-b border-surface-border gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📋 Chi tiết hồ sơ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ Chỉnh sửa thông tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔒 Đổi mật khẩu
          </button>
        </nav>
      )}

      {/* ── Tab Content: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Học vấn */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>🎓</span> Học vấn & Chuyên môn
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Trường học:</span>
                <span className="text-slate-200 font-medium">
                  {profile.university || <span className="text-slate-500 italic">Chưa cập nhật</span>}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Chuyên ngành:</span>
                <span className="text-slate-200 font-medium">
                  {profile.major || <span className="text-slate-500 italic">Chưa cập nhật</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Giới thiệu */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>📝</span> Tiểu sử cá nhân
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {profile.bio || <span className="text-slate-500 italic">Chưa có tiểu sử giới thiệu.</span>}
            </p>
          </div>
        </div>
      )}

      {/* ── Tab Content: Edit Profile ── */}
      {isOwner && activeTab === 'edit' && (
        <section className="card max-w-2xl mx-auto space-y-6" aria-labelledby="edit-profile-title">
          <h2 id="edit-profile-title" className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>✏️</span> Cập nhật thông tin cá nhân
          </h2>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Họ tên */}
            <div className="space-y-1.5">
              <label htmlFor="full_name" className="text-sm font-medium text-slate-300 block">
                Họ và tên <span className="text-red-400">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                maxLength={100}
                required
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="input"
                placeholder="Nhập họ và tên sinh viên"
              />
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5">
              <label htmlFor="avatar_url" className="text-sm font-medium text-slate-300 block">
                Đường dẫn ảnh đại diện (HTTPS)
              </label>
              <input
                id="avatar_url"
                type="url"
                maxLength={500}
                value={editForm.avatar_url}
                onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                className="input"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-slate-500">
                Để trống nếu muốn dùng avatar chữ cái đầu mặc định.
              </p>
            </div>

            {/* Trường & Ngành */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="university" className="text-sm font-medium text-slate-300 block">
                  Trường đại học / Cao đẳng
                </label>
                <input
                  id="university"
                  type="text"
                  maxLength={200}
                  value={editForm.university}
                  onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                  className="input"
                  placeholder="VD: ĐH Bách Khoa"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="major" className="text-sm font-medium text-slate-300 block">
                  Chuyên ngành học
                </label>
                <input
                  id="major"
                  type="text"
                  maxLength={200}
                  value={editForm.major}
                  onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                  className="input"
                  placeholder="VD: Công nghệ phần mềm"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="bio" className="text-sm font-medium text-slate-300 block">
                  Tiểu sử cá nhân
                </label>
                <span className="text-xs text-slate-500">
                  {editForm.bio.length}/1000 ký tự
                </span>
              </div>
              <textarea
                id="bio"
                rows={4}
                maxLength={1000}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="input resize-y"
                placeholder="Chia sẻ đôi nét về mục tiêu học tập, sở thích..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="btn-secondary text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="btn-primary text-sm"
              >
                {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Tab Content: Security / Change Password ── */}
      {isOwner && activeTab === 'security' && (
        <section className="card max-w-lg mx-auto space-y-6" aria-labelledby="change-password-title">
          <h2 id="change-password-title" className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>🔒</span> Đổi mật khẩu tài khoản
          </h2>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* Mật khẩu hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor="current_password" className="text-sm font-medium text-slate-300 block">
                Mật khẩu hiện tại <span className="text-red-400">*</span>
              </label>
              <input
                id="current_password"
                type="password"
                required
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="new_password" className="text-sm font-medium text-slate-300 block">
                Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-red-400">*</span>
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
                className="input"
                placeholder="••••••••"
              />
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="confirm_password" className="text-sm font-medium text-slate-300 block">
                Xác nhận mật khẩu mới <span className="text-red-400">*</span>
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
                className="input"
                placeholder="••••••••"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="btn-secondary text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn-primary text-sm"
              >
                {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </section>
      )}

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
