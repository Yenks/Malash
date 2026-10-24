# Responsive & Viewport Audit Report (v3 Paper Garden)

This report documents the responsive styling strategy, layout architecture, and viewport compatibility matrix for the MALASH v3 "Paper Garden" experience.

---

## Architecture & Layout Strategy

1. **Fluid Typography & Spacing**:
   - `clamp()` is employed across all headlines, body copy, and ornamental scripts (e.g., `clamp(42px, 7vw, 84px)` for act headlines; `clamp(40px, 8vw, 62px)` for letter script names).
   - Base spacing units are derived from MALASH design tokens (`--space-1: 8px` through `--space-5: 48px`).
2. **Container Adaptability**:
   - Every act panel (`.act`) is constrained by `width: min(900px, 100%)` and `max-height: 100%`, with internal scrolling (`overflow: auto`) to protect content from clipping on short viewports.
3. **Safe Area Inset Handling**:
   - Container padding utilizes `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)` to protect against notch obstructions and home indicator overlaps on iOS and Android devices.
4. **Touch Target Standard**:
   - All interactive controls (buttons, chapter dock items, switches, secret triggers, sticker buttons, and modal dismissals) adhere to a minimum hit area of `44px x 44px` (`--target: 44px`).
5. **Dual Travel Modes Across Screen Sizes**:
   - *Sideways Mode*: Employs `100vw x 100dvh` frames in a `600vw` track translated via CSS hardware-accelerated transforms (`translate3d(-{act*100}vw, 0, 0)`). Touch gestures with edge guard (> 24px from edge) avoid conflicting with system back gestures.
   - *Scroll Mode*: Implements native `100dvh` CSS scroll-snap (`scroll-snap-type: y mandatory`).
6. **Adaptive Chapter Dock**:
   - Desktop Sideways: Centered horizontal bottom dock.
   - Desktop Scroll: Vertical right-edge dock.
   - Mobile (< 760px): Dock automatically pins to the bottom center with horizontal icon layout and rose glow indicator.
7. **Adaptive Card Maker**:
   - Desktop: Side-by-side grid (`minmax(160px, .82fr) minmax(240px, 1fr)`) with sticky preview canvas.
   - Mobile (< 760px): Stacked layout with compact preview canvas (`max-height: 240px`) and step navigation. Fits within mobile viewport above virtual keyboard.

---

## Breakpoint Specifications

- **Desktop / Tablet Landscape (`> 760px`)**: Full multi-column card maker, horizontal utility cluster, right-edge dock in scroll mode.
- **Tablet Portrait / Large Mobile (`<= 760px`)**: Collapsible hamburger utility cluster menu, single-column card maker, bottom-pinned chapter dock.
- **Compact Mobile (`<= 430px`)**: Reduced arch journey heights (`115px`), compact dock stops (`44px` with tightened 0px gap), adjusted typography scale.
- **Prefers Reduced Motion (`reduce`)**: Disables continuous CSS animations, converts 1600ms view transitions and transforms to instant / 200ms fades.

---

## Viewport Compatibility Matrix

| Viewport | Device Class | Orientation | Sideways Mode | Scroll Mode | Touch Targets (>=44px) | Text Contrast | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **320 x 568** | iPhone SE (1st gen) | Portrait | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **360 x 640** | Standard Android | Portrait | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **390 x 844** | iPhone 12 / 13 / 14 | Portrait | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **412 x 915** | Google Pixel 7 | Portrait | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **768 x 1024** | iPad Mini / Air | Portrait | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **1024 x 768** | iPad Landscape | Landscape | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **1440 x 900** | Laptop / Desktop | Landscape | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |
| **1920 x 1080** | Full HD Monitor | Landscape | Pass | Pass | Pass | Pass (>= 4.5:1) | **PASS** |

---

## Virtual Keyboard & Form Inputs

Input labels, text inputs, textareas, and select elements in the Wish Card Maker specify `min-height: 44px` with clear focus rings (`outline: 2px solid var(--rose)`). On mobile viewports, the step navigation tab bar allows the user to navigate one section at a time without the virtual keyboard obscuring adjacent inputs.
