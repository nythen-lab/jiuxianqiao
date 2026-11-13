// v0.8 新小游戏：装卸搬运（拖箱子上车）/ 绿化铺草皮（拖草皮对格子）/ 后厨洗碗（刷盘子）/ 酒店端盘（端稳托盘）
// 印刷厂包装复用快递分拣（换成书目分箱）。
(function () {
  const MG = window.MG; const SFX = MG.sfx;
  const W = 900, H = 470, INK = '#1d1a18';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  function setup(root, title, help, bg) {
    root.innerHTML = `<div class="mg"><div class="mg-top"><b>${title}</b><span class="mg-help">${help}</span></div>
      <canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px;touch-action:none"></canvas>
      <div class="mg-bar"></div></div>`;
    const cv = root.querySelector('canvas'); const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    let img = null; if (bg) { img = new Image(); img.src = bg; }
    return { cv, ctx, bar: root.querySelector('.mg-bar'), bgImg: () => img && img.complete && img.naturalWidth ? img : null };
  }
  function loop(fn) { const born = performance.now(); let last = born, alive = true; const step = now => { if (!alive) return; if (window.MG_KILL > born) { alive = false; return; } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (window.MG_SAFE(fn, dt) === false) { alive = false; return; } requestAnimationFrame(step); }; requestAnimationFrame(step); return () => { alive = false; }; }
  const rr = (ctx, x, y, w, h, r, fill, stroke, lw) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  const txt = (ctx, s, x, y, size, color, align, bold) => { ctx.font = `${bold ? '700 ' : ''}${size || 16}px ${FONT}`; ctx.fillStyle = color || '#f3ead8'; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); };
  const meter = (ctx, x, y, w, label, v, color) => { txt(ctx, label, x, y - 5, 13); rr(ctx, x, y, w, 10, 5, '#00000066', '#f3ead888', 1.5); rr(ctx, x, y, Math.max(0, w * Math.min(1, v)), 10, 5, color); };
  const clockStr = (startH, frac, hours) => { const m = Math.floor((startH * 60 + frac * hours * 60) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function bubble(ctx, s, x, y, red) { ctx.font = `16px ${FONT}`; const w = ctx.measureText(s).width + 24; rr(ctx, x, y, w, 34, 10, red ? '#fff0ec' : '#fffdf5', red ? '#b33a2e' : INK); txt(ctx, s, x + 12, y + 23, 16, red ? '#a3261b' : INK); }
  function paintBg(ctx, img, dim) { if (img) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); const iw = img.naturalWidth * s, ih = img.naturalHeight * s; ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih); } else { ctx.fillStyle = '#3a3633'; ctx.fillRect(0, 0, W, H); } ctx.fillStyle = `rgba(10,12,18,${dim == null ? 0.45 : dim})`; ctx.fillRect(0, 0, W, H); }
  function pointer(cv, on) {
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    const d = e => { cv.setPointerCapture && e.pointerId != null && cv.setPointerCapture(e.pointerId); on.down && on.down(...pos(e)); };
    const m = e => on.move && on.move(...pos(e)); const u = e => on.up && on.up(...pos(e));
    cv.addEventListener('pointerdown', d); cv.addEventListener('pointermove', m); cv.addEventListener('pointerup', u); cv.addEventListener('pointercancel', u);
  }
  const quitBtn = (bar, label) => { bar.insertAdjacentHTML('beforeend', `<button class="mg-btn ghost" id="mg-quit">${label || '不干了，走人'}</button>`); return bar.querySelector('#mg-quit'); };

  // ================= 拖拽类：装卸搬运 / 绿化铺草皮 =================
  // 东西有分量：越重，跟手越慢、越晃；放下时晃得太厉害就码塌 / 铺歪。
  function dragGame(root, o, cfg) {
    return new Promise(resolve => {
      const perf = o.perf || { win: 1, shake: 0.6 };
      const { cv, ctx, bar, bgImg } = setup(root, cfg.title, cfg.help, cfg.bg);
      bar.innerHTML = `<span class="mg-note">${cfg.note}</span>`;
      const DUR = o.dur || cfg.dur || 42;
      const st = MG.cur = { type: cfg.type, t: 0, ok: 0, err: 0, done: false, items: [], held: null, mx: 0, my: 0, msg: null, msgT: 0, fatigue: o.tired ? 30 : 0, slots: cfg.slots(), shake: 0, perf, quality: [] };
      const spawn = () => { while (st.items.filter(i => !i.placed && !i.dead).length < cfg.queue) { const kg = cfg.kg(); st.items.push({ id: Math.random(), kg, x: cfg.src[0] + (Math.random() - .5) * 30, y: cfg.src[1] - st.items.filter(i => !i.placed && !i.dead).length * 6, vx: 0, vy: 0, ang: 0, av: 0, w: cfg.w(kg), h: cfg.h(kg), placed: false }); } };
      spawn();
      if (cfg.init) cfg.init(st, bar, o);
      const pickAt = (x, y) => st.items.filter(i => !i.placed && !i.dead).reverse().find(i => Math.abs(x - i.x) < i.w / 2 + 6 && Math.abs(y - i.y) < i.h / 2 + 6);
      const nextSlot = () => st.slots.find(s => !s.used);
      st.nextSlot = nextSlot; st.spawnPos = () => { const i = st.items.filter(i => !i.placed && !i.dead).slice(-1)[0]; return i ? [i.x, i.y] : null; };
      pointer(cv, {
        down: (x, y) => { if (st.done) return; st.mx = x; st.my = y; const it = pickAt(x, y); if (it) { st.held = it; it.vx = it.vy = 0; SFX.thud(it.kg / 40); } },
        move: (x, y) => { st.mx = x; st.my = y; },
        up: (x, y) => {
          const it = st.held; st.held = null; if (!it || st.done) return;
          const s = nextSlot();
          const near = s && Math.hypot(it.x - s.x, it.y - s.y) < cfg.snap;
          if (!near) { it.vy = 0; if (it.y < cfg.floor - 10 && !cfg.inSource(it)) { it.dead = true; st.err++; st.msg = cfg.dropLine; st.msgT = 1.4; st.shake = .25; SFX.thud(.8); } return; }
          const tilt = Math.abs(it.ang), off = Math.hypot(it.x - s.x, it.y - s.y);
          const tol = cfg.tiltTol * (perf.win || 1);
          if (tilt > tol) { it.dead = true; st.err++; st.msg = cfg.tiltLine; st.msgT = 1.5; st.shake = .35; SFX.thud(1); return; }
          const q = Math.max(0, 1 - off / cfg.snap * 0.6 - tilt / tol * 0.4);
          it.placed = true; it.x = s.x; it.y = s.y; it.ang = cfg.keepTilt ? it.ang * 0.3 : 0; s.used = true; s.q = q; st.ok++; st.quality.push(q);
          st.fatigue = Math.min(100, st.fatigue + it.kg * cfg.tireK);
          SFX.thud(it.kg / 30); st.shake = Math.min(.3, it.kg / 120);
          if (q > .85) { st.msg = cfg.goodLine; st.msgT = .9; }
          if (!nextSlot()) { cfg.refill(st); }
          spawn();
        }
      });
      const finish = res => { if (st.done) return; st.done = true; stop(); setTimeout(() => resolve(res), 900); };
      quitBtn(bar).onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * cfg.hours, quality: 0 });
      const stop = loop(dt => {
        st.t += dt; const prog = st.t / DUR;
        st.fatigue = Math.min(100, st.fatigue + dt * 0.8); if (cfg.tick) cfg.tick(st, dt);
        const it = st.held;
        st.items.forEach(i => {
          if (i.placed || i.dead) return;
          if (i === it) {
            // 弹簧跟手：越重、越累，跟得越慢
            const k = cfg.spring / (1 + i.kg / 12) * (1 - st.fatigue / 260) * (1 - (st.cold || 0) / 220) * (0.75 + 0.25 * (perf.win || 1));
            const ax = (st.mx - i.x) * k - i.vx * 7, ay = (st.my - i.y) * k - i.vy * 7 + i.kg * 6;
            i.vx += ax * dt; i.vy += ay * dt; i.x += i.vx * dt; i.y += i.vy * dt;
            // 晃：被横向速度带着摆
            i.av += (-i.vx * 0.0009 * (1 + i.kg / 20) - i.ang * 9 - i.av * (2.4 - i.kg / 40)) * dt * 6 + (Math.random() - .5) * (perf.shake || .6) * 0.02 * (1 + st.fatigue / 50);
            i.ang += i.av * dt;
          } else { i.vx *= .8; i.ang *= .9; }
        });
        st.msgT -= dt; st.shake = Math.max(0, st.shake - dt);
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 12 * st.shake, (Math.random() - .5) * 8 * st.shake);
        paintBg(ctx, bgImg(), 0.42);
        cfg.drawScene(ctx, st);
        st.slots.forEach(s => { if (!s.used) { ctx.setLineDash([6, 5]); rr(ctx, s.x - cfg.slotW / 2, s.y - cfg.slotH / 2, cfg.slotW, cfg.slotH, 4, null, s === nextSlot() ? '#f2c14e' : '#ffffff44', 2); ctx.setLineDash([]); } });
        st.items.filter(i => !i.dead).sort((a, b) => (a === it) - (b === it)).forEach(i => cfg.drawItem(ctx, i, i === it));
        if (cfg.overlay) cfg.overlay(ctx, st);
        meter(ctx, 20, 34, 200, `工时  ${clockStr(cfg.startH, prog, cfg.hours)}`, prog, '#f2c14e');
        meter(ctx, 20, 72, 200, `腰酸 ${Math.round(st.fatigue)}`, st.fatigue / 100, st.fatigue > 70 ? '#d64a3a' : '#e39a4a');
        txt(ctx, `${cfg.okWord} ${st.ok}   ${cfg.errWord} ${st.err}/${cfg.maxErr}`, 20, 110, 16);
        if (it) { txt(ctx, `${it.kg} 公斤`, it.x, it.y - it.h / 2 - 12, 14, it.kg > 25 ? '#ffb4a8' : '#fff', 'center', true); const tol = cfg.tiltTol * (perf.win || 1); const r = Math.min(1, Math.abs(it.ang) / tol); rr(ctx, it.x - 30, it.y + it.h / 2 + 8, 60, 6, 3, '#00000088'); rr(ctx, it.x - 30, it.y + it.h / 2 + 8, 60 * r, 6, 3, r > .8 ? '#e0452f' : '#8fd18a'); }
        if (st.msgT > 0 && st.msg) bubble(ctx, st.msg, 520, 40, /塌|歪|摔|掉/.test(st.msg));
        ctx.restore();
        if (st.err >= cfg.maxErr) { finish({ completed: false, fired: true, hoursDone: prog * cfg.hours, quality: 0 }); return false; }
        if (st.t >= DUR) { const avgQ = st.quality.length ? st.quality.reduce((a, b) => a + b, 0) / st.quality.length : 0; const tgt = Math.max(4, Math.round(cfg.target * DUR / (cfg.dur || 42))); const done = Math.min(1, st.ok / tgt); const q = Math.max(0, Math.min(1, avgQ * 0.5 + done * 0.5 - st.err * 0.04)); finish({ completed: true, quality: q, mentalMult: 1 + st.err * 0.04, summary: `${cfg.okWord} ${st.ok} 件（目标 ${tgt}），${cfg.errWord} ${st.err} 次。` }); return false; }
      });
    });
  }

  MG.mover = function (root, o) {
    const van = { x: 560, y: 180, w: 300, h: 230 };
    const cols = 4, rows = 3, cw = 66, ch = 56;
    const gx0 = van.x + 22 + ((van.w - 10) - cols * cw) / 2;   // v1.0：格子在灰色车厢内居中，不再溢出右边
    const mkSlots = () => { const a = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) a.push({ x: gx0 + c * cw + cw / 2, y: van.y + van.h - 20 - r * ch - ch / 2, used: false }); return a; };
    return dragGame(root, o, Object.assign({
      type: 'mover', title: '装卸搬运 · 08:00–12:00', help: '按住箱子拖进车厢里亮着的格子，<b>从下往上</b>码。越重越难拽、越晃——等它不晃了再松手。',
      note: '箱子下面的条是晃动：变红时松手会码塌。', bg: 'img/bg-job-mover.jpg', dur: 42, hours: 4, startH: 8,
      queue: 3, src: [170, 360], floor: 400, snap: 46, tiltTol: 0.32, keepTilt: true, slotW: cw - 4, slotH: ch - 4, spring: 90, tireK: 0.35, target: 18, maxErr: 7,
      okWord: '装车', errWord: '码塌', dropLine: '箱子掉地上了！摔坏了算你的！', tiltLine: '没放稳，一摞全塌了！', goodLine: '稳！',
      kg: () => Math.random() < 0.3 ? 25 + Math.floor(Math.random() * 15) : 8 + Math.floor(Math.random() * 14),
      w: kg => Math.min(cw - 6, 46 + kg * 0.3), h: kg => Math.min(ch - 4, 38 + kg * 0.3),
      slots: mkSlots, refill: st => { st.slots.forEach(s => s.used = false); st.items = st.items.filter(i => !i.placed); st.msg = '一车装满！下一辆倒进来了。'; st.msgT = 1.6; },
      inSource: i => i.x < 330 && i.y > 280,
      drawScene: (ctx, st) => {
        rr(ctx, 70, 380, 220, 26, 3, '#7a5a36', INK); txt(ctx, '货堆', 180, 430, 14, '#f3ead8', 'center');
        rr(ctx, van.x, van.y, van.w + 30, van.h, 6, '#e9e6de', INK, 3); rr(ctx, van.x + 22, van.y + 12, van.w - 10, van.h - 24, 3, '#3b3936', '#00000088');
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(van.x + 60, van.y + van.h + 10, 22, 0, 7); ctx.arc(van.x + van.w - 30, van.y + van.h + 10, 22, 0, 7); ctx.fill();
      },
      drawItem: (ctx, i, held) => { ctx.save(); ctx.translate(i.x, i.y); ctx.rotate(i.ang); rr(ctx, -i.w / 2, -i.h / 2, i.w, i.h, 3, i.kg > 25 ? '#a07a48' : '#c49a62', held ? '#f2c14e' : INK, held ? 3 : 2); ctx.fillStyle = '#e6d2a4'; ctx.fillRect(-i.w / 2, -4, i.w, 8); ctx.fillStyle = '#00000033'; ctx.fillRect(-i.w / 2, i.h / 2 - 6, i.w, 6); txt(ctx, i.kg > 25 ? '重' : '', 0, i.h / 2 - 10, 12, '#7a1a10', 'center', true); ctx.restore(); }
    }, o.over || {}));
  };

  MG.green = function (root, o) {
    const g = { x: 380, y: 170, cols: 6, rows: 4, cw: 80, ch: 62 };
    const mkSlots = () => { const a = []; for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) a.push({ x: g.x + c * g.cw + g.cw / 2, y: g.y + r * g.ch + g.ch / 2, used: false }); return a; };
    return dragGame(root, o, Object.assign({
      type: 'green', title: '绿化铺草皮 · 08:00–17:00', help: '把卷好的草皮拖到亮着的空地上，<b>对准格子</b>再松手。拖得太猛草皮会甩歪、接缝露土。',
      note: '对得越准，验收越好看；甩歪了要返工。', bg: 'img/bg-job-green.jpg', dur: 42, hours: 9, startH: 8,
      queue: 3, src: [170, 340], floor: 470, snap: 40, tiltTol: 0.4, keepTilt: false, slotW: g.cw - 4, slotH: g.ch - 4, spring: 110, tireK: 0.4, target: 20, maxErr: 7,
      okWord: '铺好', errWord: '返工', dropLine: '草皮甩在路上了，捡回来返工！', tiltLine: '铺歪了，露着土缝，重铺！', goodLine: '严丝合缝！',
      kg: () => 10 + Math.floor(Math.random() * 10), w: () => g.cw - 8, h: () => g.ch - 8,
      slots: mkSlots, refill: st => { st.slots.forEach(s => s.used = false); st.items = st.items.filter(i => !i.placed); st.msg = '这片铺完了，挪到下一片！'; st.msgT = 1.6; },
      inSource: i => i.x < 330,
      drawScene: (ctx) => { rr(ctx, g.x - 6, g.y - 6, g.cols * g.cw + 12, g.rows * g.ch + 12, 4, '#6b5236', '#00000066'); for (let k = 0; k < 40; k++) { ctx.fillStyle = '#5a442c'; ctx.fillRect(g.x + (k * 53) % (g.cols * g.cw), g.y + (k * 31) % (g.rows * g.ch), 6, 3); } rr(ctx, 80, 300, 180, 110, 6, '#4a3a28', INK); txt(ctx, '草皮卷', 170, 430, 14, '#f3ead8', 'center'); },
      drawItem: (ctx, i, held) => { ctx.save(); ctx.translate(i.x, i.y); ctx.rotate(i.ang); rr(ctx, -i.w / 2, -i.h / 2, i.w, i.h, 4, i.placed ? '#5f8f3e' : '#6f9e48', held ? '#f2c14e' : '#2d4a1c', held ? 3 : 2); ctx.strokeStyle = '#8fc060'; ctx.lineWidth = 1; for (let k = -i.w / 2 + 5; k < i.w / 2; k += 7) { ctx.beginPath(); ctx.moveTo(k, i.h / 2 - 3); ctx.lineTo(k + 2, -i.h / 2 + 4); ctx.stroke(); } ctx.restore(); }
    }, o.over || {}));
  };

  // ================= 后厨洗碗：按住鼠标来回刷 =================
  MG.dishwash = function (root, o) {
    return new Promise(resolve => {
      const perf = o.perf || { win: 1 };
      const { cv, ctx, bar, bgImg } = setup(root, '后厨洗碗 · 17:00–23:00', '按住鼠标在盘子上<b>来回刷</b>，把油污刷掉；刷干净自动放上架。脏碗堆到 12 个，领班就要骂人了。', 'img/bg-job-dishwash.jpg');
      bar.innerHTML = `<span class="mg-note">刷子越累越小。别刷一半就换下一个。</span><button class="mg-btn" id="mg-next">这个够干净了，下一个</button>`;
      const DUR = o.dur || 44, HOURS = 6, N = 20;
      const st = MG.cur = { type: 'dishwash', t: 0, done: false, plate: null, cleaned: 0, sloppy: 0, pile: 5, spawn: 2.5, suds: [], down: false, mx: 0, my: 0, lmx: 0, lmy: 0, fatigue: o.tired ? 30 : 0, msg: null, msgT: 0, scrubbed: 0, qs: [] };
      const PX = 450, PY = 255, PR = 130;
      const newPlate = () => { const g = []; const blobs = 3 + Math.floor(Math.random() * 4); const bl = []; for (let b = 0; b < blobs; b++) bl.push([(Math.random() - .5) * 1.4 * PR, (Math.random() - .5) * 1.4 * PR, 25 + Math.random() * 45]); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const px = (x + .5) / N * 2 * PR - PR, py = (y + .5) / N * 2 * PR - PR; if (px * px + py * py > PR * PR) { g.push(-1); continue; } let d = 0; bl.forEach(([bx, by, r]) => { const k = 1 - Math.hypot(px - bx, py - by) / r; if (k > 0) d = Math.max(d, Math.min(1, k * 1.6)); }); g.push(d); } const tot = g.filter(v => v > 0.05).length; return { g, tot: Math.max(1, tot), slide: 0, kind: Math.random() < .3 ? 'bowl' : 'plate' }; };
      st.plate = newPlate();
      const dirt = () => { const p = st.plate; return p.g.filter(v => v > 0.05).length / p.tot; };
      st.dirt = dirt; st.center = [PX, PY, PR];
      const scrub = (x, y, len) => {
        const p = st.plate; if (!p || p.slide) return;
        const br = (26 + 10 * (perf.win || 1)) * (1 - st.fatigue / 250);
        const cell = 2 * PR / N; let hit = 0;
        for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { const i = yy * N + xx; if (p.g[i] <= 0) continue; const cx = PX - PR + (xx + .5) * cell, cy = PY - PR + (yy + .5) * cell; if (Math.hypot(cx - x, cy - y) < br) { p.g[i] = Math.max(0, p.g[i] - 0.012 * len); hit++; } }
        if (hit && Math.random() < 0.5) st.suds.push({ x: x + (Math.random() - .5) * br, y: y + (Math.random() - .5) * br, r: 4 + Math.random() * 9, life: 1.2 });
        if (hit && Math.random() < 0.08) SFX.noise(0, 0.05, 2400, 0.04, 'highpass');
        st.scrubbed += len; st.fatigue = Math.min(100, st.fatigue + len * 0.0009);
      };
      const done = (forced) => { const p = st.plate; if (!p || p.slide) return; const d = dirt(); if (forced && d > 0.12) { st.sloppy++; st.msg = '这还有油呢！拿回去重刷！'; st.msgT = 1.6; st.qs.push(0.3); } else { st.cleaned++; st.qs.push(1 - d); st.msg = d < 0.03 ? '锃亮！' : null; st.msgT = .8; } p.slide = 0.01; SFX.noise(0, 0.08, 900, 0.1, 'bandpass'); };
      st.finishPlate = done;
      pointer(cv, { down: (x, y) => { st.down = true; st.lmx = st.mx = x; st.lmy = st.my = y; }, move: (x, y) => { st.mx = x; st.my = y; if (st.down) { const len = Math.hypot(x - st.lmx, y - st.lmy); scrub(x, y, len); } st.lmx = x; st.lmy = y; }, up: () => { st.down = false; } });
      st.scrubAt = (x, y, len) => scrub(x, y, len);
      bar.querySelector('#mg-next').onclick = () => done(true);
      const finish = res => { if (st.done) return; st.done = true; stop(); setTimeout(() => resolve(res), 900); };
      quitBtn(bar).onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * HOURS, quality: 0 });
      const stop = loop(dt => {
        st.t += dt; const prog = st.t / DUR;
        st.spawn -= dt; if (st.spawn <= 0) { st.pile++; st.spawn = Math.max(1.6, 3.4 - prog * 1.6); }
        st.fatigue = Math.min(100, st.fatigue + dt * 0.7);
        const p = st.plate;
        if (p && !p.slide && dirt() < 0.03) done(false);
        if (p && p.slide) { p.slide += dt * 2.4; if (p.slide >= 1) { st.pile = Math.max(0, st.pile - 1); st.plate = st.pile > 0 ? newPlate() : null; } }
        if (!st.plate && st.pile > 0) st.plate = newPlate();
        st.suds.forEach(s => { s.life -= dt; s.y -= dt * 8; }); st.suds = st.suds.filter(s => s.life > 0);
        st.msgT -= dt;
        paintBg(ctx, bgImg(), 0.5);
        // 水槽
        rr(ctx, 230, 110, 440, 300, 22, '#9fb2bc', '#2a2f33', 4); rr(ctx, 248, 126, 404, 268, 18, '#5f7884', null);
        ctx.fillStyle = '#ffffff22'; for (let k = 0; k < 12; k++) { ctx.beginPath(); ctx.arc(270 + k * 33, 380 - (k % 3) * 8, 10, 0, 7); ctx.fill(); }
        // 脏碗堆
        for (let k = 0; k < Math.min(st.pile, 14); k++) { ctx.fillStyle = k % 2 ? '#e8e4da' : '#d9d3c4'; ctx.beginPath(); ctx.ellipse(120, 400 - k * 13, 62, 15, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a6a4a'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#8a6a3a66'; ctx.beginPath(); ctx.ellipse(110 + (k * 7) % 20, 398 - k * 13, 20, 5, 0, 0, 7); ctx.fill(); }
        txt(ctx, `待洗 ${st.pile}`, 120, 430 - Math.min(st.pile, 14) * 13 - 18, 15, st.pile >= 10 ? '#ffb4a8' : '#fff', 'center', true);
        // 架子
        rr(ctx, 720, 160, 150, 230, 6, '#00000044', '#c8c8c8', 2); for (let k = 0; k < Math.min(st.cleaned, 16); k++) { ctx.fillStyle = '#f6f4ee'; ctx.fillRect(732 + (k % 8) * 16, 370 - Math.floor(k / 8) * 100 - 80, 8, 80); }
        txt(ctx, `洗好 ${st.cleaned}`, 795, 410, 15, '#fff', 'center', true);
        if (st.plate) {
          const q = st.plate, ox = q.slide ? q.slide * 330 : 0, oy = q.slide ? -q.slide * 60 : 0;
          ctx.save(); ctx.translate(ox, oy);
          ctx.fillStyle = '#f7f5ef'; ctx.beginPath(); ctx.arc(PX, PY, PR, 0, 7); ctx.fill(); ctx.strokeStyle = '#bdb6a6'; ctx.lineWidth = 3; ctx.stroke();
          ctx.strokeStyle = '#e2ddd0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(PX, PY, PR * 0.62, 0, 7); ctx.stroke();
          const cell = 2 * PR / N;
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const v = q.g[y * N + x]; if (v > 0.02) { ctx.fillStyle = `rgba(${150 - v * 40},${110 - v * 40},${40},${0.15 + v * 0.7})`; ctx.fillRect(PX - PR + x * cell, PY - PR + y * cell, cell + .5, cell + .5); } }
          ctx.restore();
        }
        st.suds.forEach(s => { ctx.fillStyle = `rgba(255,255,255,${Math.min(.85, s.life)})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); ctx.strokeStyle = `rgba(180,210,230,${Math.min(.8, s.life)})`; ctx.lineWidth = 1; ctx.stroke(); });
        if (st.down) { ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.ellipse(st.mx, st.my, 22, 14, -0.5, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }
        meter(ctx, 20, 34, 200, `工时  ${clockStr(17, prog, HOURS)}`, prog, '#f2c14e');
        meter(ctx, 20, 72, 200, `手上起皮 ${Math.round(st.fatigue)}`, st.fatigue / 100, st.fatigue > 70 ? '#d64a3a' : '#e39a4a');
        if (st.plate && !st.plate.slide) meter(ctx, 360, 440, 180, `油污 ${Math.round(dirt() * 100)}%`, dirt(), '#b98a3a');
        if (st.msgT > 0 && st.msg) bubble(ctx, st.msg, 520, 40, /油|重刷/.test(st.msg));
        if (st.pile >= 12 && st.msgT <= 0) { st.msg = '碗都摞成山了！手脚快点！'; st.msgT = 1.6; }
        if (st.pile >= 18) { finish({ completed: false, fired: true, hoursDone: prog * HOURS, quality: 0 }); bubble(ctx, '你别干了！明天不用来了！', 300, 200, true); return false; }
        if (st.t >= DUR) { const avg = st.qs.length ? st.qs.reduce((a, b) => a + b, 0) / st.qs.length : 0; const q = Math.max(0, Math.min(1, avg * 0.55 + Math.min(1, st.cleaned / Math.max(4, 14 * DUR / 44)) * 0.45 - st.sloppy * 0.04)); finish({ completed: true, quality: q, mentalMult: st.pile > 10 ? 1.2 : 1, summary: `洗了 ${st.cleaned} 摞碗盘，被打回 ${st.sloppy} 次。` }); return false; }
      });
    });
  };

  // ================= 酒店端盘：托盘要端平 =================
  MG.waiter = function (root, o) {
    return new Promise(resolve => {
      const perf = o.perf || { win: 1, shake: .6 };
      const { cv, ctx, bar, bgImg } = setup(root, '酒店端盘 · 10:00–20:00', '左右<b>移动鼠标</b>（或 <kbd>←</kbd><kbd>→</kbd>）托住托盘，别让它歪。路上有人撞你、地上有台阶。歪过红线，汤就洒了。', 'img/bg-job-waiter.jpg');
      bar.innerHTML = `<span class="mg-note">送到一桌加一单；洒了要被领班记一笔。</span>`;
      const DUR = o.dur || 42, HOURS = 10;
      const st = MG.cur = { type: 'waiter', t: 0, done: false, tilt: 0, tv: 0, hand: 0, mx: W / 2, walk: 0, served: 0, spills: 0, msg: null, msgT: 0, bumpT: 2, recover: 0, glasses: 3, key: 0 };
      const LIM = 0.36 * (0.8 + 0.2 * (perf.win || 1));
      pointer(cv, { move: (x) => { st.mx = x; } });
      const kd = e => { if (e.key === 'ArrowLeft') { st.key = -1; e.preventDefault(); } if (e.key === 'ArrowRight') { st.key = 1; e.preventDefault(); } };
      const ku = e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') st.key = 0; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      st.setHand = v => { st.mx = W / 2 + v * 300; };
      const finish = res => { if (st.done) return; st.done = true; stop(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); setTimeout(() => resolve(res), 900); };
      quitBtn(bar).onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * HOURS, quality: 0 });
      const stop = loop(dt => {
        st.t += dt; const prog = st.t / DUR;
        if (st.key) st.mx = Math.max(0, Math.min(W, st.mx + st.key * 420 * dt));
        // 手的位置决定托盘往回压的力：手偏右，托盘往左压
        const handOff = (st.mx - W / 2) / 300;
        st.hand += (handOff - st.hand) * Math.min(1, dt * 8);
        st.bumpT -= dt;
        if (st.bumpT <= 0) { const dir = Math.random() < .5 ? -1 : 1; st.tv += dir * (0.9 + Math.random() * 0.9) * (1 + prog * 0.6); st.bumpT = 1.6 + Math.random() * 2.2 - prog; st.msg = pick(['借过借过！', '台阶！', '小朋友跑过来了', '后厨推门出来']); st.msgT = .8; }
        const gravity = st.tilt * 3.2; // 一歪就越歪
        st.tv += (gravity - st.hand * 4.2) * dt + (Math.random() - .5) * (perf.shake || .6) * 0.6 * dt;
        st.tv *= (1 - dt * 1.8); st.tilt += st.tv * dt;
        if (st.recover > 0) { st.recover -= dt; st.tilt *= .9; st.tv *= .8; }
        if (Math.abs(st.tilt) > LIM && st.recover <= 0) { st.spills++; st.msg = '汤洒了！领班记了你一笔。'; st.msgT = 1.6; st.recover = 1.2; SFX.noise(0, 0.25, 700, 0.2, 'bandpass'); st.walk = 0; }
        st.walk += dt / 4.2; if (st.walk >= 1) { st.walk = 0; st.served++; st.msg = '“您的菜，慢用。”'; st.msgT = 1; }
        st.msgT -= dt;
        paintBg(ctx, bgImg(), 0.38);
        // 走廊进度
        rr(ctx, 120, 430, 660, 10, 5, '#00000066'); rr(ctx, 120, 430, 660 * st.walk, 10, 5, '#f2c14e'); txt(ctx, '后厨', 120, 424, 13); txt(ctx, `${(st.served % 12) + 1} 号桌`, 780, 424, 13, '#fff', 'right');
        // 托盘
        const cx = W / 2 + st.hand * 40, cy = 260;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(st.tilt);
        rr(ctx, -150, -6, 300, 12, 6, '#2c2c30', '#000', 2);
        // 碗和杯子
        const slide = st.tilt * 60;
        ctx.fillStyle = '#f4f1ea'; ctx.beginPath(); ctx.ellipse(-60 + slide, -22, 50, 18, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = '#9a9488'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#c0703a'; ctx.beginPath(); ctx.ellipse(-60 + slide, -22, 46, 7, st.tilt * -1.5, 0, 7); ctx.fill();
        for (let g = 0; g < 2; g++) { rr(ctx, 40 + g * 50 + slide, -60, 30, 54, 4, '#cfe6f0cc', '#8aa', 1.5); ctx.fillStyle = '#e8c26a'; ctx.fillRect(42 + g * 50 + slide, -40 + Math.abs(st.tilt) * 20, 26, 32 - Math.abs(st.tilt) * 20); }
        ctx.restore();
        // 手
        ctx.fillStyle = '#d9a57c'; ctx.beginPath(); ctx.ellipse(cx, cy + 22, 34, 14, 0, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
        // 水平仪
        const lv = st.tilt / LIM; rr(ctx, W / 2 - 160, 80, 320, 18, 9, '#00000077', '#fff8', 1.5); ctx.fillStyle = '#e0452f88'; ctx.fillRect(W / 2 - 160, 80, 30, 18); ctx.fillRect(W / 2 + 130, 80, 30, 18);
        ctx.fillStyle = Math.abs(lv) > .75 ? '#ff6a50' : '#8fe08a'; ctx.beginPath(); ctx.arc(W / 2 + Math.max(-1, Math.min(1, lv)) * 150, 89, 10, 0, 7); ctx.fill();
        txt(ctx, '托盘', W / 2, 72, 13, '#fff', 'center');
        meter(ctx, 20, 34, 200, `工时  ${clockStr(10, prog, HOURS)}`, prog, '#f2c14e');
        txt(ctx, `上菜 ${st.served}   洒了 ${st.spills}/6`, 20, 76, 16);
        if (st.msgT > 0 && st.msg) bubble(ctx, st.msg, 600, 130, /洒/.test(st.msg));
        if (st.spills >= 6) { finish({ completed: false, fired: true, hoursDone: prog * HOURS, quality: 0 }); return false; }
        if (st.t >= DUR) { const q = Math.max(0, Math.min(1, st.served / Math.max(1, st.served + st.spills * 1.5) * Math.min(1, st.served / Math.max(3, DUR / 4.2 * 0.8)))); finish({ completed: true, quality: q, mentalMult: 1 + st.spills * 0.05, summary: `上了 ${st.served} 桌菜，洒了 ${st.spills} 回。` }); return false; }
      });
    });
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // ================= 印刷厂包装：用分拣的手感，换成按书目装箱 =================
  // ================= v0.9 第二批：冷库 / 工地 用装卸的手感，拆装舞台用铺草皮的手感 =================
  MG.coldstore = (root, o) => MG.mover(root, Object.assign({}, o, { over: { type: 'coldstore', title: '冷库搬运 · 07:00–15:00',
    help: '冷库里零下十几度。把冻品箱拖进叉车托盘上亮着的格子，<b>从下往上</b>码。手冻僵了，箱子更滑。', note: '箱子下面的条是晃动：变红时松手会码塌。',
    bg: 'img/bg-job-coldstore.jpg', hours: 8, startH: 7, okWord: '码好', errWord: '码塌', dropLine: '冻品摔地上了！清点少一箱！', goodLine: '稳！',
    kg: () => 6 + Math.floor(Math.random() * 14), tiltTol: 0.28 } }));
  MG.site = (root, o) => MG.mover(root, Object.assign({}, o, { over: { type: 'site', title: '工地小工 · 07:00–17:00',
    help: '把水泥袋、砖垛拖到斗车上亮着的格子里，<b>从下往上</b>码。水泥袋死沉，等它不晃再松手。', note: '晃动条变红时松手会码塌。',
    bg: 'img/bg-job-site.jpg', hours: 10, startH: 7, okWord: '装车', errWord: '撒了', dropLine: '水泥袋摔破了，师傅骂了一句！', tiltLine: '一垛砖全塌了！', goodLine: '师傅点了点头。',
    kg: () => Math.random() < 0.45 ? 30 + Math.floor(Math.random() * 15) : 12 + Math.floor(Math.random() * 12) } }));
  MG.stage = (root, o) => MG.green(root, Object.assign({}, o, { over: { type: 'stage', title: '拆装舞台 · 09:00–18:00',
    help: '把舞台地板一块一块拖到亮着的格子上，<b>对准</b>再松手。对不齐，演出时会有人绊倒。', note: '对得越准，验收越快；歪了要返工。',
    bg: 'img/bg-job-stage.jpg', hours: 9, startH: 9, okWord: '铺好', errWord: '返工', dropLine: '地板砸在地上，舞台监督吼了一嗓子！', tiltLine: '对歪了，缝隙卡脚，重来！', goodLine: '严丝合缝！' } }));

  MG.print = function (root, o) { return MG.courier(root, Object.assign({}, o, { variant: 'print' })); };
})();
