import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Loader counter + exit + hero entrance. Resolves when the intro is finished. */
export function playIntro(readyPromise) {
  const loader = document.getElementById('loader');
  const count = document.getElementById('loader-count');
  const bar = document.getElementById('loader-bar');

  const showHero = () => {
    gsap.set('.char', { clearProps: 'all' });
    gsap.set('[data-hero]', { clearProps: 'all' });
    gsap.set('.nav', { clearProps: 'all' });
  };

  if (reduced()) {
    return readyPromise.then(() => {
      loader.remove();
      showHero();
    });
  }

  gsap.set('.char', { yPercent: 110, opacity: 0 });
  gsap.set('[data-hero]', { y: 24, opacity: 0 });
  gsap.set('.nav', { y: -20, opacity: 0 });

  // SURAKSHIT wordmark: letters draw on one after another, glow breathes, one sheen sweep.
  const glowP = gsap.utils.toArray('.lw-glow .lw-p');
  const inkP = gsap.utils.toArray('.lw-ink .lw-p');
  const sheenP = gsap.utils.toArray('.lw-sheen .lw-p');
  const drawAt = (p) => 0.2 + Number(p.dataset.l) * 0.17;
  gsap.set(glowP, { opacity: 0 });
  [...inkP, ...sheenP].forEach((p) => gsap.set(p, { strokeDashoffset: 1 }));
  inkP.forEach((p, i) => {
    const t = drawAt(p);
    gsap.to(p, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', delay: t });
    gsap.to(glowP[i], { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut', delay: t });
    gsap.to(glowP[i], { opacity: 0.75, duration: 0.7, delay: t });
  });
  gsap.set(sheenP, { strokeDashoffset: 0 });
  gsap.to('.lw-glow', { opacity: 0.55, duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 });
  const sheenGrad = document.getElementById('lw-sheen');
  gsap.to(sheenGrad, {
    attr: { x1: 560, x2: 640 }, duration: 1.1, ease: 'power2.inOut', delay: 1.9,
  });

  const counter = { v: 0 };
  const minTime = new Promise((res) =>
    gsap.to(counter, {
      v: 100,
      duration: 2.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        const n = Math.round(counter.v);
        count.textContent = String(n).padStart(3, '0');
        bar.style.transform = `scaleX(${n / 100})`;
      },
      onComplete: res,
    })
  );

  return Promise.all([minTime, readyPromise]).then(
    () =>
      new Promise((resolve) => {
        const tl = gsap.timeline({ onComplete: resolve });
        tl.to('.loader__inner', { opacity: 0, y: -12, duration: 0.5, ease: 'power2.in' })
          .to(loader, { yPercent: -100, duration: 1, ease: 'power3.inOut' })
          .to('.char', { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.035, ease: 'power4.out' }, '-=0.4')
          .to('[data-hero]', { y: 0, opacity: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' }, '-=0.7')
          .to('.nav', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, '-=0.8')
          .add(() => loader.remove());
      })
  );
}


/** Wrap every word of an element's text in spans, keeping inline tags such as <em>. mask=true adds a clipping wrapper for rise-up reveals. */
function splitWords(el, mask) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const parts = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          const word = document.createElement('span');
          word.className = mask ? 'w' : 'lw';
          word.textContent = w;
          if (mask) {
            const m = document.createElement('span');
            m.className = 'wm';
            m.appendChild(word);
            frag.appendChild(m);
          } else frag.appendChild(word);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.classList.contains('badge')) walk(n);
    });
  };
  walk(el);
}

const SEC_LABEL = {};

export function initScroll(scene) {
  // Scene camera follows the section in view (runs for all motion preferences).
  gsap.utils.toArray('[data-scene]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => scene?.goTo(sec.dataset.scene),
      onEnterBack: () => scene?.goTo(sec.dataset.scene),
    });
  });

  // Active nav link
  const links = gsap.utils.toArray('.menu__list a');
  gsap.utils.toArray('[data-scene]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((a) => a.classList.toggle('is-active', a.dataset.target === sec.id));
        const hud = document.querySelector('.hud');
        const a = document.querySelector(`.menu__list a[data-target="${sec.id}"]`);
        if (hud && a) {
          hud.querySelector('.hud__n').textContent = a.querySelector('.menu__num').textContent;
          hud.querySelector('.hud__l').textContent = a.querySelector('.menu__line').textContent;
        }
      },
    });
  });

  // Timeline progress is data, so compute it in both motion modes.
  const tl = document.getElementById('timeline');
  const start = new Date(tl.dataset.start).getTime();
  const end = new Date(tl.dataset.end).getTime();
  const pct = Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
  const fill = document.getElementById('timeline-fill');
  const now = document.getElementById('timeline-now');
  const label = document.getElementById('timeline-pct');
  now.style.left = `${pct * 100}%`;
  const setPct = (v) => {
    fill.style.transform = `scaleX(${v})`;
    label.textContent = `${Math.round(v * 100)}%`;
  };

  if (reduced()) {
    setPct(pct);
    return;
  }

  // Everything below is motion-only.
  gsap.to('#progress-bar', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  gsap.set('[data-reveal]', { opacity: 0, y: 28 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 96%',
    once: true,
    onEnter: (els) =>
      gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'power3.out', overwrite: true }),
  });

  // Section titles: each word rises out of a mask. Ghost numerals drift slower than the page.
  gsap.utils.toArray('.eh__title').forEach((t) => {
    splitWords(t, true);
    const ws = t.querySelectorAll('.w');
    gsap.set(ws, { yPercent: 118, rotate: 3 });
    ScrollTrigger.create({
      trigger: t,
      start: 'top 92%',
      once: true,
      onEnter: () => gsap.to(ws, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.09, ease: 'power4.out' }),
    });
  });
  gsap.utils.toArray('.eh__ghost').forEach((g) => {
    gsap.fromTo(g, { yPercent: 18 }, { yPercent: -22, ease: 'none', scrollTrigger: { trigger: g.closest('.section'), start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  });
  // Lead paragraphs light up word by word as they scroll through the reading zone.
  gsap.utils.toArray('[data-lit]').forEach((p) => {
    splitWords(p, false);
    const ws = p.querySelectorAll('.lw');
    gsap.set(ws, { opacity: 0.18 });
    gsap.to(ws, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: p, start: 'top 86%', end: 'bottom 55%', scrub: 0.5 },
    });
  });

  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: tl,
    start: 'top 80%',
    once: true,
    onEnter: () => gsap.to(o, { v: pct, duration: 2.2, ease: 'power3.out', onUpdate: () => setPct(o.v) }),
  });
}

/** Smooth anchor navigation (the full-screen menu closes itself, see menu.js). */
export function initNav() {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const done = () => {
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      };
      if (reduced()) {
        el.scrollIntoView();
        done();
      } else {
        gsap.to(window, { scrollTo: { y: el, autoKill: true }, duration: 1.4, ease: 'power3.inOut', onComplete: done });
      }
    });
  });
}
