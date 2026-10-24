import './styles/main.css';
import * as THREE from 'three';
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
const state = {
  theme: themes.includes(query.get('theme')) ? query.get('theme') : (themes.includes(storedTheme) ? storedTheme : defaultTheme),
  sound: safeGet('malash-sound', 'true') === 'true',
  narration: safeGet('malash-narration', 'true') === 'true',
  auto: false, egg: 'pending', names: 'pending', read: new Set(), started: false,
  home: ['lantern', 'letter'].includes(query.get('home')) ? query.get('home') : (Math.random() < .5 ? 'lantern' : 'letter'),
};
const chapterIds = ['home', 'letter', 'wishes', 'journey', 'names', 'farewell'];
let scene, camera, renderer, lenis, frame = 0, eggTimeline, autoFrame = 0, autoVelocity = 0, autoTarget = 0, lastAuto = 0, scrollEventsBound = false, letterObserver, namesTimeline, activeChapter = 0, eggOpenCount = 0, secretTimer;
const foundSecrets = new Set(), constellationStars = new Set();
const eggAt = { crack: MALASH.motion.fast / 1000, split: MALASH.motion.slow / 1000, burst: (MALASH.motion.slow + MALASH.motion.fast) / 1000, rise: (MALASH.motion.slow + MALASH.motion.base + MALASH.motion.instant) / 1000, message: (MALASH.motion.epic + MALASH.motion.base) / 1000 };
const root = $('#ui-root');
const malashModal = new MalashModal($('#modal-root'));
const darkSky = [MALASH.colors.dark.sky0, MALASH.colors.dark.sky30, MALASH.colors.dark.sky60, MALASH.colors.dark.sky85, MALASH.colors.dark.sky100];
const lightSky = [MALASH.colors.light.sky00, MALASH.colors.light.sky30, MALASH.colors.light.sky60, MALASH.colors.light.sky60, MALASH.colors.light.sky100];

function playGlassTick() {
  if (!state.sound) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!window._malashAudioCtx) window._malashAudioCtx = new AudioCtx();
    const ctx = window._malashAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, ctx.currentTime);
    filter.Q.setValueAtTime(8, ctx.currentTime);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {}
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
    chapter: '<circle cx="12" cy="12" r="7"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',
    letter: '<path d="M4 5h16v14H4zM4 6l8 6 8-6"/>',
    wishes: '<path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z"/>',
    journey: '<path d="M3 20h18M5 20V9a7 7 0 0 1 14 0v11M9 20v-5a3 3 0 0 1 6 0v5"/>',
    blessing: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
    farewell: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    crescent: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',
    star: '<path d="m12 3 2.3 5.7L20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3L12 3Z"/>',
    seal: '<circle cx="12" cy="12" r="8"/><path d="M8 12h8m-4-4v8"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name]}</svg>`;
}

function iconButton(id, label, icon, pressed) {
  return `<button class="icon-button" id="${id}" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}" ${pressed == null ? '' : `aria-pressed="${pressed}"`}>${svg(icon)}</button>`;
}

function hud() {
  const icons = ['home', 'letter', 'wishes', 'journey', 'blessing', 'farewell'];
  return `
    <header class="hud">
      <nav class="chapter-dock" aria-label="Chapters" style="--active-index:${activeChapter}">
        <span class="dock-track" aria-hidden="true">
          <span id="dock-progress"></span>
        </span>
        <span class="dock-indicator" aria-hidden="true"></span>
        ${chapterIds.map((id, i) => `
          <a href="#${id}" data-chapter="${id}" aria-label="${content.chapters[i]}" title="${content.chapters[i]}" class="${i === activeChapter ? 'active' : ''}">
            ${svg(icons[i])}
            <span class="dock-label">${escapeHTML(content.chapters[i])}</span>
            <span class="dock-num">${String(i + 1).padStart(2, '0')}</span>
          </a>
        `).join('')}
      </nav>
      <button class="icon-button utility-menu" id="utility-menu" aria-label="Open controls" aria-expanded="false" aria-controls="utility-controls">${svg('menu')}</button>
      <div class="controls" id="utility-controls">
        ${iconButton('sound-toggle', state.sound ? content.home.soundOn : content.home.soundOff, state.sound ? 'sound' : 'mute', state.sound)}
        ${iconButton('narration-toggle', state.narration ? content.ui.narrationOn : content.ui.narrationOff, 'voice', state.narration)}
        ${iconButton('theme-toggle', content.ui.themeToggle, state.theme === 'dark' ? 'sun' : 'moon')}
        ${iconButton('auto-toggle', state.auto ? content.ui.pause : content.ui.autoPlay, state.auto ? 'pause' : 'play', state.auto)}
        ${iconButton('restart', content.ui.restart, 'restart')}
      </div>
    </header>
  `;
}

