// The playable PSR-S970: its own transparent WebGL layer, flown through the page by scroll position,
// with mouse / touch / computer-keyboard playing, a control panel that really does things, and a small HUD.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { createKeyboardGlb, MIDI_LO, MIDI_HI } from './model-glb.js';
import { KeyAudio, VOICES, noteName } from './audio.js';

// One pose per section. nx/ny: where the keyboard's centre sits on screen (-1..1, + = right / up),
// f: share of the screen width it covers, rx: tilt towards the viewer (π/2 = seen from straight above),
// ry: spin, rz: roll, o: opacity (low = a ghost behind the text, 0 = hidden).
const POSES = {
  hero: { nx: 0.55, ny: -0.04, f: 0.5, rx: 0.95, ry: -0.5, rz: 0.06, o: 1 },
  about: { nx: 0.82, ny: -0.45, f: 0.95, rx: 0.36, ry: 0.85, rz: -0.06, o: 0.34 }, // close-up on the keys
  profile: { nx: -0.42, ny: -0.2, f: 0.5, rx: 1.2, ry: -0.8, rz: 0.12, o: 0.28 },
  background: { nx: 0.5, ny: 0.22, f: 0.55, rx: 0.3, ry: 0.5, rz: 0, o: 0.28 },
  education: { nx: 0.5, ny: -0.3, f: 0.6, rx: 1.35, ry: 0.2, rz: -0.1, o: 0.3 },
  map: { nx: 0, ny: -1.3, f: 0.5, rx: 0.6, ry: 0, rz: 0, o: 0 },
  skills: { nx: 0, ny: 0.6, f: 0.5, rx: 0.6, ry: 0.25, rz: 0, o: 0.32 },
  journey: { nx: 0.5, ny: 0, f: 0.55, rx: 0.8, ry: -0.7, rz: 0.05, o: 0.28 },
  play: { nx: 0, ny: -0.05, f: 0.86, rx: 1.1, ry: 0, rz: 0, o: 1 },
  playOut: { nx: 0.55, ny: 0.5, f: 0.46, rx: 0.8, ry: -0.9, rz: 0.05, o: 0.2 }, // swings away before the instructions come up
  projects: { nx: -0.5, ny: -0.2, f: 0.5, rx: 0.4, ry: 1.1, rz: 0, o: 0.28 },
  achievements: { nx: 0.5, ny: 0.1, f: 0.5, rx: 0.7, ry: -1.0, rz: 0.06, o: 0.28 },
  contact: { nx: 0, ny: -0.1, f: 0.78, rx: 1.0, ry: 0, rz: 0, o: 0.85 },
};
// Macro shots: fx/fz is the point of the keyboard (model units) the camera stays centred on while it turns.
Object.assign(POSES.skills, { f: 1.7, nx: 0.0, ny: 0.0, rx: 1.0, ry: 0.28, rz: 0, o: 0.32, fx: 0, fz: -1.0 }); // the display, large and ghosted behind the cards
Object.assign(POSES.projects, { f: 1.6, nx: -0.15, ny: -0.1, rx: 0.4, ry: -0.55, rz: 0, o: 0.3, fx: 1.2, fz: 1.0 }); // the keys, from low down
for (const p of Object.values(POSES)) { if (p.fx === undefined) p.fx = 0; if (p.fz === undefined) p.fz = -0.2; }
const ORDER = Object.keys(POSES);

// Computer-keyboard layout: two rows like a tracker / a small piano. e.code is layout-independent (works on AZERTY too).
const ROW_LOW = ['KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM', 'Comma', 'KeyL', 'Period', 'Semicolon', 'Slash'];
const ROW_UP = ['KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU', 'KeyI', 'Digit9', 'KeyO', 'Digit0', 'KeyP'];

