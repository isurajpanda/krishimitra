# KrishiMitra — Design Brief for Frontend AI Tool

---

## ⚠️ CRITICAL DESIGNER MANDATES — READ FIRST

These are non-negotiable directives. Every decision flows from these.

1. **DEFAULT MODE IS DARK.** The app opens in dark mode. Always. Dark is the primary, canonical experience. Light mode is an option — not the default. The dark mode toggle must be permanently visible on every page, never buried in settings.

2. **DO NOT GENERATE GENERIC DESIGN.** No cookie-cutter layouts. No Tailwind defaults. No plain flat cards. No purple gradients on white. If it looks like a template, start over. Every screen must feel like it was *designed*, not assembled.

3. **THE AESTHETIC SYSTEM IS: Material Design 3 + Bento Grid + Data-Driven UI + Shiny Glassmorphism.** These four systems work together. They are not competing — they are layered. Read the Aesthetic Direction section carefully before designing a single element.

4. **FANTASY-WORLD COLOR FREEDOM.** You have total, unrestricted creative freedom over the entire color palette. Do not play it safe. Do not be bland. The colors should feel like they came from another world — lush, electric, otherworldly, yet cohesive. Think bioluminescent forests, ancient temple gemstones, monsoon lightning, the inside of a ripe pomegranate. Make the palette *edible*. Make people want to lick the screen. No bland. No muted. No safe.

5. **GENERATE ALL 5 PAGES IN FULL.** Every single page below must be fully designed with all elements specified. No placeholder screens. No "similar to previous screen." Each page must be a complete, individual, fully-realized design.

---

## App Overview

**KrishiMitra** ("Farmer's Friend" in Hindi) is a mobile-first progressive web app built to empower Indian farmers with real-time agricultural intelligence. It speaks the farmer's language — literally — supporting multiple Indian languages (Hindi, Marathi, Punjabi, Tamil, Telugu, Kannada, Bengali, Gujarati, and more).

The app delivers: real-time weather data, soil-based crop recommendations, fertilizer guidance, pest alerts, live market prices, and government scheme awareness — all in one place.

The app is used by farmers in fields, on mid-range Android phones, often in direct sunlight, sometimes with limited connectivity. Design must prioritize legibility and fast comprehension — but it must also be *extraordinary looking*. Farmers deserve beauty too.

---

## Aesthetic Direction — The Four-Layer Design System

### LAYER 1: Material Design 3 (The Foundation)

Material You (M3) provides the structural skeleton — the interaction patterns, component behaviors, elevation system, and accessibility baseline that make the app trustworthy and intuitive.

**Apply M3 principles for:**
- **Elevation & surface tinting** — surfaces at higher elevations are tinted with the primary color in dark mode, not just made lighter. This creates a depth hierarchy that feels luxurious.
- **Dynamic color** — the color system uses M3's tonal palette logic: primary, secondary, tertiary, and their container variants. But the palette colors themselves are fantasy-level vivid (see Color mandate above).
- **Component behavior** — ripple effects on tap, state layers (hover, pressed, focused, disabled), proper FAB elevation behavior, bottom nav active states.
- **Shape system** — M3's shape scale: extra-small (4px), small (8px), medium (12px), large (16px), extra-large (28px), full (pill). Use these consistently. Medium shapes for cards, large for bottom sheets, full for FABs and chips.
- **Typography roles** — Display, Headline, Title, Body, Label. Map them strictly. Never use a Body font where a Headline should be.

**The M3 vibe here is:** polished, finger-friendly, trusted, elevated. The structure of a premium fintech app. The approachability of a consumer product used daily.

---

### LAYER 2: Bento Grid (The Layout Language)

Bento Grid layout is mandatory on data-heavy pages: **Home Dashboard (`/`)**, **Crops (`/crops`)**, and **Notifications (`/notifications`)**. On other pages, Bento grid is optional but encouraged for settings/profile sections.

**What Bento Grid means here:**
- Information is arranged in a mosaic of asymmetric, purpose-sized tiles — not uniform card stacks
- Tiles have different sizes: a weather tile might be 2×2, a price card 1×1, a pest alert 2×1, a field status card 1×2
- The grid breathes — tiles have consistent gap spacing (12–16px) but vary in proportion
- Bigger tiles = higher priority information. The hierarchy is expressed spatially, not just typographically
- On mobile (primary target), the grid adapts: 2-column bento layout is the core. Some tiles span full width. Tall tiles create vertical emphasis.
- Each tile is a distinct glassmorphism surface (see Layer 3)

