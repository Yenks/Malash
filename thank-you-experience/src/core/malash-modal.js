import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip.js';
import { createFocusTrap } from 'focus-trap';
import { MALASH, duration, prefersReducedMotion } from './malash.js';

gsap.registerPlugin(Flip);

export class MalashModal {
  constructor() {
    this.root = document.getElementById('modal-root') || document.body;
    this.trap = null;
    this.isOpen = false;
    this.timeline = null;
    this.sourceElement = null;
    this.onCloseCallback = null;

    this.container = document.createElement('div');
    this.container.className = 'malash-modal-container';
    this.container.setAttribute('role', 'presentation');
    this.container.style.display = 'none';

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';

    this.card = document.createElement('article');
    this.card.className = 'modal-card';
    this.card.setAttribute('role', 'dialog');
    this.card.setAttribute('aria-modal', 'true');
    this.card.setAttribute('aria-labelledby', 'modal-nameplate');
    this.card.tabIndex = -1;

    this.glow = document.createElement('div');
    this.glow.className = 'modal-glow';
    this.glow.setAttribute('aria-hidden', 'true');

    this.svgBorder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgBorder.setAttribute('class', 'modal-border-svg');
    this.svgBorder.setAttribute('viewBox', '0 0 100 100');
    this.svgBorder.setAttribute('preserveAspectRatio', 'none');
    this.svgBorder.setAttribute('aria-hidden', 'true');
    this.svgBorder.innerHTML = '<path d="M2 2 H98 V98 H2 Z" pathLength="1" stroke="currentColor" fill="none" stroke-width="0.8" />';

    this.closeBtn = document.createElement('button');
    this.closeBtn.className = 'modal-close-btn';
    this.closeBtn.id = 'modal-close';
    this.closeBtn.setAttribute('aria-label', 'Close');
    this.closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:20px;height:20px"><path d="m18 6-12 12M6 6l12 12"/></svg>';

    this.header = document.createElement('header');
    this.header.className = 'modal-header';

    this.body = document.createElement('div');
    this.body.className = 'modal-body';

    this.card.appendChild(this.glow);
    this.card.appendChild(this.svgBorder);
    this.card.appendChild(this.closeBtn);
    this.card.appendChild(this.header);
    this.card.appendChild(this.body);

    this.container.appendChild(this.backdrop);
    this.container.appendChild(this.card);
    this.root.appendChild(this.container);

    this.setupListeners();
  }

