/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/app/(shop)/**/*.{js,jsx}', './src/app/api/**/*.js', './src/components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#f26a1b', 50: '#fff4ec', 100: '#ffe6d3', 200: '#ffc9a1', 500: '#f26a1b', 600: '#dd560a', 700: '#b84308' },
        ink: { DEFAULT: '#12162b', 800: '#1c2140', 700: '#2b3158', 500: '#5b6285', 400: '#8890ad', 200: '#dfe3ef', 100: '#eef0f7', 50: '#f6f7fb' }
      },
      fontFamily: { sans: ['var(--font-vazir)', 'Vazirmatn', 'Tahoma', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(18,22,43,.06), 0 8px 24px -12px rgba(18,22,43,.18)', pop: '0 20px 50px -20px rgba(18,22,43,.35)' },
      keyframes: { up: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } } },
      animation: { up: 'up .35s ease both' }
    }
  },
  plugins: []
};
