
/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        'frigi-red': '#FF4D6A',
        'frigi-mint': '#6EE7B7',
        'frigi-orange': '#FF9F43',
        'frigi-bg': '#F8FAFC',
        'frigi-surface': '#FFFFFF',
        'frigi-text': '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'game': '16px',
        'game-lg': '24px',
        'game-xl': '32px',
      },
      boxShadow: {
        'game-soft': '0 8px 30px rgba(0, 0, 0, 0.04)',
        'game-inner': 'inset 0 2px 10px rgba(0, 0, 0, 0.05)',
        'game-floating': '0 12px 40px rgba(255, 77, 106, 0.15)',
      },
      animation: {
        'bounce-slight': 'bounce-slight 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        }
      }
    },
  },
  plugins: [],
}
