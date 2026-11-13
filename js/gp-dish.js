// v1.0.2 · 后厨刷盘子 → 消消乐（三消）：细菌、油点、污渍、霉斑、饭粒当方块，三个连成一线就刷掉；刷干净的盘子会发亮。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const NC = 8, NR = 7, T = 52, BX = 446, BY = 96, KINDS = 5, SOAP = 5;
  const NAMES = ['细菌', '油点', '污渍', '霉斑', '饭粒'];
  const spr = {};
  function sprite(k) {
    if (spr[k]) return spr[k];
    return spr[k] = U.mk(T, T, (g, w, h) => {
      const cx = w / 2, cy = h / 2;
      const gl = (x, y, r) => { const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .1, x, y, r); return gr; };
      if (k === 0) { // 细菌：长着小刺的绿团，有眼睛
        g.fillStyle = '#4c8a2a'; for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; g.beginPath(); g.arc(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17, 4.4, 0, 7); g.fill(); }
        const gr = gl(cx, cy, 18); gr.addColorStop(0, '#c4f27a'); gr.addColorStop(.6, '#7fcb3d'); gr.addColorStop(1, '#4b9a24'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 16.5, 0, 7); g.fill(); g.lineWidth = 2; g.strokeStyle = '#2f6516'; g.stroke();
        g.fillStyle = '#fff'; [[-6, -3], [6, -3]].forEach(([x, y]) => { g.beginPath(); g.arc(cx + x, cy + y, 4.6, 0, 7); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#2f6516'; g.stroke(); g.fillStyle = '#222'; g.beginPath(); g.arc(cx + x + 1, cy + y + 1, 2.1, 0, 7); g.fill(); g.fillStyle = '#fff'; });
        g.strokeStyle = '#2f4a14'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy + 5, 6, .15 * Math.PI, .85 * Math.PI); g.stroke();
      } else if (k === 1) { // 油点：橙黄亮油滴
        g.beginPath(); g.moveTo(cx, cy - 21); g.bezierCurveTo(cx + 6, cy - 10, cx + 19, cy + 2, cx + 14, cy + 12); g.bezierCurveTo(cx + 9, cy + 22, cx - 9, cy + 22, cx - 14, cy + 12); g.bezierCurveTo(cx - 19, cy + 2, cx - 6, cy - 10, cx, cy - 21); const gr = g.createLinearGradient(cx - 14, cy - 20, cx + 14, cy + 22); gr.addColorStop(0, '#ffe685'); gr.addColorStop(.5, '#f5b82a'); gr.addColorStop(1, '#d9801a'); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#9a5a10'; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(cx - 6, cy - 2, 3.4, 7, .4, 0, 7); g.fill(); g.fillStyle = '#6a3a08'; g.beginPath(); g.arc(cx - 4, cy + 8, 1.7, 0, 7); g.arc(cx + 4, cy + 8, 1.7, 0, 7); g.fill(); g.strokeStyle = '#6a3a08'; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, cy + 11, 4, .2 * Math.PI, .8 * Math.PI); g.stroke();
      } else if (k === 2) { // 污渍：棕色泼溅
        g.fillStyle = '#5a3a20'; [[0, 0, 14], [-12, -8, 6], [13, -5, 5.5], [8, 13, 6], [-13, 10, 5], [2, -15, 4.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(cx + x, cy + y, r + 2, 0, 7); g.fill(); });
        const gr = gl(cx, cy, 16); gr.addColorStop(0, '#b98a58'); gr.addColorStop(1, '#6e4624'); g.fillStyle = gr; [[0, 0, 14], [-12, -8, 6], [13, -5, 5.5], [8, 13, 6], [-13, 10, 5], [2, -15, 4.5]].forEach(([x, y, r]) => { g.beginPath(); g.arc(cx + x, cy + y, r, 0, 7); g.fill(); });
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - 5, cy - 5, 4, 2.4, -.5, 0, 7); g.fill(); g.fillStyle = '#2a1608'; g.beginPath(); g.arc(cx - 4, cy + 1, 1.8, 0, 7); g.arc(cx + 5, cy + 1, 1.8, 0, 7); g.fill();
      } else if (k === 3) { // 霉斑：蓝灰绒球 + 孢子
        for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283; g.fillStyle = i % 2 ? '#5b6fa6' : '#7a8fc4'; g.beginPath(); g.arc(cx + Math.cos(a) * 17, cy + Math.sin(a) * 17, 3.6, 0, 7); g.fill(); }
        const gr = gl(cx, cy, 17); gr.addColorStop(0, '#c4d0f2'); gr.addColorStop(.6, '#8a9fd6'); gr.addColorStop(1, '#5667a2'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 15.5, 0, 7); g.fill(); g.lineWidth = 2; g.strokeStyle = '#34417a'; g.stroke();
        g.fillStyle = '#34417a'; [[-5, -4], [4, 3], [-2, 7], [7, -6]].forEach(([x, y]) => { g.beginPath(); g.arc(cx + x, cy + y, 1.8, 0, 7); g.fill(); }); g.strokeStyle = '#26305a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 9, cy - 8); g.lineTo(cx - 3, cy - 5); g.moveTo(cx + 9, cy - 8); g.lineTo(cx + 3, cy - 5); g.stroke();
      } else if (k === 4) { // 饭粒：三粒米
        [[-8, 5, -.5], [7, 6, .4], [0, -8, 1.4]].forEach(([x, y, a]) => { g.save(); g.translate(cx + x, cy + y); g.rotate(a); const gr = g.createLinearGradient(-5, -9, 5, 9); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9ccae'); g.beginPath(); g.ellipse(0, 0, 6.4, 11.5, 0, 0, 7); g.fillStyle = gr; g.fill(); g.lineWidth = 1.8; g.strokeStyle = '#a89870'; g.stroke(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-1, 1, 2, 5); g.restore(); });
      } else { // 泡泡刷：虹彩泡泡
        const gr = g.createRadialGradient(cx - 6, cy - 7, 2, cx, cy, 21); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.35, 'rgba(180,240,255,.55)'); gr.addColorStop(.8, 'rgba(255,190,240,.45)'); gr.addColorStop(1, 'rgba(120,200,255,.85)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill(); g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(cx - 8, cy - 9, 5, 3, -.7, 0, 7); g.fill(); g.strokeStyle = '#2a7cc0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx - 8, cy + 1); g.lineTo(cx + 8, cy + 1); g.moveTo(cx, cy - 7); g.lineTo(cx, cy + 9); g.stroke();
      }
    });
  }
  GP.reg('dish', {
    title: '后厨刷盘子 · 消消乐', dur: 62, minutes: 90, hours: 5, tint: 'rgba(14,20,24,.6)',
    help: ['点一块，再点旁边一块（或直接拖过去），两块互换位置。', '横着或竖着连成三块一样的脏东西（细菌、油点、污渍、霉斑、饭粒），就刷掉了；连四块会冒出泡泡刷，一碰就清一整行一整列。', '换了不成行会扣 2 秒；连消、一次刷四块以上能加时间。盘子刷到锃亮就换下一只，刷得越多工钱越高。'],
    make(env) {
      const g = { grid: [], sel: null, state: 'idle', anim: 0, chain: 0, cleared: 0, plateProg: 0, plates: 0, score: 0, maxChain: 0, bad: 0, idle: 0, hintCell: null, swapA: null, swapB: null, swapBack: false, falling: false, pend: [], auto: null, autoT: 0, drag: null, plateTarget: 22, bursts: 0, soaps: 0, bonus: 0, plateAnim: 0 };
      const plateBlobs = () => Array.from({ length: 16 }, (_, i) => ({ a: rnd(0, 6.28), d: rnd(0, 86), r: rnd(10, 22), c: pick(['#8a5a2a', '#c8a030', '#5a8a30', '#6a7aa8', '#7a4a20']) }));
      g.blobs = plateBlobs();
      const bonusTime = (sec, x, y) => { if (g.bonus >= 14) return; g.bonus += sec; env.addTime(sec, x, y); };
      const mkTile = (k, r) => ({ k, sp: k === SOAP, ox: 0, oy: 0, s: 1, a: 1, v: 0, born: r });
      const rk = () => ri(0, KINDS - 1);
      function fillInit() { for (let r = 0; r < NR; r++) { g.grid[r] = []; for (let c = 0; c < NC; c++) { let k; do { k = rk(); } while ((c >= 2 && g.grid[r][c - 1].k === k && g.grid[r][c - 2].k === k) || (r >= 2 && g.grid[r - 1][c].k === k && g.grid[r - 2][c].k === k)); g.grid[r][c] = mkTile(k); } } if (!findMove()) fillInit(); }
      const at = (r, c) => r >= 0 && r < NR && c >= 0 && c < NC ? g.grid[r][c] : null;
      function runs(grid) { // 找三连及以上
        const set = new Map(); const mark = (r, c, run) => { const key = r * 16 + c; set.set(key, Math.max(set.get(key) || 0, run)); };
        const found = [];
        for (let r = 0; r < NR; r++) { let c = 0; while (c < NC) { const t = grid[r][c]; let e = c; if (t && !t.sp) while (e + 1 < NC && grid[r][e + 1] && !grid[r][e + 1].sp && grid[r][e + 1].k === t.k) e++; if (t && !t.sp && e - c >= 2) { found.push({ cells: Array.from({ length: e - c + 1 }, (_, i) => [r, c + i]), dir: 'h' }); } c = e + 1; } }
        for (let c = 0; c < NC; c++) { let r = 0; while (r < NR) { const t = grid[r][c]; let e = r; if (t && !t.sp) while (e + 1 < NR && grid[e + 1][c] && !grid[e + 1][c].sp && grid[e + 1][c].k === t.k) e++; if (t && !t.sp && e - r >= 2) { found.push({ cells: Array.from({ length: e - r + 1 }, (_, i) => [r + i, c]), dir: 'v' }); } r = e + 1; } }
        return found;
      }
      const swapCells = (a, b) => { const t = g.grid[a[0]][a[1]]; g.grid[a[0]][a[1]] = g.grid[b[0]][b[1]]; g.grid[b[0]][b[1]] = t; };
      function validSwap(a, b) { swapCells(a, b); const ok = runs(g.grid).length > 0 || g.grid[a[0]][a[1]].sp || g.grid[b[0]][b[1]].sp; swapCells(a, b); return ok; }
      function findMove() { for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) { const r2 = r + dr, c2 = c + dc; if (r2 < NR && c2 < NC && g.grid[r][c] && g.grid[r2][c2] && validSwap([r, c], [r2, c2])) return [[r, c], [r2, c2]]; } return null; }
      const cellPos = (r, c, t) => [BX + c * T + (t ? t.ox * T : 0), BY + r * T + (t ? t.oy * T : 0)];
      function trySwap(a, b) {
        if (g.state !== 'idle' || !at(...a) || !at(...b)) return; const adj = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; if (!adj) { g.sel = b; S.tap(); return; }
        g.sel = null; g.idle = 0; g.hintCell = null; const ta = g.grid[a[0]][a[1]], tb = g.grid[b[0]][b[1]]; const ok = validSwap(a, b);
        swapCells(a, b); ta.ox = a[1] - b[1]; ta.oy = a[0] - b[0]; tb.ox = b[1] - a[1]; tb.oy = b[0] - a[0]; g.swapA = a; g.swapB = b; g.state = 'swap'; g.anim = 0; g.swapOk = ok; g.chain = 0; S.tone(380, 560, .08, .13);
      }
      function resolve(swapPos) {
        let rs = runs(g.grid); const kill = new Map(); // key -> {fromSoap}
        const addKill = (r, c) => { if (r >= 0 && r < NR && c >= 0 && c < NC && g.grid[r][c] && !kill.has(r * 16 + c)) kill.set(r * 16 + c, [r, c]); };
        const specials = [];
        rs.forEach(run => { run.cells.forEach(([r, c]) => addKill(r, c)); if (run.cells.length >= 4) { const sp = swapPos && run.cells.find(([r, c]) => swapPos.some(p => p[0] === r && p[1] === c)) || run.cells[Math.floor(run.cells.length / 2)]; specials.push({ r: sp[0], c: sp[1], k: run.cells.length }); } });
        // 泡泡刷：被换动或被卷进消除时，清一行一列
        const boom = []; if (g.swapOk && swapPos) swapPos.forEach(([r, c]) => { const t = g.grid[r][c]; if (t && t.sp) boom.push([r, c]); });
        for (const key of Array.from(kill.keys())) { const [r, c] = kill.get(key); const t = g.grid[r][c]; if (t && t.sp) boom.push([r, c]); }
        const seen = new Set(); while (boom.length) { const [r, c] = boom.pop(); if (seen.has(r * 16 + c)) continue; seen.add(r * 16 + c); addKill(r, c); for (let i = 0; i < NC; i++) { addKill(r, i); const t = g.grid[r][i]; if (t && t.sp && !seen.has(r * 16 + i)) boom.push([r, i]); } for (let i = 0; i < NR; i++) { addKill(i, c); const t = g.grid[i][c]; if (t && t.sp && !seen.has(i * 16 + c)) boom.push([i, c]); } g.bursts++; S.tone(300, 1200, .35, .2); S.noise(0, .3, 2200, .12, 'bandpass'); env.shake(5); env.say('泡泡刷！一整行一整列！', '#a8e8ff', 1.4); }
        if (!kill.size) return false;
        g.chain++; g.maxChain = Math.max(g.maxChain, g.chain); const n = kill.size;
        kill.forEach(([r, c]) => { const t = g.grid[r][c]; const [x, y] = cellPos(r, c); env.burst(x + T / 2, y + T / 2, 7, { colors: t && t.sp ? ['#bfeaff', '#fff', '#ffc8f0'] : ['#bfeaff', '#ffffff', '#9fd8f0'], speed: 150, up: 40, size: 4, life: .6, grav: 160 }); if (t) { t.dying = 1; } });
        g.dying = Array.from(kill.values()); g.newSp = specials.map(s => ({ r: s.r, c: s.c })); g.state = 'clear'; g.anim = 0;
        const mult = 1 + (g.chain - 1) * .5; g.score += Math.round(n * 10 * mult); g.cleared += n; g.plateProg += n; if (specials.length) g.soaps += specials.length;
        S.pop(g.chain + (n > 3 ? 2 : 0)); const [fr, fc] = g.dying[Math.floor(g.dying.length / 2)]; const [fx, fy] = cellPos(fr, fc);
        env.float(fx + T / 2, fy, g.chain > 1 ? `连消 ×${g.chain}  +${Math.round(n * 10 * mult)}` : `+${Math.round(n * 10 * mult)}`, g.chain > 1 ? '#ffe27a' : '#e8fff4', g.chain > 1 ? 26 : 22);
        if (g.chain >= 3) { bonusTime(2, 450, 118); env.say(`${g.chain} 连消！加 2 秒`, '#ffe9a8', 1.3); } else if (n >= 5) { bonusTime(1.5, 450, 118); }
        g.dyingSp = specials; return true;
      }
      function settle() {
        const swapPos = null; if (resolve(swapPos)) return; g.state = 'idle'; g.idle = 0;
        if (g.chain >= 2) env.say(pick(['漂亮！', '刷得真干净！', '一气呵成！']), '#ffe9a8', 1.1);
        g.chain = 0; if (!findMove()) { env.say('没得换了，重新摆一摆', '#bfe8ff', 1.5); S.whoosh(); for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { g.grid[r][c] = mkTile(rk()); g.grid[r][c].oy = -rnd(.5, 2); } fillFix(); g.state = 'fall'; }
      }
      function fillFix() { let tries = 0; while ((runs(g.grid).length || !findMove()) && tries++ < 30) { for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const t = g.grid[r][c]; t.k = rk(); t.sp = false; } } }
      fillInit();
      // 新补进来的方块：从棋盘上方依次掉下来（重写 afterClear 的落位，更清楚）
      const afterClear2 = () => {
        g.dying.forEach(([r, c]) => { g.grid[r][c] = null; }); (g.dyingSp || []).forEach(s => { g.grid[s.r][s.c] = Object.assign(mkTile(SOAP), { s: .1 }); }); if ((g.dyingSp || []).length) S.tone(900, 1500, .2, .12); g.dying = [];
        for (let c = 0; c < NC; c++) { let w = NR - 1; for (let r = NR - 1; r >= 0; r--) { const t = g.grid[r][c]; if (t) { if (r !== w) { g.grid[w][c] = t; g.grid[r][c] = null; t.oy += (r - w); t.v = 0; } w--; } } for (let r = w; r >= 0; r--) { const t = mkTile(rk()); t.oy = -(w - r) - 1 - 0.0; t.v = 0; g.grid[r][c] = t; } }
        g.state = 'fall'; g.anim = 0; g.fallT = 0;
      };
      // ---------- 输入 ----------
      const cellAt = (x, y) => { const c = Math.floor((x - BX) / T), r = Math.floor((y - BY) / T); return r >= 0 && r < NR && c >= 0 && c < NC ? [r, c] : null; };
      g.trySwap = trySwap; g.findMove = findMove;
      g.pointer = (k, x, y) => {
        if (k === 'down') { const p = cellAt(x, y); if (!p) { g.sel = null; return; } if (g.state !== 'idle') return; if (g.sel && g.sel[0] === p[0] && g.sel[1] === p[1]) { g.sel = null; S.tap(); return; } if (g.sel && Math.abs(g.sel[0] - p[0]) + Math.abs(g.sel[1] - p[1]) === 1) { const a = g.sel; trySwap(a, p); return; } g.sel = p; g.drag = { p, x, y }; S.tap(); g.idle = 0; g.hintCell = null; }
        else if (k === 'move' && g.drag && g.state === 'idle') { const dx = x - g.drag.x, dy = y - g.drag.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > T * .55) { const [r, c] = g.drag.p; const b = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c]; g.drag = null; if (at(...b)) trySwap([r, c], b); } }
        else if (k === 'up') g.drag = null;
      };
      g.key = k => { if (k === 'h') { const m = findMove(); if (m) g.hintCell = m; return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['已刷', g.cleared], ['盘子', g.plates]];
      g.hint = () => g.cleared < 4 ? '点一块，再点旁边一块，凑齐三块一样的' : g.state === 'idle' && g.idle > 4 ? '提示：闪着光的两块换一下就能连上（按 H 也行）' : null;
      g.update = dt => {
        g.idle += dt; if (g.state === 'idle' && g.idle > 5 && !g.hintCell) { g.hintCell = findMove(); }
        if (g.plateAnim > 0) g.plateAnim -= dt;
        if (g.plateProg >= g.plateTarget) { g.plateProg -= g.plateTarget; g.plates++; g.plateAnim = 1.2; g.blobs = plateBlobs(); S.chime(); S.win(); env.say(`第 ${g.plates} 只盘子锃亮！`, '#c8f0ff', 1.8); env.burst(190, 290, 36, { colors: ['#fff', '#bfeaff', '#ffe9a8'], speed: 280, up: 80, size: 5, shape: 'star', life: 1 }); bonusTime(3, 190, 150); }
        if (g.state === 'swap') { g.anim += dt; const k = clamp(g.anim / .16, 0, 1), e = 1 - ease.out(k); const ta = g.grid[g.swapA[0]][g.swapA[1]], tb = g.grid[g.swapB[0]][g.swapB[1]]; ta.ox = (ta.ox0 == null ? (ta.ox0 = ta.ox) : ta.ox0) * e; ta.oy = (ta.oy0 == null ? (ta.oy0 = ta.oy) : ta.oy0) * e; tb.ox = (tb.ox0 == null ? (tb.ox0 = tb.ox) : tb.ox0) * e; tb.oy = (tb.oy0 == null ? (tb.oy0 = tb.oy) : tb.oy0) * e;
          if (k >= 1) { ta.ox = ta.oy = tb.ox = tb.oy = 0; ta.ox0 = ta.oy0 = tb.ox0 = tb.oy0 = null;
            if (g.swapOk) { if (!resolve([g.swapA, g.swapB])) { g.state = 'idle'; } } else { // 无效：换回去 + 扣时间
              swapCells(g.swapA, g.swapB); const a = g.grid[g.swapA[0]][g.swapA[1]], b = g.grid[g.swapB[0]][g.swapB[1]]; a.ox = g.swapB[1] - g.swapA[1]; a.oy = g.swapB[0] - g.swapA[0]; b.ox = g.swapA[1] - g.swapB[1]; b.oy = g.swapA[0] - g.swapB[0]; g.state = 'back'; g.anim = 0; g.bad++; env.penalty('没连上，擦了个空 −2 秒', BX + 208, BY - 4, { shake: 3, quiet: false }); env.addTime(-2, 450, 118); } } }
        else if (g.state === 'back') { g.anim += dt; const k = clamp(g.anim / .16, 0, 1), e = 1 - ease.out(k); [g.swapA, g.swapB].forEach(p => { const t = g.grid[p[0]][p[1]]; if (t.ox0 == null) { t.ox0 = t.ox; t.oy0 = t.oy; } t.ox = t.ox0 * e; t.oy = t.oy0 * e; if (k >= 1) { t.ox = t.oy = 0; t.ox0 = t.oy0 = null; } }); if (k >= 1) g.state = 'idle'; }
        else if (g.state === 'clear') { g.anim += dt; g.dying.forEach(([r, c]) => { const t = g.grid[r][c]; if (t) { t.s = 1 - clamp(g.anim / .22, 0, 1); t.a = t.s; } }); if (g.anim >= .22) afterClear2(); }
        else if (g.state === 'fall') { let moving = false; g.fallT += dt; for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const t = g.grid[r][c]; if (!t) continue; if (t.s < 1 && !t.dying) t.s = Math.min(1, t.s + dt * 5); if (t.oy < 0 || t.ox !== 0) { t.v += 34 * dt; t.oy += t.v * dt; if (t.oy >= 0) { t.oy = 0; if (t.v > 4) g.landed = true; } else moving = true; } } if (!moving) { if (g.landed) { S.thump(.1); g.landed = false; } settle(); } }
        if (g.state === 'idle' && g.auto) { g.autoT += dt; if (g.autoT > .45) { g.autoT = 0; if (g.auto === 'bad') { const r = ri(0, NR - 1), c = ri(0, NC - 2); if (!validSwap([r, c], [r, c + 1])) trySwap([r, c], [r, c + 1]); else { const m = findMove(); } } else { const m = findMove(); if (m) trySwap(m[0], m[1]); } } }
      };
      // ---------- 画面 ----------
      g.draw = ctx => {
        // 左：盘子
        const px = 196, py = 292; U.panel(ctx, 36, 66, 320, 420, 20, { top: 'rgba(40,52,60,.9)', bot: 'rgba(22,30,36,.9)' });
        U.txt(ctx, `第 ${Math.min(3, g.plates + 1)} 只盘子`, px, 100, 18, '#d6efff', 'center', true);
        ctx.save(); ctx.translate(px, py + 6); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8; const rg = ctx.createRadialGradient(-30, -34, 20, 0, 0, 132); rg.addColorStop(0, '#ffffff'); rg.addColorStop(.7, '#e7ecef'); rg.addColorStop(1, '#b8c2c8'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 7); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.lineWidth = 2; ctx.strokeStyle = '#9aa7ae'; ctx.stroke(); const ig = ctx.createRadialGradient(-20, -20, 10, 0, 0, 96); ig.addColorStop(0, '#f8fbfc'); ig.addColorStop(1, '#dbe3e7'); ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(0, 0, 96, 0, 7); ctx.fill(); ctx.strokeStyle = '#7da6c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 112, 0, 7); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 104, 0, 7); ctx.stroke();
        for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.fillStyle = '#7da6c8'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 118, Math.sin(a) * 118, 5, 2.4, a, 0, 7); ctx.fill(); }
        const prog = clamp(g.plateProg / g.plateTarget, 0, 1), n = g.blobs.length; g.blobs.forEach((b, i) => { const gone = clamp(prog * n - i, 0, 1); if (gone >= 1) return; ctx.globalAlpha = (1 - gone) * .9; ctx.fillStyle = b.c; ctx.beginPath(); ctx.ellipse(Math.cos(b.a) * b.d, Math.sin(b.a) * b.d, b.r * (1 - gone * .5), b.r * .8 * (1 - gone * .5), b.a, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
        if (g.plateAnim > 0) { const k = g.plateAnim / 1.2; for (let i = 0; i < 5; i++) { const a = i * 1.26 + (1 - k) * 3; const sx = Math.cos(a) * 90 * (1 - k * .3), sy = Math.sin(a) * 90 * (1 - k * .3); ctx.save(); ctx.globalAlpha = k; U.star(ctx, sx, sy, 10 + 8 * k, '#fff'); ctx.restore(); } }
        ctx.restore();
        U.txt(ctx, `刷到锃亮 ${Math.round(prog * 100)}%`, px, 450, 17, '#cfeaff', 'center', true); U.rr(ctx, 76, 458, 240, 12, 6, 'rgba(0,0,0,.45)', 'rgba(255,255,255,.3)', 1.2); if (prog > 0) { const gr = ctx.createLinearGradient(0, 458, 0, 470); gr.addColorStop(0, '#bff1ff'); gr.addColorStop(1, '#4fb8e8'); U.rr(ctx, 77, 459, Math.max(10, 238 * prog), 10, 5, gr); }
        // 右：棋盘
        U.panel(ctx, BX - 16, BY - 16, NC * T + 32, NR * T + 32, 20, { top: 'rgba(36,48,56,.92)', bot: 'rgba(20,28,34,.92)' });
        for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { ctx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.roundRect(BX + c * T + 2, BY + r * T + 2, T - 4, T - 4, 9); ctx.fill(); }
        if (g.sel) { const [x, y] = [BX + g.sel[1] * T, BY + g.sel[0] * T]; ctx.save(); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 14; U.rr(ctx, x + 1, y + 1, T - 2, T - 2, 10, 'rgba(255,226,122,.22)', '#ffe27a', 2.5); ctx.restore(); }
        if (g.hintCell && g.state === 'idle') { const pulse = .5 + .5 * Math.sin(env.frame / 5); g.hintCell.forEach(([r, c]) => U.rr(ctx, BX + c * T + 3, BY + r * T + 3, T - 6, T - 6, 9, `rgba(160,255,200,${.12 + .2 * pulse})`, `rgba(160,255,200,${.5 + .5 * pulse})`, 2.5)); }
        ctx.save(); ctx.beginPath(); ctx.rect(BX - 2, BY - 2, NC * T + 4, NR * T + 4); ctx.clip();
        for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) { const t = g.grid[r][c]; if (!t) continue; const [x, y] = cellPos(r, c, t); const s = t.s == null ? 1 : t.s; ctx.save(); ctx.globalAlpha = clamp(t.a == null ? 1 : t.a, 0, 1); ctx.translate(x + T / 2, y + T / 2); const bob = t.sp ? 1 + Math.sin(env.frame / 8 + c) * .05 : 1; ctx.scale(s * bob, s * bob); ctx.drawImage(sprite(t.k), -T / 2, -T / 2, T, T); ctx.restore(); }
        ctx.restore();
        // 说明条
        const legend = NAMES.map((n, i) => ({ n, i })); legend.forEach((l, i) => { const x = BX - 6 + i * 84; ctx.drawImage(sprite(l.i), x, BY + NR * T + 24, 26, 26); U.txt(ctx, l.n, x + 28, BY + NR * T + 43, 13, '#cfe4ee'); });
      };
      g.final = () => { const q = clamp((g.plates + g.plateProg / g.plateTarget) / 3.2, 0, 1) * .85 + clamp(g.score / 1800, 0, 1) * .15; return { quality: clamp(q, 0, 1), score: g.score, summary: `刷了 ${g.cleared} 块脏东西，${g.plates} 只盘子锃亮。`, lines: [`${g.plates} 只盘子刷到锃亮（共清掉 ${g.cleared} 块）`, `最长 ${g.maxChain} 连消，泡泡刷用了 ${g.bursts} 次`, g.bad ? `换错 ${g.bad} 次，被扣了 ${g.bad * 2} 秒` : '一次没换错，手很稳'], stats: { cleared: g.cleared, plates: g.plates, maxChain: g.maxChain, bad: g.bad } }; };
      return g;
    }
  });
})();
