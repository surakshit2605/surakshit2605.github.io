// The colour display of the keyboard, drawn on a canvas that becomes the LCD texture.
import * as THREE from 'three';
import { noteName } from './audio.js';
export const MIDI_LO = 36, MIDI_HI = 96;
export const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);
const WHITE_INDEX = new Map(); let nWhite = 0;
for (let m = MIDI_LO; m <= MIDI_HI; m++) if (!isBlack(m)) WHITE_INDEX.set(m, nWhite++);

export function createLcd() {
  const lcdCanvas = document.createElement('canvas');
  lcdCanvas.width = 1024; lcdCanvas.height = 576;
  const lcdTex = new THREE.CanvasTexture(lcdCanvas);
  lcdTex.colorSpace = THREE.SRGBColorSpace; lcdTex.anisotropy = 8; lcdTex.flipY = false;
  const lg = lcdCanvas.getContext('2d');
  const state = { voice: 'Grand Piano', notes: [], tempo: 100, trans: 0, style: 'POP ROCK', reverb: true, sustain: false, metro: false, acc: false, beat: -1, msg: '', demo: false, vol: 0.8, loading: false };
  let lcdDirty = true;
  function drawLcd() {
    const W = 1024, H = 576, s = state;
    const bg = lg.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b1a3a'); bg.addColorStop(1, '#04101f');
    lg.fillStyle = bg; lg.fillRect(0, 0, W, H);
    // header
    lg.fillStyle = '#1b3a78'; lg.fillRect(0, 0, W, 64);
    lg.fillStyle = '#e8f1ff'; lg.font = '700 30px "JetBrains Mono Variable", monospace'; lg.textBaseline = 'middle';
    lg.textAlign = 'left'; lg.fillText('HOME', 26, 33);
    lg.textAlign = 'right'; lg.fillStyle = '#9fc2ff'; lg.font = '600 24px "JetBrains Mono Variable", monospace';
    lg.fillText(`VOL ${Math.round(s.vol * 100)}`, W - 26, 33);
    // voice
    lg.textAlign = 'left'; lg.fillStyle = '#7fa6e6'; lg.font = '600 22px "JetBrains Mono Variable", monospace';
    lg.fillText('VOICE', 34, 108);
    lg.fillStyle = '#ffffff'; lg.font = '700 54px "Space Grotesk Variable", system-ui, sans-serif';
    lg.fillText(s.voice, 34, 160);
    lg.fillStyle = '#7fa6e6'; lg.font = '600 22px "JetBrains Mono Variable", monospace';
    lg.fillText('STYLE', 34, 224);
    lg.fillStyle = '#ffd37a'; lg.font = '700 38px "Space Grotesk Variable", system-ui, sans-serif';
    lg.fillText(s.style, 34, 266);
    // notes
    lg.fillStyle = '#7fa6e6'; lg.font = '600 22px "JetBrains Mono Variable", monospace';
    lg.fillText('NOTES', 34, 330);
    lg.fillStyle = '#7dffb0'; lg.font = '700 46px "JetBrains Mono Variable", monospace';
    lg.fillText(s.notes.length ? s.notes.slice(0, 5).map(noteName).join(' ') : '—', 34, 380);
    // right column
    const rows = [['TEMPO', '♩ = ' + s.tempo], ['TRANSPOSE', (s.trans > 0 ? '+' : '') + s.trans], ['REVERB', s.reverb ? 'ON' : 'OFF'], ['SUSTAIN', s.sustain ? 'ON' : 'OFF'], ['METRONOME', s.metro ? 'ON' : 'OFF']];
    rows.forEach(([k, v], i) => {
      const y = 112 + i * 56;
      lg.textAlign = 'left'; lg.fillStyle = '#7fa6e6'; lg.font = '600 20px "JetBrains Mono Variable", monospace';
      lg.fillText(k, 600, y);
      lg.textAlign = 'right'; lg.fillStyle = v === 'ON' ? '#7dffb0' : '#ffffff'; lg.font = '700 30px "JetBrains Mono Variable", monospace';
      lg.fillText(v, W - 34, y);
      lg.fillStyle = 'rgba(127,166,230,0.18)'; lg.fillRect(600, y + 22, W - 634, 1);
    });
    // beat lamps
    for (let i = 0; i < 4; i++) {
      lg.fillStyle = s.beat === i ? (i === 0 ? '#ffd37a' : '#7dffb0') : 'rgba(255,255,255,0.14)';
      lg.beginPath(); lg.arc(630 + i * 46, 410, 14, 0, 7); lg.fill();
    }
    lg.textAlign = 'right'; lg.fillStyle = s.acc ? '#ffd37a' : 'rgba(255,255,255,0.35)'; lg.font = '700 22px "JetBrains Mono Variable", monospace';
    lg.fillText(s.acc ? 'ACMP ON' : 'ACMP OFF', W - 34, 410);
    // message strip
    lg.textAlign = 'left'; lg.fillStyle = 'rgba(255,255,255,0.08)'; lg.fillRect(0, 432, W, 46);
    lg.fillStyle = '#cfe0ff'; lg.font = '600 22px "JetBrains Mono Variable", monospace';
    lg.fillText(s.msg || (s.loading ? 'Loading piano samples…' : 'Click the keys or use your computer keyboard'), 26, 456);
    // 61-key strip
    const kx = 26, kw = W - 52, ky = 488, kh = 64;
    lg.fillStyle = '#e8eefc'; lg.fillRect(kx, ky, kw, kh);
    const ww = kw / nWhite;
    for (let m = MIDI_LO; m <= MIDI_HI; m++) {
      if (isBlack(m)) continue;
      const wi = WHITE_INDEX.get(m);
      if (s.notes.includes(m)) { lg.fillStyle = '#4ea1ff'; lg.fillRect(kx + wi * ww + 1, ky, ww - 2, kh); }
      else { lg.fillStyle = '#05080f'; lg.fillRect(kx + wi * ww - 0.5, ky, 1, kh); }
    }
    for (let m = MIDI_LO; m <= MIDI_HI; m++) {
      if (!isBlack(m)) continue;
      const wi = WHITE_INDEX.get(m - 1);
      lg.fillStyle = s.notes.includes(m) ? '#4ea1ff' : '#05080f';
      lg.fillRect(kx + (wi + 1) * ww - ww * 0.3, ky, ww * 0.6, kh * 0.62);
    }
    lcdTex.needsUpdate = true;
  }
  drawLcd();
  let lcdT = 0;
  const setLcd = (patch) => { Object.assign(state, patch); lcdDirty = true; };
  const update = (dt) => { if (lcdDirty) { lcdT += dt; if (lcdT > 0.06) { drawLcd(); lcdDirty = false; lcdT = 0; } } };
  return { lcdTex, state, setLcd, update };
}
