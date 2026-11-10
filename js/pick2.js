// 勇闯酒仙桥 v0.9.2 · 顺手牵羊：看他的警觉，趁他松的时候伸手，最后抓准时机一把拿。
// 难度由 G.theftSuccessP 给出的得手概率折算，让「约 xx%」和手感对得上。
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const Core = {};
  // sp = 界面上写的得手概率；R = rollTarget 的结果；skill = 顺手技能 0–5
  Core.params = function (R, skill, sp) {
    const d = 1 - clamp(sp, 0.05, 0.95);                 // 难度 0.05–0.95
    return { sp, d,
      safeLen: 3.2 - 2.2 * d, dangerLen: 1.1 + 2.0 * d, warn: 0.8 - 0.4 * d,
      zoneW: 0.06 + 0.17 * (1 - d), period: 1.7 - 0.5 * d,
      need: Math.max(1.4, R.loot.time), hits: R.loot.time > 3 ? 2 : 1,
      glanceRate: 0.04 * R.witnesses * (0.4 + R.light) * (0.5 + d), maxT: 26 };
  };
  Core.create = function (R, skill, sp, rnd) {
    rnd = rnd || Math.random;
    const P = Core.params(R, skill, sp);
    const st = { P, R, t: 0, reach: 0, sus: 0, hits: 0, phase: 'reach', state: 0, seg: [], segT: 0, segI: 0, glance: 0, glanceTel: 0, done: null, msg: '', hold: false, wake: 0, ringT: 0, shake: 0, events: [] };
    const mk = () => { const a = []; for (let i = 0; i < 60; i++) { a.push([0, P.safeLen * (0.55 + rnd() * 0.9)], [1, P.warn], [2, P.dangerLen * (0.7 + rnd() * 0.6)]); } return a; };
    st.seg = mk(); st.segT = 2.2;   // 开头先给一小段安全
    st.ring = () => { const x = (st.ringT / P.period) % 1; return x < .5 ? x * 2 : 2 - x * 2; };
    st.inZone = () => Math.abs(st.ring() - 0.5) <= P.zoneW;
    st.attn = () => st.glance > 0 ? 2 : st.glanceTel > 0 ? 1 : st.state;
    // 接下来 N 秒的警觉安排（给界面画条用）
    st.preview = (span) => { const out = []; let i = st.segI, left = st.segT, t = 0; while (t < span && i < st.seg.length) { out.push([st.seg[i][0], Math.min(left, span - t)]); t += left; i++; left = (st.seg[i] || [0, 1])[1]; } return out; };
    st.step = function (dt, hold, click) {
      if (st.done) return; st.t += dt; st.hold = !!hold;
      st.segT -= dt; while (st.segT <= 0) { st.segI++; const s = st.seg[st.segI] || [0, 1]; st.state = s[0]; st.segT += s[1]; }
      if (st.segI === 0) st.state = 0;
      if (st.glance > 0) st.glance -= dt; else if (st.glanceTel > 0) { st.glanceTel -= dt; if (st.glanceTel <= 0) { st.glance = 0.8; st.events.push('glance'); } }
      else if (st.t > 2.5 && rnd() < P.glanceRate * dt) { st.glanceTel = 0.35; st.events.push('tel'); }
      const a = st.attn(); const light = R.light, alert = R.alert;
      if (st.phase === 'reach') {
        if (hold) {
          st.reach = Math.min(1, st.reach + dt / P.need);
          st.sus += (a === 2 ? 55 + 30 * light : a === 1 ? 6 : 1 + 8 * alert) * dt;
        } else st.sus = Math.max(0, st.sus - 4 * dt);
        if (st.reach >= 1) { st.phase = 'grab'; st.ringT = 0; st.events.push('arrive'); }
      } else {
        st.ringT += dt;
        st.sus += (a === 2 ? 18 : a === 1 ? 3 : 0.5 + 3 * alert) * dt;
        if (click) {
          if (a === 2) { st.sus += 45; st.shake = .4; st.events.push('badclick'); }
          else if (st.inZone()) { st.hits++; st.events.push('hit'); st.msg = '摸到了！'; }
          else { st.sus += 18; st.shake = .2; st.events.push('miss'); st.msg = '手滑了一下，布料沙沙响。'; }
        }
      }
      if (st.sus >= 100) { st.done = 'caught'; st.events.push('caught'); }
      else if (st.hits >= P.hits) { st.done = 'success'; st.events.push('success'); }
      else if (st.t > P.maxT) { st.done = 'abort'; }
    };
    return st;
  };
  root.PickCore = Core;
  if (typeof window === 'undefined') return;

  // ================= 界面 =================
  const W = 900, H = 470, INK = '#2a2420';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';
  const BG = { dorm: 'img/bg-inn.jpg', sleeper: 'img/bg-bank.jpg', corner: 'img/bg-corner-night.jpg' };
  const POCKET = { dorm: [640, 300], sleeper: [470, 320], corner: [520, 330] };
  const rr = (ctx, x, y, w, h, r, fill, stroke, lw) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); } };
  const txt = (ctx, s, x, y, size, color, align, bold) => { ctx.font = `${bold ? '700 ' : ''}${size || 16}px ${FONT}`; ctx.fillStyle = color || '#f3ead8'; ctx.textAlign = align || 'left'; ctx.fillText(s, x, y); };
  const sfx = n => { try { window.FX && FX.sfx.play(n); } catch (e) { } };
  const COL = ['#6dbf7a', '#f0b64a', '#d9503f'];
  MG.pickClassic = MG.pick;
  MG.pick = function (root, o) {
    return new Promise(resolve => {
      root.innerHTML = `<div class="mg"><div class="mg-top"><b>顺手牵羊</b><span class="mg-help">看他的警觉条：<b>绿</b>的时候<b>按住</b>让手往兜里伸，<b>黄</b>就松手，<b>红</b>绝不能动。手到了以后，等圆圈缩进<b>绿环</b>时<b>点一下</b>。</span></div>
        <canvas width="${W * 2}" height="${H * 2}" style="width:${W}px;height:${H}px;touch-action:none"></canvas><div class="mg-bar"></div></div>`;
      const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'); ctx.scale(2, 2); const bar = root.querySelector('.mg-bar');
      const R = o.R, kind = R.t.id, sp = R.successP || (window.G && G.theftSuccessP ? G.theftSuccessP(R) : 0.5);
      bar.innerHTML = `<span class="mg-note">目标：${R.t.name} · 光线 ${R.light > .6 ? '亮' : R.light > .3 ? '昏暗' : '黑'} · 旁边 ${R.witnesses} 个人</span><button class="mg-btn ghost" id="pk-quit">收手</button>`;
      const st = PickCore.create(R, o.skill || 0, sp); st.type = 'pick'; MG.cur = st;
      const img = new Image(); img.src = BG[kind] || BG.dorm;
      let held = false, clickQ = false, beatT = 0, last = performance.now(), alive = true, endT = 0, prevEv = 0, flash = 0, shown = '';
      const finish = r => { if (st.fin) return; st.fin = true; alive = false; cleanup(); if (o.force) r = o.force; setTimeout(() => resolve(r), 900); };
      const kd = e => { if (e.code === 'Space') { e.preventDefault(); if (st.phase === 'grab') { if (!e.repeat) clickQ = true; } else held = true; } else if (e.key === 'Escape') { st.done = st.done || 'abort'; } };
      const ku = e => { if (e.code === 'Space') held = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      cv.addEventListener('pointerdown', e => { cv.setPointerCapture && e.pointerId != null && cv.setPointerCapture(e.pointerId); if (st.phase === 'grab') clickQ = true; else held = true; });
      const rel = () => { held = false; }; cv.addEventListener('pointerup', rel); cv.addEventListener('pointercancel', rel); cv.addEventListener('pointerleave', rel);
      root.querySelector('#pk-quit').onclick = () => { if (!st.done) st.done = 'abort'; };
      function cleanup() { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); clearInterval(st._auto); }
      // 测试用的自动玩家：good = 只在绿灯伸手、圈进绿环才点；bad = 一直按着不松
      st.autoplay = mode => { clearInterval(st._auto); st._auto = setInterval(() => { if (st.done) return; if (mode === 'bad') { if (st.phase === 'grab') clickQ = true; held = true; return; }
        const a = st.attn(); if (st.phase === 'reach') held = a === 0; else if (a === 0 && st.inZone()) clickQ = true; }, 20); };
      st.finish = finish;
      const pos = p => { const [px, py] = POCKET[kind] || POCKET.dorm; const sx = 130, sy = 430; const e = p * p * (3 - 2 * p); return [sx + (px - sx) * e, sy + (py - sy) * e - Math.sin(e * Math.PI) * 70]; };
      function frame(now) { try { frame0(now); } catch (e) { console.error('pick error', e); if (!st.fin) { st.done = st.done || 'abort'; finish('abort'); } } }
      function frame0(now) {
        if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!st.done) {
          st.step(dt, held && st.phase === 'reach', clickQ); clickQ = false;
          const ev = st.events.splice(0); ev.forEach(e => { if (e === 'tel') sfx('tick'); if (e === 'glance') { flash = 1; sfx('gasp'); } if (e === 'hit') sfx('click'); if (e === 'miss' || e === 'badclick') sfx('rustle'); if (e === 'arrive') sfx('chime'); });
          beatT -= dt; if (beatT <= 0) { sfx('heart'); beatT = 1.15 - 0.75 * Math.min(1, st.sus / 100); }
          st.shake = Math.max(0, st.shake - dt); flash = Math.max(0, flash - dt * 1.4);
        } else if (!endT) { endT = 1; if (st.done === 'caught') sfx('caught'); setTimeout(() => finish(st.done), 100); }
        // ---- 画 ----
        ctx.save(); if (st.shake > 0) ctx.translate((Math.random() - .5) * 14 * st.shake, (Math.random() - .5) * 10 * st.shake);
        if (img.complete && img.naturalWidth) { const sc = Math.max(W / img.naturalWidth, H / img.naturalHeight); ctx.drawImage(img, (W - img.naturalWidth * sc) / 2, (H - img.naturalHeight * sc) / 2, img.naturalWidth * sc, img.naturalHeight * sc); } else { ctx.fillStyle = '#1b1d28'; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = `rgba(6,8,18,${0.38 + (1 - R.light) * 0.3})`; ctx.fillRect(0, 0, W, H);
        const [px, py] = POCKET[kind] || POCKET.dorm; const a = st.attn();
        // 他的警觉：一条往前走的时间轴
        const bx = 250, by = 20, bw = 400, span = 7; rr(ctx, bx - 6, by - 6, bw + 12, 44, 10, '#0b0c12cc', '#f3ead855', 1.5); txt(ctx, '他的警觉', bx, by + 3, 12, '#cfd6ee');
        let cx0 = bx; st.preview(span).forEach(([s, d]) => { const w = d / span * bw; ctx.fillStyle = COL[s]; ctx.globalAlpha = .85; ctx.fillRect(cx0, by + 8, Math.max(0, w - 1), 18); cx0 += w; }); ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff'; ctx.fillRect(bx - 2, by + 4, 4, 26);
        // 大眼睛
        const eye = a === 2 ? '👁️' : a === 1 ? '😪' : '😴'; ctx.font = '56px serif'; ctx.textAlign = 'center'; ctx.fillText(eye, 790, 80);
        txt(ctx, a === 2 ? (st.glance > 0 ? '有人看过来！' : '他醒了！别动！') : a === 1 ? '他在动……' : '睡得沉', 790, 104, 15, a ? COL[a] : '#9fd6a8', 'center', true);
        // 兜
        const pulse = 0.5 + 0.5 * Math.sin(st.t * 4);
        ctx.beginPath(); ctx.arc(px, py, 26 + pulse * 4, 0, 7); ctx.fillStyle = 'rgba(255,230,160,.12)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#f3d98a'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
        txt(ctx, '兜', px, py + 6, 18, '#ffeab0', 'center', true);
        // 手
        const [hx, hy] = st.phase === 'reach' ? pos(st.reach) : [px, py];
        if (st.phase === 'reach') { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]); ctx.beginPath(); for (let k = 0; k <= 20; k++) { const [x, y] = pos(k / 20); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.setLineDash([]); }
        ctx.font = '42px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(st.phase === 'grab' ? '🤏' : '🫳', hx, hy + 14 + (a === 2 && held ? Math.sin(st.t * 50) * 2 : 0));
        // 抓的圈
        if (st.phase === 'grab' && !st.done) {
          const rv = 12 + 70 * st.ring(), z0 = 12 + 70 * (0.5 - st.P.zoneW), z1 = 12 + 70 * (0.5 + st.P.zoneW);
          ctx.beginPath(); ctx.arc(px, py, (z0 + z1) / 2, 0, 7); ctx.lineWidth = z1 - z0; ctx.strokeStyle = a === 0 ? 'rgba(120,230,150,.55)' : 'rgba(220,90,70,.45)'; ctx.stroke();
          ctx.beginPath(); ctx.arc(px, py, rv, 0, 7); ctx.lineWidth = 4; ctx.strokeStyle = st.inZone() && a === 0 ? '#c8ffd4' : '#fff'; ctx.stroke();
          txt(ctx, st.P.hits > 1 ? `圈进绿环时点一下（要摸 ${st.P.hits} 下，已 ${st.hits}）` : '圈进绿环时点一下', 450, 430, 17, '#fff4d6', 'center', true);
        } else if (!st.done) txt(ctx, st.reach <= 0 ? '按住鼠标（或空格），手往兜里伸……' : a === 0 ? '继续——' : a === 1 ? '松手！' : '别动！！', 450, 445, 17, a === 2 ? '#ff9a8a' : '#f3ead8', 'center', true);
        if (st.msg && !st.done) txt(ctx, st.msg, 450, 400, 16, '#ffeab0', 'center');
        // 暗角 + 心跳红
        const g = ctx.createRadialGradient(450, 240, 150, 450, 240, 560); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(${40 + st.sus * 1.4},0,0,${0.35 + st.sus / 160})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        if (flash > 0) { ctx.fillStyle = `rgba(255,70,50,${flash * 0.25})`; ctx.fillRect(0, 0, W, H); }
        // 条
        const mt = (x, y, w, label, v, c) => { txt(ctx, label, x, y - 5, 13, '#f3ead8'); rr(ctx, x, y, w, 11, 5, '#00000077', '#f3ead888', 1.2); rr(ctx, x, y, Math.max(0, w * Math.min(1, v)), 11, 5, c); };
        mt(24, 36, 190, '手伸到哪了', st.phase === 'grab' ? 1 : st.reach, '#8fd19e'); mt(24, 74, 190, `惊觉 ${Math.round(st.sus)}`, st.sus / 100, '#d64a3a');
        ctx.restore();
        if (alive) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  };
})(typeof window !== 'undefined' ? window : global);