  setupListeners() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    }, true);
  }

  open({ sourceElement, title, addressee, greeting, lines, signature, customHtml, speed = 1, onClose }) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.sourceElement = sourceElement || document.getElementById('egg-button');
    this.onCloseCallback = onClose;

    if (customHtml) {
      this.header.innerHTML = `
        <h2 class="letter-title modal-reveal-line" id="modal-nameplate" style="margin-bottom: var(--space-2);">${title || 'Your card is ready'}</h2>
      `;
      this.body.innerHTML = customHtml;
    } else {
      // Header layout: names must NEVER be covered by body copy
      this.header.innerHTML = `
        <p class="nameplate" id="modal-nameplate">${addressee || 'Machele & Salash'}</p>
        <p class="greeting-header">${greeting || 'To our dear newlyweds'}</p>
      `;

      // Body content lines
      this.body.innerHTML = `
        <h2 class="letter-title modal-reveal-line">${title || 'A letter of gratitude'}</h2>
        ${(lines || []).map((l, i) => `<p class="modal-reveal-line" data-line="${i}">${l}</p>`).join('')}
        <p class="modal-signature modal-reveal-line">${signature || 'With love and gratitude, the GMSA-KNUST family'}</p>
      `;
    }

    this.container.style.display = 'flex';
    this.container.style.pointerEvents = 'auto';
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // Focus trap initialization
    try {
      this.trap = createFocusTrap(this.card, {
        initialFocus: this.closeBtn,
        escapeDeactivates: false,
        clickOutsideDeactivates: false,
        returnFocusOnDeactivate: false,
        fallbackFocus: this.card,
      });
      this.trap.activate();
    } catch (_) {}

    const reduced = prefersReducedMotion;
    const durBase = duration(MALASH.motion.slow) / 1000 * speed;
    const path = this.svgBorder.querySelector('path');

    if (reduced) {
      gsap.set(this.backdrop, { autoAlpha: 1 });
      gsap.set(this.card, { autoAlpha: 1, scale: 1, x: 0, y: 0 });
      gsap.set(path, { strokeDashoffset: 0 });
      gsap.set(this.card.querySelectorAll('.modal-reveal-line'), { autoAlpha: 1, y: 0 });
      gsap.set(this.closeBtn, { autoAlpha: 1 });
      this.closeBtn.focus();
      return;
    }

    // Dynamic FLIP measurement from source rect to centered card rect
    const srcRect = this.sourceElement?.getBoundingClientRect() || {
      left: window.innerWidth / 2 - 40,
      top: window.innerHeight / 2 - 50,
      width: 80,
      height: 100
    };
    const cardRect = this.card.getBoundingClientRect();

    const scaleX = Math.max(0.1, Math.min(1, srcRect.width / cardRect.width));
    const scaleY = Math.max(0.1, Math.min(1, srcRect.height / cardRect.height));
    const deltaX = (srcRect.left + srcRect.width / 2) - (cardRect.left + cardRect.width / 2);
    const deltaY = (srcRect.top + srcRect.height / 2) - (cardRect.top + cardRect.height / 2);

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.closeBtn.focus();
      }
    });

    // 1. Backdrop fade and blur
    this.timeline.fromTo(this.backdrop, 
      { autoAlpha: 0, backdropFilter: 'blur(0px)' },
      { autoAlpha: 1, backdropFilter: 'blur(10px)', duration: durBase * 0.6, ease: MALASH.ease.enter },
      0
    );

    // 2. Card flies out from egg position using FLIP transform
    this.timeline.fromTo(this.card,
      { autoAlpha: 0, x: deltaX, y: deltaY, scaleX: scaleX, scaleY: scaleY },
      { autoAlpha: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, duration: durBase, ease: MALASH.ease.cinematic },
      0
    );

    // 3. Ornamental border draws itself (SVG stroke-dashoffset)
    this.timeline.fromTo(path,
      { strokeDasharray: 1, strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: durBase * 0.9, ease: MALASH.ease.move },
      durBase * 0.2
    );

    // 4. Content lines reveal with stagger
    this.timeline.fromTo(this.card.querySelectorAll('.modal-reveal-line'),
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: (MALASH.motion.base / 1000) * speed, stagger: (MALASH.stagger.textLine / 1000) * speed, ease: MALASH.ease.enter },
      durBase * 0.35
    );

    // 5. Close button fades in last
    this.timeline.fromTo(this.closeBtn,
      { autoAlpha: 0, scale: 0.7 },
      { autoAlpha: 1, scale: 1, duration: 0.25, ease: MALASH.ease.spring },
      "-=0.15"
    );
  }

  fastForward() {
    if (!this.isOpen || !this.timeline) return;
    this.timeline.progress(1);
  }

  close() {
    if (!this.isOpen) return;
    this.container.style.pointerEvents = 'none';

    if (this.trap) {
      try { this.trap.deactivate(); } catch (_) {}
      this.trap = null;
    }

    const reduced = prefersReducedMotion;
    const onDone = () => {
      this.isOpen = false;
      this.container.style.display = 'none';
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      if (this.sourceElement && typeof this.sourceElement.focus === 'function') {
        this.sourceElement.focus();
      }
      if (typeof this.onCloseCallback === 'function') {
        this.onCloseCallback();
      }
    };

    if (reduced) {
      onDone();
      return;
    }

    if (this.timeline) {
      this.timeline.kill();
    }

    // Collapse back into the egg's on-screen rectangle
    const srcRect = this.sourceElement?.getBoundingClientRect() || {
      left: window.innerWidth / 2 - 40,
      top: window.innerHeight / 2 - 50,
      width: 80,
      height: 100
    };
    const cardRect = this.card.getBoundingClientRect();
    const scaleX = Math.max(0.1, Math.min(1, srcRect.width / cardRect.width));
    const scaleY = Math.max(0.1, Math.min(1, srcRect.height / cardRect.height));
    const deltaX = (srcRect.left + srcRect.width / 2) - (cardRect.left + cardRect.width / 2);
    const deltaY = (srcRect.top + srcRect.height / 2) - (cardRect.top + cardRect.height / 2);

    const closeDur = duration(MALASH.motion.fast * 2) / 1000;
    gsap.timeline({ onComplete: onDone })
      .to(this.card, { autoAlpha: 0, x: deltaX, y: deltaY, scaleX: scaleX, scaleY: scaleY, duration: closeDur, ease: MALASH.ease.exit }, 0)
      .to(this.backdrop, { autoAlpha: 0, duration: closeDur * 0.8 }, 0);
  }
}
