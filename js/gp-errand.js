// v1.0.2 · 给楼上跑腿送外卖 → 贪吃蛇：骑车穿过街区，取外卖（车后的餐盒越串越长），绕开车子、花坛和过马路的人，趁热送到门口。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const NC = 22, NR = 13, T = 26, BX = 18, BY = 56, DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const START = [1, 6];
  // 开头慢，每成功送出一单才快一点，最快也留得出转弯的空档。
  GP.errandPace = function (delivered, teaching) {
    const slow = 0.48, cap = 0.2;
    if (teaching) return slow;
    return Math.max(cap, Math.round((slow - Math.max(0, delivered) * 0.035) * 1000) / 1000);
  };
  const openRoad = (x, y) => (y >= 4 && y <= 8) || x === 6 || x === 15;
  const TAG = ['#e8604a', '#4aa3e8', '#8acb4a', '#e8b84a', '#b06ae8'];
  const FLOORS = ['2 楼', '3 楼', '4 楼', '5 楼', '6 楼', '7 楼'];
  GP.reg('errand', {
    title: '送外卖 · 骑车跑腿', dur: 55, minutes: 40, hours: 3, tint: 'rgba(14,16,20,.62)',
    help: ['车会自己往前开。← ↑ → ↓、WASD、在街上划一下，或点右下的「转弯」键，都是拐弯，不是加速。', '先在练习里转一次弯，骑到写着「取」的橙色袋子，再送到写着「送」的门口。练习不计时、不扣命。', '会了以后才开始计时。送得越多车越快，但有个最快速度。别撞墙、车子和行人。'],
    make(env) {
      const g = { dir: 1, queue: [], body: [], carry: [], orders: [], pickups: [], doors: [], peds: [], solid: new Set(), blocks: [], lives: 3, delivered: 0, late: 0, spilled: 0, crashes: 0, tips: 0, step: GP.errandPace(0, true), acc: 0, invul: 0, tele: [], pedT: 3.4, auto: null, drag: null, hold: null, lastFresh: 0, pressed: null, bonusTips: 0, teach: 'turn', mercy: 4 };
      const key = (x, y) => x + ',' + y, inb = (x, y) => x >= 0 && y >= 0 && x < NC && y < NR;
      // ---------- 地图 ----------
      function build() {
        g.solid = new Set(); g.blocks = [];
        const tryPlace = (w, h, kind) => { for (let tries = 0; tries < 40; tries++) { const x = ri(1, NC - 1 - w), y = ri(0, NR - h); let ok = true; const cells = []; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { const cx = x + i, cy = y + j; if (openRoad(cx, cy) || g.solid.has(key(cx, cy))) ok = false; cells.push([cx, cy]); } if (!ok) continue; cells.forEach(([a, b]) => g.solid.add(key(a, b))); if (!connected()) { cells.forEach(([a, b]) => g.solid.delete(key(a, b))); continue; } g.blocks.push({ x, y, w, h, kind, c: ri(0, 5), seed: ri(1, 99) }); return true; } return false; };
        const connected = () => { const seen = new Set([key(...START)]); const q = [START]; while (q.length) { const [x, y] = q.pop(); DIR.forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (inb(nx, ny) && !g.solid.has(k) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); } }); } return seen.size >= NC * NR - g.solid.size; };
        ['car', 'car', 'car', 'house', 'house', 'tree', 'tree', 'tree', 'tree', 'bin', 'bin', 'car'].forEach(k => tryPlace(k === 'car' ? 2 : k === 'house' ? 2 : 1, k === 'house' ? 2 : 1, k));
        g.body = [[START[0], START[1]]]; g.dir = 1; g.queue = [];
      }
      const resetBike = () => { g.body = [[START[0], START[1]]]; g.dir = 1; g.queue = []; g.invul = 1.3; };
      const free = (x, y) => inb(x, y) && !g.solid.has(key(x, y)) && !g.body.some(b => b[0] === x && b[1] === y) && !g.pickups.some(p => p.x === x && p.y === y) && !g.doors.some(d => d.x === x && d.y === y) && !g.peds.some(p => p.x === x && p.y === y);
      const randFree = (minDist) => { for (let i = 0; i < 80; i++) { const x = ri(0, NC - 1), y = ri(0, NR - 1); const h = g.body[0]; if (free(x, y) && Math.abs(x - h[0]) + Math.abs(y - h[1]) >= (minDist || 4)) return [x, y]; } return null; };
      function spawnPickup() { const p = randFree(5); if (p) g.pickups.push({ x: p[0], y: p[1], t: 0, tag: ri(0, TAG.length - 1) }); }
      build();
      // ---------- 行人 ----------
      function spawnPed() { const vertical = Math.random() < .55; let p; if (vertical) { const x = ri(3, NC - 2), down = Math.random() < .5; p = { x, y: down ? -1 : NR, dx: 0, dy: down ? 1 : -1 }; } else { const y = ri(1, NR - 2), right = Math.random() < .5; p = { x: right ? -1 : NC, y, dx: right ? 1 : -1, dy: 0 }; } p.t = 0; p.skin = pick(['#e5b78f', '#d9a073', '#f0c7a0']); p.shirt = pick(['#4a78c0', '#c0503a', '#4aa070', '#a06ac0', '#d8a83a']); g.tele.push({ p, t: 0 }); }
      // ---------- 前进 ----------
      function crash(why, x, y) {
        if (g.invul > 0) return;
        if (g.teach && g.mercy > 0) { g.mercy--; env.say('先拐弯。车只会往前开，方向键和右下角的键都是转弯。', '#ffe9a8', 1.8); resetBike(); return; }
        g.crashes++; g.lives--; const lost = g.carry.length; g.spilled += lost; g.carry = []; g.orders = g.orders.filter(o => !o.carried);
        g.doors = []; env.penalty(`${why}！汤洒了${lost ? '，' + lost + ' 单作废' : ''}（还剩 ${g.lives} 条命）`, BX + x * T + T / 2, BY + y * T, { shake: 9 }); S.thump(.8); S.noise(0, .3, 700, .22);
        env.burst(BX + x * T + T / 2, BY + y * T + T / 2, 22, { colors: ['#e8a24a', '#f4e2b0', '#c8503a'], speed: 220, up: 60, size: 5, life: .8 });
        if (g.lives <= 0) { env.say('被店家叫回去了……', '#ffb4a5', 2.4); g.dead = true; g.endWait = .9; return; }
        resetBike(); spawnPickupIfNeeded();
      }
      const spawnPickupIfNeeded = () => { for (let tries = 0; tries < 4 && g.pickups.length + g.carry.length < 2; tries++) spawnPickup(); };
      function tick() {
        if (g.queue.length) { const d = g.queue.shift(); if ((d + 2) % 4 !== g.dir || g.body.length === 1) g.dir = d; if (g.teach === 'turn' && g.dir !== 1) { g.teach = 'pickup'; g.pickups = [{ x: Math.min(NC - 3, g.body[0][0] + 4), y: g.body[0][1], t: 0, tag: 0 }]; } }
        const h = g.body[0], nx = h[0] + DIR[g.dir][0], ny = h[1] + DIR[g.dir][1];
        if (!inb(nx, ny)) return crash('撞到路边了', clamp(h[0], 0, NC - 1), clamp(h[1], 0, NR - 1));
        if (g.solid.has(key(nx, ny))) return crash('撞上了障碍', nx, ny);
        if (g.body.slice(0, -1).some(b => b[0] === nx && b[1] === ny)) return crash('撞到自己的餐盒', nx, ny);
        if (g.peds.some(p => p.x === nx && p.y === ny)) return crash('撞到行人', nx, ny);
        g.body.unshift([nx, ny]); let grow = false;
        const pi = g.pickups.findIndex(p => p.x === nx && p.y === ny);
        if (pi >= 0 && g.carry.length < 4) { const p = g.pickups.splice(pi, 1)[0]; const o = { tag: p.tag, fresh: 1, floor: pick(FLOORS), carried: true, id: ++g.oid || (g.oid = 1) }; g.carry.push(o); g.orders.push(o); let door = g.teach === 'pickup' ? [Math.min(NC - 2, nx + 5), ny] : randFree(6); if (door && !free(door[0], door[1])) door = randFree(4); if (door) g.doors.push({ x: door[0], y: door[1], order: o, t: 0 }); if (g.teach === 'pickup') g.teach = 'deliver'; grow = true; S.good(g.carry.length); S.noise(0, .06, 2400, .08, 'bandpass'); env.float(BX + nx * T + T / 2, BY + ny * T, `取单 → ${o.floor}`, '#ffd27a', 20); env.burst(BX + nx * T + T / 2, BY + ny * T + T / 2, 8, { colors: ['#ffd27a', '#fff'], speed: 100, size: 3, life: .5 }); if (!g.teach) spawnPickupIfNeeded(); }
        const di = g.doors.findIndex(d => d.x === nx && d.y === ny);
        if (di >= 0) { const d = g.doors.splice(di, 1)[0], o = d.order; const idx = g.carry.indexOf(o); if (idx >= 0) g.carry.splice(idx, 1); o.carried = false; g.delivered++;
          const hot = o.fresh > .66, warm = o.fresh > .33; const tip = hot ? 3 : warm ? 2 : 1; g.tips += tip; if (!hot) g.late++; if (g.teach === 'deliver') { g.teach = null; env.say('会了。现在开始计时，送得越多车才越快。', '#ffe9a8', 1.8); } g.step = GP.errandPace(g.delivered, !!g.teach);
          S.coin(); S.good(4 + g.delivered); env.float(BX + nx * T + T / 2, BY + ny * T, hot ? '热乎！+小费' : warm ? '送到了' : '有点凉了', hot ? '#ffe27a' : warm ? '#bfe8a8' : '#ffb89a', 24); env.burst(BX + nx * T + T / 2, BY + ny * T + T / 2, 14, { colors: ['#ffe27a', '#fff', '#a8f0a0'], speed: 160, up: 80, size: 4, shape: 'star', life: .8 }); env.say(`${o.floor} 送到！${hot ? '热乎着呢' : ''}（${g.delivered} 单）`, '#ffe9a8', 1.3); spawnPickupIfNeeded(); }
        if (!grow && g.body.length > g.carry.length + 1) g.body.pop();
        while (g.body.length > g.carry.length + 1) g.body.pop();
      }
      // ---------- 自动玩 ----------
      function bfs(from, goals, avoidPed) {
        const q = [[from[0], from[1], -1]], seen = new Set([key(from[0], from[1])]); const first = new Map();
        while (q.length) { const [x, y, f] = q.shift(); for (let d = 0; d < 4; d++) { const nx = x + DIR[d][0], ny = y + DIR[d][1], k = key(nx, ny); if (!inb(nx, ny) || seen.has(k) || g.solid.has(k) || (f < 0 && g.body.length > 1 && (d + 2) % 4 === g.dir)) continue; if (g.body.slice(0, -1).some(b => b[0] === nx && b[1] === ny)) continue; if (avoidPed && g.peds.some(p => [0, 1, 2].some(k => Math.abs(p.x + p.dx * k - nx) + Math.abs(p.y + p.dy * k - ny) <= (k ? 0 : 1)))) continue; const ff = f < 0 ? d : f; if (goals.some(gl => gl[0] === nx && gl[1] === ny)) return ff; seen.add(k); q.push([nx, ny, ff]); } }
        return null;
      }
      g.slowBot = true; g.setAuto = m => { g.auto = m || null; };
      function autoSteer() {
        const h = g.body[0];
        if (g.auto === 'bad') { if (Math.random() < .5) g.queue = [ri(0, 3)]; return; }
        let goals = g.carry.length ? g.doors.filter(d => d.order.carried).map(d => [d.x, d.y]) : g.pickups.map(p => [p.x, p.y]);
        if (!goals.length) goals = g.pickups.map(p => [p.x, p.y]);
        let d = bfs(h, goals, true); if (d == null) d = bfs(h, goals, false); if (d == null || (d + 2) % 4 === g.dir) { const free = [0, 1, 2, 3].filter(k => (k + 2) % 4 !== g.dir || g.body.length === 1).filter(k => { const nx = h[0] + DIR[k][0], ny = h[1] + DIR[k][1]; return inb(nx, ny) && !g.solid.has(key(nx, ny)) && !g.body.slice(0, -1).some(b => b[0] === nx && b[1] === ny) && !g.peds.some(p => p.x === nx && p.y === ny); }); if (free.length) { g.queue = [free.includes(g.dir) ? g.dir : free[0]]; } return; }
        g.queue = [d];
      }
      // ---------- 输入 ----------
      const turn = d => { if (g.queue.length < 2 && g.queue[g.queue.length - 1] !== d) g.queue.push(d); };
      g.turn = turn;
      g.key = (k) => { const m = { up: 0, right: 1, down: 2, left: 3 }[k]; if (m != null) { turn(m); return true; } return false; };
      const pads = [[0, '上', 748, 292, 64, 50], [3, '左', 680, 346, 64, 50], [2, '下', 748, 346, 64, 50], [1, '右', 816, 346, 64, 50]];
      g.pads = pads;
      g.pointer = (k, x, y) => {
        if (k === 'down') { for (const [d, , bx, by, bw, bh] of pads) if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) { turn(d); g.pressed = d; S.tap(); return; } g.drag = { x, y }; }
        else if (k === 'move' && g.drag) { const dx = x - g.drag.x, dy = y - g.drag.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > 26) { turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0)); g.drag = { x, y }; } }
        else if (k === 'up') { g.drag = null; g.pressed = null; }
      };
      g.hud = () => [['送到', g.delivered], ['命', '♥'.repeat(Math.max(0, g.lives)) || '—', g.lives <= 1 ? '#e8705a' : null]];
      g.playBox = { x: BX, y: BY, w: NC * T, h: NR * T + 36 };
      g.hintExternal = true;
      g.hint = () => g.teach === 'turn' ? '车一直往前。按方向键或点「转弯」，是拐弯，不是加速。' : g.teach === 'pickup' ? '骑到写着「取」的橙色袋子上。' : g.teach === 'deliver' ? '把餐盒送到写着「送」的门口。练习不计时。' : null;
      const updateSmall = dt => {
        if (g.dead) { g.endWait -= dt; if (g.endWait <= 0 && !env.ended) env.end(g.final()); return; }
        g.invul = Math.max(0, g.invul - dt); g.acc += dt;
        g.orders.forEach(o => { if (o.carried) { o.fresh -= dt / 26; if (o.fresh <= 0) { o.fresh = 0; o.carried = false; const i = g.carry.indexOf(o); if (i >= 0) g.carry.splice(i, 1); g.doors = g.doors.filter(d => d.order !== o); g.spilled++; env.penalty(`${o.floor} 的客人等不及，退单了`, 450, 200, { shake: 3 }); while (g.body.length > g.carry.length + 1) g.body.pop(); spawnPickupIfNeeded(); } } });
        g.orders = g.orders.filter(o => o.carried);
        if (!g.teach) { g.pedT -= dt; if (g.pedT <= 0) { spawnPed(); g.pedT = rnd(3.2, 4.6) - Math.min(.8, g.delivered * .08); } }
        g.tele.forEach(t => { t.t += dt; if (t.t > .9) { g.peds.push(t.p); S.tone(700, 640, .05, .06); t.done = 1; } }); g.tele = g.tele.filter(t => !t.done);
        g.peds.forEach(p => { p.t += dt; if (p.t >= .42) { p.t = 0; p.x += p.dx; p.y += p.dy; p.stepA = (p.stepA || 0) + 1; const h = g.body[0]; if (h && p.x === h[0] && p.y === h[1]) crash('行人撞上来了', p.x, p.y); } }); g.peds = g.peds.filter(p => p.x >= -1 && p.x <= NC && p.y >= -1 && p.y <= NR);
        g.doors.forEach(d => d.t += dt); g.pickups.forEach(p => p.t += dt);
        while (g.acc >= g.step) { g.acc -= g.step; if (g.auto) autoSteer(); tick(); if (g.dead) return; }
      };
      // Fixed physics steps: crossing pedestrians and bike collisions do not depend on display FPS.
      g.update = dt => { if (g.teach) env.addTime(dt); g.step = GP.errandPace(g.delivered, !!g.teach); g.simAcc = (g.simAcc || 0) + dt; while (g.simAcc >= 1 / 120 && !env.ended) { g.simAcc -= 1 / 120; updateSmall(1 / 120); } };
      // ---------- 画面 ----------
      const bg = U.mk(NC * T, NR * T, (c, w, h) => {
        const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4a4c52'); gr.addColorStop(1, '#3a3c42'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 600; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${.03 + Math.random() * .05})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        c.strokeStyle = 'rgba(255,255,255,.04)'; for (let x = 0; x <= NC; x++) { c.beginPath(); c.moveTo(x * T, 0); c.lineTo(x * T, h); c.stroke(); } for (let y = 0; y <= NR; y++) { c.beginPath(); c.moveTo(0, y * T); c.lineTo(w, y * T); c.stroke(); }
        c.strokeStyle = 'rgba(240,210,110,.35)'; c.lineWidth = 3; c.setLineDash([14, 12]); [3, 8].forEach(r => { c.beginPath(); c.moveTo(0, r * T); c.lineTo(w, r * T); c.stroke(); }); c.setLineDash([]);
      });
      const drawBlock = (ctx, b) => {
        const x = BX + b.x * T, y = BY + b.y * T, w = b.w * T, h = b.h * T;
        if (b.kind === 'car') { const col = ['#c8483d', '#3f82c4', '#e8e8e8', '#e0b030', '#4a9a5a', '#444'][b.c]; U.glossy(ctx, x + 3, y + 5, w - 6, h - 10, 10, col, { sb: 6, so: 3 }); ctx.fillStyle = 'rgba(160,210,240,.85)'; ctx.beginPath(); ctx.roundRect(x + w * .3, y + 8, w * .38, h - 16, 4); ctx.fill(); ctx.fillStyle = '#fff6c8'; ctx.fillRect(x + w - 8, y + 9, 4, 5); ctx.fillRect(x + w - 8, y + h - 14, 4, 5); }
        else if (b.kind === 'house') { U.glossy(ctx, x + 2, y + 2, w - 4, h - 4, 8, ['#b8704a', '#8a6a9a', '#5a8aa0', '#a08a50', '#9a5a50', '#6a8a5a'][b.c], { sb: 8, so: 4 }); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 6, y + h / 2 - 2, w - 12, 4); ctx.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 3; i++) ctx.fillRect(x + 10 + i * 18, y + 9, 10, 8); U.txt(ctx, '住户', x + w / 2, y + h - 10, 11, 'rgba(255,255,255,.7)', 'center'); }
        else if (b.kind === 'tree') { U.shadowEllipse(ctx, x + T / 2, y + T - 6, 12, 5, .3); const gr = ctx.createRadialGradient(x + T / 2 - 4, y + T / 2 - 6, 2, x + T / 2, y + T / 2, 16); gr.addColorStop(0, '#8ad060'); gr.addColorStop(1, '#3a7a2a'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + T / 2, y + T / 2 - 1, 14, 0, 7); ctx.fill(); ctx.strokeStyle = '#285a1a'; ctx.lineWidth = 1.6; ctx.stroke(); }
        else { U.glossy(ctx, x + 8, y + 6, T - 16, T - 10, 5, '#5a7a9a', { sb: 4, so: 2 }); ctx.fillStyle = '#2a3a4a'; ctx.fillRect(x + 8, y + 10, T - 16, 4); }
      };
      const drawBox = (ctx, x, y, tag, s, fresh) => { ctx.save(); ctx.translate(x, y); U.glossy(ctx, -s / 2, -s / 2, s, s, 6, tag, { sb: 4, so: 2, lw: 1.6 }); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-s / 2 + 3, -2, s - 6, 4); if (fresh != null) { ctx.fillStyle = fresh > .66 ? 'rgba(255,200,120,.0)' : 'rgba(150,200,255,' + (.5 * (1 - fresh)) + ')'; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, 6); ctx.fill(); } ctx.restore(); };
      g.draw = ctx => {
        ctx.save(); ctx.beginPath(); ctx.roundRect(BX - 6, BY - 6, NC * T + 12, NR * T + 12, 14); ctx.fillStyle = '#26211c'; ctx.fill(); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.roundRect(BX, BY, NC * T, NR * T, 8); ctx.clip(); ctx.drawImage(bg, BX, BY, NC * T, NR * T);
        // 门口
        g.doors.forEach(d => { const x = BX + d.x * T, y = BY + d.y * T, p = .5 + .5 * Math.sin(d.t * 5); ctx.save(); ctx.shadowColor = '#7dffa0'; ctx.shadowBlur = 14 + p * 8; U.glossy(ctx, x + 2, y + 2, T - 4, T - 4, 8, '#2f6a3a', { shadow: false, lw: 1.5 }); ctx.restore(); U.txt(ctx, '送', x + T / 2, y + T / 2 + 6, 16, '#fff', 'center', true, 'rgba(0,40,10,.9)'); });
        g.pickups.forEach(p => { const x = BX + p.x * T + T / 2, y = BY + p.y * T + T / 2 + Math.sin(p.t * 4) * 2; ctx.save(); ctx.shadowColor = '#ffb04a'; ctx.shadowBlur = 16; ctx.translate(x, y); U.glossy(ctx, -13, -12, 26, 24, 6, '#e8923a', { shadow: false }); ctx.restore(); U.txt(ctx, '取', x, y + 5, 16, '#fff', 'center', true, 'rgba(90,40,0,.9)'); });
        g.blocks.forEach(b => drawBlock(ctx, b));
        // 行人预警
        g.tele.forEach(t => { const p = t.p, px = Math.min(NC - 1, Math.max(0, p.x + (p.dx === 0 ? 0 : -p.dx * 0 + (p.dx > 0 ? 1 : -1)))), py = Math.min(NR - 1, Math.max(0, p.y + (p.dy === 0 ? 0 : (p.dy > 0 ? 1 : -1)))); const bl = Math.floor(t.t * 10) % 2; if (bl) { ctx.fillStyle = 'rgba(255,90,70,.4)'; ctx.fillRect(BX + (p.dx ? (p.dx > 0 ? 0 : NC - 1) : p.x) * T, BY + (p.dy ? (p.dy > 0 ? 0 : NR - 1) : p.y) * T, T, T); U.txt(ctx, '!', BX + (p.dx ? (p.dx > 0 ? 0 : NC - 1) : p.x) * T + T / 2, BY + (p.dy ? (p.dy > 0 ? 0 : NR - 1) : p.y) * T + T / 2 + 8, 22, '#fff', 'center', true); } });
        g.peds.forEach(p => { const k = p.t / .42, x = BX + (p.x + p.dx * k) * T + T / 2, y = BY + (p.y + p.dy * k) * T + T / 2; U.shadowEllipse(ctx, x + 2, y + 4, 11, 8, .3); ctx.fillStyle = p.shirt; ctx.beginPath(); ctx.ellipse(x, y, 11, 8, p.dx ? 0 : Math.PI / 2, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.stroke(); });
        // 车队：车后的餐盒
        const blink = g.invul > 0 && Math.floor(env.frame / 4) % 2;
        if (!blink) { for (let i = g.body.length - 1; i >= 1; i--) { const b = g.body[i], o = g.carry[i - 1]; drawBox(ctx, BX + b[0] * T + T / 2, BY + b[1] * T + T / 2, o ? TAG[o.tag] : '#c8a060', T - 8, o ? o.fresh : null); }
          const h = g.body[0], hx = BX + h[0] * T + T / 2, hy = BY + h[1] * T + T / 2; ctx.save(); ctx.translate(hx, hy); ctx.rotate([-Math.PI / 2, 0, Math.PI / 2, Math.PI][g.dir]); U.shadowEllipse(ctx, 2, 4, 15, 8, .3); U.glossy(ctx, -14, -8, 28, 16, 7, '#e85a3a', { sb: 5, so: 2 }); U.glossy(ctx, -17, -5, 8, 10, 3, '#2a2a2e', { shadow: false, lw: 1.2 }); ctx.fillStyle = '#ffeaa0'; ctx.fillRect(12, -5, 4, 3); ctx.fillRect(12, 2, 4, 3); ctx.fillStyle = '#2a64b8'; ctx.beginPath(); ctx.arc(-1, 0, 6.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#173a78'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffd0a0'; ctx.beginPath(); ctx.arc(2, 0, 3, 0, 7); ctx.fill(); ctx.restore(); }
        ctx.restore();
        // 右栏：单子
        U.panel(ctx, 664, 66, 222, 262, 16); U.txt(ctx, '车上的单子', 775, 96, 17, '#ffe9b8', 'center', true);
        g.carry.forEach((o, i) => { const y = 112 + i * 52; U.rr(ctx, 676, y, 198, 44, 10, 'rgba(0,0,0,.35)', 'rgba(255,230,180,.25)', 1.2); drawBox(ctx, 698, y + 22, TAG[o.tag], 24); U.txt(ctx, `送 ${o.floor}`, 720, y + 20, 15, '#fff3d6', 'left', true); U.rr(ctx, 720, y + 26, 140, 9, 4.5, 'rgba(0,0,0,.5)'); const col = o.fresh > .66 ? '#ffb04a' : o.fresh > .33 ? '#9ac8e8' : '#6a8ab0'; U.rr(ctx, 721, y + 27, Math.max(6, 138 * o.fresh), 7, 3.5, col); });
        if (!g.carry.length) U.txt(ctx, '空车，去取外卖', 775, 200, 15, '#bfb39a', 'center');
        U.txt(ctx, o2(g.tips), 775, 316, 13, '#cfe8b8', 'center');
        U.txt(ctx, '转弯', 780, 278, 16, '#ffe9a8', 'center', true);
        pads.forEach(([d, label, bx, by, bw, bh]) => { const on = g.pressed === d; ctx.save(); if (on) ctx.translate(0, 2); U.glossy(ctx, bx, by, bw, bh, 12, on ? '#c98a28' : '#6a5a46', { so: on ? 1 : 3 }); U.txt(ctx, ['▲', '▶', '▼', '◀'][d], bx + bw / 2, by + bh / 2 + 2, 18, '#fff3d6', 'center', true); U.txt(ctx, label, bx + bw / 2, by + bh - 6, 12, '#fff3d6', 'center'); ctx.restore(); });
        U.txt(ctx, '热乎的单子小费更高', 34, 482, 14, '#cbbfa6');
      };
      const o2 = n => n ? `小费 +¥${n}` : '';
      g.final = () => { const q = clamp(g.delivered / 7, 0, 1) * .85 + clamp((g.delivered - g.late) / 7, 0, 1) * .15 - g.crashes * .04; return { quality: clamp(q, 0, 1), score: g.delivered, summary: `送了 ${g.delivered} 单，撞了 ${g.crashes} 次。`, lines: [`送到 ${g.delivered} 单（${g.delivered - g.late} 单热乎着送到）`, g.crashes ? `撞了 ${g.crashes} 次，${g.spilled} 单洒了或退单，被扣了赔偿` : '一次没撞，汤没洒', g.dead ? '三次都撞了，被店家叫回去了' : '客人满意，给了小费'], stats: { delivered: g.delivered, crashes: g.crashes, late: g.late, spilled: g.spilled } }; };
      return g;
    }
  });
})();
