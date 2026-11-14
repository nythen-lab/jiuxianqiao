// 澡堂分场、药厂责骂、求签手感、地点菜单分组。纯数据，给测试用。
(function () {
  const bath = {
    wash: { id: 'wash', sound: 'shower', steps: ['water', 'dust', 'shoulders', 'exhale'], lines: ['水从喷头浇下来，灰顺着肩膀走。', '肩松了一下。'] },
    soak: { id: 'soak', sound: 'soak', steps: ['enter', 'steam', 'ripple', 'exhale'], lines: ['你迈进池子，涟漪一圈圈散开。', '把气慢慢吐出去。'] },
    rub: { id: 'rub', sound: 'scrub', steps: ['scrub', 'rinse', 'sink', 'exhale'], lines: ['毛巾从背上蹭过去。', '冲干净，再沉进热水里。'] }
  };
  function bathPick(service, variant) {
    const base = bath[service] || bath.wash;
    const v = Math.abs(Number(variant) || 0) % 2;
    return { id: base.id, key: base.id + '-' + v, variant: v, sound: base.sound, steps: base.steps.slice(), lines: base.lines.slice(), mirror: v === 1 };
  }
  const SCOLD = [
    ['配错了！这批返工，别拖整条线！', '两张对不上。盖回去，重配。', '看清再翻。这一对作废。'],
    ['又错了。铁盘堆在你这儿，全线等着。', '第二次。线长盯着你的手。', '试剂对不上，这盒返工。'],
    ['还错？你把整条线拖住了。', '再错就把你换下去。', '质检本又记一笔。低头，重来。'],
    ['手在抖也得对上。这批全返工。', '线长拍着案子：大家都在等你这一个错。', '骂声贴着耳朵。记在这班上。']
  ];
  function flipNote(st, now, nonce) {
    st = st || { wrong: 0, toll: 0, rework: 0, lastAt: -10, lastLine: '', applied: {} };
    const next = Object.assign({}, st, { applied: Object.assign({}, st.applied) });
    if (nonce != null && next.applied[nonce]) return Object.assign(next, { hit: 0, appliedNow: false, line: next.lastLine });
    if (now - next.lastAt < 0.75) return Object.assign(next, { hit: 0, appliedNow: false, cooled: true, line: next.lastLine });
    const n = next.wrong + 1;
    const tier = Math.min(3, Math.floor((n - 1) / 2));
    const raw = Math.min(4, 1 + Math.ceil(n / 2));
    const room = 12 - next.toll;
    const hit = Math.max(0, Math.min(raw, room));
    const choices = SCOLD[tier];
    const line = choices.find(x => x !== next.lastLine) || choices[0];
    next.wrong = n; next.toll += hit; next.rework += Math.min(6, 3 + Math.min(n, 3));
    next.lastAt = now; next.lastLine = line; next.hit = hit; next.line = line; next.tier = tier; next.appliedNow = true;
    if (nonce != null) next.applied[nonce] = 1;
    return next;
  }
  function fortuneStep(st, dt, inp) {
    inp = inp || {}; st.t += dt;
    if (inp.hold) st.v += Math.sin(st.t * (st.calm ? 8 : 22)) * (st.calm ? 900 : 1600) * dt;
    if (inp.dx) st.v += inp.dx * 0.09;
    if (inp.tap) st.energy += st.calm ? 0.42 : 0.16;
    st.v *= Math.exp(-3.1 * dt);
    st.v = Math.max(-220, Math.min(220, st.v));
    st.angle += st.v * dt;
    const speed = Math.abs(st.v);
    if (speed > 18 || inp.hold) st.energy += dt * (inp.hold ? 0.55 : 0.2) * (1 + Math.min(1.2, speed / 80));
    const need = st.calm ? 1.05 : 1.65;
    if (st.phase === 'shake' && st.energy >= need) { st.phase = 'fall'; st.fell = true; }
    return st;
  }
  function fortuneBoot(calm) { return { t: 0, v: 0, angle: 0, energy: 0, phase: 'shake', fell: false, calm: !!calm }; }
  function fortuneCommit(day, money) {
    day = day || {};
    if (day.fortune) return { err: 'already', money: money, charged: false };
    if (money < 3) return { err: 'money', money: money, charged: false };
    day.fortune = 1;
    return { ok: true, money: money - 3, minutes: 25, mental: 4, charged: true };
  }
  function actKind(id) {
    id = String(id || '');
    const base = id.split(':')[0];
    const sub = id.split(':')[1] || '';
    if (base === 'temple') return (sub === 'bow' || sub === 'wish') ? 'free' : 'spend';
    if (base === 'sleep') return (sub === 'street' || sub === 'shelter' || sub === 'home' || sub === 'month') ? 'free' : 'spend';
    if (base === 'tjob' || base === 'sell' || base === 'scrap' || base === 'fishsell' || base === 'gig') return 'earn';
    if (base === 'oddjob') return 'chore';
    if (base === 'scratch' || base === 'pick') return 'risk';
    if (base === 'netsurf') return 'spend';
    if (base === 'bankbook' || base === 'send' || base === 'borrow') return 'money';
    if (base === 'agency' || base === 'clinic' || base === 'board' || base === 'rent') return 'chore';
    if (['leftover', 'shop', 'laundry', 'karaoke', 'beer', 'skewer', 'netgame', 'fishcook', 'feast', 'umbrella', 'bath', 'hallphoto', 'homecook', 'fishgive', 'hallwed'].includes(base)) return 'spend';
    return 'free';
  }
  const SECTIONS = [
    ['earn', '挣钱的活', '🧰', '有工钱，或把东西卖成现钱'],
    ['spend', '花钱享受', '💸', '要掏钱，换吃的、洗的、玩的'],
    ['risk', '碰运气', '🎲', '可能亏，不保证赚'],
    ['money', '资金往来', '🔁', '转账、存取、借还，不是进账'],
    ['chore', '其他事务', '📋', '办事、看病、换饭，不算工钱'],
    ['free', '免费 / 其他', '🪑', '不花钱']
  ];
  window.SHOWS = { bathPick, flipNote, fortuneStep, fortuneBoot, fortuneCommit, actKind, SECTIONS };
})();
