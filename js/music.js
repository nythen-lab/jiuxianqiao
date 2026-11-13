// 勇闯酒仙桥 · Web Audio 合成背景音乐（无外部文件）
// 暖而孤独的凌晨街头感：柔和 pad + 短促忧郁动机。首次用户手势后启动。
(function () {
  const M = {
    muted: false,
    started: false,
    ctx: null,
    master: null,
    padGain: null,
    motifGain: null,
    padNodes: [],
    motifTimer: null,
    motifStep: 0,
    _wantStart: false
  };
  window.Music = M;

  // 五声风格小调动机（A 小调五声：A C D E G），慢、空、略带中国味的街头清晨
  const MOTIF = [
    { n: 57, d: 0.55 }, // A3
    { n: 60, d: 0.55 }, // C4
    { n: 62, d: 0.7 },  // D4
    { n: 60, d: 0.45 }, // C4
    { n: 57, d: 0.9 },  // A3
    { n: 0,  d: 0.35 }, // rest
    { n: 55, d: 0.5 },  // G3
    { n: 57, d: 0.5 },  // A3
    { n: 60, d: 0.65 }, // C4
    { n: 62, d: 0.45 }, // D4
    { n: 64, d: 0.9 },  // E4
    { n: 0,  d: 0.8 }   // rest
  ];

  function midiToHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ensure() {
    if (M.ctx) return M.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    M.ctx = ctx;
    M.master = ctx.createGain();
    M.master.gain.value = M.muted ? 0 : 0.22;
    M.master.connect(ctx.destination);

    M.padGain = ctx.createGain();
    M.padGain.gain.value = 0.35;
    M.padGain.connect(M.master);

    M.motifGain = ctx.createGain();
    M.motifGain.gain.value = 0.55;
    M.motifGain.connect(M.master);
    return ctx;
  }

  function startPad() {
    const ctx = M.ctx;
    if (!ctx || M.padNodes.length) return;
    // 两层缓慢失谐的正弦 + 低通，营造暖而空的晨雾感
    const freqs = [110, 164.81, 220]; // A2, E3, A3
    freqs.forEach((f, i) => {
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sine'; o2.type = 'triangle';
      o1.frequency.value = f;
      o2.frequency.value = f * (1 + (i % 2 ? 0.004 : -0.003));
      const g = ctx.createGain();
      g.gain.value = 0.18 - i * 0.04;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420 + i * 80;
      lp.Q.value = 0.7;
      // 缓慢呼吸 LFO
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.02;
      lfoG.gain.value = 0.06;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(M.padGain);
      o1.start(); o2.start(); lfo.start();
      M.padNodes.push(o1, o2, lfo, g, lp);
    });
  }

  function playMotifNote(midi, dur) {
    const ctx = M.ctx;
    if (!ctx || !midi || M.muted) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = midiToHz(midi);
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.12, dur * 0.95));
    osc.connect(lp); lp.connect(g); g.connect(M.motifGain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  // v1.0 第二首：干活 / 小游戏用的带鼓点的曲子（D 小调五声，节奏更紧）
  const WBASS = [38, 38, 45, 38, 41, 41, 48, 41, 36, 36, 43, 36, 43, 43, 50, 43];
  const WMEL = [62, 0, 65, 0, 69, 67, 0, 65, 62, 0, 60, 0, 62, 65, 0, 0, 67, 0, 69, 0, 72, 69, 0, 67, 65, 0, 62, 0, 60, 62, 0, 0];
  let hatBuf = null;
  function hat(vol) { const ctx = M.ctx; if (!ctx || M.muted) return; if (!hatBuf) { hatBuf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate); const d = hatBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); } const s = ctx.createBufferSource(); s.buffer = hatBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500; const g = ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(M.master); s.start(); }
  function thump(f0) { const ctx = M.ctx; if (!ctx || M.muted) return; const t0 = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0 * 2.4, t0); o.frequency.exponentialRampToValueAtTime(f0, t0 + 0.12); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28); o.connect(g); g.connect(M.master); o.start(t0); o.stop(t0 + 0.32); }
  function pluck(midi, dur, vol, type) { const ctx = M.ctx; if (!ctx || M.muted || !midi) return; const t0 = ctx.currentTime; const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = type || 'triangle'; o.frequency.value = midiToHz(midi); lp.type = 'lowpass'; lp.frequency.value = 1800; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(lp); lp.connect(g); g.connect(M.master); o.start(t0); o.stop(t0 + dur + 0.05); }
  function scheduleWork() {
    if (!M.started || !M.ctx || M.track !== 'work') return;
    clearTimeout(M.motifTimer);
    const i = M.motifStep++; const beat = 60 / 112 / 2; // 八分音符
    if (i % 2 === 0) { const b = WBASS[(i / 2) % WBASS.length]; pluck(b, beat * 1.7, 0.34, 'sawtooth'); if ((i / 2) % 2 === 0) thump(52); }
    else hat(0.1);
    const m = WMEL[i % WMEL.length]; if (m) pluck(m, beat * 1.6, 0.17, 'triangle');
    M.motifTimer = setTimeout(scheduleWork, beat * 1000);
  }
  M.track = 'street';
  M.setTrack = function (t) {
    if (M.track === t) return; M.track = t; if (!M.started || !M.ctx) return;
    clearTimeout(M.motifTimer); M.motifStep = 0;
    try { M.padGain.gain.setTargetAtTime(t === 'work' ? 0.1 : 0.35, M.ctx.currentTime, 0.4); } catch (e) { }
    if (t === 'work') scheduleWork(); else scheduleMotif();
    try { document.documentElement.dataset.track = t; } catch (e) { }
  };

  function scheduleMotif() {
    if (!M.started || !M.ctx) return;
    if (M.track === 'work') return scheduleWork();
    clearTimeout(M.motifTimer);
    const step = MOTIF[M.motifStep % MOTIF.length];
    M.motifStep++;
    if (step.n) playMotifNote(step.n, step.d);
    // 略加速节奏感，整体仍偏慢
    const wait = step.d * 1000 * (M.muted ? 1 : 1);
    M.motifTimer = setTimeout(scheduleMotif, wait);
  }

  M.start = function () {
    M._wantStart = true;
    const ctx = ensure();
    if (!ctx) return;
    const go = () => {
      if (M.started) return;
      M.started = true;
      startPad();
      M.motifStep = 0;
      scheduleMotif();
      try { document.documentElement.dataset.music = 'on'; } catch (_) {}
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(go).catch(() => {});
    } else go();
  };

  M.setMuted = function (m) {
    M.muted = !!m;
    if (M.master) M.master.gain.setTargetAtTime(M.muted ? 0 : 0.22, M.ctx.currentTime, 0.05);
    try { localStorage.setItem('jxq_mute', M.muted ? '1' : '0'); } catch (_) {}
    document.dispatchEvent(new CustomEvent('jxq-music', { detail: { muted: M.muted } }));
  };
  M.toggleMute = function () { M.setMuted(!M.muted); return M.muted; };

  M.stinger = function (type) {
    const ctx = ensure();
    if (!ctx || M.muted) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t0 = ctx.currentTime;
    const beep = (freq, at, dur, vol, typeOsc) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = typeOsc || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g); g.connect(M.master);
      o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
    };
    if (type === 'paid') { beep(523.25, 0, 0.18, 0.35); beep(659.25, 0.12, 0.22, 0.32); beep(783.99, 0.26, 0.35, 0.3); }
    else if (type === 'caught') { beep(180, 0, 0.35, 0.4, 'sawtooth'); beep(140, 0.2, 0.45, 0.35, 'sawtooth'); }
    else if (type === 'win') { beep(392, 0, 0.2, 0.3); beep(523.25, 0.15, 0.2, 0.3); beep(659.25, 0.3, 0.25, 0.32); beep(783.99, 0.5, 0.55, 0.35); }
    else if (type === 'lose') { beep(349.23, 0, 0.35, 0.28); beep(311.13, 0.25, 0.4, 0.26); beep(246.94, 0.55, 0.7, 0.3); }
  };

  try { if (localStorage.getItem('jxq_mute') === '1') M.muted = true; } catch (_) {}
})();
