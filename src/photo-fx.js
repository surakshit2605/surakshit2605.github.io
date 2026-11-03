import { gsap } from 'gsap';

/**
 * About photo: your real photo at rest. On hover a sky-blue scan line sweeps down and the photo turns
 * grey with a sky-blue tint behind it; on leave it sweeps back up and the original returns. A small 3D tilt follows the mouse. Mouse only.
 */
export function initPhotoFx() {
  const card = document.querySelector('.pframe');
  if (!card) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const color = card.querySelector('.pf-tone');
  const scan = card.querySelector('.pf-scan');
  const st = { p: 0 };
  const draw = () => {
    color.style.clipPath = `inset(0 0 ${(1 - st.p) * 100}% 0)`;
    scan.style.top = `calc(${st.p * 100}% - 1px)`;
  };
  const sweep = (to, dur) => {
    scan.style.opacity = '1';
    gsap.to(st, {
      p: to, duration: calm ? 0 : dur, ease: 'power2.inOut', overwrite: true, onUpdate: draw,
      onComplete: () => { draw(); if (to === 0 || to === 1) gsap.to(scan, { opacity: 0, duration: 0.3 }); },
    });
  };

  card.addEventListener('pointerenter', () => { card.classList.add('is-live'); sweep(1, 0.9); });
  card.addEventListener('pointerleave', () => {
    card.classList.remove('is-live'); sweep(0, 0.8);
    if (!calm) gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' });
  });

  if (calm) return;
  gsap.set(card, { transformPerspective: 900 });
  const rx = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3.out' });
  const ry = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3.out' });
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ry(x * 7);
    rx(-y * 7);
  });
}
