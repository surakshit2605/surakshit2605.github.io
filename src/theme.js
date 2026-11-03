import { gsap } from 'gsap';
import { applyAccent } from './accents.js';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const BG = { light: '#f2f5fb', dark: '#05070d' };

/**
 * Dark / light switch.
 * - The saved choice lives in localStorage ('theme') and is applied before paint by public/theme-init.js.
 * - The change itself is a circular reveal that grows from the button (View Transitions API when
 *   the browser has it, a GSAP wipe otherwise). With reduced motion it switches instantly.
 */
export function initTheme(scene) {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const cut = btn.querySelector('.tt-cut');
  const disc = btn.querySelector('.tt-disc');
  const rays = btn.querySelector('.tt-rays');
  const rayLines = rays.querySelectorAll('line');
  const orbit = btn.querySelector('.tt-orbit');
  const core = btn.querySelector('.tt-core');
  const meta = document.querySelector('meta[name="theme-color"]');

  const current = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  // Icon poses: dark = crescent moon, light = sun with rays.
  const POSE = {
    dark: { cut: { cx: 27.5, cy: 17.5, r: 7 }, disc: { r: 8.5 }, rays: { opacity: 0, scale: 0.5, rotation: -50 }, core: { rotation: 0 } },
    light: { cut: { cx: 44, cy: 2, r: 3 }, disc: { r: 5.6 }, rays: { opacity: 1, scale: 1, rotation: 0 }, core: { rotation: 90 } },
  };
  gsap.set([rays, core, orbit], { svgOrigin: '22 22' });

  function pose(mode, animate) {
    const p = POSE[mode];
    const d = animate && !reduced() ? 0.8 : 0;
    gsap.to(cut, { attr: p.cut, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(disc, { attr: p.disc, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(rays, { ...p.rays, duration: d, ease: 'back.out(1.5)', overwrite: 'auto' });
    gsap.to(core, { ...p.core, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(rayLines, { opacity: mode === 'light' ? 1 : 0, duration: d, stagger: animate ? 0.02 : 0, overwrite: 'auto' });
    btn.setAttribute('aria-label', mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
  }

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    applyAccent(); // re-write the accent colours for the new mode
    try {
      localStorage.setItem('theme', mode);
    } catch (e) {
      /* private mode: the choice just will not be remembered */
    }
    if (meta) meta.setAttribute('content', BG[mode]);
    if (scene && scene.setTheme) scene.setTheme(mode);
  }

  pose(current(), false);
  if (meta) meta.setAttribute('content', BG[current()]);
  if (scene && scene.setTheme) scene.setTheme(current());

  // A small satellite circles the ring. Skipped for reduced motion.
  if (!reduced()) gsap.to(orbit, { rotation: 360, duration: 26, ease: 'none', repeat: -1 });

  // Hover: the moon turns a little.
  btn.addEventListener('pointerenter', () => {
    if (reduced()) return;
    gsap.to(core, { rotation: `+=${current() === 'light' ? 45 : 18}`, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
  });

  function switchTo(next, x, y) {
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 30;
    if (reduced()) {
      apply(next);
      pose(next, false);
      return;
    }
    pose(next, true);

    if (typeof document.startViewTransition === 'function') {
      root.classList.add('theme-vt');
      root.style.setProperty('--wx', `${x}px`);
      root.style.setProperty('--wy', `${y}px`);
      const t = document.startViewTransition(() => apply(next));
      t.ready.then(() => {
        // Native animation on the pseudo-element: runs off the main thread, so it stays smooth.
        root.animate(
          { '--wr': ['0px', `${R + 260}px`] },
          { duration: 1300, easing: 'cubic-bezier(0.65, 0, 0.25, 1)', fill: 'forwards', pseudoElement: '::view-transition-new(root)' }
        );
      });
      t.finished.finally(() => {
        root.classList.remove('theme-vt');
        root.style.removeProperty('--wx');
        root.style.removeProperty('--wy');
      });
      return;
    }

    // Fallback: colour wipe, theme swaps while the screen is covered.
    const el = document.createElement('div');
    el.className = 'theme-wipe';
    el.style.background = BG[next];
    document.body.appendChild(el);
    gsap.set(el, { clipPath: `circle(0px at ${x}px ${y}px)` });
    gsap
      .timeline({ onComplete: () => el.remove() })
      .to(el, { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 0.7, ease: 'power3.inOut', onComplete: () => apply(next) })
      .to(el, { opacity: 0, duration: 0.45, ease: 'power2.out' });
  }

  btn.addEventListener('click', () => {
    const r = btn.getBoundingClientRect();
    switchTo(current() === 'light' ? 'dark' : 'light', r.left + r.width / 2, r.top + r.height / 2);
  });

  // Follow the system if the visitor has never chosen and the system changes.
  try {
    if (!localStorage.getItem('theme')) {
      /* default stays dark: it is the designed look. Nothing to follow. */
    }
  } catch (e) {
    /* ignore */
  }
}
