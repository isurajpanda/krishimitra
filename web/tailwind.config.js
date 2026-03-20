/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#00FF41",
        "primary-container": "#003d10",
        "on-primary": "#000000",
        "background": "#020402",
        "surface": "#050805",
        "surface-container": "#0a0e0a",
        "on-surface": "#e0e2e0",
        "on-surface-variant": "#a2a5a2",
        "outline": "#2f322f",
        "outline-variant": "#2f322f",
        "error": "#FF3B30",
        "secondary": "#FFB800",
        "tertiary": "#80FFB4",
        "surface-container-high": "#0a0e0a",
        "surface-container-highest": "#0f140f",
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Be Vietnam Pro", "sans-serif"],
        "label": ["Space Grotesk", "sans-serif"],
        "brand": ["Rajdhani", "sans-serif"],
        "hindi": ["Hind", "sans-serif"]
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1.75rem",
        "3xl": "1.5rem"
      },
    },
  },
  plugins: [],
}
