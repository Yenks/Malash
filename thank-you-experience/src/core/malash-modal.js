import { gsap } from 'gsap';
import { MALASH, prefersReducedMotion } from './malash.js';

export class MalashModal {
  constructor(host) {
    this.host = host;
    this.opened = false;
    this.isOpening = false;
    this.animation = null;
    this.origin = null;
    this.restoreFocus = null;
    this.scrollY = 0;
    this.scrollContainerTop = 0;
    this.wasLenisRunning = false;
    this.inertSiblings = [];

    this.host.innerHTML = `
      <div class="malash-modal" id="malash-modal" aria-hidden="true">
        <div class="modal-backdrop"></div>
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
          <svg class="modal-ornament" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect x="1" y="1" width="98" height="98" rx="3" pathLength="1"/>
          </svg>
          <div class="modal-glow" aria-hidden="true"></div>
          <header class="modal-header">
            <p class="modal-name" hidden></p>
            <p class="modal-greeting" hidden></p>
            <h2 id="modal-title"></h2>
          </header>
          <div class="modal-body"></div>
          <footer class="modal-footer">
            <p class="modal-signature"></p>
            <button type="button" class="icon-button modal-close" aria-label="Close" title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m18 6-12 12M6 6l12 12"/>
              </svg>
            </button>
          </footer>
        </section>
      </div>
    `;

    this.el = this.host.querySelector('.malash-modal');
    this.backdrop = this.host.querySelector('.modal-backdrop');
    this.card = this.host.querySelector('.modal-card');
    this.closeBtn = this.host.querySelector('.modal-close');

    // Tap backdrop or modal outer area closes if settled, or fast-forwards if opening
    this.el.addEventListener('click', event => {
      if (this.isOpening) {
        this.fastForward();
        return;
      }
      if (event.target === this.backdrop || event.target === this.el) {
        this.close();
      }
    });

    // Tap card fast-forwards if opening, otherwise stays within card
    this.card.addEventListener('click', event => {
      if (this.isOpening) {
        this.fastForward();
      }
      event.stopPropagation();
    });

    this.closeBtn.addEventListener('click', event => {
      event.stopPropagation();
      this.close();
    });

    this.onKey = event => {
      if (!this.opened) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = [...this.card.querySelectorAll('button:not([disabled]), a[href], input, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter(el => el.offsetParent !== null);
      if (!items.length) {
        event.preventDefault();
        this.card.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    this.lockEvents = event => {
      if (!this.opened) return;

      // Allow natural scrolling inside .modal-body
      if (event.type === 'wheel' || event.type === 'touchmove') {
        if (!event.target.closest('.modal-body')) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return;
      }

      // Lock scroll-related keys outside modal-body
      if (event.type === 'keydown') {
        const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End', 'ArrowLeft', 'ArrowRight'];
        if (keys.includes(event.key) && !event.target.closest('.modal-body')) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    };
  }

  fastForward() {
    if (!this.opened || !this.animation || !this.isOpening) return;
    this.animation.progress(1);
    this.isOpening = false;
  }

  open({ source, title, lines = [], signature = '', coupleHeader = false, closeLabel = 'Close', onClose, speed = 1 } = {}) {
    if (this.opened) return;
    if (this.closeAnimation) {
      this.closeAnimation.kill();
      this.closeAnimation = null;
      this.el.classList.remove('is-visible');
    }
    this.opened = true;
    this.isOpening = true;
    this.onClose = onClose;
    this.restoreFocus = source || document.activeElement;

    delete this.card.dataset.ready;

    // Measure origin from source (e.g. egg button)
    const start = source?.getBoundingClientRect();
    this.origin = (start && start.width > 0 && start.height > 0) ? {
      x: start.left + start.width / 2,
      y: start.top + start.height / 2,
      width: start.width,
      height: start.height
    } : null;

    const name = this.card.querySelector('.modal-name');
    const greeting = this.card.querySelector('.modal-greeting');
    name.hidden = !coupleHeader;
    greeting.hidden = !coupleHeader;
    name.textContent = coupleHeader ? 'Machele & Salash' : '';
    greeting.textContent = coupleHeader ? 'To our dear newlyweds' : '';

    this.card.querySelector('#modal-title').textContent = title || '';
    this.card.querySelector('.modal-signature').textContent = signature || '';

    const body = this.card.querySelector('.modal-body');
    body.replaceChildren();
    lines.forEach(line => {
      const p = document.createElement('p');
      p.textContent = line;
      p.dataset.revealLine = '';
      body.append(p);
    });

    this.closeBtn.setAttribute('aria-label', closeLabel);
    this.closeBtn.setAttribute('title', closeLabel);

    this.el.classList.add('is-visible');
    this.el.setAttribute('aria-hidden', 'false');

    this.scrollY = window.scrollY;
    this.scrollContainerTop = document.scrollingElement?.scrollTop || 0;
    this.wasLenisRunning = !!window.malashLenis && !window.malashLenis.isStopped;
    window.malashLenis?.stop();
    this.inertSiblings = [...document.body.children].filter(node => node !== this.host && !node.inert);
    this.inertSiblings.forEach(node => { node.inert = true; });

    document.documentElement.classList.add('modal-open');

    // Calculate FLIP offset and scale
    const r = this.card.getBoundingClientRect();
    const dx = this.origin ? this.origin.x - (r.left + r.width / 2) : 0;
    const dy = this.origin ? this.origin.y - (r.top + r.height / 2) : 0;
    const scale = this.origin ? Math.min(this.origin.width / r.width, this.origin.height / r.height, 1) : 0.94;
    const reduced = prefersReducedMotion;

    gsap.set([this.backdrop, this.card], { clearProps: 'all' });
    gsap.set(this.backdrop, { autoAlpha: 0, backdropFilter: 'blur(0px)' });
    gsap.set(this.card, {
      x: reduced ? 0 : dx,
      y: reduced ? 0 : dy,
      scale: reduced ? 1 : scale,
      autoAlpha: reduced ? 0 : 1,
      transformOrigin: 'center center'
    });
    gsap.set(this.card.querySelectorAll('[data-reveal-line]'), { autoAlpha: 0, y: reduced ? 0 : 8 });
    gsap.set(this.card.querySelector('.modal-ornament rect'), { strokeDashoffset: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        this.isOpening = false;
        this.card.dataset.ready = 'true';
        this.closeBtn.focus({ preventScroll: true });
      }
    });
    this.animation = tl;

    // Open animation spec
    const backdropDur = (reduced ? MALASH.motion.reducedFade : MALASH.motion.slow * speed) / 1000;
    const cardDur = (reduced ? MALASH.motion.reducedFade : MALASH.motion.cinematic * speed) / 1000;
    const borderDur = (reduced ? MALASH.motion.reducedFade : MALASH.motion.slow * speed) / 1000;
    const textDur = (reduced ? MALASH.motion.reducedFade : MALASH.motion.base * speed) / 1000;
    const textStagger = reduced ? 0 : (MALASH.stagger.textLine * speed) / 1000;

    tl.to(this.backdrop, {
      autoAlpha: 1,
      backdropFilter: 'blur(10px)',
      duration: backdropDur,
      ease: MALASH.ease.standard
    }, 0)
      .to(this.card, {
        x: 0,
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: cardDur,
        ease: MALASH.ease.cinematic
      }, 0)
      .to(this.card.querySelector('.modal-ornament rect'), {
        strokeDashoffset: 0,
        duration: borderDur,
        ease: MALASH.ease.standard
      }, reduced ? 0 : (MALASH.motion.fast * speed) / 1000)
      .to(this.card.querySelectorAll('[data-reveal-line]'), {
        autoAlpha: 1,
        y: 0,
        duration: textDur,
        stagger: textStagger,
        ease: MALASH.ease.enter
      }, reduced ? 0 : (MALASH.motion.slow * speed) / 1000)
      .fromTo(this.closeBtn, { autoAlpha: 0 }, {
        autoAlpha: 1,
        duration: (MALASH.motion.fast * speed) / 1000,
        ease: MALASH.ease.standard
      }, reduced ? 0 : (MALASH.motion.slow * speed) / 1000);

    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('keydown', this.lockEvents, true);
    window.addEventListener('wheel', this.lockEvents, { capture: true, passive: false });
    window.addEventListener('touchmove', this.lockEvents, { capture: true, passive: false });
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.isOpening = false;
    this.animation?.kill();

    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('keydown', this.lockEvents, true);
    window.removeEventListener('wheel', this.lockEvents, true);
    window.removeEventListener('touchmove', this.lockEvents, true);

    // Re-measure target in case of any layout settling
    const targetRect = this.restoreFocus?.getBoundingClientRect();
    const target = (targetRect && targetRect.width > 0 && targetRect.height > 0) ? {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
      width: targetRect.width,
      height: targetRect.height
    } : this.origin;

    const r = this.card.getBoundingClientRect();
    const dx = target ? target.x - (r.left + r.width / 2) : 0;
    const dy = target ? target.y - (r.top + r.height / 2) : 0;
    const scale = target ? Math.min(target.width / r.width, target.height / r.height, 1) : 0.94;
    const reduced = prefersReducedMotion;

    const closeDur = (reduced ? MALASH.motion.reducedFade : MALASH.motion.slow) / 1000;

    this.closeAnimation = gsap.timeline({
      onComplete: () => {
        this.closeAnimation = null;
        this.el.classList.remove('is-visible');
        this.el.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('modal-open');
        document.documentElement.scrollTop = this.scrollContainerTop;
        window.scrollTo({ top: this.scrollY, behavior: 'instant' });
        if (this.wasLenisRunning) window.malashLenis?.start();
        this.inertSiblings.forEach(node => { node.inert = false; });
        this.restoreFocus?.focus?.({ preventScroll: true });
        this.onClose?.();
      }
    })
      .to(this.backdrop, {
        autoAlpha: 0,
        duration: closeDur,
        ease: MALASH.ease.exit
      }, 0)
      .to(this.card, {
        x: reduced ? 0 : dx,
        y: reduced ? 0 : dy,
        scale: reduced ? 1 : scale,
        autoAlpha: 0,
        duration: closeDur,
        ease: MALASH.ease.cinematic
      }, 0);
  }
}
