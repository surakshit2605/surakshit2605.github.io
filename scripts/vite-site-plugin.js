import fs from 'node:fs';
import path from 'node:path';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

/** Content-Security-Policy that only allows what the site config actually uses. */
export function buildCsp(site) {
  const script = ["'self'"];
  const connect = ["'self'"];
  const img = ["'self'", 'data:', 'blob:'];

  const { provider, id } = site.analytics || {};
  if (provider === 'plausible') {
    script.push('https://plausible.io');
    connect.push('https://plausible.io');
  } else if (provider === 'goatcounter' && id) {
    script.push('https://gc.zgo.at');
    connect.push(`https://${id}.goatcounter.com`);
    img.push(`https://${id}.goatcounter.com`);
  }
  const formOrigin = originOf(site.contactForm?.endpoint);
  if (formOrigin) connect.push(formOrigin);

  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    // GSAP/Three set styles through the CSSOM (allowed). 'unsafe-inline' is kept for style attributes only.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(' ')}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(' ')}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function securityHeaders(site) {
  return {
    'Content-Security-Policy': buildCsp(site),
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
}

const CACHE = 'public, max-age=31536000, immutable';

function netlifyHeaders(h) {
  const block = Object.entries(h)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');
  return `/*\n${block}\n\n/assets/*\n  Cache-Control: ${CACHE}\n`;
}

function vercelJson(h) {
  return (
    JSON.stringify(
      {
        headers: [
          { source: '/(.*)', headers: Object.entries(h).map(([key, value]) => ({ key, value })) },
          { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: CACHE }] },
        ],
      },
      null,
      2
    ) + '\n'
  );
}

/**
 * - Injects <title>, description, Open Graph, Twitter card, icons and JSON-LD at <!--SITE_META-->
 * - Injects optional analytics (production build only)
 * - Emits _headers (Netlify / Cloudflare Pages) and writes vercel.json
 */
export default function sitePlugin(site, profile, sameAs = []) {
  let isBuild = false;
  let root = process.cwd();

  return {
    name: 'site-meta-and-headers',

    configResolved(cfg) {
      isBuild = cfg.command === 'build';
      root = cfg.root;
      if (isBuild && !site.url) {
        console.warn(
          '\n[site] site.url is empty in src/data/site.js: link previews (WhatsApp/LinkedIn) will not show the image until you set it.\n'
        );
      }
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const base = (site.url || '').replace(/\/$/, '');
        const abs = (p) => (base ? base + p : p);
        const page = base || '';

        const ld = {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.name,
          description: site.description,
          jobTitle: 'Computer Science Student',
          ...(base && { url: base }),
          ...(sameAs.length && { sameAs }),
        };

        const tags = [
          `<title>${esc(site.title)}</title>`,
          `<meta name="description" content="${esc(site.description)}" />`,
          `<meta name="theme-color" content="${esc(site.themeColor)}" />`,
          `<meta name="author" content="${esc(profile.name)}" />`,
          page && `<link rel="canonical" href="${esc(page)}/" />`,
          `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
          `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
          `<meta property="og:type" content="website" />`,
          `<meta property="og:site_name" content="${esc(profile.name)}" />`,
          `<meta property="og:title" content="${esc(site.title)}" />`,
          `<meta property="og:description" content="${esc(site.description)}" />`,
          page && `<meta property="og:url" content="${esc(page)}/" />`,
          `<meta property="og:image" content="${esc(abs(site.ogImage))}" />`,
          `<meta property="og:image:width" content="1200" />`,
          `<meta property="og:image:height" content="630" />`,
          `<meta property="og:image:alt" content="${esc(profile.name)}: Computer Science and Network Security student" />`,
          `<meta name="twitter:card" content="summary_large_image" />`,
          `<meta name="twitter:title" content="${esc(site.title)}" />`,
          `<meta name="twitter:description" content="${esc(site.description)}" />`,
          `<meta name="twitter:image" content="${esc(abs(site.ogImage))}" />`,
          `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
        ];

        // Analytics: production only, so your own dev visits are never counted.
        const { provider, id } = site.analytics || {};
        if (!ctx.server && provider === 'plausible' && id) {
          tags.push(`<script defer data-domain="${esc(id)}" src="https://plausible.io/js/script.js"></script>`);
        } else if (!ctx.server && provider === 'goatcounter' && id) {
          tags.push(
            `<script data-goatcounter="https://${esc(id)}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
          );
        }

        return html.replace('<!--SITE_META-->', tags.filter(Boolean).join('\n    '));
      },
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: '_headers', source: netlifyHeaders(securityHeaders(site)) });
    },

    closeBundle() {
      if (!isBuild) return;
      fs.writeFileSync(path.join(root, 'vercel.json'), vercelJson(securityHeaders(site)));
    },
  };
}
