import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Zustand store quản lý trạng thái xác thực.
 * Persist vào localStorage để giữ đăng nhập sau khi refresh.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) => set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
      }),

      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData },
      })),

      logout: () => set({
        user:            null,
        accessToken:     null,
        refreshToken:    null,
        isAuthenticated: false,
      }),

      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'msn-auth',
      partialize: (state) => ({
        user:            state.user,
        accessToken:     state.accessToken,
        refreshToken:    state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
