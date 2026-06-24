/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          teal: '#a8edea',
          pink: '#fed6e3',
          gold: '#ffd700',
        },
        dark: {
          900: '#0d1117',
          800: '#161b22',
          700: '#1a1a2e',
          600: '#222733',
        }
      },
    },
  },
  plugins: [],
}
