// 调试面板：按 Shift+D 打开，或网址后面加 ?debug=1
// 用来快速测试：跳天、加钱、强制偷窃成功/失败等。正式版可以删掉这个文件。
(function () {
  const D = {}; window.DBG = D; let on = /debug=1/.test(location.search);
  const el = () => document.getElementById('debug');
  D.refresh = function () {
    const e = el(); if (!e) return; e.classList.toggle('hidden', !on); if (!on) return;
    const S = G.S(); if (!S) { e.innerHTML = '<b>调试</b> 先开始游戏'; return; }
    e.innerHTML = `<b>调试面板</b> <small>Shift+D 关闭</small><div>
      <button data-d="next">跳到下一天 04:00</button><button data-d="hour">+3 小时</button><button data-d="d14">跳到第14天 12:00</button>
      <button data-d="money">+¥500</button><button data-d="full">体力精神饱腹满</button><button data-d="lowmen">精神=3</button><button data-d="sta12">体力=12</button><button data-d="hun9">饱腹=9</button><button data-d="money3000">现金=¥3100</button>
      <button data-d="pickwin">下次偷窃：${S.debugPick === 'success' ? '✓' : ''}必成</button><button data-d="picklose">下次偷窃：${S.debugPick === 'caught' ? '✓' : ''}必败</button><button data-d="picknone">偷窃：正常</button>
      <button data-d="hire">招工：${S.debugHire === true ? '必中' : S.debugHire === false ? '必拒' : '正常'}</button>
      <button data-d="night">跳到今晚 23:30</button><button data-d="stories">+6个故事</button><button data-d="clear">清除案底</button></div>`;
    e.querySelectorAll('button').forEach(b => b.onclick = () => D.cmd(b.dataset.d));
  };
  D.cmd = function (c) {
    const S = G.S();
    if (c === 'next') G.advance(G.untilClock('04:00'));
    if (c === 'hour') G.advance(180);
    if (c === 'd14' || c === 'd6') { const want = 14; while (G.dayNum() < want) G.advance(G.untilClock('04:00'), 'sleep', { recover: { stamina: 10, mental: 5 } }); G.advance(G.untilClock('12:00')); }
    if (c === 'money') S.money += 500;
    if (c === 'full') { S.stats.stamina = S.maxSta; S.stats.mental = 100; S.stats.hunger = 100; }
    if (c === 'lowmen') S.stats.mental = 3;
    if (c === 'sta12') S.stats.stamina = 12;
    if (c === 'hun9') S.stats.hunger = 9;
    if (c === 'money3000') S.money = 3100;
    if (c === 'pickwin') S.debugPick = 'success';
    if (c === 'picklose') S.debugPick = 'caught';
    if (c === 'picknone') S.debugPick = null;
    if (c === 'hire') S.debugHire = S.debugHire === true ? false : S.debugHire === false ? null : true;
    if (c === 'night') G.advance(G.untilClock('23:30'));
    if (c === 'stories') ['测试一', '测试二', '测试三', '测试四', '测试五', '测试六'].forEach(s => { if (!S.stories.includes(s)) S.stories.push(s); });
    if (c === 'clear') S.record = { count: 0, log: [] };
    G.queue.length = 0; G.save(); UI.render();
    const end = G.checkEnd(); if (end) UI.ending();
  };
  addEventListener('keydown', e => { if (e.key === 'D' && e.shiftKey) { on = !on; D.refresh(); } });
  addEventListener('load', () => setTimeout(D.refresh, 50));
})();
