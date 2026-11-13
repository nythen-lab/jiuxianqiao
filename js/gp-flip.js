// v1.0.2 · 药厂夜班 → 翻牌配对（记忆翻牌）：先给你看一眼，再盖上；每次翻两张，配上就收走，配错扣一次机会。
(function () {
  const GP = window.GP, U = GP.u, S = GP.S, { rnd, ri, pick, clamp, ease } = U;
  const BOARDS = [[3, 4], [4, 4], [4, 5], [4, 5]], LIVES = 6;
  const KINDS = ['药盒', '针管', '棉签', '试剂管', '口罩', '体温计', '消毒瓶', '胶囊', '滴管', '手套', '纱布', '听诊器'];
  const cols = ['#d8584a', '#3f8ec4', '#e0b030', '#4a9a5a', '#8a62b8', '#e07a3a', '#2aa6a0', '#c0508a', '#6a7ab8', '#9a7a40', '#7a9a30', '#c06060'];
  const spr = {};
  function face(k, w, h) { const key = k + '_' + w; if (spr[key]) return spr[key]; return spr[key] = U.mk(w, h, (g, ww, hh) => {
    const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#fffdf4'); gr.addColorStop(1, '#e8dfc6'); g.beginPath(); g.roundRect(1.5, 1.5, ww - 3, hh - 3, 9); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#6a5a40'; g.stroke();
    const c = cols[k], cx = ww / 2, cy = hh / 2 - 6, s = Math.min(ww, hh) / 70; g.save(); g.translate(cx, cy); g.scale(s, s); g.lineJoin = 'round'; g.lineWidth = 2.4; g.strokeStyle = '#2a2018';
    const rr = (x, y, w, h, r, f) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fillStyle = f; g.fill(); g.stroke(); };
    if (k === 0) { rr(-24, -14, 48, 28, 4, c); rr(-24, -14, 48, 9, 4, U.shade(c, .35)); g.fillStyle = '#fff'; g.fillRect(-4, 0, 8, 2); g.fillRect(-1, -3, 2, 8); }
    else if (k === 1) { rr(-24, -5, 38, 10, 3, '#e8f2f8'); rr(14, -9, 5, 18, 2, '#888'); g.beginPath(); g.moveTo(19, 0); g.lineTo(30, 0); g.stroke(); rr(-30, -8, 6, 16, 2, c); g.fillStyle = c; g.fillRect(-16, -3, 22, 6); }
    else if (k === 2) { g.strokeStyle = '#2a2018'; rr(-28, -2.5, 56, 5, 2.5, '#d8c8a8'); g.beginPath(); g.arc(-28, 0, 6, 0, 7); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); g.arc(28, 0, 6, 0, 7); g.fill(); g.stroke(); }
    else if (k === 3) { rr(-8, -24, 16, 44, 5, '#e8f4fa'); g.fillStyle = c; g.fillRect(-6, -2, 12, 20); rr(-10, -28, 20, 8, 3, '#2a2a2a'); }
    else if (k === 4) { rr(-26, -14, 52, 28, 12, '#bfe4f2'); g.beginPath(); g.moveTo(-26, -4); g.quadraticCurveTo(-36, 0, -26, 8); g.moveTo(26, -4); g.quadraticCurveTo(36, 0, 26, 8); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(-18, -4); g.lineTo(18, -4); g.moveTo(-18, 2); g.lineTo(18, 2); g.stroke(); }
    else if (k === 5) { rr(-30, -4, 48, 8, 4, '#e8f2f8'); g.fillStyle = c; g.fillRect(-26, -2, 28, 4); g.beginPath(); g.arc(24, 0, 9, 0, 7); g.fillStyle = c; g.fill(); g.stroke(); }
    else if (k === 6) { rr(-14, -6, 28, 26, 7, '#cfeaf0'); g.fillStyle = c; g.fillRect(-12, 6, 24, 12); rr(-6, -16, 12, 11, 3, '#fff'); rr(-9, -22, 18, 7, 3, '#2a8ac0'); }
    else if (k === 7) { g.save(); g.rotate(-.5); rr(-22, -9, 22, 18, 9, c); rr(0, -9, 22, 18, 9, '#f4f0e4'); g.restore(); }
    else if (k === 8) { rr(-3, -22, 6, 36, 3, '#e8f2f8'); g.beginPath(); g.moveTo(-3, 14); g.lineTo(0, 24); g.lineTo(3, 14); g.fillStyle = '#e8f2f8'; g.fill(); g.stroke(); rr(-9, -30, 18, 12, 6, c); }
    else if (k === 9) { rr(-18, -6, 34, 28, 7, '#f0f4f8'); for (let i = 0; i < 4; i++) rr(-16 + i * 8, -26 + (i === 1 || i === 2 ? -4 : 0), 6, 22, 3, '#f0f4f8'); rr(-24, 2, 10, 14, 5, '#f0f4f8'); }
    else if (k === 10) { g.save(); g.rotate(.15); rr(-22, -14, 44, 28, 3, '#f6f0e0'); g.strokeStyle = '#d8c8a0'; for (let i = -8; i <= 8; i += 6) { g.beginPath(); g.moveTo(-22, i); g.lineTo(22, i); g.stroke(); } g.fillStyle = c; g.fillRect(-4, -14, 8, 28); g.restore(); }
    else { g.beginPath(); g.arc(0, 8, 16, 0, 7); g.fillStyle = '#c8ccd2'; g.fill(); g.stroke(); g.beginPath(); g.arc(0, 8, 9, 0, 7); g.fillStyle = c; g.fill(); g.stroke(); g.beginPath(); g.moveTo(-14, -20); g.quadraticCurveTo(0, -4, 14, -20); g.stroke(); }
    g.restore(); g.fillStyle = '#4a3a28'; g.font = `700 ${Math.round(hh * .17)}px ${U.FONT}`; g.textAlign = 'center'; g.fillText(KINDS[k], ww / 2, hh - 8); }); }
  const back = (w, h) => spr['b' + w] || (spr['b' + w] = U.mk(w, h, (g, ww, hh) => { const gr = g.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#4a7ab0'); gr.addColorStop(1, '#2a4a78'); g.beginPath(); g.roundRect(1.5, 1.5, ww - 3, hh - 3, 9); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = '#1a2a48'; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.4; g.beginPath(); g.roundRect(7, 7, ww - 14, hh - 14, 6); g.stroke(); g.fillStyle = 'rgba(255,255,255,.88)'; const cx = ww / 2, cy = hh / 2, t = Math.min(ww, hh) * .11, L = Math.min(ww, hh) * .3; g.fillRect(cx - t, cy - L, t * 2, L * 2); g.fillRect(cx - L, cy - t, L * 2, t * 2); }));
  GP.reg('flip', {
    title: '翻牌配对 · 试剂盒对批号', dur: 75, minutes: 600, hours: 10, tint: 'rgba(14,20,30,.62)',
    help: ['桌上盖着一排试剂和药品。开局先让你看 2 秒，然后全部盖上。点一张翻开，再点一张——两张一样就配对收走。', '配错了：扣一次机会（一共 6 次），两张再盖回去。机会用光，质检就把你换下去了。', '配完一整桌，下一桌牌更多；每配完一桌还送你一点时间。记性好、少翻错，手艺就高。'],
    make(env) {
      const g = { tm: [], bi: 0, cards: [], first: null, second: null, lock: 0, lives: LIVES, pairs: 0, wrong: 0, boards: 0, combo: 0, maxCombo: 0, preview: 2.2, auto: null, autoT: 0, known: {}, pf: 0, W: 0, H: 0 };
      const later = (fn, ms) => g.tm.push({ t: ms / 1000, fn });
      let T0 = { w: 100, h: 112, ox: 0, oy: 0, cols: 4, rows: 3 };
      function deal() { const [r, c] = BOARDS[Math.min(g.bi, BOARDS.length - 1)], n = r * c / 2; const ks = U.shuffle ? U.shuffle(KINDS.map((_, i) => i)).slice(0, n) : KINDS.map((_, i) => i).sort(() => Math.random() - .5).slice(0, n); const arr = []; ks.forEach(k => { arr.push(k, k); }); arr.sort(() => Math.random() - .5);
        const AW = 600, AH = 400, w = Math.min(104, Math.floor((AW - (c - 1) * 10) / c)), h = Math.min(126, Math.floor((AH - (r - 1) * 10) / r)); T0 = { w, h, cols: c, rows: r, ox: 24 + (AW - (c * w + (c - 1) * 10)) / 2, oy: 74 + (AH - (r * h + (r - 1) * 10)) / 2 };
        g.cards = arr.map((k, i) => ({ k, i, x: T0.ox + (i % c) * (w + 10), y: T0.oy + Math.floor(i / c) * (h + 10), up: 0, tgt: 0, done: 0, shake: 0, glow: 0, spawn: -i * .03 })); g.first = g.second = null; g.preview = 2.2; g.lock = 0; g.known = {}; for (const cd of g.cards) cd.tgt = 1; }
      deal();
      const flipTo = (cd, v) => { cd.tgt = v; };
      function pick2(cd) {
        if (g.preview > 0 || g.lock > 0 || cd.done || cd.tgt === 1) return; S.tap(); flipTo(cd, 1); g.known[cd.i] = cd.k;
        if (!g.first) { g.first = cd; return; }
        g.second = cd; g.lock = .9; const a = g.first, b = g.second;
        later(() => { if (env.ended) return; if (a.k === b.k) { a.done = b.done = 1; a.glow = b.glow = 1; g.pairs++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); S.good(g.combo); S.clink && S.clink(); const x = (a.x + b.x) / 2 + T0.w / 2, y = (a.y + b.y) / 2 + T0.h / 2; env.float(x, y - 20, g.combo >= 3 ? `配对 ×${g.combo}` : '配上了', '#bff0a8', 22); env.burst(a.x + T0.w / 2, a.y + T0.h / 2, 8, { colors: ['#bff0a8', '#fff', '#ffe27a'], speed: 140, up: 70, size: 3, life: .5 }); env.burst(b.x + T0.w / 2, b.y + T0.h / 2, 8, { colors: ['#bff0a8', '#fff', '#ffe27a'], speed: 140, up: 70, size: 3, life: .5 });
            if (g.cards.every(c => c.done)) { g.boards++; g.bi++; env.addTime(8, 320, 100); S.win(); env.say(`第 ${g.boards} 桌对齐了！`, '#ffe9a8', 1.6); env.burst(320, 270, 30, { colors: ['#ffe27a', '#fff', '#bff0a8'], speed: 260, up: 150, size: 4.5, shape: 'star', life: 1 }); g.lock = 1.1; later(() => { if (!env.ended) deal(); }, 1000); return; } }
          else { g.wrong++; g.lives--; g.combo = 0; a.shake = b.shake = .4; S.bad(); env.shake(5); env.penalty(`配错了！还剩 ${Math.max(0, g.lives)} 次机会`, (a.x + b.x) / 2 + T0.w / 2, (a.y + b.y) / 2, { shake: 5 }); later(() => { if (env.ended) return; flipTo(a, 0); flipTo(b, 0); }, 250); if (g.lives <= 0) { env.say('机会用光了，被换下去了', '#ffb4a5', 2); later(() => !env.ended && env.end(g.final()), 900); } }
          g.first = g.second = null; if (g.lives > 0) g.lock = Math.max(g.lock, .35); }, 650);
      }
      g.pick2 = pick2;
      g.pointer = (k, x, y) => { if (k !== 'down') return; for (const cd of g.cards) if (x >= cd.x && x <= cd.x + T0.w && y >= cd.y && y <= cd.y + T0.h) { pick2(cd); return; } };
      g.key = () => false; g.setAuto = m => { g.auto = m || null; };
      g.hud = () => [['机会', '♥'.repeat(Math.max(0, g.lives)) || '—', g.lives <= 2 ? '#e8705a' : null], ['配对', g.pairs]];
      g.hint = () => g.pairs < 1 ? '先记住位置，盖上后点两张一样的' : null;
      g.update = dt => {
        g.pf += dt; g.tm.forEach(x => x.t -= dt); { const due = g.tm.filter(x => x.t <= 0); g.tm = g.tm.filter(x => x.t > 0); due.forEach(x => x.fn()); }
        if (g.preview > 0) { g.preview -= dt; if (g.preview <= 0) { g.cards.forEach(c => { if (!c.done) c.tgt = 0; }); S.whoosh && S.whoosh(); } } if (g.lock > 0) g.lock -= dt;
        g.cards.forEach(c => { c.spawn += dt; c.up += (c.tgt - c.up) * Math.min(1, dt * 14); if (c.shake > 0) c.shake -= dt; if (c.glow > 0) c.glow -= dt; });
        if (g.auto && g.preview <= 0 && g.lock <= 0 && !env.ended) { g.autoT += dt; if (g.autoT > .45) { g.autoT = 0; const open = g.cards.filter(c => !c.done && c.tgt === 0);
          if (g.auto === 'good') { if (g.first) { const m = open.find(c => c !== g.first && c.k === g.first.k); pick2(m || pick(open.filter(c => c !== g.first))); } else { const c0 = open[0]; if (c0) pick2(c0); } } else { pick2(pick(open)); } } }
      };
      g.draw = ctx => {
        U.panel(ctx, 14, 66, 620, 440, 18, { top: 'rgba(30,38,52,.86)', bot: 'rgba(16,22,32,.9)' });
        for (const c of g.cards) { if (c.done && c.glow <= 0 && c.up >= .99 && (c.dead = (c.dead || 0) + 1) > 0) { ctx.globalAlpha = .18; } const sx = Math.abs(Math.cos(c.up * Math.PI)); const shown = c.up > .5; ctx.save(); ctx.translate(c.x + T0.w / 2 + (c.shake > 0 ? Math.sin(c.shake * 60) * 4 : 0), c.y + T0.h / 2 - Math.sin(c.up * Math.PI) * 10); ctx.scale(Math.max(.03, sx), 1);
          if (c.glow > 0) { ctx.shadowColor = '#bff0a8'; ctx.shadowBlur = 20; }
          ctx.drawImage(shown ? face(c.k, T0.w, T0.h) : back(T0.w, T0.h), -T0.w / 2, -T0.h / 2, T0.w, T0.h); if (c.shake > 0 && shown) { ctx.fillStyle = 'rgba(255,60,50,.3)'; ctx.fillRect(-T0.w / 2, -T0.h / 2, T0.w, T0.h); } ctx.restore(); ctx.globalAlpha = 1; }
        if (g.preview > 0) { U.txt(ctx, `记住位置！${Math.ceil(g.preview)}`, 761, 392, 22, '#ffe27a', 'center', true, 'rgba(0,0,0,.7)'); }
        U.panel(ctx, 648, 78, 226, 270, 16); U.txt(ctx, '质检台', 761, 108, 18, '#cfe8ff', 'center', true); for (let i = 0; i < LIVES; i++) U.txt(ctx, '♥', 676 + i * 32, 152, 28, i < g.lives ? '#e8504a' : 'rgba(255,255,255,.18)', 'left', true);
        U.txt(ctx, `配对 ${g.pairs} 对`, 761, 200, 22, '#ffe27a', 'center', true); U.txt(ctx, `配完 ${g.boards} 桌`, 761, 230, 16, '#e0ecf8', 'center'); U.txt(ctx, `配错 ${g.wrong} 次 · 连对 ${g.combo}（最长 ${g.maxCombo}）`, 761, 258, 13, '#e0ecf8', 'center'); U.txt(ctx, `这一桌 ${g.cards.filter(c => c.done).length / 2}/${g.cards.length / 2}`, 761, 290, 14, '#bff0a8', 'center');
        U.txt(ctx, '点牌翻开，翻两张一样的', 761, 330, 12, 'rgba(230,240,255,.6)', 'center');
      };
      g.final = () => { const q = clamp(g.pairs / 22, 0, 1) * .85 + clamp(g.lives / LIVES, 0, 1) * .15 - (g.lives <= 0 ? .1 : 0); return { quality: clamp(q, 0, 1), score: g.pairs, summary: `配对 ${g.pairs} 对，配错 ${g.wrong} 次。`, lines: [`一共配对 ${g.pairs} 对，配完 ${g.boards} 桌`, g.wrong ? `配错 ${g.wrong} 次` : '一次没配错', g.lives <= 0 ? '机会用光，被质检换下去了' : `还剩 ${g.lives} 次机会`], stats: { pairs: g.pairs, wrong: g.wrong, boards: g.boards, lives: g.lives } }; };
      return g;
    }
  });
})();
