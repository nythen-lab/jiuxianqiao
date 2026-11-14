// v1.0.2 · 帮人排队占位 → 三峰纸牌（TriPeaks 接龙）+ 排队反应：打牌打发时间；队伍往前挪时要及时跟上，慢了会被人插队。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const CWd = 52, CHt = 74, UX = 54, OX = 38, ROWY = [84, 124, 164, 204];
  const RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITC = ['#1c1c22', '#c8322e', '#1c1c22', '#c8322e'];
  const suit = (ctx, s, x, y, z) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(z / 20, z / 20); ctx.fillStyle = SUITC[s]; ctx.beginPath();
    if (s === 1) { ctx.moveTo(0, 9); ctx.bezierCurveTo(-14, -1, -9, -12, 0, -5); ctx.bezierCurveTo(9, -12, 14, -1, 0, 9); }
    else if (s === 3) { ctx.moveTo(0, -11); ctx.lineTo(9, 0); ctx.lineTo(0, 11); ctx.lineTo(-9, 0); }
    else if (s === 0) { ctx.moveTo(0, -11); ctx.bezierCurveTo(-16, 1, -9, 10, 0, 4); ctx.bezierCurveTo(9, 10, 16, 1, 0, -11); ctx.moveTo(-1, 3); ctx.lineTo(-4, 11); ctx.lineTo(4, 11); ctx.lineTo(1, 3); }
    else { ctx.arc(0, -6, 5.2, 0, 7); ctx.moveTo(-4, 3); ctx.arc(-6, 3, 5.2, 0, 7); ctx.moveTo(10, 3); ctx.arc(6, 3, 5.2, 0, 7); ctx.moveTo(-1, 2); ctx.lineTo(-4, 11); ctx.lineTo(4, 11); ctx.lineTo(1, 2); }
    ctx.fill(); ctx.restore();
  };
  const faceCache = {}, backSpr = U.mk(CWd, CHt, (g, w, h) => { U.glossy(g, 1, 1, w - 2, h - 2, 7, '#2f5aa0', { sb: 4, so: 2 }); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.4; g.strokeRect(6, 6, w - 12, h - 12); g.strokeStyle = 'rgba(255,255,255,.22)'; for (let i = -h; i < w; i += 8) { g.beginPath(); g.moveTo(i, 6); g.lineTo(i + h, h - 6); g.stroke(); } g.fillStyle = 'rgba(255,230,160,.85)'; g.beginPath(); g.arc(w / 2, h / 2, 9, 0, 7); g.fill(); g.fillStyle = '#2f5aa0'; g.beginPath(); g.arc(w / 2, h / 2, 5, 0, 7); g.fill(); });
  const face = (r, s) => { const key = r + '_' + s; if (faceCache[key]) return faceCache[key]; return faceCache[key] = U.mk(CWd, CHt, (g, w, h) => { U.glossy(g, 1, 1, w - 2, h - 2, 7, '#fbf6ea', { sb: 4, so: 2, stroke: '#6a5a44' }); const c = SUITC[s]; U.txt(g, RANK[r], 6, 20, 17, c, 'left', true); suit(g, s, 13, 31, 11); if (r >= 10) { g.fillStyle = U.shade(s % 2 ? '#e8a090' : '#90a0c8', 0); g.globalAlpha = .55; g.beginPath(); g.roundRect(14, 26, w - 28, h - 40, 6); g.fill(); g.globalAlpha = 1; U.txt(g, ['J', 'Q', 'K'][r - 10], w / 2, h / 2 + 18, 30, c, 'center', true); } suit(g, s, w / 2, h / 2 + (r >= 10 ? 28 : 5), r >= 10 ? 14 : 24); g.save(); g.translate(w - 7, h - 8); g.rotate(Math.PI); U.txt(g, RANK[r], 0, 0, 14, c, 'left', true); g.restore(); }); };
  GP.reg('queue', {
    title: '帮人排队占位 · 纸牌', dur: 74, minutes: 120, hours: 2, tint: 'rgba(14,18,20,.6)',
    help: ['排队很无聊，边等边玩三峰接龙：点牌山上没被压着的牌，比手里这张大 1 或小 1（A 和 K 也算挨着）就能打出去。', '没牌可出时，点左边牌堆翻一张新的。连着出牌有连击。', '叫号屏“叮”一声，队伍往前挪了：赶紧点右边的“跟上！”（或按空格），慢了会被人插队，名次往后掉。'],
    make(env) {
      const g = { tab: [], stock: [], waste: null, combo: 0, maxCombo: 0, cleared: 0, bestCombo: 0, draws: 0, bad: 0, pos: 6, start: 6, cutins: 0, steps: 0, miss: 0, nextEv: 5.5, prompt: null, evN: 0, fly: [], shake: [], people: [], pf: 0, auto: null, autoT: 0, hl: null, anim: [], over: false, shift: 0, window: 100 };
      const deck = []; for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) deck.push({ r, s }); for (let i = deck.length - 1; i > 0; i--) { const j = ri(0, i); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      const rows = [[1.5, 4.5, 7.5], [1, 2, 4, 5, 7, 8], [.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5], [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]];
      rows.forEach((xs, ri2) => xs.forEach(x => { const c = deck.pop(); g.tab.push({ r: c.r, s: c.s, x, row: ri2, gone: false, up: ri2 === 3, flip: ri2 === 3 ? 1 : 0, px: OX + x * UX, py: ROWY[ri2] }); }));
      g.stock = deck.slice(0, 23); g.waste = deck[23]; g.waste.show = 1;
      const covered = c => g.tab.some(o => !o.gone && o.row === c.row + 1 && Math.abs(o.x - c.x) === .5);
      const adj = (a, b) => { const d = Math.abs(a - b); return d === 1 || d === 12; };
      const playable = c => !c.gone && !covered(c) && adj(c.r, g.waste.r);
      const anyPlay = () => g.tab.some(playable);
      function setPeople() { g.people = []; for (let i = 0; i < g.pos + 3; i++) g.people.push({ me: i === g.pos, look: { skin: pick(['#e5b78f', '#d9a073', '#f0c7a0']), shirt: pick(['#c0613f', '#4a78c0', '#4aa070', '#a06ac0', '#d8a83a', '#6a7a8a']), pants: pick(['#3b4a63', '#4a4036', '#2f3a46']), hair: pick(['#2b2420', '#4a3426', '#1a1a1e']), bag: Math.random() < .4 ? '#7a4a2a' : null }, x: 0, step: rnd(0, 6) }); }
      setPeople();
      const slotX = i => 862 - 52 - i * 31;
      g.people.forEach((p, i) => p.x = slotX(i));
      // 打牌
      function playCard(c) {
        if (!playable(c)) { g.shake.push({ c, t: 0 }); g.bad++; g.combo = 0; S.tone(260, 200, .16, .18); env.float(c.px + CWd / 2, c.py, covered(c) ? '被压着' : '差一点才行', '#ff9c8a', 18); return; }
        c.gone = true; g.cleared++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.fly.push({ c, t: 0, from: [c.px, c.py] }); g.waste = { r: c.r, s: c.s, show: 1 }; S.good(g.combo); S.tone(1400, 1900, .05, .06);
        if (g.combo >= 3) env.float(OX + 4.5 * UX + CWd / 2, 330, `连击 ×${g.combo}`, '#ffe27a', 22);
        g.tab.forEach(o => { if (!o.gone && !o.up && !covered(o)) { o.up = true; o.flipT = 0; S.tone(700, 900, .05, .06); } });
        if (g.tab.every(o => o.gone)) { env.say('三座峰清光了！', '#ffe9a8', 2); S.win(); env.burst(300, 200, 40, { colors: ['#ffe27a', '#fff', '#a8f0a0'], speed: 300, up: 160, size: 6, shape: 'rect', life: 1.3 }); g.allClear = true; }
      }
      function drawStock() { if (!g.stock.length) { S.tap(); env.float(130, 360, '牌堆空了', '#cfd8e0', 18); return; } const c = g.stock.pop(); g.waste = { r: c.r, s: c.s, show: 1, fresh: 1 }; g.draws++; g.combo = 0; S.tone(500, 640, .06, .1); S.noise(0, .05, 2400, .06, 'highpass'); }
      function step() {
        if (!g.prompt) return; g.prompt = null; g.pos = Math.max(0, g.pos - 1); g.steps++; g.shift = 1; S.good(5); S.chime(); env.float(770, 150, '跟上了！', '#bfe8a8', 22);
        const me = g.people.findIndex(p => p.me); if (me >= 0) g.people.splice(me - 1 >= 0 ? me - 1 : 0, 1) && 0; g.people.forEach(p => { p.mv = 1; }); if (g.pos === 0) { g.over = true; env.say('轮到你了！号码牌递上去', '#ffe9a8', 2); S.win(); setTimeout(() => { if (!env.ended) env.end(g.final()); }, 1400); }
      }
      function cutIn() { g.prompt = null; g.cutins++; g.miss++; g.pos++; const me = g.people.findIndex(p => p.me); g.people.splice(me, 0, { me: false, look: { skin: '#d9a073', shirt: '#c83a3a', pants: '#2f3a46', hair: '#1a1a1e', bag: null }, x: slotX(me) - 0, step: 0, cut: 1 }); env.penalty('有人插队了！你往后挪了一位', 770, 200, { shake: 6 }); S.tone(220, 120, .3, .22); }
      const cardAt = (x, y) => { let best = null; g.tab.forEach(c => { if (c.gone) return; if (x >= c.px && x <= c.px + CWd && y >= c.py && y <= c.py + CHt) { if (!best || c.row > best.row || (c.row === best.row)) best = c; } }); return best; };
      const stockBox = { x: 250, y: 332, w: CWd, h: CHt }, stepBtn = { x: 660, y: 330, w: 210, h: 56 };
      g.playCard = playCard; g.drawStock = drawStock; g.step = step; g.anyPlay = anyPlay; g.playable = playable;
      g.pointer = (k, x, y) => { if (k !== 'down' || g.over) return;
        if (x >= stepBtn.x && x <= stepBtn.x + stepBtn.w && y >= stepBtn.y && y <= stepBtn.y + stepBtn.h) { if (g.prompt) step(); else { S.tap(); env.float(765, 320, '还没轮到挪', '#cfd8e0', 16); } return; }
        if (x >= stockBox.x && x <= stockBox.x + stockBox.w && y >= stockBox.y && y <= stockBox.y + stockBox.h) { drawStock(); return; }
        const c = cardAt(x, y); if (c) { if (!c.up) { S.tap(); env.float(c.px + CWd / 2, c.py, '还没翻开', '#cfd8e0', 16); return; } playCard(c); } };
      g.key = k => { if (k === 'space') { if (g.prompt) step(); else drawStock(); return true; } if (k === 'h') { g.hl = { t: 0 }; return true; } return false; };
      g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['名次', g.pos === 0 ? '到窗口' : `第 ${g.pos + 1} 位`, g.cutins ? '#e8705a' : null], ['牌', g.cleared + '/28']];
      g.playBox = { x: 40, y: 90, w: 844, h: 410 };
      g.hint = () => g.cleared < 2 ? '点没被压着的牌：比手里的大 1 或小 1 就能出' : g.prompt ? '叮！快点右边的“跟上！”' : null;
      g.update = dt => {
        g.pf += dt; if (g.hl) { g.hl.t += dt; if (g.hl.t > 2.2) g.hl = null; }
        g.fly.forEach(f => f.t += dt / .2); g.fly = g.fly.filter(f => f.t < 1); g.shake.forEach(s => s.t += dt); g.shake = g.shake.filter(s => s.t < .3); g.tab.forEach(c => { if (c.up && c.flipT != null) { c.flipT += dt; if (c.flipT > .3) c.flipT = null; } });
        if (g.shift > 0) g.shift = Math.max(0, g.shift - dt * 3);
        g.people.forEach((p, i) => { const tx = slotX(i); p.x += (tx - p.x) * Math.min(1, dt * 7); p.step += dt * (Math.abs(tx - p.x) > 1 ? 14 : 0); });
        if (!g.over) { if (g.prompt) { g.prompt.t += dt; if (g.prompt.t > g.prompt.win) cutIn(); } else { g.nextEv -= dt; if (g.nextEv <= 0) { g.evN++; g.prompt = { t: 0, win: Math.max(2.1, 3.1 - g.evN * .15) }; g.nextEv = rnd(9, 12); S.tone(1200, 1200, .35, .2); S.tone(900, 900, .5, .16); env.say('叮——队伍往前挪了！', '#ffe9a8', 1.6); } } }
        if (g.auto && !g.over) { g.autoT += dt; if (g.autoT > (g.auto === 'bad' ? .5 : .32)) { g.autoT = 0; if (g.prompt && g.auto !== 'bad') { step(); return; } if (g.auto === 'bad') { const c = g.tab.find(o => !o.gone && o.up && !playable(o)); if (c) playCard(c); return; } const pc = g.tab.find(playable); if (pc) playCard(pc); else drawStock(); } }
      };
      // ---------- 画面 ----------
      g.draw = ctx => {
        U.panel(ctx, 16, 62, 612, 436, 20, { top: 'rgba(24,60,46,.92)', bot: 'rgba(14,38,30,.94)' });
        ctx.save(); ctx.globalAlpha = .1; for (let i = 0; i < 24; i++) { ctx.fillStyle = '#fff'; ctx.fillRect(30 + (i * 97) % 580, 70 + (i * 53) % 420, 2, 2); } ctx.restore();
        const order = g.tab.filter(c => !c.gone).sort((a, b) => a.row - b.row);
        order.forEach(c => { const sh = g.shake.find(s => s.c === c); const x = c.px + (sh ? Math.sin(sh.t * 70) * 4 * (1 - sh.t / .3) : 0), cov = covered(c); ctx.save(); const pl = c.up && playable(c);
          if (c.up) { if (c.flipT != null) { const k = clamp(c.flipT / .3, 0, 1); ctx.translate(x + CWd / 2, c.py + CHt / 2); ctx.scale(Math.abs(Math.cos(k * Math.PI / 2 + (k < .5 ? 0 : 0))) * (k < .5 ? 1 : 1) * 0 + (k < .5 ? 1 - k * 2 : (k - .5) * 2), 1); ctx.drawImage(k < .5 ? backSpr : face(c.r, c.s), -CWd / 2, -CHt / 2, CWd, CHt); } else { if (pl && ((g.hl) || (g.prompt == null && Math.floor(g.pf * 2) % 2 === 0 && false))) { ctx.shadowColor = '#8affc8'; ctx.shadowBlur = 16; } ctx.drawImage(face(c.r, c.s), x, c.py - (pl ? 2 : 0), CWd, CHt); if (pl) { ctx.strokeStyle = 'rgba(160,255,200,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, c.py - 2, CWd, CHt, 7); ctx.stroke(); } } }
          else { ctx.drawImage(backSpr, x, c.py, CWd, CHt); } ctx.restore(); });
        g.fly.forEach(f => { const k = ease.out(clamp(f.t, 0, 1)), tx = 316, ty = 332, x = f.from[0] + (tx - f.from[0]) * k, y = f.from[1] + (ty - f.from[1]) * k; ctx.drawImage(face(f.c.r, f.c.s), x, y, CWd, CHt); });
        // 牌堆与手牌
        U.txt(ctx, `牌堆 ${g.stock.length}`, 276, 424, 15, '#cfe8d8', 'center'); if (g.stock.length) { for (let i = 0; i < Math.min(3, g.stock.length); i++) ctx.drawImage(backSpr, stockBox.x - i * 2, stockBox.y - i * 2, CWd, CHt); } else U.rr(ctx, stockBox.x, stockBox.y, CWd, CHt, 7, 'rgba(0,0,0,.25)', 'rgba(255,255,255,.3)', 1.5);
        U.txt(ctx, '手里这张', 342, 424, 15, '#cfe8d8', 'center'); const w = g.waste; if (w) { const bump = w.fresh ? 0 : 0; ctx.save(); ctx.shadowColor = 'rgba(255,230,140,.55)'; ctx.shadowBlur = 14; ctx.drawImage(face(w.r, w.s), 316, 332, CWd, CHt); ctx.restore(); }
        U.txt(ctx, g.combo >= 2 ? `连击 ×${g.combo}` : '', 470, 376, 22, '#ffe27a', 'center', true); U.txt(ctx, g.allClear ? '清光了！' : anyPlay() ? '有牌能出' : '没牌能出，翻牌堆', 470, 410, 15, anyPlay() ? '#bfe8a8' : '#ffd6a0', 'center');
        // 右：叫号屏 + 队伍
        U.panel(ctx, 640, 62, 244, 196, 18, { top: 'rgba(46,52,60,.94)', bot: 'rgba(26,30,36,.94)' }); U.txt(ctx, '叫号窗口', 762, 92, 17, '#ffe9b8', 'center', true);
        U.rr(ctx, 662, 102, 200, 50, 8, '#101418', '#58606a', 2); const now = 100 + g.steps + g.cutins * 0; U.txt(ctx, g.pos === 0 ? '请你到窗口' : `请 A${String(g.window + g.steps * 1).padStart(3, '0')} 号`, 762, 136, 24, g.prompt ? '#ffe27a' : '#7aff9a', 'center', true);
        U.txt(ctx, `你的号：A${String(g.window + g.start).padStart(3, '0')}`, 762, 178, 14, '#cfd8e0', 'center');
        ctx.save(); ctx.beginPath(); ctx.rect(650, 176, 226, 76); ctx.clip(); U.rr(ctx, 650, 238, 226, 12, 4, 'rgba(255,255,255,.12)');
        const win = g.pos; g.people.slice().reverse().forEach(p => { const idx = g.people.indexOf(p); U.person(ctx, p.x, 246, { s: .52, face: 1, step: p.step, skin: p.look.skin, shirt: p.look.shirt, pants: p.look.pants, hair: p.look.hair, bag: p.look.bag }); if (p.me) { U.txt(ctx, '你', p.x, 186 + 18, 15, '#ffe27a', 'center', true, 'rgba(0,0,0,.8)'); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(p.x - 5, 212); ctx.lineTo(p.x + 5, 212); ctx.lineTo(p.x, 220); ctx.fill(); } else if (p.cut) { U.txt(ctx, '插队', p.x, 204, 12, '#ff9c8a', 'center', true, 'rgba(0,0,0,.8)'); } });
        ctx.restore(); U.txt(ctx, '← 排头', 664, 270, 12, 'rgba(255,255,255,.4)', 'left');
        // 跟上按钮
        const pulse = g.prompt ? .5 + .5 * Math.sin(g.pf * 14) : 0; ctx.save(); if (g.prompt) { ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 20 + pulse * 14; } U.glossy(ctx, stepBtn.x, stepBtn.y, stepBtn.w, stepBtn.h, 16, g.prompt ? '#e0a02e' : '#4a4a50'); U.txt(ctx, g.prompt ? '跟上！往前挪' : '等叫号……', stepBtn.x + stepBtn.w / 2, stepBtn.y + 36, 22, g.prompt ? '#2e1b06' : '#9a9aa0', 'center', true); ctx.restore();
        if (g.prompt) { const k = 1 - g.prompt.t / g.prompt.win; U.rr(ctx, stepBtn.x, stepBtn.y + stepBtn.h + 8, stepBtn.w, 10, 5, 'rgba(0,0,0,.5)'); U.rr(ctx, stepBtn.x + 1, stepBtn.y + stepBtn.h + 9, Math.max(6, (stepBtn.w - 2) * k), 8, 4, k < .35 ? '#e85d4a' : '#ffd24a'); }
        U.panel(ctx, 640, 424, 244, 74, 14); U.txt(ctx, g.cutins ? `被插队 ${g.cutins} 次` : '还没被人插队', 762, 454, 16, g.cutins ? '#ff9c8a' : '#bfe8a8', 'center', true); U.txt(ctx, `已往前挪 ${g.steps} 位（${g.start} 位 → ${g.pos === 0 ? '窗口' : '第 ' + (g.pos + 1) + ' 位'}）`, 762, 480, 13, '#e9dcc0', 'center');
      };
      g.final = () => { const cardQ = clamp(g.cleared / 22, 0, 1) + (g.allClear ? .2 : 0), qPos = clamp((g.start - g.pos) / g.start, 0, 1); const q = clamp(cardQ * .45 + qPos * .5 + .05 - g.cutins * .02, 0, 1); return { quality: q, score: g.cleared, summary: `打出 ${g.cleared} 张牌，排到第 ${g.pos + 1} 位，被插队 ${g.cutins} 次。`, lines: [g.pos === 0 ? '排到窗口了，号码牌顺利递上' : `只排到第 ${g.pos + 1} 位，雇主还得再等一会儿`, `打出 ${g.cleared} 张牌，最高连击 ×${g.maxCombo}`, g.cutins ? `被人插队 ${g.cutins} 次，名次往后掉了` : '每次都及时跟上，没被人插队'], stats: { cleared: g.cleared, pos: g.pos, cutins: g.cutins, steps: g.steps } }; };
      return g;
    }
  });
})();
