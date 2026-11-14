// v1.0.2 · 小游戏骨架（GP）：所有零工 / 新做的工种小游戏共用。
// 负责：画布与缩放、触摸 + 鼠标 + 键盘输入、首次教程、3-2-1 倒计时、和游戏内钟点挂钩的计时、
// 粒子 / 飘字 / 提示条 / 震屏、结算卡（星级 + 手艺评价）、提前收工、出错兜底。
// 每个游戏只写自己的规则和画面：GP.reg(id, { title, dur, help, make(env) -> game })。
(function () {
  const W = 900, H = 520;
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const ease = { out: k => 1 - Math.pow(1 - k, 3), back: k => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2), inOut: k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2 };
  const GP = window.GP = { games: {}, cur: null, speed: 1, W, H, FONT };
  GP.hintPill = function (textWidth) { const w = Math.min(820, (textWidth || 0) + 36); return { x: W / 2 - w / 2, y: H - 46, w, h: 34 }; };
  GP.boxesOverlap = (a, b) => !!(a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  GP.hintHitsPlay = function (game, text, ctx) {
    if (!game || !text) return false;
    if (game.hintExternal) return true;
    if (!game.playBox) return false;
    if (ctx) ctx.font = `16px ${FONT}`;
    const width = ctx ? ctx.measureText(text).width : text.length * 16;
    return GP.boxesOverlap(GP.hintPill(width), game.playBox);
  };
  const U = GP.u = { rnd, ri, pick, clamp, lerp, ease, FONT };

  // ---------- 颜色 ----------
  const hex = c => { if (/^rgba?\(/.test(c)) { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2]]; } c = c.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
  U.shade = (c, a) => { const [r, g, b] = hex(c); const f = v => clamp(Math.round(a >= 0 ? v + (255 - v) * a : v * (1 + a)), 0, 255); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  U.rgba = (c, a) => { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; };
  // ---------- 画图小工具 ----------
  U.rr = (ctx, x, y, w, h, r, fill, stroke, lw) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  U.txt = (ctx, s, x, y, size, color, align, bold, outline) => { ctx.font = `${bold ? '700 ' : ''}${size || 16}px ${FONT}`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; if (outline) { ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); } ctx.fillStyle = color || '#f6ecd6'; ctx.fillText(s, x, y); };
  U.wrap = (ctx, s, maxW) => { const out = []; let line = ''; for (const ch of String(s)) { if (ch === '\n') { out.push(line); line = ''; continue; } const t = line + ch; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = ch; } else line = t; } if (line) out.push(line); return out; };
  // 有光泽的圆角块：上亮下暗 + 高光边 + 深色描边（所有“盒子”都用它，避免生硬的平涂）
  U.glossy = (ctx, x, y, w, h, r, color, o) => {
    o = o || {}; ctx.save(); if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = o.sb || 8; ctx.shadowOffsetY = o.so == null ? 3 : o.so; }
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, U.shade(color, .22)); g.addColorStop(.5, color); g.addColorStop(1, U.shade(color, -.28));
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, Math.max(1, r - 1.5)); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke || U.shade(color, -.55); ctx.stroke();
  };
  U.panel = (ctx, x, y, w, h, r, o) => { o = o || {}; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top || 'rgba(58,44,32,.94)'); g.addColorStop(1, o.bot || 'rgba(32,24,18,.94)'); ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 14); ctx.fillStyle = g; ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 14); ctx.lineWidth = 2; ctx.strokeStyle = o.line || 'rgba(255,214,150,.38)'; ctx.stroke(); };
  U.star = (ctx, cx, cy, R, fill, stroke) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? R * .46 : R; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  U.mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g, w, h); return c; };
  U.blit = (ctx, spr, x, y, w, h) => ctx.drawImage(spr, x, y, w == null ? spr.width / 2 : w, h == null ? spr.height / 2 : h);
  U.shadowEllipse = (ctx, x, y, rx, ry, a) => { ctx.fillStyle = `rgba(0,0,0,${a == null ? .28 : a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); };
  // 路人 / 小人：侧视，走路摆腿。o: {skin, shirt, pants, hair, hat, bag, s, face:1|-1, step}
  U.person = (ctx, x, y, o) => {
    const s = o.s || 1, f = o.face || 1, st = o.step || 0, sw = Math.sin(st) * 7 * s; ctx.save(); ctx.translate(x, y); ctx.scale(f * s, s);
    U.shadowEllipse(ctx, 0, 1, 15, 4, .25);
    const leg = (dx, ph, col) => { ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(dx, -30); ctx.lineTo(dx + ph, -3); ctx.stroke(); ctx.fillStyle = '#26211d'; ctx.beginPath(); ctx.ellipse(dx + ph + 3, -2, 7, 3.4, 0, 0, 7); ctx.fill(); };
    leg(-3, -sw, U.shade(o.pants || '#3b4a63', -.2)); leg(3, sw, o.pants || '#3b4a63');
    if (o.bag) { U.glossy(ctx, -17, -60, 10, 22, 4, o.bag, { shadow: false, lw: 1.2 }); }
    U.glossy(ctx, -11, -62, 22, 34, 8, o.shirt || '#c0613f', { shadow: false, lw: 1.6 });
    ctx.strokeStyle = o.skin || '#e5b78f'; ctx.lineWidth = 6; ctx.lineCap = 'round'; const arm = o.arm == null ? -sw * .6 : o.arm; ctx.beginPath(); ctx.moveTo(1, -56); ctx.lineTo(8 + arm * .2, -44); ctx.lineTo(10 + arm * .5, -36 + (o.armUp ? -14 : 0)); ctx.stroke();
    ctx.fillStyle = o.skin || '#e5b78f'; ctx.beginPath(); ctx.arc(0, -70, 10, 0, 7); ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke();
    ctx.fillStyle = o.hair || '#2b2420'; ctx.beginPath(); ctx.arc(-1, -73, 10.2, Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
    if (o.hat) { U.glossy(ctx, -11, -84, 22, 8, 4, o.hat, { shadow: false, lw: 1.4 }); ctx.fillStyle = U.shade(o.hat, -.3); ctx.fillRect(4, -78, 12, 3); }
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(4, -70, 1.4, 0, 7); ctx.fill();
    ctx.restore();
  };

  // ---------- 声音 ----------
  const base = () => window.MG && MG.sfx;
  const fx = n => { try { window.FX && FX.sfx && FX.sfx.play(n); } catch (e) { } };
  const S = GP.S = {
    tone(a, b, d, g) { try { const s = base(); s && s.tone(a, b, d, g); } catch (e) { } },
    noise(a, d, f, g, t) { try { const s = base(); s && s.noise(a, d, f, g, t); } catch (e) { } },
    thud(g) { try { const s = base(); s && s.thud(g == null ? .4 : g); } catch (e) { } },
    click() { S.tone(520, 760, .06, .12); },
    tap() { S.tone(330, 260, .05, .1); },
    good(i) { const f = 440 * Math.pow(1.0595, ((i || 0) * 2) % 19); S.tone(f, f * 1.5, .16, .15); },
    pop(i) { const f = 480 * Math.pow(1.122, Math.min(i || 0, 8)); S.tone(f, f * 1.7, .12, .15); S.noise(0, .05, 3200, .06, 'bandpass'); },
    bad() { S.tone(250, 110, .26, .26); S.noise(0, .1, 330, .14); },
    buzz() { S.tone(180, 140, .22, .22); S.tone(190, 150, .22, .14); },
    whoosh() { S.noise(0, .16, 1400, .13, 'bandpass'); },
    clink() { S.tone(1500, 2100, .1, .1); S.tone(2300, 2900, .08, .06); },
    thump(g) { S.thud(g == null ? .5 : g); },
    tick() { S.tone(900, 700, .03, .07); },
    count() { S.tone(520, 520, .13, .16); },
    go() { S.tone(780, 1180, .3, .2); },
    coin() { fx('coin'); },
    win() { fx('fanfare'); },
    chime() { fx('chime'); },
    step() { S.tone(160, 120, .04, .05); }
  };

  // ---------- 通用小流程 ----------
  const seen = (k, set) => { try { const s = G.S(); s.flags = s.flags || {}; if (set) s.flags[k] = 1; return !!s.flags[k]; } catch (e) { return false; } };
  GP.seen = seen;
  GP.reg = (id, def) => { GP.games[id] = def; };
  const IMGS = {}; const imgOf = src => { if (!src) return null; let i = IMGS[src]; if (!i) { i = IMGS[src] = new Image(); i.src = src; } return i.complete && i.naturalWidth ? i : null; };
  const clockOf = (min0, frac, mins) => { const m = Math.floor((min0 + frac * mins) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  GP.grade = q => q >= .85 ? { w: '漂亮', s: 3, c: '#ffe27a' } : q >= .65 ? { w: '利索', s: 2, c: '#b8f0a0' } : q >= .4 ? { w: '凑合', s: 1, c: '#f0d9a0' } : { w: '马虎', s: 0, c: '#ffa797' };
  GP.perfMult = q => Math.round((0.45 + 0.85 * clamp(q, 0, 1)) * 100) / 100;   // 手艺倍率：0.45 – 1.30

  // 在 root 里跑一局；返回 Promise<{completed, quality, quit, summary, lines, hoursDone}>
  GP.mount = function (id, root, o) {
    o = o || {}; const def = GP.games[id]; if (!def) return Promise.reject(new Error('no game ' + id));
    return new Promise(resolve => {
      root.innerHTML = `<div class="gp"><canvas class="gp-cv" width="${W * 2}" height="${H * 2}" tabindex="0"></canvas><p class="gp-note" id="gp-note"></p><div class="gp-bar"><button class="mg-btn ghost" id="gp-help" type="button">玩法</button><button class="mg-btn ghost" id="gp-quit" type="button">不干了，走人</button><button class="mg-btn" id="gp-done" type="button" style="display:none">收工 ▸</button></div></div>`;
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'); ctx.scale(2, 2);
      const bar = root.querySelector('.gp-bar'), note = root.querySelector('.gp-note');
      const fit = () => { if (!cv.isConnected) return; const wrap = root.getBoundingClientRect(); const noteH = note.classList.contains('on') ? note.offsetHeight : 0; const maxH = Math.max(180, (window.innerHeight || 700) - 200 - noteH); const w = Math.min(W, Math.max(260, (wrap.width || W) - 4), maxH * W / H); cv.style.width = Math.round(w) + 'px'; cv.style.height = Math.round(w * H / W) + 'px'; };
      fit(); window.addEventListener('resize', fit);
      const first = !o.noTut && !seen('gp_seen_' + id);
      const bg = o.bg ? (() => { const i = new Image(); i.src = o.bg; return i; })() : null;
      const dur = Math.round((o.dur || def.dur || 70) * (o.tired && !o.dur ? .92 : 1)), mins = o.minutes || def.minutes || 60, min0 = (() => { try { return Math.floor((G.hourF() % 24) * 60); } catch (e) { return 480; } })();
      const env = {
        W, H, id, dur, opts: o, t: 0, phase: (first || o.forceBrief) ? 'help' : 'count', cnt: 0, tutorial: first || !!o.forceBrief, S, U, parts: [], floats: [], banner: null, shakeA: 0, pen: 0, ended: false, frame: 0,
        float(x, y, text, color, size) { env.floats.push({ x, y, text, color: color || '#fff3c4', size: size || 22, t: 0, life: 1.1 }); },
        say(text, color, secs) { env.banner = { text, color: color || '#fff3d6', t: 0, life: secs || 1.8 }; },
        shake(a) { env.shakeA = Math.max(env.shakeA, a || 6); },
        burst(x, y, n, p) { p = p || {}; for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), sp = rnd(.3, 1) * (p.speed || 160); env.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (p.up || 0), g: p.grav == null ? 380 : p.grav, life: rnd(.5, 1) * (p.life || .8), max: p.life || .8, size: rnd(.6, 1.2) * (p.size || 5), color: pick(p.colors || ['#ffe27a', '#fff']), shape: p.shape || 'dot', rot: rnd(0, 6), vr: rnd(-8, 8) }); } },
        // 扣分 / 失误：声音 + 震屏 + 飘字 + 提示条，一样都不省（没有悄悄扣分）
        penalty(text, x, y, o2) { o2 = o2 || {}; env.pen++; S.bad(); env.shake(o2.shake || 5); env.float(x == null ? W / 2 : x, y == null ? 250 : y, text, '#ff9c8a', 24); if (!o2.quiet) env.say(text, '#ffb4a5', 1.6); },
        addTime(sec, x, y) { env.t = clamp(env.t - sec, 0, env.dur); env.float(x == null ? 450 : x, y == null ? 120 : y, (sec >= 0 ? '+' : '−') + Math.abs(sec) + ' 秒', sec >= 0 ? '#9fe88a' : '#ff9c8a', 22); },
        end(res) { finish(res, false); },
        clock: () => clockOf(min0, env.t / dur, mins)
      };
      let touchHelp = null;
      if (first && (document.documentElement.clientWidth || innerWidth) < 600) { touchHelp = document.createElement('div'); touchHelp.className = 'gp-touchhelp'; const title = document.createElement('h3'); title.textContent = o.title || def.title; touchHelp.appendChild(title); (def.help || []).forEach(t => { const p = document.createElement('p'); p.textContent = t; touchHelp.appendChild(p); }); const start = document.createElement('button'); start.className = 'btn'; start.textContent = '开始干活'; start.onclick = () => ack(); touchHelp.appendChild(start); root.prepend(touchHelp); cv.style.display = 'none'; }
      let game; try { game = def.make(env); } catch (e) { console.error(e); resolve({ completed: true, quality: .6, fallback: true, summary: '' }); return; }
      let res = null, last = performance.now(), alive = true, endT = 0, btn = {};
      const cur = GP.cur = { id, env, game, def, finish: q => finish(game.final ? Object.assign({}, game.final(), q != null ? { quality: q } : {}) : { quality: q == null ? .6 : q }, false), ack: () => ack(), res: () => res, mounted: true };
      const hudSet = () => { try { return game.hud ? game.hud() : []; } catch (e) { return []; } };
      function ack() { if (touchHelp) { touchHelp.remove(); touchHelp = null; cv.style.display = ''; fit(); } if (env.phase === 'help') { env.phase = 'count'; env.cnt = 0; seen('gp_seen_' + id, 1); env.tutorialAck = true; S.click(); } }
      function finish(r, quit) {
        if (env.ended) return; env.ended = true; r = r || {}; let q = clamp(r.quality == null ? .5 : r.quality, 0, 1); if (quit) q = clamp(q * .85, 0, 1);
        const hoursDone = (o.hours || def.hours || 8) * clamp(env.t / dur, 0, 1);
        const beforeStart = quit && env.phase === 'help' && !env.reopen;
        const qp = quit && !beforeStart && G.quitRoll ? G.quitRoll() : null; if (qp) r.lines = [qp.line, qp.frac ? `只结整份钱的 ${Math.round(qp.frac * 100)}%` : '一分钱没有'];
        res = { noPay: beforeStart, quitPay: beforeStart ? { frac: 0, line: '还没开始干活，这单没有工钱。' } : qp, completed: !quit, quit: !!quit, quality: q, summary: r.summary || '', lines: r.lines || [], stats: r.stats || {}, hoursDone, mentalMult: r.mentalMult || 1, mentalBonus: r.mentalBonus || 0, fines: r.fines || 0, score: r.score, gp: id, t: env.t, pen: env.pen };
        env.phase = 'end'; endT = 0; bar.querySelector('#gp-done').style.display = ''; bar.querySelector('#gp-quit').style.display = 'none'; bar.querySelector('#gp-help').style.display = 'none';
        const gr = GP.grade(q); if (quit) { S.tap(); } else if (gr.s >= 2) { S.win(); env.burst(W / 2, 200, 40, { colors: ['#ffe27a', '#ffb05a', '#fff', '#9fe88a'], speed: 330, up: 180, shape: 'rect', life: 1.4, size: 7 }); } else S.chime();
        if (quit) done();
      }
      function done() { if (!alive) return; alive = false; cleanup(); setTimeout(() => resolve(res), quitDelay()); }
      const quitDelay = () => 30;
      function cleanup() { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', fit); if (GP.cur && GP.cur.env === env) GP.cur.mounted = false; }
      bar.querySelector('#gp-done').onclick = () => { S.click(); done(); };
      bar.querySelector('#gp-quit').onclick = () => { if (env.phase === 'play' || env.phase === 'count') finish(game.final ? game.final() : { quality: .3 }, true); else if (env.phase === 'help') finish({ quality: 0 }, true); };
      bar.querySelector('#gp-help').onclick = () => { if (env.phase === 'play' || env.phase === 'count') { env.prev = env.phase; env.phase = 'help'; env.reopen = true; } };
      // ---------- 输入 ----------
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
      const inBtn = (x, y) => { const b = btn.ok; return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; };
      const pd = e => { const [x, y] = pos(e); if (e.pointerId != null && cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (x) { } } try { window.MG_HB = performance.now(); } catch (x) { }
        if (env.phase === 'help') { if (inBtn(x, y) || env.helpT > .5) { if (env.reopen) { env.reopen = false; env.phase = env.prev || 'play'; S.click(); } else ack(); } return; }
        if (env.phase === 'end') { if (btn.done && inBtn(x, y)) { done(); } return; }
        if (env.phase === 'play' && game.pointer) game.pointer('down', x, y, e); };
      const pm = e => { if (env.phase === 'play' && game.pointer) { const [x, y] = pos(e); game.pointer('move', x, y, e); } };
      const pu = e => { if (env.phase === 'play' && game.pointer) { const [x, y] = pos(e); game.pointer('up', x, y, e); } };
      cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);
      cv.addEventListener('contextmenu', e => e.preventDefault());
      const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'space', Enter: 'enter', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down', z: 'z', x: 'x', Escape: 'esc', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', p: 'p', P: 'p', r: 'r', R: 'r', u: 'u', U: 'u', h: 'h', H: 'h' };
      const kd = e => { if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; const k = KEYS[e.key]; if (!k) return;
        if (env.phase === 'help') { if (k === 'enter' || k === 'space') { if (env.reopen) { env.reopen = false; env.phase = env.prev || 'play'; } else ack(); e.preventDefault(); } return; }
        if (env.phase === 'end') { if (k === 'enter' || k === 'space') { done(); e.preventDefault(); } return; }
        if (env.phase === 'play' && game.key) { if (game.key(k, true, e) !== false) e.preventDefault(); } };
      const ku = e => { const k = KEYS[e.key]; if (k && env.phase === 'play' && game.key) game.key(k, false, e); };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      // ---------- 主循环 ----------
      function step(dt) {
        env.frame++; env.helpT = (env.helpT || 0) + (env.phase === 'help' ? dt : 0);
        env.parts.forEach(p => { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += p.vr * dt; }); env.parts = env.parts.filter(p => p.life > 0);
        env.floats.forEach(f => { f.t += dt; f.y -= 34 * dt; }); env.floats = env.floats.filter(f => f.t < f.life);
        if (env.banner) { env.banner.t += dt; if (env.banner.t > env.banner.life) env.banner = null; }
        env.shakeA = Math.max(0, env.shakeA - dt * 22);
        if (env.phase === 'count') { const n0 = Math.floor(env.cnt / .6); env.cnt += dt; const n1 = Math.floor(env.cnt / .6); if (n1 > n0) { n1 >= 3 ? S.go() : S.count(); } if (env.cnt >= 2.0) { env.phase = 'play'; if (game.onStart) game.onStart(); } if (typeof game.idle === 'function') game.idle(dt); return; }
        if (env.phase === 'play') { env.t += dt; if (o.lowSta && !env._lowSaid && env.t > 6) { env._lowSaid = 1; env.say(o.lowSta, '#ffb4a5', 2.6); } { const left = dur - env.t, warnAt = dur >= 20 ? 10 : Math.max(3, dur * .4); if (left <= warnAt) { if (!env.warned10) { env.warned10 = true; env.say(`还剩 ${Math.ceil(warnAt)} 秒！`, '#ffb4a5', 1.6); S.tone(660, 440, .25, .2); } const sec = Math.ceil(left); if (sec !== env.lastSec) { env.lastSec = sec; S.tone(sec <= 3 ? 1100 : 880, sec <= 3 ? 1100 : 880, .06, sec <= 3 ? .16 : .1); } } } if (game.update) game.update(dt); if (env.phase === 'play' && env.t >= dur) { env.t = dur; finish(game.final ? game.final() : { quality: .6 }, false); } }
        else if (env.phase === 'end') { endT += dt; if (typeof game.idle === 'function') game.idle(dt); }
        else if (typeof game.idle === 'function') game.idle(dt);
      }
      function drawHud() {
        const frac = clamp(env.t / dur, 0, 1), left = Math.max(0, dur - env.t);
        U.panel(ctx, 8, 6, W - 16, 40, 12, { top: 'rgba(52,40,30,.9)', bot: 'rgba(28,21,16,.9)' });
        U.txt(ctx, (o.title || def.title), 24, 32, 18, '#ffe9b8', 'left', true);
        const bx = 330, bw = 300; U.rr(ctx, bx, 19, bw, 14, 7, 'rgba(0,0,0,.5)', 'rgba(255,230,180,.35)', 1.5);
        const col = frac > .8 ? '#e85d4a' : frac > .6 ? '#f0b24a' : '#7fd16a'; const g = ctx.createLinearGradient(0, 19, 0, 33); g.addColorStop(0, U.shade(col, .3)); g.addColorStop(1, col); if (frac > 0) U.rr(ctx, bx + 1.5, 20.5, Math.max(10, (bw - 3) * (1 - frac)), 11, 5.5, g);
        U.txt(ctx, env.phase === 'count' ? '准备' : env.clock(), bx - 10, 32, 15, '#ffe9b8', 'right', true); U.txt(ctx, Math.ceil(left) + ' 秒', bx + bw + 10, 32, 14, frac > .8 ? '#ffb4a5' : '#e9dcc0', 'left');
        { const w10 = env.phase === 'play' && left <= (dur >= 20 ? 10 : Math.max(3, dur * .4)); if (w10) { const a = .35 + .35 * Math.abs(Math.sin(env.t * 5)); ctx.save(); ctx.strokeStyle = `rgba(255,70,50,${a})`; ctx.lineWidth = 7; ctx.strokeRect(3, 3, W - 6, H - 6); ctx.globalAlpha = .16; U.txt(ctx, String(Math.ceil(left)), W / 2, H / 2 + 60, 190, '#ff6a50', 'center', true); ctx.restore(); U.txt(ctx, Math.ceil(left) + ' 秒', bx + bw + 10, 32, 17, '#ff6a50', 'left', true); } }
        const items = hudSet(); let x = W - 24; items.slice().reverse().forEach(([k, v, c]) => { const t = `${k} ${v}`; ctx.font = `700 15px ${FONT}`; const w = ctx.measureText(t).width + 18; x -= w; U.rr(ctx, x, 14, w, 24, 12, 'rgba(0,0,0,.4)', c || 'rgba(255,230,180,.35)', 1.3); U.txt(ctx, t, x + 9, 31, 15, c ? '#fff' : '#ffe9b8', 'left', true); x -= 6; });
      }
      function drawHelp() {
        ctx.fillStyle = 'rgba(8,6,4,.72)'; ctx.fillRect(0, 0, W, H);
        const notes = o.payNote || [];
        const cx = W / 2, cw = 760, chh = Math.min(H - 24, 120 + def.help.length * 64 + notes.length * 22 + 78), cy = Math.max(8, (H - chh) / 2);
        U.panel(ctx, cx - cw / 2, cy, cw, chh, 20, { top: 'rgba(66,50,36,.97)', bot: 'rgba(34,26,19,.97)' });
        U.txt(ctx, `开工前 · ${(o.title || def.title)}`, cx, cy + 40, 24, '#ffe9b8', 'center', true);
        ctx.font = `16px ${FONT}`; def.help.forEach((h, i) => { const y = cy + 70 + i * 64; ctx.beginPath(); ctx.arc(cx - cw / 2 + 36, y + 16, 14, 0, 7); const g = ctx.createLinearGradient(0, y, 0, y + 32); g.addColorStop(0, '#ffd47a'); g.addColorStop(1, '#d9902e'); ctx.fillStyle = g; ctx.fill(); U.txt(ctx, String(i + 1), cx - cw / 2 + 36, y + 22, 16, '#3a2208', 'center', true); ctx.font = `16px ${FONT}`; U.wrap(ctx, h, cw - 110).slice(0, 2).forEach((ln, j) => U.txt(ctx, ln, cx - cw / 2 + 60, y + 12 + j * 20, 16, '#f6ecd6')); });
        notes.forEach((h, i) => U.txt(ctx, h, cx, cy + 78 + def.help.length * 64 + i * 20, 14, '#ffe9a8', 'center'));
        const bw = 260, bh = 46, bx = cx - bw / 2, by = cy + chh - 64; btn.ok = { x: bx, y: by, w: bw, h: bh };
        const pulse = 1 + Math.sin(env.frame / 8) * .03; ctx.save(); ctx.translate(cx, by + bh / 2); ctx.scale(pulse, pulse); U.glossy(ctx, -bw / 2, -bh / 2, bw, bh, 23, '#e0a02e'); U.txt(ctx, env.reopen ? '继续 ▸' : '开始干活 ▸', 0, 8, 21, '#2e1b06', 'center', true); ctx.restore();
        U.txt(ctx, '（点一下，或按 空格 / 回车）', cx, cy + chh - 10, 13, 'rgba(255,230,190,.6)', 'center');
      }
      function drawEnd() {
        const r = res; ctx.fillStyle = 'rgba(8,6,4,.58)'; ctx.fillRect(0, 0, W, H);
        const gr = GP.grade(r.quality), k = ease.back(clamp(endT / .45, 0, 1)), cx = W / 2, cy = 270;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(.6 + .4 * k, .6 + .4 * k); ctx.globalAlpha = clamp(endT / .25, 0, 1);
        const lines = (r.lines || []).slice(0, 5), hh = 190 + lines.length * 26; U.panel(ctx, -250, -hh / 2, 500, hh, 22);
        U.txt(ctx, r.quit ? '走人了' : '收工！', 0, -hh / 2 + 48, 32, '#ffe9b8', 'center', true);
        for (let i = 0; i < 3; i++) { const on = i < gr.s, st = clamp((endT - .25 - i * .18) / .25, 0, 1); ctx.save(); ctx.translate(-56 + i * 56, -hh / 2 + 100); ctx.scale(on ? ease.back(st) : 1, on ? ease.back(st) : 1); U.star(ctx, 0, 0, 24, on ? '#ffd24a' : 'rgba(255,255,255,.14)', on ? '#a86a10' : 'rgba(255,255,255,.2)'); ctx.restore(); }
        U.txt(ctx, `手艺：${gr.w}`, 0, -hh / 2 + 150, 24, gr.c, 'center', true);
        lines.forEach((ln, i) => U.txt(ctx, ln, 0, -hh / 2 + 182 + i * 26, 16, '#f0e4cc', 'center'));
        ctx.restore();
      }
      function draw() {
        ctx.save(); ctx.clearRect(0, 0, W, H);
        // 背景：地点图 + 暗角
        const im = bg && bg.complete && bg.naturalWidth ? bg : null; if (im) { const s = Math.max(W / im.naturalWidth, H / im.naturalHeight); ctx.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); } else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a3128'); g.addColorStop(1, '#241d17'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = def.tint || 'rgba(18,14,10,.55)'; ctx.fillRect(0, 0, W, H);
        const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 560); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        if (env.shakeA > .2) ctx.translate(rnd(-1, 1) * env.shakeA, rnd(-1, 1) * env.shakeA);
        try { game.draw(ctx); } catch (e) { throw e; }
        env.parts.forEach(p => { ctx.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1); ctx.fillStyle = p.color; if (p.shape === 'rect') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * .66); ctx.restore(); } else if (p.shape === 'star') { U.star(ctx, p.x, p.y, p.size * 1.3, p.color); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill(); } }); ctx.globalAlpha = 1;
        env.floats.forEach(f => { const a = f.t < .12 ? f.t / .12 : clamp((f.life - f.t) / .35, 0, 1); ctx.globalAlpha = a; const sc = f.t < .12 ? .6 + f.t / .12 * .5 : 1.1 - Math.min(.1, (f.t - .12)); ctx.save(); ctx.translate(f.x, f.y); ctx.scale(sc, sc); U.txt(ctx, f.text, 0, 0, f.size, f.color, 'center', true, 'rgba(20,12,6,.85)'); ctx.restore(); }); ctx.globalAlpha = 1;
        ctx.restore();
        drawHud();
        if (env.banner) { const b = env.banner, a = b.t < .15 ? b.t / .15 : clamp((b.life - b.t) / .3, 0, 1); ctx.font = `700 21px ${FONT}`; const w = ctx.measureText(b.text).width + 44; ctx.globalAlpha = a; U.panel(ctx, W / 2 - w / 2, 58 - (1 - a) * 10, w, 38, 19, { top: 'rgba(40,30,22,.92)', bot: 'rgba(24,18,13,.92)' }); U.txt(ctx, b.text, W / 2, 84 - (1 - a) * 10, 21, b.color, 'center', true); ctx.globalAlpha = 1; }
        if (env.phase === 'play' && game.hint) {
          const h = (game.hintPersistent || env.tutorial || env.t < 8) ? game.hint() : null;
          const outside = h && GP.hintHitsPlay(game, h, ctx);
          if (note.textContent !== (outside ? h : '')) { note.textContent = outside ? h : ''; note.classList.toggle('on', !!outside); fit(); }
          if (h && !outside) { ctx.font = `16px ${FONT}`; const w = Math.min(820, ctx.measureText(h).width + 36); U.panel(ctx, W / 2 - w / 2, H - 46, w, 34, 17, { top: 'rgba(10,8,6,.78)', bot: 'rgba(10,8,6,.78)', line: 'rgba(255,226,140,.5)' }); U.txt(ctx, h, W / 2, H - 24, 16, '#ffe9a8', 'center'); }
        } else if (note.textContent) { note.textContent = ''; note.classList.remove('on'); fit(); }
        if (env.phase === 'count') { const n = 3 - Math.floor(env.cnt / .6); const k = (env.cnt % .6) / .6; const label = n > 0 ? String(n) : '开工！'; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1.5 - k * .5, 1.5 - k * .5); ctx.globalAlpha = 1 - k * .6; U.txt(ctx, label, 0, 28, n > 0 ? 100 : 80, '#fff1c4', 'center', true, 'rgba(40,20,4,.9)'); ctx.restore(); }
        if (env.phase === 'help') drawHelp();
        if (env.phase === 'end') { drawEnd(); btn.done = null; }
      }
      function frame(now) {
        if (!alive) return; if (window.MG_KILL > startT) { alive = false; cleanup(); return; }
        try {
          window.MG_HB = performance.now();
          let dt = Math.min(.1, (now - last) / 1000) * (GP.speed || 1); last = now;
          let n = Math.max(1, Math.ceil(dt / (1 / 30))); const d = dt / n; for (let i = 0; i < n; i++) step(d);
          draw();
        } catch (e) { console.error('gp error', e); alive = false; cleanup(); if (window.MG_FAIL) window.MG_FAIL(e); else resolve({ completed: true, quality: .6, fallback: true }); return; }
        requestAnimationFrame(frame);
      }
      const startT = performance.now(); requestAnimationFrame(frame);
    });
  };

  // 在弹窗里跑（零工用）。自动化测试（webdriver）默认瞬间按“一般水平”过，GP_REAL=true 时才真玩。
  GP.play = function (id, o) {
    o = o || {};
    if (navigator.webdriver && !window.GP_REAL) return Promise.resolve({ completed: true, quality: .7, auto: true, summary: '', lines: [], stats: {} });
    const bgUrl = o.bg;
    return UI.modal({ cls: 'mgmodal gpmodal', wide: true, bg: bgUrl, html: '<div id="gproot"></div>', buttons: [], onShow: (m, close) => {
      const root = m.querySelector('#gproot'); window.MG_HB = 0; if (window.Music) try { Music.setTrack('work'); } catch (e) { }
      let fin = false; const out = r => { if (fin) return; fin = true; window.MG_FAIL = null; if (window.Music) try { Music.setTrack('street'); } catch (e) { } close(r); };
      window.MG_FAIL = () => out({ completed: true, quality: .6, fallback: true, summary: '', lines: [] });
      GP.mount(id, root, o).then(out, e => { console.error(e); out({ completed: true, quality: .6, fallback: true, lines: [] }); });
    } });
  };
})();
