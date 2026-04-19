/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dbe4ff',
          500: '#4361ee',
          600: '#3451d1',
          700: '#2a40b8',
          900: '#1a2980',
        },
      },
    },
  },
  plugins: [],
}

