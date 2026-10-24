import './styles/main.css';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import content from './data/content.json';
import credits from './data/credits.json';
import { MALASH, prefersReducedMotion, duration, enter, exit, pressFeedback, revealLines } from './core/malash.js';
import { MalashModal } from './core/malash-modal.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s);
const escapeHTML = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const safeGet = (key, fallback) => { try { const v = localStorage.getItem(key); return v == null ? fallback : v; } catch { return fallback; } };
const safeSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const query = new URLSearchParams(location.search);
const themes = ['light', 'dark'];
const storedTheme = safeGet('malash-theme', 'auto');
const defaultTheme = (new Date().getHours() >= 18 || new Date().getHours() < 6) ? 'dark' : 'light';
const homeVariants = ['star', 'lantern', 'letter', 'bloom', 'horizon'];
const requestedHome = query.get('home');
const state = {
  theme: themes.includes(query.get('theme')) ? query.get('theme') : (themes.includes(storedTheme) ? storedTheme : defaultTheme),
  sound: safeGet('malash-sound', 'true') === 'true',
  narration: safeGet('malash-narration', 'true') === 'true',
  auto: false, egg: 'pending', names: 'pending', read: new Set(), started: false,
  home: homeVariants.includes(requestedHome) ? requestedHome : 'star',
};

const chapterIds = ['home', 'letter', 'wishes', 'journey', 'names', 'farewell'];
const chapterIcons = ['home', 'mail', 'heart', 'sparkles', 'moon-star', 'send'];

let scene, camera, renderer, lenis, frame = 0, eggSequenceTl, holdTween, holdStartTime = 0, lastTapTime = 0, hintTimeout = null;
let autoFrame = 0, autoVelocity = 0, autoTarget = 0, lastAuto = 0, scrollEventsBound = false, letterObserver, namesTimeline;
let egg3dGroup, leftShell, rightShell, waxSealMesh, innerEggLight, eggShardsGroup, heartsGroup, heroHeartMesh;
const root = $('#ui-root');
const malashModal = new MalashModal();
const darkSky = [MALASH.colors.dark.sky0, MALASH.colors.dark.sky30, MALASH.colors.dark.sky60, MALASH.colors.dark.sky85, MALASH.colors.dark.sky100];
const lightSky = [MALASH.colors.light.sky00, MALASH.colors.light.sky30, MALASH.colors.light.sky60, MALASH.colors.light.sky60, MALASH.colors.light.sky100];

