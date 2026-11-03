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
  { id: 'skills', label: 'Skills' },
  { id: 'journey', label: 'Journey' },
  { id: 'projects', label: 'Projects' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' },
];

const head = (num, label, title) => `
  <div class="section__head">
    <p class="label" data-reveal>${num} / ${esc(label)}</p>
    <h2 class="title" data-reveal>${esc(title)}</h2>
  </div>`;

function cvLink(cl) {
  return cv.file
    ? `<a class="${cl}" href="${esc(asset(cv.file))}" download target="_blank" rel="noopener">${esc(cv.label)}</a>`
    : '';
}

const PHOTO_W = 498;

function hero() {
  const chars = (word) =>
    [...word].map((c) => `<span class="char" aria-hidden="true" data-c="${esc(c)}">${esc(c)}</span>`).join('');
  const words = profile.name
    .split(' ')
    .map((w) => `<span class="word">${chars(w)}</span>`)
    .join(' ');
  return `
  <section class="section hero" id="hero" data-scene="hero" aria-label="Introduction">
    <div class="wrap">
      <p class="label hero__role" data-hero>${esc(profile.role)}</p>
      <h1 class="hero__name" aria-label="${esc(profile.name)}">${words}</h1>
      <p class="hero__headline" data-hero>${esc(profile.headline)}</p>
      <p class="hero__intro" data-hero>${esc(profile.intro)}</p>
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
  const paras = about.paragraphs
    .map((p) => `<p class="body${cls(p.placeholder)}" data-reveal>${esc(p.text)} ${badge(p.placeholder)}</p>`)
    .join('');
  const tags = about.interests.map((i) => `<li class="tag">${esc(i)}</li>`).join('');
  return `
  <section class="section about" id="about" data-scene="about" aria-labelledby="about-t">
    <div class="wrap wrap--left">
      ${head(nextNo(), 'About', 'About me').replace('class="title"', 'class="title" id="about-t"')}
      <div class="stack">
        ${paras}
        <ul class="tags" data-reveal aria-label="Interests">${tags}</ul>
        <p class="body${cls(about.ambitions.placeholder)}" data-reveal><strong>Ambitions.</strong> ${esc(about.ambitions.text)} ${badge(about.ambitions.placeholder)}</p>
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
    <li><article class="ccard icard" data-reveal>
      ${media}
      <div class="ccard__body">
        ${c.year ? `<p class="label">${esc(c.year)}</p>` : ''}
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
    .map((f) => `<li class="focus__item" data-reveal><span class="icontile">${icon(f.icon)}</span><span>${esc(f.name)}</span></li>`)
    .join('');
  const quals = qualifications
    .map(
      (q) => `
    <li><article class="ccard ccard--qual icard" data-reveal>
      <div class="ccard__img ccard__img--none ccard__img--qual" aria-hidden="true">${icon(q.icon || 'graduation')}</div>
      <div class="ccard__body">
        <p class="label">${esc(q.year)}</p>
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
      ${head(nextNo(), 'Profile', info.title).replace('class="title"', 'class="title" id="pf-t"')}
      <div class="pf">
        <article class="pcard icard pf__loc" data-reveal>
          <span class="icontile">${icon('pin')}</span>
          <p class="label">Location</p>
          <p class="pf__big">${FLAG_MU}<span>${esc(loc.country)}</span></p>
          <p class="muted">${esc(loc.place)}</p>
          <p class="pf__zone"><span>${esc(loc.timezone)}</span><span>${esc(loc.zoneLabel)}</span></p>
        </article>

        <article class="pcard icard pf__clock" data-reveal data-tz="${esc(loc.timezone)}">
          <span class="icontile">${icon('clock')}</span>
          <p class="label">Local time <span class="live"><i></i>Live</span></p>
          <p class="clock" aria-hidden="true"><span id="ck-h">--</span><span class="clock__sep">:</span><span id="ck-m">--</span><span class="clock__sep">:</span><span class="clock__s" id="ck-s">--</span></p>
          <p class="pf__date" id="ck-date">&nbsp;</p>
          <p class="muted small" id="ck-rel"></p>
          <span class="clock__bar" aria-hidden="true"><i id="ck-bar"></i></span>
          <p class="sr" id="ck-sr"></p>
        </article>

        <article class="pcard icard pf__status" data-reveal>
          <div class="pf__head">
            <span class="icontile">${icon('target')}</span>
            <p class="label">Availability &amp; status</p>
            <p class="pf__open"><i></i>Looking for an internship</p>
          </div>
          <dl class="facts">
            <div><dt>Status</dt><dd>${esc(info.status.current)}</dd></div>
            <div><dt>University</dt><dd>${esc(education.institution)}</dd></div>
            <div><dt>Programme</dt><dd>${esc(education.degree)}</dd></div>
            <div><dt>Expected graduation</dt><dd>${esc(gradYear)}</dd></div>
            <div><dt>Looking for</dt><dd>${esc(info.status.looking)}</dd></div>
          </dl>
          <p class="pf__goal"><strong>Career goal</strong>${esc(about.ambitions.text)}</p>
        </article>

        <article class="pcard icard pf__focus" data-reveal>
          <p class="label">Current professional interests</p>
          <ul class="focus">${focus}</ul>
        </article>
      </div>

      <div class="certs-head" data-reveal>
        <h3 class="chapter__title">Certifications &amp; qualifications</h3>
        <p class="muted small">Select a certificate to view it in full.</p>
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
      <p class="label">${esc(pt.label)}</p>
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
      ${c.year ? `<p class="label">${esc(c.year)}</p>` : ''}
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
      const html = `
      <div class="chapter" data-reveal>
        <p class="label">${esc(ch.label)}</p>
        <h3 class="chapter__title">${esc(ch.title)}</h3>
        ${ch.summary ? `<p class="muted">${esc(ch.summary)}</p>` : ''}
      </div>
      <div class="certs">${ch.certificates.map(certificate).join('')}</div>`;
      const bridge =
        i === (background.bridge.after ?? 0) && i < background.chapters.length - 1
          ? `
      <div class="bridge" data-reveal>
        <p class="label">${esc(background.bridge.label)}</p>
        <p class="bridge__text">${esc(background.bridge.text)}</p>
      </div>`
          : '';
      return `<div class="chapter-wrap">${html}</div>${bridge}`;
    })
    .join('');
  return `
  <section class="section" id="background" data-scene="background" aria-labelledby="bg-t">
    <div class="wrap">
      ${head(nextNo(), 'Background', background.title).replace('class="title"', 'class="title" id="bg-t"')}
      <p class="body" data-reveal>${esc(background.intro)}</p>
      <div class="bg-line">${chapters}</div>
    </div>
  </section>`;
}

function educationSection() {
  return `
  <section class="section" id="education" data-scene="education" aria-labelledby="edu-t">
    <div class="wrap wrap--left">
      ${head(nextNo(), 'Education', 'Academic timeline').replace('class="title"', 'class="title" id="edu-t"')}
      <div class="panel panel--deco" data-reveal>
        <img class="panel__deco" src="${asset(visuals.hex)}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="678" height="452" />
        <h3 class="panel__title">${esc(education.degree)}</h3>
        <p class="muted">${esc(education.institution)}</p>
        <div class="timeline" id="timeline"
             data-start="${esc(education.start)}" data-end="${esc(education.end)}">
          <div class="timeline__track"><i class="timeline__fill" id="timeline-fill"></i></div>
          <ol class="timeline__marks">
            <li><span class="dot"></span><b>${esc(education.startLabel)}</b><small>Start</small></li>
            <li class="now" id="timeline-now"><span class="dot"></span><b id="timeline-pct">0%</b><small>Today</small></li>
            <li><span class="dot"></span><b>${esc(education.endLabel)}</b><small>Completion</small></li>
          </ol>
        </div>
        <p class="muted small">Progress is calculated automatically from the dates in <code>content.js</code>.</p>
      </div>
    </div>
  </section>`;
}

function skillsSection() {
  const cards = skills
    .map((g) => {
      const real = g.items.filter((i) => !i.placeholder).length;
      const items = g.items
        .map(
          (i) => `
          <li class="skill${cls(i.placeholder)}">
            <span class="icontile">${icon(i.icon)}</span>
            <div class="skill__text">
              <span class="skill__name">${esc(i.name)}</span>${badge(i.placeholder)}
              ${i.description ? `<span class="skill__desc">${esc(i.description)}</span>` : ''}
            </div>
          </li>`
        )
        .join('');
      return `
      <article class="card card--skills" data-reveal>
        <header class="skillcat">
          <span class="icontile icontile--lg">${icon(g.icon)}</span>
          <h3 class="card__title">${esc(g.category)}</h3>
          <span class="count" aria-label="${real} skills">${String(real).padStart(2, '0')}</span>
        </header>
        <ul class="skilllist">${items}</ul>
      </article>`;
    })
    .join('');
  return `
  <section class="section" id="skills" data-scene="skills" aria-labelledby="sk-t">
    <div class="wrap">
      ${head(nextNo(), 'Skills', 'Technical skills').replace('class="title"', 'class="title" id="sk-t"')}
      <div class="grid grid--2">${cards}</div>
    </div>
  </section>`;
}

const STATUS = { completed: 'Completed', current: 'Current', upcoming: 'Upcoming' };

function journeySection() {
  const years = journey
    .map((y) => {
      const sems = y.semesters
        .map((s) => {
          const mods = s.modules.length
            ? `<ul class="modules">${s.modules
                .map(
                  (m) => `
                <li class="module">
                  <span class="module__name">${esc(m.name)}</span>
                  <span class="module__desc">${esc(m.description)}</span>
                  ${
                    m.topics && m.topics.length
                      ? `<ul class="tags tags--sm" aria-label="Topics">${m.topics
                          .map((t) => `<li class="tag">${esc(t)}</li>`)
                          .join('')}</ul>`
                      : ''
                  }
                </li>`
                )
                .join('')}</ul>`
            : `<p class="muted small${s.placeholder ? ' is-placeholder' : ''}">${esc(s.empty || 'Modules to be added.')} ${badge(s.placeholder)}</p>`;
          return `
          <article class="card card--sem is-${s.status}" data-reveal>
            <div class="card__top">
              <h4 class="card__title">${esc(s.semester)}</h4>
              <span class="status status--${s.status}">${STATUS[s.status]}</span>
            </div>
            ${s.period ? `<p class="label">${esc(s.period)}</p>` : ''}
            ${mods}
          </article>`;
        })
        .join('');
      return `
      <div class="year">
        <div class="year__head" data-reveal>
          <h3 class="year__title">${esc(y.year)}</h3>
          ${y.focus ? `<p class="muted small">${esc(y.focus)}</p>` : ''}
        </div>
        <div class="grid grid--2">${sems}</div>
      </div>`;
    })
    .join('');
  return `
  <section class="section" id="journey" data-scene="journey" aria-labelledby="jr-t">
    <div class="wrap">
      ${head(nextNo(), 'Journey', 'Academic journey').replace('class="title"', 'class="title" id="jr-t"')}
      ${years}
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
        p.partner && `<span>Built with ${esc(p.partner)}</span>`,
        p.role && `<span>My part: ${esc(p.role)}</span>`,
      ]
        .filter(Boolean)
        .join('');
      return `
      <li class="project${cls(p.placeholder)}" data-reveal>
        <span class="project__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="project__body">
          <h3 class="project__title">${esc(p.title)} ${badge(p.placeholder)}
            ${p.team ? `<span class="tag">${esc(p.team)}</span>` : ''}</h3>
          ${stackLine ? `<p class="project__stack">${esc(stackLine)}</p>` : ''}
          <p class="project__desc">${esc(p.description)}</p>
          ${meta ? `<p class="project__meta">${meta}</p>` : ''}
          ${p.image ? `<img class="project__img" src="${esc(asset(p.image))}" alt="Screenshot of ${esc(p.title)}" loading="lazy" />` : ''}
          ${links ? `<div class="card__links">${links}</div>` : ''}
        </div>
      </li>`;
    })
    .join('');
  return `
  <section class="section" id="projects" data-scene="projects" aria-labelledby="pr-t">
    <div class="wrap">
      ${head(nextNo(), 'Projects', projectsIntro.title).replace('class="title"', 'class="title" id="pr-t"')}
      <p class="body" data-reveal>${esc(projectsIntro.text)}</p>
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
        ${a.link ? `<a class="link" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer">Verify ↗</a>` : a.image ? `<button type="button" class="link link--btn" data-lightbox data-src="${esc(asset(a.image))}" data-caption="${esc(a.title)} – ${esc(a.issuer)}">View certificate</button>` : '<span></span>'}
      </li>`
    )
    .join('');
  return `
  <section class="section" id="achievements" data-scene="achievements" aria-labelledby="ac-t">
    <div class="wrap wrap--left">
      ${head(nextNo(), 'Achievements', 'Other certificates & participation').replace('class="title"', 'class="title" id="ac-t"')}
      <ul class="rows">${rows}</ul>
    </div>
  </section>`;
}

function contactSection() {
  const links = contact.links
    .map((l) => {
      const inner = `<span class="label">${esc(l.label)}</span><span class="contact__val">${esc(l.display)}</span>`;
      return l.href
        ? `<a class="contact__item" href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" data-reveal>${inner}</a>`
        : `<div class="contact__item is-placeholder" data-reveal>${inner} ${badge(l.placeholder)}</div>`;
    })
    .join('');

  const emailBtn = contact.email
    ? `<a class="btn btn--primary btn--lg" href="mailto:${esc(contact.email)}" data-reveal>Email me</a>
       <p class="muted small" data-reveal>${esc(contact.email)}</p>
       ${cvLink('btn btn--lg')}`
    : `<span class="btn btn--primary btn--lg is-placeholder-btn" aria-disabled="true" data-reveal>Email me ${badge(true)}</span>`;

  const form = site.contactForm.endpoint
    ? `
      <form class="form" id="contact-form" novalidate data-reveal>
        <p class="label">Or send a message</p>
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
    <div class="wrap wrap--center">
      <div class="contact__panel">
        ${head(nextNo(), 'Contact', "Let's connect").replace('class="title"', 'class="title" id="ct-t"')}
        <p class="body" data-reveal>${esc(contact.intro)}</p>
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

  document.getElementById('footer-text').textContent = `© ${new Date().getFullYear()} ${profile.name}`;
}
