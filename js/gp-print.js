// 印刷厂压印：音符和伴奏锁在同一条节拍时钟上。曲子是现场合成的，没有外部音轨。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { ri, clamp } = U;
  const LX = 120, LW = 110, TOP = 78, LINE = 392;
  const LANES = [{ n: '青', c: '#2aa6d8', k: 'd', f: 523 }, { n: '红', c: '#d8386a', k: 'f', f: 659 }, { n: '黄', c: '#e8c424', k: 'j', f: 784 }, { n: '黑', c: '#4a4e5a', k: 'k', f: 392 }];
  const KEYMAP = { d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
  const SCALE = [50, 53, 55, 57, 60, 62, 65, 67];
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  GP.printWindows = function (bpm) {
    if (bpm <= 78) return { perfect: 0.11, good: 0.24 };
    if (bpm <= 92) return { perfect: 0.09, good: 0.19 };
    return { perfect: 0.075, good: 0.16 };
  };
  GP.printPace = function (hits) {
    const n = Math.max(0, hits || 0);
    return { bpm: Math.min(104, 72 + Math.floor(n / 8) * 6), chords: n >= 16 };
  };
  GP.printJudge = function (notes, lane, time, win) {
    let best = null;
    notes.forEach(n => {
      if (n.lane !== lane || n.state !== 0) return;
      const d = time - n.t;
      if (Math.abs(d) <= win.good && (!best || Math.abs(d) < Math.abs(best.d))) best = { n, d };
    });
    if (!best) return { kind: 'stray' };
    const kind = Math.abs(best.d) <= win.perfect ? 'perfect' : (best.d < 0 ? 'early' : 'late');
    return { kind, note: best.n, d: best.d };
  };
  GP.printQuality = function (hits) {
    hits = hits || {};
    const perfect = hits.perfect || 0, good = hits.good || 0, miss = hits.miss || 0, stray = hits.stray || 0;
    const judged = perfect + good + miss;
    const acc = perfect + good * 0.7;
    const q = acc / Math.max(judged, 1) * 0.9 + Math.min(1, (hits.maxCombo || 0) / 12) * 0.1 - Math.min(0.08, stray * 0.004);
    return clamp(q, 0, 1);
  };
  GP.reg('print', {
    title: '压印节拍 · 印刷', dur: 70, minutes: 480, hours: 8, tint: 'rgba(20,16,24,.62)',
    help: ['先听四拍。纸张跟着拍子下来，压到亮线时按同色的键：D 青、F 红、J 黄、K 黑。手机点那一条道。', '开头只有单张纸，没有两张一起。按下去压板会动，正好、稍早、稍晚、漏印都会写出来。', '练习不计工钱、不扣状态。会了几下才开始计时，拍子再一点点加快。'],
    make(env) {
      const g = { notes: [], hits: { perfect: 0, good: 0, miss: 0, stray: 0, maxCombo: 0 }, combo: 0, pf: 0, flash: [0, 0, 0, 0], press: [0, 0, 0, 0], auto: null, judge: null, waste: [], bpm: 72, allowChords: false, stage: 'count', pulse: 0, beatIndex: 0, horizon: 0, scheduled: [], heard: false, practiceTries: 0, practiceHits: 0 };
      const clock = { ctx: null, gain: null, origin: 0, paused: false, frozen: 0, visual: false };
      g.clock = clock;
      function songNow() {
        if (clock.paused) return clock.frozen;
        if (clock.ctx && clock.ctx.state === 'running') return clock.ctx.currentTime - clock.origin;
        return performance.now() / 1000 - clock.origin;
      }
      function muted() { return !!(window.Music && Music.muted); }
      function bootAudio() {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { clock.visual = true; clock.origin = performance.now() / 1000; return; }
        const ctx = new AC();
        clock.ctx = ctx; clock.gain = ctx.createGain();
        clock.gain.gain.value = muted() ? 0 : 0.2;
        clock.gain.connect(ctx.destination);
        clock.origin = ctx.currentTime;
        if (ctx.state === 'suspended') ctx.resume().then(() => { g.heard = ctx.state === 'running'; }).catch(() => { clock.visual = true; clock.ctx = null; clock.origin = performance.now() / 1000; });
        else g.heard = true;
        if (window.Music && Music.motifTimer) clearTimeout(Music.motifTimer);
      }
      bootAudio();
      const onMute = () => { if (clock.gain) clock.gain.gain.value = muted() ? 0 : 0.2; };
      const onVis = () => {
        if (document.hidden) { clock.frozen = songNow(); clock.paused = true; if (clock.ctx && clock.ctx.state === 'running') clock.ctx.suspend(); }
        else if (clock.paused) {
          clock.paused = false;
          const restore = () => { clock.origin = (clock.ctx && clock.ctx.state === 'running' ? clock.ctx.currentTime : performance.now() / 1000) - clock.frozen; };
          if (clock.ctx && clock.ctx.state === 'suspended') clock.ctx.resume().then(restore).catch(restore); else restore();
        }
      };
      document.addEventListener('jxq-music', onMute);
      document.addEventListener('visibilitychange', onVis);
      function tone(freq, when, dur, vol, type) {
        if (!clock.ctx || clock.ctx.state !== 'running') return;
        const t0 = when;
        const o = clock.ctx.createOscillator(), gn = clock.ctx.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
        gn.gain.setValueAtTime(0.0001, t0);
        gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + 0.012);
        gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(gn); gn.connect(clock.gain); o.start(t0); o.stop(t0 + dur + 0.02);
        g.scheduled.push(when);
      }
      function playBeat(atSong, accent) {
        if (!clock.ctx || clock.paused) return;
        const when = clock.origin + atSong;
        if (when < clock.ctx.currentTime - 0.03) return;
        tone(accent ? 90 : 180, when, accent ? 0.12 : 0.05, accent ? 0.45 : 0.12, accent ? 'sine' : 'square');
        if (accent) tone(midi(SCALE[Math.floor(atSong * g.bpm / 60) % SCALE.length]), when, 0.18, 0.16, 'triangle');
      }
      function ensure(until) {
        const pace = GP.printPace(g.hits.perfect + g.hits.good);
        g.bpm = pace.bpm; g.allowChords = pace.chords && g.stage === 'work';
        const beat = 60 / g.bpm;
        while (g.horizon < until) {
          const t = g.horizon;
          const index = g.beatIndex++;
          g.beats = g.beats || [];
          g.beats.push({ t, accent: index % 4 === 0, played: false });
          if (g.stage === 'practice' && index >= 4 && index < 12 && index % 2 === 0) g.notes.push({ t, lane: index % 4, state: 0, practice: true, fall: beat * 2 });
          if (g.stage === 'work' && index % 2 === 0) {
            const lane = index % 4;
            g.notes.push({ t, lane, state: 0, practice: false, fall: beat * 2 });
            if (g.allowChords && index % 16 === 0) g.notes.push({ t, lane: (lane + 2) % 4, state: 0, practice: false, fall: beat * 2 });
          }
          g.horizon += beat;
        }
      }
      function mark(kind, lane, practice) {
        g.press[lane] = 0.22; g.flash[lane] = kind === 'stray' || kind === 'miss' ? 0.18 : 0;
        const x = LX + lane * LW + LW / 2;
        const word = { perfect: '正好', early: '稍早', late: '稍晚', stray: '空按', miss: '漏印' }[kind];
        env.float(x, LINE - 48, word, kind === 'perfect' ? '#ffe27a' : kind === 'early' || kind === 'late' ? '#d8e6f0' : '#ffb09a', kind === 'perfect' ? 22 : 16);
        if (kind === 'perfect') { env.burst(x, LINE, 10, { colors: [LANES[lane].c, '#fff', '#ffe27a'], speed: 160, up: 80, size: 3.4, life: .5 }); S.tone(LANES[lane].f, LANES[lane].f * 1.5, .14, .2); }
        else if (kind === 'early' || kind === 'late') S.tone(LANES[lane].f * 0.75, LANES[lane].f, .1, .12);
        else S.tone(140, 90, .08, .12);
        if (practice) return;
        if (kind === 'perfect' || kind === 'early' || kind === 'late') { g.combo++; g.hits.maxCombo = Math.max(g.hits.maxCombo, g.combo); if (kind === 'perfect') g.hits.perfect++; else g.hits.good++; }
        else { g.combo = 0; if (kind === 'stray') g.hits.stray++; }
      }
      function judge(lane) {
        if (g.stage === 'count' || clock.paused) { g.press[lane] = 0.22; return; }
        const win = GP.printWindows(g.bpm);
        const pool = g.notes.filter(n => g.stage === 'practice' ? n.practice : !n.practice);
        const hit = GP.printJudge(pool, lane, songNow(), win);
        if (hit.kind === 'stray') { mark('stray', lane, g.stage === 'practice'); return; }
        hit.note.state = hit.kind === 'perfect' ? 1 : 2; hit.note.at = songNow();
        mark(hit.kind, lane, !!hit.note.practice);
        if (hit.note.practice) { g.practiceHits++; g.practiceTries++; if (g.practiceHits >= 3) g.stage = 'work'; }
      }
      g.judge = judge; g.songNow = songNow;
      const laneAt = x => { const l = Math.floor((x - LX) / LW); return l >= 0 && l < 4 ? l : -1; };
      g.pointer = (k, x, y) => { if (k !== 'down') return; const l = laneAt(x); if (l >= 0 && y >= TOP - 10 && y <= LINE + 90) judge(l); };
      g.key = (k, down) => { if (!down) return false; if (KEYMAP[k] != null) { judge(KEYMAP[k]); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['拍', Math.round(g.bpm)], ['正好', g.hits.perfect]];
      g.hintExternal = true;
      g.hint = () => g.stage === 'count' ? '听四拍。压板会跟着点头。' : g.stage === 'practice' ? '练习：单张纸压到亮线再按。错了不计分。' : 'D 青  F 红  J 黄  K 黑。点亮的那条道也行。';
      g.update = dt => {
        if (env.ended) { document.removeEventListener('visibilitychange', onVis); document.removeEventListener('jxq-music', onMute); return; }
        if (clock.paused) { env.addTime(dt); return; }
        const t = songNow(); g.pf = t; ensure(t + 3.2);
        (g.beats || []).forEach(b => { if (!b.played && b.t <= t + 0.06) { b.played = true; playBeat(b.t, b.accent); g.pulse = 1; } });
        g.pulse = Math.max(0, g.pulse - dt * 2.4);
        if (g.stage === 'count' && t >= 60 / g.bpm * 4) g.stage = 'practice';
        for (let i = 0; i < 4; i++) { g.flash[i] = Math.max(0, g.flash[i] - dt); g.press[i] = Math.max(0, g.press[i] - dt); }
        const win = GP.printWindows(g.bpm);
        g.notes.forEach(n => {
          if (n.state !== 0 || t <= n.t + win.good) return;
          n.state = 3; const x = LX + n.lane * LW + LW / 2;
          env.float(x, LINE + 28, '漏印', '#ff8c78', 17); g.flash[n.lane] = 0.2;
          if (n.practice) { g.practiceTries++; if (g.practiceTries >= 8 && g.stage === 'practice') g.stage = 'work'; }
          else { g.hits.miss++; g.combo = 0; }
        });
        if (g.auto) g.notes.forEach(n => { if (n.state === 0 && t >= n.t - (g.auto === 'bad' ? -0.05 : 0.01)) judge(n.lane); });
      };
      const sheet = (ctx, x, y, w, h, c, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, U.shade(c, .35)); gr.addColorStop(1, c); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = U.shade(c, -.5); ctx.stroke(); ctx.restore(); };
      g.draw = ctx => {
        const t = songNow();
        U.panel(ctx, LX - 16, TOP - 28, LW * 4 + 32, LINE - TOP + 130, 16);
        const beat = 60 / g.bpm;
        ctx.beginPath(); ctx.arc(LX + LW * 2, TOP - 8, 8 + g.pulse * 8, 0, 7); ctx.fillStyle = g.pulse > 0.2 ? '#ffe27a' : 'rgba(255,255,255,.35)'; ctx.fill();
        if (g.stage === 'count') U.txt(ctx, String(Math.max(1, 4 - Math.floor(t / beat))), LX + LW * 2, LINE - 80, 64, '#ffe9a8', 'center', true);
        for (let i = 0; i < 4; i++) {
          const x = LX + i * LW, L = LANES[i];
          ctx.fillStyle = U.rgba(L.c, 0.16 + g.press[i] * 1.4); ctx.fillRect(x + 4, TOP, LW - 8, LINE + 36 - TOP);
          if (g.flash[i] > 0) { ctx.fillStyle = `rgba(255,80,60,${g.flash[i]})`; ctx.fillRect(x + 4, TOP, LW - 8, LINE + 36 - TOP); }
        }
        ctx.fillStyle = '#fff6d8'; ctx.fillRect(LX, LINE - 3, LW * 4, 6);
        g.notes.forEach(n => {
          if (n.state === 3) return;
          const fall = n.fall || 1.4;
          const y = n.state ? LINE : LINE - (n.t - t) / fall * (LINE - TOP);
          if (y < TOP - 40 || y > LINE + 40) return;
          const a = n.state ? clamp(1 - (t - n.at) / 0.25, 0, 1) : 1;
          if (a <= 0) return;
          sheet(ctx, LX + n.lane * LW + LW / 2, y, LW - 28, 34, LANES[n.lane].c, a);
        });
        for (let i = 0; i < 4; i++) {
          const x = LX + i * LW, L = LANES[i], dn = g.press[i];
          const drop = dn * 70;
          U.glossy(ctx, x + 10, LINE + 18 + drop, LW - 20, 48 - drop * 0.4, 10, L.c, { shadow: dn < 0.05 });
          U.txt(ctx, L.n, x + LW / 2, LINE + 50 + drop * 0.4, 22, '#fff', 'center', true);
          U.txt(ctx, L.k.toUpperCase(), x + LW / 2, LINE + 86, 14, 'rgba(255,255,255,.75)', 'center');
        }
        U.panel(ctx, 620, 78, 250, 250, 16);
        U.txt(ctx, g.stage === 'work' ? '正式开印' : g.stage === 'practice' ? '练习' : '预备', 745, 112, 20, '#ffe9b8', 'center', true);
        U.txt(ctx, Math.round(g.bpm) + ' 拍', 745, 148, 16, '#e9dcc0', 'center');
        U.txt(ctx, `正好 ${g.hits.perfect}  稍早/晚 ${g.hits.good}`, 745, 196, 15, '#b6f59a', 'center');
        U.txt(ctx, `漏印 ${g.hits.miss}  空按 ${g.hits.stray}`, 745, 224, 15, '#ff9c8a', 'center');
        U.txt(ctx, g.allowChords ? '偶尔会有两张一起' : '现在只有单张', 745, 268, 14, '#e9dcc0', 'center');
      };
      g.final = () => {
        const q = GP.printQuality(g.hits);
        const lines = [`正好 ${g.hits.perfect} 张，稍早或稍晚 ${g.hits.good} 张`, g.hits.miss ? `漏印 ${g.hits.miss} 张` : '没有漏印', `空按 ${g.hits.stray} 次`, `最长连击 ${g.hits.maxCombo}`];
        return { quality: q, score: g.hits.perfect, summary: `压准 ${g.hits.perfect + g.hits.good} 张，漏印 ${g.hits.miss} 张。`, lines, stats: { perfect: g.hits.perfect, good: g.hits.good, miss: g.hits.miss, stray: g.hits.stray, practice: g.practiceHits } };
      };
      return g;
    }
  });
})();
