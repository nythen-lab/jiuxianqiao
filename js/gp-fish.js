// v1.0.2 · 河边钓鱼 → 先盯浮漂等咬钩、抓时机提竿，再按住 / 松开控制“鱼钩区”追着鱼走，把进度条拉满。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const GX = 676, GY = 78, GW = 64, GH = 392;
  const FISH = [{ n: '鲫鱼', d: .35, c: '#9aa8b0' }, { n: '鲤鱼', d: .5, c: '#d89a3a' }, { n: '草鱼', d: .6, c: '#6a8a6a' }, { n: '鲶鱼', d: .75, c: '#5a5a62' }];
  if (CONFIG.fishKinds && CONFIG.fishKinds.length) { FISH.splice(0,FISH.length,...CONFIG.fishKinds.map((f,i)=>({n:f.name,d:[.35,.5,.6,.7][i%4],c:['#9aa8b0','#d89a3a','#6a8a6a','#5a5a62'][i%4]}))); }
  GP.fishBoot = function (kind, rng) {
    const R = rng || Math.random;
    return { phase: 'wait', pt: 0, biteAt: 1.2 + R() * 1.3, biteWin: 2.15, mercy: 1, hook: 160, hv: 0, hh: 168 - kind.d * 16, fish: 180, fv: 0, ft: 180, fcd: 1.1, prog: .36, held: false, drag: null, caught: false, lost: false, kind, d: kind.d, pf: 0, ripples: [], missedBite: false, inBar: 0, total: 0, outT: 0, auto: null, bob: 0, jump: 0, splashT: 0, endT: 0, _rng: R };
  };
  GP.fishStep = function (g, dt) {
    const R = g._rng || Math.random;
    const ev = {};
    const d = g.d || (g.kind && g.kind.d) || .4;
    if (g.phase === 'wait') {
      g.pt += dt;
      if (g.pt >= g.biteAt) { g.phase = 'bite'; g.pt = 0; ev.bite = 1; }
    } else if (g.phase === 'bite') {
      g.pt += dt;
      if (g.pt > g.biteWin) {
        if (g.mercy > 0) { g.mercy--; g.phase = 'wait'; g.pt = 0; g.biteAt = 0.7 + R() * 0.5; ev.mercy = 1; }
        else { g.missedBite = true; g.phase = 'lost'; ev.lost = 1; }
      }
    } else if (g.phase === 'fight') {
      g.pt += dt; g.total = (g.total || 0) + dt;
      g.fcd -= dt;
      if (g.fcd <= 0) {
        const local = R() < 0.72;
        const jump = local ? (70 + d * 30) * (R() < .5 ? -1 : 1) * (0.5 + R()) : (R() * (GH - 40) + 20 - g.fish);
        g.ft = clamp(g.fish + jump, 16, GH - 16);
        g.fcd = 1.25 + R() * 1.2 * (1.05 - d * 0.2);
      }
      const cap = 46 + d * 22;
      const want = clamp(g.ft - g.fish, -cap, cap);
      g.fv += (want - g.fv) * Math.min(1, dt * 1.5);
      g.fish = clamp(g.fish + g.fv * dt, 10, GH - 10);
      const top = 0, bot = GH - g.hh;
      if (g.drag != null) {
        const target = clamp(g.drag - g.hh / 2, top, bot);
        g.hv += ((target - g.hook) * 8 - g.hv * 3.2) * dt;
        g.hv = clamp(g.hv, -170, 170);
      } else {
        g.hv += (g.held ? -200 : 168) * dt;
        g.hv *= Math.exp(-dt * 0.65);
        g.hv = clamp(g.hv, -125, 110);
      }
      g.hook += g.hv * dt;
      if (g.hook < top) { g.hook = top; g.hv *= -0.12; }
      if (g.hook > bot) { g.hook = bot; g.hv *= -0.12; }
      const dist = Math.abs(g.fish - (g.hook + g.hh / 2));
      const inside = dist <= g.hh / 2 - 1;
      g.inb = inside;
      if (inside) { g.prog += dt * (0.15 - d * 0.015); g.inBar = (g.inBar || 0) + dt; g.outT = 0; ev.tick = 1; }
      else {
        g.outT = (g.outT || 0) + dt;
        if (g.outT > 0.38) g.prog -= dt * (0.07 + Math.min(0.14, (dist - g.hh / 2) / 180));
      }
      g.prog = clamp(g.prog, 0, 1);
      if (g.prog >= 1) { g.phase = 'done'; g.caught = true; ev.caught = 1; }
      else if (g.prog <= 0) { g.phase = 'lost'; ev.lost = 1; }
    }
    return ev;
  };
  GP.reg('fish', {
    title: '凉水河边 · 钓鱼', dur: 52, minutes: 60, hours: 1, tint: 'rgba(10,20,26,.5)',
    help: ['浮漂猛地往下一沉，马上点一下，或按空格，把竿提起来。不用拖浮漂。', '提竿之后，按住鼠标、空格或屏幕，绿色鱼钩区上升；松开就下降。也可以在右边竖条上上下拖。', '绿色区罩住鱼，进度才涨。短暂离开掉得慢。拉满就到手，掉光才脱钩。'],
    make(env) {
      const kind = pick(FISH);
      const g = GP.fishBoot(kind);
      g.pointer = (k, x, y) => { if (k === 'down') { g.held = true; g.p0y = y; g.drag = null; if (g.phase === 'bite') strike(); else if (g.phase === 'wait') early(); } else if (k === 'move' && g.held && g.phase === 'fight' && Math.abs(y - (g.p0y || y)) > 16) { g.drag = clamp(y - (GY + 24), 8, GH - 8); } else if (k === 'up') { g.held = false; g.drag = null; } };
      g.key = (k, down) => { if (k === 'space' || k === 'up') { g.held = down; g.drag = null; if (down) { if (g.phase === 'bite') strike(); else if (g.phase === 'wait') early(); } return true; } return false; };
      function early() { if (g.phase !== 'wait' || g.earlyDone) return; g.earlyDone = true; g.biteAt += 0.2; env.float(300, 300, '早了一点，再等它沉', '#ffd0a8', 20); S.tap(); g.ripples.push({ t: 0, x: 330, y: 360 }); }
      function strike() { g.phase = 'fight'; g.pt = 0; g.prog = .36; g.hook = 200; g.hv = 0; g.outT = 0; S.whoosh(); S.tone(500, 900, .1, .16); env.say('上钩了。按住上升，松开下降', '#bfe8ff', 2); env.shake(4); env.burst(330, 340, 16, { colors: ['#bfeaff', '#fff'], speed: 170, up: 120, size: 4, life: .7 }); g.struck = true; }
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['鱼', g.phase === 'wait' ? '等咬钩' : g.phase === 'bite' ? '快提竿！' : g.phase === 'fight' ? Math.round(g.prog * 100) + '%' : g.caught ? '到手' : '跑了', g.phase === 'bite' ? '#ffd24a' : null]];
      g.playBox = { x: GX - 36, y: 62, w: 238, h: 440 };
      g.hintPersistent = true;
      g.hint = () => g.phase === 'wait' ? '盯浮漂。下沉时点一下或按空格。不用拖。' : g.phase === 'bite' ? '沉了！点一下或按空格提竿' : g.phase === 'fight' ? '按住上升，松开下降。也可在绿条上拖。罩住鱼就涨。' : null;
      function finish(caught) { if (g.settled) return; g.settled = 1; g.phase = 'done'; g.caught = caught; g.endT = 0; if (caught) { S.win(); S.coin(); env.say(`钓上来一条${g.kind.n}！`, '#ffe9a8', 2.4); env.burst(330, 330, 36, { colors: ['#bfeaff', '#fff', '#ffe27a'], speed: 280, up: 220, size: 5, shape: 'star', life: 1.1 }); g.jump = 1; } else { S.buzz(); const why = g.missedBite ? '浮漂沉下去时慢了。点一下或按空格就能提竿，下次盯紧那一下。' : '绿色区离开鱼太久。按住让它上升，松开让它下降，小幅点按就能停住。'; env.say(why, '#ffb4a5', 2.6); g.failWhy = why; } }
      g.update = dt => {
        g.pf += dt; g.bob += dt; g.ripples.forEach(r => r.t += dt); g.ripples = g.ripples.filter(r => r.t < 1.5); if (Math.random() < dt * .8) g.ripples.push({ t: 0, x: rnd(120, 560), y: rnd(330, 440), s: 1 });
        if (g.auto) { if (g.phase === 'bite') strike(); else if (g.phase === 'fight') { g.held = g.auto === 'bad' ? false : (g.hook + g.hh / 2 + g.hv * .15 > g.fish); g.drag = null; } }
        const ev = GP.fishStep(g, dt);
        if (ev.bite) { S.noise(0, .2, 1800, .16, 'bandpass'); S.tone(300, 120, .2, .14); env.say('沉了！点一下或按空格', '#ffe27a', 1.4); g.splashT = 1; g.ripples.push({ t: 0, x: 330, y: 360, big: 1 }); }
        if (ev.mercy) env.say('慢了一拍。鱼又拱了拱，再盯着浮漂。', '#ffd0a8', 1.8);
        if (ev.caught) finish(true);
        if (ev.lost) { if (g.missedBite) env.penalty('提晚了，鱼吐钩跑了', 330, 300, { shake: 5 }); else env.penalty('绿区离开太久，鱼脱钩了', 330, 300, { shake: 5 }); finish(false); }
        if (ev.tick && g.inb && Math.floor(g.pf * 3) % 2 === 0) S.tone(900 + g.prog * 400, 900 + g.prog * 400, .02, .025);
        if (g.phase === 'done') { g.endT += dt; if (g.endT >= 1.5 && !env.ended) env.end(g.final()); if (g.jump > 0) g.jump = Math.max(0, g.jump - dt * .7); }
      };
      g.draw = ctx => {
        // 河面
        const wy = 250; const sky = ctx.createLinearGradient(0, 56, 0, wy); sky.addColorStop(0, '#6a8aa0'); sky.addColorStop(1, '#c4d4d8'); ctx.fillStyle = sky; ctx.fillRect(18, 62, 610, wy - 62); ctx.save(); ctx.beginPath(); ctx.roundRect(18, 62, 610, 440, 20); ctx.clip();
        ctx.fillStyle = '#4a6a48'; ctx.beginPath(); ctx.moveTo(18, 190); for (let x = 18; x <= 628; x += 30) ctx.lineTo(x, 180 + Math.sin(x * .05) * 16); ctx.lineTo(628, wy); ctx.lineTo(18, wy); ctx.fill(); ctx.fillStyle = '#34503a'; for (let i = 0; i < 6; i++) { const x = 60 + i * 100; ctx.fillRect(x, 140 + (i % 2) * 14, 7, 50); ctx.beginPath(); ctx.arc(x + 3, 138 + (i % 2) * 14, 24, 0, 7); ctx.fill(); }
        const wg = ctx.createLinearGradient(0, wy, 0, 502); wg.addColorStop(0, '#5f9bb2'); wg.addColorStop(1, '#1e4a60'); ctx.fillStyle = wg; ctx.fillRect(18, wy, 610, 252);
        ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = wy + 14 + i * 28; ctx.beginPath(); for (let x = 18; x <= 628; x += 10) ctx.lineTo(x, y + Math.sin(x * .04 + g.pf * 1.6 + i) * 3); ctx.stroke(); }
        g.ripples.forEach(r => { ctx.strokeStyle = `rgba(255,255,255,${.35 * (1 - r.t / 1.5)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(r.x, r.y, 10 + r.t * (r.big ? 60 : 30), 4 + r.t * (r.big ? 24 : 12), 0, 0, 7); ctx.stroke(); });
        ctx.restore();
        // 钓者：站在左岸
        U.person(ctx, 120, 262, { s: 1.5, face: 1, skin: '#e5b78f', shirt: '#6a7a5a', pants: '#3a4254', hair: '#2b2420', hat: '#caa86a', arm: 8 });
        const bx = 330, by = 352 + (g.phase === 'wait' ? Math.sin(g.bob * 2) * 2 : g.phase === 'bite' ? 14 + Math.sin(g.pf * 30) * 4 : g.phase === 'fight' ? 18 + Math.sin(g.pf * 18) * 6 : 0);
        ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(150, 236); ctx.lineTo(300, 140); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(300, 140); ctx.quadraticCurveTo(318, 250, bx, by - 8); ctx.stroke();
        if (g.phase !== 'done' || !g.caught) { ctx.save(); ctx.translate(bx, by); const gr = ctx.createLinearGradient(0, -10, 0, 12); gr.addColorStop(0, '#ff5a4a'); gr.addColorStop(.5, '#ff5a4a'); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, '#ddd'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, 7, 12, 0, 0, 7); ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = '#7a2a20'; ctx.stroke(); ctx.restore(); }
        if (g.phase === 'bite') { const k = .5 + .5 * Math.sin(g.pf * 20); U.txt(ctx, '！', bx, by - 52, 56, `rgba(255,226,90,${.6 + .4 * k})`, 'center', true, 'rgba(60,30,0,.9)'); ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 24 + g.pt * 20, 0, 7); ctx.stroke(); const left = 1 - g.pt / g.biteWin; U.rr(ctx, bx - 50, by + 40, 100, 9, 4.5, 'rgba(0,0,0,.5)'); U.rr(ctx, bx - 49, by + 41, Math.max(5, 98 * left), 7, 3.5, left < .35 ? '#e85d4a' : '#ffd24a'); }
        if (g.phase === 'fight') { ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 60 + Math.sin(g.pf * 3) * 20, by + 80); ctx.stroke(); ctx.setLineDash([]); }
        if (g.phase === 'done' && g.caught) { const k = 1 - g.jump; const fx = bx - 90 + k * 260, fy = 340 - Math.sin(Math.min(1, k * 1.4) * Math.PI) * 200 + (k > .7 ? (k - .7) * 200 : 0); drawFish(ctx, fx, Math.min(fy, 330), 56, kind, -Math.min(1, k * 2) * .5); }
        // 右侧：鱼竿“力道”条
        U.panel(ctx, GX - 36, 62, 238, 440, 20, { top: 'rgba(30,48,60,.92)', bot: 'rgba(14,26,34,.94)' }); U.txt(ctx, g.phase === 'fight' ? `${kind.n}在使劲` : g.phase === 'wait' ? '等鱼来' : g.phase === 'bite' ? '快提竿！' : g.caught ? '到手了' : '跑了', GX + 83, 98, 18, g.phase === 'bite' ? '#ffd24a' : '#d6efff', 'center', true);
        ctx.save(); ctx.beginPath(); ctx.roundRect(GX, GY + 22, GW, GH - 24, 14); ctx.clip(); const tg = ctx.createLinearGradient(0, GY + 22, 0, GY + GH); tg.addColorStop(0, '#2a6a8a'); tg.addColorStop(1, '#0e2a3a'); ctx.fillStyle = tg; ctx.fillRect(GX, GY + 22, GW, GH); ctx.strokeStyle = 'rgba(255,255,255,.07)'; for (let y = GY + 40; y < GY + GH; y += 30) { ctx.beginPath(); ctx.moveTo(GX, y); ctx.lineTo(GX + GW, y); ctx.stroke(); }
        if (g.phase === 'fight' || g.phase === 'done') { const hy = GY + 24 + g.hook; const hg = ctx.createLinearGradient(GX, 0, GX + GW, 0); hg.addColorStop(0, 'rgba(120,255,160,.45)'); hg.addColorStop(.5, 'rgba(180,255,200,.6)'); hg.addColorStop(1, 'rgba(120,255,160,.45)'); ctx.fillStyle = hg; ctx.fillRect(GX, hy, GW, g.hh); ctx.strokeStyle = g.inb ? '#d8ff9a' : '#6adc8a'; ctx.lineWidth = 3; ctx.strokeRect(GX + 1.5, hy + 1.5, GW - 3, g.hh - 3); drawFish(ctx, GX + GW / 2, GY + 24 + g.fish, 34, kind, 0); }
        ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(GX, GY + 22, GW, GH - 24, 14); ctx.stroke();
        // 进度
        const px = GX + 100; U.rr(ctx, px, GY + 22, 26, GH - 24, 13, 'rgba(0,0,0,.5)', 'rgba(255,255,255,.35)', 1.5); const pg = ctx.createLinearGradient(0, GY + GH, 0, GY + 22); pg.addColorStop(0, '#d8402a'); pg.addColorStop(.4, '#f0c24a'); pg.addColorStop(1, '#7fe06a'); const ph = (GH - 28) * g.prog; if (ph > 2) { ctx.save(); ctx.beginPath(); ctx.roundRect(px + 2, GY + GH - 2 - ph, 22, ph, 10); ctx.fillStyle = pg; ctx.fill(); ctx.restore(); }
        U.txt(ctx, '进度', px + 13, GY + GH + 24, 13, '#cfe8f0', 'center'); U.txt(ctx, g.held ? '按住中 ↑' : '松开 ↓', GX + 32, GY + GH + 24, 13, '#bfd8e4', 'center');
      };
      function drawFish(ctx, x, y, s, k, rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); const gr = ctx.createLinearGradient(0, -s / 3, 0, s / 3); gr.addColorStop(0, U.shade(k.c, .3)); gr.addColorStop(.6, k.c); gr.addColorStop(1, U.shade(k.c, -.35)); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-s / 2, 0); ctx.quadraticCurveTo(-s * .1, -s * .45, s * .35, -s * .08); ctx.lineTo(s * .55, -s * .3); ctx.lineTo(s * .52, s * .3); ctx.lineTo(s * .35, s * .08); ctx.quadraticCurveTo(-s * .1, s * .45, -s / 2, 0); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = U.shade(k.c, -.6); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-s * .3, -s * .06, s * .07, 0, 7); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-s * .31, -s * .06, s * .035, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-s * .05, 0, s * .2, -1, 1); ctx.stroke(); ctx.restore(); }
      g.final = () => { const q = g.caught ? clamp(.74 + (g.inBar / Math.max(1, g.total)) * .26, 0, 1) : g.struck ? .25 : .1; return { quality: q, score: g.caught ? 1 : 0, summary: g.caught ? `钓上一条${kind.n}。` : '鱼跑了。', lines: [g.caught ? `钓上来一条${kind.n}，用了 ${g.total.toFixed(0)} 秒` : g.missedBite ? '浮漂沉下去时慢了一步，鱼吐钩跑了' : '拉到一半鱼脱钩了', g.caught ? `鱼钩区罩住鱼的时间占 ${Math.round(g.inBar / Math.max(1, g.total) * 100)}%` : '下次追着鱼走，别让绿色区离开它'], stats: { caught: g.caught, fish: kind.n } }; };
      return g;
    }
  });
})();
