// 求签：竹签筒、摇晃、落签、展开签纸。取消不扣钱。确认只结算一次。
(function () {
  const T = window.TOWN; if (!T || !T.ritual) return;
  const prev = T.ritual;
  const QUOTES = [
    { n: '十七', verse: '肩上的活可以分两趟搬。', read: '不是催你更拼。歇一口，也算把这天过完。' },
    { n: '三', verse: '先把肚子填暖，再谈下一趟。', read: '签不替你找工作。饿着做不了长远打算。' },
    { n: '十一', verse: '有人肯听你说两句，就算今天没白过。', read: '朋友不是签上写来的。想见谁，自己走过去。' },
    { n: '廿四', verse: '雨不知道什么时候停。', read: '不确定也没关系。先找个能避一避的屋檐。' },
    { n: '八', verse: '手上的茧会在，急不来。', read: '今天笨一点，不说明明天还笨。' },
    { n: '十四', verse: '把手机放下，看一会儿远处的灯。', read: '这不是吉凶。只是眼睛该歇了。' },
    { n: '廿一', verse: '旧人路过，点个头就好。', read: '相逢不必热闹。认得彼此，已经不容易。' },
    { n: '五', verse: '今晚若是睡得着，就算赚到。', read: '签文管不了工钱。一个整觉比空话实在。' }
  ];
  T.quotes = QUOTES;
  T.ritual = function (kind) { if (kind !== 'fortune') return prev.call(this, kind); return T.playFortune(); };
  T.commitFortune = function (quote) {
    const S = G.S(), d = T.today();
    const gate = window.SHOWS && SHOWS.fortuneCommit ? SHOWS.fortuneCommit(d, S.money) : { ok: !d.fortune && S.money >= 3, money: S.money - 3, minutes: 25, mental: 4 };
    if (!gate.ok) return { err: gate.err || (d.fortune ? 'already' : 'money') };
    const before = { money: S.money, time: S.time, men: S.stats.mental };
    S.money = gate.money;
    G.advance(25);
    const eff = T.effects({ mental: 4 });
    G.addDebuff('peace');
    return { ok: true, cost: 3, eff, quote, before, money: S.money, time: S.time, men: S.stats.mental };
  };
  T.playFortune = async function () {
    const calm = matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let st = SHOWS.fortuneBoot(calm), qi = Math.floor(Math.random() * QUOTES.length), running = true;
    const html = `<p class="muted">摇一支竹签，只当生活寄语。不保证发财，也不替你算命。</p><div class="fq" id="fq"><div class="fq-stage"><div class="fq-cyl" id="fq-cyl"><div class="fq-sticks" id="fq-sticks"></div><div class="fq-rim"></div><div class="fq-body"></div></div><div class="fq-fall" id="fq-fall" hidden></div><div class="fq-paper" id="fq-paper" hidden><div class="fq-sheet"><b class="fq-no"></b><p class="fq-verse"></p><p class="fq-read"></p></div></div></div><p id="fq-tip">抓住签筒左右摇，或按住下面的按钮。</p><div class="fq-actions"><button class="btn" id="fq-hold">按住摇签</button><button class="btn ghost" id="fq-retry" hidden>再摇一支</button><button class="btn" id="fq-keep" hidden>收下这支签</button></div>`;
    const result = await UI.modal({ title: '摇一支签 · ¥3', cls: 'ritual', html, buttons: [{ text: '算了，不做了', cls: 'ghost', value: 'cancel' }], onShow: (m, close) => {
      const cyl = m.querySelector('#fq-cyl'), sticks = m.querySelector('#fq-sticks'), fall = m.querySelector('#fq-fall'), paper = m.querySelector('#fq-paper'), hold = m.querySelector('#fq-hold');
      sticks.innerHTML = Array.from({ length: 11 }, (_, i) => `<i style="left:${8 + i * 7}%;--r:${(i - 5) * 2}deg"></i>`).join('');
      let holding = false, lastX = 0, raf = 0, last = performance.now();
      const frame = now => {
        if (!running || !cyl.isConnected) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        SHOWS.fortuneStep(st, dt, { hold: holding });
        cyl.style.transform = `rotate(${Math.max(-16, Math.min(16, st.angle * 0.15))}deg)`;
        if (st.phase === 'fall' && fall.hidden) { fall.hidden = false; fall.textContent = QUOTES[qi].n; try { FX.sfx.play('splash'); } catch (e) {} }
        if (st.phase === 'fall' && st.t > (st.fellAt || (st.fellAt = st.t)) + 0.7) { st.phase = 'paper'; paper.hidden = false; paper.querySelector('.fq-no').textContent = '第' + QUOTES[qi].n + '签'; paper.querySelector('.fq-verse').textContent = QUOTES[qi].verse; paper.querySelector('.fq-read').textContent = QUOTES[qi].read; m.querySelector('#fq-keep').hidden = false; m.querySelector('#fq-retry').hidden = false; hold.hidden = true; try { FX.sfx.play('paper'); } catch (e) {} }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      hold.onpointerdown = e => { holding = true; lastX = e.clientX; hold.setPointerCapture && hold.setPointerCapture(e.pointerId); };
      cyl.onpointerdown = e => { holding = true; lastX = e.clientX; };
      const move = e => { if (!holding) return; const dx = e.clientX - lastX; lastX = e.clientX; SHOWS.fortuneStep(st, 0, { dx }); try { if (Math.abs(dx) > 8) FX.sfx.play('wood'); } catch (err) {} };
      m.addEventListener('pointermove', move);
      const up = () => { if (holding && calm) SHOWS.fortuneStep(st, 0, { tap: 1 }); holding = false; };
      m.addEventListener('pointerup', up);
      m.querySelector('#fq-retry').onclick = () => { qi = (qi + 1) % QUOTES.length; st = SHOWS.fortuneBoot(calm); fall.hidden = true; paper.hidden = true; hold.hidden = false; m.querySelector('#fq-keep').hidden = true; m.querySelector('#fq-retry').hidden = true; };
      m.querySelector('#fq-keep').onclick = () => { running = false; cancelAnimationFrame(raf); close({ keep: true, quote: QUOTES[qi] }); };
    } });
    running = false;
    if (!result || result === 'cancel' || !result.keep) return { cancel: true };
    const paid = T.commitFortune(result.quote);
    if (!paid.ok) return paid;
    await UI.modal({ title: '签文 · 今日寄语', html: `<p class="fortune-verse">${paid.quote.verse}</p><p>${paid.quote.read}</p><p class="muted">「心安」3 天。签文是寄语，不预测命运，也不保证进账。</p>${UI.effText(Object.assign({}, paid.eff, { money: -3 }))}` });
    return paid;
  };
})();
