// Two football worlds as the portfolio background (all original; no club crests, no competition logos):
//   World 1: an English floodlit ground at dusk (four close stands, open corners, floodlight pylons).
//   World 2: a grand European bowl at night (continuous roof ring, light strip, glowing facade).
// Scroll = camera flight. Own canvas + renderer under the Secure Core layer.
import * as THREE from 'three';

const SECTION_IDS = ['hero', 'about', 'profile', 'background', 'education', 'map', 'skills', 'journey', 'projects', 'achievements', 'contact'];
const UX = 520; // the second stadium stands this far along x
// camera position p, look-at l, field of view f, and an extra arc height h for the flight between worlds
const KEY = [
  { p: [-50, 2.0, 7], l: [30, 9, -4], f: 52 },          // hero: pitch level behind the goal, floodlights ahead
  { p: [44, 3.2, 27], l: [-6, 15, -40], f: 54 },        // about: from the corner, up at the main stand and its roof
  { p: [-30, 24, 52], l: [22, 8, -8], f: 50 },          // profile: high behind the far stand, pylon in frame
  { p: [-2, 1.3, 30], l: [4, 6, -44], f: 56 },          // background: touchline, the crowd on its feet
  { p: [3, 52, 14], l: [0, 0, -2], f: 46 },             // education: above the centre circle
  { p: [14, 0.7, 6], l: [28, 0.7, 2], f: 48 },          // map: grass macro
  { p: [UX - 110, 46, 125], l: [UX, 20, 0], f: 50, h: 40 }, // skills: arriving at the second stadium, outside
  { p: [UX - 62, 42, 46], l: [UX + 6, 6, -2], f: 52 },  // journey: inside the bowl
  { p: [UX + 4, 26, -52], l: [UX - 6, 1, 10], f: 50 },  // projects
  { p: [UX + 2, 1.6, -12], l: [UX + 2, 40, 12], f: 58 },// achievements: looking up at the roof lights
  { p: [UX + 6, 128, 166], l: [UX, 6, 0], f: 48 },      // contact: the whole stadium, wide
];

