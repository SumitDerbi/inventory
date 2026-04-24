/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Brand tokens (ui_spec.md)
        primary: {
          DEFAULT: '#2563EB', // blue-600
          dark: '#1D4ED8', // blue-700
          light: '#EFF6FF', // blue-50
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#334155', // slate-700
          foreground: '#FFFFFF',
        },
        surface: '#FFFFFF',
        bg: '#F8FAFC', // slate-50
        border: '#E2E8F0', // slate-200
        // Status tones
        success: '#059669', // emerald-600
        warning: '#F59E0B', // amber-500
        danger: '#DC2626', // red-600
        info: '#0284C7', // sky-600
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '0.875rem',
        '2xl': '1rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-once': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'pulse-once': 'pulse-once 0.3s ease-out 1',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