const STYLE_INFO = { pop: ['POP & ROCK', 100], disco: ['DANCE', 118], latin: ['LATIN', 96], ballad: ['BALLAD', 72] };
// real panel buttons that really work -> what they do
const VOICE_MAP = { 'voice:PIANO': 'piano', 'voice:EPIANO': 'epiano', 'voice:ORGAN': 'organ', 'voice:STRINGS': 'strings', 'voice:SYNTH': 'synth', 'voice:PERCUSSION': 'bell' };
const STYLE_MAP = { 'style:POP&ROCK': 'pop', 'style:DANCE': 'disco', 'style:LATIN': 'latin', 'style:BALLAD': 'ballad' };
// REGISTRATION MEMORY 1-8: each recalls a whole setup
const REGS = [
  { voice: 'piano', style: 'ballad', bpm: 72, rev: 0.4, name: 'Grand Piano · Ballad' }, { voice: 'epiano', style: 'pop', bpm: 100, rev: 0.25, name: 'Electric Piano · Pop' },
  { voice: 'organ', style: 'pop', bpm: 110, rev: 0.3, name: 'Pipe Organ · Pop' }, { voice: 'strings', style: 'ballad', bpm: 66, rev: 0.55, name: 'Strings · Ballad' },
  { voice: 'synth', style: 'disco', bpm: 122, rev: 0.2, name: 'Synth · Dance' }, { voice: 'bell', style: 'latin', bpm: 96, rev: 0.35, name: 'Bells · Latin' },
  { voice: 'piano', style: 'latin', bpm: 100, rev: 0.3, name: 'Grand Piano · Latin' }, { voice: 'epiano', style: 'disco', bpm: 118, rev: 0.2, name: 'E.Piano · Dance' },
];
const VOICE_IDS = Object.keys(VOICES);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const hold = (t) => smooth(clamp((t - 0.22) / 0.56, 0, 1)); // linger on each pose, travel in between

const ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>';

