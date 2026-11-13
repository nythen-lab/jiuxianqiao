// v1.0.2 · 印刷厂 → 压印节拍（四轨节奏）：四种颜色的纸张顺着滚筒送过来，压到亮线时按对应的压板（D F J K / 点四条道）。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const LX = 120, LW = 96, TOP = 76, LINE = 420, FALL = 1.55, WIN = { perfect: .06, good: .13 };
  const LANES = [{ n: '青', c: '#2aa6d8', k: 'd', f: 330 }, { n: '红', c: '#d8386a', k: 'f', f: 392 }, { n: '黄', c: '#e8c424', k: 'j', f: 494 }, { n: '黑', c: '#4a4e5a', k: 'k', f: 587 }];
  const KEYMAP = { d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
  GP.reg('print', {
    title: '压印节拍 · 印刷', dur: 62, minutes: 480, hours: 8, tint: 'rgba(20,16,24,.62)',
    help: ['四种颜色的纸张顺着滚筒从上往下送来。纸张压到下面那条亮线的瞬间，按对应颜色的压板：D F J K（或 ← ↓ ↑ →、1234；手机直接点那条道）。', '压得越准越漂亮（“正好”得分高）；按早了按晚了算“差点”；漏掉的纸会印废，空按也会糟蹋一张。', '连着压准会越来越有节奏感，连击越高越稳。'],
    make(env) {
      const g = { notes: [], hits: { perfect: 0, good: 0, miss: 0, stray: 0 }, combo: 0, maxCombo: 0, pf: 0, flash: [0, 0, 0, 0], press: [0, 0, 0, 0], auto: null, total: 0, judge: null, waste: [], bpm: 96 };
      // 谱面：随机但有节奏感的 4 轨，前 2 秒空
      const beat = 60 / g.bpm; let tt = 2.2, lastL = -1; const dur = env.dur;
      while (tt < dur - 1.4) { const r = Math.random(); let l; do { l = ri(0, 3); } while (l === lastL && Math.random() < .7); lastL = l; g.notes.push({ t: tt, lane: l, state: 0 }); if (r < .22 && tt < dur - 3) { let l2; do { l2 = ri(0, 3); } while (l2 === l); g.notes.push({ t: tt, lane: l2, state: 0 }); } tt += beat * (r < .2 ? .5 : 1); }
      g.total = g.notes.length;
      let acc = 0;
      const now = () => env.t;
      function judge(lane) {
        g.press[lane] = .12; const t = now(); let best = null; for (const n of g.notes) if (n.lane === lane && n.state === 0 && Math.abs(n.t - t) < WIN.good + .03 && (!best || Math.abs(n.t - t) < Math.abs(best.t - t))) best = n;
        const x = LX + lane * LW + LW / 2;
        if (!best) { g.hits.stray++; g.combo = 0; S.tone(140, 90, .09, .12); env.float(x, LINE - 50, '空按', '#ffb09a', 16); env.shake(2); g.flash[lane] = .15; return; }
        const d = Math.abs(best.t - t); best.state = d <= WIN.perfect ? 1 : 2; best.at = t; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
        if (best.state === 1) { g.hits.perfect++; acc += 1; env.float(x, LINE - 54, g.combo >= 5 ? `正好 ×${g.combo}` : '正好', '#ffe27a', 22); env.burst(x, LINE, 9, { colors: [LANES[lane].c, '#fff', '#ffe27a'], speed: 150, up: 90, size: 3.2, life: .5 }); } else { g.hits.good++; acc += .62; env.float(x, LINE - 50, t < best.t ? '早了点' : '晚了点', '#d8e6f0', 16); env.burst(x, LINE, 4, { colors: [LANES[lane].c], speed: 90, up: 50, size: 2.6, life: .4 }); }
        S.tone(LANES[lane].f, LANES[lane].f * 1.5, .12, .16); if (g.combo && g.combo % 10 === 0) { S.good(g.combo / 10); env.say(`连击 ${g.combo}！`, '#ffe9a8', 1.1); }
      }
      g.judge = judge;
      const laneAt = x => { const l = Math.floor((x - LX) / LW); return l >= 0 && l < 4 ? l : -1; };
      g.pointer = (k, x, y) => { if (k !== 'down') return; const l = laneAt(x); if (l >= 0) judge(l); };
      g.key = (k, down) => { if (!down) return false; if (KEYMAP[k] != null) { judge(KEYMAP[k]); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['连击', g.combo], ['正好', g.hits.perfect], ['废纸', g.hits.miss + g.hits.stray, (g.hits.miss + g.hits.stray) > 4 ? '#e8705a' : null]];
      g.hint = () => g.hits.perfect + g.hits.good < 3 ? '纸张压到亮线时，按对应颜色的压板' : null;
      g.update = dt => {
        g.pf += dt; const t = now();
        for (let i = 0; i < 4; i++) { g.flash[i] = Math.max(0, g.flash[i] - dt); g.press[i] = Math.max(0, g.press[i] - dt); }
        for (const n of g.notes) {
          if (n.state === 0 && t - n.t > WIN.good + .03) { n.state = 3; g.hits.miss++; g.combo = 0; const x = LX + n.lane * LW + LW / 2; S.noise(0, .12, 500, .12, 'lowpass'); g.waste.push({ x, y: LINE + 20, t: 0, c: LANES[n.lane].c }); env.float(x, LINE + 30, '印废了', '#ff8c78', 17); g.flash[n.lane] = .25; if (g.hits.miss % 4 === 1) env.shake(3); }
          if (g.auto && n.state === 0) { const bad = g.auto === 'bad'; if (!bad && t >= n.t - .01) judge(n.lane); else if (bad && t >= n.t && Math.random() < .35 && !n.skip) { judge(n.lane); } else if (bad && t > n.t + .05) n.skip = 1; }
        }
        g.waste.forEach(w => { w.t += dt; w.y += 80 * dt; }); g.waste = g.waste.filter(w => w.t < 1);
        if (g.auto === 'bad' && Math.random() < dt * 1.2) judge(ri(0, 3));
      };
      const sheet = (ctx, x, y, w, h, c, a, st) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); U.shadowEllipse(ctx, 0, h / 2 + 4, w * .45, 4, .25); const gr = ctx.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, U.shade(c, .3)); gr.addColorStop(1, c); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = U.shade(c, -.55); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-w / 2 + 8, -h / 2 + 7, w - 16, 3); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-w / 2 + 8, -h / 2 + 15, w * .5, 3); ctx.restore(); };
      g.draw = ctx => {
        const t = now();
        U.panel(ctx, LX - 14, TOP - 8, LW * 4 + 28, 440, 16, { top: 'rgba(30,28,36,.9)', bot: 'rgba(16,14,22,.92)' });
        for (let i = 0; i < 4; i++) { const x = LX + i * LW, L = LANES[i]; const gr = ctx.createLinearGradient(0, TOP, 0, LINE + 40); gr.addColorStop(0, 'rgba(40,40,52,.9)'); gr.addColorStop(1, U.rgba(L.c, .22 + g.press[i] * 2)); ctx.fillStyle = gr; ctx.fillRect(x + 3, TOP, LW - 6, LINE + 40 - TOP);
          ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < 14; k++) { const yy = TOP + ((k * 30 + g.pf * 80) % (LINE - TOP)); ctx.fillRect(x + 3, yy, LW - 6, 2); }
          if (g.flash[i] > 0) { ctx.fillStyle = `rgba(255,70,50,${g.flash[i] * 1.4})`; ctx.fillRect(x + 3, TOP, LW - 6, LINE + 40 - TOP); } }
        // 亮线
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(LX, LINE - 2, LW * 4, 4); ctx.fillStyle = 'rgba(255,230,150,.2)'; ctx.fillRect(LX, LINE - 20, LW * 4, 40);
        // 纸张
        for (const n of g.notes) { if (n.state === 1 || n.state === 2) { const k = (t - n.at); if (k > .25) continue; sheet(ctx, LX + n.lane * LW + LW / 2, LINE, LW - 20, 30, LANES[n.lane].c, 1 - k / .25); continue; } if (n.state === 3) continue; const y = LINE - (n.t - t) / FALL * (LINE - TOP); if (y < TOP - 30 || y > LINE + 60) continue; sheet(ctx, LX + n.lane * LW + LW / 2, y, LW - 20, 30, LANES[n.lane].c, clamp((y - TOP) / 40, .2, 1)); }
        g.waste.forEach(w => { ctx.save(); ctx.globalAlpha = 1 - w.t; ctx.translate(w.x, w.y); ctx.rotate(w.t * 2); ctx.fillStyle = '#888'; ctx.fillRect(-26, -12, 52, 24); ctx.strokeStyle = '#c33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(18, 8); ctx.moveTo(18, -8); ctx.lineTo(-18, 8); ctx.stroke(); ctx.restore(); });
        // 压板
        for (let i = 0; i < 4; i++) { const x = LX + i * LW, L = LANES[i], dn = g.press[i] > 0; U.glossy(ctx, x + 8, LINE + 22 + (dn ? 4 : 0), LW - 16, 44 - (dn ? 4 : 0), 10, L.c, { shadow: !dn }); U.txt(ctx, L.n, x + LW / 2, LINE + 52 + (dn ? 3 : 0), 20, '#fff', 'center', true); U.txt(ctx, L.k.toUpperCase(), x + LW / 2, LINE + 82, 13, 'rgba(255,255,255,.6)', 'center'); }
        // 右栏
        U.panel(ctx, 560, 78, 314, 300, 16); U.txt(ctx, '今天的印刷', 717, 108, 18, '#ffe9b8', 'center', true);
        const done = g.hits.perfect + g.hits.good + g.hits.miss, tot = g.total; U.rr(ctx, 584, 126, 266, 14, 7, 'rgba(0,0,0,.4)'); U.rr(ctx, 584, 126, Math.max(8, 266 * done / tot), 14, 7, '#ffcf5a'); U.txt(ctx, `已过 ${done}/${tot} 张`, 717, 160, 13, '#e9dcc0', 'center');
        U.txt(ctx, String(g.combo), 717, 232, 62, g.combo >= 10 ? '#ffe27a' : '#fff', 'center', true, 'rgba(0,0,0,.6)'); U.txt(ctx, '连击', 717, 258, 16, '#e9dcc0', 'center');
        U.txt(ctx, `正好 ${g.hits.perfect}　差点 ${g.hits.good}`, 717, 300, 17, '#b6f59a', 'center', true); U.txt(ctx, `印废 ${g.hits.miss}　空按 ${g.hits.stray}`, 717, 328, 17, '#ff9c8a', 'center', true); U.txt(ctx, `最长连击 ${g.maxCombo}`, 717, 356, 13, '#e9dcc0', 'center');
        U.txt(ctx, '按键 D F J K · 或直接点道', 717, 410, 13, 'rgba(255,240,210,.6)', 'center');
      };
      g.final = () => { const done = g.hits.perfect + g.hits.good + g.hits.miss, den = Math.max(g.total * Math.min(1, env.t / env.dur + .04), 1); const q = clamp(acc / den, 0, 1) * .88 + clamp(g.maxCombo / Math.max(1, g.total * .5), 0, 1) * .12 - Math.min(.1, g.hits.stray * .01); return { quality: clamp(q, 0, 1), score: g.hits.perfect, summary: `压准 ${g.hits.perfect + g.hits.good} 张，印废 ${g.hits.miss} 张。`, lines: [`正好 ${g.hits.perfect} 张，差点 ${g.hits.good} 张`, g.hits.miss ? `漏掉印废 ${g.hits.miss} 张，白白糟蹋了纸` : '一张没印废', `最长连击 ${g.maxCombo}`, g.hits.stray ? `空按糟蹋了 ${g.hits.stray} 次` : ''].filter(Boolean), stats: { perfect: g.hits.perfect, good: g.hits.good, miss: g.hits.miss, stray: g.hits.stray } }; };
      return g;
    }
  });
})();
