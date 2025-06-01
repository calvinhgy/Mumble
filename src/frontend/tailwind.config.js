/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        neutral: '#2F2E41',
        background: '#F9F9F9',
        accent: '#00DAC6',
      },
      fontFamily: {
        sans: ['SF Pro Text', 'sans-serif'],
        display: ['SF Pro Display', 'sans-serif'],
      },
      animation: {
        'pulse-recording': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
