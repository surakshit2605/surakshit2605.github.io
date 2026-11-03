import { gsap } from 'gsap';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Full-screen navigation: circular reveal from the button, lines rising out of masks, blue light following the pointer. */
export function initMenu() {
  const root = document.getElementById('menu');
  const btn = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav');
  const label = document.getElementById('menu-label');
  if (!root || !btn) return { close() {}, isOpen: () => false };

  const bg = root.querySelector('.menu__bg');
  const glow = root.querySelector('.menu__glow');
  const lines = root.querySelectorAll('.menu__line');
  const nums = root.querySelectorAll('.menu__num');
  const side = root.querySelectorAll('.menu__side > *');
  const foot = root.querySelector('.menu__foot');
  const g1 = btn.querySelector('.mb-g1');
  const g2 = btn.querySelector('.mb-g2');
  const prog = btn.querySelector('.mb-prog');
  const brand = nav.querySelector('.nav__brand');
  const inertTargets = ['main', 'footer'].map((s) => document.querySelector(s)).filter(Boolean);

  const C = 2 * Math.PI * 19.5;
  gsap.set(prog, { strokeDasharray: C, strokeDashoffset: C });
  gsap.set([g1, g2], { svgOrigin: '22 22' });
  gsap.set(g1, { y: -4.5 });
  gsap.set(g2, { y: 4.5 });

  let tl = null;
  let open = false;

  function build() {
    if (tl) tl.kill();
    const r = btn.querySelector('svg').getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
    tl = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        root.hidden = true;
      },
    });
    tl.fromTo(bg, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 0.95, ease: 'power3.inOut' }, 0)
      .fromTo(glow, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.3)
      .to(g1, { y: 0, rotation: 45, duration: 0.6, ease: 'power3.inOut' }, 0)
      .to(g2, { y: 0, rotation: -45, duration: 0.6, ease: 'power3.inOut' }, 0)
      .to(prog, { strokeDashoffset: 0, duration: 0.95, ease: 'power2.inOut' }, 0)
      .fromTo(lines, { yPercent: 118 }, { yPercent: 0, duration: 0.95, stagger: 0.055, ease: 'power4.out' }, 0.38)
      .fromTo(nums, { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.055, ease: 'power2.out' }, 0.5)
      .fromTo(side, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out' }, 0.6)
      .fromTo(foot, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.85);
    if (reduced()) tl.timeScale(30);
  }

  function setOpen(v) {
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    btn.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    if (label) label.textContent = v ? 'Close' : 'Menu';
    nav.classList.toggle('is-menu-open', v);
    inertTargets.forEach((el) => (v ? el.setAttribute('inert', '') : el.removeAttribute('inert')));
  }

  function openMenu() {
    if (open) return;
    build();
    root.hidden = false;
    setOpen(true);
    document.body.style.overflow = 'hidden';
    tl.timeScale(reduced() ? 30 : 1).play(0);
    const first = root.querySelector('.menu__list a');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus = true) {
    if (!open) return;
    setOpen(false);
    document.body.style.overflow = '';
    tl.timeScale(reduced() ? 30 : 1.8).reverse();
    if (returnFocus) btn.focus({ preventScroll: true });
  }

  btn.addEventListener('click', () => (open ? closeMenu() : openMenu()));
  brand.addEventListener('click', () => closeMenu(false));
  root.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeMenu(false);
  });

  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') {
      closeMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const f = [...nav.querySelectorAll('a[href], button'), ...root.querySelectorAll('a[href]')].filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Blue light that follows the pointer (desktop only; touch has no hover).
  if (!reduced()) {
    root.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      gsap.to(root, { '--mx': `${e.clientX}px`, '--my': `${e.clientY}px`, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
    });
  }

  window.addEventListener('resize', () => {
    if (open) closeMenu(false);
  });

  return { close: closeMenu, isOpen: () => open };
}
