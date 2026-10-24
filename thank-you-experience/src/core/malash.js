import { gsap } from 'gsap';

export const MALASH = Object.freeze({
  colors: {
    accent: {
      plum: '#6E1450',
      magenta: '#7B4FBF',
      lavender: '#C9B8E8',
      lilac: '#C9B8E8',
      rose: '#F2B6E3',
      white: '#F4ECE1',
      ivory: '#F4ECE1',
      deepPlum: '#12031C',
    },
    dark: {
      sky0: '#2a0a3a',
      sky30: '#12031c',
      sky60: '#4b1456',
      sky85: '#c15ab0',
      sky100: '#fbe9f7',
      text: '#F4ECE1',
      ink: '#12031C',
      surface: '#260b30'
    },
    light: {
      sky0: '#fbe9f7',
      sky00: '#ffd9ec',
      sky30: '#f0cdf3',
      sky60: '#f6e4fb',
      sky100: '#ffe9c2',
      text: '#12031C',
      ink: '#6E1450',
      surface: '#F4ECE1'
    },
  },
  semantic: {
    ink: '#12031C',
    surface: '#260b30',
    paper: '#F4ECE1',
    paperEdge: '#e8dbce',
    fogDark: '#12031c',
    fogLight: '#f6e4fb'
  },
  alpha: {
    ink0: '#12031c00',
    ink55: '#12031c55',
    ink66: '#12031c66',
    ink88: '#12031c88',
    inkbb: '#12031cbb',
    inkcc: '#12031cdd',
    inkHeavy: '#12031cee',
    surface44: '#260b3044',
    surface55: '#260b3055',
    surface66: '#260b3066',
    surface88: '#260b3088',
    magenta55: '#7b4fbf55',
    magenta77: '#7b4fbf77',
    lilac55: '#c9b8e855',
    lilac77: '#c9b8e877',
    rose0d: '#f2b6e30d',
    rose33: '#f2b6e333',
    rose44: '#f2b6e344',
    rose55: '#f2b6e355',
    rose66: '#f2b6e366',
    rose77: '#f2b6e377',
    rose88: '#f2b6e388',
    rose99: '#f2b6e399',
    roseaa: '#f2b6e3aa',
    white22: '#f4ece122',
    white33: '#f4ece133',
    white44: '#f4ece144',
    white66: '#f4ece166',
    white99: '#f4ece199',
    whiteaa: '#f4ece1aa',
    whitecc: '#f4ece1cc',
    whitedd: '#f4ece1dd',
    whiteF7: '#f4ece1f7',
    whiteShort: '#f4ece177',
    whiteF9: '#f4ece1f9'
  },
  type: {
    xs: 'clamp(0.75rem, 0.72rem + 0.15vw, 0.85rem)',
    sm: 'clamp(0.875rem, 0.82rem + 0.25vw, 1rem)',
    md: 'clamp(1rem, 0.95rem + 0.35vw, 1.15rem)',
    lg: 'clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem)',
    title: 'clamp(2.5rem, 2rem + 4vw, 5rem)'
  },
  space: {
    1: '8px',
    2: '16px',
    3: '24px',
    4: '32px',
    5: '48px',
    6: '64px',
    8: '96px'
  },
  sizes: {
    target: '44px',
    icon: '1.25rem',
    hud: '4.5rem',
    content: '1120px',
    copy: '58ch',
    compact: '32rem',
    canvasWidth: '1080px',
    canvasHeight: '1350px'
  },
  camera: { homeZ: 12, midZ: 8, endZ: 4, homeY: 0, enterY: 1 },
  scroll: { damping: 0.08, autoplayPixelsPerSecond: 34, cameraBlendBase: 400, cameraBlendSlow: 900 },
  radius: { sm: '8px', md: '16px', lg: '24px', pill: '999px' },
  shadow: { glow: '0 0 2rem rgba(242, 182, 227, 0.25)', card: '0 1.5rem 5rem rgba(18, 3, 28, 0.45)' },
  motion: { instant: 90, fast: 180, base: 400, slow: 900, cinematic: 1600, epic: 2400, themeFallback: 600, restartFade: 600, restartIn: 900, soundCrossfade: 1200, reducedFade: 200 },
  ease: { standard: 'power2.out', enter: 'power3.out', exit: 'power2.in', move: 'power3.inOut', cinematic: 'expo.inOut', spring: 'back.out(1.4)' },
  stagger: { textLine: 80, listItem: 60, particleBurst: 12 },
});

