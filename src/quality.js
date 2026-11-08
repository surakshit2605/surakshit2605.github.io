/** Display quality: "auto" (default, picks by device), "low" (lighter 3D) or "high" (full detail). Saved; changing it reloads the page because the 3D scene is built once at start. */
const KEY = 'quality';
export const getQuality = () => {
  try { const v = localStorage.getItem(KEY); return v === 'low' || v === 'high' ? v : 'auto'; } catch (e) { return 'auto'; }
};
export function setQuality(q) {
  try { if (q === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, q); } catch (e) { /* private mode: reload still works */ }
  try { sessionStorage.setItem('qtoast', q); } catch (e) { /* no confirmation message, still fine */ }
  location.reload();
}
const WORDS = { auto: 'Auto', low: 'Light', high: 'Full' };
const HINT = {
  auto: 'Auto picks the detail for your device: full on a computer, lighter on phones and tablets.',
  low: 'Light: fewer 3D objects and a lower resolution. Smoother on slow devices, a little less detailed.',
  high: 'Full: all 3D detail at the highest resolution. On a computer this looks the same as Auto.',
};
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'qtoast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 500); }, 3600);
}
export function initQuality() {
  const cur = getQuality();
  const hint = document.querySelector('.quality__hint');
  if (hint) hint.textContent = HINT[cur];
  try {
    const q = sessionStorage.getItem('qtoast');
    if (q) { sessionStorage.removeItem('qtoast'); toast(`3D quality set to ${WORDS[q]}. ${q === 'auto' ? '' : 'Saved on this device.'}`.trim()); }
  } catch (e) { /* ignore */ }
  document.querySelectorAll('.quality [data-q]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.q === cur));
    b.addEventListener('click', () => { if (b.dataset.q !== cur) setQuality(b.dataset.q); });
  });
}
