// v1.0.2 证件要考试：保安员证（理论笔试 + 灭火器实操，过了 3 天出证）、健康证（排队 / 抽血 / 胸透 + 食品卫生小测，过了 2 天出报告）。
(function () {
  const C = window.CONFIG, S0 = () => G.S(), $ = s => document.querySelector(s);
  const snd = GP => (window.GP && GP.S) || { tone() { }, noise() { }, good() { }, win() { }, bad() { }, click() { }, tap() { }, chime() { } };
  const sfx = () => snd(window.GP);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const svc = id => C.agencyServices.find(x => x.id === id);
  const stat = id => { const S = S0(); S.certStat = S.certStat || {}; const d = G.dayNum(); const s = S.certStat[id] = S.certStat[id] || { tries: 0, day: d, today: 0 }; if (s.day !== d) { s.day = d; s.today = 0; } return s; };
  const CERT = window.CERT = { stat };

  // —— 通用选择题：一题一题出，答完立刻告诉对错和讲解 ——
  CERT.quiz = function (o) {
    const pool = shuffle(C.certQ[o.kind]).slice(0, o.n); const items = pool.map(q => ({ cat: q[0], q: q[1], right: q[2], opts: shuffle(q.slice(2, 6)), exp: q[6] }));
    return UI.modal({ title: o.title, wide: true, cls: 'certmodal', bg: o.bg, buttons: [], html: '<div id="cq"></div>', onShow: (m, close) => {
      const root = m.querySelector('#cq'); let i = 0, right = 0; const miss = [];
      const show = () => {
        const it = items[i]; root.innerHTML = `<div class="cq-head"><span>${o.head || '考试'}</span><b>第 ${i + 1} / ${items.length} 题</b><span class="cq-tag">${it.cat}</span><span class="cq-score">答对 ${right}</span></div><div class="cq-bar"><i style="width:${i / items.length * 100}%"></i></div><p class="cq-q">${it.q}</p><div class="cq-opts">${it.opts.map((t, k) => `<button class="cq-opt" data-ok="${t === it.right ? 1 : 0}" data-k="${k}"><b>${'ABCD'[k]}</b><span>${t}</span></button>`).join('')}</div><div class="cq-fb"></div>`;
        root.querySelectorAll('.cq-opt').forEach(b => b.onclick = () => {
          if (root.dataset.lock === String(i)) return; root.dataset.lock = String(i); const ok = b.dataset.ok === '1'; const S = sfx();
          root.querySelectorAll('.cq-opt').forEach(x => { x.classList.add('done'); if (x.dataset.ok === '1') x.classList.add('right'); });
          if (ok) { right++; b.classList.add('pick'); S.good(right); } else { b.classList.add('wrong'); miss.push({ q: it.q, mine: b.querySelector('span').textContent, right: it.right, exp: it.exp }); S.bad(); root.classList.add('shake'); setTimeout(() => root.classList.remove('shake'), 400); }
          root.querySelector('.cq-fb').innerHTML = `<p class="${ok ? 'ok' : 'no'}">${ok ? '✔ 答对了' : '✘ 答错了，正确答案：' + it.right}</p><p class="exp">${it.exp}</p><button class="btn primary cq-next">${i + 1 >= items.length ? '交卷' : '下一题 ▸'}</button>`;
          root.querySelector('.cq-next').onclick = () => { i++; if (i >= items.length) close({ right, total: items.length, miss, pass: right >= o.pass }); else show(); };
        });
      };
      show();
    } });
  };

  // —— 证书卡片动画 ——
  CERT.card = function (title, sub, who, stamp, bg) {
    return UI.modal({ title: '', cls: 'certmodal', bg, html: `<div class="cert-card"><div class="cc-in"><small>${sub}</small><h3>${title}</h3><p>${who}</p><div class="cc-photo"></div><div class="cc-stamp">${stamp}</div></div></div>`, buttons: [{ text: '收好' }], onShow: () => { const S = sfx(); S.win(); setTimeout(() => S.tone(180, 90, .14, .22), 900); } });
  };

  // —— 按住型小动作（抽血 / 胸透）——
  function holdStep(o) {
    return UI.modal({ title: o.title, cls: 'certmodal', bg: o.bg, buttons: [], html: `<div class="cs-hold"><div class="cs-art">${o.art}</div><p class="cs-tip">${o.tip}</p><div class="cs-ring"><i></i></div><button class="btn primary cs-btn" id="cs-hold">${o.btn}</button><p class="cs-msg"></p></div>`, onShow: (m, close) => {
      const b = m.querySelector('#cs-hold'), bar = m.querySelector('.cs-ring i'), msg = m.querySelector('.cs-msg'); let t0 = 0, raf = 0, done = false, tries = 0;
      const reset = text => { cancelAnimationFrame(raf); t0 = 0; bar.style.width = '0%'; if (text) { msg.textContent = text; msg.className = 'cs-msg bad'; sfx().bad(); } };
      const tick = () => { if (!t0 || done) return; const k = Math.min(1, (performance.now() - t0) / o.ms); bar.style.width = (k * 100) + '%'; if (Math.random() < .12) sfx().tone(300 + k * 300, 320 + k * 300, .03, .04); if (k >= 1) { done = true; sfx().chime(); msg.textContent = o.okText; msg.className = 'cs-msg ok'; setTimeout(() => close({ tries }), 700); } else raf = requestAnimationFrame(tick); };
      const down = e => { e.preventDefault(); if (done) return; t0 = performance.now(); msg.textContent = o.holdText; msg.className = 'cs-msg'; tries++; raf = requestAnimationFrame(tick); };
      const up = () => { if (!t0 || done) return; reset(o.earlyText); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
      b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); }); b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
    } });
  }
  // —— 排队：往前挪 ——
  function queueStep(bg) {
    return UI.modal({ title: '排队取号', cls: 'certmodal', bg, buttons: [], html: '<div class="cs-queue"><p class="cs-tip">门诊里排着长队。点“往前挪一步”，轮到你就进去。</p><div class="cq-line"></div><button class="btn primary" id="cs-step">往前挪一步</button><p class="cs-msg"></p></div>', onShow: (m, close) => {
      const line = m.querySelector('.cq-line'), msg = m.querySelector('.cs-msg'); let n = 5; const draw = () => { line.innerHTML = Array.from({ length: n + 1 }, (_, i) => `<span class="${i === n ? 'me' : ''}">${i === n ? '🧍‍♂️你' : ['🧍', '🧍‍♀️', '👷', '🧓', '🧑‍🍳'][i % 5]}</span>`).join(''); msg.textContent = n ? `前面还有 ${n} 个人` : '“下一个！”叫到你了'; msg.className = 'cs-msg' + (n ? '' : ' ok'); };
      draw(); m.querySelector('#cs-step').onclick = e => { if (n > 0) { n--; sfx().tap(); draw(); if (n === 0) { sfx().chime(); e.target.textContent = '进去'; } } else close(1); };
    } });
  }
  // —— 灭火器实操：按顺序点 ——
  function extStep(bg) {
    const steps = ['提起灭火器，到离火点几米处', '拔掉保险销', '一手握住喷管，对准火焰根部', '用力压下把手，左右扫射'];
    return UI.modal({ title: '实操：灭火器灭火', cls: 'certmodal', bg, buttons: [], html: `<div class="cs-ext"><p class="cs-tip">考官指着一只着火的废油桶：“把灭火的步骤按顺序做出来。”依次点：</p><div class="ce-list">${shuffle(steps.map((t, i) => ({ t, i }))).map(s => `<button class="ce-s" data-i="${s.i}">${s.t}</button>`).join('')}</div><div class="ce-prog"></div><p class="cs-msg"></p></div>`, onShow: (m, close) => {
      let next = 0, mistakes = 0; const msg = m.querySelector('.cs-msg'), pr = m.querySelector('.ce-prog');
      const upd = () => pr.innerHTML = steps.map((_, i) => `<i class="${i < next ? 'on' : ''}"></i>`).join('');
      upd(); m.querySelectorAll('.ce-s').forEach(b => b.onclick = () => { if (b.disabled) return; const i = +b.dataset.i; if (i === next) { b.disabled = true; b.classList.add('ok'); next++; sfx().good(next); upd(); msg.textContent = ''; if (next >= 4) { msg.textContent = '火灭了！考官点头。'; msg.className = 'cs-msg ok'; sfx().win(); setTimeout(() => close({ mistakes }), 900); } } else { mistakes++; sfx().bad(); b.classList.add('bad'); setTimeout(() => b.classList.remove('bad'), 400); msg.textContent = `顺序不对！应该先：${steps[next]}`; msg.className = 'cs-msg bad'; } });
    } });
  }

  const BG = A => window.A && A.IMG && A.IMG.place ? A.IMG.place('agency') : null;
  function pendingRecord(id, days) { const S = S0(); const t = G.dayNum(); S.certs = S.certs || {}; S.certs[id] = { applied: t, ready: t + days, done: false, passedDay: t }; }

  async function guard() {
    const S = S0(), sv = svc('guardCert'), st = stat('guardCert'), bg = BG(); const first = st.tries === 0;
    if (G.hasRecord()) return UI.toast('“有底子的办不了，别为难我。”', 'bad');
    if (st.today >= 2) return UI.toast('今天已经考了两场，明天再来吧。', 'bad');
    const fee = first ? sv.price : sv.retake; if (S.money < fee) return UI.toast(`报名费 ¥${fee}，钱不够。`, 'bad');
    const go = await UI.modal({ title: sv.name, bg, html: `<p>${sv.text}</p><p>${first ? `报名考试费 <b>¥${fee}</b>` : `补考费 <b>¥${fee}</b>`} · 笔试 ${sv.nq} 道选择题，答对 ${sv.pass} 道及格 · 再加灭火器实操 · 约 1.5 小时</p><p class="muted tiny">内容有：法律法规、巡逻职责、消防、急救、处理冲突。每次抽到的题不一样。</p>`, buttons: [{ text: `交 ¥${fee} 开考` }, { text: '算了', cls: 'ghost' }] });
    if (go === 1) return;
    S.money -= fee; st.tries++; st.today++; G.advance(30); let res;
    for (;;) {
      res = await CERT.quiz({ kind: 'guard', n: sv.nq, pass: sv.pass, title: '保安员理论考试', head: '保安员证 · 笔试', bg });
      G.advance(60); G.change({ stamina: -3, mental: res.pass ? 2 : -3 });
      const score = Math.round(res.right / res.total * 100);
      if (!res.pass) {
        G.log(`保安员笔试没过（${res.right}/${res.total}）。`, 'warn');
        const rv = res.miss.map(x => `<li><b>${x.q}</b><br>你选：${x.mine}　<span class="up">正确：${x.right}</span><br><span class="muted">${x.exp}</span></li>`).join('');
        const again = S.money >= sv.retake && st.today < 2;
        const k = await UI.modal({ title: '没过', bg, wide: true, html: `<p class="why bad">答对 ${res.right} / ${res.total}（${score} 分），要 ${sv.pass} 道才及格。</p><p>下面是你答错的题：</p><ul class="cq-review">${rv}</ul><p>补考一次 <b>¥${sv.retake}</b>，再花 1 小时。${again ? '' : (S.money < sv.retake ? '（钱不够补考费）' : '（今天已经考了两场）')}</p>`, buttons: [{ text: `马上补考（¥${sv.retake}）`, disabled: !again }, { text: '回头再说', cls: 'ghost' }] });
        if (k !== 0) { UI.render && UI.render(); return { passed: false, res }; }
        S.money -= sv.retake; st.tries++; st.today++; G.advance(10); continue;
      }
      break;
    }
    await UI.modal({ title: '笔试过关', bg, html: `<p class="why">答对 ${res.right} / ${res.total}，过了。还有一场灭火器实操。</p>`, buttons: [{ text: '去实操' }] });
    const pr = await extStep(bg); G.advance(20);
    pendingRecord('guardCert', sv.days); G.log(`保安员证考过了，${sv.days} 天后来拿证。`, 'good');
    await CERT.card('保 安 员 证', '考核合格 · 待发证', G.identity().name || '持证人', '合格', bg);
    await UI.modal({ title: '考完了', bg, html: `<p>考官在登记表上盖了章：“${sv.days} 天后来拿证。”</p><p class="eff"><span class="up">精神 +2</span> <span class="down">体力 -3</span> <span class="down">钱 -${fee}</span></p>` });
    if (window.UI && UI.render) UI.render();
    return { passed: true, res };
  }

  async function health() {
    const S = S0(), sv = svc('healthCert'), st = stat('healthCert'), bg = BG();
    if (st.today >= 2) return UI.toast('今天已经折腾两趟了，明天再来吧。', 'bad');
    const first = !st.paid; const fee = first ? sv.price : sv.retake; if (S.money < fee) return UI.toast(`费用 ¥${fee}，钱不够。`, 'bad');
    const go = await UI.modal({ title: sv.name, bg, html: `<p>${sv.text}</p><p>体检费 <b>¥${sv.price}</b> · 排队、抽血、胸透，再答 ${sv.nq} 道食品卫生题（对 ${sv.pass} 道及格）· 约 1 小时 · 体检后 ${sv.days} 天出报告</p>`, buttons: [{ text: `交 ¥${fee} 去体检` }, { text: '算了', cls: 'ghost' }] });
    if (go === 1) return;
    S.money -= fee; st.paid = true; st.tries++; st.today++;
    if (!st.bodyDone) {
      await queueStep(bg); G.advance(35);
      await holdStep({ title: '抽血', bg, art: '<div class="cs-art-in">🩸💉</div>', tip: '护士把针头扎进你的胳膊：“别动，按住别松手。”按住按钮，直到抽完。', btn: '按住不动（抽血中）', ms: 2400, holdText: '抽着血……别松手。', earlyText: '手一动，针头偏了，护士皱眉：“说了别动！”重来。', okText: '抽好了，按住棉签。' }); G.advance(10);
      await holdStep({ title: '胸透', bg, art: '<div class="cs-art-in">🫁</div>', tip: '医生：“深吸一口气，屏住。”按住按钮屏住呼吸，直到“咔嚓”一声。', btn: '屏住呼吸（按住）', ms: 1800, holdText: '屏住——', earlyText: '你憋不住喘了一口，片子糊了：“再来一次。”', okText: '咔嚓。拍好了。' }); G.advance(10);
      st.bodyDone = true;
    }
    let res;
    for (;;) {
      res = await CERT.quiz({ kind: 'health', n: sv.nq, pass: sv.pass, title: '食品卫生小测', head: '健康证 · 卫生知识', bg }); G.advance(10);
      if (res.pass) break;
      const rv = res.miss.map(x => `<li><b>${x.q}</b><br><span class="up">正确：${x.right}</span><br><span class="muted">${x.exp}</span></li>`).join('');
      const again = S.money >= sv.retake;
      const k = await UI.modal({ title: '小测没过', bg, wide: true, html: `<p class="why bad">答对 ${res.right} / ${res.total}，要 ${sv.pass} 道。</p><ul class="cq-review">${rv}</ul><p>听完讲解重测一次，<b>¥${sv.retake}</b>，再花 20 分钟。</p>`, buttons: [{ text: `重测（¥${sv.retake}）`, disabled: !again }, { text: '回头再说', cls: 'ghost' }] });
      if (k !== 0) { st.retakePending = true; UI.render && UI.render(); return { passed: false, res }; }
      S.money -= sv.retake; G.advance(20);
    }
    st.retakePending = false; G.change({ stamina: -2 });
    pendingRecord('healthCert', sv.days); G.log(`体检做完了，${sv.days} 天后来拿健康证。`, 'good');
    await UI.modal({ title: '体检做完了', bg, html: `<p>医生在单子上签了字：“${sv.days} 天后来取报告和健康证。”</p><p class="eff"><span class="down">体力 -2</span> <span class="down">钱 -${fee}</span></p>` });
    if (window.UI && UI.render) UI.render();
    return { passed: true, res };
  }
  CERT.start = id => id === 'guardCert' ? guard() : health();
  CERT.cardSub = function (sv) {
    const c = (S0().certs || {})[sv.id], st = stat(sv.id), d = G.dayNum();
    if (c) return c.done ? '已经办下来了' : `办理中，还有 ${Math.max(0, c.ready - d)} 天（第 ${c.ready} 天来拿）`;
    if (sv.id === 'guardCert') return st.tries ? `没过 · 补考 ¥${sv.retake}` : `¥${sv.price} · 笔试 ${sv.nq} 题对 ${sv.pass} 题过 + 实操 · 过后 ${sv.days} 天出证 · 要求无案底`;
    return st.bodyDone ? `体检已做 · 卫生小测没过，重测 ¥${sv.retake}` : `¥${sv.price} · 排队/抽血/胸透 + ${sv.nq} 道卫生题 · ${sv.days} 天出报告`;
  };
  // 存档迁移：「第 26 天来拿」这类：按申请日 + 出证天数重算；没有申请日的，用 到期日 − 出证天数
  CERT.migrate = function () {
    const S = S0(); if (!S || !S.certs) return; Object.keys(S.certs).forEach(k => { const c = S.certs[k], sv = svc(k); if (!sv || c.done) return; if (c.applied == null) c.applied = Math.max(1, Math.min(G.dayNum(), c.ready - sv.days)); c.ready = Math.min(c.ready, c.applied + sv.days); if (c.ready < c.applied + sv.days) c.ready = c.applied + sv.days; });
  };
  { const mg = G.migrate; G.migrate = function () { const r = mg.apply(this, arguments); try { CERT.migrate(); } catch (e) { console.error(e); } return r; }; }
  { const nt = G.certsTick; if (nt) G.certsTick = function (d) { try { CERT.migrate(); } catch (e) { } return nt.apply(this, arguments); }; }
})();
