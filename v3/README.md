# The Paper Garden (v3)

A cinematic, mobile-first 3D "thank you" web experience created by the Ghana Muslim Students' Association (GMSA-KNUST Branch) for a newly married couple, Ahmed Alhassan Machele and Yussif Salamatu Salash (#MALASH'26, #Created4Machele; tagline "Hearts Once Apart, Now Closely Aligned").

This is a separate React 18 + Three.js application built on git branch `v3-garden` in the `v3/` workspace directory. The previous production deployment remains completely untouched.

---

## Technical Stack

- **Framework**: React 18 (JSX), Vite 6
- **3D & Graphics**: Three.js 0.186, React Three Fiber 8, Drei 9, Postprocessing 2
- **Animation**: GSAP 3.15, @gsap/react
- **State Management**: Zustand 5
- **Audio**: Howler.js (procedural natural ambience and UI clicks; no instruments, singing, bells, or chimes)
- **Icons**: Lucide React (SVG only; zero emojis anywhere)
- **Typography**: Sacramento (headlines & names), Exo 2 (body & labels), Amiri and Aref Ruqaa (Arabic)
- **Testing**: Playwright test suite (Chromium headless e2e)
- **Asset Compression**: vite-plugin-compression2 (gzip and brotli pre-compression)

---

## Art Direction: The Paper Garden

A backlit paper-cut diorama of a moonlit courtyard garden transitioning to dawn.
- **Palette**: Plum (`#6E1450`), Lavender (`#C9B8E8`), Violet (`#7B4FBF`), Rose (`#F2B6E3`), Warm Ivory (`#F4ECE1`), and Deep Tinted Plum (`#12031C`).
- **Layers**: Multi-depth 3D planes featuring procedural Islamic lattice, arches, and blossoms with soft contact shadows and depth-of-field.
- **Hero Objects**: Floating lantern, stone plinth with cracked wax egg, glass heart, and star constellation.

---

## Six Acts

1. **The Gate**: Backlit paper lattice doors with Basmalah loader, title "A letter is waiting for you", subline "From the GMSA-KNUST family", sound switch, and travel mode picker.
2. **The Courtyard**: Low stone plinth beneath a hanging lantern where the egg rests. Tapping cracks the wax seal, launching the reusable `MalashModal` with a shared-element FLIP animation. Reopens anytime.
3. **The Tree of Wishes**: Blossoms carrying individual community wishes. Tapping unfolds the wish text with live progress tracking ("{n} of 12 wishes read") and an accessible plain-text drawer.
4. **Three Days, One Journey**: Three paper arches (Arewa, Nikaah, Reception) framing dates and "One promise. One journey. One forever."
5. **Names in Light**: "Machele" and "Salash" revealed in Sacramento script, merging into "MALASH'26" on a moonlit Islamic star lattice, followed by Surah Ar-Rum (30:21) and the wedding dua. Ameen button releases rising light particles.
6. **Dawn Farewell**: Sunrise sky ramp, closing message, the interactive Wish Card Maker (canvas-to-PNG with WhatsApp deep-link flow), restart control, secret EC Office note, and GMSA-KNUST footer.

---

## Core Features & Architecture

- **Zustand Store (`src/core/store.js`)**: Single source of state for act index, travel mode, theme, audio, moments, and secrets.
- **Dual Travel Modes**:
  - *Sideways*: Horizontal transform slider with touch swipe, wheel handling, keyboard arrows, and bottom chapter dock.
  - *Scroll*: Native vertical scroll-snap sections with right-edge chapter dock (bottom dock on mobile).
  - Mode switching preserves all state (opened letter, read wishes, cracked egg, found secrets).
- **Themes**:
  - Auto-detected by local time (dark from 18:00 to 05:59, light otherwise), with URL override (`?theme=light` or `?theme=dark`) and manual toggle.
  - View Transitions API circular reveal animation from toggle coordinates with graceful fade fallback.
