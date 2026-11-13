// v1.0.2 · 帮人搬东西 → 码货（俄罗斯方块）：把货码成整整一层，整层消掉；码出窟窿、堆太高，货堆会晃、会塌，摔坏的东西要赔。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const COLS = 10, ROWS = 16, C = 27, BX = 252, BY = 66;
  // 七种货：每种是四个单元的组合，用不同的货物画法
  const SH = [
    { n: '长条家具包', k: 0, m: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    { n: '纸箱方垛', k: 1, m: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    { n: '冰箱纸箱', k: 2, m: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    { n: '行李箱', k: 3, m: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    { n: '蓝塑料桶', k: 4, m: [[2, 0], [0, 1], [1, 1], [2, 1]] },
    { n: '麻袋', k: 5, m: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    { n: '绿周转箱', k: 6, m: [[0, 0], [1, 0], [1, 1], [2, 1]] }
  ];
  const sprites = {};
  function crate(k, s) {
    const key = k + '_' + s; if (sprites[key]) return sprites[key];
    return sprites[key] = U.mk(s, s, (g, w, h) => {
      const P = [['#cfa163', '#a67b3f'], ['#a8743f', '#7a4e24'], ['#e7ebee', '#b9c2c9'], ['#c8483d', '#8b2a24'], ['#3f82c4', '#255a92'], ['#c5b183', '#9a8756'], ['#63a65a', '#3e7a3b']][k];
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, U.shade(P[0], .2)); gr.addColorStop(.55, P[0]); gr.addColorStop(1, P[1]);
      g.beginPath(); g.roundRect(1, 1, w - 2, h - 2, k === 4 ? 9 : k === 5 ? 10 : 4); g.fillStyle = gr; g.fill(); g.save(); g.clip();
      if (k === 0) { g.fillStyle = 'rgba(255,240,200,.65)'; g.fillRect(w / 2 - 3, 0, 6, h); g.strokeStyle = 'rgba(90,60,20,.35)'; g.lineWidth = 1; for (let i = 5; i < h; i += 6) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }
      if (k === 1) { g.strokeStyle = 'rgba(50,28,8,.55)'; g.lineWidth = 1.4; for (let i = 6; i < h; i += 7) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } g.fillStyle = 'rgba(40,22,6,.7)'; [[4, 4], [w - 5, 4], [4, h - 5], [w - 5, h - 5]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 1.4, 0, 7); g.fill(); }); }
      if (k === 2) { g.fillStyle = '#4a8fd0'; g.fillRect(4, h / 2 - 3, w - 8, 6); g.fillStyle = '#fff'; g.fillRect(6, h / 2 - 1, 8, 2); g.strokeStyle = 'rgba(0,0,0,.2)'; g.strokeRect(3, 3, w - 6, h - 6); }
      if (k === 3) { g.strokeStyle = '#2b1210'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(w * .3, 0); g.lineTo(w * .3, h); g.moveTo(w * .7, 0); g.lineTo(w * .7, h); g.stroke(); g.fillStyle = '#e9c76a'; g.fillRect(w / 2 - 2, h / 2 - 2, 4, 4); }
      if (k === 4) { g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, h * .26, w * .3, h * .1, 0, 0, 7); g.stroke(); g.strokeStyle = 'rgba(0,0,40,.25)'; g.beginPath(); g.moveTo(3, h * .6); g.lineTo(w - 3, h * .6); g.stroke(); }
      if (k === 5) { g.strokeStyle = 'rgba(80,60,30,.35)'; g.lineWidth = 1; for (let i = -h; i < w; i += 5) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); } g.fillStyle = '#7a6a44'; g.fillRect(3, 3, w - 6, 3); }
      if (k === 6) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(5, h * .35, w - 10, 3); g.fillRect(5, h * .6, w - 10, 3); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(2, 2, w - 4, 2); }
      g.restore();
      g.beginPath(); g.roundRect(2.4, 2.4, w - 4.8, h - 4.8, 3); g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke();
      g.beginPath(); g.roundRect(1, 1, w - 2, h - 2, k === 4 ? 9 : k === 5 ? 10 : 4); g.lineWidth = 1.8; g.strokeStyle = U.shade(P[1], -.55); g.stroke();
    });
  }
  const rotCells = (m, r) => { let c = m.map(p => p.slice()); for (let i = 0; i < r; i++) c = c.map(([x, y]) => [3 - y, x]); return c; };   // 在 4×4 盒里转
  function normal(cells) { const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); return cells.map(([x, y]) => [x - mx, y - my]); }

  GP.reg('move', {
    title: '帮人搬东西 · 码货', dur: 80, minutes: 90, hours: 6,
    tint: 'rgba(22,16,10,.62)',
    help: ['用 ← → 移动、↑ 旋转、↓ 加速、空格直接落下（手机点右边的按钮，或在货堆上左右拖、点一下旋转）。',
      '横着码满一整层，这一层就“码实”消掉，算一层活儿。一次消得多算得更多。',
      '别码出窟窿、别堆得太高——货堆会晃，再不管就会塌，摔坏的东西要赔钱，最后工钱也少。'],
    make(env) {
      const g = { grid: Array.from({ length: ROWS }, () => Array(COLS).fill(null)), piece: null, next: null, bag: [], lines: 0, weighted: 0, combo: 0, level: 0, topples: 0, broken: 0, locked: 0, fall: 0, lockT: 0, lockResets: 0, clearAnim: null, debris: [], wobT: 0, warn: 0, auto: null, holdKey: {}, drag: null, score: 0, lastDrop: 0, btns: [] };
      const draw7 = () => { if (!g.bag.length) { g.bag = SH.map((s, i) => i); for (let i = 6; i > 0; i--) { const j = ri(0, i); [g.bag[i], g.bag[j]] = [g.bag[j], g.bag[i]]; } } return g.bag.pop(); };
      const cellsOf = (p, r, x, y) => rotCells(p.m, r === undefined ? p.r : r).map(([cx, cy]) => [cx + (x === undefined ? p.x : x), cy + (y === undefined ? p.y : y)]);
      const fits = (p, r, x, y) => cellsOf(p, r, x, y).every(([cx, cy]) => cx >= 0 && cx < COLS && cy < ROWS && (cy < 0 || !g.grid[cy][cx]));
      const mkPiece = i => { const s = SH[i]; return { i, k: s.k, m: s.m, n: s.n, r: 0, x: 3, y: -1 }; };
      function spawn() {
        g.piece = g.next || mkPiece(draw7()); g.next = mkPiece(draw7()); g.piece.x = 3; g.piece.y = g.piece.i === 0 ? -1 : -1; g.fall = 0; g.lockT = 0; g.lockResets = 0;
        if (!fits(g.piece)) { g.piece.y = -2; if (!fits(g.piece)) { topple('货架塞满了'); } }
        if (g.auto) planAuto();
      }
      const heightOf = x => { for (let y = 0; y < ROWS; y++) if (g.grid[y][x]) return ROWS - y; return 0; };
      const stats = () => { let holes = 0, maxH = 0; for (let x = 0; x < COLS; x++) { let seen = false; for (let y = 0; y < ROWS; y++) { if (g.grid[y][x]) seen = true; else if (seen) holes++; } maxH = Math.max(maxH, heightOf(x)); } return { holes, maxH }; };
      function move(dx) { const p = g.piece; if (!p || g.clearAnim) return false; if (fits(p, p.r, p.x + dx, p.y)) { p.x += dx; if (g.lockT > 0 && g.lockResets < 8) { g.lockT = 0; g.lockResets++; } S.tap(); return true; } return false; }
      function rotate() { const p = g.piece; if (!p || g.clearAnim) return false; const r = (p.r + 1) % 4; for (const dx of [0, -1, 1, -2, 2]) { if (fits(p, r, p.x + dx, p.y)) { p.r = r; p.x += dx; if (g.lockT > 0 && g.lockResets < 8) { g.lockT = 0; g.lockResets++; } S.tone(420, 640, .06, .12); return true; } for (const dy of [-1]) if (fits(p, r, p.x + dx, p.y + dy)) { p.r = r; p.x += dx; p.y += dy; return true; } } return false; }
      function soft() { const p = g.piece; if (!p || g.clearAnim) return; if (fits(p, p.r, p.x, p.y + 1)) { p.y++; g.fall = 0; env.t += 0; } else g.lockT = Math.max(g.lockT, .3); }
      function hard() { const p = g.piece; if (!p || g.clearAnim) return; let d = 0; while (fits(p, p.r, p.x, p.y + 1)) { p.y++; d++; } S.whoosh(); lock(true); }
      function lock(hardDrop) {
        const p = g.piece; if (!p) return; const cs = cellsOf(p); let above = false; cs.forEach(([x, y]) => { if (y < 0) above = true; else g.grid[y][x] = { k: p.k, t: performance.now() }; });
        g.piece = null; g.locked++; S.thump(.32); env.shake(hardDrop ? 3 : 1.2); cs.forEach(([x, y]) => env.burst(BX + x * C + C / 2, BY + (y + 1) * C, 2, { colors: ['#e8d7b0', '#b7a37a'], speed: 60, size: 3, grav: 120, life: .45 }));
        // 满行
        const full = []; for (let y = 0; y < ROWS; y++) if (g.grid[y].every(Boolean)) full.push(y);
        if (full.length) {
          g.combo++; const add = [0, 1, 2.5, 4, 6][full.length]; g.weighted += add; g.lines += full.length; g.level = Math.floor(g.lines / 2);
          g.clearAnim = { rows: full, t: 0 }; S.good(g.combo + full.length); S.clink(); env.shake(4 + full.length * 2);
          full.forEach(y => { for (let x = 0; x < COLS; x++) env.burst(BX + x * C + C / 2, BY + y * C + C / 2, 2, { colors: ['#ffe9a8', '#fff', '#f0b24a'], speed: 150, up: 90, size: 4, shape: 'star', life: .7 }); });
          const msg = full.length >= 4 ? '一口气码实四层！' : full.length === 3 ? '三层一起码实！' : full.length === 2 ? '两层！' : pick(['码实一层！', '整整齐齐！', '这层稳了！']);
          env.float(BX + COLS * C / 2, BY + full[0] * C, msg + (g.combo >= 2 ? ` ×${g.combo}连` : ''), '#ffe27a', 24); env.say(msg, '#ffe9a8', 1.2);
        } else { g.combo = 0; afterLock(); }
      }
      function collapse() { const rows = g.clearAnim.rows; rows.sort((a, b) => a - b).forEach(y => { g.grid.splice(y, 1); g.grid.unshift(Array(COLS).fill(null)); }); g.clearAnim = null; afterLock(); }
      function afterLock() {
        const s = stats(); g.stat = s; const unstable = s.holes >= 8 || s.maxH >= ROWS - 3;
        if (unstable) { if (!g.warn) { g.warn = 1; g.wobT = 0; S.tone(200, 160, .3, .18); env.say(s.maxH >= ROWS - 3 ? '货堆太高了，在晃！快消掉几层！' : '底下空太多，货堆在晃！', '#ffb89a', 2); } }
        else if (g.warn) { g.warn = 0; env.say('稳住了。', '#bfe8a8', 1); }
        spawn();
      }
      function topple(why) {
        const s = stats(); g.topples++; const rows = Math.min(6, Math.max(3, s.maxH - 6)); let n = 0;
        for (let y = 0; y < ROWS; y++) { if (y > ROWS - 1 - s.maxH + rows - 1) break; for (let x = 0; x < COLS; x++) { const c = g.grid[y][x]; if (c) { n++; g.debris.push({ x: BX + x * C, y: BY + y * C, vx: rnd(-220, 220) - (x < 5 ? 80 : -80) * 0, vy: rnd(-260, -60), r: 0, vr: rnd(-6, 6), k: c.k, a: 1 }); g.grid[y][x] = null; } } }
        // 剩下的往下落
        for (let x = 0; x < COLS; x++) { const col = []; for (let y = ROWS - 1; y >= 0; y--) if (g.grid[y][x]) col.push(g.grid[y][x]); for (let y = 0; y < ROWS; y++) g.grid[y][x] = null; col.forEach((c, i) => g.grid[ROWS - 1 - i][x] = c); }
        const broken = Math.max(1, Math.round(n / 4)); g.broken += broken; g.warn = 0; g.combo = 0;
        S.tone(120, 50, .5, .3); S.noise(0, .45, 500, .3); S.thud(.9); env.shake(14); env.say(`${why ? why + '，' : ''}货堆塌了！摔坏 ${broken} 件`, '#ff9c8a', 2.4); env.float(BX + COLS * C / 2, BY + 80, `摔坏 ${broken} 件，要赔`, '#ff9c8a', 26); env.pen++;
        g.piece = null; g.clearAnim = null; g.pause = .7;
      }
      // ---------- 自动玩（测试用 / 演示用）----------
      function evalBoard(grid, cellsPlaced) {
        const gg = grid.map(r => r.slice()); cellsPlaced.forEach(([x, y]) => { if (y >= 0) gg[y][x] = 1; });
        let lines = 0, holes = 0, agg = 0, bump = 0, prev = null; for (let y = 0; y < ROWS; y++) if (gg[y].every(Boolean)) lines++;
        for (let x = 0; x < COLS; x++) { let h = 0, seen = false; for (let y = 0; y < ROWS; y++) { if (gg[y][x]) { if (!seen) { h = ROWS - y; seen = true; } } else if (seen) holes++; } agg += h; if (prev != null) bump += Math.abs(prev - h); prev = h; }
        return lines * 8 - holes * 7 - agg * .45 - bump * .6;
      }
      function planAuto() {
        const p = g.piece; if (!p) return; let best = null;
        if (g.auto === 'bad') { g.target = { r: ri(0, 3), x: ri(-1, 1) }; return; }
        for (let r = 0; r < 4; r++) for (let x = -3; x < COLS; x++) { if (!fits(p, r, x, p.y)) continue; let y = p.y; while (fits(p, r, x, y + 1)) y++; const sc = evalBoard(g.grid, cellsOf(p, r, x, y)); if (!best || sc > best.sc) best = { sc, r, x }; }
        g.target = best;
      }
      g.setAuto = m => { g.auto = m || null; g.autoT = 0; if (m && g.piece) planAuto(); };
      function runAuto(dt) {
        const p = g.piece; if (!p || !g.target) return; g.autoT = (g.autoT || 0) + dt; if (g.autoT < .09) return; g.autoT = 0;
        if (p.r !== g.target.r) { rotate(); if (p.r !== g.target.r && !fits(p, (p.r + 1) % 4, p.x, p.y)) p.r = g.target.r; return; }
        if (p.x < g.target.x) move(1); else if (p.x > g.target.x) move(-1); else hard();
      }
      // ---------- 输入 ----------
      const act = a => { if (a === 'left') move(-1); else if (a === 'right') move(1); else if (a === 'up') rotate(); else if (a === 'down') soft(); else if (a === 'space') hard(); };
      g.act = act;
      g.key = (k, down) => { if (!down) { g.holdKey[k] = 0; return false; } if (['left', 'right', 'up', 'down', 'space'].includes(k)) { act(k); return true; } return false; };
      const btnDefs = [['left', '◀', 590, 330, 74, 66], ['right', '▶', 760, 330, 74, 66], ['up', '⟳', 675, 330, 74, 66], ['down', '▼', 590, 404, 120, 62], ['space', '⤓ 直接落下', 714, 404, 138, 62]];
      let hold = null;
      g.pointer = (kind, x, y, e) => {
        if (kind === 'down') {
          for (const [a, , bx, by, bw, bh] of btnDefs) if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) { act(a); hold = { a, t: 0, rep: 0 }; g.pressed = a; return; }
          if (x >= BX && x <= BX + COLS * C && y >= BY) g.drag = { x, y, cx: x, t: performance.now(), moved: false };
        } else if (kind === 'move' && g.drag) {
          const d = g.drag, dx = x - d.cx; if (Math.abs(dx) >= C * .8) { const n = Math.trunc(dx / (C * .8)); for (let i = 0; i < Math.abs(n); i++) move(Math.sign(n)); d.cx += n * C * .8; d.moved = true; }
          if (y - d.y > 70 && !d.dropped) { d.dropped = true; hard(); }
        } else if (kind === 'up') { if (g.drag && !g.drag.moved && !g.drag.dropped && performance.now() - g.drag.t < 350) rotate(); g.drag = null; hold = null; g.pressed = null; }
      };
      g.hud = () => [['层', g.lines], ['摔坏', g.broken, g.broken ? '#e8705a' : null]];
      g.hint = () => !g.piece ? null : g.locked < 3 ? '← → 移动，↑ 旋转，空格直接落下；横向码满一层就消掉' : g.warn ? '货堆在晃！消掉几层，或把空档补上' : null;
      g.onStart = () => spawn();
      g.update = dt => {
        if (g.pause > 0) { g.pause -= dt; if (g.pause <= 0) { g.pause = 0; spawn(); } return; }
        g.debris.forEach(d => { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.r += d.vr * dt; d.a -= dt * .5; }); g.debris = g.debris.filter(d => d.y < 600 && d.a > 0);
        if (g.warn) g.wobT += dt;
        if (g.clearAnim) { g.clearAnim.t += dt; if (g.clearAnim.t > .34) collapse(); return; }
        if (g.warn && g.wobT > 4.2 && !g.piece) { topple('放着不管'); return; }
        if (g.warn && g.wobT > 5.5 && g.piece) { topple('放着不管'); return; }
        if (hold) { hold.t += dt; if (hold.t > .22 && hold.a !== 'up' && hold.a !== 'space') { hold.rep += dt; if (hold.rep > .07) { hold.rep = 0; act(hold.a); } } }
        const p = g.piece; if (!p) return;
        if (g.auto) runAuto(dt);
        if (!g.piece) return;
        const interval = Math.max(.1, .75 - g.level * .06); g.fall += dt;
        if (fits(p, p.r, p.x, p.y + 1)) { g.lockT = 0; if (g.fall >= interval) { g.fall = 0; p.y++; } } else { g.lockT += dt; if (g.lockT > .5) lock(false); }
      };
      // ---------- 画面 ----------
      const bed = U.mk(COLS * C + 28, ROWS * C + 30, (c, w, h) => {
        U.glossy(c, 0, 0, w, h, 14, '#5b4128', { shadow: false });
        c.save(); c.beginPath(); c.roundRect(12, 6, COLS * C + 4, ROWS * C + 4, 6); c.clip();
        const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2c241d'); gr.addColorStop(1, '#3a2f25'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.strokeStyle = 'rgba(255,240,210,.045)'; c.lineWidth = 1; for (let x = 0; x <= COLS; x++) { c.beginPath(); c.moveTo(14 + x * C, 6); c.lineTo(14 + x * C, h); c.stroke(); } for (let y = 0; y <= ROWS; y++) { c.beginPath(); c.moveTo(12, 8 + y * C); c.lineTo(w, 8 + y * C); c.stroke(); }
        c.restore();
        c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(7, 18 + i * 78, 2.4, 0, 7); c.arc(w - 7, 18 + i * 78, 2.4, 0, 7); c.fill(); }
      });
      const unit = (ctx, k, x, y, a) => { if (a != null) ctx.globalAlpha = a; ctx.drawImage(crate(k, C), x, y, C, C); ctx.globalAlpha = 1; };
      g.draw = ctx => {
        // 左：货主的“进度牌”
        U.panel(ctx, 20, 66, 206, 214, 16); U.txt(ctx, '货主的要求', 123, 96, 18, '#ffe9b8', 'center', true);
        const tgt = 7, wq = clamp(g.weighted / tgt, 0, 1);
        U.txt(ctx, '码实的层数', 36, 130, 14, '#e9dcc0'); U.rr(ctx, 36, 138, 174, 16, 8, 'rgba(0,0,0,.5)', 'rgba(255,230,180,.35)', 1.5); if (wq > 0) { const gr = ctx.createLinearGradient(0, 138, 0, 154); gr.addColorStop(0, '#c9f09a'); gr.addColorStop(1, '#6bb84a'); U.rr(ctx, 37.5, 139.5, Math.max(12, 171 * wq), 13, 6.5, gr); }
        U.txt(ctx, `${g.lines} 层 · 评分 ${Math.round(wq * 100)}%`, 123, 176, 15, '#fff3d6', 'center', true);
        U.txt(ctx, '货堆稳不稳', 36, 204, 14, '#e9dcc0'); const st = g.stat || { holes: 0, maxH: 0 }; const risk = clamp(Math.max(st.holes / 8, (st.maxH - 6) / (ROWS - 9)), 0, 1);
        U.rr(ctx, 36, 212, 174, 16, 8, 'rgba(0,0,0,.5)', 'rgba(255,230,180,.35)', 1.5); if (risk > 0) { const col = risk > .75 ? '#e85d4a' : risk > .45 ? '#f0b24a' : '#8ad06a'; U.rr(ctx, 37.5, 213.5, Math.max(12, 171 * risk), 13, 6.5, U.shade(col, 0)); }
        U.txt(ctx, g.warn ? '在晃！快处理' : risk > .45 ? '有点悬' : '很稳', 123, 250, 15, g.warn ? '#ff9c8a' : '#cfe8b8', 'center', true);
        U.panel(ctx, 20, 296, 206, 170, 16); U.txt(ctx, '摔坏的货', 123, 326, 16, '#ffe9b8', 'center', true); U.txt(ctx, String(g.broken), 123, 380, 46, g.broken ? '#ff9c8a' : '#bfe8a8', 'center', true);
        U.txt(ctx, g.broken ? '每摔坏一件，工钱就少一点' : '一件没摔，继续保持', 123, 410, 13, '#e9dcc0', 'center'); U.txt(ctx, g.combo >= 2 ? `连消 ×${g.combo}` : `第 ${g.level + 1} 档速度`, 123, 440, 14, '#ffe27a', 'center');
        // 中：车斗
        ctx.save(); if (g.warn) { const a = Math.sin(g.wobT * 11) * .012 * clamp(g.wobT / 1.5 + .4, 0, 2); ctx.translate(BX + COLS * C / 2, BY + ROWS * C); ctx.rotate(a); ctx.translate(-(BX + COLS * C / 2), -(BY + ROWS * C)); }
        ctx.drawImage(bed, BX - 14, BY - 8, COLS * C + 28, ROWS * C + 30);
        // 落点影子
        const p = g.piece; if (p && !g.clearAnim) { let y = p.y; while (fits(p, p.r, p.x, y + 1)) y++; cellsOf(p, p.r, p.x, y).forEach(([x, yy]) => { if (yy >= 0) { ctx.fillStyle = 'rgba(255,240,200,.14)'; ctx.fillRect(BX + x * C + 2, BY + yy * C + 2, C - 4, C - 4); ctx.strokeStyle = 'rgba(255,240,200,.45)'; ctx.setLineDash([4, 3]); ctx.strokeRect(BX + x * C + 2.5, BY + yy * C + 2.5, C - 5, C - 5); ctx.setLineDash([]); } }); }
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const c = g.grid[y][x]; if (!c) continue; const ca = g.clearAnim && g.clearAnim.rows.includes(y); if (ca) { const k = g.clearAnim.t / .34; ctx.save(); ctx.globalAlpha = 1 - k; const sc = 1 + k * .25; ctx.translate(BX + x * C + C / 2, BY + y * C + C / 2); ctx.scale(sc, sc); ctx.drawImage(crate(c.k, C), -C / 2, -C / 2, C, C); ctx.fillStyle = `rgba(255,255,255,${.7 * (1 - Math.abs(k - .35) * 1.5)})`; ctx.fillRect(-C / 2, -C / 2, C, C); ctx.restore(); } else unit(ctx, c.k, BX + x * C, BY + y * C); }
        if (p) cellsOf(p).forEach(([x, y]) => { if (y >= 0) unit(ctx, p.k, BX + x * C, BY + y * C); });
        ctx.restore();
        g.debris.forEach(d => { ctx.save(); ctx.globalAlpha = clamp(d.a, 0, 1); ctx.translate(d.x + C / 2, d.y + C / 2); ctx.rotate(d.r); ctx.drawImage(crate(d.k, C), -C / 2, -C / 2, C, C); ctx.restore(); });
        // 右：下一件 + 按钮
        U.panel(ctx, 560, 66, 316, 238, 16); U.txt(ctx, '下一件', 718, 96, 18, '#ffe9b8', 'center', true);
        if (g.next) { const cs = rotCells(g.next.m, 0), nm = normal(cs), w = Math.max(...nm.map(c => c[0])) + 1, h = Math.max(...nm.map(c => c[1])) + 1; const s = 34; nm.forEach(([x, y]) => ctx.drawImage(crate(g.next.k, s), 718 - w * s / 2 + x * s, 150 - h * s / 2 + y * s, s, s)); U.txt(ctx, g.next.n, 718, 214, 15, '#e9dcc0', 'center'); }
        U.txt(ctx, g.piece ? `手上：${g.piece.n}` : '', 718, 248, 14, '#bfb39a', 'center'); U.txt(ctx, '码满整层 → 消掉', 718, 276, 14, '#a8d89a', 'center');
        btnDefs.forEach(([a, label, bx, by, bw, bh]) => { const on = g.pressed === a; ctx.save(); if (on) ctx.translate(0, 2); U.glossy(ctx, bx, by, bw, bh, 16, on ? '#c98a28' : '#8a6a3c', { so: on ? 1 : 4 }); U.txt(ctx, label, bx + bw / 2, by + bh / 2 + 8, a === 'space' ? 17 : 26, '#fff3d6', 'center', true); ctx.restore(); });
      };
      g.final = () => {
        const wq = clamp(g.weighted / 7, 0, 1), q = clamp(wq * .88 + (g.topples ? 0 : .12) - g.topples * .08 - Math.min(.1, g.broken * .01), 0, 1);
        return { quality: q, score: g.lines, summary: `码实 ${g.lines} 层，塌了 ${g.topples} 次，摔坏 ${g.broken} 件。`, lines: [`码实 ${g.lines} 层（评分 ${Math.round(wq * 100)}%）`, g.topples ? `货堆塌了 ${g.topples} 次，摔坏 ${g.broken} 件，被扣了赔偿` : '货堆没塌，一件没摔：+稳当奖', g.combo >= 2 || g.weighted > g.lines ? '一次消多层，货主夸你会码' : '多试试一次消两层以上'], stats: { lines: g.lines, topples: g.topples, broken: g.broken } };
      };
      return g;
    }
  });
})();
