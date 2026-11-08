// The abandoned space station: the hull the camera flies through, and the deep space and Earth beyond it.
// Everything here is procedural and original. The camera path runs along -z (see SHOTS in scene.js).
import * as THREE from 'three';

const R = 38; // hull radius around the z axis (large, so girders never graze the camera)

function panelTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#4a5364';
  g.fillRect(0, 0, 512, 512);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 16; i++) { // plates of slightly different tone
    const x = (i % 4) * 128, y = Math.floor(i / 4) * 128, v = 62 + rnd() * 30;
    g.fillStyle = `rgb(${v},${v + 6},${v + 18})`;
    g.fillRect(x + 2, y + 2, 124, 124);
  }
  g.strokeStyle = 'rgba(8,10,16,0.9)'; g.lineWidth = 3;
  for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 512); g.moveTo(0, i * 128); g.lineTo(512, i * 128); g.stroke(); }
  g.fillStyle = 'rgba(210,220,235,0.35)';
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (const [dx, dy] of [[12, 12], [116, 12], [12, 116], [116, 116]]) { g.beginPath(); g.arc(i * 128 + dx, j * 128 + dy, 2.2, 0, 7); g.fill(); }
  for (let i = 0; i < 260; i++) { // wear and grime
    g.fillStyle = `rgba(${rnd() > 0.5 ? '0,0,0' : '160,170,190'},${0.04 + rnd() * 0.08})`;
    g.fillRect(rnd() * 512, rnd() * 512, 6 + rnd() * 60, 2 + rnd() * 10);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const NOISE = `
float h3(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * n3(p); p *= 2.03; a *= .5; } return s; }
`;

function makeEarth(lite) {
  const base = import.meta.env.BASE_URL || '/';
  const g = new THREE.Group();
  const loader = new THREE.TextureLoader();
  const sun = new THREE.Vector3(-0.4, 0.2, 0.9).normalize();
  const tex = (name, srgb) => {
    const t = loader.load(`${base}earth/${name}`, () => { mat.uniforms.uReady.value += 1; });
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = lite ? 2 : 8;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: sun }, uDim: { value: lite ? 0.5 : 1 }, uTime: { value: 0 }, uReady: { value: 0 },
      uDay: { value: tex(lite ? 'day-2k.webp' : 'day-4k.webp', true) },
      uNight: { value: tex('night-2k.webp', true) },
      uClouds: { value: tex('clouds-2k.webp', false) },
      uWater: { value: tex('water-1k.webp', false) },
    },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying vec2 vUv;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(position,1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: `
      uniform vec3 uSun; uniform float uDim; uniform float uTime; uniform float uReady;
      uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uClouds; uniform sampler2D uWater;
      varying vec3 vN; varying vec3 vW; varying vec2 vUv;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float d = dot(N, uSun);
        vec3 day = texture2D(uDay, vUv).rgb;
        vec3 night = texture2D(uNight, vUv).rgb;
        float cl = texture2D(uClouds, vUv + vec2(uTime * 0.0000035, 0.)).r;
        float water = texture2D(uWater, vUv).r;
        float lit = smoothstep(-0.06, 0.22, d);
        // day side: albedo, a touch of cloud shadow, then clouds on top
        vec3 col = day * (1.0 - 0.22 * cl);
        float cc = pow(cl, 1.5);
        col = mix(col, vec3(0.93, 0.95, 0.98), cc * 0.78);
        col *= 0.05 + 0.98 * max(d, 0.0); // slightly dimmed so text over it stays readable
        // sun glint on the ocean
        vec3 H = normalize(uSun + V);
        float spec = pow(max(dot(N, H), 0.0), 90.0) * water * (1.0 - cl) * 0.9;
        col += vec3(1.0, 0.93, 0.8) * spec * lit;
        // night side: city lights, hidden under cloud
        vec3 lights = night * vec3(1.0, 0.78, 0.5) * 1.7 * (1.0 - lit) * (1.0 - cl * 0.7);
        col += lights;
        // blue hour along the terminator and a thin atmospheric rim
        float term = exp(-pow(d * 5.0, 2.0));
        col += vec3(0.55, 0.28, 0.2) * term * 0.10;
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.2);
        col += vec3(0.28, 0.55, 1.0) * rim * (0.25 + 1.0 * max(d + 0.25, 0.0));
        if (uReady < 3.5) col = mix(vec3(0.02, 0.07, 0.16), col, clamp(uReady / 4.0, 0.0, 1.0));
        col *= uDim; // phones: dimmer, so body text over the Earth stays readable
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, lite ? 64 : 128, lite ? 40 : 96), mat);
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 40), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { uSun: { value: sun } },
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vW = (modelMatrix * vec4(position,1.)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW,1.); }`,
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 V = normalize(cameraPosition - vW); float f = pow(max(dot(-vN, V), 0.), 2.4); float s = .25 + .75 * max(dot(-vN, uSun) + .55, 0.);
        gl_FragColor = vec4(vec3(.30,.58,1.) * f * s * 1.5, f * s);
        #include <colorspace_fragment>
      }`,
  }));
  g.add(body, atmo);
  // turn Mauritius (57.5 E, 20 S) to face the camera that sits at the start of the page
  const p0 = new THREE.Vector3(0.505, -0.342, -0.792);
  g.quaternion.setFromUnitVectors(p0, new THREE.Vector3(-0.5, -0.19, 0.82).normalize());
  return { group: g, mat, body };
}

export function createStation({ lite }) {
  const root = new THREE.Group();
  const tex = panelTexture();
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a94a6, map: tex, roughness: 0.5, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x20252f, roughness: 0.55, metalness: 0.8 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x2a86c8 });
  const warn = new THREE.MeshBasicMaterial({ color: 0xff6a2a });

  // ribs: the arches that make the corridor read as a structure
  const step = lite ? 12 : 8, first = 6, last = -150;
  const n = Math.floor((first - last) / step) + 1;
  const ribGeo = new THREE.TorusGeometry(R, 0.7, 8, lite ? 40 : 72);
  const ribs = new THREE.InstancedMesh(ribGeo, metal, n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(0, 0, first - i * step); ribs.setMatrixAt(i, m4); }
  root.add(ribs);

  // girders running the length of the station, a few with light strips and one dead (abandoned) strip
  const len = first - last + 20, mid = (first + last) / 2;
  const girderGeo = new THREE.BoxGeometry(1.1, 1.1, len);
  const stripGeo = new THREE.BoxGeometry(0.12, 0.12, len);
  const strips = [];
  const count = lite ? 8 : 14;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.2;
    const gm = new THREE.Mesh(girderGeo, dark);
    gm.position.set(Math.cos(a) * R, Math.sin(a) * R, mid);
    gm.rotation.z = a;
    root.add(gm);
    if (i % 4 === 0 && Math.sin(a) > -0.6) {
      const s = new THREE.Mesh(stripGeo, glow);
      s.position.set(Math.cos(a) * (R - 0.8), Math.sin(a) * (R - 0.8), mid);
      root.add(s);
      strips.push(s);
    }
  }

  // one dying emergency strip on the deck, flickering (the station is abandoned, not dead)
  const dead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 26), warn);
  dead.position.set(-13, -R + 4.6, -34);
  root.add(dead);

  // wall panels between ribs on the lower half: the deck and the bulkheads
  const panelGeo = new THREE.BoxGeometry(7, 12, 0.6);
  const deckGeo = new THREE.BoxGeometry(60, 0.8, len);
  const deck = new THREE.Mesh(deckGeo, metal);
  tex.repeat.set(1, 1);
  deck.position.set(0, -R + 4, mid);
  root.add(deck);
  const deckGlow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, len), glow);
  [-6, 6].forEach((x) => { const s = deckGlow.clone(); s.position.set(x, -R + 4.5, mid); root.add(s); strips.push(s); });

  // observation deck: a railing, a floor and two window pillars that appear for About, so the Earth is seen from a deck
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x59647a, map: tex, roughness: 0.45, metalness: 0.85, transparent: true, opacity: 0 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x9fb4d8, roughness: 0.25, metalness: 0.9, transparent: true, opacity: 0 });
  const deckGlowMat = new THREE.MeshBasicMaterial({ color: 0x6fc4ff, transparent: true, opacity: 0 });
  const obs = new THREE.Group();
  obs.visible = false;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(60, 0.5, 40), deckMat);
  floor.position.set(14, 1.3, -32);
  obs.add(floor);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(60, 0.08, 0.14), deckGlowMat);
  edge.position.set(14, 1.58, -12.1);
  obs.add(edge);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(60, 0.12, 0.12), railMat);
  rail.position.set(14, 2.35, -12);
  obs.add(rail);
  for (let x = -14; x <= 42; x += 4) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), railMat);
    post.position.set(x, 1.95, -12);
    obs.add(post);
  }
  [8.6, 20].forEach((x) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, 34, 0.8), deckMat);
    col.position.set(x, 17, -16);
    obs.add(col);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 34, 0.12), deckGlowMat);
    cap.position.set(x + (x < 14 ? 0.46 : -0.46), 17, -15.7);
    obs.add(cap);
  });
  root.add(obs);
  let deckTarget = 0, deckOpacity = 0;

  // holographic archive: a curved wall of glass record tablets that appears for the Academic journey
  const arch = new THREE.Group();
  arch.visible = false;
  const tabTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 460;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 460);
    g.strokeStyle = 'rgba(110,200,255,0.9)'; g.lineWidth = 3; g.strokeRect(4, 4, 248, 452);
    g.fillStyle = 'rgba(110,200,255,0.5)'; g.fillRect(18, 18, 90, 10);
    g.fillStyle = 'rgba(110,200,255,0.2)'; g.fillRect(18, 38, 220, 56);
    let sd = 11; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let y = 112; y < 430; y += 14) {
      g.fillStyle = `rgba(110,200,255,${0.15 + rn() * 0.35})`;
      g.fillRect(18, y, 30 + rn() * 190, 5);
    }
    g.fillStyle = 'rgba(255,200,90,0.7)'; g.fillRect(18, 436, 36, 6);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const archMat = new THREE.MeshBasicMaterial({ map: tabTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const tabGeo = new THREE.PlaneGeometry(5, 9);
  const cx = -17, cz = -62, rad = 36, perRow = lite ? 9 : 14;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < perRow; i++) {
      const a = (i / (perRow - 1) - 0.5) * 1.7;
      const m = new THREE.Mesh(tabGeo, archMat);
      m.position.set(cx + Math.sin(a) * rad, row === 0 ? -1.5 : 9, cz - Math.cos(a) * rad);
      m.rotation.y = -a; // faces the centre of the arc
      m.position.y += Math.sin(i * 1.7 + row) * 0.6;
      arch.add(m);
    }
  }
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x8fdcff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.25), scanMat);
  scan.position.set(cx, 0, cz - rad + 2);
  arch.add(scan);
  root.add(arch);
  let archTarget = 0, archOpacity = 0;

  // technology lab: banks of instrument screens and blinking status lights around the Skills station, no planet in view
  const lab = new THREE.Group();
  lab.visible = false;
  const scrTex = (() => {
    const c = document.createElement('canvas');
    c.width = 360; c.height = 200;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(90,255,190,0.85)'; g.lineWidth = 3; g.strokeRect(3, 3, 354, 194);
    g.fillStyle = 'rgba(90,255,190,0.5)'; g.fillRect(14, 14, 70, 8);
    let sd = 7; const rn = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 14; i++) { // bar chart
      const h = 20 + rn() * 90;
      g.fillStyle = `rgba(90,255,190,${0.25 + rn() * 0.4})`;
      g.fillRect(16 + i * 14, 170 - h, 9, h);
    }
    g.beginPath(); g.strokeStyle = 'rgba(160,230,255,0.9)'; g.lineWidth = 2; // waveform
    for (let x = 0; x < 150; x += 3) { const y = 90 + Math.sin(x * 0.18) * 24 * Math.sin(x * 0.04 + 1); x ? g.lineTo(210 + x, y) : g.moveTo(210, y); }
    g.stroke();
    for (let y = 150; y < 186; y += 9) { g.fillStyle = 'rgba(160,230,255,0.4)'; g.fillRect(212, y, 20 + rn() * 120, 4); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const labMat = new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const scrGeo = new THREE.PlaneGeometry(9, 5);
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < (lite ? 3 : 5); i++) {
        const m = new THREE.Mesh(scrGeo, labMat);
        m.position.set(6 + side * (17 + row * 1.5), -8 + row * 6.2, -50 - i * 10.5);
        m.rotation.y = -side * 1.1;
        lab.add(m);
      }
    }
  }
  const ledN = lite ? 60 : 160, lp = new Float32Array(ledN * 3);
  for (let i = 0; i < ledN; i++) lp.set([6 + (Math.random() - 0.5) * 60, -14 + Math.random() * 30, -48 - Math.random() * 50], i * 3);
  const ledGeo = new THREE.BufferGeometry();
  ledGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const ledMat = new THREE.PointsMaterial({ size: 3, sizeAttenuation: false, color: 0x7dffd0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  lab.add(new THREE.Points(ledGeo, ledMat));
  const labLight = new THREE.PointLight(0x4fd8ff, 0, 90, 1.5);
  labLight.position.set(6, 6, -60);
  lab.add(labLight);
  root.add(lab);
  let labTarget = 0, labOpacity = 0, earthTarget = 1, earthFade = 1;

  // far gas giant with rings, seen from the Projects room; fully generated, no image files
  const gasGroup = new THREE.Group();
  const gasMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uFade: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform float uFade; uniform float uTime; varying vec3 vN; varying vec2 vUv; varying vec3 vP;
      float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float ns(float x){ float i = floor(x), f = fract(x); return mix(h(i), h(i + 1.), f * f * (3. - 2. * f)); }
      void main(){
        float lat = vP.y;
        float warp = ns(vUv.x * 9. + lat * 6.) * 0.06 + ns(vUv.x * 23. - lat * 3.) * 0.02;
        float b = ns((lat + warp) * 22.) * 0.6 + ns((lat + warp) * 55.) * 0.3 + 0.1;
        vec3 c = mix(vec3(0.42, 0.22, 0.12), vec3(0.93, 0.7, 0.45), b);
        c = mix(c, vec3(0.62, 0.34, 0.2), smoothstep(0.55, 0.75, ns(lat * 9.)));
        float d = max(dot(normalize(vN), normalize(vec3(-0.6, 0.35, 0.7))), 0.);
        c *= 0.04 + 1.05 * d;
        float rim = pow(1. - max(dot(normalize(vN), vec3(0., 0., 1.)), 0.), 3.);
        c += vec3(0.9, 0.55, 0.3) * rim * 0.18;
        gl_FragColor = vec4(c, uFade);
      }`,
  });
  const gasBody = new THREE.Mesh(new THREE.SphereGeometry(1, lite ? 32 : 64, lite ? 24 : 48), gasMat);
  gasGroup.add(gasBody);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { uFade: { value: 0 } },
    vertexShader: 'varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform float uFade; varying vec2 vUv; varying vec3 vP;
      float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float ns(float x){ float i = floor(x), f = fract(x); return mix(h(i), h(i + 1.), f * f * (3. - 2. * f)); }
      void main(){
        float r = length(vP.xy);
        float t = (r - 1.35) / 1.25;
        float band = ns(t * 38.) * 0.55 + ns(t * 110.) * 0.35 + 0.1;
        float gap = smoothstep(0.0, 0.03, abs(t - 0.62)) * smoothstep(0.0, 0.02, abs(t - 0.3));
        float a = band * gap * smoothstep(0., 0.08, t) * smoothstep(1., 0.9, t);
        gl_FragColor = vec4(vec3(0.86, 0.74, 0.56) * (0.55 + 0.45 * band), a * 0.6 * uFade);
      }`,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 2.6, lite ? 64 : 128, 1), ringMat);
  ring.rotation.x = Math.PI / 2 - 0.28;
  gasGroup.add(ring);
  gasGroup.rotation.z = 0.3;
  gasGroup.scale.setScalar(lite ? 8 : 15);
  gasGroup.position.set(lite ? 26 : 34, lite ? 16 : 12, -165);
  gasGroup.visible = false;
  root.add(gasGroup);
  let gasTarget = 0, gasFade = 0;

  // the Moon, close to the window of the records archive; crater shader, no image files
  const moonMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uFade: { value: 0 }, uLift: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform float uFade; uniform float uLift; varying vec3 vN; varying vec3 vP;
      float h3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        vec3 p = normalize(vP);
        float maria = smoothstep(0.5, 0.62, n3(p * 2.2 + 3.));
        float rough = n3(p * 14.) * 0.5 + n3(p * 40.) * 0.3 + n3(p * 90.) * 0.2;
        float crater = 0.;
        for (int i = 0; i < 3; i++) { float sc = 7. * pow(2.1, float(i)); vec3 q = p * sc; vec3 id = floor(q); vec3 c = id + 0.5 + (vec3(h3(id), h3(id + 7.), h3(id + 13.)) - 0.5) * 0.6; float d = length(q - c); float rim = smoothstep(0.34, 0.3, d) * 0.5 - smoothstep(0.24, 0.0, d) * 0.55 + smoothstep(0.36, 0.3, d) * smoothstep(0.26, 0.3, d) * 0.4; crater += rim * step(0.55, h3(id + 3.)) / (1. + float(i)); }
        float g = 0.5 + 0.35 * rough - 0.22 * maria + crater * 0.5;
        vec3 sunDir = normalize(vec3(0.7, 0.25, 0.65));
        float d = max(dot(normalize(vN), sunDir), 0.);
        vec3 c = vec3(g) * vec3(0.95, 0.93, 0.9) * (0.03 + uLift * 0.38 + 1.1 * d); // uLift: light theme, no black night side
        gl_FragColor = vec4(c, uFade);
      }`,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, lite ? 40 : 96, lite ? 28 : 64), moonMat);
  moon.scale.setScalar(13);
  moon.position.set(-4, 12, -150);
  moon.visible = false;
  root.add(moon);
  let moonTarget = 0, moonFade = 0;

  // communications centre: a dish antenna sending pulses toward a low sun; all generated
  const comm = new THREE.Group();
  comm.visible = false;
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,248,225,1)'); gr.addColorStop(0.08, 'rgba(255,225,160,0.9)');
    gr.addColorStop(0.3, 'rgba(255,160,70,0.25)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const sunMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const sunSp = new THREE.Sprite(sunMat);
  sunSp.scale.setScalar(70);
  sunSp.position.set(-30, 10, -60);
  comm.add(sunSp);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.8, roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const dishG = new THREE.Group();
  const dish = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 14, 0, Math.PI * 2, 0, 0.75), dishMat);
  dish.rotation.x = -Math.PI / 2; // opens along +z
  dishG.add(dish);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), dishMat);
  mast.rotation.x = Math.PI / 2; mast.position.z = 0.55; mast.scale.set(1, 1, 1);
  dishG.add(mast);
  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffb25a }));
  feed.position.z = 1.05;
  const feedMat = feed.material; feedMat.transparent = true; feedMat.opacity = 0;
  dishG.add(feed);
  dishG.scale.setScalar(4);
  dishG.position.set(-9, -2.5, -8);
  dishG.rotation.y = Math.PI + 0.35; dishG.rotation.x = 0.25;
  comm.add(dishG);
  const pulses = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.MeshBasicMaterial({ color: 0xffc27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const r = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64), m);
    r.position.copy(dishG.position); r.rotation.copy(dishG.rotation);
    comm.add(r); pulses.push({ r, m });
  }
  const commLight = new THREE.PointLight(0xffa860, 0, 120, 1.4);
  commLight.position.set(-20, 6, -30);
  comm.add(commLight);
  root.add(comm);
  let commTarget = 0, commFade = 0;

  // deep space: stars follow the camera, the Earth stays put
  const starN = lite ? 700 : 1800, sp = new Float32Array(starN * 3), sc = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), d = 220;
    sp.set([r * Math.cos(a) * d, u * d, r * Math.sin(a) * d], i * 3);
    const t = Math.random(), b = 0.5 + Math.random() * 0.5;
    sc.set([b * (0.8 + 0.2 * t), b * 0.9, b * (1 - 0.15 * t)], i * 3);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
  stars.frustumCulled = false;
  root.add(stars);

  const earth = makeEarth(lite);
  earth.group.scale.setScalar(52);
  earth.group.position.set(34, 20, -125);
  root.add(earth.group);

  const hemi = new THREE.HemisphereLight(0x9bb4ff, 0x1a2030, 0.9);
  root.add(hemi);
  const light = new THREE.DirectionalLight(0xbcd2ff, 0.9);
  light.position.set(0.5, 0.8, 0.4);
  root.add(light);

  let isLight = false;
  function setTheme(lightMode) {
    isLight = lightMode;
    moonMat.uniforms.uLift.value = lightMode ? 1 : 0;
    earth.mat.uniforms.uDim.value = lightMode ? (lite ? 1.35 : 1) : (lite ? 0.5 : 1); // light theme: dark text sits over it, so a brighter, paler planet
    metal.color.set(lightMode ? 0xa9b8d0 : 0x8a94a6);
    metal.transparent = dark.transparent = lightMode; // light theme: a see-through steel hull, so the rooms behind it still show
    metal.opacity = lightMode ? 0.5 : 1;
    dark.opacity = lightMode ? 0.5 : 1;
    metal.needsUpdate = dark.needsUpdate = true;
    metal.metalness = lightMode ? 0.35 : 0.85;
    dark.color.set(lightMode ? 0x6b7a94 : 0x20252f);
    stars.visible = true;
    light.intensity = lightMode ? 1.3 : 0.9;
  }

  function setSection(name) { deckTarget = name === 'about' || name === 'profile' ? 1 : 0; archTarget = name === 'journey' ? 1 : 0; labTarget = name === 'skills' ? 1 : 0; earthTarget = (lite && (name === 'background' || name === 'education')) || name === 'skills' || name === 'projects' || name === 'achievements' || name === 'contact' ? 0 : 1; commTarget = name === 'contact' ? 1 : 0; moonTarget = name === 'achievements' ? 1 : 0; gasTarget = name === 'projects' ? 1 : 0; }

  function update(dt, t, camera) {
    deckOpacity += (deckTarget - deckOpacity) * (1 - Math.exp(-dt * 2.2));
    archOpacity += (archTarget - archOpacity) * (1 - Math.exp(-dt * 2.2));
    arch.visible = archOpacity > 0.01;
    archMat.opacity = archOpacity * 0.38;
    scanMat.opacity = archOpacity * 0.35;
    scan.position.y = 2 + Math.sin(t * 0.45) * 9;
    labOpacity += (labTarget - labOpacity) * (1 - Math.exp(-dt * 2.2));
    earthFade += (earthTarget - earthFade) * (1 - Math.exp(-dt * 3));
    lab.visible = labOpacity > 0.01;
    labMat.opacity = labOpacity * 0.6;
    ledMat.opacity = labOpacity * (0.5 + 0.5 * Math.sin(t * 3.1));
    labLight.intensity = labOpacity * 40;
    earth.group.visible = earthFade > 0.02;
    earth.group.scale.setScalar(52 * (0.4 + 0.6 * earthFade));
    gasFade += (gasTarget - gasFade) * (1 - Math.exp(-dt * 2.5));
    gasGroup.visible = gasFade > 0.02;
    gasMat.uniforms.uFade.value = ringMat.uniforms.uFade.value = gasFade;
    gasBody.rotation.y += dt * 0.01;
    moonFade += (moonTarget - moonFade) * (1 - Math.exp(-dt * 2.5));
    moon.visible = moonFade > 0.02;
    moonMat.uniforms.uFade.value = moonFade;
    moon.rotation.y += dt * 0.004;
    commFade += (commTarget - commFade) * (1 - Math.exp(-dt * 2.5));
    comm.visible = commFade > 0.02;
    sunMat.opacity = commFade * 0.9;
    dishMat.opacity = feedMat.opacity = commFade;
    commLight.intensity = commFade * 60;
    const dirv = new THREE.Vector3(0, 0, 1).applyEuler(dishG.rotation);
    pulses.forEach((p, i) => {
      const k = ((t * 0.35 + i / pulses.length) % 1);
      p.r.position.copy(dishG.position).addScaledVector(dirv, 5 + k * 40);
      p.r.scale.setScalar(2 + k * 14);
      p.m.opacity = commFade * (1 - k) * 0.5;
    });
    obs.visible = deckOpacity > 0.01;
    deckMat.opacity = railMat.opacity = deckOpacity * (isLight ? 0.85 : 1);
    deckGlowMat.opacity = deckOpacity * (isLight ? 0.7 : 0.7);
    stars.position.copy(camera.position);
    earth.body.rotation.y += dt * 0.003;
    earth.mat.uniforms.uTime.value = t;
    warn.color.setScalar(0).add(new THREE.Color(0xff6a2a).multiplyScalar(0.45 + 0.55 * (Math.sin(t * 7.3) > 0.2 ? 1 : 0.15) * (Math.sin(t * 2.1) > -0.4 ? 1 : 0)));
  }

  setTheme(false);
  return { root, update, setTheme, setSection };
}