- **The Egg & `MalashModal`**:
  - FLIP shared-element card expansion from egg bounding box.
  - Full focus trap, Escape/backdrop dismissal, and focus restoration to the trigger.
  - Unlimited re-opening.
- **Wish Card Maker & WhatsApp Flow**:
  - Client-side 2D Canvas generator (Card 1080x1350 or Status 1080x1920) with 4 paper styles, WCAG 4.5:1 contrast guard, custom message, blessing picker with RTL Arabic rendering, and sticker accents.
  - "Send on WhatsApp": Downloads PNG locally, then opens `https://wa.me/233508993496?text=...`. The phone number is never displayed as plaintext in the UI.
- **Six Hidden Surprises**:
  - Constellation: 3 dew glints on the tree reveal "MALASH'26".
  - Held Heart: 500ms press-and-hold reveals tagline "Hearts Once Apart, Now Closely Aligned".
  - Tail Blessing: Button at bottom of farewell reveals "Barakallahu lakuma".
  - Crescent: Moon icon near dawn horizon shows verified blessing.
  - Egg Shards: 3 shards at egg base glow with soft tick feedback.
  - EC Office Note: Secret seal opens Executive Council note in modal.
- **WebGL Fallback**: Canvas gracefully degrades on context loss or unsupported hardware without breaking text, blessings, or card generator.

---

## Development & Testing Commands

Run from `v3/`:

```bash
# Start development server (port 5173 or 5187)
npm run dev

# Production build with gzip/brotli compression
npm run build

# Preview production build locally
npm run preview

# Run Playwright End-to-End Test Suite
$env:PLAYWRIGHT_BROWSERS_PATH="C:\Users\yenka\AppData\Local\ms-playwright"
npm run test:e2e
```

---

## IMPORTANT: Islamic Text & Imam Verification

All Arabic strings are rendered as native DOM elements (never WebGL text) to ensure proper font shaping and cursive ligatures.

Before sharing this link with the couple, the GMSA-KNUST Imam must confirm the following Arabic phrases:

1. **Marriage Dua (Act 5)**:
   - Arabic: `بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِي خَيْرٍ`
   - Transliteration: *Barakallahu lakuma wa baraka alaykuma wa jama'a baynakuma fi khayr*
   - Source: Jami` at-Tirmidhi 1091 (graded hasan sahih). Note that prophetic hadith collections record the singular address (*laka, alayka*); the dual form (*lakuma, alaykuma*) is the established scholarly adaptation when addressing a couple together.
2. **Quranic Verse (Act 5)**:
   - Surah Ar-Rum (30:21): `وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَتَفَكَّرُونَ`
3. **Card Blessings (`src/content.json`)**:
   - `barakallah`: Same as marriage dua above.
   - `jazak`: `جَزَاكُمُ اللَّهُ خَيْرًا` (*Jazakumullahu khayran*).
   - `ameen`: `آمِين` (*Ameen*).
4. **Crescent Surprise**:
   - Needs final verification and verified Arabic text replacing placeholder in `content.json`.

---

## What the User Must Complete Manually

The codebase is fully functional with stubs and verification flags where real assets are pending:

1. **Real Community Wishes**: Replace `"DUMMY Member 1..12"` items in `src/content.json` with actual messages collected from association members.
2. **Audio & Narration**: Place recorded ambient audio or voiceover file at `public/audio/narration.mp3` if desired (sound fails silently if absent).
3. **EC Office Note**: Replace `"DUMMY: Message from the Executive Council goes here."` in `src/content.json` with the approved letter from the Executive Council.
4. **Crescent Dua**: Provide verified short dua text for the crescent surprise in `src/content.json`.
5. **Imam Confirmation**: Complete review of the dual-form blessings with the association imam.
6. **WhatsApp Destination Number**: Verify international format Ghana number in `src/config.json` (`share.whatsappNumber`: `"233508993496"`).
7. **Real-Device Testing**: Execute final manual walkthrough on one physical Android device and one physical iPhone Safari.
