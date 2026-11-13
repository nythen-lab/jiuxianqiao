// v1.0.2 · 帮饭馆打杂 → 后厨拍蟑螂（打地鼠）：蟑螂从下水口钻出来，拖鞋拍下去；别拍老板娘端出来的汤碗。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const GX = 90, GY = 100, CW = 150, CH = 118;
  const roach = U.mk(80, 70, (g, w, h) => { g.translate(40, 38); g.strokeStyle = '#2a1608'; g.lineWidth = 2.4; g.lineCap = 'round'; [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]].forEach(([sx, k]) => { g.beginPath(); g.moveTo(sx * 10, k * 7); g.lineTo(sx * 28, k * 14 - 2); g.lineTo(sx * 32, k * 18 + 4); g.stroke(); }); g.beginPath(); g.moveTo(-5, -26); g.quadraticCurveTo(-18, -44, -26, -34); g.moveTo(5, -26); g.quadraticCurveTo(18, -44, 26, -34); g.stroke(); const gr = g.createRadialGradient(-6, -8, 2, 0, 0, 30); gr.addColorStop(0, '#a8602a'); gr.addColorStop(1, '#4a2a10'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 4, 17, 25, 0, 0, 7); g.fill(); g.lineWidth = 2; g.strokeStyle = '#1c0e04'; g.stroke(); g.beginPath(); g.ellipse(0, -22, 10, 8, 0, 0, 7); g.fillStyle = '#6a3a18'; g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,220,160,.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -14); g.lineTo(0, 28); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -24, 2, 0, 7); g.arc(4, -24, 2, 0, 7); g.fill(); });
  const bowl = U.mk(80, 70, (g, w, h) => { g.translate(40, 36); g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 24, 30, 7, 0, 0, 7); g.fill(); const gr = g.createLinearGradient(-30, 0, 30, 0); gr.addColorStop(0, '#d8d4c8'); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, '#c8c4b8'); g.fillStyle = gr; g.beginPath(); g.moveTo(-32, -8); g.quadraticCurveTo(-30, 24, 0, 24); g.quadraticCurveTo(30, 24, 32, -8); g.closePath(); g.fill(); g.lineWidth = 2; g.strokeStyle = '#6a6a60'; g.stroke(); g.fillStyle = '#e8a030'; g.beginPath(); g.ellipse(0, -8, 32, 9, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#4a9a3a'; g.beginPath(); g.arc(-8, -10, 3, 0, 7); g.arc(10, -7, 3, 0, 7); g.fill(); g.strokeStyle = '#2a60c0'; g.lineWidth = 3; g.beginPath(); g.moveTo(-24, 8); g.lineTo(24, 8); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let i = -10; i <= 10; i += 10) { g.beginPath(); g.moveTo(i, -20); g.quadraticCurveTo(i + 6, -30, i, -38); g.stroke(); } });
  GP.reg('oddjob', {
    title: '后厨拍蟑螂 · 打杂', dur: 38, minutes: 60, hours: 1, tint: 'rgba(24,18,12,.62)',
    help: ['后厨的下水口里钻出蟑螂：点（拍）它！拍得越快越稳，大个的蟑螂跑得快、分也高。', '老板娘会时不时端出一碗热汤放在灶边——那是客人的，别拍！拍了要扣时间，还得赔不是。', '钻出来太久没拍，蟑螂会跑掉，也算漏一只。'],
    make(env) {
      const g = { cells: [], score: 0, kills: 0, big: 0, escaped: 0, bowls: 0, combo: 0, maxCombo: 0, auto: null, timer: .5, swats: [], splats: [], pf: 0 };
      for (let i = 0; i < 9; i++) g.cells.push({ k: null, t: 0, life: 1, hit: 0 });
      const cellXY = i => [GX + (i % 3) * CW + CW / 2, GY + Math.floor(i / 3) * CH + CH / 2 + 8];
      function spawn() { const free = g.cells.map((c, i) => c.k ? -1 : i).filter(i => i >= 0); if (!free.length) return; const i = pick(free), r = Math.random(), c = g.cells[i]; const prog = env.t / env.dur; c.k = r < .16 ? 'bowl' : r < .38 ? 'big' : 'roach'; c.t = 0; c.life = c.k === 'big' ? clamp(.85 - prog * .25, .5, 1) : c.k === 'bowl' ? 1.3 : clamp(1.15 - prog * .35, .65, 1.2); c.hit = 0; S.tone(240, 360, .05, .06); }
      function tap(i) { const c = g.cells[i]; const [x, y] = cellXY(i); g.swats.push({ x, y, t: 0 }); if (!c.k || c.hit) { S.tone(200, 140, .05, .08); return; } if (c.k === 'bowl') { c.hit = 1; c.k = 'splat'; c.t = 0; g.bowls++; g.combo = 0; S.bad(); env.shake(8); env.addTime(-3, x, y - 40); env.penalty('拍翻了客人的汤！−3 秒', x, y - 10, { shake: 8 }); env.burst(x, y, 14, { colors: ['#e8a030', '#fff', '#4a9a3a'], speed: 190, up: 90, size: 4, life: .7 }); setTimeout(() => { c.k = null; }, 260); return; } const big = c.k === 'big'; c.hit = 1; c.k = 'squash'; c.t = 0; g.kills++; if (big) g.big++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.score += (big ? 3 : 1) * (g.combo >= 5 ? 2 : 1); S.thump ? S.thump() : S.thud(.3); S.good(g.combo); env.float(x, y - 36, big ? '大的！+3' : (g.combo >= 5 ? `×${g.combo}` : '+1'), big ? '#ffe27a' : '#e8f6d8', big ? 24 : 18); env.burst(x, y, big ? 12 : 7, { colors: ['#7a5a20', '#c8a050', '#fff'], speed: 150, up: 70, size: 3, life: .5 }); g.splats.push({ x, y, t: 0 }); setTimeout(() => { c.k = null; }, 220); }
      g.tap = tap;
      g.pointer = (k, x, y) => { if (k !== 'down') return; const cx = Math.floor((x - GX) / CW), cy = Math.floor((y - GY) / CH); if (cx >= 0 && cx < 3 && cy >= 0 && cy < 3) tap(cy * 3 + cx); };
      g.key = (k, down) => { if (!down) return false; const m = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 }; if (m[k] != null) { tap(m[k]); return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['拍死', g.kills], ['拍翻汤', g.bowls, g.bowls ? '#e8705a' : null]];
      g.hint = () => g.kills < 2 ? '点（拍）蟑螂，别拍汤碗' : null;
      g.update = dt => {
        g.pf += dt; g.timer -= dt; const prog = env.t / env.dur; if (g.timer <= 0) { spawn(); g.timer = clamp(.8 - prog * .35, .38, .9) + rnd(0, .25); if (Math.random() < .25) spawn(); }
        g.cells.forEach((c, i) => { if (c.k === 'roach' || c.k === 'big' || c.k === 'bowl') { c.t += dt; if (c.t > c.life) { if (c.k !== 'bowl') { g.escaped++; g.combo = 0; const [x, y] = cellXY(i); S.tone(300, 150, .12, .1); env.float(x, y - 30, '跑了', '#ffb09a', 16); } c.k = null; } else if (g.auto && c.t > .22 && c.hit === 0) { if (g.auto === 'good' && c.k !== 'bowl') tap(i); else if (g.auto === 'bad' && Math.random() < dt * 5) tap(i); } } else if (c.k === 'squash') c.t += dt; });
        g.swats.forEach(s => s.t += dt / .18); g.swats = g.swats.filter(s => s.t < 1); g.splats.forEach(s => s.t += dt / 1.2); g.splats = g.splats.filter(s => s.t < 1);
      };
      g.draw = ctx => {
        U.panel(ctx, GX - 20, GY - 16, CW * 3 + 40, CH * 3 + 30, 18, { top: 'rgba(70,62,52,.9)', bot: 'rgba(40,34,28,.92)' });
        for (let i = 0; i < 9; i++) { const [x, y] = cellXY(i), c = g.cells[i]; const gx = GX + (i % 3) * CW, gy = GY + Math.floor(i / 3) * CH; ctx.fillStyle = (i + Math.floor(i / 3)) % 2 ? 'rgba(200,190,170,.18)' : 'rgba(200,190,170,.1)'; ctx.fillRect(gx + 3, gy + 3, CW - 6, CH - 6);
          ctx.save(); ctx.beginPath(); ctx.rect(gx + 4, gy + 4, CW - 8, CH - 8); ctx.clip();
          const k = c.k && c.k !== 'squash' && c.k !== 'splat' ? ease.out(clamp(c.t / .16, 0, 1)) : 0, out = c.k && c.life ? clamp((c.t - (c.life - .18)) / .18, 0, 1) : 0, up = k * (1 - out);
          ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.ellipse(x, y + 24, 46, 17, 0, 0, 7); ctx.fill();
          if (c.k === 'roach' || c.k === 'big') { const s = c.k === 'big' ? 1.45 : 1; ctx.save(); ctx.translate(x, y + 26 - up * 46 * s); ctx.scale(s, s); ctx.drawImage(roach, -40, -38, 80, 70); ctx.restore(); }
          else if (c.k === 'bowl') { ctx.save(); ctx.translate(x, y + 26 - up * 44); ctx.drawImage(bowl, -40, -38, 80, 70); ctx.restore(); }
          else if (c.k === 'squash') { ctx.save(); ctx.translate(x, y + 6); ctx.scale(1.3, .32); ctx.globalAlpha = 1 - c.t / .22; ctx.drawImage(roach, -40, -38, 80, 70); ctx.restore(); }
          ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(x, y + 28, 46, 12, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = '#5a5046'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 24, 46, 17, 0, 0, 7); ctx.stroke();
          ctx.restore(); }
        g.splats.forEach(s => { ctx.fillStyle = `rgba(90,60,20,${.4 * (1 - s.t)})`; ctx.beginPath(); ctx.ellipse(s.x, s.y + 26, 22, 9, 0, 0, 7); ctx.fill(); });
        g.swats.forEach(s => { const k = s.t; ctx.save(); ctx.translate(s.x, s.y - 40 + k * 44); ctx.rotate(-.5 + k * .5); ctx.globalAlpha = 1 - Math.max(0, k - .6) / .4; ctx.fillStyle = '#d8a050'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 38, 0, 0, 7); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#6a4010'; ctx.stroke(); ctx.fillStyle = '#e8b868'; ctx.beginPath(); ctx.ellipse(-4, -6, 14, 22, 0, 0, 7); ctx.fill(); ctx.restore(); });
        U.panel(ctx, 640, 100, 234, 200, 16); U.txt(ctx, '后厨战况', 757, 130, 18, '#ffe9b8', 'center', true); U.txt(ctx, `拍死 ${g.kills}（大的 ${g.big}）`, 757, 168, 18, '#b6f59a', 'center', true); U.txt(ctx, `跑掉 ${g.escaped}`, 757, 196, 16, '#e9dcc0', 'center'); U.txt(ctx, `拍翻了汤 ${g.bowls}`, 757, 222, 16, g.bowls ? '#ff9c8a' : '#e9dcc0', 'center'); U.txt(ctx, `连拍 ${g.combo} · 最长 ${g.maxCombo}`, 757, 256, 15, '#ffe27a', 'center', true);
        U.txt(ctx, '点格子 / 数字键 1-9', 757, 330, 13, 'rgba(255,240,210,.6)', 'center');
      };
      g.final = () => { const q = clamp(g.score / 30, 0, 1) * .9 + (g.bowls === 0 ? .1 : 0) - g.bowls * .08; return { quality: clamp(q, 0, 1), score: g.score, summary: `拍死 ${g.kills} 只，拍翻 ${g.bowls} 碗汤。`, lines: [`拍死 ${g.kills} 只蟑螂（大的 ${g.big} 只）`, g.escaped ? `跑了 ${g.escaped} 只` : '一只没跑', g.bowls ? `拍翻了 ${g.bowls} 碗汤，老板娘直瞪眼` : '汤碗一个没碰，老板娘点了点头'], stats: { kills: g.kills, bowls: g.bowls, escaped: g.escaped } }; };
      return g;
    }
  });
})();
