// 勇闯酒仙桥 v1.0 · 人生阶梯（存折→遇见→恋爱→婚礼→买房→孩子→幼儿园）、澡堂、鱼的用处、回家电话、四季环、冬天提示
(function () {
  const C = window.CONFIG, L = C.life, A = window.ART;
  const { pick, ri, clamp } = G.util;
  const LIFE = window.LIFE = {};
  const $ = s => document.querySelector(s);
  const SS = () => G.S();
  const eff = o => UI.effText(o);

  // ================= 状态 =================
  LIFE.st = function () {
    const s = SS(); if (!s) return null;
    if (!s.life) s.life = { bank: 0, partner: null, met: false, home: null, kid: null, pregnancy: null, done: {}, fish: [], lastMeetRoll: 0, mortgagePaid: 0 };
    if (!s.life.fish) s.life.fish = []; if (!s.life.done) s.life.done = {};
    return s.life;
  };
  G.age = () => (G.identity().age || 30) + Math.floor((G.dayNum() - 1) / L.ageYearDays);
  G.isFemale = () => G.identity().id === 'azhen' || !!G.identity().female;
  { const mg = G.migrate; G.migrate = function () { mg(); const s = SS(); if (s) { LIFE.st(); s.flags = s.flags || {}; // v1.0.1：旧存档里按天数解锁的礼堂/幼儿园，改成要等剧情
      if (s.unlocked) { const l = s.life; s.unlocked['place:hall'] = s.unlocked['place:hall'] || 1; if (!s.flags.kinderOpen && !l.kid) delete s.unlocked['place:kinder']; } } }; }
  { const ng = G.newGame; G.newGame = function (id) { const r = ng(id); LIFE.st(); return r; }; }
  LIFE.funds = () => SS().money + LIFE.st().bank;
  LIFE.pay = amt => { if (LIFE.funds() < amt) return false; const s = SS(), l = LIFE.st(); const c = Math.min(s.money, amt); s.money -= c; l.bank -= (amt - c); return true; };
  LIFE.canMarry = () => G.age() >= L.minMarryAge[G.isFemale() ? 'f' : 'm'] && (!LIFE.st().partner || LIFE.st().partner.age >= L.minMarryAge[G.isFemale() ? 'm' : 'f']);
  LIFE.kidsOk = () => { const p = LIFE.st().partner; return G.age() <= L.kidMaxAge[G.isFemale() ? 'f' : 'm'] && (!p || p.age <= L.kidMaxAge[G.isFemale() ? 'm' : 'f']); };
  LIFE.partnerWord = () => { const p = LIFE.st().partner; return p && p.kind === 'male' ? '他' : '她'; };
  LIFE.title = () => { const p = LIFE.st().partner; return !p ? '' : p.state === 'married' ? (p.kind === 'male' ? '丈夫' : '爱人') : p.state === 'dating' ? '对象' : '认识的人'; };

  // ================= 记账（只在后台记，不给玩家看清单）=================
  LIFE.mark = id => { const l = LIFE.st(); if (!l.done[id]) { l.done[id] = G.dayNum(); return true; } return false; };

  // ================= 自然冒出来的事：好感够了才有礼堂；成了家才有孩子和幼儿园 =================
  const openPlace = id => { const s = SS(); s.unlocked = s.unlocked || {}; if (!s.unlocked['place:' + id]) s.unlocked['place:' + id] = G.dayNum(); };
  LIFE.emerge = function () {
    const s = SS(), l = LIFE.st(), p = l.partner, d = G.dayNum(); s.flags = s.flags || {}; const F = s.flags;
    if (p && p.state === 'dating' && p.aff >= 70 && LIFE.canMarry() && !F.hallOpen) {
      F.hallOpen = d; openPlace('hall'); const w = LIFE.partnerWord();
      G.log(`${p.name}说，路过幸福酒楼的时候，看了好一会儿。`, 'good');
      G.queue.push({ title: `${p.name}提起了一件事`, text: `${p.name}低着头拨弄着衣角：“前两天我路过河对面那个幸福酒楼，红灯笼挂得老高……”${w}没往下说，你也没接话，可你们俩都听懂了。<p class="story">💒 幸福酒楼可以办你们的婚礼了。</p>` });
    }
    if (p && p.state === 'married' && !F.babyTalk && LIFE.kidsOk() && F.married && d - F.married >= 3) {
      F.babyTalk = d;
      G.queue.push({ title: '晚饭桌上', text: `${p.name}把筷子放下，忽然说：“隔壁那家的娃会喊人了……你说，咱们要不要也有个孩子？”<p class="muted">想好了，回家跟${LIFE.partnerWord()}好好商量。</p>` });
    }
    if (l.kid && !F.kinderOpen && d - l.kid.born >= L.kinderAge - 4) {
      F.kinderOpen = d; openPlace('kinder');
      G.log('听说向阳幼儿园开始报名了。', 'good');
      G.queue.push({ title: '向阳幼儿园', text: `楼下邻居拎着菜篮子拦住你：“${l.kid.name}也快到岁数了吧？向阳幼儿园这周开始报名。”<p class="story">🧸 地图上多了一处：向阳幼儿园。</p>` });
    }
  };

  // ================= 每天 =================
  { const nd = G.newDay; G.newDay = function () { nd(); try { LIFE.dayTick(); } catch (e) { console.error(e); } }; }
  LIFE.dayTick = function () {
    const s = SS(), l = LIFE.st(), d = G.dayNum(), p = l.partner;
    // 存折利息：每天按余额结一次（零头攒着，凑够 1 块再进账）
    { const I = L.interest; if (I && l.bank > 0) { const per = I.annual / I.yearDays; l.ifrac = (l.ifrac || 0) + Math.min(l.bank, I.capBank) * per; const whole = Math.floor(l.ifrac + 1e-9); if (whole >= 1) { l.ifrac -= whole; l.bank += whole; l.interestTotal = (l.interestTotal || 0) + whole; l.ledger = l.ledger || []; l.ledger.push({ day: d, kind: 'interest', amt: whole }); if (l.ledger.length > 40) l.ledger.shift(); l.lastInterest = { day: d, amt: whole }; G.log(`存折利息入账 ¥${whole}。`, 'good'); if (window.UI && UI.toast) { try { UI.toast(`存折利息 +¥${whole}`); } catch (e) { } } } } }
    // 好感会淡：很多天不联系
    if (p && p.state !== 'married' && d - (p.last || d) > 6) { p.aff = Math.max(p.state === 'dating' ? 35 : 15, p.aff - 1.5); }
    // 结婚后她/他每天往存折里存点
    if (p && p.state === 'married' && !(l.pregnancy && (l.pregnancy.due - d) < 6)) { l.bank += L.partnerDaily; p.income = (p.income || 0) + L.partnerDaily; if (d % 7 === 0) G.log(`${p.name}这一周又往存折里存了 ¥${L.partnerDaily * 7}。`, 'good'); }
    // 孩子的日常开销
    if (l.kid) { if (!LIFE.pay(L.kidDaily)) { G.change({ mental: -2 }); if (d % 3 === 0) G.log('孩子的奶粉钱不够了，你心里发急。', 'bad'); } }
    // 月供
    const h = l.home; if (h) {
      if (d >= h.nextDue) { h.arrears = (h.arrears || 0) + h.monthly; h.nextDue += L.payDays; }
      if (h.arrears > 0) { const pay = Math.min(h.arrears, LIFE.funds()); if (pay > 0) { LIFE.pay(pay); h.arrears -= pay; h.paidTotal = (h.paidTotal || 0) + pay; if (h.arrears <= 0) G.log(`月供 ¥${pay} 从存折里自动扣了。`, 'warn'); } if (h.arrears > 0) { G.change({ mental: -3 }); if (d % 2 === 0) G.log(`月供还差 ¥${h.arrears} 没交上。银行的短信一条接一条。`, 'bad'); } }
    }
    // 生孩子
    if (l.pregnancy && d >= l.pregnancy.due) { l.pregnancy = null; const boy = Math.random() < .5; l.kid = { born: d, name: boy ? pick(['安安', '小宇', '乐乐']) : pick(['朵朵', '糯糯', '小满']), boy, enrolled: false, feeUntil: 0 }; G.change({ mental: 20 }); G.log(`${p.name}生下了孩子，是个${boy ? '男孩' : '女孩'}，取名${l.kid.name}。`, 'good'); G.addAlbum({ id: 'kid', kind: 'moment', title: '孩子出生了', caption: `${l.kid.name}，母子平安。` }); G.queue.push({ title: '孩子出生了', text: `产房外走廊的灯很亮。护士把孩子抱出来：“是个${boy ? '男孩' : '女孩'}，六斤四两。”你的手抖得接不住。孩子叫${l.kid.name}。`, eff: { mental: 20 } }); }
    // 冬天没厚衣服：每天早上提醒
    const sea = G.season(); if (sea && sea.id === 'winter' && !G.outfit().warm) { const n = (s.flags.coldNag = (s.flags.coldNag || 0) + 1); if (!G.warmed() && (n <= 3 || n % 2 === 0)) G.queue.push({ title: '❄ 太冷了', text: C.winterNag.morning + `（最便宜的棉服 ¥${LIFE.cheapWarm()}）` }); }
    LIFE.emerge();
  };
  LIFE.cheapWarm = () => Math.min.apply(null, C.clothes.filter(c => c.warm).map(c => c.price));

  // 冬天缺衣服：状态条
  { const cd = G.conds; G.conds = function () { const out = cd(); const sea = G.season(); if (sea && sea.id === 'winter' && !G.outfit().warm && !G.warmed()) out.push({ id: 'cold', icon: '🥶', label: '没有厚衣服', lv: 'warn', tip: `天冷，体力掉得更快、站在室外很快冻透。去服装店买件棉服（最便宜 ¥${LIFE.cheapWarm()}）` }); return out; }; }

  // ================= 回家电话 =================
  G.callLines = function () {
    const S = SS(), I = G.identity(), P = C.callPools, F = C.callFamily[I.id] || { who: '家里', ask: ['“吃了没？”'], me: '“吃了。”' }; const h = G.hourF(), d = G.dayNum(), l = LIFE.st(); const sea = G.season();
    const used = []; const take = arr => { let x = pick(arr), n = 0; while (used.includes(x) && n++ < 6) x = pick(arr); used.push(x); return x; };
    const o = h < 10 ? P.open.morning : h < 20 ? P.open.day : P.open.night;
    const money = S.money + l.bank; const mp = money < 60 ? P.money.broke : money > 1500 ? P.money.rich : P.money.ok;
    const ev = []; if (G.hasRecord()) ev.push(...P.event.record); if (G.debuff && (G.debuff('sore') || S.stats.stamina < 30)) ev.push(...P.event.injured); if ((S.debts || []).some(x => !x.paid)) ev.push(...P.event.debt);
    if (l.partner && l.partner.state === 'dating') ev.push(...P.event.dating); if (l.partner && l.partner.state === 'married') ev.push(...P.event.married); if (l.home) ev.push(...P.event.home); if (l.kid) ev.push(...P.event.kid);
    const stage = d < 5 ? P.early : d < 20 ? P.middle : P.late;
    const lines = [take(o), take(P.me)];
    lines.push(take(Math.random() < .5 || !ev.length ? P.season[sea ? sea.id : 'autumn'] : ev), take(P.me));
    lines.push(take(Math.random() < .5 ? mp : stage.concat(F.ask)), take(P.me));
    if (ev.length && Math.random() < .6) { lines.push(take(ev), take(P.me)); }
    lines.push(take(P.close));
    return lines.map(t => t.replace('{who}', F.who));
  };

  // ================= 鱼 =================
  LIFE.fishCount = () => LIFE.st().fish.length;
  LIFE.gainFish = function (name) { const k = C.fishKinds.find(f => f.name === name) || pick(C.fishKinds); const l = LIFE.st(); l.fish.push({ name: k.name, sell: ri(k.sell[0], k.sell[1]), hunger: k.hunger, mental: k.mental }); if (l.fish.length > 6) l.fish.shift(); return k; };

  // ================= 面板 =================
  const ACTS = ['bath', 'bankbook', 'fish', 'fishsell', 'fishcook', 'fishgive', 'partner', 'hallwed', 'hallpeek', 'hallphoto', 'salesview', 'salespay', 'salespeek', 'kinderenroll', 'kinderpick', 'kinderfee', 'kinderpeek', 'homecook', 'homefish', 'homebaby', 'homechat', 'homestay'];
  LIFE.has = k => ACTS.includes(k);
  const ICON = { bath: '🛁', bankbook: '📒', life: '🌱', fishsell: '💴', fishcook: '🍲', fishgive: '🎁', partner: '💞', hallwed: '💒', hallpeek: '👀', hallphoto: '📸', salesview: '🏘️', salespay: '🧾', salespeek: '🪟', kinderenroll: '📝', kinderpick: '🎒', kinderfee: '🧾', kinderpeek: '🧸', homecook: '🍳', homefish: '🐟', homebaby: '👶', homechat: '💬', homestay: '🏡' };
  { const ai = UI.actIcon; UI.actIcon = id => ICON[id.split(':')[0]] || ai(id); }

  LIFE.panel = function (loc, btn, open) {
    const S = SS(), l = LIFE.st(), A2 = [], P = l.partner; let html = '', top = '';
    // 冬天没厚衣服：横幅一直挂着
    { const sea = G.season(); if (sea && sea.id === 'winter' && !G.outfit().warm) top += `<div class="cold-banner"><b>🥶</b><span>${C.winterNag.banner.replace('{p}', LIFE.cheapWarm())}</span>${loc !== 'clothes' ? '<button class="btn sm" data-golife="clothes">去服装店</button>' : ''}</div>`; }
    if (loc === 'bath' && open) {
      { const win = G.season() && G.season().id === 'winter'; const cap = it => Math.max(0, G.decency(it) );
        html += `<div class="bath-cards">${C.bath.items.map(it => { const lines = [`体面 +${it.dec}`, it.stamina ? `体力 +${it.stamina}` : '', it.mental ? `精神 +${it.mental}` : ''].filter(Boolean); const wb = win && (C.bath.winterBonus.ids || []).includes(it.id);
          return `<button class="act bath-card ${it.id === 'rub' ? 'gold' : ''}" data-a="bath:${it.id}"><div class="bc-h"><i class="ic">${UI.actIcon('bath:' + it.id)}</i><b>${it.name}</b><span class="bc-p">¥${it.price} · ${it.minutes} 分钟</span></div><div class="bc-e">${lines.map(x => `<span class="${/体面/.test(x) ? 'dec' : 'up'}">${x}</span>`).join('')}</div>${it.perks.length ? `<ul class="bc-perks">${it.perks.map(x => `<li>${x}</li>`).join('')}</ul>` : `<p class="bc-note">${it.note}</p>`}</button>`; }).join('')}</div>`; }
      if (G.season() && G.season().id === 'winter') html += `<p class="muted">${C.bath.winterBonus.text}</p>`;
      html += `<p class="muted tiny">现在体面 ${G.decency()}。洗完体面会涨——能涨到多高，还要看身上穿的衣服。</p>`;
    }
    if (loc === 'bank') A2.push(btn('bankbook', '存折：存钱 / 取钱', `存折里 ¥${l.bank} · 放在存折里小偷偷不走`, 'gold'));
    if (loc === 'food') { if (l.fish.length) { A2.push(btn('fishcook', '把鱼拿给后厨炖了', `¥${C.fishUse.cook.price} 加工费 · 手里有 ${l.fish.length} 条`)); A2.push(btn('fishsell', '把鱼卖给饭馆老板', `按条收 · 约 ¥${l.fish[0].sell} 一条`)); } }
    if (l.fish.length && loc !== 'food') { const who = LIFE.fishTargets(loc); if (who.length) A2.push(btn('fishgive', '把鱼送给熟人', `${who[0].name} 在这儿 · 好感 +${C.fishUse.gift.aff}`)); }
    if (loc === 'sales' && open) {
      A2.push(btn('salesview', l.home ? '看看我的房子 / 还款' : '看楼盘', l.home ? `${l.home.name} · 已还 ¥${l.home.paidTotal || 0}` : `三种户型 · 首付三成 · 存折 ¥${l.bank}`, 'gold'));
      A2.push(btn('salespeek', '趴在沙盘前看一会儿', '15 分钟 · 心里有个盼头'));
      html += `<p class="muted">首付要从<b>存折</b>里出，口袋里的现金不算。</p>`;
    }
    if (loc === 'hall') {
      if (open) { A2.push(btn('hallwed', P && P.state === 'married' ? '我们的婚礼办过了' : '订日子办婚礼', P && P.state === 'dating' ? `彩礼 ¥${L.bride} + 酒席 ¥${L.weddings[0].price} 起` : '红幕布还挂着', 'gold')); A2.push(btn('hallpeek', '在场地里转转', '15 分钟')); }
      if (P && P.state === 'married') A2.push(btn('hallphoto', '去拍张合影', '¥60 · 精神+4'));
    }
    if (loc === 'kinder' && open) {
      const k = l.kid;
      if (k && !k.enrolled && G.dayNum() - k.born >= L.kinderAge) A2.push(btn('kinderenroll', '给孩子报名入园', `¥${L.kinderFee}（头一个月）`, 'gold'));
      else if (k && k.enrolled) { A2.push(btn('kinderpick', '接孩子放学', '30 分钟 · 精神+6', 'gold')); A2.push(btn('kinderfee', k.feeUntil > G.dayNum() ? `学费已交到第 ${k.feeUntil} 天` : '交这个月学费', `¥${L.kinderFee} / ${L.kinderDays} 天`, k.feeUntil > G.dayNum() ? 'dim' : 'warn')); }
      A2.push(btn('kinderpeek', '在栏杆外看一会儿', '10 分钟'));
    }
    if (loc === 'home') {
      A2.push(btn('homecook', '做顿家常饭', '¥10 · 一小时 · 饱腹+55 · 精神+3'));
      if (l.fish.length) A2.push(btn('homefish', '把鱼炖了', '免费 · 饱腹+46 · 精神+5'));
      if (P && P.state === 'married') A2.push(btn('homechat', `跟${P.name}说说话`, '30 分钟 · 精神+6'));
      if (P && P.state === 'married' && S.flags.babyTalk && LIFE.kidsOk() && !l.kid && !l.pregnancy) A2.push(btn('homebaby', '商量要个孩子', `${L.babyDays} 天后出生 · 以后每天开销 ¥${L.kidDaily}`));
      if (l.pregnancy) html += `<p class="muted">${P.name}怀着孩子，还有 ${Math.max(0, l.pregnancy.due - G.dayNum())} 天。</p>`;
      if (l.home && l.home.arrears > 0) html += `<div class="window warnw">月供还差 ¥${l.home.arrears} 没交上，存折里钱不够。</div>`;
      const end = LIFE.endChoice(); if (end) A2.push(btn('homestay', '就这样安稳地过下去', `结局：${C.lifeEndings[end].title}`, 'gold'));
    }
    // 她/他在这儿
    if (LIFE.partnerHere(loc)) A2.push(btn('partner', `${P.name}`, `${LIFE.title()} · 好感 ${Math.round(P.aff)} · 聊聊`, 'gold'));
    return { acts: A2, html, top };
  };
  LIFE.fishTargets = loc => G.npcList().filter(n => (n.where || []).includes(loc) && SS().npc[n.key]);

  // ================= 她/他 =================
  LIFE.partnerHere = function (loc) {
    const l = LIFE.st(), p = l.partner; if (!p) return false; const h = G.hourF(), d = G.dayNum();
    if (p.state === 'married') return (loc === 'home' && l.home) || (loc === 'inn' && !l.home && G.roomOwned()) || (loc === 'riverside' && h >= 17 && h < 22 && d % 3 === 0);
    if (loc === 'riverside') return h >= 17 || h < 1;
    if (loc === 'food') return (h >= 11.5 && h < 14) || (h >= 17.5 && h < 20);
    if (loc === 'bath') return h >= 18 && h < 22 && d % 2 === 1;
    return false;
  };
  LIFE.makePartner = function () {
    const f = G.isFemale(), age = G.age(), D = C.partnerDefs; let kind = f ? 'male' : 'female', def = D[kind];
    if (age >= 50) { kind = f ? 'male' : 'widow'; def = D[kind]; }
    const pAge = kind === 'widow' ? Math.max(40, age - 4) : f ? age + 3 : Math.max(18, age - 2);
    return { kind, name: pick(def.names), age: pAge, look: Object.assign({}, def.look, { age: pAge }), job: def.job, home: def.home, aff: 14, state: 'met', talks: 0, dates: 0, met: G.dayNum(), last: G.dayNum(), today: { day: 0, n: 0 }, gifts: {} };
  };
  LIFE.onArrive = async function (loc) {
    const S = SS(), l = LIFE.st(), h = G.hourF();
    const sea = G.season(); if (sea && sea.id === 'winter' && !G.outfit().warm && (C.seasons.outdoorPlaces || []).includes(loc)) UI.toast(C.winterNag.toast, 'bad');
    const M = L.meet; if (!l.met && G.dayNum() >= M.minDay && M.where.includes(loc) && l.lastMeetRoll !== G.dayNum()) {
      const win = loc === 'riverside' ? (h >= 17 || h < 1) : loc === 'food' ? ((h >= 11.5 && h < 14) || (h >= 17.5 && h < 20)) : (h >= 17 && h < 22);
      if (win && S.stats.mental >= 25) { l.lastMeetRoll = G.dayNum(); if (Math.random() < M.p || G.dayNum() >= M.minDay + 6) await LIFE.meet(loc); }
    }
  };
  LIFE.card = (p, mood, extra) => `<div class="talk"><div class="pt">${A.portrait(p.look, { mood: mood || 'neutral' })}</div><div><b>${p.name}</b> <small>${p.age}岁 · ${p.job}${p.state ? ' · ' + LIFE.title() : ''}</small>${extra || ''}</div></div>`;
  LIFE.meet = async function (loc) {
    const l = LIFE.st(); const p = LIFE.makePartner(); l.partner = p; l.met = true; SS().flags.metPartner = G.dayNum();
    const L1 = C.partnerLines.meet[loc].map(t => t.replace('{name}', p.name).replace('{job}', p.job));
    G.advance(20); if (window.SFX || (window.FX && FX.sfx)) FX.sfx.play('chime');
    await UI.modal({ title: '碰上了一个人', bg: A.placeImg(loc, G.hourF()), html: `<div class="partner-meet">${LIFE.card(p, 'smile')}<p>${L1[0]}</p><p>${L1[1]}</p></div><p class="story">💞 以后在${loc === 'riverside' ? '河边' : loc === 'food' ? '饭馆' : '澡堂'}附近，也许还会碰见${LIFE.partnerWord()}。</p>`, buttons: [{ text: '点点头' }, { text: '互相留了个联系方式' }] });
    p.aff = 22; G.log(`在${C.places.find(x => x.id === loc).name}碰见了${p.name}。`, 'good'); G.addAlbum({ id: 'met', kind: 'moment', title: `碰见了${p.name}`, caption: L1[0].slice(0, 28) });
    G.checkUnlocks();
  };
  LIFE.partnerLimit = p => { const d = G.dayNum(); if (p.today.day !== d) p.today = { day: d, n: 0 }; return p.today.n >= 4; };
  LIFE.partnerMenu = function () {
    return UI.act(async () => {
      const l = LIFE.st(), p = l.partner, S = SS(); if (!p) return;
      for (let guard = 0; guard < 12; guard++) {
        const loc = S.loc, d = G.dayNum(); const lim = LIFE.partnerLimit(p); const marry = p.state === 'married';
        const hearts = '♥'.repeat(Math.round(p.aff / 20)) + '♡'.repeat(5 - Math.round(p.aff / 20));
        const gifts = L.gifts.filter(g => !(g.once && p.gifts[g.id]));
        const opts = []; const run = [];
        const add = (t, fn, dis) => { opts.push({ text: t, disabled: !!dis }); run.push(fn); };
        add('聊几句（30 分钟）', async () => { await LIFE.pAct(p, { min: 30, aff: p.aff < 40 ? 6 : 4, mental: 3, lines: C.partnerLines.chat, title: '聊聊' }); }, lim);
        if (loc === 'riverside') add('沿着河边走走（40 分钟）', async () => { await LIFE.pAct(p, { min: 40, aff: 6 + (G.hourF() >= 18 || G.hourF() < 5 ? 1 : 0), mental: 5, stamina: -1, lines: C.partnerLines.walk, title: '一起走走' }); }, lim);
        if (loc === 'food') add(`请${LIFE.partnerWord()}吃一碗面（¥30）`, async () => { if (S.money < 30) return UI.toast('钱不够。', 'bad'); S.money -= 30; await LIFE.pAct(p, { min: 40, aff: 8, mental: 4, hunger: 30, lines: C.partnerLines.dine, title: '吃饭', dish: 'noodle' }); }, lim || S.money < 30);
        add('送个小东西…', async () => {
          const gi = await UI.modal({ title: '送什么？', html: `<p class="muted">送礼不用多贵，送到心上。你手里 ¥${S.money}。</p>`, buttons: gifts.map(g => ({ text: `${g.name} ¥${g.price}（好感+${g.aff}）`, disabled: S.money < g.price })).concat([{ text: '算了', cls: 'ghost' }]) });
          const g = gifts[gi]; if (!g) return; S.money -= g.price; p.gifts[g.id] = (p.gifts[g.id] || 0) + 1; await LIFE.pAct(p, { min: 10, aff: g.aff, mental: 3, lines: [`${LIFE.partnerWord()}接过${g.name.split('（')[0]}，翻来覆去看了好几遍，没说话，嘴角翘了起来。`], title: '送礼', noTime: false });
        }, lim);
        if (p.state === 'met') add(`说出口：想跟${LIFE.partnerWord()}好好处处`, async () => { await LIFE.confess(p); }, false);
        if (p.state === 'dating' && S.flags.hallOpen) add('谈谈以后的事（婚礼）', async () => { await UI.modal({ title: '以后', bg: A.IMG.place('hall'), html: LIFE.card(p, 'smile', `<p>${C.partnerLines.proposeOk}</p>`) + `<p class="muted">要办婚礼，得去<b>幸福酒楼</b>订日子：彩礼 ¥${L.bride} + 酒席 ¥${L.weddings[0].price}～${L.weddings[2].price}。好感要到 70 以上（现在 ${Math.round(p.aff)}）。${LIFE.canMarry() ? '' : `<br>你们现在年纪还没到领证的时候。`}</p>` }); }, false);
        if (marry) add('一起坐一会儿（30 分钟）', async () => { await LIFE.pAct(p, { min: 30, aff: 1, mental: 6, lines: ['你们没说几句话，她把头靠在你肩上。屋里很安静。', '电视开着没人看。她给你剥了个橘子。', '“今天累不累？”“还行。”就这么两句，也让人心里踏实。'], title: '一起坐会儿' }); }, false);
        add('先回去了', null);
        const i = await UI.modal({ title: LIFE.title() + ' · ' + p.name, wide: true, bg: A.placeImg(loc, G.hourF()), html: `${LIFE.card(p, p.aff >= 50 ? 'smile' : 'neutral', `<p class="hearts">好感 <b>${hearts}</b> ${Math.round(p.aff)}</p>`)}<p class="muted">${lim ? `今天已经聊了好几回，让${LIFE.partnerWord()}歇歇。` : `${p.job}，${p.home}。`}</p>`, buttons: opts });
        if (!run[i]) break; await run[i]();
      }
    });
  };
  LIFE.pAct = async function (p, o) {
    const S = SS(); p.today.n++; p.last = G.dayNum(); p.dates++;
    if (!o.noTime) G.advance(o.min); const before = Math.round(p.aff); p.aff = clamp(p.aff + o.aff, 0, 100);
    G.change({ mental: o.mental || 0, stamina: o.stamina || 0, hunger: o.hunger || 0 }); FX.sfx && FX.sfx.play('chime');
    const line = Array.isArray(o.lines) ? o.lines[(p.talks++) % o.lines.length] : o.lines;
    await UI.modal({ title: o.title, bg: A.placeImg(S.loc, G.hourF()), html: `${LIFE.card(p, 'smile')}<p>${line}</p><p class="eff"><span class="up">好感 +${Math.round(p.aff) - before}</span></p>${eff({ mental: o.mental, hunger: o.hunger, stamina: o.stamina })}${o.dish ? `<div class="food-preview"><div class="fp-art">${A.dish(o.dish)}</div></div>` : ''}`, buttons: [{ text: '嗯' }] });
    G.log(`和${p.name}${o.title}。`, 'good'); if (p.state === 'dating' && p.aff >= 70 && !p.say70) { p.say70 = 1; G.log(`你开始认真想：要不要跟${p.name}办场婚礼。`, 'good'); }
    LIFE.emerge();
  };
  LIFE.confess = async function (p) {
    const S = SS(); G.advance(15);
    const okp = p.aff >= 50 && (p.aff >= 62 || Math.random() < clamp(0.4 + p.aff / 120 + (G.decency() - 40) / 300, .2, .9));
    if (okp) { p.state = 'dating'; p.aff = Math.max(p.aff, 56); G.change({ mental: 14 }); G.log(`你和${p.name}在一起了。`, 'good'); G.addAlbum({ id: 'dating', kind: 'moment', title: `和${p.name}在一起了`, caption: C.partnerLines.confess.ok.slice(0, 24) }); LIFE.mark('love'); FX.sfx && FX.sfx.play('fanfare'); await UI.modal({ title: '在一起了', bg: A.placeImg(S.loc, G.hourF()), html: `${LIFE.card(p, 'smile')}<p>${C.partnerLines.confess.ok}</p>${eff({ mental: 14 })}`, buttons: [{ text: '嗯' }] }); }
    else { p.aff = Math.max(8, p.aff - (p.aff >= 40 ? 3 : 6)); G.log('你鼓足勇气开了口，对方说再等等。', 'warn'); await UI.modal({ title: '再等等', bg: A.placeImg(S.loc, G.hourF()), html: `${LIFE.card(p, 'neutral')}<p>${C.partnerLines.confess.no}</p><p class="muted">${p.aff < 50 ? '好感还不够（要 50 以上才有把握）。多聊聊、请吃饭、送点小东西。' : '再多相处几天，会有把握的。'}</p>`, buttons: [{ text: '好。' }] }); }
  };

  // ================= 礼堂 / 婚礼 =================
  LIFE.weddingFlow = function () {
    return UI.act(async () => {
      const S = SS(), l = LIFE.st(), p = l.partner;
      if (!p) return UI.modal({ title: '幸福酒楼', bg: A.IMG.place('hall'), html: '<p>管事的大姐翻着台历：“新人呢？”你支吾了一下。她笑笑：“有对象了再来。”</p>' });
      if (p.state === 'married') return UI.modal({ title: '幸福酒楼', bg: A.IMG.place('hall'), html: '<p>墙上还挂着你们那天的红绸子。</p>' });
      if (p.state !== 'dating') return UI.modal({ title: '幸福酒楼', bg: A.IMG.place('hall'), html: `<p>还没跟${p.name}在一起呢，先把话说开。</p>` });
      if (!LIFE.canMarry()) return UI.modal({ title: '幸福酒楼', bg: A.IMG.place('hall'), html: `<p>管事的大姐看了看你的身份证：“年纪还没到，领不了证。”</p><p class="muted">你今年 ${G.age()} 岁，要 ${L.minMarryAge[G.isFemale() ? 'f' : 'm']} 岁才行。先谈着，不着急。</p>` });
      if (p.aff < 70) return UI.modal({ title: '幸福酒楼', bg: A.IMG.place('hall'), html: `<p>你站在红圆桌前想了半天，还是觉得——要等${p.name}真的点头那天。</p><p class="muted">好感要到 70（现在 ${Math.round(p.aff)}）：多相处、一起吃饭、送点小东西。</p>` });
      const W = L.weddings; const total = i => L.bride + W[i].price;
      const i = await UI.modal({ title: '订日子办婚礼', wide: true, bg: A.IMG.place('hall'), html: `<p>管事的大姐拿出价目表：“彩礼是你们两家的事，这里只管场地和酒席。”</p><p class="muted">彩礼 ¥${L.bride}（给${p.name}家里的心意，这是规矩）+ 酒席。现金 ¥${S.money} + 存折 ¥${l.bank}。</p>`, buttons: W.map((w, k) => ({ text: `${w.name} · 共 ¥${total(k)}`, disabled: LIFE.funds() < total(k) })).concat([{ text: '再攒攒', cls: 'ghost' }]) });
      const w = W[i]; if (!w) return; if (!LIFE.pay(total(i))) return UI.toast('钱不够。', 'bad');
      G.advance(180); p.state = 'married'; p.aff = Math.min(100, p.aff + 6 + w.aff); S.flags.married = G.dayNum(); G.change({ mental: 25 }); LIFE.mark('wed');
      G.log(`你和${p.name}办了婚礼（${w.name.split('：')[0]}）。`, 'good'); G.addAlbum({ id: 'wedding', kind: 'milestone', title: '结婚了', caption: `${w.tables} 桌酒席，红幕布下说了“我愿意”。` }); G.addStamp && G.addStamp('wedding', '囍', '婚礼');
      if (window.FX) await FX.micro('wedding');
      await UI.modal({ title: '结婚了', bg: A.IMG.place('hall'), html: `${LIFE.card(p, 'smile')}<p>${w.line}</p><p>从今天起，${p.name}每天会往存折里存点钱；有了地方，你们就能搬到一起。</p><p class="eff"><span class="down">花了 ¥${total(i)}</span> <span class="up">精神 +25</span></p>`, buttons: [{ text: '回家' }] });
    });
  };

  // ================= 售楼处 =================
  LIFE.salesView = function () {
    return UI.act(async () => {
      for (let g = 0; g < 8; g++) {
        const S = SS(), l = LIFE.st(), h = l.home;
        if (h) { // 已经买了：还款
          const k = await UI.modal({ title: '我的房子', bg: A.placeImg('sales', G.hourF()), html: `<p><b>${h.name}</b> · 总价 ¥${h.total} · 首付 ¥${h.down} · 每 ${L.payDays} 天还 ¥${h.monthly}</p><p>已还 ¥${h.paidTotal || 0}${h.arrears > 0 ? `，<b style="color:#ff9d84">本月还差 ¥${h.arrears}</b>` : '，没有欠款'}。存折 ¥${l.bank}。</p><p class="muted">月供每月自动从存折里扣。也可以先把钱存进去，别断了。</p>`, buttons: [{ text: '好' }] });
          return;
        }
        const options = L.houses.map(x => { const down = Math.round(x.total * L.downRate), fee = Math.round(x.total * L.feeRate); return { x, down, fee, ok: l.bank >= down + fee }; });
        const i = await UI.modal({ title: '安居里 · 户型', wide: true, bg: A.placeImg('sales', G.hourF()), html: `<p class="muted">销售员递过水杯：“首付三成，从存折里出；剩下的分期，每月自动扣。”你的存折：<b>¥${l.bank}</b></p>` + options.map(o => `<div class="house-row"><b>${o.x.name}</b> <small>${o.x.area}㎡ · ${o.x.tag}</small><div>总价 ¥${o.x.total} · 首付 ¥${o.down} + 手续费 ¥${o.fee} · 月供 ¥${o.x.monthly}</div><p class="muted tiny">${o.x.text}</p></div>`).join(''), buttons: options.map(o => ({ text: `买「${o.x.name}」（首付+费用 ¥${o.down + o.fee}）`, disabled: !o.ok })).concat([{ text: '再想想', cls: 'ghost' }]) });
        const o = options[i]; if (!o) return;
        const go = await UI.modal({ title: '确认', bg: A.placeImg('sales', G.hourF()), html: `<p>买「${o.x.name}」？首付和手续费共 <b>¥${o.down + o.fee}</b> 从存折里出，之后每 ${L.payDays} 天还 ¥${o.x.monthly}。</p>`, buttons: [{ text: '签字' }, { text: '再想想', cls: 'ghost' }] });
        if (go !== 0) continue; if (l.bank < o.down + o.fee) return UI.toast('存折里不够。', 'bad');
        l.bank -= o.down + o.fee; l.home = { id: o.x.id, name: o.x.name, total: o.x.total, down: o.down, loan: o.x.total - o.down, monthly: o.x.monthly, bought: G.dayNum(), nextDue: G.dayNum() + L.payDays, paidTotal: 0, arrears: 0 };
        S.flags.ownsHome = G.dayNum(); LIFE.mark('home'); G.change({ mental: 20 }); G.checkUnlocks(); G.log(`买下了「${o.x.name}」，有自己的家了。`, 'good'); G.addAlbum({ id: 'home', kind: 'milestone', title: '有了自己的家', caption: `「${o.x.name}」，钥匙在自己手里。` }); G.addStamp && G.addStamp('home', '家', '买房');
        FX.sfx && FX.sfx.play('fanfare'); await UI.modal({ title: '签字', bg: A.placeImg('sales', G.hourF()), html: `<p>笔尖落下去的时候手有点抖。销售员递来一串钥匙：“恭喜。”</p><p>你攥着钥匙站在玻璃房子外面，半天没往前走。</p><p class="story">🏠 地图上多了一个「我的小家」，睡觉不用花钱，睡得最踏实。</p>${eff({ mental: 20 })}`, buttons: [{ text: '回家看看' }] });
        return;
      }
    });
  };

  // ================= 幼儿园 =================
  LIFE.kinderFlow = function (kind) {
    return UI.act(async () => {
      const S = SS(), l = LIFE.st(), k = l.kid;
      if (kind === 'peek') { G.advance(10); G.change({ mental: 2 }); return UI.modal({ title: '向阳幼儿园', bg: A.placeImg('kinder', G.hourF()), html: `<p>${k ? `你想着${k.name}长到能进来的那天。` : '铁栏杆里，几个小孩在滑梯上笑。你站着看了好一会儿，想了想以后。'}</p>${eff({ mental: 2 })}` }); }
      if (!k) return;
      if (kind === 'enroll') { if (!LIFE.pay(L.kinderFee)) return UI.toast('学费不够。', 'bad'); k.enrolled = true; k.feeUntil = G.dayNum() + L.kinderDays; LIFE.mark('school'); G.change({ mental: 15 }); G.addAlbum({ id: 'school', kind: 'milestone', title: '孩子上幼儿园了', caption: `${k.name}背着小书包，回头挥了挥手。` }); G.log(`${k.name}上幼儿园了。`, 'good'); FX.sfx && FX.sfx.play('chime'); return UI.modal({ title: '入园', bg: A.placeImg('kinder', G.hourF()), html: `<p>老师蹲下来：“你叫${k.name}对不对？”孩子点头，小手攥着你的衣角，攥了好一会儿才松开。</p><p class="story">🧸 孩子上了幼儿园。你站在栏杆外面，突然发现这里不再只是“打工的地方”了。</p>${eff({ mental: 15, money: -L.kinderFee })}` }); }
      if (kind === 'pick') { G.advance(30); G.change({ mental: 6 }); const h = G.hourF(); return UI.modal({ title: '接放学', bg: A.placeImg('kinder', G.hourF()), html: `<p>${k.name}一路小跑冲过来，扑进你怀里：“爸爸/妈妈！我今天得了一朵小红花！”</p>${eff({ mental: 6 })}` }); }
      if (kind === 'fee') { if (k.feeUntil > G.dayNum()) return UI.toast('这个月学费已经交了。'); if (!LIFE.pay(L.kinderFee)) return UI.toast('学费不够。', 'bad'); k.feeUntil = G.dayNum() + L.kinderDays; G.log('交了幼儿园的学费。'); return UI.toast('学费交好了'); }
    });
  };

  // ================= 家 =================
  LIFE.homeAct = function (k) {
    return UI.act(async () => {
      const S = SS(), l = LIFE.st(), p = l.partner;
      if (k === 'cook') { if (S.money < 10) return UI.toast('钱不够买菜。', 'bad'); S.money -= 10; G.advance(60); G.change({ hunger: 55, mental: 3 }); await UI.eatMoment({ id: 'homemeal', name: '家常饭', dish: 'workbox', price: 14, flavor: p && p.state === 'married' ? `${p.name}在旁边盛饭，两个人对着坐。` : '自己煮的，咸淡刚好。' }, { delta: { hunger: 55, mental: 3 } }); }
      if (k === 'fish') { const f = l.fish.shift(); if (!f) return; G.advance(60); G.change({ hunger: f.hunger, mental: f.mental }); await UI.eatMoment({ id: 'fish', name: `红烧${f.name}`, dish: 'fish', price: 12, flavor: '鱼肉嫩，汤是奶白的，喝完身上发热。' }, { delta: { hunger: f.hunger, mental: f.mental } }); }
      if (k === 'chat') { if (p) await LIFE.pAct(p, { min: 30, aff: 1, mental: 6, lines: ['你们没说几句话，她把头靠在你肩上。屋里很安静。', '“今天累不累？”“还行。”就这么两句，也让人心里踏实。'], title: '一起坐会儿' }); }
      if (k === 'baby') { if (!LIFE.kidsOk()) return UI.modal({ title: '孩子', bg: A.placeImg('home', G.hourF()), html: '<p>你们对着灯坐了一会儿，都没说话。这个年纪了，孩子的事，不必再想。</p>' }); const go = await UI.modal({ title: '要个孩子吗', bg: A.placeImg('home', G.hourF()), html: `${LIFE.card(p, 'smile')}<p>“你想好了？孩子是要花钱，也要花时间的。”</p><p class="muted">${L.babyDays} 天后出生；之后每天开销 ¥${L.kidDaily}；孩子满 ${L.kinderAge} 天可以去幼儿园。</p>`, buttons: [{ text: '想好了' }, { text: '再等等', cls: 'ghost' }] }); if (go !== 0) return; l.pregnancy = { due: G.dayNum() + L.babyDays }; G.change({ mental: 10 }); G.log(`${p.name}有了身孕。`, 'good'); }
    });
  };
  LIFE.endChoice = function () {
    const l = LIFE.st(), p = l.partner; if (l.kid && l.kid.enrolled) return 'win_family'; if (p && p.state === 'married' && l.home) return (G.age() >= 50 || !LIFE.kidsOk()) ? 'win_together' : 'win_home'; return null;
  };

  // ================= 存折 =================
  LIFE.bankFlow = function () {
    return UI.act(async () => {
      const S = SS(), l = LIFE.st();
      await UI.modal({ title: '存折', bg: A.placeImg('bank', G.hourF()), html: '<div id="bk"></div>', buttons: [{ text: '好了' }], onShow: (m, close) => {
        const draw = () => { m.querySelector('#bk').innerHTML = `<p class="bk-big">存折 <b>¥${l.bank}</b> <small>口袋里 ¥${S.money}</small></p><p class="muted">钱放进存折，小偷偷不走；买房首付、婚礼、月供都从这里出。</p>
          <p class="bk-int">利息：年利率 ${Math.round(L.interest.annual * 100)}%（游戏里一年 = 四季 ${L.interest.yearDays} 天），每天按存折余额入账。累计已得 <b>¥${l.interestTotal || 0}</b>，按现在的余额，每天约 <b>¥${(Math.min(l.bank, L.interest.capBank) * L.interest.annual / L.interest.yearDays).toFixed(2)}</b>。</p>
          <ul class="bk-ledger">${(l.ledger || []).slice(-6).reverse().map(x => `<li><span>第 ${x.day} 天</span> ${x.note ? x.note : x.kind === 'interest' ? '利息' : x.kind === 'in' ? '存入' : '取出'} <b class="${x.kind === 'out' ? 'down' : 'up'}">${x.kind === 'out' ? '-' : '+'}¥${x.amt}</b></li>`).join('') || '<li class="muted">还没有明细</li>'}</ul>
          <div class="bk-row">${[100, 500, 1000].map(n => `<button class="btn sm" data-in="${n}" ${S.money < n ? 'disabled' : ''}>存 ¥${n}</button>`).join('')}<button class="btn sm" data-in="all" ${S.money < 1 ? 'disabled' : ''}>全存进去</button></div>
          <div class="bk-row bk-type"><label for="bk-in-amt">存多少</label><input id="bk-in-amt" class="bk-amt" data-amt="in" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" placeholder="输入整数，最多 ¥${S.money}"><button class="btn sm ghost" data-max="in" ${S.money < 1 ? 'disabled' : ''}>最大</button><button class="btn sm primary" data-go="in">存入</button></div><p class="bk-err" data-err="in" role="alert"></p>
          <div class="bk-row">${[100, 500, 1000].map(n => `<button class="btn sm ghost" data-out="${n}" ${l.bank < n ? 'disabled' : ''}>取 ¥${n}</button>`).join('')}<button class="btn sm ghost" data-out="all" ${l.bank < 1 ? 'disabled' : ''}>全取出来</button></div>
          <div class="bk-row bk-type"><label for="bk-out-amt">取多少</label><input id="bk-out-amt" class="bk-amt" data-amt="out" type="text" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" placeholder="输入整数，最多 ¥${l.bank}"><button class="btn sm ghost" data-max="out" ${l.bank < 1 ? 'disabled' : ''}>最大</button><button class="btn sm primary" data-go="out">取出</button></div><p class="bk-err" data-err="out" role="alert"></p>`;
          const err = (k, t, bad) => { const e = m.querySelector(`[data-err="${k}"]`), inp = m.querySelector(`[data-amt="${k}"]`); if (e) { e.textContent = t || ''; e.className = 'bk-err' + (t ? (bad ? ' bad' : ' hint') : ''); } if (inp) { inp.classList.toggle('bad', !!(t && bad)); if (t && bad) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); } } };
          const maxOf = k => k === 'in' ? S.money : l.bank;
          // 校验：整数、大于 0、不超过上限；返回 {n} 或 {msg}
          const check = (k, raw) => {
            const t = String(raw == null ? '' : raw).replace(/[,\s，]/g, ''), mx = maxOf(k), verb = k === 'in' ? '存' : '取', what = k === 'in' ? '口袋里' : '存折里';
            if (!t) return { msg: `先输入要${verb}多少钱。` };
            if (/^[-+]/.test(t) && /^[-+]\d+$/.test(t)) return { msg: t[0] === '-' ? '金额不能是负数。' : '直接输入数字就行，不用加符号。' };
            if (/^\d+[.．。]\d*$/.test(t)) return { msg: '只能是整数，不能带小数点。' };
            if (!/^\d+$/.test(t)) return { msg: '只能输入数字 0–9，不要带字母或符号。' };
            if (t.length > 9) return { msg: '这个数字太大了。' };
            const n = parseInt(t, 10);
            if (n <= 0) return { msg: '金额要大于 0。' };
            if (n > mx) return { msg: mx < 1 ? `${what}一分钱都没有，${verb}不了。` : `${what}只有 ¥${mx}，${verb}不了 ¥${n}。` };
            return { n };
          };
          const count = (from, to, el, pre) => { if (!el) return; if (window.FX && FX.fast && FX.fast()) { el.textContent = pre + to; return; } const t0 = performance.now(), D = 650; let ticks = 0; const step = now => { if (!el.isConnected) return; const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + Math.round(from + (to - from) * e); const tk = Math.floor(k * 6); if (tk > ticks) { ticks = tk; try { FX.sfx && FX.sfx.play('coin'); } catch (x) { } } if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
          const apply = (k, n) => {
            const b0 = l.bank, p0 = S.money;
            if (k === 'in') { S.money -= n; l.bank += n; } else { l.bank -= n; S.money += n; }
            (l.ledger = l.ledger || []).push({ day: G.dayNum(), kind: k, amt: n }); FX.sfx && FX.sfx.play('coin'); G.advance(5); UI.render(); draw();
            count(b0, l.bank, m.querySelector('.bk-big b'), '¥'); count(p0, S.money, m.querySelector('.bk-big small b'), '¥');
            const big = m.querySelector('.bk-big'); if (big) { const chip = document.createElement('span'); chip.className = 'bk-chip ' + (k === 'in' ? 'up' : 'down'); chip.textContent = (k === 'in' ? '存入 +¥' : '取出 −¥') + n; big.appendChild(chip); setTimeout(() => chip.remove(), 1400); }
            err(k, `${k === 'in' ? '已存入' : '已取出'} ¥${n}。`, false);
          };
          m.querySelectorAll('[data-in]').forEach(b => b.onclick = () => { const n = b.dataset.in === 'all' ? S.money : +b.dataset.in; const r = check('in', n); if (r.msg) return err('in', r.msg, true); apply('in', r.n); });
          m.querySelectorAll('[data-out]').forEach(b => b.onclick = () => { const n = b.dataset.out === 'all' ? l.bank : +b.dataset.out; const r = check('out', n); if (r.msg) return err('out', r.msg, true); apply('out', r.n); });
          m.querySelectorAll('[data-max]').forEach(b => b.onclick = () => { const k = b.dataset.max, inp = m.querySelector(`[data-amt="${k}"]`); inp.value = String(maxOf(k)); err(k, `${k === 'in' ? '口袋里' : '存折里'}最多 ¥${maxOf(k)}，已填好。`, false); try { FX.sfx && FX.sfx.play('click'); } catch (x) { } });
          m.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const k = b.dataset.go, inp = m.querySelector(`[data-amt="${k}"]`); const r = check(k, inp.value); if (r.msg) { err(k, r.msg, true); inp.focus(); return; } apply(k, r.n); });
          m.querySelectorAll('[data-amt]').forEach(inp => { const k = inp.dataset.amt;
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); m.querySelector(`[data-go="${k}"]`).click(); } e.stopPropagation(); });
            inp.addEventListener('input', () => { const v = inp.value.replace(/[,\s，]/g, ''); if (!v) return err(k, '', false); const r = check(k, v); err(k, r.msg || `${k === 'in' ? '存入' : '取出'} ¥${r.n}，点右边按钮确认。`, !!r.msg); });
          });
        }; draw(); } });
    });
  };

  // ================= 四季环 =================
  const SEA = ['spring', 'summer', 'autumn', 'winter'], COL = { spring: '#8fcf7a', summer: '#f2c14e', autumn: '#e08a3a', winter: '#cfe6f6' };
  LIFE.seasonProgress = function () { const sea = G.season(), d = G.dayNum(), per = C.seasons.daysPer; const idx = SEA.indexOf(sea.id); return { sea, idx, frac: ((d - 1) % per) / per, left: G.seasonDayLeft(), start: d - ((d - 1) % per) }; };
  LIFE.wheel = function (size) {
    const { sea, idx, frac } = LIFE.seasonProgress(); const R = 44, r = 30, cx = 50, cy = 50;
    const arc = (a0, a1, rr) => { const p = a => [cx + rr * Math.sin(a), cy - rr * Math.cos(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${rr} ${rr} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
    const segs = SEA.map((id, i) => { const a0 = i * Math.PI / 2 + 0.06, a1 = (i + 1) * Math.PI / 2 - 0.06; return `<path d="${arc(a0, a1, (R + r) / 2)}" stroke="${COL[id]}" stroke-width="${i === idx ? 15 : 9}" stroke-linecap="round" fill="none" opacity="${i === idx ? 1 : .45}"/>`; }).join('');
    const ang = (idx + frac) * Math.PI / 2, mx = cx + (R + 2) * Math.sin(ang), my = cy - (R + 2) * Math.cos(ang);
    const ic = SEA.map((id, i) => { const a = (i + .5) * Math.PI / 2, x = cx + (R * .82) * Math.sin(a), y = cy - (R * .82) * Math.cos(a) + 1; return ''; }).join('');
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="22" fill="rgba(16,14,12,.85)" stroke="rgba(255,255,255,.18)"/>${segs}<circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="4.6" fill="#fff" stroke="#2a1a08" stroke-width="1.6"/><text x="50" y="56" text-anchor="middle" font-size="19" fill="${COL[sea.id]}" font-weight="800">${sea.name}</text></svg>`;
  };
  LIFE.seasonModal = async function () {
    const { sea, start, left } = LIFE.seasonProgress(); const per = C.seasons.daysPer; const d = G.dayNum();
    const list = SEA.map(id => { const s = C.seasons.list.find(x => x.id === id); const idx = SEA.indexOf(sea.id); const k = (SEA.indexOf(id) - idx + 4) % 4; const a = start + k * per; return `<li class="${id === sea.id ? 'on' : ''}">${s.icon} ${s.name}：第 ${a}–${a + per - 1} 天${id === sea.id ? '（现在）' : ''}</li>`; }).join('');
    await UI.modal({ title: '四季', cls: 'season-modal', html: `<div class="sw">${LIFE.wheel(220)}<p><b>${sea.icon} ${sea.name}天</b> · 第 ${d} 天 · 还剩 <b>${left}</b> 天换季</p><p class="muted">${sea.tip}</p><ul>${list}</ul><p class="muted tiny">每 ${per} 天换一季：地图和街景会跟着变——春天发绿，夏天浓荫，秋天金黄，冬天落雪。</p></div>` });
  };
  LIFE.seasonMini = function () { return LIFE.wheel(20); };
  LIFE.fxHtml = function (sea, key) {
    const F = C.seasonFx[sea]; if (!F) return ''; let h = ''; for (let i = 0; i < F.n; i++) { const t = 5 + (i * 37 % 60) / 10, s = F.particle === 'snow' ? 3 + (i % 5) * 1.6 : F.particle === 'glare' ? 26 + (i % 4) * 14 : 9 + (i % 4) * 3; h += `<i style="--x:${(i * 53) % 100}%;--y:${8 + (i * 29) % 50}%;--s:${s}px;--t:${t}s;--d:-${((i * 17) % 100) / 100 * t}s;--dx:${(i % 2 ? 1 : -1) * (6 + i % 9 * 3)}vw;--r:${(i % 2 ? 1 : -1) * 360}deg"></i>`; } return `<div class="sfx s-${sea}">${h}</div>`;
  };
  LIFE.seasonFx = function () {
    const sc = $('#scene'); if (!sc) return; const sea = G.season(); if (!sea) return; const S = SS();
    const outdoor = S.view !== 'place' || (C.seasons.outdoorPlaces || []).includes(S.loc); const old = sc.querySelector('.sfx'); if (old) old.remove();
    if (outdoor && !(matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) sc.insertAdjacentHTML('beforeend', LIFE.fxHtml(sea.id));
  };
  { const r0 = UI.render; UI.render = function () { r0.apply(this, arguments); try { LIFE.seasonFx(); const sc = $('#hud-season'); if (sc) sc.onclick = () => LIFE.seasonModal(); document.querySelectorAll('[data-golife]').forEach(b => b.onclick = () => UI.go(b.dataset.golife)); } catch (e) { console.error(e); } }; }

  // ================= 人物热点 / 点击 =================
  { const pp = UI.people; UI.people = function () { const out = pp(); const l = LIFE.st(); if (l && l.partner && LIFE.partnerHere(SS().loc) && SS().view === 'place') out.unshift({ kind: 'partner', key: 'p', name: l.partner.name, look: l.partner.look, sub: LIFE.title() + ' · 过去说说话', tip: `${l.partner.name}在这儿` }); return out.slice(0, 3); }; }
  { const sp = UI.spot; UI.spot = function (s) { if (s.indexOf('partner:') === 0) return LIFE.partnerMenu(); return sp(s); }; }

  // ================= 行动分发 =================
  LIFE.doAct = function (k, v) {
    const S = SS(), l = LIFE.st();
    if (k === 'bankbook') return LIFE.bankFlow();
    if (k === 'partner') return LIFE.partnerMenu();
    if (k === 'bath') return UI.act(async () => {
      const it = C.bath.items.find(x => x.id === v); if (!it) return; if (S.money < it.price) return UI.toast('钱不够。', 'bad');
      S.money -= it.price; const win = G.season() && G.season().id === 'winter' && (C.bath.winterBonus.ids || []).includes(it.id); const dec0 = G.decency(); const st0 = { sta: S.stats.stamina, men: S.stats.mental };
      const had = { sore: !!G.debuff('sore'), chill: !!G.debuff('chill') };
      const e = { clean: it.clean, stamina: it.stamina + (win ? C.bath.winterBonus.stamina : 0), mental: it.mental + (win ? C.bath.winterBonus.mental : 0) };
      G.advance(it.minutes); G.change(e);
      if (it.clear) S.debuffs = S.debuffs.filter(x => !it.clear.includes(x.id));
      if (it.buff === 'loose') { S.debuffs = S.debuffs.filter(x => x.id !== 'warmed'); G.addDebuff('loose'); } else if (it.buff === 'warmed' && !G.debuff('loose')) G.addDebuff('warmed');
      G.log(`在澡堂${it.name}。`);
      const real = { decency: G.decency() - dec0, stamina: Math.round(S.stats.stamina - st0.sta), mental: Math.round(S.stats.mental - st0.men), money: -it.price };
      const got = []; if (had.sore && it.clear) got.push('浑身酸痛解开了'); if (had.chill && it.clear) got.push('受的寒气散了'); if (it.buff === 'warmed') got.push(`「身子暖透」：到第 ${G.debuff('warmed') ? G.debuff('warmed').until : G.debuff('loose').until} 天不会受寒`); if (it.buff === 'loose') got.push(`「浑身松快」：到第 ${G.debuff('loose').until} 天，睡觉恢复更多、干活更省力`);
      if (window.FX) await FX.micro('bath'); await UI.modal({ title: '老澡堂', bg: A.IMG.place('bath'), html: `<p>${it.text}</p>${win ? `<p class="muted">${C.bath.winterBonus.text}</p>` : ''}${eff(real)}${(it.stamina && real.stamina < it.stamina && S.stats.stamina >= S.maxSta - .5) ? '<p class="muted tiny">体力已经满了，多的白搭。</p>' : ''}${(real.decency === 0 && it.dec > 0) ? '<p class="muted tiny">体面已经洗到这身衣服的上限了，再洗也涨不动。</p>' : ''}${got.length ? `<ul class="bath-got">${got.map(x => `<li>✨ ${x}</li>`).join('')}</ul>` : ''}` });
      const n = G.pickNpc('bath'); if (n && Math.random() < .3) await UI.talk(n, '澡堂里');
    });
    if (k === 'fish') return UI.act(async () => {
      const R = C.riverside.fish; let gres = null; if (window.GP) { try { gres = await GP.play('fish', { bg: A.placeImg('riverside', G.hourF()) }); } catch (e) { gres = null; } }
      const res = (!gres || gres.auto || gres.fallback) && window.FX ? await FX.micro('fish') : null; G.advance(R.minutes); G.change({ mental: R.mental, stamina: R.stamina }); G.log(R.text);
      const hit = (gres && !gres.auto && !gres.fallback) ? !!(!gres.quit && gres.stats && gres.stats.caught) : (res === 'hit' || (res == null && Math.random() < .45));
      if (hit) { const f = LIFE.gainFish(gres && gres.stats && gres.stats.fish); UI.toast(`钓上来一条${f.name}！可以卖掉、炖了吃，也能送人。`); G.log(`钓到一条${f.name}。`, 'good'); G.addStamp && G.addStamp('fish', '鱼', '钓到'); }
      const n = Math.random() < 0.5 ? G.pickNpc('riverside') : null; if (n) await UI.talk(n, '凉水河边'); else if (!hit) UI.toast(R.text);
    });
    if (k === 'fishsell') return UI.act(async () => { const f = l.fish; if (!f.length) return UI.toast(C.fishUse.noFish); const sum = f.reduce((a, x) => a + x.sell, 0); S.money += sum; S.earned += sum; const n = f.length; l.fish = []; G.advance(10); FX.sfx && FX.sfx.play('coin'); G.log(`卖了 ${n} 条鱼，得 ¥${sum}。`, 'good'); await UI.modal({ title: '卖鱼', bg: A.IMG.place('food'), html: `<p>${C.fishUse.sellLine}</p>${eff({ money: sum })}` }); });
    if (k === 'fishcook') return UI.act(async () => { const c = C.fishUse.cook; const f = l.fish[0]; if (!f) return UI.toast(C.fishUse.noFish); if (S.money < c.price) return UI.toast('钱不够。', 'bad'); S.money -= c.price; l.fish.shift(); G.advance(c.minutes); G.change({ hunger: f.hunger, mental: f.mental }); await UI.eatMoment({ id: 'fish', name: `炖${f.name}汤`, dish: 'fish', price: 14, flavor: '汤是奶白的，鱼肉嫩，吃完整个人都暖了。', text: c.text }, { delta: { hunger: f.hunger, mental: f.mental } }); });
    if (k === 'fishgive') return UI.act(async () => { const who = LIFE.fishTargets(S.loc); const n = who[0]; if (!n || !l.fish.length) return UI.toast(C.fishUse.noFish); const f = l.fish.shift(); S.npc[n.key].aff = clamp(S.npc[n.key].aff + C.fishUse.gift.aff, 0, 100); G.advance(10); G.change({ mental: 3 }); G.log(`把一条${f.name}送给了${n.name}。`, 'good'); await UI.modal({ title: '送条鱼', bg: A.placeImg(S.loc, G.hourF()), html: `<div class="talk"><div class="pt">${A.portrait(n.look, { mood: 'smile' })}</div><div><b>${n.name}</b><p>${C.fishUse.gift.text}</p></div></div><p class="eff"><span class="up">好感 +${C.fishUse.gift.aff}</span></p>` }); });
    if (k === 'hallwed') return LIFE.weddingFlow();
    if (k === 'hallpeek') return UI.act(async () => { G.advance(15); G.change({ mental: 1 }); await UI.modal({ title: '幸福酒楼', bg: A.IMG.place('hall'), html: '<p>圆桌一张挨一张，红桌布压着折痕。台上的幕布后面传来试麦的声音：“喂喂，一二三。”</p>' }); });
    if (k === 'hallphoto') return UI.act(async () => { if (S.money < 60) return UI.toast('钱不够。', 'bad'); S.money -= 60; G.advance(40); G.change({ mental: 4 }); G.addAlbum({ id: 'photo_' + G.dayNum(), kind: 'moment', title: '合影', caption: '摄影师喊“一二三”，你们笑得有点僵。' }); await UI.modal({ title: '拍张合影', bg: A.IMG.place('hall'), html: '<p>“靠近点！再近点！”摄影师喊。快门响了。你们在照片里挨得很近。</p>' + eff({ mental: 4, money: -60 }) }); });
    if (k === 'salesview') return LIFE.salesView();
    if (k === 'salespeek') return UI.act(async () => { G.advance(15); G.change({ mental: 2 }); await UI.modal({ title: '沙盘', bg: A.placeImg('sales', G.hourF()), html: '<p>沙盘上的小楼亮着一排排小灯。销售员站在旁边没催你，只是说：“看看嘛，不要紧。”你伸手比划了一下，哪一扇窗会是自己的。</p>' + eff({ mental: 2 }) }); });
    if (k === 'kinderenroll') return LIFE.kinderFlow('enroll'); if (k === 'kinderpick') return LIFE.kinderFlow('pick'); if (k === 'kinderfee') return LIFE.kinderFlow('fee'); if (k === 'kinderpeek') return LIFE.kinderFlow('peek');
    if (k === 'homecook') return LIFE.homeAct('cook'); if (k === 'homefish') return LIFE.homeAct('fish'); if (k === 'homebaby') return LIFE.homeAct('baby'); if (k === 'homechat') return LIFE.homeAct('chat');
    if (k === 'homestay') return UI.act(async () => { const key = LIFE.endChoice(); if (!key) return; const E = C.lifeEndings[key]; const go = await UI.modal({ title: E.title, bg: A.placeImg('home', G.hourF()), html: `<p>${E.text}</p><p class="muted">这会结束这一局。想继续存钱、继续往上走的话，选“再过几天”。</p>`, buttons: [{ text: '就这样，过下去' }, { text: '再过几天', cls: 'ghost' }] }); if (go !== 0) return; G.end(key, true); });
  };
  // 结局文案并入 endings
  C.endings = C.endings || {}; Object.keys(C.lifeEndings).forEach(k => { C.endings[k] = C.lifeEndings[k]; });
})();
