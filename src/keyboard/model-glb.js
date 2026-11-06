// Loads the Blender-built PSR-S970-style keyboard (public/models/psr-s970.glb, blender/build_psr_s970.py) and dresses it
// from src/keyboard/layout.json, the same file the Blender script reads (positions measured from the manufacturer's top photo).
// Exposes the API index.js uses: keys, buttons, knobs, wheels, display, hover/active/flash, update().
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import LAY from './layout.json';
import { createLcd, MIDI_LO, MIDI_HI, isBlack } from './lcd.js';

export { MIDI_LO, MIDI_HI, isBlack };
const FONT = '"Space Grotesk Variable","Space Grotesk",system-ui,sans-serif';
const SILVER = 'rgba(214,218,226,0.88)';

// ---------------------------------------------------------------- printed panels (one canvas per tier, in photo pixels)
function paintTier(name) {
  const t = LAY.tiers[name];
  const k = name === 'cheek' ? 2.6 : 2;
  const W = Math.round((t.px1 - t.px0) * k), H = Math.round((t.py1 - t.py0) * k);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const X = (px) => (px - t.px0) * k, Y = (py) => (py - t.py0) * k;
  // satin black plastic with a very fine grain
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#0f1013'); gr.addColorStop(1, '#0a0b0d');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.06;
  for (let i = 0; i < W * H / 900; i++) { g.fillStyle = Math.random() > 0.5 ? '#fff' : '#000'; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1); }
  g.globalAlpha = 1;
  const inT = (py) => py >= t.py0 && py <= t.py1;

  if (name === 'upper') {
    // speaker grilles: dark recessed field with a fine round-hole mesh
    LAY.speakers.forEach(([x0, x1, y0, y1]) => {
      g.fillStyle = '#08090b'; g.beginPath(); g.roundRect(X(x0), Y(y0), (x1 - x0) * k, (y1 - y0) * k, 22); g.fill();
      const step = 5.2 * k;
      for (let yy = Y(y0) + 12, r = 0; yy < Y(y1) - 10; yy += step * 0.866, r++) {
        for (let xx = X(x0) + 12 + (r % 2) * step / 2; xx < X(x1) - 10; xx += step) {
          g.fillStyle = '#3a3d45'; g.beginPath(); g.arc(xx, yy, step * 0.34, 0, 7); g.fill();
          g.fillStyle = '#000'; g.beginPath(); g.arc(xx + 0.5, yy + 0.7, step * 0.24, 0, 7); g.fill();
        }
      }
      g.strokeStyle = 'rgba(210,215,225,0.16)'; g.lineWidth = 2; g.beginPath(); g.roundRect(X(x0), Y(y0), (x1 - x0) * k, (y1 - y0) * k, 22); g.stroke();
    });
    // vent slots above the speakers
    LAY.vents.forEach(([x0, x1, y0, y1]) => {
      for (let xx = x0; xx < x1; xx += 3.6) { g.fillStyle = '#050608'; g.fillRect(X(xx), Y(y0), 1.6 * k, (y1 - y0) * k); }
    });
  }

  // lines
  g.strokeStyle = 'rgba(214,218,226,0.55)'; g.lineWidth = 1.2;
  LAY.lines.forEach(([x0, x1, y]) => { if (!inT(y)) return; g.beginPath(); g.moveTo(X(x0), Y(y)); g.lineTo(X(x1), Y(y)); g.stroke(); });

  // text
  const text = (str, px, py, size, align, col, weight = 600, ls = 0.6) => {
    g.save();
    g.font = `${weight} ${size * k}px ${FONT}`;
    g.fillStyle = col || SILVER; g.textAlign = align === 'l' ? 'left' : align === 'r' ? 'right' : 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = ls * k * 0.5 + 'px';
    const lines = str.split('\n');
    lines.forEach((ln, i) => g.fillText(ln, X(px), Y(py) + (i - (lines.length - 1) / 2) * size * 1.15 * k));
    g.restore();
  };
  LAY.texts.forEach(([s, x, y, size, al, col]) => {
    if (!inT(y)) return;
    if (s === 'YAMAHA') text(s, x, y, size * 1.25, 'c', '#e4e6ea', 700, 3.5);
    else if (s === 'PSR-S970') text(s, x, y, size, 'c', col, 700, 1.5);
    else text(s, x, y, size, al, col, 600, 0.5);
  });
  // button captions
  LAY.elements.forEach((e) => {
    if (e.tier !== name || !e.lab) return;
    const big = e.kind === 'btn' || e.kind === 'led' || e.kind === 'btnflat';
    text(e.lab, e.px, e.py + (e.ldy ?? -14), big ? 6.2 : 6.6, 'c', SILVER, 600, 0.3);
  });
  // thin white edge-markers under the soft buttons A-J and the numbered row are part of TEXTS; nothing else to draw
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.flipY = false;
  return tex;
}

