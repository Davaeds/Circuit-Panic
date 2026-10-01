/* Circuit Panic! — all sound is synthesized live with Web Audio (no files).
   Music: a swung, minor-key stride tune (oom-pah tuba bass, piano stabs, a
   muted-horn melody, brushes, record crackle and a theremin swoop). */
(function () {
  'use strict';
  const S = { music: 0.55, sfx: 0.8, scares: true };
  const BPM = 124, BEAT = 60 / BPM;
  let ctx = null, master, musicBus, sfxBus, echoIn, noiseBuf, crackle;
  let musicOn = false, musicStart = 0, nextStep = 0, stepIdx = 0, timer = null;
  const perf0 = performance.now() / 1000;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    echoIn = ctx.createGain();
    const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
    dl.delayTime.value = 0.23; fb.gain.value = 0.34; wet.gain.value = 0.5;
    echoIn.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(sfxBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const cb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const cd = cb.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0) + (Math.random() * 2 - 1) * 0.012;
    crackle = { buf: cb, src: null };
    layersInit();
    apply();
  }

  function apply() {
    if (!ctx) return;
    musicBus.gain.setTargetAtTime(S.music * 0.8, ctx.currentTime, 0.05);
    sfxBus.gain.setTargetAtTime(S.sfx, ctx.currentTime, 0.05);
  }

  function tone(freq, t, dur, o = {}) {
    const osc = ctx.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + (o.glideT || dur));
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = o.cutoff || 3000; f.Q.value = o.q || 0.7;
    const g = ctx.createGain();
    const a = o.attack || 0.005, vol = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    if (o.sustain) g.gain.setValueAtTime(vol, t + a + o.sustain);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (o.sustain || 0) + dur);
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + a + (o.sustain || 0) + dur + 0.05);
    }
    osc.connect(f); f.connect(g); g.connect(o.bus || musicBus);
    if (o.echo) g.connect(echoIn);
    osc.start(t); osc.stop(t + a + (o.sustain || 0) + dur + 0.05);
  }

  function noise(t, dur, o = {}) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'highpass'; f.frequency.setValueAtTime(o.freq || 6000, t); f.Q.value = o.q || 0.8;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.1, t + (o.attack || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus || musicBus);
    if (o.echo) g.connect(echoIn);
    s.start(t, Math.random() * 1.5, dur + 0.05);
  }

  /* ---------- the tune ---------- */
  const CH = {
    Dm: { root: 38, fifth: 45, stab: [65, 69, 74] },
    A7: { root: 45, fifth: 40, stab: [67, 73, 76] },
    Gm: { root: 43, fifth: 50, stab: [67, 70, 74] },
    Bb7: { root: 46, fifth: 41, stab: [68, 70, 74] },
    E7b: { root: 40, fifth: 46, stab: [68, 70, 74] },
  };
  const PROG = ['Dm', 'A7', 'Dm', 'Gm', 'Bb7', 'A7', 'Dm', 'A7'];
  const _ = null;
  const MEL = [
    [69, _, 74, _, 77, 76, 74, _],
    [73, _, 76, _, 79, 77, 76, _],
    [74, 77, 81, _, 80, 81, 77, 74],
    [70, _, 74, _, 79, _, 74, 70],
    [77, 76, 77, 74, 70, _, 68, _],
    [73, 76, 79, _, 82, 81, 79, 76],
    [77, _, 74, _, 69, 70, 69, _],
    [73, _, _, _, 64, 66, 68, 69],
  ];
  const MEL_B = [
    [_, _, 62, 65, 69, _, 65, _],
    [_, _, 61, 64, 67, _, 64, _],
    [74, _, 72, _, 70, _, 69, _],
    [67, _, 70, _, 74, 73, 74, _],
    [_, 77, _, 74, _, 70, _, 68],
    [69, _, 73, _, 76, _, 79, _],
    [81, 80, 81, 77, 74, _, 69, _],
    [_, 73, 74, 76, 77, 76, 73, _],
  ];

  function stepTime(i) {
    const beat = Math.floor(i / 2);
    return musicStart + beat * BEAT + (i % 2 ? BEAT * 0.64 : 0);
  }

  /* ---------- music layers ----------
     Four extra parts over the same tune, each on its own fader, faded in by
     what's happening on screen (AudioSys.mood): a sleepy pad when you're idle,
     tense tremolo strings for danger, a bright brass line for success, and a
     theremin with a low drone while the Phantom is out. A part only plays notes
     while its fader is up (or still fading out). */
  const LAYERS = ['idle', 'danger', 'success', 'phantom'];
  const lay = {};
  function layersInit() {
    for (const k of LAYERS) { const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(musicBus); lay[k] = { g, want: 0, until: 0 }; }
  }
  function mood(m) {
    if (!ctx || !lay.idle) return;
    for (const k of LAYERS) {
      const v = Math.max(0, Math.min(1, (m && m[k]) || 0));
      const L = lay[k];
      if (Math.abs(v - L.want) < 0.02) continue;
      L.want = v;
      /* in quickly for danger, slow swells for the rest; out over a couple of seconds */
      L.g.gain.setTargetAtTime(Math.max(0.0001, v), ctx.currentTime, v > 0 ? (k === 'danger' ? 0.25 : 0.9) : 0.7);
      if (v > 0) L.until = Infinity; else L.until = ctx.currentTime + 3.5;
    }
  }
  const live = k => lay[k] && (lay[k].want > 0.01 || ctx.currentTime < lay[k].until);
  function playLayers(bar, s, ch, mel, t) {
    if (live('idle') && s === 0) for (const n of ch.stab) tone(mtof(n - 12), t, 0.6, { type: 'sine', vol: 0.05, attack: 0.35, sustain: BEAT * 2.6, cutoff: 1400, bus: lay.idle.g });
    if (live('danger')) {
      tone(mtof(ch.root + 12 + (s % 2)), t, 0.11, { type: 'sawtooth', vol: 0.045, cutoff: 1100, bus: lay.danger.g });
      if (s === 0) tone(mtof(ch.root - 12), t, 0.35, { type: 'sine', vol: 0.18, glide: mtof(ch.root - 17), bus: lay.danger.g });
    }
    if (live('success')) {
      if (mel != null) tone(mtof(mel + 12), t, 0.14, { type: 'triangle', vol: 0.055, cutoff: 3200, bus: lay.success.g });
      if (s === 0 || s === 4) for (const n of ch.stab) tone(mtof(n), t, 0.16, { type: 'square', vol: 0.03, cutoff: 1500 + (s === 0 ? 900 : 0), bus: lay.success.g });
    }
    if (live('phantom') && s === 0 && bar % 2 === 0) {
      tone(mtof(ch.stab[0] + 12), t, 0.6, { type: 'sine', vol: 0.06, attack: 0.4, sustain: BEAT * 2.4, glide: mtof(ch.stab[1] + 12), glideT: BEAT * 3, vib: [5.5, 16], cutoff: 4000, bus: lay.phantom.g });
      tone(mtof(ch.root - 12), t, 0.7, { type: 'sawtooth', vol: 0.06, attack: 0.5, sustain: BEAT * 3, cutoff: 320, bus: lay.phantom.g });
    }
  }

  function playStep(i, t) {
    const bar = Math.floor(i / 8) % 8, s = i % 8, loop = Math.floor(i / 64);
    const ch = CH[PROG[bar]];
    if (lay.idle) playLayers(bar, s, ch, (loop % 2 ? MEL_B : MEL)[bar][s], t);
    if (s === 0) tone(mtof(ch.root), t, 0.32, { type: 'triangle', vol: 0.34, cutoff: 900 });
    if (s === 4) tone(mtof(ch.fifth), t, 0.3, { type: 'triangle', vol: 0.3, cutoff: 900 });
    if (s === 7 && bar % 2 === 1) tone(mtof(ch.root + 2), t, 0.14, { type: 'triangle', vol: 0.22, cutoff: 900 });
    if (s === 2 || s === 6) {
      for (const n of ch.stab) tone(mtof(n), t, 0.13, { type: 'sawtooth', vol: 0.045, cutoff: 1700 });
      noise(t, 0.09, { type: 'bandpass', freq: 2400, q: 0.6, vol: 0.05 });
    }
    if (s % 2 === 1) noise(t, 0.035, { freq: 8000, vol: 0.03 });
    const mel = (loop % 2 ? MEL_B : MEL)[bar][s];
    if (mel != null) {
      if (loop % 2) tone(mtof(mel), t, 0.2, { type: 'triangle', vol: 0.16, cutoff: 2600, vib: [5.5, 3] });
      else tone(mtof(mel), t, 0.16, { type: 'square', vol: 0.075, cutoff: 1900, q: 2, vib: [6, 2.5] });
    }
    if (bar === 7 && s === 0 && loop % 2 === 0) {
      tone(mtof(81), t, 0.5, { type: 'sine', vol: 0.07, attack: 0.15, sustain: 0.6, glide: mtof(62), glideT: 1.4, vib: [6.5, 14], cutoff: 5000 });
    }
  }

  function scheduler() {
    if (!musicOn) return;
    while (nextStep < ctx.currentTime + 0.15) {
      playStep(stepIdx, nextStep);
      stepIdx++;
      nextStep = stepTime(stepIdx);
    }
  }

  function startMusic() {
    if (!ctx || musicOn) return;
    musicOn = true;
    musicStart = ctx.currentTime + 0.08;
    stepIdx = 0; nextStep = musicStart;
    timer = setInterval(scheduler, 25);
    const src = ctx.createBufferSource();
    src.buffer = crackle.buf; src.loop = true;
    const g = ctx.createGain(); g.gain.value = 0.5;
    src.connect(g); g.connect(musicBus); src.start();
    crackle.src = src;
  }
  function stopMusic() {
    musicOn = false;
    clearInterval(timer);
    if (crackle && crackle.src) { crackle.src.stop(); crackle.src = null; }
  }

  function beat() {
    if (ctx && musicOn) return (ctx.currentTime - musicStart) / BEAT;
    return (performance.now() / 1000 - perf0) / BEAT;
  }

  /* ---------- sound effects ---------- */
  const now = () => ctx.currentTime + 0.01;
  const X = {
    hover() { if (!ctx) return; tone(1320, now(), 0.05, { type: 'triangle', vol: 0.09, bus: sfxBus, cutoff: 5000 }); },
    select() {
      if (!ctx) return; const t = now();
      tone(523, t, 0.1, { type: 'square', vol: 0.1, bus: sfxBus, cutoff: 3000 });
      tone(784, t + 0.07, 0.1, { type: 'square', vol: 0.1, bus: sfxBus, cutoff: 3000 });
      tone(1047, t + 0.14, 0.22, { type: 'square', vol: 0.1, bus: sfxBus, cutoff: 3000, vib: [7, 8] });
    },
    squeak() { if (!ctx) return; tone(620, now(), 0.16, { type: 'sine', vol: 0.22, bus: sfxBus, glide: 1500, glideT: 0.1 }); },
    gulp() { if (!ctx) return; tone(340, now(), 0.12, { type: 'sine', vol: 0.25, bus: sfxBus, glide: 110 }); },
    boing() { if (!ctx) return; tone(180, now(), 0.45, { type: 'sine', vol: 0.25, bus: sfxBus, glide: 260, vib: [16, 50] }); },
    thud() { if (!ctx) return; tone(130, now(), 0.18, { type: 'sine', vol: 0.4, bus: sfxBus, glide: 45 }); },
    whoosh() { if (!ctx) return; noise(now(), 0.4, { type: 'bandpass', freq: 400, sweep: 2600, q: 1.5, vol: 0.2, bus: sfxBus, attack: 0.12 }); },
    slide(up = true) { if (!ctx) return; tone(up ? 400 : 1500, now(), 0.45, { type: 'sine', vol: 0.14, bus: sfxBus, glide: up ? 1500 : 380, vib: [5, 10] }); },
    tick() { if (!ctx) return; noise(now(), 0.025, { freq: 3000, vol: 0.2, bus: sfxBus }); tone(90, now(), 0.04, { type: 'square', vol: 0.08, bus: sfxBus, cutoff: 600 }); },
    fizzle() {
      if (!ctx) return; const t = now();
      for (let i = 0; i < 5; i++) noise(t + i * 0.035 + Math.random() * 0.02, 0.03, { type: 'bandpass', freq: 2500 + Math.random() * 4000, q: 3, vol: 0.12, bus: sfxBus });
    },
    zap() {
      if (!ctx) return; const t = now();
      for (let i = 0; i < 14; i++) noise(t + i * 0.024 + Math.random() * 0.02, 0.04, { type: 'bandpass', freq: 1200 + Math.random() * 5000, q: 2, vol: 0.28, bus: sfxBus, echo: i === 0 });
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(120, t);
      for (let i = 0; i < 10; i++) o.frequency.setValueAtTime(60 + Math.random() * 240, t + i * 0.03);
      f.type = 'lowpass'; f.frequency.value = 2200;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.4);
      tone(70, t, 0.3, { type: 'sine', vol: 0.35, bus: sfxBus, glide: 40 });
    },
    hic() {
      if (!ctx) return; const t = now();
      tone(520, t, 0.09, { type: 'square', vol: 0.12, bus: sfxBus, glide: 1100, glideT: 0.05, cutoff: 2400 });
      for (let i = 0; i < 4; i++) noise(t + 0.04 + i * 0.03, 0.03, { type: 'bandpass', freq: 3000 + Math.random() * 3000, q: 3, vol: 0.12, bus: sfxBus });
    },
    ahh() { if (!ctx) return; tone(300, now(), 0.5, { type: 'sawtooth', vol: 0.07, bus: sfxBus, attack: 0.2, glide: 520, cutoff: 1200, vib: [5, 6] }); },
    beep() { if (!ctx) return; tone(2200, now(), 0.07, { type: 'square', vol: 0.06, bus: sfxBus, cutoff: 5000 }); },
    clack() {
      if (!ctx) return; const t = now();
      for (let i = 0; i < 6; i++) noise(t + i * 0.07, 0.02, { type: 'bandpass', freq: 1800, q: 4, vol: 0.2, bus: sfxBus });
    },
    /* chain links knocking together as a hanging sign jerks tight: bright tinks */
    clink(k = 1) {
      if (!ctx) return; const t = now();
      for (let i = 0; i < 3; i++) tone(2300 + Math.random() * 1100, t + i * 0.035 + Math.random() * 0.015, 0.1, { type: 'triangle', vol: 0.075 * k, bus: sfxBus, cutoff: 7000 });
      noise(t, 0.03, { type: 'bandpass', freq: 5200, q: 6, vol: 0.14 * k, bus: sfxBus });
    },
    click() { if (!ctx) return; noise(now(), 0.02, { type: 'bandpass', freq: 2500, q: 2, vol: 0.35, bus: sfxBus }); tone(160, now(), 0.05, { type: 'square', vol: 0.08, bus: sfxBus, cutoff: 900 }); },
    pop() { if (!ctx) return; tone(700, now(), 0.09, { type: 'sine', vol: 0.3, bus: sfxBus, glide: 180 }); },
    /* a sneaking footstep: a tiny pizzicato pluck */
    tiptoe() { if (!ctx) return; tone(1300 + Math.random() * 260, now(), 0.05, { type: 'sine', vol: 0.06, bus: sfxBus, glide: 950 }); },
    /* caught mid-sneak: a held, wobbling little note */
    freeze() { if (!ctx) return; tone(330, now(), 0.3, { type: 'triangle', vol: 0.08, bus: sfxBus, glide: 310, vib: [22, 18] }); },
    /* a binding screw run down tight on the copper: a quick ratchet of rising clicks */
    ratchet() {
      if (!ctx) return; const t = now();
      for (let i = 0; i < 4; i++) noise(t + i * 0.045, 0.018, { type: 'bandpass', freq: 2400 + i * 520, q: 5, vol: 0.24, bus: sfxBus });
      tone(210, t + 0.18, 0.06, { type: 'square', vol: 0.06, bus: sfxBus, cutoff: 1200 });
    },
    /* the main breaker thrown: a heavy bakelite clunk */
    clunk(on) {
      if (!ctx) return; const t = now();
      noise(t, 0.035, { type: 'bandpass', freq: 1300, q: 1.4, vol: 0.45, bus: sfxBus });
      tone(on ? 150 : 105, t, 0.18, { type: 'sine', vol: 0.5, bus: sfxBus, glide: 48 });
      noise(t + 0.06, 0.02, { type: 'bandpass', freq: 3200, q: 3, vol: 0.2, bus: sfxBus });
    },
    /* a rubber stamp slammed onto paper */
    stamp() {
      if (!ctx) return; const t = now();
      noise(t, 0.1, { type: 'lowpass', freq: 900, vol: 0.55, bus: sfxBus });
      tone(92, t, 0.14, { type: 'sine', vol: 0.45, bus: sfxBus, glide: 52 });
    },
    /* a neon tester lighting up on a live screw: a thin, fizzy buzz */
    neon() {
      if (!ctx) return; const t = now();
      tone(120, t, 0.28, { type: 'sawtooth', vol: 0.07, bus: sfxBus, cutoff: 2600, q: 3 });
      tone(240, t, 0.28, { type: 'square', vol: 0.03, bus: sfxBus, cutoff: 3200 });
      noise(t, 0.2, { type: 'bandpass', freq: 5200, q: 4, vol: 0.05, bus: sfxBus });
    },
    /* one typewriter key */
    typeKey() {
      if (!ctx) return; const t = now();
      noise(t, 0.022, { type: 'bandpass', freq: 3600 + Math.random() * 600, q: 2, vol: 0.28, bus: sfxBus });
      tone(380, t, 0.02, { type: 'square', vol: 0.045, bus: sfxBus, cutoff: 1500 });
    },
    snip() { if (!ctx) return; noise(now(), 0.06, { freq: 5000, vol: 0.25, bus: sfxBus }); noise(now() + 0.05, 0.04, { freq: 7000, vol: 0.2, bus: sfxBus }); },
    /* an old projector running up: a motor whir, a band of fan noise, and the
       film gate clattering eighteen times a second, all fading out at the end */
    projector(dur = 4.5) {
      if (!ctx) return;
      const t0 = now(), hold = Math.max(0.1, dur - 0.9);
      tone(58, t0, 0.5, { type: 'sawtooth', vol: 0.028, bus: sfxBus, attack: 0.4, sustain: hold, cutoff: 380, vib: [6, 1.2] });
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noiseBuf; s.loop = true;
      f.type = 'bandpass'; f.frequency.value = 760; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.035, t0 + 0.4);
      g.gain.setValueAtTime(0.035, t0 + dur - 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t0); s.stop(t0 + dur + 0.05);
      for (let t = 0.2; t < dur - 0.3; t += 1 / 18) noise(t0 + t, 0.014, { type: 'bandpass', freq: 2400, q: 3, vol: 0.045 + Math.random() * 0.03, bus: sfxBus });
    },
    hum(on) {
      if (!ctx) return;
      if (on && !X._hum) {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = 120; f.type = 'lowpass'; f.frequency.value = 500;
        g.gain.value = 0.0001; g.gain.setTargetAtTime(0.035, ctx.currentTime, 0.1);
        o.connect(f); f.connect(g); g.connect(sfxBus); o.start();
        X._hum = { o, g };
      } else if (!on && X._hum) {
        const h = X._hum; X._hum = null;
        h.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.05); h.o.stop(ctx.currentTime + 0.3);
      }
    },
    shatter() {
      if (!ctx) return; const t = now();
      noise(t, 0.5, { freq: 3000, vol: 0.4, bus: sfxBus, echo: true });
      for (let i = 0; i < 12; i++) tone(2000 + Math.random() * 4000, t + Math.random() * 0.4, 0.12, { type: 'sine', vol: 0.06, bus: sfxBus });
    },
    boom() {
      if (!ctx) return; const t = now();
      noise(t, 1.2, { type: 'lowpass', freq: 1800, sweep: 120, vol: 0.7, bus: sfxBus, echo: true });
      tone(90, t, 0.8, { type: 'sine', vol: 0.6, bus: sfxBus, glide: 30 });
    },
    fanfare() {
      if (!ctx) return; const t = now();
      [[62, 0], [66, 0.12], [69, 0.24], [74, 0.36], [78, 0.62]].forEach(([m, dt]) => tone(mtof(m), t + dt, m === 78 ? 0.7 : 0.14, { type: 'square', vol: 0.09, bus: sfxBus, cutoff: 3000, vib: m === 78 ? [6, 6] : null }));
      [[50, 0], [57, 0.36], [62, 0.62]].forEach(([m, dt]) => tone(mtof(m), t + dt, 0.3, { type: 'triangle', vol: 0.25, bus: sfxBus, cutoff: 900 }));
    },
    buzzer() { if (!ctx) return; tone(110, now(), 0.35, { type: 'sawtooth', vol: 0.12, bus: sfxBus, cutoff: 900 }); tone(104, now(), 0.35, { type: 'sawtooth', vol: 0.12, bus: sfxBus, cutoff: 900 }); },
    laugh(big) {
      if (!ctx || !S.scares) return;
      const t0 = now(), n = big ? 6 : 5;
      for (let i = 0; i < n; i++) {
        const t = t0 + i * (big ? 0.2 : 0.115);
        const f0 = (big ? 190 : 360) * (1 - i * 0.045);
        const o = ctx.createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(f0 * 1.18, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.82, t + 0.15);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(big ? 0.5 : 0.3, t + 0.018); g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.17 : 0.1));
        for (const [fq, q] of [[big ? 720 : 900, 6], [big ? 1100 : 1500, 7], [2600, 9]]) {
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fq; bp.Q.value = q;
          o.connect(bp); bp.connect(g);
        }
        g.connect(sfxBus); g.connect(echoIn);
        o.start(t); o.stop(t + 0.22);
      }
    },
  };

  function duck(sec) {
    if (!ctx) return;
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(0, t + 0.08);
    musicBus.gain.setValueAtTime(0, t + sec);
    musicBus.gain.linearRampToValueAtTime(S.music * 0.8, t + sec + 1.2);
  }

  window.AudioSys = {
    settings: S, init, apply, startMusic, stopMusic, beat, duck, sfx: X, mood,
    get ready() { return !!ctx; }, get musicOn() { return musicOn; },
  };
})();
