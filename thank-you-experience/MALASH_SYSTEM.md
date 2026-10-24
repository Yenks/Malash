# MALASH design and motion system

`src/core/malash.js` is the source of truth for shared brand colors, semantic/alpha colors, type and spacing scales, common layout sizes, radii, shadows, durations, easing names, stagger intervals, camera positions, scroll damping and auto-scroll speed. CSS custom properties are generated from those values when the module loads. Add shared values there before using them in a scene or stylesheet.

## Motion

| Token | Value | Use |
|---|---:|---|
| instant | 90 ms | initial press |
| fast | 180 ms | small interaction and scrub damping |
| base | 400 ms | standard entrance/exit |
| slow | 900 ms | content entrances |
| cinematic | 1600 ms | theme and name reveals |
| epic | 2400 ms | large scene settling |
| reducedFade | 200 ms | reduced-motion opacity transitions |

Easing is named in `MALASH.ease`: standard `power2.out`, enter `power3.out`, exit `power2.in`, move `power3.inOut`, cinematic `expo.inOut`, spring `back.out(1.4)`. Linear easing is reserved for scroll-scrubbed camera movement. Staggers are also in the system object.

`enter`, `exit`, `crossfade`, `pressFeedback`, and `revealLines` are shared helpers. Keep DOM motion to transform, opacity and filter. Avoid persistent `will-change`. `prefers-reduced-motion` disables Lenis and camera travel and uses the 200 ms fade.

## Theme and contrast

Theme ramps live in `MALASH.colors.dark` and `MALASH.colors.light`; the transition reads the scroll progress and animates CSS custom properties and particle color. The source colors and computed central sky stops were checked at progress 0, .25, .5, .75, .9 and 1. Text uses white against the dark ramp until the dawn change and plum on light. A dark backing gradient is enabled around the dark dawn ramp. The computed central-stop contrast ratios recorded during implementation were at least 5.50:1 (dark) and 11.46:1 (light); these are calculations for the sampled interpolated stop and text color, not a claim about every transparent decoration or overlay.

## Maintenance notes

The stylesheet still contains local layout measurements for individual artwork and responsive rules, plus canvas drawing coordinates; CSS grammar also requires literal initial colors for `@property`. Shared palette, scales, key dimensions and motion values are tokenized, but this is not yet a literal token for every one-off spatial measurement. Extend the system before introducing new repeated values. Do not change Arabic strings while editing content. Do not add generated tonal audio.