**Bento tile design rules:**
- Each tile has a single clear purpose — one stat, one alert, one crop, one chart
- Tiles can contain micro-data visualizations: sparklines, radial progress, mini bar charts
- Rounded corners: use M3 large shape (16px) for tiles consistently
- Tiles should feel like glowing panels on a dark surface — each one lit from within

---

### LAYER 3: Shiny Glassmorphism (The Visual Texture)

Every card, tile, sheet, and panel uses glassmorphism — but not the washed-out, barely-visible kind. This is **SHINY glassmorphism** — vivid, lustrous, almost holographic.

**Rules for shiny glassmorphism:**
- **Background blur:** `backdrop-filter: blur(20–40px)` — strong enough to be clearly visible
- **Glass fill:** semi-transparent fill using the color system. In dark mode: `rgba(255,255,255,0.05)` to `rgba(255,255,255,0.12)`. The tint should carry the primary or secondary color subtly.
- **Border:** a luminous inner border — `1px solid rgba(255,255,255,0.15)` to `rgba(255,255,255,0.25)`. This is what makes it *shiny*. The border catches light.
- **Specular highlight:** a subtle radial or linear highlight at the top edge of cards — like light hitting curved glass. Achieved via `::before` pseudo-element or top-border gradient. This is the signature detail.
- **Multi-layer depth:** layer 2–3 glass surfaces on top of each other (e.g., a stat chip inside a glass card inside a glass bottom sheet). Each layer is slightly more opaque.
- **Glow accents:** on key interactive elements (primary buttons, active FAB, live data indicators), add a soft outer glow — `box-shadow: 0 0 20px rgba([accent-color], 0.4)`. The glow color matches the element's accent. This makes the UI feel like it's *emitting light*.
- **Background:** the page background behind all glass elements should be rich and deep — a subtle gradient, a noise texture, or a very dark illustrated scene. The glass only looks good against something worth blurring.
- **Shine animation:** on hover/focus, glass elements intensify — the border brightens slightly, the glow strengthens. 150ms ease-in-out.

**What shiny glassmorphism is NOT:**
- Not washed out grey blur
- Not pure `backdrop-filter: blur(10px)` with no other treatment
- Not flat frosted glass with no luminosity
- The goal is: a gemstone, not a foggy window

---

### LAYER 4: Data-Driven UI (The Intelligence Layer)

KrishiMitra is fundamentally an intelligence product. The UI must *show* that intelligence visually — not just list text. Every piece of data gets a visual treatment.

**Data-driven UI principles:**
- **Numbers are heroes.** Prices, temperatures, percentages, days — these are displayed large, bold, and animated. They count up on entry. They change color based on value (trending up = one color, trending down = another).
- **Every stat has a visual:** sparklines, radial gauges, progress arcs, mini bar charts, trend indicators — these are everywhere. Not just on the charts page. On every card that has data.
- **Live data feels alive:** pulsing dots for real-time feeds, animated tick updates when numbers change, subtle shimmer on cards refreshing data
- **Context is visual:** a crop match isn't just "94%" — it's a glowing arc that fills to 94%. Fertilizer NPK isn't just numbers — it's three animated ring gauges. A 5-day forecast isn't a table — it's a mini illustrated visual timeline.
- **Color encodes meaning consistently:** rising/positive = one consistent fantasy accent. Falling/negative = another. Warning = another. This is not decoration — it's communication.
- **Micro-charts are everywhere:** sparkline price history in market cards, 7-day weather bar chart in the weather hero, growth stage arc in field cards, NPK ring gauges in fertilizer guide.
- **Density is strategic:** data-dense tiles (market prices, weather stats) use compact type and micro-charts. Content tiles (advisory text, scheme descriptions) use generous white space and larger type.

---

## How the Four Layers Work Together — The Visual Logic

```
DARK RICH BACKGROUND (deep, textured, the "world")
    └── BENTO GRID tiles (the spatial layout)
          └── GLASS SURFACES (each tile is a glowing glass panel)
                └── M3 COMPONENTS (buttons, chips, FABs behave correctly)
                      └── DATA VISUALIZATIONS (numbers, charts, live indicators)
```

