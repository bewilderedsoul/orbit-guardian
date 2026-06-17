/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0c12',
          900: '#0e1118',
          850: '#13161f',
          800: '#181c27',
          700: '#222736',
          600: '#2e3447',
          400: '#5c647d',
          300: '#8b93ab',
          200: '#b6bccf',
          100: '#e3e6ef',
        },
        ember: {
          400: '#ff8a4c',
          500: '#fc6d26',
          600: '#e24329',
        },
        violet: {
          glow: '#a989f5',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
        glow: '0 0 40px -8px rgba(252,109,38,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
