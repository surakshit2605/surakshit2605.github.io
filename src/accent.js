import { gsap } from 'gsap';
import { ACCENTS, ACCENT_NAMES, applyAccent, currentAccent } from './accents.js';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const modeOf = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

/**
 * Accent colour picker in the navbar. Six colours; the choice is remembered.
 * Colours change through CSS variables (accents.js); the 3D scene is told to re-colour itself.
 */
export function initAccent(scene) {
  const btn = document.getElementById('accent-btn');
  const pop = document.getElementById('accent-pop');
  const row = document.getElementById('accent-row');
  const nameEl = document.getElementById('accent-name');
  const dots = document.getElementById('accent-dots');
  if (!btn || !pop) return;

  // Six small dots around the button ring, one per colour.
  ACCENT_NAMES.forEach((n, i) => {
    const a = (i / ACCENT_NAMES.length) * Math.PI * 2 - Math.PI / 2;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('class', 'od');
    c.setAttribute('cx', (22 + Math.cos(a) * 13.5).toFixed(2));
    c.setAttribute('cy', (22 + Math.sin(a) * 13.5).toFixed(2));
    c.setAttribute('r', '1.7');
    c.setAttribute('fill', ACCENTS[n].d.blue);
    dots.appendChild(c);
  });

  // Swatches
  const swatches = ACCENT_NAMES.map((n) => {
    const a = ACCENTS[n];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'accent__sw';
    b.dataset.accent = n;
    b.setAttribute('aria-label', a.label);
    b.title = a.label;
    b.style.setProperty('--sw', `linear-gradient(135deg, ${a.d.lg[0]}, ${a.d.lg[2]})`);
    row.appendChild(b);
    return b;
  });

  const sync = () => {
    const cur = currentAccent();
    swatches.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.accent === cur)));
    nameEl.textContent = ACCENTS[cur].label;
  };
  sync();

  let open = false;
  function setOpen(v) {
    if (v === open) return;
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    gsap.killTweensOf([pop, swatches]);
    if (v) {
      pop.hidden = false;
      if (reduced()) return;
      gsap.fromTo(pop, { opacity: 0, y: -8, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' });
      gsap.fromTo(swatches, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', delay: 0.05 });
    } else if (reduced()) {
      pop.hidden = true;
    } else {
      gsap.to(pop, { opacity: 0, y: -6, scale: 0.96, duration: 0.2, ease: 'power2.in', onComplete: () => { pop.hidden = true; } });
    }
  }

  btn.addEventListener('click', () => setOpen(!open));
  document.addEventListener('pointerdown', (e) => { if (open && !e.target.closest('#accent')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { setOpen(false); btn.focus(); }
  });
  // Opening the full-screen menu closes the picker.
  document.getElementById('menu-toggle')?.addEventListener('click', () => setOpen(false));

  row.addEventListener('click', (e) => {
    const b = e.target.closest('.accent__sw');
    if (!b) return;
    const name = b.dataset.accent;
    if (name === currentAccent()) return;
    const r = b.getBoundingClientRect();
    applyAccent(name, true);
    if (scene && scene.setTheme) scene.setTheme(modeOf());
    sync();
    if (!reduced()) {
      // soft colour bloom from the swatch
      const f = document.createElement('div');
      f.className = 'accent-flash';
      f.style.left = `${r.left + r.width / 2}px`;
      f.style.top = `${r.top + r.height / 2}px`;
      document.body.appendChild(f);
      const R = Math.hypot(innerWidth, innerHeight) / 20;
      gsap.fromTo(f, { scale: 0.5, opacity: 0.9 }, { scale: R, opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: () => f.remove() });
    }
  });
}