The result: a UI that looks like a holographic mission control dashboard — but designed for a farmer in Maharashtra. Premium, intelligent, alive.

---

## Typography

- **Display / Headline font:** `Baloo 2` or `Rajdhani` — bold, expressive, Indian-script compatible. Must feel authoritative and warm. Used for page titles, hero numbers, key data points.
- **Body / UI font:** `Noto Sans` or `Hind` — clean, fully supports Devanagari and all major Indian scripts. Used for descriptions, labels, secondary text.
- **Monospace (data):** A clean monospace font for prices, numbers that change, timers — this signals "live data" to the eye.
- **M3 type scale applies:** Display Large for hero temps/prices. Headline Medium for section titles. Title Large for card headers. Body Medium for descriptions. Label Small for chips and micro-text.

---

## Motion System

- **Page transitions:** M3 shared-axis transition — slide-up + fade, 300ms
- **Bento tile entry:** staggered scale-up from 0.92 → 1.0 + fade, 60ms stagger between tiles
- **Number counters:** count up from 0 on entry, 400ms ease-out
- **Glass shine animation:** on mount, a subtle light sweep across glass cards (like a lens flare passing over) — once, 600ms
- **Live data pulse:** pulsing glow dot on live-feed cards — 2s loop
- **Dark mode toggle:** full theme crossfade, 300ms. Icon rotates 180° on switch.
- **Chat FAB:** breathing glow pulse — the outer glow oscillates in opacity, 3s loop
- **Charts/gauges:** animate in on scroll entry — arcs fill, bars grow, sparklines draw themselves

---

## Dark Mode Toggle — Placement Rules

Mandatory on every screen:

- **Position:** Top-right corner of every page header, always visible
- **Design:** Premium icon toggle — sun icon in light mode, moon icon in dark mode. The icon sits inside a small glass pill/chip (glassmorphism treatment). Animated icon morph on switch.
- **Default:** DARK MODE. App always launches dark.
- **Animation:** Full-screen theme crossfade on toggle, 300ms. Not a flash.
- On `/auth`, sits top-right above the illustration.

---

## Target Users

Farmers aged 25–65 across rural and semi-urban India. Primary device: mid-range Android smartphone. One-hand usage while standing in a field. Some users have low digital literacy — icons must always have labels, hierarchy must be ruthlessly clear. But these users are surrounded by vivid color every day (festivals, textiles, nature). They respond to beauty. The premium-feeling UI signals trustworthiness to them.

---

## Navigation Structure

Bottom navigation bar following M3 Navigation Bar spec, always visible except on `/auth`:

| Tab | Label | Path |
|-----|-------|------|
| Home | Home | `/` |
| Crops | Crops | `/crops` |
| Alerts | Alerts | `/notifications` |
| Profile | Profile | `/profile` |

- Navigation bar: glassmorphism treatment — blurred glass panel floating above content
- Active indicator: M3 active indicator pill behind icon+label, filled with primary container color

---

## PAGE 1: `/auth` — Authentication

**Purpose:** Entry point. Language-first, then OTP login. First impression of KrishiMitra.

**Background:**
- Full-screen dark illustrated scene: a night sky over Indian agricultural fields — stars, a large illustrative moon, terraced crops receding into distance. Flat/geometric illustration style, Madhubani-influenced geometry, in the app's fantasy color palette.
- A very subtle animated particle layer over the illustration — tiny floating light motes (like fireflies or stars drifting) using the accent colors. Slow, ambient, ethereal.
- This illustration is the "world" that all the glass UI floats in front of.

**Top Area:**
- Dark mode toggle: top-right, glass chip treatment
- Language selector: horizontal scroll of pill chips — "हिंदी | मराठी | ਪੰਜਾਬੀ | தமிழ் | తెలుగు | English…"
  - Each chip: glass pill, M3 full shape (border-radius pill)
  - Active chip: primary color fill + glow, text clearly readable
  - Inactive: glass border only, translucent

**Center Branding:**
- App logo: a geometric stylized sprout/leaf mark — symmetrical, precise, glowing softly with accent color aura
- "KrishiMitra" wordmark in display font — large, centered, with a subtle shimmer/glow on the letterforms
- Tagline in selected language: *"Your Smart Farming Companion"* — Body Large, lighter weight, centered

