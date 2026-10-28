/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // Modern Academic Vibrant Blue (Pure Xanh Dương)
          hover:   '#1d4ed8',
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        pop: {
          emerald: {
            DEFAULT: '#10b981',
            light: '#ecfdf5',
            dark: '#064e3b',
          },
          amber: {
            DEFAULT: '#f59e0b',
            light: '#fffbeb',
            dark: '#78350f',
          },
          purple: {
            DEFAULT: '#8b5cf6',
            light: '#f5f3ff',
            dark: '#4c1d95',
          },
          rose: {
            DEFAULT: '#f43f5e',
            light: '#fff1f2',
            dark: '#881337',
          },
          cyan: {
            DEFAULT: '#06b6d4',
            light: '#ecfeff',
            dark: '#164e63',
          },
        },
        surface: {
          DEFAULT: 'var(--bg-app)',
          card:    'var(--bg-card)',
          border:  'var(--border-subtle)',
          muted:   'var(--bg-muted)',
          elevated:'var(--bg-elevated)',
        },
        content: {
          DEFAULT: 'var(--text-main)',
          muted:   'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn':  '10px',
        'bento': '20px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'bento': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 8px 20px -4px rgba(0, 0, 0, 0.04)',
        'bento-hover': '0 12px 30px -8px rgba(0, 0, 0, 0.09), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'glow-indigo': '0 0 24px -4px rgba(37, 99, 235, 0.25)',
        'glow-blue': '0 0 24px -4px rgba(37, 99, 235, 0.25)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.25)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceSubtle: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
      },
    },
  },
  plugins: [],
}
