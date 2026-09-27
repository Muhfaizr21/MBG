

> Act as an expert frontend developer and UI/UX designer. Create a responsive, modern, and minimalist landing page for a productivity app using React and Tailwind CSS.
> **Global Styling & Theming:**
> * **Typography:** Use a clean, modern geometric Sans-serif font (like Inter or Plus Jakarta Sans) for the primary text. Use an elegant Serif font (like Playfair Display) specifically for italicized emphasis phrases.
> * **Color Palette:** Clean white background (`bg-white`), rich black text (`text-gray-900`), and light gray for secondary text (`text-gray-500`).
> * **Visual Effects:** The design relies heavily on vibrant, soft, blurred "mesh gradients" (blending bright pink, purple, and warm orange/yellow) placed behind images to create a glowing effect.
> * **Components:** Buttons should be pill-shaped (`rounded-full`), outlined with a thin border, containing uppercase text and a small right arrow icon.
> 
> 
> **Section 1: Navigation Bar**
> * Layout: Flexbox, space-between, padding top and bottom.
> * Left: Text logo "Enblox" (bold, sans-serif).
> * Center: Navigation links (Home, Services, Features, Blog, Pricing) in small, subtle text.
> * Right: Pill-shaped CTA button "TRY IT FOR FREE ->".
> 
> 
> **Section 2: Hero Section**
> * Layout: Centered text alignment, lots of whitespace.
> * Subheading: "Your Day, in Perfect Rhythm." (Italic, serif font).
> * Main Heading: "Work Smarter, Not Harder" (Large, bold, sans-serif, max-width to break into two lines).
> * Description: A short paragraph below the heading explaining the app, using gray text.
> * CTA: Another "TRY IT FOR FREE ->" pill button below the description.
> * Visual: A large, striking image of a hand holding an iPhone. Place a massive, heavily blurred radial gradient (pink, magenta, orange) absolutely positioned behind this image to create a vibrant aura.
> 
> 
> **Section 3: Feature Introduction**
> * Layout: Two-column grid (approx 60/40 split) with generous top margin.
> * Left Column (Heading): "Designed to Help You Do More With Less Stress". The words "With Less" must be styled with the elegant italic serif font, while the rest is bold sans-serif.
> * Right Column (Description): "Our productivity app is built for modern professionals who want to stay organized, focused, and in control." Align this to the bottom or center relative to the heading.
> 
> 
> **Section 4: Features Grid**
> * Layout: 3-column grid below the Feature Introduction.
> * Item 1: Title "Smart Task Management", followed by a brief description.
> * Item 2: Title "Integrated Calendar & Deadlines", followed by a brief description.
> * Item 3: Title "Focus Mode", followed by a brief description.
> * Styling: Small bold titles, smaller gray text for descriptions. No borders or cards, just clean text on the white background.
> 
> 
> **Section 5: Bottom Visual Transition**
> * Add a full-width section at the bottom containing a vibrant, high-contrast gradient background (deep purple transitioning into bright orange/yellow).
> * Place a silhouette or dramatic profile image of a person wearing headphones over this gradient.
> 
> 
> Please generate the complete, production-ready code for this layout, including the Tailwind classes for the mesh gradients and typography mix. Use placeholder images from Unsplash where necessary.

---

# MBG (Makan Bergizi Gratis) — Landing Page Design Spec

> Product identity: Sistem Informasi Makan Bergizi Gratis — QR Code + AI nutrition & freshness analysis.
> Landing page purpose: intro/marketing for mobile app. Not a productivity app.

**Global Styling & Theming:**
* **Typography:** Clean modern geometric sans-serif (Plus Jakarta Sans) for primary text. Elegant serif (Playfair Display) for italic emphasis only.
* **Color Palette:** Clean white background (`bg-white`), rich black text (`text-gray-900`), light gray for secondary text (`text-gray-500`). 1 accent: warm gradient used only in hero aura + bottom face panels (R-01, R-29).
* **Components:** CTA buttons rounded-full, uppercase, thin border or solid dark. Feature items are text-only (no cards).

**Section 1: Navigation Bar**
* Layout: Flexbox, space-between, padding top and bottom.
* Left: Text logo "MBG" (bold, sans-serif).
* Center: Navigation links (Home, Features, Mulai) in small, subtle text.
* Right: Pill-shaped CTA button "Scan QR →".

**Section 2: Hero Section**
* Layout: Centered text alignment, lots of whitespace.
* Subheading: "Makan Bergizi Gratis." (Italic, serif font).
* Main Heading: "Scan QR. Ketahui Kesegaran." (Large, bold, sans-serif, max-width to break into two lines).
* Description: Explaining MBG system — QR Code, nutrition analysis, freshness AI. Using gray text.
* CTA: "Scan QR Sekarang →" pill button below description.
* Visual: A large image of a hand holding an iPhone showing QR scanner/nutrition dashboard. Place a subtle radial gradient (pink, purple, orange) absolutely positioned behind this image as hero aura.

**Section 3: Feature Introduction**
* Layout: Two-column grid (60/40 split).
* Left Column (Heading): "Analisis Kesegaran Makanan" — "Kesegaran" styled with italic serif font, rest bold sans-serif.
* Right Column (Description): Explain MBG stores data menu, bahan, nutrisi, waktu produksi, and AI analysis results behind each QR Code.

**Section 4: Features Grid**
* Layout: 3-column grid below the Feature Introduction.
* Item 1: Title "Scan QR Code", description: Pindai QR pada kemasan makanan, validasi token dan status QR secara instan.
* Item 2: Title "Nutrition Engine", description: Hitung kalori, protein, karbohidrat, lemak, serat dari data bahan secara deterministik.
* Item 3: Title "Freshness & AI Analysis", description: Analisis kesegaran berdasarkan waktu produksi, suhu, kelembapan. AI memberikan penjelasan ringkas.
* Styling: Small bold titles, smaller gray text for descriptions. No borders or cards, just clean text on white background. Numbered markers 01/02/03.

**Section 5: Get Started / Bottom Visual Transition**
* Full-width section with vibrant gradient background (deep purple transitioning into bright orange/yellow).
* Headline about knowing what you consume.
* Email signup form for release notification.
* Honest label: "Prototype — email tidak dikirim ke mana pun."

**Copy rules (antislop-ui compliant):**
* No decorative emoji anywhere in copy (R-04).
* No arrow `→` on non-CTA buttons (R-08).
* Feature items are text-only (no cards), numbered markers as variation (R-14, R-05).
* All links point to real destinations or labeled "Coming soon" (R-24, R-26).
* Form has honest placeholder, validated states idle/error/done, aria attributes (R-23, R-27, R-38).
* Motion: hover states only, respects prefers-reduced-motion, no loops (R-19).

**Copywriting for landing page (mobile app intro):**
* Landing page purpose: introduce MBG mobile app. Not a full product demo.
* Copy must reference: QR Code scan, nutrition analysis, freshness analysis, AI explanation.
* CTA: "Scan QR Sekarang" (hero), "Daftar Sekarang" (email signup), "Scan QR" (header).
* Footer: "MBG — Makan Bergizi Gratis" with Syarat & Privasi link.
* No mention of "Enblox", productivity, task management, calendar, or focus mode.