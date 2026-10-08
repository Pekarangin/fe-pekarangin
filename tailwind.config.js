/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        pekarang: {
          50: '#F2F9F3',
          100: '#E2F3E5',
          200: '#C5E7CB',
          300: '#98D3A3',
          400: '#64B875',
          500: '#3D9B50',
          600: '#1C7430',
          700: '#175E27',
          800: '#166534',
          900: '#113E1B',
          dark: '#0B2611',
          accent: '#EA580C',
          lightBg: '#F8FAF8',
          cardBg: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};