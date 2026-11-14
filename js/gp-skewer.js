// v1.0.2 · 帮摊子串串摆桌 → 连连看：相同的烧烤配菜，用不超过两个拐弯的线连起来就收到烤架上。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const COLS = 8, ROWS = 6, CW = 58, CH = 54, X0 = 30, Y0 = 70, KINDS = 8;
  function tileBox(r, c) {
    const w = CW - 6, h = CH - 6;
    return { r, c, x: X0 + c * CW + CW / 2 - w / 2, y: Y0 + r * CH + CH / 2 - h / 2, w, h };
  }
  GP.skewerLayout = function () {
    const tiles = [];
    for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) tiles.push(tileBox(r, c));
    const minX = Math.min.apply(null, tiles.map(t => t.x)), minY = Math.min.apply(null, tiles.map(t => t.y));
    const maxX = Math.max.apply(null, tiles.map(t => t.x + t.w)), maxY = Math.max.apply(null, tiles.map(t => t.y + t.h));
    const board = { x: minX - 12, y: minY - 12, w: maxX - minX + 24, h: maxY - minY + 24 };
    const grill = { x: board.x + board.w + 28, y: board.y, w: 248, h: 168 };
    const rack = [];
    for (let i = 0; i < 16; i++) rack.push({ x: grill.x + 18 + (i % 8) * 28, y: grill.y + 40 + Math.floor(i / 8) * 52, w: 24, h: 24 });
    const stats = { x: grill.x + 8, y: grill.y + grill.h + 16, w: grill.w - 16, h: 72 };
    const hint = { x: grill.x, y: stats.y + stats.h + 12, w: grill.w, h: 46 };
    return { tiles, board, grill, rack, stats, hint, outside: { c0: 0, cN: COLS + 1, r0: 0, rN: ROWS + 1 } };
  };
  const NAMES = ['羊肉串', '鸡翅', '韭菜', '茄子', '馒头片', '玉米', '鱿鱼须', '青椒'];
  const spr = {};
  function sprite(k) {
    if (spr[k]) return spr[k];
    return spr[k] = U.mk(46, 46, (g, w, h) => {
      const cx = 23, cy = 23;
      if (k === 0) { g.strokeStyle = '#b08a52'; g.lineWidth = 3; g.beginPath(); g.moveTo(5, 38); g.lineTo(41, 8); g.stroke(); [[11, 33], [19, 26.5], [27, 20], [34, 14]].forEach(([x, y], i) => { const gr = g.createRadialGradient(x - 2, y - 2, 1, x, y, 8); gr.addColorStop(0, '#d98a52'); gr.addColorStop(1, '#7a3a1c'); g.fillStyle = gr; g.beginPath(); g.roundRect(x - 6.5, y - 6, 13, 12, 4); g.fill(); g.strokeStyle = '#4a2008'; g.lineWidth = 1.4; g.stroke(); g.fillStyle = 'rgba(255,230,160,.7)'; g.fillRect(x - 3, y - 2 + (i % 2), 2, 2); g.fillRect(x + 1, y + 1, 2, 2); }); }
      else if (k === 1) { const gr = g.createLinearGradient(8, 8, 38, 38); gr.addColorStop(0, '#f6c35a'); gr.addColorStop(1, '#b8601c'); g.fillStyle = gr; g.beginPath(); g.moveTo(10, 30); g.bezierCurveTo(6, 16, 18, 6, 30, 10); g.bezierCurveTo(40, 14, 40, 28, 32, 34); g.bezierCurveTo(24, 40, 14, 40, 10, 30); g.fill(); g.strokeStyle = '#6a3008'; g.lineWidth = 1.8; g.stroke(); g.fillStyle = '#f2e2c0'; g.beginPath(); g.arc(11, 33, 3.4, 0, 7); g.arc(7, 28, 3, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(22, 15, 7, 2.6, -.4, 0, 7); g.fill(); g.fillStyle = 'rgba(120,50,10,.5)'; [[20, 24], [27, 21], [24, 30]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill(); }); }
      else if (k === 2) { for (let i = -3; i <= 3; i++) { g.strokeStyle = i % 2 ? '#3f9a3a' : '#5ab84a'; g.lineWidth = 4.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + i * 2, 40); g.quadraticCurveTo(cx + i * 4, 22, cx + i * 7, 6); g.stroke(); } g.strokeStyle = '#e8d8a8'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 5, 40); g.lineTo(cx + 5, 40); g.stroke(); g.strokeStyle = '#b08a52'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(8, 28); g.lineTo(38, 28); g.stroke(); }
      else if (k === 3) { g.save(); g.translate(cx, cy); g.rotate(-.7); const gr = g.createLinearGradient(-6, -18, 6, 18); gr.addColorStop(0, '#9a5ac0'); gr.addColorStop(1, '#4a2070'); g.fillStyle = gr; g.beginPath(); g.moveTo(-6, -16); g.bezierCurveTo(-12, -4, -10, 14, -3, 17); g.bezierCurveTo(8, 20, 12, 6, 7, -8); g.bezierCurveTo(6, -14, 0, -18, -6, -16); g.fill(); g.strokeStyle = '#2a0a48'; g.lineWidth = 1.8; g.stroke(); g.fillStyle = '#4a9a3a'; g.beginPath(); g.moveTo(-8, -16); g.lineTo(0, -22); g.lineTo(4, -15); g.lineTo(-2, -12); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-4, 0, 2.6, 8, .1, 0, 7); g.fill(); g.restore(); }
      else if (k === 4) { [[0, 9], [-3, 3]].forEach(([dx, dy], i) => { const gr = g.createRadialGradient(cx + dx - 4, cy + dy - 4, 2, cx + dx, cy + dy, 15); gr.addColorStop(0, '#fff5d8'); gr.addColorStop(.7, '#f0d090'); gr.addColorStop(1, '#c8923c'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx + dx, cy + dy, 15, 11, 0, 0, 7); g.fill(); g.strokeStyle = '#8a5a1c'; g.lineWidth = 1.8; g.stroke(); }); g.strokeStyle = 'rgba(150,90,20,.5)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(cx - 3, cy + 3, 9, 6, 0, .2, 2.8); g.stroke(); }
      else if (k === 5) { g.save(); g.translate(cx, cy); g.rotate(-.55); const gr = g.createLinearGradient(-8, -18, 8, 18); gr.addColorStop(0, '#ffe66a'); gr.addColorStop(1, '#e0a020'); g.fillStyle = gr; g.beginPath(); g.roundRect(-8, -17, 16, 34, 8); g.fill(); g.strokeStyle = '#8a5a08'; g.lineWidth = 1.8; g.stroke(); g.fillStyle = 'rgba(180,110,10,.6)'; for (let r = 0; r < 6; r++) for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(-4 + q * 4, -12 + r * 5.4, 1.5, 0, 7); g.fill(); } g.fillStyle = '#6ab04a'; g.beginPath(); g.moveTo(-8, 8); g.quadraticCurveTo(-14, 18, -4, 20); g.lineTo(2, 14); g.fill(); g.stroke(); g.restore(); }
      else if (k === 6) { const gr = g.createLinearGradient(8, 8, 38, 38); gr.addColorStop(0, '#f6b6b0'); gr.addColorStop(1, '#c8606a'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx, 6); g.bezierCurveTo(cx + 12, 10, cx + 12, 22, cx + 8, 26); for (let i = 3; i >= -3; i--) g.lineTo(cx + i * 4, 40 - Math.abs(i % 2) * 5); g.lineTo(cx - 8, 26); g.bezierCurveTo(cx - 12, 22, cx - 12, 10, cx, 6); g.fill(); g.strokeStyle = '#7a2a34'; g.lineWidth = 1.8; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 4, 16, 2.4, 0, 7); g.arc(cx + 4, 16, 2.4, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.arc(cx - 4, 16.5, 1.2, 0, 7); g.arc(cx + 4, 16.5, 1.2, 0, 7); g.fill(); }
      else { const gr = g.createRadialGradient(cx - 5, cy - 6, 2, cx, cy, 18); gr.addColorStop(0, '#9ae870'); gr.addColorStop(1, '#2f8a2a'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 8, 10); g.bezierCurveTo(cx - 20, 18, cx - 14, 38, cx - 2, 40); g.bezierCurveTo(cx + 10, 40, cx + 16, 24, cx + 8, 10); g.bezierCurveTo(cx + 4, 6, cx - 4, 6, cx - 8, 10); g.fill(); g.strokeStyle = '#1a5a1a'; g.lineWidth = 1.8; g.stroke(); g.fillStyle = '#4a7a2a'; g.fillRect(cx - 2, 3, 4, 8); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(cx - 7, 22, 2.6, 8, .1, 0, 7); g.fill(); }
    });
  }
  const tileBg = U.mk(CW - 6, CH - 6, (g, w, h) => { U.glossy(g, 1, 1, w - 2, h - 2, 9, '#efe3c6', { sb: 5, so: 3 }); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.roundRect(5, 4, w - 10, 7, 4); g.fill(); });
  GP.reg('skewer', {
    title: '串串摆桌 · 连连看', dur: 68, minutes: 70, hours: 4, tint: 'rgba(20,12,8,.6)',
    help: ['点一块配菜，再点另一块一样的。两块之间能用“不超过两个弯”的线连起来（可以绕到外面），就收到烤架上了。', '连错了、拐弯太多，会扣 1 秒；卡住了点“提示”（扣 3 秒），实在没得连会自动重新摆。', '连得快有连击；48 块全收完，摆桌最利索，工钱最高。'],
    make(env) {
      const g = { grid: [], sel: null, pairs: 0, misses: 0, combo: 0, maxCombo: 0, comboT: 0, path: null, pathT: 0, fly: [], rack: [], shuffles: 0, hl: null, hintUses: 0, auto: null, autoT: 0, shakeTiles: [], bonus: 0, over: false, pf: 0 };
      const deal = () => { const kinds = []; for (let k = 0; k < KINDS; k++) for (let i = 0; i < 6; i++) kinds.push(k); for (let i = kinds.length - 1; i > 0; i--) { const j = ri(0, i); [kinds[i], kinds[j]] = [kinds[j], kinds[i]]; } let n = 0; g.grid = Array.from({ length: ROWS + 2 }, (_, r) => Array.from({ length: COLS + 2 }, (_, c) => (r >= 1 && r <= ROWS && c >= 1 && c <= COLS) ? { k: kinds[n++], p: 0, s: 1 } : null)); };
      const empty = (r, c) => r >= 0 && c >= 0 && r < ROWS + 2 && c < COLS + 2 && !g.grid[r][c];
      // 最多两个拐弯的路径
      function findPath(a, b) {
        const [ar, ac] = a, [br, bc] = b; const D = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        const q = []; const best = new Map(); const push = (r, c, d, t, path) => { const key = r + ',' + c + ',' + d; if (best.has(key) && best.get(key) <= t) return; best.set(key, t); q.push({ r, c, d, t, path }); };
        for (let d = 0; d < 4; d++) push(ar, ac, d, 0, [[ar, ac]]);
        while (q.length) { const { r, c, d, t, path } = q.shift(); for (let nd = 0; nd < 4; nd++) { const nt = t + (nd === d ? 0 : 1); if (nt > 2) continue; const nr = r + D[nd][0], nc = c + D[nd][1]; if (nr === br && nc === bc) return path.concat([[nr, nc]]); if (!empty(nr, nc)) continue; const k = nr + ',' + nc + ',' + nd; if (best.has(k) && best.get(k) <= nt) continue; best.set(k, nt); q.push({ r: nr, c: nc, d: nd, t: nt, path: path.concat([[nr, nc]]) }); } }
        return null;
      }
      function anyMove() { const cells = []; for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) if (g.grid[r][c]) cells.push([r, c]); for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++) { const A = g.grid[cells[i][0]][cells[i][1]], B = g.grid[cells[j][0]][cells[j][1]]; if (A.k === B.k && findPath(cells[i], cells[j])) return [cells[i], cells[j]]; } return null; }
      function reshuffle(silent) { const cells = []; for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) if (g.grid[r][c]) cells.push([r, c]); const ks = cells.map(([r, c]) => g.grid[r][c].k); for (let tries = 0; tries < 40; tries++) { for (let i = ks.length - 1; i > 0; i--) { const j = ri(0, i); [ks[i], ks[j]] = [ks[j], ks[i]]; } cells.forEach(([r, c], i) => { g.grid[r][c].k = ks[i]; }); if (anyMove()) break; } g.shuffles++; if (!silent) { env.say('没得连了，重新摆一摆', '#bfe8ff', 1.6); S.whoosh(); cells.forEach(([r, c]) => { g.grid[r][c].s = .2; }); } }
      const remaining = () => { let n = 0; for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) if (g.grid[r][c]) n++; return n; };
      const centerOf = (r, c) => [X0 + c * CW + CW / 2, Y0 + r * CH + CH / 2];
      const wrong = (a, b, why) => { g.misses++; g.combo = 0; g.shakeTiles = [{ a, t: 0 }, { a: b, t: 0 }]; env.penalty(why + ' −1 秒', 330, 250, { shake: 3 }); env.addTime(-1, 450, 118); };
      function pick2(r, c) {
        if (!g.grid[r] || !g.grid[r][c]) { g.sel = null; return; } const A = g.sel; S.click();
        if (!A) { g.sel = [r, c]; return; } if (A[0] === r && A[1] === c) { g.sel = null; return; }
        const ta = g.grid[A[0]][A[1]], tb = g.grid[r][c];
        if (ta.k !== tb.k) { wrong(A, [r, c], '不是一样的'); g.sel = null; return; }
        const path = findPath(A, [r, c]); if (!path) { wrong(A, [r, c], '拐弯太多，连不上'); g.sel = null; return; }
        // 连上
        g.sel = null; g.path = path; g.pathT = 0; g.pairs++; g.combo = g.comboT > 0 ? g.combo + 1 : 1; g.comboT = 2.6; g.maxCombo = Math.max(g.maxCombo, g.combo); g.hl = null;
        S.good(g.combo + 2); S.tone(900 + g.combo * 60, 1500, .12, .1);
        [A, [r, c]].forEach(([rr, cc]) => { const t = g.grid[rr][cc]; const [x, y] = centerOf(rr, cc); g.fly.push({ x, y, k: t.k, t: 0 }); g.grid[rr][cc] = null; env.burst(x, y, 9, { colors: ['#ffe9a8', '#fff', '#f0b24a'], speed: 140, up: 60, size: 3.6, shape: 'star', life: .6 }); });
        const [mx, my] = centerOf(Math.round((A[0] + r) / 2), Math.round((A[1] + c) / 2)); env.float(mx, my - 14, g.combo >= 2 ? `连击 ×${g.combo}` : '+1 串', g.combo >= 2 ? '#ffe27a' : '#bfe8a8', g.combo >= 2 ? 24 : 20);
        if (g.combo === 4 || g.combo === 8) { if (g.bonus < 6) { g.bonus += 2; env.addTime(2, 450, 118); env.say(`${g.combo} 连击！加 2 秒`, '#ffe9a8', 1.3); } }
        if (remaining() === 0) { g.over = true; S.win(); env.say('整桌摆好了！', '#ffe9a8', 2); env.burst(330, 270, 40, { colors: ['#ffe27a', '#fff', '#a8f0a0', '#ffb05a'], speed: 320, up: 180, size: 7, shape: 'rect', life: 1.4 }); setTimeout(() => { if (!env.ended) env.end(g.final()); }, 1100); }
        else if (!anyMove()) setTimeout(() => reshuffle(false), 450);
      }
      const hitCell = (x, y) => { const c = Math.floor((x - X0) / CW), r = Math.floor((y - Y0) / CH); return r >= 1 && r <= ROWS && c >= 1 && c <= COLS ? [r, c] : null; };
      const lay = GP.skewerLayout();
      const hintBtn = lay.hint;
      g.pick2 = pick2; g.anyMove = anyMove; g.findPath = findPath;
      g.pointer = (k, x, y) => { if (k !== 'down' || g.over) return; if (x >= hintBtn.x && x <= hintBtn.x + hintBtn.w && y >= hintBtn.y && y <= hintBtn.y + hintBtn.h) return useHint(); const p = hitCell(x, y); if (p) pick2(p[0], p[1]); else g.sel = null; };
      function useHint() { const m = anyMove(); if (!m) return; g.hl = { cells: m, t: 0 }; g.hintUses++; env.addTime(-3, 450, 118); S.tone(660, 880, .15, .12); env.say('闪着光的两块能连上（−3 秒）', '#bfe8ff', 1.8); }
      g.key = k => { if (k === 'h') { useHint(); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['已收', g.pairs * 2 + '/48'], ['连击', g.combo >= 2 ? '×' + g.combo : '—']];
      g.playBox = { x: X0, y: Y0, w: COLS * CW, h: ROWS * CH + 130 };
      g.hint = () => g.pairs < 2 ? '点一块，再点一样的；线最多拐两个弯' : null;
      g.update = dt => {
        g.pf += dt; g.comboT = Math.max(0, g.comboT - dt); if (g.comboT <= 0) g.combo = 0; if (g.path) { g.pathT += dt; if (g.pathT > .45) g.path = null; }
        g.fly.forEach(f => { f.t += dt / .55; }); g.fly.filter(f => f.t >= 1).forEach(f => { g.rack.push({ k: f.k, t: 0 }); S.thump(.08); S.tone(1500, 2000, .05, .05); env.burst(700 + (g.rack.length % 8) * 22, 150, 4, { colors: ['#ffb04a', '#ff7a3a', '#fff'], speed: 60, up: 80, size: 3, life: .5, grav: 0 }); }); g.fly = g.fly.filter(f => f.t < 1);
        g.rack.forEach(r => r.t += dt); g.shakeTiles.forEach(s => s.t += dt); g.shakeTiles = g.shakeTiles.filter(s => s.t < .35);
        for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) { const t = g.grid[r][c]; if (t && t.s < 1) t.s = Math.min(1, t.s + dt * 4); }
        if (g.hl) { g.hl.t += dt; if (g.hl.t > 3.5) g.hl = null; }
        if (g.auto && !g.over) { g.autoT += dt; if (g.autoT > .5) { g.autoT = 0; if (g.auto === 'bad') { const cs = []; for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) if (g.grid[r][c]) cs.push([r, c]); const a = pick(cs), b = pick(cs); if (a !== b) { pick2(a[0], a[1]); pick2(b[0], b[1]); } } else { const m = anyMove(); if (m) { pick2(m[0][0], m[0][1]); pick2(m[1][0], m[1][1]); } } } }
      };
      g.draw = ctx => {
        const L = GP.skewerLayout();
        U.panel(ctx, L.board.x, L.board.y, L.board.w, L.board.h, 18, { top: 'rgba(66,42,26,.9)', bot: 'rgba(38,24,16,.92)' });
        for (let r = 1; r <= ROWS; r++) for (let c = 1; c <= COLS; c++) { const t = g.grid[r][c]; if (!t) continue; let [x, y] = centerOf(r, c); const sh = g.shakeTiles.find(s => s.a[0] === r && s.a[1] === c); if (sh) x += Math.sin(sh.t * 60) * 4 * (1 - sh.t / .35); const sel = g.sel && g.sel[0] === r && g.sel[1] === c, hn = g.hl && g.hl.cells.some(p => p[0] === r && p[1] === c); const s = t.s * (sel ? 1.08 : 1); ctx.save(); ctx.translate(x, y - (sel ? 3 : 0)); ctx.scale(s, s);
          if (sel || hn) { ctx.shadowColor = hn ? '#8affc8' : '#ffe27a'; ctx.shadowBlur = 16; }
          ctx.drawImage(tileBg, -(CW - 6) / 2, -(CH - 6) / 2, CW - 6, CH - 6); ctx.shadowColor = 'transparent'; ctx.drawImage(sprite(t.k), -21, -21, 42, 42); if (sh) { ctx.fillStyle = 'rgba(255,60,50,.28)'; ctx.beginPath(); ctx.roundRect(-(CW - 6) / 2, -(CH - 6) / 2, CW - 6, CH - 6, 9); ctx.fill(); } if (sel) { ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-(CW - 6) / 2, -(CH - 6) / 2, CW - 6, CH - 6, 9); ctx.stroke(); } ctx.restore(); }
        if (g.path) { const k = g.pathT / .45; ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha = 1 - k * .5; ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 14; ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 5; ctx.beginPath(); g.path.forEach(([r, c], i) => { const [x, y] = centerOf(r, c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); }
        g.fly.forEach(f => { const k = ease.inOut(clamp(f.t, 0, 1)), tx = 700 + (g.rack.length % 8) * 22, ty = 210; const x = f.x + (tx - f.x) * k, y = f.y + (ty - f.y) * k - Math.sin(k * Math.PI) * 60; ctx.save(); ctx.translate(x, y); ctx.scale(1 - k * .35, 1 - k * .35); ctx.rotate(k * 4); ctx.drawImage(sprite(f.k), -21, -21, 42, 42); ctx.restore(); });
        // 右：烤架
        const GRL = L.grill;
        U.panel(ctx, GRL.x, GRL.y, GRL.w, GRL.h + L.stats.h + 28, 18, { top: 'rgba(40,30,26,.92)', bot: 'rgba(22,16,13,.92)' });
        U.txt(ctx, '摊上的烤架', GRL.x + GRL.w / 2, GRL.y + 28, 18, '#ffe9b8', 'center', true);
        ctx.save(); U.glossy(ctx, GRL.x + 12, GRL.y + 40, GRL.w - 24, GRL.h - 52, 10, '#3a3a3e', { sb: 6, so: 3 });
        ctx.beginPath(); ctx.rect(GRL.x + 16, GRL.y + 46, GRL.w - 32, GRL.h - 64); ctx.clip();
        const shown = g.rack.slice(-L.rack.length);
        shown.forEach((item, i) => { const slot = L.rack[i]; const sc = Math.min(1, item.t * 5 + .4); ctx.save(); ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2); ctx.scale(sc * .55, sc * .55); ctx.drawImage(sprite(item.k), -23, -23, 46, 46); ctx.restore(); });
        ctx.restore();
        U.txt(ctx, `已摆 ${g.pairs} 串`, L.stats.x + L.stats.w / 2, L.stats.y + 22, 20, '#ffe27a', 'center', true);
        U.txt(ctx, g.combo >= 2 ? `连击 ×${g.combo}` : g.maxCombo >= 2 ? `最高连击 ×${g.maxCombo}` : '连得快有连击', L.stats.x + L.stats.w / 2, L.stats.y + 46, 15, '#e9dcc0', 'center');
        U.txt(ctx, g.misses ? `连错 ${g.misses} 次` : '一次没连错', L.stats.x + L.stats.w / 2, L.stats.y + 68, 14, g.misses ? '#ff9c8a' : '#bfe8a8', 'center');
        ctx.save(); U.glossy(ctx, hintBtn.x, hintBtn.y, hintBtn.w, hintBtn.h, 14, '#4a7a9a'); U.txt(ctx, '提示（−3 秒）', hintBtn.x + hintBtn.w / 2, hintBtn.y + 30, 18, '#fff', 'center', true); ctx.restore();
        U.txt(ctx, NAMES.join(' · '), 330, 508, 13, 'rgba(255,240,210,.55)', 'center');
      };
      deal(); if (!anyMove()) reshuffle(true);
      g.final = () => { const left = (env.dur - env.t) / env.dur; const q = clamp(g.pairs / 24 * .72 + (g.pairs >= 24 ? .18 + .1 * clamp(left * 1.5, 0, 1) : 0) - g.misses * .012, 0, 1); return { quality: q, score: g.pairs, summary: `收了 ${g.pairs} 对，连错 ${g.misses} 次。`, lines: [`收了 ${g.pairs} 对（共 24 对）${g.pairs >= 24 ? '，整桌摆好' : ''}`, `最高连击 ×${g.maxCombo}`, g.misses ? `连错 ${g.misses} 次，被扣了 ${g.misses} 秒` : '一次没连错'], stats: { pairs: g.pairs, misses: g.misses, maxCombo: g.maxCombo } }; };
      return g;
    }
  });
})();