**Login Bottom Sheet (M3 Bottom Sheet, glass treatment):**
- Slides up from bottom on load — M3 modal bottom sheet animation
- Glass surface: strong blur behind sheet, luminous top border highlight (the specular shine)
- Sheet handle bar at top center (M3 drag indicator)
- **Phone input:** M3 Outlined Text Field — tall (56px), label "Mobile Number" above field always. Country code (+91) as a styled prefix with glass chip treatment. Numeric keyboard trigger.
- **"Get OTP" button:** M3 Filled Button — full-width, primary color, rounded-full (M3 extra-large shape), with glow effect matching button color.
- **OTP Entry (after submit):** 6 individual digit boxes — M3 outlined style, large (64px tall, 44px wide each), auto-advance, auto-submit. When all filled: subtle success glow animation.
- "Resend OTP in 0:45" — monospace countdown, Label Medium
- "Continue as Guest →" — M3 Text Button, bottom center
- Terms micro-text: Label Small, lowest priority visually

**Elements checklist:**
- [ ] Full-screen illustrated landscape with particle layer
- [ ] Dark mode toggle (glass chip, top-right)
- [ ] Language pill selector (glass, horizontal scroll, active glow)
- [ ] App logo with aura glow
- [ ] "KrishiMitra" wordmark
- [ ] Tagline
- [ ] Glass bottom sheet (M3 modal, blur + shine border)
- [ ] Phone input (M3 Outlined Text Field + country code prefix)
- [ ] "Get OTP" button (full-width, glowing)
- [ ] OTP digit boxes (×6, large)
- [ ] Resend timer (monospace)
- [ ] Guest access link
- [ ] Terms micro-text

---

## PAGE 2: `/` — Home Dashboard

**Purpose:** Daily command center. Primary data hub. Uses Bento Grid layout as the core structure.

**Background:** Rich deep gradient — the "world" behind all glass tiles. Subtle noise texture. The background should feel like deep space or deep ocean — something vast and alive.

**Top Bar (glass pill, floating):**
- Left: "Namaste, Raju 🌿" — Headline Small, display font
- Center: glass location chip — "📍 Nashik, MH" — tappable
- Right: notification bell (with badge count) + dark mode toggle (glass chip)

---

### Bento Grid Layout — Home

The main content area is a 2-column bento grid. Tile sizes below:

**Tile A — Weather Hero (Full Width, 2×2 tall):**
- The largest tile on screen — spans full width
- Glass surface with a dynamic ambient illustration inside: sunny = subtle illustrated sun rays emanating from center; rainy = animated rain streaks; night clear = stars
- **Temperature:** Display Large — massive, centered, counting up on entry
- **Condition label:** "Partly Cloudy" — Headline Medium, below temp
- **3-stat row (mini glass chips inside the tile):** Feels like [X]° | Humidity [X]% | Wind [X] km/h
- **5-day forecast strip:** horizontal scroll at tile bottom — each day as a tiny glass sub-chip with illustrated weather icon + hi/lo
- **Farming Advisory:** a glowing bottom-edge band — "✓ Good day to irrigate" in accent color, with icon. Or warning amber if adverse.
- Specular highlight at top of this tile is more pronounced — it's the hero.

**Tile B — My Field (1×2 tall, left column):**
- Primary active field card
- Crop illustrated icon (large, centered top)
- Field name: Title Large
- "Day 34 of 90" — data in monospace
- Growth arc: a radial progress ring (glassmorphism ring, animated fill) showing % through season
- Health tag at bottom: "On Track" in green glow chip OR "Needs Water" in amber glow chip

**Tile C — Market Price (1×1, right column):**
- Single commodity spotlight
- Crop icon (illustrated)
- Crop name: Title Medium
- Price: Headline Large, monospace, counting-up animation on entry
- Trend: large arrow + % — color encoded (up/down)
- "Live" pulse dot

**Tile D — Pest Alert (Full Width, 2×1):**
- Left: illustrated pest icon in a warning-colored glass circle
- Right: alert title (Title Medium, bold) + 1-line description
- Right edge: "View →" text button
- Left border: thick accent stripe in danger color
- The entire tile has a subtle danger-color glow behind it

