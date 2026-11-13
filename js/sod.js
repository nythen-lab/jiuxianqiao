// v1.0.1 · 绿化铺草皮 重做：
//  主玩法「接草皮」——像接水管：点草皮把它转 90°，让缝对上（颜色、花纹一致才算严丝合缝），从草皮卷一路接到验收旗；
//  副玩法「拼草皮」——消消乐：点相邻两块换位，三块同样的草皮连成一线就铺平。
//  第一次玩有短教程；工时跟游戏内时钟走；每一次扣分都有提示和声音。
(function () {
  const MG = window.MG; const SFX = MG.sfx;
  const W = 900, H = 470, INK = '#1d1a18';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rr = (ctx, x, y, w, h, r, fill, stroke, lw) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  const txt = (ctx, s, x, y, size, color, align, bold) => { ctx.font = `${bold ? '700 ' : ''}${size || 16}px ${FONT}`; ctx.fillStyle = color || '#f3ead8'; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); };
  const clockStr = (startH, frac, hours) => { const m = Math.floor((startH * 60 + frac * hours * 60) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function loop(fn) { const born = performance.now(); let last = born, alive = true; const step = now => { if (!alive) return; if (window.MG_KILL > born) { alive = false; return; } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (window.MG_SAFE(fn, dt) === false) { alive = false; return; } requestAnimationFrame(step); }; requestAnimationFrame(step); return () => { alive = false; }; }
  function setup(root, title, help) {
    root.innerHTML = `<div class="mg"><div class="mg-top"><b>${title}</b><span class="mg-help">${help}</span></div>
      <canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px;touch-action:none"></canvas><div class="mg-bar"></div></div>`;
    const cv = root.querySelector('canvas'); const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    const img = new Image(); img.src = 'img/bg-job-green.jpg';
    return { cv, ctx, bar: root.querySelector('.mg-bar'), bg: () => img.complete && img.naturalWidth ? img : null };
  }
  function paintBg(ctx, img) { if (img) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); const iw = img.naturalWidth * s, ih = img.naturalHeight * s; ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih); } else { ctx.fillStyle = '#35412c'; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = 'rgba(8,14,8,.55)'; ctx.fillRect(0, 0, W, H); }
  const flag = (k, set) => { try { const s = G.S(); s.flags = s.flags || {}; if (set) s.flags[k] = 1; return !!s.flags[k]; } catch (e) { return false; } };
  const fx = n => { try { window.FX && FX.sfx && FX.sfx.play(n); } catch (e) { } };

  // ---------- 声音 ----------
  const S = {
    rot() { SFX.tone(420, 700, .07, .16); SFX.noise(0, .04, 2600, .07, 'bandpass'); },
    snap() { SFX.thud(.2); SFX.tone(700, 1100, .09, .12); },
    link(i) { const f = 440 * Math.pow(1.0595, (i * 2) % 19); SFX.tone(f, f * 1.5, .16, .14); },
    bad() { SFX.tone(240, 110, .24, .26); SFX.noise(0, .1, 320, .14); },
    stone() { SFX.thud(.7); },
    swap() { SFX.tone(360, 520, .09, .14); },
    pop(c) { const f = 520 * Math.pow(1.122, Math.min(c, 8)); SFX.tone(f, f * 1.6, .14, .16); SFX.noise(0, .06, 3000, .07, 'bandpass'); },
    land() { SFX.thud(.12); },
    win() { fx('fanfare'); },
    done() { fx('chime'); },
    coin() { fx('coin'); }
  };

  // ---------- 草皮样式：三种颜色 × 三种花纹（颜色盲也分得清）----------
  const PAL = [
    { name: '翠绿', base: '#68ad3b', lite: '#9ad65c', dark: '#3c7727', pat: 'blade' },
    { name: '黄绿', base: '#b3c43a', lite: '#dbe86c', dark: '#7d8b20', pat: 'daisy' },
    { name: '墨绿', base: '#2e7d52', lite: '#55b07c', dark: '#1d5136', pat: 'stripe' }
  ];
  const EXTRA = [ // 拼草皮用的另两种
    { name: '紫花', base: '#7b9a4a', lite: '#a8c86e', dark: '#4e6a2c', pat: 'violet' },
    { name: '带泥', base: '#8f7a3d', lite: '#b8a05a', dark: '#5f4e24', pat: 'mud' }
  ];
  const sprCache = {};
  function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2); fn(g, w, h); return c; }
  function patternOn(g, p, w, h, seed) {
    let s = seed * 9301 + 49297; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    if (p.pat === 'blade' || p.pat === 'mud' || p.pat === 'violet') { g.lineWidth = 1.2; for (let i = 0; i < w * h / 60; i++) { const x = r() * w, y = r() * h; g.strokeStyle = r() < .5 ? p.lite : p.dark; g.globalAlpha = .55; g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + 1, y, x + (r() - .5) * 4, y - 4 - r() * 3); g.stroke(); } g.globalAlpha = 1; }
    if (p.pat === 'daisy') { g.globalAlpha = .5; g.strokeStyle = p.dark; g.lineWidth = 1; for (let i = 0; i < w * h / 90; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x + 1, y - 3); g.stroke(); } g.globalAlpha = 1; for (let i = 0; i < Math.max(3, w * h / 420); i++) { const x = 4 + r() * (w - 8), y = 4 + r() * (h - 8); g.fillStyle = '#fffdf0'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.2566) * 2.2, y + Math.sin(k * 1.2566) * 2.2, 1.5, 0, 7); g.fill(); } g.fillStyle = '#f2b830'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill(); } }
    if (p.pat === 'stripe') { for (let y = 0; y < h; y += 9) { g.fillStyle = (Math.floor(y / 9) % 2) ? 'rgba(255,255,255,.13)' : 'rgba(0,0,0,.14)'; g.fillRect(0, y, w, 4.5); } }
    if (p.pat === 'violet') { for (let i = 0; i < Math.max(3, w * h / 520); i++) { const x = 4 + r() * (w - 8), y = 4 + r() * (h - 8); g.fillStyle = '#b48ad8'; g.beginPath(); g.arc(x, y, 2.2, 0, 7); g.fill(); g.fillStyle = '#f4e6ff'; g.beginPath(); g.arc(x, y, .9, 0, 7); g.fill(); } }
    if (p.pat === 'mud') { for (let i = 0; i < w * h / 150; i++) { g.fillStyle = 'rgba(70,45,20,.35)'; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 2, 0, 7); g.fill(); } }
  }
  function strip(c, ts) { // 一条朝北的草皮带：从中心伸到边
    const k = 's' + c + '_' + ts; if (sprCache[k]) return sprCache[k]; const p = PAL[c], w = Math.round(ts * .48), h = Math.round(ts / 2 + 3);
    return sprCache[k] = mk(w, h, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, p.dark); gr.addColorStop(.18, p.base); gr.addColorStop(.5, p.lite); gr.addColorStop(.82, p.base); gr.addColorStop(1, p.dark); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.save(); g.beginPath(); g.rect(1.5, 0, w - 3, h); g.clip(); patternOn(g, p, w, h, c + 3); g.restore(); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 0, w, 1.6); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(2, 0, 2, h); });
  }
  function hub(c, ts) {
    const k = 'h' + c + '_' + ts; if (sprCache[k]) return sprCache[k]; const p = PAL[c], d = Math.round(ts * .56);
    return sprCache[k] = mk(d, d, (g, w, h) => { const gr = g.createRadialGradient(w * .4, h * .35, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, p.lite); gr.addColorStop(.7, p.base); gr.addColorStop(1, p.dark); g.beginPath(); g.arc(w / 2, h / 2, w / 2 - .5, 0, 7); g.fillStyle = gr; g.fill(); g.save(); g.clip(); patternOn(g, p, w, h, c + 7); g.restore(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke(); });
  }
  function soil(ts, v) {
    const k = 'o' + ts + '_' + v; if (sprCache[k]) return sprCache[k];
    return sprCache[k] = mk(ts, ts, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7a5a3a'); gr.addColorStop(1, '#54402a'); g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 7); g.fillStyle = gr; g.fill(); g.save(); g.clip(); let s = v * 777 + 5; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 26; i++) { g.fillStyle = r() < .5 ? 'rgba(40,26,14,.35)' : 'rgba(255,230,190,.14)'; g.beginPath(); g.arc(r() * w, r() * h, .8 + r() * 2.2, 0, 7); g.fill(); } g.restore(); g.lineWidth = 2; g.strokeStyle = '#2a1d11'; g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, 7); g.stroke(); g.strokeStyle = 'rgba(255,230,190,.2)'; g.lineWidth = 1; g.beginPath(); g.roundRect(3.5, 3.5, w - 7, h - 7, 6); g.stroke(); });
  }
  function block(kind, ts) { // 拼草皮：整块草皮
    const k = 'b' + kind + '_' + ts; if (sprCache[k]) return sprCache[k]; const p = kind < 3 ? PAL[kind] : EXTRA[kind - 3];
    return sprCache[k] = mk(ts, ts, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(4, 6, w - 6, h - 6, 9); g.fill(); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, p.lite); gr.addColorStop(.35, p.base); gr.addColorStop(1, p.dark); g.beginPath(); g.roundRect(3, 3, w - 7, h - 8, 9); g.fillStyle = gr; g.fill(); g.save(); g.clip(); patternOn(g, p, w, h, kind + 11); g.restore(); g.lineWidth = 2; g.strokeStyle = 'rgba(15,30,10,.75)'; g.stroke(); g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.roundRect(6, 5, w - 14, 5, 3); g.fill(); g.fillStyle = 'rgba(70,45,20,.9)'; g.fillRect(8, h - 9, w - 18, 3); });
  }

  // ================================================================
  MG.green = function (root, o) {
    const mode = o.mode || (!flag('seenSodP') ? 'pipe' : (Math.random() < 0.65 ? 'pipe' : 'match'));
    return mode === 'match' ? matchGame(root, o) : pipeGame(root, o);
  };

  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // 上 右 下 左
  // ================= 接草皮（接水管）=================
  function pipeGame(root, o) {
    return new Promise(resolve => {
      const tut0 = !o.noTut && !flag('seenSodP');
      const { cv, ctx, bar, bg } = setup(root, '绿化铺草皮 · 08:00–17:00', '点草皮<b>转 90°</b>，让左边的草皮卷一路接到右边验收旗。<b>颜色和花纹对上</b>才算严丝合缝。');
      bar.innerHTML = `<button class="mg-btn" id="mg-accept" style="display:none">凑合验收（带色差）</button><button class="mg-btn" id="mg-hint">看图纸（耽误 3 秒）</button><button class="mg-btn ghost" id="mg-tutskip" style="display:none">练习结束</button><button class="mg-btn ghost" id="mg-quit">不干了，走人</button>`;
      const DUR = o.dur || 70, HOURS = 9, START = 8, MAXTO = 4;
      const perf = o.perf || { win: 1 };
      const st = MG.cur = { type: 'sod', mode: 'pipe', t: 0, done: false, roundN: 0, state: 'play', stT: 0, board: null, rounds: [], doneN: 0, mism: 0, timeouts: 0, score: 0, msg: null, msgT: 0, parts: [], texts: [], shake: 0, tut: tut0 ? { step: 0 } : null, hint: 0, fatigue: o.tired ? 1 : 0, taps: 0, target: Math.max(1, Math.round(DUR / 18)) };
      const sizes = [[5, 4], [6, 4], [6, 5], [7, 5], [7, 5], [7, 5]];
      let rid = 0;
      function genBoard(round, tutorial) {
        const [cols, rows] = tutorial ? [4, 3] : sizes[Math.min(round, sizes.length - 1)];
        const nCol = tutorial ? 1 : round < 1 ? 1 : round < 3 ? 2 : 3;
        const ts = Math.min(76, Math.floor(560 / cols), Math.floor(318 / rows));
        const bw = cols * ts, bh = rows * ts, bx = Math.round(250 + (590 - bw) / 2), by = Math.round(100 + (330 - bh) / 2);
        const sr = ri(0, rows - 1), er = ri(0, rows - 1);
        // 随机自避路径：从 (0,sr) 走到 (cols-1,er)
        let path = null;
        for (let tries = 0; tries < 60 && !path; tries++) {
          const seen = new Set(), pth = []; let nodes = 0;
          const dfs = (x, y) => {
            if (++nodes > 4000) return false; seen.add(x + ',' + y); pth.push([x, y]);
            if (x === cols - 1 && y === er && pth.length >= Math.min(cols + 1, 6)) return true;
            const ds = [0, 1, 2, 3].sort(() => Math.random() - .5).sort((a, b) => (b === 1 ? .9 : 0) - (a === 1 ? .9 : 0) + (Math.random() - .5) * .6);
            for (const d of ds) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen.has(nx + ',' + ny)) continue; if (nx === cols - 1 && ny !== er && false) continue; if (dfs(nx, ny)) return true; }
            pth.pop(); seen.delete(x + ',' + y); return false;
          };
          if (dfs(0, sr)) path = pth.slice();
        }
        if (!path) { path = []; for (let x = 0; x < cols; x++) path.push([x, sr]); let y = sr; const step = er > sr ? 1 : -1; while (y !== er) { y += step; path.push([cols - 1, y]); } /* 兜底：直线加拐 */ path = path.filter((p, i, a) => a.findIndex(q => q[0] === p[0] && q[1] === p[1]) === i); }
        const cells = []; for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push({ x, y, open: [0, 0, 0, 0], col: [0, 0, 0, 0], r: 0, a: 0, v: 0, rock: false, path: false, solR: 0, pop: 0, lit: false, seed: ri(1, 3) });
        const at = (x, y) => cells[y * cols + x];
        const seam = Array.from({ length: path.length + 1 }, () => ri(0, nCol - 1));
        const dirOf = (a, b) => DIRS.findIndex(d => a[0] + d[0] === b[0] && a[1] + d[1] === b[1]);
        path.forEach((p, i) => { const c = at(p[0], p[1]); c.path = true; const dIn = i === 0 ? 3 : (dirOf(p, path[i - 1])), dOut = i === path.length - 1 ? 1 : dirOf(p, path[i + 1]); c.open[dIn] = 1; c.open[dOut] = 1; c.col[dIn] = seam[i]; c.col[dOut] = seam[i + 1]; });
        const shapes = [[1, 0, 1, 0], [1, 1, 0, 0], [1, 1, 0, 1], [1, 0, 0, 0], [1, 1, 1, 1], [1, 0, 1, 0], [1, 1, 0, 0]];
        const nRock = tutorial ? 0 : Math.min(3, round);
        let rocks = 0;
        cells.forEach(c => { if (c.path) return; if (rocks < nRock && Math.random() < .14) { c.rock = true; rocks++; return; } const sh = pick(shapes); for (let d = 0; d < 4; d++) { c.open[d] = sh[d]; c.col[d] = ri(0, nCol - 1); } });
        // 起点终点的颜色：入口 / 出口颜色跟第一段一致
        const sc = seam[0], ec = seam[path.length];
        // 记下正确转法，然后打乱
        cells.forEach(c => { c.solR = 0; c.r = 0; });
        cells.forEach(c => { if (c.rock) return; const k = ri(0, 3); c.r = k; });
        const b = { cols, rows, ts, bx, by, bw, bh, cells, path, sr, er, sc, ec, par: 0, moves: 0, startT: 0, limit: tutorial ? 9999 : Math.round((20 + cols * rows * .5) * (st.fatigue ? .85 : 1)), tutorial: !!tutorial, id: ++rid, flagWave: 0, doneAt: 0, mismatch: 0, lastLit: 0 };
        // 确保路径不是一开始就接上的
        // 路径格：保持出厂的 open/col（已经是正确朝向，r=0 即解），然后随机转
        path.forEach(p => { const c = at(p[0], p[1]); c.solR = 0; });
        const scr = () => { path.forEach((p, k) => { const c = at(p[0], p[1]); c.r = (tutorial ? (k === 1 || k === 3 || k === 4 ? ri(1, 3) : 0) : ri(0, 3)); }); };
        scr(); for (let g = 0; g < 20 && path.every(p => at(p[0], p[1]).r % 4 === 0) ; g++) scr();
        cells.forEach(c => { c.a = c.r * Math.PI / 2; });
        b.par = path.filter(p => at(p[0], p[1]).r % 4 !== 0).length || 1;
        b.at = at; return b;
      }
      // 旋转后的朝向：base open[i] 转了 r 次之后落在哪一边
      const sideOpen = (c, d) => c.open[((d - c.r) % 4 + 4) % 4] === 1;
      const sideCol = (c, d) => c.col[((d - c.r) % 4 + 4) % 4];
      function lightUp(b) { // 从草皮卷出发，沿接上的缝点亮
        b.cells.forEach(c => { c.lit = false; c.gap = []; c.mm = []; });
        const first = b.at(0, b.sr); const q = []; let mm = 0, links = 0; b.litList = []; const seamSeen = new Set();
        if (!first.rock && sideOpen(first, 3)) { first.lit = true; q.push(first); b.litList.push(first); if (sideCol(first, 3) !== b.sc) { first.mm.push(3); mm++; } links++; } else first.gap = [3];
        let reach = false;
        while (q.length) {
          const c = q.shift();
          for (let d = 0; d < 4; d++) {
            if (!sideOpen(c, d)) continue; const nx = c.x + DIRS[d][0], ny = c.y + DIRS[d][1];
            if (nx >= b.cols) { if (c.y === b.er) { reach = true; if (sideCol(c, 1) !== b.ec) { c.mm.push(1); mm++; } links++; } else c.gap.push(d); continue; }
            if (nx < 0 || ny < 0 || ny >= b.rows) { c.gap.push(d); continue; }
            const n = b.at(nx, ny); const od = (d + 2) % 4;
            if (n.rock || !sideOpen(n, od)) { c.gap.push(d); continue; }
            { const key = [c.y * b.cols + c.x, n.y * b.cols + n.x].sort((u, v) => u - v).join('-'); if (!seamSeen.has(key)) { seamSeen.add(key); links++; if (sideCol(c, d) !== sideCol(n, od)) { mm++; } } if (sideCol(c, d) !== sideCol(n, od)) c.mm.push(d); }
            if (!n.lit) { n.lit = true; q.push(n); b.litList.push(n); }
          }
        }
        b.reach = reach; b.mismatch = mm; b.links = links; return b;
      }
      const say = (m, t, red) => { st.msg = m; st.msgT = t || 1.6; st.red = !!red; };
      const text = (s, x, y, color, big) => st.texts.push({ s, x, y, c: color || '#fff2a8', t: 0, big });
      const burst = (x, y, n, cols) => { for (let i = 0; i < n; i++) st.parts.push({ x, y, vx: rnd(-90, 90), vy: rnd(-150, -30), l: rnd(.5, 1.1), t: 0, c: pick(cols || ['#9ad65c', '#68ad3b', '#dbe86c']), s: rnd(2, 4.5) }); };
      function newRound() {
        const tut = st.tut && !st.tut.over;
        st.board = genBoard(tut ? 0 : st.roundN, tut); lightUp(st.board); st.state = 'play'; st.stT = 0; st.board.startT = st.t; st.hl = null;
        if (tut) st.tut.step = 0;
      }
      function nextTap(b) { // 下一块要点的草皮（教程手指 + 自动玩家用）
        for (const p of b.path) { const c = b.at(p[0], p[1]); const need = ((c.solR - c.r) % 4 + 4) % 4; if (need) return { c, need }; } return null;
      }
      function rotate(c, dir) {
        const b = st.board; if (st.state !== 'play' || st.done) return;
        if (c.rock) { c.shake = .35; S.stone(); say('石头，转不动——绕开走。', 1.3, true); text('石头！', b.bx + c.x * b.ts + b.ts / 2, b.by + c.y * b.ts, '#ffb4a8'); return; }
        const wasLit = new Set(b.litList), wasReach = b.reach;
        c.r = (c.r + dir + 4) % 4; c.tgt = (c.tgt == null ? c.a : c.tgt) + dir * Math.PI / 2; c.pop = 1; b.moves++; st.taps++; S.rot();
        lightUp(b);
        const nowLit = b.litList.filter(x => !wasLit.has(x)); const lost = [...wasLit].filter(x => !x.lit);
        nowLit.forEach((x, i) => setTimeout(() => { if (!st.done) { S.link(b.litList.indexOf(x)); burst(b.bx + x.x * b.ts + b.ts / 2, b.by + x.y * b.ts + b.ts / 2, 5); } }, 60 + i * 70));
        if (lost.length) { S.bad(); say(`断开了！${lost.length} 块草皮没接上。`, 1.3, true); lost.forEach(x => { x.crack = .6; }); st.shake = .15; }
        else if (nowLit.length) say(nowLit.length > 1 ? `接上了 ${nowLit.length} 块！` : '接上了一块。', 1, false);
        if (c.mm && c.mm.length) { text('色差', b.bx + c.x * b.ts + b.ts / 2, b.by + c.y * b.ts, '#ffd27a'); }
        if (st.tut) tutAdvance('rot');
        if (b.reach) {
          if (b.mismatch === 0) { settle(true); }
          else { document.getElementById('mg-accept').style.display = ''; say(`接通了，但还有 ${b.mismatch} 处色差（黄叹号）。再转转，或「凑合验收」。`, 3.2, true); S.bad(); }
        } else document.getElementById('mg-accept').style.display = 'none';
        if (b.reach && b.mismatch === 0 && !wasReach) { }
      }
      function tutAdvance(ev) {
        const T = st.tut; if (!T || T.over) return;
        if (T.step === 0 && ev === 'rot') T.step = 1;
        else if (T.step === 1 && ev === 'rot') T.step = 2;
      }
      function settle(perfect) {
        const b = st.board; if (st.state !== 'play') return; st.state = 'win'; st.stT = 0; b.doneAt = st.t; document.getElementById('mg-accept').style.display = 'none';
        const links = Math.max(1, b.links), seamQ = clamp(1 - b.mismatch / links, 0, 1);
        const used = st.t - b.startT, speed = b.tutorial ? 1 : clamp(1 - used / b.limit * .75, .15, 1), eff = clamp(b.par / Math.max(1, b.moves), .3, 1);
        const q = b.tutorial ? 1 : .5 * seamQ + .25 * speed + .25 * eff; const pts = Math.round(100 * q + (perfect ? 50 : 0));
        b.res = { q, seamQ, speed, eff, pts, mismatch: b.mismatch, perfect, moves: b.moves, used };
        if (!b.tutorial) { st.rounds.push(b.res); st.doneN++; st.score += pts; st.mism += b.mismatch; }
        b.litList.forEach((x, i) => setTimeout(() => { if (!st.done) { S.snap(); S.link(i + 3); x.pop = 1; burst(b.bx + x.x * b.ts + b.ts / 2, b.by + x.y * b.ts + b.ts / 2, 7); } }, i * 80));
        setTimeout(() => { if (st.done) return; if (perfect) { S.win(); say(b.tutorial ? '好！这就是铺草皮。开工，计时开始！' : `严丝合缝！+${pts}（含满缝奖励 50）`, 2.4); } else { S.done(); say(`验收通过，但有 ${b.mismatch} 处色差：+${pts}`, 2.4, true); } text(`+${pts}`, b.bx + b.bw / 2, b.by - 6, '#fff2a8', true); }, b.litList.length * 80 + 60);
        if (b.tutorial && st.tut) st.tut.step = 3;
      }
      function timeoutRound() {
        const b = st.board; st.state = 'fail'; st.stT = 0; st.timeouts++; S.bad(); st.shake = .4; document.getElementById('mg-accept').style.display = 'none';
        say(`时间到，这一块没铺完，监工让你返工！（返工 ${st.timeouts}/${MAXTO}）`, 2.2, true); text('返工！', b.bx + b.bw / 2, b.by + b.bh / 2, '#ff9d8a', true);
      }
      pointerOn(cv, { pos: (x, y, ev) => {
        if (st.done || st.state !== 'play') return; const b = st.board; const cx = Math.floor((x - b.bx) / b.ts), cy = Math.floor((y - b.by) / b.ts);
        if (cx < 0 || cy < 0 || cx >= b.cols || cy >= b.rows) return; rotate(b.at(cx, cy), ev && ev.button === 2 ? -1 : 1);
      } });
      cv.addEventListener('contextmenu', e => e.preventDefault());
      const $q = id => document.getElementById(id);
      $q('mg-accept').onclick = () => { const b = st.board; if (st.state === 'play' && b.reach) settle(false); };
      $q('mg-hint').onclick = () => { if (st.state !== 'play') return; const n = nextTap(st.board); if (!n) return; st.hl = { c: n.c, t: 3 }; st.t += 3; S.bad(); say('看了一眼图纸，耽误了 3 秒工时。', 1.6, true); text('-3 秒', 150, 150, '#ff9d8a'); };
      $q('mg-tutskip').onclick = () => { if (st.tut && !st.tut.over) { st.tut.over = true; flag('seenSodP', 1); $q('mg-tutskip').style.display = 'none'; st.roundN = 0; newRound(); } };
      const finish = res => { if (st.done) return; st.done = true; stop(); setTimeout(() => resolve(res), 900); };
      $q('mg-quit').onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * HOURS, quality: 0 });
      st.autoplay = mode => { clearInterval(st._auto); let k = 0; st._auto = setInterval(() => { if (st.done) { clearInterval(st._auto); return; } if (mode === 'bad') return; if (st.state !== 'play') return; const b = st.board; if (b.reach && !b.mismatch) return; const n = nextTap(b); if (n) rotate(n.c, 1); }, 110); };
      st.tapCell = (x, y) => { const b = st.board; const c = b.at(x, y); rotate(c, 1); };
      newRound(); if (tut0) $q('mg-tutskip').style.display = 'none';
      function drawTile(c, b, now) {
        const ts = b.ts, x = b.bx + c.x * ts, y = b.by + c.y * ts; ctx.save(); ctx.translate(x + ts / 2, y + ts / 2);
        if (c.shake > 0) ctx.translate(Math.sin(now * 60) * 4 * c.shake, 0);
        const sc = 1 + (c.pop || 0) * .1; ctx.scale(sc, sc);
        ctx.drawImage(soil(ts, (c.x * 3 + c.y) % 3), -ts / 2, -ts / 2, ts, ts);
        if (c.rock) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(2, ts * .2, ts * .3, ts * .13, 0, 0, 7); ctx.fill(); const gr = ctx.createLinearGradient(-ts * .3, -ts * .3, ts * .3, ts * .3); gr.addColorStop(0, '#b9b6ae'); gr.addColorStop(1, '#6d6a64'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-ts * .3, ts * .12); ctx.quadraticCurveTo(-ts * .32, -ts * .24, -ts * .06, -ts * .28); ctx.quadraticCurveTo(ts * .26, -ts * .3, ts * .31, ts * .08); ctx.quadraticCurveTo(ts * .2, ts * .26, -ts * .1, ts * .24); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#2a2824'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.moveTo(-ts * .18, -ts * .14); ctx.lineTo(ts * .02, -ts * .2); ctx.stroke(); ctx.restore(); return; }
        ctx.rotate(c.a);
        const w = Math.round(ts * .48), first = c.open.indexOf(1);
        for (let d = 0; d < 4; d++) { if (!c.open[d]) continue; ctx.save(); ctx.rotate(d * Math.PI / 2); ctx.drawImage(strip(c.col[d], ts), -w / 2, -ts / 2 + 1, w, Math.round(ts / 2 + 3)); ctx.restore(); }
        const hubc = first < 0 ? 0 : c.col[first]; if (first >= 0) { const hd = Math.round(ts * .56); ctx.drawImage(hub(hubc, ts), -hd / 2, -hd / 2, hd, hd); }
        else { ctx.fillStyle = '#4b3a28'; ctx.beginPath(); ctx.arc(0, 0, ts * .12, 0, 7); ctx.fill(); }
        ctx.restore();
        if (c.lit) { ctx.save(); ctx.globalAlpha = .55 + .25 * Math.sin(now * 5 + c.x + c.y); ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 2.5; ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, ts - 4, ts - 4, 7); ctx.stroke(); ctx.restore(); }
        // 缝：断口（红）和色差（黄叹号）
        const mid = [[ts / 2, 3], [ts - 3, ts / 2], [ts / 2, ts - 3], [3, ts / 2]];
        (c.gap || []).forEach(d => { const px = x + mid[d][0], py = y + mid[d][1]; ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(now * 8); ctx.fillStyle = '#e0452f'; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); });
        (c.mm || []).forEach(d => { const px = x + mid[d][0], py = y + mid[d][1]; ctx.save(); rr(ctx, px - 8, py - 8, 16, 16, 5, '#f2b830', '#5a3a00', 1.5); txt(ctx, '!', px, py + 4.5, 13, '#4a2a00', 'center', true); ctx.restore(); });
        if (c.crack > 0) { ctx.save(); ctx.globalAlpha = c.crack; ctx.fillStyle = '#e0452f'; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, ts - 4, ts - 4, 7); ctx.fill(); ctx.restore(); }
      }
      const stop = loop(dt => {
        const now = performance.now() / 1000; const b = st.board; const tutOn = st.tut && !st.tut.over;
        if (!tutOn) st.t += dt; st.stT += dt;
        st.msgT -= dt; st.shake = Math.max(0, st.shake - dt); if (st.hl) { st.hl.t -= dt; if (st.hl.t <= 0) st.hl = null; }
        b.cells.forEach(c => { if (c.tgt != null) { const diff = c.tgt - c.a; c.v += (diff * 420 - c.v * 24) * dt; c.a += c.v * dt; if (Math.abs(diff) < .002 && Math.abs(c.v) < .05) { c.a = c.tgt; c.v = 0; c.tgt = null; } } if (c.pop > 0) c.pop = Math.max(0, c.pop - dt * 5); if (c.shake > 0) c.shake -= dt; if (c.crack > 0) c.crack -= dt * 1.4; });
        st.parts.forEach(p => { p.t += dt; p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); st.parts = st.parts.filter(p => p.t < p.l); st.texts.forEach(t => { t.t += dt; }); st.texts = st.texts.filter(t => t.t < 1.4);
        // 本块计时、转场
        if (st.state === 'play' && !tutOn) { if (st.t - b.startT > b.limit) timeoutRound(); }
        if (st.state === 'win' && st.stT > 2.2) { if (b.tutorial) { st.tut.over = true; flag('seenSodP', 1); $q('mg-tutskip').style.display = 'none'; st.roundN = 0; st.t = 0; } else st.roundN++; if (!(st.t >= DUR)) newRound(); }
        if (st.state === 'fail' && st.stT > 2) { st.roundN = Math.max(0, st.roundN); if (!(st.timeouts >= MAXTO) && !(st.t >= DUR)) newRound(); }
        // 画面
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 10 * st.shake, (Math.random() - .5) * 6 * st.shake);
        paintBg(ctx, bg());
        const bb = st.board; // 地面
        rr(ctx, bb.bx - 12, bb.by - 12, bb.bw + 24, bb.bh + 24, 14, 'rgba(60,40,22,.85)', '#1f160d', 3);
        bb.cells.forEach(c => drawTile(c, bb, now));
        // 草皮卷（入口）和验收旗（出口）
        { const ry = bb.by + bb.sr * bb.ts + bb.ts / 2, rx = bb.bx - 8; const gx = ctx.createLinearGradient(0, ry - 22, 0, ry + 22); gx.addColorStop(0, '#9ad65c'); gx.addColorStop(1, '#3c7727'); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(rx - 22, ry + 24, 34, 7, 0, 0, 7); ctx.fill(); rr(ctx, rx - 56, ry - 22, 56, 44, 10, gx, '#1f3a14', 2.5); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(rx - 56 + k * 14, ry - 20); ctx.lineTo(rx - 56 + k * 14, ry + 20); ctx.stroke(); } ctx.beginPath(); ctx.ellipse(rx - 56, ry, 9, 22, 0, 0, 7); ctx.fillStyle = '#c9a56a'; ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, '草皮卷', rx - 28, ry + 42, 13, '#fff1d6', 'center', true);
          const fy = bb.by + bb.er * bb.ts + bb.ts / 2, fxx = bb.bx + bb.bw + 22; ctx.save(); ctx.strokeStyle = '#d9d2c0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fxx, fy + 26); ctx.lineTo(fxx, fy - 30); ctx.stroke(); const wave = Math.sin(now * (st.state === 'win' ? 9 : 3)) * (st.state === 'win' ? 6 : 3); ctx.fillStyle = st.state === 'win' ? '#e8c640' : '#d8473a'; ctx.beginPath(); ctx.moveTo(fxx, fy - 30); ctx.quadraticCurveTo(fxx + 20, fy - 34 + wave, fxx + 40, fy - 26 + wave); ctx.quadraticCurveTo(fxx + 22, fy - 18 - wave, fxx, fy - 14); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); txt(ctx, st.state === 'win' ? '验收 ✓' : '验收旗', fxx + 8, fy + 44, 13, '#fff1d6', 'center', true); }
        // 教程手指 / 图纸提示
        const nt = (tutOn || st.hl) ? (st.hl ? { c: st.hl.c } : nextTap(bb)) : null;
        if (nt && st.state === 'play') { const hx = bb.bx + nt.c.x * bb.ts + bb.ts / 2, hy = bb.by + nt.c.y * bb.ts + bb.ts / 2; ctx.save(); ctx.strokeStyle = '#ffe36a'; ctx.lineWidth = 3; ctx.globalAlpha = .6 + .4 * Math.sin(now * 6); ctx.beginPath(); ctx.roundRect(hx - bb.ts / 2 + 1, hy - bb.ts / 2 + 1, bb.ts - 2, bb.ts - 2, 8); ctx.stroke(); ctx.globalAlpha = 1; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('👆', hx + 8, hy + 26 + Math.sin(now * 6) * 4); ctx.restore(); }
        // 粒子、飘字
        st.parts.forEach(p => { ctx.globalAlpha = 1 - p.t / p.l; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s * .5); }); ctx.globalAlpha = 1;
        st.texts.forEach(t => { ctx.globalAlpha = 1 - t.t / 1.4; txt(ctx, t.s, t.x, t.y - t.t * 40, t.big ? 26 : 17, t.c, 'center', true); }); ctx.globalAlpha = 1;
        // 左栏
        const prog = st.t / DUR; rr(ctx, 14, 14, 214, 238, 12, 'rgba(10,18,8,.72)', 'rgba(255,255,255,.18)', 1.5);
        txt(ctx, `工时  ${clockStr(START, Math.min(1, prog), HOURS)}`, 26, 40, 15, '#fff1d6', 'left', true); rr(ctx, 26, 48, 190, 10, 5, 'rgba(0,0,0,.45)'); rr(ctx, 26, 48, Math.max(2, 190 * Math.min(1, prog)), 10, 5, '#f2c14e');
        const lim = bb.limit, rem = tutOn ? 1 : clamp(1 - (st.t - bb.startT) / lim, 0, 1); txt(ctx, tutOn ? '教程（不计时）' : `这一块  ${Math.max(0, Math.ceil(lim - (st.t - bb.startT)))} 秒`, 26, 84, 14, '#e8f2d0'); rr(ctx, 26, 92, 190, 10, 5, 'rgba(0,0,0,.45)'); rr(ctx, 26, 92, Math.max(2, 190 * rem), 10, 5, rem < .25 ? '#e0452f' : '#8fd18a');
        txt(ctx, `已验收 ${st.doneN} / ${st.target}`, 26, 128, 15, '#fff'); txt(ctx, `色差 ${st.mism}  ·  返工 ${st.timeouts}/${MAXTO}`, 26, 152, 14, st.timeouts ? '#ffb4a8' : '#e8f2d0'); txt(ctx, `得分 ${st.score}`, 26, 176, 15, '#fff2a8', 'left', true); txt(ctx, `这块转了 ${bb.moves} 下（最少约 ${bb.par}）`, 26, 200, 12.5, '#cfe0b8');
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(26, 212, 190, 1); PAL.forEach((p, i) => { const k = 26 + i * 64; ctx.drawImage(hub(i, 40), k, 220, 22, 22); txt(ctx, p.name, k + 25, 236, 11.5, '#e8f2d0'); });
        if (st.msgT > 0 && st.msg) { ctx.save(); ctx.font = `700 16px ${FONT}`; const w = ctx.measureText(st.msg).width + 30; const x = 240 + (640 - w) / 2; rr(ctx, x, 14, w, 38, 11, st.red ? '#fff0ec' : '#fffdf5', st.red ? '#b33a2e' : INK, 2.5); txt(ctx, st.msg, x + 15, 39, 16, st.red ? '#a3261b' : INK, 'left', true); ctx.restore(); }
        // 教程文案
        if (tutOn) { const T = ['第一步：点一下发亮框里的草皮，它会转 90°。', '很好。再点——让缝一块接一块往右连。', '继续！亮的是已经接上的草皮；红点是断口，黄叹号是色差。', '接通了！'][Math.min(3, st.tut.step)]; rr(ctx, 250, 436, 590, 28, 8, 'rgba(0,0,0,.7)', '#ffe36a', 1.5); txt(ctx, T + '  颜色/花纹一样才是严丝合缝。', 545, 455, 14, '#fff7d0', 'center'); }
        ctx.restore();
        if (st.timeouts >= MAXTO) { finish({ completed: false, fired: true, hoursDone: st.t / DUR * HOURS, quality: 0 }); return false; }
        if (st.t >= DUR) {
          const rs = st.rounds, n = rs.length; const avg = n ? rs.reduce((a, r) => a + r.q, 0) / n : 0; const q = clamp(avg * .55 + Math.min(1, st.doneN / st.target) * .45 - st.timeouts * .05, 0, 1);
          finish({ completed: true, quality: q, mentalMult: 1 + st.timeouts * .05 + st.mism * .01, mode: 'pipe', summary: `验收 ${st.doneN} 块（目标 ${st.target}），色差 ${st.mism} 处，返工 ${st.timeouts} 次，得分 ${st.score}。` }); return false;
        }
      });
    });
  }
  function pointerOn(cv, on) {
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    cv.addEventListener('pointerdown', e => { const [x, y] = pos(e); on.pos && on.pos(x, y, e); on.down && on.down(x, y, e); });
    cv.addEventListener('pointerup', e => { const [x, y] = pos(e); on.up && on.up(x, y, e); });
    cv.addEventListener('pointermove', e => { const [x, y] = pos(e); on.move && on.move(x, y, e); });
  }

  // ================= 拼草皮（消消乐）=================
  function matchGame(root, o) {
    return new Promise(resolve => {
      const tut0 = !o.noTut && !flag('seenSodM');
      const { cv, ctx, bar, bg } = setup(root, '绿化铺草皮 · 08:00–17:00', '点一块草皮，再点<b>相邻</b>的一块换位：三块一样的连成一线就铺平。不成行的换位白费工时。');
      bar.innerHTML = `<button class="mg-btn" id="mg-hint">看图纸（耽误 3 秒）</button><button class="mg-btn ghost" id="mg-tutskip" style="display:none">练习结束</button><button class="mg-btn ghost" id="mg-quit">不干了，走人</button>`;
      const DUR = o.dur || 70, HOURS = 9, START = 8, COLS = 7, ROWS = 6, TS = 52, KINDS = 5;
      const BX = 378, BY = 104;
      const st = MG.cur = { type: 'sod', mode: 'match', geo: { BX, BY, TS }, t: 0, done: false, state: 'idle', stT: 0, grid: [], cleared: 0, combo: 0, maxCombo: 0, swaps: 0, bad: 0, score: 0, msg: null, msgT: 0, parts: [], texts: [], shake: 0, sel: null, hint: null, idle: 0, tut: tut0 ? { step: 0 } : null, target: Math.max(12, Math.round(DUR * 1.5)) };
      const mkCell = (k) => ({ k, oy: 0, vy: 0, ox: 0, s: 1, dying: 0, id: Math.random() });
      const get = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS) ? null : st.grid[r][c];
      function findMatches(g) {
        const out = new Set(); const kk = (c, r) => { const x = g[r] && g[r][c]; return x ? x.k : -1; };
        for (let r = 0; r < ROWS; r++) { let run = 1; for (let c = 1; c <= COLS; c++) { if (c < COLS && kk(c, r) >= 0 && kk(c, r) === kk(c - 1, r)) run++; else { if (run >= 3) for (let i = 1; i <= run; i++) out.add((c - i) + ',' + r); run = 1; } } }
        for (let c = 0; c < COLS; c++) { let run = 1; for (let r = 1; r <= ROWS; r++) { if (r < ROWS && kk(c, r) >= 0 && kk(c, r) === kk(c, r - 1)) run++; else { if (run >= 3) for (let i = 1; i <= run; i++) out.add(c + ',' + (r - i)); run = 1; } } }
        return out;
      }
      function init() {
        do { st.grid = []; for (let r = 0; r < ROWS; r++) { st.grid.push([]); for (let c = 0; c < COLS; c++) { let k; let g = 0; do { k = ri(0, KINDS - 1); g++; } while (g < 20 && ((c >= 2 && st.grid[r][c - 1].k === k && st.grid[r][c - 2].k === k) || (r >= 2 && st.grid[r - 1][c].k === k && st.grid[r - 2][c].k === k))); st.grid[r].push(mkCell(k)); } } } while (!findMove());
      }
      function findMove() {
        const g = st.grid; const sw = (a, b, c2, d) => { const t = g[b][a]; g[b][a] = g[d][c2]; g[d][c2] = t; };
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dc, dr] of [[1, 0], [0, 1]]) { const c2 = c + dc, r2 = r + dr; if (c2 >= COLS || r2 >= ROWS) continue; sw(c, r, c2, r2); const m = findMatches(g).size > 0; sw(c, r, c2, r2); if (m) return [c, r, c2, r2]; }
        return null;
      }
      const say = (m, t, red) => { st.msg = m; st.msgT = t || 1.5; st.red = !!red; };
      const text = (s2, x, y, color, big) => st.texts.push({ s: s2, x, y, c: color || '#fff2a8', t: 0, big });
      const burst = (x, y, n) => { for (let i = 0; i < n; i++) st.parts.push({ x, y, vx: rnd(-120, 120), vy: rnd(-170, -30), l: rnd(.5, 1.0), t: 0, c: pick(['#9ad65c', '#68ad3b', '#dbe86c', '#fffdf0']), s: rnd(2.5, 5) }); };
      const cx = c => BX + c * TS, cy = r => BY + r * TS;
      let anim = null; // 换位动画
      function trySwap(c1, r1, c2, r2, auto) {
        if (st.state !== 'idle' || st.done) return; const a = get(c1, r1), b = get(c2, r2); if (!a || !b) return;
        st.state = 'swap'; st.stT = 0; st.sel = null; st.swaps++; S.swap();
        anim = { c1, r1, c2, r2, t: 0, dur: .17, back: false };
        st.grid[r1][c1] = b; st.grid[r2][c2] = a; a.ox = (c1 - c2) * TS; a.oy = (r1 - r2) * TS; b.ox = (c2 - c1) * TS; b.oy = (r2 - r1) * TS; anim.a = a; anim.b = b;
        anim.valid = findMatches(st.grid).size > 0;
        if (st.tut && !st.tut.over) { st.tut.step = 2; }
      }
      function resolveMatches() {
        const m = findMatches(st.grid); if (!m.size) { st.combo = 0; st.state = 'idle'; st.idle = 0; if (!findMove()) { say('没得换了，重新排一排。', 1.6); S.swap(); st.grid.forEach(row => row.forEach(c => { c.k = ri(0, KINDS - 1); })); for (let g = 0; g < 50 && (findMatches(st.grid).size || !findMove()); g++) st.grid.forEach(row => row.forEach(c => { c.k = ri(0, KINDS - 1); })); } if (st.tut && !st.tut.over && st.cleared >= 3) endTut(); return; }
        st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo); const n = m.size;
        m.forEach(key => { const [c, r] = key.split(',').map(Number); const cell = st.grid[r][c]; cell.dying = 1; burst(cx(c) + TS / 2, cy(r) + TS / 2, 6); });
        S.pop(st.combo); const pts = n * 10 * st.combo + (n >= 4 ? 30 : 0); st.score += pts; st.cleared += n;
        const mid = [...m][Math.floor(n / 2)].split(',').map(Number); text(`+${pts}${st.combo > 1 ? ' ×' + st.combo + '连' : ''}`, cx(mid[0]) + TS / 2, cy(mid[1]), st.combo > 1 ? '#ffd27a' : '#fff2a8', st.combo > 1);
        if (n >= 4) say(n >= 5 ? '整卷铺平！' : '四块连成一线！+30', 1.1); else if (st.combo > 1) say(`${st.combo} 连击！`, 1);
        st.state = 'clear'; st.stT = 0;
      }
      function drop() {
        for (let c = 0; c < COLS; c++) { let empty = 0; for (let r = ROWS - 1; r >= 0; r--) { const cell = st.grid[r][c]; if (!cell) { empty++; } else if (empty) { st.grid[r + empty][c] = cell; st.grid[r][c] = null; cell.oy -= empty * TS; cell.vy = 0; } } for (let r = 0; r < empty; r++) { const n = mkCell(ri(0, KINDS - 1)); n.oy = -(empty - r + 0) * TS - 10; st.grid[r][c] = n; } }
        st.state = 'fall'; st.stT = 0;
      }
      function endTut() { if (st.tut) { st.tut.over = true; flag('seenSodM', 1); const b = document.getElementById('mg-tutskip'); if (b) b.style.display = 'none'; say('好！就这样。计时开始！', 2); st.t = 0; st.cleared = 0; st.score = 0; st.combo = 0; st.swaps = 0; st.bad = 0; } }
      pointerOn(cv, {
        down: (x, y) => { if (st.done || st.state !== 'idle') return; const c = Math.floor((x - BX) / TS), r = Math.floor((y - BY) / TS); if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return; st.drag = [c, r, x, y]; if (!st.sel) { st.sel = [c, r]; S.rot(); } else { const [sc, sr] = st.sel; if (Math.abs(sc - c) + Math.abs(sr - r) === 1) { trySwap(sc, sr, c, r); } else if (sc === c && sr === r) st.sel = null; else { st.sel = [c, r]; S.rot(); } } },
        move: (x, y) => { const d = st.drag; if (!d || st.done || st.state !== 'idle') return; const dx = x - d[2], dy = y - d[3]; if (Math.hypot(dx, dy) < TS * .55) return; const horiz = Math.abs(dx) > Math.abs(dy); const c2 = d[0] + (horiz ? Math.sign(dx) : 0), r2 = d[1] + (horiz ? 0 : Math.sign(dy)); st.drag = null; if (get(c2, r2)) trySwap(d[0], d[1], c2, r2); },
        up: () => { st.drag = null; }
      });
      const $q = id => document.getElementById(id);
      $q('mg-hint').onclick = () => { const m = findMove(); if (!m) return; st.hint = { m, t: 3 }; st.t += 3; S.bad(); say('看了一眼图纸，耽误了 3 秒工时。', 1.5, true); text('-3 秒', 180, 150, '#ff9d8a'); };
      $q('mg-tutskip').onclick = () => endTut();
      const finish = res => { if (st.done) return; st.done = true; stop(); setTimeout(() => resolve(res), 900); };
      $q('mg-quit').onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * HOURS, quality: 0 });
      st.autoplay = mode => { clearInterval(st._auto); st._auto = setInterval(() => { if (st.done || st.state !== 'idle') return; if (mode === 'bad') return; const m = findMove(); if (m) trySwap(m[0], m[1], m[2], m[3], true); }, 260); };
      init(); if (tut0) { $q('mg-tutskip').style.display = 'none'; }
      const stop = loop(dt => {
        const now = performance.now() / 1000; const tutOn = st.tut && !st.tut.over;
        if (!tutOn) st.t += dt; st.stT += dt; st.msgT -= dt; st.shake = Math.max(0, st.shake - dt); if (st.hint) { st.hint.t -= dt; if (st.hint.t <= 0) st.hint = null; }
        if (st.state === 'idle') { st.idle += dt; if (st.idle > 7 && !st.hint) { const m = findMove(); if (m) { st.hint = { m, t: 2.5 }; } st.idle = 0; } }
        if (st.state === 'swap') {
          anim.t += dt; const k = clamp(anim.t / anim.dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
          const { a, b } = anim; if (!anim.back) { a.ox = (anim.c1 - anim.c2) * TS * (1 - e); a.oy = (anim.r1 - anim.r2) * TS * (1 - e); b.ox = (anim.c2 - anim.c1) * TS * (1 - e); b.oy = (anim.r2 - anim.r1) * TS * (1 - e); }
          else { a.ox = (anim.c2 - anim.c1) * TS * (1 - e); a.oy = (anim.r2 - anim.r1) * TS * (1 - e); b.ox = (anim.c1 - anim.c2) * TS * (1 - e); b.oy = (anim.r1 - anim.r2) * TS * (1 - e); }
          if (k >= 1) { a.ox = a.oy = b.ox = b.oy = 0;
            if (!anim.back) { if (anim.valid) { S.snap(); resolveMatches(); } else { // 不成行：换回去，扣时间并提示
                st.grid[anim.r1][anim.c1] = a; st.grid[anim.r2][anim.c2] = b;
                anim.back = true; anim.t = 0; a.ox = (anim.c2 - anim.c1) * TS; a.oy = (anim.r2 - anim.r1) * TS; b.ox = (anim.c1 - anim.c2) * TS; b.oy = (anim.r1 - anim.r2) * TS;
                st.bad++; if (!tutOn) st.t += 2; S.bad(); st.shake = .2; say(tutOn ? '这样换不成行，再找找：两块一换，要凑出三块一样的。' : '不成行！白费了 2 秒工时。', 1.8, true); if (!tutOn) text('-2 秒', cx(anim.c1) + TS / 2, cy(anim.r1), '#ff9d8a'); st.combo = 0; }
            } else { st.state = 'idle'; anim = null; st.idle = 0; }
          }
        }
        if (st.state === 'clear' && st.stT > .26) { for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const x = st.grid[r][c]; if (x && x.dying) st.grid[r][c] = null; } drop(); }
        if (st.state === 'fall') { let moving = false; st.grid.forEach(row => row.forEach(c => { if (c && c.oy < 0) { c.vy += 2200 * dt; c.oy = Math.min(0, c.oy + c.vy * dt); moving = true; if (c.oy === 0) { c.vy = 0; } } })); if (!moving) { S.land(); resolveMatches(); } }
        st.grid.forEach(row => row.forEach(c => { if (c && c.dying) c.dying = Math.max(0, c.dying - dt * 4.2) + 0.0001; }));
        st.parts.forEach(p => { p.t += dt; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); st.parts = st.parts.filter(p => p.t < p.l); st.texts.forEach(t => { t.t += dt; }); st.texts = st.texts.filter(t => t.t < 1.3);
        // 画面
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 10 * st.shake, (Math.random() - .5) * 6 * st.shake);
        paintBg(ctx, bg());
        rr(ctx, BX - 12, BY - 12, COLS * TS + 24, ROWS * TS + 24, 16, 'rgba(60,40,22,.9)', '#1f160d', 3);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.drawImage(soil(TS, (c + r) % 3), cx(c), cy(r), TS, TS);
        ctx.save(); ctx.beginPath(); ctx.rect(BX - 6, BY - 6, COLS * TS + 12, ROWS * TS + 12); ctx.clip();
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const cell = st.grid[r][c]; if (!cell) continue; let x = cx(c) + cell.ox, y = cy(r) + cell.oy; let sc = 1;
          if (cell.dying) { sc = Math.max(.01, cell.dying); ctx.globalAlpha = Math.min(1, cell.dying + .2); }
          ctx.save(); ctx.translate(x + TS / 2, y + TS / 2); ctx.scale(sc, sc); ctx.drawImage(block(cell.k, TS), -TS / 2, -TS / 2, TS, TS); ctx.restore(); ctx.globalAlpha = 1;
        }
        ctx.restore();
        if (st.sel) { const [sc, sr] = st.sel; ctx.save(); ctx.strokeStyle = '#ffe36a'; ctx.lineWidth = 3.5; ctx.shadowColor = '#ffe36a'; ctx.shadowBlur = 12; ctx.globalAlpha = .7 + .3 * Math.sin(now * 8); ctx.beginPath(); ctx.roundRect(cx(sc) + 2, cy(sr) + 2, TS - 4, TS - 4, 9); ctx.stroke(); ctx.restore(); }
        const hm = st.hint || (tutOn && st.state === 'idle' ? { m: findMove() } : null);
        if (hm && hm.m && st.state === 'idle') { const [a1, b1, a2, b2] = hm.m; ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.globalAlpha = .55 + .4 * Math.sin(now * 6); [[a1, b1], [a2, b2]].forEach(([c, r]) => { ctx.beginPath(); ctx.roundRect(cx(c) + 3, cy(r) + 3, TS - 6, TS - 6, 8); ctx.stroke(); }); ctx.globalAlpha = 1; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('👆', cx(a1) + TS / 2 + 8, cy(b1) + TS + 20 + Math.sin(now * 6) * 3); ctx.restore(); }
        st.parts.forEach(p => { ctx.globalAlpha = 1 - p.t / p.l; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s * .5); }); ctx.globalAlpha = 1;
        st.texts.forEach(t => { ctx.globalAlpha = 1 - t.t / 1.3; txt(ctx, t.s, t.x, t.y - t.t * 40, t.big ? 24 : 17, t.c, 'center', true); }); ctx.globalAlpha = 1;
        // 左栏
        const prog = st.t / DUR; rr(ctx, 14, 14, 214, 250, 12, 'rgba(10,18,8,.72)', 'rgba(255,255,255,.18)', 1.5);
        txt(ctx, `工时  ${clockStr(START, Math.min(1, prog), HOURS)}`, 26, 40, 15, '#fff1d6', 'left', true); rr(ctx, 26, 48, 190, 10, 5, 'rgba(0,0,0,.45)'); rr(ctx, 26, 48, Math.max(2, 190 * Math.min(1, prog)), 10, 5, '#f2c14e');
        const gp = Math.min(1, st.cleared / st.target); txt(ctx, tutOn ? '教程（不计时）' : `铺平 ${st.cleared} / ${st.target} 块`, 26, 84, 14, '#e8f2d0'); rr(ctx, 26, 92, 190, 10, 5, 'rgba(0,0,0,.45)'); rr(ctx, 26, 92, Math.max(2, 190 * gp), 10, 5, '#8fd18a');
        txt(ctx, `得分 ${st.score}`, 26, 132, 16, '#fff2a8', 'left', true); txt(ctx, `最高连击 ×${st.maxCombo}`, 26, 156, 14, '#e8f2d0'); txt(ctx, `换位 ${st.swaps}  ·  不成行 ${st.bad}`, 26, 180, 14, st.bad ? '#ffb4a8' : '#e8f2d0');
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(26, 194, 190, 1); [0, 1, 2, 3, 4].forEach(i => { ctx.drawImage(block(i, 34), 26 + i * 38, 204, 34, 34); }); txt(ctx, '五种草皮，三块同样的连成线', 26, 256, 12, '#cfe0b8');
        if (st.msgT > 0 && st.msg) { ctx.save(); ctx.font = `700 16px ${FONT}`; const w = ctx.measureText(st.msg).width + 30; const x = 240 + (640 - w) / 2; rr(ctx, x, 14, w, 38, 11, st.red ? '#fff0ec' : '#fffdf5', st.red ? '#b33a2e' : INK, 2.5); txt(ctx, st.msg, x + 15, 39, 16, st.red ? '#a3261b' : INK, 'left', true); ctx.restore(); }
        if (tutOn) { rr(ctx, 250, 436, 590, 28, 8, 'rgba(0,0,0,.7)', '#ffe36a', 1.5); txt(ctx, st.tut.step < 2 ? '先点发白框里的一块，再点另一块——两块互换，凑出三块一样的。' : '换对了！连成线的草皮会被铺平，上面的会掉下来补上。', 545, 455, 14, '#fff7d0', 'center'); }
        ctx.restore();
        if (st.t >= DUR) {
          const acc = st.swaps ? 1 - st.bad / st.swaps : 1; const q = clamp(Math.min(1, st.cleared / st.target) * .75 + Math.min(.1, st.maxCombo * .03) + acc * .15 - (st.cleared ? 0 : .15), 0, 1);
          finish({ completed: true, quality: q, mentalMult: 1 + st.bad * .01, mode: 'match', summary: `铺平 ${st.cleared} 块（目标 ${st.target}），最高 ${st.maxCombo} 连击，不成行 ${st.bad} 次，得分 ${st.score}。` }); return false;
        }
      });
    });
  }
})();
