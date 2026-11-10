// v0.9.2 · 三份活有了自己的手感：冷库（手冻僵、哈气暖手）/ 工地（砖和水泥袋）/ 拆装舞台（拧螺栓，掌握力道）
(function () {
  const MG = window.MG; const SFX = MG.sfx; const W = 900, H = 470, INK = '#1d1a18';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  const fx = n => { try { window.FX && FX.sfx.play(n); } catch (e) { } };
  const rr = (ctx, x, y, w, h, r, fill, stroke, lw) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  const txt = (ctx, s, x, y, size, color, align, bold) => { ctx.font = `${bold ? '700 ' : ''}${size || 16}px ${FONT}`; ctx.fillStyle = color || '#f3ead8'; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); };
  const meter = (ctx, x, y, w, label, v, color) => { txt(ctx, label, x, y - 5, 13); rr(ctx, x, y, w, 10, 5, '#00000066', '#f3ead888', 1.5); rr(ctx, x, y, Math.max(0, w * Math.min(1, v)), 10, 5, color); };
  const clockStr = (startH, frac, hours) => { const m = Math.floor((startH * 60 + frac * hours * 60) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function loop(fn) { const born = performance.now(); let last = born, alive = true; const step = now => { if (!alive) return; if (window.MG_KILL > born) { alive = false; return; } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (window.MG_SAFE(fn, dt) === false) { alive = false; return; } requestAnimationFrame(step); }; requestAnimationFrame(step); return () => { alive = false; }; }
  function bubble(ctx, s, x, y, red) { ctx.font = `16px ${FONT}`; const w = ctx.measureText(s).width + 24; rr(ctx, x, y, w, 34, 10, red ? '#fff0ec' : '#fffdf5', red ? '#b33a2e' : INK); txt(ctx, s, x + 12, y + 23, 16, red ? '#a3261b' : INK); }

  // ================= 冷库 =================
  MG.coldstore = (root, o) => MG.mover(root, Object.assign({}, o, { over: { type: 'coldstore', title: '冷库搬运 · 07:00–15:00',
    help: '冷库里零下十几度。把冻品箱拖进托盘上亮着的格子，<b>从下往上</b>码。手会越来越僵——点<b>哈气暖手</b>缓一缓（缓的时候手不能动）。', note: '“手冻僵”满了，箱子会拽不动、打滑。',
    bg: 'img/bg-job-coldstore.jpg', hours: 8, startH: 7, okWord: '码好', errWord: '码塌', dropLine: '冻品摔地上了！清点少一箱！', goodLine: '稳！',
    kg: () => 6 + Math.floor(Math.random() * 14), tiltTol: 0.28,
    init: (st, bar) => { st.cold = 0; st.warm = 0; st.puffs = []; bar.insertAdjacentHTML('afterbegin', '<button class="mg-btn" id="mg-warm">哈气暖手</button>'); const b = bar.querySelector('#mg-warm');
      st.warmUp = () => { if (st.warm > 0 || st.done) return; st.cold = Math.max(0, st.cold - 65); st.warm = 1.2; st.held = null; st.puffs.push({ t: 0 }); fx('wind'); }; b.onclick = st.warmUp; },
    tick: (st, dt) => { st.cold = Math.min(100, st.cold + dt * (st.warm > 0 ? 0 : 3.0 * (1 + st.fatigue / 200))); if (st.warm > 0) { st.warm -= dt; st.held = null; } st.puffs.forEach(p => p.t += dt); st.puffs = st.puffs.filter(p => p.t < 1.6);
      if (Math.floor(st.t * 0.5) !== st._bp) { st._bp = Math.floor(st.t * 0.5); st.puffs.push({ t: 0 }); } },
    overlay: (ctx, st) => {
      ctx.fillStyle = 'rgba(150,195,255,.13)'; ctx.fillRect(0, 0, W, H);
      const a = 0.18 + st.cold / 100 * 0.5; const g = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 560); g.addColorStop(0, 'rgba(220,240,255,0)'); g.addColorStop(1, `rgba(225,242,255,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      st.puffs.forEach(p => { const k = p.t / 1.6; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(60 + k * 40, 330 - k * 70, 10 + k * 34, 0, 7); ctx.fill(); });
      meter(ctx, 20, 150, 200, `手冻僵 ${Math.round(st.cold)}`, st.cold / 100, st.cold > 70 ? '#7aa8ff' : '#9fd0ff');
      if (st.warm > 0) bubble(ctx, '哈——搓搓手……', 330, 40, false);
    } } }));

  // ================= 工地 =================
  MG.site = (root, o) => {
    const van = { x: 560, y: 180, w: 300, h: 230 }, cols = 4, rows = 3, cw = 72, ch = 56;
    return MG.mover(root, Object.assign({}, o, { over: { type: 'site', title: '工地小工 · 07:00–17:00',
      help: '把砖垛和水泥袋拖到斗车上亮着的格子里，<b>从下往上</b>码。水泥袋死沉，等它不晃再松手。', note: '晃动条变红时松手会码塌。',
      bg: 'img/bg-job-site.jpg', hours: 10, startH: 7, okWord: '装车', errWord: '撒了', dropLine: '水泥袋摔破了，师傅骂了一句！', tiltLine: '一垛砖全塌了！', goodLine: '师傅点了点头。',
      kg: () => Math.random() < 0.4 ? 30 + Math.floor(Math.random() * 15) : 12 + Math.floor(Math.random() * 12),
      drawScene: (ctx, st) => {
        rr(ctx, 60, 372, 240, 30, 3, '#6b5a46', INK); for (let k = 0; k < 5; k++) { rr(ctx, 80 + k * 44, 352, 38, 20, 2, '#b4553a', '#00000066', 1.5); }
        rr(ctx, van.x - 10, van.y + 20, van.w + 40, van.h - 20, 8, '#5d6a3c', INK, 3); rr(ctx, van.x + 8, van.y + 36, van.w + 4, van.h - 52, 4, '#2c2a20', '#00000088');
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(van.x + 70, van.y + van.h + 16, 26, 0, 7); ctx.fill(); ctx.strokeStyle = '#999'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(van.x + van.w + 30, van.y + 40); ctx.lineTo(van.x + van.w + 90, van.y - 10); ctx.stroke();
      },
      drawItem: (ctx, i, held) => { ctx.save(); ctx.translate(i.x, i.y);
        ctx.rotate(i.ang);
        if (i.kg >= 30) { rr(ctx, -i.w / 2, -i.h / 2, i.w, i.h, 7, '#a7a395', held ? '#f2c14e' : INK, held ? 3 : 2); ctx.strokeStyle = '#8c8878'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-i.w / 2 + 8, -i.h / 5); ctx.lineTo(i.w / 2 - 8, -i.h / 5); ctx.moveTo(-i.w / 2 + 8, i.h / 5); ctx.lineTo(i.w / 2 - 8, i.h / 5); ctx.stroke(); ctx.fillStyle = '#d9d5c4'; ctx.fillRect(-10, -i.h / 2 + 4, 20, 6); }
        else { rr(ctx, -i.w / 2, -i.h / 2, i.w, i.h, 3, '#b4553a', held ? '#f2c14e' : INK, held ? 3 : 2); ctx.strokeStyle = '#7d3a28'; ctx.lineWidth = 2; const rw = 4; for (let r = 1; r < rw; r++) { const y = -i.h / 2 + r * i.h / rw; ctx.beginPath(); ctx.moveTo(-i.w / 2, y); ctx.lineTo(i.w / 2, y); ctx.stroke(); for (let c = 0; c < 3; c++) { const x = -i.w / 2 + (c + (r % 2 ? 0.5 : 0)) * i.w / 3; ctx.beginPath(); ctx.moveTo(x, y - i.h / rw); ctx.lineTo(x, y); ctx.stroke(); } } }
        ctx.restore(); },
      overlay: (ctx, st) => { ctx.fillStyle = 'rgba(210,170,110,.07)'; ctx.fillRect(0, 0, W, H); for (let k = 0; k < 14; k++) { const x = (k * 97 + st.t * 25) % W, y = (k * 53 + st.t * 9) % H; ctx.fillStyle = 'rgba(220,200,160,.18)'; ctx.fillRect(x, y, 2, 2); } }
    } }));
  };

  // ================= 拆装舞台：拧螺栓 =================
  // 按住螺栓，力道条来回扫；绿区松手 = 拧下来。松早了没拧动（费时间），过头了滑牙（要返工）。
  MG.stage = function (root, o) {
    return new Promise(resolve => {
      root.innerHTML = `<div class="mg"><div class="mg-top"><b>拆装舞台 · 09:00–18:00</b><span class="mg-help">按住一颗螺栓，右边的<b>力道条</b>来回扫，在<b>绿区</b>松手就拧下来。松早了没拧动，过头了会滑牙。拆完一块板，下一块推上来。</span></div>
        <canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px;touch-action:none"></canvas><div class="mg-bar"><span class="mg-note">滑牙太多，舞台监督会发火。</span><button class="mg-btn ghost" id="mg-quit">不干了，走人</button></div></div>`;
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'); ctx.scale(2, 2);
      const img = new Image(); img.src = 'img/bg-job-stage.jpg';
      const perf = o.perf || { win: 1, shake: .6 }; const DUR = o.dur || 42, HOURS = 9, START = 9;
      const COLS = 4, ROWS = 2, mkBolts = () => { const a = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) a.push({ x: 250 + c * 130, y: 225 + r * 110, on: true, spin: 0 }); return a; };
      const st = MG.cur = { type: 'stage', t: 0, done: false, ok: 0, err: 0, panels: 0, bolts: mkBolts(), sel: null, g: 0, gdir: 1, fatigue: o.tired ? 30 : 0, msg: null, msgT: 0, shake: 0, quality: [], lift: 0, perf };
      const MAXERR = 7;
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
      const zone = () => { const w = 0.2 * (perf.win || 1) * (1 - st.fatigue / 300); return [0.62 - w / 2, 0.62 + w / 2]; };
      st.zoneNow = zone;
      cv.addEventListener('pointerdown', e => { if (st.done || st.lift > 0) return; cv.setPointerCapture && e.pointerId != null && cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); const b = st.bolts.find(b => b.on && Math.hypot(b.x - x, b.y - y) < 30); if (b) { st.sel = b; st.g = 0; st.gdir = 1; fx('click'); } });
      const rel = () => {
        const b = st.sel; st.sel = null; if (!b || st.done) return;
        const [z0, z1] = zone();
        if (st.g < z0 - 0.04) { st.msg = '没拧动，再来。'; st.msgT = 1; fx('rustle'); st.fatigue = Math.min(100, st.fatigue + 0.8); }
        else if (st.g > z1 + 0.04) { b.on = false; b.bad = true; st.err++; st.msg = '滑牙了！螺栓拧秃了！'; st.msgT = 1.5; st.shake = .3; fx('rustle'); SFX.thud(.8); st.quality.push(0.1); st.ok += 0; }
        else { b.on = false; b.spin = 1; st.ok++; const q = 1 - Math.abs(st.g - (z0 + z1) / 2) / ((z1 - z0) / 2 + 0.04) * 0.4; st.quality.push(q); st.msg = q > .85 ? '利索！' : null; st.msgT = .8; fx('coin'); SFX.thud(.5); st.fatigue = Math.min(100, st.fatigue + 1.4); }
        if (!st.bolts.some(b => b.on)) { st.lift = 1.4; st.panels++; fx('paper'); }
      };
      window.addEventListener('pointerup', rel); cv.addEventListener('pointercancel', rel);
      const finish = res => { if (st.done) return; st.done = true; window.removeEventListener('pointerup', rel); clearInterval(st._auto); stop(); setTimeout(() => resolve(res), 900); };
      root.querySelector('#mg-quit').onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * HOURS, quality: 0 });
      // 测试用自动玩家
      st.autoplay = mode => { let was = null; clearInterval(st._auto); st._auto = setInterval(() => { if (st.done || st.lift > 0) return;
        if (!st.sel) { const b = st.bolts.find(b => b.on); if (!b) return; const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: r.left + b.x / W * r.width, clientY: r.top + b.y / H * r.height, bubbles: true, pointerId: 1 })); return; }
        const [z0, z1] = zone(); if (mode === 'bad' ? st.g > 0.97 : (st.g >= z0 + 0.02 && st.g <= z1 - 0.02)) window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })); }, 12); };
      const stop = loop(dt => {
        st.t += dt; const prog = st.t / DUR; st.fatigue = Math.min(100, st.fatigue + dt * 0.5);
        if (st.sel) { st.g += st.gdir * dt * (0.9 + st.fatigue / 140 + 0.15 * st.panels); if (st.g >= 1) { st.g = 1; st.gdir = -1; } if (st.g <= 0) { st.g = 0; st.gdir = 1; } if (Math.random() < dt * 14) fx('tick'); }
        st.msgT -= dt; st.shake = Math.max(0, st.shake - dt); if (st.lift > 0) { st.lift -= dt; if (st.lift <= 0) st.bolts = mkBolts(); }
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 12 * st.shake, (Math.random() - .5) * 8 * st.shake);
        if (img.complete && img.naturalWidth) { const s = Math.max(W / img.naturalWidth, H / img.naturalHeight); ctx.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s); } else { ctx.fillStyle = '#2a2a32'; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = 'rgba(8,8,14,.45)'; ctx.fillRect(0, 0, W, H);
        // 舞台板
        const lift = st.lift > 0 ? (1.4 - st.lift) / 1.4 : 0; ctx.save(); ctx.translate(0, -lift * 260); ctx.globalAlpha = 1 - lift * .8;
        rr(ctx, 190, 165, 540, 220, 10, '#4b4f5c', '#0d0e12', 4); rr(ctx, 200, 175, 520, 200, 6, '#5d6272', null); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(200 + k * 130, 175); ctx.lineTo(200 + k * 130, 375); ctx.stroke(); }
        st.bolts.forEach(b => { const sel = st.sel === b; ctx.save(); ctx.translate(b.x, b.y); if (b.on) { ctx.rotate(sel ? st.g * 12 : 0); ctx.fillStyle = sel ? '#ffe39a' : '#a9afbd'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a7080'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); }
          else { ctx.fillStyle = b.bad ? '#2a1e1a' : '#252830'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 7); ctx.fill(); if (b.bad) { txt(ctx, '✕', 0, 6, 18, '#d9503f', 'center', true); } else if (b.spin > 0) { b.spin -= dt * 2; ctx.rotate(b.spin * 8); ctx.fillStyle = '#c9cedd'; ctx.fillRect(-18, -18 - (1 - b.spin) * 50, 36, 8); } }
          ctx.restore(); });
        ctx.restore();
        // 力道条
        const gx = 770, gy = 170, gh = 200; rr(ctx, gx, gy, 28, gh, 8, '#0b0c12cc', '#f3ead888', 1.5); const [z0, z1] = zone();
        ctx.fillStyle = 'rgba(120,230,150,.8)'; ctx.fillRect(gx + 3, gy + gh - z1 * gh, 22, (z1 - z0) * gh); ctx.fillStyle = 'rgba(220,80,60,.45)'; ctx.fillRect(gx + 3, gy + 4, 22, gh - z1 * gh - 4);
        if (st.sel) { const y = gy + gh - st.g * gh; ctx.fillStyle = '#fff'; ctx.fillRect(gx - 6, y - 3, 40, 6); }
        txt(ctx, '力道', gx + 14, gy - 8, 13, '#f3ead8', 'center');
        txt(ctx, st.sel ? '在绿区松手！' : '按住一颗螺栓', gx + 14, gy + gh + 22, 14, '#ffe9b0', 'center', true);
        meter(ctx, 20, 34, 200, `工时  ${clockStr(START, prog, HOURS)}`, prog, '#f2c14e'); meter(ctx, 20, 72, 200, `腰酸 ${Math.round(st.fatigue)}`, st.fatigue / 100, st.fatigue > 70 ? '#d64a3a' : '#e39a4a');
        txt(ctx, `拆下 ${st.ok}   滑牙 ${st.err}/${MAXERR}   板子 ${st.panels}`, 20, 110, 16);
        if (st.msgT > 0 && st.msg) bubble(ctx, st.msg, 300, 70, /滑牙|秃/.test(st.msg));
        ctx.restore();
        if (st.err >= MAXERR) { finish({ completed: false, fired: true, hoursDone: prog * HOURS, quality: 0 }); return false; }
        if (st.t >= DUR) { const avg = st.quality.length ? st.quality.reduce((a, b) => a + b, 0) / st.quality.length : 0; const tgt = Math.max(4, Math.round(16 * DUR / 42)); const done = Math.min(1, st.ok / tgt); const q = Math.max(0, Math.min(1, avg * 0.5 + done * 0.5 - st.err * 0.04)); finish({ completed: true, quality: q, mentalMult: 1 + st.err * 0.04, summary: `拧下 ${st.ok} 颗螺栓（目标 ${tgt}），滑牙 ${st.err} 颗。` }); return false; }
      });
    });
  };
})();