**Tile E — Second Field / Add Field (1×1):**
- If second field exists: compact version of Tile B
- If no second field: dashed glass border tile with "+" centered — "Add Field" — soft glow

**Tile F — Government Scheme (Full Width, 2×1):**
- Scheme name: Title Large
- Deadline countdown: "18 days left" — monospace, amber if urgent
- "Learn More →" button
- Background: a subtle illustrated scroll/document motif inside the glass

**Tile G — Market Snapshot Strip (Full Width, scrollable):**
- Section header: "MARKET TODAY" — Title Medium, with live pulse dot
- Horizontal scroll of 1×1 mini tiles: each one a glass card with crop icon, crop name, price, trend arrow

**Chat FAB:**
- M3 Large FAB, center-anchored above bottom nav
- 64px diameter, primary accent color
- Leaf + chat hybrid icon inside
- Glow pulse animation (outer box-shadow in accent color oscillates, 3s loop)
- "Ask KrishiMitra" tooltip glass chip on first visit, fades after 4s

**Elements checklist:**
- [ ] Floating top bar (glass pill, greeting, location, bell, dark toggle)
- [ ] Weather hero tile (full-width, animated ambient, massive temp, 5-day strip, advisory band)
- [ ] My Field tile (radial arc, crop icon, health chip)
- [ ] Live market price tile (monospace price, trend arrow, pulse dot)
- [ ] Pest alert tile (danger glow, illustrated icon)
- [ ] Add/second field tile
- [ ] Government scheme tile
- [ ] Market snapshot horizontal scroll strip
- [ ] Chat FAB (glowing, pulsing, tooltip)
- [ ] Glass bottom navigation bar

---

## PAGE 3: `/crops` — Crop Intelligence Hub

**Purpose:** Crop recommendation engine, active crop tracking, fertilizer guidance, pest library. Data-dense. Uses Bento Grid on the Recommend tab.

**Background:** Same deep world background as Home, but with a subtle botanical pattern — faint illustrated leaf/crop forms at very low opacity in the background layer.

**Top Bar:**
- "CROPS" — Display Small, left-aligned
- Search icon (glass chip, top-right)
- Dark mode toggle (glass chip, top-right)

**Tab Bar (M3 Primary Tab Bar):**
Glass surface tab bar. Four tabs: **Recommend | My Crops | Fertilizer | Pests**
- Active tab: primary color indicator line + active label weight
- Tabs have illustrated micro-icons alongside labels

---

### TAB 1: Recommend

**Input Card (glass, full-width):**
- Title: "Find Your Best Crops" — Headline Small
- Three M3 input fields (glass Outlined Text Fields):
  - Soil Type (dropdown)
  - Season (M3 Segmented Button: Kharif / Rabi / Zaid — glass segments)
  - District (auto-filled, editable)
- "Find Best Crops" button: full-width, primary filled, glowing

**Results — Bento Grid of Crop Cards:**
After submission, results render as a bento layout:

**Top Result (Full Width, tall):** The #1 match gets a hero tile:
- Rank badge: "#1" — glass chip with accent glow
- Large botanical illustration of crop (right half of tile)
- Crop name: Display Small, bold
- Local name: Body Large, lighter
- Match arc: large animated radial arc in the tile, fills to match % (e.g., 94%)
- Match label: "94% Match" in monospace, large
- Expandable section: growing calendar (horizontal illustrated timeline), water needs gauge, yield range, demand indicator bar

**Smaller Results (1×1 tiles):** Ranked 2, 3, 4 as compact bento tiles:
- Crop illustration (small, top)
- Name + match %
- 2–3 tag chips: "High Yield" | "Low Water" — glass chips with category-color glow
- Tap to expand to full-width detail view

---

### TAB 2: My Crops

- Bento grid of active tracked crops
- Each tile: crop illustration, name, field name, growth stage arc (radial), days remaining, health status chip
- "Start Tracking" CTA tile if empty (illustrated, dashed glass border)

---

### TAB 3: Fertilizer Guide

- Crop selector at top (M3 glass dropdown)
- **NPK Visual (the hero of this tab):**
  - Three large animated ring gauges side by side — N (Nitrogen), P (Phosphorus), K (Potassium)
  - Each ring: glass donut chart, fills on entry, accent color per nutrient, value label in center
  - These gauges are visually striking data art