const rnd = (a, b) => a + Math.random() * (b - a);
const smooth = (x) => x * x * (3 - 2 * x);
const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<5;i++){ s += a*vnoise(p); p *= 2.02; a *= 0.5; } return s; }
`;

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ------------------------------------------------------------------ textures
function pitchTexture() {
  const W = 125, H = 88, S = 16;
  return canvasTex(W * S, H * S, (g, w, h) => {
    g.fillStyle = '#1d4d27'; g.fillRect(0, 0, w, h);
    const x0 = (W - 105) / 2 * S, y0 = (H - 68) / 2 * S;
    for (let i = 0; i < 15; i++) { g.fillStyle = i % 2 ? '#2b6c31' : '#347a39'; g.fillRect(x0 + i * 7 * S, y0, 7 * S, 68 * S); }
    g.globalAlpha = 0.09;
    for (let i = 0; i < 90000; i++) { g.fillStyle = Math.random() > 0.5 ? '#0b2a10' : '#8fd06a'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 2); }
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(244,247,240,0.92)'; g.lineWidth = 2.4;
    const cx = w / 2, cy = h / 2, m = (v) => v * S;
    g.strokeRect(x0, y0, m(105), m(68));
    g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y0 + m(68)); g.stroke();
    g.beginPath(); g.arc(cx, cy, m(9.15), 0, 7); g.stroke();
    g.beginPath(); g.arc(cx, cy, 4, 0, 7); g.fillStyle = '#f4f7f0'; g.fill();
    for (const s of [-1, 1]) {
      const gx = cx + s * m(52.5);
      g.strokeRect(s < 0 ? gx : gx - m(16.5), cy - m(20.15), m(16.5), m(40.3));
      g.strokeRect(s < 0 ? gx : gx - m(5.5), cy - m(9.15), m(5.5), m(18.3));
      const px = gx - s * m(11);
      g.beginPath(); g.arc(px, cy, 4, 0, 7); g.fill();
      g.beginPath(); g.arc(px, cy, m(9.15), s < 0 ? -0.93 : Math.PI - 0.93, s < 0 ? 0.93 : Math.PI + 0.93); g.stroke();
    }
  });
}
function grassBump() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = Math.floor(rnd(60, 200)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * w, Math.random() * h, 1, rnd(2, 5)); }
  }, false);
}
function seatTexture(seatCols, shirts) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = seatCols[0]; g.fillRect(0, 0, w, h);
    const cols = 16, rows = 8, cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw, y = r * rh;
      g.fillStyle = seatCols[(c + r) % seatCols.length === 0 ? 0 : 1]; g.fillRect(x + 1, y + 1, cw - 2, rh - 2);
      if (Math.random() < 0.88) {
        const sh = shirts[Math.floor(Math.random() * shirts.length)];
        g.fillStyle = sh; g.fillRect(x + 3, y + rh * 0.45, cw - 6, rh * 0.55);
        g.fillStyle = ['#e8c4a0', '#c99472', '#8a5a3c', '#f0d2b4'][Math.floor(Math.random() * 4)];
        g.beginPath(); g.arc(x + cw / 2, y + rh * 0.3, cw * 0.2, 0, 7); g.fill();
      }
    }
    // soften: darken + gradient per row so the crowd reads as a mass, not confetti
    g.fillStyle = 'rgba(8,10,18,0.38)'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) { const gr = g.createLinearGradient(0, r * rh, 0, (r + 1) * rh); gr.addColorStop(0, 'rgba(0,0,0,0.32)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, r * rh, w, rh); }
  });
}
function facadeTexture(col) {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#0a0c12'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { const hh = rnd(0.4, 1) * h; g.fillStyle = col; g.globalAlpha = rnd(0.35, 1); g.fillRect(x + 2, h - hh, 3, hh); }
    g.globalAlpha = 1;
  });
}
function boardTexture(a, b) {
  return canvasTex(512, 32, (g, w, h) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b;
    for (let x = -h; x < w; x += 44) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 22, 0); g.lineTo(x + 22 + h * 0.6, h / 2); g.lineTo(x + 22, h); g.lineTo(x, h); g.lineTo(x + h * 0.6, h / 2); g.fill(); }
  });
}
function lampTexture() {
  return canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = '#10131a'; g.fillRect(0, 0, w, h);
    for (let y = 6; y < h; y += 16) for (let x = 6; x < w; x += 16) { const r = g.createRadialGradient(x + 5, y + 5, 0, x + 5, y + 5, 7); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = r; g.fillRect(x - 2, y - 2, 14, 14); }
  });
}

// ------------------------------------------------------------------ geometry helpers
function sloped(L, run, rise, mat, repX, repY) { // a sloped seating plane, local frame: x along, z back, y up
  const slope = Math.hypot(run, rise), g = new THREE.PlaneGeometry(L, slope);
  g.rotateX(-Math.PI / 2 - Math.atan2(rise, run)); // lies on the slope (rising toward +z), normal up/forward
  const m = new THREE.Mesh(g, mat); m.position.set(0, rise / 2, run / 2); return m;
}
const superellipse = (A, B, n, s, t) => {
  const c = Math.cos(t), sn = Math.sin(t);
  return [A * s * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), B * s * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n)];
};
function ringStrip(A, B, n, s0, y0, s1, y1, segs, mat, rep) { // band between two rounded-rectangle outlines
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const [x0, z0] = superellipse(A, B, n, s0, t), [x1, z1] = superellipse(A, B, n, s1, t);
    pos.push(x0, y0, z0, x1, y1, z1); uv.push(i / segs * rep[0], 0, i / segs * rep[0], rep[1]);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

export function initStadium() {
  const lite = window.innerWidth < 800 || (navigator.hardwareConcurrency || 8) <= 4;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas'); canvas.id = 'ocean'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, powerPreference: 'high-performance' }); } catch (e) { return null; }
  const host = document.getElementById('scene'); host.parentNode.insertBefore(canvas, host);
  document.documentElement.dataset.ocean = '1'; // flag read by scene.js / css: this canvas owns the background
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.25 : 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.3, 1200);
  scene.fog = new THREE.FogExp2(0x182036, 0.004);
  const U = { uTime: { value: 0 }, uBlend: { value: 0 }, uLight: { value: 0 }, uFlash: { value: 0 } };

  // ---------------------------------------------------------------- sky
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { ...U, uT0: { value: new THREE.Color() }, uH0: { value: new THREE.Color() }, uT1: { value: new THREE.Color() }, uH1: { value: new THREE.Color() }, uSun0: { value: new THREE.Vector3(0.6, 0.06, -0.8).normalize() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uT0,uH0,uT1,uH1,uSun0; uniform float uBlend,uTime,uLight; ${NOISE}
      void main(){ vec3 d = normalize(vD); float h = clamp(d.y,0.0,1.0);
        vec3 top = mix(uT0,uT1,uBlend), hor = mix(uH0,uH1,uBlend);
        vec3 c = mix(hor, top, pow(h, 0.55));
        vec2 cp = d.xz/(abs(d.y)+0.25)*2.2 + vec2(uTime*0.004,0.0);
        float cl = smoothstep(0.45,0.8,fbm(cp)) * smoothstep(0.0,0.22,h) * (1.0-uBlend*0.65);
        c = mix(c, hor*1.15+vec3(0.05), cl*0.55);
        float sun = pow(max(dot(d,uSun0),0.0), 48.0) * (1.0-uBlend);
        c += vec3(1.0,0.6,0.32)*sun*0.9*(1.0-uLight*0.5);
        c = mix(c, hor, smoothstep(0.02,-0.05,d.y)); // below the horizon: haze
        gl_FragColor = vec4(c,1.0); gl_FragColor = linearToOutputTexel(gl_FragColor); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  const PALS = {
    dark: { t0: '#16264f', h0: '#d8825a', t1: '#03050d', h1: '#16204a', fog0: '#4a3a4a', fog1: '#0b1230' },
    light: { t0: '#6ea9e6', h0: '#e6eef6', t1: '#8497cc', h1: '#d9dcef', fog0: '#d4dfec', fog1: '#c9cfe6' },
  };

  // ---------------------------------------------------------------- shared materials
  const pitchMap = pitchTexture(), bump = grassBump(); bump.repeat.set(70, 48);
  const pitchMat = new THREE.MeshStandardMaterial({ map: pitchMap, bumpMap: bump, bumpScale: 1.6, roughness: 1, metalness: 0, color: 0xc8c8c8 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0x555a63, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1e26, roughness: 0.7, metalness: 0.4 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a5062, roughness: 0.6, metalness: 0.35, side: THREE.DoubleSide });
  const glowWhite = new THREE.MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false });
  const glowCool = new THREE.MeshBasicMaterial({ color: 0xbcd8ff, toneMapped: false });
  let boardTex = null;
  const flashPoints = []; // crowd camera flashes
  const spots = [], lampGlows = [], cones = [];

  const coneMat = (col) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uCol: { value: new THREE.Color(col) }, uInt: { value: 1 }, uTime: U.uTime },
    vertexShader: 'varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vN, vV; uniform vec3 uCol; uniform float uInt, uTime;
      void main(){ float f = pow(abs(dot(normalize(vN), vV)), 1.7); float along = smoothstep(0.0,0.25,vUv.y)*(1.0-vUv.y*0.75);
        float a = f*along*0.2*uInt*(0.85+0.15*sin(uTime*1.3+vUv.x*20.0));
        gl_FragColor = vec4(uCol*a, a); gl_FragColor = linearToOutputTexel(gl_FragColor); }`,
  });
  function floodlight(parent, pos, target, tint, sx = 1) {
    const g = new THREE.Group(); g.position.copy(pos); parent.add(g);
    const head = new THREE.Mesh(new THREE.BoxGeometry(10 * sx, 7 * sx, 0.7), new THREE.MeshBasicMaterial({ map: lampTexture(), toneMapped: false }));
    g.add(head); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(target, pos, new THREE.Vector3(0, 1, 0)));
    const back = new THREE.Mesh(new THREE.BoxGeometry(10.6 * sx, 7.6 * sx, 0.5), dark); back.position.z = -0.6; g.add(back);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: tint, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9, fog: false }));
    glow.scale.setScalar(34 * sx); glow.position.z = 1.5; g.add(glow); lampGlows.push(glow);
    const sp = new THREE.SpotLight(tint, 0, 190, 0.62, 0.9, 1.3); sp.position.copy(pos); sp.target.position.copy(target); parent.add(sp, sp.target); spots.push(sp);
    if (!lite) {
      const len = pos.distanceTo(target) * 0.9;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(len * 0.32, len, 28, 1, true), coneMat(tint)); cone.geometry.translate(0, -len / 2, 0); cone.geometry.rotateX(-Math.PI / 2);
      cone.position.copy(pos); cone.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(target, pos, new THREE.Vector3(0, 1, 0))); parent.add(cone); cones.push(cone);
    }
    return g;
  }
  const GLOW = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,240,215,0.5)'); r.addColorStop(1, 'rgba(255,230,200,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });

  function crowdFlashes(parent, samples) {
    const n = samples.length, pos = new Float32Array(n * 3), seed = new Float32Array(n);
    samples.forEach((p, i) => { pos.set(p, i * 3); seed[i] = Math.random(); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { ...U, uScale: { value: 600 } },
      vertexShader: `attribute float aSeed; uniform float uTime, uFlash, uScale; varying float vA;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; float rate = 0.22 + uFlash*1.6;
          float ph = fract(uTime*rate + aSeed*7.0); vA = pow(max(0.0, 1.0 - ph*14.0), 2.0);
          gl_PointSize = clamp(uScale/(-mv.z)*(1.4+aSeed), 1.5, 9.0)*(0.4+vA); }`,
      fragmentShader: `varying float vA; void main(){ float r = length(gl_PointCoord-0.5)*2.0; float a = smoothstep(1.0,0.0,r)*vA; gl_FragColor = vec4(vec3(1.0,0.97,0.9)*a, a); gl_FragColor = linearToOutputTexel(gl_FragColor); }`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; parent.add(pts); flashPoints.push(m);
  }

  // ---------------------------------------------------------------- pitch builder (used by both worlds)
  function pitch(parent) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(125, 88), pitchMat); p.rotation.x = -Math.PI / 2; parent.add(p);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; parent.add(ground);
    // goals
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * 52.5, 0, 0);
      const post = (z, h) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 8), new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })); m.position.set(0, h / 2, z); g.add(m); };
      post(-3.66, 2.44); post(3.66, 2.44);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7.32, 8), new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })); bar.rotation.x = Math.PI / 2; bar.position.y = 2.44; g.add(bar);
      const net = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.2, 2.44, 7.32, 4, 6, 18)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); net.position.set(s * 1.1, 1.22, 0); g.add(net);
      parent.add(g);
    }
    // advertising boards (original abstract chevrons, animated)
    const bt = boardTexture('#12151f', '#e9eef7'); bt.repeat.set(26, 1); boardTex = bt;
    const bm = new THREE.MeshBasicMaterial({ map: bt, toneMapped: false });
    const bl = (len, x, z, ry) => { const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.9, 0.15), bm); m.position.set(x, 0.45, z); m.rotation.y = ry; parent.add(m); };
    bl(112, 0, 38.5, 0); bl(112, 0, -38.5, 0); bl(80, 57.5, 0, Math.PI / 2); bl(80, -57.5, 0, Math.PI / 2);
  }

  // ================================================================== WORLD 1: the English ground (dusk)
  const epl = new THREE.Group(); scene.add(epl); pitch(epl);
  const eplFlashSamples = [];
  const seatEpl = seatTexture(['#27305a', '#2f3a6e'], ['#c4202e', '#f0f0f0', '#223a8f', '#e8c14a', '#2b2b2b', '#c4202e']);
  function eplStand(L, d, rotY, x, z, tall) {
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = rotY; epl.add(s);
    const tMat = (len, slope) => { const t = seatEpl.clone(); t.needsUpdate = true; t.repeat.set(len / 10, slope / 5); const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.22, roughness: 0.85 }); return m; };
    const lowRun = 13, lowRise = 10 + tall, upRun = 17, upRise = 17 + tall * 1.5;
    const lower = sloped(L, lowRun, lowRise, tMat(L, Math.hypot(lowRun, lowRise)), 1, 1); lower.position.y += 1.2; s.add(lower);
    const upper = sloped(L, upRun, upRise, tMat(L, Math.hypot(upRun, upRise)), 1, 1); upper.position.set(0, lowRise + 3.4 + upRise / 2 - 0.0, lowRun + 2 + upRun / 2); s.add(upper);
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(L, 1.4, 0.4), dark); frontWall.position.set(0, 0.7, -0.2); s.add(frontWall);
    const concourse = new THREE.Mesh(new THREE.BoxGeometry(L, 2.6, 2), concrete); concourse.position.set(0, lowRise + 1.2 + 0.6, lowRun + 1); s.add(concourse);
    const back = new THREE.Mesh(new THREE.BoxGeometry(L, lowRise + upRise + 14, 1.2), new THREE.MeshStandardMaterial({ color: 0x3a2a26, roughness: 0.95 })); back.position.set(0, (lowRise + upRise + 14) / 2, lowRun + 2 + upRun + 0.6); s.add(back);
    for (const sx of [-1, 1]) { // side walls so the end of the stand is closed
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, 1.2 + lowRise); sh.lineTo(lowRun, 1.2 + lowRise); sh.lineTo(lowRun + 2, lowRise + 3.4); sh.lineTo(lowRun + 2 + upRun, lowRise + 3.4 + upRise); sh.lineTo(lowRun + 2 + upRun + 1.2, lowRise + 3.4 + upRise); sh.lineTo(lowRun + 2 + upRun + 1.2, 0);
      const e = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: false }), concrete); e.rotation.y = -Math.PI / 2; e.position.x = sx * L / 2 + (sx > 0 ? 0.5 : 0); s.add(e);
    }
    // roof: cantilever with lit underside and trusses
    const roofY = lowRise + upRise + 9, rz = lowRun + 2 + upRun / 2 + 3;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(L + 2, 0.7, upRun + lowRun + 12), roofMat); roof.position.set(0, roofY, rz - 1); roof.rotation.x = 0.07; s.add(roof);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(L + 2, 0.5, 0.9), glowWhite); lip.position.set(0, roofY - 1.2, rz - (upRun + lowRun + 12) / 2 - 0.4); s.add(lip);
    for (let x = -L / 2 + 6; x < L / 2; x += 12) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.7, roofY, 0.7), dark); col.position.set(x, roofY / 2, lowRun + 2 + upRun + 0.8); s.add(col);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 26), dark); br.position.set(x, roofY - 2.4, rz - 6); br.rotation.x = 0.28; s.add(br);
    }
    // the sampled crowd positions for camera flashes
    const n = lite ? 40 : 110;
    for (let i = 0; i < n; i++) {
      const upperTier = Math.random() > 0.45, u = Math.random(), x = rnd(-L / 2, L / 2);
      const p = upperTier ? [x, lowRise + 3.4 + upRise * u + 0.9, lowRun + 2 + upRun * u] : [x, 1.2 + lowRise * u + 0.9, lowRun * u];
      const v = new THREE.Vector3(...p).applyEuler(new THREE.Euler(0, rotY, 0)).add(new THREE.Vector3(x0(s), 0, z0(s))); eplFlashSamples.push(v.toArray());
    }
    return s;
  }
  const x0 = (s) => s.position.x, z0 = (s) => s.position.z;
  const D = 6.5;
  eplStand(118, 0, 0, 0, 34 + D, 0); eplStand(118, 0, Math.PI, 0, -(34 + D), 2); eplStand(74, 0, Math.PI / 2, 52.5 + D, 0, 0); eplStand(74, 0, -Math.PI / 2, -(52.5 + D), 0, 0);
  crowdFlashes(epl, eplFlashSamples);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * 76, pz = sz * 52, h = 50;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.1, h, 10), new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.5, metalness: 0.7 })); pole.position.set(px, h / 2, pz); epl.add(pole);
    floodlight(epl, new THREE.Vector3(px - sx * 3, h + 3, pz - sz * 3), new THREE.Vector3(-sx * 8, 0, -sz * 5), 0xfff0d4, 1.2);
  }

  // ================================================================== WORLD 2: the European bowl (night)
  const ucl = new THREE.Group(); ucl.position.x = UX; scene.add(ucl); pitch(ucl);
  const A = 62, B = 44, N = 4, SEG = lite ? 120 : 220;
  const seatUcl = seatTexture(['#14284a', '#1d3a68'], ['#ffffff', '#cfd9ee', '#3a5cc4', '#f0f0f0', '#7b8bbf', '#1c2d66']);
  const bowlMat = (rx, ry) => { const t = seatUcl.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.85, side: THREE.DoubleSide }); };
  const per = 2 * (A + B) * 1.1;
  const lowerT = ringStrip(A, B, N, 1.0, 2.2, 1.36, 14.5, SEG, bowlMat(per / 8, 3), [1, 1]); ucl.add(lowerT);
  const rail = ringStrip(A, B, N, 1.36, 14.5, 1.44, 16, SEG, new THREE.MeshStandardMaterial({ color: 0x20242e, roughness: 0.6, side: THREE.DoubleSide }), [1, 1]); ucl.add(rail);
  const upperT = ringStrip(A, B, N, 1.44, 16, 1.92, 36, SEG, bowlMat(per * 1.5 / 8, 5), [1, 1]); ucl.add(upperT);
  const facade = ringStrip(A, B, N, 2.02, 0, 2.02, 46, SEG, new THREE.MeshStandardMaterial({ map: facadeTexture('#7fb4ff'), emissiveMap: facadeTexture('#7fb4ff'), emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.6, side: THREE.DoubleSide }), [1, 1]); facade.material.map.repeat.set(10, 1); facade.material.emissiveMap.repeat.set(10, 1); ucl.add(facade);
  const roofTop = ringStrip(A, B, N, 1.14, 42, 2.04, 47, SEG, roofMat, [1, 1]); ucl.add(roofTop);
  const roofUnder = ringStrip(A, B, N, 1.14, 41.4, 2.0, 46.2, SEG, new THREE.MeshStandardMaterial({ color: 0x151822, roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide }), [1, 1]); ucl.add(roofUnder);
  for (const [s0, s1, y] of [[1.13, 1.17, 41.6], [1.5, 1.52, 42.6], [1.78, 1.8, 44.2]]) ucl.add(ringStrip(A, B, N, s0, y, s1, y + 0.1, SEG, s0 < 1.2 ? glowCool : glowWhite, [1, 1]));
  const uclSamples = [];
  for (let i = 0; i < (lite ? 120 : 360); i++) { const t = Math.random() * Math.PI * 2, up = Math.random() > 0.4, k = Math.random(); const s = up ? 1.44 + 0.48 * k : 1.0 + 0.36 * k, y = up ? 16 + 20 * k : 2.2 + 12.3 * k; const [x, z] = superellipse(A, B, N, s, t); uclSamples.push([x, y + 0.9, z]); }
  crowdFlashes(ucl, uclSamples);
  for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2 + 0.5; const [x, z] = superellipse(A, B, N, 1.14, t); floodlight(ucl, new THREE.Vector3(x, 40.2, z), new THREE.Vector3(-x * 0.1, 0, -z * 0.1), 0xdde9ff, 0.9); }

  // ---------------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0x8fa6d8, 0x1a1c24, 0.6); scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x6070a0, 0.25); scene.add(ambient);

  // ---------------------------------------------------------------- state
  let tops = [], nav = { p: [...KEY[0].p], l: [...KEY[0].l], f: KEY[0].f }, vel = 0, last = [...KEY[0].p];
  let light = document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0, lightT = light; U.uLight.value = light;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }; let boost = 0;
  if (!reduced) window.addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / innerWidth - 0.5) * 2; mouse.ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  new MutationObserver(() => { lightT = document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0; if (reduced) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const measure = () => { let lastTop = 0; tops = SECTION_IDS.map((id) => { const el = document.getElementById(id); if (!el) return lastTop; lastTop = el.getBoundingClientRect().top + scrollY; return lastTop; }); };
  function target() {
    const s = scrollY + innerHeight * 0.5; let i = 0;
    while (i < tops.length - 1 && tops[i + 1] <= s) i++;
    if (i >= tops.length - 1) return { p: KEY[KEY.length - 1].p, l: KEY[KEY.length - 1].l, f: KEY[KEY.length - 1].f };
    const f = smooth(Math.min(1, Math.max(0, (s - tops[i]) / Math.max(1, tops[i + 1] - tops[i])))), a = KEY[i], b = KEY[i + 1];
    const mix = (u, v) => u.map((x, k) => x + (v[k] - x) * f);
    const p = mix(a.p, b.p); p[1] += Math.sin(f * Math.PI) * (b.h || 0) * (i === 5 ? 3 : 1);
    return { p, l: mix(a.l, b.l), f: a.f + (b.f - a.f) * f };
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    for (const m of flashPoints) m.uniforms.uScale.value = innerHeight * renderer.getPixelRatio() * 0.8; measure();
  }
  addEventListener('resize', resize); resize();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  addEventListener('load', measure);

  const colA = new THREE.Color(), colB = new THREE.Color(), look = new THREE.Vector3(), tmp = new THREE.Vector3();
  let time = 0;
  function draw(dt) {
    time += dt;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3.4), tg = target();
    for (let i = 0; i < 3; i++) { nav.p[i] += (tg.p[i] - nav.p[i]) * k; nav.l[i] += (tg.l[i] - nav.l[i]) * k; }
    nav.f += (tg.f - nav.f) * k;
    const sp = dt > 0 ? Math.hypot(nav.p[0] - last[0], nav.p[1] - last[1], nav.p[2] - last[2]) / dt : 0; last = [...nav.p]; vel += (sp - vel) * 0.08;
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    light += (lightT - light) * (reduced ? 1 : 1 - Math.exp(-dt * 2.5)); U.uLight.value = light;
    boost += (0 - boost) * (1 - Math.exp(-dt * 1.6)); U.uFlash.value = boost;
    const blend = smooth(Math.min(1, Math.max(0, (nav.p[0] - 140) / 220))); U.uBlend.value = blend; U.uTime.value = time;

    // sky + fog from the theme palette
    const P = light > 0.5 ? PALS.light : PALS.dark, Q = light > 0.5 ? PALS.dark : PALS.light, w = light > 0.5 ? 1 - Math.abs(light - 1) * 0 : 0;
    const pick = (key) => { colA.set(PALS.dark[key]); colB.set(PALS.light[key]); return colA.lerp(colB, light); };
    skyMat.uniforms.uT0.value.copy(pick('t0')); skyMat.uniforms.uH0.value.copy(pick('h0')); skyMat.uniforms.uT1.value.copy(pick('t1')); skyMat.uniforms.uH1.value.copy(pick('h1'));
    const f0 = new THREE.Color(PALS.dark.fog0).lerp(new THREE.Color(PALS.light.fog0), light), f1 = new THREE.Color(PALS.dark.fog1).lerp(new THREE.Color(PALS.light.fog1), light);
    scene.fog.color.copy(f0.lerp(f1, blend)); scene.fog.density = (0.0042 + 0.0012 * blend) * (1 + light * 0.6);
    hemi.intensity = (0.55 - 0.25 * blend) * (1 + light * 1.4); hemi.color.set(blend > 0.5 ? 0x7f98d8 : 0xe8a780).lerp(new THREE.Color(0xdbe8ff), light);
    ambient.intensity = 0.2 + light * 0.45;
    const lamp = (1 - light * 0.88) * (1 + boost * 0.35);
    spots.forEach((s) => { s.intensity = 5200 * lamp; });
    lampGlows.forEach((g) => { g.material.opacity = 0.9 * (1 - light * 0.85) * (1 + boost * 0.3); });
    cones.forEach((c) => { c.material.uniforms.uInt.value = (1 - light * 0.8) * (1 + boost * 0.8); });
    if (boardTex) boardTex.offset.x = (time * 0.05) % 1;

    // camera
    const ph = reduced ? 0 : time;
    camera.position.set(nav.p[0] + mouse.x * 1.1 + Math.sin(ph * 0.2) * 0.35, nav.p[1] - mouse.y * 0.6 + Math.sin(ph * 0.31) * 0.12, nav.p[2]);
    look.set(nav.l[0] + mouse.x * 2.4, nav.l[1] - mouse.y * 1.2, nav.l[2]); camera.lookAt(look);
    camera.fov = nav.f + Math.min(5, vel * 0.04); camera.updateProjectionMatrix();
    sky.position.copy(camera.position);
    renderer.render(scene, camera);
  }
  if (location.search.includes('kbdebug')) window.__ocean = { renderer, scene, camera, nav, snap: () => { const t = target(); nav.p = [...t.p]; nav.l = [...t.l]; nav.f = t.f; } };
  let visible = true; document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  if (!reduced) { const clock = new THREE.Clock(); renderer.setAnimationLoop(() => { if (!visible) return; draw(Math.min(clock.getDelta(), 0.05)); }); }
  else { draw(0); addEventListener('scroll', () => requestAnimationFrame(() => draw(0)), { passive: true }); addEventListener('resize', () => draw(0)); }
  return { renderer, scene, camera };
}
