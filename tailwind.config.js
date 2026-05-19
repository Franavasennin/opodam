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
        marca: {
          900: '#1e3a8a',
          700: '#1d4ed8',
          600: '#2563eb',
          100: '#dbeafe',
          50:  '#eff6ff',
        },
        acento: {
          600: '#ea580c',
          100: '#ffedd5',
        },
      },
    },
  },
  plugins: [],
}

