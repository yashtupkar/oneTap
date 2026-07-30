/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
    './sidepanel/**/*.{js,jsx,ts,tsx,html}',
    './popup/**/*.{js,jsx,ts,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
    surface: {
  DEFAULT: '#09090b',   // zinc-950 - App background
  card: '#18181b',      // zinc-900 - Cards, sidebar
  elevated: '#27272a',  // zinc-800 - Hovered cards, modals
  border: '#3f3f46',    // zinc-700 - Borders/dividers
},
        status: {
          filled: '#10b981',
          suggested: '#f59e0b',
          missing: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        glow: 'none',
        card: 'none',
        overlay: '0 8px 32px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      },
    },
  },
  plugins: [],
};
