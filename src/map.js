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
    <div class="jm__stage" id="jm-stage">
      <div class="jm__globe" id="jm-globe"></div>
      <div class="jm__tint"></div>
      <div class="jm__shield" id="jm-shield"></div>
      <div class="jm__ov" id="jm-ov">${pins}</div>
      <div class="jm__load" id="jm-load"><span class="jm__spin"></span><span id="jm-load-t">Loading satellite view…</span></div>
      <div class="jm__hud jm__hud--tl"><span>LAT <b id="jm-lat">—</b></span><span>LON <b id="jm-lon">—</b></span><span>ALT <b id="jm-alt">—</b></span></div>
      <div class="jm__hud jm__hud--tr"><span id="jm-mode">OVERVIEW</span></div>
      <button class="jm__explore" id="jm-explore" type="button">Explore the map</button>
      <p class="jm__hint" id="jm-hint">Drag to rotate · scroll or pinch to zoom · right-drag or two fingers to tilt</p>
      <div class="jm__nav" id="jm-nav">${chips}<button class="jm-chip jm-chip--play" id="jm-play" type="button">▶ Play the journey</button></div>
      <i class="jm-br tl"></i><i class="jm-br tr"></i><i class="jm-br bl"></i><i class="jm-br brr"></i>
    </div>
    <aside class="jm__panel" id="jm-panel" aria-live="polite"></aside>
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

