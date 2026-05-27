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
        // brand/marca reasignadas al acento TERRACOTA (tema clay)
        brand: {
          50:  '#f3e2d9',
          100: '#eccab9',
          500: '#b8492f',
          600: '#b8492f',
          700: '#8a3922',
          900: '#1a1815',
        },
        marca: {
          50:  '#f3e2d9',
          100: '#f3e2d9',
          600: '#b8492f',
          700: '#8a3922',
          900: '#1a1815',
        },
        // Acento oro
        acento: {
          600: '#a07a2c',
          100: '#f1e7cf',
        },
        oro: { 400: '#bf9a47', 500: '#a07a2c', 600: '#876523' },
        // Neutros CÁLIDOS de papel (remapean slate-* de toda la app)
        slate: {
          50:  '#f6f4ed',
          100: '#efece1',
          200: '#e1ddcf',
          300: '#d4cfbf',
          400: '#b3aea3',
          500: '#7b756b',
          600: '#544f48',
          700: '#3a3631',
          800: '#26231f',
          900: '#1a1815',
        },
        pergamino: '#f6f4ed',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,15,13,0.04), 0 10px 26px -14px rgba(14,15,13,0.20)',
        cardHover: '0 2px 4px rgba(14,15,13,0.06), 0 18px 38px -16px rgba(14,15,13,0.30)',
      },
    },
  },
  plugins: [],
}

