import {
  profile,
  about,
  education,
  background,
  skills,
  journey,
  projects,
  projectsIntro,
  achievements,
  contact,
  cv,
  info,
  qualifications,
  certifications, visuals } from './data/content.js';
import { site } from './data/site.js';
import { icon } from './icons.js';
import { mapMarkup } from './map.js';
import { journeyMap } from './data/content.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let sectionNo = 0;
const nextNo = () => String(++sectionNo).padStart(2, '0');

// Prefix asset paths with the site base so images work on any host path.
const asset = (p) => {
  if (!p) return '';
  if (/^(https?:)?\/\//.test(p)) return p;
  return import.meta.env.BASE_URL + p.replace(/^\//, '');
};

const badge = (on) => (on ? '<span class="badge">Placeholder</span>' : '');
const cls = (on) => (on ? ' is-placeholder' : '');

export const SECTIONS = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About Me' },
  { id: 'profile', label: 'Profile' },
  { id: 'background', label: 'Background' },
  { id: 'education', label: 'Education' },
  { id: 'map', label: 'Journey Map' },
  { id: 'skills', label: 'Skills' },
  { id: 'journey', label: 'Journey' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' },
];

const DECKS = String(SECTIONS.length).padStart(2, '0');
const COORD = '20.2°S · 57.5°E';

/** Wrap given phrases in <em class="hl"> (text is escaped first; phrases that are not found are ignored). */
const emp = (text, phrases = []) =>
  phrases.reduce((out, ph) => out.replace(esc(ph), (m) => `<em class="hl">${m}</em>`), esc(text));

/** Editorial section header: ghost numeral, mono meta line, big serif title whose last word(s) are italic. */
const head = (num, label, title, id = '', italicWords = 1) => {
  const w = title.split(' ');
  const cut = Math.max(1, w.length - italicWords);
  const roman = esc(w.slice(0, cut).join(' '));
  const ital = esc(w.slice(cut).join(' '));
  const long = title.length > 22 ? ' eh__title--long' : '';
  return `
  <header class="eh">
    <span class="eh__ghost" aria-hidden="true">${num}</span>
    <p class="eh__meta" data-reveal><span>Deck ${num}<i>/</i>${DECKS}</span><span>${esc(label)}</span><span class="eh__coord">${COORD}</span></p>
    <h2 class="eh__title${long}"${id ? ` id="${id}"` : ''}>${roman}${ital ? ` <em>${ital}</em>` : ''}</h2>
  </header>`;
};

function cvLink(cl) {
  return cv.file
    ? `<a class="${cl}" href="${esc(asset(cv.file))}" download target="_blank" rel="noopener">${esc(cv.label)}</a>`
    : '';
}

const PHOTO_W = 498;

function hero() {
  const chars = (word) =>
    [...word].map((c) => `<span class="char" aria-hidden="true" data-c="${esc(c)}">${esc(c)}</span>`).join('');
  const parts = profile.name.split(' ');
  const words = parts
    .map((w, i) => `<span class="word${i === parts.length - 1 ? ' word--it' : ''}">${chars(w)}</span>`)
    .join(' ');
  const [roleA, roleB] = profile.role.split(' · ');
  return `
  <section class="section hero" id="hero" data-scene="hero" aria-label="Introduction">
    <div class="wrap">
      <p class="hero__meta" data-hero><span class="label hero__role">${esc(roleA)}${roleB ? `<i>·</i>${esc(roleB)}` : ''}</span><span class="hero__coord">${COORD}</span></p>
      <h1 class="hero__name" aria-label="${esc(profile.name)}">${words}</h1>
      <div class="hero__row" data-hero>
        <p class="hero__headline">${emp(profile.headline, ['defend the networks'])}</p>
        <p class="hero__intro">${esc(profile.intro)}</p>
      </div>
      <div class="hero__cta" data-hero>
        <a class="btn btn--primary" href="#projects" data-nav>View projects</a>
        <a class="btn" href="#contact" data-nav>Get in touch</a>
        ${cvLink('btn')}
      </div>
    </div>
    <div class="hero__scroll" data-hero aria-hidden="true"><span>Scroll</span><i></i></div>
  </section>`;
}

function aboutSection() {
  const [lead, ...rest] = about.paragraphs;
  const restHtml = rest
    .map((p) => `<p class="about__p${cls(p.placeholder)}" data-reveal>${emp(p.text, ['how to secure them'])} ${badge(p.placeholder)}</p>`)
    .join('');
  const tags = about.interests
    .map((i, n) => `<li><span>${String(n + 1).padStart(2, '0')}</span>${esc(i)}</li>`)
    .join('');
  return `
  <section class="section about" id="about" data-scene="about" aria-labelledby="about-t">
    <div class="wrap wrap--left">
      ${head(nextNo(), 'About', 'About me', 'about-t')}
      <div class="about__grid">
        <p class="about__lead${cls(lead.placeholder)}" data-lit>${emp(lead.text, ['Computer Science', 'Network Security'])} ${badge(lead.placeholder)}</p>
        <div class="about__cols">
          <div class="about__text">${restHtml}</div>
          <div class="about__idx" data-reveal>
            <p class="eyebrow">Interests</p>
            <ol class="idx" aria-label="Interests">${tags}</ol>
          </div>
        </div>
        <blockquote class="pull${cls(about.ambitions.placeholder)}" data-reveal>
          <p class="eyebrow">Ambitions</p>
          <p class="pull__text">${emp(about.ambitions.text, ['internship'])} ${badge(about.ambitions.placeholder)}</p>
        </blockquote>
      </div>
    </div>
    ${
      profile.photo
        ? `<div class="about__figure"><figure class="pframe${profile.photoStyle === 'original' ? ' pframe--original' : ''}" data-reveal>
            <img class="pf-base" src="${esc(asset(profile.photoStyle === 'original' ? profile.photoOriginal : profile.photo))}" alt="${esc(profile.photoAlt || profile.name)}" loading="lazy" decoding="async" />
            <div class="pf-tone" aria-hidden="true"><img class="pf-color" src="${esc(asset(profile.photoStyle === 'original' ? profile.photoOriginal : profile.photo))}" alt="" loading="lazy" decoding="async" /></div>
            <i class="pf-scan" aria-hidden="true"></i>
            <b class="pf-c pf-c--tl" aria-hidden="true"></b><b class="pf-c pf-c--tr" aria-hidden="true"></b><b class="pf-c pf-c--bl" aria-hidden="true"></b><b class="pf-c pf-c--br" aria-hidden="true"></b>
            <figcaption><strong>${esc(profile.name)}</strong><span>${esc(profile.photoCaption || '')}</span></figcaption>
          </figure></div>`
        : ''
    }
  </section>`;
}

const FLAG_MU = `<svg class="flag" viewBox="0 0 30 20" role="img" aria-label="Flag of Mauritius"><rect width="30" height="5" y="0" fill="#EA2839"/><rect width="30" height="5" y="5" fill="#1A206D"/><rect width="30" height="5" y="10" fill="#FFD500"/><rect width="30" height="5" y="15" fill="#00A551"/></svg>`;

function certCard(c) {
  const img = c.image ? asset(c.image) : '';
  const media = img
    ? `<button type="button" class="ccard__img" data-lightbox data-src="${esc(img)}" data-caption="${esc(c.name)}" aria-label="View larger: ${esc(c.name)}"><img src="${esc(img)}" alt="Certificate: ${esc(c.name)}" loading="lazy" /></button>`
    : `<div class="ccard__img ccard__img--none" aria-hidden="true">${icon('file')}</div>`;
  const tags = (c.tags || []).slice(0, 3).map((t) => `<li class="tag">${esc(t)}</li>`).join('');
  const links = [
    c.link ? `<a class="link" href="${esc(c.link)}" target="_blank" rel="noopener noreferrer">Verify credential ↗</a>` : '',
    c.pdf ? `<a class="link" href="${esc(asset(c.pdf))}" target="_blank" rel="noopener">View PDF ↗</a>` : '',
  ].join('');
  return `
    <li><article class="ccard" data-reveal>
      ${media}
      <div class="ccard__body">
        ${c.year ? `<p class="ccard__year">${esc(c.year)}</p>` : ''}
        <h4 class="ccard__name">${esc(c.name)}</h4>
        <p class="ccard__inst" title="${esc(c.institution)}">${esc(c.institution)}</p>
        ${tags ? `<ul class="tags tags--sm" aria-label="Details">${tags}</ul>` : ''}
        ${links ? `<p class="ccard__links">${links}</p>` : ''}
      </div>
    </article></li>`;
}

function profileSection() {
  const loc = info.location;
  const focus = info.focus
    .map((f, n) => `<li class="focus__item" data-reveal><span class="focus__n">${String(n + 1).padStart(2, '0')}</span><span class="focus__t">${esc(f.name)}</span><span class="icontile">${icon(f.icon)}</span></li>`)
    .join('');
  const quals = qualifications
    .map(
      (q) => `
    <li><article class="ccard ccard--qual" data-reveal>
      <div class="ccard__img ccard__img--none ccard__img--qual" aria-hidden="true">${icon(q.icon || 'graduation')}</div>
      <div class="ccard__body">
        <p class="ccard__year">${esc(q.year)}</p>
        <h4 class="ccard__name">${esc(q.name)}</h4>
        <p class="ccard__inst">${esc(q.institution)}</p>
        <ul class="tags tags--sm"><li class="tag tag--live">${esc(q.status)}</li></ul>
      </div>
    </article></li>`
    )
    .join('');
  const gradYear = education.endLabel.replace(/\s*\(Expected\)/i, '');
  return `
  <section class="section" id="profile" data-scene="profile" aria-labelledby="pf-t">
    <div class="wrap">
      ${head(nextNo(), 'Profile', info.title, 'pf-t')}
      <div class="dossier">
        <div class="dossier__loc" data-reveal>
          <p class="eyebrow">Location</p>
          <p class="dossier__country">${FLAG_MU}<span>${esc(loc.country)}</span></p>
          <p class="dossier__place">${esc(loc.place)}</p>
          <p class="dossier__zone"><span>${esc(loc.timezone)}</span><span>${esc(loc.zoneLabel)}</span></p>
        </div>

        <div class="dossier__clock" data-reveal data-tz="${esc(loc.timezone)}">
          <p class="eyebrow">Local time <span class="live"><i></i>Live</span></p>
          <p class="clock" aria-hidden="true"><span id="ck-h">--</span><span class="clock__sep">:</span><span id="ck-m">--</span><span class="clock__sep">:</span><span class="clock__s" id="ck-s">--</span></p>
          <p class="pf__date" id="ck-date">&nbsp;</p>
          <p class="muted small" id="ck-rel"></p>
          <span class="clock__bar" aria-hidden="true"><i id="ck-bar"></i></span>
          <p class="sr" id="ck-sr"></p>
        </div>

        <div class="dossier__file" data-reveal>
          <div class="dossier__filehead">
            <p class="eyebrow">Availability &amp; status</p>
            <p class="pf__open"><i></i>Looking for an internship</p>
          </div>
          <dl class="facts">
            <div><dt>Status</dt><dd>${esc(info.status.current)}</dd></div>
            <div><dt>University</dt><dd>${esc(education.institution)}</dd></div>
            <div><dt>Programme</dt><dd>${esc(education.degree)}</dd></div>
            <div><dt>Expected graduation</dt><dd>${esc(gradYear)}</dd></div>
            <div><dt>Looking for</dt><dd>${esc(info.status.looking)}</dd></div>
          </dl>
        </div>

        <blockquote class="pull dossier__goal" data-reveal>
          <p class="eyebrow">Career goal</p>
          <p class="pull__text">${emp(about.ambitions.text, ['internship'])}</p>
        </blockquote>

        <div class="dossier__focus" data-reveal>
          <p class="eyebrow">Current professional interests</p>
          <ul class="focus">${focus}</ul>
        </div>
      </div>

      <div class="certs-head" data-reveal>
        <h3 class="sub">Certifications <em>&amp; qualifications</em></h3>
        <p class="eyebrow">Select a certificate to view it in full.</p>
      </div>
      <ul class="cgrid">${quals}${certifications.map(certCard).join('')}</ul>
    </div>
  </section>`;
}

function certParts(parts) {
  return `<div class="parts">${parts
    .map(
      (pt) => `
    <section class="part" data-reveal aria-label="${esc(pt.label)}: ${esc(pt.title)}">
      <p class="eyebrow">${esc(pt.label)}</p>
      <h5 class="part__title">${esc(pt.title)}</h5>
      ${pt.text ? `<p class="body small part__text">${esc(pt.text)}</p>` : ''}
      ${
        pt.videos && pt.videos.length
          ? `<ul class="part__videos" aria-label="Videos">${pt.videos
              .map(
                (v) => `<li><figure class="vid">
                  <video controls preload="none" playsinline muted poster="${esc(asset(v.poster))}" aria-label="${esc(v.caption)}">
                    <source src="${esc(asset(v.src))}" type="video/mp4" />
                  </video>
                  <figcaption>${esc(v.caption)}</figcaption>
                </figure></li>`
              )
              .join('')}</ul>`
          : ''
      }
      ${
        pt.photos && pt.photos.length
          ? `<ul class="part__photos" aria-label="Photos">${pt.photos
              .map(
                (ph) => `<li><button type="button" class="photo" data-lightbox data-src="${esc(asset(ph.src))}" data-caption="${esc(ph.alt)}" aria-label="View larger: ${esc(ph.alt)}">
                  <img src="${esc(asset(ph.src))}" alt="${esc(ph.alt)}" loading="lazy" />
                </button></li>`
              )
              .join('')}</ul>`
          : ''
      }
    </section>`
    )
    .join('')}</div>`;
}

function certificate(c) {
  const img = c.image ? asset(c.image) : '';
  const frame = img
    ? `<button type="button" class="cert__open" data-lightbox data-src="${esc(img)}" data-caption="${esc(c.name)}" aria-label="View larger: ${esc(c.name)}">
         <img src="${esc(img)}" alt="Scan of the certificate: ${esc(c.name)}" loading="lazy" />
       </button>`
    : '<div class="cert__ph" aria-hidden="true"><span>Certificate scan</span></div>';
  return `
  <article class="cert${c.portrait ? ' cert--portrait' : ''}${cls(c.placeholder)}" data-reveal>
    <div class="cert__frame">${frame}</div>
    <div class="cert__text">
      ${c.year ? `<p class="cert__year">${esc(c.year)}</p>` : ''}
      <h4 class="cert__name">${esc(c.name)} ${badge(c.placeholder)}</h4>
      <p class="cert__inst">${esc(c.institution)}</p>
      ${c.tags && c.tags.length ? `<ul class="tags tags--sm" aria-label="Details">${c.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>` : ''}
      ${c.description ? `<p class="body small">${esc(c.description)}</p>` : ''}
    </div>
  </article>${c.parts && c.parts.length ? certParts(c.parts) : ''}`;
}

function backgroundSection() {
  const chapters = background.chapters
    .map((ch, i) => {
      const num = esc(ch.label.replace(/^Chapter\s+/i, ''));
      const html = `
      <div class="chapter" data-reveal>
        <p class="chapter__label"><span>${esc(ch.label)}</span></p>
        <h3 class="chapter__title">${esc(ch.title)}</h3>
        ${ch.summary ? `<p class="chapter__sum">${esc(ch.summary)}</p>` : ''}
      </div>
      <div class="certs">${ch.certificates.map(certificate).join('')}</div>`;
      const bridge =
        i === (background.bridge.after ?? 0) && i < background.chapters.length - 1
          ? `
      <div class="bridge">
        <p class="eyebrow" data-reveal>${esc(background.bridge.label)}</p>
        <p class="bridge__text" data-lit>${emp(background.bridge.text, ['analytical thinking and attention to detail'])}</p>
      </div>`
          : '';
      return `<div class="chapter-wrap" data-roman="${num}">${html}</div>${bridge}`;
    })
    .join('');
  return `
  <section class="section" id="background" data-scene="background" aria-labelledby="bg-t">
    <div class="wrap">
      ${head(nextNo(), 'Background', background.title, 'bg-t')}
      <p class="lede" data-lit>${esc(background.intro)}</p>
      <div class="bg-line">${chapters}</div>
    </div>
  </section>`;
}

function mapSection() {
  return `
  <section class="section section--map" id="map" data-scene="education" aria-labelledby="map-t">
    <div class="wrap">
      ${head(nextNo(), journeyMap.label, journeyMap.title, 'map-t')}
      <p class="lede" data-lit>${esc(journeyMap.intro)}</p>
      ${mapMarkup()}
    </div>
  </section>`;
}

function educationSection() {
  return `
  <section class="section" id="education" data-scene="education" aria-labelledby="edu-t">
    <div class="wrap wrap--left">
      ${head(nextNo(), 'Education', 'Academic timeline', 'edu-t')}
      <div class="edu" data-reveal>
        <img class="edu__deco" src="${asset(visuals.hex)}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="678" height="452" />
        <p class="eyebrow">${esc(education.status)}</p>
        <h3 class="edu__degree">${esc(education.degree)}</h3>
        <p class="edu__inst">${esc(education.institution)}</p>
        <div class="timeline" id="timeline"
             data-start="${esc(education.start)}" data-end="${esc(education.end)}">
          <p class="timeline__big" aria-hidden="true"><b id="timeline-pct">0%</b></p>
          <div class="timeline__track"><i class="timeline__fill" id="timeline-fill"></i></div>
          <ol class="timeline__marks">
            <li><span class="dot"></span><b>${esc(education.startLabel)}</b><small>Start</small></li>
            <li class="now" id="timeline-now"><span class="dot"></span><small>Today</small></li>
            <li><span class="dot"></span><b>${esc(education.endLabel)}</b><small>Completion</small></li>
          </ol>
        </div>
      </div>
    </div>
  </section>`;
}

function skillsSection() {
  const groups = skills
    .map((g, gi) => {
      const real = g.items.filter((i) => !i.placeholder).length;
      const items = g.items
        .map(
          (i, n) => `
          <li class="skrow${cls(i.placeholder)}">
            <span class="skrow__n">${String(n + 1).padStart(2, '0')}</span>
            <span class="skrow__name">${esc(i.name)}${badge(i.placeholder)}</span>
            ${i.description ? `<span class="skrow__desc">${esc(i.description)}</span>` : ''}
            <span class="skrow__ic icontile">${icon(i.icon)}</span>
          </li>`
        )
        .join('');
      return `
      <article class="skgrp" data-reveal>
        <header class="skgrp__head">
          <span class="skgrp__id">${String.fromCharCode(65 + gi)}</span>
          <h3 class="skgrp__title">${esc(g.category)}</h3>
          <span class="skgrp__count" aria-label="${real} skills">${String(real).padStart(2, '0')} <i>items</i></span>
        </header>
        <ul class="skrows">${items}</ul>
      </article>`;
    })
    .join('');
  return `
  <section class="section" id="skills" data-scene="skills" aria-labelledby="sk-t">
    <div class="wrap">
      ${head(nextNo(), 'Skills', 'Technical skills', 'sk-t')}
      <div class="skx">${groups}</div>
    </div>
  </section>`;
}

const STATUS = { completed: 'Completed', current: 'Current', upcoming: 'Upcoming' };

function journeySection() {
  const years = journey
    .map((y, yi) => {
      const sems = y.semesters
        .map((s) => {
          const mods = s.modules.length
            ? `<ol class="mods">${s.modules
                .map(
                  (m, n) => `
                <li class="mod">
                  <span class="mod__n">${String(n + 1).padStart(2, '0')}</span>
                  <div class="mod__main">
                    <h5 class="mod__name">${esc(m.name)}</h5>
                    <p class="mod__desc">${esc(m.description)}</p>
                  </div>
                  ${
                    m.topics && m.topics.length
                      ? `<ul class="topics" aria-label="Topics">${m.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
                      : ''
                  }
                </li>`
                )
                .join('')}</ol>`
            : `<p class="sem__empty${s.placeholder ? ' is-placeholder' : ''}">${esc(s.empty || 'Modules to be added.')} ${badge(s.placeholder)}</p>`;
          return `
          <article class="sem is-${s.status}" data-reveal>
            <header class="sem__head">
              <h4 class="sem__title">${esc(s.semester)}</h4>
              <span class="status status--${s.status}"><i></i>${STATUS[s.status]}</span>
            </header>
            ${s.period ? `<p class="sem__period">${esc(s.period)}</p>` : ''}
            ${mods}
          </article>`;
        })
        .join('');
      const yw = String(y.year).split(' ');
      return `
      <div class="year">
        <aside class="year__head" data-reveal>
          <p class="year__big" aria-label="${esc(y.year)}">${yw.length > 1 ? `<span>${esc(yw[0])}</span><b>${esc(yw.slice(1).join(' '))}</b>` : esc(y.year)}</p>
          ${y.focus ? `<p class="year__focus">${esc(y.focus)}</p>` : ''}
        </aside>
        <div class="year__sems">${sems}</div>
      </div>`;
    })
    .join('');
  return `
  <section class="section" id="journey" data-scene="journey" aria-labelledby="jr-t">
    <div class="wrap">
      ${head(nextNo(), 'Journey', 'Academic journey', 'jr-t')}
      <div class="archive">${years}</div>
    </div>
  </section>`;
}

function projectsSection() {
  const rows = projects
    .map((p, i) => {
      const stackLine = [p.stack && p.stack.length ? p.stack.join(' · ') : '', p.context]
        .filter(Boolean)
        .join(' — ');
      const links = [
        p.github && `<a class="link" href="${esc(p.github)}" target="_blank" rel="noopener noreferrer">GitHub ↗</a>`,
        p.live && `<a class="link" href="${esc(p.live)}" target="_blank" rel="noopener noreferrer">Live ↗</a>`,
      ]
        .filter(Boolean)
        .join('');
      const meta = [
        p.partner && `<div><dt>Built with</dt><dd>${esc(p.partner)}</dd></div>`,
        p.role && `<div><dt>My part</dt><dd>${esc(p.role)}</dd></div>`,
      ]
        .filter(Boolean)
        .join('');
      return `
      <li class="project${cls(p.placeholder)}" data-reveal>
        <span class="project__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="project__body">
          <h3 class="project__title">${esc(p.title)} ${badge(p.placeholder)}</h3>
          ${p.team ? `<p class="project__team"><span>${esc(p.team)}</span></p>` : ''}
          ${stackLine ? `<p class="project__stack">${esc(stackLine)}</p>` : ''}
          <div class="project__cols">
            <p class="project__desc">${esc(p.description)}</p>
            ${meta ? `<dl class="project__meta">${meta}</dl>` : ''}
          </div>
          ${p.image ? `<img class="project__img" src="${esc(asset(p.image))}" alt="Screenshot of ${esc(p.title)}" loading="lazy" />` : ''}
          ${links ? `<div class="card__links">${links}</div>` : ''}
        </div>
      </li>`;
    })
    .join('');
  return `
  <section class="section" id="projects" data-scene="projects" aria-labelledby="pr-t">
    <div class="wrap">
      ${head(nextNo(), 'Projects', projectsIntro.title, 'pr-t')}
      <p class="lede lede--sm" data-reveal>${esc(projectsIntro.text)}</p>
      <ol class="projects">${rows}</ol>
    </div>
  </section>`;
}

function achievementsSection() {
  const rows = achievements
    .map(
      (a) => `
      <li class="row${cls(a.placeholder)}" data-reveal>
        <span class="row__date">${esc(a.date || '—')}</span>
        <span class="row__main"><b>${esc(a.title)}</b> ${badge(a.placeholder)}<small>${esc(a.issuer)}${a.tag ? ` · ${esc(a.tag)}` : ''}</small></span>
        ${a.link ? `<a class="link row__act" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Verify ↗</a>` : a.image ? `<button type="button" class="link link--btn row__act" data-lightbox data-src="${esc(asset(a.image))}" data-caption="${esc(a.title)} – ${esc(a.issuer)}">View certificate</button>` : '<span></span>'}
      </li>`
    )
    .join('');
  return `
  <section class="section" id="achievements" data-scene="achievements" aria-labelledby="ac-t">
    <div class="wrap wrap--left">
      ${head(nextNo(), 'Achievements', 'Other certificates & participation', 'ac-t')}
      <ul class="rows">${rows}</ul>
    </div>
  </section>`;
}

function contactSection() {
  const links = contact.links
    .map((l) => {
      const inner = `<span class="contact__label">${esc(l.label)}</span><span class="contact__val">${esc(l.display)}</span><span class="contact__arr" aria-hidden="true">↗</span>`;
      return l.href
        ? `<a class="contact__item" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" data-reveal>${inner}</a>`
        : `<div class="contact__item is-placeholder" data-reveal>${inner} ${badge(l.placeholder)}</div>`;
    })
    .join('');

  const emailBtn = contact.email
    ? `<a class="btn btn--primary btn--lg" href="mailto:${esc(contact.email)}" data-reveal>Email me</a>
       ${cvLink('btn btn--lg')}
       <p class="contact__mail" data-reveal>${esc(contact.email)}</p>`
    : `<span class="btn btn--primary btn--lg is-placeholder-btn" aria-disabled="true" data-reveal>Email me ${badge(true)}</span>`;

  const form = site.contactForm.endpoint
    ? `
      <form class="form" id="contact-form" novalidate data-reveal>
        <p class="eyebrow">Or send a message</p>
        <div class="field"><label for="cf-name">Name</label>
          <input id="cf-name" name="name" autocomplete="name" required maxlength="80" /></div>
        <div class="field"><label for="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" autocomplete="email" required maxlength="120" /></div>
        <div class="field"><label for="cf-msg">Message</label>
          <textarea id="cf-msg" name="message" rows="5" required minlength="10" maxlength="2000"></textarea></div>
        <div class="field field--hp" aria-hidden="true">
          <label>Leave this empty<input name="company" tabindex="-1" autocomplete="off" /></label></div>
        <button class="btn btn--primary" type="submit">Send message</button>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>`
    : '';

  return `
  <section class="section" id="contact" data-scene="contact" aria-labelledby="ct-t">
    <div class="vbg" aria-hidden="true"><img src="${asset(visuals.laptop)}" alt="" loading="lazy" decoding="async" width="1100" height="1375" /></div>
    <div class="wrap contact__wrap">
      <div class="contact__panel">
        ${head(nextNo(), 'Contact', "Let's connect", 'ct-t')}
        <p class="lede lede--sm" data-reveal>${emp(contact.intro, ['internship'])}</p>
        <div class="contact__cta">${emailBtn}</div>
        <div class="contact">${links}</div>
        ${form}
      </div>
    </div>
  </section>`;
}

export function render() {
  sectionNo = 0;
  document.getElementById('main').innerHTML =
    hero() +
    aboutSection() +
    profileSection() +
    backgroundSection() +
    educationSection() +
    mapSection() +
    skillsSection() +
    journeySection() +
    projectsSection() +
    achievementsSection() +
    contactSection();

  document.getElementById('menu-list').innerHTML = SECTIONS.map(
    (s, i) =>
      `<li><a href="#${s.id}" data-nav data-target="${s.id}"><span class="menu__num">${String(i + 1).padStart(2, '0')}</span><span class="menu__txt"><span class="menu__line">${esc(s.label)}</span></span></a></li>`
  ).join('');

  const social = contact.links
    .filter((l) => l.href)
    .map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`)
    .join('');
  document.getElementById('menu-side').innerHTML = `
    <div><p class="menu__who">${esc(profile.name)}</p><p>${esc(profile.role)}</p></div>
    ${contact.email ? `<div><h2>Contact</h2><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div>` : ''}
    ${social || cv.file ? `<div><h2>Elsewhere</h2>${social}${cv.file ? `<a href="${esc(asset(cv.file))}" download target="_blank" rel="noopener">${esc(cv.label)} ↓</a>` : ''}</div>` : ''}`;
  document.getElementById('menu-foot-l').textContent = profile.location || '';
  document.getElementById('menu-foot-r').textContent = `© ${new Date().getFullYear()}`;

  if (!document.querySelector('.hud')) {
    const h = document.createElement('div');
    h.className = 'hud';
    h.setAttribute('aria-hidden', 'true');
    h.innerHTML = `<span class="hud__n">01</span><span class="hud__bar"></span><span class="hud__l">${esc(SECTIONS[0].label)}</span>`;
    document.body.appendChild(h);
  }
  document.getElementById('footer-text').textContent = `© ${new Date().getFullYear()} ${profile.name}`;
}