- **Application Timeline:**
  - Vertical stepper (M3 style) — each step is a glass tile
  - Step: week range, dosage instruction, product names (generic + brand)
  - Steps connect via a glowing vertical line

---

### TAB 4: Pest Library

- Search bar: M3 glass Search Bar, full-width, top
- "Report a Pest Near Me" — M3 Filled Tonal Button, prominent, below search
- **2-column bento grid of pest tiles:**
  - Each tile: illustrated pest (center/top), pest name (Title Medium), affected crops (glass chip tags)
  - Tap → M3 Bottom Sheet slides up: full detail with symptoms, organic remedy, chemical remedy, community report button
- Pest tiles have subtle category-based color tinting (fungal = one tint, insect = another, bacterial = another)

**Elements checklist for /crops:**
- [ ] Top bar + search + dark toggle
- [ ] M3 glass tab bar (4 tabs with icons)
- [ ] Recommendation input card (3 fields + CTA button with glow)
- [ ] Hero crop result tile (full-width, match arc, botanical illustration)
- [ ] Smaller crop result tiles (bento, tags, match %)
- [ ] My Crops bento grid (growth arcs, health chips)
- [ ] NPK triple ring gauges (animated, data art)
- [ ] Fertilizer timeline stepper (glass tiles, glowing connector)
- [ ] Pest grid (2-col bento, category-tinted)
- [ ] Pest detail bottom sheet
- [ ] "Report pest" button

---

## PAGE 4: `/notifications` — Alerts & Updates

**Purpose:** Real-time alert feed. All urgent information. Uses Bento Grid for top priority alerts, linear list below.

**Background:** Deep dark, same world. Subtle animated background — very slow, barely perceptible drift of particles — because this page is live.

**Top Bar:**
- "ALERTS" — Display Small, left-aligned
- Live indicator: small pulsing dot + "Live" label (monospace) — signals real-time
- "Mark All Read" — M3 Text Button, right-aligned
- Dark mode toggle (glass chip)

**Filter Strip (M3 Chip Row, glass chips, horizontal scroll):**
**All | Weather | Pest | Market | Schemes | Advisory**
- Active chip: filled, accent glow
- Inactive: glass outline only

---

### Bento Grid — Top Priority Alerts (above the fold)

The 2–3 most critical or recent alerts render as bento tiles before the linear feed:

**Critical Alert Tile (Full Width):**
- The highest-urgency current alert gets a full-width bento tile
- Glass surface with a danger-tinted glow behind it (red/amber aura)
- Animated icon (weather animation, pest icon, etc.)
- Alert headline: Headline Medium, bold, glowing text
- Advisory text: Body Medium, 2 lines
- Action button: M3 Filled Button with glow
- Urgency band: a colored glowing stripe at the left or top edge

**Scheme Spotlight Tile (Full Width or half-width):**
- Government scheme card — banner illustrated style
- Scheme name: Title Large
- Deadline: "18 days left" in monospace — amber glow if urgent
- Eligibility: 2-line Body Small
- "Apply / Learn More" — M3 Filled Tonal Button

**Market Flash Tile (1×1 or 2×1):**
- Price spike/drop — number is MASSIVE, Headline Large, color-coded
- Crop icon
- Market name + time in Label Small

---

### Linear Notification Feed (below bento section)

Standard notification cards, M3 Card style with glass treatment:
- Left accent stripe: color-coded by type (danger red / warning amber / info green / scheme blue)
- Top row: category glass icon chip (left) + bold Title Medium (center) + relative timestamp (right)
- Body: Body Medium, 2 lines, expandable "Read more" (M3 text button)
- Action button inline at bottom when applicable: "View Remedy" / "Apply Now" / "Check Price"

**Empty State:**
- Full illustrated screen — a peaceful farmer under a tree, clear sky
- "All clear. No alerts today." — Headline Small, calm, centered
- The illustration uses the fantasy palette — even the empty state is beautiful

