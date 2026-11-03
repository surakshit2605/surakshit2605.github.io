# Surakshit Kessoonath: 3D portfolio

Stack: Vite · Three.js · GSAP (ScrollTrigger + ScrollTo) · plain JS modules.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
npm run preview
```

Needs Node 18+.

## Update your content (this is the only file you need)

Edit `src/data/content.js`. Every block marked `placeholder: true` shows a
visible "PLACEHOLDER" badge. Replace the text and delete the flag.

| To add…            | Edit                                      |
| ------------------ | ----------------------------------------- |
| Skills             | `skills[].items`: `{ name: 'Python' }`    |
| Modules per term   | `journey[n].modules` and `.skillsGained`  |
| Project            | duplicate an entry in `projects`          |
| Project screenshot | put image in `public/projects/`, set `image: '/projects/x.png'` |
| Certification      | duplicate an entry in `achievements`      |
| Email              | `contact.email`                           |
| GitHub / LinkedIn  | `contact.links[].href` and `.display`     |

Timeline progress is computed from `education.start` / `education.end`.

## Site settings (SEO, form, analytics, headers)

Edit `src/data/site.js`:

| Setting               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `url`                 | Your final address. **Set this before publishing**, or WhatsApp/LinkedIn will not show the preview image |
| `title`, `description`| Browser tab, Google result and link-preview text                      |
| `contactForm.endpoint`| Paste a Formspree URL to show a contact form. Empty = button only     |
| `analytics`           | `plausible` or `goatcounter`, cookie-free. Empty = no tracking        |

Set your email in `src/data/content.js` (`contact.email`) to enable the "Email me" button.

**Link preview image:** `public/og-image.png` (1200x630). Edit `design/og-image.html`
and re-capture it if you want to change it. Test it after publishing with the
LinkedIn Post Inspector, or by sending the link to yourself on WhatsApp.

**Security headers:** `npm run build` creates `dist/_headers` (Netlify, Cloudflare Pages)
and `vercel.json` (Vercel). They include a Content-Security-Policy that only allows what
`site.js` uses (your form service and analytics, nothing else). `npm run preview` serves
the build with the same headers, so you can catch a blocked resource locally.
GitHub Pages cannot set custom headers; use Netlify, Cloudflare Pages or Vercel if
you want them. If you add a new external script, image or font host, add its origin in
`scripts/vite-site-plugin.js` (`buildCsp`).

## Project layout

```
src/data/content.js     all text and data
src/data/site.js        SEO, form, analytics settings
scripts/vite-site-plugin.js   meta tags, JSON-LD, security headers
design/og-image.html    source of the link-preview image
src/render.js           builds the HTML from the data
src/scene/scene.js      Three.js scene, camera shots (KEYS)
src/animations.js       GSAP: loader, reveals, scroll, nav
src/styles/main.css     design tokens + styles
blender/generate_core.py   Blender script that exports public/models/core.glb
DESIGN.md               design system, Figma checklist
```

## Blender

Run `blender/generate_core.py` (see its header). If `public/models/core.glb`
exists, the site uses it; otherwise it uses the built-in procedural core.
The script has not been executed by the author of this scaffold.

## Figma

Figma is not generated from code. Use `DESIGN.md` to build the variables and
components, then adjust `main.css` tokens if your Figma design diverges.

## Accessibility and performance

- Skip link, landmarks, labelled sections, visible focus, keyboard nav
- `prefers-reduced-motion`: no loader animation, no scroll/camera motion, static 3D render
- Pixel ratio capped at 2, three/gsap split into separate chunks, no textures
- WebGL failure falls back to a plain dark background

## Menu and theme

- **Full-screen menu:** `src/menu.js` (GSAP timeline). The links come from `SECTIONS` in `src/render.js`; the side panel uses `profile`, `contact` and `cv` from `src/data/content.js`.
- **Dark / light theme:** `src/theme.js`. Colours are tokens at the top of `src/styles/main.css` (`:root` for dark, `:root[data-theme='light']` for light). 3D colours per theme are in `THEMES` in `src/scene/scene.js`.
- The saved choice is in `localStorage` under `theme`, applied before paint by `public/theme-init.js`. Dark is the default.

## Profile section (Personal & Professional Information)

- Text lives in `src/data/content.js`: `info` (location, focus areas, status), `qualifications`, `extraCertifications`.
- Certificates are taken automatically from the Background chapters (single source of truth). The Hindi chapter is excluded (`hideFromCertifications: true`). Add `skip: true` to any certificate to hide it from the grid.
- To add a new certificate, push an entry into `extraCertifications`:
  `{ name, institution, year, image: 'certificates/file.jpg', pdf: 'certificates/file.pdf', link: 'https://...', tags: ['...'] }`
  `link` and `pdf` are optional; the "Verify credential" and "View PDF" buttons only appear when provided.
- The clock uses the timezone `Indian/Mauritius` (UTC+4) and the visitor's device clock.

## SK logo

- Artwork: `src/logo.js` (`LOGO_PATHS`). The same paths are in `public/favicon.svg`; `apple-touch-icon.png` is rendered from it.
- Used in the navbar (links to top, with the name "Surakshit" beside it), loader (draws itself), and footer. Colours: `--lg-a/b/c` tokens in `main.css` (separate values for light theme).
- `public/og-image.png` (social preview) was NOT regenerated and may still show the old design.

## Atmosphere (backgrounds)

- `src/atmosphere.js` + the `.atmos`, `.grain` blocks in `main.css`: three soft light layers (blue, cyan, indigo), a faint grid, a slow light beam and film grain. Each section has a preset in `PRESETS`; edit the numbers (x%, y%, scale, opacity) to change the mood of a section.
- Only transform/opacity are animated, so it is cheap. The beam is hidden on mobile and in light theme. Reduced-motion users get the static hero look.

## Pictures (public/visuals)

- Defined in `visuals` at the bottom of `src/data/content.js`.
- `laptop-glow.webp` (Contact background, desktop and dark theme only) and `hex-panels.webp` (Education card corner) are decorative.
- The originals were colour-graded to the site's blue palette; source images were not edited in any other way. Check you have the right to use them publicly.
- Your own EV3 photo is in Robotics, Part 2 (`robotics/ev3-robot-brick.jpg`).

## Portrait card (About)

- Your real photo at rest. On hover a sky-blue scan line sweeps down and the photo turns grey with a sky-blue tint; on leave it sweeps back up and the original returns. The card also tilts slightly with the mouse. Code: `src/photo-fx.js` and the `.pframe` / `.pf-tone` blocks in `main.css` (the tint colour is `.pf-tone::after`).
- Touch screens have no hover, so they always show the real colours.
- `profile.photoStyle` in `src/data/content.js`: `'original'` (default, `public/portrait-original.webp`) or `'cutout'` (you on a navy backdrop). The caption line is `profile.photoCaption`.

## Accent colours

- A colour button next to the moon button opens six colours: Electric blue (default), Cyan, Violet, Emerald, Rose, Amber. The choice is remembered and works with both dark and light theme.
- All colour values live in `src/accents.js`. To add a colour, copy one entry and change the hex values. Entries have a dark (`d`), light (`l`) and 3D (`scene`) block.
- The favicon and `og-image.png` are static images and stay blue.
