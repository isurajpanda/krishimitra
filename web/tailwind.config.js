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
        "primary":                    "var(--color-primary)",
        "primary-container":          "var(--color-primary-container)",
        "on-primary":                 "var(--color-on-primary)",
        "background":                 "var(--color-background)",
        "surface":                    "var(--color-surface)",
        "surface-container":          "var(--color-surface-container)",
        "surface-container-high":     "var(--color-surface-container-high)",
        "surface-container-highest":  "var(--color-surface-container-highest)",
        "surface-bright":             "var(--color-surface-bright)",
        "on-surface":                 "var(--color-on-surface)",
        "on-surface-variant":         "var(--color-on-surface-variant)",
        "outline":                    "var(--color-outline)",
        "outline-variant":            "var(--color-outline-variant)",
        "error":                      "var(--color-error)",
        "secondary":                  "var(--color-secondary)",
        "tertiary":                   "var(--color-tertiary)",
        "surface-container-low":      "var(--color-surface-container)",
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body":     ["Be Vietnam Pro", "sans-serif"],
        "label":    ["Space Grotesk", "sans-serif"],
        "brand":    ["Rajdhani", "sans-serif"],
        "hindi":    ["Hind", "sans-serif"]
      },
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1.75rem",
        "3xl": "1.5rem"
      },
    },
  },
  plugins: [],
}
