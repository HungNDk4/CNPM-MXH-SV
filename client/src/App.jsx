import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'

// Pages
import HomePage      from '@/pages/HomePage'
import LoginPage     from '@/pages/auth/LoginPage'
import RegisterPage  from '@/pages/auth/RegisterPage'
import PostDetailPage from '@/pages/posts/PostDetailPage'
import DocumentDetailPage from '@/pages/documents/DocumentDetailPage'
import CreatePostPage from '@/pages/posts/CreatePostPage'
import ProfilePage   from '@/pages/profile/ProfilePage'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import AdminAuditPage from '@/pages/admin/AdminAuditPage'
import PaymentResult from '@/pages/payment/PaymentResultPage'
import NotFoundPage  from '@/pages/NotFoundPage'

// Route bảo vệ (cần đăng nhập)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
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
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main app routes */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/payment/result" element={<PaymentResult />} />

        {/* Protected */}
        <Route path="/posts/create" element={
          <ProtectedRoute><CreatePostPage /></ProtectedRoute>
        } />
        <Route path="/bookmarks" element={
          <ProtectedRoute><BookmarksPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <Navigate to="/admin/audit-logs" replace />
        } />
        <Route path="/admin/audit-logs" element={
          <AdminRoute><AdminAuditPage /></AdminRoute>
        } />
      </Route>


      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
