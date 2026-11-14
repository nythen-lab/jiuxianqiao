// v1.0.2 · 冷库搬运 → 码冻品塔（叠叠高）：吊着的冻品箱左右晃，看准时机落下，叠不齐的边会被削掉；手会冻僵，要哈气暖手。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const CX = 330, BASE_Y = 470, BH = 26, PW = 190, W0 = 150, PER = 12, YMAX = 120;
  const KINDS = [['#3f7fc0', '#2a5a92', '鱼'], ['#c8483d', '#8b2a24', '肉'], ['#5ea85a', '#3e7a3b', '菜'], ['#d8a83a', '#a8761a', '虾'], ['#8a62b8', '#62408e', '糕']];
  const spr = {};
  function box(k, w) { const key = k + '_' + w; if (spr[key]) return spr[key]; const P = KINDS[k]; return spr[key] = U.mk(w, BH, (g, ww, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, U.shade(P[0], .25)); gr.addColorStop(1, P[1]); g.beginPath(); g.roundRect(1, 1, ww - 2, h - 2, 4); g.fillStyle = gr; g.fill(); g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 0, ww, 4); g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(ww / 2 - 18, 6, 36, h - 12); g.fillStyle = P[1]; g.font = `700 ${h - 12}px ${U.FONT}`; g.textAlign = 'center'; g.fillText(P[2], ww / 2, h - 7); g.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < ww; i += 18) g.fillRect(i, h - 4, 8, 3); g.restore(); g.beginPath(); g.roundRect(1, 1, ww - 2, h - 2, 4); g.lineWidth = 1.8; g.strokeStyle = U.shade(P[1], -.55); g.stroke(); g.fillStyle = 'rgba(200,235,255,.5)'; g.fillRect(3, 3, 8, 2); }); }
  GP.reg('cold', {
    title: '冷库码货 · 叠叠高', dur: 72, minutes: 480, hours: 8, tint: 'rgba(8,16,28,.62)',
    help: ['挂钩上的冻品箱在左右晃。看准时机点一下（空格 / 点击 / 触屏任意处），箱子就落下来，压在下面那一箱上。', '压不齐的边会被削掉，越叠越窄；叠得严丝合缝（“整整齐齐”）箱子还能宽回来一点。窄到站不住，整垛就塌了，重新码。码够 12 层是一整托，工头给你加时间。', '手会越来越僵，落手会慢半拍：点“哈气暖手”（H 键）缓一缓，缓的时候箱子停着。'],
    make(env) {
      const g = { tower: [], pallets: 0, boxes: 0, perfect: 0, combo: 0, maxCombo: 0, misses: 0, collapses: 0, cold: 0, warm: 0, drop: null, falling: [], cur: null, fx: 0, auto: null, cam: 0, tcam: 0, pf: 0, lag: 0, k: ri(0, 4), speed: 150, pending: 0, collapseT: 0, cc: [] };
      const topW = () => g.tower.length ? g.tower[g.tower.length - 1].w : W0, topX = () => g.tower.length ? g.tower[g.tower.length - 1].x : CX;
      function spawn() { const w = g.tower.length ? topW() : W0; g.k = (g.k + 1) % KINDS.length; const dir = Math.random() < .5 ? 1 : -1; g.cur = { w, x: CX + dir * (PW + 40), dir, k: g.k, v: g.speed + g.tower.length * 7 }; }
      spawn();
      const yOf = n => BASE_Y - (n + 1) * BH;
      function land() { const c = g.cur; if (!c || g.drop) return; g.drop = { x: c.x, w: c.w, k: c.k, y: -60, vy: 0 }; g.cur = null; S.whoosh && S.whoosh(); }
      function resolve(d) {
        const n = g.tower.length, y = yOf(n), px = topX(), pw = topW(), lo = Math.max(d.x - d.w / 2, px - pw / 2), hi = Math.min(d.x + d.w / 2, px + pw / 2), ov = hi - lo, off = d.x - px;
        if (ov <= 4) { g.misses++; g.combo = 0; g.falling.push({ x: d.x, w: d.w, k: d.k, y, vy: 0, r: 0, vr: off > 0 ? 3 : -3, vx: off > 0 ? 60 : -60 }); S.thud(.3); env.addTime(-3, d.x, y - 20); env.penalty('没压上，掉地上了 −3 秒', d.x, y - 6, { shake: 5 }); setTimeout(() => !env.ended && spawn(), 450); return; }
        if (Math.abs(off) <= 5) { // 严丝合缝
          g.combo++; g.perfect++; g.maxCombo = Math.max(g.maxCombo, g.combo); const nw = Math.min(W0, pw + (g.combo >= 2 ? 10 : 4)); g.tower.push({ x: px, w: nw, k: d.k, t: 0 }); S.good(g.combo); S.clink && S.clink(); env.float(px, y - 14, g.combo > 1 ? `整整齐齐 ×${g.combo}` : '整整齐齐', '#aef0ff', 22); env.burst(px, y + BH / 2, 10, { colors: ['#dff6ff', '#9fe0ff', '#fff'], speed: 130, up: 70, size: 3, life: .5 });
        } else {
          g.combo = 0; const cx = (lo + hi) / 2, cut = d.w - ov; g.tower.push({ x: cx, w: ov, k: d.k, t: 0 }); const side = off > 0 ? 1 : -1; const cutw = d.w - ov; g.falling.push({ x: side > 0 ? hi + cutw / 2 : lo - cutw / 2, w: cutw, k: d.k, y, vy: 0, r: 0, vr: side * 2.4, vx: side * 50 }); S.thud(.28); S.tap(); env.float(cx, y - 14, `削掉 ${Math.round(cut)}`, '#ffd0a0', 16);
        }
        g.boxes++; env.shake(2);
        const t = g.tower[g.tower.length - 1];
        if (t.w < 16) { collapse(); return; }
        if (g.tower.length >= PER) { g.pallets++; S.win(); env.addTime(6, CX, 110); env.say(`第 ${g.pallets} 托码齐了！`, '#cfeeff', 1.8); env.burst(CX, BASE_Y - PER * BH, 30, { colors: ['#dff6ff', '#9fe0ff', '#fff', '#ffe27a'], speed: 260, up: 150, size: 4.5, shape: 'star', life: 1 }); g.outT = .9; setTimeout(() => { if (env.ended) return; g.tower = []; g.tcam = 0; g.cam = 0; spawn(); }, 900); return; }
        const h = n => BASE_Y - (n + 1) * BH; g.tcam = Math.max(0, (g.tower.length - 8)) * BH; setTimeout(() => !env.ended && !g.cur && !g.drop && spawn(), 120);
      }
      function collapse() { g.collapses++; g.combo = 0; S.bad(); env.shake(9); env.addTime(-4, CX, 150); env.penalty('码歪了，整垛塌了！−4 秒', CX, 200, { shake: 9 }); g.tower.forEach((b, i) => g.falling.push({ x: b.x, w: b.w, k: b.k, y: yOf(i), vy: -rnd(60, 160), r: 0, vr: rnd(-3, 3), vx: rnd(-140, 140) })); g.tower = []; g.tcam = 0; g.cam = 0; setTimeout(() => !env.ended && spawn(), 800); }
      g.collapse = collapse;
      function warm() { if (g.warm > 0 || g.cold < 8) { if (g.cold < 8) env.float(CX, 150, '手还热乎着', '#cfe8f0', 16); return; } g.warm = 1.2; g.cold = Math.max(0, g.cold - 70); S.noise(0, .5, 900, .08, 'lowpass'); env.float(130, 450, '哈——搓搓手', '#e8f6ff', 18); for (let i = 0; i < 8; i++) env.burst(100, 420, 1, { colors: ['rgba(255,255,255,.7)'], speed: 40, up: 60, size: 9, life: 1 }); }
      const btn = { x: 640, y: 392, w: 220, h: 50 };
      g.pointer = (k, x, y) => { if (k !== 'down') return; if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) { warm(); return; } g.tap(); };
      g.tap = () => { if (g.warm > 0 || !g.cur || g.drop) return; if (g.cold > 45) { g.lag = .12 * (g.cold - 45) / 55 + .04; g.cur.lagging = true; } else g.lag = 0; if (g.lag > 0) { g.pending = g.lag; env.float(g.cur.x, 150, '手僵了…', '#9fc8ff', 15); } else land(); };
      g.key = (k, down) => { if (!down) return false; if (k === ' ' || k === 'Enter' || k === 'ArrowDown') { g.tap(); return true; } if (k === 'h' || k === 'H') { warm(); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['整托', g.pallets], ['层', `${g.tower.length}/${PER}`], ['手', g.cold > 70 ? '冻僵' : g.cold > 40 ? '发凉' : '暖', g.cold > 70 ? '#8fb8ff' : null]];
      g.playBox = { x: 20, y: 444, w: 600, h: 72 };
      g.hint = () => g.boxes < 2 ? '看准时机点一下，箱子对齐落下' : (g.cold > 60 ? '手快冻僵了：点右下“哈气暖手”' : null);
      g.update = dt => {
        g.pf += dt; g.cam += (g.tcam - g.cam) * Math.min(1, dt * 5); g.cold = Math.min(100, g.cold + (g.warm > 0 ? 0 : 3.4) * dt); if (g.warm > 0) g.warm -= dt;
        if (g.pending > 0) { g.pending -= dt; if (g.pending <= 0) land(); }
        if (g.cur && g.warm <= 0 && !(g.pending > 0)) { const c = g.cur; c.x += c.dir * c.v * dt; const lim = PW + 40; if (c.x > CX + lim) { c.x = CX + lim; c.dir = -1; } if (c.x < CX - lim) { c.x = CX - lim; c.dir = 1; } }
        if (g.drop) { const d = g.drop; d.vy += 2600 * dt; d.y += d.vy * dt; const ty = yOf(g.tower.length); if (d.y >= ty) { g.drop = null; resolve(d); } }
        g.falling.forEach(f => { f.vy += 1500 * dt; f.y += f.vy * dt; f.x += f.vx * dt; f.r += f.vr * dt; }); g.falling = g.falling.filter(f => f.y < 700);
        g.tower.forEach(b => b.t += dt);
        if (g.auto && g.cur && !g.drop && g.warm <= 0) { if (g.auto === 'good') { if (g.cold > 55) warm(); else if (Math.abs(g.cur.x - topX()) < 3 + g.cur.v * .018) g.tap(); } else if (Math.random() < dt * .8) g.tap(); }
      };
      g.draw = ctx => {
        ctx.save(); ctx.beginPath(); ctx.rect(20, 66, 600, 450); ctx.clip();
        const bg = ctx.createLinearGradient(0, 66, 0, 516); bg.addColorStop(0, 'rgba(120,170,215,.34)'); bg.addColorStop(1, 'rgba(30,50,80,.55)'); ctx.fillStyle = bg; ctx.fillRect(20, 66, 600, 450);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(40 + i * 120, 66, 6, 450); }
        ctx.translate(0, g.cam);
        // 托盘 + 地面
        ctx.fillStyle = '#4a5866'; ctx.fillRect(20, BASE_Y + 22, 600, 90); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(20, BASE_Y + 22, 600, 3);
        U.rr(ctx, CX - PW / 2 - 12, BASE_Y + 2, PW + 24, 22, 4, '#a07a46', '#4a3418', 2); ctx.fillStyle = '#7a5a30'; for (let i = 0; i < 5; i++) ctx.fillRect(CX - PW / 2 + i * (PW / 4.5), BASE_Y + 8, 14, 12);
        g.tower.forEach((b, i) => { const y = yOf(i); const sq = b.t < .15 ? 1 + .12 * Math.sin(b.t / .15 * Math.PI) : 1; ctx.drawImage(box(b.k, Math.round(b.w)), b.x - b.w / 2, y + (1 - sq) * BH * 3, b.w, BH * sq); });
        g.falling.forEach(f => { ctx.save(); ctx.translate(f.x, f.y + BH / 2); ctx.rotate(f.r); ctx.drawImage(box(f.k, Math.max(8, Math.round(f.w))), -f.w / 2, -BH / 2, f.w, BH); ctx.restore(); });
        if (g.drop) { ctx.globalAlpha = .9; ctx.drawImage(box(g.drop.k, Math.round(g.drop.w)), g.drop.x - g.drop.w / 2, g.drop.y, g.drop.w, BH); ctx.globalAlpha = 1; }
        // 轨道 + 吊钩
        const trackY = yOf(g.tower.length) - 150 + 0; ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(20, 66, 600, 450); ctx.clip();
        ctx.fillStyle = '#3a4654'; ctx.fillRect(20, 96, 600, 8); ctx.fillStyle = '#7a8a9a'; ctx.fillRect(20, 96, 600, 2);
        if (g.cur) { const c = g.cur; ctx.strokeStyle = '#2a323c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x, 104); ctx.lineTo(c.x, 138); ctx.stroke(); U.rr(ctx, c.x - 10, 100, 20, 12, 3, '#d8a830', '#6a4a10', 2); ctx.drawImage(box(c.k, Math.round(c.w)), c.x - c.w / 2, 138, c.w, BH);
          const top = topX(); ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(160,230,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x - c.w / 2, 166); ctx.lineTo(c.x - c.w / 2, 400); ctx.moveTo(c.x + c.w / 2, 166); ctx.lineTo(c.x + c.w / 2, 400); ctx.stroke(); ctx.setLineDash([]); }
        // 冻僵白霜
        const fr = g.cold / 100; if (fr > .3) { const rg = ctx.createRadialGradient(320, 290, 140, 320, 290, 400); rg.addColorStop(0, 'rgba(210,235,255,0)'); rg.addColorStop(1, `rgba(210,235,255,${(fr - .3) * .6})`); ctx.fillStyle = rg; ctx.fillRect(20, 66, 600, 450); }
        ctx.restore();
        U.panel(ctx, 628, 78, 246, 290, 16); U.txt(ctx, '冻品托盘', 751, 108, 18, '#cfeeff', 'center', true);
        for (let i = 0; i < PER; i++) { const on = i < g.tower.length; U.rr(ctx, 694 + (i % 4) * 34, 206 - Math.floor(i / 4) * 30, 30, 26, 5, on ? U.shade(KINDS[(i + 1) % 5][0], .1) : 'rgba(255,255,255,.08)', 'rgba(255,255,255,.3)', 1.5); }
        U.txt(ctx, `${g.pallets} 托 · 共 ${g.boxes} 箱`, 751, 262, 20, '#ffe27a', 'center', true); U.txt(ctx, `整整齐齐 ${g.perfect} 次 · 最长连 ${g.maxCombo}`, 751, 288, 13, '#d6e6f0', 'center'); U.txt(ctx, `掉地上 ${g.misses} 箱 · 塌了 ${g.collapses} 垛`, 751, 310, 13, '#d6e6f0', 'center');
        U.rr(ctx, 666, 330, 170, 12, 6, 'rgba(0,0,0,.4)'); U.rr(ctx, 666, 330, Math.max(8, 170 * (1 - g.cold / 100)), 12, 6, g.cold > 70 ? '#7aa8ff' : '#ffb870'); U.txt(ctx, g.warm > 0 ? '哈着气呢…' : `手温 ${Math.round(100 - g.cold)}`, 751, 358, 13, '#e0efff', 'center');
        ctx.save(); U.glossy(ctx, btn.x, btn.y, btn.w, btn.h, 14, g.warm > 0 ? '#6a7a8a' : '#4a86c8'); U.txt(ctx, '哈气暖手 H', btn.x + btn.w / 2, btn.y + 31, 17, '#fff', 'center', true); ctx.restore();
        U.txt(ctx, '点击 / 空格：落箱', 750, 474, 13, 'rgba(230,240,255,.65)', 'center');
      };
      g.final = () => { const q = clamp(g.boxes / 28, 0, 1) * .8 + clamp(g.perfect / Math.max(1, g.boxes) / .5, 0, 1) * .2 - g.collapses * .08 - Math.min(.1, g.misses * .02); return { quality: clamp(q, 0, 1), score: g.boxes, summary: `码了 ${g.pallets} 整托，共 ${g.boxes} 箱。`, lines: [`整托 ${g.pallets} 个，一共码了 ${g.boxes} 箱`, `整整齐齐 ${g.perfect} 次，最长连续 ${g.maxCombo}`, g.collapses ? `塌了 ${g.collapses} 垛，重码耽误了工夫` : '一垛没塌，稳当', g.misses ? `掉地上 ${g.misses} 箱，要算损耗` : ''].filter(Boolean), stats: { boxes: g.boxes, pallets: g.pallets, perfect: g.perfect, collapses: g.collapses, misses: g.misses } }; };
      return g;
    }
  });
})();
