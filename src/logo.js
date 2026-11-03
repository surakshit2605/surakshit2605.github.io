import { gsap } from 'gsap';

/**
 * SK monogram. The S flows straight into the stem of the K (one continuous stroke),
 * and the K's two arms branch from a single node on that stem.
 * Same artwork is used in the navbar, loader, footer and favicon (public/favicon.svg).
 */
export const LOGO_PATHS = {
  sk: 'M12 48C22 55 32 53 32 44C32 33 10 36 10 23C10 11 28 9 37 17L39 19L39 54',
  arm: 'M55 11L39 35',
  leg: 'M39 35L57 55',
};

let n = 0;
export function logoSvg(cls = '') {
  const id = `lg${++n}`;
  return `<svg class="logo logo--${cls}" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}" class="logo__grad" gradientUnits="userSpaceOnUse" x1="8" y1="54" x2="58" y2="10">
        <stop offset="0" class="s1"/><stop offset=".6" class="s2"/><stop offset="1" class="s3"/>
      </linearGradient>
    </defs>
    <g class="logo__ink" stroke="url(#${id})" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">
      <path class="lp lp--sk" pathLength="1" d="${LOGO_PATHS.sk}"/>
      <path class="lp lp--arm" pathLength="1" d="${LOGO_PATHS.arm}"/>
      <path class="lp lp--leg" pathLength="1" d="${LOGO_PATHS.leg}"/>
    </g>
    <circle class="logo__node" cx="39" cy="35" r="2.3"/>
  </svg>`;
}

/** Hover: the gradient slides across the mark, glow rises a little. Mouse only. */
export function initLogoHover() {
  const brand = document.querySelector('.nav__brand');
  if (!brand) return;
  const grad = brand.querySelector('.logo__grad');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!grad || calm || !fine) return;
  const sweep = { x: 0 };
  const apply = () => {
    grad.setAttribute('x1', 8 + sweep.x);
    grad.setAttribute('x2', 58 + sweep.x);
  };
  brand.addEventListener('pointerenter', () => {
    gsap.to(sweep, { x: -34, duration: 0.7, ease: 'power3.out', onUpdate: apply, overwrite: true });
    gsap.to(brand, { '--lg': 1, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  });
  brand.addEventListener('pointerleave', () => {
    gsap.to(sweep, { x: 0, duration: 0.9, ease: 'power3.inOut', onUpdate: apply, overwrite: true });
    gsap.to(brand, { '--lg': 0, duration: 0.8, ease: 'power2.inOut', overwrite: 'auto' });
  });
}
