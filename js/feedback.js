// v0.9.3 反馈按钮：点一下，打开一个预先填好版本、天数、地点的 GitHub 反馈页（朋友不用任何设置）
(function () {
  const REPO = 'nythen-lab/jiuxianqiao', VER = '0.9.4';
  function ctxInfo() {
    let day = '-', place = '-', clock = '-', who = '-';
    try {
      const S = window.G && G.S && G.S();
      if (S) {
        day = G.dayNum ? G.dayNum() : (S.day || '-');
        const P = window.CONFIG && CONFIG.places && CONFIG.places.find(p => p.id === S.loc); place = P ? P.name : (S.loc || '-');
        if (G.hourF) { const h = G.hourF(); clock = String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60) % 60).padStart(2, '0'); }
        who = S.idId || '-';
      }
    } catch (e) {}
    return { day, place, clock, who };
  }
  function url() {
    const c = ctxInfo();
    const title = '[反馈] ';
    const body = ['**我遇到的情况 / 想说的话：**', '', '', '', '---', '（下面是自动填的，请保留）',
      `- 版本：v${VER}`, `- 第 ${c.day} 天 ${c.clock}`, `- 地点：${c.place}`, `- 身份：${c.who}`,
      `- 浏览器：${navigator.userAgent}`].join('\n');
    return `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }
  function mount() {
    const st = document.getElementById('stage') || document.body;
    if (document.getElementById('fb-btn')) return;
    const a = document.createElement('a'); a.id = 'fb-btn'; a.textContent = '反馈'; a.title = '有问题或想法？点这里告诉我（会打开 GitHub 反馈页）';
    a.target = '_blank'; a.rel = 'noopener'; a.href = 'https://github.com/' + REPO + '/issues/new';
    a.addEventListener('click', () => { a.href = url(); });
    a.addEventListener('contextmenu', () => { a.href = url(); });
    a.addEventListener('mouseenter', () => { a.href = url(); });
    st.appendChild(a);
  }
  window.FEEDBACK = { url, ctxInfo, VER };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
