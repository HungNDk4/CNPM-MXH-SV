import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { useThemeStore } from '@/stores/themeStore'

// Initialize theme on app boot
useThemeStore.getState().initTheme()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 phút
      retry: (failureCount, error) => {
        // Deterministic client errors (HTTP 4xx) should never be retried
        const status = error?.response?.status
        if (status && status >= 400 && status < 500) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
