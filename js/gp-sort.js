// v1.0.2 · 分拣废品 → 传送带分拣：废品顺着传送带过来，拖进（或按数字键 / 点桶）对应的桶：纸、塑料、金属、玻璃。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const BELT_Y = 214, BX0 = 24, BX1 = 876;
  const BINS = [{ id: 'paper', n: '纸', c: '#4a7fc0', key: '1' }, { id: 'plastic', n: '塑料', c: '#d8a830', key: '2' }, { id: 'metal', n: '金属', c: '#8a949e', key: '3' }, { id: 'glass', n: '玻璃', c: '#3f9a6a', key: '4' }].map((b, i) => Object.assign(b, { x: 54 + i * 210, y: 318, w: 170, h: 150 }));
  const ITEMS = [
    { n: '旧报纸', m: 'paper', w: 4 }, { n: '纸壳', m: 'paper', w: 4 }, { n: '旧书', m: 'paper', w: 2 },
    { n: '矿泉水瓶', m: 'plastic', w: 4 }, { n: '洗发水瓶', m: 'plastic', w: 3 }, { n: '塑料盆', m: 'plastic', w: 2 },
    { n: '易拉罐', m: 'metal', w: 4 }, { n: '铁罐头', m: 'metal', w: 3 }, { n: '铜把手', m: 'metal', w: .7, rare: 1 },
    { n: '啤酒瓶', m: 'glass', w: 4 }, { n: '酱油瓶', m: 'glass', w: 3 }, { n: '玻璃罐', m: 'glass', w: 2 }
  ];
  const wp = () => { const t = ITEMS.reduce((a, b) => a + b.w, 0); let r = Math.random() * t; for (const x of ITEMS) if ((r -= x.w) <= 0) return x; return ITEMS[0]; };
  const spr = {};
  function sprite(name) {
    if (spr[name]) return spr[name];
    return spr[name] = U.mk(64, 64, (g, w, h) => {
      const cx = 32, cy = 32; g.lineJoin = 'round';
      const outline = (c, lw) => { g.lineWidth = lw || 2; g.strokeStyle = c || 'rgba(0,0,0,.55)'; g.stroke(); };
      if (name === '旧报纸') { g.save(); g.translate(cx, cy); g.rotate(-.12); U.glossy(g, -22, -17, 44, 34, 3, '#e8e2cc', { sb: 3, so: 2 }); g.fillStyle = '#3a3a3a'; g.fillRect(-18, -12, 36, 5); g.fillStyle = '#8a8a82'; for (let i = 0; i < 5; i++) g.fillRect(-18, -3 + i * 4, i % 2 ? 24 : 36, 2); g.fillStyle = '#9a9a92'; g.fillRect(-18, 3, 12, 11); g.restore(); }
      else if (name === '纸壳') { g.save(); g.translate(cx, cy); g.rotate(.1); U.glossy(g, -24, -16, 48, 32, 3, '#c9a05f', { sb: 3, so: 2 }); g.strokeStyle = 'rgba(110,70,20,.4)'; g.lineWidth = 1.4; for (let i = -12; i < 14; i += 6) { g.beginPath(); g.moveTo(-24, i); g.lineTo(24, i); g.stroke(); } g.fillStyle = 'rgba(255,240,200,.7)'; g.fillRect(-4, -16, 8, 32); g.fillStyle = '#7a4a1a'; g.font = `700 8px ${U.FONT}`; g.fillText('↑上', -20, 10); g.restore(); }
      else if (name === '旧书') { g.save(); g.translate(cx, cy); g.rotate(-.18); U.glossy(g, -17, -22, 34, 44, 3, '#b0453a', { sb: 3, so: 2 }); g.fillStyle = '#f2ead2'; g.fillRect(-14, -19, 3, 38); g.fillStyle = '#e8c860'; g.fillRect(-6, -12, 18, 5); g.fillRect(-6, -3, 14, 3); g.restore(); }
      else if (name === '矿泉水瓶') { g.save(); g.translate(cx, cy); g.rotate(.6); const gr = g.createLinearGradient(-9, 0, 9, 0); gr.addColorStop(0, 'rgba(190,230,255,.9)'); gr.addColorStop(.5, 'rgba(240,250,255,.95)'); gr.addColorStop(1, 'rgba(150,200,240,.9)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-4, -26); g.lineTo(4, -26); g.lineTo(4, -20); g.bezierCurveTo(12, -14, 11, -8, 10, -4); g.lineTo(10, 20); g.quadraticCurveTo(10, 26, 4, 26); g.lineTo(-4, 26); g.quadraticCurveTo(-10, 26, -10, 20); g.lineTo(-10, -4); g.bezierCurveTo(-11, -8, -12, -14, -4, -20); g.closePath(); g.fill(); outline('rgba(40,100,160,.9)', 2); g.fillStyle = '#2a7cc0'; g.fillRect(-4.5, -29, 9, 5); g.fillStyle = '#4a9ae0'; g.fillRect(-10, 0, 20, 10); g.restore(); }
      else if (name === '洗发水瓶') { g.save(); g.translate(cx, cy); g.rotate(-.3); const gr = g.createLinearGradient(-12, 0, 12, 0); gr.addColorStop(0, '#f08ab8'); gr.addColorStop(1, '#c0407a'); g.fillStyle = gr; g.beginPath(); g.roundRect(-12, -16, 24, 38, 7); g.fill(); outline('#7a1a48', 2); g.fillStyle = '#f4f0f0'; g.beginPath(); g.roundRect(-5, -26, 10, 11, 3); g.fill(); outline('#6a5a5a', 1.5); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-8, -6, 16, 12); g.restore(); }
      else if (name === '塑料盆') { g.save(); g.translate(cx, cy); const gr = g.createLinearGradient(0, -14, 0, 18); gr.addColorStop(0, '#f8a0a0'); gr.addColorStop(1, '#d04a5a'); g.fillStyle = gr; g.beginPath(); g.moveTo(-26, -8); g.lineTo(26, -8); g.lineTo(20, 16); g.quadraticCurveTo(0, 22, -20, 16); g.closePath(); g.fill(); outline('#7a1a2a', 2); g.fillStyle = '#ffd0d0'; g.beginPath(); g.ellipse(0, -8, 26, 6, 0, 0, 7); g.fill(); outline('#7a1a2a', 1.6); g.restore(); }
      else if (name === '易拉罐') { g.save(); g.translate(cx, cy); g.rotate(.5); const gr = g.createLinearGradient(-10, 0, 10, 0); gr.addColorStop(0, '#d8dce0'); gr.addColorStop(.35, '#ffffff'); gr.addColorStop(1, '#9aa0a8'); g.fillStyle = gr; g.beginPath(); g.roundRect(-10, -20, 20, 40, 4); g.fill(); outline('#4a5058', 2); g.fillStyle = '#d83a34'; g.fillRect(-10, -9, 20, 17); g.fillStyle = '#fff'; g.font = `700 9px ${U.FONT}`; g.textAlign = 'center'; g.fillText('可乐', 0, 3); g.fillStyle = '#b8bcc4'; g.beginPath(); g.ellipse(0, -20, 10, 3, 0, 0, 7); g.fill(); outline('#4a5058', 1.4); g.restore(); }
      else if (name === '铁罐头') { g.save(); g.translate(cx, cy); const gr = g.createLinearGradient(-15, 0, 15, 0); gr.addColorStop(0, '#b0b6bc'); gr.addColorStop(.4, '#f4f6f8'); gr.addColorStop(1, '#8a9098'); g.fillStyle = gr; g.beginPath(); g.roundRect(-15, -15, 30, 32, 4); g.fill(); outline('#3a4048', 2); g.fillStyle = '#e8b04a'; g.fillRect(-15, -5, 30, 14); g.fillStyle = '#7a4a10'; g.beginPath(); g.arc(0, 2, 4, 0, 7); g.fill(); g.fillStyle = '#c8ccd2'; g.beginPath(); g.ellipse(0, -15, 15, 4, 0, 0, 7); g.fill(); outline('#3a4048', 1.4); g.restore(); }
      else if (name === '铜把手') { g.save(); g.translate(cx, cy); g.rotate(-.4); const gr = g.createLinearGradient(-20, -8, 20, 10); gr.addColorStop(0, '#f6d27a'); gr.addColorStop(.5, '#d89a30'); gr.addColorStop(1, '#8a5a14'); g.strokeStyle = '#6a4408'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-18, 6); g.quadraticCurveTo(0, -14, 18, 6); g.stroke(); g.strokeStyle = gr; g.lineWidth = 8.5; g.stroke(); g.fillStyle = gr; g.beginPath(); g.arc(-18, 8, 6, 0, 7); g.arc(18, 8, 6, 0, 7); g.fill(); g.strokeStyle = '#6a4408'; g.lineWidth = 1.6; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-4, -4, 8, 1.8, -.2, 0, 7); g.fill(); g.restore(); }
      else if (name === '啤酒瓶') { g.save(); g.translate(cx, cy); g.rotate(-.5); const gr = g.createLinearGradient(-8, 0, 8, 0); gr.addColorStop(0, '#6a3e12'); gr.addColorStop(.45, '#c8883a'); gr.addColorStop(1, '#5a3008'); g.fillStyle = gr; g.beginPath(); g.moveTo(-3.5, -28); g.lineTo(3.5, -28); g.lineTo(3.5, -12); g.bezierCurveTo(10, -6, 10, -2, 9.5, 2); g.lineTo(9.5, 24); g.quadraticCurveTo(9.5, 28, 5, 28); g.lineTo(-5, 28); g.quadraticCurveTo(-9.5, 28, -9.5, 24); g.lineTo(-9.5, 2); g.bezierCurveTo(-10, -2, -10, -6, -3.5, -12); g.closePath(); g.fill(); outline('#2a1404', 2); g.fillStyle = '#e8d8a0'; g.fillRect(-9.5, 4, 19, 12); g.fillStyle = '#c8302a'; g.fillRect(-9.5, 8, 19, 3); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-6, -10, 2, 14); g.restore(); }
      else if (name === '酱油瓶') { g.save(); g.translate(cx, cy); g.rotate(.3); const gr = g.createLinearGradient(-11, 0, 11, 0); gr.addColorStop(0, '#2a2018'); gr.addColorStop(.5, '#6a5440'); gr.addColorStop(1, '#1a140e'); g.fillStyle = gr; g.beginPath(); g.roundRect(-11, -14, 22, 36, 6); g.fill(); g.beginPath(); g.roundRect(-5, -26, 10, 14, 3); g.fill(); outline('#0a0604', 2); g.fillStyle = '#d8ccb0'; g.fillRect(-11, -2, 22, 14); g.fillStyle = '#b02a22'; g.font = `700 9px ${U.FONT}`; g.textAlign = 'center'; g.fillText('酱油', 0, 8); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-8, -12, 2, 14); g.restore(); }
      else { g.save(); g.translate(cx, cy); const gr = g.createLinearGradient(-15, 0, 15, 0); gr.addColorStop(0, 'rgba(180,235,220,.9)'); gr.addColorStop(.5, 'rgba(245,255,252,.95)'); gr.addColorStop(1, 'rgba(140,200,190,.9)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-10, -18); g.lineTo(10, -18); g.lineTo(10, -13); g.bezierCurveTo(18, -8, 16, 16, 12, 20); g.lineTo(-12, 20); g.bezierCurveTo(-16, 16, -18, -8, -10, -13); g.closePath(); g.fill(); outline('#2a7a6a', 2); g.fillStyle = '#c8a050'; g.fillRect(-11, -23, 22, 6); outline('#6a4a10', 1.4); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-10, -8, 3, 20); g.restore(); }
    });
  }
  const sfxFor = m => { if (m === 'paper') { S.noise(0, .12, 2600, .12, 'highpass'); } else if (m === 'plastic') { S.noise(0, .1, 3200, .1, 'bandpass'); S.tone(420, 300, .06, .06); } else if (m === 'metal') { S.clink(); S.tone(900, 700, .1, .08); } else { S.tone(2000, 2600, .08, .1); S.tone(1500, 1900, .12, .08); } };
  GP.reg('sort', {
    title: '分拣废品 · 传送带', dur: 60, minutes: 80, hours: 4, tint: 'rgba(16,18,18,.62)',
    help: ['废品顺着传送带从左往右走。把它拖进下面对应的桶：纸、塑料、金属、玻璃。', '懒得拖也行：直接按 1 2 3 4，或点桶，会把最靠前的那件扔进去（桶上有数字）。', '扔错了会弄脏整桶，废品站要扣钱；漏掉没扔的也扣。连续扔对有连击，铜把手值钱，别当废铁。'],
    make(env) {
      const g = { items: [], spawnT: .4, spawned: 0, ok: 0, wrong: 0, missed: 0, combo: 0, maxCombo: 0, drag: null, binFill: [0, 0, 0, 0], binFlash: [0, 0, 0, 0], binShake: [0, 0, 0, 0], belt: 0, speed: 92, copper: 0, auto: null, autoT: 0, tapPending: null, pf: 0, tips: 0 };
      const front = () => g.items.filter(i => !i.drag && !i.sorted).sort((a, b) => b.x - a.x)[0];
      function spawn() { const t = wp(); g.items.push({ t, x: BX0 - 20, y: BELT_Y + rnd(-8, 8), rot: rnd(-.4, .4), bob: rnd(0, 6), sorted: 0, drag: false, born: g.pf }); g.spawned++; }
      function sortInto(it, bi) {
        const b = BINS[bi]; it.sorted = 1; const cx = b.x + b.w / 2, cy = b.y + 20;
        const good = it.t.m === b.id; g.items = g.items.filter(x => x !== it); g.fall = g.fall || [];
        g.fall.push({ t: it.t, x: it.x, y: it.y, tx: cx, ty: cy, k: 0, good, rot: it.rot });
        if (good) { g.ok++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.binFill[bi] = Math.min(1, g.binFill[bi] + .06); g.binFlash[bi] = .35; S.good(g.combo); sfxFor(b.id); let txt = g.combo >= 3 ? `连对 ×${g.combo}` : '对了'; if (it.t.rare) { g.copper++; g.tips += 3; txt = '铜！值钱'; S.coin(); env.burst(cx, cy, 14, { colors: ['#ffd24a', '#fff', '#f0a020'], speed: 200, up: 120, size: 4, shape: 'star' }); } env.float(cx, b.y - 8, txt, it.t.rare ? '#ffd24a' : g.combo >= 3 ? '#ffe27a' : '#bfe8a8', it.t.rare ? 26 : 20); env.burst(cx, cy, 6, { colors: [b.c, '#fff'], speed: 110, up: 80, size: 3, life: .5 }); }
        else { g.wrong++; g.combo = 0; g.binShake[bi] = .4; g.binFill[bi] = Math.max(0, g.binFill[bi] - .02); env.penalty(`${it.t.n}不是${b.n}！弄脏了一桶，废品站要扣钱`, cx, b.y - 8, { shake: 6 }); S.buzz(); }
      }
      const binAt = (x, y) => BINS.findIndex(b => x >= b.x - 8 && x <= b.x + b.w + 8 && y >= b.y - 20 && y <= b.y + b.h + 8);
      const hit = (x, y) => { let best = null; g.items.forEach(i => { if (i.drag) return; const d = Math.hypot(i.x - x, i.y - y); if (d < 38 && (!best || d < best.d)) best = { i, d }; }); return best && best.i; };
      g.sortFront = bi => { const it = front(); if (!it) { S.tap(); return false; } sortInto(it, bi); return true; };
      g.pointer = (k, x, y) => {
        if (k === 'down') { const it = hit(x, y); if (it) { g.drag = { it, ox: it.x - x, oy: it.y - y, sx: x, sy: y, moved: false }; it.drag = true; S.tap(); return; } const bi = binAt(x, y); if (bi >= 0) g.sortFront(bi); }
        else if (k === 'move' && g.drag) { const d = g.drag; d.it.x = x + d.ox; d.it.y = y + d.oy; d.moved = true; g.hover = binAt(x, y); }
        else if (k === 'up' && g.drag) { const d = g.drag; g.drag = null; g.hover = -1; const bi = binAt(x, y); if (bi >= 0) sortInto(d.it, bi); else { d.it.drag = false; if (d.it.y < BELT_Y - 40 || d.it.y > BELT_Y + 40) d.it.back = 1; } }
      };
      g.key = k => { if (['1', '2', '3', '4'].includes(k)) { g.sortFront(+k - 1); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['分对', g.ok], ['扔错', g.wrong, g.wrong ? '#e8705a' : null], ['漏', g.missed, g.missed ? '#e8705a' : null]];
      g.playBox = { x: 54, y: 318, w: 836, h: 200 };
      g.hint = () => g.ok < 3 ? '把废品拖进对应的桶（或按数字键 1–4）' : null;
      g.update = dt => {
        g.pf += dt; g.speed = 92 + Math.min(60, env.t * 1.1); g.belt = (g.belt + g.speed * dt) % 40;
        g.spawnT -= dt; if (g.spawnT <= 0) { spawn(); g.spawnT = Math.max(.7, 1.55 - env.t * .014) * rnd(.85, 1.15); }
        g.items.forEach(i => { i.bob += dt * 6; if (i.drag) return; if (i.back) { i.y += (BELT_Y - i.y) * Math.min(1, dt * 8); if (Math.abs(i.y - BELT_Y) < 2) i.back = 0; } i.x += g.speed * dt; });
        g.items.filter(i => !i.drag && i.x > BX1 + 10).forEach(i => { g.missed++; g.combo = 0; g.items = g.items.filter(x => x !== i); env.penalty(`漏了一件${i.t.n}，掉地上了`, BX1 - 60, BELT_Y - 40, { shake: 3, quiet: true }); });
        (g.fall || []).forEach(f => f.k += dt / .28); g.fall = (g.fall || []).filter(f => f.k < 1);
        for (let i = 0; i < 4; i++) { g.binFlash[i] = Math.max(0, g.binFlash[i] - dt); g.binShake[i] = Math.max(0, g.binShake[i] - dt); }
        if (g.auto) { g.autoT += dt; if (g.autoT > (g.auto === 'bad' ? .6 : .26)) { g.autoT = 0; const it = front(); if (it) { if (g.auto === 'bad') { if (Math.random() < .7) sortInto(it, ri(0, 3)); } else if (it.x > 120) sortInto(it, BINS.findIndex(b => b.id === it.t.m)); } } }
      };
      // ---------- 画面 ----------
      g.draw = ctx => {
        // 传送带
        U.panel(ctx, 12, 120, 876, 190, 22, { top: 'rgba(34,36,38,.82)', bot: 'rgba(20,22,24,.86)' });
        ctx.save(); ctx.beginPath(); ctx.roundRect(BX0, BELT_Y - 42, BX1 - BX0, 84, 12); ctx.clip(); const gr = ctx.createLinearGradient(0, BELT_Y - 42, 0, BELT_Y + 42); gr.addColorStop(0, '#2c2e32'); gr.addColorStop(.5, '#3c3f45'); gr.addColorStop(1, '#25272b'); ctx.fillStyle = gr; ctx.fillRect(BX0, BELT_Y - 42, BX1 - BX0, 84); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 4; for (let x = BX0 - 40 + g.belt; x < BX1; x += 40) { ctx.beginPath(); ctx.moveTo(x, BELT_Y - 42); ctx.lineTo(x + 14, BELT_Y + 42); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(BX0, BELT_Y - 42, BX1 - BX0, 4); ctx.restore();
        ctx.strokeStyle = '#6a6e76'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(BX0, BELT_Y - 44, BX1 - BX0, 88, 12); ctx.stroke(); [BX0 + 4, BX1 - 4].forEach(x => { ctx.fillStyle = '#58606a'; ctx.beginPath(); ctx.arc(x, BELT_Y, 14, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a2e34'; ctx.lineWidth = 2; ctx.stroke(); });
        U.txt(ctx, '进料 →', BX0 + 8, BELT_Y - 52, 13, 'rgba(255,255,255,.5)'); U.txt(ctx, '→ 漏掉就掉地上', BX1 - 8, BELT_Y - 52, 13, 'rgba(255,170,150,.7)', 'right');
        const fr = front(); if (fr && !g.drag) { const p = .5 + .5 * Math.sin(g.pf * 8); ctx.strokeStyle = `rgba(255,226,122,${.4 + .4 * p})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(fr.x, fr.y, 36, 0, 7); ctx.stroke(); }
        g.items.slice().sort((a, b) => (a.drag ? 1 : 0) - (b.drag ? 1 : 0)).forEach(i => { ctx.save(); ctx.translate(i.x, i.y + (i.drag ? -6 : Math.sin(i.bob) * 1.2)); ctx.rotate(i.rot); if (i.drag) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 10; ctx.scale(1.12, 1.12); } else U.shadowEllipse(ctx, 2, 26, 22, 6, .3); ctx.drawImage(sprite(i.t.n), -32, -32, 64, 64); ctx.restore(); if (i.x < 560 && !i.drag && g.ok + g.wrong < 4) U.txt(ctx, i.t.n, i.x, i.y + 46, 13, '#f3ead8', 'center', false, 'rgba(0,0,0,.8)'); });
        // 桶
        BINS.forEach((b, i) => { const sh = g.binShake[i] > 0 ? Math.sin(g.binShake[i] * 60) * 5 : 0, hv = g.hover === i && g.drag; ctx.save(); ctx.translate(b.x + sh, 0);
          if (g.binFlash[i] > 0 || hv) { ctx.shadowColor = hv ? '#fff' : '#bfe8a8'; ctx.shadowBlur = 20; }
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(b.w / 2, b.y + b.h + 4, b.w / 2, 9, 0, 0, 7); ctx.fill();
          const bg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h); bg.addColorStop(0, U.shade(b.c, .2)); bg.addColorStop(1, U.shade(b.c, -.35)); ctx.beginPath(); ctx.moveTo(8, b.y + 14); ctx.lineTo(b.w - 8, b.y + 14); ctx.lineTo(b.w - 18, b.y + b.h); ctx.lineTo(18, b.y + b.h); ctx.closePath(); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = U.shade(b.c, -.6); ctx.stroke();
          ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(22, b.y + 20, 8, b.h - 30);
          const fill = g.binFill[i]; if (fill > 0) { ctx.save(); ctx.beginPath(); ctx.moveTo(10, b.y + 16); ctx.lineTo(b.w - 10, b.y + 16); ctx.lineTo(b.w - 19, b.y + b.h - 2); ctx.lineTo(19, b.y + b.h - 2); ctx.closePath(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, b.y + b.h - 6 - fill * (b.h - 30), b.w, fill * (b.h - 30) + 6); ctx.restore(); }
          U.glossy(ctx, 0, b.y + 2, b.w, 20, 8, U.shade(b.c, .1), { sb: 4, so: 2 }); U.txt(ctx, `${b.key}  ${b.n}`, b.w / 2, b.y + b.h / 2 + 18, 30, '#fff', 'center', true, 'rgba(0,0,0,.6)'); ctx.restore(); });
        (g.fall || []).forEach(f => { const k = clamp(f.k, 0, 1), x = f.x + (f.tx - f.x) * k, y = f.y + (f.ty - f.y) * ease.inOut(k) - Math.sin(k * Math.PI) * 24; ctx.save(); ctx.globalAlpha = 1 - k * .6; ctx.translate(x, y); ctx.rotate(f.rot + k * 4); ctx.scale(1 - k * .5, 1 - k * .5); ctx.drawImage(sprite(f.t.n), -32, -32, 64, 64); ctx.restore(); });
        U.panel(ctx, 12, 62, 876, 48, 14, { top: 'rgba(46,38,30,.8)', bot: 'rgba(30,24,19,.8)' }); U.txt(ctx, g.combo >= 2 ? `连对 ×${g.combo}` : '废品站老头在称重', 450, 94, 18, g.combo >= 2 ? '#ffe27a' : '#e9dcc0', 'center', true);
        U.txt(ctx, g.copper ? `铜把手 ${g.copper} 个` : '', 860, 94, 14, '#ffd24a', 'right', true);
        U.txt(ctx, '按 1 2 3 4 或拖进桶', 450, 500, 14, 'rgba(255,240,210,.5)', 'center');
      };
      g.final = () => { const q = clamp((g.ok - g.wrong * .9 - g.missed * .45) / Math.max(30, g.spawned * .9), 0, 1) * .92 + (g.copper ? .04 : 0) + (g.maxCombo >= 8 ? .04 : 0); return { quality: clamp(q, 0, 1), score: g.ok, summary: `分对 ${g.ok} 件，扔错 ${g.wrong} 件，漏 ${g.missed} 件。`, lines: [`分对 ${g.ok} 件（最长连对 ×${g.maxCombo}）`, g.wrong || g.missed ? `扔错 ${g.wrong} 件、漏掉 ${g.missed} 件，废品站扣了钱` : '一件没错、一件没漏，老头很满意', g.copper ? `挑出 ${g.copper} 个铜把手，另算了点钱` : '没碰到铜的'], stats: { ok: g.ok, wrong: g.wrong, missed: g.missed, copper: g.copper } }; };
      return g;
    }
  });
})();
