// 勇闯酒仙桥 v0.9.1 · 音效 / 昼夜 / 大钟 / 时间流逝 / 目标卡 / 刮刮乐 / 小互动框架
(function () {
  const C = window.CONFIG;
  const FX = window.FX = {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  // 自动化测试里默认跳过动画（真人玩不受影响）；要看动画就设 window.FX_SLOW
  const fast = () => !!(window.FX_FAST || (navigator.webdriver && !window.FX_SLOW));
  FX.fast = fast;
  FX.wait = wait;

  // ================= Web Audio 音效（合成，无文件） =================
  const SFX = FX.sfx = {}; let ctx = null, nbuf = null;
  SFX.ac = function () {
    if (window.FX_MUTE || (window.Music && Music.muted)) return null;
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; } return ctx;
  };
  function tone(f, d, o) {
    o = o || {}; const a = SFX.ac(); if (!a) return; const t = a.currentTime + (o.at || 0);
    const os = a.createOscillator(), g = a.createGain(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.12, t + Math.min(0.02, d / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    os.connect(g).connect(a.destination); os.start(t); os.stop(t + d + 0.05);
  }
  function noise(d, o) {
    o = o || {}; const a = SFX.ac(); if (!a) return;
    if (!nbuf) { nbuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const ch = nbuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const t = a.currentTime + (o.at || 0); const s = a.createBufferSource(); s.buffer = nbuf; s.loop = true;
    const f = a.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); if (o.fto) f.frequency.linearRampToValueAtTime(o.fto, t + d); f.Q.value = o.q || 1;
    const g = a.createGain(), v = o.vol || 0.1; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.01));
    g.gain.setValueAtTime(v, t + Math.max(0.012, d - (o.rel || 0.05))); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(a.destination); s.start(t, Math.random()); s.stop(t + d + 0.05);
  }
  const semi = (b, s) => b * Math.pow(2, s / 12);
  SFX.lib = {
    click: () => tone(900, .05, { type: 'square', vol: .04 }),
    pop: () => { tone(500, .09, { to: 950, vol: .1 }); noise(.05, { f: 3000, vol: .04 }); },
    coin: () => { tone(1320, .12, { type: 'triangle', vol: .1 }); tone(1760, .28, { type: 'triangle', vol: .09, at: .08 }); },
    clink: () => { tone(2400, .2, { vol: .07 }); tone(3100, .3, { vol: .05, at: .03 }); },
    water: () => noise(2.4, { f: 700, q: .6, vol: .07, att: .3, rel: .6 }),
    drum: () => { for (let i = 0; i < 6; i++) tone(90, .25, { vol: .08, at: i * .33, to: 60 }); },
    beep: () => tone(1000, .08, { type: 'square', vol: .04 }),
    key: () => { tone(rnd([697, 770, 852, 941]), .12, { vol: .06 }); tone(rnd([1209, 1336, 1477]), .12, { vol: .05 }); },
    ring: () => { for (let i = 0; i < 2; i++) { tone(440, .45, { vol: .05, at: i * 1.1 }); tone(480, .45, { vol: .05, at: i * 1.1 }); } },
    stamp: () => { tone(120, .16, { to: 50, vol: .28 }); noise(.08, { f: 400, vol: .14 }); },
    paper: () => noise(.35, { f: 4000, q: .5, vol: .045, att: .05 }),
    wipe: () => noise(.16, { f: 2500, fto: 1500, q: .8, vol: .045 }),
    scratch: () => noise(.07, { f: 5200 + Math.random() * 1500, q: 2, vol: .05 }),
    chime: () => [0, 4, 7, 12].forEach((s, i) => tone(semi(523, s), .5, { type: 'triangle', vol: .09, at: i * .09 })),
    fanfare: () => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(semi(523, s), .7, { type: 'triangle', vol: .11, at: i * .08 })),
    sigh: () => { tone(330, .7, { to: 200, vol: .07 }); noise(.7, { f: 600, q: .4, vol: .03, att: .2 }); },
    roll: () => { for (let i = 0; i < 14; i++) noise(.05, { f: 200, q: 1, vol: .1, at: i * .06 }); },
    zzz: () => tone(110, 1.6, { vol: .05, to: 90 }),
    tick: () => tone(1800, .03, { type: 'square', vol: .025 }),
    splash: () => noise(.5, { f: 900, fto: 300, q: .5, vol: .09 }),
    sing: () => [0, 2, 4, 7, 4, 2].forEach((s, i) => tone(semi(392, s), .3, { type: 'sawtooth', vol: .025, at: i * .3 })),
    marker: () => noise(.4, { f: 3500, q: 3, vol: .03 }),
    keys: () => { for (let i = 0; i < 3; i++) tone(2600 + i * 300, .08, { vol: .05, at: i * .06 }); },
    wind: () => noise(2, { f: 500, fto: 900, q: .3, vol: .045, att: .5, rel: .8 }),
    heart: () => { tone(62, .16, { vol: .2, to: 45 }); tone(58, .18, { vol: .16, at: .2, to: 42 }); },
    rustle: () => noise(.3, { f: 3200, q: .6, vol: .06, att: .04 }),
    gasp: () => noise(.25, { f: 1400, fto: 3000, q: .8, vol: .07 }),
    slurp: () => { noise(.55, { f: 1200, fto: 3600, q: 2, vol: .08, att: .05 }); tone(300, .4, { to: 520, vol: .03 }); },
    crunch: () => { for (let i = 0; i < 4; i++) noise(.05, { f: 2400 + i * 400, q: 1, vol: .11, at: i * .045 }); },
    chew: () => { for (let i = 0; i < 3; i++) tone(150 - i * 12, .09, { vol: .06, at: i * .13, to: 100 }); noise(.08, { f: 700, vol: .03 }); },
    glug: () => { for (let i = 0; i < 3; i++) tone(220 + i * 40, .14, { to: 120, vol: .08, at: i * .16 }); },
    belly: () => { tone(98, 1.4, { vol: .09, to: 110, type: 'sine' }); tone(196, 1.2, { vol: .04, at: .1 }); tone(392, 1.0, { vol: .025, at: .2, type: 'triangle' }); },
    sighgood: () => { tone(440, .8, { to: 330, vol: .05, type: 'triangle' }); tone(660, .9, { vol: .03, at: .15, type: 'triangle' }); },
    cloth: () => noise(.45, { f: 1800, fto: 900, q: .4, vol: .05, att: .08 }),
    motor: () => { noise(1.1, { f: 180, fto: 120, q: .7, vol: .05, att: .3, rel: .5 }); tone(70, 1.0, { type: 'sawtooth', vol: .02, to: 60 }); },
    blip: () => tone(rnd([320, 360, 400, 440]), .06, { type: 'square', vol: .03 }),
    blipme: () => tone(rnd([520, 560, 600, 660]), .06, { type: 'square', vol: .03 }),
    note: () => tone(rnd([392, 440, 523, 587]), .22, { type: 'triangle', vol: .04 }),
    lightoff: () => { tone(200, .06, { type: 'square', vol: .06 }); },
    siren: () => { for (let i = 0; i < 3; i++) { tone(620, .22, { type: 'sawtooth', vol: .09, at: i * .44, to: 900 }); tone(900, .22, { type: 'sawtooth', vol: .09, at: i * .44 + .22, to: 620 }); } noise(.25, { f: 300, vol: .12 }); },
    buzz: () => { tone(150, .22, { type: 'square', vol: .08, to: 110 }); },
    ding: () => { tone(1046, .35, { type: 'triangle', vol: .13 }); tone(1568, .45, { type: 'triangle', vol: .09, at: .09 }); },
    whistle: () => { tone(2100, .5, { vol: .06, to: 2400 }); },
    fast: () => { for (let i = 0; i < 10; i++) tone(1800, .03, { type: 'square', vol: .02, at: i * .08 }); }
  };
  // ---- v1.0 人声合成：带共振峰的锯齿波 + 颤音，听起来像“啊——”地唱 / 含糊地说话 ----
  const VOW = { a: [800, 1150], o: [500, 900], e: [550, 1800], i: [300, 2300], u: [320, 800] };
  function voiceNote(f, d, o) {
    o = o || {}; const a = SFX.ac(); if (!a) return; const t = a.currentTime + (o.at || 0); const vw = VOW[o.v || 'a'];
    const os = a.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f * (o.from || 1), t); if (o.from) os.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.08, d / 3));
    if (o.to) os.frequency.exponentialRampToValueAtTime(f * o.to, t + d);
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 5.2 + Math.random() * 0.8; lg.gain.value = f * (o.vib == null ? 0.012 : o.vib); lfo.connect(lg); lg.connect(os.frequency);
    const out = a.createGain(); const vol = o.vol || 0.12; out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.06, d / 3)); out.gain.setValueAtTime(vol, t + Math.max(0.07, d - 0.09)); out.gain.exponentialRampToValueAtTime(0.0001, t + d);
    vw.forEach((fc, i) => { const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = 5 + i * 2; const g = a.createGain(); g.gain.value = i ? 0.55 : 1; os.connect(bp); bp.connect(g); g.connect(out); });
    out.connect(a.destination); os.start(t); lfo.start(t); os.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
  }
  SFX.voiceNote = voiceNote;
  // 一句老歌（五声音阶），带拖长音
  SFX.lib.sing = () => { const L = [[0, .38], [2, .38], [4, .5], [7, .75], [4, .38], [2, .38], [0, .5], [-3, .9], [0, .38], [2, .38], [4, .5], [2, .38], [0, 1.1]]; let at = 0.05; L.forEach(([sm, d]) => { voiceNote(semi(247, sm + 12), d * 0.95, { at, vol: .15, v: sm === 7 || sm === -3 ? 'o' : 'a', vib: .014 }); at += d; }); };
  SFX.lib.sing2 = () => { const L = [[7, .45], [9, .45], [12, .7], [9, .45], [7, .45], [4, .9], [7, .45], [4, .45], [2, .5], [0, 1.2]]; let at = 0.05; L.forEach(([sm, d]) => { voiceNote(semi(247, sm), d * 0.95, { at, vol: .15, v: 'a' }); at += d; }); };
  // 说话含糊的音节串：who = 'them'（家里人，音高高一点）| 'me'
  SFX.speak = function (who, n) { const base = who === 'me' ? 128 : 205; n = n || 6; let at = 0; for (let i = 0; i < n; i++) { const d = 0.08 + Math.random() * 0.1; const f = base * (0.9 + Math.random() * 0.4); voiceNote(f, d, { at, vol: .1, v: rnd(['a', 'o', 'e', 'a', 'i', 'u']), from: .93 + Math.random() * .1, vib: .004 }); at += d + 0.04 + Math.random() * (i % 3 === 2 ? .18 : .05); } };
  SFX.lib.speakme = () => SFX.speak('me', 5 + Math.floor(Math.random() * 4));
  SFX.lib.speakthem = () => SFX.speak('them', 6 + Math.floor(Math.random() * 5));
  // 老式电话铃：嘀铃铃 × 2
  SFX.lib.phonering = () => { for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { tone(i % 2 ? 1250 : 1500, .045, { type: 'square', vol: .075, at: k * 1.25 + i * .05 }); } };
  // 拨号中的回铃音：嘟——（长）
  SFX.lib.ringback = () => { tone(425, 1.0, { vol: .09 }); tone(425, 1.0, { vol: .09, at: 1.6 }); };
  SFX.lib.pickup = () => { noise(.12, { f: 900, vol: .1 }); tone(660, .09, { type: 'triangle', vol: .08, at: .05 }); };
  SFX.lib.hangup = () => { tone(500, .12, { vol: .08 }); tone(380, .18, { vol: .08, at: .12 }); };
  // 冷饮：开瓶盖 + 气泡
  SFX.lib.capoff = () => { noise(.06, { f: 3000, q: 2, vol: .12 }); tone(1800, .08, { vol: .08, to: 900 }); noise(.7, { f: 4500, fto: 2500, q: .7, vol: .04, at: .06, att: .02 }); };
  // 首次触摸/点击时解锁音频（手机浏览器、微信需要用户手势）
  SFX.unlock = function () { const a = SFX.ac(); if (!a) return; try { const b = a.createBuffer(1, 1, 22050), src = a.createBufferSource(); src.buffer = b; src.connect(a.destination); src.start(0); } catch (e) { } };
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => addEventListener(ev, function once() { SFX.unlock(); removeEventListener(ev, once); }, { passive: true }));
  SFX.play = n => { try { if (n && SFX.lib[n]) SFX.lib[n](); } catch (e) { } };

  // ================= 时段 / 昼夜图 =================
  FX.sun = () => { const s = G.season ? G.season().id : '_'; return (C.sunTimes || {})[s] || C.sunTimes._; };
  FX.imgPhase = h => ((C.imgPhases || []).find(p => h >= p.from && h < p.to) || { id: 'day' }).id;
  FX.clockPhase = h => (C.clockPhases || []).find(p => h >= p.from && h < p.to) || { name: '', icon: '🕒' };
  FX.isDark = h => { const [sr, ss] = FX.sun(); return h < sr || h >= ss; };
  // 每个地点在这个钟点用哪张图；没有专门图的返回 null
  FX.placeImg = function (id, h) {
    const P = (C.phaseImgs || {})[id]; if (!P) return null; const m = FX.imgPhase(h);
    if (P[m]) return P[m];
    if (m === 'dawn' || m === 'dusk') return (FX.isDark(h) ? P.night : P.day) || P.day || P.night;
    return P.day || P.night;
  };
  FX.mapImg = function (h) { const M = C.mapImgs || {}; const m = FX.imgPhase(h); const dark = m === 'night' || ((m === 'dawn' || m === 'dusk') && FX.isDark(h)); const sea = (window.G && G.S && G.S() && G.season) ? G.season() : null; const SM = sea && M.seasons && M.seasons[sea.id]; if (SM) return (dark ? SM.night : SM.day) || (dark ? M.night : M.day); return (dark ? M.night : M.day) || C.townMap.img; };
  FX.hasNightImg = id => !!((C.phaseImgs || {})[id] || {}).night;
  // 换图时柔和地淡入：把旧图盖在上面再淡出
  const lastImg = {};
  FX.crossfade = function (root, sel, key) {
    const el = root && root.querySelector(sel); if (!el) return;
    const url = el.style.backgroundImage; const prev = lastImg[sel];
    lastImg[sel] = { key, url };
    if (!prev || prev.key !== key || prev.url === url) return;
    const old = el.cloneNode(false); old.classList.add('xfade'); old.style.backgroundImage = prev.url; el.parentNode.insertBefore(old, el.nextSibling);
    requestAnimationFrame(() => requestAnimationFrame(() => old.classList.add('out')));
    setTimeout(() => old.remove(), 1700);
  };

  // ================= 大钟（HUD） =================
  const hm = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60) % 60).padStart(2, '0');
  FX.timeHTML = function () {
    const h = G.hourF(), P = FX.clockPhase(h), [sr, ss] = FX.sun();
    return `<div class="time big ph-${FX.imgPhase(h)}${FX.isDark(h) ? ' dark' : ''}" title="${P.name} · 日出 ${hm(sr)} · 日落 ${hm(ss)}"><span class="phi">${P.icon}</span><span class="tclock">${G.clock()}</span><small class="phl">${P.name}</small></div>
      <div class="daybar" title="一天 24 小时 · 日出 ${hm(sr)} · 日落 ${hm(ss)}"><i class="dn a" style="width:${(sr / 24 * 100).toFixed(1)}%"></i><i class="dn b" style="left:${(ss / 24 * 100).toFixed(1)}%"></i><b class="now" style="left:${(h / 24 * 100).toFixed(1)}%"></b></div>`;
  };

  // ================= 时间流逝的一拍 =================
  FX.timeBeat = function (t0, t1, verb) {
    const B = C.timeBeat || {}; const d = t1 - t0; if (!(d >= (B.minMinutes || 120))) return null;
    const h0 = (t0 % 1440) / 60, h1 = (t1 % 1440) / 60; const dk0 = FX.isDark(h0), dk1 = FX.isDark(h1);
    let tail;
    if (h1 >= 0 && h1 < 4) tail = B.toDeep; else if (dk1 && h1 >= 4 && h1 < 9) tail = B.preDawn; else if (dk1 && !dk0) tail = B.toNight; else if (!dk1 && dk0) tail = B.toDay;
    else if (h1 >= 17 && h1 < 19 && h0 < 17) tail = B.toDusk; else if (h1 >= 11 && h1 < 13 && h0 < 11) tail = B.toNoon; else tail = (B.same || '').replace('{h}', Math.round(d / 60));
    const text = `从 ${G.clock(t0)} ${verb || '待到'} ${G.clock(t1)}，${tail}`;
    const game = document.getElementById('game'); if (!game) return text;
    let el = document.getElementById('tbeat'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'tbeat'; el.className = 'tbeat' + (dk1 ? ' dark' : '');
    el.innerHTML = `<div class="tb-clock"><span class="tb-from">${G.clock(t0)}</span><span class="tb-arrow">→</span><span class="tb-now">${G.clock(t0)}</span></div><p>${esc(text)}</p>`;
    game.appendChild(el);
    const now = el.querySelector('.tb-now'); const steps = 18; let i = 0;
    const iv = setInterval(() => { i++; now.textContent = G.clock(Math.round(t0 + d * i / steps)); if (i % 3 === 0) SFX.play('tick'); if (i >= steps) { clearInterval(iv); el.classList.add('done'); } }, 55);
    const tc = document.querySelector('#hud .tclock'); if (tc) { tc.classList.remove('flash'); void tc.offsetWidth; tc.classList.add('flash'); }
    setTimeout(() => el.classList.add('out'), 3600); setTimeout(() => el.remove(), 4300);
    FX.lastBeat = text; return text;
  };

  // ================= 目标提醒卡 =================
  FX.goalCardHTML = function (big) {
    const S = G.S(), I = G.identity(), pr = G.goalProgress(), R = C.goalReminder, d = G.dayNum();
    const exp = Math.min(1, d / R.paceDays), mood = pr.pct >= exp + 0.05 ? 'ahead' : pr.pct < exp - 0.1 ? 'behind' : 'flat';
    const L = (R.lines[S.idn || I.id] || R.lines._); const line = L[mood] || R.lines._[mood];
    const left = Math.max(0, R.paceDays - d);
    const pct = Math.round(Math.min(1, pr.pct) * 100);
    const extra = I.goal.type === 'send' ? `<p class="gc-sub">兜里 ¥${S.money} · ${I.goal.debt ? '已还' : '已寄回'} ¥${S.sent} / ¥${I.goal.amount}</p>` : '';
    return `<div class="goalcard ${big ? 'big' : 'small'} m-${mood}">
      <p class="gc-goal">🎯 ${esc(I.goalText || '')}</p>
      <div class="sbar big"><i style="width:${pct}%"></i></div><p class="gc-prog">${esc(pr.text)} · <b>${pct}%</b></p>${extra}
      <p class="gc-days">${left > 0 ? `按一个月算，还剩 <b>${left}</b> 天` : '一个月已经过去了，不急，按自己的节奏来'}${big ? ` · 这一周${mood === 'ahead' ? '走得比预想快' : mood === 'behind' ? '落后了一些' : '大体按计划'}` : ''}</p>
      <blockquote class="gc-line">「${esc(line)}」</blockquote></div>`;
  };

  // ================= 刮刮乐 =================
  FX.ticket = id => (C.scratchTickets || []).find(t => t.id === id);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // 根据已定的奖金摆出一张「合理」的票面
  FX.layoutTicket = function (T, prize) {
    if (T.kind === 'three') {
      const syms = T.symbols; const cells = [];
      const win = prize ? syms.find(s => s.p === prize) : null;
      if (win) cells.push(win, win, win);
      const pool = syms.filter(s => s !== win); const cnt = {};
      while (cells.length < T.cells) { const s = rnd(pool); if ((cnt[s.s] || 0) >= 2) continue; cnt[s.s] = (cnt[s.s] || 0) + 1; cells.push(s); }
      return { kind: 'three', cells: shuffle(cells).map(s => ({ s: s.s, p: s.p, win: win && s === win })) };
    }
    if (T.kind === 'match') {
      const nums = shuffle(Array.from({ length: 30 }, (_, i) => i + 1));
      const lucky = nums.slice(0, T.lucky), others = nums.slice(T.lucky);
      const cells = []; for (let i = 0; i < T.cells; i++) cells.push({ n: others[i], p: rnd(T.prizes) });
      if (prize) { const k = Math.floor(Math.random() * T.cells); cells[k] = { n: rnd(lucky), p: prize, win: true }; }
      else if (Math.random() < .5) { /* 差一点：一个号只差 1 */ const k = Math.floor(Math.random() * T.cells); const ln = rnd(lucky); const nn = ln < 30 ? ln + 1 : ln - 1; if (!lucky.includes(nn)) cells[k].n = nn; }
      return { kind: 'match', lucky, cells };
    }
    // rows
    const P = [10, 20, 50, 200, 2000]; const rowsP = shuffle(P.slice()).slice(0, T.rows); const syms = T.symbols; let winRow = -1;
    if (prize) { winRow = Math.floor(Math.random() * T.rows); rowsP[winRow] = prize; }
    const rows = rowsP.map((p, r) => {
      if (r === winRow) { const s = rnd(syms); return { p, cells: [s, s, s], win: true }; }
      let c; do { c = [rnd(syms), rnd(syms), rnd(syms)]; } while (c[0] === c[1] && c[1] === c[2]);
      return { p, cells: c };
    });
    return { kind: 'rows', rows };
  };
  FX.drawPrize = T => { const tot = T.table.reduce((a, x) => a + x.w, 0); let r = Math.random() * tot; for (const x of T.table) { r -= x.w; if (r < 0) return x.p; } return 0; };
  FX.ticketEV = T => T.table.reduce((a, x) => a + x.p * x.w, 0) / T.table.reduce((a, x) => a + x.w, 0) / T.price;

  function ticketBody(T, L) {
    if (L.kind === 'three') return `<div class="tk-grid g3">${L.cells.map((c, i) => `<div class="tk-cell${c.win ? ' w' : ''}" data-i="${i}"><span class="sy">${c.s}</span><small>¥${c.p}</small></div>`).join('')}</div>`;
    if (L.kind === 'match') return `<div class="tk-lucky"><span class="lbl">幸运号</span>${L.lucky.map((n, i) => `<div class="tk-cell lk" data-i="L${i}"><span class="num">${n}</span></div>`).join('')}</div>
      <div class="tk-grid gm" style="--cols:${L.cells.length > 8 ? 6 : 4}"><span class="lbl">我的号</span>${L.cells.map((c, i) => `<div class="tk-cell${c.win ? ' w' : ''}" data-i="${i}"><span class="num">${c.n}</span><small>¥${c.p}</small></div>`).join('')}</div>`;
    return `<div class="tk-rows">${L.rows.map((r, ri) => `<div class="tk-row${r.win ? ' w' : ''}">${r.cells.map((s, ci) => `<div class="tk-cell${r.win ? ' w' : ''}" data-i="${ri}-${ci}"><span class="sy">${s}</span></div>`).join('')}<div class="tk-rp">¥${r.p}</div></div>`).join('')}</div>`;
  }
  // 刮票界面：resolve('again' | 'switch' | 'done')
  FX.scratchCard = function (r) {
    const T = r.t, L = r.layout;
    return new Promise(resolve => {
      const wrap = document.createElement('div'); wrap.id = 'scratch'; wrap.className = 'sc-wrap';
      wrap.innerHTML = `<div class="sc-panel"><div class="ticket" style="--tk:${T.color};--ink:${T.ink}">
        <div class="tk-head"><span class="tk-art">${T.art}</span><div><b>${esc(T.name)}</b><small>${esc(T.rule)}</small></div><span class="tk-price">¥${T.price}</span></div>
        <div class="tk-play">${ticketBody(T, L)}<canvas class="tk-coat"></canvas><div class="tk-flecks"></div></div>
        <div class="tk-foot">刮开涂层看结果 · 按住拖动</div></div>
        <div class="sc-side"><p class="sc-msg" id="sc-msg">按住鼠标在银色涂层上来回刮。</p>
          <div class="sc-btns"><button class="btn" id="sc-all" disabled title="先自己刮几下">刮开剩下的</button></div>
          <div class="sc-after hidden"><p class="sc-res" id="sc-res"></p><p class="muted" id="sc-net"></p>
          <div class="sc-btns"><button class="btn primary" id="sc-again">再来一张（¥${T.price}）</button><button class="btn" id="sc-switch">换一种</button><button class="btn ghost" id="sc-done">收手</button></div></div></div></div>`;
      document.body.appendChild(wrap);
      const play = wrap.querySelector('.tk-play'), cv = wrap.querySelector('.tk-coat'), fl = wrap.querySelector('.tk-flecks');
      const cells = [...play.querySelectorAll('.tk-cell')];
      let W, H, g, done = false, rects = [], revealed = new Set(), moved = 0, lastSnd = 0, lastChk = 0;
      function setup() {
        const b = play.getBoundingClientRect(); W = Math.round(b.width); H = Math.round(b.height); cv.width = W; cv.height = H; g = cv.getContext('2d');
        const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#bfc3c7'); gr.addColorStop(.5, '#e4e6e8'); gr.addColorStop(1, '#a9adb2');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        for (let i = 0; i < W * H / 90; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(90,95,100,.18)'; g.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
        g.globalAlpha = .18; g.font = `${Math.round(Math.min(W, H) / 7)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let y = H / 6; y < H; y += H / 3) for (let x = W / 8; x < W; x += W / 4) g.fillText(T.art, x + (y / H * 30), y);
        g.globalAlpha = 1;
        rects = cells.map(c => { const cb = c.getBoundingClientRect(); return { x: cb.left - b.left, y: cb.top - b.top, w: cb.width, h: cb.height, el: c }; });
      }
      requestAnimationFrame(setup);
      function cleared(rc) { const sx = Math.max(0, Math.floor(rc.x)), sy = Math.max(0, Math.floor(rc.y)), sw = Math.max(1, Math.floor(rc.w)), sh = Math.max(1, Math.floor(rc.h));
        const d = g.getImageData(sx, sy, sw, sh).data; let n = 0, z = 0; for (let i = 3; i < d.length; i += 4 * 6) { n++; if (d[i] < 40) z++; } return z / n; }
      function check(force) {
        const now = Date.now(); if (!force && now - lastChk < 120) return; lastChk = now;
        rects.forEach((rc, i) => { if (!revealed.has(i) && cleared(rc) > 0.55) { revealed.add(i); rc.el.classList.add('rev'); if (revealed.size < rects.length) SFX.play('click'); } });
        wrap.querySelector('#sc-all').disabled = !(revealed.size >= 1 || moved > 600);
        if (revealed.size === rects.length - 1 && !wrap._sus) { wrap._sus = 1; const last = rects.find((_, i) => !revealed.has(i)); if (last) last.el.classList.add('sus'); wrap.querySelector('#sc-msg').textContent = '还剩最后一格……'; }
        if (revealed.size === rects.length && !done) finish();
      }
      function scr(x, y, px, py) {
        g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = Math.max(18, W / 22);
        g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke(); g.globalCompositeOperation = 'source-over';
        const dist = Math.hypot(x - px, y - py); moved += dist;
        const now = Date.now(); if (dist > 3 && now - lastSnd > 70) { lastSnd = now; SFX.play('scratch'); }
        if (dist > 2 && fl.childElementCount < 40) for (let k = 0; k < 2; k++) { const f = document.createElement('i'); f.style.left = (x + (Math.random() - .5) * 14) + 'px'; f.style.top = (y + (Math.random() - .5) * 8) + 'px'; f.style.setProperty('--dx', ((Math.random() - .5) * 40) + 'px'); fl.appendChild(f); setTimeout(() => f.remove(), 800); }
        check();
      }
      let down = false, px = 0, py = 0;
      const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * W / b.width, (e.clientY - b.top) * H / b.height]; };
      cv.addEventListener('pointerdown', e => { if (done) return; down = true; [px, py] = pos(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); scr(px + .1, py + .1, px, py); });
      cv.addEventListener('pointermove', e => { if (!down || done) return; const [x, y] = pos(e); scr(x, y, px, py); px = x; py = y; });
      const up = () => { if (down) { down = false; check(true); } }; cv.addEventListener('pointerup', up); cv.addEventListener('pointerleave', up);
      // 刮开剩下的：一格一格揭，最后一格悬一下
      wrap.querySelector('#sc-all').onclick = async () => {
        const btn = wrap.querySelector('#sc-all'); btn.disabled = true; const rest = rects.map((rc, i) => i).filter(i => !revealed.has(i));
        for (let k = 0; k < rest.length && !done; k++) {
          const i = rest[k], rc = rects[i];
          if (k === rest.length - 1) { rc.el.classList.add('sus'); wrap.querySelector('#sc-msg').textContent = '最后一格……'; SFX.play('roll'); await wait(fast() ? 10 : 950); }
          g.clearRect(rc.x - 3, rc.y - 3, rc.w + 6, rc.h + 6); revealed.add(i); rc.el.classList.add('rev'); SFX.play('scratch'); await wait(fast() ? 5 : 160);
        }
        if (!done) finish();
      };
      function confetti() { for (let i = 0; i < 26; i++) { const c = document.createElement('span'); c.className = 'conf'; c.textContent = rnd(['✨', '🎉', '💰', '⭐']); c.style.left = (10 + Math.random() * 80) + '%'; c.style.animationDelay = (Math.random() * .5) + 's'; wrap.appendChild(c); setTimeout(() => c.remove(), 2600); } }
      function finish() {
        done = true; g.clearRect(0, 0, W, H); cells.forEach(c => c.classList.add('rev')); cells.forEach(c => c.classList.remove('sus'));
        const tk = wrap.querySelector('.ticket'); const big = r.prize >= T.price * 5;
        if (r.prize > 0) { tk.classList.add('won'); SFX.play(big ? 'fanfare' : 'chime'); if (big) confetti(); }
        else { tk.classList.add('lost'); setTimeout(() => SFX.play('sigh'), 200); }
        wrap.querySelector('#sc-msg').textContent = r.prize > 0 ? `中了 ¥${r.prize}！` : '没中。';
        wrap.querySelector('#sc-res').innerHTML = esc(r.line) + (r.mental ? ` <span class="${r.mental > 0 ? 'up' : 'down'}">精神 ${r.mental > 0 ? '+' : ''}${r.mental}</span>` : '');
        wrap.querySelector('#sc-net').textContent = `这家店里你一共净${r.net >= 0 ? '赚' : '亏'} ¥${Math.abs(r.net)}。今天刮了 ${r.n}/${r.max} 张。`;
        wrap.querySelector('.sc-btns').classList.add('hidden'); wrap.querySelector('.sc-after').classList.remove('hidden');
        const again = wrap.querySelector('#sc-again'); again.disabled = !r.canMore;
        const close = v => { wrap.remove(); resolve(v); };
        again.onclick = () => close('again'); wrap.querySelector('#sc-switch').onclick = () => close('switch'); wrap.querySelector('#sc-done').onclick = () => close('done');
      }
      FX._scratch = { finish: () => { if (!done) finish(); }, revealed: () => revealed.size, total: () => rects.length, moved: () => moved, wrap };
    });
  };

  // 吃饭的小互动：按价钱和菜的种类配出一套
  FX.eat = function (m, delta) {
    const E = C.eatFx; if (!E || fast()) return Promise.resolve(null);
    const price = m.price || 0; const kind = m.dish || m.id || 'box';
    const tier = (m.id === 'beer') ? 'cheap' : price <= 9 ? 'cheap' : price >= 30 ? 'good' : 'normal';
    const base = E[tier], k = E.kinds[kind] || E.kinds[m.id] || E.kinds.box;
    const cfg = Object.assign({ title: m.name || '吃饭' }, base, k);
    if (m.id === 'beer') { cfg.open = '瓶盖一启，气泡往上冒。'; cfg.belly = '一口凉气下去，脑子里嗡嗡的声音停了一会儿。'; cfg.bites = 4; cfg.secs = 4.5; }
    return FX.micro('eat_' + tier, { cfg, dish: m, tier, kind });
  };
  // ================= 小互动框架 =================
  // FX.micro(id, ctx) → Promise。短流程完整播放，不提供跳过。
  FX.micro = function (id, cx) {
    const M = (cx && cx.cfg) || (C.micro || {})[id]; if (!M || fast()) return Promise.resolve(null);
    cx = cx || {}; const S = G.S(); S.flags = S.flags || {}; S.flags.seenMicro = S.flags.seenMicro || {};
    const first = !S.flags.seenMicro[id]; S.flags.seenMicro[id] = 1;
    const dur = (M.secs || 4) * 1000;
    return new Promise(resolve => {
      const ov = document.createElement('div'); ov.id = 'mx'; ov.className = 'mx-ov ' + (M.cls || '') + ' mxt-' + M.type;
      const AA = window.ART || window.A; const bg = cx.bg || (AA && AA.placeImg ? AA.placeImg(S.loc, G.hourF()) : '');
      ov.innerHTML = `<div class="mx-box"><div class="mx-bg" style="background-image:url(${bg})"></div><div class="mx-shade"></div>
        <div class="mx-title">${esc(M.title)}</div><div class="mx-stage"></div><div class="mx-lines"></div>
        <div class="mx-bar"><i style="animation-duration:${dur}ms"></i></div></div>`;
      document.body.appendChild(ov);
      const st = ov.querySelector('.mx-stage'), ln = ov.querySelector('.mx-lines');
      let over = false; const timers = [];
      const later = (fn, ms) => { const t = setTimeout(() => { if (!over) fn(); }, ms); timers.push(t); return t; };
      const say = (t, cls) => { const p = document.createElement('p'); p.className = 'mx-l ' + (cls || ''); p.textContent = String(t).replace('{money}', cx.money != null ? cx.money : '').replace('{amount}', cx.amount != null ? cx.amount : ''); ln.appendChild(p); while (ln.children.length > 3) ln.firstChild.remove(); };
      const end = v => { if (over) return; over = true; timers.forEach(clearTimeout); ov.classList.add('out'); setTimeout(() => ov.remove(), 260); document.removeEventListener('keydown', kd, true); resolve(v == null ? 'done' : v); };
      const kd = () => {};
      document.addEventListener('keydown', kd, true);
      const lines = cx.lines || M.lines || []; const seqLines = (arr, span, off) => arr.forEach((t, i) => later(() => say(t), (off || 0) + i * span / Math.max(1, arr.length)));
      const clockRun = () => { if (cx.from == null || cx.to == null) return; const c = document.createElement('div'); c.className = 'mx-clock'; st.appendChild(c); const steps = 24; for (let i = 0; i <= steps; i++) later(() => { c.textContent = G.clock(Math.round(cx.from + (cx.to - cx.from) * i / steps)); if (i % 4 === 0) SFX.play('tick'); }, 200 + i * (dur * 0.7) / steps); };
      const afterBeat = (A2, ms) => { ln.innerHTML = ''; st.innerHTML = `<div class="mx-sprite pop">${A2.sprite || ''}</div>`; SFX.play(A2.sfx); seqLines(A2.lines || [], ms * 0.7); later(() => end(), ms); };
      const T = M.type;
      if (T === 'idle') {
        // 歇一会 / 等：路口的人来人往 + 体力条慢慢回上来 + 按时辰换的几句话
        const hr = G.hourF(); const per = hr < 6 ? 'night' : hr < 11 ? 'morning' : hr < 17 ? 'day' : hr < 21 ? 'evening' : 'night';
        const mt = cx.meter;
        st.innerHTML = `<div class="mx-idle"><div class="mx-road"></div><div class="mx-pass"></div></div>` + (mt ? `<div class="mx-meter"><span>${esc(mt.label)}</span><i><b style="width:${Math.round(mt.from / mt.max * 100)}%"></b></i><em>${mt.from}</em></div>` : '');
        clockRun();
        const pass = st.querySelector('.mx-pass'); const kinds = [['🚶', 7, 0], ['🚶‍♀️', 8, 0], ['🧓', 11, 0], ['🚲', 4.5, 0], ['🛵', 3, 1], ['🚐', 3.6, 1]];
        const nPass = Math.max(4, Math.round(dur / 700));
        for (let i = 0; i < nPass; i++) later(() => { const k = rnd(kinds); const e = document.createElement('span'); e.textContent = k[0]; const dirR = Math.random() < .5; e.className = 'mx-p' + (dirR ? ' rev' : ''); e.style.setProperty('--d', k[1] + 's'); e.style.bottom = (4 + Math.random() * 22) + '%'; e.style.fontSize = (30 + Math.random() * 16) + 'px'; pass.appendChild(e); if (k[2]) SFX.play('motor'); setTimeout(() => e.remove(), k[1] * 1000 + 100); }, 150 + i * (dur * 0.85) / nPass);
        if (mt) { const bar = st.querySelector('.mx-meter b'), num = st.querySelector('.mx-meter em'); const steps = Math.max(1, Math.round(mt.to - mt.from)); for (let i = 1; i <= steps; i++) later(() => { const v = Math.round(mt.from + (mt.to - mt.from) * i / steps); bar.style.width = Math.round(v / mt.max * 100) + '%'; num.textContent = v; SFX.play('tick'); }, 400 + i * (dur * 0.7) / steps); }
        SFX.play('wind');
        const pool = (M.pool && M.pool[per]) || []; const pick = pool.slice().sort(() => Math.random() - .5).slice(0, 2);
        seqLines((lines.length ? [lines[0]] : []).concat(pick), dur * 0.8, 200);
        later(() => end(), dur);
      } else if (T === 'chat') {
        // 路口闲聊：头像 + “正在输入”的小点 + 一来一回的气泡
        const pairs = (cx.pairs || (C.chatPool || []).slice().sort(() => Math.random() - .5).slice(0, 3));
        st.innerHTML = '<div class="mx-chatlog"></div>'; const log = st.querySelector('.mx-chatlog'); const faces = ['👷', '🧔', '👨‍🦳', '🧑‍🔧'], myFace = '🧑';
        const items = []; const f0 = rnd(faces); pairs.forEach(p => { items.push({ me: false, t: p[0], f: f0 }); items.push({ me: true, t: p[1], f: myFace }); });
        const per = dur * 0.88 / Math.max(1, items.length);
        items.forEach((it, i) => later(() => {
          const row = document.createElement('div'); row.className = 'mx-crow' + (it.me ? ' me' : ''); row.innerHTML = `<span class="mx-av">${it.f}</span><div class="mx-cb"><span class="mx-typing"><i></i><i></i><i></i></span></div>`; log.appendChild(row); log.scrollTop = 999;
          SFX.play(it.me ? 'blipme' : 'blip');
          setTimeout(() => { if (over) return; const cb = row.querySelector('.mx-cb'); cb.textContent = it.t; cb.classList.add('in'); log.scrollTop = 999; SFX.play('pop'); const n = Math.min(4, Math.ceil(it.t.length / 6)); for (let k = 0; k < n; k++) setTimeout(() => { if (!over) SFX.play(it.me ? 'blipme' : 'blip'); }, 120 + k * 110); }, Math.min(900, per * 0.45));
        }, 250 + i * per));
        later(() => end(), dur);
      } else if (T === 'beat') {
        st.innerHTML = `<div class="mx-sprite">${M.sprite || ''}</div>`; SFX.play(M.sfx);
        if (M.deco) { const D = {
          clinic: () => { st.innerHTML = '<div class="mx-bandage"><div class="mx-limb"></div><div class="mx-wraps"></div><b class="mx-cross">✚</b></div>'; const w = st.querySelector('.mx-wraps'); for (let i = 0; i < 7; i++) later(() => { const b = document.createElement('i'); b.style.setProperty('--k', i); w.appendChild(b); SFX.play('paper'); }, 600 + i * dur * 0.08); later(() => { st.querySelector('.mx-cross').classList.add('on'); SFX.play('chime'); }, 600 + dur * 0.62); },
          rent: () => { st.innerHTML = '<div class="mx-rentx"><span class="mx-bills3"><i>💵</i><i>💵</i><i>💵</i></span><span class="mx-hand">🤝</span><span class="mx-rkey">🔑</span></div>'; SFX.play('paper'); later(() => SFX.play('paper'), 700); later(() => SFX.play('coin'), 1300); later(() => { st.querySelector('.mx-rentx').classList.add('key'); SFX.play('keys'); }, dur * 0.55); },
          sing: () => { st.innerHTML = '<div class="mx-eq">' + Array.from({ length: 11 }, (_, i) => `<i style="--i:${i}"></i>`).join('') + '</div><div class="mx-notes"></div>'; const nt = st.querySelector('.mx-notes'); for (let i = 0; i < 8; i++) later(() => { const e = document.createElement('span'); e.textContent = rnd(['♪', '♫', '♩']); e.style.left = (20 + Math.random() * 60) + '%'; nt.appendChild(e); SFX.play('note'); setTimeout(() => e.remove(), 2200); }, 400 + i * dur * 0.09); },
          board: () => { st.innerHTML = '<div class="mx-wb"><b></b><b></b><b></b><b></b><b></b></div><div class="mx-marker">🖊️</div>'; const bs = st.querySelectorAll('.mx-wb b'); bs.forEach((b, i) => { later(() => { b.classList.add('in'); SFX.play('marker'); }, 400 + i * dur * 0.13); }); later(() => st.querySelector('.mx-wb').classList.add('erase'), dur * 0.8); }
        }; if (D[M.deco]) D[M.deco](); }
        if (M.cls === 'mx-sleep') { SFX.play('lightoff'); later(() => ov.classList.add('dark'), 500); later(() => SFX.play('zzz'), 900); }
        if (M.clock) clockRun();
        seqLines(lines, dur * 0.8, 150); later(() => end(), dur);
      } else if (T === 'collect') {
        let got = 0; const need = M.need || 5;
        st.innerHTML = `<div class="mx-bag">🛍️ <b>0</b>/${need}</div>`; say('点地上的瓶子和罐子，捡进袋子里。', 'hint');
        M.targets.forEach((s, i) => { const b = document.createElement('button'); b.className = 'mx-tg'; b.textContent = s; const n = M.targets.length, cols = Math.ceil(n / 2), slot = (i * 5) % n; b.style.left = (10 + (slot % cols) * (80 / Math.max(1, cols - 1)) + (Math.random() - .5) * 8) + '%'; b.style.top = (30 + Math.floor(slot / cols) * 34 + Math.random() * 14) + '%'; b.style.animationDelay = (i * .12) + 's';
          b.onclick = () => { if (b.classList.contains('got')) return; b.classList.add('got'); got++; SFX.play(M.sfx || 'pop'); st.querySelector('.mx-bag b').textContent = got; if (got >= need) { later(() => afterBeat(M.after, 3200), 350); } }; st.appendChild(b); });
        later(() => { if (got < need) afterBeat(M.after, 3200); }, dur);
      } else if (T === 'wipe') {
        st.innerHTML = `<div class="mx-table"><canvas></canvas></div>`; say(M.hint, 'hint');
        const cv = st.querySelector('canvas'); const tb = st.querySelector('.mx-table'); let W2, H2, g2, fin = false, mv = 0;
        requestAnimationFrame(() => { const b = tb.getBoundingClientRect(); W2 = cv.width = Math.round(b.width); H2 = cv.height = Math.round(b.height); g2 = cv.getContext('2d');
          for (let i = 0; i < 26; i++) { g2.fillStyle = `rgba(${90 + Math.random() * 40},${60 + Math.random() * 20},30,${.35 + Math.random() * .4})`; g2.beginPath(); g2.ellipse(Math.random() * W2, Math.random() * H2, 12 + Math.random() * 34, 8 + Math.random() * 20, Math.random() * 3, 0, 7); g2.fill(); } });
        let dn = false, lx = 0, ly = 0, ls = 0;
        const p2 = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * W2 / b.width, (e.clientY - b.top) * H2 / b.height]; };
        const doneW = () => { if (fin) return; fin = true; afterBeat(M.after, 3000); };
        cv.onpointerdown = e => { dn = true; [lx, ly] = p2(e); };
        cv.onpointermove = e => { if (!dn || fin || !g2) return; const [x, y] = p2(e); g2.globalCompositeOperation = 'destination-out'; g2.lineWidth = 46; g2.lineCap = 'round'; g2.beginPath(); g2.moveTo(lx, ly); g2.lineTo(x, y); g2.stroke(); g2.globalCompositeOperation = 'source-over'; mv += Math.hypot(x - lx, y - ly); lx = x; ly = y; const n = Date.now(); if (n - ls > 120) { ls = n; SFX.play('wipe'); } if (mv > W2 * 5) doneW(); };
        cv.onpointerup = cv.onpointerleave = () => { dn = false; };
        later(doneW, dur);
      } else if (T === 'spin') {
        st.innerHTML = `<div class="mx-washer"><div class="mx-drum"><span>👕</span><span>👖</span><span>🧦</span></div><div class="mx-timer">00:30</div></div>`;
        SFX.play('coin'); say(lines[0]);
        later(() => { st.querySelector('.mx-washer').classList.add('on'); SFX.play('water'); say(lines[1]); }, 700);
        for (let i = 0; i <= 30; i++) later(() => { const t = st.querySelector('.mx-timer'); if (t) t.textContent = '00:' + String(30 - i).padStart(2, '0'); }, 700 + i * (dur * 0.6) / 30);
        later(() => { st.innerHTML = `<div class="mx-line-dry"><span>👕</span><span>👖</span><span>🧦</span></div>`; SFX.play('paper'); say(lines[2]); }, 700 + dur * 0.62);
        later(() => end(), dur);
      } else if (T === 'count') {
        const amt = cx.amount || 0; st.innerHTML = `<div class="mx-count"><div class="mx-bills"></div><div class="mx-sum">¥ <b>0</b></div></div>`; say(lines[0]);
        const bills = st.querySelector('.mx-bills'), sum = st.querySelector('.mx-sum b'); const n = Math.min(10, Math.max(3, Math.round(amt / 100)));
        for (let i = 1; i <= n; i++) later(() => { const b = document.createElement('i'); b.style.setProperty('--k', i); bills.appendChild(b); sum.textContent = Math.round(amt * i / n); SFX.play('paper'); }, i * (dur * 0.45) / n);
        later(() => { const s = document.createElement('div'); s.className = 'mx-stamp'; s.textContent = M.stamp || '已汇出'; st.querySelector('.mx-count').appendChild(s); SFX.play('stamp'); say(lines[1]); }, dur * 0.55);
        later(() => { if (M.noReceipt) return; const r = document.createElement('div'); r.className = 'mx-receipt'; r.innerHTML = `<b>汇款回执</b><span>金额 ¥${amt}</span><span>第 ${G.dayNum()} 天 ${G.clock()}</span>`; st.querySelector('.mx-count').appendChild(r); SFX.play('beep'); say(lines[2]); }, dur * 0.75);
        later(() => end(), dur);
      } else if (T === 'dial') {
        st.innerHTML = `<div class="mx-phone"><div class="mx-num"></div><div class="mx-pad">${'123456789*0#'.split('').map(k => `<span>${k}</span>`).join('')}</div></div>`;
        const keys = st.querySelectorAll('.mx-pad span'), num = st.querySelector('.mx-num'); const seq = [1, 3, 8, 0, 0, 0, 0, 0, 0, 0, 0];
        seq.forEach((k, i) => later(() => { const el = [...keys].find(x => x.textContent === String(k)); if (el) { el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 140); } num.textContent += i < 3 ? k : '•'; SFX.play('key'); }, 120 + i * 120));
        later(() => { num.textContent = '嘟——嘟——'; SFX.play('ringback'); }, 1500);
        later(() => SFX.play('phonering'), 2500);
        later(() => { st.querySelector('.mx-phone').classList.add('talk'); num.textContent = '通话中'; SFX.play('pickup'); }, 3400);
        lines.forEach((t, i) => later(() => { say(t, i % 2 ? 'me' : 'them'); SFX.play(i % 2 ? 'speakme' : 'speakthem'); }, 3600 + i * (dur - 4200) / lines.length));
        later(() => SFX.play('hangup'), dur - 450);
        later(() => end(), dur);
      } else if (T === 'choose') {
        st.innerHTML = `<div class="mx-screen"><div class="mx-glow"></div><p>${esc(M.ask)}</p><div class="mx-opts">${M.options.map((o, i) => `<button class="btn sm" data-o="${i}">${esc(o.t)}</button>`).join('')}</div></div>`; SFX.play('beep');
        st.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { const o = M.options[+b.dataset.o]; st.querySelector('.mx-opts').innerHTML = `<b>${esc(o.t)}</b>`; SFX.play('click'); say(o.line); later(() => end(o.t), 2200); });
        later(() => { if (st.querySelector('[data-o]')) { const o = M.options[0]; say(o.line); later(() => end(o.t), 1800); } }, dur);
      } else if (T === 'form') {
        st.innerHTML = `<div class="mx-form">${M.fields.map(f => `<div class="ff"><span>${esc(f)}</span><i></i></div>`).join('')}<div class="mx-fee">${cx.fee ? '费用 ¥' + cx.fee : ''}</div></div>`;
        const ff = st.querySelectorAll('.ff i'); ff.forEach((el, i) => later(() => { el.classList.add('fill'); SFX.play('marker'); }, 300 + i * 650));
        later(() => { say(lines[0]); SFX.play('paper'); }, 300 + ff.length * 650);
        later(() => { const s = document.createElement('div'); s.className = 'mx-stamp'; s.textContent = '收讫'; st.querySelector('.mx-form').appendChild(s); SFX.play('stamp'); say(lines[1]); }, 600 + ff.length * 650 + 500);
        later(() => end(), dur);
      } else if (T === 'bubbles') {
        lines.forEach((t, i) => later(() => { const b = document.createElement('div'); b.className = 'mx-bub' + (i % 2 ? ' r' : ''); b.textContent = t; b.style.top = (10 + i * 19) + '%'; st.appendChild(b); SFX.play('pop'); }, 300 + i * (dur * 0.75) / lines.length));
        later(() => end(), dur);
      } else if (T === 'fish') {
        st.innerHTML = `<div class="mx-water"><span class="mx-bob">🎣</span><button class="btn sm mx-pull" disabled>提竿</button></div>`; say('盯着浮漂，等它沉下去就提竿。', 'hint');
        const bob = st.querySelector('.mx-bob'), pull = st.querySelector('.mx-pull'); let biting = false, res = null; const bite = 1500 + Math.random() * 2000;
        later(() => { biting = true; bob.classList.add('dip'); pull.disabled = false; SFX.play('splash'); say(lines[0]); }, bite);
        later(() => { if (res == null) { res = 'miss'; biting = false; pull.disabled = true; bob.classList.remove('dip'); say('鱼跑了。也好，本来也就是坐坐。'); later(() => end('miss'), 1600); } }, bite + 1500);
        pull.onclick = () => { if (!biting || res) return; res = 'hit'; SFX.play('coin'); say(lines[1]); st.querySelector('.mx-water').innerHTML = '<span class="mx-fish">🐟</span>'; later(() => end('hit'), 1700); };
        later(() => end(res || 'miss'), dur + 1500);
      } else if (T === 'eat') {
        const D = cx.dish || {}, tier = cx.tier || 'normal', kind = cx.kind || 'box'; const bites = M.bites; const AI = (window.ART && window.ART.IMG && window.ART.IMG.dish) || {}; const src = AI[kind] || AI[D.id] || AI[D.dish] || AI.boxmeal || '';
        const ut = M.utensil || '🥢';
        const cold = kind === 'beer'; const drops = cold ? Array.from({ length: 16 }, (_, i) => `<b style="--x:${6 + (i * 37) % 88}%;--y:${8 + (i * 53) % 80}%;--d:${(i % 5) * .5}s;--s:${3 + (i % 4) * 1.5}px"></b>`).join('') : '';
        st.innerHTML = `<div class="mx-eat ${tier}${cold ? ' cold' : ''}">${cold ? '<div class="mx-mist"><i></i><i></i><i></i></div>' : '<div class="mx-steam"><i></i><i></i><i></i></div>'}<div class="mx-bowl"><div class="mx-food" style="background-image:url(${src})"></div><div class="mx-empty"></div>${cold ? `<div class="mx-frost"></div><div class="mx-drops">${drops}</div>` : ''}</div><div class="mx-ut">${ut}</div><div class="mx-glow2"></div></div>`;
        const food = st.querySelector('.mx-food'), emp = st.querySelector('.mx-empty'), u = st.querySelector('.mx-ut'), steam = st.querySelector('.mx-steam') || st.querySelector('.mx-mist'), box = st.querySelector('.mx-eat');
        const per = (dur * 0.78) / bites; say(M.open);
        for (let i = 0; i < bites; i++) {
          later(() => { u.className = 'mx-ut dip'; }, 300 + i * per);
          later(() => { SFX.play(M.sfxBite); u.className = 'mx-ut up'; const f = (i + 1) / bites; emp.style.setProperty('--e', f * 0.5); food.style.transform = `scale(${1 - f * 0.1})`; steam.style.opacity = Math.max(.15, 1 - f * .85); if (M.sfxChew) setTimeout(() => SFX.play(M.sfxChew), 260); }, 300 + i * per + per * 0.38);
          if (M.lines && M.lines[i]) later(() => say(M.lines[i]), 300 + i * per + per * 0.5);
        }
        later(() => { u.className = 'mx-ut'; box.classList.add('done'); SFX.play('belly'); if (M.sfxEnd) setTimeout(() => SFX.play(M.sfxEnd), 500); ln.innerHTML = ''; say(M.belly, 'warm'); }, 300 + bites * per + 200);
        later(() => end(), dur);
      } else if (T === 'mirror') {
        st.innerHTML = `<div class="mx-mirror"><div class="mx-frame"><div class="mx-fig">${cx.fig || ''}</div><div class="mx-sweep"></div></div><div class="mx-tags">${(cx.tags || []).map(t => `<i>${esc(t)}</i>`).join('')}</div></div>`;
        SFX.play('cloth'); say(lines[0]); later(() => { SFX.play('chime'); say(cx.verdict || lines[1]); }, dur * 0.55); later(() => st.querySelector('.mx-mirror').classList.add('turn'), dur * 0.3); later(() => end(), dur);
      } else if (FX.ext && FX.ext[T]) { FX.ext[T]({ st, ln, say, later, end, dur, M, cx, ov, SFX, rnd, over: () => over, lines }); }
      else { later(() => end(), 600); }
    });
  };
})();