/* ==========================================================================
   PROCEDURAL NATURAL AUDIO (Web Audio API - no music, instruments or singing)
   ========================================================================== */
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playCrack() {
  if (!state.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const dur = 0.025;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(3.5, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (_) {}
}

function playPaper() {
  if (!state.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const dur = 0.24;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.sin((i / bufferSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env * 0.18;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(1600, ctx.currentTime + dur);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (_) {}
}

function playWhoosh() {
  if (!state.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const dur = 0.36;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + dur * 0.4);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (_) {}
}

function playGlassTick() {
  if (!state.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.025);
  } catch (_) {}
}

/* ==========================================================================
   WAX SEAL PROCEDURAL TEXTURE
   ========================================================================== */
function createWaxSealTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#6e1450';
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c9b8e8';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = '#f2b6e3';
  ctx.beginPath();
  ctx.arc(128, 128, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6e1450';
  ctx.beginPath();
  ctx.arc(146, 122, 54, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f2b6e3';
  ctx.beginPath();
  ctx.moveTo(122, 120);
  ctx.bezierCurveTo(122, 114, 114, 110, 108, 116);
  ctx.bezierCurveTo(102, 110, 94, 114, 94, 120);
  ctx.bezierCurveTo(94, 128, 108, 136, 108, 136);
  ctx.bezierCurveTo(108, 136, 122, 128, 122, 120);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function svg(name) {
  const p = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 4a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
    mute: '<path d="M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
    voice: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0m-7 7v5m-4 0h8"/>',
    play: '<path d="m8 5 12 7-12 7V5Z"/>',
    pause: '<path d="M8 5v14m8-14v14"/>',
    restart: '<path d="M3 12a9 9 0 1 0 2.64-6.36L3 8m0-5v5h5"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    'moon-star': '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/>',
    'hand-heart': '<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8L15 13"/><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name] || p.sparkles}</svg>`;
}

function iconButton(id, label, icon, pressed) {
  return `<button class="icon-button" id="${id}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}" ${pressed == null ? '' : `aria-pressed="${pressed}"`}>${svg(icon)}</button>`;
}

/* ==========================================================================
   NAV DOCK & TOP UTILITY PILL (PART E)
   ========================================================================== */
function navDock() {
  return `
    <nav class="chapter-dock chapter-rail" aria-label="Chapter navigation">
      <div class="dock-track" aria-hidden="true">
        <div class="dock-progress-fill" id="dock-progress"></div>
      </div>
      <div class="dock-pill">
        <div class="dock-active-indicator" id="dock-indicator" aria-hidden="true"></div>
        ${chapterIds.map((id, i) => `
          <a href="#${id}" data-chapter="${id}" data-index="${i}" class="dock-item ${i === 0 ? 'active' : ''}" aria-label="${escapeHTML(content.chapters[i])}" title="${escapeHTML(content.chapters[i])}">
            <span class="dock-icon">${svg(chapterIcons[i])}</span>
            <span class="dock-label">${escapeHTML(content.chapters[i])}</span>
          </a>
        `).join('')}
      </div>
    </nav>
  `;
}

function utilityPill() {
  return `
    <div class="utility-pill" id="utility-pill" aria-label="Quick controls">
      <div class="utility-controls">
        ${iconButton('sound-toggle', state.sound ? content.home.soundOn : content.home.soundOff, state.sound ? 'sound' : 'mute', state.sound)}
        ${iconButton('narration-toggle', state.narration ? content.ui.narrationOn : content.ui.narrationOff, 'voice', state.narration)}
        ${iconButton('theme-toggle', content.ui.themeToggle, state.theme === 'dark' ? 'sun' : 'moon')}
        ${iconButton('auto-toggle', state.auto ? content.ui.pause : content.ui.autoPlay, state.auto ? 'pause' : 'play', state.auto)}
        ${iconButton('restart', content.ui.restart, 'restart')}
      </div>
    </div>
  `;
}

/* ==========================================================================
   ACT 0: HOME / BEGINNING
   ========================================================================== */
function home() {
  const isStar = state.home === 'star';
  return `
    <section id="home" class="page home-page home-${escapeHTML(state.home)}" data-page="0">
      ${isStar ? `
        <div class="home-star-frame" id="home-star-frame" aria-hidden="true">
          <svg class="home-star-svg" viewBox="0 0 100 100">
            <path d="M 50 6 L 61 23 L 81 19 L 77 39 L 94 50 L 77 61 L 81 81 L 61 77 L 50 94 L 39 77 L 19 81 L 23 61 L 6 50 L 23 39 L 19 19 L 39 23 Z"/>
          </svg>
        </div>
      ` : state.home === 'lantern' ? `
        <div class="home-variant-frame home-lantern-frame" aria-hidden="true">
          <span class="home-motif-icon">${svg('lantern')}</span>
        </div>
      ` : state.home === 'letter' ? `
        <div class="home-variant-frame home-letter-frame" aria-hidden="true">
          <span class="home-motif-icon">${svg('mail')}</span>
        </div>
      ` : state.home === 'bloom' ? `
        <div class="home-variant-frame home-bloom-frame" aria-hidden="true">
          <span class="home-motif-icon">${svg('sparkles')}</span>
        </div>
      ` : `
        <div class="home-variant-frame home-horizon-frame" aria-hidden="true">
          <span class="home-motif-icon">${svg('moon-star')}</span>
        </div>
      `}
      <div class="home-content">
        <p class="eyebrow">GMSA-KNUST presents</p>
        <h1>${escapeHTML(content.home.title)}</h1>
        <p class="home-subline">${escapeHTML(content.home.subline)}</p>
        <div class="home-actions">
          <button class="action-button primary" id="enter-button">${escapeHTML(content.home.enter)}</button>
          <button class="sound-chip" id="home-sound" aria-label="${escapeHTML(state.sound ? content.home.soundOn : content.home.soundOff)}">
            ${svg(state.sound ? 'sound' : 'mute')}
            <span>${escapeHTML(state.sound ? content.home.soundOn : content.home.soundOff)}</span>
          </button>
        </div>
        <div class="scroll-cue" id="scroll-cue" hidden>
          <span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg></span>
          <span>${escapeHTML(content.home.scrollCue)}</span>
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   ACT 1: THE LETTER
   ========================================================================== */
function letter() {
  return `
    <section id="letter" class="page letter-page" data-page="1">
      <div class="act-wrap letter-wrap">
        <p class="eyebrow">${escapeHTML(content.ui.letterEyebrow)}</p>
        <p class="nameplate" id="letter-name">${escapeHTML(content.letter.addressee)}</p>
        <p class="greeting-header">${escapeHTML(content.letter.greetingHeader)}</p>
        
        <button class="egg ${state.egg === 'done' ? 'cracked' : ''}" id="egg-button" aria-label="${escapeHTML(state.egg === 'done' ? 'Open letter' : content.letter.sealHint)}" aria-expanded="${state.egg === 'done'}">
          <svg class="egg-progress-ring" viewBox="0 0 160 210" aria-hidden="true">
            <ellipse cx="80" cy="105" rx="74" ry="98" pathLength="100"/>
          </svg>
          <span class="egg-shard"></span>
          <span class="egg-shard"></span>
          <span class="egg-shard"></span>
          <span class="egg-shard"></span>
          <span class="egg-shard"></span>
          <span class="egg-shard"></span>
          <span class="egg-shard"></span>
          <span class="egg-core"></span>
          <span class="egg-ring" aria-hidden="true"></span>
          <span class="egg-label">${escapeHTML(state.egg === 'done' ? 'Open letter' : content.letter.sealHint)}</span>
          <div class="egg-hold-hint" id="egg-hold-hint">Hold to open</div>
        </button>
        <div class="overlap-status sr-only" aria-live="polite" id="layout-status"></div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   ACT 2: WISHES
   ========================================================================== */
function wishes() {
  return `
    <section id="wishes" class="page wishes-page" data-page="2">
      <div class="act-wrap">
        <p class="eyebrow">${escapeHTML(content.ui.wishesEyebrow)}</p>
        <h2>${escapeHTML(content.wishes.sectionTitle)}</h2>
        <p class="hint">${escapeHTML(content.wishes.tapHint)}</p>
        <p class="read-count" id="read-count" aria-live="polite">
          ${svg('heart')}
          <span class="count-text">0 of ${content.wishes.items.length} wishes read</span>
        </p>
        <div class="wish-grid">
          ${content.wishes.items.map((w, i) => `
            <article class="wish-item">
              <button class="carrier ${state.theme === 'light' ? 'kite' : 'lantern'}" data-wish="${i}" aria-expanded="${state.read.has(i)}" aria-label="${escapeHTML(content.ui.wishFrom.replace('{name}', w.from))}">
                <span>${String(i + 1).padStart(2, '0')}</span>
              </button>
              <div class="wish-copy ${state.read.has(i) ? 'is-open' : ''}" id="wish-copy-${i}">
                <p>${escapeHTML(w.text)}</p>
                <small>${escapeHTML(w.from)}</small>
              </div>
            </article>
          `).join('')}
        </div>
        <details class="all-wishes">
          <summary>${escapeHTML(content.wishes.allWishesLabel)}</summary>
          <ol>
            ${content.wishes.items.map(w => `<li><q>${escapeHTML(w.text)}</q> <span>${escapeHTML(w.from)}</span></li>`).join('')}
          </ol>
        </details>
      </div>
    </section>
  `;
}

/* ==========================================================================
   ACT 3: THREE PRAYERS (PART D REBUILD)
   ========================================================================== */
function prayers() {
  const p = content.threePrayers || {
    label: "Our prayer for you",
    title: "Three things we pray for your home",
    items: []
  };
  return `
    <section id="journey" class="page prayers-page" data-page="3">
      <div class="act-wrap">
        <p class="eyebrow">${escapeHTML(p.label)}</p>
        <h2 class="prayers-title">${escapeHTML(p.title)}</h2>
        <div class="prayers-grid">
          ${p.items.map((item, i) => `
            <article class="prayer-card" data-prayer="${i}">
              <div class="prayer-arch-wrap" aria-hidden="true">
                <svg class="arch-svg" viewBox="0 0 180 260" preserveAspectRatio="none">
                  <path class="arch-path" d="M 10 255 V 90 A 80 80 0 0 1 170 90 V 255" pathLength="100"/>
                </svg>
                <div class="prayer-icon">${svg(item.icon)}</div>
              </div>
              <h3 class="prayer-name">${escapeHTML(item.name)}</h3>
              <p class="prayer-meaning">${escapeHTML(item.meaning)}</p>
              <p class="prayer-line">${escapeHTML(item.line)}</p>
            </article>
          `).join('')}
        </div>
        <p class="journey-quote">${escapeHTML(content.couple.journeyLine)}</p>
      </div>
    </section>
  `;
}

/* ==========================================================================
   ACT 4: NAMES IN LIGHT (PART C REBUILD - SINGLE CALM SEQUENCE)
   ========================================================================== */
function names() {
  return `
    <section id="names" class="page names-page" data-page="4">
      <div class="act-wrap names-wrap">
        <p class="eyebrow blessing-lead">${escapeHTML(content.names.lead)}</p>
        
        <div class="names-sequence">
          <div class="script-names-row">
            <p class="script-name" data-name-line>${escapeHTML(content.couple.groomShort)}</p>
            <span class="ampersand">&amp;</span>
            <p class="script-name" data-name-line>${escapeHTML(content.couple.brideShort)}</p>
          </div>
          <p class="merged-name">${escapeHTML(content.couple.merged)}</p>
          <div class="star-pattern" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <path d="M50 4 61 39 96 50 61 61 50 96 39 61 4 50 39 39Z M50 17 57 43 83 50 57 57 50 83 43 57 17 50 43 43Z"/>
            </svg>
          </div>
        </div>

        <article class="blessing-sheet">
          <p class="verse-ref">${escapeHTML(content.names.verseReference)}</p>
          <p class="arabic verse-ar" lang="ar" dir="rtl">${content.names.verseArabic}</p>
          <p class="verse-translation">${escapeHTML(content.names.verseTranslation)}</p>
          <div class="sheet-divider" aria-hidden="true"></div>
          <p class="arabic dua-ar" lang="ar" dir="rtl">${content.names.duaArabic}</p>
          <p class="dua-transliteration">${escapeHTML(content.names.duaTransliteration)}</p>
          <p class="dua-translation">${escapeHTML(content.names.duaTranslation)}</p>
          <small class="dua-source">${escapeHTML(content.names.duaSource)}</small>
        </article>

        <div class="ameen-section">
          <button class="action-button primary ameen-button" id="ameen-button">${escapeHTML(content.ameen.button)}</button>
          <p class="ameen-hint">${escapeHTML(content.ameen.hint)}</p>
          <i id="ameen-light" aria-hidden="true"></i>
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   ACT 5: FAREWELL
   ========================================================================== */
function farewell() {
  return `
    <section id="farewell" class="page farewell-page" data-page="5">
      <div class="act-wrap farewell-wrap">
        <p class="eyebrow">${escapeHTML(content.farewell.closingLine)}</p>
        <h2 class="farewell-title">Machele <span>&amp;</span> Salash</h2>
        
        <section class="card-maker">
          <h3>${escapeHTML(content.wishCard.title)}</h3>
          <label>
            ${escapeHTML(content.wishCard.namePlaceholder)}
            <input id="card-name" maxlength="30" autocomplete="name" />
          </label>
          <label>
            ${escapeHTML(content.wishCard.wishPlaceholder)}
            <textarea id="card-wish" maxlength="140" rows="3"></textarea>
          </label>
          <div class="card-actions">
            <button class="action-button primary" id="create-card">${escapeHTML(content.wishCard.create)}</button>
            <button class="action-button secondary" id="save-card" disabled>${escapeHTML(content.wishCard.save)}</button>
            <button class="action-button secondary" id="share-card" disabled>${escapeHTML(content.wishCard.share)}</button>
          </div>
          <p class="card-tip">${escapeHTML(content.wishCard.tip)}</p>
          <canvas id="wish-card-canvas" width="1080" height="1350" aria-label="Wish card preview"></canvas>
        </section>

        <div class="farewell-actions">
          <button class="action-button secondary" id="share-link">${escapeHTML(content.farewell.shareLabel)}</button>
          <button class="action-button primary" id="keepsake">${escapeHTML(content.keepsake.buttonLabel)}</button>
        </div>

        <footer class="credits-footer">
          <div class="logos">
            <img src="${credits.logos.association}" alt="${escapeHTML(credits.logoGmsaAlt)}" onerror="this.outerHTML='<span class=&quot;logo-placeholder&quot;>${credits.logoGmsaPlaceholder}</span>'">
            <img src="${credits.logos.committee}" alt="${escapeHTML(credits.logoCommitteeAlt)}" onerror="this.outerHTML='<span class=&quot;logo-placeholder committee-placeholder&quot;>${credits.logoCommitteePlaceholder}</span>'">
          </div>
          <h3>${escapeHTML(credits.heading)}</h3>
          <p>${escapeHTML(credits.subheading)}</p>
          <p>${escapeHTML(credits.madeForLine)}</p>
          <small>${credits.builtWith.map(escapeHTML).join(' · ')}</small>
        </footer>
      </div>
    </section>
  `;
}

function render() {
  root.innerHTML = navDock() + utilityPill() + home() + letter() + wishes() + prayers() + names() + farewell();
  bind();
  updateDockPosition(0);
}

/* ==========================================================================
   3D SCENE & KEEP-OUT ZONES (PART B)
   ========================================================================== */
function init3d() {
  const canvas = $('#webgl-canvas');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !(navigator.deviceMemory && navigator.deviceMemory <= 4), powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, navigator.deviceMemory && navigator.deviceMemory <= 4 ? 1.25 : 1.75));
    renderer.setSize(innerWidth, innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 52 : 42, innerWidth / innerHeight, .1, 100);
    camera.position.set(0, MALASH.camera.homeY, MALASH.camera.homeZ);

    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    } catch (_) {}

    scene.add(new THREE.AmbientLight(MALASH.colors.accent.white, 1.4));
    const glow = new THREE.PointLight(MALASH.colors.accent.rose, 10, 28);
    glow.position.set(-2, 3, 5);
    scene.add(glow);

    // 3D floating glass heart centered over signature homepage
    const heroShape = new THREE.Shape();
    heroShape.moveTo(0, -0.2);
    heroShape.bezierCurveTo(-0.24, -0.01, -0.48, 0.18, -0.46, 0.42);
    heroShape.bezierCurveTo(-0.44, 0.65, -0.16, 0.68, 0, 0.44);
    heroShape.bezierCurveTo(0.16, 0.68, 0.44, 0.65, 0.46, 0.42);
    heroShape.bezierCurveTo(0.48, 0.18, 0.24, -0.01, 0, -0.2);
    const heroGeo = new THREE.ExtrudeGeometry(heroShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    });
    heroGeo.center();

    const isLowTier = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const glassHeartMat = isLowTier
      ? new THREE.MeshStandardMaterial({
          color: 0xF2B6E3,
          roughness: 0.25,
          metalness: 0.1,
          transparent: true,
          opacity: 0.8,
          emissive: 0x6E1450,
          emissiveIntensity: 0.2
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0xF4ECE1,
          roughness: 0.08,
          metalness: 0.04,
          transmission: 0.94,
          thickness: 1.3,
          ior: 1.46,
          attenuationColor: new THREE.Color(0xF2B6E3),
          attenuationDistance: 1.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.06,
          emissive: 0x7B4FBF,
          emissiveIntensity: 0.1,
          transparent: true
        });

    heroHeartMesh = new THREE.Mesh(heroGeo, glassHeartMat);
    heroHeartMesh.scale.set(1.4, 1.4, 1.4);
    scene.add(heroHeartMesh);

    // Floating hearts with strict keep-out zone: margins (|x| > 3.6) and behind content (z <= -4)
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.16);
    shape.bezierCurveTo(-0.16, -0.01, -0.34, 0.13, -0.33, 0.31);
    shape.bezierCurveTo(-0.32, 0.49, -0.12, 0.51, 0, 0.33);
    shape.bezierCurveTo(0.12, 0.51, 0.32, 0.49, 0.33, 0.31);
    shape.bezierCurveTo(0.34, 0.13, 0.16, -0.01, 0, -0.16);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 });
    geo.center();
    const mat = new THREE.MeshStandardMaterial({
      color: MALASH.colors.accent.rose,
      roughness: 0.4,
      metalness: 0.05,
      transparent: true,
      opacity: 0.35, // subtle behind content
      emissive: MALASH.colors.accent.plum,
      emissiveIntensity: 0.15
    });

    heartsGroup = new THREE.Group();
    for (let i = 0; i < 12; i++) {
      const h = new THREE.Mesh(geo, mat);
      const side = i % 2 === 0 ? 1 : -1;
      const x = side * (3.8 + Math.random() * 4.5);
      const y = (Math.random() - 0.5) * 8;
      const z = -4 - Math.random() * 8;
      const scale = 0.5 + Math.random() * 0.4;
      h.scale.set(scale, scale, scale);
      h.position.set(x, y, z);
      h.userData.phase = Math.random() * 8;
      h.userData.baseY = y;
      h.userData.baseX = x;
      heartsGroup.add(h);
    }
    scene.add(heartsGroup);

    // Stars
    const count = navigator.deviceMemory && navigator.deviceMemory <= 4 ? 180 : 520, positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = -Math.random() * 20;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: state.theme === 'dark' ? MALASH.colors.accent.rose : MALASH.colors.accent.magenta,
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      blending: state.theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    })));

    // 3D LatheGeometry Egg with Pearl finish & Wax Seal
    const eggPts = [];
    for (let deg = 0; deg <= 180; deg += 3) {
      const rad = (deg * Math.PI) / 180;
      const y = -Math.cos(rad) * 1.35;
      const x = Math.sin(rad) * (1 + 0.18 * Math.cos(rad)) * 0.95;
      eggPts.push(new THREE.Vector2(x, y));
    }

    const isLowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
    const eggMaterial = isLowMem
      ? new THREE.MeshStandardMaterial({
          color: 0xf4ece1,
          roughness: 0.35,
          metalness: 0.1,
          emissive: 0x3a0d44,
          emissiveIntensity: 0.05
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0xf4ece1,
          roughness: 0.22,
          metalness: 0.05,
          clearcoat: 0.88,
          clearcoatRoughness: 0.12,
          iridescence: 0.68,
          iridescenceIOR: 1.3,
          emissive: 0x3a0d44,
          emissiveIntensity: 0.05
        });

    const leftGeo = new THREE.LatheGeometry(eggPts, 32, -Math.PI / 2, Math.PI);
    const rightGeo = new THREE.LatheGeometry(eggPts, 32, Math.PI / 2, Math.PI);

    leftShell = new THREE.Mesh(leftGeo, eggMaterial);
    rightShell = new THREE.Mesh(rightGeo, eggMaterial);

    const sealGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.04, 32);
    sealGeo.rotateX(Math.PI / 2);
    const sealMat = new THREE.MeshStandardMaterial({
      map: createWaxSealTexture(),
      roughness: 0.35,
      metalness: 0.2
    });
    waxSealMesh = new THREE.Mesh(sealGeo, sealMat);
    waxSealMesh.position.set(0, 0, 0.94);

    innerEggLight = new THREE.PointLight(0xffdfba, 0, 8);
    innerEggLight.position.set(0, 0, 0.2);

    eggShardsGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const sMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.12),
        new THREE.MeshStandardMaterial({ color: 0xf2b6e3, roughness: 0.3, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      );
      sMesh.position.set((Math.random() - 0.5) * 0.8, -0.6 + Math.random() * 0.4, 0.4 + Math.random() * 0.4);
      sMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      eggShardsGroup.add(sMesh);
    }

    egg3dGroup = new THREE.Group();
    egg3dGroup.add(leftShell);
    egg3dGroup.add(rightShell);
    egg3dGroup.add(waxSealMesh);
    egg3dGroup.add(innerEggLight);
    egg3dGroup.add(eggShardsGroup);
    egg3dGroup.scale.set(0.85, 0.85, 0.85);
    scene.add(egg3dGroup);

    let t = 0;
    const tick = () => {
      if (!renderer || document.hidden) return;
      frame = requestAnimationFrame(tick);
      t += 0.01;
      if (!prefersReducedMotion && heartsGroup) {
        heartsGroup.children.forEach(h => {
          h.position.y = h.userData.baseY + Math.sin(t + h.userData.phase) * 0.15;
          h.rotation.y = Math.sin(t * 0.3 + h.userData.phase) * 0.15;
        });
      }
      updateEggPosition3D(t);
      renderer.render(scene, camera);
    };

    if (!prefersReducedMotion) tick(); else renderer.render(scene, camera);

    addEventListener('resize', () => {
      if (!renderer) return;
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.fov = innerWidth < innerHeight ? 52 : 42;
      camera.updateProjectionMatrix();
    });

    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fallback(); });
  } catch {
    fallback();
  }
}

function updateHeroHeartPosition3D(t = 0) {
  const frameEl = $('#home-star-frame') || $('#home');
  if (!frameEl || !camera || !heroHeartMesh) return;
  const rect = frameEl.getBoundingClientRect();

  if (rect.bottom < -100 || rect.top > innerHeight + 100) {
    heroHeartMesh.visible = false;
    return;
  }
  heroHeartMesh.visible = true;

  const cx = ((rect.left + rect.width / 2) / innerWidth) * 2 - 1;
  const cy = -((rect.top + rect.height / 2) / innerHeight) * 2 + 1;

  const dist = 3.6;
  const v = new THREE.Vector3(cx, cy, 0.5);
  v.unproject(camera);
  v.sub(camera.position).normalize();
  heroHeartMesh.position.copy(camera.position.clone().add(v.multiplyScalar(dist)));

  if (!prefersReducedMotion) {
    heroHeartMesh.rotation.y = Math.sin(t * 0.7) * 0.18;
    heroHeartMesh.rotation.z = Math.cos(t * 0.5) * 0.08;
    heroHeartMesh.rotation.x = Math.sin(t * 0.4) * 0.06;
  }
}

function updateEggPosition3D(t = 0) {
  const btn = $('#egg-button');
  if (!btn || !camera || !egg3dGroup) return;
  const rect = btn.getBoundingClientRect();
  const cx = ((rect.left + rect.width / 2) / innerWidth) * 2 - 1;
  const cy = -((rect.top + rect.height / 2) / innerHeight) * 2 + 1;

  const dist = 7.5;
  const v = new THREE.Vector3(cx, cy, 0.5);
  v.unproject(camera);
  v.sub(camera.position).normalize();
  const targetPos = camera.position.clone().add(v.multiplyScalar(dist));
  egg3dGroup.position.copy(targetPos);

  if (state.egg === 'pending' && !prefersReducedMotion) {
    egg3dGroup.rotation.y = Math.sin(t * 0.8) * 0.12;
    egg3dGroup.rotation.z = Math.cos(t * 0.6) * 0.04;
  }
}

function fallback() {
  cancelAnimationFrame(frame);
  scene?.traverse(n => { n.geometry?.dispose(); n.material?.dispose(); });
  renderer?.dispose();
  renderer = null;
  $('#webgl-canvas')?.remove();
  document.body.classList.add('static-mode');
}

function interp(stops, p) {
  const ix = Math.min(stops.length - 2, Math.floor(p * (stops.length - 1))), local = p * (stops.length - 1) - ix;
  return gsap.utils.interpolate(stops[ix], stops[ix + 1], local);
}

function applySky(p = 0, animate = false) {
  const stops = state.theme === 'dark' ? darkSky : lightSky, rootStyle = document.documentElement.style;
  const vars = { '--sky-a': interp(stops, p), '--sky-b': interp(stops, Math.min(1, p + .18)), '--sky-c': interp(stops, Math.min(1, p + .48)) };
  if (animate) gsap.to(document.documentElement, { ...vars, duration: MALASH.motion.cinematic / 1000, ease: MALASH.ease.cinematic, overwrite: true });
  else Object.entries(vars).forEach(([k, v]) => rootStyle.setProperty(k, v));
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.dataset.skyText = state.theme === 'light' || p >= .85 ? 'dark-ink' : 'light-ink';
  document.documentElement.dataset.textBacking = state.theme === 'dark' && p >= .58 && p < .85 ? 'on' : 'off';
  scene?.fog?.color.set(state.theme === 'dark' ? MALASH.semantic.fogDark : MALASH.semantic.fogLight);
  scene?.traverse(node => {
    if (node.isPointsMaterial) {
      node.blending = state.theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;
      node.opacity = state.theme === 'dark' ? Math.max(.08, 1 - Math.max(0, (p - .3) / .7)) : .42;
    }
  });
}

/* ==========================================================================
   EGG REVEAL & MALASH MODAL ORCHESTRATION
   ========================================================================== */
function showHoldHint() {
  const hint = $('#egg-hold-hint');
  if (!hint) return;
  hint.classList.add('visible');
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    hint.classList.remove('visible');
  }, 1800);
}

function openLetterModal({ speed = 1 } = {}) {
  malashModal.open({
    sourceElement: $('#egg-button'),
    title: content.letter.title,
    addressee: content.letter.addressee,
    greeting: content.letter.greetingHeader,
    lines: content.letter.lines,
    signature: content.letter.signature,
    speed,
    onClose: () => {
      $('#egg-button')?.focus();
    }
  });
}

function beginEggReveal(fast = false) {
  if (state.egg === 'playing') {
    fastForwardEgg();
    return;
  }
  if (state.egg === 'done') {
    openLetterModal({ speed: 0.4 });
    return;
  }

  state.egg = 'playing';
  const egg = $('#egg-button');
  egg?.classList.add('cracking');
  egg?.setAttribute('aria-expanded', 'true');

  if (navigator.vibrate) navigator.vibrate(20);
  playCrack();

  if (fast || prefersReducedMotion) {
    finishEgg(true);
    return;
  }

  eggSequenceTl = gsap.timeline({
    onComplete: () => {
      finishEgg(true);
    }
  });

  eggSequenceTl.to(egg, { scale: 0.95, duration: 0.15, ease: 'back.out(1.5)' }, 0)
    .to(egg, { scale: 1.05, duration: 0.35, ease: 'power2.out' }, 0.15)
    .to(innerEggLight || {}, { intensity: 2.5, duration: 0.8 }, 0.2);

  if (leftShell && rightShell) {
    eggSequenceTl.to(leftShell.rotation, { z: -0.15, y: -0.1, duration: 0.8, ease: 'power2.out' }, 0.2)
      .to(rightShell.rotation, { z: 0.15, y: 0.1, duration: 0.8, ease: 'power2.out' }, 0.2);
  }

  eggSequenceTl.call(() => { playWhoosh(); }, null, 0.9)
    .to(egg, { scale: 1, duration: 0.4 }, 0.9);

  if (leftShell && rightShell && waxSealMesh) {
    eggSequenceTl.to(leftShell.position, { x: -0.65, z: -0.2, duration: 1.2, ease: 'power3.out' }, 0.9)
      .to(leftShell.rotation, { z: -0.5, x: 0.15, duration: 1.2, ease: 'power3.out' }, 0.9)
      .to(rightShell.position, { x: 0.65, z: -0.2, duration: 1.2, ease: 'power3.out' }, 0.9)
      .to(rightShell.rotation, { z: 0.5, x: 0.15, duration: 1.2, ease: 'power3.out' }, 0.9)
      .to(waxSealMesh.position, { y: -0.7, z: 0.5, duration: 0.8, ease: 'power2.in' }, 0.9)
      .to(waxSealMesh.scale, { x: 0.3, y: 0.3, z: 0.3, duration: 0.8 }, 0.9)
      .to(innerEggLight || {}, { intensity: 4, duration: 1.2 }, 0.9);
  }

  eggSequenceTl.call(() => { playPaper(); }, null, 2.2)
    .to(egg.querySelectorAll('.egg-shard'), {
      x: (i) => Math.cos(i * Math.PI / 4) * 80,
      y: (i) => Math.sin(i * Math.PI / 4) * 80,
      rotation: (i) => (i % 2 ? 35 : -35),
      autoAlpha: 0,
      duration: 0.8,
      stagger: 0.02,
      ease: 'power3.out'
    }, 2.2)
    .fromTo(egg.querySelector('.egg-ring'), { scale: 0.3, autoAlpha: 0.9 }, { scale: 3.5, autoAlpha: 0, duration: 0.8, ease: 'power2.out' }, 2.2);

  eggSequenceTl.call(() => {
    openLetterModal({ speed: 1 });
  }, null, 3.4);
}

function fastForwardEgg() {
  if (state.egg === 'playing' && eggSequenceTl) {
    eggSequenceTl.progress(1);
    finishEgg(true);
    malashModal.fastForward();
  }
}

function finishEgg(openModal = false) {
  if (state.egg === 'done') {
    if (openModal && !malashModal.isOpen) openLetterModal({ speed: 0.4 });
    return;
  }
  eggSequenceTl?.kill();
  state.egg = 'done';
  const egg = $('#egg-button');
  if (egg) {
    egg.classList.remove('cracking');
    egg.classList.add('cracked');
    egg.setAttribute('aria-expanded', 'false');
    egg.setAttribute('aria-label', 'Open letter');
    const label = egg.querySelector('.egg-label');
    if (label) label.textContent = 'Open letter';
  }

  if (leftShell && rightShell && innerEggLight) {
    gsap.set(leftShell.position, { x: -0.65, z: -0.2 });
    gsap.set(leftShell.rotation, { z: -0.5, x: 0.15 });
    gsap.set(rightShell.position, { x: 0.65, z: -0.2 });
    gsap.set(rightShell.rotation, { z: 0.5, x: 0.15 });
    if (waxSealMesh) {
      gsap.set(waxSealMesh.position, { y: -0.7, z: 0.5 });
      gsap.set(waxSealMesh.scale, { x: 0.3, y: 0.3, z: 0.3 });
    }
    innerEggLight.intensity = 2.0;
  }

  if (openModal && !malashModal.isOpen) {
    openLetterModal({ speed: prefersReducedMotion ? 0.2 : 0.6 });
  }
}

function fastForwardMomentsBefore(index) {
  if (index > 1 && state.egg !== 'done') finishEgg(false);
  if (index > 4 && state.names !== 'done') {
    gsap.killTweensOf('[data-name-line],.star-pattern');
    gsap.set('[data-name-line]', { clipPath: 'inset(0 0% 0 0)' });
    gsap.set('.star-pattern', { rotation: 45 });
    state.names = 'done';
  }
}

function checkLetterLayout() {
  const name = $('#letter-name'), btn = $('#egg-button'), status = $('#layout-status');
  if (!name || !btn || !status) return;
  const a = name.getBoundingClientRect(), b = btn.getBoundingClientRect();
  const overlap = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  status.textContent = overlap ? 'Layout warning: names and egg overlap.' : 'Letter layout verified: names remain above the letter.';
  document.documentElement.dataset.letterOverlap = String(overlap);
}

/* ==========================================================================
   INTERACTION BINDINGS & SUBTLE TOUCHES (PART F)
   ========================================================================== */
function bind() {
  // Navigation dock clicks
  root.querySelectorAll('.chapter-dock a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const i = Number(a.dataset.index);
    fastForwardMomentsBefore(i);
    $('#' + a.dataset.chapter).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }));

  // Utility menu toggle for mobile
  const utilToggle = $('#utility-toggle');
  const utilPill = $('#utility-pill');
  if (utilToggle && utilPill) {
    utilToggle.addEventListener('click', () => {
      const open = utilPill.classList.toggle('open');
      utilToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Button feedback
  root.querySelectorAll('.icon-button,.action-button,.sound-chip,.carrier').forEach(el => {
    el.addEventListener('pointerdown', () => pressFeedback(el));
  });

  // Enter experience button
  $('#enter-button').addEventListener('click', () => {
    state.started = true;
    $('#home').classList.add('entered');
    const cue = $('#scroll-cue');
    cue.hidden = false;
    gsap.to(camera?.position || {}, { y: MALASH.camera.enterY, duration: MALASH.motion.slow / 1000, ease: MALASH.ease.cinematic });
    exit($('.home-content')).eventCallback('onComplete', () => enter(cue));
  });

  // Sound toggles
  const updateSound = () => {
    safeSet('malash-sound', String(state.sound));
    const label = state.sound ? content.home.soundOn : content.home.soundOff;
    const homeBtn = $('#home-sound');
    if (homeBtn) {
      homeBtn.setAttribute('aria-label', label);
      homeBtn.innerHTML = `${svg(state.sound ? 'sound' : 'mute')}<span>${escapeHTML(label)}</span>`;
    }
    const navBtn = $('#sound-toggle');
    if (navBtn) {
      navBtn.innerHTML = svg(state.sound ? 'sound' : 'mute');
      navBtn.setAttribute('aria-label', label);
      navBtn.setAttribute('aria-pressed', String(state.sound));
    }
  };

  $('#home-sound')?.addEventListener('click', () => { state.sound = !state.sound; updateSound(); });
  $('#sound-toggle')?.addEventListener('click', () => { state.sound = !state.sound; updateSound(); });

  $('#narration-toggle')?.addEventListener('click', () => {
    state.narration = !state.narration;
    safeSet('malash-narration', String(state.narration));
    const b = $('#narration-toggle');
    b.setAttribute('aria-label', state.narration ? content.ui.narrationOn : content.ui.narrationOff);
    b.setAttribute('aria-pressed', String(state.narration));
  });

  $('#theme-toggle')?.addEventListener('click', e => switchTheme(e.currentTarget));
  $('#auto-toggle')?.addEventListener('click', () => toggleAuto());
  $('#restart')?.addEventListener('click', restart);

  // EGG INTERACTION BINDINGS
  const eggBtn = $('#egg-button');
  if (eggBtn) {
    const ringCircle = eggBtn.querySelector('.egg-progress-ring ellipse, .egg-progress-ring circle');

    const startHold = () => {
      if (state.egg === 'done') return;
      if (state.egg === 'playing') {
        fastForwardEgg();
        return;
      }
      holdStartTime = performance.now();
      eggBtn.classList.add('holding');
      if (navigator.vibrate) navigator.vibrate(15);
      playCrack();

      holdTween = gsap.to(ringCircle, {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: 'none',
        onComplete: () => {
          eggBtn.classList.remove('holding');
          beginEggReveal(false);
        }
      });
    };

    const cancelHold = () => {
      if (state.egg === 'done') return;
      if (holdTween) {
        holdTween.kill();
        holdTween = null;
      }
      eggBtn.classList.remove('holding');
      gsap.to(ringCircle, { strokeDashoffset: 100, duration: 0.25, ease: 'power2.out' });

      if (state.egg === 'pending') {
        const elapsed = performance.now() - holdStartTime;
        if (elapsed > 0 && elapsed < 350) {
          showHoldHint();
          playGlassTick();
        }
      }
    };

    eggBtn.addEventListener('pointerdown', () => {
      if (state.egg === 'done') {
        openLetterModal({ speed: 0.4 });
        return;
      }
      const now = performance.now();
      if (now - lastTapTime < 400) {
        cancelHold();
        beginEggReveal(true);
        return;
      }
      lastTapTime = now;
      startHold();
    });

    eggBtn.addEventListener('pointerup', cancelHold);
    eggBtn.addEventListener('pointerleave', cancelHold);
    eggBtn.addEventListener('pointercancel', cancelHold);

    eggBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (state.egg === 'done') {
          openLetterModal({ speed: 0.4 });
        } else if (state.egg === 'pending') {
          beginEggReveal(true);
        } else if (state.egg === 'playing') {
          fastForwardEgg();
        }
      }
    });

    eggBtn.addEventListener('click', (e) => {
      if (state.egg === 'done') {
        openLetterModal({ speed: 0.4 });
      } else if (state.egg === 'pending') {
        if (e.detail >= 2) {
          beginEggReveal(true);
        } else {
          showHoldHint();
          playGlassTick();
        }
      }
    });
  }

  // Wishes interaction
  root.querySelectorAll('[data-wish]').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.dataset.wish);
    state.read.add(i);
    const copy = $('#wish-copy-' + i);
    copy.classList.add('is-open');
    b.setAttribute('aria-expanded', 'true');
    b.classList.add('is-read');
    $('#read-count .count-text').textContent = content.wishes.readCounter.replace('{n}', String(state.read.size)).replace('{total}', String(content.wishes.items.length));
    enter(copy);
  }));

  // Ameen button animation
  $('#ameen-button')?.addEventListener('click', () => {
    const light = $('#ameen-light');
    gsap.fromTo(light, 
      { y: 20, autoAlpha: 1, scale: 0.3 }, 
      { y: -80, autoAlpha: 0, scale: 1.2, duration: duration(prefersReducedMotion ? MALASH.motion.base : MALASH.motion.cinematic) / 1000, ease: MALASH.ease.enter }
    );
  });

  // Card maker interactions
  $('#card-name')?.addEventListener('input', drawCard);
  $('#card-wish')?.addEventListener('input', drawCard);
  $('#create-card')?.addEventListener('click', () => {
    drawCard();
    $('#wish-card-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#save-card')?.addEventListener('click', saveCard);
  $('#share-card')?.addEventListener('click', shareCard);
  $('#share-link')?.addEventListener('click', shareLink);
  $('#keepsake')?.addEventListener('click', saveKeepsake);

  // Magnetic hover for primary buttons on desktop (Part F)
  if (matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    root.querySelectorAll('.action-button.primary').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.22;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.22;
        gsap.to(btn, { x, y, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  ScrollTrigger.refresh();
}

function switchTheme(button) {
  const run = () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    safeSet('malash-theme', state.theme);
    button.innerHTML = svg(state.theme === 'dark' ? 'sun' : 'moon');
    const p = ScrollTrigger.getById('sky')?.progress || 0;
    applySky(p, true);
    root.querySelectorAll('.carrier').forEach(n => {
      n.classList.toggle('kite', state.theme === 'light');
      n.classList.toggle('lantern', state.theme === 'dark');
    });
    const col = state.theme === 'dark' ? MALASH.colors.accent.rose : MALASH.colors.accent.magenta;
    scene?.traverse(n => {
      if (n.isPointsMaterial) {
        n.color.set(col);
        n.blending = state.theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;
        n.opacity = state.theme === 'dark' ? 1 - p : .42;
      }
    });
  };
  const r = button.getBoundingClientRect();
  document.documentElement.style.setProperty('--reveal-x', `${r.left + r.width / 2}px`);
  document.documentElement.style.setProperty('--reveal-y', `${r.top + r.height / 2}px`);
  if (document.startViewTransition) {
    document.startViewTransition(run);
  } else {
    document.documentElement.classList.add('theme-fallback');
    run();
    setTimeout(() => document.documentElement.classList.remove('theme-fallback'), duration(MALASH.motion.themeFallback));
  }
}

function paintAutoButton() {
  const b = $('#auto-toggle');
  if (!b) return;
  b.setAttribute('aria-pressed', String(state.auto));
  b.setAttribute('aria-label', state.auto ? content.ui.pause : content.ui.autoPlay);
  b.innerHTML = svg(state.auto ? 'pause' : 'play');
}

function autoStep(now) {
  autoTarget = state.auto && (state.egg === 'playing' || state.names === 'playing' || malashModal.isOpen) ? 0 : (state.auto ? MALASH.scroll.autoplayPixelsPerSecond : 0);
  const dt = Math.min((now - lastAuto) / 1000, .05);
  lastAuto = now;
  autoVelocity += (autoTarget - autoVelocity) * Math.min(dt / (MALASH.motion.base / 1000), 1);
  if (autoVelocity > .1) window.scrollBy(0, autoVelocity * dt);
  if (window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
    state.auto = false;
    autoTarget = 0;
    paintAutoButton();
  }
  if (autoTarget === 0 && autoVelocity < .5) {
    autoVelocity = 0;
    autoFrame = 0;
    return;
  }
  autoFrame = requestAnimationFrame(autoStep);
}

function toggleAuto() {
  state.auto = !state.auto;
  autoTarget = state.auto ? 34 : 0;
  paintAutoButton();
  if (!autoFrame) {
    lastAuto = performance.now();
    autoFrame = requestAnimationFrame(autoStep);
  }
}

function pauseAuto() {
  if (!state.auto) return;
  state.auto = false;
  autoTarget = 0;
  paintAutoButton();
  if (!autoFrame) {
    lastAuto = performance.now();
    autoFrame = requestAnimationFrame(autoStep);
  }
}

function restart() {
  const overlay = $('#restart-overlay');
  overlay.classList.remove('hidden');
  overlay.classList.add('show');
  setTimeout(() => {
    pauseAuto();
    if (malashModal.isOpen) malashModal.close();
    state.started = false;
    state.egg = 'pending';
    state.names = 'pending';
    state.read.clear();
    autoVelocity = 0;
    autoTarget = 0;
    state.home = homeVariants.includes(query.get('home')) ? query.get('home') : 'star';
    letterObserver?.disconnect();
    ScrollTrigger.getAll().forEach(t => t.kill());

    if (leftShell && rightShell) {
      gsap.set(leftShell.position, { x: 0, y: 0, z: 0 });
      gsap.set(leftShell.rotation, { x: 0, y: 0, z: 0 });
      gsap.set(rightShell.position, { x: 0, y: 0, z: 0 });
      gsap.set(rightShell.rotation, { x: 0, y: 0, z: 0 });
      if (waxSealMesh) {
        gsap.set(waxSealMesh.position, { x: 0, y: 0, z: 0.94 });
        gsap.set(waxSealMesh.scale, { x: 1, y: 1, z: 1 });
      }
      if (innerEggLight) innerEggLight.intensity = 0;
    }

    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    applySky(0);
    setupScroll();
    letterObserver = new ResizeObserver(checkLetterLayout);
    letterObserver.observe($('#letter'));
    setTimeout(() => overlay.classList.remove('show'), duration(MALASH.motion.restartIn));
    setTimeout(() => overlay.classList.add('hidden'), duration(MALASH.motion.restartIn) + duration(MALASH.motion.slow));
  }, duration(MALASH.motion.restartFade));
}

function updateDockPosition(activeIdx) {
  const items = root.querySelectorAll('.chapter-dock .dock-item');
  items.forEach((item, i) => item.classList.toggle('active', i === activeIdx));

  const indicator = $('#dock-indicator');
  if (indicator && items[activeIdx]) {
    indicator.style.transform = `translateY(${items[activeIdx].offsetTop - 8}px)`;
  }
}

function resizeRail() {
  const y = scrollY + innerHeight * 0.45;
  let active = 0;
  chapterIds.forEach((id, i) => {
    const el = $('#' + id);
    if (el && el.offsetTop <= y) active = i;
  });
  updateDockPosition(active);
}

function setupScroll() {
  ScrollTrigger.getAll().forEach(t => t.kill());
  const skyUpdate = self => {
    const p = self.progress;
    applySky(p);
    const progressFill = $('#dock-progress');
    if (progressFill) progressFill.style.height = `${Math.min(100, p * 100)}%`;
    if (p > 0.42 && state.egg === 'pending') finishEgg(false);
    resizeRail();
  };

  const skyConfig = { id: 'sky', trigger: root, start: 'top top', end: 'bottom bottom', onUpdate: skyUpdate };
  if (prefersReducedMotion) {
    ScrollTrigger.create(skyConfig);
  } else {
    gsap.timeline({ scrollTrigger: { ...skyConfig, scrub: MALASH.motion.fast * 2 / 1000 } })
      .to(camera?.position || {}, { z: MALASH.camera.midZ, duration: MALASH.scroll.cameraBlendBase / (MALASH.scroll.cameraBlendBase + MALASH.scroll.cameraBlendSlow), ease: 'none' })
      .to(camera?.position || {}, { z: MALASH.camera.endZ, duration: MALASH.scroll.cameraBlendSlow / (MALASH.scroll.cameraBlendBase + MALASH.scroll.cameraBlendSlow), ease: 'none' });
  }

  // Act triggers
  chapterIds.forEach((id, i) => ScrollTrigger.create({
    id: 'chapter-' + i,
    trigger: '#' + id,
    start: 'top 55%',
    end: 'bottom 45%',
    onEnter: () => {
      fastForwardMomentsBefore(i);
      if (i === 3) animatePrayers();
      if (i === 4 && state.names === 'pending') animateNames();
      if (i > 0) {
        const nodes = $('#' + id).querySelectorAll('.eyebrow,h2,h3,.journey-quote,.blessing-sheet,.farewell-title');
        nodes.forEach(el => enter(el));
      }
    },
    onEnterBack: () => { resizeRail(); }
  }));

  if (!scrollEventsBound) {
    addEventListener('scroll', resizeRail, { passive: true });
    addEventListener('wheel', pauseAuto, { passive: true });
    addEventListener('touchstart', pauseAuto, { passive: true });
    addEventListener('keydown', e => {
      pauseAuto();
      if (e.target.matches('input,textarea,[contenteditable=true]')) return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
        if (malashModal.isOpen) return;
        pauseAuto();
        if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
          e.preventDefault();
          window.scrollBy({ top: innerHeight * .82, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
          e.preventDefault();
          window.scrollBy({ top: -innerHeight * .82, behavior: 'smooth' });
        }
      } else if (e.key === 'Home') {
        pauseAuto();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === 'End') {
        pauseAuto();
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }
    });
    scrollEventsBound = true;
  }

  if (matchMedia('(pointer:fine)').matches && !prefersReducedMotion && !lenis) {
    root.classList.add('desktop-scroll');
    lenis = new Lenis({ autoRaf: false, lerp: MALASH.scroll.damping, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis?.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  resizeRail();
  ScrollTrigger.refresh();
}

function animatePrayers() {
  const arches = root.querySelectorAll('.prayers-grid .arch-path');
  if (!arches.length) return;
  if (prefersReducedMotion) {
    gsap.set(arches, { strokeDashoffset: 0 });
    return;
  }
  gsap.fromTo(arches,
    { strokeDasharray: 100, strokeDashoffset: 100 },
    { strokeDashoffset: 0, duration: 1.2, stagger: 0.25, ease: 'power2.out', overwrite: true }
  );
}

function animateNames() {
  if (state.names !== 'pending') return;
  state.names = 'playing';
  if (prefersReducedMotion) {
    fastForwardMomentsBefore(5);
    return;
  }
  namesTimeline = gsap.timeline({ onComplete: () => { state.names = 'done'; } })
    .fromTo('[data-name-line]', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: MALASH.motion.cinematic / 1000, stagger: MALASH.motion.base / 1000, ease: MALASH.ease.cinematic, overwrite: true })
    .fromTo('.star-pattern', { rotation: 0 }, { rotation: 45, duration: MALASH.motion.epic / 1000, ease: MALASH.ease.cinematic }, 0);
}

function drawCard() {
  const name = $('#card-name').value.trim().slice(0, 30), wish = $('#card-wish').value.trim().slice(0, 140), canvas = $('#wish-card-canvas'), ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1080, 1350);
  const g = ctx.createLinearGradient(0, 0, 1080, 1350);
  g.addColorStop(0, MALASH.colors.accent.plum);
  g.addColorStop(1, MALASH.colors.accent.magenta);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = MALASH.colors.accent.rose;
  ctx.lineWidth = 4;
  ctx.strokeRect(54, 54, 972, 1242);
  ctx.textAlign = 'center';
  ctx.fillStyle = MALASH.colors.accent.white;
  ctx.font = '600 42px "Exo 2"';
  ctx.fillText(content.wishCard.headline, 540, 260);
  ctx.fillStyle = MALASH.colors.accent.rose;
  ctx.font = '400 42px Sacramento';
  wrapCanvas(ctx, wish || content.couple.journeyLine, 540, 470, 900, 60, 5);
  ctx.fillStyle = MALASH.colors.accent.white;
  ctx.font = '400 32px "Exo 2"';
  wrapCanvas(ctx, content.wishCard.footer.replace('{name}', name), 540, 1130, 900, 44, 3);
  ctx.font = '400 24px "Exo 2"';
  wrapCanvas(ctx, credits.heading, 540, 1240, 900, 32, 2);
  $('#save-card').disabled = !name || !wish;
  $('#share-card').disabled = !name || !wish;
  const logo = new Image();
  logo.onload = () => ctx.drawImage(logo, 490, 840, 100, 100);
  logo.onerror = () => {
    ctx.fillStyle = MALASH.colors.accent.lilac;
    ctx.beginPath();
    ctx.arc(540, 890, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = MALASH.colors.accent.plum;
    ctx.font = '600 16px "Exo 2"';
    ctx.fillText('IT & Media', 540, 896);
  };
  logo.src = credits.logos.committee;
}

function wrapCanvas(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const rtl = /[\u0590-\u08FF]/.test(text);
  ctx.direction = rtl ? 'rtl' : 'ltr';
  const words = String(text).split(/\s+/), lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((lineText, i) => ctx.fillText(lineText, x, y + i * lineHeight, maxWidth));
}

function saveCard() {
  const c = $('#wish-card-canvas'), a = document.createElement('a');
  a.download = 'malash-wish-card.png';
  a.href = c.toDataURL('image/png');
  a.click();
}

async function shareCard() {
  const c = $('#wish-card-canvas');
  try {
    const blob = await new Promise(r => c.toBlob(r, 'image/png')), file = new File([blob], 'malash-wish-card.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: content.wishCard.headline });
    else saveCard();
  } catch {
    saveCard();
  }
}

async function shareLink() {
  try {
    if (navigator.share) await navigator.share({ title: content.meta.pageTitle, text: content.meta.description, url: location.href });
    else if (navigator.clipboard) await navigator.clipboard.writeText(location.href);
  } catch {}
}

function saveKeepsake() {
  const c = $('#wish-card-canvas'), ctx = c.getContext('2d'), g = ctx.createLinearGradient(0, 0, 1080, 1350);
  g.addColorStop(0, MALASH.colors.accent.plum);
  g.addColorStop(1, MALASH.colors.accent.magenta);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.strokeStyle = MALASH.colors.accent.rose;
  ctx.lineWidth = 4;
  ctx.strokeRect(54, 54, 972, 1242);
  ctx.textAlign = 'center';
  ctx.fillStyle = MALASH.colors.accent.white;
  ctx.font = '600 48px "Exo 2"';
  ctx.fillText(content.keepsake.headline, 540, 390, 900);
  ctx.fillStyle = MALASH.colors.accent.lilac;
  ctx.font = '400 48px Sacramento';
  ctx.fillText(content.couple.tagline, 540, 600, 900);
  ctx.fillStyle = MALASH.colors.accent.white;
  ctx.font = '400 32px "Exo 2"';
  ctx.fillText(content.keepsake.footer, 540, 1050, 900);
  const a = document.createElement('a');
  a.download = 'malash-keepsake.png';
  a.href = c.toDataURL('image/png');
  a.click();
  drawCard();
}


/* ==========================================================================
   BISMILLAH STAR PRELOADER (TASK 3)
   ========================================================================== */
function initPreloader() {
  const preloader = $('#preloader');
  if (!preloader) return;

  const starPath = $('#preloader-star-path');
  const dimBismillah = $('#bismillah-dim');
  const brightBismillah = $('#bismillah-bright');
  const percentEl = $('#preloader-percent');
  const continueBtn = $('#preloader-continue');
  const starWrap = $('.preloader-star-wrap');

  const bismillahStr = content.arrival.basmalah;
  if (dimBismillah) dimBismillah.textContent = bismillahStr;
  if (brightBismillah) brightBismillah.textContent = bismillahStr;

  let fontsReady = false;
  let sceneReady = false;
  let finished = false;

  document.fonts.ready.then(() => {
    fontsReady = true;
  }).catch(() => {
    fontsReady = true;
  });

  window.__sceneReady = () => { sceneReady = true; };

  const MIN_DURATION = 1800; // ms
  const startTime = performance.now();
  let currentProgress = 0;
  let animFrameId = null;

  function finish(immediate = false) {
    if (finished) return;
    finished = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    clearTimeout(safetyTimer);

    if (percentEl) percentEl.textContent = '100%';
    if (starPath) starPath.style.strokeDashoffset = '0';
    if (brightBismillah) brightBismillah.style.clipPath = 'inset(0 0 0 0%)';

    if (immediate) {
      preloader.classList.add('dissolved');
      preloader.style.display = 'none';
      preloader.style.opacity = '0';
      return;
    }

    if (prefersReducedMotion) {
      gsap.to(preloader, {
        opacity: 0,
        duration: duration(MALASH.motion.reducedFade) / 1000,
        ease: 'power2.out',
        onComplete: () => {
          preloader.classList.add('dissolved');
          preloader.style.display = 'none';
        }
      });
      return;
    }

    // Soft glow pulse on star
    if (starWrap) {
      gsap.to(starWrap, {
        scale: 1.06,
        duration: 0.35,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
      });
    }

    // Bismillah gently lifts and settles
    const bWrap = $('.bismillah-wrap');
    if (bWrap) {
      gsap.to(bWrap, {
        y: -6,
        duration: 0.35,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });
    }

    // Preloader dissolves into homepage
    gsap.to(preloader, {
      opacity: 0,
      duration: duration(MALASH.motion.slow) / 1000,
      delay: 0.4,
      ease: MALASH.ease.cinematic,
      onComplete: () => {
        preloader.classList.add('dissolved');
        preloader.style.display = 'none';
      }
    });
  }

  // Safety fallback after 4.5s
  const onScroll = () => {
    if (window.scrollY > 20) {
      finish(true);
      window.removeEventListener('scroll', onScroll);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  const safetyTimer = setTimeout(() => {
    if (!finished && continueBtn) {
      continueBtn.hidden = false;
      continueBtn.removeAttribute('hidden');
      continueBtn.onclick = () => finish(true);
    }
  }, 4500);

  if (prefersReducedMotion) {
    finish(true);
    return;
  }

  function tickPreloader(now) {
    if (finished) return;
    const elapsed = now - startTime;
    const timeProgress = Math.min(1, elapsed / MIN_DURATION);
    const assetsReady = fontsReady && sceneReady;
    const targetProgress = assetsReady ? timeProgress : Math.min(0.85, timeProgress);

    currentProgress += (targetProgress - currentProgress) * 0.18;
    if (currentProgress < targetProgress && targetProgress - currentProgress < 0.005) {
      currentProgress = targetProgress;
    }

    const pct = Math.min(100, Math.round(currentProgress * 100));
    if (percentEl) percentEl.textContent = `${pct}%`;

    const dashOffset = (100 - currentProgress * 100).toFixed(1);
    if (starPath) starPath.style.strokeDashoffset = `${dashOffset}`;

    // Reveal from right to left: inset(0 0 0 calc((1 - p) * 100%))
    const leftClip = ((1 - currentProgress) * 100).toFixed(1);
    if (brightBismillah) brightBismillah.style.clipPath = `inset(0 0 0 ${leftClip}%)`;

    if (timeProgress >= 1 && assetsReady && currentProgress >= 0.99) {
      finish(false);
      return;
    }

    animFrameId = requestAnimationFrame(tickPreloader);
  }

  animFrameId = requestAnimationFrame(tickPreloader);
}

async function init() {
  document.title = content.meta.pageTitle;
  initPreloader();
  $('meta[name="description"]')?.setAttribute('content', content.meta.description);
  $('meta[property="og:title"]')?.setAttribute('content', content.meta.ogTitle);
  $('meta[property="og:description"]')?.setAttribute('content', content.meta.ogDescription);
  render();
  applySky(0);
  init3d();
  window.__sceneReady?.();
  setupScroll();
  checkLetterLayout();
  letterObserver = new ResizeObserver(checkLetterLayout);
  letterObserver.observe($('#letter'));

  // Desktop soft cursor glow (Part F)
  if (matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    let curX = -200, curY = -200, targetX = -200, targetY = -200;
    window.addEventListener('pointermove', e => { targetX = e.clientX; targetY = e.clientY; });
    const updateGlow = () => {
      curX += (targetX - curX) * 0.15;
      curY += (targetY - curY) * 0.15;
      glow.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      requestAnimationFrame(updateGlow);
    };
    updateGlow();
  }

  addEventListener('pointerdown', () => {
    if (state.egg === 'playing' && !malashModal.isOpen) fastForwardEgg();
  });

  addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (renderer && !prefersReducedMotion) {
      const tick = () => {
        if (!renderer || document.hidden) return;
        frame = requestAnimationFrame(tick);
        renderer.render(scene, camera);
      };
      tick();
    }
  });
}

$('#restart-overlay')?.classList.add('hidden');
init();