export async function initKeyboard() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.id = 'kb-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  document.body.appendChild(canvas);
  document.documentElement.dataset.kb = '1';
  const lite = window.innerWidth < 800;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  { // a small photo studio: dark room with softboxes, so the piano-black body picks up long, believable reflections
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 0x07090e, side: THREE.BackSide })));
    const box = (w, h, x, y, z, i, col = 0xffffff) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(i), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    box(22, 8, 0, 16, 2, 5);        // big overhead softbox
    box(3, 18, -14, 3, 6, 6);       // left strip
    box(3, 18, 14, 3, 4, 3.5, 0xbcd4ff); // right strip, cool
    box(30, 2, 0, -2, 16, 1.5);     // front fill line
    box(10, 6, 0, 6, -14, 4, 0x9fc4ff);   // back rim
    scene.environment = pmrem.fromScene(env, 0.02).texture;
  }
  scene.environmentIntensity = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 80);
  camera.position.set(0, 0, 18);

  const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.6);
  keyLight.position.set(-5, 10, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -9; keyLight.shadow.camera.right = 9; keyLight.shadow.camera.top = 9; keyLight.shadow.camera.bottom = -9;
  keyLight.shadow.camera.near = 1; keyLight.shadow.camera.far = 40;
  keyLight.shadow.bias = -0.0004; keyLight.shadow.normalBias = 0.02; keyLight.shadow.radius = 4;
  const rimLight = new THREE.PointLight(0x7fb4ff, 60, 40);
  rimLight.position.set(6, 2, -5);
  const fill = new THREE.HemisphereLight(0x9bb4e8, 0x10121a, 0.25);
  scene.add(keyLight, rimLight, fill);

  // the Blender-built model; if the file is missing the code-built keyboard takes over
  let model;
  try { model = await createKeyboardGlb(); } catch (e) {
    console.warn('keyboard model unavailable', e);
    canvas.remove(); delete document.documentElement.dataset.kb; return null;
  }
  const pivot = new THREE.Group();
  model.root.position.set(0, -0.7, 0.2);
  pivot.add(model.root);
  const rig = new THREE.Group();
  rig.add(pivot);
  scene.add(rig);

  const audio = new KeyAudio();

  // ---- accent colour follows the site theme ------------------------------------
  function syncColours() {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--sky-rgb').trim();
    const p = v.split(',').map((n) => parseFloat(n));
    if (p.length === 3 && p.every((n) => !isNaN(n))) {
      const c = new THREE.Color(p[0] / 255, p[1] / 255, p[2] / 255);
      model.setAccent(c);
      rimLight.color.copy(c);
    }
  }
  syncColours();
  new MutationObserver(syncColours).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-accent', 'style'] });

  // ---- scroll anchors -----------------------------------------------------------
  let anchors = [];
  function measure() {
    const sy = window.scrollY;
    const vh = window.innerHeight;
    anchors = [];
    ORDER.forEach((id) => {
      const el = id === 'play' ? document.getElementById('kb-stage') || document.getElementById('play') : id === 'playOut' ? document.querySelector('.play__hints') : document.getElementById(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const mid = r.top + sy + r.height / 2;
      anchors.push({ id, y: id === 'hero' ? 0 : mid - vh / 2 });
    });
    anchors.sort((a, b) => a.y - b.y);
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  const remeasure = setInterval(measure, 1200);
  setTimeout(() => clearInterval(remeasure), 20000);

  const cur = { nx: 0.55, ny: -0.04, f: 0.5, rx: 0.95, ry: -0.5, rz: 0.06, o: 0, fx: 0, fz: -0.2 };
  const target = { ...cur };
  let playW = 0;
  let mapW = 0;
  const orb = { rx: 0, ry: 0 };
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => { parallax.tx = (e.clientX / window.innerWidth - 0.5) * 2; parallax.ty = (e.clientY / window.innerHeight - 0.5) * 2; }, { passive: true });
  let show = 0; // fades the whole thing in after the intro
  const portrait = () => window.innerWidth / window.innerHeight < 0.85;

  function solve() {
    const sy = window.scrollY;
    let a = anchors[0], b = anchors[0], t = 0;
    for (let i = 0; i < anchors.length; i++) {
      if (sy >= anchors[i].y) { a = anchors[i]; b = anchors[i + 1] || anchors[i]; }
    }
    if (b !== a) t = hold(clamp((sy - a.y) / Math.max(1, b.y - a.y), 0, 1));
    const A = POSES[a.id], B = POSES[b.id];
    const out = {};
    for (const k of Object.keys(A)) out[k] = lerp(A[k], B[k], t);
    playW = (a.id === 'play' ? 1 - t : 0) + (b.id === 'play' ? t : 0);
    mapW = (a.id === 'map' ? 1 - t : 0) + (b.id === 'map' ? t : 0);
    if (portrait()) {
      out.nx *= 0.2;
      out.f = Math.min(0.98, out.f * 1.55);
      out.ny = playW > 0.5 ? out.ny : out.ny * 0.6 - 0.35;
      out.o *= playW > 0.5 ? 1 : 0.5; // phones: text covers the screen, so the keyboard becomes a ghost behind it
    }
    Object.assign(target, out);
  }

  // ---- sizing -------------------------------------------------------------------
  let halfW = 1, halfH = 1;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- note bookkeeping ---------------------------------------------------------
  const down = new Map(); // midi -> Set(sources)
  const noteEl = () => document.getElementById('kb-note');
  function refreshNotes() {
    const notes = [...down.keys()].sort((a, b) => a - b);
    model.setLcd({ notes });
    const el = noteEl();
    if (el) {
      el.classList.toggle('is-on', notes.length > 0);
      el.querySelector('b').textContent = notes.length ? notes.slice(0, 4).map(noteName).join(' · ') : 'ready';
    }
  }
  function keyOn(m, src, vel = 0.75) {
    if (m < MIDI_LO || m > MIDI_HI) return;
    let s = down.get(m);
    if (!s) { s = new Set(); down.set(m, s); }
    if (s.has(src)) return;
    s.add(src);
    if (s.size === 1) { audio.noteOn(m, vel); model.hold(m, +1, 0); }
    refreshNotes();
  }
  function keyOff(m, src) {
    const s = down.get(m);
    if (!s || !s.delete(src)) return;
    if (!s.size) { down.delete(m); audio.noteOff(m); model.hold(m, -1); }
    refreshNotes();
  }
  function releaseAll() {
    [...down.entries()].forEach(([m, s]) => [...s].forEach((src) => keyOff(m, src)));
  }

  audio.onChord = (notes, dur) => {
    notes.forEach((m) => model.hold(m, +1, 1));
    setTimeout(() => notes.forEach((m) => model.hold(m, -1)), dur * 1000);
  };
  audio.onBeat = (beat) => model.setLcd({ beat });

  // ---- control panel ------------------------------------------------------------
  const ui = { voice: 'piano', style: 'pop', demo: false };
  function syncPanel() {
    Object.entries(VOICE_MAP).forEach(([id, v]) => model.setActive(id, ui.voice === v));
    Object.entries(STYLE_MAP).forEach(([id, s]) => model.setActive(id, ui.style === s));
    model.setActive('fn:metro', audio.metro);
    model.setActive('fn:startStop', audio.acc);
    model.setActive('acmp', audio.acc);
    model.setActive('fx:SUSTAIN', audio.sustain);
    model.setActive('fx:DSP', audio.reverbOn);
    model.setActive('fn:demo', ui.demo);
    model.setLcd({
      voice: VOICES[ui.voice], style: STYLE_INFO[ui.style][0], tempo: audio.bpm, trans: audio.transpose, reverb: audio.reverbOn,
      sustain: audio.sustain, metro: audio.metro, acc: audio.acc, vol: audio.muted ? 0 : audio.volume, demo: ui.demo,
    });
    const snd = document.getElementById('kb-snd');
    if (snd) { snd.innerHTML = audio.muted ? ICON_OFF : ICON_ON; snd.setAttribute('aria-pressed', String(!audio.muted)); }
    const vol = document.getElementById('kb-vol');
    if (vol && +vol.value !== Math.round(audio.volume * 100)) vol.value = Math.round(audio.volume * 100);
  }
  const toast = (msg) => { model.setLcd({ msg }); clearTimeout(toast.t); toast.t = setTimeout(() => model.setLcd({ msg: '' }), 2600); };
  function setTempo(b) {
    audio.bpm = clamp(Math.round(b), 40, 200);
    model.knobs.jog.set((audio.bpm - 40) / 160);
    syncPanel();
  }
  function stopDemo() {
    audio.stopDemo();
    [...down.entries()].forEach(([m, s]) => { if (s.has('demo')) keyOff(m, 'demo'); });
    ui.demo = false;
  }
  function resetView(animate = true) {
    if (animate && !reduced) gsap.to(orb, { rx: 0, ry: 0, duration: 1.4, ease: 'elastic.out(1, 0.7)', overwrite: true });
    else { orb.rx = 0; orb.ry = 0; }
  }
  function fullReset() {
    stopDemo();
    audio.setAcc(false); audio.setMetro(false); audio.setSustain(false);
    audio.allOff(); releaseAll();
    ui.voice = 'piano'; audio.voice = 'piano'; ui.style = 'pop';
    audio.style = 'pop'; audio.transpose = 0; audio.reverbOn = true; audio.setReverb(0.18); audio.setBright(0.8); audio.setBend(0);
    model.knobs.live1.set(0.3); model.knobs.live2.set(0.8); model.knobs.master.set(audio.volume); model.wheels.pitch.value = 0; model.wheels.mod.value = 0; audio.setBend(0);
    setTempo(100);
    resetView(true);
    toast('Reset to factory settings');
  }
  function press(id) {
    audio.resume();
    model.flash(id);
    if (VOICE_MAP[id]) {
      ui.voice = VOICE_MAP[id]; audio.voice = ui.voice; audio.allOff();
      toast('Voice: ' + VOICES[ui.voice]);
    } else if (STYLE_MAP[id]) {
      ui.style = STYLE_MAP[id]; audio.style = ui.style; setTempo(STYLE_INFO[ui.style][1]);
      toast('Style: ' + STYLE_INFO[ui.style][0] + (audio.acc ? '' : ' — press START/STOP'));
    } else if (id.startsWith('reg:') && /^reg:[1-8]$/.test(id)) {
      const r = REGS[+id.slice(4) - 1];
      ui.voice = r.voice; audio.voice = r.voice; audio.allOff(); ui.style = r.style; audio.style = r.style;
      audio.setReverb(r.rev * 0.6); model.knobs.live1.set(r.rev); setTempo(r.bpm);
      toast('Registration ' + id.slice(4) + ': ' + r.name);
    } else switch (id) {
      case 'fn:metro': audio.setMetro(!audio.metro); toast('Metronome ' + (audio.metro ? 'on' : 'off')); break;
      case 'fn:tempoDn': setTempo(audio.bpm - 4); break;
      case 'fn:tempoUp': setTempo(audio.bpm + 4); break;
      case 'fn:startStop': case 'acmp': audio.setAcc(!audio.acc); toast(audio.acc ? 'Auto accompaniment: ' + STYLE_INFO[ui.style][0] : 'Accompaniment stopped'); break;
      case 'fn:demo':
        if (ui.demo) { stopDemo(); toast('Demo stopped'); break; }
        ui.demo = true; toast('Demo: Für Elise (Beethoven)');
        audio.playDemo((m, on) => (on ? keyOn(m, 'demo', 0.7) : keyOff(m, 'demo')), () => { stopDemo(); syncPanel(); });
        break;
      case 'fx:SUSTAIN': audio.setSustain(!audio.sustain); toast('Sustain ' + (audio.sustain ? 'on' : 'off')); break;
      case 'fx:DSP': audio.setReverbOn(!audio.reverbOn); toast('Reverb (DSP) ' + (audio.reverbOn ? 'on' : 'off')); break;
      case 'fn:trDn': audio.allOff(); audio.transpose = clamp(audio.transpose - 1, -12, 12); toast('Transpose ' + audio.transpose); break;
      case 'fn:trUp': audio.allOff(); audio.transpose = clamp(audio.transpose + 1, -12, 12); toast('Transpose ' + audio.transpose); break;
      case 'fn:power': fullReset(); break;
      case 'oct:dn': octave = clamp(octave - 1, -2, 2); toast('Octave shift ' + (octave > 0 ? '+' : '') + octave); break;
      case 'oct:up': octave = clamp(octave + 1, -2, 2); toast('Octave shift ' + (octave > 0 ? '+' : '') + octave); break;
      default: toast((model.labels[id] || id.split(':').pop()).replace(/\n/g, ' ') + ' — not available in this demo'); break;
    }
    syncPanel();
  }
  syncPanel();
  model.knobs.live1.set(0.3); model.knobs.live2.set(0.8); model.knobs.master.set(audio.volume);
  model.knobs.jog.set((audio.bpm - 40) / 160);

  // ---- pointer interaction ---------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const lock = document.createElement('div'); // sits over the keyboard on touch devices so a finger plays instead of scrolling
  lock.className = 'kb-lock';
  lock.setAttribute('aria-hidden', 'true');
  document.body.appendChild(lock);
  const coarse = (navigator.maxTouchPoints || 0) > 0 && window.matchMedia('(any-pointer: coarse)').matches;
  const IGNORE = 'a,button,input,textarea,select,label,summary,[role=button],[data-kb-ignore],.menu,.nav,.accent__pop';
  const visible = () => canvas.style.opacity !== '0' && cur.o * show > 0.15;
  const touchOK = () => playW > 0.55 && visible();

  function pick(e) {
    if (!visible() || mapW > 0.5) return null;
    ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(model.pickables, false)[0];
    if (!hit) return null;
    const ud = hit.object.userData;
    if (ud.kind === 'body' && playW < 0.5) return null;
    return hit;
  }
  const blocked = (e) => e.target !== lock && e.target.closest && e.target.closest(IGNORE);
  const drags = new Map();
  let swallowUntil = 0;

  function velocityOf(hit) {
    const local = hit.object.worldToLocal(hit.point.clone());
    const len = hit.object.userData.black ? 1.55 * 0.62 : 1.55;
    return clamp(0.42 + 0.55 * (local.z / len), 0.35, 1);
  }

  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType !== 'mouse' && !touchOK()) return;
    if (blocked(e)) return;
    const hit = pick(e);
    if (!hit) return;
    const ud = hit.object.userData;
    e.preventDefault();
    swallowUntil = performance.now() + 500;
    audio.resume();
    if (ud.kind === 'key') {
      keyOn(ud.midi, 'p' + e.pointerId, velocityOf(hit));
      drags.set(e.pointerId, { kind: 'key', midi: ud.midi });
    } else if (ud.kind === 'btn') {
      press(ud.id);
      drags.set(e.pointerId, { kind: 'btn' });
    } else if (ud.kind === 'knob') {
      drags.set(e.pointerId, { kind: 'knob', id: ud.id, y: e.clientY, v: model.knobs[ud.id].value });
    } else if (ud.kind === 'wheel') {
      gsap.killTweensOf(model.wheels[ud.id]);
      drags.set(e.pointerId, { kind: 'wheel', id: ud.id, y: e.clientY });
    } else if (ud.kind === 'body') {
      gsap.killTweensOf(orb);
      drags.set(e.pointerId, { kind: 'orbit', x: e.clientX, y: e.clientY, rx: orb.rx, ry: orb.ry });
    }
    document.documentElement.classList.add('kb-playing');
  }, { capture: true, passive: false });

  window.addEventListener('pointermove', (e) => {
    const d = drags.get(e.pointerId);
    if (d) {
      e.preventDefault();
      if (d.kind === 'key') {
        const hit = pick(e);
        const m = hit && hit.object.userData.kind === 'key' ? hit.object.userData.midi : null;
        if (m !== d.midi) { // sliding a finger or the mouse across the keys plays a glissando
          keyOff(d.midi, 'p' + e.pointerId);
          if (m != null) { keyOn(m, 'p' + e.pointerId, velocityOf(hit)); d.midi = m; } else d.midi = -1;
        }
      } else if (d.kind === 'knob') {
        const v = clamp(d.v + (d.y - e.clientY) / 180, 0, 1);
        model.knobs[d.id].set(v);
        if (d.id === 'live1') audio.setReverb(v * 0.6);
        else if (d.id === 'live2') audio.setBright(v);
        else if (d.id === 'jog') { audio.bpm = Math.round(40 + v * 160); syncPanel(); }
        else if (d.id === 'master') { audio.setVolume(v); syncPanel(); }
        else if (d.id === 'direct') toast('DIRECT ACCESS — not available in this demo');
      } else if (d.kind === 'wheel') {
        const v = clamp((d.y - e.clientY) / 70, d.id === 'mod' ? 0 : -1, 1);
        model.wheels[d.id].value = v;
        applyWheels();
      } else if (d.kind === 'orbit') {
        orb.ry = clamp(d.ry + (e.clientX - d.x) * 0.006, -1.4, 1.4);
        orb.rx = clamp(d.rx + (e.clientY - d.y) * 0.004, -0.7, 0.7);
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    if (blocked(e)) { model.setHover(-1); document.documentElement.classList.remove('kb-hover'); return; }
    const hit = pick(e);
    const ud = hit && hit.object.userData;
    model.setHover(ud && ud.kind === 'key' ? ud.midi : -1);
    document.documentElement.classList.toggle('kb-hover', !!ud && ud.kind !== 'body');
    document.documentElement.classList.toggle('kb-grab', !!ud && ud.kind === 'body');
  }, { capture: true, passive: false });

  function endPointer(e) {
    const d = drags.get(e.pointerId);
    if (!d) return;
    drags.delete(e.pointerId);
    if (d.kind === 'key' && d.midi >= 0) keyOff(d.midi, 'p' + e.pointerId);
    if (d.kind === 'wheel' && d.id === 'pitch') {
      gsap.to(model.wheels.pitch, { value: 0, duration: 0.45, ease: 'back.out(2)', onUpdate: applyWheels, onComplete: applyWheels });
    }
    if (!drags.size) document.documentElement.classList.remove('kb-playing');
  }
  // pitch wheel bends (springs back); modulation wheel adds vibrato and stays where you leave it
  let vibT = 0;
  function applyWheels() { audio.setBend(model.wheels.pitch.value * 2 + Math.sin(vibT) * model.wheels.mod.value * 0.35); }
  setInterval(() => { vibT += 0.19; if (model.wheels.mod.value > 0.02) applyWheels(); }, 30);
  window.addEventListener('pointerup', endPointer, true);
  window.addEventListener('pointercancel', endPointer, true);
  window.addEventListener('blur', () => { releaseAll(); drags.clear(); });
  // a tap that played a key must not also click the link or card underneath it
  window.addEventListener('click', (e) => {
    if (performance.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  // ---- computer keyboard ---------------------------------------------------------------
  let octave = 0;
  const codeToMidi = (code) => {
    let i = ROW_LOW.indexOf(code);
    if (i >= 0) return 48 + octave * 12 + i;
    i = ROW_UP.indexOf(code);
    if (i >= 0) return 60 + octave * 12 + i;
    return -1;
  };
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
      octave = clamp(octave + (e.code === 'BracketRight' ? 1 : -1), -2, 2);
      toast('Octave shift ' + (octave > 0 ? '+' : '') + octave);
      return;
    }
    const m = codeToMidi(e.code);
    if (m < 0) return;
    if (e.repeat) { e.preventDefault(); return; }
    e.preventDefault();
    audio.resume();
    keyOn(m, 'k' + e.code, 0.78);
  });
  window.addEventListener('keyup', (e) => {
    const m = codeToMidi(e.code);
    // octave may have changed between down and up: release whatever this physical key started
    for (const [mm, s] of down) if (s.has('k' + e.code)) keyOff(mm, 'k' + e.code);
    void m;
  });

  // ---- HUD -----------------------------------------------------------------------------
  const hud = document.createElement('div');
  hud.className = 'kbhud';
  hud.id = 'kbhud';
  hud.setAttribute('data-kb-ignore', '');
  hud.setAttribute('role', 'group');
  hud.setAttribute('aria-label', 'Keyboard controls');
  hud.innerHTML = `
    <span class="kbhud__note" id="kb-note" aria-live="off"><i></i><b>ready</b></span>
    <button type="button" class="kbhud__btn" id="kb-snd" aria-label="Sound on or off" aria-pressed="true"></button>
    <input type="range" id="kb-vol" min="0" max="100" value="80" aria-label="Volume">
    <button type="button" class="kbhud__btn kbhud__txt" id="kb-reset" title="Return the keyboard to its original position">Reset view</button>
    <a class="kbhud__btn kbhud__txt" id="kb-go" href="#play" data-nav>Play ↓</a>`;
  document.body.appendChild(hud);
  syncPanel();
  document.getElementById('kb-snd').addEventListener('click', () => { audio.setMuted(!audio.muted); if (!audio.muted) audio.resume(); syncPanel(); });
  document.getElementById('kb-vol').addEventListener('input', (e) => {
    audio.setVolume(+e.target.value / 100);
    if (audio.muted && +e.target.value > 0) audio.setMuted(false);
    model.knobs.master.set(audio.volume);
    syncPanel();
  });
  document.getElementById('kb-reset').addEventListener('click', () => { resetView(true); toast('View reset'); });

  // samples: fetch quietly once the page is idle (decoded offline, so no autoplay warning)
  const warm = () => audio.load().then((ok) => { if (!ok) toast('Piano samples unavailable — using synth voices'); });
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);

  // ---- render loop ------------------------------------------------------------------------
  const clock = new THREE.Clock();
  const box = new THREE.Box3();
  const corner = new THREE.Vector3();
  let frame = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    solve();
    const k = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
    for (const key of Object.keys(cur)) cur[key] += (target[key] - cur[key]) * k;
    parallax.x += (parallax.tx - parallax.x) * 0.05;
    parallax.y += (parallax.ty - parallax.y) * 0.05;
    const calm = clamp(1 - playW * 1.4, 0, 1);
    const float = reduced ? 0 : Math.sin(t * 0.8);
    const s = (cur.f * 2 * halfW) / model.width;
    rig.scale.setScalar(s);
    model.root.position.set(-cur.fx, -0.7, -cur.fz);
    rimLight.intensity += ((60 + down.size * 30) - rimLight.intensity) * 0.2; // the room reacts to what you play
    rig.position.set(cur.nx * halfW, cur.ny * halfH + float * 0.05 * halfH * calm, 0);
    rig.rotation.set(cur.rx + orb.rx + parallax.y * 0.06 * calm, cur.ry + orb.ry + (reduced ? 0 : Math.sin(t * 0.45) * 0.025 + parallax.x * 0.1 * calm), cur.rz, 'XYZ');
    const o = clamp(cur.o * show, 0, 1);
    canvas.style.opacity = o < 0.01 ? '0' : o.toFixed(3);
    const blur = reduced ? 0 : clamp((1 - cur.o) * 2.2, 0, 1.8) * (1 - playW); // ghosted poses sit slightly out of focus, like a shallow depth of field
    canvas.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : '';
    hud.classList.toggle('is-away', mapW > 0.5 || show < 0.5);
    if (o >= 0.01 && !document.hidden) {
      model.update(dt);
      renderer.render(scene, camera);
    }
    // touch lock follows the keyboard on screen while it is the thing to play
    const lockOn = coarse && touchOK();
    if (lockOn && (frame++ % 3 === 0)) {
      box.setFromObject(model.root);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < 8; i++) {
        corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
        const px = (corner.x * 0.5 + 0.5) * window.innerWidth, py = (-corner.y * 0.5 + 0.5) * window.innerHeight;
        x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py);
      }
      Object.assign(lock.style, { left: x0 + 'px', top: y0 + 'px', width: x1 - x0 + 'px', height: y1 - y0 + 'px' });
    }
    lock.style.pointerEvents = lockOn ? 'auto' : 'none';
    if (playW < 0.25 && (orb.rx || orb.ry) && !gsap.isTweening(orb) && !drags.size) resetView(true); // leaving the studio: swing back
  }
  if (reduced) setInterval(tick, 100); else renderer.setAnimationLoop(tick);

  // debug / test hook
  if (/kbdebug/.test(location.search)) window.__kb = { audio, model, press, keyOn, keyOff, cur, target, camera, rig, get playW() { return playW; }, anchors: () => anchors };

  return {
    show() { gsap.to({ v: show }, { v: 1, duration: 1.6, ease: 'power2.out', onUpdate() { show = this.targets()[0].v; } }); },
    audio,
  };
}
