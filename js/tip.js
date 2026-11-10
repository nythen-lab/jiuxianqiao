// v0.9.4 请作者喝杯咖啡：收款码图片缺失就自动隐藏，不出现破图
(function () {
  const T = () => (window.CONFIG && CONFIG.tip) || { enabled: false };
  const probe = src => new Promise(res => { if (!src) return res(false); const im = new Image(); im.onload = () => res(im.naturalWidth > 0); im.onerror = () => res(false); im.src = src; });
  const st = { ready: false, wechat: false, alipay: false, afdian: false, afdianImg: false, on: false };
  const TIP = window.TIP = { st };
  TIP.on = () => st.on;
  TIP.refresh = TIP_REFRESH;
  async function TIP_REFRESH() {
    const t = T(); st.ready = false; st.wechat = st.alipay = st.afdian = st.afdianImg = st.on = false; if (!t.enabled) { st.ready = true; return st; }
    [st.wechat, st.alipay, st.afdianImg] = await Promise.all([probe(t.wechatImg), probe(t.alipayImg), probe(t.afdianImg)]);
    st.afdian = !!t.afdianUrl; st.on = st.wechat || st.alipay || st.afdian || st.afdianImg; st.ready = true;
    document.querySelectorAll('[data-tip-slot]').forEach(fill); return st;
  }
  TIP.ready = TIP_REFRESH();
  const flagged = () => { try { return !!localStorage.getItem(T().storageKey); } catch (e) { return false; } };
  const flag = () => { try { localStorage.setItem(T().storageKey, '1'); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 弹窗
  TIP.open = async function () {
    if (!st.on) return;
    const t = T();
    const slot = (img, name, cls) => `<figure class="tip-qr ${cls}"><img src="${esc(img)}" alt="${name}收款码" onerror="this.parentNode.style.display='none'"><figcaption>${name}</figcaption></figure>`;
    const afd = (st.afdianImg || st.afdian) ? `<div class="tip-afd">${st.afdianImg ? `<figure class="tip-qr afd"><img src="${esc(t.afdianImg)}" alt="爱发电二维码" onerror="this.parentNode.style.display='none'"><figcaption>${esc(t.afdianScan || '')}</figcaption></figure>` : ''}${st.afdian ? `<a class="btn primary tip-go" href="${esc(t.afdianUrl)}" target="_blank" rel="noopener">${esc(t.afdianBtn || '去爱发电支持')} ▸</a>` : ''}</div>` : '';
    const alt = (st.wechat || st.alipay) ? `<div class="tip-alt"><p class="tip-altl">${(st.afdian || st.afdianImg) ? '也可以' : ''}直接扫码</p><div class="tip-qrs">${st.wechat ? slot(t.wechatImg, '微信', 'wx') : ''}${st.alipay ? slot(t.alipayImg, '支付宝', 'ali') : ''}</div></div>` : '';
    const html = `<div class="tip-body"><p class="tip-line">${esc(t.line)}</p>${afd}${alt}<p class="tip-sub">${esc(t.body)}</p></div>`;
    await UI.modal({ title: '☕ ' + t.title, cls: 'tip-modal', html, buttons: [{ text: t.thanks }] });
  };

  // 标题 / 结局上的入口（探测完成前先隐藏）
  function fill(el) {
    if (!el) return; const t = T();
    if (el.getAttribute('data-tip-slot') === 'title') {
      el.innerHTML = st.on ? `<button class="btn tip-btn" id="t-tip">${esc(t.button)}</button>` : '';
      const b = el.querySelector('#t-tip'); if (b) b.onclick = TIP.open;
    } else if (el.getAttribute('data-tip-slot') === 'end') {
      const fb = `<a class="tip-fb" id="end-fb" href="#" target="_blank" rel="noopener">反馈</a>`;
      el.innerHTML = st.on ? `<div class="tip-card"><span class="tip-cup">☕</span><p>${esc(t.endLine)}</p><div class="tip-acts"><button class="btn sm" id="end-tip">${esc(t.title)}</button>${fb}</div></div>` : `<div class="tip-card plain"><p>有问题或想法，欢迎告诉我：${fb}</p></div>`;
      const b = el.querySelector('#end-tip'); if (b) b.onclick = TIP.open;
      const a = el.querySelector('#end-fb'); if (a) { const set = () => { a.href = window.FEEDBACK ? FEEDBACK.url() : 'https://github.com/nythen-lab/jiuxianqiao/issues/new'; }; set(); a.onmouseenter = set; a.onclick = set; }
    }
  }
  TIP.mount = el => { if (!el) return; if (st.ready) fill(el); else el.innerHTML = ''; };

  // 玩满几天后，温和地问一次（关掉就永远不再出现）
  TIP.tick = function () {
    try {
      const t = T(); if (!st.on || flagged() || !window.G || !G.S) return;
      const S = G.S(); if (!S || S.ended || G.dayNum() <= t.dayPromptAfterDays) return;
      const m = document.getElementById('modal'); if (!m || !m.classList.contains('hidden')) return;
      if (!document.getElementById('game') || !document.getElementById('game').classList.contains('on')) return;
      if (TIP._pending) return; TIP._pending = true;
      setTimeout(async () => {
        TIP._pending = false;
        const m2 = document.getElementById('modal'); if (flagged() || !m2 || !m2.classList.contains('hidden') || document.querySelector('.fxov, .micro, #mgroot')) return;
        flag(); await TIP.open();
      }, 1800);
    } catch (e) {}
  };
  const r0 = window.UI && UI.render;
  if (r0) UI.render = function () { const r = r0.apply(this, arguments); TIP.tick(); return r; };
})();
