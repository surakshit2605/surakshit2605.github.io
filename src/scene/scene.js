import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { techIcons } from './techIcons.js';

import { ACCENTS } from '../accents.js';
import { createStation } from './station.js';
import { createWorld } from './world.js';

const C = { navy: 0x0a1330, blue: 0x2f7bff, sky: 0x8fc8ff };

// Colours of the 3D scene for a mode (dark/light) and accent colour. The canvas is transparent, so the page shows through.
const hex = (h) => parseInt(h.slice(1), 16);
const css = (h, a) => { const n = hex(h); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
function sceneTheme(mode, accent) {
  const A = ACCENTS[accent] || ACCENTS.blue;
  const pal = (m, gold) => ({ p: m.blue, s: m.sky, c: m.cyan, g: gold });
  if (mode === 'light') {
    const m = A.l;
    return {
      light: true, pal: pal(m, '#a86b00'), solidHex: '#' + A.scene.lsolid.toString(16).padStart(6, '0'),
      solid: A.scene.lsolid, metal: 0.1, rough: 0.6, solidO: 0.55, wire: hex(m.blue), shell: hex(m.blue), shellO: 0.22, ring: hex(m.blue), ringO: 0.5,
      node: hex(m.lg[0]), link: hex(m.blue), linkO: 0.4, part: hex(m.blue), partO: 0.45, amb: A.scene.lamb, ambI: 1.0, key: hex(m.blue), rim: hex(m.sky),
      iconBg: 'rgba(255,255,255,0.94)', iconLine: css(m.blue, 0.5), iconFg: m.sky,
    };
  }
  const m = A.d;
  return {
    light: false, pal: pal(m, '#ffc83d'), solidHex: '#' + A.scene.solid.toString(16).padStart(6, '0'),
    solid: A.scene.solid, metal: 0.85, rough: 0.3, solidO: 1, wire: hex(m.blue), shell: hex(m.sky), shellO: 0.12, ring: hex(m.sky), ringO: 0.35,
    node: hex(m.sky), link: hex(m.blue), linkO: 0.3, part: hex(m.sky), partO: 0.5, amb: A.scene.amb, ambI: 0.6, key: hex(m.blue), rim: hex(m.sky),
    iconBg: css(m.panel, 0.9), iconLine: css(m.sky, 0.55), iconFg: m.sky,
  };
}

/**
 * Camera shots, one per section. The camera flies between "stations" of the 3D world.
 * st: station, side: where the object sits on screen (+ right, - left, 0 centre; keeps it clear of the text),
 * dist: camera distance, h: camera height, az: orbit angle around the target.
 */
const SHOTS = {
  hero: { st: 'core', side: 3.6, dist: 9, h: 0, az: 0 },
  about: { st: 'neural', side: 3.4, dist: 11.5, h: 0.4, az: 0.15 },
  profile: { st: 'neural', side: -3.2, dist: 11.5, h: -0.3, az: -0.4 },
  background: { st: 'code', side: 4.6, dist: 12.5, h: 0.3, az: -0.12 },
  education: { st: 'code', side: 4.8, dist: 9.5, h: -0.2, az: 0.32 },
  skills: { st: 'servers', side: 3.6, dist: 19, h: 0.8, az: 0, ty: -2.4 }, // full-width cards: scene sits in the strip above them
  journey: { st: 'network', side: 3.4, dist: 15, h: 0.4, az: 0.3, ty: -2.2 },
  projects: { st: 'database', side: 3.2, dist: 16, h: 0.9, az: -0.2, ty: -2.4 },
  achievements: { st: 'crypto', side: 3.2, dist: 11.5, h: 0, az: 0.1 },
  contact: { st: 'core', side: -4.9, dist: 13.5, h: 0.3, az: 0 },
};

const MODEL_URL = `${import.meta.env.BASE_URL}models/core.glb`;

export async function createScene(canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Touch devices (phones AND tablets, iPad/Android) get the lighter scene whatever their width: a 1366px iPad Pro still has a mobile GPU.
  const touch = window.matchMedia('(pointer: coarse)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null; // caller adds .no-webgl
  }
  const lite = window.innerWidth < 800 || touch;
  let pr = Math.min(window.devicePixelRatio, touch ? 1.25 : 1.5); // 2x costs ~1.8x the pixels for little visible gain on a dark scene
  renderer.setPixelRatio(pr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 420);
  camera.position.set(0, 0, 9);

  const ambient = new THREE.AmbientLight(0x6f86b8, 0.6);
  scene.add(ambient);
  const key = new THREE.PointLight(C.blue, 60, 30);
  // Lights ride on the camera so every station is lit the same way wherever the camera flies.
  key.position.set(4, 4, -3);
  const rim = new THREE.PointLight(C.sky, 25, 30);
  rim.position.set(-5, -2, -6);
  camera.add(key, rim);
  scene.add(camera);

  const world = createWorld({ lite });
  scene.add(world.root);
  const hull = createStation({ lite });
  scene.add(hull.root);
  world.root.visible = true;

  // ---- The core -------------------------------------------------------
  const core = new THREE.Group();
  scene.add(core);
  const centre = new THREE.Group(); // swapped for the Blender model when it loads
  core.add(centre);
  core.add(world.stations.core.group); // HUD ring, data streams, shield, status panel

  const parts = {};
  function buildProcedural() {
    const solid = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4, 1),
      new THREE.MeshStandardMaterial({ color: C.navy, metalness: 0.85, roughness: 0.3, flatShading: true })
    );
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.46, 1)),
      new THREE.LineBasicMaterial({ color: C.blue })
    );
    const shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.2, 2)),
      new THREE.LineBasicMaterial({ color: C.sky, transparent: true, opacity: 0.12 })
    );
    centre.add(solid, wire, shell);
    Object.assign(parts, { solid, wire, shell });
  }
  buildProcedural();

  // Rings
  const ringMat = new THREE.MeshBasicMaterial({ color: C.sky, transparent: true, opacity: 0.35 });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.008, 8, 160), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.008, 8, 160), ringMat);
  ring1.rotation.x = Math.PI / 2.4;
  ring2.rotation.set(Math.PI / 3, Math.PI / 5, 0);
  core.add(ring1, ring2);

  // Orbiting nodes + links (a small network graph)
  const nodesGroup = new THREE.Group();
  core.add(nodesGroup);
  const N = 46;
  const R = 3.6;
  const pts = [];
  for (let i = 0; i < N; i++) {
    // Fibonacci sphere
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = i * Math.PI * (3 - Math.sqrt(5));
    pts.push(new THREE.Vector3(Math.cos(t) * r * R, y * R, Math.sin(t) * r * R));
  }
  const nodes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshBasicMaterial({ color: C.sky }),
    N
  );
  const m = new THREE.Matrix4();
  pts.forEach((p, i) => nodes.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z)));
  nodesGroup.add(nodes);

  const linkPos = [];
  for (let i = 0; i < N; i++)
    for (let j = i + 1; j < N; j++)
      if (pts[i].distanceTo(pts[j]) < 2.1) linkPos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPos, 3));
  const linkMat = new THREE.LineBasicMaterial({ color: C.blue, transparent: true, opacity: 0.3 });
  nodesGroup.add(new THREE.LineSegments(linkGeo, linkMat));

  // Tool icons orbiting the core (flat sprites, one colour so they match the palette)
  const orbit = new THREE.Group();
  orbit.rotation.set(0.38, 0, 0.18);
  core.add(orbit);
  const sprites = [];
  let th = sceneTheme('dark', document.documentElement.getAttribute('data-accent') || 'blue');
  function iconTexture(path) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fillStyle = th.iconBg;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = th.iconLine;
    g.stroke();
    g.translate(32, 32);
    g.scale(2.67, 2.67);
    g.fillStyle = th.iconFg;
    g.fill(new Path2D(path));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  techIcons.forEach((ic, i) => {
    const mat = new THREE.SpriteMaterial({ map: iconTexture(ic.path), transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    const a = (i / techIcons.length) * Math.PI * 2;
    sp.position.set(Math.cos(a) * 3, 0, Math.sin(a) * 3);
    sp.scale.setScalar(0.56);
    sp.userData.name = ic.name;
    orbit.add(sp);
    sprites.push(sp);
  });
  const tip = document.createElement('div');
  tip.className = 'tech-tip';
  tip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tip);
  const proj = new THREE.Vector3();
  const wp = new THREE.Vector3();
  function hoverIcons() {
    if (!orbit.visible) {
      tip.classList.remove('is-on');
      return;
    }
    let hit = null;
    let best = 30;
    for (const sp of sprites) {
      sp.getWorldPosition(wp);
      proj.copy(wp).project(camera);
      if (proj.z > 1) continue;
      const sx = (proj.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-proj.y * 0.5 + 0.5) * window.innerHeight;
      const d = Math.hypot(sx - mouse.px, sy - mouse.py);
      if (d < best) {
        best = d;
        hit = { sp, sx, sy };
      }
    }
    for (const sp of sprites) sp.scale.setScalar(sp === (hit && hit.sp) ? 0.74 : 0.56);
    if (hit) {
      tip.textContent = hit.sp.userData.name;
      tip.style.transform = `translate(${hit.sx}px, ${hit.sy + 34}px) translateX(-50%)`;
      tip.classList.add('is-on');
    } else tip.classList.remove('is-on');
  }

  // Ambient particles
  const PN = lite ? 500 : 900;
  const pp = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) {
    pp[i * 3] = (Math.random() - 0.5) * 70;
    pp[i * 3 + 1] = (Math.random() - 0.5) * 24;
    pp[i * 3 + 2] = -Math.random() * 140 + 14; // spread along the whole camera path
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const particles = new THREE.Points(
    pg,
    new THREE.PointsMaterial({ color: C.sky, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false })
  );
  scene.add(particles);
  particles.visible = true;

  // ---- Optional Blender model ----------------------------------------
  // If public/models/core.glb exists it replaces the procedural centre.
  const ready = (async () => {
    try {
      const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
      const model = gltf.scene;
      // Built in Blender in site units (core radius 1.4), so no rescaling. Meshes are recoloured by name from the theme.
      const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
      const g = {};
      model.traverse((o) => {
        if (!o.isMesh) return;
        g[o.name] = o;
        if (o.name === 'Plates') {
          o.material = new THREE.MeshStandardMaterial({ color: C.navy, metalness: 0.85, roughness: 0.3, flatShading: true });
        } else if (o.name === 'Shell') {
          o.material = glow(C.sky, 0.12);
          o.material.depthWrite = false;
        } else if (o.name === 'Inner') {
          o.material = glow(C.blue, 0.85);
        } else {
          o.material = glow(o.name === 'Frame' ? C.blue : C.sky);
        }
      });
      if (!g.Plates) throw new Error('core.glb has no Plates mesh');
      // hide the code-drawn core; the model takes its place inside the same rotating group
      Object.values(parts).forEach((m) => { m.visible = false; });
      centre.add(model);
      parts.glb = g;
      scene.userData.usingBlender = true;
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    } catch (e) {
      /* no model shipped (or it failed): the code-drawn core stays */
    }
  })();

  // ---- Interaction ----------------------------------------------------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -999, py: -999 };
  const onMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    mouse.px = e.clientX;
    mouse.py = e.clientY;
  };
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true });

  // ---- Sizing ---------------------------------------------------------
  let narrow = false;
  let sw = 0, sh = 0;
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // iOS/Android toolbars hide and show while scrolling and fire resize each time. Re-allocating the canvas then causes stutter, so small height-only changes are ignored.
    if (sw && w === sw && Math.abs(h - sh) < 160) return;
    sw = w; sh = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    narrow = w < 800;
    orbit.visible = !narrow; // phones: text covers the screen, keep it clean
    if (reduced) renderer.render(scene, camera);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- Theme ------------------------------------------------------------
  function setTheme(mode) {
    th = sceneTheme(mode, document.documentElement.getAttribute('data-accent') || 'blue');
    key.color.setHex(th.key);
    rim.color.setHex(th.rim);
    if (parts.solid) {
      parts.solid.material.color.setHex(th.solid);
      parts.solid.material.metalness = th.metal;
      parts.solid.material.roughness = th.rough;
      parts.solid.material.transparent = th.solidO < 1;
      parts.solid.material.opacity = th.solidO;
      parts.solid.material.needsUpdate = true;
      parts.wire.material.color.setHex(th.wire);
      parts.shell.material.color.setHex(th.shell);
      parts.shell.material.opacity = th.shellO;
    }
    if (parts.glb) {
      const g = parts.glb;
      g.Plates.material.color.setHex(th.solid);
      g.Plates.material.metalness = th.metal;
      g.Plates.material.roughness = th.rough;
      g.Plates.material.transparent = th.solidO < 1;
      g.Plates.material.opacity = th.solidO;
      g.Plates.material.needsUpdate = true;
      g.Frame.material.color.setHex(th.wire);
      g.Nodes.material.color.setHex(th.node);
      g.Inner.material.color.setHex(th.wire);
      g.Inner.material.opacity = th.light ? 0.55 : 0.85;
      g.Shell.material.color.setHex(th.shell);
      g.Shell.material.opacity = th.shellO;
    }
    ringMat.color.setHex(th.ring);
    ringMat.opacity = th.ringO;
    nodes.material.color.setHex(th.node);
    linkMat.color.setHex(th.link);
    linkMat.opacity = th.linkO;
    particles.material.color.setHex(th.part);
    particles.material.opacity = th.partO;
    ambient.color.setHex(th.amb);
    ambient.intensity = th.ambI;
    sprites.forEach((sp, i) => {
      const old = sp.material.map;
      sp.material.map = iconTexture(techIcons[i].path);
      sp.material.needsUpdate = true;
      if (old) old.dispose();
    });
    world.setTheme(th);
    hull.setTheme(!!th.light);
    if (reduced) renderer.render(scene, camera);
  }

  const state = { rot: 0.14 };
  // ---- Camera "shots": the camera flies between stations --------------------------
  const cam = { px: 0, py: 0, pz: 9, tx: -3.6, ty: 0, tz: 0, kick: 0 };
  const coreSt = world.stations.core;
  let current = 'hero';
  function shotPose(name) {
    const k = SHOTS[name];
    const c = world.stations[k.st].center;
    // Phones: text covers the width, so centre the object, pull back and raise it a little.
    const side = narrow ? 0 : k.side;
    const strip = narrow && ['skills', 'journey', 'projects', 'achievements', 'background', 'education'].includes(name); // phones: these titles sit under the object, so park it in the strip above
    const dist = narrow ? k.dist * (strip ? 1.9 : 1.3) : k.dist;
    const ty = c.y + (strip ? -0.3 * dist : narrow ? -0.9 : k.ty || 0);
    const tx = c.x - side;
    return { px: tx + Math.sin(k.az) * dist, py: ty + k.h, pz: c.z + Math.cos(k.az) * dist, tx, ty, tz: c.z };
  }
  function setCore() {
    core.visible = coreSt.fade > 0.25;
    orbit.visible = !narrow && core.visible;
  }
  function apply(name, instant) {
    const k = SHOTS[name];
    hull.setSection(name);
    const pose = shotPose(name);
    const d = instant || reduced ? 0 : 1;
    const dx = pose.px - cam.px, dy = pose.py - cam.py, dz = pose.pz - cam.pz;
    const far = Math.hypot(dx, dy, dz);
    const dur = d ? Math.min(3.2, 1.9 + far * 0.014) : 0;
    gsap.to(cam, { ...pose, duration: dur, ease: 'power3.inOut', overwrite: 'auto' });
    if (dur > 1.5) {
      gsap.timeline({ overwrite: 'auto' })
        .to(cam, { kick: Math.min(11, far * 0.3), duration: dur * 0.45, ease: 'power2.out' }, 0)
        .to(cam, { kick: 0, duration: dur * 0.55, ease: 'power2.inOut' });
    }
    // icons: full strength in the hero, faint behind reading text elsewhere
    sprites.forEach((sp) => gsap.to(sp.material, { opacity: name === 'hero' ? 1 : 0.22, duration: d ? 1 : 0, overwrite: true }));
    // fade stations: the one we leave dissolves first, the new one resolves as the camera arrives
    world.all.forEach((st) => {
      const on = st.key === k.st;
      const target = on ? 1 : 0;
      if (st.fade === target && !gsap.isTweening(st)) return;
      gsap.to(st, {
        fade: target,
        duration: d ? (on ? 1.2 : 0.9) : 0,
        delay: d ? (on ? dur * 0.4 : 0.15) : 0,
        ease: 'power2.inOut',
        overwrite: true,
        onUpdate: () => { world.refresh(st); if (st === coreSt) setCore(); },
        onComplete: () => { world.refresh(st); if (st === coreSt) setCore(); },
      });
    });
    gsap.to(world.shield, {
      fade: name === 'contact' ? 1 : 0,
      duration: d ? 1.4 : 0,
      delay: d && name === 'contact' ? dur * 0.6 : 0,
      overwrite: true,
      onUpdate: () => world.refresh(world.shield),
      onComplete: () => world.refresh(world.shield),
    });
    if (reduced) requestAnimationFrame(() => renderer.render(scene, camera));
  }
  Object.assign(cam, shotPose('hero'));
  apply('hero', true);
  setCore();

  function goTo(name) {
    if (!SHOTS[name]) return;
    current = name;
    apply(name);
  }
  window.addEventListener('resize', () => {
    apply(current, true);
  });

  // ---- Render loop ------------------------------------------------------
  if (!reduced) {
    const clock = new THREE.Clock();
    let lastPx = cam.px;
    let roll = 0;
    // Adaptive quality: if the device can't hold ~45 fps, lower the render resolution step by step (never raised again, so it can't flap).
    let lastNow = performance.now(), slow = 0, fastN = 0, born = lastNow;
    function watchSpeed() {
      const now = performance.now(), ms = now - lastNow;
      lastNow = now;
      if (now - born < 5000 || ms > 250 || document.hidden) return; // ignore start-up, tab switches and stalls
      slow = slow * 0.95 + ms * 0.05;
      fastN++;
      if (fastN > 90 && slow > 24 && pr > 0.75) {
        pr = Math.max(0.75, pr - 0.25);
        renderer.setPixelRatio(pr);
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        fastN = 0;
      }
    }
    renderer.setAnimationLoop(() => {
      watchSpeed();
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      if (parts.glb) {
        // nodes and inner core breathe gently
        const k = 1 + Math.sin(t * 1.8) * 0.07;
        parts.glb.Nodes.scale.setScalar(k);
        parts.glb.Inner.scale.setScalar(1 + Math.sin(t * 1.3) * 0.05);
      }
      centre.rotation.y += dt * state.rot;
      centre.rotation.x = Math.sin(t * 0.3) * 0.15;
      nodesGroup.rotation.y -= dt * state.rot * 0.5;
      nodesGroup.rotation.z += dt * 0.01;
      ring1.rotation.z += dt * 0.08;
      ring2.rotation.y -= dt * 0.06;
      orbit.rotation.y += dt * 0.14;

      core.rotation.y += (mouse.x * 0.35 - core.rotation.y) * 0.04;
      core.rotation.x += (mouse.y * 0.2 - core.rotation.x) * 0.04;
      world.all.forEach((st) => {
        if (st.key === 'core' || !st.group.visible) return;
        st.group.rotation.y += (mouse.x * 0.28 - st.group.rotation.y) * 0.04;
        st.group.rotation.x += (mouse.y * 0.14 - st.group.rotation.x) * 0.04;
      });

      // Camera: follows the shot, with mouse parallax, a little banking while flying and a field-of-view kick for speed.
      const ox = mouse.x * 0.6, oy = -mouse.y * 0.35;
      const vx = (cam.px - lastPx) / Math.max(dt, 0.001);
      lastPx = cam.px;
      roll += (THREE.MathUtils.clamp(-vx * 0.0045, -0.1, 0.1) - roll) * 0.08;
      camera.position.set(cam.px + ox, cam.py + oy, cam.pz);
      camera.up.set(Math.sin(roll), Math.cos(roll), 0);
      camera.lookAt(cam.tx + ox * 0.3, cam.ty + oy * 0.3, cam.tz);
      const fov = 45 + cam.kick;
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
      world.update(dt, t, camera);
      hull.update(dt, t, camera);

      hoverIcons();
      renderer.render(scene, camera);
    });
  } else {
    renderer.render(scene, camera);
  }

  return { goTo, ready, setTheme };
}
