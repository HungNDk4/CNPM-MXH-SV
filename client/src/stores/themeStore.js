import { create } from 'zustand'

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* ignore */
  }
  return 'light'
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  isDark: getInitialTheme() === 'dark',
  initTheme: () => {
    const current = get().theme
    if (current === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ isDark: current === 'dark' })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* ignore */
    }
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ theme: next, isDark: next === 'dark' })
  },
  setTheme: (theme) => {
    if (theme !== 'dark' && theme !== 'light') return
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ignore */
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ theme, isDark: theme === 'dark' })
  },
}))
