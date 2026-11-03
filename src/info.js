import { gsap } from 'gsap';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Profile section behaviour:
 *  - a live 24-hour clock for the timezone in data-tz (Indian/Mauritius), ticking on the second
 *  - a soft blue highlight that follows the pointer over the cards
 */
export function initInfo() {
  const card = document.querySelector('.pf__clock');
  if (card) startClock(card);

  document.querySelectorAll('.icard').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MU_OFFSET_MIN = 240; // Mauritius is UTC+4 all year (no daylight saving)

function startClock(card) {
  const tz = card.dataset.tz || 'Indian/Mauritius';
  const $ = (id) => document.getElementById(id);
  const h = $('ck-h');
  const m = $('ck-m');
  const s = $('ck-s');
  const dateEl = $('ck-date');
  const relEl = $('ck-rel');
  const bar = $('ck-bar');
  const sr = $('ck-sr');
  const seps = card.querySelectorAll('.clock__sep');

  // Prefer the browser's own timezone database. Fall back to a fixed UTC+4 if it is missing.
  let fmt = null;
  try {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (e) {
    fmt = null;
  }

  function parts(now) {
    if (fmt) {
      const p = {};
      for (const x of fmt.formatToParts(now)) p[x.type] = x.value;
      const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
      return { H: p.hour, M: p.minute, S: p.second, d: +p.day, mo: +p.month - 1, y: +p.year, wd };
    }
    const t = new Date(now.getTime() + MU_OFFSET_MIN * 60000);
    const z = (n) => String(n).padStart(2, '0');
    return { H: z(t.getUTCHours()), M: z(t.getUTCMinutes()), S: z(t.getUTCSeconds()), d: t.getUTCDate(), mo: t.getUTCMonth(), y: t.getUTCFullYear(), wd: t.getUTCDay() };
  }

  // How far the visitor's own clock is from Mauritius (uses their device timezone).
  function relative() {
    const diff = MU_OFFSET_MIN - -new Date().getTimezoneOffset();
    if (diff === 0) return 'Same timezone as you';
    const hrs = Math.abs(diff) / 60;
    const txt = Number.isInteger(hrs) ? String(hrs) : hrs.toFixed(1).replace(/\.0$/, '');
    return `${txt} h ${diff > 0 ? 'ahead of' : 'behind'} your local time`;
  }
  relEl.textContent = relative();

  let last = '';
  let lastMin = '';
  function tick() {
    const now = new Date();
    const p = parts(now);
    if (p.S !== last) {
      last = p.S;
      h.textContent = p.H;
      m.textContent = p.M;
      s.textContent = p.S;
      if (p.M !== lastMin) {
        lastMin = p.M;
        dateEl.textContent = `${DAYS[p.wd]}, ${p.d} ${MONTHS[p.mo]} ${p.y}`;
        // Screen readers get the time once a minute, not every second.
        sr.textContent = `Local time in Mauritius: ${p.H}:${p.M}, ${dateEl.textContent}`;
        relEl.textContent = relative();
      }
      const sec = +p.S;
      if (reduced()) {
        gsap.set(bar, { scaleX: (sec + 1) / 60 });
      } else {
        // A thin line fills across each minute; the colons breathe once per second.
        gsap.to(bar, { scaleX: (sec + 1) / 60, duration: sec === 59 ? 0.25 : 1, ease: 'none', overwrite: 'auto' });
        gsap.fromTo(seps, { opacity: 1 }, { opacity: 0.25, duration: 0.5, ease: 'power1.inOut', yoyo: true, repeat: 1, overwrite: 'auto' });
      }
    }
    // Re-aim at the next second boundary so the display never drifts from the real clock.
    timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  }
  let timer = null;
  tick();

  // Browsers slow timers in background tabs: resync as soon as the tab is visible again.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    clearTimeout(timer);
    last = '';
    tick();
  });
}
