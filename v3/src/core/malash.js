import './tokens.css';

export const MALASH = Object.freeze({
  colors: {
    plum: '#6e1450', violet: '#7b4fbf', lavender: '#c9b8e8', rose: '#f2b6e3',
    ivory: '#f4ece1', ink: '#12031c', dark: ['#2a0a3a', '#12031c', '#4b1456', '#c15ab0', '#fbe9f7'],
    light: ['#fbe9f7', '#f0cdf3', '#f6e4fb', '#f6e4fb', '#ffe9c2'],
  },
  motion: { instant: 90, fast: 180, base: 400, slow: 900, cinematic: 1600, epic: 2400, reducedFade: 200 },
  ease: { standard: 'power2.out', enter: 'power3.out', exit: 'power2.in', move: 'power3.inOut', cinematic: 'expo.inOut', spring: 'back.out(1.4)' },
  stagger: { textLine: 80, listItem: 60 },
});

export function readPref(key, fallback) { try { return localStorage.getItem(`malash-${key}`) ?? fallback; } catch { return fallback; } }
export function writePref(key, value) { try { localStorage.setItem(`malash-${key}`, value); } catch {} }