export const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const duration = (ms) => prefersReducedMotion ? MALASH.motion.reducedFade : ms;

const style = document.createElement('style');
const cssVars = Object.entries(MALASH.colors.accent).map(([k, v]) => `--${k}:${v}`).join(';');
const darkVars = Object.entries(MALASH.colors.dark).map(([k, v]) => `--d-${k}:${v}`).join(';');
const lightVars = Object.entries(MALASH.colors.light).map(([k, v]) => `--l-${k}:${v}`).join(';');
const sizeVars = Object.entries(MALASH.sizes).map(([k, v]) => `--size-${k}:${v}`).join(';');
const semanticVars = Object.entries(MALASH.semantic).map(([k, v]) => `--${k}:${v}`).join(';');
const alphaVars = Object.entries(MALASH.alpha).map(([k, v]) => `--a-${k}:${v}`).join(';');
const typeVars = Object.entries(MALASH.type).map(([k, v]) => `--type-${k}:${v}`).join(';');
const spaceVars = Object.entries(MALASH.space).map(([k, v]) => `--space-${k}:${v}`).join(';');
style.textContent = `:root{${cssVars};${darkVars};${lightVars};${semanticVars};${alphaVars};${sizeVars};${typeVars};${spaceVars};--radius-sm:${MALASH.radius.sm};--radius-md:${MALASH.radius.md};--radius-lg:${MALASH.radius.lg};--radius-pill:${MALASH.radius.pill};--shadow-glow:${MALASH.shadow.glow};--shadow-card:${MALASH.shadow.card};--dur-instant:${MALASH.motion.instant}ms;--dur-fast:${MALASH.motion.fast}ms;--dur-base:${MALASH.motion.base}ms;--dur-slow:${MALASH.motion.slow}ms;--dur-cinematic:${MALASH.motion.cinematic}ms;--dur-theme-fallback:${MALASH.motion.themeFallback}ms;--dur-reduced:${MALASH.motion.reducedFade}ms;--ease-standard:${MALASH.ease.standard};--ease-enter:${MALASH.ease.enter};--ease-exit:${MALASH.ease.exit};--ease-move:${MALASH.ease.move};--ease-cinematic:${MALASH.ease.cinematic};--css-ease-standard:cubic-bezier(.25,.46,.45,.94);--css-ease-move:cubic-bezier(.65,0,.35,1);--css-ease-cinematic:cubic-bezier(.87,0,.13,1)}`;
document.head.append(style);

const defaults = { duration: duration(MALASH.motion.base) / 1000, ease: MALASH.ease.standard };
export function enter(el) { return gsap.fromTo(el, { y: prefersReducedMotion ? 0 : 16, autoAlpha: 0, filter: prefersReducedMotion ? 'none' : 'blur(6px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: prefersReducedMotion ? MALASH.motion.reducedFade / 1000 : MALASH.motion.slow / 1000, ease: MALASH.ease.enter }); }
export function exit(el) { return gsap.to(el, { y: prefersReducedMotion ? 0 : -16, autoAlpha: 0, filter: prefersReducedMotion ? 'none' : 'blur(6px)', duration: defaults.duration, ease: MALASH.ease.exit }); }
export function crossfade(a, b) { return gsap.timeline({ defaults }).to(a, { autoAlpha: 0 }, 0).fromTo(b, { autoAlpha: 0 }, { autoAlpha: 1 }, 0); }
export function pressFeedback(el) { if (!el) return; gsap.fromTo(el, { scale: .94 }, { scale: 1, duration: duration(MALASH.motion.fast) / 1000, ease: MALASH.ease.spring }); }
export function revealLines(el) { const lines = [...el.querySelectorAll('[data-reveal-line]')]; return gsap.fromTo(lines, { autoAlpha: 0, y: prefersReducedMotion ? 0 : 8 }, { autoAlpha: 1, y: 0, duration: prefersReducedMotion ? MALASH.motion.reducedFade / 1000 : MALASH.motion.base / 1000, stagger: MALASH.stagger.textLine / 1000, ease: MALASH.ease.enter }); }
