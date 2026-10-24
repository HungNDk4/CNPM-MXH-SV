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
  getById:  (id)     => api.get(`/posts/${id}`),
  create:   (data)   => api.post('/posts', data),
  update:   (id, data) => api.put(`/posts/${id}`, data),
  delete:   (id)     => api.delete(`/posts/${id}`),
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
  updateProfile:   (data) => api.put('/users/profile', data),
  changePassword:  (data) => api.put('/users/change-password', data),
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
