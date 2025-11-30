/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
            500: '#F43F5E',
            600: '#E11D48',
        },
        emerald: {
            400: '#34D399',
            500: '#10B981',
        }
      }
    },
  },
  plugins: [],
}