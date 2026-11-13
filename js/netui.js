// v1.0.2 网吧界面：会员卡 / 论坛 / 证券 / 找活 / 视频 / 电影
(function () {
  const G0 = window.G, C = window.CONFIG, N = C.net, NET = window.NET, S0 = () => G0.S();
  const $ = (el, s) => el.querySelector(s), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fast = () => navigator.webdriver && !window.NET_SLOW;
  const sfx = k => { try { window.FX && FX.sfx && FX.sfx.play(k); } catch (e) { } };
  const money = n => '¥' + n, up = '#d8503c', dn = '#3fae6a';
  const pct = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';
  const colr = x => x > 0 ? 'net-up' : x < 0 ? 'net-dn' : '';
  NET.open = function () {
    return UI.act(async () => {
      const S = S0(); const st = { tab: 'forum', post: null, wiz: null, stock: null, msg: '', msgBad: false, read: null, sign: 0 };
      const settled = NET.settle(); const L = () => LIFE.st();
      await UI.modal({ title: '酒仙桥网吧 · 上网', cls: 'nethub', wide: true, html: '<div id="nethub"></div>', buttons: [{ text: '关机走人', id: 'net-quit' }], onShow: (m, close) => {
        const root = $(m, '#nethub'); let timer = null; const stopT = () => { if (timer) { clearInterval(timer); timer = null; } };
        const say = (t, bad) => { st.msg = t; st.msgBad = !!bad; };
        const head = () => `<div class="net-top"><span>🪪 会员卡剩余 <b id="net-min">${NET.fmtMin(NET.st().min)}</b></span><span class="net-buy">${N.sessions.map(o => `<button class="btn sm ghost" data-a="buytime" data-id="${o.id}">充 ${o.name} ${money(o.price)}</button>`).join('')}</span><span class="muted">口袋 ${money(S.money)}</span></div>
          <div class="net-tabs">${[['forum', '📰 论坛'], ['stock', '📈 炒股'], ['job', '🔎 找活'], ['fun', '🎬 视频 · 电影']].map(([k, t]) => `<button class="net-tab ${st.tab === k ? 'on' : ''}" data-a="tab" data-id="${k}">${t}</button>`).join('')}</div>`;
        const msg = () => st.msg ? `<p class="net-msg ${st.msgBad ? 'bad' : ''}">${esc(st.msg)}</p>` : '';
        // ---------- 论坛 ----------
        const forumView = () => {
          if (st.wiz && st.wiz.kind === 'post') return postWiz();
          const n = NET.st(), list = NET.forumList();
          const my = n.posts.slice().reverse().slice(0, 4).map(p => { const vr = NET.visibleReplies(p); return `<li class="net-my"><b>${esc(p.title)}</b> <small>第 ${p.day} 天</small><br>${p.settled ? (p.tier === 'good' ? `🔥 火了！👍 ${p.likes} · 稿费 ¥${p.pay} · 口碑 +2` : p.tier === 'ok' ? `💬 有几条回复 · 稿费 ¥${p.pay}` : '💢 被网友喷了 · 精神 -4') : '等回复中……明后天来看'}${vr.length ? '<div class="net-reps">' + vr.map(r => `<div><i>${esc(r.user)}</i>：${esc(r.text)}</div>`).join('') + '</div>' : ''}</li>`; }).join('');
          const open = st.read ? `<div class="net-post"><h4>${esc(st.read.title)} <small>[${st.read.cat}]</small></h4><p>${esc(st.read.body)}</p>${(st.read.replies || []).map(r => `<div class="net-rep">💬 ${esc(r)}</div>`).join('')}${st.read.extra ? `<p class="net-extra">${esc(st.read.extra)}</p>` : ''}<button class="btn sm ghost" data-a="closepost">返回列表</button></div>` : '';
          return `<h4 class="net-heading">酒仙桥论坛 <small>桥头的消息，慢慢聊</small></h4>${msg()}${open || `<ul class="net-list">${list.map(p => `<li><button class="net-row ${n.read[p.id] ? 'seen' : ''}" data-a="read" data-id="${p.id}"><span class="net-cat c-${p.cat}">${p.cat}</span> ${esc(p.title)}</button></li>`).join('')}</ul>`}
            <div class="net-row2"><button class="btn" data-a="write">✍️ 我要发帖（${NET.fmtMin(N.costs.forumWrite)}）</button><span class="muted">看一个帖子 ${N.costs.forumRead} 分钟 · 好帖有稿费、有名气，水帖会被喷</span></div>
            ${my ? `<h4>我的帖子</h4><ul class="net-mine">${my}</ul>` : ''}`;
        };
        const postWiz = () => {
          const w = st.wiz;
          if (w.step === 1) return `<h4>发帖 · 第 1 步：选话题</h4><div class="net-choices">${N.topics.map(t => `<button class="btn" data-a="wtopic" data-id="${t.id}">${t.name}</button>`).join('')}</div><button class="btn sm ghost" data-a="wcancel">不写了</button>`;
          if (w.step === 2) { const tp = N.topics.find(t => t.id === w.topic); return `<h4>第 2 步：起标题</h4><div class="net-choices col">${tp.titles.map((t, i) => `<button class="btn ghost" data-a="wtitle" data-id="${i}">${esc(t)}</button>`).join('')}</div><div class="net-row2"><input id="net-title" maxlength="20" placeholder="或者自己写（最多 20 字）" autocomplete="off"><button class="btn" data-a="wtitleown">就用这个</button></div>${msg()}`; }
          if (w.step === 3) return `<h4>第 3 步：语气</h4><p class="muted">标题：${esc(w.title)}</p><div class="net-choices">${N.tones.map(t => `<button class="btn" data-a="wtone" data-id="${t.id}"><b>${t.name}</b><br><small>${t.hint}</small></button>`).join('')}</div>`;
          if (w.step === 4) { const q = N.polish[w.tone][w.round]; return `<h4>第 4 步：润色（${w.round + 1} / 3）</h4><p class="net-sent">“${esc(q[0])}<span class="net-blank">＿＿＿＿</span>”</p><div class="net-time"><i id="net-bar"></i></div><div class="net-choices col">${w.opts.map((o, i) => `<button class="btn ghost" data-a="wpolish" data-id="${i}">${esc(o)}</button>`).join('')}</div><p class="muted">选一句跟「${N.tones.find(t => t.id === w.tone).name}」味道对得上的，8 秒内。已对 ${w.polish} 句。</p>`; }
          return '';
        };
        const startRound = () => { const w = st.wiz; const q = N.polish[w.tone][w.round]; w.opts = q[1].map((t, i) => [t, i]).sort(() => Math.random() - .5); w.right = w.opts.findIndex(o => o[1] === 0); w.opts = w.opts.map(o => o[0]); w.t0 = Date.now(); draw(); stopT(); timer = setInterval(() => { const bar = $(root, '#net-bar'); if (!bar || !root.isConnected) return stopT(); const f = Math.min(1, (Date.now() - w.t0) / 8000); bar.style.width = (100 - f * 100) + '%'; if (f >= 1) { stopT(); pickPolish(-1); } }, 100); };
        const pickPolish = i => { const w = st.wiz; if (!w || w.step !== 4) return; stopT(); const ok = i === w.right; if (ok) { w.polish++; sfx('coin'); } else sfx('bad'); w.round++; if (w.round >= 3) return publish(); say(ok ? '✔ 这一句对味。' : '✘ 这一句有点出戏。', !ok); startRound(); };
        const publish = () => { const w = st.wiz; const r = NET.write({ topic: w.topic, title: w.title, tone: w.tone, polish: w.polish }); st.wiz = null; if (r.err) { say(r.err, true); return draw(); } say(`发出去了！润色答对 ${w.polish}/3。回复和点赞会在接下来两三天里陆续来。`); sfx('coin'); draw(); };
        // ---------- 证券 ----------
        const spark = (id) => { const b = NET.bars(id).slice(-14).map(x => x.c), lo = Math.min(...b), hi = Math.max(...b), w = 70, h = 22; return `<svg width="${w}" height="${h}">${`<polyline fill="none" stroke="${b[b.length - 1] >= b[0] ? up : dn}" stroke-width="1.6" points="${b.map((v, i) => `${(i / Math.max(1, b.length - 1) * w).toFixed(1)},${(h - 2 - (v - lo) / Math.max(.01, hi - lo) * (h - 4)).toFixed(1)}`).join(' ')}"/>`}</svg>`; };
        const stockView = () => {
          if (st.wiz && st.wiz.kind === 'acct') return acctWiz();
          if (!NET.hasAcct()) return `${msg()}<div class="net-intro"><h4>📈 证券账户</h4><p>网吧里能开户炒股：6 支虚构的股票，每天一个价。开户费 <b>${money(N.accountFee)}</b>，手续 <b>${N.accountMin} 分钟</b>，要填表、做风险测评、手写签名。</p><p class="net-warn">${N.disclaimer}</p><button class="btn" data-a="acctstart">我要开户</button></div>`;
          const a = NET.st().acct, hv = NET.holdValue(), pf = NET.portfolio();
          const sum = `<div class="net-sum"><span>证券户现金 <b>${money(a.cash)}</b></span><span>持仓市值 <b>${money(hv)}</b></span><span>合计 <b>${money(a.cash + hv)}</b></span><span class="muted">累计手续费 ${money(a.fees)}</span></div>`;
          const tr = `<div class="net-row2"><input id="net-amt" class="bk-amt" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="整数金额" autocomplete="off"><button class="btn sm" data-a="tin" data-id="pocket">口袋转入</button><button class="btn sm" data-a="tin" data-id="bank">存折转入</button><button class="btn sm ghost" data-a="tout" data-id="pocket">转出到口袋</button><button class="btn sm ghost" data-a="tout" data-id="bank">转出到存折</button></div><p class="muted">存折余额 ${money(L().bank)}（转账会记在存折流水里）</p>`;
          const rows = N.stocks.map(s => { const px = NET.price(s.id), ch = NET.change(s.id); return `<li><button class="net-row stk ${st.stock === s.id ? 'on' : ''}" data-a="stock" data-id="${s.id}"><span>${s.name} <small>${s.code}</small></span><span>${spark(s.id)}</span><b class="${colr(ch)}">${px.toFixed(2)}</b><span class="${colr(ch)}">${pct(ch)}</span></button></li>`; }).join('');
          let det = '';
          if (st.stock) { const s = N.stocks.find(x => x.id === st.stock), h = a.hold[s.id], px = NET.price(s.id), maxB = Math.max(0, Math.floor((a.cash - 1) / (px * (1 + N.tradeFeeRate))));
            det = `<div class="net-det"><h4>${s.name} <small>${s.code} · ${s.blurb}</small></h4><canvas id="net-chart" width="640" height="170"></canvas><p class="muted">红涨绿跌 · 最近 22 个交易日 · 现价 <b>${px.toFixed(2)}</b> · 你持有 <b>${h ? h.n : 0}</b> 股${h ? `（成本 ${(h.cost / h.n).toFixed(2)}）` : ''}</p>
              <div class="net-row2"><input id="net-qty" class="bk-amt" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="股数（整数）" autocomplete="off"><button class="btn sm ghost" data-a="qmaxb">最多买 ${maxB}</button><button class="btn sm ghost" data-a="qmaxs" ${h ? '' : 'disabled'}>全部卖出</button><button class="btn" data-a="buy">买入</button><button class="btn ghost" data-a="sell">卖出</button></div><p class="muted">每笔手续费约 0.3%（至少 ¥1），每次下单 ${N.costs.trade} 分钟。</p></div>`; }
          const pfv = pf.length ? `<h4>持仓</h4><ul class="net-pf">${pf.map(p => `<li>${p.name} · ${p.n} 股 · 成本 ${p.avg.toFixed(2)} → 现价 ${p.px.toFixed(2)} · 市值 ${money(p.val)} · <b class="${colr(p.pl)}">${p.pl >= 0 ? '+' : ''}${p.pl} (${pct(p.pct)})</b></li>`).join('')}</ul>` : '<p class="muted">还没有持仓。</p>';
          return `${msg()}${sum}${tr}<ul class="net-list stocks">${rows}</ul>${det}${pfv}<p class="net-warn">${N.disclaimer}</p>`;
        };
        const acctWiz = () => {
          const w = st.wiz;
          if (w.step === 1) return `<h4>开户 · 第 1 步：填表</h4><div class="net-form"><p>游戏角色：本人 · 虚构客户编号 Q${String(G0.dayNum()).padStart(4, '0')}<br><small>这是游戏内办理，不需要填写真实姓名或手机号。</small></p><p>风险测评（随便答，别太当真）：</p><div class="net-q">1. 手里的钱，你最多愿意亏多少？<br>${[['a', '一分都不想亏'], ['b', '一成左右'], ['c', '亏光也认']].map(([v, t]) => `<label><input type="radio" name="r1" value="${v}"> ${t}</label>`).join('')}</div><div class="net-q">2. 看到一只股票连涨三天，你会？<br>${[['a', '继续观望'], ['b', '小买一点'], ['c', '全押进去']].map(([v, t]) => `<label><input type="radio" name="r2" value="${v}"> ${t}</label>`).join('')}</div><div class="net-q">3. 这笔钱要是亏了，你能接受吗？<br>${[['a', '不能，是饭钱'], ['b', '能，是闲钱'], ['c', '无所谓']].map(([v, t]) => `<label><input type="radio" name="r3" value="${v}"> ${t}</label>`).join('')}</div></div>${msg()}<button class="btn" data-a="af1">下一步：签名</button> <button class="btn ghost sm" data-a="wcancel">不开了</button>`;
          if (w.step === 2) return `<h4>第 2 步：手写签名</h4><p class="muted">在下面的方框里签上你的名字（拖动鼠标或手指）。</p><canvas id="net-sign" width="480" height="130"></canvas><div class="net-row2"><button class="btn ghost sm" data-a="signclear">重签</button><button class="btn" data-a="af2" id="af-sign-ok" disabled>签好了</button></div><p class="net-warn">${N.disclaimer}</p>`;
          if (w.step === 3) return `<h4>第 3 步：交费办理</h4><p>开户费 <b>${money(N.accountFee)}</b>，办理需 <b>${N.accountMin} 分钟</b>上网时间。</p><div class="net-time"><i id="net-prog" style="width:${w.prog || 0}%"></i></div>${msg()}<button class="btn" data-a="af3" ${w.busy ? 'disabled' : ''}>交钱办理</button>`;
          return '';
        };
        // ---------- 找活 / 休闲 ----------
        const jobView = () => { const js = NET.jobChoices(), done = (NET.st().daily.day === G0.dayNum() && NET.st().daily.job && NET.st().daily.job.n); const when = j => `${j.start}–${j.end}`;
          return `${msg()}<p class="muted">招工网站每天更新。今天只能认真查一个（${NET.fmtMin(N.costs.job)}），查了就记在心里，明天去问录取率 +8%。</p><ul class="net-list">${js.map(j => `<li class="net-job"><div><b>${esc(j.name)}</b> <small>${when(j)} · 日结约 ¥${j.wage}${j.meal ? ' · 管饭' : ''}${j.needClean ? ' · 要体面' : ''}</small><br><span class="muted">${esc(j.desc || '')}</span></div><button class="btn sm" data-a="jobsel" data-id="${j.id}" ${done ? 'disabled' : ''}>${done ? '今天查过了' : '就看它'}</button></li>`).join('')}</ul>`; };
        const funView = () => `${msg()}<div class="net-fun"><div><h4>📹 给家里打视频</h4><p class="muted">${NET.fmtMin(N.costs.call)} · 精神 +8 · 一天一次</p><button class="btn" data-a="call">拨过去</button></div><div><h4>🎬 看一部电影</h4><p class="muted">${NET.fmtMin(N.costs.movie)} · 精神 +10 · 体力 +3 · 饱腹 −4 · 一天一次</p><button class="btn" data-a="movie">点播一部</button></div></div>`;
        // ---------- 渲染与事件 ----------
        const draw = () => { root.innerHTML = head() + `<div class="net-body">${st.tab === 'forum' ? forumView() : st.tab === 'stock' ? stockView() : st.tab === 'job' ? jobView() : funView()}</div>`; msgClear(); const cv = $(root, '#net-chart'); if (cv && st.stock) chart(cv, st.stock); const sg = $(root, '#net-sign'); if (sg) signpad(sg); };
        const msgClear = () => { st.msg = ''; st.msgBad = false; };
        const chart = (cv, id) => { const c = cv.getContext('2d'), b = NET.bars(id).slice(-22), W = cv.width, H = cv.height, lo = Math.min(...b.map(x => x.l)) * .98, hi = Math.max(...b.map(x => x.h)) * 1.02, y = v => H - 16 - (v - lo) / Math.max(.01, hi - lo) * (H - 30), bw = W / b.length;
          c.fillStyle = '#16120d'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,230,180,.12)'; c.lineWidth = 1; for (let i = 0; i < 4; i++) { const yy = 10 + i * (H - 30) / 3; c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke(); c.fillStyle = 'rgba(255,230,180,.45)'; c.font = '11px sans-serif'; c.fillText((hi - (hi - lo) * i / 3).toFixed(1), 3, yy - 2); }
          b.forEach((k, i) => { const x = i * bw + bw / 2, u = k.c >= k.o, col = u ? up : dn; c.strokeStyle = col; c.fillStyle = col; c.beginPath(); c.moveTo(x, y(k.h)); c.lineTo(x, y(k.l)); c.stroke(); c.fillRect(x - bw * .3, Math.min(y(k.o), y(k.c)), bw * .6, Math.max(2, Math.abs(y(k.o) - y(k.c)))); }); };
        const signpad = cv => { const c = cv.getContext('2d'); c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, cv.width, cv.height); c.strokeStyle = '#2a2018'; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round'; let on = false, lx = 0, ly = 0, len = st.wiz.len || 0; const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
          cv.onpointerdown = e => { on = true;[lx, ly] = pos(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); }; cv.onpointermove = e => { if (!on) return; const [x, y] = pos(e); c.beginPath(); c.moveTo(lx, ly); c.lineTo(x, y); c.stroke(); len += Math.hypot(x - lx, y - ly); lx = x; ly = y; st.wiz.len = len; const b = $(root, '#af-sign-ok'); if (b) b.disabled = len < 150; }; cv.onpointerup = cv.onpointercancel = () => { on = false; }; };
        root.addEventListener('click', async e => {
          const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a, id = b.dataset.id; const val = s => ($(root, s) || {}).value;
          const apply = r => { if (r.err) { say(r.err, true); sfx('bad'); } return r; };
          if (a === 'tab') { if (id === 'stock' && NET.hasAcct() && st.tab !== 'stock') { const r = NET.use(N.costs.market, '看行情'); if (r.err) { say(r.err, true); draw(); return; } } stopT(); st.tab = id; st.wiz = null; st.read = null; }
          else if (a === 'buytime') { const r = NET.buyTime(id); if (r.err) say(r.err, true); else { say('充好了。'); sfx('coin'); } }
          else if (a === 'read') { const p = NET.forumList().find(x => x.id === id); const r = apply(NET.read(p)); if (!r.err) st.read = Object.assign({}, p, { extra: r.extra }); }
          else if (a === 'closepost') st.read = null;
          else if (a === 'write') { st.wiz = { kind: 'post', step: 1, polish: 0, round: 0 }; }
          else if (a === 'wcancel') { stopT(); st.wiz = null; }
          else if (a === 'wtopic') { st.wiz.topic = id; st.wiz.step = 2; }
          else if (a === 'wtitle') { st.wiz.title = N.topics.find(t => t.id === st.wiz.topic).titles[+id]; st.wiz.step = 3; }
          else if (a === 'wtitleown') { const t = String(val('#net-title') || '').trim(); if (!t) say('标题不能空着。', true); else { st.wiz.title = t; st.wiz.step = 3; } }
          else if (a === 'wtone') { st.wiz.tone = id; st.wiz.step = 4; return startRound(); }
          else if (a === 'wpolish') return pickPolish(+id);
          else if (a === 'acctstart') { st.wiz = { kind: 'acct', step: 1 }; }
          else if (a === 'af1') { const nm = '本人', r = [1, 2, 3].map(i => (root.querySelector(`input[name=r${i}]:checked`) || {}).value); if (r.some(x => !x)) say('三道风险测评都要选。', true); else { st.wiz.name = nm; st.wiz.risk = r.filter(x => x === 'c').length >= 2 ? 'bold' : 'steady'; st.wiz.step = 2; } }
          else if (a === 'signclear') { st.wiz.len = 0; }
          else if (a === 'af2') { st.wiz.step = 3; }
          else if (a === 'af3') { const w = st.wiz; if (S.money < N.accountFee) { say(`开户费 ¥${N.accountFee}，钱不够。`, true); } else if (NET.st().min < N.accountMin) { say(`上网时间不够：要 ${NET.fmtMin(N.accountMin)}，先充钟。`, true); } else { w.busy = true; draw(); const bar = $(root, '#net-prog'); const t0 = Date.now(), D = fast() ? 80 : 1400; await new Promise(res => { const iv = setInterval(() => { const f = Math.min(1, (Date.now() - t0) / D); if (bar) bar.style.width = f * 100 + '%'; if (f >= 1) { clearInterval(iv); res(); } }, 40); }); const r = NET.openAccount({ signed: true, risk: w.risk, name: w.name }); st.wiz = null; if (r.err) say(r.err, true); else { say(w.risk === 'bold' ? '开户成功。你测出来是「胆子大」，也请记得：钱是辛苦挣来的。' : '开户成功。先转点钱进去，别全转。'); sfx('coin'); } } }
          else if (a === 'tin' || a === 'tout') { const r = apply(NET.transfer(a === 'tin' ? 'in' : 'out', id, val('#net-amt'))); if (!r.err) { say(`${a === 'tin' ? '转入' : '转出'} ¥${r.n}。`); sfx('coin'); } }
          else if (a === 'stock') { st.stock = st.stock === id ? null : id; const r = NET.st(); }
          else if (a === 'qmaxb') { const aa = NET.st().acct, px = NET.price(st.stock); $(root, '#net-qty').value = String(Math.max(0, Math.floor((aa.cash - 1) / (px * (1 + N.tradeFeeRate))))); return; }
          else if (a === 'qmaxs') { const h = NET.st().acct.hold[st.stock]; $(root, '#net-qty').value = String(h ? h.n : 0); return; }
          else if (a === 'buy') { const r = apply(NET.buy(st.stock, val('#net-qty'))); if (!r.err) { say(`买入 ${r.n} 股，成交价 ${r.px.toFixed(2)}，花 ¥${r.amt}，手续费 ¥${r.fee}。`); sfx('coin'); } }
          else if (a === 'sell') { const r = apply(NET.sell(st.stock, val('#net-qty'))); if (!r.err) { say(`卖出 ${r.n} 股，成交价 ${r.px.toFixed(2)}，到账 ¥${r.amt - r.fee}（手续费 ¥${r.fee}），${r.pl >= 0 ? '赚' : '亏'} ¥${Math.abs(r.pl)}。`); sfx('coin'); } }
          else if (a === 'jobsel') { const r = apply(NET.jobSearch(id)); if (!r.err) say(`你把「${r.job.name}」的招工细节抄了下来。明天去问，录取率 +8%。`); }
          else if (a === 'call') { const r = apply(NET.call()); if (!r.err) say(r.text + ' 精神 +8'); }
          else if (a === 'movie') { const r = apply(NET.movie()); if (!r.err) say(`${r.name}：${r.text} 精神 +10 · 体力 +3 · 饱腹 −4`); }
          draw(); UI.render && UI.render();
        });
        draw();
        if (settled.length) { settled.forEach(s => { UI.toast(s.post.tier === 'bad' ? `你的帖子「${s.post.title}」被喷了 · 精神 ${s.mental}` : `你的帖子「${s.post.title}」${s.post.tier === 'good' ? '火了' : '有回复'}！稿费 ¥${s.pay}`, s.post.tier === 'bad' ? 'bad' : ''); }); }
      } });
    });
  };
})();
