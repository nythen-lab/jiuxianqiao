// 小游戏：快递分拣 / 临时安保 / 食品厂 / 抗原药厂 / 顺手牵羊
(function () {
  const INK = '#2a2420';
  const MG = { cur: null };
  window.MG = MG;
  const W = 900, H = 470;

  window.MG_SAFE = (fn, dt) => { window.MG_HB = performance.now(); try { return fn(dt); } catch (e) { console.error('minigame error', e); if (window.MG_FAIL) window.MG_FAIL(e); return false; } };
  const _img = {};
  function IMG(src) { let i = _img[src]; if (!i) { i = _img[src] = new Image(); i.src = src; } return i.complete && i.naturalWidth ? i : null; }
  window.MG_IMG = IMG;
  function setup(root, title, help) {
    root.innerHTML = `<div class="mg"><div class="mg-top"><b>${title}</b><span class="mg-help">${help}</span></div>
      <canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px"></canvas>
      <div class="mg-bar"></div></div>`;
    const cv = root.querySelector('canvas'); const ctx = cv.getContext('2d'); ctx.scale(2, 2);
    return { cv, ctx, bar: root.querySelector('.mg-bar') };
  }
  function loop(fn) {
    const born = performance.now(); let last = born, alive = true;
    const step = now => { if (!alive) return; if (window.MG_KILL > born) { alive = false; return; } const dt = Math.min(0.05, (now - last) / 1000); last = now; if (window.MG_SAFE(fn, dt) === false) { alive = false; return; } requestAnimationFrame(step); };
    requestAnimationFrame(step);
    return () => { alive = false; };
  }
  function keys(handler) { const born = performance.now(); const h = e => { if (window.MG_KILL > born) return; if (handler(e) === true) e.preventDefault(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rr = (ctx, x, y, w, h, r, fill, stroke) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke !== false) { ctx.lineWidth = 2.5; ctx.strokeStyle = stroke || INK; ctx.stroke(); } };
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  const txt = (ctx, s, x, y, size, color, align) => { ctx.font = `${size || 16}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif`; ctx.fillStyle = color || INK; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); };
  const meter = (ctx, x, y, w, label, v, color, lc) => { txt(ctx, label, x, y - 4, 13, lc || '#f3ead8'); rr(ctx, x, y, w, 12, 6, '#00000055', '#f3ead8'); rr(ctx, x, y, Math.max(0, w * Math.min(1, v)), 12, 6, color, false); };
  const clockStr = (startH, frac, hours) => { const m = Math.floor((startH * 60 + frac * hours * 60) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function bubble(ctx, s, x, y, red) { ctx.font = '17px sans-serif'; const w = ctx.measureText(s).width + 26; rr(ctx, x, y, w, 36, 10, red ? '#fff0ec' : '#fffdf5', red ? '#b33a2e' : INK); ctx.beginPath(); ctx.moveTo(x + 22, y + 36); ctx.lineTo(x + 16, y + 48); ctx.lineTo(x + 34, y + 36); ctx.fillStyle = red ? '#fff0ec' : '#fffdf5'; ctx.fill(); txt(ctx, s, x + 13, y + 24, 17, red ? '#a3261b' : INK); }
  function person(ctx, x, y, s, shirt, skin, angry) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
    ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-18, -50); ctx.quadraticCurveTo(0, -62, 18, -50); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = skin || '#d9a57c'; ctx.beginPath(); ctx.arc(0, -72, 16, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-6, -73, 2, 0, 7); ctx.arc(6, -73, 2, 0, 7); ctx.fill();
    if (angry) { ctx.beginPath(); ctx.moveTo(-11, -82); ctx.lineTo(-3, -78); ctx.moveTo(11, -82); ctx.lineTo(3, -78); ctx.moveTo(-6, -63); ctx.quadraticCurveTo(0, -67, 6, -63); ctx.stroke(); }
    ctx.restore();
  }

  // ---------------- 快递分拣 ----------------
  // v0.9.3：把场景底图铺满画布（cover），再压一层暗色，让上面的游戏元素读得清
  const cover = (ctx, src, W, H, dim, fallback) => { const im = IMG(src); if (im) { const r = Math.max(W / im.width, H / im.height); const w = im.width * r, h = im.height * r; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); ctx.fillStyle = 'rgba(14,12,18,' + dim + ')'; ctx.fillRect(0, 0, W, H); } else { ctx.fillStyle = fallback; ctx.fillRect(0, 0, W, H); } };

  MG.courier = function (root, o) {
    return new Promise(resolve => {
      const PR = o.variant === 'print';
      const { ctx, bar } = setup(root, PR ? '印刷厂包装 · 08:00–20:00' : '快递分拣 · 07:00–19:00', PR ? '书捆到黄色区时，按对应数字键 <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd>（或点下面的格子）装进对的箱子' : '包裹到黄色扫码区时，按对应数字键 <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd>（或点下面的格子）扔进对的格子');
      const BINS = PR ? [{ n: '教辅', c: '#d64a3a' }, { n: '画册', c: '#e3b23c' }, { n: '小说', c: '#3f74b5' }, { n: '杂志', c: '#4b9a5a' }] : [{ n: '朝阳', c: '#d64a3a' }, { n: '海淀', c: '#e3b23c' }, { n: '丰台', c: '#3f74b5' }, { n: '通州', c: '#4b9a5a' }];
      bar.innerHTML = BINS.map((b, i) => `<button class="mg-btn bin" data-k="${i}" style="--c:${b.c}">${i + 1} · ${b.n}</button>`).join('') + `<button class="mg-btn ghost" id="mg-quit">不干了，走人</button>`;
      const perf = o.perf || { shake: 0.6, win: 1, speed: 1 };
      const zw = Math.round(130 * perf.win), ZONE = [625 - zw / 2, 625 + zw / 2];
      const DUR = o.dur || 40;
      const st = MG.cur = { type: PR ? 'print' : 'courier', t: 0, pk: [], spawn: 0, ok: 0, err: 0, shout: null, shoutT: 0, fatigue: o.tired ? 30 : 0, done: false, zone: ZONE, burst: false, shake: 0, perf };
      const lines = ['干得太慢了！', '看清楚再扔！', '再这样就别干了！', '扔错了！重新分！', '手脚麻利点！'];
      const press = k => {
        if (st.done) return;
        const inZ = st.pk.filter(p => !p.gone && p.x + 30 >= ZONE[0] && p.x - 30 <= ZONE[1]).sort((a, b) => b.x - a.x)[0];
        if (!inZ) return;
        const slip = st.fatigue > 75 && Math.random() < 0.15;
        const heavySlip = inZ.kg > 15 && st.fatigue > 55 && Math.random() < 0.12 + (1 - perf.win) * 0.3;
        if (inZ.code === k && !slip && !heavySlip) { inZ.gone = 'ok'; inZ.fly = 0; inZ.fx = inZ.x; st.ok++; st.fatigue = Math.min(100, st.fatigue + 0.5 + inZ.kg * 0.08); }
        else if (heavySlip) { inZ.gone = 'bad'; st.err++; st.shout = `${inZ.kg} 公斤！胳膊一软没抱住……`; st.shoutT = 1.6; st.shake = 0.35; SFX.thud(1); }
        else { inZ.gone = 'bad'; st.err++; st.shout = slip ? '手一滑扔错了……' : lines[Math.floor(Math.random() * lines.length)]; st.shoutT = 1.6; }
      };
      st.press = press;
      const offK = keys(e => { const k = '1234'.indexOf(e.key); if (k >= 0) { press(k); return true; } });
      bar.querySelectorAll('.bin').forEach(b => b.onclick = () => press(+b.dataset.k));
      const finish = (res) => { if (st.done) return; st.done = true; offK(); stop(); setTimeout(() => resolve(res), 900); };
      bar.querySelector('#mg-quit').onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * 12, quality: 0 });
      const stop = loop(dt => {
        st.t += dt; const prog = st.t / DUR;
        st.burst = prog > 0.78 && prog < 0.9;
        const speed = (140 + prog * 90) * (st.burst ? 1.1 : 1) * Math.min(1, perf.speed || 1);   // v1.0.2：速度封顶，最快约 253 像素/秒
        st.spawn -= dt;
        if (st.spawn <= 0) { const kg = Math.random() < 0.25 ? 16 + Math.floor(Math.random() * 10) : 1 + Math.floor(Math.random() * 10); st.pk.push({ x: -40, code: Math.floor(Math.random() * 4), kg, w: 78 + kg * 1.2, h: 56 + kg * 0.5 }); st.spawn = Math.max(1.05, 1.6 - prog * 0.5) * (st.burst ? 0.9 : 1); }
        st.pk.forEach(p => { if (!p.gone) { p.x += speed * dt; if (p.x - 30 > ZONE[1]) { p.gone = 'miss'; st.err++; st.shout = '漏了一个！'; st.shoutT = 1.4; } } else if (p.fly != null) { const dur = 0.45 + p.kg * 0.02; p.fly += dt / dur * 0.6; if (p.fly >= 0.6 && !p.landed) { p.landed = true; st.shake = Math.max(st.shake, 0.08 + p.kg / 25 * 0.25); SFX.thud(p.kg / 25); } } });
        st.pk = st.pk.filter(p => !p.gone || (p.fly != null && p.fly < 0.6) || (p.gone === 'bad' && (p.fade = (p.fade || 0) + dt) < .5));
        st.fatigue = Math.min(100, st.fatigue + dt * 1.2);
        st.shoutT -= dt; st.shake = Math.max(0, st.shake - dt);
        // 画
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 14 * st.shake, (Math.random() - .5) * 10 * st.shake);
        cover(ctx, PR ? 'img/bg-job-print.jpg' : 'img/bg-job-courier.jpg', W, H, 0.45, '#4a4440');
        // 快件山
        ctx.fillStyle = '#b08a5a'; ctx.beginPath(); ctx.moveTo(0, 230); ctx.lineTo(80, 120); ctx.lineTo(170, 230); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();
        // 传送带
        rr(ctx, 0, 230, W, 60, 4, '#2f2f33'); for (let x = (st.t * speed) % 30; x < W; x += 30) { ctx.fillStyle = '#44444a'; ctx.fillRect(x, 232, 4, 56); }
        rr(ctx, ZONE[0], 222, ZONE[1] - ZONE[0], 76, 6, '#f2c14e33', '#f2c14e'); txt(ctx, '扫码区', ZONE[0] + 40, 216, 14, '#f2c14e');
        st.pk.forEach(p => {
          let y = 280 - p.h, x = p.x, rot = 0;
          // 抛物线：越重抛得越低、越慢，传送带上重件会压得轻微晃
          if (p.gone === 'ok') { const f = Math.min(1, p.fly / 0.6); const tx = 180 + p.code * 170; x = p.fx + (tx - p.fx) * f; const arc = (110 - p.kg * 3.2) * Math.sin(Math.PI * f); y = (280 - p.h) + (380 - (280 - p.h)) * f * f - arc; rot = f * (p.kg > 15 ? 0.3 : 1.4); }
          else if (!p.gone && p.kg > 15) rot = Math.sin(st.t * 9 + p.x * 0.05) * 0.03;
          ctx.globalAlpha = p.gone === 'bad' ? 0.5 : 1;
          ctx.save(); ctx.translate(x, y + p.h / 2); ctx.rotate(rot);
          rr(ctx, -p.w / 2, -p.h / 2, p.w, p.h, 3, p.kg > 15 ? '#a8824f' : '#c9a26b'); ctx.fillStyle = '#e9d9a8'; ctx.fillRect(-p.w / 2, -3, p.w, 6);
          ctx.fillStyle = BINS[p.code].c; ctx.fillRect(-24, -p.h / 2 + 4, 48, 34); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(-24, -p.h / 2 + 4, 48, 34); ctx.font = `900 32px ${FONT}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#111'; ctx.strokeText(String(p.code + 1), 0, -p.h / 2 + 33); ctx.fillStyle = '#fff'; ctx.fillText(String(p.code + 1), 0, -p.h / 2 + 33);
          txt(ctx, p.kg + 'kg', 0, p.h / 2 - 5, 12, p.kg > 15 ? '#7a1a10' : INK, 'center');
          ctx.restore();
          ctx.globalAlpha = 1;
        });
        // 格子
        BINS.forEach((b, i) => { rr(ctx, 120 + i * 170, 370, 120, 80, 6, b.c + 'cc'); txt(ctx, `${i + 1} ${b.n}`, 180 + i * 170, 418, 20, '#fff', 'center'); });
        // 监工
        person(ctx, 820, 210, 1.1, '#c0392b', '#d39c72', st.shoutT > 0);
        txt(ctx, '线长', 800, 226, 13, '#f3ead8');
        if (st.shoutT > 0 && st.shout) bubble(ctx, st.shout, 560, 100, true);
        if (st.burst) bubble(ctx, '调你去那边！干不完不准下班！', 200, 60, false);
        meter(ctx, 20, 30, 220, `工时  ${clockStr(PR ? 8 : 7, prog, 12)}`, prog, '#f2c14e');
        meter(ctx, 20, 70, 220, `疲劳 ${Math.round(st.fatigue)}`, st.fatigue / 100, st.fatigue > 75 ? '#d64a3a' : '#e39a4a');
        txt(ctx, `分对 ${st.ok}   出错 ${st.err}/10`, 20, 112, 16, '#f3ead8');
        if ((perf.win || 1) < 0.85) txt(ctx, '手没劲，扫码区变窄了', ZONE[0] - 10, 200, 13, '#ff9a8a');
        ctx.restore();
        if (st.err >= 10) { finish({ completed: false, fired: true, hoursDone: prog * 12, quality: 0 }); bubble(ctx, '你别干了，滚！一分钱没有！', 300, 160, true); return false; }
        if (st.t >= DUR) { const q = st.ok / Math.max(1, st.ok + st.err); finish({ completed: true, quality: q, mentalMult: 1 + st.err * 0.03 }); bubble(ctx, '下班！排队领钱！', 340, 160); return false; }
      });
    });
  };

  // ---------------- 临时安保 ----------------
  MG.guard = function (root, o) {
    return new Promise(resolve => {
      const { ctx, bar } = setup(root, '临时安保 · 站岗 07:00–19:00', '外卖车开到岗亭前时按 <kbd>空格</kbd> 拦下；无聊了可以 <kbd>P</kbd> 玩手机，但查岗的来了要赶紧收起来');
      bar.innerHTML = `<button class="mg-btn" id="mg-stop">拦下（空格）</button><button class="mg-btn" id="mg-phone">掏出手机（P）</button>`;
      const DUR = o.dur || 40; const perf = o.perf || { win: 1, shake: 0.6 };
      const gateW = 100 * Math.max(0.7, perf.win); const drowsy = (perf.win || 1) < 0.9;
      const st = MG.cur = { type: 'guard', blink: 0, nextBlink: 4, t: 0, bored: 20, boredSum: 0, phone: false, cars: [], nextCar: 1, checks: [0.3 + Math.random() * 0.15, 0.62 + Math.random() * 0.2], check: null, fines: 0, blocked: 0, missed: 0, caughtPhone: 0, msg: null, msgT: 0, done: false };
      ['guard-bg.jpg', 'ebike.png', 'sedan.png', 'guard-idle.png', 'guard-phone.png'].forEach(n => IMG('img/mg/' + n));
      const gateX = 380; st.buf = 0; st.flash = null; st.banner = null; st.pulse = 0;
      // v1.0 强反馈：闪屏 + 震屏 + 音效 + 大字条
      const fb = (kind, text, sub) => {
        const cv = ctx.canvas; const col = kind === 'bad' ? '220,40,30' : kind === 'good' ? '60,200,110' : '240,190,70';
        st.flash = { t: 0, d: kind === 'bad' ? 0.7 : 0.35, col }; if (text) st.banner = { t: 0, d: kind === 'bad' ? 2.4 : 1.1, text, sub: sub || '', bad: kind === 'bad' };
        if (kind === 'bad') { cv.classList.remove('mg-shake'); void cv.offsetWidth; cv.classList.add('mg-shake'); setTimeout(() => cv.classList.remove('mg-shake'), 650); try { navigator.vibrate && navigator.vibrate([90, 50, 140]); } catch (e) { } if (window.FX) FX.sfx.play('siren'); if (window.Music) Music.stinger('caught'); }
        else if (kind === 'good') { if (window.FX) FX.sfx.play('ding'); } else if (window.FX) FX.sfx.play('buzz');
      };
      const inZone = c => !c.done && Math.abs(c.x - gateX) < gateW;
      const stopCar = () => { if (st.phone) { st.msg = '手机还在手上呢！先收起来！'; st.msgT = 1.2; fb('warn'); return; } const c = st.cars.find(inZone); if (c) { c.done = 'stop'; st.blocked++; st.msg = '“这儿不让进，绕一下。”'; st.msgT = 1.2; st.pole = 0.0001; st.buf = 0; fb('good', '拦住了！'); } else { st.buf = 0.35; st.msg = '这会儿没车到线上——车进了绿色区再按'; st.msgT = 1; if (window.FX) FX.sfx.play('buzz'); } };
      const togglePhone = () => { st.phone = !st.phone; bar.querySelector('#mg-phone').textContent = st.phone ? '收起手机（P）' : '掏出手机（P）'; };
      st.stopCar = stopCar; st.togglePhone = togglePhone; st.fb = fb; st.inZone = inZone; st.gateW = gateW;
      const offK = keys(e => { if (e.code === 'Space') { stopCar(); return true; } if (e.key === 'p' || e.key === 'P') { togglePhone(); return true; } });
      bar.querySelector('#mg-stop').onclick = stopCar; bar.querySelector('#mg-phone').onclick = togglePhone;
      const finish = res => { if (st.done) return; st.done = true; offK(); stop(); setTimeout(() => resolve(res), 900); };
      st.quit = () => finish({ completed:false, quit:true, hoursDone:Math.min(1, st.t / DUR) * 12, quality:0 });
      const stop = loop(dt => {
        st.t += dt; const prog = st.t / DUR;
        st.bored = Math.max(0, Math.min(100, st.bored + (st.phone ? -7 : 3) * dt)); st.boredSum += st.bored * dt;
        st.nextCar -= dt; if (st.nextCar <= 0) { st.cars.push({ x: -90, done: null, v: 125 + Math.random() * 40 }); st.nextCar = 3 + Math.random() * 3.5; }
        st.pulse += dt; if (st.buf > 0) { st.buf -= dt; const cb = st.cars.find(inZone); if (cb && !st.phone) { st.buf = 0; stopCar(); } }
        st.cars.forEach(c => { if (c.done === 'stop') c.x -= 180 * dt; else c.x += (c.v || 170) * dt; if (!c.done && c.x > gateX + gateW) { c.done = 'miss'; st.missed++; st.fines += 10; st.msg = '漏过去一辆！扣10块！'; st.msgT = 1.4; fb('bad', '漏车了！', '-¥10 · 下次早点按空格'); } });
        st.cars = st.cars.filter(c => c.x > -140 && c.x < W + 160);
        if (st.checks.length && prog > st.checks[0] && !st.check) { st.check = { t: 0 }; st.checks.shift(); }
        if (st.check) { st.check.t += dt; if (st.check.t > 1.8 && !st.check.hit) { st.check.hit = true; if (st.phone) { st.caughtPhone++; st.fines += 30; st.msg = '查岗的：“站岗玩手机？扣三十！”'; st.msgT = 2; fb('bad', '被抓到玩手机！', '-¥30 · 查岗的记下了你的工号'); } else { st.msg = '查岗的点点头，开走了。'; st.msgT = 1.5; } } if (st.check.t > 3.2) st.check = null; }
        st.msgT -= dt;
        if (st.pole) { st.pole += dt; if (st.pole > 1.3) st.pole = 0; }
        const bgI = IMG('img/mg/guard-bg.jpg'); if (bgI) ctx.drawImage(bgI, 0, H - W * 9 / 16, W, W * 9 / 16); else { ctx.fillStyle = '#b7c3cf'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#5f5d5b'; ctx.fillRect(0, 395, W, 75); }
        // 拦车区：路面上一条看得见的绿色带，车进来就亮 + 提示按空格
        { const anyIn = st.cars.some(inZone); const pu = 0.5 + 0.5 * Math.sin(st.pulse * 6); ctx.save(); ctx.fillStyle = anyIn ? `rgba(70,210,120,${0.30 + pu * 0.22})` : 'rgba(255,230,150,0.13)'; ctx.fillRect(gateX - gateW, 372, gateW * 2, 100); ctx.strokeStyle = anyIn ? 'rgba(120,255,170,.95)' : 'rgba(255,240,190,.5)'; ctx.setLineDash([8, 6]); ctx.lineWidth = anyIn ? 3 : 2; ctx.strokeRect(gateX - gateW, 372, gateW * 2, 100); ctx.setLineDash([]);
          if (anyIn && !st.phone) { ctx.font = '800 26px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,40,20,.85)'; ctx.strokeText('现在！按空格', gateX, 355 - pu * 4); ctx.fillStyle = '#c8ffd9'; ctx.fillText('现在！按空格', gateX, 355 - pu * 4); }
          else { ctx.font = '700 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,245,215,.8)'; ctx.fillText('拦车区（车进来再按）', gateX, 366); } ctx.restore(); }
        // 路过的外卖电动车（Q 版贴图）
        const eb = IMG('img/mg/ebike.png');
        st.cars.forEach(c => { const bob = Math.sin(st.t * 14 + c.x * .05) * 1.2; const wob = c.done === 'stop' ? -0.06 : 0; if (eb) { const h = 118, w = h * eb.width / eb.height; ctx.save(); ctx.translate(c.x, 455 + bob); ctx.rotate(wob); if (c.done === 'stop') ctx.scale(-1, 1); ctx.drawImage(eb, -w / 2, -h, w, h); ctx.restore(); } else { rr(ctx, c.x - 30, 420, 60, 30, 8, '#f2c14e'); } });
        // 站岗的人：发呆时站直，玩手机时低头，无聊值高会晃
        const gi = IMG(st.phone ? 'img/mg/guard-phone.png' : 'img/mg/guard-idle.png');
        const sway = Math.sin(st.t * 1.6) * (st.bored > 70 ? 3.5 : 1.2);
        if (gi) { const h = 158, w = h * gi.width / gi.height; ctx.save(); ctx.translate(gateX, 412); ctx.rotate(sway * 0.012); ctx.scale(1, 1 + Math.sin(st.t * 2) * 0.006); ctx.fillStyle = 'rgba(20,15,10,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 7, 0, 0, 7); ctx.fill(); ctx.drawImage(gi, -w / 2, -h, w, h); ctx.restore(); }
        if (st.bored > 70 && !st.phone) { txt(ctx, '…哈欠', gateX + 18, 250, 15, '#fff6e0'); }
        // 拦车：红白杆横在路上
        if (st.pole) { const k = Math.min(1, st.pole / 0.25), a = (-Math.PI / 2) * (1 - k); ctx.save(); ctx.translate(gateX - 20, 398); ctx.scale(-1, 1); ctx.rotate(a); ctx.lineCap = 'butt'; for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f6f1e6' : '#c8372d'; ctx.fillRect(i * 26, -5, 26, 10); } ctx.strokeStyle = '#3b2a22'; ctx.lineWidth = 2; ctx.strokeRect(0, -5, 156, 10); ctx.restore(); }
        if (st.check) { const cx = W + 60 - st.check.t * 280; const sd = IMG('img/mg/sedan.png'); if (sd) { const w = 210, h = w * sd.height / sd.width; ctx.save(); ctx.translate(cx, 470); ctx.scale(-1, 1); ctx.drawImage(sd, -w / 2, -h, w, h); ctx.restore(); } else rr(ctx, cx - 50, 430, 110, 40, 10, '#f5f5f5'); if (st.check.t < 1.8) bubble(ctx, '远处开来一辆白色轿车……', 540, 250, true); }
        ctx.fillStyle = 'rgba(18,14,10,.55)'; ctx.beginPath(); ctx.roundRect(10, 6, 256, 118, 12); ctx.fill();
        meter(ctx, 20, 30, 220, `工时  ${clockStr(7, prog, 12)}`, prog, '#f2c14e');
        meter(ctx, 20, 70, 220, `无聊 ${Math.round(st.bored)}`, st.bored / 100, st.bored > 70 ? '#d64a3a' : '#7aa0c0');
        txt(ctx, `拦下 ${st.blocked}  漏掉 ${st.missed}  扣钱 ${st.fines}`, 20, 108, 15, '#fff6e0');
        if (st.msgT > 0 && st.msg) bubble(ctx, st.msg, 300, 120, /扣/.test(st.msg));
        // 困：眼皮打架，视野一黑一黑
        if (drowsy) { st.nextBlink -= dt; if (st.nextBlink <= 0) { st.blink = 0.9; st.nextBlink = 3 + Math.random() * 4 * perf.win; } }
        if (st.blink > 0) { st.blink -= dt; const k = Math.sin(Math.min(1, st.blink / 0.9) * Math.PI); ctx.fillStyle = '#0b0a0c'; ctx.fillRect(0, 0, W, H * 0.5 * k); ctx.fillRect(0, H - H * 0.5 * k, W, H * 0.5 * k); }
        if (drowsy) txt(ctx, '困得眼皮打架……', W - 20, 30, 15, '#b33a2e', 'right');
        if (st.flash) { st.flash.t += dt; const k = 1 - st.flash.t / st.flash.d; if (k <= 0) st.flash = null; else { ctx.fillStyle = `rgba(${st.flash.col},${(0.55 * k).toFixed(3)})`; ctx.fillRect(0, 0, W, H); if (st.flash.col === '220,40,30') { const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); gr.addColorStop(0, 'rgba(200,0,0,0)'); gr.addColorStop(1, `rgba(200,0,0,${(0.8 * k).toFixed(3)})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); } } }
        if (st.banner) { const b = st.banner; b.t += dt; if (b.t > b.d) st.banner = null; else { const pop = Math.min(1, b.t / 0.18), fade = Math.min(1, (b.d - b.t) / 0.4); ctx.save(); ctx.globalAlpha = fade; ctx.translate(W / 2, H * 0.4); ctx.scale(0.7 + 0.3 * pop + (b.bad ? 0.12 * Math.sin(b.t * 30) * (1 - pop) : 0), 0.7 + 0.3 * pop); rr(ctx, -250, -50, 500, b.sub ? 108 : 78, 16, b.bad ? 'rgba(150,20,16,.92)' : 'rgba(30,110,60,.9)'); ctx.textAlign = 'center'; ctx.font = '900 40px sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(b.text, 0, 8); if (b.sub) { ctx.font = '600 20px sans-serif'; ctx.fillStyle = '#ffe3b0'; ctx.fillText(b.sub, 0, 46); } ctx.restore(); } }
        if (st.t >= DUR) { finish({ completed: true, fines: st.fines, quality: Math.max(0.2, 1 - st.missed * 0.08 - st.caughtPhone * 0.15), mentalMult: 0.5 + (st.boredSum / DUR) / 100 }); bubble(ctx, '收队！上车回酒仙桥！', 330, 170); return false; }
      });
    });
  };

  // ---------------- 食品厂：换装 → 洗手 → 切五花培根（v0.6 重做：真的在切肉） ----------------
  // 手感：一块带肥瘦纹理的五花肉放在木案板上；刀跟着鼠标走，按住往下拖就是一刀。
  // 每一刀切下的肉片都是真实形状（刀走歪了就是斜的、薄厚不均、边缘毛糙），片片厚薄一致才算好。
  function makeSlab(w, h) {
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2);
    const R = Math.random;
    // 层：肉皮、肥、瘦、肥、瘦、肥、瘦
    const spec = [['rind', 0.05], ['fat', 0.15], ['lean', 0.19], ['fat', 0.11], ['lean', 0.21], ['fat', 0.09], ['lean', 0.20]];
    const ph = spec.map(() => [R() * 6, R() * 6, 0.6 + R() * 1.4]);
    const bnd = []; let acc = 0;
    for (let li = 0; li <= spec.length; li++) {
      const pts = [];
      for (let x = 0; x <= w; x += 4) {
        let y = acc * h;
        if (li > 0 && li < spec.length) { const q = ph[li]; y += Math.sin(x * 0.021 + q[0]) * 3.2 * q[2] + Math.sin(x * 0.067 + q[1]) * 1.4 * q[2]; }
        pts.push([x, y]);
      }
      bnd.push(pts); if (li < spec.length) acc += spec[li][1];
    }
    bnd[spec.length] = bnd[spec.length].map(([x]) => [x, h]);
    const col = { rind: ['#d9a35f', '#c58a47'], fat: ['#fbf1e4', '#efdcc6'], lean: ['#c4465a', '#a8344a'] };
    spec.forEach(([t], li) => {
      const top = bnd[li], bot = bnd[li + 1];
      g.beginPath(); top.forEach(([x, y], n) => n ? g.lineTo(x, y) : g.moveTo(x, y)); for (let n = bot.length - 1; n >= 0; n--) g.lineTo(bot[n][0], bot[n][1]); g.closePath();
      const y0 = top[0][1], y1 = bot[0][1] + 0.01; const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, col[t][0]); gr.addColorStop(1, col[t][1]); g.fillStyle = gr; g.fill();
      g.save(); g.clip();
      if (t === 'lean') { // 肌肉纤维 + 雪花
        for (let n = 0; n < w / 3; n++) { g.strokeStyle = `rgba(90,15,30,${0.08 + R() * 0.1})`; g.lineWidth = 0.7; const x = R() * w, y = y0 + R() * (y1 - y0); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + R() * 10, y + (R() - .5) * 2); g.stroke(); }
        for (let n = 0; n < w / 14; n++) { g.strokeStyle = `rgba(255,240,230,${0.35 + R() * 0.35})`; g.lineWidth = 0.6 + R() * 1.4; const x = R() * w, y = y0 + R() * (y1 - y0); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4 + R() * 6, y + (R() - .5) * 5, x + 8 + R() * 12, y + (R() - .5) * 4); g.stroke(); }
      } else if (t === 'fat') {
        for (let n = 0; n < w / 10; n++) { g.fillStyle = `rgba(230,170,160,${0.10 + R() * 0.15})`; g.beginPath(); g.ellipse(R() * w, y0 + R() * (y1 - y0), 3 + R() * 8, 0.8 + R() * 1.5, 0, 0, 7); g.fill(); }
      } else { for (let n = 0; n < w / 6; n++) { g.fillStyle = `rgba(110,60,20,${0.15 + R() * 0.2})`; g.fillRect(R() * w, y0 + R() * (y1 - y0), 1, 1); } }
      g.restore();
    });
    // 湿润的光泽
    const gl = g.createLinearGradient(0, 0, 0, h); gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(.25, 'rgba(255,255,255,0)'); gl.addColorStop(.85, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(60,0,10,.18)'); g.fillStyle = gl; g.fillRect(0, 0, w, h);
    return c;
  }
  function makeBoard(w, h) {
    const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; const g = c.getContext('2d'); g.scale(2, 2);
    g.fillStyle = '#c99a63'; g.fillRect(0, 0, w, h);
    for (let n = 0; n < 70; n++) { g.strokeStyle = `rgba(110,70,30,${0.08 + Math.random() * 0.14})`; g.lineWidth = 0.6 + Math.random() * 1.6; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 30) g.lineTo(x, y + Math.sin(x * 0.01 + n) * 3); g.stroke(); }
    for (let n = 0; n < 40; n++) { g.strokeStyle = 'rgba(80,50,20,.18)'; g.lineWidth = 0.7; const x = Math.random() * w, y = Math.random() * h * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 6, y + 8 + Math.random() * 14); g.stroke(); } // 旧刀痕
    return c;
  }
  // 音效：刀落在案板上的闷响、肉片拍在案板上
  const SFX = {
    ctx: null,
    ac() { if (window.Music && Music.muted) return null; if (this.ctx) return this.ctx; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { this.ctx = (window.Music && Music.ctx) || new AC(); } catch (e) { return null; } return this.ctx; },
    noise(a, dur, freq, gain, type) { const c = this.ac(); if (!c) return; const n = Math.floor(c.sampleRate * dur); const b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2); const s = c.createBufferSource(); s.buffer = b; const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; const g = c.createGain(); g.gain.value = gain; s.connect(f); f.connect(g); g.connect(c.destination); s.start(c.currentTime + (a || 0)); },
    tone(f0, f1, dur, gain) { const c = this.ac(); if (!c) return; const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(f0, c.currentTime); o.frequency.exponentialRampToValueAtTime(f1, c.currentTime + dur); g.gain.setValueAtTime(gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur); },
    chop(power) { this.noise(0, 0.07, 1100, 0.5 * power); this.tone(140, 55, 0.16, 0.5 * power); },
    squish() { this.noise(0, 0.12, 500, 0.12, 'bandpass'); },
    slap() { this.noise(0.02, 0.06, 380, 0.25, 'bandpass'); },
    thud(w) { this.tone(90, 40, 0.18 + w * 0.12, 0.25 + w * 0.45); this.noise(0, 0.09, 600, 0.2 + w * 0.3); }
  };
  MG.sfx = SFX;

  MG.food = function (root, o) {
    return new Promise(resolve => {
      const perf = o.perf || { shake: 0.6, win: 1, speed: 1, notes: [], lv: o.knife || 0 };
      const { cv, ctx, bar } = setup(root, '食品厂夜班 · 19:00–06:00', '先按顺序换装、洗手（按住 15 秒，游戏里 2.5 秒）。然后切五花培根：<b>鼠标移到肉上，按住往下拖</b>切一刀（或按 <kbd>空格</kbd> 直着落刀）。每片厚薄要一样——看虚线。别切太快！');
      const ORDER = ['换拖鞋', '换胶靴', '穿防尘服', '戴帽子口罩', '洗手消毒', '戴手套围裙'];
      // 案板和肉的位置
      const BX = 70, BY = 300, BW = 720, BH = 44;
      const SL = 110, TOPY = 196, BOTY = 300, SW = 470;
      const TGT = 24;                              // 标准厚度（像素，约 8 毫米）
      const TOL = TGT * 0.32 * perf.win;           // 合格范围：越累越窄，刀工越高越宽
      const st = MG.cur = { type: 'food', phase: 'dress', idx: 0, fines: 0, hint: 4, wash: 0, washing: false, t: 0, msg: null, msgT: 0, done: false, order: ORDER,
        slices: [], pile: [], scores: [], good: 0, ragged: 0, bad: 0, fast: 0, last: -9, slabs: 1, shake: 0, mx: 520, my: 150, drag: null, autoCut: null, kx: 520, ky: 150,
        T: TGT, tol: TOL, perf, suds: [] };
      let slabImg = makeSlab(SW, BOTY - TOPY); const boardImg = makeBoard(BW + 40, 130);
      // 当前肉块右边的切面（自上而下 13 个点）
      const ROWS = 13; const rowY = n => TOPY + (BOTY - TOPY) * n / (ROWS - 1);
      const straight = x => Array.from({ length: ROWS }, () => x);
      st.edge = straight(SL + SW); st.slabL = SL; st.slabX = 0; // slabX：新肉块滑进来的动画
      st.edgeX = () => st.edge.reduce((a, b) => a + b, 0) / ROWS;
      const cards = ORDER.map((n, i) => ({ n, i })).sort(() => Math.random() - 0.5);
      const drawBar = () => {
        if (st.phase === 'dress') bar.innerHTML = cards.map(c => `<button class="mg-btn dress${c.i < st.idx ? ' used' : ''}" data-i="${c.i}" ${c.i < st.idx ? 'disabled' : ''}>${c.n}</button>`).join('');
        else if (st.phase === 'wash') bar.innerHTML = `<button class="mg-btn" id="mg-wash">按住洗手（或按住空格）</button>`;
        else bar.innerHTML = `<button class="mg-btn" id="mg-cut">直着落一刀（空格）</button><span class="mg-note">标准厚度：虚线 · 合格 ±${Math.round(TOL / TGT * 8 * 10) / 10} 毫米 · ${perf.notes.map(n => n.t).join(' · ')}</span>`;
        bar.querySelectorAll('.dress').forEach(b => b.onclick = () => dress(+b.dataset.i));
        const w = bar.querySelector('#mg-wash'); if (w) { w.onpointerdown = () => st.washing = true; w.onpointerup = w.onpointerleave = () => washUp(); }
        const c = bar.querySelector('#mg-cut'); if (c) c.onclick = () => chopStraight();
      };
      const dress = i => { if (st.phase !== 'dress') return; if (i === st.idx) { st.idx++; if (ORDER[st.idx] === '洗手消毒') { st.phase = 'wash'; } } else { st.fines += 10; st.msg = '监工：“顺序错了！罚十块！”'; st.msgT = 1.6; } drawBar(); };
      const washUp = () => { if (!st.washing) return; st.washing = false; if (st.phase === 'wash' && st.wash < 2.5) { st.wash = 0; st.msg = '“摄像头盯着呢，不够十五秒重洗！”'; st.msgT = 1.6; } };

      // ---- 切 ----
      const jitter = () => perf.shake * 0.6 * (Math.sin(st.t * 13.1) * 0.6 + Math.sin(st.t * 7.7 + 1) * 0.5 + (Math.random() - .5) * 0.5);
      // path：自上而下 ROWS 个刀口 x
      const commitCut = (path) => {
        const edge = st.edge;
        if (path.every((x, n) => x >= edge[n] - 2)) { st.msg = '刀落在案板上了，没切到肉。'; st.msgT = 1; SFX.chop(0.5); st.shake = 0.12; return; }
        const now = st.t; const tooFast = now - st.last < 0.7; st.last = now;
        const th = path.map((x, n) => edge[n] - x);
        const minT = Math.min(...th), maxT = Math.max(...th), avg = th.reduce((a, b) => a + b, 0) / ROWS;
        let score, kind;
        if (minT < 5) { score = 0; kind = 'shred'; }
        else { const err = Math.abs(avg - TGT) / TOL, uneven = (maxT - minT) / TOL; score = Math.max(0, Math.min(1, 1 - 0.55 * Math.max(0, err - 0.15) - 0.45 * Math.max(0, uneven - 0.2))); kind = score >= 0.75 ? 'good' : score >= 0.4 ? 'ragged' : 'bad'; }
        if (tooFast) { st.fast++; score *= 0.6; st.msg = '李大姐：“慢点慢点，培根要化了！”'; st.msgT = 1.3; if (kind === 'good') kind = 'ragged'; }
        // 毛边：越差越毛
        const rag = kind === 'good' ? 0.4 : kind === 'ragged' ? 2.2 : 4;
        const L = path.map((x, n) => Math.min(x, edge[n] - 1)); const Rr = edge.slice();
        const jag = Array.from({ length: ROWS * 2 }, () => (Math.random() - .5) * rag);
        const sl = { L, R: Rr, jag, score, kind, thick: avg, t: 0, x0: 0, y0: 0, rot: 0, fromX: Math.min(...L) };
        st.slices.push(sl); st.scores.push(score);
        if (kind === 'good') st.good++; else if (kind === 'ragged') st.ragged++; else st.bad++;
        st.edge = L.slice();
        st.shake = 0.18 + Math.min(0.2, avg / 120); SFX.chop(0.9); setTimeout(() => SFX.slap(), 160);
        if (!tooFast) { st.msg = kind === 'good' ? pick(['这片匀！', '漂亮，薄厚正好。', '李大姐点点头。']) : kind === 'ragged' ? pick(['有点歪，边上毛了。', '一头厚一头薄。', '厚了点……']) : kind === 'shred' ? '切碎了，成肉渣了！' : pick(['这片切废了。', '太厚了，像块砖。', '切得跟狗啃的似的。']); st.msgT = 0.9; }
        // 剩下的肉不够一片：培根头扔掉，换一块新的
        if (Math.max(...st.edge) - SL < TGT * 1.3) { st.slabs++; st.edge = straight(SL + SW); st.slabX = -SW - 60; slabImg = makeSlab(SW, BOTY - TOPY); st.msg = '培根头扔进边角料桶，换一块新的。'; st.msgT = 1.2; }
      };
      const chopStraight = (xOpt) => {
        if (st.phase !== 'cut' || st.drag || st.autoCut || st.done) return;
        const x = xOpt != null ? xOpt : st.kx;
        const path = Array.from({ length: ROWS }, (_, n) => x + jitter() * (0.6 + n / ROWS) + (Math.random() - .5) * perf.shake);
        st.autoCut = { path, p: 0 };
      };
      st.chopAt = x => chopStraight(x);       // 测试 / 键盘用
      st.cut = () => chopStraight();
      st.dress = dress; st.washDown = () => st.washing = true; st.washUp = washUp;
      const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; };
      cv.onpointermove = e => { [st.mx, st.my] = pos(e); if (st.drag) { st.drag.pts.push([st.kx + jitter(), st.my]); if (Math.random() < 0.12) SFX.squish(); if (st.my >= BOTY) { finishDrag(); } } };
      cv.onpointerdown = e => { if (st.phase !== 'cut' || st.autoCut) return; [st.mx, st.my] = pos(e); st.drag = { pts: [[st.kx, Math.max(st.my, TOPY - 5)]], x0: st.kx, y0: st.my }; };
      const finishDrag = () => {
        const d = st.drag; st.drag = null; if (!d) return;
        const pts = d.pts; const reached = pts[pts.length - 1][1] >= BOTY - 4;
        if (!reached) {
          const moved = Math.hypot(pts[pts.length - 1][0] - d.x0, pts[pts.length - 1][1] - d.y0);
          if (moved < 14) return chopStraight(d.x0);
          st.msg = '没切到底，肉还连着。再来一刀。'; st.msgT = 1; return;
        }
        // 把拖动轨迹重采样成 ROWS 行
        const path = []; for (let n = 0; n < ROWS; n++) { const y = rowY(n); let best = pts[0]; for (const p of pts) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p; path.push(best[0]); }
        commitCut(path);
      };
      const upM = () => { if (st.drag) finishDrag(); }; window.addEventListener('pointerup', upM);
      const offK = keys(e => { if (e.code === 'Space') { if (st.phase === 'wash') { if (!e.repeat) st.washing = true; } else if (!e.repeat) chopStraight(); return true; } });
      const upK = e => { if (e.code === 'Space') washUp(); }; window.addEventListener('keyup', upK);
      drawBar();
      const DUR = o.dur || 30;
      const finish = res => { if (st.done) return; st.done = true; offK(); window.removeEventListener('keyup', upK); window.removeEventListener('pointerup', upM); stop(); setTimeout(() => resolve(res), 1200); };
      st.quit = () => finish({ completed:false, quit:true, hoursDone:(st.phase === 'cut' ? Math.min(1, st.t / DUR) : 0) * 11, quality:0 });
      const drawSlicePoly = (g, sl, ox, oy) => {
        g.beginPath();
        for (let n = 0; n < ROWS; n++) g.lineTo(sl.L[n] - sl.fromX + ox + sl.jag[n], rowY(n) - TOPY + oy);
        for (let n = ROWS - 1; n >= 0; n--) g.lineTo(sl.R[n] - sl.fromX + ox + sl.jag[ROWS + n] * 0.3, rowY(n) - TOPY + oy);
        g.closePath();
      };
      const stop = loop(dt => {
        st.msgT -= dt; st.hint -= dt;
        if (st.phase === 'dress' || st.phase === 'wash') {
          cover(ctx, 'img/bg-job-food.jpg', W, H, 0.5, '#e8eef0');
          txt(ctx, st.phase === 'dress' ? '更衣间：按顺序点下面的卡片' : '洗手消毒：按住不放，至少十五秒', 40, 50, 22, '#f3ead8');
          if (st.hint > 0 || st.fines >= 20) txt(ctx, '李大姐小声说：拖鞋 → 胶靴 → 防尘服 → 帽子口罩 → 洗手 → 手套围裙', 40, 86, 16, '#ffb3c0');
          ORDER.forEach((n, i) => { rr(ctx, 40 + i * 140, 130, 120, 70, 8, i < st.idx ? '#9fd3a8' : '#fff'); txt(ctx, i < st.idx ? n : '？', 100 + i * 140, 172, 16, INK, 'center'); });
          person(ctx, 450, 430, 1.5, st.idx >= 3 ? '#f2b8c6' : (o.shirt || '#4f7fa8'), o.skin, false);
          if (st.phase === 'wash') {
            if (st.washing) { st.wash += dt; if (Math.random() < 0.6) st.suds.push({ x: 450 + (Math.random() - .5) * 70, y: 330 + (Math.random() - .5) * 20, r: 3 + Math.random() * 7, v: -10 - Math.random() * 25, life: 1.4 }); }
            // 水龙头、水流、泡沫
            rr(ctx, 430, 250, 40, 14, 4, '#c8d2d8'); ctx.fillStyle = st.washing ? 'rgba(120,180,230,.6)' : 'rgba(120,180,230,.0)'; ctx.fillRect(444, 264, 12, 60);
            ctx.fillStyle = o.skin || '#e0b090'; ctx.beginPath(); ctx.ellipse(430 + Math.sin(st.t * 18) * (st.washing ? 6 : 0), 335, 26, 14, 0.3, 0, 7); ctx.ellipse(470 - Math.sin(st.t * 18) * (st.washing ? 6 : 0), 335, 26, 14, -0.3, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
            st.suds.forEach(b => { b.y += b.v * dt; b.life -= dt; ctx.globalAlpha = Math.max(0, b.life / 1.4); ctx.fillStyle = '#ffffffdd'; ctx.strokeStyle = '#9ab'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.stroke(); }); ctx.globalAlpha = 1;
            st.suds = st.suds.filter(b => b.life > 0);
            st.t += dt;
            meter(ctx, 300, 390, 300, `洗手 ${Math.min(15, Math.floor(st.wash / 2.5 * 15))} 秒 / 15 秒`, st.wash / 2.5, '#58a6d6', INK);
            if (st.wash >= 2.5) { st.washing = false; st.idx = 5; st.phase = 'dress'; drawBar(); }
          }
          if (st.idx >= ORDER.length) { st.phase = 'cut'; st.t = 0; drawBar(); }
        } else {
          st.t += dt; const prog = st.t / DUR;
          // 刀跟着鼠标，但手会抖
          const targetX = Math.max(SL - 30, Math.min(SL + SW + 40, st.mx));
          st.kx += (targetX - st.kx) * Math.min(1, dt * 18); const kxShow = st.kx + jitter();
          if (st.autoCut) { st.autoCut.p += dt * 5.5 / (perf.speed || 1); if (st.autoCut.p >= 1) { const pth = st.autoCut.path; st.autoCut = null; commitCut(pth); } }
          const ky = st.autoCut ? TOPY - 30 + (BOTY - TOPY + 30) * st.autoCut.p : st.drag ? Math.max(TOPY - 30, Math.min(BOTY, st.my)) : Math.min(TOPY - 30, st.my);
          if (st.slabX < 0) st.slabX = Math.min(0, st.slabX + dt * 900);
          st.shake = Math.max(0, st.shake - dt);
          ctx.save();
          if (st.shake > 0) ctx.translate((Math.random() - .5) * 7 * st.shake / 0.2, (Math.random() - .5) * 5 * st.shake / 0.2);
          // 冷库车间背景
          ctx.fillStyle = '#dfe7ea'; ctx.fillRect(-10, -10, W + 20, H + 20); ctx.fillStyle = '#c9d5da'; for (let i = 0; i < W; i += 46) ctx.fillRect(i, 0, 1.5, 230);
          ctx.fillStyle = '#b9c6cc'; ctx.fillRect(-10, 230, W + 20, 6); ctx.fillStyle = '#e9eef0'; ctx.fillRect(-10, 236, W + 20, H);
          // 案板
          ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(BX + BW / 2, BY + BH + 50, BW / 2 + 20, 16, 0, 0, 7); ctx.fill();
          ctx.drawImage(boardImg, BX - 20, BY - 6, BW + 40, 130);
          ctx.fillStyle = '#a97a45'; ctx.fillRect(BX - 20, BY + 124 - 6, BW + 40, 16); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(BX - 20, BY - 6, BW + 40, 140);
          // 刀痕
          st.slices.forEach(sl => { ctx.strokeStyle = 'rgba(90,55,25,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sl.L[ROWS - 1], BOTY + 2); ctx.lineTo(sl.L[ROWS - 1] - 3, BOTY + 18); ctx.stroke(); });
          // 肉块（剩下的部分，右边是刀口）
          ctx.save(); ctx.translate(st.slabX, 0);
          ctx.beginPath(); ctx.moveTo(SL + 6, TOPY + 4); ctx.quadraticCurveTo(SL - 4, TOPY + 50, SL + 2, BOTY);
          for (let n = ROWS - 1; n >= 0; n--) ctx.lineTo(st.edge[n], rowY(n));
          ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(slabImg, SL, TOPY, SW, BOTY - TOPY);
          // 切面颜色更鲜（刚切开）
          ctx.fillStyle = 'rgba(255,90,110,.08)'; ctx.fillRect(st.edgeX() - 8, TOPY, 10, BOTY - TOPY);
          ctx.restore(); ctx.strokeStyle = '#6b2a2a'; ctx.lineWidth = 2; ctx.stroke();
          ctx.restore();
          // 下一刀的标准位置（虚线），刀工越好越清楚
          if (st.slabX === 0) {
            const gx = st.edgeX() - TGT; ctx.setLineDash([5, 5]); ctx.strokeStyle = `rgba(30,120,60,${0.35 + Math.min(0.5, (perf.lv || 0) * 0.12)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, TOPY - 16); ctx.lineTo(gx, BOTY); ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(80,180,110,.14)'; ctx.fillRect(gx - TOL, TOPY - 16, TOL * 2, 10); txt(ctx, '8mm', gx, TOPY - 22, 12, '#2e7d4a', 'center');
          }
          // 切下来的肉片：滑到右边、一片片叠着靠在一起
          st.slices.forEach((sl, idx) => {
            if (sl.done) return;
            sl.t = Math.min(1, sl.t + dt * 2.4);
            const slot = st.pile.length;
            if (sl.tx == null) { sl.tx = 620 + (slot % 14) * 11; sl.slot = slot; st.pile.push(sl); }
            const e = 1 - Math.pow(1 - sl.t, 3);
            const x = sl.fromX + (sl.tx - sl.fromX) * e, rot = 0.22 * e * (sl.kind === 'good' ? 1 : 1.5) + (sl.kind === 'shred' ? 0.4 * e : 0);
            ctx.save(); ctx.translate(x, TOPY + (sl.kind === 'shred' ? 30 * e : 0)); ctx.translate(0, BOTY - TOPY); ctx.rotate(rot); ctx.translate(0, -(BOTY - TOPY));
            drawSlicePoly(ctx, sl, 0, 0); ctx.save(); ctx.clip(); ctx.drawImage(slabImg, SL - sl.fromX, 0, SW, BOTY - TOPY); ctx.restore();
            ctx.strokeStyle = sl.kind === 'good' ? '#7a3030' : '#5a1f1f'; ctx.lineWidth = sl.kind === 'good' ? 1.4 : 2; ctx.stroke();
            if (sl.kind !== 'good') { ctx.fillStyle = '#f6e7d8'; for (let q = 0; q < (sl.kind === 'ragged' ? 3 : 7); q++) { ctx.beginPath(); ctx.arc(sl.L[0] - sl.fromX + sl.jag[q] * 2, 10 + q * 12, 1.5 + Math.abs(sl.jag[q + 2]), 0, 7); ctx.fill(); } }
            ctx.restore();
          });
          if (st.pile.length >= 14 && st.slices.every(sl => sl.t >= 1)) { st.slices.forEach(sl => sl.done = true); st.slices = []; st.pile = []; st.msg = '李大姐端走一盘：“下一盘！”'; st.msgT = 1.2; }
          // 刀
          const bladeTop = ky - 120;
          ctx.save(); ctx.translate(kxShow, 0);
          ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(4, bladeTop + 10, 8, 120);
          const bg = ctx.createLinearGradient(-9, 0, 9, 0); bg.addColorStop(0, '#9aa3aa'); bg.addColorStop(.5, '#eef2f4'); bg.addColorStop(1, '#8b949b');
          ctx.beginPath(); ctx.moveTo(-9, bladeTop); ctx.lineTo(7, bladeTop); ctx.lineTo(9, ky - 8); ctx.lineTo(0, ky); ctx.lineTo(-9, ky - 4); ctx.closePath(); ctx.fillStyle = bg; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
          rr(ctx, -7, bladeTop - 52, 14, 54, 4, '#3a2a20'); ctx.fillStyle = '#c9b08a'; ctx.beginPath(); ctx.arc(0, bladeTop - 40, 2, 0, 7); ctx.arc(0, bladeTop - 18, 2, 0, 7); ctx.fill();
          ctx.restore();
          // 拖动中：画出刀走过的路线
          if (st.drag && st.drag.pts.length > 1) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); st.drag.pts.forEach(([x, y], n) => { const yy = Math.max(TOPY, y); n ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); }); ctx.stroke(); }
          ctx.restore();
          // 李大姐、HUD
          person(ctx, 850, 250, 1.0, '#f2b8c6', '#ecbc97', st.fast > 2 && st.msgT > 0); txt(ctx, '李大姐', 828, 266, 13);
          meter(ctx, 30, 40, 220, `夜班  ${clockStr(19, prog, 11)}`, prog, '#f2c14e', INK);
          const avg = st.scores.length ? st.scores.reduce((a, b) => a + b, 0) / st.scores.length : 0;
          meter(ctx, 30, 80, 220, `厚薄均匀度 ${st.scores.length ? Math.round(avg * 100) + '%' : '—'}`, avg, avg > 0.7 ? '#4b9a5a' : avg > 0.45 ? '#e3b23c' : '#d64a3a', INK);
          txt(ctx, `好片 ${st.good}   毛边 ${st.ragged}   废片 ${st.bad}   太快 ${st.fast}`, 30, 122, 16);
          if (perf.shake > 3) txt(ctx, '手在抖……', 300, 60, 15, '#b33a2e');
          if (st.t >= DUR) {
            const n = st.scores.length; let q = n ? avg : 0;
            if (n < 10) q *= n / 10;   // 切太少：线长嫌慢
            finish({ completed: true, fines: st.fines, quality: q, mentalBonus: q > 0.7 ? 6 : 0, xpBonus: Math.round(st.good / 3), summary: `切了 ${n} 片：好片 ${st.good}、毛边 ${st.ragged}、废片 ${st.bad}${n < 10 ? '（切得太少，线长嫌慢）' : ''}。` });
            bubble(ctx, q > 0.7 ? '李大姐哈哈大笑：“今晚这盘真匀！”' : q > 0.45 ? '组长翻了翻：“凑合吧。”' : '组长皱眉：“这切的什么？扣钱！”', 300, 150, q <= 0.45); return false;
          }
        }
        if (st.msgT > 0 && st.msg) bubble(ctx, st.msg, 330, 140, /罚|重洗|化|废|碎|狗啃|砖|没切/.test(st.msg));
      });
    });
  };

  // ---------------- 抗原药厂 ----------------
  MG.antigen = function (root, o) {
    return new Promise(resolve => {
      const { ctx, bar } = setup(root, '药厂夜班 · 插条', '滑块走到右边绿色插口时按 <kbd>空格</kbd> 插进底壳；碰到中间红色区就是废条。车间里没有钟，手机被收走了。');
      bar.innerHTML = `<button class="mg-btn" id="mg-ins">插条（空格）</button><span id="mg-touch"></span><button class="mg-btn ghost" id="mg-quit">不干了，走人</button>`;
      const DUR = o.dur || 45;
      const perf = o.perf || { win: 1, shake: 0.6, speed: 1 };
      const GZ = Math.min(0.32, 0.18 * perf.win), G0 = 1 - GZ; // 绿色插口宽度
      const st = MG.cur = { type: 'antigen', g0: G0, t: 0, x: 0, dir: 1, made: 0, defect: 0, need: 0, press: 100, shoutT: 2.5, shout: null, shoutShow: 0, shake: 0, ev: null, evDone: false, done: false, phoneAsk: true };
      document.body.classList.add('noclock');
      const lines = ['快点！铁盘都摞到你这儿了！', '不许碰中间！一个条一百五！', '扣盖子结实点，再出错就开除！', '往中间推推，别偷懒！', '谁让你停下的？！'];
      const ins = () => {
        if (st.done || st.phoneAsk) return;
        if (st.xs > 0.42 && st.xs < 0.58) { st.defect++; st.shout = '碰中间了！废条！'; st.shoutShow = 1.6; st.shake = .4; st.press -= 6; }
        else if (st.xs > G0) { st.made++; st.x = 0; st.dir = 1; }
        else { st.shout = '插歪了，重来！'; st.shoutShow = .8; st.x = 0; st.dir = 1; }
      };
      st.ins = ins;
      const touch = (a) => { if (!st.ev || st.ev.ans) return; st.ev.ans = a; bar.querySelector('#mg-touch').innerHTML = ''; if (a === 'touch') { st.shout = '“摸兜了是吧？过来，搜身！”'; st.shoutShow = 2.2; st.press -= 15; st.pause = 1.8; } else { st.shout = '你一动不动。线长揪出了两个摸兜的人。'; st.shoutShow = 2; } };
      st.touch = touch;
      const offK = keys(e => { if (e.code === 'Space') { ins(); return true; } });
      bar.querySelector('#mg-ins').onclick = ins;
      const finish = res => { if (st.done) return; st.done = true; offK(); stop(); setTimeout(() => { document.body.classList.remove('noclock'); resolve(res); }, 1100); };
      bar.querySelector('#mg-quit').onclick = () => finish({ completed: false, quit: true, hoursDone: st.t / DUR * 12, quality: 0 });
      const stop = loop(dt => {
        if (st.phoneAsk) {
          cover(ctx, 'img/bg-job-antigen.jpg', W, H, 0.45, '#e9edf2'); person(ctx, 450, 400, 1.6, '#3b4a6b', '#d39c72', true);
          bubble(ctx, '手机、身份证都交上来！干完活再领！', 280, 120, true);
          if (!st.askBtn) { st.askBtn = true; const b = document.createElement('button'); b.className = 'mg-btn'; b.id = 'mg-hand'; b.textContent = '把手机交上去'; bar.prepend(b); b.onclick = () => { st.phoneAsk = false; b.remove(); }; }
          return;
        }
        if (st.pause > 0) { st.pause -= dt; }
        else st.t += dt;
        const prog = st.t / DUR;
        const spd = (0.85 + prog * 0.6) * (perf.speed || 1);
        if (!(st.pause > 0)) { st.x += st.dir * dt * spd; if (st.x > 1) { st.x = 1; st.dir = -1; } if (st.x < 0) { st.x = 0; st.dir = 1; } }
        st.xs = Math.max(0, Math.min(1, st.x + (perf.shake - 0.6) * 0.004 * Math.sin(st.t * 17)));
        st.need = prog * DUR * 0.62;
        const behind = st.need - st.made;
        st.shoutT -= dt * (behind > 3 ? 2 : 1);
        if (st.shoutT <= 0) { st.shout = lines[Math.floor(Math.random() * lines.length)]; st.shoutShow = 1.6; st.shoutT = 3 + Math.random() * 3; st.shake = .35; st.press -= 4 + Math.max(0, behind); }
        st.press = Math.max(0, st.press - dt * 0.6);
        st.shoutShow -= dt; st.shake -= dt;
        if (!st.evDone && prog > 0.4) { st.evDone = true; st.ev = { t: 0 }; bar.querySelector('#mg-touch').innerHTML = `<button class="mg-btn warn" id="mg-tch">下意识摸兜</button><button class="mg-btn" id="mg-still">不动</button>`; bar.querySelector('#mg-tch').onclick = () => touch('touch'); bar.querySelector('#mg-still').onclick = () => touch('still'); st.shout = '“谁的手机丢了？！”'; st.shoutShow = 2.5; }
        if (st.ev && !st.ev.ans) { st.ev.t += dt; if (st.ev.t > 2.6) touch('still'); }
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 8, (Math.random() - .5) * 6);
        ctx.fillStyle = '#dfe4ea'; ctx.fillRect(-10, -10, W + 20, H + 20); ctx.fillStyle = '#c9d0d8'; ctx.fillRect(0, 300, W, 80);
        for (let i = 0; i < 8; i++) person(ctx, 60 + i * 110, 300, .7, '#9fb6d3', '#d9a57c', false);
        rr(ctx, 120, 160, 660, 54, 12, '#fff'); rr(ctx, 120 + 660 * 0.42, 160, 660 * 0.16, 54, 0, '#e8786a', false); rr(ctx, 120 + 660 * G0, 160, 660 * GZ, 54, 0, '#8fd19e', false);
        txt(ctx, '不许碰中间', 120 + 660 * 0.5, 152, 13, '#b33a2e', 'center'); txt(ctx, '插口', 120 + 660 * (G0 + GZ / 2), 152, 13, '#2e7d4a', 'center');
        rr(ctx, 120 + 660 * st.xs - 20, 170, 40, 34, 4, '#f7f1e3');
        person(ctx, 820, 280, 1.3, '#3b4a6b', '#d39c72', st.shoutShow > 0); txt(ctx, '线长', 800, 296, 13);
        meter(ctx, 30, 40, 240, `产量 ${st.made}  ·  线长要求 ${Math.floor(st.need)}`, Math.min(1, st.made / Math.max(1, st.need + 4)), behind > 4 ? '#d64a3a' : '#58a6d6', INK);
        meter(ctx, 30, 80, 240, `心里的弦 ${Math.round(st.press)}`, st.press / 100, st.press < 35 ? '#d64a3a' : '#9a7ad6', INK);
        txt(ctx, `废条 ${st.defect}/4`, 30, 120, 16, st.defect >= 3 ? '#b33a2e' : INK);
        txt(ctx, '现在几点了？不知道。', 640, 50, 15, '#666');
        if (st.shoutShow > 0 && st.shout) bubble(ctx, st.shout, 330, 70, true);
        ctx.fillStyle = `rgba(160,20,20,${Math.max(0, (60 - st.press) / 300)})`; ctx.fillRect(-10, -10, W + 20, H + 20);
        ctx.restore();
        if (st.defect >= 4 || behind > 9) { finish({ completed: false, fired: true, hoursDone: prog * 12, quality: 0, mentalMult: 1.2 }); bubble(ctx, '你，出来！明天别来了！', 300, 220, true); return false; }
        if (st.t >= DUR) { finish({ completed: true, quality: st.made / Math.max(1, st.made + st.defect), mentalMult: 0.6 + (100 - st.press) / 120 }); bubble(ctx, '天亮了。领手机，上大巴。', 300, 220); return false; }
      });
    });
  };

  // ---------------- 顺手牵羊 ----------------
  MG.pick = function (root, o) {
    return new Promise(resolve => {
      const T = CONFIG.theft;
      const { cv, ctx, bar } = setup(root, '顺手牵羊', '在圆圈里<b>按住鼠标</b>，手跟着圆圈走，进度满了就到手。手出了圈、旁边有人看着，惊觉就会涨。<b>松开鼠标=收手</b>');
      bar.innerHTML = `<span class="mg-note">目标：${o.R.t.name} · 光线 ${o.R.light > .6 ? '亮' : o.R.light > .3 ? '昏暗' : '黑'} · 旁边 ${o.R.witnesses} 个人</span>`;
      const pf = o.perf || { win: 1, shake: 0.6 };
      const R = (T.circleBase + T.circlePerSkill * (o.skill || 0)) * Math.max(0.7, pf.win);
      const need = o.R.loot.time * (1 - (o.skill || 0) * 0.05);
      const st = MG.cur = { type: 'pick', cx: 450, cy: 250, vx: 0, vy: 0, r: R, prog: 0, sus: 0, holding: false, mx: -1, my: -1, started: false, done: false, glance: 0, t: 0 };
      const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; };
      cv.onpointerdown = e => { [st.mx, st.my] = pos(e); st.holding = true; st.started = true; };
      cv.onpointermove = e => { [st.mx, st.my] = pos(e); };
      const up = () => { if (st.holding && !st.done && st.started) { st.holding = false; finish(st.prog >= 1 ? 'success' : 'abort'); } };
      window.addEventListener('pointerup', up);
      const finish = r => { if (st.done) return; st.done = true; window.removeEventListener('pointerup', up); stop(); if (o.force) r = o.force; setTimeout(() => resolve(r), 700); };
      st.finish = finish;
      const stop = loop(dt => {
        st.t += dt;
        const drift = T.driftBase + T.driftAlert * o.R.alert;
        st.vx += (Math.random() - .5) * drift * 6 * dt; st.vy += (Math.random() - .5) * drift * 6 * dt;
        const sp = Math.hypot(st.vx, st.vy); if (sp > drift) { st.vx *= drift / sp; st.vy *= drift / sp; }
        if (st.started) { st.cx += st.vx * dt; st.cy += st.vy * dt; }
        if (st.cx < 300 || st.cx > 640) st.vx *= -1; if (st.cy < 170 || st.cy > 340) st.vy *= -1;
        st.cx = Math.max(300, Math.min(640, st.cx)); st.cy = Math.max(170, Math.min(340, st.cy));
        const jx = pf.shake * Math.sin(st.t * 11), jy = pf.shake * Math.cos(st.t * 9);
        const inside = Math.hypot(st.mx + jx - st.cx, st.my + jy - st.cy) < st.r;
        if (st.holding) {
          if (inside) st.prog += dt / need; else st.sus += T.outsideSuspicion * dt * (0.6 + o.R.alert);
          st.sus += T.baseSuspicion * o.R.alert * dt * 10;
          if (Math.random() < T.witnessChance * o.R.witnesses * o.R.light * dt * 2) { st.sus += T.witnessJump; st.glance = 1.2; }
        }
        st.glance -= dt;
        // 画面
        const dark = o.R.light;
        ctx.fillStyle = `rgb(${20 + dark * 60},${22 + dark * 55},${40 + dark * 40})`; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#3a3530'; ctx.fillRect(0, 360, W, 110);
        // 场景：床位房 / 自助厅门口 / 花坛 / 烧烤摊
        const kind = o.R.t.id;
        if (kind === 'dorm') { ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 8; ctx.strokeRect(70, 120, 760, 260); ctx.beginPath(); ctx.moveTo(70, 120); ctx.lineTo(830, 120); ctx.stroke();
          for (let i = 0; i < o.R.witnesses + 1; i++) { ctx.fillStyle = '#3b3a4a'; ctx.fillRect(650 + i * 60, 40, 50, 70); } }
        if (kind === 'sleeper') { ctx.fillStyle = '#9ec7e6' + (dark > .3 ? '55' : '22'); ctx.fillRect(560, 30, 300, 300); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(560, 30, 300, 300); txt(ctx, '24h 自助银行', 710, 70, 18, '#dbe9f6', 'center'); }
        if (kind === 'drunk') { ctx.fillStyle = '#7a5a3b'; ctx.fillRect(60, 330, 780, 20); for (let i = 0; i < 6; i++) { rr(ctx, 520 + i * 26, 270, 14, 60, 4, '#3e7d4a'); } for (let i = 0; i < 8; i++) { ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(80 + i * 105, 26, 9, 0, 7); ctx.fill(); } }
        // 被子和人
        ctx.fillStyle = kind === 'drunk' ? '#6b4a5a' : '#5b6a8a'; ctx.beginPath(); ctx.moveTo(220, 260); ctx.quadraticCurveTo(450, 200, 720, 250); ctx.quadraticCurveTo(760, 330, 700, 350); ctx.lineTo(230, 350); ctx.quadraticCurveTo(190, 310, 220, 260); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
        ctx.strokeStyle = '#00000044'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(280 + i * 90, 250); ctx.quadraticCurveTo(300 + i * 90, 300, 290 + i * 90, 345); ctx.stroke(); }
        const breathe = Math.sin(st.t * 1.6) * 3;
        ctx.fillStyle = '#d9a57c'; ctx.beginPath(); ctx.ellipse(185, 262 + breathe, 34, 30, -0.3, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#231e1b'; ctx.beginPath(); ctx.ellipse(170, 245 + breathe, 30, 18, -0.4, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(185, 266 + breathe); ctx.lineTo(197, 262 + breathe); ctx.stroke();
        txt(ctx, st.sus > 60 ? '……嗯？' : 'Zzz', 150, 210 - Math.sin(st.t * 2) * 6, 22, st.sus > 60 ? '#ffb0a0' : '#cfd6ff');
        // 裤兜/钱包
        rr(ctx, 400, 270, 260, 70, 14, '#3f4a5c'); ctx.strokeStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(460, 285); ctx.quadraticCurveTo(530, 300, 600, 285); ctx.stroke();
        rr(ctx, st.cx - 22, st.cy - 12, 44, 26, 4, '#7a4a2a');
        // 暗角
        const g = ctx.createRadialGradient(450, 260, 120, 450, 260, 520); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,10,${0.75 - dark * 0.5})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        // 圆圈
        ctx.beginPath(); ctx.arc(st.cx, st.cy, st.r, 0, 7); ctx.fillStyle = inside && st.holding ? '#8fd19e44' : '#ffffff22'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = inside ? '#8fd19e' : '#f2c14e'; ctx.stroke();
        txt(ctx, '兜', st.cx, st.cy + 6, 18, '#fff', 'center');
        if (st.mx > 0) { ctx.fillStyle = st.holding ? '#f2c14e' : '#ffffff99'; ctx.beginPath(); ctx.arc(st.mx, st.my, 9, 0, 7); ctx.fill(); }
        // 旁人
        for (let i = 0; i < o.R.witnesses; i++) { const look = st.glance > 0 && i === 0; txt(ctx, look ? '👀' : '·_·', 720 + i * 40, 90, 22, look ? '#ff8a7a' : '#aab', 'center'); }
        if (st.glance > 0) bubble(ctx, '有人往这边看了一眼！', 600, 120, true);
        meter(ctx, 30, 40, 260, '到手进度', st.prog, '#8fd19e');
        meter(ctx, 30, 80, 260, `惊觉 ${Math.round(st.sus)}`, st.sus / 100, '#d64a3a');
        if (!st.started) txt(ctx, '把鼠标移到圆圈里，按住……', 450, 440, 18, '#f3ead8', 'center');
        if (st.sus >= 100) { finish('caught'); return false; }
        if (st.prog >= 1) { finish('success'); return false; }
      });
    });
  };
})();
