/**
 * SITE-LEVEL SETTINGS (SEO, link previews, form, analytics, security headers).
 * Read at build time by scripts/vite-site-plugin.js, so keep this file plain data.
 */
export const site = {
  // Your final public address, no trailing slash. REQUIRED for link previews:
  // WhatsApp/LinkedIn need an absolute image URL. Example: 'https://surakshit.netlify.app'
  url: 'https://surakshit2605.github.io',

  title: 'Surakshit Kessoonath · Computer Science & Network Security',
  description:
    'Portfolio of Surakshit Kessoonath, BSc Computer Science (Network Security) student at the University of Technology, Mauritius.',

  // File in /public. 1200x630 PNG. Source: design/og-image.html
  ogImage: '/og-image.png',
  themeColor: '#05070d',

  // Contact form. A static site cannot send email by itself, so a form needs a
  // free form service. Create a form at https://formspree.io and paste the URL:
  //   endpoint: 'https://formspree.io/f/xxxxxxxx'
  // Leave empty to show only the "Email me" button (recommended until you have it).
  contactForm: { endpoint: '' },

  // Optional, cookie-free analytics. Leave provider empty to disable.
  //   { provider: 'plausible',    id: 'your-domain.com' }
  //   { provider: 'goatcounter',  id: 'your-code' }   // from your-code.goatcounter.com
  analytics: { provider: '', id: '' },
};
