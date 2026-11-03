/**
 * Accent colour themes. Dark/light mode and accent colour are independent:
 * every accent has a dark and a light variant. This file is the single source of truth:
 * - applyAccent() writes the values into CSS variables on <html>
 * - the 3D scene reads the `scene` block (see scene.js)
 * To add a colour, copy one entry and change the values.
 */
export const ACCENTS = {
  blue: {
    label: 'Electric blue',
    d: { blue: '#2f7bff', sky: '#8fc8ff', cyan: '#22d3ee', indigo: '#3846dc', navy: '#0c1634', panel: '#0a1330', lg: ['#2f6bff', '#38a8ff', '#67e8f9'], hi: '#cfeeff', deep: ['#15327a', '#0b1b48'], duo: 180, on: '#ffffff' },
    l: { blue: '#2563eb', sky: '#1f56c4', cyan: '#0891b2', indigo: '#6366f1', navy: '#e1e9fa', panel: '#e2ecff', lg: ['#1d4ed8', '#2563eb', '#0891b2'], on: '#ffffff' },
    scene: { solid: 0x0a1330, amb: 0x6f86b8, lsolid: 0xb3c6f2, lamb: 0xb4c4e8 },
  },
  cyan: {
    label: 'Cyan',
    d: { blue: '#06b6d4', sky: '#67e8f9', cyan: '#2dd4bf', indigo: '#0e7490', navy: '#06202e', panel: '#07202e', lg: ['#0891b2', '#22d3ee', '#a5f3fc'], hi: '#d9f8ff', deep: ['#0e6c88', '#062f40'], duo: 152, on: '#03222b' },
    l: { blue: '#0e7490', sky: '#155e75', cyan: '#0d9488', indigo: '#0891b2', navy: '#def5fa', panel: '#dcf3f8', lg: ['#0e7490', '#0891b2', '#0d9488'], on: '#ffffff' },
    scene: { solid: 0x072535, amb: 0x6fa3b8, lsolid: 0xb3e0ee, lamb: 0xb4dce8 },
  },
  violet: {
    label: 'Violet',
    d: { blue: '#8b5cf6', sky: '#c4b5fd', cyan: '#e879f9', indigo: '#6d28d9', navy: '#1a0f3a', panel: '#170d36', lg: ['#7c3aed', '#a78bfa', '#f0abfc'], hi: '#efe8ff', deep: ['#3d2190', '#1b0f4a'], duo: 227, on: '#ffffff' },
    l: { blue: '#7c3aed', sky: '#5b21b6', cyan: '#c026d3', indigo: '#6d28d9', navy: '#ece6fb', panel: '#eae2fd', lg: ['#6d28d9', '#7c3aed', '#c026d3'], on: '#ffffff' },
    scene: { solid: 0x1a0f3a, amb: 0x8a78b8, lsolid: 0xd0c4f2, lamb: 0xcfc4e8 },
  },
  emerald: {
    label: 'Emerald',
    d: { blue: '#10b981', sky: '#6ee7b7', cyan: '#2dd4bf', indigo: '#047857', navy: '#06231c', panel: '#06211b', lg: ['#059669', '#34d399', '#a7f3d0'], hi: '#d9fff0', deep: ['#0d5c46', '#06302a'], duo: 122, on: '#04251b' },
    l: { blue: '#059669', sky: '#047857', cyan: '#0d9488', indigo: '#047857', navy: '#dcf6ec', panel: '#d9f5e9', lg: ['#047857', '#059669', '#0d9488'], on: '#ffffff' },
    scene: { solid: 0x06231c, amb: 0x6fb8a0, lsolid: 0xb3f2d8, lamb: 0xb4e8d4 },
  },
  rose: {
    label: 'Rose',
    d: { blue: '#f43f5e', sky: '#fda4af', cyan: '#fb923c', indigo: '#be123c', navy: '#2a0b14', panel: '#260a12', lg: ['#e11d48', '#fb7185', '#fdba74'], hi: '#ffe4e8', deep: ['#7a1431', '#38091a'], duo: 312, on: '#ffffff' },
    l: { blue: '#e11d48', sky: '#be123c', cyan: '#ea580c', indigo: '#be123c', navy: '#fbe3e8', panel: '#fbe0e6', lg: ['#be123c', '#e11d48', '#ea580c'], on: '#ffffff' },
    scene: { solid: 0x2a0b14, amb: 0xb87a86, lsolid: 0xf2b3c0, lamb: 0xe8b4be },
  },
  amber: {
    label: 'Amber',
    d: { blue: '#f59e0b', sky: '#fcd34d', cyan: '#fb923c', indigo: '#d97706', navy: '#2a1c06', panel: '#261a05', lg: ['#d97706', '#fbbf24', '#fde68a'], hi: '#fff3c4', deep: ['#7a4b08', '#382204'], duo: 2, on: '#241703' },
    l: { blue: '#d97706', sky: '#92400e', cyan: '#ea580c', indigo: '#b45309', navy: '#fbeed3', panel: '#faecd0', lg: ['#b45309', '#d97706', '#ea580c'], on: '#241703' },
    scene: { solid: 0x2a1c06, amb: 0xb8a06f, lsolid: 0xf2dcb3, lamb: 0xe8d8b4 },
  },
};

export const ACCENT_NAMES = Object.keys(ACCENTS);
const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};
const modeOf = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

export function savedAccent() {
  let a = 'blue';
  try { a = localStorage.getItem('accent') || 'blue'; } catch (e) { /* ignore */ }
  return ACCENTS[a] ? a : 'blue';
}
export const currentAccent = () => document.documentElement.getAttribute('data-accent') || 'blue';

/** Write the accent's tokens for the current dark/light mode. Call again whenever the mode changes. */
export function applyAccent(name = currentAccent(), save = false) {
  const a = ACCENTS[name] || ACCENTS.blue;
  const root = document.documentElement;
  const m = modeOf() === 'light' ? a.l : a.d;
  const set = (k, v) => root.style.setProperty(k, v);
  root.setAttribute('data-accent', name);
  set('--blue', m.blue); set('--blue-rgb', rgb(m.blue));
  set('--sky', m.sky); set('--sky-rgb', rgb(m.sky));
  set('--cyan-rgb', rgb(m.cyan)); set('--indigo-rgb', rgb(m.indigo));
  set('--navy', m.navy); set('--navy-rgb', rgb(m.navy)); set('--panel-rgb', rgb(m.panel));
  set('--lg-a', m.lg[0]); set('--lg-b', m.lg[1]); set('--lg-c', m.lg[2]);
  set('--on-accent', m.on);
  // These are used on always-dark surfaces (photo card), so they always use the dark values.
  set('--hi', a.d.hi); set('--sky0-rgb', rgb(a.d.sky)); set('--glow-rgb', rgb(a.d.lg[2]));
  set('--ld-a', a.d.lg[0]); set('--ld-b', a.d.lg[1]); // loader (always dark surface)
  set('--deep-1', a.d.deep[0]); set('--deep-2', a.d.deep[1]); set('--duo', `${a.d.duo}deg`);
  if (save) { try { localStorage.setItem('accent', name); } catch (e) { /* private mode */ } }
}