export async function createKeyboardGlb() {
  const base = import.meta.env.BASE_URL + 'models/';
  const [gltf, ao] = await Promise.all([
    new GLTFLoader().loadAsync(base + 'psr-s970.glb'),
    new THREE.TextureLoader().loadAsync(base + 'psr-s970-ao.png').catch(() => null),
  ]);
  const root = gltf.scene; root.name = 'PSR-S970';
  const N = {}; root.traverse((o) => { N[o.name] = o; });
  const lcd = createLcd();

  // ---- materials: satin black (like the real thing, not piano black) ----
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  const bodyMat = phys({ color: 0x0b0c0f, roughness: 0.5, metalness: 0.1, clearcoat: 0.2, clearcoatRoughness: 0.6, envMapIntensity: 0.7 });
  if (ao) { ao.flipY = false; ao.colorSpace = THREE.NoColorSpace; bodyMat.aoMap = ao; bodyMat.aoMapIntensity = 1.1; }
  const bezelMat = phys({ color: 0x050506, roughness: 0.35, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const capLight = phys({ color: 0x6d6f75, roughness: 0.5, metalness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const capDark = phys({ color: 0x1b1c20, roughness: 0.5, metalness: 0.05, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const metalMat = phys({ color: 0xc4c8d0, roughness: 0.22, metalness: 1 });
  const rubberMat = phys({ color: 0x0b0c0e, roughness: 0.7 });
  const blackKey = phys({ color: 0x0a0a0c, roughness: 0.2, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.12 });
  const whiteKey = phys({ color: 0xfffaf0, roughness: 0.4, clearcoat: 0, vertexColors: true });
  const cast = (o) => { o.castShadow = true; o.receiveShadow = true; };
  const pick = [];

  N.Body.material = bodyMat; N.Body.userData = { kind: 'body' }; cast(N.Body); pick.push(N.Body);
  N.Bezel.material = bezelMat; N.Bezel.userData = { kind: 'body' }; pick.push(N.Bezel);
  ['upper', 'ledge', 'cheek'].forEach((n) => {
    const p = N['Panel_' + n];
    p.material = phys({ map: paintTier(n), roughness: 0.55, metalness: 0.0, clearcoat: 0.1, clearcoatRoughness: 0.6, envMapIntensity: 0.35 });
    p.userData = { kind: 'body' }; p.receiveShadow = true; pick.push(p);
  });
  N.LCD.material = new THREE.MeshBasicMaterial({ map: lcd.lcdTex, toneMapped: false });
  N.Glass.material = new THREE.MeshPhysicalMaterial({ color: 0x000000, transparent: true, opacity: 0.1, roughness: 0.04, clearcoat: 1, depthWrite: false });

  // ---- keys ----
  const keys = new Map();
  for (let m = MIDI_LO; m <= MIDI_HI; m++) {
    const n = N['Key_' + m], blk = isBlack(m);
    n.material = (blk ? blackKey : whiteKey).clone();
    if (!blk) {
      const p = n.geometry.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { const tt = Math.min(1, Math.max(0, p.getZ(i) / 1.6)); const c = 0.82 + 0.18 * Math.pow(tt, 0.5); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = c; }
      n.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    n.userData = { kind: 'key', midi: m, black: blk };
    cast(n); pick.push(n);
    keys.set(m, { mesh: n, mat: n.material, black: blk, hold: 0, cur: 0, glow: 0, tint: 0, hover: 0 });
  }

  // ---- controls ----
  const buttons = new Map(), knobs = {}, wheels = {}, labels = {};
  const flatKinds = new Set(['btn', 'led', 'btnflat', 'flat', 'sq', 'round']);
  const idle = new THREE.Color(0x1a1c20);
  LAY.elements.forEach((e, i) => {
    const n = N['E' + String(i).padStart(3, '0')]; if (!n) return;
    labels[e.id] = e.label || e.lab || e.id;
    if (flatKinds.has(e.kind)) {
      const mat = (e.kind === 'flat' || e.kind === 'sq' || e.kind === 'round' ? capDark : capLight).clone();
      n.material = mat; n.userData = { kind: 'btn', id: e.id }; cast(n);
      const led = N['L' + String(i).padStart(3, '0')];
      let ledMat = null;
      if (led) { ledMat = new THREE.MeshBasicMaterial({ color: e.kind === 'led' ? 0x2a2a14 : 0x303236 }); led.material = ledMat; }
      buttons.set(e.id, { mesh: n, mat, ledMat, y0: n.position.y, dip: 0, active: false, flash: 0, led: e.kind === 'led' });
      pick.push(n);
    } else if (e.kind === 'knob' || e.kind === 'jog') {
      const id = e.id.includes(':') ? e.id.split(':')[1] : e.id;
      const parts = [];
      n.traverse((o) => { if (o.isMesh) parts.push(o); });
      parts.forEach((o) => {
        const tick = /Tick|Dimple/.test(o.name);
        o.material = e.kind === 'jog' ? (tick ? rubberMat : metalMat) : (tick ? new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }) : rubberMat);
        o.userData = { kind: 'knob', id }; cast(o); pick.push(o);
      });
      const kn = { grp: n, value: 0.5, jog: e.kind === 'jog' };
      kn.set = (v) => { kn.value = v; n.rotation.y = -(v - 0.5) * Math.PI * (kn.jog ? 5 : 1.5); };
      kn.set(0.5);
      knobs[id] = kn;
    } else if (e.kind === 'wheel') {
      const id = e.id.split(':')[1];
      const wm = N['Wm_' + n.name];
      wm.traverse((o) => { if (o.isMesh) { o.material = rubberMat; o.userData = { kind: 'wheel', id }; cast(o); pick.push(o); } });
      n.traverse((o) => { if (o.isMesh && /Slot/.test(o.name)) { o.material = capDark; o.userData = { kind: 'body' }; pick.push(o); } });
      wheels[id] = { grp: wm, value: 0 };
    }
  });

  // YAMAHA wordmark on the bezel, above the screen (tribute; not affiliated with Yamaha)
  { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d');
    g.font = `700 64px ${FONT}`; g.fillStyle = '#e4e6ea'; g.textAlign = 'center'; g.textBaseline = 'middle'; if ('letterSpacing' in g) g.letterSpacing = '10px';
    g.fillText('YAMAHA', 256, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.14), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false }));
    const [bx0, by0, bx1] = LAY.display.bezel, zU = LAY.tiers.upper.z0;
    m.rotation.x = -Math.PI / 2;
    m.position.set((bx0 + bx1) / 2 * LAY.S - 1000 * LAY.S, 0.1062, (by0 + 29) * LAY.S - 2.45 - zU);
    N.Frame_upper.add(m); }

  // the display lights the panel a little
  const glow = new THREE.PointLight(0x5aa0ff, 4, 4, 2);
  glow.position.set(0, 0.6, -0.1);
  N.Frame_upper.add(glow);

  // ---- API ----
  const accent = new THREE.Color(0x7fb4ff), gold = new THREE.Color(0xffc24a);
  const dummyEm = new THREE.Color();
  const hold = (midi, d, tint = 0) => { const k = keys.get(midi); if (!k) return; k.hold = Math.max(0, k.hold + d); if (d > 0) k.tint = tint; };
  const setHover = (midi) => keys.forEach((k, m) => { k.hoverTarget = m === midi ? 1 : 0; });
  const setActive = (id, on) => { const b = buttons.get(id); if (b) b.active = on; };
  const flash = (id) => { const b = buttons.get(id); if (b) { b.dip = 1; b.flash = 1; } };
  const setAccent = (c) => accent.set(c);

  function update(dt) {
    keys.forEach((k) => {
      const target = k.hold > 0 ? 1 : 0;
      k.cur += (target - k.cur) * (1 - Math.exp(-dt * (target ? 55 : 15)));
      k.hover += ((k.hoverTarget || 0) - k.hover) * (1 - Math.exp(-dt * 14));
      k.mesh.rotation.x = k.cur * (k.black ? 0.045 : 0.052) + k.hover * 0.004;
      k.glow += (target - k.glow) * (1 - Math.exp(-dt * (target ? 30 : 5)));
      const c = k.tint ? gold : accent;
      if (k.glow > 0.01) k.mat.emissive.copy(c).multiplyScalar(k.glow * (k.black ? 0.7 : 0.5));
      else if (k.mat.emissive.r + k.mat.emissive.g + k.mat.emissive.b > 0) k.mat.emissive.setRGB(0, 0, 0);
    });
    buttons.forEach((b) => {
      b.dip += (0 - b.dip) * (1 - Math.exp(-dt * 12));
      b.flash += (0 - b.flash) * (1 - Math.exp(-dt * 4));
      b.mesh.position.y = b.y0 - b.dip * 0.03;
      const lvl = Math.max(b.active ? 1 : 0, b.flash);
      if (b.ledMat) { if (b.led) b.ledMat.color.setRGB(0.16, 0.16, 0.08).lerp(new THREE.Color(0xffd23a), lvl); else b.ledMat.color.copy(idle).lerp(accent, lvl); }
      else if (lvl > 0.02) b.mat.emissive.copy(accent).multiplyScalar(lvl * 0.25); else b.mat.emissive.setRGB(0, 0, 0);
    });
    if (wheels.pitch) wheels.pitch.grp.rotation.x = wheels.pitch.value * 0.5;
    if (wheels.mod) wheels.mod.grp.rotation.x = wheels.mod.value * 0.5;
    lcd.update(dt);
  }

  return {
    root, keys, buttons, knobs, wheels, labels, pickables: pick, state: lcd.state, setLcd: lcd.setLcd,
    hold, setHover, setActive, flash, setAccent, update, glb: true, width: 10.22, depth: 4.5,
  };
}
