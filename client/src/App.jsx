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
import PaymentResult from '@/pages/payment/PaymentResultPage'
import NotFoundPage  from '@/pages/NotFoundPage'

// Route bảo vệ (cần đăng nhập)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
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
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
