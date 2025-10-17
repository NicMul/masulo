module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}'
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
        'primary': '#6363ac',
        'primary-foreground': '#fff',
        'destructive': '#ef4444',
        'destructive-foreground': '#fff',
        'accent': '#f4f4f5',
      },
      animation: {
        loading: 'rotate 1s linear infinite',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
      keyframes: {
        'caret-blink': {
          '0%,70%,100%': { opacity: 1 },
          '20%,50%': { opacity: 0 },
        },
      },
    },
    fontFamily: {
      sans: ['Source Sans Pro', 'sans-serif'],
    },
  },
  plugins: [
		require('tailwindcss-animate'),
    function({ addUtilities }) {
      addUtilities({
        '.color-scheme-dark': {
          'color-scheme': 'dark',
        },
        '.color-scheme-light': {
          'color-scheme': 'light',
        },
      })
    },
	],
  darkMode: 'class'
}
