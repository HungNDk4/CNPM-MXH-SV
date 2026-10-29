/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Campus Grove: Forest Green & Sage — primary identity
        primary: {
          DEFAULT: '#16a34a', // Forest Green
          hover:   '#15803d',
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Sage: secondary green tone for muted accents
        sage: {
          50:  '#f6f7f4',
          100: '#eaede5',
          200: '#d3dacb',
          300: '#b2c0a4',
          400: '#8ea07e',
          500: '#6d8260',
          600: '#546748',
          700: '#43533a',
          800: '#374430',
          900: '#2f3928',
        },
        // Accent colors for post types
        grove: {
          amber: {
            DEFAULT: '#d97706', // questions
            light: '#fffbeb',
            dark: '#78350f',
          },
          emerald: {
            DEFAULT: '#059669', // documents/PDF
            light: '#ecfdf5',
            dark: '#064e3b',
          },
          sage: {
            DEFAULT: '#4d7c5b', // discussion
            light: '#f0fdf4',
            dark: '#14532d',
          },
          teal: {
            DEFAULT: '#0d9488',
            light: '#f0fdfa',
            dark: '#134e4a',
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
        'card':  '16px',
        'btn':   '10px',
        'bento': '20px',
      },
      boxShadow: {
        '2xs':          '0 1px 2px 0 rgba(0,0,0,0.03)',
        'xs':           '0 1px 2px 0 rgba(0,0,0,0.05)',
        'subtle':       '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.02)',
        'bento':        '0 2px 8px -2px rgba(0,0,0,0.05), 0 8px 20px -4px rgba(0,0,0,0.04)',
        'bento-hover':  '0 12px 30px -8px rgba(0,0,0,0.09), 0 4px 12px -2px rgba(0,0,0,0.04)',
        'glow-green':   '0 0 24px -4px rgba(22,163,74,0.30)',
        'glow-emerald': '0 0 24px -4px rgba(5,150,105,0.25)',
        'glow-amber':   '0 0 24px -4px rgba(217,119,6,0.25)',
        'glow-sage':    '0 0 20px -4px rgba(77,124,91,0.20)',
      },
      animation: {
        'fade-in':       'fadeIn 0.25s ease-in-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-subtle': 'bounceSubtle 0.3s ease-in-out',
        'leaf-sway':     'leafSway 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:     { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceSubtle:{ '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
        leafSway:    { '0%,100%': { transform: 'rotate(-6deg)' }, '50%': { transform: 'rotate(6deg)' } },
      },
    },
  },
  plugins: [],
}
