/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Sistema editorial: cuerpo Geist, display Instrument Serif, mono JetBrains
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // brand/marca reasignadas al acento VERDE BOSQUE del rediseño
        brand: {
          50:  '#e7eee9',
          100: '#d4e0d8',
          500: '#1e4d3b',
          600: '#1e4d3b',
          700: '#173b2d',
          900: '#0e0f0d',
        },
        marca: {
          50:  '#e7eee9',
          100: '#e7eee9',
          600: '#1e4d3b',
          700: '#173b2d',
          900: '#0e0f0d',
        },
        // Acento oro
        acento: {
          600: '#a07a2c',
          100: '#f1e7cf',
        },
        oro: { 400: '#bf9a47', 500: '#a07a2c', 600: '#876523' },
        // Neutros CÁLIDOS de papel (remapean slate-* de toda la app)
        slate: {
          50:  '#f6f4ee',
          100: '#efece4',
          200: '#e6e3d8',
          300: '#d8d6cc',
          400: '#b0b3a9',
          500: '#7a7e75',
          600: '#54574f',
          700: '#2a2c27',
          800: '#1a1c18',
          900: '#0e0f0d',
        },
        pergamino: '#fafaf8',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,15,13,0.04), 0 10px 26px -14px rgba(14,15,13,0.20)',
        cardHover: '0 2px 4px rgba(14,15,13,0.06), 0 18px 38px -16px rgba(14,15,13,0.30)',
      },
    },
  },
  plugins: [],
}

