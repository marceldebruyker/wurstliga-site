/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,tsx,ts,jsx,js}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter Variable", "ui-sans-serif", "system-ui"] },
      colors: { brand: { DEFAULT: '#0ea5e9' } }
    }
  },
  plugins: []
};