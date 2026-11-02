/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Campus Grove: Vibrant Leaf Academic Green & Neutral True Black
        primary: {
          DEFAULT: '#16a34a', // Bright vibrant primary green
          hover:   '#15803d', // Hover green
          50:  '#f0fdf4',
          100: '#dcfce7',     // Selected nav light tint
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',     // Dark mode hover accent
          500: '#22c55e',     // Bright leaf green
          600: '#16a34a',     // Primary green
          700: '#15803d',     // Primary hover green
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        surface: {
          DEFAULT: 'var(--bg-app)',
          card:    'var(--bg-card)',
          border:  'var(--border-subtle)',
          muted:   'var(--bg-muted)',
          elevated:'var(--bg-elevated)',
          nav:     'var(--nav-selected)',
        },
        content: {
          DEFAULT: 'var(--text-main)',
          muted:   'var(--text-muted)',
        },
        // Facebook Dark Mode Palette mapping
        neutral: {
          50:   '#fafafa',
          100:  '#f5f5f5',
          200:  '#e5e5e5',
          300:  '#d4d4d4',
          400:  '#B0B3B8', // Secondary text dark
          500:  '#B0B3B8',
          600:  '#65676B',
          700:  '#3E4042', // Border dark
          800:  '#3E4042',
          850:  '#303132', // Elevated surface dark / input
          900:  '#303132',
          950:  '#242526', // Card surface dark
          1000: '#18191A', // App background dark
        },
        // Semantic post type tags
        grove: {
          amber: {
            DEFAULT: '#d97706',
            light: '#fffbeb',
            dark: '#78350f',
          },
          emerald: {
            DEFAULT: '#16a34a',
            light: '#dcfce7',
            dark: '#14532d',
          },
          sage: {
            DEFAULT: '#22c55e',
            light: '#dcfce7',
            dark: '#14532d',
          },
        },
        // Grovelyn semantic palette
        grovelyn: {
          mist:        '#f2f5ef',
          ink:         '#06110a',
          'ink-2':     '#12201a',
          'ink-line':  '#213328',
          paper:       '#ffffff',
          line:        '#e2e7de',
          moss:        '#56614f',
          fog:         '#a8b5a6',
          leaf:        '#5bd13a',
          'leaf-deep': '#1d6b1d',
          sap:         '#dcf6cf',
          pin:         '#e2f5ec',
          'pin-ink':   '#0f7a55',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"Be Vietnam Pro"', 'sans-serif'],
      },
      borderRadius: {
        'card':  '16px',
        'btn':   '10px',
        'bento': '20px',
      },
      boxShadow: {
        '2xs':         '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs':          '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'subtle':      '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card':        '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'bento':       '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        'bento-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in':       'fadeIn 0.25s ease-in-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceSubtle: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
      },
    },
  },
  plugins: [],
}
