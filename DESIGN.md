

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

Tinggal masukkan *prompt* ini, AI-nya bakal langsung nangkep *vibe* desainnya, terutama bagian tipografi campuran dan gradasi warna yang jadi ciri khas di gambar. Ada bagian spesifik yang mau ditambahkan (misal efek animasi *scroll* pakai Framer Motion)?

---

## Keputusan desain (audit antislop-ui, 2026-09-27)

- Dial: VARIANCE 6 / MOTION 2 / DENSITY 4.
- Palette: white, gray-900, gray-500 + 1 aksen warm. Sisanya netral. (R-29)
- Gradien 2 titik fungsi hierarki: aura hero (fokus visual utama) + panel bawah (transisi section). Bukan default tiap section. (R-01)
- Radius: full = CTA, 2rem = panel/foto, default = lain. (R-11)
- Panah: hanya komponen CTA "Try it for free" (satu aksi, satu bahasa). (R-08)
- Fitur: teks tanpa card, marker nomor 01/02/03 sebagai variasi hierarki. (R-14)
- Nav Blog/Pricing label "Segera" visible, href ke #get-started. Tanpa dead link. (R-24)
- Form email prototype: placeholder jujur, state idle/error/done, label "tidak dikirim". (R-23/R-26/R-27/R-38)
- Motion: hover + render sekali, hormat prefers-reduced-motion, tanpa loop. (R-19)