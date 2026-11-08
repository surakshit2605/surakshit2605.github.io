/**
 * Hidden station terminal. Open it with the ` key, or tap the logo three times quickly.
 * Every answer comes from src/data/content.js, the same data the page itself shows: nothing is typed in here.
 */
import { now, profile, about, education, skills, projects, contact } from './data/content.js';

import { getQuality, setQuality } from './quality.js';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initTerminal() {
  let root = null, out, input, open = false, prevFocus = null;
  const history = [];
  let hi = 0;

  const sections = () => [...document.querySelectorAll('[data-scene]')].map((s) => s.id).filter(Boolean);

  function line(text = '', cls = '') {
    const d = document.createElement('div');
    d.className = 'term__l' + (cls ? ' ' + cls : '');
    d.textContent = text;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
    return d;
  }
  function link(label, href) {
    const d = document.createElement('div'); d.className = 'term__l';
    const k = document.createElement('span'); k.className = 'term__k'; k.textContent = label.padEnd(10, ' ');
    const a = document.createElement('a'); a.href = href; a.textContent = href.replace(/^mailto:|^https:\/\//, ''); a.target = href.startsWith('http') ? '_blank' : '_self'; a.rel = 'noopener noreferrer';
    d.append(k, a); out.appendChild(d); out.scrollTop = out.scrollHeight;
  }
  const wrap = (t) => t; // the browser wraps long lines

  const COMMANDS = {
    help() {
      line('Commands', 'term__h');
      [['whoami', 'who I am'], ['about', 'a short intro'], ['education', 'degree and dates'], ['skills', 'skills by category'], ['projects', 'university projects'], ['contact', 'email and links'],
        ['now', 'what I am working on'], ['ls', 'list the rooms'], ['quality auto|low|high', '3D detail (reloads the page)'], ['goto <room>', 'fly to a room, e.g. goto projects'], ['theme dark|light', 'switch theme'], ['sound on|off', 'station sound'], ['clear', 'clear the screen'], ['exit', 'close (or press Esc)']]
        .forEach(([c, d]) => line(`  ${c.padEnd(18, ' ')}${d}`));
    },
    whoami() { line(profile.name); line(profile.role); if (profile.location) line(profile.location); },
    about() { line(wrap(about.paragraphs[0].text)); },
    education() {
      line(education.institution); line(education.degree);
      line(`${education.startLabel} to ${education.endLabel}`); line(education.status);
    },
    skills() { skills.forEach((c) => line(`${c.category}: ${c.items.map((i) => i.name).join(', ')}`)); },
    projects() { projects.forEach((p, i) => line(`${String(i + 1).padStart(2, '0')}  ${p.title}  [${p.stack.join(', ')}]`)); },
    contact() {
      link('email', `mailto:${contact.email}`);
      contact.links.forEach((l) => link(l.label.toLowerCase(), l.href));
    },
    now() { line(now.text ? `${now.label || 'Now'}: ${now.text}` : 'Nothing set yet. Add a line to "now" in content.js.'); },
    quality(arg) {
      const q = (arg || '').toLowerCase();
      if (!['auto', 'low', 'high'].includes(q)) { line(`quality: ${getQuality()}   (usage: quality auto|low|high)`); return; }
      if (q === getQuality()) { line(`quality is already ${q}`); return; }
      line(`quality: ${q}. Reloading…`); setTimeout(() => setQuality(q), 400);
    },
    ls() { line(sections().join('  ')); },
    goto(arg) {
      const id = (arg || '').toLowerCase();
      const el = id && sections().includes(id) ? document.getElementById(id) : null;
      if (!el) { line(id ? `no such room: ${id}` : 'usage: goto <room>   (type ls to list rooms)', 'term__e'); return; }
      line(`flying to ${id}…`);
      setTimeout(() => { close(); el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); }, 250);
    },
    theme(arg) {
      const want = (arg || '').toLowerCase();
      if (want !== 'dark' && want !== 'light') { line('usage: theme dark|light', 'term__e'); return; }
      const cur = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      if (cur !== want) document.getElementById('theme-toggle')?.click();
      line(`theme: ${want}`);
    },
    sound(arg) {
      const want = (arg || '').toLowerCase();
      const b = document.getElementById('sound-toggle');
      if (!b) { line('sound is not available on this device', 'term__e'); return; }
      if (want !== 'on' && want !== 'off') { line('usage: sound on|off', 'term__e'); return; }
      const cur = b.getAttribute('aria-pressed') === 'true' ? 'on' : 'off';
      if (cur !== want) b.click();
      line(`sound: ${want}`);
    },
    clear() { out.textContent = ''; },
    exit() { close(); },
    sudo() { line('Nice try. Permission denied.', 'term__e'); },
  };
  COMMANDS.cls = COMMANDS.clear; COMMANDS.quit = COMMANDS.exit; COMMANDS.dir = COMMANDS.ls;

  function run(raw) {
    const text = raw.trim();
    const echo = line('', 'term__cmd'); echo.textContent = '> ' + text;
    if (!text) return;
    history.push(text); hi = history.length;
    const [cmd, ...rest] = text.split(/\s+/);
    const fn = COMMANDS[cmd.toLowerCase()];
    if (fn) fn(rest.join(' ')); else line(`command not found: ${cmd}. Type help.`, 'term__e');
  }

  function build() {
    root = document.createElement('div');
    root.className = 'term'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Station terminal');
    root.innerHTML = `
      <div class="term__bg" data-close></div>
      <div class="term__win">
        <div class="term__bar"><span>STATION TERMINAL</span><button type="button" class="term__x" data-close aria-label="Close terminal">ESC</button></div>
        <div class="term__out" aria-live="polite"></div>
        <label class="term__in"><span aria-hidden="true">&gt;</span><input type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Terminal command" /></label>
      </div>`;
    document.body.appendChild(root);
    out = root.querySelector('.term__out'); input = root.querySelector('input');
    root.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); else if (!window.getSelection().toString()) input.focus(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) input.value = history[--hi]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(history.length, hi + 1); input.value = history[hi] || ''; }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value.trim().toLowerCase(), m = Object.keys(COMMANDS).filter((c) => v && c.startsWith(v));
        if (m.length === 1) input.value = m[0] + ' ';
      }
    });
    line('Station terminal online. Everything here comes from the portfolio itself.', 'term__h');
    line('Type help for commands.');
  }

  function openT() {
    if (open) return;
    if (!root) build();
    prevFocus = document.activeElement; open = true; root.hidden = false;
    document.documentElement.classList.add('term-open');
    requestAnimationFrame(() => { root.classList.add('is-in'); input.focus(); });
  }
  function close() {
    if (!open) return;
    open = false; root.classList.remove('is-in'); document.documentElement.classList.remove('term-open');
    setTimeout(() => { if (!open) root.hidden = true; }, 220);
    prevFocus?.focus?.({ preventScroll: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { close(); return; }
    const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === '`' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open ? close() : openT(); }
  });
  // Three quick taps on the logo (works on touch screens too).
  const brand = document.querySelector('.nav__brand');
  if (brand) {
    let taps = 0, timer = 0;
    brand.addEventListener('click', (e) => {
      taps++; clearTimeout(timer); timer = setTimeout(() => { taps = 0; }, 650);
      if (taps >= 3) { taps = 0; e.preventDefault(); openT(); }
    });
  }
}
