// v1.0.1 公园下棋：五子棋（石桌棋盘 · 落子动画与声音 · 三档电脑棋手）
(function () {
  const C = window.CONFIG, GG = C.gomoku, A = window.ART, G0 = window.G; const { pick, ri, clamp } = G0.util;
  const N = GG.size;
  // ================= 引擎 =================
  const E = {};
  E.empty = () => Array.from({ length: N }, () => new Array(N).fill(0));
  const DIR = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;
  E.five = (b, x, y) => { const c = b[y][x]; if (!c) return null; for (const [dx, dy] of DIR) { const line = [[x, y]]; for (const s of [1, -1]) { let i = 1; while (inb(x + dx * i * s, y + dy * i * s) && b[y + dy * i * s][x + dx * i * s] === c) { line.push([x + dx * i * s, y + dy * i * s]); i++; } } if (line.length >= 5) return line; } return null; };
  // 某个空点对 color 的价值：沿四个方向数连子与两端是否敞开
  const PAT = (n, open) => n >= 5 ? 100000 : n === 4 ? (open === 2 ? 10000 : open === 1 ? 1200 : 0) : n === 3 ? (open === 2 ? 1100 : open === 1 ? 120 : 0) : n === 2 ? (open === 2 ? 110 : open === 1 ? 12 : 0) : n === 1 ? (open === 2 ? 8 : 1) : 0;
  E.pointScore = (b, x, y, color) => {
    let total = 0, threes = 0, fours = 0;
    for (const [dx, dy] of DIR) { let n = 1, open = 0; for (const s of [1, -1]) { let i = 1; while (inb(x + dx * i * s, y + dy * i * s) && b[y + dy * i * s][x + dx * i * s] === color) { n++; i++; } if (inb(x + dx * i * s, y + dy * i * s) && b[y + dy * i * s][x + dx * i * s] === 0) open++; }
      const v = PAT(n, open); total += v; if (n === 3 && open === 2) threes++; if (n === 4 && open >= 1) fours++; }
    if (threes >= 2 || (fours >= 1 && threes >= 1) || fours >= 2) total += 8000;   // 双三 / 四三 / 双四
    return total;
  };
  E.cands = b => { const out = []; let any = false; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (b[y][x]) { any = true; continue; } let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { if (inb(x + dx, y + dy) && b[y + dy][x + dx]) { near = true; break; } } if (near) out.push([x, y]); } if (!any) out.push([N >> 1, N >> 1]); return out; };
  const heur = (b, x, y, me, defW) => { const opp = 3 - me; const c = Math.abs(x - (N >> 1)) + Math.abs(y - (N >> 1)); return E.pointScore(b, x, y, me) + E.pointScore(b, x, y, opp) * defW - c * .5; };
  E.ai = (b, me, level, rnd) => {
    rnd = rnd || Math.random; const cs = E.cands(b); if (cs.length === 1) return cs[0];
    const opp = 3 - me; const defW = level === 'easy' ? (rnd() < .3 ? .15 : .75) : level === 'medium' ? .95 : 1.05;
    // 能赢先赢；对手下一手就赢必须堵（简单档偶尔看漏）
    for (const [x, y] of cs) { b[y][x] = me; const w = !!E.five(b, x, y); b[y][x] = 0; if (w) return [x, y]; }
    if (!(level === 'easy' && rnd() < .2)) for (const [x, y] of cs) { b[y][x] = opp; const w = !!E.five(b, x, y); b[y][x] = 0; if (w) return [x, y]; }
    const sc = cs.map(([x, y]) => ({ x, y, s: heur(b, x, y, me, defW) })).sort((a, c) => c.s - a.s);
    if (level === 'easy') { const top = sc.slice(0, 4); const w = top.map((t, i) => Math.max(.1, 1 - i * .28)); let r = rnd() * w.reduce((a, c) => a + c, 0); for (let i = 0; i < top.length; i++) { r -= w[i]; if (r <= 0) return [top[i].x, top[i].y]; } return [top[0].x, top[0].y]; }
    if (level === 'medium') { if (rnd() < .12 && sc.length > 1) return [sc[1].x, sc[1].y]; return [sc[0].x, sc[0].y]; }
    // 困难：看一步对手的最好回应
    let best = null, bs = -1e12;
    sc.slice(0, 8).forEach(t => { b[t.y][t.x] = me; let worst = 0; E.cands(b).slice(0, 40).forEach(([ox, oy]) => { const v = E.pointScore(b, ox, oy, opp); if (v > worst) worst = v; }); b[t.y][t.x] = 0; const v = t.s - worst * .55 + rnd() * 30; if (v > bs) { bs = v; best = t; } });
    return [best.x, best.y];
  };
  E.play = (levelB, levelW, rnd) => { const b = E.empty(); let turn = 1; for (let i = 0; i < N * N; i++) { const [x, y] = E.ai(b, turn, turn === 1 ? levelB : levelW, rnd); b[y][x] = turn; if (E.five(b, x, y)) return turn; turn = 3 - turn; } return 0; };
  window.GOMOKU = { engine: E };

  // ================= 声音 =================
  const SFX = () => (window.MG && MG.sfx) || null;
  const snd = {
    black() { const s = SFX(); if (!s) return; s.tone(1250, 480, .07, .26); s.noise(0, .05, 2400, .22, 'bandpass'); },
    white() { const s = SFX(); if (!s) return; s.tone(1500, 620, .06, .22); s.noise(0, .04, 3200, .18, 'bandpass'); },
    bad() { const s = SFX(); if (!s) return; s.tone(260, 150, .14, .16); },
    win() { try { FX.sfx.play('fanfare'); } catch (e) { } }, lose() { try { FX.sfx.play('sigh'); } catch (e) { } }, draw() { try { FX.sfx.play('chime'); } catch (e) { } }, coin() { try { FX.sfx.play('coin'); } catch (e) { } }
  };
  window.GOMOKU.sfx = snd;

  // ================= 状态 =================
  const SS = () => G0.S();
  const st = () => { const s = SS(); s.flags = s.flags || {}; const d = G0.dayNum(); let g = s.flags.gomoku; if (!g) g = s.flags.gomoku = { games: 0, wins: 0, losses: 0, draws: 0, aff: {}, gifts: {}, day: d, today: 0, streak: 0 }; if (g.day !== d) { g.day = d; g.today = 0; } return g; };
  window.GOMOKU.state = st;
  const present = () => { const d = G0.dayNum(); const h = G0.hourF(); return GG.opponents.filter((o, i) => ((d * 7 + i * 3) % 5) !== 0 || o.level === 'easy'); };
  window.GOMOKU.present = present;
  const level = o => ({ easy: '不太灵光', medium: '中规中矩', hard: '很难赢' }[o.level]);

  // ================= 棋盘界面 =================
  function drawStone(ctx, x, y, r, c, a, sc) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(r * .18, r * .24, r * .92, r * .78, 0, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r);
    if (c === 1) { g.addColorStop(0, '#6a6a70'); g.addColorStop(.35, '#26262b'); g.addColorStop(1, '#070709'); } else { g.addColorStop(0, '#ffffff'); g.addColorStop(.55, '#ecebe5'); g.addColorStop(1, '#b4b2a8'); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = c === 1 ? '#000' : '#8c8a80'; ctx.stroke();
    ctx.fillStyle = c === 1 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(-r * .3, -r * .38, r * .28, r * .16, -.6, 0, 7); ctx.fill(); ctx.restore();
  }
  function slab(S, M) { // 石桌台面：石纹 + 刻出来的棋盘线
    const c = document.createElement('canvas'); c.width = S * 2; c.height = S * 2; const g = c.getContext('2d'); g.scale(2, 2);
    const bg = g.createLinearGradient(0, 0, S, S); bg.addColorStop(0, '#a5a59d'); bg.addColorStop(.5, '#908f87'); bg.addColorStop(1, '#7c7b74'); g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, S, S, 22); g.fill();
    let s = 17; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; g.save(); g.clip();
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.09)'; g.fillRect(r() * S, r() * S, 1 + r() * 2.4, 1 + r() * 2.4); }
    for (let i = 0; i < 14; i++) { g.strokeStyle = r() < .5 ? 'rgba(60,58,50,.18)' : 'rgba(255,255,255,.12)'; g.lineWidth = .6 + r() * 1.2; g.beginPath(); let x = r() * S, y = r() * S; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - .5) * 120; y += (r() - .5) * 120; g.lineTo(x, y); } g.stroke(); }
    g.restore(); g.lineWidth = 3; g.strokeStyle = 'rgba(40,38,32,.55)'; g.beginPath(); g.roundRect(1.5, 1.5, S - 3, S - 3, 21); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(5, 5, S - 10, S - 10, 18); g.stroke();
    // 棋盘线（凹刻：深线 + 下沿高光）
    for (let i = 0; i < N; i++) { const p = M.o + i * M.c;[[M.o, p, M.o + (N - 1) * M.c, p], [p, M.o, p, M.o + (N - 1) * M.c]].forEach(([x1, y1, x2, y2]) => { g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x1 + 1, y1 + 1.2); g.lineTo(x2 + 1, y2 + 1.2); g.stroke(); g.strokeStyle = 'rgba(32,30,26,.85)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }); }
    [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]].forEach(([i, j]) => { g.fillStyle = 'rgba(32,30,26,.9)'; g.beginPath(); g.arc(M.o + i * M.c, M.o + j * M.c, 3.2, 0, 7); g.fill(); });
    return c;
  }
  function board(root, opp, bet, onEnd) {
    const S = 468, M = { o: 34, c: (468 - 68) / (N - 1) };
    root.innerHTML = `<div class="gmk"><div class="gmk-side"><div class="gmk-pt"></div><b>${opp.name}</b><small>${opp.title}</small><div class="gmk-say"></div><div class="gmk-state"></div><div class="gmk-btns"><button class="btn sm" id="gmk-resign">认输</button><button class="btn sm ghost" id="gmk-leave">不下了</button></div></div><div class="gmk-wrap"><canvas width="${S * 2}" height="${S * 2}" style="width:${S}px;height:${S}px;touch-action:none;max-width:100%;height:auto"></canvas></div></div>`;
    try { root.querySelector('.gmk-pt').innerHTML = A.portrait(opp.look, { mood: 'neutral' }); } catch (e) { }
    const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'); ctx.scale(2, 2); const table = slab(S, M);
    const b = E.empty(); const stones = []; const g = { b, turn: 1, over: false, moves: 0, last: null, win: null, hover: null, busy: false, stones, opp, result: null };
    const say = t => { root.querySelector('.gmk-say').textContent = t; }; const stat = t => { root.querySelector('.gmk-state').innerHTML = t; };
    g.say = say; window.GOMOKU.cur = g;
    say(pick(opp.greet)); stat(`轮到你 <i class="gs b"></i> 黑子先手${bet ? ` · 彩头 ¥${bet}` : ''}`);
    const xy = (gx, gy) => [M.o + gx * M.c, M.o + gy * M.c];
    const place = (gx, gy, color) => { b[gy][gx] = color; g.moves++; g.last = [gx, gy]; stones.push({ x: gx, y: gy, c: color, t: performance.now() }); (color === 1 ? snd.black : snd.white)(); const w = E.five(b, gx, gy); if (w) { g.win = w; finish(color); return true; } if (g.moves >= N * N) { finish(0); return true; } return false; };
    function finish(winner) { g.over = true; g.result = winner === 1 ? 'win' : winner === 2 ? 'lose' : 'draw'; stat(winner === 1 ? '你赢了！' : winner === 2 ? `${opp.name}赢了` : '和棋'); say(pick(winner === 1 ? opp.lose : winner === 2 ? opp.win : opp.draw)); (winner === 1 ? snd.win : winner === 2 ? snd.lose : snd.draw)(); setTimeout(() => onEnd(g.result, g), 1700); }
    function threatText() { // 对手落子后，看看盘面上有没有值得说一句的局面
      const [lx, ly] = g.last; const v = E.pointScore(b, lx, ly, 2); if (v >= 10000) return pick(opp.warn); return null; }
    function aiMove() {
      g.busy = true; stat(`${opp.name}在想…`); setTimeout(() => { if (g.over) return; const [x, y] = E.ai(b, 2, opp.level); const pBefore = E.pointScore(b, x, y, 1); if (place(x, y, 2)) return; const t = threatText(); say(t || (pBefore >= 1000 ? pick(opp.block) : (Math.random() < .55 ? pick(opp.say) : pick(GG.topics)))); g.turn = 1; g.busy = false; stat(`轮到你 <i class="gs b"></i> 黑子`); }, 450 + Math.random() * 500);
    }
    const toCell = e => { const r = cv.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * S, py = (e.clientY - r.top) / r.height * S; const gx = Math.round((px - M.o) / M.c), gy = Math.round((py - M.o) / M.c); if (!inb(gx, gy)) return null; if (Math.hypot(px - (M.o + gx * M.c), py - (M.o + gy * M.c)) > M.c * .62) return null; return [gx, gy]; };
    cv.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; g.hover = toCell(e); });
    cv.addEventListener('pointerleave', () => { g.hover = null; });
    cv.addEventListener('pointerdown', e => { if (g.over || g.busy || g.turn !== 1) return; const c = toCell(e); if (!c) return; const [gx, gy] = c; if (b[gy][gx]) { snd.bad(); say('那里已经有子了。'); return; } if (place(gx, gy, 1)) return; g.turn = 2; say(pick(opp.block.concat(opp.say))); aiMove(); });
    g.tap = (gx, gy) => { if (g.over || g.busy || g.turn !== 1 || b[gy][gx]) return false; if (place(gx, gy, 1)) return true; g.turn = 2; aiMove(); return true; };
    root.querySelector('#gmk-resign').onclick = () => { if (g.over) return; g.over = true; g.result = 'lose'; g.resigned = true; say(`${opp.name}笑了：“认输也是一手。”`); snd.lose(); setTimeout(() => onEnd('lose', g), 900); };
    root.querySelector('#gmk-leave').onclick = () => { if (g.over) return; g.over = true; g.result = 'leave'; onEnd('leave', g); };
    let alive = true; const frame = () => { if (!alive || !document.contains(cv)) { alive = false; return; } const now = performance.now();
      ctx.clearRect(0, 0, S, S); ctx.drawImage(table, 0, 0, S, S); const R = M.c * .43;
      if (g.hover && !g.over && g.turn === 1 && !g.busy && !b[g.hover[1]][g.hover[0]]) { const [hx, hy] = xy(...g.hover); drawStone(ctx, hx, hy, R, 1, .35, 1); }
      stones.forEach(s => { const age = (now - s.t) / 1000; const [px, py] = xy(s.x, s.y); const k = clamp(age / .18, 0, 1); const sc = 1 + (1 - k) * (1 - k) * .55; drawStone(ctx, px, py, R, s.c, .35 + .65 * k, sc); if (age < .45) { ctx.strokeStyle = `rgba(255,255,255,${.5 * (1 - age / .45)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, R + age * 40, 0, 7); ctx.stroke(); } });
      if (g.last && !g.over) { const [lx, ly] = xy(...g.last); ctx.fillStyle = '#e0452f'; ctx.beginPath(); ctx.arc(lx, ly, 3.6, 0, 7); ctx.fill(); }
      if (g.win) { const p = .5 + .5 * Math.sin(now / 160); g.win.forEach(([wx, wy]) => { const [px, py] = xy(wx, wy); ctx.strokeStyle = `rgba(255,214,90,${.5 + .5 * p})`; ctx.lineWidth = 3; ctx.shadowColor = '#ffd65a'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(px, py, R + 3, 0, 7); ctx.stroke(); ctx.shadowBlur = 0; }); }
      requestAnimationFrame(frame); }; requestAnimationFrame(frame);
    g.stop = () => { alive = false; };
    return g;
  }

  // ================= 一局的完整流程 =================
  window.GOMOKU.run = async function () {
    const s = SS(), g0 = st(); const A2 = window.ART;
    if (g0.today >= GG.dailyCap) return UI.toast('今天下了不少了，老胳膊老腿的，明天再来。', 'bad');
    const here = present(); const names = here.map(o => `${o.name} · ${o.title}（${level(o)}）`);
    const pi = await UI.modal({ title: '石桌棋摊', wide: true, bg: A2.placeImg('riverside', G0.hourF()), html: `<p>河边的石桌上刻着棋盘，一圈老人围着看。${pick(GG.topics)}</p><p class="muted">今天在的棋友：${here.map(o => o.name).join('、')}。一盘棋要 30–60 分钟。你执黑先走。</p>`, buttons: here.map((o, i) => ({ text: `和${o.name}下 · ${o.hint}` })).concat([{ text: '再看看', cls: 'ghost' }]) });
    const opp = here[pi]; if (!opp) return;
    let bet = 0; if (s.money >= GG.bet) { const bi = await UI.modal({ title: `${opp.name}`, bg: A2.placeImg('riverside', G0.hourF()), html: `<p>${pick(opp.greet)}</p><p class="muted">要不要来点彩头？赢了他给你 ¥${GG.bet}，输了你给他 ¥${GG.bet}。</p>`, buttons: [{ text: `来，赌 ¥${GG.bet} 瓜子钱` }, { text: '不赌，下着玩' }] }); bet = bi === 0 ? GG.bet : 0; }
    g0.today++;
    const t0 = performance.now();
    const res = await new Promise(resolve => { UI.modal({ title: `${opp.name} · 五子棋`, wide: true, cls: 'gmk-modal', bg: A2.placeImg('riverside', G0.hourF()), html: '<div id="gmk-root"></div>', buttons: [], onShow: (m, close) => { const root = m.querySelector('#gmk-root'); const game = board(root, opp, bet, (r, gm) => { gm.stop(); close(); resolve({ r, gm }); }); } }); });
    const { r, gm } = res; const moves = gm.moves; const minutes = clamp(Math.round(24 + moves * 0.85), GG.minutes[0], GG.minutes[1]);
    G0.advance(r === 'leave' ? 10 : minutes);
    const k = opp.level === 'hard' ? 1.4 : opp.level === 'medium' ? 1.1 : 1; const gs = st(); gs.games++;
    let out = { r, minutes, opp, moves, bet, mental: 0, aff: 0, money: 0 };
    if (r === 'win') { gs.wins++; gs.streak++; out.mental = Math.round(5 * k + (gs.streak >= 3 ? 2 : 0)); out.aff = Math.round(4 * k); out.money = bet; }
    else if (r === 'lose') { gs.losses++; gs.streak = 0; out.mental = 1; out.aff = 2; out.money = -bet; }
    else if (r === 'draw') { gs.draws++; out.mental = 3; out.aff = 3; }
    else { gs.games--; out = { r: 'leave', minutes: 10, opp, moves, bet: 0, mental: 0, aff: 0, money: 0 }; gs.today--; }
    gs.aff[opp.id] = (gs.aff[opp.id] || 0) + out.aff; out.total = gs.aff[opp.id];
    G0.change({ mental: out.mental }); s.money += out.money; if (out.money > 0) { s.earned = (s.earned || 0) + out.money; if (G0.noteWage) G0.noteWage(out.money, 'game'); }
    if (out.r !== 'leave') G0.log(`和${opp.name}下了盘五子棋，${r === 'win' ? '赢了' : r === 'lose' ? '输了' : '下成和棋'}。`, r === 'win' ? 'good' : '');
    // 熟了以后偶尔有小礼物
    let gift = null; if (r !== 'leave' && out.total >= 10 && !gs.gifts[opp.id]) { gs.gifts[opp.id] = 1; gift = opp.gift; G0.change({ mental: 3, hunger: 8 }); }
    if (out.r === 'leave') { UI.toast('起身走了，棋盘留在桌上。'); return out; }
    if (out.money > 0) snd.coin();
    UI.toast(r === 'win' ? `赢了！精神 +${out.mental}${out.money ? ` · +¥${out.money}` : ''}` : r === 'lose' ? `输了，${opp.name}很高兴${out.money ? ` · -¥${-out.money}` : ''}` : '和棋');
    await UI.modal({ title: r === 'win' ? '赢了一盘' : r === 'lose' ? '输了一盘' : '和棋', bg: A2.placeImg('riverside', G0.hourF()), html: `<div class="talk"><div class="pt">${A2.portrait(opp.look, { mood: r === 'win' ? 'neutral' : 'smile' })}</div><div><b>${opp.name}</b><small> · ${opp.title}</small><p>${pick(r === 'win' ? opp.lose : r === 'lose' ? opp.win : opp.draw)}</p></div></div>${gift ? `<p class="story">🎁 ${gift}</p>` : ''}${UI.effText({ mental: out.mental + (gift ? 3 : 0), money: out.money })}<p class="muted tiny">下了 ${moves} 手，用了 ${minutes} 分钟。和${opp.name}的交情：${out.total >= 10 ? '老棋友' : out.total >= 5 ? '熟人' : '刚认识'}（${out.total}）· 战绩 ${gs.wins} 胜 ${gs.losses} 负 ${gs.draws} 平 · 今天还能下 ${GG.dailyCap - gs.today} 盘</p>`, buttons: [{ text: '好' }] });
    return out;
  };

  // ================= 接进公园面板 =================
  const hasOld = LIFE.has; LIFE.has = k => k === 'gomoku' || hasOld(k);
  const panelOld = LIFE.panel;
  LIFE.panel = function (loc, btn, open) { const r = panelOld.apply(this, arguments); if (loc === 'riverside' && open) { const g = st(); r.acts.push(btn('gomoku', '石桌下五子棋', `30–60 分钟 · 赢了精神+、没准还有彩头 · 今天还能下 ${Math.max(0, GG.dailyCap - g.today)} 盘`, g.today >= GG.dailyCap ? 'dim' : '')); } return r; };
  const doOld = LIFE.doAct; LIFE.doAct = function (k, v) { if (k === 'gomoku') return UI.act(() => GOMOKU.run()); return doOld.apply(this, arguments); };
  { const ic = UI.actIcon; UI.actIcon = id => id.split(':')[0] === 'gomoku' ? '♟️' : ic(id); }
})();
