import { gsap } from 'gsap';
import { MALASH, prefersReducedMotion } from './malash.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export class MalashModal {
  constructor(host) {
    this.host = host;
    this.opened = false;
    this.animation = null;
    this.origin = null;
    this.restoreFocus = null;
    this.scrollY = 0;
    this.inertSiblings = [];
    this.host.innerHTML = `<div class="malash-modal" id="malash-modal" aria-hidden="true"><div class="modal-backdrop"></div><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><svg class="modal-ornament" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="98" height="98" rx="3" pathLength="1"/></svg><div class="modal-glow" aria-hidden="true"></div><header class="modal-header"><p class="modal-name" hidden></p><p class="modal-greeting" hidden></p><h2 id="modal-title"></h2></header><div class="modal-body"></div><footer class="modal-footer"><p class="modal-signature"></p><button type="button" class="icon-button modal-close" aria-label="Close" title="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m18 6-12 12M6 6l12 12"/></svg></button></footer></section></div>`;
    this.el = this.host.querySelector('.malash-modal');
    this.backdrop = this.host.querySelector('.modal-backdrop');
    this.card = this.host.querySelector('.modal-card');
    this.el.addEventListener('click', event => { if (event.target === this.backdrop || event.target === this.el) this.close(); });
    this.card.addEventListener('click', event => event.stopPropagation());
    this.host.querySelector('.modal-close').addEventListener('click', () => this.close());
    this.onKey = event => {
      if (!this.opened) return;
      if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
      if (event.key !== 'Tab') return;
      const items = [...this.card.querySelectorAll('button:not([disabled]),a[href],input,textarea,[tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
      if (!items.length) { event.preventDefault(); this.card.focus(); return; }
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    this.lockKeys = event => {
      if (!this.opened) return;
      if (event.type === 'keydown' && ['ArrowDown','ArrowUp','PageDown','PageUp',' ','Home','End'].includes(event.key) && !event.target.closest('.modal-card')) { event.preventDefault(); event.stopImmediatePropagation(); }
      if (event.type === 'wheel' || event.type === 'touchmove') { if (!event.target.closest('.modal-body')) { event.preventDefault(); event.stopImmediatePropagation(); } }
    };
  }

  open({source, title, lines = [], signature = '', coupleHeader = false, closeLabel = 'Close', onClose, speed = 1} = {}) {
    if (this.opened) return;
    this.opened = true; this.onClose = onClose; this.restoreFocus = source || document.activeElement;
    delete this.card.dataset.ready;
    const start = source?.getBoundingClientRect();
    this.origin = start ? { x: start.left + start.width / 2, y: start.top + start.height / 2, width: start.width, height: start.height } : null;
    const name = this.card.querySelector('.modal-name'), greeting = this.card.querySelector('.modal-greeting');
    name.hidden = !coupleHeader; greeting.hidden = !coupleHeader;
    name.textContent = coupleHeader ? 'Machele & Salash' : '';
    greeting.textContent = coupleHeader ? 'To our dear newlyweds' : '';
    this.card.querySelector('#modal-title').textContent = title || '';
    this.card.querySelector('.modal-signature').textContent = signature || '';
    const body = this.card.querySelector('.modal-body'); body.replaceChildren();
    lines.forEach(line => { const p = document.createElement('p'); p.textContent = line; p.dataset.revealLine = ''; body.append(p); });
    this.host.querySelector('.modal-close').setAttribute('aria-label', closeLabel);
    this.el.classList.add('is-visible'); this.el.setAttribute('aria-hidden','false');
    this.scrollY = window.scrollY;
    this.inertSiblings = [...document.body.children].filter(node => node !== this.host && !node.inert);
    this.inertSiblings.forEach(node => { node.inert = true; });
    document.body.style.setProperty('--modal-lock-top', `${-this.scrollY}px`);
    document.body.classList.add('modal-open');
    const r = this.card.getBoundingClientRect();
    const dx = this.origin ? this.origin.x - (r.left + r.width / 2) : 0;
    const dy = this.origin ? this.origin.y - (r.top + r.height / 2) : 0;
    const scale = this.origin ? Math.min(this.origin.width / r.width, this.origin.height / r.height, 1) : 0.94;
    const reduced = prefersReducedMotion;
    gsap.set([this.backdrop, this.card], { clearProps: 'all' });
    gsap.set(this.backdrop,{autoAlpha:0,backdropFilter:'blur(0px)'});
    gsap.set(this.card,{x:reduced?0:dx,y:reduced?0:dy,scale:reduced?1:scale,autoAlpha:reduced?0:1,transformOrigin:'center center'});
    gsap.set(this.card.querySelectorAll('[data-reveal-line]'),{autoAlpha:0,y:reduced?0:8});
    const tl = gsap.timeline({onComplete:()=>{this.card.dataset.ready='true';this.host.querySelector('.modal-close').focus();}}); this.animation=tl;
    tl.to(this.backdrop,{autoAlpha:1,backdropFilter:'blur(10px)',duration:(reduced?MALASH.motion.reducedFade:MALASH.motion.slow*speed)/1000,ease:MALASH.ease.standard},0)
      .to(this.card,{x:0,y:0,scale:1,autoAlpha:1,duration:(reduced?MALASH.motion.reducedFade:MALASH.motion.cinematic*speed)/1000,ease:MALASH.ease.cinematic},0)
      .to(this.card.querySelector('.modal-ornament rect'),{strokeDashoffset:0,duration:(reduced?MALASH.motion.reducedFade:MALASH.motion.slow*speed)/1000,ease:MALASH.ease.standard},reduced?0:MALASH.motion.fast*speed/1000)
      .to(this.card.querySelectorAll('[data-reveal-line]'),{autoAlpha:1,y:0,duration:(reduced?MALASH.motion.reducedFade:MALASH.motion.base*speed)/1000,stagger:reduced?0:MALASH.stagger.textLine*speed/1000,ease:MALASH.ease.enter},reduced?0:MALASH.motion.slow*speed/1000)
      .fromTo(this.host.querySelector('.modal-close'),{autoAlpha:0},{autoAlpha:1,duration:MALASH.motion.fast*speed/1000,ease:MALASH.ease.standard},reduced?0:MALASH.motion.slow*speed/1000);
    addEventListener('keydown',this.onKey,true); addEventListener('keydown',this.lockKeys,true); addEventListener('wheel',this.lockKeys,{capture:true,passive:false}); addEventListener('touchmove',this.lockKeys,{capture:true,passive:false});
  }

  close() {
    if (!this.opened) return;
    this.opened = false;
    this.animation?.kill();
    removeEventListener('keydown',this.onKey,true); removeEventListener('keydown',this.lockKeys,true); removeEventListener('wheel',this.lockKeys,true); removeEventListener('touchmove',this.lockKeys,true);
    const target = this.origin;
    const r = this.card.getBoundingClientRect();
    const dx = target ? target.x - (r.left + r.width / 2) : 0;
    const dy = target ? target.y - (r.top + r.height / 2) : 0;
    const scale = target ? Math.min(target.width / r.width,target.height / r.height,1) : .94;
    const reduced = prefersReducedMotion;
    gsap.timeline({onComplete:()=>{
      this.el.classList.remove('is-visible');this.el.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');document.body.style.removeProperty('--modal-lock-top');this.inertSiblings.forEach(node => { node.inert = false; });window.scrollTo(0,this.scrollY);this.restoreFocus?.focus?.();this.onClose?.();
    }}).to([this.backdrop,this.card],{autoAlpha:0,duration:(reduced?MALASH.motion.reducedFade:MALASH.motion.slow)/1000,ease:MALASH.ease.exit},0)
      .to(this.card,{x:reduced?0:dx,y:reduced?0:dy,scale:reduced?1:scale,duration:(reduced?MALASH.motion.reducedFade:MALASH.motion.cinematic)/1000,ease:MALASH.ease.cinematic},0);
  }
}
