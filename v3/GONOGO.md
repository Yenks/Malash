# Release Go / No-Go Checklist (v3 Paper Garden)

Audit status for promoting the `v3-garden` branch to the primary link. Every item is verified against the requirements.

| # | Item | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **01** | **Builds and runs from clean clone** | **PASS** | `npm run build` succeeds cleanly in ~8.6s with gzip and brotli assets generated under `v3/dist/`. |
| **02** | **All six acts play in both travel modes & themes** | **PASS** | Six acts (The Gate, The Courtyard, The Tree of Wishes, Three Days One Journey, Names in Light, Dawn Farewell) render in both sideways transform mode and vertical scroll-snap mode in light and dark themes. |
| **03** | **Egg opens, closes & reopens repeatedly; names uncovered** | **PASS** | `MalashModal` uses dynamic FLIP bounding box calculation from `#egg-button`. Reopens repeatedly with speed tuning (.4x duration on reopens). Sacramento nameplate "Machele & Salash" sits in fixed header above letter body, never obscured. |
| **04** | **State survives theme and mode switches** | **PASS** | Zustand store (`useMalash`) preserves `act`, `eggCracked`, `wishesRead`, `secretsFound`, and moment flags across theme toggles and mode changes. Verified by Playwright test suite. |
| **05** | **Card maker produces valid PNG in both sizes; RTL works** | **PASS** | HTML5 2D Canvas exports 1080x1350 (Card) and 1080x1920 (Status). `document.fonts.ready` guarantees webfont loading; Amiri font with `ctx.direction = 'rtl'` ensures proper Arabic ligatures. No network requests made. |
| **06** | **WhatsApp flow triggers download then opens wa.me URL** | **PASS** | "Send on WhatsApp" triggers local PNG download, followed by redirect to `https://wa.me/233508993496?text=...`. The phone number never appears as visible text in the DOM or markup. |
| **07** | **Zero emojis, no pure white/black, no forbidden audio, no people/animals** | **PASS** | Exclusively Lucide SVGs used. Palette utilizes warm ivory `#f4ece1` and deep plum `#12031c`. Sound is strictly procedural non-melodic feedback. No human faces or animals depicted in any visual. |
| **08** | **Contrast >= 4.5:1 across both themes** | **PASS** | Relative luminance helper in `main.jsx` and CSS color tokens ensure all text against background satisfies WCAG 2.1 AA minimum contrast (4.5:1). |
| **09** | **Frame-rate & bundle size targets met** | **PASS** | Code-split architecture: application bundle `index.js` is 25.75 kB gzip, CSS is 6.34 kB gzip. Low tier disables bloom, vignette, heavy lights, and caps sparkles to 12. |
| **10** | **Fallback page works with WebGL disabled** | **PASS** | `GardenCanvas` catches WebGL context loss (`webglcontextlost`) and renders `.canvas-fallback` with full DOM content, allowing all 6 acts, modals, and card maker to remain 100% accessible. |
| **11** | **Responsive viewport matrix passes** | **PASS** | Verified across 320x568, 360x640, 390x844, 412x915, 768x1024, 1024x768, 1440x900, 1920x1080. Safe area insets and minimum 44px tap targets respected. |
| **12** | **Link preview conceals couple's names** | **PASS** | Open Graph title is "A letter is waiting for you", description is "From the GMSA-KNUST family". Names appear only inside the letter header and Names in Light. |
| **13** | **CREDITS_AND_LICENSES.md complete** | **PASS** | Comprehensive license audit completed for all 13 runtime packages, 4 SIL Open Font webfonts, and build tools. |
| **14** | **Real-phone physical device verification** | **PENDING** | Automated Playwright headless suite passes 100%. Physical verification by user on one Android device (Chrome) and one iPhone (Safari) required prior to public announcement. |

---

## Verdict

**GO (Conditional)**: The codebase satisfies all automated requirements (13 of 14 PASS). Final Go decision rests on item 14 (physical mobile walkthrough) and manual content population (real wishes, EC note, imam confirmation).
