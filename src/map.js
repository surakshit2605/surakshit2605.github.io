// "From School to University": a cinematic 3D satellite map of Mauritius (CesiumJS, loaded on demand from a CDN).
import { gsap } from 'gsap';
import { journeyMap as J } from './data/content.js';

const CESIUM_VERSION = '1.120.0';
const CDN = (typeof window !== 'undefined' && window.__CESIUM_CDN__) || `https://cdn.jsdelivr.net/npm/cesium@${CESIUM_VERSION}/Build/Cesium/`;
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ORDER = ['home', 'school', 'uni'];

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const asset = (p) => (/^(https?:)?\/\//.test(p) ? p : import.meta.env.BASE_URL + p.replace(/^\//, ''));
const mIdx = (y, m) => y * 12 + (m - 1);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const haversine = (a, b) => {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const km = (n) => (n < 10 ? n.toFixed(1) : Math.round(n)) + ' km';

const loadCesium = (() => {
  let p;
  return () => (p ||= new Promise((res, rej) => {
    if (window.Cesium) return res(window.Cesium);
    window.CESIUM_BASE_URL = CDN;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = CDN + 'Widgets/widgets.css';
    document.head.appendChild(l);
    const s = document.createElement('script');
    s.src = CDN + 'Cesium.js';
    s.onload = () => (window.Cesium ? res(window.Cesium) : rej(new Error('Cesium missing')));
    s.onerror = () => rej(new Error('Cesium failed to load'));
    document.head.appendChild(s);
  }));
})();

/* ------------------------------------------------------------------------------------------ markup */
export function mapMarkup() {
  const P = J.places;
  const pins = ORDER.map((id) => `<button class="jm-pin" type="button" data-id="${id}" aria-label="${esc(P[id].short)}: ${esc(P[id].name)}"><i class="jm-dot"></i><i class="jm-pulse"></i><span class="jm-lab"><b>${esc(P[id].short)}</b>${esc(P[id].name.replace(/ \(.*\)/, ''))}</span></button>`).join('');
  const chips = [['overview', 'Overview'], ...ORDER.map((id) => [id, P[id].short])].map(([id, t]) => `<button class="jm-chip" type="button" data-id="${id}">${esc(t)}</button>`).join('');
  return `
  <div class="jm" id="jm">
   <div class="jm__track" id="jm-track">
    <div class="jm__sticky" id="jm-sticky">
    <div class="jm__stage" id="jm-stage">
      <div class="jm__globe" id="jm-globe"></div>
      <div class="jm__tint"></div>
      <div class="jm__shield" id="jm-shield"></div>
      <div class="jm__ov" id="jm-ov">${pins}</div>
      <div class="jm__load" id="jm-load"><span class="jm__spin"></span><span id="jm-load-t">Loading satellite view…</span></div>
      <div class="jm__hud jm__hud--tl"><span>LAT <b id="jm-lat">—</b></span><span>LON <b id="jm-lon">—</b></span><span>ALT <b id="jm-alt">—</b></span></div>
      <div class="jm__hud jm__hud--tr"><span id="jm-mode">OVERVIEW</span></div>
      <nav class="jm-idx" id="jm-idx" aria-label="Journey stops">${[['overview', 'Mauritius'], ['home', P.home.short], ['school', P.school.short], ['uni', P.uni.short], ['route', 'The route']].map(([id, t], i) => `<button type="button" data-id="${id}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(t)}</button>`).join('')}</nav>
      <i class="jm__prog"><b id="jm-prog"></b></i>
      <p class="jm__scroll" id="jm-scrollhint"><span></span><em id="jm-scrolltxt">Scroll to travel</em></p>
      <button class="jm__explore" id="jm-explore" type="button">Explore the map</button>
      <p class="jm__hint" id="jm-hint">Drag to rotate · scroll or pinch to zoom · right-drag or two fingers to tilt</p>
      <div class="jm__nav" id="jm-nav">${chips}<button class="jm-chip jm-chip--play" id="jm-play" type="button">▶ Play the journey</button></div>
      <i class="jm-br tl"></i><i class="jm-br tr"></i><i class="jm-br bl"></i><i class="jm-br brr"></i>
    </div>
    <aside class="jm__panel" id="jm-panel" aria-live="polite"></aside>
    </div>
   </div>
    <div class="jm__tl" id="jm-tl"></div>
  </div>`;
}

/* ------------------------------------------------------------------------------------------ panels / timeline */
function progressPct(p) {
  const now = new Date();
  const n = mIdx(now.getFullYear(), now.getMonth() + 1) + now.getDate() / 31;
  const a = mIdx(p.from.y, p.from.m), b = mIdx(p.to.y, p.to.m);
  return Math.max(0, Math.min(100, ((n - a) / (b - a)) * 100));
}

const CH = { overview: 1, home: 2, school: 3, uni: 4, route: 5 };
const chap = (id) => `${String(CH[id]).padStart(2, '0')} / 05 · `;

function panelHtml(id) {
  const P = J.places;
  if (id === 'overview') {
    return `<p class="jm-p__tag">${chap(id)}Overview</p><h3>Port Louis, Mauritius</h3>
      <p>Three real places in one story. Start at home, follow the line to school, then on to university.</p>
      <ul class="jm-p__facts"><li><span>1</span>Home, my starting point</li><li><span>2</span>School, where it began</li><li><span>3</span>University, where I am building my future</li></ul>
      <p class="jm-p__cta">Tap a marker, a chip below the map, or press play.</p>`;
  }
  if (id === 'route') {
    const d1 = haversine(P.home, P.school), d2 = haversine(P.school, P.uni);
    return `<p class="jm-p__tag">${chap(id)}The whole route</p><h3>${km(d1 + d2)} in a straight line</h3>
      <p>From home, to the school where it began, to the university where I am building my future. All within the Port Louis area.</p>
      <ul class="jm-p__facts"><li><span>H→S</span>${km(d1)}</li><li><span>S→U</span>${km(d2)}</li></ul><p class="jm-p__note">Straight-line distances, not road distances.</p>`;
  }
  const p = P[id];
  const photo = p.photo ? `<figure class="jm-p__photo"><img src="${asset(p.photo)}" alt="${esc(p.photoAlt || '')}" loading="lazy" decoding="async" /></figure>` : '';
  const prog = id === 'uni' ? (() => { const v = progressPct(p); return `<div class="jm-p__prog"><div class="jm-p__bar"><i data-pct="${v.toFixed(1)}"></i></div><p><b>${Math.round(v)}%</b> of the degree timeline · now in progress</p></div>`; })() : '';
  return `${photo}<p class="jm-p__tag">${chap(id)}${esc(p.tag)}</p><h3>${esc(p.name)}</h3><p class="jm-p__place">${esc(p.place)}</p>
    ${p.years ? `<p class="jm-p__years">${esc(p.years)}</p>` : ''}<p>${esc(p.text)}</p>${prog}
    <dl class="jm-p__dl">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

function timelineHtml() {
  const s = J.places.school, u = J.places.uni;
  const a = mIdx(J.start.year, J.start.month), b = mIdx(2028, 8), span = b - a;
  const pos = (y, m) => (((mIdx(y, m) - a) / span) * 100).toFixed(2);
  const now = new Date();
  const todayPos = Math.min(100, Math.max(0, ((mIdx(now.getFullYear(), now.getMonth() + 1) - a) / span) * 100));
  const uFrom = +pos(u.from.y, u.from.m), uTo = +pos(u.to.y, u.to.m);
  const uDone = Math.max(0, Math.min(uTo, todayPos) - uFrom);
  const years = [2017, 2020, 2024, 2028].map((y) => `<i class="jm-tl__yr" style="left:${pos(y, 1)}%"><span>${y}</span></i>`).join('');
  return `<h4 class="jm-tl__title">Academic timeline</h4>
    <div class="jm-tl__track">
      ${years}
      <button class="jm-tl__seg jm-tl__seg--s" type="button" data-id="school" style="left:${pos(s.from.y, s.from.m)}%;width:${pos(s.to.y, s.to.m + 1) - pos(s.from.y, s.from.m)}%"><b>School</b><span>2017 – 2024</span></button>
      <button class="jm-tl__seg jm-tl__seg--u" type="button" data-id="uni" style="left:${uFrom}%;width:${uTo - uFrom}%"><em style="width:${(uDone / (uTo - uFrom)) * 100}%"></em><b>UTM</b><span>Apr 2025 – Apr 2028</span></button>
      <i class="jm-tl__today" style="left:${todayPos}%"><span>Today</span></i>
    </div>
    <p class="jm-tl__note">${esc(MONTHS[now.getMonth()])} ${now.getFullYear()}: year ${Math.min(3, Math.max(1, Math.floor((mIdx(now.getFullYear(), now.getMonth() + 1) - mIdx(u.from.y, u.from.m)) / 12) + 1))} of 3 at UTM · expected completion April 2028</p>`;
}

/* ------------------------------------------------------------------------------------------ main */
export function initJourneyMap() {
  const root = document.getElementById('jm');
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const stage = $('jm-stage'), panel = $('jm-panel'), pinsEl = $('jm-ov');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = innerWidth < 800 || matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const pins = Object.fromEntries([...pinsEl.querySelectorAll('.jm-pin')].map((el) => [el.dataset.id, el]));
  const chips = [...root.querySelectorAll('.jm-chip[data-id], .jm-idx button[data-id]')];
  $('jm-tl').innerHTML = timelineHtml();

  let cur = null, viewer = null, C = null, ready = false, explore = false, playing = null;
  let driving = false, disp = 0, lastT = performance.now(), shots = [];
  const track = $('jm-track'), sticky = $('jm-sticky'), prog = $('jm-prog');
  // Mouse (desktop): the wheel works the journey while the cursor is inside the map. Touch/small screens: page scroll does.
  const wheelMode = matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth > 1000;
  root.classList.toggle('jm--wheel', wheelMode);
  const STOPS = [['overview', 0], ['home', 0.2], ['school', 0.45], ['uni', 0.7], ['route', wheelMode ? 1 : 0.93]];
  const SPOS = Object.fromEntries(STOPS);
  const W = { wp: 0 }; // wheel progress
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const place3 = {};

  /* ---- UI (works even if 3D is unavailable) ---- */
  let panelToken = 0;
  function showPanel(id) {
    const token = ++panelToken;
    const enter = () => {
      panel.innerHTML = panelHtml(id);
      const kids = [...panel.children];
      if (!reduce) gsap.fromTo(kids, { y: -34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out' });
      const bar = panel.querySelector('.jm-p__bar i');
      if (bar) gsap.fromTo(bar, { width: '0%' }, { width: bar.dataset.pct + '%', duration: reduce ? 0 : 1.4, delay: 0.4, ease: 'power3.out' });
    };
    const old = [...panel.children];
    gsap.killTweensOf(old);
    if (reduce || !old.length) return enter();
    // the previous place slides down and fades, then the next one drops in from above
    gsap.to(old, { y: 38, opacity: 0, duration: 0.34, stagger: 0.025, ease: 'power2.in', onComplete: () => { if (token === panelToken) enter(); } });
  }
  function mark(id) {
    chips.forEach((c) => c.classList.toggle('is-on', c.dataset.id === id));
    Object.entries(pins).forEach(([k, el]) => el.classList.toggle('is-on', k === id || id === 'route'));
    root.querySelectorAll('.jm-tl__seg').forEach((b) => b.classList.toggle('is-on', b.dataset.id === id));
    $('jm-mode').textContent = id === 'overview' ? 'OVERVIEW' : id === 'route' ? 'ROUTE' : J.places[id].short.toUpperCase();
  }
  let showRoutes = () => {};
  function setUI(id) {
    if (id === cur) return;
    cur = id;
    mark(id); showPanel(id); showRoutes(id);
  }

  // Scrolling the page drives the camera. Clicking a marker/chip/timeline bar scrolls to that stop.
  const trackTop = () => track.getBoundingClientRect().top + scrollY;
  const range = () => Math.max(1, track.offsetHeight - sticky.offsetHeight);
  const pageStopY = (id) => trackTop() - (parseFloat(getComputedStyle(sticky).top) || 0) + SPOS[id] * range();
  const progress = () => wheelMode ? W.wp : clamp01((scrollY + (parseFloat(getComputedStyle(sticky).top) || 0) - trackTop()) / range());
  let snapTween = null, snapTimer = null;
  function go(id) {
    if (playing) stopPlay();
    if (!ready || explore) return setUI(id);
    if (wheelMode) {
      const r = stage.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      if (snapTween) snapTween.kill();
      snapTween = gsap.to(W, { wp: SPOS[id], duration: reduce ? 0 : 1.8, ease: 'power2.inOut' });
      return;
    }
    window.scrollTo({ top: pageStopY(id), behavior: reduce ? 'auto' : 'smooth' });
  }
  chips.forEach((c) => c.addEventListener('click', () => go(c.dataset.id)));
  Object.entries(pins).forEach(([id, el]) => el.addEventListener('click', () => go(id)));
  root.querySelectorAll('.jm-tl__seg').forEach((b) => b.addEventListener('click', () => { go(b.dataset.id); if (ready) stage.scrollIntoView({ block: 'center', behavior: 'smooth' }); }));

  function stopPlay() {
    if (playing) { playing.kill(); playing = null; }
    $('jm-play').classList.remove('is-on'); $('jm-play').textContent = '▶ Play the journey';
  }
  $('jm-play').addEventListener('click', () => {
    if (playing) return stopPlay();
    if (!ready) return;
    if (explore) setExplore(false);
    $('jm-play').classList.add('is-on'); $('jm-play').textContent = '■ Stop';
    if (wheelMode) {
      if (snapTween) snapTween.kill();
      const r = stage.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ block: 'center', behavior: 'smooth' });
      W.wp = 0;
      playing = gsap.to(W, { wp: 1, duration: 30, ease: 'none', onComplete: stopPlay });
      return;
    }
    const o = { y: scrollY }, end = pageStopY('route');
    const from = pageStopY('overview');
    o.y = Math.abs(scrollY - from) > 200 && scrollY < end ? scrollY : from;
    window.scrollTo(0, o.y);
    playing = gsap.to(o, { y: end, duration: 30, ease: 'none', onUpdate: () => window.scrollTo(0, o.y), onComplete: stopPlay });
  });
  ['wheel', 'touchstart'].forEach((ev) => addEventListener(ev, () => { if (playing) stopPlay(); }, { passive: true }));

  /* ---- 3D camera path ---- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };
  function buildShots() {
    const P = J.places, rad = (d) => (d * Math.PI) / 180;
    const set = { home: [2600, 25, -38], school: [850, -40, -34], uni: [1000, 55, -34] };
    const arr = [{ lon: 57.55, lat: -20.25, hgt: 0, hd: 0, pit: rad(-50), rng: 261000 }];
    ORDER.forEach((k) => { const s = set[k]; arr.push({ lon: P[k].lon, lat: P[k].lat, hgt: 0, hd: rad(s[1]), pit: rad(s[2]), rng: s[0] }); });
    const lons = ORDER.map((k) => P[k].lon), lats = ORDER.map((k) => P[k].lat);
    let dmax = 0;
    ORDER.forEach((a) => ORDER.forEach((b) => { dmax = Math.max(dmax, haversine(P[a], P[b])); }));
    arr.push({ lon: (Math.min(...lons) + Math.max(...lons)) / 2, lat: (Math.min(...lats) + Math.max(...lats)) / 2, hgt: 0, hd: rad(15), pit: rad(-48), rng: Math.max(2800, dmax * 1000 * 1.4) });
    return arr;
  }
  function stateAt(p) {
    let i = 0;
    while (i < STOPS.length - 1 && p >= STOPS[i + 1][1]) i++;
    if (i >= STOPS.length - 1) return shots[shots.length - 1];
    const a = STOPS[i][1], b = STOPS[i + 1][1], hold = 0.035;
    const t = clamp01((p - a - hold) / (b - a - 2 * hold)), e = t * t * t * (t * (t * 6 - 15) + 10);
    const A = shots[i], B = shots[i + 1];
    const lift = 1 + (i === 0 ? 0 : 1.7) * Math.sin(Math.PI * e); // pull up between places, like a camera crane
    return { lon: lerp(A.lon, B.lon, e), lat: lerp(A.lat, B.lat, e), hgt: lerp(A.hgt, B.hgt, e), hd: angLerp(A.hd, B.hd, e), pit: lerp(A.pit, B.pit, e) - 0.28 * Math.sin(Math.PI * e), rng: Math.exp(lerp(Math.log(A.rng), Math.log(B.rng), e)) * lift };
  }
  const nearestStop = (p) => STOPS.reduce((best, s) => (Math.abs(s[1] - p) < Math.abs(best[1] - p) ? s : best))[0];
  function applyState(st, t) {
    const drift = reduce ? 0 : 0.06 * Math.sin(t / 3500);
    const c = C.Cartesian3.fromDegrees(st.lon, st.lat, st.hgt);
    viewer.camera.lookAtTransform(C.Transforms.eastNorthUpToFixedFrame(c), new C.HeadingPitchRange(st.hd + drift, st.pit, st.rng));
  }

  if (wheelMode) {
    stage.addEventListener('wheel', (e) => {
      if (!ready || explore) return;
      let d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(d) < 1) return;
      // at the very start or end of the journey, let the page scroll on as normal
      if ((d < 0 && W.wp <= 0.0005) || (d > 0 && W.wp >= 0.9995)) return;
      e.preventDefault();
      if (playing) stopPlay();
      if (snapTween) snapTween.kill();
      clearTimeout(snapTimer);
      W.wp = clamp01(W.wp + Math.max(-140, Math.min(140, d)) / 2400);
      $('jm-scrollhint').classList.add('is-gone');
      // when the wheel pauses, settle on the nearest place
      snapTimer = setTimeout(() => {
        const near = STOPS.reduce((b, st) => (Math.abs(st[1] - W.wp) < Math.abs(b[1] - W.wp) ? st : b));
        snapTween = gsap.to(W, { wp: near[1], duration: reduce ? 0 : 1.1, ease: 'power2.out' });
      }, 650);
    }, { passive: false });
  }

  function setExplore(on) {
    explore = on;
    stage.classList.toggle('is-explore', on);
    $('jm-explore').textContent = on ? 'Back to the story' : 'Explore the map';
    if (!ready) return;
    if (playing) stopPlay();
    const sc = viewer.scene.screenSpaceCameraController;
    sc.enableInputs = on;
    if (on) { driving = false; viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); }
    else {
      const st = stateAt(disp), c = C.Cartesian3.fromDegrees(st.lon, st.lat, st.hgt);
      viewer.camera.flyToBoundingSphere(new C.BoundingSphere(c, 1), { offset: new C.HeadingPitchRange(st.hd, st.pit, st.rng), duration: reduce ? 0 : 1.6, complete: () => { driving = true; } });
    }
  }
  $('jm-explore').addEventListener('click', () => setExplore(!explore));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && explore) setExplore(false); });

  async function boot() {
    try {
      C = await loadCesium();
      shots = buildShots();
      const cred = document.createElement('div'); cred.className = 'jm__credit'; stage.appendChild(cred);
      viewer = new C.Viewer($('jm-globe'), {
        baseLayer: false, baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false, navigationHelpButton: false,
        animation: false, timeline: false, fullscreenButton: false, infoBox: false, selectionIndicator: false, creditContainer: cred,
        msaaSamples: lite ? 1 : 4, useBrowserRecommendedResolution: lite, contextOptions: { webgl: { alpha: false, antialias: true } },
      });
      if (/jmdebug/.test(location.search)) window.__jm = viewer;
      const sc = viewer.scene;
      sc.backgroundColor = C.Color.BLACK;
      sc.globe.enableLighting = false;
      sc.globe.showGroundAtmosphere = true;
      sc.globe.depthTestAgainstTerrain = true;
      sc.globe.baseColor = C.Color.fromCssColorString('#06101f');
      sc.skyAtmosphere.show = true;
      sc.fog.enabled = true;
      sc.screenSpaceCameraController.enableInputs = false;
      sc.screenSpaceCameraController.minimumZoomDistance = 120;
      sc.screenSpaceCameraController.maximumZoomDistance = 3.5e7;

      const grade = (l) => { l.brightness = 0.74; l.contrast = 1.12; l.saturation = 0.72; l.gamma = 1.05; return l; }; // calmer, darker imagery so the text and route read clearly
      const esri = () => grade(viewer.imageryLayers.addImageryProvider(new C.UrlTemplateImageryProvider({ url: ESRI, maximumLevel: 18, credit: new C.Credit('Imagery © Esri, Maxar, Earthstar Geographics') })));
      let terrain = null;
      if (J.cesiumToken) {
        C.Ion.defaultAccessToken = J.cesiumToken;
        let fell = false;
        const layer = C.ImageryLayer.fromProviderAsync(C.createWorldImageryAsync({ style: C.IonWorldImageryStyle.AERIAL }));
        layer.errorEvent.addEventListener(() => { if (!fell) { fell = true; viewer.imageryLayers.remove(layer); esri(); } });
        grade(layer); viewer.imageryLayers.add(layer);
        try {
          terrain = await C.createWorldTerrainAsync({ requestVertexNormals: true });
          viewer.terrainProvider = terrain;
          if (!lite) { const b = await C.createOsmBuildingsAsync(); sc.primitives.add(b); }
        } catch (e) { console.warn('3D terrain/buildings unavailable', e); }
      } else esri();

      // ground heights for the three markers (and for the camera to look at)
      const carts = ORDER.map((k) => C.Cartographic.fromDegrees(J.places[k].lon, J.places[k].lat));
      if (terrain) { try { await C.sampleTerrainMostDetailed(terrain, carts); } catch (e) { /* flat */ } }
      ORDER.forEach((k, i) => { shots[i + 1].hgt = carts[i].height || 0; });
      shots[4].hgt = (shots[1].hgt + shots[2].hgt + shots[3].hgt) / 3;
      const css = (v, f) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || f;
      const colA = C.Color.fromCssColorString(css('--lg-b', '#38a8ff')), colB = C.Color.fromCssColorString(css('--lg-c', '#67e8f9'));
      const BEACON = 240;
      ORDER.forEach((k, i) => {
        const p = J.places[k], h = carts[i].height || 0;
        const ground = C.Cartesian3.fromDegrees(p.lon, p.lat, h), top = C.Cartesian3.fromDegrees(p.lon, p.lat, h + BEACON);
        place3[k] = { ground, top, h, lat: p.lat, lon: p.lon };
        viewer.entities.add({ polyline: { positions: [ground, top], width: 1.5, material: colB.withAlpha(0.85) } });
        viewer.entities.add({ position: top, ellipsoid: { radii: new C.Cartesian3(13, 13, 13), material: colB.withAlpha(0.95), outline: true, outlineColor: C.Color.WHITE.withAlpha(0.7), slicePartitions: 12, stackPartitions: 12 } });
        viewer.entities.add({ position: C.Cartesian3.fromDegrees(p.lon, p.lat, h + 4), ellipse: { semiMajorAxis: 90, semiMinorAxis: 90, height: h + 4, fill: false, outline: true, outlineColor: colA.withAlpha(0.9), outlineWidth: 2 } });
      });

      // one thin route line between the places
      const arc = (A, B) => {
        const pts = [], n = 64, d = haversine(J.places[A], J.places[B]) * 1000, up = Math.min(900, d * 0.14);
        for (let t = 0; t <= n; t++) {
          const f = t / n, a = place3[A], b = place3[B];
          pts.push(C.Cartesian3.fromDegrees(a.lon + (b.lon - a.lon) * f, a.lat + (b.lat - a.lat) * f, a.h + (b.h - a.h) * f + BEACON * 0.5 + Math.sin(Math.PI * f) * up));
        }
        return pts;
      };
      const routes = [['home', 'school'], ['school', 'uni']].map(([A, B]) => {
        const pts = arc(A, B), st = { a: 0 };
        viewer.entities.add({ polyline: { positions: pts, width: 2.2, material: new C.ColorMaterialProperty(new C.CallbackProperty(() => colB.withAlpha(0.9 * st.a), false)) } });
        return st;
      });
      showRoutes = (id) => routes.forEach((r, i) => gsap.to(r, { a: id === 'route' || id === 'uni' || (id === 'school' && i === 0) ? 1 : 0, duration: reduce ? 0 : 1.4, ease: 'power2.out' }));

      // DOM pins follow the 3D markers
      const win = new C.Cartesian2();
      sc.postRender.addEventListener(() => {
        const occ = new C.EllipsoidalOccluder(C.Ellipsoid.WGS84, viewer.camera.positionWC);
        ORDER.forEach((k) => {
          const el = pins[k], pt = sc.cartesianToCanvasCoordinates(place3[k].top, win);
          const vis = pt && occ.isPointVisible(place3[k].top);
          el.style.opacity = vis ? '' : '0'; el.style.pointerEvents = vis ? '' : 'none';
          if (pt) { el.style.transform = `translate(${pt.x.toFixed(1)}px,${pt.y.toFixed(1)}px)`; el.classList.toggle('flip', pt.x > stage.clientWidth * 0.6); }
        });
        const c = viewer.camera.positionCartographic;
        $('jm-lat').textContent = C.Math.toDegrees(c.latitude).toFixed(4);
        $('jm-lon').textContent = C.Math.toDegrees(c.longitude).toFixed(4);
        $('jm-alt').textContent = c.height > 2e5 ? Math.round(c.height / 1000).toLocaleString() + ' km' : Math.round(c.height) + ' m';
      });

      // every frame: read the scroll position and glide the camera along the path
      viewer.clock.onTick.addEventListener(() => {
        const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000);
        lastT = now;
        const target = progress();
        prog.style.width = (target * 100).toFixed(1) + '%';
        if (!wheelMode) $('jm-scrollhint').classList.toggle('is-gone', target > 0.02);
        if (explore || !driving) return;
        disp = reduce ? target : disp + (target - disp) * (1 - Math.exp(-dt * 4.2));
        if (Math.abs(target - disp) < 1e-5) disp = target;
        applyState(stateAt(disp), now);
        setUI(nearestStop(disp));
      });
      // save battery when the map is off screen
      new IntersectionObserver((es) => { viewer.useDefaultRenderLoop = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

      ready = true;
      $('jm-load').classList.add('is-gone');
      // cinematic intro: from space, down to Mauritius, then scrolling takes over
      disp = progress();
      const st0 = stateAt(disp), c0 = C.Cartesian3.fromDegrees(st0.lon, st0.lat, st0.hgt);
      viewer.camera.setView({ destination: C.Cartesian3.fromDegrees(57.5, -20.2, 2.4e7), orientation: { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 } });
      cur = null; setUI(nearestStop(disp));
      viewer.camera.flyToBoundingSphere(new C.BoundingSphere(c0, 1), { offset: new C.HeadingPitchRange(st0.hd, st0.pit, st0.rng), duration: reduce ? 0 : 5, easingFunction: C.EasingFunction.CUBIC_IN_OUT, complete: () => { driving = true; }, cancel: () => { driving = true; } });
    } catch (e) {
      console.warn('3D map unavailable:', e);
      $('jm-load-t').textContent = '3D map unavailable here. The story below still works.';
      $('jm-load').classList.add('is-fail');
      root.classList.add('jm--flat');
      Object.values(pins).forEach((el) => (el.style.display = 'none'));
      $('jm-explore').style.display = 'none'; $('jm-scrollhint').style.display = 'none';
    }
  }

  if (wheelMode) $('jm-scrolltxt').textContent = 'Put your cursor here and scroll';
  mark('overview'); showPanel('overview'); cur = 'overview';
  let started = false;
  new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting && !started) { started = true; io.disconnect(); boot(); }
  }, { rootMargin: '300px' }).observe(stage);
}