function home() {
  const isLetter = state.home === 'letter';
  return `
    <section id="home" class="page home-page home-${state.home}" data-page="0">
      <div class="home-art" aria-hidden="true">
        ${isLetter ? '<div class="home-envelope"><span></span><i></i></div>' : '<div class="home-lantern"></div>'}
        <button class="glass-heart heart-a" data-heart-secret aria-label="Hold the glass heart to reveal its message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z"/></svg></button>
        <button class="glass-heart heart-b" data-heart-secret aria-label="Hold the glass heart to reveal its message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.5-8 11-8 11Z"/></svg></button>
      </div>
      <div class="home-content">
        <p class="eyebrow">GMSA-KNUST presents</p>
        <h1>${escapeHTML(content.home.title)}</h1>
        <p>${escapeHTML(content.home.subline)}</p>
        <div class="home-actions">
          <button class="action-button primary" id="enter-button">${escapeHTML(content.home.enter)}</button>
          <button class="sound-chip action-button" id="home-sound" aria-label="${escapeHTML(state.sound ? content.home.soundOn : content.home.soundOff)}">${svg(state.sound ? 'sound' : 'mute')}<span>${escapeHTML(state.sound ? content.home.soundOn : content.home.soundOff)}</span></button>
        </div>
        <div class="scroll-cue" id="scroll-cue" hidden>
          <span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg></span>
          <span>${escapeHTML(content.home.scrollCue)}</span>
        </div>
      </div>
    </section>
  `;
}

function letter() {
  return `
    <section id="letter" class="page letter-page ${state.egg === 'done' ? 'is-cracked' : ''}" data-page="1">
      <div class="act-wrap letter-wrap">
        <p class="eyebrow">${escapeHTML(content.ui.letterEyebrow)}</p>
        <p class="nameplate" id="letter-name">${escapeHTML(content.letter.addressee)}</p>
        <p class="greeting-header">${escapeHTML(content.letter.greetingHeader)}</p>
        <button class="egg ${state.egg === 'done' ? 'cracked' : ''}" id="egg-button" aria-label="${escapeHTML(state.egg === 'done' ? content.nav.openLetter : content.letter.sealHint)}" aria-expanded="false">
          <span class="egg-shard"></span><span class="egg-shard"></span><span class="egg-shard"></span><span class="egg-shard"></span>
          <span class="egg-shard"></span><span class="egg-shard"></span><span class="egg-shard"></span><span class="egg-core"></span>
          <span class="egg-ring" aria-hidden="true"></span>
          <span class="egg-label">${escapeHTML(state.egg === 'done' ? content.nav.reopenHint : content.letter.sealHint)}</span>
        </button>
        <div class="egg-secrets">
          ${[0, 1, 2].map(i => `<button data-secret="shard-${i}" aria-label="Reveal a small light from egg shard ${i + 1}">${svg('star')}</button>`).join('')}
        </div>
        <div class="overlap-status sr-only" aria-live="polite" id="layout-status"></div>
      </div>
    </section>
  `;
}

