# MALASH'26 Clean Pass v2

## Status

Work is on `clean-pass-v2`, branched from `redesign-v2`. The vertical scroll scene structure was retained. The reusable modal, chapter dock, controls menu, quiet palette adjustments, and six surprise hooks are implemented. The modal was exercised in the available vertical preview. This pass is not fully verified against the requested acceptance matrix.

## Changes and tuning

- Added `MalashModal` in `thank-you-experience/src/core/malash-modal.js` and mounted it at `#modal-root`, a body-level sibling of `#ui-root`. It supports the letter and EC Office note, egg-origin FLIP open/close, a drawn SVG frame, reveal lines, fixed nameplate header, internally scrolling body, Escape/backdrop/close controls, focus trap and restoration, inert background, and body/wheel/touch/key scroll locking. Opening again uses 40% timing. Reduced motion uses the 200 ms token.
- Fixed the cracked egg path so it remains tappable and reopens the modal. The initial crack can be skipped by a tap. Scroll past the egg preserves its cracked state.
- Replaced the chapter rail with a six-stop dock, active indicator, progress line, and compact utility controls that collapse behind a menu at narrow widths. Mobile dock placement stays at the bottom; wider screens place it at the right edge.
- Added constellation, held-heart, tail blessing, crescent, egg-shard, and EC Office surprise targets. Each target is keyboard reachable; Enter/Space now activates the heart surprise. Hints use a 2.4 s half-cycle (4.8 s full pulse) and 0.85–1 opacity over the existing ivory alpha token (approximately 23–27% effective opacity). Secret state is in memory and the counter is shown for 3.2 s using the existing `cinematic × 2` duration.
- Updated the shared white token and config palette from `#ffffff` to `#f4ece1`; updated semantic paper from `#fffaf2f2` to `#f4ece1f2`, paper edge from `#f9eaf0eb` to `#f4ece1eb`, and all white alpha swatches to ivory equivalents. Added `white18` (`#f4ece12e`). The favicon's mask fill changed from `#000` to `#12031c`. The semantic ink was already `#12031c`.
- Modal card maximum width is 48 rem, maximum height 86dvh / 56 rem; body text line-height is 1.65. The modal backdrop uses the existing `ink88` tint (about 53% alpha), 10 px blur, and slow token. Card/frame/close sequencing uses the existing cinematic, slow, base and fast motion tokens and cinematic/standard/enter/exit easings.
- Preserved existing vertical act, sky, heart field, egg crack, wish reveal, names, Ameen effect, and card maker code. No Arabic or religious text was edited. Added the requested surprise and navigation copy fields; placeholder dua and EC text remain explicitly dummy content.

## Verification completed

- `npm run build` passed after the final keyboard and secret-pulse changes. Vite reported 741.17 kB raw JavaScript (206.23 kB gzip) and 29.00 kB raw CSS (6.35 kB gzip).
- In the open in-app browser at 521 × 604, verified three vertical modal reopen cycles in dark mode, with Escape and Close-button dismissal, correct `Machele & Salash` nameplate, focus returning to `egg-button`, and body lock removed after close.
- Switched to light theme and reopened the modal successfully once.
- `git diff` confirms the vertical page structure was not changed into snap sections. The repository has no horizontal travel mode or layout toggle to exercise.
- Search of tracked source and public assets for pure `#fff` / `#000` values found and replaced the white config, Bluesky clip mask, and favicon mask occurrences. Broader audio/asset rule compliance is outstanding.

## Critique notes

Manual critique of the available vertical preview: the nameplate stays in the modal header, long copy has a dedicated scroll region, the close action remains available, and the dock remains compact. Main follow-up risks are the very short in-app viewport (521 × 604), unverified tiny-screen dock spacing, and unmeasured contrast across the full sky transition. A two-round screenshot critique was not completed.

## Baseline and work intentionally left

- There is no local `main` ref in this repository, so `git diff main..redesign-v2` and a true `main`-based visual restore comparison were unavailable. No visual restore from `main` is claimed.
- The repository has only the vertical scroll layout. Horizontal travel, a mode toggle, panel track, and corresponding state-preservation paths do not exist here. Per scope instructions, no horizontal travel was reconstructed. Horizontal-mode modal/navigation/secret acceptance remains unverified and cannot pass in this checkout.
- The Impeccable installation command stalled without output under the restricted network and was cancelled. Therefore no Impeccable critique is claimed. The installed GSAP/Three skills were used as implementation references; the permitted Playwright install also stalled and was cancelled.
- Before/after screenshot matrices, `audit/critique-1.md`, `audit/critique-2.md`, viewport/contrast/performance tier testing, restart/theme-switch memory testing, reduced-motion and full backdrop/focus-trap tests, and Vercel deployment are not complete. Browser preview checks were manual, not automated Playwright tests. No screenshot files are present for baseline comparison.
- Existing `content.json` retains DUMMY values for the crescent dua and EC Office note. The real wishes, narration/audio assets, approved sounds, verified dua and imam review, logos, and final committee copy must be supplied/checked by the project owner. No sounds were added.

## Next required work

Provide or restore the expected horizontal-mode branch/code and a `main` ref, then complete Playwright screenshots and tests across the requested viewport/theme/layout matrix, fix any resulting issues, run performance and audio/asset audits, and deploy only after the remaining acceptance checks pass.
