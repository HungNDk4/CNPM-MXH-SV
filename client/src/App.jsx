import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'

// Pages
import HomePage from '@/pages/HomePage'
import SearchPage from '@/pages/search/SearchPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import PostDetailPage from '@/pages/posts/PostDetailPage'
import DocumentDetailPage from '@/pages/documents/DocumentDetailPage'
import CreatePostPage from '@/pages/posts/CreatePostPage'
import MyPostsPage from '@/pages/posts/MyPostsPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'
import AdminPostsPage from '@/pages/admin/AdminPostsPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'
import AdminAuditPage from '@/pages/admin/AdminAuditPage'
import AdminContentPage from '@/pages/admin/AdminContentPage'
import PaymentResult from '@/pages/payment/PaymentResultPage'
import NotFoundPage from '@/pages/NotFoundPage'
import MascotGalleryPage from '@/pages/MascotGalleryPage'

// Route bảo vệ (cần đăng nhập)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />
}

// Route bảo vệ Admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main app routes */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/mascot-gallery" element={<MascotGalleryPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/payment/result" element={<PaymentResult />} />

        {/* Protected */}
        <Route path="/posts/create" element={
          <ProtectedRoute><CreatePostPage /></ProtectedRoute>
        } />
        <Route path="/my-posts" element={
          <ProtectedRoute><MyPostsPage /></ProtectedRoute>
        } />
        <Route path="/posts/manage" element={
          <Navigate to="/my-posts" replace />
        } />
        <Route path="/bookmarks" element={
          <ProtectedRoute><BookmarksPage /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />
        <Route path="/help" element={
          <Navigate to="/settings?tab=help" replace />
        } />
        <Route path="/admin" element={
          <AdminRoute><AdminOverviewPage /></AdminRoute>
        } />
        <Route path="/admin/overview" element={
          <AdminRoute><AdminOverviewPage /></AdminRoute>
        } />
        <Route path="/admin/posts" element={
          <AdminRoute><AdminPostsPage /></AdminRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminRoute><AdminAnalyticsPage /></AdminRoute>
        } />
        <Route path="/admin/content" element={
          <AdminRoute><AdminContentPage /></AdminRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <AdminRoute><AdminAuditPage /></AdminRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
