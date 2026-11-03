/** Click a certificate to view it larger (native <dialog>, closes with Esc, backdrop or button). */
export function initLightbox() {
  const dlg = document.getElementById('lightbox');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const img = dlg.querySelector('img');
  const cap = dlg.querySelector('.lightbox__cap');
  let opener = null;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lightbox]');
    if (!btn) return;
    opener = btn;
    img.src = btn.dataset.src;
    img.alt = `Certificate: ${btn.dataset.caption}`;
    cap.textContent = btn.dataset.caption;
    dlg.showModal();
    document.body.style.overflow = 'hidden';
  });

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('.lightbox__close')) dlg.close();
  });

  dlg.addEventListener('close', () => {
    document.body.style.overflow = '';
    img.removeAttribute('src');
    if (opener) opener.focus();
  });
}
