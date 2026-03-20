# Design System Strategy: The Bioluminescent Harvest

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Digital Sanctuary."** We are moving away from the "utility tool" aesthetic of traditional agritech and toward a premium, editorial experience that treats agricultural data like high-end jewelry. 

This system rejects the "flat and dry" nature of standard Material Design. Instead, it embraces **Organic Futurism**: a world where ancient Indian temple geometry meets hyper-modern bioluminescence. We break the template look by using "Bento Grid" layouts—asymmetrical, containerized clusters of information that feel like a curated dashboard rather than a scrolling list. By overlapping glass layers and using "edible," high-saturation accents against deep, textured backgrounds, we create an interface that feels alive, urgent, and prestigious.

---

## 2. Colors: Fantasy-World Freedom
Our palette is a celebration of "edible" vibrancy. We use high-chroma accents to represent life and growth against a "Soil-Deep" foundation.

### Palette Strategy
- **Primary (`#6BFE9C`):** "Bioluminescent Sprout." Use for critical growth data and primary actions.
- **Secondary (`#FF7072`):** "Pomegranate Pulse." Reserved for urgent warnings or high-energy soil metrics.
- **Tertiary (`#E69DFF`):** "Temple Amethyst." Used for AI-driven insights and forecasting.
- **Background (`#0A0E14`):** Not flat black, but a deep, ink-blue void that allows colors to "glow."

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid, high-contrast borders for sectioning. Boundaries must be defined through background shifts.
- To separate a section, place a `surface-container-low` (`#0F141A`) card on the `surface` (`#0A0E14`) background.
- Use the **Spacing Scale** (e.g., `8` or `10`) to create "breathing gutters" between Bento cells rather than drawing lines.

### Signature Textures & Glass
Main CTAs should never be flat. Use a linear gradient from `primary` (`#6BFE9C`) to `primary-container` (`#1FC46A`) at a 135-degree angle to provide a "wet," nectar-like sheen. For floating modules, apply `backdrop-filter: blur(30px)` with a fill of `rgba(255, 255, 255, 0.08)` to mimic high-end lens glass.

---

## 3. Typography: The Editorial Voice
Our type system bridges the gap between traditional Indian scripts and technical precision.

- **Display & Headlines (`Plus Jakarta Sans`):** Our "Hero" voice. It is sophisticated and wide, giving the app a premium, airy feel. Use `display-lg` for weather numbers or crop yields to make them feel like monumental achievements.
- **Titles & Body (`Be Vietnam Pro`):** Replaced Noto/Hind with Be Vietnam Pro for its higher x-height and modern geometric clarity. It ensures legibility in low-light field conditions.
- **Data Labels (`Space Grotesk`):** A clean, monospaced-leaning sans used for live sensor data (moisture %, pH levels). This conveys technical authority.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to mimic "elevation" in the traditional sense; we use **Tonal Stacking** to mimic physical layers of glass and earth.

- **The Layering Principle:** 
    - **Base:** `surface` (`#0A0E14`)
    - **Sectioning:** `surface-container-low` (`#0F141A`)
    - **Interactive Cards:** `surface-container-high` (`#1B2028`)
- **The "Ghost Border":** For Bento cells, use a `1px` stroke of `outline-variant` (`#44484F`) at **20% opacity**. This creates a "specular highlight" on the edge of the glass rather than a structural wall.
- **Ambient Glows:** Floating action buttons must use a shadow tinted with the `primary` color (e.g., `box-shadow: 0 12px 24px rgba(107, 254, 156, 0.2)`). This makes the button appear to be emitting light onto the surface below.

---

## 5. Components: The Interactive Flora

### Buttons
- **Primary (The "Pulse"):** Full-pill shape (`9999px`). Background is a gradient of `primary` to `primary-fixed-dim`. Text is `on-primary` (`#005F2F`).
- **Secondary (The "Glass"):** Semi-transparent fill with a `1px` luminous top-edge highlight. Use for secondary filters.

### Bento Cards
- **Structure:** Use `xl` (1.5rem) corner radius for main containers. 
- **Rule:** Forbid divider lines within cards. Use `spacing-4` (1.4rem) to separate a header from its content. Use `surface-bright` (`#262C36`) for a subtle "inner card" if nesting is required.

### Live Data Inputs
- **Text Fields:** Use `surface-container-highest` (`#20262F`) for the field body. No bottom line. Instead, use a `2px` focus ring in `primary` that "blooms" (fades in) when active.

### Agricultural Special Components
- **The "Growth Gauge":** A semi-circular progress bar using `primary` (`#6BFE9C`) with a `backdrop-blur` background.
- **Monsoon Alerts:** Floating "Glassmorphic" toasts that sit at the top of the screen, using `error-container` (`#B92902`) at 40% opacity with a heavy `30px` blur.

---

## 6. Do's and Don'ts

### Do
- **DO** use the `28px` (Extra-Large) corner radius for major Bento categories to create a friendly, organic feel.
- **DO** use "Electric" color accents for data—e.g., use `tertiary` (`#E69DFF`) for AI soil predictions.
- **DO** lean into asymmetry. A large weather Bento cell next to two small sensor cells creates visual interest.

### Don't
- **DON'T** use pure white (`#FFFFFF`) for text. Use `on-surface` (`#F1F3FC`) to avoid harsh "retina burn" in dark mode.
- **DON'T** use standard 1px borders to separate list items. Use a `0.7rem` (spacing-2) vertical gap instead.
- **DON'T** use "flat" buttons. Every primary interaction must have a subtle glow or gradient to feel "edible" and premium.