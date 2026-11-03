import { site } from './data/site.js';
import { contact } from './data/content.js';

/** Handles the optional contact form (only rendered when site.contactForm.endpoint is set). */
export function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const status = form.querySelector('.form__status');
  const button = form.querySelector('button[type="submit"]');
  const setStatus = (text, kind) => {
    status.textContent = text;
    status.className = `form__status${kind ? ' is-' + kind : ''}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    // Honeypot: bots fill hidden fields, people do not. Stop silently.
    if (form.elements.company.value) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending…';
    try {
      const res = await fetch(site.contactForm.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.elements.name.value.trim(),
          email: form.elements.email.value.trim(),
          message: form.elements.message.value.trim(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus('Thanks, your message was sent.', 'ok');
    } catch {
      const fallback = contact.email ? ` at ${contact.email}` : '';
      setStatus(`Could not send the message. Please email me directly${fallback}.`, 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Send message';
    }
  });
}
