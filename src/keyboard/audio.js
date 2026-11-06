// Sound engine for the keyboard: real piano samples (Salamander Grand Piano, CC-BY 3.0, Alexander Holm)
// plus synthesised voices, reverb, tone filter, pitch bend, metronome, a small auto-accompaniment and a demo player.
// Everything is plain Web Audio: nothing to install for the visitor.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Samples shipped in public/audio/piano (every minor third, the engine pitch-shifts the gaps).
const SAMPLE_FILES = {};
['A1', 'C2', 'Ds2', 'Fs2', 'A2', 'C3', 'Ds3', 'Fs3', 'A3', 'C4', 'Ds4', 'Fs4', 'A4', 'C5', 'Ds5', 'Fs5', 'A5', 'C6', 'Ds6', 'Fs6', 'A6', 'C7', 'Ds7'].forEach((n) => {
  const m = n.match(/^([A-G])(s?)(\d)$/);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
  SAMPLE_FILES[n] = base + (parseInt(m[3], 10) + 1) * 12;
});

export const VOICES = {
  piano: 'Grand Piano',
  epiano: 'Electric Piano',
  organ: 'Pipe Organ',
  strings: 'Strings',
  synth: 'Synth Lead',
  bell: 'Bells',
};

export class KeyAudio {
  constructor() {
    this.ctx = null;
    this.volume = 0.8;
    this.muted = false;
    this.voice = 'piano';
    this.transpose = 0;
    this.reverbAmt = 0.18;
    this.reverbOn = true;
    this.bright = 0.8; // 0..1 low-pass cutoff
    this.sustain = false;
    this.bend = 0; // semitones
    this.bpm = 100;
    this.style = 'pop';
    this.samples = null; // Map midi -> AudioBuffer once loaded
    this.loading = null;
    this.ready = false;
    this.active = new Map(); // midi -> voice
    this.held = new Set(); // released while sustain was on
    this.onBeat = null; // (beatIndex) for the display
    this.onChord = null; // (midis[], seconds) so the keys can follow the accompaniment
    this.metro = false;
    this.acc = false;
    this._step = 0;
    this._next = 0;
    this._timer = 0;
    this.demoTimers = [];
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC({ latencyHint: 'interactive' }));
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 4;
    this.bus = ctx.createGain(); // all played voices
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(2.4);
    this.bus.connect(this.tone);
    this.tone.connect(this.dry).connect(this.master);
    this.tone.connect(this.verb).connect(this.wet).connect(this.master);
    this.accBus = ctx.createGain();
    this.accBus.gain.value = 0.55;
    this.accBus.connect(this.master);
    this.master.connect(this.comp).connect(ctx.destination);
    this._applyTone();
    this._applyVerb();
  }

  _impulse(sec) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return b;
  }

  _applyTone() {
    if (!this.ctx) return;
    const f = 500 * Math.pow(40, this.bright); // 500 Hz .. 20 kHz
    this.tone.frequency.setTargetAtTime(Math.min(f, 20000), this.ctx.currentTime, 0.03);
  }
  _applyVerb() {
    if (!this.ctx) return;
    const a = this.reverbOn ? this.reverbAmt : 0;
    this.wet.gain.setTargetAtTime(a * 1.4, this.ctx.currentTime, 0.05);
    this.dry.gain.setTargetAtTime(1 - a * 0.35, this.ctx.currentTime, 0.05);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    this.load();
  }

  // Samples are fetched the first time the visitor interacts (or asks for them). Returns a promise.
  load() {
    if (this.loading) return this.loading;
    const base = import.meta.env.BASE_URL + 'audio/piano/';
    // decode with an offline context: works before the visitor's first click (no autoplay warning) and the buffers play in any context
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.resolve(false);
    const dec = new OAC(2, 1, 44100);
    this.samples = new Map();
    this.loading = Promise.all(
      Object.entries(SAMPLE_FILES).map(async ([n, midi]) => {
        try {
          const r = await fetch(base + n + '.mp3');
          if (!r.ok) throw new Error(r.status);
          const buf = await dec.decodeAudioData(await r.arrayBuffer());
          this.samples.set(midi, buf);
        } catch (e) { /* that sample is missing: the engine falls back to a neighbour */ }
      })
    ).then(() => { this.ready = this.samples.size > 0; return this.ready; });
    return this.loading;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
  }
  setMuted(m) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.02);
  }
  setBright(v) { this.bright = Math.max(0, Math.min(1, v)); this._applyTone(); }
  setReverb(v) { this.reverbAmt = Math.max(0, Math.min(1, v)); this._applyVerb(); }
  setReverbOn(o) { this.reverbOn = o; this._applyVerb(); }
  setBend(semi) {
    this.bend = semi;
    this.active.forEach((v) => v.bend && v.bend(semi * 100));
  }

  // ---- notes ----------------------------------------------------------------
  noteOn(midi, vel = 0.8) {
    this.resume();
    if (!this.ctx || this.muted) return;
    if (this.active.has(midi)) this._kill(midi, 0.04);
    this.held.delete(midi);
    const m = midi + this.transpose;
    const t = this.ctx.currentTime + 0.001;
    const v = this._make(this.voice, m, vel, t);
    if (v) { if (this.bend) v.bend(this.bend * 100); this.active.set(midi, v); }
  }

  noteOff(midi) {
    if (!this.active.has(midi)) return;
    if (this.sustain) { this.held.add(midi); return; }
    this._kill(midi);
  }
  _kill(midi, tc) {
    const v = this.active.get(midi);
    if (v) v.release(tc);
    this.active.delete(midi);
  }
  setSustain(on) {
    this.sustain = on;
    if (!on) { this.held.forEach((m) => this._kill(m)); this.held.clear(); }
  }
  allOff() {
    [...this.active.keys()].forEach((m) => this._kill(m, 0.05));
    this.held.clear();
  }

  _make(voice, m, vel, t, dest) {
    const ctx = this.ctx;
    const out = dest || this.bus;
    if (voice === 'piano') {
      if (this.samples && this.samples.size) return this._sample(m, vel, t, out);
      voice = 'epiano'; // samples missing or still loading: play something musical rather than silence
    }
    const f = hz(m);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(out);
    const oscs = [];
    const add = (type, mult, gain, det = 0, to = g) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f * mult;
      o.detune.value = det;
      const og = ctx.createGain();
      og.gain.value = gain;
      o.connect(og).connect(to);
      o.start(t);
      oscs.push(o);
      return og;
    };
    let atk = 0.004, dec = 0.9, sus = 0.0, rel = 0.25, peak = 0.5 * vel;
    if (voice === 'epiano') {
      add('sine', 1, 1);
      const h2 = add('sine', 2, 0.35);
      const h4 = add('triangle', 4, 0.12);
      h2.gain.setTargetAtTime(0.02, t, 0.35);
      h4.gain.setTargetAtTime(0, t, 0.12);
      sus = 0.12; dec = 1.6; peak = 0.55 * vel;
    } else if (voice === 'organ') {
      [1, 2, 3, 4, 6].forEach((k, i) => add('sine', k, [1, 0.7, 0.35, 0.25, 0.12][i]));
      atk = 0.015; dec = 0.01; sus = 1; rel = 0.09; peak = 0.22 * vel;
    } else if (voice === 'strings') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1900;
      lp.connect(g);
      add('sawtooth', 1, 0.5, -9, lp);
      add('sawtooth', 1, 0.5, 9, lp);
      add('sawtooth', 2, 0.18, 4, lp);
      atk = 0.28; dec = 0.01; sus = 1; rel = 0.7; peak = 0.16 * vel;
    } else if (voice === 'synth') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      lp.Q.value = 4;
      lp.connect(g);
      add('sawtooth', 1, 0.5, -6, lp);
      add('square', 1, 0.3, 6, lp);
      atk = 0.01; dec = 0.4; sus = 0.7; rel = 0.18; peak = 0.28 * vel;
    } else { // bell
      [[1, 1, 1.6], [2.76, 0.5, 0.9], [5.4, 0.3, 0.5], [8.93, 0.14, 0.3]].forEach(([k, a, d]) => {
        const og = add('sine', k, a);
        og.gain.setTargetAtTime(0, t + 0.01, d / 3);
      });
      atk = 0.002; dec = 2.4; sus = 0.0; rel = 0.4; peak = 0.4 * vel;
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    if (sus < 1) g.gain.setTargetAtTime(peak * sus, t + atk, dec / 3);
    let done = false;
    return {
      bend: (c) => oscs.forEach((o) => o.detune.setTargetAtTime(c, ctx.currentTime, 0.02)),
      release: (tc) => {
        if (done) return;
        done = true;
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.setTargetAtTime(0, now, (tc || rel) / 3);
        oscs.forEach((o) => { try { o.stop(now + (tc || rel) + 0.4); } catch (e) { /* already stopped */ } });
        setTimeout(() => g.disconnect(), ((tc || rel) + 0.6) * 1000);
      },
    };
  }

  _sample(m, vel, t, out) {
    const ctx = this.ctx;
    let best = null, bd = 99;
    this.samples.forEach((buf, sm) => { const d = Math.abs(sm - m); if (d < bd) { bd = d; best = [sm, buf]; } });
    const src = ctx.createBufferSource();
    src.buffer = best[1];
    src.playbackRate.value = Math.pow(2, (m - best[0]) / 12);
    const g = ctx.createGain();
    // louder keys get a little more attack-bite from a slight velocity curve
    const peak = Math.pow(vel, 1.4) * 0.95;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.003);
    src.connect(g).connect(out);
    src.start(t);
    let done = false;
    return {
      bend: (c) => src.detune.setTargetAtTime(c, ctx.currentTime, 0.02),
      release: (tc) => {
        if (done) return;
        done = true;
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.setTargetAtTime(0, now, (tc || 0.45) / 3); // soft damper, not a click
        try { src.stop(now + (tc || 0.45) + 0.5); } catch (e) { /* already stopped */ }
        setTimeout(() => g.disconnect(), 1500);
      },
    };
  }

  // ---- transport: metronome + auto accompaniment -------------------------------
  startTransport() {
    this.resume();
    if (!this.ctx || this._timer) return;
    this._step = 0;
    this._next = this.ctx.currentTime + 0.06;
    this._timer = setInterval(() => this._schedule(), 25);
  }
  stopTransport() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = 0;
  }
  updateTransport() {
    if (!this.metro && !this.acc) this.stopTransport();
    else this.startTransport();
  }
  setMetro(on) { this.metro = on; this.updateTransport(); }
  setAcc(on) { this.acc = on; this.updateTransport(); }

  _schedule() {
    const ctx = this.ctx;
    const spb = 60 / this.bpm / 4; // seconds per 16th
    while (this._next < ctx.currentTime + 0.12) {
      this._play16(this._step, this._next, spb);
      this._next += spb;
      this._step++;
    }
  }

  _play16(step, t, spb) {
    const s = step % 16;
    const bar = Math.floor(step / 16);
    if (s % 4 === 0) {
      const beat = s / 4;
      if (this.onBeat) setTimeout(() => this.onBeat(beat, bar), Math.max(0, (t - this.ctx.currentTime) * 1000));
      if (this.metro) this._click(t, beat === 0);
    }
    if (!this.acc) return;
    const P = STYLES[this.style];
    const chord = PROG[bar % PROG.length];
    if (P.kick.includes(s)) this._kick(t);
    if (P.snare.includes(s)) this._snare(t);
    if (P.hat.includes(s)) this._hat(t, s % 4 === 0 ? 1 : 0.55);
    if (P.bass.includes(s)) this._bass(chord[0] - 12, t, spb * 3.2);
    if (s === 0) {
      const notes = chord.map((n) => n + 12);
      const len = spb * 16;
      notes.forEach((n) => this._padNote(n, t, len));
      if (this.onChord) setTimeout(() => this.onChord(notes, len * 0.92), Math.max(0, (t - this.ctx.currentTime) * 1000));
    }
  }

  _click(t, accent) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = accent ? 1600 : 1000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o.connect(g).connect(this.accBus);
    o.start(t);
    o.stop(t + 0.07);
  }
  _noise(dur) {
    const ctx = this.ctx;
    if (!this._nb) {
      this._nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this._nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource();
    s.buffer = this._nb;
    s.loop = true;
    return s;
  }
  _kick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g).connect(this.accBus);
    o.start(t);
    o.stop(t + 0.3);
  }
  _snare(t) {
    const ctx = this.ctx;
    const n = this._noise();
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    n.connect(f).connect(g).connect(this.accBus);
    n.start(t);
    n.stop(t + 0.2);
  }
  _hat(t, a) {
    const ctx = this.ctx;
    const n = this._noise();
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16 * a, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(f).connect(g).connect(this.accBus);
    n.start(t);
    n.stop(t + 0.07);
  }
  _bass(m, t, len) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = hz(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(this.accBus);
    o.start(t);
    o.stop(t + len + 0.05);
  }
  _padNote(m, t, len) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1300;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.12);
    g.gain.setValueAtTime(0.1, t + len - 0.2);
    g.gain.linearRampToValueAtTime(0.0001, t + len);
    [-7, 7].forEach((d) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(m);
      o.detune.value = d;
      o.connect(lp);
      o.start(t);
      o.stop(t + len + 0.05);
    });
    lp.connect(g).connect(this.accBus);
  }

  // ---- demo: the opening of Beethoven's Für Elise (public domain) --------------
  playDemo(onNote, onEnd) {
    this.stopDemo();
    this.resume();
    const E5 = 76, Ds5 = 75, B4 = 71, D5 = 74, C5 = 72, A4 = 69, C4 = 60, E4 = 64, Gs4 = 68, A2 = 45, E3 = 52, A3 = 57, E2 = 40;
    // [midi, start in 16ths, length in 16ths]
    const mel = [
      [E5, 0, 1], [Ds5, 1, 1], [E5, 2, 1], [Ds5, 3, 1], [E5, 4, 1], [B4, 5, 1], [D5, 6, 1], [C5, 7, 1], [A4, 8, 3],
      [A2, 8, 1], [E3, 9, 1], [A3, 10, 1],
      [C4, 11, 1], [E4, 12, 1], [A4, 13, 1], [B4, 14, 3],
      [E2, 14, 1], [E3, 15, 1], [Gs4, 16, 1],
      [E4, 17, 1], [Gs4, 18, 1], [B4, 19, 1], [C5, 20, 3],
      [A2, 20, 1], [E3, 21, 1], [A3, 22, 1],
      [E4, 23, 1], [E5, 24, 1], [Ds5, 25, 1], [E5, 26, 1], [Ds5, 27, 1], [E5, 28, 1], [B4, 29, 1], [D5, 30, 1], [C5, 31, 1], [A4, 32, 3],
      [A2, 32, 1], [E3, 33, 1], [A3, 34, 1],
      [C4, 35, 1], [E4, 36, 1], [A4, 37, 1], [B4, 38, 3],
      [E2, 38, 1], [E3, 39, 1], [Gs4, 40, 1],
      [E4, 41, 1], [C5, 42, 1], [B4, 43, 1], [A4, 44, 6],
    ];
    const s16 = 60 / 132 / 4;
    this.demoOn = true;
    mel.forEach(([m, st, ln]) => {
      this.demoTimers.push(setTimeout(() => { if (this.demoOn) onNote(m, true); }, 250 + st * s16 * 1000));
      this.demoTimers.push(setTimeout(() => { if (this.demoOn) onNote(m, false); }, 250 + (st + ln) * s16 * 1000 - 20));
    });
    this.demoTimers.push(setTimeout(() => { this.demoOn = false; onEnd && onEnd(); }, 250 + 51 * s16 * 1000));
  }
  stopDemo() {
    this.demoTimers.forEach(clearTimeout);
    this.demoTimers = [];
    this.demoOn = false;
  }
}

// C - Am - F - G in C major: [root, third, fifth] around C3, the pad plays them an octave up
const PROG = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]];

const STYLES = {
  pop: { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [0, 6, 8, 14] },
  disco: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], bass: [0, 2, 4, 6, 8, 10, 12, 14] },
  latin: { kick: [0, 7, 10], snare: [4, 12, 15], hat: [0, 2, 4, 6, 8, 10, 12, 14], bass: [0, 7, 8, 15] },
  ballad: { kick: [0, 10], snare: [8], hat: [0, 4, 8, 12], bass: [0, 8] },
};