function wishes() {
  return `
    <section id="wishes" class="page wishes-page" data-page="2">
      <div class="act-wrap">
        <p class="eyebrow">${escapeHTML(content.ui.wishesEyebrow)}</p>
        <h2>${escapeHTML(content.wishes.sectionTitle)}</h2>
        <p class="hint">${escapeHTML(content.wishes.tapHint)}</p>
        <p class="read-count" id="read-count" aria-live="polite">${svg('chapter')}<span class="count-text">0 of ${content.wishes.items.length} wishes read</span></p>
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
        <div class="constellation-clue" aria-label="Hidden constellation">
          ${[0, 1, 2].map(i => `<button class="secret-dot" data-secret="constellation-${i}" aria-label="Find constellation star ${i + 1}">${svg('star')}</button>`).join('')}
          <svg class="constellation-art" id="constellation-art" viewBox="0 0 260 80" aria-hidden="true">
            <path d="M10 60 46 18 82 56 119 8 155 53 194 19 247 58" pathLength="1"/>
            <text x="130" y="76" text-anchor="middle">${escapeHTML(content.surprises.constellationLabel)}</text>
          </svg>
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

function journey() {
  return `
    <section id="journey" class="page journey-page" data-page="3">
      <div class="act-wrap">
        <p class="eyebrow">${escapeHTML(content.journey.title)}</p>
        <h2>${escapeHTML(content.ui.journeyHeading)}</h2>
        <div class="journey-line">
          ${content.journey.events.map(e => `
            <article class="event-card">
              <div class="arch" aria-hidden="true"></div>
              <h3>${escapeHTML(e.name)}</h3>
              <p>${escapeHTML(e.date)}</p>
            </article>
          `).join('')}
        </div>
        <p class="journey-quote">${escapeHTML(content.couple.journeyLine)}</p>
      </div>
    </section>
  `;
}

function names() {
  return `
    <section id="names" class="page names-page" data-page="4">
      <div class="act-wrap names-wrap">
        <div class="name-animation">
          <p class="eyebrow">${escapeHTML(content.names.lead)}</p>
          <p class="script-name" data-name-line>${escapeHTML(content.couple.groomShort)}</p>
          <p class="ampersand">&amp;</p>
          <p class="script-name" data-name-line>${escapeHTML(content.couple.brideShort)}</p>
          <p class="merged-name">${escapeHTML(content.couple.merged)}</p>
          <div class="star-pattern" aria-hidden="true">
            <svg viewBox="0 0 100 100"><path d="M50 4 61 39 96 50 61 61 50 96 39 61 4 50 39 39Z M50 17 57 43 83 50 57 57 50 83 43 57 17 50 43 43Z"/></svg>
          </div>
        </div>
        <article class="verse-card">
          <button class="crescent-secret" data-secret="crescent" aria-label="Hidden crescent dua">${svg('crescent')}</button>
          <p class="verse-ref">${escapeHTML(content.names.verseReference)}</p>
          <p class="arabic verse-ar" lang="ar" dir="rtl">${content.names.verseArabic}</p>
          <p>${escapeHTML(content.names.verseTranslation)}</p>
          <hr>
          <p class="arabic dua-ar" lang="ar" dir="rtl">${content.names.duaArabic}</p>
          <p>${escapeHTML(content.names.duaTransliteration)}</p>
          <p>${escapeHTML(content.names.duaTranslation)}</p>
          <small>${escapeHTML(content.names.duaSource)}</small>
        </article>
        <div class="ameen">
          <button class="action-button" id="ameen-button">${escapeHTML(content.ameen.button)}</button>
          <span>${escapeHTML(content.ameen.hint)}</span>
          <i id="ameen-light" aria-hidden="true"></i>
        </div>
      </div>
    </section>
  `;
}

function farewell() {
  return `
    <section id="farewell" class="page farewell-page" data-page="5">
      <div class="act-wrap farewell-wrap">
        <p class="eyebrow">${escapeHTML(content.farewell.closingLine)}</p>
        <h2 class="farewell-title">Machele <span>&amp;</span> Salash</h2>
        <section class="card-maker">
          <h3>${escapeHTML(content.wishCard.title)}</h3>
          <label>${escapeHTML(content.wishCard.namePlaceholder)}<input id="card-name" maxlength="30" autocomplete="name" /></label>
          <label>${escapeHTML(content.wishCard.wishPlaceholder)}<textarea id="card-wish" maxlength="140" rows="3"></textarea></label>
          <div class="card-actions">
            <button class="action-button primary" id="create-card">${escapeHTML(content.wishCard.create)}</button>
            <button class="action-button" id="save-card" disabled>${escapeHTML(content.wishCard.save)}</button>
            <button class="action-button" id="share-card" disabled>${escapeHTML(content.wishCard.share)}</button>
          </div>
          <p class="card-tip">${escapeHTML(content.wishCard.tip)}</p>
          <canvas id="wish-card-canvas" width="1080" height="1350" aria-label="Wish card preview"></canvas>
        </section>
        <div class="farewell-actions">
          <button class="action-button" id="share-link">${escapeHTML(content.farewell.shareLabel)}</button>
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
          <button class="ec-secret" id="ec-secret" aria-label="Open EC Office note">${svg('seal')}</button>
        </footer>
        <div class="tail-reveal">
          <button class="tail-secret" data-secret="tail" aria-label="Reveal final blessing">${svg('star')}</button>
          <p id="tail-line" hidden>${escapeHTML(content.surprises.tailLine)}</p>
        </div>
      </div>
    </section>
  `;
}

function render() {
  root.innerHTML = hud() + home() + letter() + wishes() + journey() + names() + farewell();
  bind();
}

function init3d() {
  const canvas = $('#webgl-canvas');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !(navigator.deviceMemory && navigator.deviceMemory <= 4), powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, navigator.deviceMemory && navigator.deviceMemory <= 4 ? 1.25 : 1.75));
    renderer.setSize(innerWidth, innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(innerWidth < innerHeight ? 52 : 42, innerWidth / innerHeight, .1, 100);
    camera.position.set(0, MALASH.camera.homeY, MALASH.camera.homeZ);
    scene.add(new THREE.AmbientLight(MALASH.colors.accent.white, 1.5));
    const glow = new THREE.PointLight(MALASH.colors.accent.rose, 12, 28); glow.position.set(-2, 3, 5); scene.add(glow);

    const shape = new THREE.Shape();
    shape.moveTo(0, -.16);
    shape.bezierCurveTo(-.16, -.01, -.34, .13, -.33, .31);
    shape.bezierCurveTo(-.32, .49, -.12, .51, 0, .33);
    shape.bezierCurveTo(.12, .51, .32, .49, .33, .31);
    shape.bezierCurveTo(.34, .13, .16, -.01, 0, -.16);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: .1, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: .025, bevelThickness: .025 });
    geo.center();
    const mat = new THREE.MeshStandardMaterial({ color: MALASH.colors.accent.magenta, roughness: .35, metalness: .12, transparent: true, opacity: .62, emissive: MALASH.colors.accent.plum, emissiveIntensity: .3 });
    const hearts = new THREE.Group();

    for (let i = 0; i < 10; i++) {
      const h = new THREE.Mesh(geo, mat);
      h.position.set((Math.random() - .5) * 12, (Math.random() - .5) * 9, -2 - Math.random() * 11);
      h.userData.phase = Math.random() * 8;
      h.userData.y = h.position.y;
      hearts.add(h);
    }
    scene.add(hearts);

    const count = navigator.deviceMemory && navigator.deviceMemory <= 4 ? 180 : 520;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - .5) * 28;
      positions[i * 3 + 1] = (Math.random() - .5) * 20;
      positions[i * 3 + 2] = -Math.random() * 20;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: state.theme === 'dark' ? MALASH.colors.accent.rose : MALASH.colors.accent.magenta,
      size: .045,
      transparent: true,
      opacity: .55,
      blending: state.theme === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false
    })));

    let t = 0;
    const tick = () => {
      if (!renderer || document.hidden) return;
      frame = requestAnimationFrame(tick);
      t += .01;
      if (!prefersReducedMotion) {
        hearts.children.forEach(h => {
          h.position.y = h.userData.y + Math.sin(t + h.userData.phase) * .1;
          h.rotation.y = Math.sin(t * .3 + h.userData.phase) * .13;
        });
      }
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

function beginEgg() {
  if (state.egg === 'playing') {
    finishEgg(true);
    return;
  }
  if (state.egg === 'done') {
    openLetterModal($('#egg-button'));
    return;
  }
  if (state.egg !== 'pending') return;

  state.egg = 'playing';
  const egg = $('#egg-button');
  egg.setAttribute('aria-expanded', 'true');
  egg.classList.add('cracking');
  if (navigator.vibrate) navigator.vibrate(12);
  if (prefersReducedMotion) {
    finishEgg(true);
    return;
  }

  eggTimeline = gsap.timeline({ onComplete: () => finishEgg(true) });
  eggTimeline.to(egg, { scale: .92, duration: MALASH.motion.instant / 1000, ease: MALASH.ease.spring })
    .to(egg, { scale: 1, duration: MALASH.motion.fast / 1000, ease: MALASH.ease.spring })
    .to(egg, { '--crack': 1, duration: (MALASH.motion.slow - MALASH.motion.fast) / 1000, ease: MALASH.ease.standard }, eggAt.crack)
    .to(egg, { scale: 1.04, duration: (MALASH.motion.base + MALASH.motion.instant) / 1000, ease: MALASH.ease.enter }, eggAt.split)
    .to(egg.querySelectorAll('.egg-shard'), {
      x: (i) => Math.cos(i * Math.PI / 4) * 72,
      y: (i) => Math.sin(i * Math.PI / 4) * 72,
      rotation: (i) => i % 2 ? 28 : -28,
      autoAlpha: 0,
      stagger: MALASH.stagger.particleBurst / 1000,
      duration: (MALASH.motion.base + MALASH.motion.instant) / 1000,
      ease: MALASH.ease.move
    }, eggAt.split)
    .to(egg.querySelector('.egg-core'), { scale: 3, autoAlpha: 0, duration: (MALASH.motion.slow - MALASH.motion.fast) / 1000, ease: MALASH.ease.enter }, eggAt.burst)
    .fromTo(egg.querySelector('.egg-ring'), { scale: .2, autoAlpha: .8 }, { scale: 4, autoAlpha: 0, duration: MALASH.motion.slow / 1000, ease: MALASH.ease.enter }, eggAt.burst)
    .to(egg, { scale: 1, duration: MALASH.motion.base / 1000, ease: MALASH.ease.standard }, eggAt.message);
}

function finishEgg(openAfter = false) {
  if (state.egg === 'done') {
    if (openAfter) openLetterModal($('#egg-button'));
    return;
  }
  eggTimeline?.eventCallback('onComplete', null).progress(1).pause();
  state.egg = 'done';
  const egg = $('#egg-button');
  egg?.classList.add('cracked');
  $('#letter')?.classList.add('is-cracked');
  egg?.setAttribute('aria-expanded', 'false');
  egg?.setAttribute('aria-label', content.nav.openLetter);
  if (egg) {
    egg.querySelector('.egg-label').textContent = content.nav.reopenHint;
    gsap.set([...egg.querySelectorAll('.egg-shard')].slice(0, 3), { autoAlpha: .22 });
  }
  if (openAfter) openLetterModal(egg);
}

function openLetterModal(source = $('#egg-button')) {
  if (state.egg === 'pending') return;
  if (state.egg === 'playing') finishEgg(false);
  eggOpenCount++;
  const first = eggOpenCount === 1;
  malashModal.open({
    source,
    title: content.letter.title,
    lines: content.letter.lines,
    signature: content.letter.signature,
    coupleHeader: true,
    closeLabel: content.nav.close,
    speed: first ? 1 : .4
  });
}

function openEcModal(source = $('#ec-secret')) {
  malashModal.open({
    source,
    title: content.surprises.ecNote.title,
    lines: [content.surprises.ecNote.body],
    signature: content.surprises.ecNote.signature,
    closeLabel: content.nav.close,
    speed: .4
  });
}

function showSecretCounter() {
  let toast = $('#secret-counter');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'secret-counter';
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  toast.textContent = content.surprises.counter.replace('{n}', String(foundSecrets.size));
  toast.classList.add('is-visible');
  clearTimeout(secretTimer);
  secretTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

function foundSecret(key) {
  if (foundSecrets.has(key)) return;
  foundSecrets.add(key);
  showSecretCounter();
}

function fastForwardMomentsBefore(index) {
  if (index > 1 && state.egg !== 'done' && state.egg !== 'pending') finishEgg();
  if (index > 1 && state.egg === 'pending') {
    state.egg = 'done';
    $('#letter')?.classList.add('is-cracked');
    $('#egg-button')?.classList.add('cracked');
    $('#egg-button')?.setAttribute('aria-label', content.nav.openLetter);
    $('#egg-button .egg-label')?.replaceChildren(document.createTextNode(content.nav.reopenHint));
  }
  if (index > 4 && state.names !== 'done') {
    gsap.killTweensOf('[data-name-line],.star-pattern');
    gsap.set('[data-name-line]', { clipPath: 'inset(0 0% 0 0)' });
    gsap.set('.star-pattern', { rotation: 45 });
    state.names = 'done';
  }
}

function checkLetterLayout() {
  const name = $('#letter-name'), egg = $('#egg-button'), status = $('#layout-status');
  if (!name || !egg || !status) return;
  const a = name.getBoundingClientRect(), b = egg.getBoundingClientRect();
  const overlap = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  status.textContent = overlap ? 'Layout warning: nameplate and egg overlap.' : 'Letter layout verified: nameplate remains above the egg.';
  document.documentElement.dataset.letterOverlap = String(overlap);
}

function bind() {
  root.querySelectorAll('.chapter-dock a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const i = chapterIds.indexOf(a.dataset.chapter);
    fastForwardMomentsBefore(i);
    $('#' + a.dataset.chapter).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }));

  root.querySelectorAll('.icon-button, .action-button, .carrier').forEach(el => el.addEventListener('pointerdown', () => pressFeedback(el)));

  $('#enter-button').addEventListener('click', () => {
    state.started = true;
    $('#home').classList.add('entered');
    const cue = $('#scroll-cue');
    cue.hidden = false;
    gsap.to(camera?.position || {}, { y: MALASH.camera.enterY, duration: MALASH.motion.slow / 1000, ease: MALASH.ease.cinematic });
    exit($('.home-content')).eventCallback('onComplete', () => enter(cue));
  });

  $('#home-sound').addEventListener('click', () => {
    state.sound = !state.sound;
    safeSet('malash-sound', String(state.sound));
    const b = $('#home-sound');
    b.setAttribute('aria-label', state.sound ? content.home.soundOn : content.home.soundOff);
    b.innerHTML = svg(state.sound ? 'sound' : 'mute') + '<span>' + escapeHTML(state.sound ? content.home.soundOn : content.home.soundOff) + '</span>';
    $('#sound-toggle').innerHTML = svg(state.sound ? 'sound' : 'mute');
    $('#sound-toggle').setAttribute('aria-label', state.sound ? content.home.soundOn : content.home.soundOff);
    $('#sound-toggle').setAttribute('aria-pressed', String(state.sound));
  });

  $('#sound-toggle').addEventListener('click', () => {
    state.sound = !state.sound;
    safeSet('malash-sound', String(state.sound));
    const b = $('#sound-toggle');
    b.innerHTML = svg(state.sound ? 'sound' : 'mute');
    b.setAttribute('aria-label', state.sound ? content.home.soundOn : content.home.soundOff);
    b.setAttribute('aria-pressed', String(state.sound));
    $('#home-sound').innerHTML = svg(state.sound ? 'sound' : 'mute') + '<span>' + escapeHTML(state.sound ? content.home.soundOn : content.home.soundOff) + '</span>';
    $('#home-sound').setAttribute('aria-label', state.sound ? content.home.soundOn : content.home.soundOff);
  });

  $('#narration-toggle').addEventListener('click', () => {
    state.narration = !state.narration;
    safeSet('malash-narration', String(state.narration));
    const b = $('#narration-toggle');
    b.setAttribute('aria-label', state.narration ? content.ui.narrationOn : content.ui.narrationOff);
    b.setAttribute('aria-pressed', String(state.narration));
  });

  $('#theme-toggle').addEventListener('click', e => switchTheme(e.currentTarget));
  $('#auto-toggle').addEventListener('click', () => toggleAuto());
  $('#restart').addEventListener('click', restart);
  $('#egg-button').addEventListener('click', beginEgg);

  $('#utility-menu').addEventListener('click', e => {
    const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
    e.currentTarget.setAttribute('aria-expanded', String(!expanded));
    e.currentTarget.setAttribute('aria-label', expanded ? 'Open controls' : 'Close controls');
    e.currentTarget.innerHTML = svg(expanded ? 'menu' : 'close');
    $('.hud').classList.toggle('utilities-open', !expanded);
    if (expanded) e.currentTarget.focus({ preventScroll: true });
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#utility-menu')?.getAttribute('aria-expanded') === 'true') {
      $('#utility-menu').click();
    }
  });
  addEventListener('pointerdown', e => {
    const menu = $('#utility-menu'), controls = $('#utility-controls');
    if (menu?.getAttribute('aria-expanded') === 'true' && !menu.contains(e.target) && !controls?.contains(e.target)) menu.click();
  });

  // Surprise 1: Constellation
  root.querySelectorAll('[data-secret^="constellation-"]').forEach(b => b.addEventListener('click', () => {
    const idx = b.dataset.secret.split('-')[1];
    constellationStars.add(idx);
    b.classList.add('found');
    if (constellationStars.size === 3) {
      $('#constellation-art').classList.add('is-drawn');
      foundSecret('constellation');
      setTimeout(() => $('#constellation-art')?.classList.remove('is-drawn'), MALASH.motion.epic);
    }
  }));

  // Surprise 5: Egg shards
  root.querySelectorAll('[data-secret^="shard-"]').forEach(b => b.addEventListener('click', () => {
    b.classList.add('found');
    playGlassTick();
    gsap.fromTo(b, { y: 0, autoAlpha: .7 }, { y: -40, autoAlpha: 0, duration: MALASH.motion.cinematic / 1000, ease: MALASH.ease.enter });
    foundSecret('shards');
  }));

  // Surprise 4: Crescent
  root.querySelector('[data-secret="crescent"]').addEventListener('click', e => {
    foundSecret('crescent');
    const dua = content.surprises.crescent;
    malashModal.open({
      source: e.currentTarget,
      title: 'A quiet dua',
      lines: [dua.arabic, dua.transliteration, dua.translation, dua.status],
      closeLabel: content.nav.close,
      speed: .4
    });
  });

  // Surprise 3: Beyond the end (Tail)
  root.querySelector('[data-secret="tail"]').addEventListener('click', e => {
    foundSecret('tail');
    $('#tail-line').hidden = false;
    enter($('#tail-line'));
    e.currentTarget.classList.add('found');
  });

  // Surprise 6: EC Office note
  $('#ec-secret').addEventListener('click', e => {
    foundSecret('ec');
    openEcModal(e.currentTarget);
  });

  // Surprise 2: Held heart
  let holdTimer, heldHeart = false;
  root.querySelectorAll('[data-heart-secret]').forEach(heart => {
    const reveal = () => {
      heldHeart = true;
      heart.classList.add('heart-open');
      foundSecret('heart');
      malashModal.open({
        source: heart,
        title: content.surprises.heartTagline,
        lines: [content.surprises.heartTagline],
        closeLabel: content.nav.close,
        speed: .4
      });
    };
    heart.addEventListener('pointerdown', () => {
      heldHeart = false;
      holdTimer = setTimeout(reveal, 500);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => heart.addEventListener(type, () => clearTimeout(holdTimer)));
    heart.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        clearTimeout(holdTimer);
        reveal();
      }
    });
    heart.addEventListener('click', e => {
      if (heldHeart) e.preventDefault();
    });
  });

  // Wishes reveal
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

  $('#ameen-button').addEventListener('click', () => {
    const light = $('#ameen-light');
    gsap.fromTo(light, { y: 20, autoAlpha: 1, scale: .3 }, { y: -95, autoAlpha: 0, scale: 1, duration: duration(prefersReducedMotion ? MALASH.motion.base : MALASH.motion.cinematic) / 1000, ease: MALASH.ease.enter });
  });

  $('#card-name').addEventListener('input', drawCard);
  $('#card-wish').addEventListener('input', drawCard);
  $('#create-card').addEventListener('click', () => {
    drawCard();
    $('#wish-card-canvas').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#save-card').addEventListener('click', saveCard);
  $('#share-card').addEventListener('click', shareCard);
  $('#share-link').addEventListener('click', shareLink);
  $('#keepsake').addEventListener('click', saveKeepsake);

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
  autoTarget = state.auto && (state.egg === 'playing' || state.names === 'playing' || malashModal.opened) ? 0 : (state.auto ? MALASH.scroll.autoplayPixelsPerSecond : 0);
  const dt = Math.min((now - lastAuto) / 1000, .05);
  lastAuto = now;
  autoVelocity += (autoTarget - autoVelocity) * Math.min(dt / (MALASH.motion.base / 1000), 1);
  if (autoVelocity > .1 && !malashModal.opened) window.scrollBy(0, autoVelocity * dt);
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
    state.started = false;
    state.egg = 'pending';
    state.names = 'pending';
    state.read.clear();
    autoVelocity = 0;
    autoTarget = 0;
    state.home = ['lantern', 'letter'].includes(query.get('home')) ? query.get('home') : ['lantern', 'letter'][Math.floor(Math.random() * 2)];
    letterObserver?.disconnect();
    ScrollTrigger.getAll().forEach(t => t.kill());
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

function resizeRail() {
  if (malashModal.opened) return;
  const y = scrollY + innerHeight * .45;
  let active = 0;
  chapterIds.forEach((id, i) => {
    const el = $('#' + id);
    if (el && el.offsetTop <= y) active = i;
  });
  activeChapter = active;
  const dock = $('.chapter-dock');
  dock?.style.setProperty('--active-index', String(active));
  dock?.querySelectorAll('a').forEach((a, i) => a.classList.toggle('active', i === active));
  $('#dock-progress')?.style.setProperty('--progress', `${(active / Math.max(1, chapterIds.length - 1)) * 100}%`);
}

function setupScroll() {
  ScrollTrigger.getAll().forEach(t => t.kill());
  const skyUpdate = self => {
    if (malashModal.opened) return;
    const p = self.progress;
    applySky(p);
    if (p > .26 && state.egg === 'pending') beginEgg();
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

  chapterIds.forEach((id, i) => ScrollTrigger.create({
    id: 'chapter-' + i,
    trigger: '#' + id,
    start: 'top 55%',
    end: 'bottom 45%',
    onEnter: () => {
      if (malashModal.opened) return;
      fastForwardMomentsBefore(i);
      if (i === 1 && state.egg === 'pending') beginEgg();
      if (i === 4 && state.names === 'pending') animateNames();
      if (i > 0) {
        const nodes = $('#' + id).querySelectorAll('.eyebrow, h2, h3, .journey-quote, .verse-card, .farewell-title');
        nodes.forEach(el => enter(el));
      }
    },
    onEnterBack: () => {
      if (malashModal.opened) return;
      resizeRail();
    }
  }));

  if (!scrollEventsBound) {
    addEventListener('scroll', resizeRail, { passive: true });
    addEventListener('wheel', pauseAuto, { passive: true });
    addEventListener('touchstart', pauseAuto, { passive: true });
    addEventListener('pointerdown', () => {
      if (state.egg === 'playing' && !malashModal.opened) finishEgg(true);
    }, { capture: true });

    addEventListener('keydown', e => {
      pauseAuto();
      if (malashModal.opened) return;
      if (e.target.matches('input, textarea, [contenteditable=true]')) return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '].includes(e.key)) {
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
    window.malashLenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => {
      if (!malashModal.opened) lenis?.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  resizeRail();
  ScrollTrigger.refresh();
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
  const name = $('#card-name').value.trim().slice(0, 30);
  const wish = $('#card-wish').value.trim().slice(0, 140);
  const canvas = $('#wish-card-canvas');
  const ctx = canvas.getContext('2d');
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

async function init() {
  document.title = content.meta.pageTitle;
  $('meta[name="description"]')?.setAttribute('content', content.meta.description);
  $('meta[property="og:title"]')?.setAttribute('content', content.meta.ogTitle);
  $('meta[property="og:description"]')?.setAttribute('content', content.meta.ogDescription);
  render();
  applySky(0);
  init3d();
  setupScroll();
  checkLetterLayout();
  letterObserver = new ResizeObserver(checkLetterLayout);
  letterObserver.observe($('#letter'));
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
