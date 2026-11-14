// v1.0.2 网吧：酒仙桥论坛（逛帖 / 发帖）、证券账户与炒股、找活、视频通话、看电影。上网时间走「会员卡余额」，每个动作都耗分钟。
(function () {
  const G0 = window.G, C = window.CONFIG, N = C.net, S0 = () => G0.S();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const NET = window.NET = {};
  // ---- 种子随机：同一天、同一支股票永远算出同一个价（读档不变） ----
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let a = hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  NET.st = function () { const S = S0(); if (!S.net) S.net = { min: 0, posts: [], read: {}, acct: null, flags: {}, daily: {} }; S.net.daily = S.net.daily || {}; return S.net; };
  const daily = k => { const d = NET.st().daily, n = G0.dayNum(); if (d.day !== n) { for (const x in d) delete d[x]; d.day = n; } return d[k] || (d[k] = {}); };
  const L = () => window.LIFE && LIFE.st();
  const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} 小时${m % 60 ? ' ' + (m % 60) + ' 分' : ''}` : `${m} 分钟`;
  NET.fmtMin = fmtMin;
  // ---- 上网时间 ----
  NET.buyTime = function (id) { const o = N.sessions.find(x => x.id === id); if (!o) return { err: '没有这个套餐。' }; const S = S0(); if (S.money < o.price) return { err: `钱不够，要 ¥${o.price}。` }; if (NET.st().min + o.min > 720) return { err: '会员卡里存的时间够多了，先用掉再续。' }; S.money -= o.price; NET.st().min += o.min; if (window.CAST) { const practiced = CAST.practicePhone(S.attrs, S.flags, G0.dayNum()); if (practiced.practiced) G0.log(`网吧这套按键熟了一点。手机熟练 ${practiced.phone}。`, 'good'); } G0.log(`在网吧充了 ${o.name}，花 ¥${o.price}。`); return { ok: true, min: NET.st().min }; };
  NET.use = function (min, why) { const n = NET.st(); if (n.min < min) return { err: `上网时间不够：「${why}」要 ${fmtMin(min)}，卡里只剩 ${fmtMin(n.min)}。先加钟。` }; n.min -= min; G0.advance(min); return { ok: true }; };
  // ================= 股票行情 =================
  const cache = {};
  const stock = id => N.stocks.find(s => s.id === id);
  const seasonOf = d => { try { const s = G0.season(d); return s && s.id; } catch (e) { return null; } };
  const shock = (id, d) => { const r = rng(`shock:${id}:${d}`)(); return r < .04 ? 1 : r > .96 ? -1 : 0; };
  NET.shock = shock;
  function bars(id, upto) {
    const s = stock(id), c = cache[id] || (cache[id] = [{ o: s.base, c: s.base, h: s.base, l: s.base }]);
    for (let d = c.length + 1; d <= upto; d++) {
      const R = rng(`px:${id}:${d}`), prev = c[c.length - 1].c, sh = shock(id, d);
      let r = ((R() + R() + R()) / 3 - .5) * 2 * s.vol * 1.7 + (s.drift || 0) + ((s.season && s.season[seasonOf(d)]) || 0) - .02 * Math.log(prev / s.base);
      if (sh) r = sh * (.10 + R() * .10); r = clamp(r, -.2, .2);
      const cl = Math.max(1.5, Math.round(prev * (1 + r) * 100) / 100), hi = Math.round(Math.max(prev, cl) * (1 + R() * s.vol * .6) * 100) / 100, lo = Math.max(1, Math.round(Math.min(prev, cl) * (1 - R() * s.vol * .6) * 100) / 100);
      c.push({ o: prev, c: cl, h: hi, l: lo });
    }
    return c;
  }
  NET.bars = (id, d) => bars(id, d || G0.dayNum());
  NET.price = (id, d) => { d = d || G0.dayNum(); return bars(id, d)[d - 1].c; };
  NET.change = (id, d) => { d = d || G0.dayNum(); const b = bars(id, d); return d > 1 ? (b[d - 1].c / b[d - 2].c - 1) : 0; };
  // 小道消息：明天的大涨 / 大跌，75% 是真的；平静的股票有时会冒出假消息
  const RUMOR_UP = ['听说{n}拿到了大单，明天有人要抢', '{n}的老板在饭桌上笑得合不拢嘴，应该有好事', '有人看见{n}的仓库连夜在装车，估计要涨', '内部的人说，{n}明天要放利好'];
  const RUMOR_DN = ['听说{n}出了点事，明天可能要跌', '有人看见{n}的财务在到处借钱', '{n}的货被退了一大批，估计不好看', '内部的人说，{n}明天要放个坏消息'];
  NET.rumors = function (d) {
    d = d || G0.dayNum(); const out = [];
    N.stocks.forEach(s => { const R = rng(`rumor:${s.id}:${d}`), sh = shock(s.id, d + 1); let dir = 0, truth = false;
      if (sh) { if (R() < .75) { dir = sh; truth = true; } } else if (R() < .02) { dir = R() < .5 ? 1 : -1; }
      if (dir) out.push({ stock: s.id, dir, truth, text: (dir > 0 ? RUMOR_UP : RUMOR_DN)[Math.floor(R() * 4)].replace('{n}', s.name) }); });
    return out.slice(0, 3);
  };
  // ================= 论坛 =================
  NET.jobTips = function (d) {
    d = d || G0.dayNum(); const R = rng(`tip:${d}`), js = (C.jobs || []).filter(j => j.wage && !j.hidden); const out = [];
    for (let i = 0; i < 2 && js.length; i++) { const j = js[Math.floor(R() * js.length)]; if (out.some(o => o.job === j.id)) continue; const hint = j.needClean ? '要穿得干净体面点' : '不挑穿着';
      out.push({ job: j.id, text: `「${j.name}」${j.start}–${j.end}，日结约 ¥${j.wage}${j.meal ? '，管饭' : ''}，${hint}。听里面的人说，明天有空缺，去早点。` }); }
    return out;
  };
  NET.forumList = function (d) {
    d = d || G0.dayNum(); const R = rng(`forum:${d}`), pool = N.forum.map((p, i) => ({ id: 's' + i, cat: p[0], title: p[1], body: p[2], replies: p[3] }));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const list = pool.slice(0, 4);
    NET.jobTips(d).forEach((t, i) => list.push({ id: `t${d}_${i}`, cat: '招工', title: `招工信息：${(C.jobs.find(j => j.id === t.job) || {}).name}`, body: t.text, replies: ['顶，有人问过。', '昨天路过，看见门口排队。'], tip: t }));
    NET.rumors(d).forEach((r, i) => list.push({ id: `r${d}_${i}`, cat: '行情', title: `${stock(r.stock).name}：${r.dir > 0 ? '有好消息？' : '有点不对劲'}`, body: r.text + '。（小道消息，不一定真）', replies: [pick(['真的假的？', '我先观望。', '别信，上次就坑了我。']), pick(['我反正不敢动。', '赌一把。'])], rumor: r }));
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    // 我自己发过的、已经有回复的帖子也列出来
    return list;
  };
  NET.read = function (post) {
    const n = NET.st(); const r = NET.use(N.costs.forumRead, '看帖'); if (r.err) return r; const dl = daily('read'); const S = S0(); let extra = '';
    if (post.tip) { S.flags.walkTip = { day: G0.dayNum() + 1, job: post.tip.job }; extra = `你把「${(C.jobs.find(j => j.id === post.tip.job) || {}).name}」记在了心里：明天去问，录取率 +8%。`; }
    if (post.cat === '故事' && (dl.story || 0) < 3) { dl.story = (dl.story || 0) + 1; G0.change({ mental: 1 }); extra = extra || '读完心里软了一下。精神 +1'; }
    n.read[post.id] = 1; return { ok: true, extra };
  };
  const quality = o => {
    const tp = N.topics.find(t => t.id === o.topic) || N.topics[0], tl = String(o.title || '').trim(), fit = o.tone === 'bait' ? 8 : tp.best[0] === o.tone ? 25 : tp.best.includes(o.tone) ? 18 : 6;
    const tq = tl.length >= 6 && tl.length <= 18 ? 10 : tl.length >= 3 ? 5 : 0, pol = clamp(o.polish == null ? 0 : o.polish, 0, 3);
    return clamp(Math.round(30 + fit + pol * 8 + tq + (o.luck != null ? o.luck : ri(0, 11)) - (o.tone === 'bait' && pol < 2 ? 25 : 0)), 5, 100);
  };
  NET.quality = quality;
  NET.write = function (o) {
    const n = NET.st(), tl = String(o.title || '').trim(); if (!tl) return { err: '标题不能空着。' }; if (tl.length > 20) return { err: '标题别超过 20 个字。' };
    if (!N.topics.some(t => t.id === o.topic)) return { err: '先选个话题。' }; if (!N.tones.some(t => t.id === o.tone)) return { err: '先选个语气。' };
    if (daily('post').n >= 2) return { err: '今天已经发了两篇，别刷屏，明天再写。' };
    const r = NET.use(N.costs.forumWrite, '写帖'); if (r.err) return r; daily('post').n = (daily('post').n || 0) + 1;
    const q = quality(o), d = G0.dayNum(), R = rng(`reply:${d}:${n.posts.length}:${tl}`), tier = q >= 70 ? 'good' : q >= 45 ? 'ok' : 'bad';
    const nr = tier === 'good' ? 4 : tier === 'ok' ? 3 : 4, replies = [];
    for (let i = 0; i < nr; i++) { const pool = tier === 'good' ? N.replyGood : tier === 'ok' ? N.replyOk : N.replyBad; replies.push({ day: d + 1 + Math.floor(i * 3 / nr), user: N.users[Math.floor(R() * N.users.length)], text: pool[Math.floor(R() * pool.length)] }); }
    const post = { id: 'p' + d + '_' + n.posts.length, day: d, topic: o.topic, tone: o.tone, title: tl, q, tier, likes: Math.round(q * (o.tone === 'bait' ? 1.6 : .8) + R() * 8), replies, settled: false };
    n.posts.push(post); G0.log(`在酒仙桥论坛发了帖子「${tl}」。`); return { ok: true, post };
  };
  // 回复 / 点赞 / 稿费 / 被喷：发帖后第 2 天起结算（之后每次上网时检查）
  NET.settle = function () {
    const n = NET.st(), d = G0.dayNum(), out = [];
    n.posts.forEach(p => { if (p.settled || d < p.day + 2) return; p.settled = true; let pay = 0, rep = 0, mental = 0;
      if (p.tier === 'good') { pay = 8 + Math.round((p.q - 70) * .7); rep = 2; mental = 3; } else if (p.tier === 'ok') { pay = Math.round((p.q - 45) / 5); rep = 1; } else { rep = p.tone === 'bait' ? -2 : -1; mental = -4; }
      const S = S0(); S.money += pay; p.pay = pay; G0.change({ rep, mental }); out.push({ post: p, pay, rep, mental }); G0.log(p.tier === 'good' ? `论坛帖「${p.title}」火了，稿费 ¥${pay}。` : p.tier === 'ok' ? `论坛帖「${p.title}」有几条回复，稿费 ¥${pay}。` : `论坛帖「${p.title}」被网友喷了。`); });
    return out;
  };
  NET.visibleReplies = p => (p.replies || []).filter(r => r.day <= G0.dayNum());
  // ================= 证券账户 =================
  NET.hasAcct = () => !!NET.st().acct;
  NET.openAccount = function (o) {
    if (window.TOWN && !TOWN.available('stock')) return { err: '证券开户第6天开放。' }; const n = NET.st(); if (n.acct) return { err: '已经开过户了。' }; if (!o || !o.signed) return { err: '还没有签名。' }; if (!o.risk) return { err: '风险测评还没做完。' };
    const S = S0(); if (S.money < N.accountFee) return { err: `开户费 ¥${N.accountFee}，钱不够。` }; const r = NET.use(N.accountMin, '开户'); if (r.err) return r;
    S.money -= N.accountFee; n.acct = { day: G0.dayNum(), cash: 0, hold: {}, risk: o.risk, fees: 0, realized: 0 }; G0.log('在网吧开了证券账户。'); return { ok: true };
  };
  const intOf = (raw, max, verb, what) => { const t = String(raw == null ? '' : raw).replace(/[,\s，]/g, ''); if (!t) return { err: `先输入要${verb}多少。` }; if (/^[-+]?\d+[.．。]\d*$/.test(t)) return { err: '只能是整数，不能带小数点。' }; if (/^-/.test(t)) return { err: '不能是负数。' }; if (!/^\d+$/.test(t)) return { err: '只能输入数字 0–9。' }; if (t.length > 9) return { err: '这个数字太大了。' }; const v = parseInt(t, 10); if (v <= 0) return { err: '要大于 0。' }; if (v > max) return { err: max < 1 ? `${what}没有了，${verb}不了。` : `${what}最多 ${max}，${verb}不了 ${v}。` }; return { n: v }; };
  NET.intOf = intOf;
  // 银证转账：口袋 / 存折 ↔ 证券户（存折流水里有一笔，钱和存折对得上）
  NET.transfer = function (dir, src, raw) {
    const a = NET.st().acct; if (!a) return { err: '先开户。' }; const S = S0(), l = L(); const from = dir === 'in' ? (src === 'bank' ? l.bank : S.money) : a.cash;
    const v = intOf(raw, from, dir === 'in' ? '转入' : '转出', dir === 'in' ? (src === 'bank' ? '存折里' : '口袋里') : '证券户里'); if (v.err) return v; const n = v.n;
    if (dir === 'in') { if (src === 'bank') { l.bank -= n; (l.ledger = l.ledger || []).push({ day: G0.dayNum(), kind: 'out', amt: n, note: '转入证券户' }); } else S.money -= n; a.cash += n; }
    else { a.cash -= n; if (src === 'bank') { l.bank += n; (l.ledger = l.ledger || []).push({ day: G0.dayNum(), kind: 'in', amt: n, note: '证券户转回' }); } else S.money += n; }
    return { ok: true, n };
  };
  NET.fee = amt => Math.max(N.tradeFeeMin, Math.round(amt * N.tradeFeeRate));
  NET.buy = function (id, raw) {
    const a = NET.st().acct; if (!a) return { err: '先开户。' }; const s = stock(id); if (!s) return { err: '没有这支股票。' }; const px = NET.price(id);
    const maxN = Math.max(0, Math.floor((a.cash - 1) / (px * (1 + N.tradeFeeRate)))); const v = intOf(raw, maxN, '买', '证券户的钱最多能买'); if (v.err) return v;
    const amt = Math.round(px * v.n), fee = NET.fee(amt); if (amt + fee > a.cash) return { err: '钱不够（含手续费）。' }; const r = NET.use(N.costs.trade, '下单'); if (r.err) return r;
    a.cash -= amt + fee; a.fees += fee; const h = a.hold[id] || (a.hold[id] = { n: 0, cost: 0 }); h.n += v.n; h.cost += amt + fee; return { ok: true, n: v.n, amt, fee, px };
  };
  NET.sell = function (id, raw) {
    const a = NET.st().acct; if (!a) return { err: '先开户。' }; const h = a.hold[id]; const have = h ? h.n : 0; const v = intOf(raw, have, '卖', '你手里的股数'); if (v.err) return v; const px = NET.price(id);
    const r = NET.use(N.costs.trade, '下单'); if (r.err) return r; const amt = Math.round(px * v.n), fee = NET.fee(amt), costPart = Math.round(h.cost * v.n / h.n);
    a.cash += amt - fee; a.fees += fee; a.realized += amt - fee - costPart; h.n -= v.n; h.cost -= costPart; if (h.n <= 0) delete a.hold[id]; return { ok: true, n: v.n, amt, fee, px, pl: amt - fee - costPart };
  };
  NET.holdValue = () => { const a = NET.st().acct; if (!a) return 0; return Object.keys(a.hold).reduce((t, id) => t + Math.round(NET.price(id) * a.hold[id].n), 0); };
  NET.portfolio = () => { const a = NET.st().acct; if (!a) return []; return Object.keys(a.hold).map(id => { const h = a.hold[id], px = NET.price(id), val = Math.round(px * h.n); return { id, name: stock(id).name, n: h.n, cost: h.cost, avg: h.cost / h.n, px, val, pl: val - h.cost, pct: h.cost ? (val - h.cost) / h.cost : 0 }; }); };
  // ================= 找活 / 视频 / 电影 =================
  NET.jobSearch = function (jobId) {
    const dl = daily('job'); if (dl.n) return { err: '今天已经查过招工网站了，明天再看。' }; const j = (C.jobs || []).find(x => x.id === jobId); if (!j) return { err: '没有这个岗位。' }; const r = NET.use(N.costs.job, '找活'); if (r.err) return r; dl.n = 1;
    S0().flags.walkTip = { day: G0.dayNum() + 1, job: j.id }; G0.log(`在网上查了「${j.name}」的招工。`); return { ok: true, job: j };
  };
  NET.jobChoices = () => { const R = rng(`jobs:${G0.dayNum()}`), js = (C.jobs || []).filter(j => j.wage && !j.hidden).slice(); for (let i = js.length - 1; i > 0; i--) { const k = Math.floor(R() * (i + 1)); [js[i], js[k]] = [js[k], js[i]]; } return js.slice(0, 3); };
  const CALL_LINES = ['妈在视频里一直笑，说你瘦了，又说你怎么晒黑了。你说挺好的，吃得饱。', '家里的狗对着镜头叫，你听见爸在后面喊：“别吵，听你哥说话。”', '妹妹抢过手机，把作业本举到镜头前：“我考了九十五！”你笑着说回来给你买糖。', '奶奶把脸凑得太近，只看得见一个鼻子。你们都笑了，她说：“吃饱了没？”'];
  NET.call = function () { const dl = daily('call'); if (dl.n) return { err: '今天已经和家里视频过了，明天再打。' }; const r = NET.use(N.costs.call, '视频'); if (r.err) return r; dl.n = 1; G0.change({ mental: 8 }); return { ok: true, text: pick(CALL_LINES), eff: { mental: 8 } }; };
  const MOVIES = [['《桥》', '一座老桥，两个互不认识的人，每天从两头走向对方，三十年没碰过面。你看到最后一幕，鼻子发酸。'], ['《夜班列车》', '一个搬运工在列车上睡了一觉，梦见自己回了家。醒来时，窗外正下雪。'], ['《面馆》', '一家小面馆的故事，老板每天给最后一位客人留一碗面。你吃着泡面看完，竟觉得面格外香。'], ['《追风的三轮车》', '一个送货大叔和他的三轮车，在凌晨的街上追逐日出。又好笑又暖心。']];
  NET.movie = function () { if (window.TOWN && !TOWN.available('movie')) return { err: '电影点播第10天开放。' }; const dl = daily('movie'); if (dl.n) return { err: '今天已经看过一场了，眼睛要歇歇。' }; const r = NET.use(N.costs.movie, '看电影'); if (r.err) return r; dl.n = 1; const m = pick(MOVIES); G0.change({ mental: 10, stamina: 3, hunger: -4 }); return { ok: true, name: m[0], text: m[1], eff: { mental: 10, stamina: 3, hunger: -4 } }; };
})();
