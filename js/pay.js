// 工钱结算：每一行金额加起来必须等于实发。手艺只加不砍说好的工钱。
(function () {
  function sum(lines) { return lines.reduce((a, x) => a + x.amt, 0); }
  function push(lines, name, amt) { lines.push({ name, amt: Math.round(amt) }); }
  function perfOf(spec, q, pool) {
    if (q == null || !pool) return 0;
    if (typeof spec.perf === 'function') return Math.max(0, Math.round(spec.perf(q, pool) || 0));
    if (q <= 0.4) return 0;
    return Math.max(0, Math.round(((q - 0.4) / 0.6) * pool / 5) * 5);
  }
  function settleJob(spec) {
    spec = spec || {};
    const wage = Math.max(0, Math.round(spec.wage || 0));
    const lines = [];
    let bonus = 0, skillPay = 0, quitLine = '';
    if (spec.noPay) {
      push(lines, '还没开工', 0);
      quitLine = '还没开始干活，这班没有工钱。';
    } else if (spec.completed) {
      bonus = perfOf(spec, spec.quality, spec.qualityPay);
      const lv = spec.skillLv || 0;
      skillPay = lv >= 3 ? (lv - 2) * 5 : 0;
      const fines = Math.max(0, Math.round(spec.fines || 0));
      push(lines, '说好的工钱', wage);
      if (bonus) push(lines, '手艺加成', bonus);
      if (skillPay) push(lines, '熟手补贴', skillPay);
      if (fines) push(lines, '失误扣款', -fines);
      let raw = wage + bonus + skillPay - fines;
      if (raw < 0) { push(lines, '扣到零为止', -raw); raw = 0; }
      const cut = Math.min(raw, Math.max(0, Math.round(spec.cut || 0)));
      if (cut) push(lines, '中介抽成', -cut);
      const after = raw - cut;
      if (spec.unpaid && after) push(lines, '厂里没打款，今天没到账', -after);
      else if (spec.delayed && after) push(lines, '工钱改日再结，今天没到账', -after);
    } else if (spec.quitPay === 'none') {
      push(lines, '中途离开，这班说好不结', 0);
      quitLine = '这班说好了，中途离开不结钱。';
    } else if (spec.quitPay === 'hourly') {
      const hoursPaid = Math.max(0, Math.floor((Number(spec.hoursDone) || 0) - 1));
      const rate = Number(spec.hourly) || 0;
      const credited = Math.round(hoursPaid * rate);
      push(lines, '时薪 ¥' + rate + ' × ' + hoursPaid + ' 小时', credited);
      quitLine = '按小时结：干了 ' + (Number(spec.hoursDone) || 0).toFixed(1) + ' 小时，刚上手的 1 小时不算，算 ' + hoursPaid + ' 小时。';
    } else {
      const frac = spec.quitFrac == null ? 0 : Number(spec.quitFrac);
      const credited = Math.round(wage * frac);
      push(lines, '说好的工钱', wage);
      push(lines, frac ? '中途只结 ' + Math.round(frac * 100) + '%' : '中途不结', credited - wage);
      quitLine = spec.quitLine || (frac ? '中途走了，只结一部分。' : '中途走了，一分没给。');
    }
    const credited = sum(lines);
    return { pay: credited, credited, bonus, skillPay, lines, quitLine, sum: credited };
  }
  function settleGig(spec) {
    spec = spec || {};
    const base = Math.max(0, Math.round(spec.base || 0));
    const mult = Number(spec.mult) || 0;
    const scaled = Math.round(base * mult);
    const tip = spec.quit ? 0 : Math.max(0, Math.round(spec.tip || 0));
    const lines = [];
    push(lines, '这单底子', base);
    const craft = scaled - base;
    if (craft) push(lines, craft > 0 ? '手艺加成' : '手艺少给', craft);
    if (tip) push(lines, '小费', tip);
    let credited = scaled + tip;
    if (spec.quit) {
      const frac = spec.frac == null ? 0 : Number(spec.frac);
      const partial = Math.round(scaled * frac);
      push(lines, frac ? '中途只结 ' + Math.round(frac * 100) + '%' : '中途没给', partial - scaled);
      credited = partial;
    } else {
      const floor = spec.floor == null ? 3 : spec.floor;
      if (credited < floor) { push(lines, '最少也给这点', floor - credited); credited = floor; }
    }
    return { pay: credited, credited, lines, sum: sum(lines) };
  }
  const HELP = {
    courier: ['包裹到黄色扫码区时，按 1 2 3 4，或点下面的格子，扔进对的格子。'],
    guard: ['外卖车开到岗亭前按空格拦下。按 P 可以玩手机，查岗的来了要赶紧收起来。'],
    food: ['先按顺序换装、洗手。切肉时鼠标在肉上按住往下拖，或按空格直着落刀。厚薄看虚线。'],
    mover: ['按画面上的方向搬。鼠标、键盘和触摸都能用，手感跟原来一样。'],
    green: ['点草皮转 90°。颜色和花纹对上，从草皮卷一路接到验收旗。'],
    waiter: ['按画面上的说明上菜。鼠标、键盘和触摸都能用。'],
    stage: ['按住一颗螺栓，力道条扫到绿色区域再松手。松早了没拧动，过了头会滑牙。'],
    antigen: ['点开两张一样的试剂才算配上。配错会报警、点名、返工，并在这班结算时扣精神，同一次不会扣两次。'],
    fish: ['浮漂下沉时点一下或按空格提竿，不用拖浮漂。之后按住上升、松开下降，绿色区域罩住鱼才涨。']
  };
  function briefJob(job, wage, helpLines) {
    job = job || {};
    const help = (helpLines && helpLines.length) ? helpLines.slice() : (HELP[job.game] || ['开工后画面上会写明鼠标、键盘和触摸怎么操作。干的时候点「玩法」可以再看。']);
    const quit = job.quitPay === 'none'
      ? '中途离开：这班不结钱。'
      : job.quitPay === 'hourly'
        ? '中途离开或被打发：按时薪 ¥' + job.hourly + ' 结，刚上手的 1 小时不算。'
        : '中途离开：可能不结，也可能只结大约三到六成。';
    const pay = [
      '说好的工钱 ¥' + wage + '，干完照给。',
      job.qualityPay ? '手艺好另加，最多 ¥' + job.qualityPay + '。手生不会倒扣这份工钱。' : '这份活没有手艺加减。',
      quit,
      '还没点「开始干活」就退出：没有工钱。'
    ];
    return {
      objective: job.desc || job.name || '',
      help, pay,
      ends: '干到点会收工。你也可以点「不干了，走人」。点「玩法」能再看一遍怎么操作。'
    };
  }
  function gigNote(g) {
    g = g || { pay: [0, 0] };
    return [
      '这单大约 ¥' + g.pay[0] + '–' + g.pay[1] + '。手艺好会多，手生会少。',
      '干完才结。中途走人可能一分没有，也可能只结三到六成。',
      '点「开始干活」才计时。还没开始就走，这单不算，也不占今天的次数。'
    ];
  }
  window.PAY = { settleJob, settleGig, briefJob, gigNote, HELP };
})();
