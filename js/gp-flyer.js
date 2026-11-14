// v1.0.2 · 路口发传单 → 抓时机的“递传单”小游戏：路人从你面前走过，抓准他们伸手的瞬间递过去；看脸色（愿意 / 犹豫 / 看手机），躲开保安。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const PX = 450, PY = 470, REACH = 250, LANES = [{ y: 338, s: .74 }, { y: 396, s: .92 }, { y: 452, s: 1.12 }];
  const SAY_OK = ['“谢谢。”', '“嗯，我看看。”', '“哦，新开的？”', '“行，拿一张。”', '“正好缺这个。”'];
  const SAY_NO = ['“不要不要。”', '（摆摆手）', '“别发我。”', '（低头走开了）'];
  const SAY_MAYBE = ['“……行吧。”', '“就一张啊。”'];
  const TYPES = [{ id: 'ok', w: 5, face: 'smile', c: '#7fd16a' }, { id: 'maybe', w: 3.2, face: 'flat', c: '#f0c24a' }, { id: 'busy', w: 3, face: 'phone', c: '#9aa3ad' }];
  const wpick = () => { const t = TYPES.reduce((a, b) => a + b.w, 0); let r = Math.random() * t; for (const x of TYPES) { if ((r -= x.w) <= 0) return x; } return TYPES[0]; };
  GP.reg('flyer', {
    title: '路口发传单 · 递出去', dur: 58, minutes: 60, hours: 4, tint: 'rgba(14,16,22,.5)',
    help: ['路人从面前走过。头顶的圈圈往里缩，缩到最小（亮绿色那一圈）时点他们——传单就递过去了。', '绿脸愿意收；黄脸犹豫，只有抓准那一下才肯接；盯着手机的灰脸绝对不要，递了只会白白浪费一张。', '看到保安过来，先停手！他在的时候递传单会被没收、还罚时间。他走远了再接着发。'],
    make(env) {
      const g = { people: [], guard: null, guardT: rnd(9, 13), spawnT: .3, stock: 40, acc: 0, perfect: 0, refused: 0, wasted: 0, caught: 0, combo: 0, maxCombo: 0, flights: [], litter: 0, bubbles: [], danger: false, auto: null, autoT: 0, hearts: 0, side: 1, pf: 0 };
      function spawn() { const t = wpick(), lane = ri(0, 2), dir = Math.random() < .5 ? 1 : -1; const L = LANES[lane]; g.people.push({ t, lane, x: dir > 0 ? -50 : 950, dir, v: rnd(70, 118) * (t.id === 'maybe' ? .9 : 1), step: rnd(0, 6), skin: pick(['#e5b78f', '#d9a073', '#f0c7a0', '#c98a60']), shirt: pick(['#c0613f', '#4a78c0', '#4aa070', '#a06ac0', '#d8a83a', '#6a7a8a']), pants: pick(['#3b4a63', '#4a4036', '#2f3a46']), hair: pick(['#2b2420', '#4a3426', '#1a1a1e', '#6a5a4a']), bag: Math.random() < .4 ? pick(['#7a4a2a', '#2a4a7a']) : null, state: 'walk', st: 0, took: false, shake: 0 }); }
      const ringOf = p => { // 圈圈：进入手臂够得着的范围后开始缩
        const d = Math.abs(p.x - PX), reach = REACH * (.7 + p.lane * .15); if (d > reach) return null; const k = 1 - d / reach; return { r: 14 + 34 * (1 - k * 1), k, perfect: d < reach * .26 };
      };
      const hitTest = (x, y) => { let best = null; g.people.forEach(p => { if (p.state !== 'walk') return; const L = LANES[p.lane], s = L.s; if (Math.abs(x - p.x) < 30 * s && y > L.y - 92 * s && y < L.y + 8) { if (!best || p.lane > best.lane) best = p; } }); return best; };
      function throwTo(p) {
        if (g.stock <= 0) return env.say('传单发完了', '#ffb4a5');
        const d = Math.abs(p.x - PX), reach = REACH * (.7 + p.lane * .15); if (d > reach) { env.float(p.x, LANES[p.lane].y - 100, '够不着，等他走近', '#cfd8e0', 18); S.tap(); return; }
        g.stock--; g.side = p.x > PX ? 1 : -1; const ring = ringOf(p); S.whoosh(); const L = LANES[p.lane];
        if (g.danger) { // 保安在看
          g.caught++; g.combo = 0; const lost = Math.min(g.stock, 6); g.stock -= lost; env.penalty(`保安：这儿不让发！传单被没收 ${lost + 1} 张，罚时 4 秒`, PX, 250, { shake: 9 }); env.addTime(-4, 450, 118); S.tone(520, 380, .3, .25); p.state = 'walk'; return;
        }
        g.flights.push({ p, t: 0, ok: false, ring, from: [PX + g.side * 12, PY - 50] });
        if (p.t.id === 'ok') { p.took = true; p.perfectHit = !!(ring && ring.perfect); }
        else if (p.t.id === 'maybe') { p.took = !!(ring && ring.perfect); p.perfectHit = p.took; }
        else p.took = false; g.flights[g.flights.length - 1].ok = p.took; p.state = 'handed'; p.st = 0;
      }
      function resolveFlight(f) {
        const p = f.p, L = LANES[p.lane], x = p.x, y = L.y - 60 * L.s;
        if (f.ok) { g.acc++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); const perfect = p.perfectHit; if (perfect) g.perfect++; S.good(g.combo); S.tone(1200, 1700, .08, .08); env.float(x, y - 40, perfect ? `恰到好处！×${g.combo}` : `收下  ×${g.combo}`, perfect ? '#ffe27a' : '#bfe8a8', perfect ? 26 : 21); env.burst(x, y, perfect ? 14 : 7, { colors: ['#ffe27a', '#fff', '#a8f0a0'], speed: 140, up: 90, size: 4, shape: perfect ? 'star' : 'dot', life: .7 }); g.bubbles.push({ x, y: y - 76 * L.s, text: pick(p.t.id === 'maybe' ? SAY_MAYBE : SAY_OK), t: 0, c: '#fff' }); if (g.combo === 5 || g.combo === 10) env.say(`${g.combo} 连！手越来越顺`, '#ffe9a8', 1.4); }
        else { g.combo = 0; g.wasted++; g.litter++; p.state = 'refuse'; p.st = 0; env.penalty(p.t.id === 'busy' ? '盯着手机的人不会接，白白浪费一张' : '没抓准，他没接，传单掉地上了', x, y - 30, { shake: 3, quiet: true }); env.float(x, y - 70, p.t.id === 'busy' ? '浪费一张' : '没接住', '#ff9c8a', 20); g.bubbles.push({ x, y: y - 76 * L.s, text: pick(SAY_NO), t: 0, c: '#ffd6cc' }); }
      }
      g.pointer = (k, x, y) => { if (k !== 'down') return; if (g.guard === null && false) return; const p = hitTest(x, y); if (p) throwTo(p); else { S.tap(); } };
      g.key = k => { if (k === 'space' || k === 'enter') { // 键盘：递给最近的
        let best = null; g.people.forEach(p => { if (p.state === 'walk' && ringOf(p) && (!best || Math.abs(p.x - PX) < Math.abs(best.x - PX))) best = p; }); if (best) throwTo(best); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['递出', g.acc], ['传单', g.stock, g.stock < 8 ? '#e8705a' : null]];
      g.playBox = { x: 16, y: 456, w: 868, h: 54 };
      g.hint = () => g.acc < 2 ? '圈圈缩到最小时点人（或按空格），灰脸别递' : g.danger ? '保安在看！先停手' : null;
      g.update = dt => {
        g.pf += dt; g.spawnT -= dt; if (g.spawnT <= 0) { spawn(); g.spawnT = rnd(.75, 1.35); }
        g.guardT -= dt; if (!g.guard && g.guardT <= 0) { const dir = Math.random() < .5 ? 1 : -1; g.guard = { x: dir > 0 ? -60 : 960, dir, state: 'enter', t: 0, stopX: PX + (dir > 0 ? -190 : 190), step: 0 }; env.say('保安过来了！先别递传单', '#ffb89a', 2.2); S.tone(330, 420, .25, .16); S.tone(330, 420, .25, .12); }
        const gd = g.guard; g.danger = false;
        if (gd) { gd.t += dt; gd.step += dt * 8; if (gd.state === 'enter') { gd.x += gd.dir * 78 * dt; if ((gd.dir > 0 && gd.x >= gd.stopX) || (gd.dir < 0 && gd.x <= gd.stopX)) { gd.state = 'watch'; gd.t = 0; } } else if (gd.state === 'watch') { if (gd.t > 3.4) { gd.state = 'leave'; env.say('保安走了，接着发', '#bfe8a8', 1.4); S.chime(); } } else { gd.x += gd.dir * 90 * dt; if (gd.x < -80 || gd.x > 980) { g.guard = null; g.guardT = rnd(13, 18); } }
          g.danger = gd.state !== 'leave' && Math.abs(gd.x - PX) < 330; }
        g.people.forEach(p => { p.step += dt * p.v / 14; if (p.state === 'walk') p.x += p.dir * p.v * dt; else if (p.state === 'handed') { p.st += dt; if (p.st > .55) { p.state = 'walk'; } p.x += p.dir * p.v * .25 * dt; } else if (p.state === 'refuse') { p.st += dt; p.shake = Math.sin(p.st * 40) * 3 * (1 - p.st / .6); if (p.st > .6) { p.state = 'walk'; p.shake = 0; } p.x += p.dir * p.v * .6 * dt; } });
        g.people = g.people.filter(p => p.x > -80 && p.x < 980);
        g.flights.forEach(f => { f.t += dt / .24; }); g.flights.filter(f => f.t >= 1 && !f.done).forEach(f => { f.done = 1; resolveFlight(f); }); g.flights = g.flights.filter(f => !f.done);
        g.bubbles.forEach(b => { b.t += dt; b.y -= 10 * dt; }); g.bubbles = g.bubbles.filter(b => b.t < 1.3);
        if (g.auto) { g.autoT += dt; if (g.autoT > .12) { g.autoT = 0; if (g.auto === 'bad') { const bz = g.people.find(p => p.t.id === 'busy' && p.state === 'walk' && ringOf(p)) || g.people.find(p => p.state === 'walk' && ringOf(p)); if (bz) throwTo(bz); } else if (!g.danger) { const c = g.people.filter(p => p.state === 'walk' && p.t.id !== 'busy').map(p => ({ p, r: ringOf(p) })).filter(o => o.r && o.r.perfect).sort((a, b) => a.p.lane - b.p.lane)[0]; if (c) throwTo(c.p); } } }
      };
      // ---------- 画面 ----------
      const shops = U.mk(900, 300, (c, w, h) => {
        const cols = ['#a8805a', '#8a6a7a', '#6a8a9a', '#a09a6a', '#9a6a5a', '#7a9a7a'], names = ['健身房', '烧饼铺', '手机维修', '药店', '理发', '五金']; let x = -10, i = 0;
        while (x < w) { const bw = ri(130, 180), bh = ri(150, 215), col = cols[i % cols.length]; U.glossy(c, x, h - bh, bw, bh, 6, col, { shadow: false, lw: 1.5 }); c.fillStyle = 'rgba(255,255,255,.14)'; for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) c.fillRect(x + 14 + q * (bw / 3.2), h - bh + 16 + r * 34, bw / 5, 22); U.glossy(c, x + 8, h - 78, bw - 16, 32, 5, U.shade(col, -.4), { shadow: false, lw: 1.2 }); c.fillStyle = '#3a2a1a'; c.fillRect(x + bw / 2 - 17, h - 62, 34, 62); U.txt(c, names[i % names.length], x + bw / 2, h - 56, 15, '#fff2cc', 'center', true); x += bw + 6; i++; }
      });
      const walk = U.mk(900, 220, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8e8a84'); gr.addColorStop(1, '#6a6660'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; for (let x = 0; x < w; x += 46) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x - 20, h); c.stroke(); } for (let y = 0; y < h; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(0, 0, w, 6); });
      const face = (ctx, x, y, r, kind, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.stroke(); ctx.fillStyle = '#1a1a1a'; if (kind === 'phone') { U.rr(ctx, x - r * .32, y - r * .55, r * .64, r * 1.1, 2, '#222', '#fff', 1); ctx.fillStyle = '#7fd0ff'; ctx.fillRect(x - r * .22, y - r * .4, r * .44, r * .7); return; } ctx.beginPath(); ctx.arc(x - r * .34, y - r * .2, r * .11, 0, 7); ctx.arc(x + r * .34, y - r * .2, r * .11, 0, 7); ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); if (kind === 'smile') ctx.arc(x, y + r * .05, r * .45, .15 * Math.PI, .85 * Math.PI); else { ctx.moveTo(x - r * .35, y + r * .4); ctx.lineTo(x + r * .35, y + r * .4); } ctx.stroke(); };
      g.draw = ctx => {
        ctx.drawImage(shops, 0, 70, 900, 300); ctx.fillStyle = 'rgba(20,16,12,.2)'; ctx.fillRect(0, 70, 900, 300); ctx.drawImage(walk, 0, 300, 900, 220);
        // 灯杆
        [120, 780].forEach(x => { ctx.fillStyle = '#3a3a40'; ctx.fillRect(x - 3, 190, 6, 150); ctx.beginPath(); ctx.arc(x, 188, 10, 0, 7); ctx.fillStyle = '#f2e2a0'; ctx.fill(); });
        // 地上的传单
        for (let i = 0; i < Math.min(g.litter, 14); i++) { ctx.save(); ctx.translate(60 + (i * 211) % 800, 490 + (i * 17) % 22); ctx.rotate(i * 1.7); ctx.fillStyle = '#f4efe0'; ctx.fillRect(-7, -5, 14, 10); ctx.strokeStyle = '#a89a78'; ctx.lineWidth = 1; ctx.strokeRect(-7, -5, 14, 10); ctx.restore(); }
        // 手臂够得着的范围
        const ps = g.people.slice().sort((a, b) => a.lane - b.lane); const gd = g.guard;
        const drawPeople = lane => ps.filter(p => p.lane === lane).forEach(p => { const L = LANES[p.lane], ring = ringOf(p); U.person(ctx, p.x + (p.shake || 0), L.y, { s: L.s, face: p.dir, step: p.step, skin: p.skin, shirt: p.shirt, pants: p.pants, hair: p.hair, bag: p.bag, armUp: p.state === 'handed' && p.took });
          if (p.state === 'walk' || p.state === 'handed') face(ctx, p.x, L.y - 98 * L.s, 11 * L.s, p.t.face, p.t.c);
          if (p.state === 'walk' && ring && p.t.id !== 'busy') { const r = ring.r * L.s * 1.05, perfect = ring.perfect; ctx.save(); ctx.strokeStyle = perfect ? '#d8ff7a' : 'rgba(255,255,255,.75)'; ctx.lineWidth = perfect ? 4 : 2.5; if (perfect) { ctx.shadowColor = '#d8ff7a'; ctx.shadowBlur = 14; } ctx.beginPath(); ctx.arc(p.x, L.y - 98 * L.s, r, 0, 7); ctx.stroke(); ctx.restore(); } });
        drawPeople(0); drawPeople(1);
        // 保安
        if (gd) { const L = LANES[1]; const cx = gd.x; if (gd.state !== 'leave') { ctx.save(); const gr = ctx.createLinearGradient(cx, 0, PX, 0); gr.addColorStop(0, 'rgba(255,70,60,.38)'); gr.addColorStop(1, 'rgba(255,70,60,.08)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(cx + gd.dir * 10, L.y - 70); ctx.lineTo(PX, 300); ctx.lineTo(PX, 520); ctx.closePath(); ctx.fill(); ctx.restore(); }
          U.person(ctx, cx, L.y + 10, { s: 1.05, face: gd.state === 'leave' ? gd.dir : -gd.dir * 0 + gd.dir, step: gd.step, skin: '#e0b088', shirt: '#2a4a8a', pants: '#20283a', hair: '#1a1a1e', hat: '#1a2a5a' }); U.txt(ctx, '保安', cx, L.y - 94, 14, '#fff', 'center', true, 'rgba(10,20,60,.9)'); if (g.danger) { U.txt(ctx, '!', cx, L.y - 114, 30, '#ff7a6a', 'center', true, 'rgba(0,0,0,.8)'); } }
        drawPeople(2);
        // 递出的传单
        g.flights.forEach(f => { const L = LANES[f.p.lane], tx = f.p.x, ty = L.y - 52 * L.s, k = ease.out(clamp(f.t, 0, 1)), x = f.from[0] + (tx - f.from[0]) * k, y = f.from[1] + (ty - f.from[1]) * k - Math.sin(k * Math.PI) * 40; ctx.save(); ctx.translate(x, y); ctx.rotate(k * 9); ctx.fillStyle = '#fff8e0'; ctx.fillRect(-8, -6, 16, 12); ctx.strokeStyle = '#c0a060'; ctx.lineWidth = 1.2; ctx.strokeRect(-8, -6, 16, 12); ctx.fillStyle = '#d8402a'; ctx.fillRect(-5, -3, 10, 2); ctx.restore(); });
        // 我
        U.person(ctx, PX, PY + 28, { s: 1.22, face: g.side, step: 0, skin: '#e5b78f', shirt: '#2f8a6a', pants: '#3a3a44', hair: '#2b2420', hat: '#d8402a', arm: 6, armUp: false });
        ctx.save(); ctx.translate(PX + g.side * 20, PY - 28); ctx.fillStyle = '#fff8e0'; ctx.fillRect(-9, -7, 18, 14); ctx.strokeStyle = '#c0a060'; ctx.strokeRect(-9, -7, 18, 14); ctx.fillStyle = '#d8402a'; ctx.fillRect(-6, -3, 12, 2); ctx.restore();
        g.bubbles.forEach(b => { const a = clamp(1.3 - b.t, 0, 1); ctx.globalAlpha = a; ctx.font = `15px ${U.FONT}`; const w = ctx.measureText(b.text).width + 16; U.rr(ctx, b.x - w / 2, b.y - 14, w, 24, 10, 'rgba(255,255,255,.95)', 'rgba(0,0,0,.4)', 1.2); U.txt(ctx, b.text, b.x, b.y + 3, 15, '#2a2018', 'center'); ctx.globalAlpha = 1; });
        // 手里的传单堆
        U.panel(ctx, 16, 456, 150, 50, 12); U.txt(ctx, `手里 ${g.stock} 张`, 91, 487, 17, g.stock < 8 ? '#ffb4a5' : '#ffe9b8', 'center', true);
        U.panel(ctx, 734, 456, 150, 50, 12); U.txt(ctx, g.combo >= 2 ? `连 ×${g.combo}` : `好评 ${g.perfect} 次`, 809, 487, 17, '#ffe27a', 'center', true);
        if (g.danger) { ctx.fillStyle = `rgba(255,60,50,${.08 + .06 * Math.sin(g.pf * 8)})`; ctx.fillRect(0, 50, 900, 470); }
      };
      g.final = () => { const q = clamp((g.acc + g.perfect * .6) / 22, 0, 1) - g.caught * .08 - Math.min(.1, g.wasted * .012); return { quality: clamp(q, 0, 1), score: g.acc, summary: `递出 ${g.acc} 张，被保安抓 ${g.caught} 次。`, lines: [`递出去 ${g.acc} 张（其中 ${g.perfect} 张抓得恰到好处）`, g.wasted ? `浪费 ${g.wasted} 张，白白掉在地上` : '没浪费一张', g.caught ? `被保安撞见 ${g.caught} 次，传单被没收，还被罚了时间` : '没惊动保安'], stats: { accepted: g.acc, perfect: g.perfect, wasted: g.wasted, caught: g.caught } }; };
      return g;
    }
  });
})();
