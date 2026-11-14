// v1.0.2 · 路上的小事：在地点之间走路时，约 30% 会碰上一件小事（短卡片 + 一两个选择 + 清楚的数值反馈）。
// 按时间 / 季节 / 地点 / 身上穿着加权；每天最多 3 件；走路本身按距离扣一点体力。
(function () {
  const G0 = window.G, UI0 = window.UI, S0 = () => G0.S();
  const pick = a => a[Math.floor(Math.random() * a.length)], ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const WALK = window.WALK = { CHANCE: 0.3, DAILY_CAP: 3, log: [] };
  const sea = () => { const s = G0.season && G0.season(); return s ? s.id : 'spring'; };
  const warmNow = () => (G0.outfit && G0.outfit().warm) || (G0.warmed && G0.warmed());
  const NEAR_RIVER = c => c.from === 'riverside' || c.to === 'riverside';
  const NPC_LINES = ['{n}拎着一袋菜迎面走来：“这么巧，吃了没？”你们站在路边聊了几句。', '{n}在路口冲你招手，递给你一根烟又收回去：“忘了你不抽。”两个人笑了。', '{n}正蹲在路边修自行车，你帮着扶了会儿车把，聊起了老家的天气。', '{n}叫住你：“前两天看见你了，干活挺利索。”你不好意思地挠挠头。', '{n}从巷子里出来，手里捧着一杯热水：“拿着，暖暖手。”'];
  const WALK_TIPS = ['电线杆上新贴了一张招工单，墨迹还没干。', '墙上的小广告里夹着一张手写的：“急招，现结。”', '路边的人在议论：“听说明天那边又要人。”'];
  // 每个事件：w(ctx) 权重（0 = 不会出现）、title、art(三个 emoji)、bg（时间渐变）、text(ctx)、choices:[{t, run(ctx) -> {text, eff, log}}]
  const E = [
    { id: 'bottle', title: '路边的空瓶', art: '🍾', w: c => 8 + (NEAR_RIVER(c) ? 6 : 0) + (c.hour >= 18 ? 3 : 0), text: () => '墙根下躺着两个没人要的空瓶子，在太阳底下闪了一下。', choices: [{ t: '捡起来', run: () => { const m = ri(1, 3); S0().money += m; S0().earned = (S0().earned || 0) + m; if (G0.noteWage) G0.noteWage(m, 'scrap'); return { text: `两个瓶子，回头能卖 ¥${m}。你顺手揣进兜里。`, eff: { money: m, stamina: -1 }, ch: { stamina: -1 } }; } }, { t: '不管了', run: () => ({ text: '你看了一眼，继续走。', eff: {} }) }] },
    { id: 'coins', title: '草丛里的硬币', art: '🪙', w: c => 5 + (c.hour < 8 ? 2 : 0), text: () => '路边的草丛里有几枚硬币，应该是谁蹲下系鞋带时掉的。', choices: [{ t: '弯腰捡起来', run: () => { const m = ri(2, 8); S0().money += m; return { text: `一枚一枚捡起来，一共 ¥${m}。`, eff: { money: m, mental: 1 }, ch: { mental: 1 } }; } }, { t: '留给下一个人', run: () => ({ text: '你心里一暖，把硬币往显眼的地方挪了挪。', eff: { mental: 2 }, ch: { mental: 2 } }) }] },
    { id: 'npc', title: '碰上熟人', art: '🧑‍🤝‍🧑', w: c => c.npc ? 9 : 0, text: c => pick(NPC_LINES).replace('{n}', c.npc.name), choices: [{ t: '站下聊两句', run: c => { const n = c.npc, add = ri(2, 4); S0().npc[n.key].aff = clamp(S0().npc[n.key].aff + add, 0, 100); G0.advance(15); return { text: `和${n.name}聊了一刻钟，心里踏实了点。`, eff: { mental: 3 }, ch: { mental: 3 }, extra: `${n.name}好感 +${add}` }; } }, { t: '点点头走过', run: () => ({ text: '你冲对方点点头，赶路要紧。', eff: {} }) }] },
    { id: 'tip', title: '电线杆上的招工单', art: '📄', w: c => 5 + (c.hour >= 15 && c.hour < 22 ? 5 : 0), text: () => pick(WALK_TIPS), choices: [{ t: '凑近看看', run: () => { const js = (CONFIG.jobs || []).filter(j => !j.locked); const j = pick(js.length ? js : CONFIG.jobs); const S = S0(); S.flags.walkTip = { day: G0.dayNum() + 1, job: j.id }; return { text: `上面写着：“${j.name}，明天要人，早点去排。”你记在了心里。`, eff: {}, extra: `明天去问「${j.name}」，录取率 +8%` }; } }, { t: '没空看', run: () => ({ text: '你扫了一眼，没停脚。', eff: {} }) }] },
    { id: 'rain', title: '下雨了', art: '🌧️', w: c => (c.rain ? 16 : 0) + (['spring', 'autumn'].includes(c.season) ? 3 : 0), text: () => S0().flags.umbrella ? '雨落下来，你撑开包里的旧伞，衣服没有淋湿。' : '天一下子黑下来，雨点噼里啪啦砸在地上。', choices: [{ t: '顶着雨跑过去', run: () => { const S = S0(); if (S.flags.umbrella) return { text: '旧伞挡住雨点，衣服干干爽爽。', eff: {} }; S.stats.clean = clamp(S.stats.clean - 8, 0, 100); return { text: '衣服湿了一大片，贴在身上。', eff: { clean: -8, stamina: -2 }, ch: { stamina: -2 } }; } }, { t: '买把伞（¥8）', run: () => { const S = S0(); if (S.money < 8) return { text: '兜里不够买伞，你只好顶着雨跑。', eff: { clean: -8, stamina: -2 }, ch: { stamina: -2 }, pre: () => { S.stats.clean = clamp(S.stats.clean - 8, 0, 100); } }; S.money -= 8; return { text: '路边小摊的老板递来一把旧伞：“拿去吧，八块。”', eff: { money: -8 } }; } }, { t: '屋檐下躲十分钟', run: () => { G0.advance(10); return { text: '你靠着墙根看雨，倒是难得清静了一会儿。', eff: { mental: 1 }, ch: { mental: 1 } }; } }] },
    { id: 'snow', title: '下雪了', art: '❄️', w: c => c.season === 'winter' ? 8 : 0, text: () => '雪粒子打在脸上，路面开始发白。', choices: [{ t: '缩着脖子快步走', run: c => { const warm = warmNow(); return { text: warm ? '棉服挡住了风，走得不算太难受。' : '风钻进领口，整个人冻得发抖。', eff: warm ? { stamina: -1 } : { stamina: -4, mental: -2 }, ch: warm ? { stamina: -1 } : { stamina: -4, mental: -2 } }; } }, { t: '进路边店里暖一会儿（20 分钟）', run: () => { G0.advance(20); return { text: '店里有暖气，你捧着人家递来的热水喝了两口。', eff: { stamina: 1, mental: 2 }, ch: { stamina: 1, mental: 2 } }; } }] },
    { id: 'vendor', title: '路边小摊', art: '🍠', w: c => 6 + (c.hour >= 6 && c.hour < 9 ? 5 : 0) + (c.hour >= 16 ? 3 : 0) + (c.season === 'winter' ? 3 : 0), text: c => (c.season === 'winter' ? '路边烤红薯的炉子冒着白气，甜味直往鼻子里钻。' : '早点摊的油条刚出锅，油香飘出半条街。'), choices: [{ t: '买一份（¥4）', run: c => { const S = S0(); if (S.money < 4) return { text: '摸了摸兜，不够，只好咽口口水。', eff: {} }; S.money -= 4; return { text: c.season === 'winter' ? '烫得两只手换着捧，咬一口，从嘴里暖到肚子。' : '一口咬下去，酥得掉渣。', eff: { money: -4, hunger: 14, mental: 2 }, ch: { hunger: 14, mental: 2 } }; } }, { t: '闻闻就走', run: () => ({ text: '你深吸一口气，继续赶路。', eff: {} }) }] },
    { id: 'lost', title: '捡到一个钱包', art: '👛', w: c => 4 + (c.hour >= 18 ? 2 : 0), text: () => '路牙子边上掉着一个旧钱包，鼓鼓的。远处有个人急匆匆地在找什么。', choices: [{ t: '追上去还给他', run: () => { const S = S0(); S.rep = (S.rep || 0) + 1; return { text: '那人眼圈都红了，连说了好几声谢谢，非要塞给你一包烟，你推了回去。', eff: { mental: 4 }, ch: { mental: 4 }, extra: '口碑 +1' }; } }, { t: '揣进兜里', run: () => { const m = ri(15, 35); S0().money += m; return { text: `里面有 ¥${m}。你把钱包扔进了垃圾桶，心里一直不太踏实。`, eff: { money: m, mental: -4 }, ch: { mental: -4 } }; } }] },
    { id: 'wind', title: '刮冷风', art: '🥶', w: c => (c.season === 'winter' && !warmNow()) ? 12 : 0, text: () => '风从巷子口灌进来，没有厚衣服的你冻得牙都在打架。', choices: [{ t: '咬牙硬走', run: () => ({ text: '手脚都僵了，每一步都像踩在冰上。', eff: { stamina: -4, mental: -2 }, ch: { stamina: -4, mental: -2 } }) }, { t: '躲进店里暖一暖（15 分钟）', run: () => { G0.advance(15); return { text: '老板瞥了你一眼，没赶你。身子慢慢缓了过来。', eff: { stamina: 0, mental: 1 }, ch: { mental: 1 } }; } }] },
    { id: 'scooter', title: '电动车擦身而过', art: '🛵', w: c => 4 + (c.hour >= 20 || c.hour < 6 ? 5 : 0), text: () => '一辆没开灯的电动车从你身边擦了过去，差半个巴掌。', choices: [{ t: '骂一句', run: () => ({ text: '你冲着车屁股吼了一声，心里痛快了点，可手还在抖。', eff: { mental: 1, stamina: -1 }, ch: { mental: 1, stamina: -1 } }) }, { t: '定定神继续走', run: () => ({ text: '你站了一会儿，深呼吸，心跳慢慢落下来。', eff: { mental: -1 }, ch: { mental: -1 } }) }] },
    { id: 'cat', title: '一只流浪猫', art: '🐈', w: c => 4 + (NEAR_RIVER(c) ? 4 : 0), text: () => '一只瘦瘦的橘猫蹲在墙头看你，尾巴一下一下地晃。', choices: [{ t: '蹲下来摸摸它', run: () => { G0.advance(5); return { text: '它蹭了蹭你的手背，呼噜呼噜的。', eff: { mental: 3 }, ch: { mental: 3 } }; } }, { t: '分它半块馒头', run: () => { const S = S0(); return { text: '它几口就吃完了，临走还回头看了你一眼。', eff: { mental: 4, hunger: -3 }, ch: { mental: 4, hunger: -3 } }; } }] },
    { id: 'chess', title: '路边下棋的老头', art: '♟️', w: c => 4 + (c.hour >= 14 && c.hour < 19 ? 3 : 0), text: () => '树荫下几个老头围着一盘象棋吵得脸红脖子粗。', choices: [{ t: '凑过去看一局（20 分钟）', run: () => { G0.advance(20); return { text: '你看得入了神，还差点指了一步臭棋，被老头瞪了回来。', eff: { mental: 3 }, ch: { mental: 3 } }; } }, { t: '路过', run: () => ({ text: '你听了两句吵架就走了。', eff: {} }) }] }
  ];
  WALK.events = E;
  const ctxNow = (from, to) => { const h = Math.floor(G0.hourF() % 24); let npc = null; try { npc = G0.pickNpc('any'); if (npc && (!S0().npc[npc.key])) npc = null; } catch (e) { } const dc = G0.dayCond ? G0.dayCond() : {}; return { from, to, hour: h, season: sea(), rain: !!(dc && dc.rain), npc, money: S0().money }; };
  WALK.weights = ctx => E.map(e => [e.id, Math.max(0, e.w(ctx))]);
  WALK.pickEvent = ctx => { const ws = WALK.weights(ctx), t = ws.reduce((a, b) => a + b[1], 0); if (t <= 0) return null; let r = Math.random() * t; for (const [id, w] of ws) { if ((r -= w) <= 0) return E.find(e => e.id === id); } return E[0]; };
  WALK.today = () => { const S = S0(); S.flags = S.flags || {}; const d = G0.dayNum(); if (!S.flags.walkEv || S.flags.walkEv.day !== d) S.flags.walkEv = { day: d, n: 0 }; return S.flags.walkEv; };
  WALK.should = (rnd) => WALK.today().n < WALK.DAILY_CAP && (rnd == null ? Math.random() : rnd) < WALK.CHANCE;
  const eff2 = o => (window.UI && UI.effText ? UI.effText(o) : '');
  WALK.run = async function (ev, ctx) {
    ctx = ctx || ctxNow(null, null); const S = S0(); const art = `<div class="walk-art wa-${ctx.hour >= 19 || ctx.hour < 6 ? 'night' : ctx.hour < 9 ? 'dawn' : 'day'}"><span>${ev.art}</span></div>`;
    const i = await UI.modal({ title: ev.title, cls: 'walkmodal', html: `${art}<p>${ev.text(ctx)}</p>`, buttons: ev.choices.map((c, k) => ({ text: c.t, cls: k ? 'ghost' : '' })) });
    const c = ev.choices[i] || ev.choices[ev.choices.length - 1]; const r = c.run(ctx) || { text: '', eff: {} };
    if (r.pre) r.pre(); if (r.ch) G0.change(r.ch); WALK.today().n++; WALK.log.push(ev.id); G0.log(`路上：${ev.title}。${r.text}`);
    await UI.modal({ title: ev.title, cls: 'walkmodal', html: `${art}<p>${r.text}</p>${eff2(Object.assign({}, r.eff))}${r.extra ? `<p class="why">${r.extra}</p>` : ''}`, buttons: [{ text: '接着走' }] });
    return { id: ev.id, choice: i, r };
  };
  // 传单上的小道消息：第二天问那份活，录取率 +8%
  { const hi = G0.hireInfo; G0.hireInfo = function (o) { const r = hi.apply(this, arguments); try { const t = S0().flags.walkTip; if (t && t.day === G0.dayNum() && t.job === o.job && r && r.p < .97) { r.p = Math.min(.97, r.p + .08); r.pct = Math.round(r.p * 100); r.why.push({ k: '路上看到的招工单', v: '+8%', good: 1 }); } } catch (e) { } return r; }; }
  // 走路：按距离扣体力；约 30% 碰上小事（自动化测试默认不触发，WALK_EVENTS=true 才开）
  WALK.enabled = () => !(navigator.webdriver && !window.WALK_EVENTS);
  UI0.go = function (loc) {
    const S = G0.S(); if (loc === S.loc) { S.view = 'place'; return UI0.render(); }
    const LP = CONFIG.places.find(p => p.id === loc); if (!LP || (G0.placeOpen && !G0.placeOpen(LP))) return UI0.toast('还没开放' + (LP && LP.unlockHint ? '：' + LP.unlockHint : ''), 'bad');
    const base = G0.travelMin ? G0.travelMin(S.loc, loc) : 10; const from = S.loc;
    UI0.act(async () => {
      const m = Math.round(base * G0.slowMult()); G0.advance(m); const cost = clamp(Math.round(m / 10), 1, 4); G0.change({ stamina: -cost });
      UI0.toast(m > base ? `腿沉，走了 ${m} 分钟 · 体力 -${cost}` : `走了 ${m} 分钟 · 体力 -${cost}`);
      if (WALK.enabled() && WALK.should()) { const ctx = ctxNow(from, loc); const ev = WALK.pickEvent(ctx); if (ev) await WALK.run(ev, ctx); }
      S.loc = loc; S.view = 'place'; if (loc === 'lottery') S.flags.visitedLottery = 1; if (loc === 'corner' && G0.hourF() >= 16 && G0.hourF() < 20) G0.fireEvents('corner'); if (window.LIFE) await LIFE.onArrive(loc);
    });
  };
})();
