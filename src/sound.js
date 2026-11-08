/**
 * Station sound (optional, OFF until the visitor presses the speaker button).
 * Everything is synthesised with the Web Audio API: no audio files, so nothing to license or download.
 *  - a low engine hum with slow movement
 *  - a short blip on taps and buttons
 *  - a soft whoosh when the camera moves to another room
 * The choice is remembered. Browsers only allow audio after a tap, so a saved "on" resumes on the first tap anywhere.
 */
const KEY = 'sound';
const read = () => { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } };
const write = (v) => { try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* private mode: fine */ } };

export function initSound() {
  const btn = document.getElementById('sound-toggle');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!btn) return;
  if (!AC) { btn.remove(); return; }

  let ctx = null, master = null, noiseBuf = null, on = false, lastWhoosh = 0;

  const noise = () => {
    if (noiseBuf) return noiseBuf;
    const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown noise
    return (noiseBuf = buf);
  };

  function build() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    // Engine hum: two detuned low sines + a filtered rumble whose brightness drifts slowly.
    const hum = ctx.createGain(); hum.gain.value = 0.5; hum.connect(master);
    [55, 82.6].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.detune.value = i ? 7 : -4;
      const g = ctx.createGain(); g.gain.value = i ? 0.18 : 0.3; o.connect(g); g.connect(hum); o.start();
    });
    const rumble = ctx.createBufferSource(); rumble.buffer = noise(); rumble.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 0.7;
    const rg = ctx.createGain(); rg.gain.value = 0.35;
    rumble.connect(lp); lp.connect(rg); rg.connect(hum); rumble.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 90; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  }

  const blip = () => {
    if (!on || !ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(920, t); o.frequency.exponentialRampToValueAtTime(1380, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.12);
  };

  const whoosh = () => {
    if (!on || !ctx) return;
    const now = performance.now();
    if (now - lastWhoosh < 700) return; // one per room change, even if triggers fire together
    lastWhoosh = now;
    const t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = noise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(1700, t + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
    src.connect(bp); bp.connect(g); g.connect(master); src.start(t); src.stop(t + 1);
  };

  async function set(v, remember = true) {
    on = v;
    btn.classList.toggle('is-on', v);
    btn.setAttribute('aria-pressed', String(v));
    btn.setAttribute('aria-label', v ? 'Turn station sound off' : 'Turn station sound on');
    if (remember) write(v);
    if (v) {
      if (!ctx) build();
      try { await ctx.resume(); } catch (e) { /* needs a tap; the next one resumes it */ }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
      blip();
    } else if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    }
  }

  btn.addEventListener('click', () => set(!on));
  // A saved "on" can only start after a tap, because browsers block sound before one.
  if (read()) {
    btn.classList.add('is-armed');
    const arm = () => { document.removeEventListener('pointerdown', arm, true); btn.classList.remove('is-armed'); set(true, false); };
    document.addEventListener('pointerdown', arm, true);
  }
  document.addEventListener('pointerdown', (e) => { if (on && e.target.closest('.btn, .ctl:not(#sound-toggle), .menu__list a, [data-nav]')) blip(); }, true);
  document.addEventListener('station:section', whoosh);
  // No sound while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (on) ctx.resume();
  });
}
