import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './style.css';

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* -----------------------------------------------------------
   Utilidades
----------------------------------------------------------- */
// Formato es: 1.253 · 22,4
const fmt = (n, decimals = 0) => {
  const [int, dec] = Number(n).toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${grouped},${dec}` : grouped;
};

// Envuelve cada palabra en una máscara (respeta <mark>, una marca por palabra)
function splitWords(el) {
  const frag = document.createDocumentFragment();
  const wrap = (node) => {
    const mask = document.createElement('span');
    mask.className = 'w';
    const inner = document.createElement('span');
    inner.className = 'w-i';
    inner.appendChild(node);
    mask.appendChild(inner);
    return mask;
  };
  [...el.childNodes].forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(' ') : wrap(document.createTextNode(part)));
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const words = node.textContent.trim().split(/\s+/);
      words.forEach((word, i) => {
        const clone = node.cloneNode(false);
        clone.textContent = word;
        frag.appendChild(wrap(clone));
        if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
      });
    }
  });
  el.textContent = '';
  el.appendChild(frag);
}

function countUp(el) {
  if (!el || el.dataset.done) return;
  el.dataset.done = '1';
  const end = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const state = { v: 0 };
  gsap.to(state, {
    v: end,
    duration: 1.8,
    ease: 'power3.out',
    onUpdate: () => (el.textContent = fmt(state.v, decimals)),
  });
}

/* -----------------------------------------------------------
   Scroll suave
----------------------------------------------------------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (target) => {
  if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
};

/* -----------------------------------------------------------
   Menú móvil y enlaces internos
----------------------------------------------------------- */
const header = $('.header');
const menuBtn = $('.menu-btn');
const mobileMenu = $('#menu-movil');

function openMenu() {
  document.body.classList.add('menu-open');
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Cerrar menú');
  mobileMenu.inert = false;
  header.classList.remove('is-hidden');
  lenis?.stop();
  if (!reduceMotion) {
    gsap.fromTo(
      $$('.mobile-menu nav a, .mobile-menu-foot'),
      { yPercent: 60, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: 'expo.out', delay: 0.25 },
    );
  }
}
function closeMenu() {
  if (!document.body.classList.contains('menu-open')) return;
  document.body.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Abrir menú');
  mobileMenu.inert = true;
  lenis?.start();
}
menuBtn?.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(target);
  });
});

/* -----------------------------------------------------------
   Cabecera, botón de WhatsApp
----------------------------------------------------------- */
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    header.classList.toggle('is-scrolled', y > 30);
    header.classList.toggle('is-hidden', self.direction === 1 && y > 600 && !document.body.classList.contains('menu-open'));
  },
});

const waFloat = $('.wa-float');
ScrollTrigger.create({
  trigger: '.hero',
  start: 'bottom 75%',
  onEnter: () => waFloat.classList.add('is-visible'),
  onLeaveBack: () => waFloat.classList.remove('is-visible'),
});

/* -----------------------------------------------------------
   Comparador antes / después
----------------------------------------------------------- */
const compare = $('[data-compare]');
const compareRange = compare && $('.compare-range', compare);
const setCompare = (v) => {
  compare.style.setProperty('--pos', `${v}%`);
  compareRange.value = Math.round(v);
};
compareRange?.addEventListener('input', (e) => setCompare(e.target.value));

/* -----------------------------------------------------------
   Stickers arrastrables
----------------------------------------------------------- */
Draggable.create('.sticker', {
  type: 'x,y',
  bounds: '.hero',
  inertia: true,
  zIndexBoost: true,
  onPress() {
    gsap.to(this.target, { scale: 1.08, duration: 0.2 });
  },
  onRelease() {
    gsap.to(this.target, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
  },
  onDragStart() {
    gsap.to('.hand-hero', { opacity: 0, duration: 0.3 });
  },
});

/* -----------------------------------------------------------
   Animaciones
----------------------------------------------------------- */
const counters = $$('[data-count]');

if (reduceMotion) {
  $('.loader')?.remove();
} else {
  // Preparación
  $$('[data-split]').forEach(splitWords);
  counters.forEach((el) => (el.textContent = fmt(0, parseInt(el.dataset.decimals || '0', 10))));
  gsap.set('.hero-title mark, [data-split] mark', { '--mk': '0%' });

  // 1) Método: scroll horizontal fijado (se crea primero para que el resto de triggers mida bien)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    const hs = $('.hscroll');
    const track = $('.hscroll-track');
    hs.classList.add('is-horizontal');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: hs,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    return () => {
      hs.classList.remove('is-horizontal');
      gsap.set(track, { clearProps: 'transform' });
    };
  });

  // 2) Intro
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const loader = $('.loader');
  if (loader) {
    lenis?.stop();
    intro
      .from('.loader-num > span', { yPercent: 110, duration: 1.2 })
      .from('.loader-top, .loader-name', { opacity: 0, duration: 0.8 }, '-=0.8')
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '+=0.3')
      .add(() => {
        loader.remove();
        lenis?.start();
      });
  }
  intro
    .from('.nav', { y: -20, opacity: 0, duration: 1 }, '-=0.45')
    .from('.hero-title .line > span', { yPercent: 115, duration: 1.3, stagger: 0.08 }, '<')
    .from('.hero-label', { opacity: 0, y: 12, duration: 0.9 }, '<0.2')
    .to('.hero-title mark', { '--mk': '100%', duration: 0.8, stagger: 0.15, ease: 'power3.inOut' }, '-=0.6')
    .from('.hero-bottom', { opacity: 0, y: 30, duration: 1.1 }, '<')
    .from('.reel', { y: 140, rotation: 8, opacity: 0, duration: 1.5 }, '-=1.4')
    .from('.sticker', { scale: 0, rotation: -40, duration: 0.9, stagger: 0.12, ease: 'back.out(1.8)' }, '-=0.8')
    .from('.hand-hero', { opacity: 0, x: -10, duration: 0.6 }, '-=0.3');

  // Parallax del reel
  gsap.to('.hero-visual', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // 3) Títulos palabra por palabra + resaltado
  $$('[data-split]').forEach((el) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%' } });
    tl.from($$('.w-i', el), { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.04 });
    const marks = $$('mark', el);
    if (marks.length) tl.to(marks, { '--mk': '100%', duration: 0.7, stagger: 0.1, ease: 'power3.inOut' }, '-=0.6');
  });

  // 4) Apariciones genéricas
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });
  $$('[data-stagger]').forEach((group) => {
    gsap.from(group.children, {
      y: 60,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: group, start: 'top 86%' },
    });
  });

  // 5) Contadores
  counters.forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) });
  });

  // 6) Cifras
  gsap.from('.stat', {
    yPercent: 30,
    opacity: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.08,
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '.stats', start: 'top 88%' },
  });

  // 7) Comparador: barrido automático la primera vez
  if (compare) {
    const s = { v: 50 };
    gsap
      .timeline({ scrollTrigger: { trigger: compare, start: 'top 70%' } })
      .from(compare, { y: 60, rotation: 3, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .fromTo(s, { v: 94 }, { v: 10, duration: 1.6, ease: 'power2.inOut', onUpdate: () => setCompare(s.v) }, '-=0.6')
      .to(s, { v: 50, duration: 1.2, ease: 'power3.out', onUpdate: () => setCompare(s.v) });
  }

  // 8) Notificaciones
  $$('.notif').forEach((n, i) => {
    gsap.from(n, {
      x: 90,
      rotation: i % 2 ? -3 : 3,
      opacity: 0,
      duration: 1,
      ease: 'expo.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: n, start: 'top 90%' },
    });
  });

  // 9) Visuales del método
  gsap.from('.viz-cal i', {
    scale: 0,
    duration: 0.5,
    ease: 'back.out(2)',
    stagger: { each: 0.02, from: 'random' },
    scrollTrigger: { trigger: '.hscroll', start: 'top 70%' },
  });
  gsap.from('.sc-row i', {
    scaleX: 0,
    transformOrigin: 'left center',
    duration: 0.8,
    ease: 'expo.out',
    stagger: 0.06,
    scrollTrigger: { trigger: '.hscroll', start: 'top 60%' },
  });

  // 10) Testimonios
  gsap.fromTo(
    '.testi-card',
    { y: 90, scale: 0.9 },
    { y: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.testi-card', start: 'top bottom', end: 'top 35%', scrub: true } },
  );

  // 11) Pack Estrella
  gsap.from('.star', {
    y: 80,
    opacity: 0,
    duration: 1.2,
    ease: 'expo.out',
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '.star', start: 'top 85%' },
  });

  // 12) Final y footer
  gsap.from('.final-big .line > span', {
    yPercent: 115,
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.1,
    scrollTrigger: { trigger: '.final-big', start: 'top 85%' },
  });
  gsap.from('.footer-big span', {
    yPercent: 100,
    duration: 1.4,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.footer-big', start: 'top 95%' },
  });

  // 13) Botones magnéticos
  if (finePointer) {
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('pointerleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  // 14) Cursor personalizado
  if (finePointer) {
    const cur = $('.cursor');
    const label = $('.cursor-label', cur);
    gsap.set(cur, { x: -100, y: -100 });
    const xTo = gsap.quickTo(cur, 'x', { duration: 0.3, ease: 'power3' });
    const yTo = gsap.quickTo(cur, 'y', { duration: 0.3, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a, button, summary, input, [data-cursor]');
      cur.classList.toggle('is-hover', !!t);
      label.textContent = t?.dataset.cursor || '';
    });
    document.documentElement.addEventListener('mouseleave', () => cur.classList.add('is-hidden'));
    document.documentElement.addEventListener('mouseenter', () => cur.classList.remove('is-hidden'));
  }
}

/* -----------------------------------------------------------
   Preguntas frecuentes (acordeón animado)
----------------------------------------------------------- */
$$('.qa').forEach((item) => {
  const summary = $('summary', item);
  const body = $('.qa-body', item);
  if (item.open) item.classList.add('is-open');

  summary.addEventListener('click', (e) => {
    e.preventDefault();
    if (item.classList.contains('is-open')) {
      item.classList.remove('is-open');
      if (reduceMotion) {
        item.open = false;
        return;
      }
      gsap.to(body, {
        height: 0,
        opacity: 0,
        duration: 0.45,
        ease: 'power3.inOut',
        onComplete: () => {
          item.open = false;
          gsap.set(body, { clearProps: 'height,opacity' });
          ScrollTrigger.refresh();
        },
      });
    } else {
      $$('.qa.is-open').forEach((other) => other !== item && $('summary', other).click());
      item.open = true;
      item.classList.add('is-open');
      if (reduceMotion) return;
      gsap.fromTo(
        body,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.65, ease: 'expo.out', clearProps: 'height,opacity', onComplete: () => ScrollTrigger.refresh() },
      );
    }
  });
});

/* -----------------------------------------------------------
   Cuenta regresiva Pack Estrella (48 h por visitante)
----------------------------------------------------------- */
(function countdown() {
  const box = $('.cd');
  if (!box) return;
  const KEY = 'packEstrellaDeadline';
  const SPAN = 48 * 60 * 60 * 1000;
  const read = () => {
    try {
      const saved = parseInt(localStorage.getItem(KEY), 10);
      if (!Number.isNaN(saved) && saved > Date.now()) return saved;
      const next = Date.now() + SPAN;
      localStorage.setItem(KEY, String(next));
      return next;
    } catch {
      return Date.now() + SPAN;
    }
  };
  let deadline = read();
  const els = { h: $('[data-cd="h"]', box), m: $('[data-cd="m"]', box), s: $('[data-cd="s"]', box) };
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => {
    let left = deadline - Date.now();
    if (left <= 0) {
      deadline = read();
      left = deadline - Date.now();
    }
    const total = Math.floor(left / 1000);
    const values = { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
    Object.entries(values).forEach(([k, v]) => {
      const txt = pad(v);
      if (els[k].textContent !== txt) {
        els[k].textContent = txt;
        if (k === 's' && !reduceMotion) gsap.fromTo(els[k], { yPercent: -50, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
      }
    });
  };
  tick();
  setInterval(tick, 1000);
})();

/* -----------------------------------------------------------
   Visor de testimonios
----------------------------------------------------------- */
(function lightbox() {
  const dialog = $('#lightbox');
  const opener = $('.testi-card');
  if (!dialog || !opener || typeof dialog.showModal !== 'function') return;
  const img = $('.lb-stage img', dialog);
  const level = $('.lb-level', dialog);
  const btnIn = $('[data-zoom="in"]', dialog);
  const btnOut = $('[data-zoom="out"]', dialog);
  const MIN = 1;
  const MAX = 3;
  let zoom = 1;
  const setZoom = (z) => {
    zoom = Math.min(MAX, Math.max(MIN, Math.round(z * 10) / 10));
    img.style.width = `${zoom * 100}%`;
    level.textContent = `${Math.round(zoom * 100)}%`;
    btnIn.disabled = zoom >= MAX;
    btnOut.disabled = zoom <= MIN;
  };
  opener.addEventListener('click', () => {
    img.loading = 'eager';
    setZoom(1);
    dialog.showModal();
    lenis?.stop();
  });
  btnIn.addEventListener('click', () => setZoom(zoom + 0.5));
  btnOut.addEventListener('click', () => setZoom(zoom - 0.5));
  $('[data-close]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => e.target === dialog && dialog.close());
  dialog.addEventListener('close', () => lenis?.start());
})();

/* -----------------------------------------------------------
   Varios
----------------------------------------------------------- */
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
