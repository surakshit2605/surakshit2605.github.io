import { gsap } from 'gsap';

/**
 * Hero name hover: a gradient + soft glow fades in letter by letter (left to right)
 * on enter and fades back out on leave. Mouse only; touch and reduced-motion keep the static design.
 */
export function initHeroHover() {
  const name = document.querySelector('.hero__name');
  if (!name) return;
  const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!mq.matches || calm.matches) return;

  const chars = name.querySelectorAll('.char');
  let intro = true;
  gsap.delayedCall(2.6, () => (intro = false)); // let the entrance animation finish first

  name.addEventListener('pointerenter', () => {
    if (intro) return;
    name.classList.add('is-hot');
    gsap.to(chars, { '--h': 1, duration: 0.55, ease: 'power2.out', stagger: { each: 0.03, from: 'start' }, overwrite: 'auto' });
  });
  name.addEventListener('pointerleave', () => {
    gsap.to(chars, {
      '--h': 0, duration: 0.7, ease: 'power2.inOut', stagger: { each: 0.02, from: 'start' }, overwrite: 'auto',
      onComplete: () => { if (+getComputedStyle(chars[0]).getPropertyValue('--h') === 0) name.classList.remove('is-hot'); },
    });
  });
}
