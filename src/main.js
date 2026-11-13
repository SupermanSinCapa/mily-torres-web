import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

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

// Envuelve cada palabra en una máscara para animarla (respeta <em>)
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
    duration: 2,
    ease: 'power3.out',
    onUpdate: () => (el.textContent = fmt(state.v, decimals)),
  });
}

/* -----------------------------------------------------------
   Scroll suave (Lenis) + ScrollTrigger
----------------------------------------------------------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.4 });
  else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

/* -----------------------------------------------------------
   Menú móvil
----------------------------------------------------------- */
const menuToggle = $('.menu-toggle');
const mobileMenu = $('#menu-movil');

function openMenu() {
  document.body.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Cerrar menú');
  mobileMenu.inert = false;
  $('.nav').classList.remove('is-hidden');
  lenis?.stop();
  if (!reduceMotion) {
    gsap.fromTo(
      $$('.mobile-menu nav a, .mobile-menu-foot'),
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'expo.out', delay: 0.2 },
    );
  }
}
function closeMenu() {
  if (!document.body.classList.contains('menu-open')) return;
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  mobileMenu.inert = true;
  lenis?.start();
}
menuToggle?.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());

// Enlaces internos
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
   Navegación, progreso y botón de WhatsApp
----------------------------------------------------------- */
const nav = $('.nav');
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle('is-scrolled', y > 40);
    const hide = self.direction === 1 && y > 500 && !document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', hide);
  },
});

if (!reduceMotion) {
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

const waFloat = $('.wa-float');
ScrollTrigger.create({
  trigger: '.hero',
  start: 'bottom 70%',
  onEnter: () => waFloat.classList.add('is-visible'),
  onLeaveBack: () => waFloat.classList.remove('is-visible'),
});

/* -----------------------------------------------------------
   Animaciones
----------------------------------------------------------- */
const counters = $$('[data-count]');

if (reduceMotion) {
  $('.loader')?.remove();
} else {
  $$('[data-split]').forEach(splitWords);
  counters.forEach((el) => (el.textContent = fmt(0, parseInt(el.dataset.decimals || '0', 10))));

  // Intro
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  const loader = $('.loader');
  if (loader) {
    lenis?.stop();
    intro
      .from('.loader-word > *', { yPercent: 115, duration: 1.1, stagger: 0.08 })
      .to('.loader-line', { scaleX: 1, duration: 0.9, ease: 'power2.inOut' }, '-=0.7')
      .to('.loader-word > *', { yPercent: -115, duration: 0.7, stagger: 0.05, ease: 'expo.in' }, '+=0.1')
      .to(loader, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.3')
      .add(() => {
        loader.remove();
        lenis?.start();
      });
  }
  intro
    .from('.nav-inner', { y: -24, opacity: 0, duration: 1.2 }, '-=0.55')
    .from('.hero-title .w-i', { yPercent: 110, duration: 1.3, stagger: 0.06 }, '<')
    .from(['.hero-top', '.hero-sub', '.hero-ctas'], { y: 26, opacity: 0, duration: 1.1, stagger: 0.1 }, '-=1.05')
    .add(() => countUp($('.eyebrow-pill [data-count]')), '<')
    .from('.showcase-frame', { y: 90, opacity: 0, duration: 1.6 }, '-=0.95')
    .from('.chip', { scale: 0.6, opacity: 0, duration: 1, stagger: 0.12, ease: 'back.out(1.7)' }, '-=1');

  // Títulos palabra por palabra
  $$('[data-split]')
    .filter((el) => !el.closest('.hero'))
    .forEach((el) => {
      gsap.from($$('.w-i', el), {
        yPercent: 110,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

  // Aparición suave
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      y: 48,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // Grupos escalonados
  $$('[data-stagger]').forEach((group) => {
    gsap.from(group.children, {
      y: 56,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.09,
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: group, start: 'top 86%' },
    });
  });

  // Contadores
  counters
    .filter((el) => !('manual' in el.dataset))
    .forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) });
    });

  // Imagen principal: se expande al hacer scroll
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const st = { trigger: '.showcase', start: 'top 80%', end: 'bottom 35%', scrub: 0.6 };
    gsap.fromTo(
      '.showcase-frame',
      { clipPath: 'inset(0% 8% 0% 8% round 36px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: st },
    );
    gsap.fromTo('.showcase-frame img', { scale: 1.07 }, { scale: 1, ease: 'none', scrollTrigger: { ...st } });
    gsap.to('.chips', { yPercent: -10, ease: 'none', scrollTrigger: { ...st, end: 'bottom top' } });
  });
  mm.add('(max-width: 767px)', () => {
    gsap.fromTo(
      '.showcase-frame img',
      { scale: 1.06 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: '.showcase', start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  // Antes / después
  const baTl = gsap.timeline({ scrollTrigger: { trigger: '.ba', start: 'top 78%' }, defaults: { ease: 'expo.out', duration: 1.4 } });
  baTl
    .from('.ba-before', { x: -90, rotate: -8, opacity: 0 })
    .from('.ba-after', { x: 90, rotate: 8, opacity: 0 }, '<0.1')
    .from('.ba-mid', { scale: 0.7, opacity: 0 }, '<0.25')
    .from('.ba-arrow', { x: -30, opacity: 0, duration: 1 }, '<0.3');

  // Parallax sutil
  $$('.ba-img img, .testi-img img').forEach((img) => {
    gsap.fromTo(
      img,
      { yPercent: -1.5, scale: 1.035 },
      {
        yPercent: 1.5,
        scale: 1.035,
        ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });

  // Botones magnéticos
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
}

// Luz que sigue al cursor en las tarjetas de planes
if (finePointer) {
  $$('.plan').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
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
        duration: 0.5,
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
        { height: 'auto', opacity: 1, duration: 0.7, ease: 'expo.out', clearProps: 'height,opacity', onComplete: () => ScrollTrigger.refresh() },
      );
    }
  });
});

/* -----------------------------------------------------------
   Cuenta regresiva Pack Estrella (48 h por visitante)
----------------------------------------------------------- */
(function countdown() {
  const box = $('.countdown');
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
        if (k === 's' && !reduceMotion) gsap.fromTo(els[k], { yPercent: -40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
      }
    });
  };
  tick();
  setInterval(tick, 1000);
})();

/* -----------------------------------------------------------
   Lightbox de testimonios
----------------------------------------------------------- */
(function lightbox() {
  const dialog = $('#lightbox');
  const opener = $('.testi-open');
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
