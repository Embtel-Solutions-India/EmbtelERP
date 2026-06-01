/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
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
        brand: {
          DEFAULT: '#6366f1',
          light: '#818cf8',
          dark: '#4f46e5',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-success': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-info': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0c0c1d 0%, #111827 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        card: '0 4px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.12)',
        'brand': '0 4px 24px rgba(99, 102, 241, 0.35)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
