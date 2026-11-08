import { PLACE, sunAt, sunTimes, starAlt, CRUX, fmtHM, fmtLen } from './sky.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (parent) parent.appendChild(n);
  return n;
};

/** Plain-words state of the Sun from its height above the horizon. */
function sunState(alt) {
  if (alt > 6) return 'Daylight';
  if (alt > 0) return 'Sun low on the horizon';
  if (alt > -6) return 'Twilight';
  if (alt > -12) return 'Deep twilight';
  return 'Night';
}

/** Draw the Southern Cross once (a flat map of the sky, east on the left, as on a star chart). */
function drawCross(svg) {
  const all = [...CRUX.stars, ...CRUX.pointers];
  const ra0 = 200 * (Math.PI / 180), de0 = -60 * (Math.PI / 180);
  const proj = (s) => { // gnomonic projection around (ra0, de0)
    const a = s.ra * (Math.PI / 180), d = s.dec * (Math.PI / 180);
    const c = Math.sin(de0) * Math.sin(d) + Math.cos(de0) * Math.cos(d) * Math.cos(a - ra0);
    return { x: (Math.cos(d) * Math.sin(a - ra0)) / c, y: (Math.cos(de0) * Math.sin(d) - Math.sin(de0) * Math.cos(d) * Math.cos(a - ra0)) / c };
  };
  const pts = Object.fromEntries(all.map((s) => [s.id, proj(s)]));
  const xs = Object.values(pts).map((p) => p.x), ys = Object.values(pts).map((p) => p.y);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const W = 300, H = 190, pad = 34, k = Math.min((W - 2 * pad) / (maxx - minx), (H - 2 * pad) / (maxy - miny));
  const at = (id) => ({ x: W - pad - (pts[id].x - minx) * k - ((W - 2 * pad) - (maxx - minx) * k) / 2, y: H - pad - (pts[id].y - miny) * k - ((H - 2 * pad) - (maxy - miny) * k) / 2 });
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const line = (a, b, cls) => { const p = at(a), q = at(b); el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: cls }, svg); };
  line('gacrux', 'acrux', 'sky__ln');
  line('imai', 'mimosa', 'sky__ln');
  line('hadar', 'rigil', 'sky__ln sky__ln--dash');
  const size = { acrux: 4.4, mimosa: 4.2, gacrux: 4, imai: 3, hadar: 4.4, rigil: 5 };
  all.forEach((s) => {
    const p = at(s.id);
    el('circle', { cx: p.x, cy: p.y, r: size[s.id] * 2.2, class: 'sky__halo' }, svg);
    el('circle', { cx: p.x, cy: p.y, r: size[s.id], class: 'sky__star' }, svg);
    const left = s.id === 'mimosa'; // Mimosa is the eastern (left) arm of the cross, so its name goes to the left
    const t = el('text', { x: p.x + (left ? -9 : 9), y: p.y + (s.id === 'hadar' ? -8 : 3.5), class: 'sky__lab', 'text-anchor': left ? 'end' : 'start' }, svg);
    t.textContent = s.name;
  });
}

export function initSky() {
  const root = document.getElementById('sky');
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const sun = $('sky-sun'), sunHalo = $('sky-sun-halo');
  const cross = $('sky-crux');
  drawCross(cross);

  // The day path: a half ellipse from sunrise (left) to sunset (right).
  const X0 = 24, X1 = 296, YH = 112, RY = 96;
  function update() {
    const now = Date.now();
    const s = sunAt(now), t = sunTimes(now);
    const local = new Date(now + 4 * 3600000);
    const min = local.getUTCHours() * 60 + local.getUTCMinutes() + local.getUTCSeconds() / 60;
    let f = t ? (min - t.rise) / (t.set - t.rise) : 0.5;
    const up = f >= 0 && f <= 1;
    f = Math.min(1, Math.max(0, f));
    const cx = (X0 + X1) / 2 - ((X1 - X0) / 2) * Math.cos(Math.PI * f);
    const cy = YH - RY * Math.sin(Math.PI * f) - (up ? 0 : -14);
    sun.setAttribute('cx', cx); sun.setAttribute('cy', cy);
    sunHalo.setAttribute('cx', cx); sunHalo.setAttribute('cy', cy);
    root.classList.toggle('is-night', !up);
    $('sky-rise').textContent = t ? fmtHM(t.rise) : '–';
    $('sky-set').textContent = t ? fmtHM(t.set) : '–';
    $('sky-len').textContent = t ? fmtLen(t.length) : '–';
    $('sky-alt').textContent = `${s.alt >= 0 ? '' : '−'}${Math.abs(s.alt).toFixed(0)}°`;
    $('sky-state').textContent = sunState(s.alt);

    const ac = starAlt(CRUX.stars[0].ra, CRUX.stars[0].dec, now), gc = starAlt(CRUX.stars[1].ra, CRUX.stars[1].dec, now);
    const mid = (ac + gc) / 2;
    let note;
    if (mid > 10 && s.alt < -12) note = 'Above the horizon now, in a dark sky.';
    else if (mid > 0 && s.alt >= -12) note = 'Above the horizon now, but the sky is too bright to see it.';
    else if (mid > 0) note = 'Just above the horizon now.';
    else note = 'Below the horizon now.';
    $('sky-crux-note').textContent = note;
    $('sky-crux-alt').textContent = mid > 0 ? `${mid.toFixed(0)}° high` : 'not up';
  }
  update();
  setInterval(update, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
}
