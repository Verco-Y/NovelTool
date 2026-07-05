/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#f8f5ef',
          card: '#fffef9',
          muted: '#f0ede5',
          border: '#ddd8cc',
        },
        ink: {
          DEFAULT: '#2c2418',
          secondary: '#5c5346',
          subtle: '#8a8070',
        },
        'divine-gold': {
          400: '#d4a853',
          500: '#b8860b',
          600: '#9a6f0a',
          700: '#7d5a08',
        },
        cinnabar: {
          500: '#c44b4b',
          600: '#b03434',
          700: '#8e2323',
        },
        // 古风扩展色
        qingdai: {
          DEFAULT: '#3a6b6e',
          light: '#5a9a9e',
        },
        shuimo: {
          light: '#c8c0b0',
          DEFAULT: '#7a7262',
          dark: '#4a4238',
        },
      },
      fontFamily: {
        xiuxian: ['"Noto Serif SC"', '"ZCOOL XiaoWei"', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 4px 0 rgba(60, 45, 20, 0.06), 0 1px 2px -1px rgba(60, 45, 20, 0.04)',
        'card-hover': '0 6px 16px 0 rgba(60, 45, 20, 0.08), 0 2px 6px -2px rgba(60, 45, 20, 0.05)',
        'nav-glass': '0 0 40px rgba(60, 45, 20, 0.04)',
        'scroll-glow': 'inset 0 0 20px rgba(184, 134, 11, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      backdropBlur: {
        'nav': '20px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scroll-unfold': {
          '0%': { opacity: '0', transform: 'scaleY(0.95)' },
          '100%': { opacity: '1', transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'scroll-unfold': 'scroll-unfold 0.3s ease-out',
      },
    },
  },
  plugins: [],
};