function panelHtml(id) {
  const P = J.places;
  if (id === 'overview') {
    return `<p class="jm-p__tag">Overview</p><h3>Port Louis, Mauritius</h3>
      <p>Three real places in one story. Start at home, follow the line to school, then on to university.</p>
      <ul class="jm-p__facts"><li><span>1</span>Home, my starting point</li><li><span>2</span>School, where it began</li><li><span>3</span>University, where I am building my future</li></ul>
      <p class="jm-p__cta">Tap a marker, a chip below the map, or press play.</p>`;
  }
  if (id === 'route') {
    const d1 = haversine(P.home, P.school), d2 = haversine(P.school, P.uni);
    return `<p class="jm-p__tag">The whole route</p><h3>${km(d1 + d2)} in a straight line</h3>
      <p>From home, to the school where it began, to the university where I am building my future. All within the Port Louis area.</p>
      <ul class="jm-p__facts"><li><span>H→S</span>${km(d1)}</li><li><span>S→U</span>${km(d2)}</li></ul><p class="jm-p__note">Straight-line distances, not road distances.</p>`;
  }
  const p = P[id];
  const photo = p.photo ? `<figure class="jm-p__photo"><img src="${asset(p.photo)}" alt="${esc(p.photoAlt || '')}" loading="lazy" decoding="async" /></figure>` : '';
  const prog = id === 'uni' ? (() => { const v = progressPct(p); return `<div class="jm-p__prog"><div class="jm-p__bar"><i data-pct="${v.toFixed(1)}"></i></div><p><b>${Math.round(v)}%</b> of the degree timeline · now in progress</p></div>`; })() : '';
  return `${photo}<p class="jm-p__tag">${esc(p.tag)}</p><h3>${esc(p.name)}</h3><p class="jm-p__place">${esc(p.place)}</p>
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
  const lite = innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4;
  const pins = Object.fromEntries([...pinsEl.querySelectorAll('.jm-pin')].map((el) => [el.dataset.id, el]));
  const chips = [...root.querySelectorAll('.jm-chip[data-id]')];
  $('jm-tl').innerHTML = timelineHtml();

  let cur = null, viewer = null, C = null, ready = false, explore = false, playing = null;
  let orbit = null, flying = false;

  /* ---- UI (works even if 3D is unavailable) ---- */
  function showPanel(id) {
    panel.innerHTML = panelHtml(id);
    const kids = [...panel.children];
    if (!reduce) gsap.fromTo(kids, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
    const bar = panel.querySelector('.jm-p__bar i');
    if (bar) gsap.fromTo(bar, { width: '0%' }, { width: bar.dataset.pct + '%', duration: reduce ? 0 : 1.4, delay: 0.3, ease: 'power3.out' });
  }
  function mark(id) {
    chips.forEach((c) => c.classList.toggle('is-on', c.dataset.id === id));
    Object.entries(pins).forEach(([k, el]) => el.classList.toggle('is-on', k === id || id === 'route'));
    root.querySelectorAll('.jm-tl__seg').forEach((b) => b.classList.toggle('is-on', b.dataset.id === id));
    $('jm-mode').textContent = (id === 'overview' ? 'OVERVIEW' : id === 'route' ? 'ROUTE' : J.places[id].short.toUpperCase());
  }

  let select = function select(id, { fromPlay = false } = {}) {
    if (!fromPlay && playing) stopPlay();
    if (id === cur) return;
    cur = id;
    mark(id);
    showPanel(id);
    fly(id);
  };
  chips.forEach((c) => c.addEventListener('click', () => select(c.dataset.id)));
  Object.entries(pins).forEach(([id, el]) => el.addEventListener('click', () => select(id)));
  root.querySelectorAll('.jm-tl__seg').forEach((b) => b.addEventListener('click', () => select(b.dataset.id)));

  const seq = ['home', 'school', 'uni', 'route'];
  function stopPlay() { if (playing) { playing.kill(); playing = null; } $('jm-play').classList.remove('is-on'); $('jm-play').textContent = '▶ Play the journey'; }
  $('jm-play').addEventListener('click', () => {
    if (playing) return stopPlay();
    $('jm-play').classList.add('is-on'); $('jm-play').textContent = '■ Stop';
    cur = null;
    const tl = gsap.timeline({ onComplete: stopPlay });
    seq.forEach((id, i) => tl.call(() => select(id, { fromPlay: true }), null, i * 8.5));
    tl.to({}, { duration: 8.5 });
    playing = tl;
  });

  /* ---- 3D ---- */
  const place3 = {};
  function fly(id) {
    if (!ready) return;
    const cam = viewer.camera;
    orbit = null; flying = true;
    cam.lookAtTransform(C.Matrix4.IDENTITY);
    const dur = reduce ? 0 : 3.2;
    const done = () => {
      flying = false;
      if (!reduce && !explore && cur === id && shot.orbit) orbit = { ...shot.orbit, t0: performance.now() };
    };
    let shot;
    if (id === 'overview') {
      shot = {};
      cam.flyTo({ destination: C.Cartesian3.fromDegrees(57.55, -21.76, 200000), orientation: { heading: 0, pitch: C.Math.toRadians(-50), roll: 0 }, duration: dur ? 3.6 : 0, complete: done, cancel: () => (flying = false) });
      return;
    }
    let center, h, pitch, range;
    if (id === 'route') {
      const bs = C.BoundingSphere.fromPoints(ORDER.map((k) => place3[k].top));
      center = bs.center; range = Math.max(2500, bs.radius * 2.7); h = C.Math.toRadians(15); pitch = C.Math.toRadians(-48);
    } else {
      const set = { home: [2600, 25, -38], school: [850, -40, -34], uni: [1000, 55, -34] }[id];
      center = place3[id].ground; range = set[0]; h = C.Math.toRadians(set[1]); pitch = C.Math.toRadians(set[2]);
    }
    shot = { orbit: { center, h, pitch, range } };
    cam.flyToBoundingSphere(new C.BoundingSphere(center, 1), { offset: new C.HeadingPitchRange(h, pitch, range), duration: dur, complete: done, cancel: () => (flying = false) });
  }

  function setExplore(on) {
    explore = on;
    stage.classList.toggle('is-explore', on);
    $('jm-explore').textContent = on ? 'Back to the story' : 'Explore the map';
    if (!ready) return;
    const c = viewer.scene.screenSpaceCameraController;
    c.enableInputs = on;
    if (on) { orbit = null; viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); }
    else if (cur) { const id = cur; cur = null; select(id, { fromPlay: !!playing }); }
  }
  $('jm-explore').addEventListener('click', () => setExplore(!explore));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && explore) setExplore(false); });

  async function boot() {
    try {
      C = await loadCesium();
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

      const esri = () => viewer.imageryLayers.addImageryProvider(new C.UrlTemplateImageryProvider({ url: ESRI, maximumLevel: 18, credit: new C.Credit('Imagery © Esri, Maxar, Earthstar Geographics') }));
      let terrain = null;
      if (J.cesiumToken) {
        C.Ion.defaultAccessToken = J.cesiumToken;
        let fell = false;
        const layer = C.ImageryLayer.fromProviderAsync(C.createWorldImageryAsync({ style: C.IonWorldImageryStyle.AERIAL }));
        layer.errorEvent.addEventListener(() => { if (!fell) { fell = true; viewer.imageryLayers.remove(layer); esri(); } });
        viewer.imageryLayers.add(layer);
        try {
          terrain = await C.createWorldTerrainAsync({ requestVertexNormals: true });
          viewer.terrainProvider = terrain;
          if (!lite) { const b = await C.createOsmBuildingsAsync(); sc.primitives.add(b); }
        } catch (e) { console.warn('3D terrain/buildings unavailable', e); }
      } else esri();

      // ground heights for the three markers
      const carts = ORDER.map((k) => C.Cartographic.fromDegrees(J.places[k].lon, J.places[k].lat));
      if (terrain) { try { await C.sampleTerrainMostDetailed(terrain, carts); } catch (e) { /* flat */ } }
      const css = (v, f) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || f;
      const colA = C.Color.fromCssColorString(css('--lg-b', '#38a8ff')), colB = C.Color.fromCssColorString(css('--lg-c', '#67e8f9'));
      const BEACON = 240;
      ORDER.forEach((k, i) => {
        const p = J.places[k], h = carts[i].height || 0;
        const ground = C.Cartesian3.fromDegrees(p.lon, p.lat, h), top = C.Cartesian3.fromDegrees(p.lon, p.lat, h + BEACON);
        place3[k] = { ground, top, h, lat: p.lat, lon: p.lon };
        viewer.entities.add({ polyline: { positions: [ground, top], width: 6, material: new C.PolylineGlowMaterialProperty({ glowPower: 0.3, color: colB }) } });
        viewer.entities.add({ position: top, ellipsoid: { radii: new C.Cartesian3(34, 34, 34), material: colB.withAlpha(0.95), outline: true, outlineColor: C.Color.WHITE.withAlpha(0.6), slicePartitions: 12, stackPartitions: 12 } });
        viewer.entities.add({ position: C.Cartesian3.fromDegrees(p.lon, p.lat, h + 4), ellipse: { semiMajorAxis: 90, semiMinorAxis: 90, height: h + 4, fill: false, outline: true, outlineColor: colA.withAlpha(0.9), outlineWidth: 2 } });
      });

      // glowing arcs with travelling packets
      const arc = (A, B) => {
        const pts = [], n = 64, d = haversine(J.places[A], J.places[B]) * 1000, up = Math.min(900, d * 0.14);
        for (let t = 0; t <= n; t++) {
          const f = t / n, a = place3[A], b = place3[B];
          pts.push(C.Cartesian3.fromDegrees(a.lon + (b.lon - a.lon) * f, a.lat + (b.lat - a.lat) * f, a.h + (b.h - a.h) * f + BEACON * 0.5 + Math.sin(Math.PI * f) * up));
        }
        return pts;
      };
      const routes = [['home', 'school'], ['school', 'uni']].map(([A, B], k) => {
        const pts = arc(A, B), st = { a: 0, k };
        viewer.entities.add({ polyline: { positions: pts, width: 9, material: new C.PolylineGlowMaterialProperty({ glowPower: 0.28, color: new C.CallbackProperty(() => colB.withAlpha(0.95 * st.a), false) }) } });
        const packet = (off) => viewer.entities.add({ position: new C.CallbackProperty(() => pts[Math.floor((((performance.now() / 3200 + off) % 1) * (pts.length - 1)))], false), point: { pixelSize: 11, color: new C.CallbackProperty(() => C.Color.WHITE.withAlpha(st.a), false), outlineColor: new C.CallbackProperty(() => colB.withAlpha(0.8 * st.a), false), outlineWidth: 6, disableDepthTestDistance: Number.POSITIVE_INFINITY } });
        packet(0); packet(0.5);
        return st;
      });
      const showRoutes = (id) => routes.forEach((r, i) => gsap.to(r, { a: id === 'route' || (id === 'uni') || (id === 'school' && i === 0) ? 1 : 0, duration: reduce ? 0 : 1.4, ease: 'power2.out' }));
      const _select = select;
      select = (id, o) => { showRoutes(id); _select(id, o); }; // eslint-disable-line no-func-assign

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
      // slow cinematic orbit around the selected place
      viewer.clock.onTick.addEventListener(() => {
        if (!orbit || explore || flying) return;
        const dt = (performance.now() - orbit.t0) / 1000;
        viewer.camera.lookAtTransform(C.Transforms.eastNorthUpToFixedFrame(orbit.center), new C.HeadingPitchRange(orbit.h + dt * 0.045, orbit.pitch, orbit.range));
      });
      // save battery when the map is off screen
      new IntersectionObserver((es) => { viewer.useDefaultRenderLoop = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

      ready = true;
      $('jm-load').classList.add('is-gone');
      // cinematic intro: from space, down to Mauritius
      viewer.camera.setView({ destination: C.Cartesian3.fromDegrees(57.5, -20.2, 2.4e7), orientation: { heading: 0, pitch: C.Math.toRadians(-90), roll: 0 } });
      cur = null;
      select('overview');
    } catch (e) {
      console.warn('3D map unavailable:', e);
      $('jm-load-t').textContent = '3D map unavailable here. The story below still works.';
      $('jm-load').classList.add('is-fail');
      Object.values(pins).forEach((el) => (el.style.display = 'none'));
      $('jm-explore').style.display = 'none';
    }
  }

  mark('overview'); showPanel('overview'); cur = 'overview';
  let started = false;
  new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting && !started) { started = true; io.disconnect(); boot(); }
  }, { rootMargin: '300px' }).observe(stage);
}
