/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAF8F5',
          100: '#F7F4EE',
          200: '#EFEAE1',
          300: '#E2DBD0',
          400: '#C8BEAF',
          800: '#423E37',
          900: '#23211D',
        },
        burnt: {
          DEFAULT: '#D97B3F',
          hover: '#C26A30',
          light: '#F8ECE5',
          dark: '#9E4C19',
        },
        ink: {
          DEFAULT: '#1E232A',
          muted: '#5A626E',
          subtle: '#8C94A0',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        none: 'none',
      }
    },
  },
  plugins: [],
}
