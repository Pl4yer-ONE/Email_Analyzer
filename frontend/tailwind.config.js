/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4338ca',
        },
        dark: {
          DEFAULT: '#0f172a',
          bg: '#020617',
          surface: '#1e293b',
        },
        gradient: {
          start: '#8b5cf6',
          end: '#3b82f6',
        },
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
      },
      dropShadow: {
        'green-glow': '0 0 8px rgba(74,222,128,0.5)',
      },
      animation: {
        ping: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      strokeWidth: {
        '1.5': '1.5px',
      }
    },
  },
  plugins: [],
}