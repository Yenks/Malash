# MALASH 'Thank You' Experience Audit

## Baseline

Captured on 2026-10-24 before the polish pass, from the existing Vite application in `thank-you-experience/`. `npm run build` succeeds. `npm run dev` serves the app locally (the default port was occupied, so Vite selected 5174).

| Check | Baseline |
|---|---|
| 390 x 844 | No horizontal overflow. Arrival, letter, wishes, journey, and credits fit viewport height; Names content is internally scrollable (1062 px). |
| 360 x 640 | No horizontal overflow. Longer letter/names/credits content scrolls inside the act; Names is 1292 px tall. Wish modal opens and its close button receives focus. |
| 320 px width | No horizontal overflow in credits; footer is internally scrollable (743 px tall). |
| Desktop | App renders in the local Chromium browser. |
| Browser console | No runtime errors observed. Three.js emitted a deprecation warning for `THREE.Clock`. |
| FPS by act at 4x CPU / Slow 4G | Not measurable with the available browser automation surface: it exposes viewport and DOM controls, but not DevTools throttling or `requestAnimationFrame`/performance timing. Do not treat an unmeasured value as a pass. |
| Build output | Main JS 593,036 bytes (149,541 gzip / 123,590 Brotli); CSS 24,804 bytes (8,990 gzip / 7,900 Brotli). `dist/` total 1,693,392 bytes including compressed variants and fonts. |
| Accessibility | Theme and sound buttons have labels. Narration button may appear incorrectly: Vite's SPA fallback returns HTML with HTTP 200 for the missing narration path. Wish modal focuses close button but has no Escape close, focus trap, or focus restoration. Progress indicators are unlabeled spans. Reduced-motion CSS exists but Three.js continues animating. |
| Content/rules | Arabic strings are held in JSON and must remain untouched. User-facing strings remain hardcoded in `main.js`, including buttons and headings. `src/core/Audio.js` is orphaned and contains oscillator/chime code that violates the no-melodic-audio rule even though it is not imported. |
| Assets/performance | No model or texture assets are used, so Draco/Meshopt and WebP are not applicable. The experience has no per-act model loading; a shared Three.js scene persists. No FPS or three-replay memory-growth measurement is available from the browser surface. |

## Findings to address

- Verify narration by response content type, not only HTTP status.
- Add complete keyboard behavior and focus management to the wish dialog.
- Respect reduced motion in the Three.js loop and replace deprecated `THREE.Clock`.
- Move visible UI copy into the JSON content files without changing Arabic.
- Remove unused dependencies and orphaned legacy code, including the unused oscillator audio module.
- Improve animation timing, accessible progress labels, mobile spacing, and font loading where practical.
- Keep dynamic 3D effects restrained; no bloom/postprocessing on low-tier devices.

## Before / after

| Measure | Before | After |
|---|---|---|
| Build | Pass | Pass (`npm run build`, Vite 8.3.5) |
| 390 x 844 horizontal overflow | None | None in current browser session |
| 360 x 640 horizontal overflow | None | Prior matrix: none |
| 320 px credits horizontal overflow | None | Prior matrix: none |
| Browser runtime errors | 0 observed | 0 errors or warnings in current tab |
| Letter/name intersection | Not present in baseline | Runtime `data-letter-overlap=false`; prior viewport matrix passed |
| Main JS raw / gzip | 593,036 / 149,541 bytes | 729,224 / 200,812 bytes |
| CSS raw / gzip | 24,804 / 8,990 bytes | 19,904 / 4,815 bytes |
| Full `dist/` | 1,693,392 bytes | 1,375,352 bytes including fonts and compressed sidecars |
| First-load transfer estimate | Not recorded | about 355 KB gzip for HTML, JS, CSS and local fonts; no external runtime assets |
| Throttled FPS / replay memory | Not measurable with available tooling | Still not measurable; no CPU/network throttle or heap sampling API exposed |

## Limitations

The browser control available in this session does not expose Chrome DevTools CPU/network throttling, viewport resizing in this final pass, frame-timing APIs, or heap sampling. Requested 4x CPU / Slow 4G, FPS, and three-restart / ten-theme memory figures therefore cannot be reported honestly. A prior recorded responsive sweep covered 12 viewport shapes in both themes; see `thank-you-experience/RESPONSIVE_REPORT.md`. No approved narration or ambient audio files and no committee logo file are present. The Sound and Narration preference controls persist their state, but there is no sound playback or narration track to switch on; do not interpret the controls as verified playback.

The current bundle fits the configured 220 KB gzip JS and 12 KB gzip CSS budgets, and the full built output is under the 3 MB first-load budget. The project uses procedural Three.js geometry rather than downloaded models or textures, so Draco, Meshopt, WebP texture checks are not applicable. BLOOM/HORIZON homepage variants remain out of this first tier, and no real audio, logo, or video clips were fabricated.
