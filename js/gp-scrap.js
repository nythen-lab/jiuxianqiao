// v1.0.2 · 捡瓶子废品 → 翻垃圾堆（扫雷）：一堆堆垃圾里翻瓶子，数字是旁边碎玻璃的个数，别扎了手。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const NC = 10, NR = 6, T = 54, BX = 34, BY = 92, MINES = 9;
  const NUMC = ['', '#4a8ae0', '#3a9a4a', '#e0503a', '#7a4ac0', '#c07a2a', '#2aa0a0', '#444', '#888'];
  const pileSpr = {};
  function pile(seed) {
    if (pileSpr[seed]) return pileSpr[seed]; let s = seed * 7919 + 13; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    return pileSpr[seed] = U.mk(T, T, (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#6a5a48'); bg.addColorStop(1, '#4a3c2e'); g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 9); g.fillStyle = bg; g.fill(); g.save(); g.clip();
      const cols = ['#2a2e34', '#3a4a5a', '#5a4a3a', '#7a6a50', '#2e3a30', '#a8a090']; for (let i = 0; i < 9; i++) { const x = 6 + r() * (w - 12), y = 8 + r() * (h - 14), rad = 7 + r() * 8, c = cols[Math.floor(r() * cols.length)]; const gr = g.createRadialGradient(x - 3, y - 3, 1, x, y, rad); gr.addColorStop(0, U.shade(c, .3)); gr.addColorStop(1, c); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rad, rad * .78, r() * 3, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 3; i++) g.fillRect(6 + r() * (w - 16), 6 + r() * (h - 16), 4, 2); g.restore();
      g.beginPath(); g.roundRect(2.4, 2.4, w - 4.8, h - 4.8, 8); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.22)'; g.stroke(); g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 9); g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.6)'; g.stroke();
    });
  }
  const floor = U.mk(T, T, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#b8a888'); gr.addColorStop(1, '#a09070'); g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 9); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = 'rgba(80,60,30,.18)'; for (let i = 0; i < 8; i++) g.fillRect(4 + (i * 17) % 44, 4 + (i * 29) % 44, 2, 2); });
  const bottle = U.mk(30, 30, (g, w, h) => { g.save(); g.translate(15, 15); g.rotate(.5); const gr = g.createLinearGradient(-6, 0, 6, 0); gr.addColorStop(0, 'rgba(180,225,255,.95)'); gr.addColorStop(.5, 'rgba(250,253,255,.98)'); gr.addColorStop(1, 'rgba(140,195,240,.95)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-2.6, -13); g.lineTo(2.6, -13); g.lineTo(2.6, -9); g.bezierCurveTo(7, -5, 6.5, -2, 6.4, 0); g.lineTo(6.4, 10); g.quadraticCurveTo(6.4, 13, 3, 13); g.lineTo(-3, 13); g.quadraticCurveTo(-6.4, 13, -6.4, 10); g.lineTo(-6.4, 0); g.bezierCurveTo(-6.5, -2, -7, -5, -2.6, -9); g.closePath(); g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(30,90,150,.9)'; g.stroke(); g.fillStyle = '#2a7cc0'; g.fillRect(-3, -16, 6, 4); g.fillStyle = '#4a9ae0'; g.fillRect(-6.4, 0, 12.8, 6); g.restore(); });
  const shard = U.mk(40, 40, (g, w, h) => { g.translate(20, 20); [[-8, 6, -.6, 11], [6, 4, .5, 9], [0, -8, 1.5, 12]].forEach(([x, y, a, s]) => { g.save(); g.translate(x, y); g.rotate(a); const gr = g.createLinearGradient(-s, 0, s, 0); gr.addColorStop(0, 'rgba(160,230,200,.95)'); gr.addColorStop(.5, 'rgba(250,255,252,.98)'); gr.addColorStop(1, 'rgba(110,190,170,.95)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-s, 3); g.lineTo(0, -s * .9); g.lineTo(s, 4); g.lineTo(s * .2, s * .3); g.closePath(); g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#2a8a70'; g.stroke(); g.restore(); }); g.fillStyle = 'rgba(220,40,30,.9)'; g.beginPath(); g.arc(9, 8, 3, 0, 7); g.fill(); });
  const flag = U.mk(T, T, (g, w, h) => { g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 4, h - 10); g.lineTo(w / 2 - 4, 10); g.stroke(); g.fillStyle = '#e0402a'; g.beginPath(); g.moveTo(w / 2 - 3, 10); g.lineTo(w / 2 + 18, 18); g.lineTo(w / 2 - 3, 26); g.fill(); g.strokeStyle = '#7a1a10'; g.lineWidth = 1.6; g.stroke(); });
  GP.reg('scrap', {
    title: '翻垃圾堆 · 捡瓶子', dur: 56, minutes: 120, hours: 2, tint: 'rgba(22,16,10,.62)',
    help: ['点一堆垃圾翻开它。翻到的数字，是它周围 8 个格子里藏着的碎玻璃数；翻到瓶子就捡进蛇皮袋。', '数字是 0 的地方会一下翻开一大片。推一推就知道哪里有碎玻璃——别去翻。怀疑有碎玻璃的，点右边“插旗”再点那堆做个记号（右键、长按也行）。', '翻到碎玻璃会扎手：扣 3 秒、少一格血（一共 3 格）。瓶子捡得越多，卖的越多。'],
    make(env) {
      const g = { cells: [], first: true, bottles: 0, hits: 0, lives: 3, revealed: 0, flagMode: false, shake: 0, auto: null, autoT: 0, hold: null, pf: 0, open: [], flags: 0, safe: NC * NR - MINES, done: false, coin: [] };
      for (let r = 0; r < NR; r++) { g.cells[r] = []; for (let c = 0; c < NC; c++) g.cells[r][c] = { mine: false, n: 0, rev: false, flag: false, bottle: false, seed: ri(1, 6), t: 0, boom: false }; }
      const nb = (r, c, f) => { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < NR && cc < NC) f(rr, cc, g.cells[rr][cc]); } };
      function plant(sr, sc) { let n = 0; while (n < MINES) { const r = ri(0, NR - 1), c = ri(0, NC - 1); if (g.cells[r][c].mine || (Math.abs(r - sr) <= 1 && Math.abs(c - sc) <= 1)) continue; g.cells[r][c].mine = true; n++; } for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const cl = g.cells[r][c]; if (!cl.mine) { let k = 0; nb(r, c, (a, b, o) => { if (o.mine) k++; }); cl.n = k; cl.bottle = Math.random() < .42; } } }
      const at = (x, y) => { const c = Math.floor((x - BX) / T), r = Math.floor((y - BY) / T); return r >= 0 && r < NR && c >= 0 && c < NC ? [r, c] : null; };
      function reveal(r, c, user) {
        const q = [[r, c]]; let got = 0; const seen = new Set();
        if (g.first) { g.first = false; plant(r, c); }
        const cl0 = g.cells[r][c]; if (cl0.rev || cl0.flag) return;
        if (cl0.mine) { cl0.rev = true; cl0.boom = true; g.hits++; g.lives--; cl0.t = 0; S.noise(0, .25, 2400, .3, 'highpass'); S.tone(300, 90, .3, .26); env.shake(8); env.addTime(-3, BX + c * T + T / 2, BY + r * T - 6); env.penalty(`扎手了！碎玻璃划破了手（还剩 ${g.lives} 格血）−3 秒`, BX + c * T + T / 2, BY + r * T + 10, { shake: 9 }); env.burst(BX + c * T + T / 2, BY + r * T + T / 2, 14, { colors: ['#c8f0e0', '#fff', '#d83a2a'], speed: 190, up: 80, size: 3.4, life: .6 }); g.combo = 0; if (g.lives <= 0) { env.say('手划得太狠，没法干了', '#ffb4a5', 2.2); g.done = true; setTimeout(() => { if (!env.ended) env.end(g.final()); }, 1100); } return; }
        while (q.length) { const [a, b] = q.shift(), k = a + ',' + b; if (seen.has(k)) continue; seen.add(k); const cl = g.cells[a][b]; if (cl.rev || cl.flag || cl.mine) continue; cl.rev = true; cl.t = 0; g.revealed++; if (cl.bottle) { g.bottles++; got++; g.coin.push({ x: BX + b * T + T / 2, y: BY + a * T + T / 2, t: 0 }); } if (cl.n === 0) nb(a, b, (rr, cc, o) => { if (!o.rev && !o.flag) q.push([rr, cc]); }); }
        S.noise(0, .08 + Math.min(.15, seen.size * .01), 1800, .1, 'bandpass'); if (got) { S.clink(); S.good(g.bottles); env.float(BX + c * T + T / 2, BY + r * T, got > 1 ? `瓶子 +${got}` : '瓶子 +1', '#bfeaff', 22); env.burst(BX + c * T + T / 2, BY + r * T + T / 2, 8, { colors: ['#bfeaff', '#fff'], speed: 120, up: 80, size: 3, life: .5 }); } else S.tap();
        if (seen.size >= 6) env.float(BX + c * T + T / 2, BY + r * T - 14, '一大片！', '#ffe27a', 22);
        if (g.revealed >= g.safe) { g.done = true; S.win(); env.say('整堆翻完了！', '#ffe9a8', 2); env.burst(300, 250, 36, { colors: ['#bfeaff', '#fff', '#ffe27a'], speed: 300, up: 160, size: 5, shape: 'star', life: 1.2 }); setTimeout(() => { if (!env.ended) env.end(g.final()); }, 1100); }
      }
      function toggleFlag(r, c) { const cl = g.cells[r][c]; if (cl.rev) return; cl.flag = !cl.flag; g.flags += cl.flag ? 1 : -1; S.tone(cl.flag ? 700 : 500, cl.flag ? 900 : 400, .06, .12); }
      g.reveal = reveal; g.toggleFlag = toggleFlag;
      const btnFlag = { x: 640, y: 380, w: 220, h: 50 };
      g.pointer = (k, x, y, e) => {
        if (g.done) return; if (k === 'down') { if (x >= btnFlag.x && x <= btnFlag.x + btnFlag.w && y >= btnFlag.y && y <= btnFlag.y + btnFlag.h) { g.flagMode = !g.flagMode; S.click(); return; } const p = at(x, y); if (!p) return; if (e && e.button === 2) { toggleFlag(...p); return; } g.hold = { p, t: 0, long: false }; }
        else if (k === 'up') { const h = g.hold; g.hold = null; if (h && !h.long) { const [r, c] = h.p; if (g.flagMode) toggleFlag(r, c); else reveal(r, c, true); } }
        else if (k === 'move' && g.hold) { const p = at(x, y); if (!p || p[0] !== g.hold.p[0] || p[1] !== g.hold.p[1]) g.hold = null; }
      };
      g.key = k => false;
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['瓶子', g.bottles], ['血', '♥'.repeat(Math.max(0, g.lives)) || '—', g.lives <= 1 ? '#e8705a' : null]];
      g.playBox = { x: 34, y: 92, w: 840, h: 400 };
      g.hint = () => g.revealed < 3 ? '点一堆垃圾翻开；数字是周围碎玻璃的个数' : null;
      g.update = dt => {
        g.pf += dt; g.cells.forEach(row => row.forEach(c => { if (c.rev) c.t += dt; })); g.coin.forEach(c => c.t += dt / .5); g.coin = g.coin.filter(c => c.t < 1);
        if (g.hold) { g.hold.t += dt; if (g.hold.t > .5 && !g.hold.long) { g.hold.long = true; toggleFlag(...g.hold.p); S.click(); } }
        if (g.auto && !g.done) { g.autoT += dt; if (g.autoT > .22) { g.autoT = 0; const list = []; for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const cl = g.cells[r][c]; if (!cl.rev && !cl.flag && (g.auto === 'bad' ? true : g.first || !cl.mine)) list.push([r, c]); } if (list.length) { const p = g.auto === 'bad' && !g.first ? (list.filter(([r, c]) => g.cells[r][c].mine)[0] || pick(list)) : pick(list); reveal(p[0], p[1]); } } }
      };
      g.draw = ctx => {
        U.panel(ctx, BX - 14, BY - 14, NC * T + 28, NR * T + 28, 18, { top: 'rgba(56,44,30,.92)', bot: 'rgba(34,26,18,.94)' });
        for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const cl = g.cells[r][c], x = BX + c * T, y = BY + r * T;
          if (!cl.rev) { ctx.save(); const hv = g.hold && g.hold.p[0] === r && g.hold.p[1] === c; ctx.translate(0, hv ? 1 : 0); ctx.drawImage(pile(cl.seed + (r * 3 + c) % 4), x, y, T, T); if (cl.flag) ctx.drawImage(flag, x, y, T, T); ctx.restore(); }
          else { ctx.drawImage(floor, x, y, T, T); const k = clamp(cl.t / .18, 0, 1); if (cl.boom) { ctx.fillStyle = 'rgba(255,60,50,.3)'; ctx.fillRect(x + 2, y + 2, T - 4, T - 4); ctx.drawImage(shard, x + 7, y + 7, 40, 40); } else { if (cl.bottle) ctx.drawImage(bottle, x + 4, y + 3 + (1 - ease.out(k)) * -10, 30, 30); if (cl.n) U.txt(ctx, String(cl.n), x + (cl.bottle ? 40 : T / 2), y + (cl.bottle ? 42 : T / 2 + 9), cl.bottle ? 22 : 26, NUMC[cl.n], 'center', true, 'rgba(255,255,255,.7)'); } if (k < 1) { ctx.fillStyle = `rgba(255,255,255,${.5 * (1 - k)})`; ctx.fillRect(x + 2, y + 2, T - 4, T - 4); } } }
        g.coin.forEach(c => { const k = ease.inOut(c.t), x = c.x + (740 - c.x) * k, y = c.y + (150 - c.y) * k - Math.sin(k * Math.PI) * 40; ctx.save(); ctx.translate(x, y); ctx.scale(1 - k * .4, 1 - k * .4); ctx.rotate(k * 3); ctx.drawImage(bottle, -15, -15, 30, 30); ctx.restore(); });
        // 右栏：蛇皮袋 + 提示
        U.panel(ctx, 628, 78, 246, 286, 18); U.txt(ctx, '蛇皮袋', 751, 108, 18, '#ffe9b8', 'center', true);
        ctx.save(); ctx.translate(751, 238); const bw = 70 + Math.min(1, g.bottles / 22) * 26, bh = 96 + Math.min(1, g.bottles / 22) * 20; const gr = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); gr.addColorStop(0, '#9a7a50'); gr.addColorStop(.5, '#c8a870'); gr.addColorStop(1, '#8a6a40'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-bw / 2 + 8, -bh / 2); ctx.lineTo(bw / 2 - 8, -bh / 2); ctx.quadraticCurveTo(bw / 2 + 8, 0, bw / 2 - 6, bh / 2); ctx.lineTo(-bw / 2 + 6, bh / 2); ctx.quadraticCurveTo(-bw / 2 - 8, 0, -bw / 2 + 8, -bh / 2); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#4a3418'; ctx.stroke(); ctx.strokeStyle = 'rgba(80,50,20,.4)'; ctx.lineWidth = 1.2; for (let i = -bh / 2; i < bh / 2; i += 8) { ctx.beginPath(); ctx.moveTo(-bw / 2, i); ctx.lineTo(bw / 2, i); ctx.stroke(); } ctx.fillStyle = '#7a5a30'; ctx.fillRect(-bw / 2 + 8, -bh / 2 - 6, bw - 16, 8); for (let i = 0; i < Math.min(g.bottles, 8); i++) ctx.drawImage(bottle, -22 + (i % 4) * 14 - 4, -bh / 2 - 14 + (i % 2) * 6 - Math.floor(i / 4) * 8, 24, 24); ctx.restore();
        U.txt(ctx, `瓶子 ${g.bottles} 个`, 751, 322, 20, '#ffe27a', 'center', true); U.txt(ctx, `翻开 ${g.revealed}/${g.safe} 堆 · 插旗 ${g.flags}`, 751, 348, 13, '#e9dcc0', 'center');
        ctx.save(); U.glossy(ctx, btnFlag.x, btnFlag.y, btnFlag.w, btnFlag.h, 14, g.flagMode ? '#d84a2a' : '#6a5a46'); U.txt(ctx, g.flagMode ? '插旗中：点垃圾堆做记号' : '切换到：插旗', btnFlag.x + btnFlag.w / 2, btnFlag.y + 31, 16, '#fff', 'center', true); ctx.restore();
        U.txt(ctx, '数字 = 周围碎玻璃个数', 640, 462, 13, 'rgba(255,240,210,.6)'); U.txt(ctx, '右键 / 长按 = 插旗', 640, 484, 13, 'rgba(255,240,210,.6)');
      };
      g.final = () => { const q = clamp(g.bottles / 15, 0, 1) * .92 + (g.hits === 0 ? .08 : 0) - g.hits * .05; return { quality: clamp(q, 0, 1), score: g.bottles, summary: `捡了 ${g.bottles} 个瓶子，扎了 ${g.hits} 次手。`, lines: [`捡了 ${g.bottles} 个瓶子（翻开 ${g.revealed} 堆）`, g.hits ? `被碎玻璃扎了 ${g.hits} 次，耽误时间还少拿了点` : '一次没扎手，干净利落', g.revealed >= g.safe ? '一整堆翻干净了，一个没落下' : '时间到了，还有几堆没翻'], stats: { bottles: g.bottles, hits: g.hits } }; };
      return g;
    }
  });
})();
