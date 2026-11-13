import api from '@/lib/axios'

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout:   (refreshToken) => api.post('/auth/logout', { refreshToken }),
  me:       () => api.get('/auth/me'),
}

export const postAPI = {
  getAll:   (params) => api.get('/posts', { params }),
  getPosts: (params) => api.get('/posts', { params }),
  getById:  (id)     => api.get(`/posts/${id}`),
  getTrendingTopics: () => api.get('/posts/trending-topics'),
  getMyStats: () => api.get('/posts/my-stats'),
  getMyPosts: (params) => api.get('/posts/my', { params }),
  create:   (data)   => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post('/posts', data, { headers: { 'Content-Type': undefined } })
    }
    return api.post('/posts', data)
  },
  uploadImages: (postId, formData) => api.post(`/posts/${postId}/images`, formData, {
    headers: { 'Content-Type': undefined }
  }),
  update:   (id, data) => api.put(`/posts/${id}`, data),
  delete:   (id)     => api.delete(`/posts/${id}`),
  deletePost: (id)   => api.delete(`/posts/${id}`),
  report:   (id, data) => api.post(`/posts/${id}/report`, data),
}

export const commentAPI = {
  getByPost:  (post_id) => api.get('/comments', { params: { post_id } }),
  create:     (data)    => api.post('/comments', data),
  delete:     (id)      => api.delete(`/comments/${id}`),
}

export const likeAPI = {
  toggle: (target_type, target_id) => api.post('/likes', { target_type, target_id }),
  count:  (target_type, target_id) => api.get('/likes/count', { params: { target_type, target_id } }),
}

export const orderAPI = {
  create:   (post_id) => api.post('/orders', { post_id }),
  myOrders: ()        => api.get('/orders/my'),
}

export const userAPI = {
  getProfile:      (id)   => api.get(`/users/${id}`),
  getMyProfile:    (id)   => api.get(`/users/${id}`),
  updateProfile:   (data) => api.put('/users/profile', data),
  changePassword:  (data) => api.put('/users/change-password', data),
  uploadAvatar:    (formData) => api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': undefined },
  }),
}

// Authenticated PDF upload (multipart browser boundary) and binary download.
export const documentAPI = {
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': undefined },
    timeout: 90000,
  }),
  download: (postId) => api.get('/documents/' + encodeURIComponent(postId) + '/download', {
    responseType: 'blob',
    timeout: 90000,
  }),
}

// EXT-01: Bookmarks API
export const bookmarkAPI = {
  save:   (postId) => api.post(`/posts/${postId}/bookmark`),
  remove: (postId) => api.delete(`/posts/${postId}/bookmark`),
  getAll: (params) => api.get('/posts/bookmarks', { params }),
}

// EXT-04: In-app Notifications API
export const notificationAPI = {
  getAll:         (params) => api.get('/users/me/notifications', { params }),
  getUnreadCount: ()       => api.get('/users/me/notifications/unread-count'),
  markAsRead:     (id)     => api.patch(`/users/me/notifications/${id}/read`),
  markAllAsRead:  ()       => api.patch('/users/me/notifications/read-all'),
}

// EXT-02: Follow System API
export const followAPI = {
  follow:         (userId)         => api.post(`/users/${userId}/follow`),
  unfollow:       (userId)         => api.delete(`/users/${userId}/follow`),
  getFollowers:   (userId, params) => api.get(`/users/${userId}/followers`, { params }),
  getFollowing:   (userId, params) => api.get(`/users/${userId}/following`, { params }),
  getFollowStats: (userId)         => api.get(`/users/${userId}/follow-stats`),
}

// EXT-03: Admin Moderation & Audit Logs API
export const adminAPI = {
  getOverview:  () => api.get('/posts/admin/overview'),
  getAnalytics: () => api.get('/posts/admin/analytics'),
  getManagePosts: (params) => api.get('/posts/admin/manage', { params }),
  getAuditLogs: (params) => api.get('/posts/moderation/audit-logs', { params }),
  moderatePost: (postId, status, reason) => api.patch(`/posts/${postId}/moderation`, reason === undefined ? { status } : { status, reason }),
  getPosts: (params) => api.get('/posts/moderation/posts', { params }),
  getPostDetail: (id) => api.get(`/posts/moderation/posts/${id}`),
  getAccounts: (params) => api.get('/admin/users', { params }),
  setAccountStatus: (id, is_active, reason) =>
    api.patch(`/admin/users/${id}/status`, { is_active, reason }),
  getAccountAuditLogs: (params) => api.get('/admin/users/audit-logs', { params }),
  getReports: (params) => api.get('/admin/reports', { params }),
  handleReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
}