**Elements checklist:**
- [ ] Top bar with live pulse dot + dark toggle
- [ ] Glass filter chip strip (6 categories)
- [ ] Bento priority section (critical alert tile + scheme tile + market flash tile)
- [ ] Critical tile (danger glow, animated icon, action button)
- [ ] Scheme tile (illustrated banner, deadline countdown)
- [ ] Market flash tile (massive price number)
- [ ] Linear notification feed (glass cards, accent stripes)
- [ ] "Read more" expand
- [ ] Action buttons
- [ ] Empty state illustration
- [ ] Glass bottom navigation bar

---

## PAGE 5: `/profile` — Farmer Profile & Settings

**Purpose:** Personal data, farm configuration, language preferences, linked services, app settings.

**Background:** Same deep world background. A subtle illustrated motif — a single large botanical plant silhouette, very low opacity, behind everything.

**Profile Hero (full-width glass panel, top of page):**
- Background: a panoramic glass panel with a vivid tonal gradient behind it — the most colorful section of this otherwise structural page
- Avatar: 80px circle — initials-based with a vivid generated background, OR uploaded photo. Luminous glass border around it (the specular shine treatment on a circle). A subtle glow aura behind the avatar.
- Farmer name: Headline Medium, display font, centered
- Location: "📍 Vadgaon, Nashik, Maharashtra" — Body Medium, secondary
- "Member since Kharif 2023" — Label Medium, tertiary, localized framing
- "Edit Profile" — M3 Outlined Button, below name
- Dark mode toggle: top-right of the page (glass chip)

---

### SECTION: My Farm (glass card)
M3 Card with glass treatment, full-width:
- Card header: "MY FARM" — Title Large, with a small illustrated field icon
- **Stats row (mini bento inside the card):** 3 equal glass chips side by side — Total Land / Soil Type / Water Source — each with icon, label, and value. Tappable to edit.
- Divider (M3 Divider)
- **My Fields sub-list:** each field as an M3 List Item — field name (left, Title Medium) + area + current crop + "Edit" icon button (right). Glowing crop tag chip.
- "Add New Field" — M3 List Item with "+" icon, dashed glass border style, accent color text

---

### SECTION: Preferences (glass card)
- Card header: "PREFERENCES" — Title Large
- **Language selector:** same pill chip row as auth screen — horizontal scroll of glass language chips. Active chip: primary fill + glow.
- **Units control:** M3 Segmented Button (glass segments) — "Metric | Local | Imperial"
- **Notification Toggles:** M3 Switch for each category — glass list items:
  - Weather Alerts (with weather icon)
  - Pest Alerts (with pest icon)
  - Market Movements (with chart icon)
  - Government Schemes (with document icon)
  - Advisory Messages (with message icon)
  - Each toggle: when ON, the switch glows with accent color
- **Price Alerts:** horizontal scroll of dismissable glass chips — "Tomato ₹800+" with a close button per chip. "Add Alert +" chip at end.

---

### SECTION: Linked Services (glass card)
- Card header: "LINKED SERVICES" — Title Large
- Three M3 List Items with status:
  - PM-Kisan: connected status chip (green glow "Connected" OR grey "Not Linked") + action button
  - Soil Health Card: upload area OR thumbnail preview (glass frame)
  - Kisan Credit Card: info row, optional
- Connected items have a subtle green glow accent in their list tile

---

### SECTION: App (glass card)
- Card header: "APP" — Title Large
- M3 List Items with trailing arrow icons:
  - Help & Tutorial
  - Share KrishiMitra
  - Rate the App (trailing star icons, static 5-star display)
  - Privacy Policy
  - Terms of Use
- **Logout** — last item, styled distinctly: danger color text, danger color icon, no arrow — just "Logout" with a sign-out icon. A subtle danger glow on hover/focus.

**Elements checklist:**
- [ ] Profile hero (glass panel, avatar with aura, name, location, member since, edit button)
- [ ] Dark mode toggle (glass chip, top-right)
- [ ] My Farm card (mini bento stats row + fields list + add field)
- [ ] Preferences card (language chips + units segmented button + notification toggles + price alert chips)
- [ ] Linked services card (3 services with connection status glow)
- [ ] App card (list items with arrows + logout danger styling)
- [ ] Glass bottom navigation bar

---

## Global Design System

### M3 Component Map

