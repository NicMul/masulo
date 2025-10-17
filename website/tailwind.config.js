/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'md2': '822px',
      'lg': '1024px',
      'lg2': '1204px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          300: '#8F8FF7',
          400: '#6A6AB8',
          500: '#6363ac',
          600: '#545491',
          700: '#3E3E6B',
        }
      },
      animation: {
        loading: 'rotate 1s linear infinite',
      }
    },
  },
  plugins: [],
}
