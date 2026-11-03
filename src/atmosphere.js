import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Cinematic atmosphere: a few soft light layers behind the 3D scene.
 * Everything animated here is transform/opacity only (GPU-composited, no repaint),
 * so it stays cheap. Each section has a "preset" that moves and fades the lights.
 */
const PRESETS = {
  //            blue: [x%, y%, scale, opacity]   cyan                     indigo
  hero:         { b: [72, 38, 1.15, 0.9], c: [88, 92, 0.9, 0.55], i: [10, 70, 1.0, 0.45] },
  about:        { b: [76, 48, 1.2, 0.85], c: [18, 88, 0.9, 0.4], i: [30, 12, 0.9, 0.4] },
  profile:      { b: [20, 30, 1.0, 0.7], c: [85, 60, 1.0, 0.5], i: [60, 95, 1.1, 0.4] },
  background:   { b: [82, 25, 1.0, 0.6], c: [12, 70, 0.9, 0.35], i: [50, 50, 1.2, 0.5] },
  education:    { b: [15, 40, 1.0, 0.65], c: [80, 85, 0.9, 0.4], i: [70, 15, 1.0, 0.45] },
  skills:       { b: [50, 45, 1.3, 0.75], c: [50, 90, 1.0, 0.45], i: [15, 20, 0.9, 0.4] },
  journey:      { b: [85, 60, 1.0, 0.6], c: [10, 25, 0.9, 0.4], i: [55, 88, 1.0, 0.45] },
  projects:     { b: [78, 12, 1.1, 0.7], c: [15, 85, 1.0, 0.4], i: [45, 60, 1.2, 0.4] },
  achievements: { b: [20, 55, 1.0, 0.65], c: [85, 20, 0.9, 0.45], i: [60, 90, 1.0, 0.4] },
  contact:      { b: [50, 70, 1.4, 0.8], c: [50, 20, 1.1, 0.5], i: [10, 50, 0.9, 0.35] },
};

export function initAtmosphere() {
  const root = document.querySelector('.atmos');
  if (!root) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = { b: root.querySelector('.atmos__blue'), c: root.querySelector('.atmos__cyan'), i: root.querySelector('.atmos__indigo') };

  const apply = (key, dur) => {
    const p = PRESETS[key] || PRESETS.hero;
    for (const k of ['b', 'c', 'i']) {
      const [x, y, s, o] = p[k];
      gsap.to(els[k], { left: `${x}%`, top: `${y}%`, scale: s, opacity: o, duration: dur, ease: 'power2.inOut', overwrite: 'auto' });
    }
  };
  apply('hero', 0);

  if (calm) return;

  gsap.utils.toArray('[data-scene]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) apply(sec.dataset.scene, 1.8); },
    });
  });

  // Slow light beam drift + gentle grid parallax.
  gsap.to('.atmos__beam', { xPercent: 18, duration: 22, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.atmos__grid', {
    yPercent: -6, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 },
  });
}
