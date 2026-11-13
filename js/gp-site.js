// v1.0.2 · 工地小工 → 码水泥（推箱子）：把水泥袋推到地上画好的黄黑格子里，只能推不能拉，别推进死角。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { pick, clamp, ease } = U;
  const LEVELS = [
    ['########', '#  ..  #', '#  $$  #', '#   @  #', '########'],
    ['#########', '#  #    #', '# .$ $. #', '#  @ #  #', '#   $.  #', '#########'],
    ['#########', '# . . . #', '#  $$$  #', '#   @   #', '#########'],
    ['#########', '#  ..   #', '# $ $ # #', '#  @$ . #', '#   #   #', '#########'],
    ['########', '#   .  #', '# $$ # #', '#  @.  #', '#   $. #', '########'],
    ['########', '#  #   #', '# $  $ #', '#.@ #. #', '#  $ . #', '########']
  ];
  const PAR = [4, 7, 11, 11, 12, 16];
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function parse(rows) { const H = rows.length, W = Math.max(...rows.map(r => r.length)); const walls = [], goals = [], crates = []; let p = null; for (let y = 0; y < H; y++) { walls[y] = []; goals[y] = []; for (let x = 0; x < W; x++) { const ch = rows[y][x] || ' '; walls[y][x] = ch === '#'; goals[y][x] = ch === '.' || ch === '*' || ch === '+'; if (ch === '$' || ch === '*') crates.push([x, y]); if (ch === '@' || ch === '+') p = [x, y]; } } return { W, H, walls, goals, crates, p }; }
  function solve(L, crates, p, lim) { // BFS，返回方向序列（机器人用）
    const { W, walls, goals } = L, key = (px, py, c) => px + ',' + py + '|' + c.map(a => a[0] + ':' + a[1]).sort().join(','); const q = [{ p, c: crates, path: [] }], seen = new Set([key(p[0], p[1], crates)]); let n = 0;
    while (q.length && n++ < (lim || 300000)) { const cur = q.shift(); if (cur.c.every(a => goals[a[1]][a[0]])) return cur.path;
      for (const d of ['up', 'down', 'left', 'right']) { const [dx, dy] = DIRS[d], nx = cur.p[0] + dx, ny = cur.p[1] + dy; if (walls[ny][nx]) continue; let nc = cur.c; const ci = cur.c.findIndex(a => a[0] === nx && a[1] === ny); if (ci >= 0) { const tx = nx + dx, ty = ny + dy; if (walls[ty][tx] || cur.c.some(a => a[0] === tx && a[1] === ty)) continue; nc = cur.c.map(a => a.slice()); nc[ci] = [tx, ty]; } const k = key(nx, ny, nc); if (seen.has(k)) continue; seen.add(k); q.push({ p: [nx, ny], c: nc, path: cur.path.concat(d) }); } }
    return null;
  }
  const spr = {};
  const sack = (T, on) => { const k = 's' + T + on; return spr[k] || (spr[k] = U.mk(T, T, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, on ? '#c9e4c0' : '#d4d7d9'); gr.addColorStop(1, on ? '#8fbf86' : '#9ea6ab'); g.fillStyle = gr; g.beginPath(); g.moveTo(w * .14, h * .14); g.quadraticCurveTo(w * .5, h * .04, w * .86, h * .14); g.quadraticCurveTo(w * .98, h * .5, w * .88, h * .88); g.quadraticCurveTo(w * .5, h * .98, w * .12, h * .88); g.quadraticCurveTo(w * .02, h * .5, w * .14, h * .14); g.fill(); g.lineWidth = 2; g.strokeStyle = on ? '#3a7a3a' : '#4a5258'; g.stroke(); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; for (let i = 0.28; i < .8; i += .13) { g.beginPath(); g.moveTo(w * .14, h * i); g.lineTo(w * .86, h * i + 1); g.stroke(); } g.fillStyle = on ? '#2a6a2a' : '#c0382a'; g.fillRect(w * .26, h * .38, w * .48, h * .26); g.fillStyle = '#fff'; g.font = `700 ${Math.round(T * .22)}px ${U.FONT}`; g.textAlign = 'center'; g.fillText('水泥', w / 2, h * .575); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(w * .32, h * .24, w * .1, h * .05, -.4, 0, 7); g.fill(); if (on) { g.strokeStyle = '#2a6a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .62, h * .78); g.lineTo(w * .7, h * .86); g.lineTo(w * .84, h * .68); g.stroke(); } })); };
  const floorT = T => spr['f' + T] || (spr['f' + T] = U.mk(T, T, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9aa0a0'); gr.addColorStop(1, '#868c8c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.2; g.strokeRect(.6, .6, w - 1.2, h - 1.2); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(2, 2, w - 4, 3); g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 6; i++) g.fillRect((i * 13 + 5) % (w - 4), (i * 17 + 9) % (h - 4), 2, 2); }));
  const wallT = T => spr['w' + T] || (spr['w' + T] = U.mk(T, T, (g, w, h) => { g.fillStyle = '#7a4a34'; g.fillRect(0, 0, w, h); const rh = h / 4; for (let r = 0; r < 4; r++) { for (let c = -1; c < 3; c++) { const x = c * w / 2 + (r % 2 ? w / 4 : 0); const gr = g.createLinearGradient(0, r * rh, 0, (r + 1) * rh); gr.addColorStop(0, '#c26a4a'); gr.addColorStop(1, '#a24e34'); g.fillStyle = gr; g.fillRect(x + 1, r * rh + 1, w / 2 - 2, rh - 2); } } g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, w, 2); g.strokeStyle = 'rgba(40,16,8,.7)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }));
  const goalT = T => spr['g' + T] || (spr['g' + T] = U.mk(T, T, (g, w, h) => { g.fillStyle = '#6e7474'; g.fillRect(0, 0, w, h); g.save(); g.beginPath(); g.rect(5, 5, w - 10, h - 10); g.clip(); g.fillStyle = '#f2c230'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2a2a'; for (let i = -h; i < w + h; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 6, 0); g.lineTo(i + 6 + h, h); g.lineTo(i + h, h); g.fill(); } g.restore(); g.fillStyle = '#868c8c'; g.fillRect(10, 10, w - 20, h - 20); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.5; g.strokeRect(10, 10, w - 20, h - 20); g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.strokeRect(5, 5, w - 10, h - 10); }));
  GP.reg('site', {
    title: '码水泥 · 推箱子', dur: 90, minutes: 600, hours: 10, tint: 'rgba(24,20,14,.6)',
    help: ['用 ↑↓←→ 或 W A S D 走（手机在场上滑动，或点右下的方向键，点空地会自己走过去）。水泥袋只能推、不能拉。', '把每一袋水泥推到地上黄黑相间的格子里，推到位袋子会变绿。全部推到位算过一关，工头给你加时间。', '袋子推进墙角就再也拉不出来了：按 Z 悔一步（悔得多会扣手艺分），按 R 重来（扣 3 秒）。一共 6 关，越快越好。'],
    make(env) {
      const g = { lv: 0, done: 0, moves: 0, total: 0, effic: [], undos: 0, restarts: 0, anim: [], stuck: false, auto: null, autoT: 0, queue: [], flash: 0, steps: 0, hist: [], fin: false, bag: [], pf: 0, sweat: 0 };
      let L, crates, pl, face = 1, lvT = 0, T = 52, OX = 0, OY = 0;
      const BXW = 590, BYH = 340, BX0 = 30, BY0 = 84;
      function load(i) { L = parse(LEVELS[i % LEVELS.length]); crates = L.crates.map(a => a.slice()); pl = L.p.slice(); g.moves = 0; g.hist = []; g.stuck = false; g.lv = i; lvT = 0; g.queue = []; T = Math.min(60, Math.floor(BXW / L.W), Math.floor(BYH / L.H)); OX = BX0 + (BXW - T * L.W) / 2; OY = BY0 + (BYH - T * L.H) / 2; g.W = L.W; }
      load(0);
      const onGoal = () => crates.filter(a => L.goals[a[1]][a[0]]).length;
      const crateAt = (x, y) => crates.findIndex(a => a[0] === x && a[1] === y);
      const dead = () => crates.some(([x, y]) => { if (L.goals[y][x]) return false; const wl = (a, b) => L.walls[b][a]; return (wl(x - 1, y) || wl(x + 1, y)) && (wl(x, y - 1) || wl(x, y + 1)); });
      function step(d, auto) {
        if (g.fin || g.lock) return false; const [dx, dy] = DIRS[d]; const nx = pl[0] + dx, ny = pl[1] + dy; if (dx) face = dx;
        if (L.walls[ny][nx]) { if (!auto) { S.tone(180, 140, .06, .12); g.bump = .12; } return false; }
        const ci = crateAt(nx, ny); let pushed = false;
        if (ci >= 0) { const tx = nx + dx, ty = ny + dy; if (L.walls[ty][tx] || crateAt(tx, ty) >= 0) { g.bump = .14; S.tone(150, 110, .08, .16); if (!auto) env.float(OX + nx * T + T / 2, OY + ny * T, '推不动', '#ffd0a0', 16); return false; }
          g.hist.push({ p: pl.slice(), c: crates.map(a => a.slice()), m: g.moves }); const was = L.goals[ci >= 0 ? crates[ci][1] : 0][crates[ci][0]]; crates[ci] = [tx, ty]; pushed = true; const on = L.goals[ty][tx]; S.thud(.22); if (on) { S.good(onGoal()); env.burst(OX + tx * T + T / 2, OY + ty * T + T / 2, 10, { colors: ['#a8f08a', '#fff', '#ffe27a'], speed: 130, up: 70, size: 3, life: .5 }); env.float(OX + tx * T + T / 2, OY + ty * T, '到位', '#b6f59a', 20); } else if (was) { S.tap(); } g.pushAnim = { i: ci, fx: -dx, fy: -dy, t: 0 }; if (dead()) { if (!g.stuck) { g.stuck = true; S.bad(); env.shake(5); env.say('有一袋推进死角了：按 Z 悔一步，或 R 重来', '#ffb4a5', 2.2); } } }
        else { g.hist.push({ p: pl.slice(), c: crates.map(a => a.slice()), m: g.moves }); S.tone(260, 300, .03, .05); }
        pl = [nx, ny]; g.moves++; g.total++; g.walkT = 0;
        if (crates.every(a => L.goals[a[1]][a[0]])) levelDone();
        return true;
      }
      function levelDone() { const par = PAR[g.lv % PAR.length], ef = clamp(par / Math.max(par, g.moves), 0, 1); g.effic.push(ef); g.done++; const bonus = 10; env.addTime(bonus, 300, 110); S.win(); env.say(`第 ${g.done} 关过了！${g.moves} 步（最短 ${par}）`, '#ffe9a8', 1.8); env.burst(OX + L.W * T / 2, OY + L.H * T / 2, 30, { colors: ['#ffe27a', '#fff', '#a8f08a'], speed: 260, up: 150, size: 4.5, shape: 'star', life: 1 }); g.lock = true; setTimeout(() => { g.lock = false; if (env.ended) return; if (g.done >= LEVELS.length) { g.fin = true; env.end(g.final()); } else load(g.lv + 1); }, 1100); }
      function undo() { if (g.lock || !g.hist.length) { S.tone(200, 160, .05, .1); return; } const h = g.hist.pop(); pl = h.p; crates = h.c; g.moves = h.m; g.undos++; g.stuck = dead(); S.click(); }
      function restart() { if (g.lock) return; const d = g.moves > 0; load(g.lv); g.restarts++; if (d) { env.penalty('重来一遍，耽误了 3 秒', OX + L.W * T / 2, OY + 20, { shake: 4, quiet: true }); env.addTime(-3, OX + L.W * T / 2, OY + 50); } }
      g.step = step; g.undo = undo; g.restart = restart;
      g.cur = () => ({ L, crates, pl });
      const btns = { up: [736, 330, 56, 50], down: [736, 410, 56, 50], left: [674, 370, 56, 50], right: [798, 370, 56, 50] };
      const act = { undo: [640, 94, 100, 40], restart: [750, 94, 100, 40] };
      const hit = (b, x, y) => x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3];
      let sw = null;
      function walkTo(tx, ty) { // 点空地：自动走过去（不推箱子）
        const q = [[pl[0], pl[1], []]], seen = new Set([pl[0] + ',' + pl[1]]); while (q.length) { const [x, y, p] = q.shift(); if (x === tx && y === ty) { g.queue = p; return true; } for (const d of ['up', 'down', 'left', 'right']) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = nx + ',' + ny; if (seen.has(k) || nx < 0 || ny < 0 || nx >= L.W || ny >= L.H || L.walls[ny][nx] || crateAt(nx, ny) >= 0) continue; seen.add(k); q.push([nx, ny, p.concat(d)]); } } return false;
      }
      g.pointer = (k, x, y) => {
        if (k === 'down') { sw = { x, y }; for (const d in btns) if (hit(btns[d], x, y)) { g.queue = []; step(d); g.rep = { d, t: 0 }; sw = null; return; } if (hit(act.undo, x, y)) { undo(); sw = null; return; } if (hit(act.restart, x, y)) { restart(); sw = null; } }
        else if (k === 'move' && sw) { const dx = x - sw.x, dy = y - sw.y; if (Math.hypot(dx, dy) > 28) { g.queue = []; step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); sw = { x, y }; sw.moved = true; } }
        else if (k === 'up') { g.rep = null; if (sw && !sw.moved) { const cx = Math.floor((x - OX) / T), cy = Math.floor((y - OY) / T); if (cx >= 0 && cy >= 0 && cx < L.W && cy < L.H) { if (cx === pl[0] && cy === pl[1]) { } else walkTo(cx, cy) || (Math.abs(cx - pl[0]) + Math.abs(cy - pl[1]) === 1 && step(cx > pl[0] ? 'right' : cx < pl[0] ? 'left' : cy > pl[1] ? 'down' : 'up')); } } sw = null; }
      };
      const KM = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
      g.key = (k, down) => { if (!down) { return false; } if (KM[k]) { g.queue = []; step(KM[k]); return true; } if (k === 'z' || k === 'Z' || k === 'u') { undo(); return true; } if (k === 'r' || k === 'R') { restart(); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; g.plan = null; };
      g.hud = () => [['关', `${Math.min(g.lv + 1, LEVELS.length)}/${LEVELS.length}`], ['步数', g.moves]];
      g.hint = () => g.total < 3 ? '用方向键推水泥袋到黄黑格里' : null;
      g.update = dt => {
        g.pf += dt; lvT += dt; if (g.bump) g.bump = Math.max(0, g.bump - dt); if (g.pushAnim) { g.pushAnim.t += dt / .12; if (g.pushAnim.t >= 1) g.pushAnim = null; } if (g.walkT != null) g.walkT += dt;
        if (g.rep) { g.rep.t += dt; if (g.rep.t > .3) { g.rep.t -= .09; step(g.rep.d); } }
        g.qT = (g.qT || 0) + dt; if (g.queue.length && g.qT > .09) { g.qT = 0; if (!step(g.queue.shift())) g.queue = []; }
        if (g.auto && !g.lock && !g.fin) { g.autoT += dt; if (g.autoT > (g.auto === 'bad' ? .16 : .06)) { g.autoT = 0; if (g.auto === 'bad') { if (Math.random() < .03) restart(); else step(pick(['up', 'down', 'left', 'right']), true); } else { if (!g.plan || g.plan.lv !== g.lv || g.plan.i >= g.plan.p.length) { const p = solve(L, crates, pl); g.plan = { lv: g.lv, p: p || [], i: 0 }; if (!p) { restart(); return; } } const d = g.plan.p[g.plan.i++]; if (d) step(d, true); } } }
      };
      g.draw = ctx => {
        U.panel(ctx, BX0 - 12, BY0 - 12, BXW + 24, BYH + 24, 16, { top: 'rgba(40,36,30,.86)', bot: 'rgba(24,20,16,.88)' });
        if (!L) return; const K = ease.out(clamp(lvT / .35, 0, 1));
        for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) { const px = OX + x * T, py = OY + y * T; if (L.walls[y][x]) ctx.drawImage(wallT(T), px, py, T, T); else { ctx.drawImage(floorT(T), px, py, T, T); if (L.goals[y][x]) ctx.drawImage(goalT(T), px, py, T, T); } }
        const list = crates.map((a, i) => ({ a, i, y: a[1] })); list.push({ p: true, y: pl[1] + .01 }); list.sort((u, v) => u.y - v.y);
        for (const o of list) {
          if (o.p) { const wk = g.walkT != null && g.walkT < .1 ? g.walkT / .1 : 1; ctx.save(); let sx = OX + pl[0] * T + T / 2, sy = OY + pl[1] * T + T * .92; const sc = T / 62; U.person(ctx, sx, sy, { s: sc * 1.1, face: face, step: g.pf * 9, skin: '#d7a67c', shirt: '#d8742a', pants: '#44506a', hair: '#1c1816', hat: '#f2c230', arm: 6 }); ctx.restore(); }
          else { const [x, y] = o.a; const on = L.goals[y][x]; let ox = 0, oy = 0; if (g.pushAnim && g.pushAnim.i === o.i) { const k = 1 - ease.out(clamp(g.pushAnim.t, 0, 1)); ox = g.pushAnim.fx * T * k; oy = g.pushAnim.fy * T * k; } ctx.save(); U.shadowEllipse(ctx, OX + x * T + T / 2 + ox, OY + y * T + T * .88 + oy, T * .36, T * .1, .3); ctx.drawImage(sack(T, on), OX + x * T + ox, OY + y * T - 2 + oy, T, T); if (g.stuck && !on && ((L.walls[y][x - 1] || L.walls[y][x + 1]) && (L.walls[y - 1][x] || L.walls[y + 1][x]))) { ctx.globalAlpha = .5 + .4 * Math.sin(g.pf * 8); U.txt(ctx, '卡死', OX + x * T + T / 2, OY + y * T + T / 2 + 6, 15, '#ff7a6a', 'center', true, 'rgba(0,0,0,.8)'); } ctx.restore(); }
        }
        if (g.lock) { ctx.fillStyle = 'rgba(255,240,150,.12)'; ctx.fillRect(OX, OY, L.W * T, L.H * T); }
        // 右栏
        U.panel(ctx, 628, 78, 246, 160, 16); U.txt(ctx, `第 ${Math.min(g.lv + 1, LEVELS.length)} 关`, 751, 130, 26, '#ffe9b8', 'center', true); U.txt(ctx, `到位 ${onGoal()} / ${crates.length}`, 751, 168, 20, '#a8f08a', 'center', true); U.txt(ctx, `最短 ${PAR[g.lv % PAR.length]} 步 · 你走了 ${g.moves}`, 751, 198, 14, '#e9dcc0', 'center'); U.txt(ctx, `已过 ${g.done} 关 · 悔棋 ${g.undos} 次`, 751, 220, 13, '#bcae92', 'center');
        [['undo', '悔一步 Z', '#5a7a9a'], ['restart', '重来 R', '#8a5a3a']].forEach(([id, t, c]) => { U.glossy(ctx, act[id][0], act[id][1] + 140, act[id][2], act[id][3], 12, c); U.txt(ctx, t, act[id][0] + act[id][2] / 2, act[id][1] + 140 + 26, 15, '#fff', 'center', true); });
        for (const d in btns) { const b = btns[d]; U.glossy(ctx, b[0], b[1] - 6, b[2], b[3], 12, '#6a5a46'); U.txt(ctx, { up: '▲', down: '▼', left: '◀', right: '▶' }[d], b[0] + b[2] / 2, b[1] - 6 + 33, 22, '#fff', 'center', true); }
      };
      g.final = () => { const frac = (g.done + (g.done < LEVELS.length && L ? onGoal() / Math.max(1, crates.length) * .5 : 0)) / 4; const ef = g.effic.length ? g.effic.reduce((a, b) => a + b, 0) / g.effic.length : 0; const q = clamp(frac, 0, 1) * .86 + ef * .14 - Math.min(.1, g.undos * .01); return { quality: clamp(q, 0, 1), score: g.done, summary: `码好 ${g.done} 关水泥，走了 ${g.total} 步。`, lines: [`过了 ${g.done} / ${LEVELS.length} 关`, g.effic.length ? `平均 ${Math.round(ef * 100)}% 的最短步数效率` : '一关都没码完，工头直摇头', g.undos > 6 ? `悔了 ${g.undos} 步，手艺扣了点` : '悔棋不多，脑子清楚', g.restarts ? `重来了 ${g.restarts} 次` : ''].filter(Boolean), stats: { done: g.done, moves: g.total, undos: g.undos } }; };
      return g;
    }
  });
})();
