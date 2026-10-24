# Design Critique — Round 1: Quiet Luxury & Composition

**Date**: 24 October 2026  
**Focus**: Visual restraint, typography scale, dock refinement, and egg modal shared-element behavior.

---

## 1. Overall Atmosphere & Aesthetic
- **Tone**: The shift to MALASH quiet luxury tokens (70% deep plum, 20% lilac and rose, 10% warm ivory `#f4ece1`) creates a calm, reverent atmosphere suited for an Islamic wedding greeting.
- **Palette**: Elimination of harsh pure whites (`#fff`) and blacks (`#000`) in favor of ivory (`#f4ece1`) and deep plum (`#12031c`) gives text and UI a velvety, editorial quality.
- **Surface treatment**: Stacked glass layers were flattened into clean 1px ivory borders (`var(--a-white18)`) with a single 8px backdrop blur.

---

## 2. Act-by-Act Assessment

### Act 1: Arrival & Home (`#home`)
- **Review**: The lantern and letter art styles provide distinct visual identities for the greeting. The glass hearts float with gentle asynchronous breathing (`animation: modal-breathe`).
- **Tuning**: Reduced title shadow and removed all gradient text. Sound toggle chip placed beside the enter action with matching pill styling.

### Act 2: The Letter (`#letter`) & Egg Modal
- **Review**: The 3D egg has an organic, warm presence with its radial gradient and soft rose glow.
- **Modal shared-element FLIP**: Card expands directly from the egg's current screen rectangle to the centered dialog.
- **Header lock**: The nameplate `"Machele & Salash"` in Sacramento script and subline `"To our dear newlyweds"` sit permanently fixed in the card header, preventing any content overlap on small screens.
- **Reopen behavior**: Once cracked, the egg remains interactive with faint glow hint and aria-label `"Open letter"`. Subsequent opens replay at 40% duration with faster text delivery.

### Act 3: Sky of Wishes (`#wishes`)
- **Review**: Two-column responsive grid with carrier icons (lantern in dark mode, kite in light mode).
- **Constellation surprise**: 3 subtle stars/dew-glints positioned without clutter. When triggered, the fine line-art spells `"MALASH'26"` before gently fading.

### Act 4: Journey (`#journey`)
- **Review**: Clean milestone cards with subtle arch motifs and warm ivory borders. Quotes breathe with generous line-height (1.65).

### Act 5: Names in Light (`#names`)
- **Review**: Balanced 2-column layout on desktop, stacking naturally on mobile. Arabic calligraphy in Amiri is given authentic line-height (1.9) preventing diacritic collisions.
- **Crescent surprise**: Tiny crescent sits unobtrusively in the verse card corner.

### Act 6: Farewell & Credits (`#farewell`)
- **Review**: Luxury wish card maker with canvas preview, keepsake PNG export, and credits footer for the GMSA-KNUST IT & Media teams.
- **Surprises**: Tail blessing (`#tail-line`) and EC Office seal button integrated cleanly.

---

## 3. Navigation & Controls Dock
- **Desktop**: Dock floats vertically at right edge, centered, with 6 stops, subtle stop numbers (`01`–`06`), and thin progress line with soft rose glow.
- **Mobile**: Collapses to bottom pill dock above safe-area inset.
- **Utility Cluster**: Compact pill at top right; collapses into single menu button on mobile (<760px).
- **Hit targets**: All interactive targets verified $\ge 44\text{px}$.

---

## 4. Key Fixes Applied in Round 1
1. **Modal Fast-Forward**: Added tap-to-fast-forward during opening animation.
2. **Reverse FLIP Target**: Dynamic re-measurement of the egg rect upon closing to ensure exact collapse coordinates.
3. **Glass Tick Synthesis**: Implemented non-tonal Web Audio procedural click (25ms click) for egg shard interaction.
4. **Dock event binding**: Fixed querySelector to attach smooth scroll to `.chapter-dock a`.
