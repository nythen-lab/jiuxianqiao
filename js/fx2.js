// v1.0 动画扩展：赶路过场（不再用小面包车贴纸）、一班干完、模拟 MOBA 画面、澡堂、婚礼
(function () {
  const FX = window.FX; if (!FX) return; FX.ext = FX.ext || {};
  const G = window.G, C = window.CONFIG;
  const fmt = t => G.clock(Math.round(t));

  // ---------- 赶路：背景画慢慢横移 + 路灯光带 + 一条走时间的路线 ----------
  FX.ext.ride = function (k) {
    const { st, M, cx, later, say, end, dur, SFX, lines } = k;
    const from = cx.from, to = cx.to, ok = from != null && to != null;
    st.innerHTML = `<div class="mx-rd"><div class="mx-rd-glows">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i};--t:${2.2 + (i % 3) * 0.7}s;--y:${14 + (i * 13) % 52}%"></i>`).join('')}</div>
      <div class="mx-rd-time">${ok ? fmt(from) : ''}</div>
      <div class="mx-rd-route"><span class="a">${ok ? fmt(from) : '出发'}</span><div class="line"><i class="dash"></i><b class="dot"></b></div><span class="b">${ok ? fmt(to) : '到了'}</span></div></div>`;
    const ov = k.ov; ov.classList.add('mxr');
    const dot = st.querySelector('.dot'), tm = st.querySelector('.mx-rd-time'); const T0 = performance.now(); let raf = 0;
    const loop = now => { if (k.over()) return; const p = Math.min(1, (now - T0) / (dur * 0.82)); dot.style.left = (p * 100) + '%'; if (ok) tm.textContent = fmt(from + (to - from) * p); if (p < 1) raf = requestAnimationFrame(loop); else { st.querySelector('.mx-rd').classList.add('arrive'); } };
    raf = requestAnimationFrame(loop);
    SFX.play('motor'); say(lines[0] || '晃了一路，到了。'); later(() => SFX.play('chime'), dur * 0.84);
    later(() => end(), dur);
  };
  // ---------- 一班干完：一只钟，指针转 ----------
  FX.ext.shift = function (k) {
    const { st, cx, later, say, end, dur, SFX, lines } = k; const from = cx.from, to = cx.to, ok = from != null && to != null;
    st.innerHTML = `<div class="mx-sh"><svg viewBox="0 0 120 120" class="mx-sh-clk"><circle cx="60" cy="60" r="54" class="face"/>${Array.from({ length: 12 }, (_, i) => `<line x1="60" y1="10" x2="60" y2="${i % 3 ? 17 : 21}" transform="rotate(${i * 30} 60 60)"/>`).join('')}<line class="hh" x1="60" y1="60" x2="60" y2="32"/><line class="mh" x1="60" y1="60" x2="60" y2="20"/><circle cx="60" cy="60" r="4" class="pin"/></svg><div class="mx-sh-t">${ok ? fmt(from) : ''}</div></div>`;
    k.ov.classList.add('mxr');
    const hh = st.querySelector('.hh'), mh = st.querySelector('.mh'), tt = st.querySelector('.mx-sh-t'); const T0 = performance.now(); let last = -1;
    const loop = now => { if (k.over()) return; const p = Math.min(1, (now - T0) / (dur * 0.82)); if (ok) { const t = from + (to - from) * p; const m = ((t % 1440) + 1440) % 1440; hh.setAttribute('transform', `rotate(${(m / 720) * 360} 60 60)`); mh.setAttribute('transform', `rotate(${(m % 60) * 6} 60 60)`); tt.textContent = fmt(t); const tk = Math.floor(t / 45); if (tk !== last) { last = tk; SFX.play('tick'); } } if (p < 1) requestAnimationFrame(loop); };
    requestAnimationFrame(loop); say(lines[0] || '一点一点熬过去。'); later(() => SFX.play('chime'), dur * 0.85); later(() => end(), dur);
  };

  // ---------- 澡堂：热水从上面浇下来，镜面起雾，写字 ----------
  FX.bathPick = function (service, variant) { return window.SHOWS.bathPick(service, variant); };
  FX.ext.bath = function (k) {
    const { st, later, say, end, dur, SFX } = k;
    const spec = FX.bathPick(k.cx && k.cx.service, k.cx && k.cx.variant);
    const streams = Array.from({ length: 18 }, (_, i) => `<i style="--x:${8 + (i * 5) % 80}%;--d:${(i % 6) * .12}s"></i>`).join('');
    st.innerHTML = `<div class="bath-scene ${spec.id} v${spec.variant}" data-bath="${spec.key}"><div class="b-room"><div class="b-head"></div><div class="b-streams">${streams}</div><div class="b-dust"></div><div class="b-figure"><i class="b-face"></i><i class="b-towel"></i><i class="b-shoulder"></i></div><div class="b-hand"></div><div class="b-pool"></div><div class="b-ripples"><b></b><b></b><b></b></div><div class="b-steam"></div></div><p class="b-cap"></p></div>`;
    k.ov.classList.add('mxr', 'mxbath', 'bath-' + spec.id);
    const root = st.querySelector('.bath-scene');
    const cap = st.querySelector('.b-cap');
    const snd = { wash: 'water', soak: 'splash', rub: 'cloth' }[spec.id] || 'water';
    SFX.play(snd); cap.textContent = spec.lines[0]; say(spec.lines[0]);
    spec.steps.forEach((step, i) => later(() => { root.dataset.step = step; if (i === spec.steps.length - 1) { SFX.play('sighgood'); cap.textContent = spec.lines[1]; say(spec.lines[1]); } }, dur * (0.18 + i * 0.18)));
    later(() => end(), dur);
  };

  // ---------- 婚礼：红灯笼 + 彩纸 + 心 ----------
  FX.ext.wedding = function (k) {
    const { st, later, say, end, dur, SFX, lines } = k;
    const conf = Array.from({ length: 48 }, (_, i) => `<i style="--x:${(i * 23) % 100}%;--d:${(i % 9) * .22}s;--c:${['#e8433a', '#f2b24c', '#fff0c8', '#f08fa0'][i % 4]};--s:${6 + i % 5 * 2}px"></i>`).join('');
    st.innerHTML = `<div class="mx-wd"><div class="lan l1"></div><div class="lan l2"></div><div class="mx-wd-double">囍</div><div class="mx-wd-conf">${conf}</div></div>`;
    k.ov.classList.add('mxr', 'mxwed'); SFX.play('drum');
    (lines || []).forEach((t, i) => later(() => say(t), 400 + i * (dur * 0.7) / Math.max(1, lines.length)));
    later(() => { SFX.play('fanfare'); st.querySelector('.mx-wd').classList.add('pop'); }, dur * 0.45); later(() => SFX.play('chime'), dur * 0.7); later(() => end(), dur);
  };

  // ---------- 模拟 MOBA 画面（通用外观，无任何真实游戏的标志） ----------
  FX.ext.moba = function (k) {
    const { st, later, say, end, dur, SFX, rnd } = k;
    const W = 640, H = 360;
    st.innerHTML = `<div class="mx-mb"><canvas width="${W}" height="${H}"></canvas><div class="mx-mb-feed"></div><div class="mx-mb-chat"></div><div class="mx-mb-res"></div></div>`;
    k.ov.classList.add('mxr', 'mxmoba');
    const cv = st.querySelector('canvas'), g = cv.getContext('2d'), feed = st.querySelector('.mx-mb-feed'), chat = st.querySelector('.mx-mb-chat'), res = st.querySelector('.mx-mb-res');
    const BASE = [[74, 296], [566, 64]];
    const LANES = { top: [BASE[0], [58, 150], [64, 64], [320, 46], BASE[1]], mid: [BASE[0], [200, 200], [320, 180], [440, 150], BASE[1]], bot: [BASE[0], [180, 312], [330, 318], [574, 296], BASE[1]] };
    const polyLen = pts => { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; } return { L, seg }; };
    const PL = {}; Object.keys(LANES).forEach(n => PL[n] = polyLen(LANES[n]));
    const at = (lane, t) => { const pts = LANES[lane], { L, seg } = PL[lane]; let d = Math.max(0, Math.min(1, t)) * L; for (let i = 0; i < seg.length; i++) { if (d <= seg[i]) { const f = d / seg[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; } d -= seg[i]; } return pts[pts.length - 1]; };
    // 背景只画一次
    const bgc = document.createElement('canvas'); bgc.width = W; bgc.height = H; const b = bgc.getContext('2d');
    (() => { const gr = b.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#16301f'); gr.addColorStop(.5, '#1d3a26'); gr.addColorStop(1, '#2a2418'); b.fillStyle = gr; b.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) { b.fillStyle = `rgba(${40 + (i * 7) % 40},${80 + (i * 11) % 50},${50 + (i * 5) % 30},.35)`; b.beginPath(); b.arc((i * 83) % W, (i * 47) % H, 6 + (i % 5) * 4, 0, 7); b.fill(); }
      b.strokeStyle = 'rgba(70,140,190,.55)'; b.lineWidth = 34; b.lineCap = 'round'; b.beginPath(); b.moveTo(30, 40); b.bezierCurveTo(200, 180, 440, 190, 610, 330); b.stroke(); b.strokeStyle = 'rgba(120,190,230,.35)'; b.lineWidth = 22; b.stroke();
      Object.keys(LANES).forEach(n => { const pts = LANES[n]; b.strokeStyle = 'rgba(190,170,120,.55)'; b.lineWidth = 16; b.lineJoin = 'round'; b.beginPath(); pts.forEach((p, i) => i ? b.lineTo(p[0], p[1]) : b.moveTo(p[0], p[1])); b.stroke(); b.strokeStyle = 'rgba(95,80,55,.9)'; b.lineWidth = 12; b.stroke(); });
      [[190, 120], [450, 250], [150, 250], [490, 110], [320, 250], [330, 100]].forEach(([x, y]) => { b.fillStyle = 'rgba(15,35,20,.7)'; b.beginPath(); b.ellipse(x, y, 34, 22, .4, 0, 7); b.fill(); });
    })();
    // 实体
    const ICONS = ['剑', '弓', '盾', '法', '刺'];
    const hero = (team, i) => ({ team, i, lane: ['top', 'mid', 'bot', 'bot', 'mid'][i], t: team ? .8 : .2, hp: 1, dead: 0, ic: ICONS[i], ph: Math.random() * 6, cd: [0, 0, 0] });
    const heroes = [0, 1].flatMap(t => [0, 1, 2, 3, 4].map(i => hero(t, i)));
    const towers = []; [0, 1].forEach(t => ['top', 'mid', 'bot'].forEach(l => [0.28, 0.5].forEach(tt => towers.push({ team: t, lane: l, t: t ? 1 - tt : tt, hp: 1, flash: 0 }))));
    const minions = []; const fx = []; const nums = []; let kills = [0, 0], gameT = 0, round = 0, running = true, nexus = [1, 1], winner = 0, pushing = 0, T0 = performance.now(), roundStart = T0, ROUND = (dur * 0.5) - 700, shake = 0;
    const log = (txt, cls) => { const p = document.createElement('p'); p.className = cls || ''; p.textContent = txt; feed.appendChild(p); while (feed.children.length > 4) feed.firstChild.remove(); setTimeout(() => p.classList.add('old'), 2200); };
    const say2 = (txt) => { const p = document.createElement('p'); p.textContent = txt; chat.appendChild(p); while (chat.children.length > 3) chat.firstChild.remove(); };
    const CHAT = ['队友：这路崩了，来人！', '队友：别送！别送！', '队友：抢龙！', '我：我这路没蓝了……', '队友：漂亮！', '队友：对面 5 个人都在下路', '队友：稳住，我们发育', '队友：谁把水晶守一下', '我：别急，我来了'];
    const burst = (x, y, col, r) => fx.push({ x, y, col, r: r || 40, t: 0 }); const num = (x, y, v, col) => nums.push({ x, y, v, col, t: 0 });
    const newRound = () => { round++; winner = Math.random() < .55 ? 0 : 1; kills = [0, 0]; nexus = [1, 1]; towers.forEach(t => t.hp = 1); heroes.forEach(h => { h.hp = 1; h.dead = 0; }); minions.length = 0; pushing = 0; roundStart = performance.now(); gameT = 0; log(`第 ${round} 局开始`, 'sys'); SFX.play('beep'); chat.innerHTML = ''; say2(rnd(CHAT)); };
    const kill = (team) => { const victim = heroes.filter(h => h.team !== team && !h.dead)[Math.floor(Math.random() * 5)] || null; if (!victim) return; victim.dead = 2.2; victim.hp = 0; kills[team]++; const [x, y] = at(victim.lane, victim.team ? 1 - victim.t : victim.t); burst(x, y, team ? '#ff6a5a' : '#6ab8ff', 52); SFX.play('pop'); shake = .25; const c = kills[team]; log(team ? '红方击杀了蓝方英雄' : '蓝方击杀了红方英雄', team ? 'red' : 'blue'); if (team === 0 && c >= 2) log(c === 2 ? '双杀！' : c === 3 ? '三杀！' : '连杀！', 'big'); };
    const plan = [[.14, () => { kill(winner ^ (Math.random() < .35 ? 1 : 0)); say2(rnd(CHAT)); }], [.28, () => { kill(winner); kill(Math.random() < .5 ? 0 : 1); }], [.42, () => { const t = towers.find(t => t.team !== winner && t.hp > 0 && t.lane === 'bot'); if (t) { t.hp = 0; const [x, y] = at(t.lane, t.t); burst(x, y, '#ffd36a', 70); log('防御塔被摧毁！', 'big'); SFX.play('stamp'); shake = .4; } say2(rnd(CHAT)); }], [.56, () => { for (let i = 0; i < 3; i++) kill(winner); log('团战！', 'big'); SFX.play('drum'); }], [.7, () => { towers.filter(t => t.team !== winner).forEach(t => { if (t.hp > 0 && Math.random() < .7) { t.hp = 0; const [x, y] = at(t.lane, t.t); burst(x, y, '#ffd36a', 60); } }); say2(rnd(CHAT)); pushing = 1; }], [.88, () => { pushing = 2; kill(winner); }]];
    let planI = 0;
    const win = () => { running = false; const [bx, by] = BASE[winner ^ 1]; for (let i = 0; i < 6; i++) setTimeout(() => burst(bx + (Math.random() - .5) * 40, by + (Math.random() - .5) * 40, '#ffd36a', 60 + i * 12), i * 90); nexus[winner ^ 1] = 0; shake = .8; SFX.play('stamp'); const you = winner === 0; res.textContent = you ? '胜利' : '失败'; res.className = 'mx-mb-res show ' + (you ? 'win' : 'lose'); SFX.play(you ? 'fanfare' : 'sigh'); log(you ? '敌方水晶爆炸了' : '我方水晶爆炸了', 'big'); };
    newRound(); let lastSpawn = 0, raf = 0, lastF = performance.now();
    const draw = now => {
      if (k.over()) return; const dt = Math.min(.05, (now - lastF) / 1000); lastF = now; const el = now - roundStart, p = Math.min(1, el / ROUND);
      if (running) { gameT = p * 18.6 * 60; while (planI < plan.length && p >= plan[planI][0]) { plan[planI][1](); planI++; } if (p >= 1) win(); }
      if (running && now - lastSpawn > 900) { lastSpawn = now; ['top', 'mid', 'bot'].forEach(l => [0, 1].forEach(t => { minions.push({ team: t, lane: l, t: t ? 1 : 0, off: Math.random() * 6 }); })); }
      minions.forEach(m => { const sp = (m.team ? -1 : 1) * 0.07 * dt * (pushing && m.team === winner ? 1.6 : 1); m.t += sp; }); for (let i = minions.length - 1; i >= 0; i--) { const m = minions[i]; if (m.t > 1.02 || m.t < -.02 || Math.random() < dt * .05) { if (Math.random() < .6 && m.t > .1 && m.t < .9) { const [x, y] = at(m.lane, m.t); burst(x, y, '#ffffff', 10); } minions.splice(i, 1); } }
      heroes.forEach(h => { if (h.dead > 0) { h.dead -= dt; if (h.dead <= 0) { h.hp = 1; h.t = h.team ? .9 : .1; } return; } const base = h.team === winner ? .5 + (pushing ? .22 * pushing : .0) : .5 - (pushing ? .12 * pushing : 0); const side = h.team ? -1 : 1; const target = .5 + side * (-.22 + (h.team === winner ? .2 + (pushing || 0) * .13 : -.04 * (pushing || 0))) + Math.sin(now / 900 + h.ph) * .05; h.t += ((h.team ? 1 - target : target) - h.t) * dt * .9; h.cd = h.cd.map(c => Math.max(0, c - dt)); if (Math.random() < dt * 1.4) { const q = Math.floor(Math.random() * 3); if (h.cd[q] <= 0) { h.cd[q] = 2 + Math.random() * 3; const [x, y] = at(h.lane, h.team ? 1 - h.t : h.t); fx.push({ x, y, col: h.team ? '#ff7a6a' : '#7ac4ff', r: 24 + q * 10, t: 0, beam: q === 1 ? [x + (h.team ? -1 : 1) * 60, y + (Math.random() - .5) * 40] : null }); if (Math.random() < .5) num(x, y - 14, Math.floor(80 + Math.random() * 420), h.team ? '#ff9c8a' : '#9cd4ff'); } } });
      // draw
      g.save(); if (shake > 0) { shake -= dt; g.translate((Math.random() - .5) * 8 * shake, (Math.random() - .5) * 6 * shake); } g.drawImage(bgc, 0, 0);
      BASE.forEach((bs, i) => { const alive = nexus[i]; const col = i ? '#e5584a' : '#4fa8ee'; g.save(); g.translate(bs[0], bs[1]); g.fillStyle = col + '33'; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill(); if (alive) { g.fillStyle = col; g.beginPath(); for (let j = 0; j < 6; j++) { const a = j * Math.PI / 3 + now / 1500; g.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); } g.closePath(); g.fill(); g.strokeStyle = '#fff8'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 6 + Math.sin(now / 200) * 1.5, 0, 7); g.fill(); } else { g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); } g.restore(); });
      towers.forEach(t => { if (t.hp <= 0) return; const [x, y] = at(t.lane, t.t); const col = t.team ? '#e5584a' : '#4fa8ee'; g.fillStyle = '#0006'; g.fillRect(x - 8, y + 6, 16, 5); g.fillStyle = col; g.fillRect(x - 6, y - 10, 12, 18); g.fillStyle = '#ffe9a0'; g.fillRect(x - 3, y - 14, 6, 6); });
      minions.forEach(m => { const [x, y] = at(m.lane, m.t); g.fillStyle = m.team ? '#ff8f7f' : '#8fcaff'; g.beginPath(); g.arc(x + m.off - 3, y + m.off * .5 - 1.5, 3.2, 0, 7); g.fill(); });
      heroes.forEach(h => { if (h.dead > 0) { const [x, y] = at(h.lane, h.team ? 1 - h.t : h.t); g.fillStyle = '#8886'; g.font = '700 12px sans-serif'; g.textAlign = 'center'; g.fillText(Math.ceil(h.dead) + '', x, y + 4); return; } const [x, y] = at(h.lane, h.team ? 1 - h.t : h.t); const col = h.team ? '#e5584a' : '#4fa8ee'; const wob = Math.sin(now / 160 + h.ph) * 1.4; g.fillStyle = '#0005'; g.beginPath(); g.ellipse(x, y + 12, 11, 4, 0, 0, 7); g.fill(); g.fillStyle = '#1b1b1f'; g.beginPath(); g.arc(x, y + wob, 12.5, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x, y + wob, 10.5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '800 12px sans-serif'; g.textAlign = 'center'; g.fillText(h.ic, x, y + wob + 4.3); g.fillStyle = '#000a'; g.fillRect(x - 13, y - 21, 26, 4); g.fillStyle = '#5be07a'; g.fillRect(x - 12, y - 20, 24 * h.hp, 2); if (h.team === 0 && h.i === 0) { g.strokeStyle = '#ffd36a'; g.lineWidth = 2; g.beginPath(); g.arc(x, y + wob, 15, 0, 7); g.stroke(); } });
      for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.t += dt * 2.2; if (f.t >= 1) { fx.splice(i, 1); continue; } g.strokeStyle = f.col; g.globalAlpha = 1 - f.t; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, f.r * f.t, 0, 7); g.stroke(); if (f.beam) { g.lineWidth = 4; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.beam[0], f.beam[1]); g.stroke(); } g.globalAlpha = 1; }
      for (let i = nums.length - 1; i >= 0; i--) { const n = nums[i]; n.t += dt * 1.4; if (n.t >= 1) { nums.splice(i, 1); continue; } g.globalAlpha = 1 - n.t; g.fillStyle = n.col; g.font = '800 13px sans-serif'; g.textAlign = 'center'; g.fillText(n.v, n.x, n.y - n.t * 22); g.globalAlpha = 1; }
      g.restore();
      // HUD
      g.fillStyle = 'rgba(8,12,18,.78)'; g.fillRect(W / 2 - 110, 0, 220, 30); g.fillStyle = '#4fa8ee'; g.font = '800 20px sans-serif'; g.textAlign = 'center'; g.fillText(kills[0], W / 2 - 78, 22); g.fillStyle = '#e5584a'; g.fillText(kills[1], W / 2 + 78, 22); g.fillStyle = '#f3ead8'; g.font = '700 14px sans-serif'; const gm = Math.floor(gameT / 60), gs = Math.floor(gameT % 60); g.fillText(`${String(gm).padStart(2, '0')}:${String(gs).padStart(2, '0')}`, W / 2, 21); g.fillStyle = '#9aa5b3'; g.font = '600 11px sans-serif'; g.fillText(`第 ${round} 局 / 共 2 局`, W / 2, 44);
      // 左下技能栏
      for (let q = 0; q < 4; q++) { const x = 18 + q * 38, y = H - 46; g.fillStyle = '#0c1118'; g.fillRect(x, y, 32, 32); g.strokeStyle = '#6a7788'; g.lineWidth = 1.5; g.strokeRect(x, y, 32, 32); g.fillStyle = '#ffd36a'; g.font = '800 14px sans-serif'; g.textAlign = 'center'; g.fillText('QWER'[q], x + 16, y + 21); const c = q < 3 ? heroes[0].cd[q] : 0; if (c > 0) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x, y, 32, 32 * Math.min(1, c / 4)); } }
      g.fillStyle = '#0008'; g.fillRect(18, H - 54, 146, 5); g.fillStyle = '#5be07a'; g.fillRect(18, H - 54, 146 * (heroes[0].dead > 0 ? 0 : .8 + Math.sin(now / 700) * .1), 5);
      // 小地图
      const mx = W - 98, my = H - 98; g.fillStyle = 'rgba(8,12,18,.8)'; g.fillRect(mx, my, 90, 90); g.strokeStyle = '#6a7788'; g.strokeRect(mx, my, 90, 90); heroes.forEach(h => { if (h.dead > 0) return; const [x, y] = at(h.lane, h.team ? 1 - h.t : h.t); g.fillStyle = h.team ? '#e5584a' : '#4fa8ee'; g.beginPath(); g.arc(mx + x / W * 90, my + y / H * 90, 2.4, 0, 7); g.fill(); }); towers.forEach(t => { if (t.hp <= 0) return; const [x, y] = at(t.lane, t.t); g.fillStyle = t.team ? '#e5584a' : '#4fa8ee'; g.fillRect(mx + x / W * 90 - 1.5, my + y / H * 90 - 1.5, 3, 3); });
      if (!k.over()) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); SFX.play('beep');
    // 第二局：第一局结算后换局
    later(() => { if (!running) { res.className = 'mx-mb-res'; res.textContent = ''; running = true; planI = 0; newRound(); } }, dur * 0.5);
    later(() => { if (running) win(); }, dur - 1300);
    later(() => end(), dur);
  };
})();
