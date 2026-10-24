import { gsap } from 'gsap';

export const MALASH = Object.freeze({
  colors: {
    accent: { plum: '#3a0d44', magenta: '#7b2a86', lilac: '#d9a6e0', rose: '#f2b6e3', white: '#ffffff' },
    dark: { sky0: '#2a0a3a', sky30: '#12031c', sky60: '#4b1456', sky85: '#c15ab0', sky100: '#fbe9f7', text: '#ffffff', ink: '#3a0d44', surface: '#260b30' },
    light: { sky0: '#fbe9f7', sky00: '#ffd9ec', sky30: '#f0cdf3', sky60: '#f6e4fb', sky100: '#ffe9c2', text: '#3a0d44', ink: '#3a0d44', surface: '#ffffff' },
  },
  semantic: { ink: '#12031c', surface: '#260b30', paper: '#fffaf2f2', paperEdge: '#f9eaf0eb', fogDark: '#200b30', fogLight: '#f6e4fb' },
  alpha: { ink0:'#12031c00', ink55:'#12031c55', ink66:'#12031c66', ink88:'#12031c88', inkbb:'#12031cbb', inkcc:'#12031cdd', inkHeavy:'#12031cee', surface44:'#260b3044', surface55:'#260b3055', surface66:'#260b3066', surface88:'#260b3088', magenta55:'#7b2a8655', magenta77:'#7b2a8677', lilac55:'#d9a6e055', lilac77:'#d9a6e077', rose0d:'#f2b6e30d', rose33:'#f2b6e333', rose44:'#f2b6e344', rose55:'#f2b6e355', rose66:'#f2b6e366', rose77:'#f2b6e377', rose88:'#f2b6e388', rose99:'#f2b6e399', roseaa:'#f2b6e3aa', white22:'#ffffff22', white33:'#ffffff33', white44:'#ffffff44', white66:'#ffffff66', white99:'#ffffff99', whiteaa:'#ffffffaa', whitecc:'#ffffffcc', whitedd:'#ffffffdd', whiteF7:'#fffffff7', whiteShort:'#ffffff77', whiteF9:'#fffffff9' },
  type: { xs: 'clamp(.72rem, .68rem + .15vw, .82rem)', sm: 'clamp(.84rem, .78rem + .25vw, 1rem)', md: 'clamp(1rem, .9rem + .45vw, 1.25rem)', lg: 'clamp(1.5rem, 1.15rem + 2vw, 3rem)', title: 'clamp(2.6rem, 10vw, 6rem)' },
  space: { 1: 'clamp(.35rem, .3rem + .2vw, .55rem)', 2: 'clamp(.65rem, .5rem + .5vw, 1rem)', 3: 'clamp(1rem, .7rem + .9vw, 1.75rem)', 4: 'clamp(1.5rem, 1rem + 1.5vw, 2.75rem)', 5: 'clamp(2rem, 1.2rem + 3vw, 4rem)' },
  sizes: { target: '44px', icon: '1.15rem', hud: '4.5rem', content: '68rem', copy: '48rem', compact: '32rem', canvasWidth: '1080px', canvasHeight: '1350px' },
  camera: { homeZ: 12, midZ: 8, endZ: 4, homeY: 0, enterY: 1 },
  scroll: { damping: .08, autoplayPixelsPerSecond: 34, cameraBlendBase: 400, cameraBlendSlow: 900 },
  radius: { sm: '.5rem', md: '1rem', lg: '1.5rem', pill: '999px' },
  shadow: { glow: '0 0 2rem #f2b6e344', card: '0 1.5rem 5rem #12031c44' },
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
