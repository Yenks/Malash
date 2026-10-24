import { create } from 'zustand';
import { readPref, writePref } from './malash.js';

const modes = ['sideways', 'scroll'];
const urlTheme = new URLSearchParams(location.search).get('theme');
const savedTheme = readPref('theme', '');
export const useMalash = create((set, get) => ({
  act: 0, progress: 0, travelMode: modes.includes(readPref('travel-mode', 'sideways')) ? readPref('travel-mode', 'sideways') : 'sideways',
  theme: ['light','dark'].includes(urlTheme) ? urlTheme : (['light','dark'].includes(savedTheme) ? savedTheme : ((new Date().getHours() >= 18 || new Date().getHours() < 6) ? 'dark' : 'light')),
  sound: readPref('sound', 'false') === 'true', narration: readPref('narration', 'true') === 'true', auto: false,
  moments: { egg:'pending', tree:'pending', names:'pending', ameen:'pending' }, eggCracked: false, wishesRead: new Set(), secretsFound: new Set(), cardDraft: {},
  setAct: act => set({ act: Math.max(0, Math.min(5, act)), progress: Math.max(0, Math.min(1, act / 5)) }),
  setMode: travelMode => { writePref('travel-mode', travelMode); set({ travelMode }); },
  toggleTheme: () => { const theme = get().theme === 'dark' ? 'light' : 'dark'; writePref('theme', theme); set({ theme }); },
  toggleSound: () => { const sound = !get().sound; writePref('sound', String(sound)); set({ sound }); },
  toggleNarration: () => { const narration = !get().narration; writePref('narration', String(narration)); set({ narration }); },
  readWish: n => set(s => ({ wishesRead: new Set(s.wishesRead).add(n) })),
  findSecret: key => set(s => ({ secretsFound: new Set(s.secretsFound).add(key) })),
  crackEgg: () => set(s => ({ eggCracked:true, moments:{ ...s.moments, egg:'done' } })),
  reset: () => set({ act:0, progress:0, auto:false, moments:{egg:'pending',tree:'pending',names:'pending',ameen:'pending'}, eggCracked:false, wishesRead:new Set(), secretsFound:new Set(), cardDraft:{} }),
}));
