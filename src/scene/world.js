import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * The "digital universe" around the Secure Core.
 * Seven stations, each tied to a part of the journey, plus a circuit-board floor and binary rain.
 *   core     Secure Core (home): HUD ring, data streams, shield
 *   neural   AI / machine learning
 *   code     programming, APIs
 *   servers  backend, cloud, Linux servers
 *   network  network engineering + firewall
 *   database database architecture
 *   crypto   cryptography (cipher wheel, hash chain)
 * Colours come from a palette with four roles: p (accent), s (sky), c (cyan), g (gold), plus 'solid'.
 */
export function createWorld({ lite }) {
  const stations = {};
  const texReg = [];
  let th = null;

  const dotTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.25, 'rgba(255,255,255,.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  function station(key, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.visible = false;
    const st = { key, group, fade: 0, entries: [], upd: [], center: group.position, spin: 0 };
    stations[key] = st;
    return st;
  }

  // ---- material registry (theme + fade) ------------------------------------
  function track(m, role, base, st, add) {
    st.entries.push({ m, role, base, add });
    return m;
  }
  const lineMat = (role, base, st, add = true) =>
    track(new THREE.LineBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }), role, base, st, add);
  const pointMat = (role, base, st, size) =>
    track(new THREE.PointsMaterial({ map: dotTex, size, transparent: true, depthWrite: false, opacity: 0 }), role, base, st, true);
  const basicMat = (role, base, st, add = true) =>
    track(new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide }), role, base, st, add);

  function applyEntry(e, st) {
    const light = th.light;
    if (e.role) e.m.color.set(e.role === 'solid' ? th.solidHex : th.pal[e.role]);
    const blend = e.add && !light ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (e.m.blending !== blend) { e.m.blending = blend; e.m.needsUpdate = true; }
    e.m.opacity = Math.min(1, e.base * (light ? 1.45 : 1)) * st.fade;
  }
  function refresh(st) {
    if (!th) return;
    for (const e of st.entries) applyEntry(e, st);
    st.group.visible = st.fade > 0.003;
  }

  // ---- textures drawn with the palette -----------------------------------
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const rec = { c, tex, draw, w, h };
    texReg.push(rec);
    if (th) paint(rec);
    return tex;
  }
  function paint(r) {
    const g = r.c.getContext('2d');
    g.clearRect(0, 0, r.w, r.h);
    r.draw(g, r.w, r.h, th.pal, th);
    r.tex.needsUpdate = true;
  }

  // ---- helpers -----------------------------------------------------------------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  function edgeLines(edges, role, base, st) {
    const arr = [];
    edges.forEach(([a, b]) => arr.push(a.x, a.y, a.z, b.x, b.y, b.z));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return new THREE.LineSegments(g, lineMat(role, base, st));
  }
  function glowPoints(vs, role, base, size, st) {
    const g = new THREE.BufferGeometry().setFromPoints(vs);
    return new THREE.Points(g, pointMat(role, base, st, size));
  }
  function wire(geo, role, base, st) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(role, base, st));
  }
  // Light packets that travel along edges (data moving through the network).
  function pulses(st, parent, edges, n, role, size, speed = [0.22, 0.6]) {
    const pos = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, pointMat(role, 1, st, size));
    pts.frustumCulled = false;
    parent.add(pts);
    const S = Array.from({ length: n }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), v: speed[0] + Math.random() * (speed[1] - speed[0]) }));
    const tmp = new THREE.Vector3();
    const step = (dt) => {
      for (let i = 0; i < n; i++) {
        const s = S[i];
        s.t += dt * s.v;
        if (s.t > 1) { s.t = 0; s.e = (Math.random() * edges.length) | 0; }
        tmp.lerpVectors(edges[s.e][0], edges[s.e][1], s.t);
        pos[i * 3] = tmp.x; pos[i * 3 + 1] = tmp.y; pos[i * 3 + 2] = tmp.z;
      }
      geo.attributes.position.needsUpdate = true;
    };
    step(0);
    st.upd.push(step);
  }
  function cloudEdges() {
    const parts = [[0, 0, 0, 1.1], [1, -0.15, 0.1, 0.8], [-1, -0.2, 0, 0.8], [0.45, 0.55, 0, 0.75], [-0.5, 0.45, 0.1, 0.65]].map(([x, y, z, r]) => {
      const g = new THREE.IcosahedronGeometry(r, 1);
      g.translate(x, y, z);
      return g;
    });
    return new THREE.EdgesGeometry(mergeGeometries(parts));
  }
  const EdgesFrom = (g) => new THREE.EdgesGeometry(g);
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

  /* =========================================================================
     CORE extras (added to the existing Secure Core group by scene.js)
     ========================================================================= */
  const core = station('core', 0, 0, 0);
  core.fade = 1;
  const coreExtras = new THREE.Group();
  core.group.add(coreExtras);
  // HUD ring: 120 ticks, every 5th longer
  {
    const arr = [];
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      const r0 = 4.15, r1 = i % 5 === 0 ? 4.45 : 4.3;
      arr.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    const hud = new THREE.LineSegments(g, lineMat('g', 0.55, core));
    hud.rotation.x = 1.15;
    hud.rotation.z = 0.25;
    coreExtras.add(hud);
    core.upd.push((dt) => { hud.rotation.y += dt * 0.12; });
  }
  // Data streams flowing into the core
  {
    const curves = [
      [V(-14, 4, -6), V(-8, 2, 3), V(-3.5, 0.6, 1.5), V(0, 0, 0)],
      [V(13, -3, -8), V(8, -2, 4), V(4, -0.8, 1), V(0, 0, 0)],
      [V(2, 9, -10), V(3, 5, 2), V(1.5, 2.3, 0.8), V(0, 0, 0)],
      [V(-6, -6, -9), V(-3, -3.5, 3), V(-1.5, -1.8, 1), V(0, 0, 0)],
    ].map((p) => new THREE.CatmullRomCurve3(p));
    const edges = [];
    curves.forEach((c) => {
      const pts = c.getPoints(36);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      coreExtras.add(new THREE.Line(geo, lineMat('p', 0.22, core)));
      for (let i = 0; i < pts.length - 1; i++) edges.push([pts[i], pts[i + 1]]);
    });
    pulses(core, coreExtras, edges, lite ? 18 : 30, 'g', 0.34, [0.35, 0.9]);
  }
  // Shield (cybersecurity): hex-faceted sphere + scan ring. Fades in only for the contact section.
  const shield = { fade: 0, entries: [], group: null, upd: [] };
  {
    const grp = new THREE.Group();
    shield.group = grp;
    coreExtras.add(grp);
    grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.85, 2)), lineMat('g', 0.4, shield)));
    const scan = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.012, 6, 96), basicMat('g', 0.9, shield));
    scan.rotation.x = Math.PI / 2;
    grp.add(scan);
    shield.t = 0;
    shield.step = (dt) => {
      shield.t += dt;
      const k = (shield.t * 0.3) % 1;
      const y = Math.sin(k * Math.PI * 2 - Math.PI / 2) * 2.6;
      scan.position.y = y;
      const r = Math.sqrt(Math.max(0, 1 - (y / 2.85) ** 2)) * 2.85;
      scan.scale.set(r / 2.85, r / 2.85, 1);
      grp.rotation.y += dt * 0.05;
    };
  }
  // Holographic status panel (visible with the shield, in the contact section)
  {
    const tex = canvasTex(640, 360, (g, w, h, pal, t) => {
      holoFrame(g, w, h, pal, t);
      g.font = '600 22px "JetBrains Mono", monospace';
      g.fillStyle = pal.g;
      g.fillText('SECURE CORE  //  STATUS', 28, 62);
      const rows = [['FIREWALL', 'ACTIVE'], ['TLS 1.3', 'ENFORCED'], ['ENCRYPTION', 'AES-256'], ['OPEN THREATS', '0']];
      g.font = '24px "JetBrains Mono", monospace';
      rows.forEach(([a, b], i) => {
        const y = 118 + i * 52;
        g.fillStyle = t.light ? '#1b2a4a' : '#9fb4de';
        g.fillText(a, 28, y);
        g.fillStyle = pal.s;
        g.textAlign = 'right';
        g.fillText(b, w - 28, y);
        g.textAlign = 'left';
        g.fillStyle = pal.p + '55';
        g.fillRect(28, y + 14, w - 56, 1.5);
      });
      g.fillStyle = pal.g;
      for (let i = 0; i < 18; i++) g.fillRect(28 + i * 16, 330 - (Math.sin(i * 1.7) * 0.5 + 0.5) * 20, 9, 20);
    });
    const m = basicMat(null, 0.95, shield, false);
    m.map = tex;
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.03), m);
    panel.position.set(-1.7, -3.2, 1.4);
    panel.rotation.y = 0.3;
    coreExtras.add(panel);
    shield.panel = panel;
    shield.upd.push((dt, t) => { panel.position.y = -3.2 + Math.sin(t * 0.8) * 0.08; });
  }
  function holoFrame(g, w, h, pal, t) {
    g.fillStyle = t.light ? 'rgba(255,255,255,0.9)' : 'rgba(5,10,26,0.74)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = pal.p;
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.strokeStyle = pal.g;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(1.5, 30); g.lineTo(1.5, 1.5); g.lineTo(30, 1.5);
    g.moveTo(w - 30, h - 1.5); g.lineTo(w - 1.5, h - 1.5); g.lineTo(w - 1.5, h - 30);
    g.stroke();
  }

  /* =========================================================================
     NEURAL: AI / machine learning
     ========================================================================= */
  const neural = station('neural', 16, 3, -20);
  {
    const grp = new THREE.Group();
    neural.group.add(grp);
    const sizes = [4, 7, 7, 4];
    const layers = sizes.map((n, li) =>
      Array.from({ length: n }, (_, i) => V(-4.6 + li * 3.07 + (rnd() - 0.5) * 0.25, (i - (n - 1) / 2) * 0.95 + (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 1.8))
    );
    const edges = [];
    for (let l = 0; l < layers.length - 1; l++) layers[l].forEach((a) => layers[l + 1].forEach((b) => edges.push([a, b])));
    grp.add(edgeLines(edges, 'p', 0.2, neural));
    const flat = layers.flat();
    const halo = glowPoints(flat, 'p', 0.9, 0.9, neural);
    grp.add(halo);
    const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 12, 12), basicMat('s', 1, neural, false), flat.length);
    const mm = new THREE.Matrix4();
    flat.forEach((p, i) => nodes.setMatrixAt(i, mm.makeTranslation(p.x, p.y, p.z)));
    grp.add(nodes);
    pulses(neural, grp, edges, lite ? 40 : 70, 'g', 0.3, [0.3, 0.8]);
    // faint "cortex" cloud behind the layers
    const cloud = [];
    for (let i = 0; i < (lite ? 90 : 160); i++) {
      const u = rnd() * Math.PI * 2, v = Math.acos(2 * rnd() - 1), r = 5.2 * Math.cbrt(rnd());
      cloud.push(V(Math.cos(u) * Math.sin(v) * r, Math.cos(v) * r * 0.55, Math.sin(u) * Math.sin(v) * r * 0.5 - 1));
    }
    grp.add(glowPoints(cloud, 's', 0.35, 0.22, neural));
    grp.rotation.y = 0.5;
    neural.upd.push((dt, t) => {
      grp.rotation.y = 0.5 + Math.sin(t * 0.25) * 0.25;
      halo.material.size = 0.85 + Math.sin(t * 1.6) * 0.12;
    });
  }

  /* =========================================================================
     CODE: programming and APIs (holographic code panels)
     ========================================================================= */
  const code = station('code', -14, 2, -42);
  {
    const grp = new THREE.Group();
    code.group.add(grp);
    const snippets = [
      { t: 'auth.py', l: [[['def ', 'k'], ['verify', 't'], ['(token, key):', 't']], [['    digest = ', 't'], ['hmac', 'k'], ['.new(key, token)', 't']], [['    ', 't'], ['return ', 'k'], ['compare(digest, sig)', 't']], [['# constant-time check', 'c']]] },
      { t: 'routes.js', l: [[['GET  ', 'k'], ['/api/v1/users', 's'], ['   200', 't']], [['POST ', 'k'], ['/api/v1/login', 's'], ['   401', 't']], [['app.', 't'], ['use', 'k'], ['(rateLimit(100))', 't']], [['// REST endpoints', 'c']]] },
      { t: 'schema.sql', l: [[['CREATE TABLE ', 'k'], ['users ', 't'], ['(', 't']], [['  id    ', 't'], ['INT PRIMARY KEY', 'k'], [',', 't']], [['  email ', 't'], ['VARCHAR', 'k'], ['(120) ', 't'], ['UNIQUE', 'k']], [[');', 't']]] },
    ];
    const place = [[-1.9, 1.5, 0.3, 0.38], [1.7, 0.1, -0.7, -0.32], [-0.9, -1.55, 1.1, 0.2]];
    const panels = snippets.map((s, i) => {
      const tex = canvasTex(640, 400, (g, w, h, pal, t) => {
        holoFrame(g, w, h, pal, t);
        g.fillStyle = pal.g;
        [0, 1, 2].forEach((d) => { g.beginPath(); g.arc(30 + d * 22, 30, 6, 0, 6.3); g.fill(); });
        g.font = '600 22px "JetBrains Mono", monospace';
        g.fillStyle = t.light ? '#41537c' : '#8fa6d6';
        g.fillText(s.t, 130, 37);
        g.font = '27px "JetBrains Mono", monospace';
        s.l.forEach((line, li) => {
          let x = 30;
          line.forEach(([txt, k]) => {
            g.fillStyle = k === 'k' ? pal.s : k === 's' ? pal.g : k === 'c' ? (t.light ? '#6d7da3' : '#5d729f') : t.light ? '#14213d' : '#e5eeff';
            g.fillText(txt, x, 110 + li * 56);
            x += g.measureText(txt).width;
          });
        });
        // scan line
        g.fillStyle = pal.p + '1f';
        g.fillRect(0, 70, w, 2);
      });
      const m = basicMat(null, 0.96, code, false);
      m.map = tex;
      const p = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.31), m);
      p.position.set(place[i][0], place[i][1], place[i][2]);
      p.rotation.y = place[i][3];
      grp.add(p);
      return p;
    });
    // software architecture cube (nested, counter-rotating)
    const c1 = wire(new THREE.BoxGeometry(1.5, 1.5, 1.5), 'g', 0.8, code);
    const c2 = wire(new THREE.BoxGeometry(0.8, 0.8, 0.8), 's', 0.9, code);
    c1.position.set(3.4, 2.3, -1.2);
    c2.position.copy(c1.position);
    grp.add(c1, c2);
    // blinking cursor block
    const cur = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.02), basicMat('g', 1, code));
    cur.position.set(0.2, -0.3, 1.6);
    grp.add(cur);
    code.upd.push((dt, t) => {
      panels.forEach((p, i) => { p.position.y = place[i][1] + Math.sin(t * 0.7 + i * 2) * 0.1; });
      c1.rotation.x += dt * 0.4; c1.rotation.y += dt * 0.5;
      c2.rotation.x -= dt * 0.7; c2.rotation.z += dt * 0.4;
      cur.visible = Math.floor(t * 1.6) % 2 === 0;
      grp.rotation.y = Math.sin(t * 0.2) * 0.12;
    });
  }

  /* =========================================================================
     SERVERS: backend, cloud, Linux servers
     ========================================================================= */
  const servers = station('servers', 6, -1, -64);
  {
    const grp = new THREE.Group();
    servers.group.add(grp);
    const racks = 5, units = 14;
    const bodyMat = track(new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.38, transparent: true, opacity: 0 }), 'solid', 1, servers, false);
    const ledGeo = new THREE.BoxGeometry(0.07, 0.05, 0.02);
    const ledMat = track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), null, 1, servers, true);
    const frameMat = lineMat('p', 0.7, servers);
    const unitGeo = new THREE.BoxGeometry(1.0, 0.17, 0.9);
    const palCols = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
    const leds = [];
    const ledMesh = new THREE.InstancedMesh(ledGeo, ledMat, racks * units * 3);
    const m4 = new THREE.Matrix4();
    const rackGroups = [];
    let li = 0;
    for (let r = 0; r < racks; r++) {
      const a = (r - (racks - 1) / 2) * 0.46;
      const rg = new THREE.Group();
      rg.position.set(Math.sin(a) * 3.6, 0, Math.cos(a) * 3.6 - 3.6);
      rg.rotation.y = a;
      const body = new THREE.InstancedMesh(unitGeo, bodyMat, units);
      for (let u = 0; u < units; u++) body.setMatrixAt(u, m4.makeTranslation(0, -1.55 + u * 0.236, 0));
      rg.add(body);
      const f = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 3.55, 1.0)), frameMat);
      rg.add(f);
      for (let u = 0; u < units; u++)
        for (let k = 0; k < 3; k++) {
          const lm = new THREE.Matrix4().makeTranslation(-0.32 + k * 0.1, -1.55 + u * 0.236, 0.46).premultiply(new THREE.Matrix4().compose(rg.position, new THREE.Quaternion().setFromEuler(rg.rotation), new THREE.Vector3(1, 1, 1)));
          ledMesh.setMatrixAt(li, lm);
          leds.push({ i: li, c: (rnd() * 3) | 0, on: rnd() > 0.35, next: rnd() * 3 });
          li++;
        }
      rackGroups.push(rg);
      grp.add(rg);
    }
    grp.add(ledMesh);
    ledMesh.frustumCulled = false;
    const setLedColors = () => {
      palCols[0].set(th.pal.s); palCols[1].set(th.pal.g); palCols[2].set(th.pal.c);
      leds.forEach((l) => ledMesh.setColorAt(l.i, l.on ? palCols[l.c] : new THREE.Color(0x000000)));
      ledMesh.instanceColor.needsUpdate = true;
    };
    servers.onTheme = setLedColors;
    // cloud + uplinks
    const cloud = new THREE.LineSegments(cloudEdges(), lineMat('s', 0.6, servers));
    cloud.position.set(0, 4.6, -3.6);
    cloud.scale.setScalar(1.1);
    grp.add(cloud);
    const ups = [];
    rackGroups.forEach((rg) => ups.push([V(rg.position.x, 1.8, rg.position.z), V(0, 3.9, -3.6)]));
    grp.add(edgeLines(ups, 'p', 0.4, servers));
    pulses(servers, grp, ups, 16, 'g', 0.32, [0.25, 0.6]);
    // floor ring under the racks
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.012, 6, 120), basicMat('g', 0.6, servers));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -1.85, -3.6);
    grp.add(ring);
    servers.upd.push((dt, t) => {
      let dirty = false;
      leds.forEach((l) => {
        l.next -= dt;
        if (l.next <= 0) {
          l.on = rnd() > 0.3;
          l.c = (rnd() * 3) | 0;
          l.next = 0.4 + rnd() * 2.4;
          ledMesh.setColorAt(l.i, l.on ? palCols[l.c] : new THREE.Color(0x000000));
          dirty = true;
        }
      });
      if (dirty) ledMesh.instanceColor.needsUpdate = true;
      cloud.rotation.y += dt * 0.15;
      grp.rotation.y = Math.sin(t * 0.22) * 0.18;
    });
    grp.position.z = 3.4;
  }

  /* =========================================================================
     NETWORK: engineering + firewall
     ========================================================================= */
  const network = station('network', -14, 4, -82);
  {
    const grp = new THREE.Group();
    network.group.add(grp);
    const internet = V(0, 4.5, 0);
    const router = V(0, 1.6, 0);
    const dist = [V(-3.2, 0, 0.6), V(0, 0, -0.8), V(3.2, 0, 0.6)];
    const hosts = [];
    dist.forEach((d, i) => { for (let k = 0; k < 3; k++) hosts.push([i, V(d.x + (k - 1) * 1.15, -1.9, d.z + (k % 2 ? 0.9 : -0.6))]); });
    const edges = [[internet, V(0, 3.1, 0)], [V(0, 3.1, 0), router]];
    dist.forEach((d) => edges.push([router, d]));
    hosts.forEach(([i, h]) => edges.push([dist[i], h]));
    dist.forEach((d, i) => { if (i) edges.push([dist[i - 1], d]); });
    grp.add(edgeLines(edges, 'p', 0.5, network));
    pulses(network, grp, edges, lite ? 22 : 36, 'g', 0.3, [0.25, 0.7]);
    // devices
    const cloud = new THREE.LineSegments(cloudEdges(), lineMat('s', 0.65, network));
    cloud.position.copy(internet);
    cloud.scale.setScalar(0.75);
    grp.add(cloud);
    const rt = wire(new THREE.OctahedronGeometry(0.55), 'g', 0.95, network);
    rt.position.copy(router);
    grp.add(rt);
    dist.forEach((d) => {
      const s = wire(new THREE.BoxGeometry(1.0, 0.3, 0.6), 's', 0.9, network);
      s.position.copy(d);
      grp.add(s);
    });
    grp.add(glowPoints(hosts.map((h) => h[1]), 's', 0.95, 0.5, network));
    // firewall: gold grid plane with a scanning bar
    const fw = [];
    for (let i = -4; i <= 4; i++) { fw.push(V(i * 0.8, 0, -3.2), V(i * 0.8, 0, 3.2), V(-3.2, 0, i * 0.8), V(3.2, 0, i * 0.8)); }
    const fwGeo = new THREE.BufferGeometry().setFromPoints(fw);
    const fwl = new THREE.LineSegments(fwGeo, lineMat('g', 0.4, network));
    fwl.position.y = 3.1;
    grp.add(fwl);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.02, 0.07), basicMat('g', 0.95, network));
    bar.position.y = 3.1;
    grp.add(bar);
    network.upd.push((dt, t) => {
      bar.position.z = Math.sin(t * 0.9) * 3.2;
      rt.rotation.y += dt * 0.8;
      cloud.rotation.y += dt * 0.15;
      grp.rotation.y = 0.35 + Math.sin(t * 0.2) * 0.25;
    });
    grp.position.y = -0.4;
  }

  /* =========================================================================
     DATABASE: storage architecture
     ========================================================================= */
  const database = station('database', 12, 0, -100);
  {
    const grp = new THREE.Group();
    database.group.add(grp);
    const centres = [V(0, -0.6, 0), V(-2.7, -0.6, -1.5), V(2.7, -0.6, -1.5)];
    centres.forEach((c) => {
      for (let i = 0; i < 4; i++) {
        const d = wire(new THREE.CylinderGeometry(1.0, 1.0, 0.36, 22), i === 3 ? 'g' : 'p', i === 3 ? 0.9 : 0.7, database);
        d.position.set(c.x, c.y + i * 0.5, c.z);
        grp.add(d);
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.012, 6, 60), basicMat('s', 0.6, database));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(c.x, c.y - 0.45, c.z);
      grp.add(ring);
    });
    const link = [[V(0, 0.4, 0), V(-2.7, 0.4, -1.5)], [V(0, 0.4, 0), V(2.7, 0.4, -1.5)], [V(-2.7, 0.4, -1.5), V(2.7, 0.4, -1.5)]];
    grp.add(edgeLines(link, 's', 0.45, database));
    pulses(database, grp, link, 12, 'g', 0.34, [0.3, 0.7]);
    // B-tree index above (indexing)
    const root = V(0, 3.9, -0.8);
    const mid = [V(-2, 3.0, -0.8), V(0, 3.0, -0.8), V(2, 3.0, -0.8)];
    const leaf = [];
    mid.forEach((m, i) => { for (let k = 0; k < 3; k++) leaf.push([i, V(m.x + (k - 1) * 0.7, 2.1, -0.8)]); });
    const te = mid.map((m) => [root, m]);
    leaf.forEach(([i, l]) => te.push([mid[i], l]));
    grp.add(edgeLines(te, 'p', 0.5, database));
    const tn = [root, ...mid, ...leaf.map((l) => l[1])];
    tn.forEach((p, i) => {
      const b = wire(new THREE.BoxGeometry(i === 0 ? 0.55 : 0.34, 0.24, 0.24), i === 0 ? 'g' : 's', 0.95, database);
      b.position.copy(p);
      grp.add(b);
    });
    pulses(database, grp, te, 8, 'g', 0.26, [0.3, 0.6]);
    database.upd.push((dt, t) => { grp.rotation.y = 0.45 + Math.sin(t * 0.22) * 0.25; });
    grp.position.y = -0.8;
  }

  /* =========================================================================
     CRYPTO: cipher wheel, padlock, hash chain
     ========================================================================= */
  const crypto = station('crypto', -8, 2, -118);
  {
    const grp = new THREE.Group();
    crypto.group.add(grp);
    const ringTex = (shift, gold, inner) =>
      canvasTex(1024, 1024, (g, w, h, pal, t) => {
        g.translate(w / 2, h / 2);
        const R = inner ? 330 : 470;
        g.strokeStyle = gold ? pal.g : pal.p;
        g.lineWidth = 3;
        g.beginPath(); g.arc(0, 0, R + 36, 0, 6.3); g.stroke();
        g.beginPath(); g.arc(0, 0, R - 40, 0, 6.3); g.stroke();
        g.font = '600 54px "JetBrains Mono", monospace';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2;
          g.save();
          g.rotate(a);
          g.translate(0, -R);
          g.fillStyle = gold ? pal.g : t.light ? '#14213d' : '#dfe9ff';
          g.fillText(String.fromCharCode(65 + ((i + shift) % 26)), 0, 0);
          g.fillRect(-1, 28, 2, 12);
          g.restore();
        }
      });
    const mk = (tex, r, role, op) => {
      const m = basicMat(null, op, crypto, !false);
      m.map = tex;
      return new THREE.Mesh(new THREE.CircleGeometry(r, 64), m);
    };
    const outer = mk(ringTex(0, false, false), 3.6, null, 0.9);
    const inner = mk(ringTex(3, true, true), 4.0, null, 0.95); // Caesar shift of 3
    inner.position.z = 0.02;
    const wheel = new THREE.Group();
    wheel.add(outer, inner);
    wheel.rotation.x = -0.28;
    grp.add(wheel);
    // padlock
    const lock = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.9, 0.5), track(new THREE.MeshStandardMaterial({ metalness: 0.85, roughness: 0.3, transparent: true, opacity: 0 }), 'solid', 1, crypto, false));
    const bodyEdge = wire(new THREE.BoxGeometry(1.15, 0.9, 0.5), 'g', 1, crypto);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 28, Math.PI), basicMat('g', 1, crypto, false));
    shackle.position.set(0, 0.45, 0);
    const key = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), basicMat('g', 1, crypto));
    key.position.set(0, 0.06, 0.26);
    lock.add(body, bodyEdge, shackle, key);
    grp.add(lock);
    // hash chain: four blocks orbiting the wheel
    const blocks = [];
    const hexes = ['9F3A·C2D8', '4B71·E09A', 'D6C5·1A7F', '27E8·B3C4'];
    hexes.forEach((hx, i) => {
      const tex = canvasTex(256, 128, (g, w, h, pal, t) => {
        g.fillStyle = t.light ? 'rgba(255,255,255,0.92)' : 'rgba(5,10,26,0.78)';
        g.fillRect(0, 0, w, h);
        g.strokeStyle = pal.g; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
        g.font = '600 20px "JetBrains Mono", monospace';
        g.fillStyle = pal.s; g.fillText('SHA-256', 16, 36);
        g.font = '30px "JetBrains Mono", monospace';
        g.fillStyle = t.light ? '#14213d' : '#e5eeff'; g.fillText(hx, 16, 86);
      });
      const m = basicMat(null, 0.95, crypto, false);
      m.map = tex;
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), m);
      grp.add(b);
      blocks.push(b);
    });
    const chain = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(blocks.map(() => V())), lineMat('g', 0.6, crypto));
    chain.frustumCulled = false;
    grp.add(chain);
    crypto.upd.push((dt, t) => {
      outer.rotation.z += dt * 0.12;
      inner.rotation.z -= dt * 0.2;
      lock.position.set(0, Math.sin(t * 0.9) * 0.06, 0.4);
      lock.rotation.y = Math.sin(t * 0.5) * 0.5;
      const pa = chain.geometry.attributes.position;
      blocks.forEach((b, i) => {
        const a = t * 0.22 + (i / blocks.length) * Math.PI * 2;
        b.position.set(Math.cos(a) * 4.5, Math.sin(a) * 1.4 + 0.2, Math.sin(a) * 1.8 + 0.6);
        b.rotation.y = -Math.cos(a) * 0.5;
        pa.setXYZ(i, b.position.x, b.position.y, b.position.z);
      });
      pa.needsUpdate = true;
      grp.rotation.y = Math.sin(t * 0.2) * 0.2;
    });
  }

  /* =========================================================================
     Circuit-board floor + binary rain (global, follow the camera)
     ========================================================================= */
  const floorMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uCam: { value: new THREE.Vector2() }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `
      varying vec3 vW; uniform float uTime; uniform vec3 uA; uniform vec3 uB; uniform vec2 uCam; uniform float uK;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 p = vW.xz * 0.8;
        float w = 0.04;
        // horizontal traces (on the integer lines of p.y), vertical traces (on integer lines of p.x)
        vec2 sh = vec2(floor(p.x), floor(p.y + 0.5));
        float onH = step(0.52, hash(sh)) * step(abs(fract(p.y + 0.5) - 0.5), w);
        vec2 sv = vec2(floor(p.x + 0.5), floor(p.y));
        float onV = step(0.52, hash(sv + 7.3)) * step(abs(fract(p.x + 0.5) - 0.5), w);
        float pulseH = smoothstep(0.2, 0.0, abs(fract(p.x) - fract(uTime * (0.25 + 0.3 * hash(sh + 1.7)) + hash(sh)))) * onH;
        float pulseV = smoothstep(0.2, 0.0, abs(fract(p.y) - fract(uTime * (0.25 + 0.3 * hash(sv + 4.1)) + hash(sv + 2.0)))) * onV;
        vec2 ip = floor(p + 0.5); vec2 g = fract(p + 0.5) - 0.5;
        float pad = step(0.7, hash(ip + 3.1)) * smoothstep(0.11, 0.07, length(g));
        float pulse = max(pulseH, pulseV);
        float fall = 1.0 - smoothstep(8.0, 46.0, distance(vW.xz, uCam));
        float a = (max(onH, onV) * 0.3 + pulse * 0.9 + pad * 0.55) * fall * uK;
        gl_FragColor = vec4(mix(uA, uB, pulse), a);
      }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.4;
  floor.frustumCulled = false;
  floor.renderOrder = -2;

  const rainN = lite ? 140 : 280;
  const atlas = (() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.font = '600 52px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('0', 32, 34); g.fillText('1', 96, 34);
    return new THREE.CanvasTexture(c);
  })();
  const rainGeo = new THREE.BufferGeometry();
  {
    const p = new Float32Array(rainN * 3), s = new Float32Array(rainN), gl = new Float32Array(rainN);
    for (let i = 0; i < rainN; i++) {
      p[i * 3] = (rnd() - 0.5) * 90; p[i * 3 + 1] = rnd() * 26; p[i * 3 + 2] = -rnd() * 135 + 12;
      s[i] = rnd(); gl[i] = rnd() > 0.5 ? 1 : 0;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    rainGeo.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    rainGeo.setAttribute('aGlyph', new THREE.BufferAttribute(gl, 1));
  }
  const rainMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color() }, uAtlas: { value: atlas }, uPx: { value: 1 }, uOp: { value: 0.6 } },
    vertexShader: `
      attribute float aSeed; attribute float aGlyph; varying float vA; varying float vG; uniform float uTime; uniform float uPx;
      void main(){
        float y = mod(position.y - uTime * (0.5 + aSeed * 0.9), 26.0) - 12.0;
        vec4 mv = modelViewMatrix * vec4(position.x, y, position.z, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(40.0, (0.7 + aSeed * 0.6) * 150.0 * uPx / max(0.5, -mv.z));
        vA = smoothstep(-12.0, -8.0, y) * (1.0 - smoothstep(9.0, 14.0, y)) * (0.35 + aSeed * 0.65);
        vG = aGlyph;
      }`,
    fragmentShader: `
      varying float vA; varying float vG; uniform sampler2D uAtlas; uniform vec3 uColor; uniform float uOp;
      void main(){ vec2 uv = gl_PointCoord; uv.x = uv.x * 0.5 + vG * 0.5; float a = texture2D(uAtlas, uv).a; gl_FragColor = vec4(uColor, a * vA * uOp); }`,
  });
  const rain = new THREE.Points(rainGeo, rainMat);
  rain.frustumCulled = false;
  rain.renderOrder = -1;

  // ---- API ---------------------------------------------------------------------
  const all = [core, neural, code, servers, network, database, crypto];
  const root = new THREE.Group();
  root.add(floor, rain);
  all.forEach((s) => { if (s !== core) root.add(s.group); });

  function setTheme(t) {
    th = t;
    [...all, shield].forEach((s) => refresh(s));
    texReg.forEach(paint);
    floorMat.uniforms.uA.value.set(t.pal.p);
    floorMat.uniforms.uB.value.set(t.pal.g);
    floorMat.uniforms.uK.value = t.light ? 1.9 : 1;
    floorMat.blending = t.light ? THREE.NormalBlending : THREE.AdditiveBlending;
    rainMat.uniforms.uColor.value.set(t.pal.s);
    rainMat.blending = t.light ? THREE.NormalBlending : THREE.AdditiveBlending;
    rainMat.uniforms.uOp.value = t.light ? 0.75 : 0.6;
    floorMat.needsUpdate = rainMat.needsUpdate = true;
    if (servers.onTheme) servers.onTheme();
  }

  const scratch = { c: 0 };
  function update(dt, t, camera, narrow) {
    floorMat.uniforms.uTime.value = t;
    floorMat.uniforms.uCam.value.set(camera.position.x, camera.position.z);
    floor.position.x = camera.position.x;
    floor.position.z = camera.position.z;
    rainMat.uniforms.uTime.value = t;
    rainMat.uniforms.uPx.value = Math.min(window.devicePixelRatio, 2);
    for (const s of all) {
      if (!s.group.visible) continue;
      for (const f of s.upd) f(dt, t);
    }
    if (shield.group.visible) {
      shield.step(dt);
      shield.upd.forEach((f) => f(dt, t));
    }
    scratch.c++;
  }

  /** Fade stations: only `keys` are shown. Returns nothing; GSAP drives st.fade via setFade. */
  function setFade(st, v) {
    st.fade = v;
    refresh(st);
  }

  return { root, stations, shield, coreExtras, setTheme, update, setFade, refresh, all };
}
