// 勇闯酒仙桥 · 界面与流程
(function () {
  const C = window.CONFIG, ST = C.settings, A = window.ART;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const { hm, pick } = G.util;
  const UI = {}; window.UI = UI;
  let busy = false;

  // ---------- v0.8.1 缩放：画面铺满整个窗口（100vw × 100vh，不出滚动条） ----------
  // 先按「至少 1200×760 的逻辑尺寸」算一个缩放 s，然后舞台的逻辑宽高 = 窗口 / s，正好铺满。
  // 游戏主界面是弹性布局，跟着逻辑宽高走；标题/选人/漫画/结局仍按 1280×800 设计，在舞台里居中再缩一次。
  function fit() {
    const iw = innerWidth, ih = innerHeight;
    // v1.0 手机竖屏：宽屏舞台缩到 0.3 倍没法看，竖屏改走一套单列布局
    const portrait = iw < 800 && ih > iw * 1.12;
    const s = portrait ? Math.max(0.7, Math.min(1.5, iw / 440)) : Math.max(0.5, Math.min(1.25, Math.min(iw / 1200, ih / 760)));
    const W = iw / s, H = ih / s, st = $('#stage');
    st.classList.toggle('portrait', portrait); document.documentElement.classList.toggle('is-portrait', portrait);
    st.style.width = W + 'px'; st.style.height = H + 'px';
    st.style.transform = `scale(${s})`;
    st.style.setProperty('--k', portrait ? 1 : Math.min(W / 1280, H / 800, 1.15));
    st.classList.toggle('narrow', W < 1320);
    st.dataset.lw = Math.round(W); st.dataset.lh = Math.round(H);
    UI.scale = s;
  }
  UI.fit = fit;
  addEventListener('resize', fit);

  // ---------- 弹窗（返回 Promise） ----------
  UI.modal = function (o) {
    return new Promise(res => {
      const m = $('#modal'); m.className = 'modal' + (o.wide ? ' wide' : '') + (o.cls ? ' ' + o.cls : '') + (o.bg ? ' hasbg' : ''); m.style.setProperty('--mbg', o.bg ? `url("${new URL(o.bg, location.href).href}")` : 'none');
      m.innerHTML = `<div class="box">${o.title ? `<h2>${o.title}</h2>` : ''}<div class="mbody">${o.html || ''}</div><div class="mbtns"></div></div>`;
      const bt = m.querySelector('.mbtns');
      (o.buttons || [{ text: '好' }]).forEach((b, i) => {
        const e = document.createElement('button'); e.className = 'btn ' + (b.cls || (i === 0 ? 'primary' : '')); e.textContent = b.text; if (b.disabled) e.disabled = true; if (b.id) e.id = b.id;
        e.onclick = () => { if (b.keep) { b.fn && b.fn(); return; } m.className = 'modal hidden'; m.innerHTML = ''; res(b.value != null ? b.value : i); };
        bt.appendChild(e);
      });
      const mb = m.querySelector('.mbody'); if (mb) mb.scrollTop = 0; m.querySelector('.box').scrollTop = 0;
      if (o.onShow) o.onShow(m, v => { m.className = 'modal hidden'; m.innerHTML = ''; res(v); });
    });
  };
  UI.toast = function (t, cls) { const d = document.createElement('div'); d.className = 'toast ' + (cls || ''); d.textContent = t; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 3200); };
  async function flushQueue() { while (G.queue.length) { const q = G.queue.shift(); if (q.kind === 'goal' && window.FX) { await UI.modal({ title: q.title, cls: 'goal-modal' + (q.big ? ' big' : ''), wide: !!q.big, html: FX.goalCardHTML(q.big), buttons: [{ text: q.big ? '接着干' : '知道了' }] }); continue; } await UI.modal({ title: q.title, html: `<p>${q.text}</p>${effText(q.eff)}` }); } }
  function effText(e) { if (!e) return ''; const n = { stamina: '体力', mental: '精神', hunger: '饱腹', money: '钱', clean: '体面', decency: '体面', rep: '口碑' }; const val = k => k === 'clean' ? (Math.round(e[k] * 0.45) || Math.sign(e[k])) : e[k]; const p = Object.keys(e).filter(k => n[k] && e[k] && val(k)).map(k => `<span class="${val(k) > 0 ? 'up' : 'down'}">${n[k]} ${val(k) > 0 ? '+' : ''}${val(k)}</span>`); return p.length ? `<p class="eff">${p.join(' ')}</p>` : ''; }
  UI.effText = effText;

  // ---------- 屏幕切换 ----------
  UI.show = id => { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); };

  // ---------- 标题 ----------
  UI.title = function () {
    UI.show('title');
    $('#title').innerHTML = `<div class="title-art img" style="background-image:url(${A.IMG.title})"></div><div class="title-shade"></div>
      <div class="title-box"><h1>${ST.title}</h1><p class="sub">${ST.subtitle} · 一条街，日结 · 想玩多久玩多久</p>
      <div class="tbtns">${G.hasAuto() ? '<button class="btn primary" id="t-cont">继续上次</button>' : ''}<button class="btn ${G.hasAuto() ? '' : 'primary'}" id="t-new">新的开始</button>${G.hasSlot() ? '<button class="btn" id="t-slot">读取手动存档</button>' : ''}</div>
      <div class="tip-title-slot" data-tip-slot="title"></div><p class="tiny">地名与人名均为虚构。</p></div>`;
    if (window.TIP) TIP.mount($('#title').querySelector('[data-tip-slot]'));
    $('#t-new').onclick = () => { if (window.Music) Music.start(); UI.select(); };
    if ($('#t-cont')) $('#t-cont').onclick = () => { if (window.Music) Music.start(); G.loadAuto(); UI.enter(); };
    if ($('#t-slot')) $('#t-slot').onclick = () => { if (window.Music) Music.start(); G.loadSlot(); UI.enter(); };
  };

  // ---------- 选身份 ----------
  UI.select = function () {
    UI.show('select');
    $('#select').innerHTML = `<h2 class="sel-h">你是谁？</h2><div class="cards">${C.identities.map(i => `
      <div class="idcard ${i.playable ? '' : 'locked'}" data-id="${i.id}">
        <div class="pt">${A.portrait(i.look)}</div><h3>${i.name} <small>${i.age}岁</small></h3><p class="tag">${i.tag}</p>
        ${i.playable ? `<p class="goal">🎯 ${i.goalText}</p>
        <ul class="mini"><li>体力 ${i.stats.stamina}/${i.maxStamina}</li><li>精神 ${i.stats.mental}</li><li>钱 ¥${i.startMoney}</li><li>脑力 ${i.attrs.brain}</li><li>阅历 ${i.attrs.exp}</li><li>手机 ${i.attrs.phone}</li></ul>
        <button class="btn primary pickid" data-id="${i.id}">就是${i.female ? '她' : '他'}</button>` : `<p class="soon">${i.unlockHint ? '🔒 ' + i.unlockHint : i.unlockAfterWin ? '🔒 用任意身份离开酒仙桥一次后解锁' : '即将推出'}</p>`}
      </div>`).join('')}</div><button class="btn back" id="sel-back">返回</button>`;
    document.querySelectorAll('.pickid').forEach(b => b.onclick = () => { if (window.Music) Music.start(); UI.comic(b.dataset.id); });
    $('#sel-back').onclick = UI.title;
  };

  // ---------- 开场漫画 + 目标卡 ----------
  UI.comic = function (id) {
    const I = C.identities.find(i => i.id === id);
    const panels = I.comic || I.bio || [];
    let k = 0;
    if (window.Music) Music.start();
    UI.show('bio');
    const draw = () => {
      if (k >= panels.length) return drawGoal();
      const P = panels[k];
      const dots = panels.map((_, i) => `<i class="${i === k ? 'on' : ''}"></i>`).join('');
      $('#bio').innerHTML = `<div class="comic-slide">
        <div class="comic-frame"><span class="panel-tag">第 ${k + 1} 格 · ${P.title || ''}</span><div class="comic-img" style="background-image:url(img/comic/${id}-${k + 1}.jpg)"></div></div>
        <p class="comic-cap">${P.text}</p>
        <div class="comic-nav"><div class="comic-dots">${dots}</div>
          <span>${k + 1} / ${panels.length}</span>
          <button class="btn" id="comic-skip">跳过漫画</button>
          <button class="btn primary" id="comic-next">${k === panels.length - 1 ? '看清目标' : '下一格'}</button>
        </div></div>`;
      $('#comic-next').onclick = () => { k++; draw(); };
      $('#comic-skip').onclick = () => { k = panels.length; draw(); };
    };
    const drawGoal = () => {
      const bullets = (I.goalBullets || [I.goalText]).map(b => `<li>${b}</li>`).join('');
      $('#bio').innerHTML = `<div class="goal-card">
        <div class="pt big">${A.portrait(I.look)}</div>
        <div class="gbody">
          <span class="kicker">闯关目标 · 开放日历</span>
          <h2>${I.name} · ${I.age}岁</h2>
          <p class="tag">${I.tag}</p>
          <div class="goal-mega">
            <div class="glabel">你的目标</div>
            <div class="gmain">${I.goalText}</div>
            <ul>${bullets}</ul>
          </div>
          <p class="muted">初始：体力 ${I.stats.stamina}/${I.maxStamina} · 精神 ${I.stats.mental} · 现金 ¥${I.startMoney} · 脑力 ${I.attrs.brain} · 阅历 ${I.attrs.exp}</p>
          <p class="muted">${ST.softPaceTip || '没有天数上限，想玩多久玩多久。'}</p>
          <div class="season-pick"><span>开局季节：</span>${C.seasons.list.map(s => `<button class="btn sm sp${(UI._season || C.seasons.defaultStart) === s.id ? ' on' : ''}" data-season="${s.id}" title="${s.tip}">${s.icon} ${s.name}</button>`).join('')}<small>每 ${C.seasons.daysPer} 天换一季</small></div>
          <button class="btn primary hi-btn" id="comic-go">嗨起来 · 开始闯关</button>
        </div></div>`;
      document.querySelectorAll('.season-pick [data-season]').forEach(b => b.onclick = () => { UI._season = b.dataset.season; document.querySelectorAll('.season-pick .sp').forEach(x => x.classList.toggle('on', x === b)); });
      $('#comic-go').onclick = () => { G.nextSeasonStart = UI._season || C.seasons.defaultStart; G.newGame(id); UI.enter(true); };
    };
    draw();
  };
  // 兼容旧调用名
  UI.bio = UI.comic;

  // ---------- 进入游戏 ----------
  UI.enter = async function (fresh) {
    if (window.Music) Music.start();
    UI.show('game'); UI.render();
    const S = G.S();
    if (S.ended) return UI.ending();
    if (fresh) {
      const lin = C.npcs.find(n => n.id === 'lin');
      await UI.modal({ title: '路口台阶上的老人', html: `<div class="talk"><div class="pt">${A.portrait(lin.look, { mood: 'smile' })}</div><div><b>林叔</b><p>“新来的？天还没亮，先找口吃的。五点钟车一来，人就往上挤，挤到前面才有活。”</p>
        <p class="hint">· 点街上的店面就能走过去（每次 10 分钟）。<br>· 早上 4:00–7:00 在<b>人力市场路口</b>抢白班，下午 4:00–7:30 抢夜班。<br>· 盯着上面的<b>体力、精神、饱腹</b>：体力 ≤10 会眼前一黑、被迫睡过去；饿到 ≤8 必须停下吃饭；体力/饱腹低了手会抖，小游戏更难、更难被招上。精神没了就撑不下去。<br>· 顶栏「🏦 寄钱」随时去银行给家里转账。<br>· 点左上角头像看人物卡和<b>案底</b>情况。存档会自动保存。<br>· 上方金色条是你的<b>闯关目标</b>，别忘了。<br>· <b>没有天数上限</b>，想玩多久玩多久；撑不住了才算输。</p></div></div>`, buttons: [{ text: '记住了' }] });
      // 教程关掉后再亮目标提示，避免被弹窗挡住
      UI.showGoalTip();
    }
  };
  UI.showGoalTip = function () {
    const I = G.identity();
    let tip = document.getElementById('goaltip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'goaltip'; tip.className = 'goaltip'; document.getElementById('game').appendChild(tip); }
    tip.innerHTML = `<b>🎯 记住目标</b>${I.goalText}<button class="btn sm" id="goaltip-ok">知道了</button>`;
    tip.classList.remove('hidden');
    const gm = document.querySelector('.goalmini'); if (gm) gm.classList.add('flash');
    $('#goaltip-ok').onclick = () => { tip.classList.add('hidden'); if (gm) gm.classList.remove('flash'); };
    setTimeout(() => { if (tip && !tip.classList.contains('hidden')) { tip.classList.add('hidden'); if (gm) gm.classList.remove('flash'); } }, 12000);
  };

  // ---------- 渲染 ----------
  UI.render = function () {
    const S = G.S(); if (!S) return;
    const I = G.identity();
    const T = G.TH();
    const lowOf = { sta: S.stats.stamina <= T.staminaLow, men: S.stats.mental <= T.mentalLow, hun: S.stats.hunger <= T.hungerLow, dec: S.stats.clean <= T.cleanLow };
    const bar = (k, label, v, max, cls) => `<div class="stat ${cls}${lowOf[cls] ? ' low' : ''}" title="${label}"><span>${label}</span><div class="sbar"><i style="width:${Math.round(v / max * 100)}%"></i></div><b>${Math.round(v)}</b></div>`;
    const pr = G.goalProgress();
    $('#hud').innerHTML = `<button class="me" id="hud-me" title="人物卡（C）">${A.portrait(A.playerLook(), { bg: '#f2e6cf' })}</button>
      <div class="clock"><div class="dayrow"><div class="day">第 <b>${G.dayNum()}</b> 天</div>${G.season ? `<span class="season-chip s-${G.season().id}" id="hud-season" title="${G.season().tip}（这一季还剩 ${G.seasonDayLeft()} 天）· 点开看四季">${window.LIFE ? LIFE.seasonMini() : G.season().icon}${G.season().name}</span>` : ''}</div>${window.FX ? FX.timeHTML() : `<div class="time"><span class="tclock">${G.clock()}</span><small>${G.phase()}</small></div>`}</div>
      <div class="stats">${bar('stamina', '体力', S.stats.stamina, S.maxSta, 'sta')}${bar('mental', '精神', S.stats.mental, 100, 'men')}${bar('hunger', '饱腹', S.stats.hunger, 100, 'hun')}${bar('dec', '体面', G.decency(), 100, 'dec')}</div>
      <div class="money${S.money < T.moneyLow ? ' low' : ''}">¥ <b id="hud-money">${S.money}</b>${I.goal.type === 'send' ? `<small>${I.goal.debt ? '已还' : '已寄回'} ¥${S.sent}</small>` : ''}${G.owedTotal && G.owedTotal() ? `<small class="owed">被拖欠 ¥${G.owedTotal()}</small>` : ''}</div>
      <button class="btn sm send-btn${I.goal.type === 'send' ? ' gold' : ''}" id="hud-send" title="去银行自助厅转账">🏦 ${I.goal.debt ? '还债' : '寄钱'}</button>
      <div class="rec ${G.hasRecord() ? 'bad' : 'ok'}" id="hud-rec" title="案底状态">${G.hasRecord() ? `⚠ 有案底 ×${S.record.count}` : '✓ 无案底'}</div>
      <div class="goalmini" title="目标进度"><span>🎯 ${pr.text}</span><div class="sbar"><i style="width:${Math.round(Math.min(1, pr.pct) * 100)}%"></i></div></div>
      <button class="btn sm mute" id="hud-mute" title="静音">${(window.Music && Music.muted) ? '🔇' : '🔊'}</button>
      <button class="btn sm album-btn" id="hud-album" title="相册">相册${((S.album ? S.album.length : 0) - (S.albumSeen || 0)) > 0 ? `<i>${S.album.length - (S.albumSeen || 0)}</i>` : ''}</button>
      <div class="hbtns"><button class="btn sm" id="hud-save">存档</button><button class="btn sm" id="hud-load">读档</button><button class="btn sm" id="hud-menu">菜单</button></div>`;
    $('#hud-me').onclick = UI.sheet; $('#hud-rec').onclick = UI.sheet;
    $('#hud-mute').onclick = () => { if (window.Music) { Music.start(); Music.toggleMute(); UI.render(); } };
    $('#hud-album').onclick = () => UI.album();
    $('#hud-send').onclick = () => UI.goSend();
    // 状态警告条（红色闪烁 = 马上要出事）
    let wb = document.getElementById('warns');
    if (!wb) { wb = document.createElement('div'); wb.id = 'warns'; $('#game').appendChild(wb); }
    const cs = G.conds();
    wb.innerHTML = cs.map(c => `<div class="wchip ${c.lv}" data-w="${c.id}" title="${c.tip}"><span class="wi">${c.icon}</span><b>${c.label}</b><small>${c.tip}</small></div>`).join('');
    $('#hud-save').onclick = () => { G.saveSlot(); UI.toast('已存到手动存档'); };
    $('#hud-load').onclick = () => { if (G.loadSlot()) { UI.toast('已读档'); UI.render(); } else UI.toast('还没有手动存档'); };
    $('#hud-menu').onclick = async () => { const r = await UI.modal({ title: '菜单', html: '<p>进度一直在自动保存。</p>', buttons: [{ text: '继续玩' }, { text: '打开相册' }, { text: '回到标题' }, { text: '重新开始（清除进度）', cls: 'danger' }, { text: '手动存档', cls: 'ghost' }, { text: '读取手动存档', cls: 'ghost' }] }); if (r === 1) UI.album(); if (r === 2) UI.title(); if (r === 3) { localStorage.removeItem('jxq_auto_v1'); UI.select(); } if (r === 4) { G.saveSlot(); UI.toast('已存到手动存档'); } if (r === 5) { if (G.loadSlot()) { UI.toast('已读档'); UI.render(); } else UI.toast('还没有手动存档'); } };
    const mapView = S.view !== 'place';
    $('#game').classList.toggle('mapview', mapView);
    if (mapView) {
      $('#scene').innerHTML = A.townMap(S, G, UI.mapBadges());
      if (window.FX) FX.crossfade($('#scene'), '.tm-img', 'map');
      $('#scene').querySelectorAll('.pin[data-pin]').forEach(b => b.onclick = () => UI.go(b.dataset.pin));
      $('#scene').querySelectorAll('.pin[data-lock]').forEach(b => b.onclick = () => UI.toast('还没开放：' + b.title, 'bad'));
    } else {
      $('#scene').innerHTML = A.scene(S, G, UI.people());
      if (window.FX) FX.crossfade($('#scene'), '.scn-img', 'p:' + S.loc);
      const bk = $('#scn-back'); if (bk) bk.onclick = () => UI.toMap();
    }
    $('#scene').querySelectorAll('.bld[data-loc]').forEach(b => b.onclick = () => UI.go(b.dataset.loc));
    $('#scene').querySelectorAll('.bld[data-lock]').forEach(b => b.onclick = () => UI.toast('还没开放：' + b.title));
    $('#scene').querySelectorAll('.spot').forEach(b => b.onclick = () => UI.spot(b.dataset.spot));
    let gb = document.getElementById('gamebg'); if (!gb) { gb = document.createElement('div'); gb.id = 'gamebg'; $('#game').prepend(gb); }
    gb.style.backgroundImage = `url(${A.placeImg(S.loc, G.hourF())})`;
    UI.panel();
    const lg = $('#log'); lg.classList.toggle('open', !!UI.logOpen);
    lg.innerHTML = `<h4>日记<button class="logtog" id="log-tog" title="收起日记">✕</button></h4>` + S.log.slice(-40).reverse().map(l => `<p class="${l.cls}"><small>${l.t}</small> ${esc(l.text)}</p>`).join('');
    $('#log-tog').onclick = () => { UI.logOpen = false; UI.render(); };
    const last = S.log[S.log.length - 1];
    $('#ticker').innerHTML = `<button id="ticker-btn" title="打开日记">📓 <small>${last ? last.t : ''}</small> <span>${last ? esc(last.text) : ''}</span></button>`;
    $('#ticker-btn').onclick = () => { UI.logOpen = !UI.logOpen; UI.render(); };
    if (window.DBG) window.DBG.refresh();
    if (UI._shopOpen) UI.renderClothesShop();
  };

  // ---------- 行动包装 ----------
  async function act(fn) {
    if (busy) return; busy = true;
    const t0 = G.S() ? G.S().time : 0;
    try { await fn(); } catch (e) { console.error(e); }
    if (window.FX && G.S() && !G.S().ended) { FX.timeBeat(t0, G.S().time, UI._beatVerb); }
    UI._beatVerb = null;
    if (G.goalCardTick) G.goalCardTick();
    G.save(); busy = false;
    UI.render();
    await flushQueue();
    await UI.consequences();
    const end = G.checkEnd(); G.save();
    UI.render();
    if (end) return UI.ending();
  }
  UI.act = act;

  // ---------- v0.6：数值的后果（强制睡觉 / 饿 / 崩溃 / 晕倒 / 升级） ----------
  UI.consequences = async function () {
    const S = G.S();
    for (let guard = 0; guard < 4 && !S.ended; guard++) {
      const col = G.collapseCheck();
      if (col) {
        UI.render();
        await UI.modal({ title: col.starve ? '饿晕了' : '眼前一黑', cls: 'forced-modal', html: `<div class="forced"><div class="forced-ic">${col.starve ? '🍚' : '😵'}</div><div>
          <p>${col.starve ? '你已经很久没吃东西了。站起来的一瞬间，耳朵里嗡的一声，' : '你两腿一软，'}倒在了路边。</p>
          <p>醒来时已经躺在卫生室里，医药费 <b>${col.cost} 元</b>。时间过去了 ${ST.collapse.hours} 小时。</p>
          <p class="why bad">已经晕倒 ${col.n} 次，第 ${ST.collapse.maxTimes} 次就扛不住了（游戏结束）。</p></div></div>`, buttons: [{ text: '扶着墙站起来' }] });
        UI.render(); continue;
      }
      const f = G.forcedCheck();
      if (!f) break;
      if (f === 'sleep') {
        const T = G.TH();
        await UI.modal({ title: '腿软了', cls: 'forced-modal', html: `<div class="forced"><div class="forced-ic">😵</div><div>
          <p>体力只剩 <b>${Math.round(S.stats.stamina)}</b>。眼前一阵一阵发黑，腿像灌了铅，扶着墙都站不住。</p>
          <p>你什么都干不了了——<b>必须马上睡</b>。</p>
          <p class="muted">${G.bedValid() ? '还好今天的床位已经付过钱。' : S.money >= Math.max(C.lodging.find(l => l.id === 'upper').price, T.moneyLow) ? `你摸出 ${C.lodging.find(l => l.id === 'upper').price} 块钱，晃到平安旅社，随便要了个上铺。` : '身上的钱连床位都不够，只能倒在自助厅门口。'}</p></div></div>`, buttons: [{ text: '闭上眼睛……' }] });
        const r = G.forceSleep();
        UI.render();
        const fbv = A.bedView(r.where === 'street' ? (G.season && G.season() && G.season().id === 'winter' ? 'street' : 'street') : (G.S().bed && G.S().bed.id) || 'upper');
        await UI.modal({ title: '醒了', cls: 'forced-modal', bg: fbv ? fbv.img : null, html: `<div class="forced"><div class="forced-ic">${r.where === 'street' ? '🥶' : '🛏️'}</div><div>
          <p>一觉睡了 <b>${r.hours} 小时</b>，现在是第 ${G.dayNum()} 天 ${G.clock()}。${r.paid ? `床位花了 ¥${r.paid}。` : ''}</p>
          <p>体力 ${r.gain.sta >= 0 ? '+' : ''}${r.gain.sta}，精神 ${r.gain.men >= 0 ? '+' : ''}${r.gain.men}。${S.stats.hunger <= G.TH().hungerLow ? '<span class="warn">肚子空着，睡也没睡回来多少。</span>' : ''}</p>
          ${r.cold ? `<p class="warn">${C.coldPenalty.text}</p>` : ''}${r.winterText ? `<p class="warn">❄️ ${r.winterText}</p>` : ''}
          ${r.robbed ? `<p class="why bad">迷迷糊糊中有人翻了你的兜——少了 ${r.robbed} 元。</p>` : ''}
          ${r.lostItem ? `<p class="why bad">身上的${r.lostItem}也不见了。</p>` : ''}
          <p class="muted">这段时间里错过的招工，就是错过了。</p></div></div>`, buttons: [{ text: '爬起来' }] });
        UI.render(); continue;
      }
      if (f === 'hunger') {
        const o = G.forceHungerOptions();
        const btns = o.avail.slice(0, 2).map(m => ({ text: `去老马饭馆吃${m.name}（¥${m.price}）`, value: 'eat:' + m.id }));
        btns.push({ text: '蹲在路边熬着（2 小时）', value: 'rest', cls: btns.length ? 'ghost' : 'primary' });
        const v = await UI.modal({ title: '饿得发昏', cls: 'forced-modal', html: `<div class="forced"><div class="forced-ic">🍚</div><div>
          <p>饱腹只剩 <b>${Math.round(S.stats.hunger)}</b>。胃里一阵阵抽，手抖得拿不稳东西，眼前冒金星。</p>
          <p>你<b>必须停下来</b>：要么吃点东西，要么蹲着熬过去。</p>
          <p class="muted">${!o.open ? '这个点饭馆还没开门。' : o.avail.length ? '' : `身上只有 ¥${S.money}，什么也买不起。`}饿着的时候睡觉也回不来体力。</p></div></div>`, buttons: btns });
        if (typeof v === 'string' && v.startsWith('eat:')) { const m = C.menu.find(x => x.id === v.slice(4)); G.forceEat(m); await UI.eatMoment(m, { delta: { hunger: m.hunger, mental: m.mental || 0, stamina: m.stamina || 0 } }); UI.toast(`吃了${m.name}，手不抖了`); }
        else { const gift = G.forceRest(); await UI.modal({ title: '蹲在路边', html: gift ? `<p>一个等活的工友看了你一眼，从塑料袋里掏出${gift}递给你：“吃吧，看你脸都白了。”</p><p class="eff"><span class="up">饱腹 +25</span></p>` : '<p>你蹲在花坛边，看着人来人往，两个小时过去了。肚子还是空的。</p><p class="eff"><span class="down">精神 -3</span></p>' }); }
        UI.render(); continue;
      }
      if (f === 'mental') {
        await UI.modal({ title: '缓不过来', cls: 'forced-modal', html: `<div class="forced"><div class="forced-ic">💔</div><div>
          <p>精神只剩 <b>${Math.round(S.stats.mental)}</b>。你突然什么也不想干，蹲在台阶上，盯着地上的烟头。</p>
          <p>你给家里打了个电话。说着说着就哽住了。</p><p class="muted">过了两个小时，才缓过来一点（精神 +12）。精神到 0，就真的撑不下去了。</p></div></div>`, buttons: [{ text: '擦擦脸' }] });
        G.forceMental(); UI.render(); continue;
      }
    }
    while (S.lvlups && S.lvlups.length) {
      const u = S.lvlups.shift();
      await UI.modal({ title: '手上有数了', cls: 'hook-modal', html: `<div class="story-stamp-card"><div class="stamp big gold">${C.skillNames[u.key]} Lv${u.lv}</div><p>${C.skillFx[u.key]}</p><p class="muted">技能越高，小游戏判定区越宽，招工的人也更愿意要你。</p></div>`, buttons: [{ text: '好' }] });
    }
    G.save();
  };

  UI.go = function (loc) {
    const S = G.S(); if (loc === S.loc) { S.view = 'place'; return UI.render(); }
    const LP = C.places.find(p => p.id === loc); if (!LP || (G.placeOpen && !G.placeOpen(LP))) return UI.toast('还没开放' + (LP && LP.unlockHint ? '：' + LP.unlockHint : ''), 'bad');
    const base = G.travelMin ? G.travelMin(S.loc, loc) : 10;
    act(async () => { const m = Math.round(base * G.slowMult()); G.advance(m); if (m > base) UI.toast(`腿沉，走了 ${m} 分钟`); else UI.toast(`走了 ${m} 分钟`); S.loc = loc; S.view = 'place'; if (loc === 'lottery') S.flags.visitedLottery = 1; if (loc === 'corner' && G.hourF() >= 16 && G.hourF() < 20) G.fireEvents('corner'); if (window.LIFE) await LIFE.onArrive(loc); });
  };

  // ---------- 地点面板 ----------
  UI.panel = function () {
    if (G.S().view !== 'place') return UI.mapSide();
    const S = G.S(), P = C.places.find(p => p.id === S.loc), open = G.isOpen(P);
    const head = `<div class="side-head"><div class="sh-row"><h3>${A.placeIcon(P.id)} ${P.name} <small class="${open ? 'open' : 'shut'}">${open ? '营业中' : '已打烊'}</small></h3></div><p class="pdesc" title="${P.desc}">${P.desc}</p></div>`;
    let h = '';
    const btn = (id, label, sub, cls, extra) => `<button class="act tile ${cls || ''}" data-a="${id}" title="${label}${sub ? ' · ' + String(sub).replace(/"/g, '') : ''}" ${extra || ''}><i class="ic">${UI.actIcon(id)}</i><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;
    const A2 = [];
    if (S.loc === 'corner') {
      const win = G.currentWindow();
      if (win) {
        const offers = G.offers();
        h += `<div class="window">${ST.windows[win].label}</div>${G.dayCondText() ? ` <div class="window warnw">${G.dayCondText()}</div>` : ''}`;
        if (!offers.length) h += `<p class="muted">这会儿没有招工的。再等等，车随时会来。</p>`;
        h += '<div class="offers">';
        offers.forEach(o => { const j = C.jobs.find(x => x.id === o.job), R = C.recruiters[o.recruiter]; const ref = S.refused[o.oid];
          const hi = G.hireInfo(o); const sk = j.skill ? `${C.skillNames[j.skill]} Lv${S.skills[j.skill] || 0}` : '';
          const meta = [`${j.start}–${j.end}`, j.meal ? ('管饭' + ((C.jobMeals && C.jobMeals[j.id]) ? ' · ' + C.jobMeals[j.id].map(m => m.tier).join('+') : '')) : '', `车 ${G.clock(o.gone)} 前走`, sk ? `<span class="skt">用到 ${sk}</span>` : '', j.needClean ? '<span class="need">要求无案底</span>' : ''].filter(Boolean).map(x => `<span>${x}</span>`).join('');
          h += `<div class="offer ${ref ? 'ref' : ''}"><div class="pt s">${A.portrait(R.look)}</div>
            <div class="oinfo"><div class="o-top"><b class="o-job">${j.name}</b><span class="o-who">${R.name}</span><span class="o-pay">¥${o.wage}${o.cut ? `<small>中介抽 ¥${o.cut}</small>` : ''}</span></div>
              <div class="o-quote" title="${R.name}：“${j.shout}”">“${j.shout}”</div><div class="o-meta">${meta}</div></div>
            <button class="btn ${ref ? '' : 'primary'} ask" data-o="${o.oid}" ${ref || hi.block ? 'disabled' : ''}>${ref ? '被拒了' : hi.block ? '干不动' : '上前问'}<small>大约 ${hi.pct}%</small></button></div>`; });
        const blk = G.jobBlock(); if (blk) h += `<p class="why bad">⚠ ${blk}。先去吃饭 / 睡觉。</p>`;
        h += '</div>';
        A2.push(btn('wait30', '再等等', '30 分钟'));
        if (S.flags.chatKey !== S.offers.key) A2.push(btn('chat', '跟旁边等活的人聊几句', '30 分钟 · 每个招工时段一次'));
      } else {
        h += `<p class="muted">现在没什么人招工。早上 4:00–7:00 抢白班，下午 4:00–7:30 抢夜班。</p>`;
        A2.push(btn('wait60', '在花坛边坐着等', '1 小时'));
      }
      const lockedJobs = C.jobs.filter(j => j.locked && !G.isUnlocked('job', j));
      if (lockedJobs.length) h += `<div class="teasers">${lockedJobs.map(j => `<span class="teaser" title="${j.unlockHint || ''}">🔒 ${j.name} <small>${j.unlockHint || '还没开放'}</small></span>`).join('')}</div>`;
      if (G.inHours(C.leftover.from, C.leftover.to)) A2.push(btn('leftover', C.leftover.name, `¥${C.leftover.price} · 可能闹肚子`));
      if (G.freeMentalOk('river')) A2.push(btn('free:river', ST.freeMental.river.label, ST.freeMental.river.sub + ` · 精神+${ST.freeMental.river.mental}`));
    }
    if (G.freeMentalOk('callhome')) A2.push(btn('free:callhome', ST.freeMental.callhome.label, ST.freeMental.callhome.sub + ` · 精神+${ST.freeMental.callhome.mental}`));
    if (S.loc === 'food') {
      // 菜品卡片在 acts 外面单独渲染
    }
    if (S.loc === 'clothes' && open) {
      A2.push(btn('shop', '进店挑衣服', `试穿镜 + 货架 · 正穿着：${G.outfit().name}`, 'gold', 'id="open-clothes"'));
      A2.push(btn('sell', '卖旧衣·旧货', `按原价三到五折收 · 身上零碎也收`));
      A2.push(btn('laundry', C.laundry.name, `¥${C.laundry.price} · 把衣服洗一遍 · 1小时 · 体面 ${G.decency()} → ${Math.max(0, Math.min(100, Math.round(G.outfit().decency + C.laundry.clean * 0.45 - 20)))}`));
    }
    if (S.loc === 'riverside' && open) {
      const R = C.riverside;
      if (G.inHours(R.karaoke.from, R.karaoke.to)) A2.push(btn('karaoke', R.karaoke.name, `¥${R.karaoke.price} · 20 分钟 · 精神+${R.karaoke.mental}`));
      A2.push(btn('fish', R.fish.name, `1 小时 · 免费 · 精神+${R.fish.mental} · 可能碰到熟人`));
    }
    if (S.loc === 'inn' || S.loc === 'netcafe' || S.loc === 'dormtower' || S.loc === 'home') {
      if (G.bedValid()) { const L = C.lodging.find(l => l.id === S.bed.id); h += `<div class="window">已付钱：${L.name}（到 ${G.clock(S.bed.until)}）</div>`; }
      if (S.loc === 'netcafe') { const g = C.netcafe.game; A2.push(btn('netgame', g.name, `¥${g.price} · 2 小时 · 精神+${g.mental} · 体力${g.stamina} · 饱腹${g.hunger}`)); }
      if (S.loc === 'inn' && C.room) {
        if (G.roomOwned()) { const left = G.roomDaysLeft(); A2.push(btn('room', '我的房间', `${left > 0 ? `月租还剩 ${left} 天` : '⚠️ 房租到期了'} · 花草 ${(S.room.pots || []).filter(p => !p.dead).length} 盆`, 'gold'));
          if (left <= C.room.warnDays) A2.push(btn('rent', '续租一个月', `¥${C.room.price} / ${C.room.days} 天${left <= 0 ? ' · 再不交要被清屋' : ''}`, left <= 0 ? 'warn' : '')); }
        else A2.push(btn('rent', '租月租单间', `¥${C.room.price} / ${C.room.days} 天 · 合 ¥${Math.round(C.room.price / C.room.days)} 一晚 · 有锁 · 能养花`));
      }
      C.lodging.filter(l => l.where === S.loc && !(l.monthly && !G.roomOwned())).forEach(l => A2.push(btn('sleep:' + l.id, `睡${l.name}`, `${G.bedValid() && S.bed.id === l.id ? '已付' : '¥' + l.price} · 每小时体力+${l.recover.stamina} · ${l.stealRisk ? '可能被偷' : '安全'} · ${l.note}`)));
    }
    if (S.loc === 'bar') {
      if (open) { A2.push(btn('beer', C.bar.beer.name, `¥${C.bar.beer.price} · 精神+${C.bar.beer.mental} · 今晚喝了 ${S.beersTonight} 瓶`)); A2.push(btn('skewer', C.bar.skewer.name, `¥${C.bar.skewer.price} · 饱腹+${C.bar.skewer.hunger} · 能和工友聊聊`)); }
    }
    let lifeP = { acts: [], html: '', top: '' }; if (window.LIFE) { lifeP = LIFE.panel(S.loc, btn, open); lifeP.acts.forEach(x => A2.push(x)); }
    if (S.loc === 'lottery' && open) {
      const L = C.lotteryShop, lt = S.lottery || { spent: 0, won: 0, n: 0, day: 0 }; const n = lt.day === G.dayNum() ? lt.n : 0; const net = (lt.won || 0) - (lt.spent || 0);
      h += `<div class="window ${net < 0 ? 'warnw' : ''}">一共花了 ¥${lt.spent || 0} · 中回 ¥${lt.won || 0} · 净${net >= 0 ? '赚' : '亏'} ¥${Math.abs(net)}</div>`;
      A2.push(btn('scratch', '买一张刮刮乐', `四种票 ¥2–20 · 今天刮了 ${n}/${L.maxPerDay} 张 · 大多数是谢谢惠顾`, 'risk'));
      A2.push(btn('wait30', '坐在店里避避风', '30 分钟 · 不花钱'));
    }
    if (S.loc === 'clinic' && open) C.clinicServices.forEach(sv => A2.push(btn('clinic:' + sv.id, sv.name, `¥${sv.price} · ${Math.round(sv.minutes / 6) / 10} 小时 · 体力+${sv.stamina}${sv.mental ? ` · 精神+${sv.mental}` : ''}${sv.clearDebuff ? ' · 治腰酸背痛' : ''}`)));
    if (S.loc === 'agency' && open) {
      C.agencyServices.forEach(sv => { const c = (S.certs || {})[sv.id]; A2.push(btn('agency:' + sv.id, sv.name, c ? (c.done ? '已经办下来了' : `办理中，第 ${c.ready} 天来拿`) : `¥${sv.price} · ${sv.days} 天出证${sv.needCleanRecord ? ' · 要求无案底' : ''}`, c ? 'dim' : '')); });
      A2.push(btn('board', '看看白板上的工价', '15 分钟 · 心里有个数'));
    }
    if (S.loc === 'bank') {
      { const isGoal = G.identity().goal.type === 'send'; A2.push(btn('send', G.identity().goal.debt ? '转账还债' : '给家里转账', `${isGoal ? `${G.identity().goal.debt ? '已还' : '已寄回'} ¥${S.sent} / ¥${G.identity().goal.amount} · ` : '不算进目标，转了心里踏实点 · '}${ST.bank.feeText}${S.attrs.phone < 4 ? ' · 你不太会用，得多花点时间' : ''}`, 'gold')); }
      { const sh = C.lodging.find(l => l.id === 'shelter'); if (sh && G.season() && G.season().id === sh.season) A2.push(btn('sleep:shelter', '去冬季救助站过夜', G.shelterOk() ? '免费 · 给一碗热粥 · 隔一晚才能再去' : '这两天去过了，得让给别人', G.shelterOk() ? 'gold' : 'dim')); }
      A2.push(btn('sleep:street', '在自助厅门口打地铺', G.season() && G.season().noStreet ? '❄️ 冬天睡不了，会冻坏 · 去旅社或网吧' : `免费 · 每小时体力+4 · ${G.outfit().warm ? '有厚衣服挡风' : '没有厚衣服会冻着'} · 可能被偷`, G.season() && G.season().noStreet ? 'dim' : ''));
      const pr = G.goalProgress(), g = G.identity().goal;
      const canLeave = G.canLeave();
      let leaveHint = '完成目标后才能走';
      if (canLeave) leaveHint = '目标达成，可以走了';
      else if (g.type === 'send') leaveHint = `还差 ¥${Math.max(0, g.amount - G.S().sent)} ${g.debt ? '没还' : '寄回家'}`;
      else if (g.minDays && G.dayNum() < g.minDays) leaveHint = `至少再待到第 ${g.minDays} 天（现在第 ${G.dayNum()} 天）`;
      else if (g.minDays && G.dayNum() === g.minDays && G.hourF() < 12) leaveHint = '今天中午以后才能走';
      else leaveHint = `还差：${pr.text}`;
      A2.push(btn('leave', '坐车离开酒仙桥', leaveHint, canLeave ? 'gold' : 'dim'));
    }
    // 顺手牵羊
    G.theftTargets().forEach(t => A2.push(btn('pick:' + t.id, '顺手牵羊', `${t.name} · 有风险 · 被抓留案底`, 'risk')));
    if (S.loc === 'inn' && G.hourF() >= 22 || S.loc === 'inn' && G.hourF() < 4) if (!G.theftTargets().length && !(G.bedValid() && C.lodging.find(l => l.id === S.bed.id).canPick)) h += `<p class="muted tiny">（先付钱住床位，夜里才进得了床位房。）</p>`;
    if (G.scrapOk()) A2.push(btn('scrap', '捡瓶子废品', `2 小时 · 能换 ${C.broke.scrap.money[0]}–${C.broke.scrap.money[1]} 元 · 体力${C.broke.scrap.stamina}`));
    if (G.oddjobOk()) A2.push(btn('oddjob', '帮饭馆打杂换饭', `1.5 小时 · 管一顿（饱腹+${C.broke.oddjob.hunger}）· 大约 ${Math.round(G.oddjobP() * 100)}%`));
    if (G.borrowOk()) A2.push(btn('borrow', '找熟人借钱', (S.debts || []).some(d => !d.paid) ? `还欠 ¥${G.owedDebt()} · 也能在这儿还` : `${C.broke.borrow.amount[0]}–${C.broke.borrow.amount[1]} 元 · 看交情 · ${C.broke.borrow.dueDays} 天内还`));
    A2.push(btn('rest', '原地歇一会儿', `1 小时 · 体力+${Math.round(5 * G.hungerRegenMult())}${G.hungerRegenMult() < 1 ? '（饿着，恢复少）' : ''}`));
    let shop = '';
    if (S.loc === 'food' && open) shop = UI.foodShopHtml();
    if (S.loc === 'clothes' && open) shop = UI.clothesEntryHtml();
    if (S.loc === 'bar' && open) {
      // 烧烤也用菜品卡
    }
    // v0.8.1 手里没钱：几条路（都在这一格里说清楚）
    if (G.isBroke()) {
      const opts = ['卖旧衣/旧货（服装店）', '捡瓶子（路口、银行门口、烧烤摊、河边）', '帮饭馆打杂换一顿饭', '找熟人借钱', '去后厨洗碗（饿着也能去，管饭）', '睡自助厅门口（免费）', '夜里顺手牵羊（有风险）'];
      h = `<div class="broke-chip"><b>手里没钱？可以……</b><span>${opts.map(x => `<i>${x}</i>`).join('')}</span></div>` + h;
    }
    if ((S.debts || []).some(d => !d.paid)) h = `<div class="window ${(S.debts || []).some(d => !d.paid && G.dayNum() > d.due) ? 'warnw' : ''}">欠着钱：${S.debts.filter(d => !d.paid).map(d => `${d.name} ¥${d.amt}（第${d.due}天前还）`).join('、')}</div>` + h;
    const pn = $('#panel'); const keep = pn.dataset.loc === S.loc ? pn.scrollTop : 0;
    pn.innerHTML = head + `<div class="act-grid">${A2.join('')}</div>` + `<div class="ctx">${lifeP.top}${h}${lifeP.html}${shop}</div>`; pn.scrollTop = keep; pn.dataset.loc = S.loc;
    if ($('#open-map')) $('#open-map').onclick = () => UI.map();
    UI.bindBedPreview();
    $('#panel').querySelectorAll('.act').forEach(b => b.onclick = () => UI.doAct(b.dataset.a));
    $('#panel').querySelectorAll('.ask').forEach(b => b.onclick = () => UI.ask(b.dataset.o));
    $('#panel').querySelectorAll('[data-food]').forEach(b => b.onclick = (e) => { e.stopPropagation(); UI.foodFlow(b.dataset.food); });
    const oc = $('#panel').querySelector('#open-clothes'); if (oc) oc.onclick = () => UI.openClothesShop();
    $('#panel').querySelectorAll('[data-wear]').forEach(b => b.onclick = (e) => { e.stopPropagation(); UI.wearCloth(b.dataset.wear); });
  };

  UI.foodShopHtml = function () {
    const S = G.S();
    const cards = C.menu.filter(m => G.inHours(m.from, m.to === '24:00' ? '23:59' : m.to)).map(m => {
      const can = S.money >= m.price;
      const fx = [`饱腹+${m.hunger}`];
      if (m.stamina) fx.push(`体力+${m.stamina}`);
      if (m.mental) fx.push(`精神+${m.mental}`);
      return `<button class="shop-card food-card ${can ? '' : 'dim'}" data-food="${m.id}">
        <div class="sc-art">${A.dish(m)}</div>
        <div class="sc-body"><b>${m.name}</b><span class="price">¥${m.price}</span>
        <small class="fx">${fx.join(' · ')}</small>
        <small class="note">${m.note || ''}</small></div>
      </button>`;
    }).join('');
    return `<div class="shop food-shop"><div class="shop-head"><b>今日菜单</b><small>点开能看见菜，吃下去有感觉</small></div><div class="shop-cards">${cards}</div></div>`;
  };

  UI.clothesShopHtml = function () {
    const S = G.S();
    const previewId = S.flags.tryOn || S.outfit;
    const preview = C.clothes.find(c => c.id === previewId) || G.outfit();
    const look = A.playerLook(preview);
    const tiers = ['cheap', 'mid', 'expensive'];
    const owned = C.clothes.filter(c => S.owned.includes(c.id));
    let cards = '';
    tiers.forEach(t => {
      const list = C.clothes.filter(c => c.tier === t && !c.hidden);
      if (!list.length) return;
      cards += `<div class="tier-label">${C.tierNames[t] || t}</div>`;
      list.forEach(c => {
        const own = S.owned.includes(c.id);
        const on = S.outfit === c.id;
        const trying = previewId === c.id;
        const can = own || S.money >= c.price;
        const fx = [`体面 ${c.decency}`];
        if (c.warm) fx.push('保暖');
        if (c.guard || (c.hire && c.hire.guard)) fx.push('保安加分');
        if (c.hire && (c.hire.food || c.hire.antigen)) fx.push('进厂加分');
        if (c.hire && c.hire.courier) fx.push('招工加分');
        if (c.mental) fx.push('精神+' + c.mental);
        cards += `<div class="shop-card cloth-card ${trying ? 'trying' : ''} ${on ? 'on' : ''} ${can ? '' : 'dim'}" data-try="${c.id}">
          <div class="sc-art">${A.clothThumb(c)}</div>
          <div class="sc-body"><b>${c.name}</b><span class="price">${own ? (on ? '正穿着' : '已拥有') : '¥' + c.price}</span>
          <small class="fx">${fx.join(' · ')}</small>
          <small class="note">${c.note || ''}</small>
          <div class="sc-btns">
            <button class="btn sm" data-try="${c.id}">试穿</button>
            ${own
              ? (on ? '<button class="btn sm" disabled>穿着中</button>' : `<button class="btn sm primary" data-wear="${c.id}">换上</button>`)
              : `<button class="btn sm primary" data-buycloth="${c.id}" ${can ? '' : 'disabled'}>买下</button>`}
          </div></div>
        </div>`;
      });
    });
    const wardrobe = owned.length ? `<div class="wardrobe"><b>我的衣柜</b> ${owned.map(c => `<button class="wchip ${S.outfit === c.id ? 'on' : ''}" data-try="${c.id}">${c.name}${S.outfit === c.id ? ' ✓' : ''}</button>`).join('')}</div>` : '';
    const pOwn = S.owned.includes(preview.id), pOn = S.outfit === preview.id;
    const pBtn = pOwn ? (pOn ? '<button class="btn" disabled>正穿着</button>' : `<button class="btn primary" data-wear="${preview.id}">换上这件</button>`)
      : `<button class="btn primary" data-buycloth="${preview.id}" ${S.money >= preview.price ? '' : 'disabled'}>买下（¥${preview.price}）</button>`;
    return `<div class="shopwin">
      <aside class="tryon-stage">
        <div class="ts-title">试穿镜</div>
        <div class="tryon-fig">${A.outfitBody(look, preview, { glow: true, w: 200, h: 290 })}</div>
        <div class="tryon-meta">
          <div class="tm-try">试穿中：<b>${preview.name}</b> <span class="tier-tag">${C.tierNames[preview.tier] || ''}</span></div>
          <div class="tm-fx">体面 ${preview.decency}${preview.warm ? ' · 保暖' : ''}${preview.note ? ' · ' + preview.note : ''}</div>
          <div class="tm-now">正穿着：<b>${G.outfit().name}</b> · 体面 ${G.outfit().decency}</div>
          <div class="tm-act">${pBtn}</div>
        </div>
        ${wardrobe}
      </aside>
      <section class="rack">
        <div class="shop-head"><div class="tabs"><button class="tab ${UI._shopTab === 'sell' ? '' : 'on'}" id="tab-buy">买衣服</button><button class="tab ${UI._shopTab === 'sell' ? 'on' : ''}" id="tab-sell">卖旧衣 · 旧货</button></div><small>${UI._shopTab === 'sell' ? '老板按原价三到五折收，品牌货保值；穿得越久越不值钱' : '点衣服或「试穿」在左边镜子里看上身，满意再「买下」'} · 兜里 ¥${S.money}</small><button class="btn sm ghost" id="shop-close">离开 ✕</button></div>
        <div class="rack-scroll">${UI._shopTab === 'sell' ? UI.sellHtml() : `<div class="shop-cards cloth-grid">${cards}</div>`}</div>
      </section>
    </div>`;
  };

  // 衣服店入口：面板里只放一个入口，货架和试穿镜在全屏的店内窗口里，互不遮挡
  UI.clothesEntryHtml = function () {
    const S = G.S();
    const owned = C.clothes.filter(c => S.owned.includes(c.id));
    return `<div class="shop clothes-entry">
      ${owned.length > 1 ? `<div class="wardrobe"><b>我的衣柜</b> ${owned.map(c => `<button class="wchip ${S.outfit === c.id ? 'on' : ''}" data-wear="${c.id}">${c.name}</button>`).join('')}</div>` : ''}
    </div>`;
  };

  UI.openClothesShop = function () { UI._shopOpen = true; UI.renderClothesShop(); };
  UI.closeClothesShop = function () { UI._shopOpen = false; UI._shopTab = 'buy'; const o = $('#shopov'); if (o) { o.className = 'hidden'; o.innerHTML = ''; } };
  UI.renderClothesShop = function () {
    const S = G.S();
    let o = $('#shopov');
    if (!o) { o = document.createElement('div'); o.id = 'shopov'; $('#stage').appendChild(o); }
    if (!UI._shopOpen || !S || S.loc !== 'clothes' || !G.isOpen(C.places.find(p => p.id === 'clothes'))) { UI.closeClothesShop(); return; }
    const keep = o.querySelector('.rack-scroll') ? o.querySelector('.rack-scroll').scrollTop : 0;
    o.className = 'on';
    o.innerHTML = UI.clothesShopHtml();
    const rs = o.querySelector('.rack-scroll'); if (rs) rs.scrollTop = keep;
    o.querySelector('#shop-close').onclick = () => UI.closeClothesShop();
    o.querySelectorAll('[data-try]').forEach(b => b.onclick = (e) => { e.stopPropagation(); S.flags.tryOn = b.dataset.try; UI.renderClothesShop(); });
    o.querySelectorAll('[data-buycloth]').forEach(b => b.onclick = (e) => { e.stopPropagation(); UI.clothFlow(b.dataset.buycloth); });
    o.querySelectorAll('[data-wear]').forEach(b => b.onclick = (e) => { e.stopPropagation(); UI.wearCloth(b.dataset.wear); });
    o.querySelector('#tab-buy').onclick = () => { UI._shopTab = 'buy'; UI.renderClothesShop(); };
    o.querySelector('#tab-sell').onclick = () => { UI._shopTab = 'sell'; UI.renderClothesShop(); };
    o.querySelectorAll('[data-sell]').forEach(b => b.onclick = (e) => { e.stopPropagation(); UI.sellFlow('cloth', b.dataset.sell); });
    o.querySelectorAll('[data-sellitem]').forEach(b => b.onclick = (e) => { e.stopPropagation(); UI.sellFlow('item', b.dataset.sellitem); });
  };
  UI.sellHtml = function () {
    const S = G.S(), L = G.sellables();
    const cl = L.clothes.map(x => `<div class="shop-card cloth-card sell-card ${x.q.ok ? '' : 'dim'}" data-try="${x.id}">
        <div class="sc-art">${A.clothThumb(x.c)}</div>
        <div class="sc-body"><b>${x.c.name}</b><span class="price">${x.q.ok ? '收 ¥' + x.q.price : x.q.worn ? '正穿着' : '不值钱'}</span>
        <small class="note">${x.q.ok ? `原价 ¥${x.c.price || 0}` : x.q.err}</small>
        <div class="sc-btns">${x.q.ok ? `<button class="btn sm primary" data-sell="${x.id}">卖掉 ¥${x.q.price}</button>` : x.q.worn ? '<button class="btn sm" disabled>先换上别的</button>' : '<button class="btn sm" disabled>不收</button>'}</div></div></div>`).join('');
    const it = L.items.map(x => `<div class="shop-card sell-card"><div class="sc-art sell-art item">${{ '烟': '🚬', '手套': '🧤', '打火机': '🔥' }[x.name] || '📦'}</div><div class="sc-body"><b>${x.name} ×${x.n}</b><span class="price">收 ¥${x.price}</span><small class="note">${x.note || ''}</small><div class="sc-btns"><button class="btn sm primary" data-sellitem="${x.name}">卖一个 ¥${x.price}</button></div></div></div>`).join('');
    return `<div class="tier-label">我的衣服</div><div class="shop-cards cloth-grid">${cl}</div><div class="tier-label">身上的零碎（旧货收购）</div>${it ? `<div class="shop-cards cloth-grid">${it}</div>` : '<p class="muted">身上没什么能卖的零碎。烟、手套、打火机这些都收。</p>'}`;
  };
  UI.wearCloth = function (id) {
    const S = G.S(); S.flags.tryOn = id;
    act(async () => { const r = G.buyClothes(C.clothes.find(c => c.id === id)); if (r && r.err) UI.toast(r.err, 'bad'); else UI.toast('换好了'); });
  };

  UI.foodFlow = function (id) {
    act(async () => {
      const S = G.S();
      const m = C.menu.find(x => x.id === id);
      if (!m) return;
      if (S.money < m.price) return UI.toast('钱不够。', 'bad');
      const fx = [];
      if (m.hunger) fx.push(`<span class="up">饱腹 +${m.hunger}</span>`);
      if (m.stamina) fx.push(`<span class="up">体力 +${m.stamina}</span>`);
      if (m.mental) fx.push(`<span class="up">精神 +${m.mental}</span>`);
      const go = await UI.modal({
        title: m.name,
        cls: 'food-modal',
        html: `<div class="food-preview">
          <div class="fp-art">${A.dish(m)}</div>
          <div class="fp-info">
            <p class="price-lg">¥${m.price}</p>
            <p class="fx">${fx.join(' ')}</p>
            <p class="muted">${m.note || ''}</p>
            <p class="flavor-hint">「${(m.flavor || '吃一口再说。').slice(0, 24)}…」</p>
          </div>
        </div>`,
        buttons: [{ text: `吃下去（¥${m.price}）` }, { text: '算了', cls: 'ghost' }]
      });
      if (go === 1) return;
      const r = G.buyFood(m);
      if (r && r.err) return UI.toast(r.err, 'bad');
      await UI.eatMoment(m, r);
    });
  };

  UI.eatMoment = async function (m, r) {
    const delta = (r && r.delta) || { hunger: m.hunger, mental: m.mental || 0, stamina: m.stamina || 0 };
    if (window.FX) await FX.eat(m, delta);
    const chips = [];
    if (delta.hunger) chips.push(`<i class="chip up pop">饱腹 +${delta.hunger}</i>`);
    if (delta.stamina) chips.push(`<i class="chip up pop">体力 +${delta.stamina}</i>`);
    if (delta.mental) chips.push(`<i class="chip up pop">精神 +${delta.mental}</i>`);
    if (delta.hunger < 0) chips.push(`<i class="chip down pop">饱腹 ${delta.hunger}</i>`);
    await UI.modal({
      title: '下肚了',
      cls: 'eat-moment',
      html: `<div class="eat-stage">
        <div class="plate">${A.dish(m)}</div>
        <p class="flavor">「${m.flavor || '嗯，还行。'}」</p>${m.text ? `<p class="muted tiny">${m.text}</p>` : ''}
        <div class="eat-chips">${chips.join('')}</div>
      </div>`,
      buttons: [{ text: '擦擦嘴' }]
    });
  };

  UI.clothFlow = function (id) {
    act(async () => {
      const S = G.S();
      const c = C.clothes.find(x => x.id === id);
      if (!c) return;
      S.flags.tryOn = c.id;
      const look = A.playerLook(c);
      const fx = [`体面 ${c.decency}`];
      if (c.warm) fx.push('保暖');
      if (c.hire) Object.keys(c.hire).forEach(k => { const j = C.jobs.find(x => x.id === k); if (j) fx.push(`${j.name}+${Math.round(c.hire[k]*100)}%`); });
      if (c.mental) fx.push(`精神+${c.mental}`);
      if (c.cleanBonus) fx.push(`体面+${Math.max(1, Math.round(c.cleanBonus * 0.45))}`);
      const go = await UI.modal({
        title: '试穿 · ' + c.name,
        wide: true,
        cls: 'tryon-modal',
        html: `<div class="tryon-modal-body">
          <div class="tm-big">${A.outfitBody(look, c, { glow: true, w: 180, h: 260 })}</div>
          <div class="tm-side">
            <p class="price-lg">${S.owned.includes(c.id) ? '已拥有' : '¥' + c.price}</p>
            <p class="fx">${fx.join(' · ')}</p>
            <p class="muted">${c.note || ''}</p>
            <p class="tier-tag">${(C.tierNames[c.tier] || '')}</p>
            <div class="tm-compare">
              <div class="mini">${A.outfitBody(A.playerLook(G.outfit()), G.outfit(), { w: 100, h: 150 })}<small>现在：${G.outfit().name}</small></div>
              <div class="arrow">→</div>
              <div class="mini">${A.outfitBody(look, c, { w: 100, h: 150 })}<small>试穿：${c.name}</small></div>
            </div>
          </div>
        </div>`,
        buttons: [
          S.owned.includes(c.id)
            ? { text: S.outfit === c.id ? '穿着中' : '换上', disabled: S.outfit === c.id }
            : { text: `买下（¥${c.price}）`, disabled: S.money < c.price },
          { text: '再看看', cls: 'ghost' }
        ]
      });
      if (go === 1) return;
      const wasOwned = S.owned.includes(c.id); const before = G.decency();
      const r = G.buyClothes(c);
      if (r && r.err) return UI.toast(r.err, 'bad');
      S.flags.tryOn = c.id;
      if (window.FX) {
        if (!wasOwned) await FX.micro('cloth_pay', { amount: c.price });
        const dd = G.decency() - before; const tags = [`体面 ${c.decency}`]; if (c.warm) tags.push('保暖');
        await FX.micro('mirror', { bg: A.IMG.place('clothes'), fig: A.outfitBody(A.playerLook(c), c, { w: 160, h: 230 }), tags, verdict: dd > 4 ? '镜子里的人，看着像个能被雇的人了。' : dd < -2 ? '有点不像自己。可暖和。' : '嗯。这身行。' });
      }
      UI.toast(r.owned ? `换上了${c.name}` : `买下并穿上了${c.name}`);
    });
  };


  // ---------- v0.9 统一图标 ----------
  const ICONS = { rent: '🔑', room: '🪴', wait30: '⏳', wait60: '⏳', chat: '💬', leftover: '🍱', 'free:river': '🎤', 'free:callhome': '📞', 'free:riverwalk': '🌊', laundry: '🧺', netgame: '🎮',
    'sleep:street': '🧱', beer: '🍺', skewer: '🍢', scratch: '🎟️', board: '📋', send: '🏦', leave: '🚌', rest: '🪑', scrap: '🥤', oddjob: '🧽', borrow: '🤝',
    shop: '🧥', sell: '💴', karaoke: '🎤', fish: '🎣' };
  UI.actIcon = id => ICONS[id] || (id.startsWith('sleep:') ? '🛏️' : id.startsWith('pick:') ? '🤏' : id.startsWith('clinic:') ? '💊' : id.startsWith('agency:') ? '📄' : id.startsWith('free:') ? '🌿' : '•');

  // ---------- v0.9 画面上的人物热点 ----------
  UI.people = function () {
    const S = G.S(), out = [];
    if (S.loc === 'corner' && G.currentWindow()) {
      const seen = {};
      G.offers().forEach(o => { if (seen[o.recruiter]) return; seen[o.recruiter] = 1; const R = C.recruiters[o.recruiter], j = C.jobs.find(x => x.id === o.job); out.push({ kind: 'rec', key: o.oid, name: R.name.replace(/（.*）/, ''), look: R.look, sub: `${j.name} ¥${o.wage}`, tip: `${R.name}：${j.shout}` }); });
    }
    const TALK_AT = { bar: 1, food: 1, riverside: 1, netcafe: 1, corner: 1, dormtower: 1 };
    if (TALK_AT[S.loc] && G.isOpen(C.places.find(p => p.id === S.loc)) && (S.flags.spotDay || {})[S.loc] !== G.dayNum() && out.length < 3) {
      const list = G.npcList().filter(n => (n.where || []).includes(S.loc) && S.npc[n.key] && S.npc[n.key].talk < n.talks.length);
      if (list.length) { const n = list[(G.dayNum() * 7 + S.loc.length) % list.length]; out.push({ kind: 'npc', key: n.key, name: n.name, look: n.look, sub: '过去聊两句', tip: `${n.name}在这儿，过去聊两句（30 分钟）` }); }
    }
    return out.slice(0, 3);
  };
  UI.spot = function (sp) {
    const S = G.S(); const i = sp.indexOf(':'); const kind = sp.slice(0, i), key = sp.slice(i + 1);
    if (kind === 'rec') { const card = document.querySelector(`.offer .ask[data-o="${key}"]`); if (card) { const o = card.closest('.offer'); o.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); o.classList.remove('flash'); void o.offsetWidth; o.classList.add('flash'); } return; }
    if (kind === 'npc') return act(async () => { S.flags.spotDay = S.flags.spotDay || {}; S.flags.spotDay[S.loc] = G.dayNum(); G.advance(30); const n = G.npcList().find(x => x.key === key); const P = C.places.find(p => p.id === S.loc); if (n) await UI.talk(n, P.name); });
  };

  // ---------- v0.9 酒仙桥镇地图（主界面）----------
  UI.toMap = function () { G.S().view = 'map'; UI.render(); };
  UI.map = UI.toMap;
  // 地图上图钉的小角标：路口招工中、今天有熟人在
  UI.mapBadges = function () {
    const S = G.S(), b = {}; const win = G.currentWindow ? G.currentWindow() : null;
    if (win) b.corner = '招工中';
    const ppl = ['bar', 'food', 'riverside', 'netcafe', 'dormtower'];
    ppl.forEach(l => { if (((S.flags.spotDay || {})[l]) !== G.dayNum() && G.isOpen(C.places.find(p => p.id === l) || {}) && G.isUnlocked('place', C.places.find(p => p.id === l) || {})) { const h = (G.dayNum() * 7 + l.length * 3) % 4; if (h === 0) b[l] = '有熟人'; } });
    if (G.roomOwned && G.roomOwned()) b.inn = b.inn || '我的房间';
    return b;
  };
  // 地图模式的右栏：你在哪、进去、各处多远
  UI.mapSide = function () {
    const S = G.S(), P = C.places.find(p => p.id === S.loc); const sea = G.season ? G.season() : null;
    const rows = C.places.filter(p => C.townMap.pins[p.id]).map(p => {
      const unl = G.isUnlocked('place', p), here = p.id === S.loc, o = G.isOpen(p);
      if (!unl) return `<div class="mrow locked" title="${p.unlockHint || ''}"><i>🔒</i><b>？？？</b><small>${p.unlockHint || '还没开放'}</small></div>`;
      return `<button class="mrow${here ? ' here' : ''}${o ? '' : ' shut'}" data-go="${p.id}"><i>${A.placeIcon(p.id)}</i><b>${A.placeShort(p.id)}</b><small>${here ? '你在这儿' : G.travelMin(S.loc, p.id) + ' 分钟'}${o ? '' : ' · 已打烊'}</small></button>`;
    }).join('');
    const win = G.currentWindow ? G.currentWindow() : null;
    const tips = [win ? `👷 ${ST.windows[win].label}：路口正在招工` : `👷 招工时段：早上 4:00–7:00、下午 4:00–7:30（路口）`];
    if (sea) tips.push(`${sea.icon} ${sea.name}：${sea.tip}`);
    if (G.isBroke && G.isBroke()) tips.push('🪙 手里没钱？路口能借钱、捡瓶子，饭馆能打杂换饭。');
    $('#panel').innerHTML = `<div class="side-head"><div class="sh-row"><h3>🗺 酒仙桥镇</h3></div><p class="pdesc">你在 <b>${P.name}</b>。点地图上的地方走过去，进去以后再干活、吃饭、睡觉。</p></div>
      <button class="btn primary big enter-here" id="enter-here">${A.placeIcon(P.id)} 进入${A.placeShort(P.id)} →</button>
      <ul class="map-tips">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="mrows">${rows}</div>`;
    $('#enter-here').onclick = () => { S.view = 'place'; UI.render(); };
    $('#panel').querySelectorAll('[data-go]').forEach(b => b.onclick = () => UI.go(b.dataset.go));
  };
  // 旧的网格地图（留作弹窗版）
  UI.mapModal = function () {
    const S = G.S();
    UI.modal({ title: '🗺 去别处', wide: true, cls: 'map-modal', html: `<div class="map-grid">${A.mapTiles(S, G, true)}</div><p class="muted tiny">走到别处一般要 10 分钟；锁着的地方，满足条件后会自己亮起来。</p>`,
      buttons: [{ text: '就在这儿' }],
      onShow: (m, close) => {
        m.querySelectorAll('.map-grid .bld[data-loc]').forEach(b => b.onclick = () => { close(0); UI.go(b.dataset.loc); });
        m.querySelectorAll('.map-grid .bld[data-lock]').forEach(b => b.onclick = () => UI.toast('还没开放：' + b.title));
      } });
  };

  // ---------- v0.8.1 借钱 ----------
  UI.borrowFlow = function () {
    const S = G.S();
    const L = G.lenders(), debts = (S.debts || []).map((d, i) => ({ d, i })).filter(x => !x.d.paid);
    const rows = L.map(x => `<div class="lend-row"><span class="pt card">${A.portrait(x.n.look)}</span><div class="lr-body"><b>${x.n.name}</b><small>好感 ${x.aff}${x.owe ? ` · 还欠他 ¥${x.owe.amt}` : ''}</small><div class="sbar"><i style="width:${x.aff}%"></i></div></div>
      <button class="btn ${x.asked || x.p <= 0 ? '' : 'primary'}" data-lend="${x.n.key}" ${x.asked || x.p <= 0 ? 'disabled' : ''}>${x.asked ? '今天问过了' : x.p <= 0 ? '不熟，开不了口' : '开口借'}<small>大约 ${Math.round(x.p * 100)}%</small></button></div>`).join('') || '<p class="muted">这儿没有说得上话的人。</p>';
    const drows = debts.map(x => `<div class="lend-row debt"><div class="lr-body"><b>欠${x.d.name} ¥${x.d.amt}</b><small>第 ${x.d.day} 天借的 · ${G.dayNum() > x.d.due ? '<span class="need">已经过期了，好感每天往下掉</span>' : `第 ${x.d.due} 天前还`}</small></div><button class="btn primary" data-repay="${x.i}" ${S.money >= x.d.amt ? '' : 'disabled'}>还上 ¥${x.d.amt}</button></div>`).join('');
    return UI.modal({ title: '找熟人借钱', cls: 'borrow-modal', html: `<p class="muted">借到借不到，看交情：好感越高越容易；有案底、手里还欠着别人的，就难开口。借了要在 ${C.broke.borrow.dueDays} 天内还，不还好感每天 ${C.broke.borrow.lateAff}。</p>${drows ? `<div class="lend-list">${drows}</div>` : ''}<div class="lend-list">${rows}</div>`,
      buttons: [{ text: '算了' }],
      onShow: (m, close) => {
        m.querySelectorAll('[data-lend]').forEach(b => b.onclick = () => { close(0); act(async () => { const r = G.borrow(b.dataset.lend); if (r.err) return UI.toast(r.err, 'bad'); await FX.micro('borrow'); await UI.modal({ title: r.ok ? `借到了 ¥${r.amt}` : '没借到', html: `<div class="talk"><div class="pt">${A.portrait(r.n.look)}</div><div><b>${r.n.name}</b><p>${r.line}</p>${r.ok ? `<p class="eff"><span class="up">钱 +${r.amt}</span> <small class="muted">${C.broke.borrow.dueDays} 天内要还</small></p>` : '<p class="eff"><span class="down">精神 -3</span></p>'}</div></div>`, buttons: [{ text: r.ok ? '谢谢' : '……' }] }); }); });
        m.querySelectorAll('[data-repay]').forEach(b => b.onclick = () => { close(0); act(async () => { const r = G.repay(+b.dataset.repay); if (r.err) return UI.toast(r.err, 'bad'); UI.toast(`还上了${r.d.name}的 ${r.d.amt} 元${r.late ? '' : '，他拍拍你：“讲究。”'}`); }); });
      } });
  };

  // ---------- v0.8.1 卖旧衣 / 旧货 ----------
  UI.sellFlow = function (kind, id) {
    act(async () => {
      const S = G.S();
      const q = kind === 'item' ? G.sellItemQuote(id) : G.sellQuote(id);
      if (!q.ok) return UI.toast(q.err, 'bad');
      const name = kind === 'item' ? id : q.cloth.name;
      const art = kind === 'item' ? `<div class="sell-art item">${{ '烟': '🚬', '手套': '🧤', '打火机': '🔥' }[id] || '📦'}</div>` : `<div class="sell-art">${A.clothThumb(q.cloth)}</div>`;
      const go = await UI.modal({ title: '卖掉' + name + '？', cls: 'sell-modal', html: `<div class="sell-box">${art}<div><p class="price-lg">老板出价 ¥${q.price}</p>
        ${kind === 'item' ? `<p class="muted">${q.it.note || ''}</p>` : `<p class="muted">原价 ¥${q.cloth.price || 0} · ${q.cloth.tier === 'expensive' ? '品牌货保值一些' : q.cloth.tier === 'start' ? '来时穿的旧衣服，几块钱' : '二手地摊价'}${S.boughtDay && S.boughtDay[id] && G.dayNum() > S.boughtDay[id] ? ` · 穿了 ${G.dayNum() - S.boughtDay[id]} 天` : ''}</p>`}
        <p class="flavor-hint">「${C.broke.sell.lines[Math.floor(Math.random() * C.broke.sell.lines.length)]}」</p><p class="muted tiny">卖了就没了，想要得按原价再买。</p></div></div>`,
        buttons: [{ text: `卖（+¥${q.price}）` }, { text: '不卖了', cls: 'ghost' }] });
      if (go !== 0) return;
      const r = kind === 'item' ? G.sellItem(id) : G.sellCloth(id);
      if (r.ok) UI.toast(`卖掉了${name}，兜里多了 ${r.price} 元`);
    });
  };

  // ---------- v0.9.1 刮刮乐：挑票 → 刮 → 再来一张 / 换一种 / 收手 ----------
  UI.scratchFlow = async function (tid) {
    const S = G.S(); const L = C.lotteryShop;
    for (let guard = 0; guard < 40; guard++) {
      if (!tid) {
        const lt = S.lottery || {}; const n = lt.day === G.dayNum() ? lt.n : 0;
        const cards = C.scratchTickets.map((t, i) => `<button class="tk-pick" data-i="${i}" style="--tk:${t.color};--ink:${t.ink}" ${S.money < t.price || n >= L.maxPerDay ? 'disabled' : ''}><span class="tk-art">${t.art}</span><b>${t.name}</b><span class="tk-price">¥${t.price}</span><small>${t.rule}</small></button>`).join('');
        const i = await UI.modal({ title: '刮刮乐', cls: 'scratch-pick', wide: true, bg: A.placeImg('lottery', G.hourF()), html: `<p class="muted">玻璃柜台下压着四种票。老板说：“越贵的，头奖越大。”今天刮了 ${n}/${L.maxPerDay} 张，兜里 ¥${S.money}。</p><div class="tk-picks">${cards}</div>`, buttons: [{ text: '不刮了', cls: 'ghost', value: -1 }], onShow: (m, close) => m.querySelectorAll('.tk-pick').forEach(b => b.onclick = () => close(+b.dataset.i)) });
        if (i == null || i < 0) return;
        tid = C.scratchTickets[i].id;
      }
      const r = G.scratch(tid);
      if (r.err) { UI.toast(r.err, 'bad'); return; }
      UI.render();
      const v = await FX.scratchCard(r);
      if (v === 'done') return;
      if (v === 'switch') tid = null;
    }
  };

  UI.doAct = function (a) {
    const S = G.S(); const [k, v] = a.split(':');
    if (window.LIFE && LIFE.has(k)) return LIFE.doAct(k, v);
    if (k === 'shop') return UI.openClothesShop();
    if (k === 'sell') { UI._shopTab = 'sell'; return UI.openClothesShop(); }
    if (k === 'borrow') return UI.borrowFlow();
    if (k === 'scrap') return act(async () => { const r = G.scrap(); await FX.micro('scrap', { money: r.money }); await UI.modal({ title: '捡瓶子', bg: A.placeImg(S.loc, G.hourF()), html: `<p>${r.line}</p><p class="eff"><span class="up">钱 +${r.money}</span> <span class="down">体力 ${C.broke.scrap.stamina}</span> <span class="down">干净 ${C.broke.scrap.clean}</span></p>`, buttons: [{ text: '把蛇皮袋叠好' }] }); });
    if (k === 'oddjob') return act(async () => { const r = G.oddjob(); if (r.ok) await FX.micro('oddjob'); await UI.modal({ title: r.ok ? '换了一顿饭' : '老板没要', bg: A.IMG.place('food'), html: r.ok ? `<p>${r.line}</p><p class="eff"><span class="up">饱腹 +${C.broke.oddjob.hunger}</span> <span class="down">体力 ${C.broke.oddjob.stamina}</span></p>` : `<p>${r.line}</p><p class="muted">今天就别再问了，明天再来试试。</p>`, buttons: [{ text: r.ok ? '抹抹嘴' : '走吧' }] }); });
    if (k === 'karaoke') return act(async () => { const R = C.riverside.karaoke; if (S.money < R.price) return UI.toast('钱不够。', 'bad'); S.money -= R.price; G.advance(R.minutes); G.change({ mental: R.mental }); G.log(R.text); await FX.micro('karaoke'); UI.toast(R.text); });
    if (k === 'fish') return act(async () => { const R = C.riverside.fish; await FX.micro('fish'); G.advance(R.minutes); G.change({ mental: R.mental, stamina: R.stamina }); G.log(R.text); const n = Math.random() < 0.5 ? G.pickNpc('riverside') : null; if (n) await UI.talk(n, '凉水河边'); else UI.toast(R.text); });
    if (k === 'wait30') return act(async () => { const f = S.time; G.advance(30); await FX.micro('wait', { from: f, to: S.time }); });
    if (k === 'wait60') return act(async () => { const f = S.time; G.advance(60); await FX.micro('wait', { from: f, to: S.time }); });
    if (k === 'free') return act(async () => { const F = G.freeMental(v); if (F) { await FX.micro(v === 'callhome' ? 'call' : v === 'river' ? 'karaoke' : 'free', v === 'callhome' && G.callLines ? { lines: G.callLines() } : undefined); UI.toast(F.text); } });
    if (k === 'rest') return act(async () => { const f = S.time; const s0 = Math.round(S.stats.stamina), gain = Math.round(5 * G.hungerRegenMult()); G.advance(60); await FX.micro('rest', { from: f, to: S.time, meter: { label: '体力', from: s0, to: Math.min(S.maxSta, s0 + gain), max: S.maxSta } }); G.change({ stamina: gain }); });
    if (k === 'leftover') return act(async () => {
      const L = C.leftover;
      if (S.money < L.price) return UI.toast('钱不够。', 'bad');
      const go = await UI.modal({ title: L.name, cls: 'food-modal', html: `<div class="food-preview"><div class="fp-art">${A.dish(L)}</div><div class="fp-info"><p class="price-lg">¥${L.price}</p><p class="fx"><span class="up">饱腹 +${L.hunger}</span></p><p class="muted">可能闹肚子</p></div></div>`, buttons: [{ text: '还是买' }, { text: '算了', cls: 'ghost' }] });
      if (go === 1) return;
      const r = G.buyLeftover();
      await UI.eatMoment(L, { delta: { hunger: L.hunger } });
      if (r) await UI.modal({ title: '肚子不舒服', html: `<p>${r}</p>` });
    });
    if (k === 'food') return UI.foodFlow(v);
    if (k === 'cloth') return UI.clothFlow(v);
    if (k === 'laundry') return act(async () => { const r = G.laundry(); if (r) UI.toast(r, 'bad'); else { await FX.micro('laundry'); UI.toast(`衣服洗过了，体面 ${G.decency()}`); } });
    if (k === 'beer') return act(async () => {
      const B = C.bar.beer; if (S.money < B.price) return UI.toast('钱不够。', 'bad');
      const r = G.beer(); if (r) return UI.toast(r, 'bad');
      await UI.eatMoment(B, { delta: { mental: B.mental, stamina: B.stamina || 0, hunger: B.hunger || 0 } });
    });
    if (k === 'skewer') return act(async () => {
      const B = C.bar.skewer; if (S.money < B.price) return UI.toast('钱不够。', 'bad');
      S.money -= B.price; G.change({ hunger: B.hunger, mental: B.mental, stamina: B.stamina || 0 }); G.advance(60); G.log('和工友拼桌撸串。');
      await UI.eatMoment(B, { delta: { hunger: B.hunger, mental: B.mental, stamina: B.stamina || 0 } });
      const n = G.pickNpc('bar'); if (n) await UI.talk(n, '烧烤摊上');
    });
    if (k === 'netgame') return act(async () => { const r = G.netGame(); if (r.err) return UI.toast(r.err, 'bad'); await FX.micro('netgame'); await UI.modal({ title: '通宵网吧', bg: A.IMG.place('netcafe'), html: `<p>${r.g.text}</p>${effText({ mental: r.g.mental, stamina: r.g.stamina, hunger: r.g.hunger, money: -r.g.price })}` }); });
    if (k === 'scratch') return act(async () => { UI._beatVerb = '刮到'; await UI.scratchFlow(); });
    if (k === 'clinic') return act(async () => { const r = G.clinic(v); if (r.err) return UI.toast(r.err, 'bad'); await FX.micro('clinic'); await UI.modal({ title: '村卫生室', bg: A.IMG.place('clinic'), html: `<p>${r.sv.text}</p>${effText({ stamina: r.sv.stamina, mental: r.sv.mental, hunger: r.sv.hunger, money: -r.sv.price })}` }); });
    if (k === 'agency') return act(async () => { const sv = C.agencyServices.find(x => x.id === v); if ((S.certs || {})[v]) return UI.toast((S.certs[v].done ? '已经办下来了。' : `还在办，第 ${S.certs[v].ready} 天来拿。`)); const go = await UI.modal({ title: sv.name, bg: A.IMG.place('agency'), html: `<p>${sv.text}</p><p>¥${sv.price} · ${sv.days} 天后拿。</p>`, buttons: [{ text: `交钱（¥${sv.price}）`, disabled: S.money < sv.price }, { text: '算了', cls: 'ghost' }] }); if (go === 1) return; const r = G.agencyBuy(v); if (r.err) UI.toast(r.err, 'bad'); else { await FX.micro('agency', { fee: sv.price }); UI.toast('交了钱，等着拿证'); } });
    if (k === 'board') return act(async () => { const t = G.agencyBoard(); await FX.micro('board'); await UI.modal({ title: '白板', bg: A.IMG.place('agency'), html: `<p>${t}</p>` }); });
    if (k === 'chat') return act(async () => { S.flags.chatKey = S.offers.key; G.advance(30); await FX.micro('chat'); const n = G.pickNpc('any'); if (n) await UI.talk(n, '路口的台阶上'); });
    if (k === 'rent') return act(async () => { const r = G.rentRoom(); if (r.err) return UI.toast(r.err, 'bad'); await FX.micro('rent'); UI.toast('房租交好了'); });
    if (k === 'room') return UI.roomView();
    if (k === 'send') return UI.sendFlow();
    if (k === 'sleep') return UI.sleepFlow(v);
    if (k === 'pick') return UI.pickFlow(v);
    if (k === 'leave') { const pr = G.goalProgress(), g = G.identity().goal; if (!G.canLeave()) return UI.modal({ title: '还不能走', html: `<p>目标：${G.identity().goalText}</p><p>现在：${pr.text}</p><p class="muted">${ST.softPaceTip || ''}</p>` }); return act(async () => { G.end(g.endKey || (g.type === 'send' ? (g.debt ? 'win_debt' : 'win_send') : g.type === 'cleanLeave' ? 'win_clean' : 'win_stories'), true); }); }
  };

  // ---------- 找活 → 坐车 → 干活 ----------
  UI.ask = function (oid) {
    act(async () => {
      const S = G.S(); const o = S.offers.list.find(x => x.oid === oid); const j = C.jobs.find(x => x.id === o.job), R = C.recruiters[o.recruiter];
      const hi = G.hireInfo(o);
      const whyHtml = hi.why.map(w => `<li class="${w.bad ? 'bad' : w.good ? 'good' : ''}">${w.k} <b>${w.v}</b></li>`).join('');
      const pf = G.perf(j.skill);
      const pfHtml = `<div class="perfbox"><b>干活手感</b>${pf.notes.map(n => `<span class="${n.bad ? 'bad' : n.good ? 'good' : ''}">${n.t}</span>`).join('')}${j.qualityPay ? `<span>干得好坏算钱：质量每高/低 10%，工钱 ±¥${Math.round(j.qualityPay / 10)}</span>` : ''}</div>`;
      const goAsk = await UI.modal({ title: '上前问问？', html: `<div class="talk"><div class="pt">${A.portrait(R.look)}</div><div><b>${R.name}</b> · ${j.name}<p>工钱 <b>¥${o.wage}</b>${j.meal ? ' · 管饭' : ''}</p>
        <p class="pct-big">录取大约 <b>${hi.pct}%</b></p>
        <ul class="why-list">${whyHtml}</ul>${pfHtml}
        <p class="muted">点“还是问问”才会真正去碰运气。</p></div></div>`, buttons: [{ text: '还是问问' }, { text: '算了', cls: 'ghost' }] });
      if (goAsk === 1) return;
      const r = G.tryHire(o);
      if (!r.ok) {
        const why = { record: '因为你有案底', recordSoft: '因为你有案底', age: '嫌你岁数大', dirty: '嫌你衣服太脏、不体面', tired: '看你体力不行、站不稳', hungry: '看你饿得发昏', full: '人招满了' }[r.reason];
        G.log(`${R.name}没要你（${why}）：“${r.line}”`, r.reason.startsWith('record') ? 'bad' : '');
        await UI.modal({ title: '没要你', html: `<div class="talk"><div class="pt">${A.portrait(R.look, { mood: 'angry' })}</div><div><b>${R.name}</b><p>“${r.line}”</p><p class="why ${r.reason.startsWith('record') ? 'bad' : ''}">原因：${why}${r.reason === 'record' ? `（${j.name}要求没有案底）` : ''}</p></div></div>` });
        return;
      }
      let wage = r.wage;
      const go = await UI.modal({ title: `${R.name}点了你`, html: `<div class="talk"><div class="pt">${A.portrait(R.look, { mood: 'smile' })}</div><div><b>${R.name}</b><p>“行，你，上车！”</p>${r.line ? `<p class="why bad">“${r.line}”</p>` : ''}<p>${j.name} · ${j.start}–${j.end} · 工钱 <b>¥${wage}</b>${j.meal ? '（管饭）' : ''}</p><p class="muted">${j.desc}</p></div></div>`, buttons: [{ text: `上${j.ride.replace(/^.*的/, '')}` }, { text: '算了，不去' }] });
      if (go === 1) { S.refused[o.oid] = 1; G.log(`没跟${R.name}走。`); return; }
      S.offers.list = S.offers.list.filter(x => x.oid !== o.oid);
      await UI.doJob(o, wage);
    });
  };

  UI.doJob = async function (o, wage) {
    const S = G.S(); const j = C.jobs.find(x => x.id === o.job);
    const startAbs = G.jobStartAbs(o); const tLeave = S.time;
    G.advance(Math.max(0, startAbs - S.time - 40));
    G.log(`坐上${j.ride}，去干${j.name}。`);
    UI.render();
    const n = G.pickNpc(j.id);
    if (n) await UI.talk(n, j.ride, j);
    G.advance(Math.max(0, startAbs - S.time));
    UI.render();
    if (window.FX) await FX.micro('commute', { from: tLeave, to: S.time, bg: A.IMG.job(j.id), lines: [`${j.ride}晃了一路，到了。`] });
    const times = S.jobsDone[j.id] || 0;
    const btns = [{ text: '开工' }]; if (times >= 2) btns.push({ text: '熟手了：直接干完' });
    const tired = S.stats.stamina <= G.TH().staminaLow;
    const perf = G.perf(j.skill);
    const jbg = A.IMG.job(j.id);
    const ch = await UI.modal({ title: `${j.name} · ${j.start} 开工`, bg: jbg, cls: 'job-modal', html: `<div class="job-hero" style="background-image:url(${jbg})"></div>`+`<p>${j.desc}</p>${tired ? '<p class="warn">你体力不太够，今天会更难熬。</p>' : ''}<div class="perfbox"><b>今天的手感</b>${perf.notes.map(n => `<span class="${n.bad ? 'bad' : n.good ? 'good' : ''}">${n.t}</span>`).join('')}</div><p class="muted">这是你第 ${times + 1} 次干这个活。</p>`, buttons: btns });
    let res;
    if (ch === 1) { const lv = perf.lv || 0; const q = Math.max(0.3, Math.min(0.95, 0.62 + lv * 0.05 + Math.random() * 0.1 - (1 - perf.win) * 0.4)); res = { completed: true, quality: q, mentalMult: 1.05 }; }
    else res = await UI.minigame(j.game, { tired, perf, hands: S.skills.hands, knife: S.skills.knife || 0, eye: S.skills.eye, skin: G.identity().look.skin, shirt: G.identity().look.shirt });
    UI._beatVerb = "干到"; const out = G.finishJob(o, wage, res);
    for (const ml of (out.meals || [])) { UI.toast(`${ml.name} +${ml.got} 饱腹`); await UI.eatMoment({ id: 'jobmeal_' + ml.dish, name: ml.name, dish: ml.dish, price: ml.tier === '好' ? 16 : 10, flavor: ml.flavor, text: ml.text }, { delta: { hunger: ml.got, mental: ml.mental || 0 } }); }
    if (window.FX && (res.completed || res.hoursDone > 0.5)) await FX.micro('shiftend', { from: startAbs, to: S.time, bg: jbg, lines: [res.completed ? `${G.clock(startAbs)} 到 ${G.clock()}，这一班熬完了。` : `只干到 ${G.clock()} 就停了。`] });
    let head = res.completed ? '下班了' : res.fired ? '被开除了' : '跑路了';
    let body = res.completed ? `<p>干完了一整班，拿到 <b>¥${out.pay}</b>${res.fines ? `（扣了 ${res.fines} 元）` : ''}。</p>${res.quality != null ? `<p>干活质量 <b>${Math.round(res.quality * 100)}%</b>${out.bonus ? `，${out.bonus > 0 ? `组长多给了 ¥${out.bonus}` : `干得不好，扣了 ¥${-out.bonus}`}` : ''}${out.skillPay ? `，熟手补贴 +¥${out.skillPay}` : ''}。</p>` : ''}${res.summary ? `<p class="muted">${res.summary}</p>` : ''}` :
      res.fired ? `<p>“你别干了！”${j.quitPay === 'hourly' ? `厂里按小时结钱：干了 ${res.hoursDone.toFixed(1)} 小时，只给算 ${Math.max(0, Math.floor(res.hoursDone - 1))} 小时，拿到 <b>¥${out.pay}</b>。` : '一分钱也没拿到。'}</p>` :
      `<p>${j.quitPay === 'hourly' ? `你走了。干了 ${res.hoursDone.toFixed(1)} 小时，只给算 ${Math.max(0, Math.floor(res.hoursDone - 1))} 小时，拿到 <b>¥${out.pay}</b>。（厂里的规矩：头一个小时不算钱）` : '你借口上厕所跑了。中途跑路就等于白干。'}</p>`;
    if ((out.meals || []).length) body += `<p class="why">${out.meals.map(m => `管的饭：${m.name}（${m.tier === '好' ? '实在' : m.tier === '差' ? '凑合不起来' : '凑合'}，饱腹 +${m.got}）`).join('；')}。收工时饱腹 ${out.hungerEnd}。</p>`;
    if (out.cut) body += `<p class="why">中介从工钱里抽走了 <b>¥${out.cut}</b>${out.gross ? `（原本 ¥${out.gross}）` : ''}。</p>`;
    if (out.delayed) body += `<p class="why bad">工钱 ¥${out.delayed} 没当场给：“过两天一起结。”（会自动到账，但这几天手头更紧）</p>`;
    if (out.unpaid) body += `<p class="why bad">工钱 ¥${Math.max(0, (out.gross || 0) - (out.cut || 0))} 没拿到。中介说厂里没打款，电话再打就不接了。</p>`;
    if (res.completed && j.debuff) body += `<p class="warn">${C.debuffs[j.debuff].name}：${C.debuffs[j.debuff].text}</p>`;
    if (out.firstJob) body += `<p class="story">📷 第一次干「${j.name}」——已收入相册。</p>`;
    if (out.xp) body += `<p class="good">${C.skillNames[out.xp.key]} 经验 +${out.xp.amt}${out.xp.up ? ` → <b>升到 Lv${out.xp.lv}！</b>` : out.xp.need ? `（Lv${out.xp.lv}，${out.xp.cur}/${out.xp.need}）` : '（满级）'}</p>`;
    G.log(`${j.name}：${head}，拿到 ¥${out.pay}。`, out.pay ? 'good' : 'bad');
    if (window.Music && out.pay) Music.stinger('paid');
    UI.render();
    await UI.modal({ title: head, bg: jbg, html: body + `<p class="muted">坐车回到了人力市场路口，现在是 ${G.clock()}。</p>` });
  };

  UI.minigame = function (type, opts) {
    const jb = C.jobs.find(x => x.game === type); const S = G.S(); S.flags = S.flags || {}; S.flags.seenMG = S.flags.seenMG || {};
    const first = !S.flags.seenMG[type]; S.flags.seenMG[type] = 1;
    // 兜底结果：按“一般水平”结算（品质 0.6，略低于及格）
    const FALLBACK = () => ({ completed: true, quality: 0.6, mentalMult: 1, fines: 0, fallback: true });
    return UI.modal({ cls: 'mgmodal', wide: true, bg: jb ? A.IMG.job(jb.id) : null, html: '<div id="mgroot"></div>', buttons: [], onShow: (m, close) => {
      const root = m.querySelector('#mgroot'); let settled = false, t0 = Date.now(); window.MG_HB = 0; if (window.Music) Music.setTrack('work');
      const stuckBtn = document.createElement('button'); stuckBtn.className = 'btn sm mg-skip' + (first ? ' hidden' : ''); stuckBtn.textContent = '跳过（按一般水平结算）▸'; stuckBtn.id = 'mg-skip';
      const fin = (r, note) => { if (settled) return; settled = true; clearInterval(wd); if (window.Music) Music.setTrack('street'); window.MG_KILL = performance.now() + 1; window.MG_FAIL = null; if (window.MG_CUR_CLEAN) window.MG_CUR_CLEAN(); if (note) UI.toast(note); close(r); };
      stuckBtn.onclick = () => { fin(FALLBACK(), '这一段按一般水平结算了。'); };
      m.appendChild(stuckBtn);
      window.MG_FAIL = () => fin(FALLBACK(), '这一段出了点小状况，按一般水平结算了。');
      // 看门狗：第一次玩 25 秒后也出现“跳过”；画面停住超过 3 秒也出现
      const wd = setInterval(() => { const el = Date.now() - t0; if (first && el > 25000) stuckBtn.classList.remove('hidden'); if (el > 3000 && (!window.MG_HB || performance.now() - window.MG_HB > 3000)) { stuckBtn.classList.remove('hidden'); stuckBtn.textContent = '好像卡住了？点这里继续 ▸'; } }, 700);
      let p; try { p = MG[type](root, opts); } catch (e) { console.error(e); fin(FALLBACK(), '这一段出了点小状况，按一般水平结算了。'); return; }
      Promise.resolve(p).then(r => fin(r), e => { console.error(e); fin(FALLBACK(), '这一段出了点小状况，按一般水平结算了。'); });
    } });
  };

  // ---------- 聊天 ----------
  UI.talk = async function (n, where, job) {
    const S = G.S(); const rel = S.npc[n.key];
    const head = `<div class="busbox">${job ? A.bus(job.ride, G.hourF()) : ''}<div class="talk over"><div class="pt">${A.portrait(n.look, { mood: 'neutral' })}</div><div><b>${n.name}</b> <small>${n.age ? n.age + '岁 · ' : ''}好感 ${Math.round(rel.aff)} · ${UI.trustStage(rel.aff)}</small>`;
    if (G.hasRecord() && rel.aff < n.forgive + 30) {
      G.log(`${n.name}不愿理你。`, 'bad');
      await UI.modal({ title: where, wide: true, html: head + `<p>${n.recordLine}</p><p class="why bad">有案底，工友对你冷淡（好感不够）。</p></div></div></div>`, buttons: [{ text: '……' }] });
      return;
    }
    if (rel.talk >= n.talks.length) {
      await UI.modal({ title: where, wide: true, html: head + `<p>${n.name}靠着车窗打盹。你们点点头，没再多说。</p></div></div></div>`, buttons: [{ text: '也眯一会儿' }] });
      G.change({ stamina: 3 }); G.noteMet(n.key); return;
    }
    const T = n.talks[rel.talk];
    const mem = UI.memoryLine(n, rel); G.noteMet(n.key);
    if (T.minAff && rel.aff < T.minAff) {   // v0.9 信任弧线：还没熟到那份上
      rel.aff = Math.min(100, rel.aff + 2); G.advance(10);
      await UI.modal({ title: where, wide: true, html: head + `${mem ? `<p class="mem">${mem}</p>` : ''}<p>${n.guarded || n.name + '点点头，没多说什么。'}</p><p class="muted">还没熟到能说心里话的份上（${UI.trustStage(rel.aff)} → 要到「${UI.trustStage(T.minAff)}」）。多见几面，好感 +2。</p></div></div></div>`, buttons: [{ text: '嗯' }] });
      return;
    }
    const opts = T.options.map(op => {
      let dis = false, why = '';
      if (op.needItem && !(S.items[op.needItem] > 0)) { dis = true; why = `（身上没有${op.needItem}）`; }
      if (op.needPhone && S.attrs.phone < op.needPhone) { dis = true; why = '（你不会弄）'; }
      if (op.money && S.money < -op.money) { dis = true; why = '（钱不够）'; }
      return { text: op.text + why, disabled: dis };
    });
    const i = await UI.modal({ title: where, wide: true, html: head + `${mem ? `<p class="mem">${mem}</p>` : ''}<p>${T.opener}</p></div></div></div>`, buttons: opts });
    const op = T.options[i];
    rel.aff = Math.max(0, Math.min(100, rel.aff + (op.aff || 0))); rel.talk++;
    G.change({ mental: op.mental || 0, money: op.money || 0, item: op.item });
    if (op.giveItem) S.items[op.giveItem]--;
    let got = '';
    let newStory = null;
    if (T.story && !S.stories.includes(T.story)) {
      S.stories.push(T.story); newStory = T.story; if (G.onStory) G.onStory(T.story);
      G.addStamp('story_' + T.story, '故事', T.story);
      G.addAlbum({ id: 'story_' + T.story, kind: 'story', title: '《' + T.story + '》', caption: '大巴上听来的。记进了笔记本。' });
      got = `<p class="story">📖 听到了一个故事：《${T.story}》（${S.stories.length}/${G.storiesNeed() || '—'}）</p>`;
      G.log(`听到了一个故事：《${T.story}》`, 'good');
    }
    await UI.modal({ title: where, wide: true, html: head + `<p class="you">你：${op.text}</p><p>${op.reply}</p>${got}${effText({ mental: op.mental, money: op.money })}<p class="muted">好感 ${op.aff >= 0 ? '+' : ''}${op.aff || 0}</p></div></div></div>`, buttons: [{ text: '继续' }] });
    if (newStory) {
      await UI.modal({ title: '故事印章', cls: 'hook-modal', html: `<div class="story-stamp-card"><div class="stamp big gold">故事</div><h2>《${newStory}》</h2>
        <p>你把它记进了笔记本，也收进了相册。以后分享图上也会盖上这枚印章。</p>
        <p class="muted">已收集 ${S.stories.length}/${G.storiesNeed() || '—'} 个故事</p></div>`, buttons: [{ text: '收好' }] });
    }
  };

  // v0.9 信任阶段 + 人物小传（按熟悉程度一点点解锁）
  UI.trustStage = aff => { let n = '陌生'; (C.trustStages || []).forEach(t => { if (aff >= t.at) n = t.name; }); return n; };
  UI.bioHtml = function (p, aff, self) {
    if (!p) return '<p class="muted">还不了解这个人。</p>';
    const F = [['personality', '性格', 40], ['quirks', '小习惯', 40], ['past', '过去', 55], ['why', '为什么来酒仙桥', 55], ['life', '在这儿的日子', 70], ['family', '家里人', 70], ['hope', '心里盼着', 85]];
    return `<dl class="bio">${F.map(([k, lab, need]) => self || aff >= need ? `<dt>${lab}</dt><dd>${p[k] || '—'}</dd>` : `<dt>${lab}</dt><dd class="lockbio">🔒 要到「${UI.trustStage(need)}」才会跟你说</dd>`).join('')}</dl>`;
  };
  UI.bioModal = function (key) {
    const S = G.S(); const n = G.npcList().find(x => x.key === key); if (!n) return;
    const aff = S.npc[key].aff;
    return UI.modal({ title: `${n.name} · 人物小传`, wide: true, html: `<div class="talk over"><div class="pt">${A.portrait(n.look)}</div><div><b>${n.name}</b> <small>好感 ${Math.round(aff)} · ${UI.trustStage(aff)}</small>${UI.bioHtml(n.profile, aff)}</div></div>`, buttons: [{ text: '合上' }] });
  };

  // v0.9 工友的记性：开口前先来一句
  UI.memoryLine = function (n, rel) {
    const S = G.S(), M = C.npcMemory; if (!M || !rel) return '';
    const d = G.dayNum(), owe = (S.debts || []).find(x => x.npc === n.key && !x.paid), paid = (S.debts || []).find(x => x.npc === n.key && x.paid && !x.thanked);
    if (owe) return M.owe.replace('{amt}', owe.amt);
    if (paid) { paid.thanked = true; return M.repaid; }
    if (rel.recSeen != null && S.record.count > rel.recSeen) return M.record;
    if (rel.lastDay && d - rel.lastDay >= 3) return M.longGone;
    if (rel.lastDay === d) return M.sameDay;
    if (rel.aff >= 60) return M.close;
    return '';
  };

  // ---------- v0.9.1 住处预览：鼠标移到「睡××」上，左边换成那张画 ----------
  UI.bedPreview = function (id) {
    const S = G.S(); const img = document.querySelector('#scene .scn-img'), cap = document.querySelector('#scene .scn-cap'), ov = document.querySelector('#scene .scn-over');
    if (!img) return;
    if (!id) { img.style.backgroundImage = `url(${A.placeImg(S.loc, G.hourF())})`; if (cap) cap.classList.add('hidden'); if (ov) ov.innerHTML = ''; img.parentNode.classList.remove('bedview'); return; }
    const key = id === 'roomview' ? 'month' : id; const V = A.bedView(key); if (!V) return;
    const L = C.lodging.find(l => l.id === key);
    img.style.backgroundImage = `url(${V.img})`; img.parentNode.classList.add('bedview');
    if (ov) ov.innerHTML = key === 'month' && G.roomOwned() ? A.roomOverlay(S, G) : '';
    if (cap) { cap.innerHTML = `<b>${id === 'roomview' ? '我的房间' : L ? L.name : ''}${L && !L.monthly ? ` · ${L.price ? '¥' + L.price : '不花钱'}` : ''}</b>${V.cap || ''}`; cap.classList.remove('hidden'); }
  };
  UI.bindBedPreview = function () {
    const S = G.S(); if (UI._pickLoc !== S.loc) { UI._pick = null; UI._pickLoc = S.loc; }
    const tiles = [...document.querySelectorAll('#panel .act[data-a^="sleep:"], #panel .act[data-a="room"], #panel .act[data-a="rent"]')];
    const idOf = t => t.dataset.a === 'room' ? 'roomview' : t.dataset.a === 'rent' ? 'month' : t.dataset.a.slice(6);
    tiles.forEach(t => { const id = idOf(t); if (!A.bedView(id === 'roomview' ? 'month' : id)) return;
      t.addEventListener('mouseenter', () => UI.bedPreview(id)); t.addEventListener('focus', () => UI.bedPreview(id));
      t.addEventListener('mouseleave', () => UI.bedPreview(UI._pick)); t.addEventListener('blur', () => UI.bedPreview(UI._pick));
      t.addEventListener('click', () => { UI._pick = id; }, true); });
    if (UI._pick && tiles.some(t => idOf(t) === UI._pick)) UI.bedPreview(UI._pick);
  };

  // ---------- v0.9 我的房间：花草和小物件 ----------
  UI.roomView = function () {
    const S = G.S(), R = C.room; if (!G.roomOwned()) return UI.toast('你没有自己的屋子。', 'bad');
    const d = G.dayNum(), pots = S.room.pots || [];
    const slots = Array.from({ length: R.pots }, (_, i) => pots[i] || null).map((p, i) => {
      if (!p) return `<div class="pot empty"><div class="pot-ic">🪣</div><b>空花盆</b><small>买一盆放这儿</small></div>`;
      const P = G.plantDef(p.id), st = G.plantStage(p), dry = p.lastW == null ? d - p.planted : d - p.lastW;
      if (p.dead) return `<div class="pot dead"><div class="pot-ic">🥀</div><b>${P.name}</b><small>干死了</small></div>`;
      return `<div class="pot st${st}"><div class="pot-ic">${P.icon[Math.min(st, 3)]}</div><b>${P.name}</b><small>${['刚种下', '冒新叶', '长得挺好', P.hunger ? '能吃了' : '开花了'][Math.min(st, 3)]}${p.lastW === d ? ' · 今天浇过' : dry >= 2 ? ` · ${dry} 天没浇水` : ''}</small>${P.hunger && st >= 3 ? `<button class="btn sm" data-harvest="${i}">掐一把煮面</button>` : ''}</div>`;
    }).join('');
    const decor = (S.room.decor || []).map(id => { const D = R.decor.find(x => x.id === id); return `<span class="deco-it" title="${D.note}">${D.icon} ${D.name}</span>`; }).join('') || '<span class="muted">屋里还空荡荡的。</span>';
    const shopP = R.plants.map(P => `<button class="btn sm" data-plant="${P.id}" title="${P.note}" ${S.money < P.price ? 'disabled' : ''}>${P.icon[1]} ${P.name} ¥${P.price}</button>`).join('');
    const shopD = R.decor.filter(D => !(S.room.decor || []).includes(D.id)).map(D => `<button class="btn sm" data-decor="${D.id}" title="${D.note}" ${S.money < D.price ? 'disabled' : ''}>${D.icon} ${D.name} ¥${D.price}</button>`).join('');
    const left = G.roomDaysLeft();
    UI._pick = 'roomview'; UI.bedPreview('roomview');
    return UI.modal({ title: '我的房间', wide: true, cls: 'room-modal', bg: A.bedView('month').img, html: `<div class="room">
      <div class="bedpic room-pic" style="background-image:url(${A.bedView('month').img})">${A.roomOverlay(S, G)}</div>
      <p class="muted">一床一桌一扇窗。月租${left > 0 ? `还剩 <b>${left}</b> 天` : '<b class="bad">已到期</b>'}。睡在这儿，第二天早上窗台上的花草和小物件会回一点精神（最多 +${R.maxBonus}）。</p>
      <h4>窗台</h4><div class="pots">${slots}</div>
      <h4>屋里的小东西</h4><div class="decos">${decor}</div>
      <h4>楼下花鸟摊</h4><div class="shoprow">${shopP}</div><div class="shoprow">${shopD}</div></div>`,
      buttons: [{ text: '💧 给花浇水', disabled: !pots.some(p => !p.dead && p.lastW !== d) }, { text: '出门' }],
      onShow: (m, close) => {
        const redo = () => { close(9); setTimeout(() => { UI.render(); UI.roomView(); }, 30); };
        m.querySelectorAll('[data-plant]').forEach(b => b.onclick = () => { const r = G.buyPlant(b.dataset.plant); if (r.err) return UI.toast(r.err, 'bad'); redo(); });
        m.querySelectorAll('[data-decor]').forEach(b => b.onclick = () => { const r = G.buyDecor(b.dataset.decor); if (r.err) return UI.toast(r.err, 'bad'); redo(); });
        m.querySelectorAll('[data-harvest]').forEach(b => b.onclick = () => { const r = G.harvest(+b.dataset.harvest); if (r.err) return UI.toast(r.err, 'bad'); redo(); });
      } }).then(v => { if (v === 0) { const r = G.water(); if (r.err) UI.toast(r.err); UI.render(); UI.roomView(); } else if (v !== 9) { UI._pick = null; UI.render(); } });
  };

  // ---------- 睡觉 ----------
  UI.sleepFlow = function (lid) {
    const L = C.lodging.find(l => l.id === lid);
    const opts = [['04:00', '睡到凌晨4点（赶早高峰）'], ['12:00', '睡到中午12点'], ['15:30', '睡到下午3点半（赶夜班）']].map(([t, label]) => ({ t, label, min: G.untilClock(t) })).filter(o => o.min >= 90);
    opts.push({ label: '小睡 3 小时', min: 180 });
    UI._pick = lid; UI.bedPreview(lid);
    const BV = A.bedView(lid);
    UI.modal({ title: L.name, bg: BV ? BV.img : null, html: `${BV ? `<div class="bedpic" style="background-image:url(${BV.img})">${lid === 'month' ? A.roomOverlay(G.S(), G) : ''}</div>${BV.cap ? `<p class="bedcap">${BV.cap}</p>` : ''}` : ''}<p>${L.note}</p><p>${G.bedValid() && G.S().bed.id === lid ? '已经付过钱了。' : `¥${L.price}，付一次管 24 小时。`}${L.maxHours ? ` 最多睡 ${L.maxHours} 小时。` : ''}</p>`, buttons: opts.map(o => ({ text: `${o.label}（${Math.round(o.min / 6) / 10}h）` })).concat([{ text: '不睡了', cls: 'ghost' }]) }).then(i => {
      if (i >= opts.length) { UI._pick = null; UI.bedPreview(null); return; }
      act(async () => {
        const f0 = G.S().time; const r = G.sleep(lid, opts[i].min);
        if (r.err) return UI.toast(r.err, 'bad');
        UI._beatVerb = '睡到'; await FX.micro(lid === 'street' || lid === 'shelter' ? 'street' : 'sleep', { from: f0, to: G.S().time, bg: BV ? BV.img : null });
        await UI.modal({ title: '醒了', bg: BV ? BV.img : null, html: `<p>现在是第 ${G.dayNum()} 天 ${G.clock()}。体力 ${r.gain.sta >= 0 ? '+' : ''}${r.gain.sta}，精神 ${r.gain.men >= 0 ? '+' : ''}${r.gain.men}。</p>${r.cold ? `<p class="warn">${C.coldPenalty.text}</p>` : ''}${r.robbed ? `<p class="why bad">醒来发现裤兜里少了 ${r.robbed} 元——床位房里，总有人顺手牵羊。</p>` : ''}` }); UI._pick = null; UI.bedPreview(null);
        const S = G.S();
        if (S.dayPostcardPending) {
          const pc = S.dayPostcardPending; S.dayPostcardPending = null;
          G.addAlbum({ id: 'day_' + pc.day, kind: 'day', title: '今天又撑过来了', caption: `第 ${pc.day} 天 · 身上 ¥${pc.money} · 寄回 ¥${pc.sent} · 故事 ${pc.stories} · 整班 ${pc.worked}`, day: pc.day });
          await UI.modal({ title: '今天又撑过来了', cls: 'hook-modal', html: `<div class="day-card">
            <p class="kicker">日终明信片 · 第 ${pc.day} 天 · 已收入相册</p><h2>今天又撑过来了</h2>
            <ul class="day-stats"><li>身上 ¥${pc.money}</li><li>已寄回 ¥${pc.sent}</li><li>故事 ${pc.stories} 个</li><li>整班 ${pc.worked} 个</li></ul>
            <p class="muted">不是什么英雄事迹。只是又多活过了一天。</p>
          </div>`, buttons: [{ text: '收起明信片' }] });
        }
      });
    });
  };

  // ---------- 转账（v0.6：随时可转，金额自己填） ----------
  UI.goSend = function () {
    const S = G.S();
    if (S.loc === 'bank') return UI.sendFlow();
    act(async () => { const m = Math.round(10 * G.slowMult()); G.advance(m); S.loc = 'bank'; }).then(() => UI.sendFlow());
  };
  UI.sendFlow = function () {
    const S = G.S(); const I = G.identity(); const isGoal = I.goal.type === 'send'; const goal = I.goal.amount || 0;
    const fee = G.sendFee(), max = G.sendMax();
    const left = isGoal ? Math.max(0, goal - S.sent) : 0;
    const quick = [100, 200, 500, 1000].filter(a => a <= max);
    const keep50 = Math.max(0, S.money - 50 - fee);
    const def = isGoal ? Math.min(max, left || max) : Math.min(max, 100);
    const html = `<div class="bankbox">
      <div class="atm"><div class="atm-scr"><p class="atm-h">自助汇款 · 转给家里</p>
        <p>可用余额 <b>¥${S.money}</b> · ${ST.bank.feeText}</p>
        ${isGoal ? `<p>已寄回 <b>¥${S.sent}</b> / ¥${goal}${left ? ` · 还差 <b>¥${left}</b>` : ' · 已够了'}</p><div class="sbar big"><i style="width:${Math.min(100, Math.round(S.sent / goal * 100))}%"></i></div>` : `<p class="muted">${I.name || '你'}的目标不需要寄钱；转给家里不算进目标${I.goal.type === 'cleanLeave' ? '，而且会让手里的钱变少' : ''}，但心里会踏实点（精神 +3）。</p>`}
        <label class="amt">金额 ¥ <input id="send-amt" type="number" min="1" max="${max}" step="1" value="${def > 0 ? def : ''}" ${max <= 0 ? 'disabled' : ''}></label>
        <div class="quick">${quick.map(a => `<button class="btn sm q" data-v="${a}">¥${a}</button>`).join('')}${isGoal && left && left <= max ? `<button class="btn sm q" data-v="${left}">补齐 ¥${left}</button>` : ''}${keep50 > 0 ? `<button class="btn sm q" data-v="${keep50}">只留 50 吃饭（¥${keep50}）</button>` : ''}${max > 0 ? `<button class="btn sm q" data-v="${max}">全转（¥${max}）</button>` : ''}</div>
        <p class="atm-msg" id="send-msg">${max <= 0 ? `身上的钱不够付手续费 ¥${fee}。先去干活吧。` : '输入金额，按「确认汇款」。'}</p>
      </div></div>
      ${S.attrs.phone < 4 ? '<p class="muted">你戴上老花镜，一个键一个键地按。（要多花 20 分钟）</p>' : ''}</div>`;
    UI.modal({ title: '给家里转账', html, cls: 'bank-modal', buttons: [{ text: '确认汇款', id: 'send-ok', disabled: max <= 0, keep: true, fn: () => {} }, { text: '先不转', cls: 'ghost', value: 0 }], onShow: (m, close) => {
      const inp = m.querySelector('#send-amt'), msg = m.querySelector('#send-msg'), ok = m.querySelector('#send-ok');
      const check = () => { const v = Math.floor(Number(inp && inp.value) || 0); let t = '', bad = false; if (v <= 0) { t = '金额要大于 0。'; bad = true; } else if (v + fee > S.money) { t = `余额不足：转 ¥${v} 加手续费 ¥${fee}，要 ¥${v + fee}。最多能转 ¥${max}。`; bad = true; } else t = `转出 ¥${v} + 手续费 ¥${fee}，转完身上剩 ¥${S.money - v - fee}。${isGoal ? `寄回累计将到 ¥${S.sent + v}${S.sent + v >= goal ? '——够了！' : ''}` : ''}`; msg.textContent = t; msg.className = 'atm-msg' + (bad ? ' bad' : ''); if (ok) ok.disabled = bad || max <= 0; return bad ? 0 : v; };
      if (inp) { inp.oninput = check; inp.onkeydown = e => { if (e.key === 'Enter' && check()) ok.click(); e.stopPropagation(); }; check(); setTimeout(() => inp.focus(), 50); }
      m.querySelectorAll('.q').forEach(b => b.onclick = () => { inp.value = b.dataset.v; check(); });
      if (ok) ok.onclick = () => { const v = check(); if (!v) return; close(v); };
    } }).then(v => {
      if (!v) return;
      act(async () => {
        const r = G.send(v);
        if (r && r.err) return UI.toast(r.err, 'bad');
        await FX.micro('send', { amount: r.amt });
        if (window.Music) Music.stinger('paid');
        const pct = isGoal && goal ? Math.min(100, Math.round(r.after / goal * 100)) : 0;
        await UI.modal({ title: '寄回家', wide: true, cls: 'hook-modal', html: `<div class="hook-send">
          <p class="kicker">汇款成功 · 手续费 ¥${r.fee}</p><div class="send-num">¥${r.amt}</div>
          <p class="send-sub">累计已寄回 <b>¥${r.after}</b>${isGoal ? ` / ¥${goal}` : ''}</p>
          ${isGoal ? `<div class="sbar big"><i style="width:${pct}%"></i></div><p class="muted">月供进度 ${pct}%</p>` : ''}
          <p class="send-line">${r.hitGoal ? '到了。你把手机举得很远，看了好几遍那个数字。儿子那边，这个月先顶住了。' : (r.milestones && r.milestones.length ? '又迈过一个整数。你在冷风里站了一会儿，才把手机收回口袋。' : '“到账了。”两个字跳出来的时候，你鼻子有点酸。')}</p>
        </div>`, buttons: [{ text: r.hitGoal ? '……可以回家了' : '收好手机' }] });
      });
    });
  };

  // ---------- 顺手牵羊 ----------
  UI.pickFlow = function (tid) {
    const S = G.S(); const t = C.theft.targets.find(x => x.id === tid); const R = G.rollTarget(t);
    const lvl = v => v > .6 ? '高' : v > .3 ? '中' : '低';
    const sp = Math.round((R.successP || G.theftSuccessP(R)) * 100);
    UI.modal({ title: '🤏 顺手牵羊', html: `<p>${t.desc}</p>
      <p class="pct-big">得手大约 <b>${sp}%</b></p>
      <ul class="assess"><li>目标警觉：<b>${lvl(R.alert)}</b>${S.beersTonight > 3 ? '（你喝多了，手不稳）' : ''}</li><li>光线：<b>${R.light > .6 ? '亮' : R.light > .3 ? '昏暗' : '黑'}</b></li><li>旁边的人：<b>${R.witnesses}</b> 个</li><li>你的“顺手”：<b>${S.skills.pick}</b> / 5 · 察言观色 ${S.skills.eye}</li><li>年龄 / 身份也会影响手感</li></ul>
      <p class="why bad">被抓的后果：留下<b>案底</b>（以后招工更难、保安不要你、工钱被压低、工友疏远你），罚款 ${C.theft.caught.fine} 元或拘留一天。</p>`,
      buttons: [{ text: `下手（约 ${sp}%）` }, { text: '算了', cls: 'ghost' }] }).then(async i => {
      if (i !== 0) return;
      act(async () => {
        G.advance(5);
        const force = S.debugPick || null;
        const r = await UI.modal({ cls: 'mgmodal', wide: true, html: '<div id="mgroot"></div>', buttons: [], onShow: (m, close) => MG.pick(m.querySelector('#mgroot'), { R, skill: S.skills.pick, force, perf: G.perf(null) }).then(close) });
        if (r === 'success') { const got = G.theftSuccess(R); await UI.modal({ title: '得手了', html: `<p>你的手缩回来，攥着 <b>${got}</b>。没人醒。</p><p class="muted">心里发虚，精神 ${C.theft.guiltMental}。“顺手”技能 → ${S.skills.pick}。</p>` }); }
        else if (r === 'caught') {
          const line = pick(C.theft.caughtLines); const pol = pick(C.theft.policeLines);
          if (window.Music) Music.stinger('caught');
          const first = !S.flags.caughtOnce; S.flags.caughtOnce = 1;
          const out = G.theftCaught(R);
          G.addStamp('record', '案底', '第一次');
          if (first) {
            G.addAlbum({ id: 'caught_first', kind: 'caught', title: '红蓝灯光', caption: '第一次被按在了墙上。案底从此跟着你。' });
            await UI.modal({ title: '红蓝灯光', wide: true, cls: 'hook-modal', html: `<div class="hook-caught">
              <div class="hook-art">${A.bioScene('crowd', G.identity().look)}</div>
              <div class="hook-copy"><p class="kicker">第一次 · 已收入相册</p><h2>被按在了墙上</h2>
              <p>${line}</p><p>${pol}</p><p class="why bad">${out}</p><div class="stamp big">案底</div>
              <p>从这一秒起，临时安保不要你了。招工的人会换一副面孔。工友也会离你远一点。</p>
              <p class="muted">人物卡里能看到每一次记录。酒仙桥记得人，也记得事。</p></div></div>`, buttons: [{ text: '走出派出所' }] });
          } else {
            await UI.modal({ title: '被抓了', html: `<p>${line}</p><p>${pol}</p><p class="why bad">${out}</p><div class="stamp">案底 +1</div><p>从今以后：招工更难，<b>临时安保不要</b>，工钱可能被压。</p>`, buttons: [{ text: '走出派出所' }] });
          }
        } else { G.advance(10); G.log('手伸到一半，又缩了回来。'); UI.toast('你收手了，什么也没拿。'); }
      });
    });
  };

  // ---------- 人物卡 ----------
  UI.sheet = function () {
    const S = G.S(), I = G.identity(), pr = G.goalProgress();
    const rel = G.npcList().map(n => `<li class="relrow" data-bio="${n.key}" title="点开看人物小传">${n.name} <span class="aff">${'♥'.repeat(Math.round(S.npc[n.key].aff / 20))}</span> ${Math.round(S.npc[n.key].aff)} <small class="stage">${UI.trustStage(S.npc[n.key].aff)}</small></li>`).join('');
    const db = S.debuffs.filter(d => d.until >= G.dayNum()).map(d => `<span class="chip warn">${C.debuffs[d.id].name}（到第${d.until}天）</span>`).join('') || '<span class="muted">无</span>';
    UI.modal({ title: '人物卡', wide: true, html: `<div class="sheet">
      <div class="sh-l"><div class="pt big">${A.portrait(A.playerLook())}</div><div class="sheet-outfit">${A.outfitBody(A.playerLook(), G.outfit(), { w: 140, h: 210 })}</div><h3>${I.name} · ${I.age}岁</h3><p class="tag">${I.tag}</p>${I.profile ? `<button class="btn sm" id="my-bio">📖 人物小传</button>` : ''}
        <div class="recbox ${G.hasRecord() ? 'bad' : 'ok'}" id="sheet-record"><b>${C.theft.recordName}：${G.hasRecord() ? `有（${S.record.count} 次）` : '无，清清白白'}</b>
        ${G.hasRecord() ? `<ul>${S.record.log.map(r => `<li>第${r.day}天 ${r.clock} · ${r.where} · ${r.what}</li>`).join('')}</ul><p>影响：招工录取率下降、<b>临时安保不要</b>、工钱打折、工友疏远。</p>` : '<p>保持下去，保安的活才会要你。</p>'}</div></div>
      <div class="sh-r"><div class="goalbox"><b>目标</b><p>${I.goalText}</p><p>进度：${pr.text}</p></div>
        <table class="kv"><tr><td>体力</td><td>${Math.round(S.stats.stamina)} / ${S.maxSta}</td><td>精神</td><td>${Math.round(S.stats.mental)}</td></tr>
        <tr><td>饱腹</td><td>${Math.round(S.stats.hunger)}</td><td>体面</td><td>${G.decency()}</td></tr>
        <tr><td>街头口碑</td><td>${S.rep}</td><td>脑力</td><td>${S.attrs.brain}</td></tr>
        <tr><td>阅历</td><td>${S.attrs.exp}</td><td></td><td></td></tr>
        <tr><td>手机熟练</td><td>${S.attrs.phone}</td><td>强制睡倒</td><td>${(S.forced || {}).sleep || 0} 次</td></tr>
        <tr><td>衣服</td><td>${G.outfit().name}</td><td>身上东西</td><td>${Object.entries(S.items).filter(e => e[1] > 0).map(e => e[0] + '×' + e[1]).join('、') || '无'}</td></tr>
        <tr><td>挣到</td><td>¥${S.earned}</td><td>晕倒</td><td>${S.collapses} / ${ST.collapse.maxTimes}</td></tr></table>
        <p>状态：${db}</p>
        <h4>技能（越高，小游戏判定区越宽、录取越容易）</h4>
        <ul class="skills">${['hands', 'knife', 'eye', 'pick'].map(k => { const lv = S.skills[k] || 0, cur = (S.xp || {})[k] || 0, need = lv >= C.skillXp.max ? 0 : G.xpNeed(lv); return `<li><b>${C.skillNames[k]} Lv${lv}</b><div class="sbar"><i style="width:${need ? Math.round(cur / need * 100) : 100}%"></i></div><small>${need ? `${cur}/${need}` : '满级'} · ${C.skillFx[k]}</small></li>`; }).join('')}</ul>
        <p>身上的毛病：${G.conds().map(c => `<span class="chip ${c.lv}">${c.icon} ${c.label}</span>`).join('') || '<span class="muted">没有</span>'}</p>
        <p>干过的活：${Object.entries(S.jobsDone).map(([k, v]) => C.jobs.find(j => j.id === k).name + '×' + v).join('、') || '还没有'}</p>
        <p>听到的故事：${S.stories.map(s => '《' + s + '》').join(' ') || '还没有'}</p>
        <h4>工友</h4><ul class="rel">${rel}</ul>
        <h4>印章 ${Object.keys(S.ach || {}).length}/${(C.achievements || []).length}</h4><div class="seals">${(C.achievements || []).map(a => { const got = (S.ach || {})[a.id]; return `<span class="seal ${got ? 'on' : ''}" title="${got ? a.desc : '还没盖上'}">${got ? a.name : '？？？'}</span>`; }).join('')}</div></div></div>`, buttons: [{ text: '关闭' }],
      onShow: (m, close) => {
        m.querySelectorAll('[data-bio]').forEach(li => li.onclick = async () => { close(0); await new Promise(r => setTimeout(r, 50)); await UI.bioModal(li.dataset.bio); UI.sheet(); });
        const mb = m.querySelector('#my-bio'); if (mb) mb.onclick = async () => { close(0); await new Promise(r => setTimeout(r, 50)); await UI.modal({ title: `${I.name} · 人物小传`, wide: true, html: UI.bioHtml(I.profile, 100, true) }); UI.sheet(); };
      } });
  };

  // v0.9 结局小结：这一趟的几个数 + 每天挣钱的小柱状图
  UI.endSummary = function () {
    const S = G.S(), T = C.endSummary || {}; const L = S.dayLedger;
    const days = (S.dayEarn || []).slice(); if (L) days[L.day - 1] = S.earned - L.earned0;
    const arr = Array.from({ length: days.length }, (_, i) => days[i] || 0); const mx = Math.max(1, ...arr);
    const jobs = Object.entries(S.jobsDone || {}).sort((a, b) => b[1] - a[1]); const top = jobs[0] ? (C.jobs.find(j => j.id === jobs[0][0]) || {}).name + ` ×${jobs[0][1]}` : '没干成过整班';
    const fr = G.npcList().map(n => ({ n, v: S.npc[n.key] })).filter(x => x.v && x.n.name).sort((a, b) => b.v.aff - a.v.aff)[0];
    const li = [`撑了 ${S.ended ? S.ended.day : G.dayNum()} 天`, S.bestDay && S.bestDay.amt > 0 ? `挣得最多的一天：第 ${S.bestDay.day} 天 ¥${S.bestDay.amt}` : '', `干得最多的活：${top}`,
      fr && fr.v.aff > 35 ? `最熟的人：${fr.n.name}（好感 ${Math.round(fr.v.aff)}）` : (T.noFriend || ''), S.soldTotal ? `卖旧东西换了 ¥${S.soldTotal}` : '', S.scrapTotal ? `捡废品攒了 ¥${S.scrapTotal}` : '',
      (S.debts || []).length ? `找人借过 ${(S.debts || []).length} 回，${(S.debts || []).filter(x => !x.paid).length ? '还有没还上的' : '都还上了'}` : ''].filter(Boolean);
    return `<div class="endsum"><h4>${T.title || '这一趟'}</h4><ul>${li.map(x => `<li>${x}</li>`).join('')}</ul>${arr.length > 1 ? `<div class="spark" title="${T.sparkTitle || ''}">${arr.map((v, i) => `<i class="${v ? '' : 'z'}" style="height:${Math.max(2, Math.round(v / mx * 44))}px" title="第${i + 1}天 ¥${v}"></i>`).join('')}</div><div class="spark-cap">${T.sparkTitle || ''}</div>` : ''}</div>`;
  };

  // ---------- 结局 ----------
  UI.ending = function () {
    const S = G.S(), E = C.endings[S.ended.key], I = G.identity();
    if (window.Music) Music.stinger(S.ended.win ? 'win' : 'lose');
    UI.show('end');
    $('#end').innerHTML = `<div class="endbox ${S.ended.win ? 'win' : 'lose'}"><div class="end-art"><div class="end-img" style="background-image:url(${S.ended.win ? A.IMG.corner.dawn : A.IMG.corner.night})"></div></div>
      <div class="end-txt"><p class="kicker">${S.ended.win ? '胜利' : '结局'} · 第 ${S.ended.day} 天 ${S.ended.clock}</p><h1>${E.title}</h1><p>${E.text}</p>
      <ul class="summ"><li>一共挣到 ¥${S.earned}</li>${I.goal.type === 'send' ? `<li>${I.goal.debt ? '还债' : '寄回家'} ¥${S.sent}</li>` : ''}<li>干了 ${S.stats_total.worked} 个整班</li><li>听到 ${S.stories.length} 个故事</li>${I.goal.debt ? '' : ''}<li>印章 ${Object.keys(S.ach || {}).length} 枚</li>${S.cutTotal ? `<li>被中介抽走 ¥${S.cutTotal}</li>` : ''}${S.unpaidTotal ? `<li>被赖掉工钱 ¥${S.unpaidTotal}</li>` : ''}<li>${S.record.count ? `留下案底 ${S.record.count} 次` : '没有案底'}</li><li>顺手牵羊得手 ¥${S.stats_total.stolen}</li></ul>
      ${UI.endSummary()}
      <div class="share-row big">
        <div class="share-prev big" id="share-prev" title="分享图预览"></div>
        <div class="share-actions">
          <p class="share-hint">竖版分享图 · 朋友圈 / 小红书友好</p>
          <button class="btn primary" id="end-share">保存图片 / 晒一晒</button>
          <button class="btn" id="end-album">打开相册${(S.album && S.album.length) ? `（${S.album.length}）` : ''}</button>
          <button class="btn" id="end-again">再来一局</button>
          <button class="btn" id="end-title">回到标题</button>
        </div>
      </div>
      <div class="tip-end-slot" data-tip-slot="end"></div>
      </div></div>`;
    if (window.TIP) TIP.mount($('#end').querySelector('[data-tip-slot]'));
    // 生成分享图
    let card = null;
    const doShare = () => {
      if (!card && window.ShareCard) card = ShareCard.build(S, I, E);
      if (!card) return UI.toast('分享图生成失败', 'bad');
      const name = `勇闯酒仙桥-${I.name}-${S.ended.win ? '离开' : '没离开'}.png`;
      ShareCard.download(card, name);
      UI.toast('已保存分享图，可以发朋友圈啦');
    };
    try {
      if (window.ShareCard) {
        card = ShareCard.build(S, I, E);
        const prev = $('#share-prev');
        const img = document.createElement('img');
        img.alt = '分享图预览'; img.src = card.toDataURL('image/png');
        prev.appendChild(img);
      }
    } catch (e) { console.error('share card', e); }
    $('#end-share').onclick = doShare;
    $('#end-album').onclick = () => UI.album({ fromEnd: true, onShare: doShare });
    $('#end-again').onclick = () => { localStorage.removeItem('jxq_auto_v1'); UI.select(); };
    $('#end-title').onclick = () => { localStorage.removeItem('jxq_auto_v1'); UI.title(); };
  };

  // ---------- 相册（剪贴簿） ----------
  UI.album = function (opts) {
    opts = opts || {};
    const S = G.S(); if (!S) return;
    if (!S.album) S.album = [];
    S.albumSeen = S.album.length;   // v1.0：翻看过就清掉红点
    try { UI.render(); } catch (e) {}
    const KIND = {
      arrive: { label: '抵达', cls: 'k-arrive' },
      send: { label: '寄回家', cls: 'k-send' },
      story: { label: '故事', cls: 'k-story' },
      caught: { label: '案底', cls: 'k-caught' },
      day: { label: '日终', cls: 'k-day' },
      job: { label: '第一份活', cls: 'k-job' },
      moment: { label: '瞬间', cls: 'k-moment' },
      seal: { label: '印章', cls: 'k-seal' },
      cloth: { label: '新衣服', cls: 'k-cloth' }
    };
    const pic = e => { if (e.kind === 'job' && /^job_/.test(e.id)) return A.IMG.job(e.id.slice(4)); return { arrive: A.IMG.corner.dawn, send: A.IMG.place('bank'), story: A.IMG.place('bar'), caught: A.IMG.corner.night, day: A.IMG.place('inn'), seal: A.IMG.title, cloth: A.IMG.place('clothes') }[e.kind] || A.IMG.corner.day; };
    const list = S.album.slice().sort((a, b) => (a.day - b.day) || String(a.clock).localeCompare(String(b.clock)));
    let body;
    if (!list.length) {
      body = `<div class="album-empty"><p class="kicker">剪贴簿还是空的</p><p>寄钱回家、大巴上听故事、第一次干完一份活、撑过一天……这些都会自动收进来。</p><p class="muted">顶栏「相册」随时可以翻看。</p></div>`;
    } else {
      body = `<div class="album-scrap"><p class="album-head">一共 ${list.length} 张 · 按时间排</p>` + list.map((e, i) => {
        const k = KIND[e.kind] || KIND.moment;
        const amt = e.amount != null ? `<span class="album-amt">¥${e.amount}</span>` : '';
        return `<article class="album-card ${k.cls}" style="--tilt:${(i % 2 ? 1.2 : -1.1)}deg"><div class="album-pic" style="background-image:url(${pic(e)})"></div>
          <div class="album-stamp">${k.label}</div>
          <div class="album-meta">第 ${e.day} 天 · ${e.clock}</div>
          <h3>${esc(e.title)}</h3>
          <p>${esc(e.caption || '')}</p>
          ${amt}
        </article>`;
      }).join('') + '</div>';
    }
    const btns = [{ text: '合上相册' }];
    if (opts.fromEnd || (S.ended && window.ShareCard)) btns.unshift({ text: '保存图片 / 晒一晒', cls: 'primary' });
    UI.modal({ title: '相册', wide: true, cls: 'album-modal', html: body, buttons: btns }).then(i => {
      if ((opts.fromEnd || S.ended) && i === 0 && btns.length > 1) {
        if (opts.onShare) opts.onShare();
        else if (window.ShareCard && S.ended) {
          const I = G.identity(), E = C.endings[S.ended.key];
          const card = ShareCard.build(S, I, E);
          ShareCard.download(card, `勇闯酒仙桥-${I.name}-相册晒一晒.png`);
          UI.toast('已保存分享图，可以发朋友圈啦');
        }
      }
    });
  };

  addEventListener('keydown', e => { if ((e.key === 'c' || e.key === 'C') && $('#game').classList.contains('on') && $('#modal').classList.contains('hidden')) UI.sheet(); });
  addEventListener('load', () => { fit(); UI.title(); });
})();