| Component | M3 Type | Glass Treatment |
|-----------|---------|-----------------|
| Cards / Tiles | M3 Filled Card | backdrop-blur + luminous border + specular highlight |
| Primary Button | M3 Filled Button | Solid fill + outer glow |
| Secondary Button | M3 Outlined Button | Glass fill + glowing border |
| FAB | M3 Large FAB | Accent fill + pulsing outer glow |
| Chips | M3 Filter/Assist Chip | Glass pill + glow when active |
| Bottom Sheet | M3 Modal Bottom Sheet | Strong blur + shine border at top edge |
| Text Fields | M3 Outlined Text Field | Glass tint + accent border on focus |
| Toggle | M3 Switch | Accent glow when ON |
| Bottom Nav | M3 Navigation Bar | Glass panel + blur |
| Tabs | M3 Primary Tab | Glass strip + active indicator line |

### Elevation & Depth
- Page background: Level 0 (the deep world)
- Bento tiles / cards: Level 1 (glass, slight tint)
- Floating elements (top bar, bottom nav): Level 2 (stronger blur, more opaque)
- Bottom sheets / overlays: Level 3 (strongest blur, most opaque glass)
- Each elevation level is visually distinct — the depth stack must be readable

### Loading / Skeleton States
- Skeleton tiles: same shape as real tiles, glass surface, subtle shimmer animation (light sweep)
- Shimmer: a diagonal light gradient that sweeps across, 1.5s loop
- Skeleton maintains the bento grid proportions — layout doesn't shift on load

### Data Visualization Standards
- All charts and gauges: glass surface, animated on entry
- Colors: use the accent palette consistently — same color always means same meaning
- Sparklines: 24px tall, thin line, accent color, inside compact tiles
- Radial gauges: glass donut rings, glow on the filled arc
- Progress bars: thick, rounded, glass track with filled accent glow

---

## Dark Mode — Default and Light Mode Specs

**DARK MODE (DEFAULT):**
- Page background: true deep dark, almost black — very subtle color tint (designer chooses — could lean cool or warm depending on palette)
- Glass fills: very low opacity white tint (5–12%)
- Glass borders: low opacity white (15–25%) — luminous
- Specular highlights: top-edge linear gradient, white 0% → 20% → 0%
- Glow effects: full saturation — the fantasy colors are brightest here
- Text: near-white primary, 60% opacity secondary

**LIGHT MODE (OPTIONAL):**
- Page background: warm off-white or tinted cream — NOT pure white
- Glass fills: white with higher opacity (40–60%), more frosted
- Glass borders: subtle dark or color tint
- Glow effects: toned down — still present, softer
- Text: near-black primary, 60% opacity secondary
- Specular highlight: still present, but lighter

---

## Accessibility & Sunlight Readability

- Contrast ratio: minimum 5:1 for all body text (exceed WCAG AA) — especially important given field use
- Font size floor: 15px body, 18px important UI labels, 24px+ section headers
- Touch targets: 48×48px minimum for ALL interactive elements (M3 compliant)
- Icon + label always together in navigation (never icon alone)
- Glass opacity must not reduce text legibility — always test text contrast against the blurred background
- No interaction conveyed by color alone — always paired with shape, icon, or text

---

## Illustrations Style Guide

- Flat-to-semi-flat vector style
- Influenced by: Warli geometry, Madhubani border patterns, vintage Indian agricultural posters, botanical manuscript prints
- **These illustrations live inside glass tiles** — they need to look good through the glass, semi-transparent, as background texture OR as opaque accent illustrations in card corners
- Characters: gender-inclusive, regional clothing diversity, warm skin tones
- Crop illustrations: precise botanical style — but glowing subtly, as if lit from within (fantasy quality)
- Weather icons: expressive, illustrated — NOT emoji, NOT photorealistic
- Empty states: fully illustrated — feel like small glowing paintings

---

## Summary

KrishiMitra is intelligence and beauty in one — a product built for people who make life-or-death decisions about seeds and soil every morning. The design must honor that weight.

**The system:** Material Design 3 gives it bones. Bento Grid gives it intelligence. Shiny Glassmorphism gives it soul. Data-driven UI gives it purpose.

**The experience:** A living holographic dashboard that a farmer can trust with their livelihood — and that makes them proud to show their neighbors.

**Dark mode is home. Glass is the material. Data is the art. Color is unrestricted.**

Build all five pages. Make every tile, every glow, every number feel like it matters. Because it does.