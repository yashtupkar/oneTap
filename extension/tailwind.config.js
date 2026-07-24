/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,jsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8098f9',
          500: '#6172f3',
          600: '#4e52e8',
          700: '#3f3fcb',
          800: '#3636a5',
          900: '#303082',
        },
        surface: {
          DEFAULT: '#0f1117',
          card: '#1a1d27',
          elevated: '#22263a',
          border: '#2e3248',
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
        glow: '0 0 20px rgba(97, 114, 243, 0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
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
