// 勇闯酒仙桥 · 核心逻辑
(function () {
  const C = window.CONFIG, ST = C.settings;
  const $ = s => document.querySelector(s);
  const hm = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DAY0 = ST.dayStartHour * 60;
  const SAVE = 'jxq_auto_v1', SLOT = 'jxq_slot1_v1';
  let S = null;
  const G = {};
  window.G = G;

  // ================= 时间 =================
  G.hourF = () => (S.time % 1440) / 60;
  G.hour = () => Math.floor(G.hourF());
  G.dayNum = (t) => Math.floor(((t == null ? S.time : t) - DAY0) / 1440) + 1;
  G.clock = (t) => { t = t == null ? S.time : t; const m = ((t % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  G.inHours = (from, to, hF) => { const f = hm(from) / 60, t = hm(to) / 60; hF = hF == null ? G.hourF() : hF; return f <= t ? (hF >= f && hF < t) : (hF >= f || hF < t); };
  G.isOpen = P => G.inHours(P.open, P.close === '24:00' ? '23:59' : P.close) || (P.open === '00:00' && P.close === '24:00');
  G.phase = () => { const h = G.hour(); return (ST.phases.find(p => h >= p.from && h < p.to) || {}).name || ''; };
  G.untilClock = (target) => { const cur = S.time % 1440; let d = hm(target) - cur; if (d <= 0) d += 1440; return d; };
  G.crowdAt = h => h < 4 ? 1 : h < 5 ? 10 : h < 7 ? 24 : h < 9 ? 10 : h < 16 ? 4 : h < 19.5 ? 18 : h < 22 ? 6 : 2;
  G.identity = () => {
    if (!S) return null;
    if (S.idId === 'self' && S.custom) return S.custom;
    return C.identities.find(i => i.id === S.idId) || null;
  };

  // ================= 状态 =================
  G.newGame = function (idId, custom) {
    const I = idId === 'self' ? custom : C.identities.find(i => i.id === idId);
    if (!I) return null;
    const t0 = DAY0 + hm(ST.arriveTime) - DAY0;
    S = {
      v: 1, idId, time: t0, loc: 'corner', money: I.startMoney, sent: 0, earned: 0, rep: 50,
      stats: Object.assign({}, I.stats), maxSta: I.maxStamina, attrs: Object.assign({}, I.attrs), skills: Object.assign({}, I.skills),
      outfit: I.outfit, owned: [I.outfit], items: {}, debuffs: [], jobsDone: {}, stories: [], npc: {}, record: { count: 0, log: [] },
      offers: null, refused: {}, collapses: 0, bed: null, beersTonight: 0, picked: {}, log: [], flags: {}, ended: null, eventsOnce: {},
      stamps: [], album: [], lastDailyDay: 0, dayPostcardPending: null,
      xp: { hands: 0, knife: 0, eye: 0, pick: 0 }, starveH: 0, forced: { sleep: 0, hunger: 0, mental: 0 }, lvlups: [],
      stats_total: { worked: 0, stolen: 0, caught: 0 },
      unlocked: {}, unlockInit: false, ach: {}, certs: {}, owed: [], lottery: null
    };
    C.npcs.forEach(n => S.npc[n.id] = { aff: 30, talk: 0 });
    C.identities.filter(i => i.id !== idId).forEach(i => S.npc['id_' + i.id] = { aff: 30, talk: 0 });
    G.log(`第1天 ${ST.arriveTime}，你到了酒仙桥。`, 'big');
    G.addAlbum({ id: 'arrive', kind: 'arrive', title: '到了酒仙桥', caption: '站在路口看了一会儿。风有点冷。' });
    S.seasonStart = G.nextSeasonStart || C.seasons.defaultStart; G.applySeasonPrices();
    if (I.startRoom) { S.room = { until: 1 + I.startRoom.daysLeft, pots: (I.startRoom.pots || []).map(p => ({ id: p.id, wd: (G.plantDef(p.id).grow[p.stage - 1] || 0), lastW: 1, planted: 1 })), decor: [], warned: false, lastSlept: null }; }
    G.checkUnlocks(); S.dayLedger = { day: 1, money0: S.money, earned0: 0, sent0: 0, wage: 0 };
    S.wageBook = 0; S.incomeMiles = {};
    if (idId === 'self') { S.custom = custom; S.social = { pref: custom.pref || 'none', people: {} }; }
    G.save();
    return S;
  };
  G.S = () => S;
  G.migrate = () => {
    if (!S) return;
    if (!S.seasonStart) S.seasonStart = (C.seasons && C.seasons.defaultStart) || 'autumn';
    if (G.applySeasonPrices) G.applySeasonPrices();
    if (!S.album) S.album = [];
    if (S.skills && S.skills.knife == null) S.skills.knife = (C.identities.find(i => i.id === S.idId) || {}).skills ? (C.identities.find(i => i.id === S.idId).skills.knife || 0) : 0;
    if (!S.xp) S.xp = { hands: 0, knife: 0, eye: 0, pick: 0 };
    if (S.starveH == null) S.starveH = 0;
    if (!S.forced) S.forced = { sleep: 0, hunger: 0, mental: 0 };
    if (!S.lvlups) S.lvlups = [];
    if (!S.unlocked) { S.unlocked = {}; S.unlockInit = false; G.checkUnlocks(); }
    if (!S.ach) S.ach = {};
    if (window.CAST) CAST.migrateSave(S);
    if (window.CAST && S.wageBook != null) G.grantIncomeMiles();
    if (window.FOOT) FOOT.migrate(S);
  };
  G.noteWage = function (amt, source) {
    if (!S || !window.CAST) return [];
    CAST.note(S, amt, source);
    return G.grantIncomeMiles();
  };
  G.grantIncomeMiles = function () {
    if (!S || !window.CAST) return [];
    const got = CAST.claim(S);
    got.forEach(m => {
      if (m.money) S.money += m.money;
      if (m.mental) G.change({ mental: m.mental });
      if (m.xp) Object.keys(m.xp).forEach(k => G.gainXp(k, m.xp[k]));
      if (m.phone) S.attrs.phone = Math.min(9, (S.attrs.phone || 0) + m.phone);
      G.log(m.text + ' ' + m.reward, 'good');
      G.queue.push({ title: '攒到 ¥' + m.at, text: m.text + ' ' + m.reward });
      G.addAlbum({ id: 'wage_' + m.id, kind: 'milestone', title: '累计挣到 ¥' + m.at, caption: m.reward });
    });
    return got;
  };
  G.setState = s => { S = s; G.migrate(); };
  G.ensureAlbum = () => { if (S && !S.album) S.album = []; return S && S.album; };
  G.save = () => { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { } };
  G.hasAuto = () => !!localStorage.getItem(SAVE);
  G.loadAuto = () => { const s = localStorage.getItem(SAVE); if (!s) return false; S = JSON.parse(s); G.migrate(); return true; };
  G.saveSlot = () => { localStorage.setItem(SLOT, JSON.stringify(S)); };
  G.loadSlot = () => { const s = localStorage.getItem(SLOT); if (!s) return false; S = JSON.parse(s); G.migrate(); G.save(); return true; };
  G.hasSlot = () => !!localStorage.getItem(SLOT);
  G.log = (text, cls) => { if (!S) return; S.log.push({ t: `D${G.dayNum()} ${G.clock()}`, text, cls: cls || '' }); if (S.log.length > 120) S.log.shift(); };

  G.outfit = () => C.clothes.find(c => c.id === S.outfit);
  G.decency = () => clamp(Math.round(G.outfit().decency + S.stats.clean * 0.45 - 20), 0, 100);
  G.hasRecord = () => S.record.count > 0;
  G.debuff = id => S.debuffs.find(d => d.id === id && d.until >= G.dayNum());
  G.warmed = () => !!(G.debuff('warmed') || G.debuff('loose'));
  G.addDebuff = id => { const D = C.debuffs[id]; if (!D) return; S.debuffs = S.debuffs.filter(d => d.id !== id); S.debuffs.push({ id, until: G.dayNum() + D.days - 1 }); };
  G.recoverMult = (k) => { let m = 1; S.debuffs.forEach(d => { if (d.until >= G.dayNum()) { const D = C.debuffs[d.id]; if (k === 'stamina' && D.staminaRecover) m *= D.staminaRecover; if (k === 'mental' && D.mentalRecover) m *= D.mentalRecover; } }); return m; };
  G.change = (eff, src) => {
    if (!eff) return;
    const sc = S.stats;
    if (eff.stamina) sc.stamina = clamp(sc.stamina + eff.stamina, 0, S.maxSta);
    if (eff.mental) sc.mental = clamp(sc.mental + eff.mental, 0, 100);
    if (eff.hunger) sc.hunger = clamp(sc.hunger + eff.hunger, 0, 100);
    if (eff.clean) sc.clean = clamp(sc.clean + eff.clean, 0, 100);
    if (eff.money) S.money = Math.max(0, S.money + eff.money);
    if (eff.rep) S.rep = clamp(S.rep + eff.rep, 0, 100);
    if (eff.item) S.items[eff.item] = (S.items[eff.item] || 0) + 1;
    if (eff.flag) S.flags[eff.flag] = G.dayNum ? G.dayNum() : 1;
  };

  // ================= 时间推进 =================
  G.advance = function (minutes, mode, lodge) {
    let left = Math.round(minutes);
    while (left > 0) {
      const toBoundary = (() => { const off = (S.time - DAY0) % 1440; return 1440 - (off < 0 ? off + 1440 : off); })();
      const step = Math.min(left, 60, toBoundary);
      const f = step / 60; const sc = S.stats;
      if (mode === 'sleep') {
        sc.hunger = clamp(sc.hunger + ST.perHourSleepHunger * f, 0, 100);
        const r = lodge.recover;
        sc.stamina = clamp(sc.stamina + r.stamina * f * G.recoverMult('stamina') * G.hungerRegenMult(), 0, S.maxSta);
        sc.mental = clamp(sc.mental + (r.mental > 0 ? r.mental * G.recoverMult('mental') : r.mental) * f, 0, 100);
        const h = G.hourF();
        if (lodge.cold && !G.outfit().warm && !G.warmed() && (h >= 22 || h < 6)) sc.stamina = clamp(sc.stamina + C.coldPenalty.stamina * f, 0, S.maxSta);
      } else if (mode === 'work') {
        sc.hunger = clamp(sc.hunger + (ST.perHourWorkHunger || -5) * f, 0, 100);
      } else {
        const p = ST.perHourAwake;
        // 饿着的时候体力掉得更快
        const hungryDrain = sc.hunger <= TH().hungerLow ? -1.5 : 0;
        const sea = G.season ? G.season() : null, md = (sea && sea.mods) || {};
        const sm = (md.noWarmSta && !G.outfit().warm ? md.noWarmSta : (md.awakeSta || 1)) * (md.outdoorSta && G.isOutdoor() ? md.outdoorSta : 1);
        sc.stamina = clamp(sc.stamina + (p.stamina * sm + hungryDrain) * f, 0, S.maxSta); sc.mental = clamp(sc.mental + p.mental * f, 0, 100); sc.hunger = clamp(sc.hunger + p.hunger * (md.awakeHun || 1) * f, 0, 100);
      }
      if (sc.hunger <= 0 && mode !== 'work') { sc.stamina = clamp(sc.stamina + ST.starving.stamina * f, 0, S.maxSta); sc.mental = clamp(sc.mental + ST.starving.mental * f, 0, 100); }
      if (sc.hunger <= 0) S.starveH = (S.starveH || 0) + f; else if (sc.hunger > 15) S.starveH = 0;
      const before = G.dayNum();
      S.time += step; left -= step;
      if (G.dayNum() !== before) G.newDay();
    }
  };
  G.newDay = function () {
    const d = G.dayNum();
    S.beersTonight = 0; S.refused = {};
    G.log(`—— 第${d}天 ——`, 'day');
    G.closeLedger(d);
    G.rollDayCond(d);
    G.payOwed(d);
    G.certsTick(d);
    if (G.debtsTick) G.debtsTick(d);
    S.debuffs = S.debuffs.filter(x => x.until >= d);
    const sp = (ST.specialDays || []).find(x => x.days.includes(d));
    if (sp) { G.log(sp.text, 'warn'); G.queue.push({ title: `第${d}天`, text: sp.text }); }
    G.fireEvents('morning');
    G.checkUnlocks();
    if (G.checkMilestones) G.checkMilestones();
    if (G.roomTick) G.roomTick(d);
    // 每天（或隔天）抽一条日常事件
    const every = C.dailyEventEvery || 1;
    if (d > 1 && (d - 1) % every === 0 && S.lastDailyDay !== d) {
      S.lastDailyDay = d;
      G.rollDailyEvent();
    }
  };
  G.queue = [];
  G.eventNeedOk = function (e, ctx) {
    const n = e.need || {}; const I = G.identity();
    if (n.job && (n.job !== ctx.job || !ctx.completed)) return false;
    if (n.phoneBelow && S.attrs.phone >= n.phoneBelow) return false;
    if (n.identity && n.identity !== S.idId) return false;
    if (n.ageAbove != null && I.age <= n.ageAbove) return false;
    if (n.ageBelow != null && I.age >= n.ageBelow) return false;
    if (n.hasRecord != null && !!G.hasRecord() !== !!n.hasRecord) return false;
    if (n.minDay != null && G.dayNum() < n.minDay) return false;
    if (n.maxDay != null && G.dayNum() > n.maxDay) return false;
    if (n.skillPickBelow != null && S.skills.pick >= n.skillPickBelow) return false;
    if (n.flag && !S.flags[n.flag]) return false;
    if (n.unlockedNpc && !(S.unlocked && S.unlocked['npc:' + n.unlockedNpc])) return false;
    if (n.moneyBelow != null && S.money >= n.moneyBelow) return false;
    if (n.place && S.loc !== n.place) return false;
    return true;
  };
  G.applyEvent = function (e, title) {
    if (e.once) S.eventsOnce[e.id] = 1;
    if (e.id === 'card') G.grantAch('no_card');
    G.change(e.effects); G.log(e.text, 'event');
    G.queue.push({ title: title || '发生了一件事', text: e.text, eff: e.effects });
  };
  G.fireEvents = function (trigger, ctx) {
    ctx = ctx || {};
    C.events.filter(e => e.trigger === trigger).forEach(e => {
      if (e.once && S.eventsOnce[e.id]) return;
      if (e.days && !e.days.includes(G.dayNum())) return;
      if (!G.eventNeedOk(e, ctx)) return;
      if (Math.random() > (e.chance == null ? 1 : e.chance)) return;
      G.applyEvent(e);
    });
  };
  G.rollDailyEvent = function () {
    const pool = C.events.filter(e => e.trigger === 'daily' && !(e.once && S.eventsOnce[e.id]) && G.eventNeedOk(e, {}));
    if (!pool.length) return null;
    const tot = pool.reduce((a, e) => a + (e.weight || 1), 0);
    let r = Math.random() * tot, pickE = pool[0];
    for (const e of pool) { if ((r -= (e.weight || 1)) <= 0) { pickE = e; break; } }
    G.applyEvent(pickE, '今天的酒仙桥');
    return pickE;
  };

  // ================= v0.8 经济：日子行情、零碎开销、拖欠工钱 =================
  G.EC = () => ST.economy || {};
  G.rollDayCond = function (d) {
    const E = G.EC(); if (!S.dayCond || S.dayCond.day !== d) {
      const slow = d > 1 && Math.random() < (E.slowDayP || 0), rain = d > 1 && Math.random() < (E.rainDayP || 0);
      S.dayCond = { day: d, slow, rain };
      if (G.onSeasonDay) G.onSeasonDay(d);
      if (slow) { G.log(E.slowDay.text, 'warn'); G.queue.push({ title: '淡日', text: E.slowDay.text }); }
      if (rain) { G.log(E.rainDay.text, 'warn'); G.queue.push({ title: '下雨', text: E.rainDay.text }); }
    }
    if (d > 1 && E.dailyMisc && S.miscDay !== d) {
      S.miscDay = d; const n = Math.min(S.money, E.dailyMisc); S.money -= n; S.spentMisc = (S.spentMisc || 0) + n;
      if (n) G.log(E.dailyMiscText.replace('{n}', n));
    }
  };
  G.dayCond = () => (S.dayCond && S.dayCond.day === G.dayNum()) ? S.dayCond : { slow: false, rain: false };
  // v0.9 四季：开局选季节，之后每 daysPer 天换一季
  G.season = function (d) {
    const SE = C.seasons; if (!SE || !SE.list) return null; d = d || G.dayNum();
    const ids = SE.list.map(x => x.id); const st = Math.max(0, ids.indexOf((S && S.seasonStart) || SE.defaultStart));
    return SE.list[(st + Math.floor((d - 1) / SE.daysPer)) % 4];
  };
  G.seasonDayLeft = () => { const SE = C.seasons; return SE.daysPer - ((G.dayNum() - 1) % SE.daysPer); };
  G.applySeasonPrices = function () {
    const sea = G.season(); const m = sea ? (sea.warmPrice || 1) : 1;
    C.clothes.forEach(c => { if (c.basePrice == null) c.basePrice = c.price; c.price = (c.warm && c.basePrice) ? Math.round(c.basePrice * m) : c.basePrice; });
  };
  G.onSeasonDay = function (d) {
    G.applySeasonPrices();
    const a = G.season(d), b = d > 1 ? G.season(d - 1) : null;
    if (a && b && a.id !== b.id) { G.log(`${a.icon} ${a.text}`, 'event'); G.queue.push({ title: `${a.icon} ${a.name}天来了`, text: a.text + `（${a.tip}）` }); G.addAlbum({ id: 'season_' + d, kind: 'moment', title: `${a.name}天`, caption: a.text }); }
  };
  G.shelterOk = () => { const L = C.lodging.find(l => l.id === 'shelter'); return !!L && G.season() && G.season().id === L.season && (S.flags.shelterDay == null || G.dayNum() - S.flags.shelterDay >= (L.everyNights || 2)); };
  G.isOutdoor = () => (C.seasons.outdoorPlaces || []).includes(S.loc);
  G.seasonJob = id => { const s = G.season(); return (s && s.jobs && s.jobs[id]) || {}; };
  G.checkMilestones = function () {
    const M = C.milestones || []; const pr = G.goalProgress(); if (pr.pct == null) return; S.miles = S.miles || {};
    M.forEach(m => { if (pr.pct >= m.at && !S.miles[m.at]) { S.miles[m.at] = G.dayNum(); G.log(m.text, 'good'); G.queue.push({ title: m.title, text: m.text + `（${pr.text}）` }); G.addAlbum({ id: 'mile_' + m.at, kind: 'milestone', title: m.title, caption: pr.text }); } });
  };
  // v0.9 地图：两地之间走路几分钟（按地图上的距离）
  G.travelMin = function (from, to) {
    const M = C.townMap; if (!M || from === to) return 0; const coords = M.walkPins || M.pins; const a = coords[from], b = coords[to]; if (!a || !b) return 10;
    const W = M.walk, d = Math.hypot(a[0] - b[0], (a[1] - b[1]) * 0.56) ; // 图是 16:9，纵向距离按比例缩
    return Math.max(W.min, Math.min(W.max, Math.round((W.base + d * W.perPct) / W.step) * W.step));
  };
  // ===== v0.9 月租单间 + 花草 =====
  G.roomOwned = () => !!(S.room && !S.room.evicted && S.room.until != null);  // 到期后宽限期内也还算你的（但要尽快续）
  G.roomDaysLeft = () => G.roomOwned() ? S.room.until - G.dayNum() : 0;
  G.rentRoom = function () {
    const R = C.room; if (S.money < R.price) return { err: `月租要 ¥${R.price}，钱不够。` };
    S.money -= R.price; G.advance(15);
    if (G.roomOwned()) { S.room.until += R.days; S.room.warned = false; G.log(`续了一个月房租（¥${R.price}），到第 ${S.room.until} 天。`); }
    else { const old = S.room && S.room.evicted ? S.room : null; S.room = { until: G.dayNum() + R.days, pots: [], decor: old ? old.decor || [] : [], warned: false, lastSlept: null }; G.log(`在平安旅社租了个月租单间（¥${R.price}，${R.days} 天）。`, 'good'); }
    return { ok: true };
  };
  G.plantDef = id => C.room.plants.find(p => p.id === id);
  G.plantStage = pot => { const P = G.plantDef(pot.id); if (pot.dead) return -1; const w = pot.wd || 0; return P.grow.filter(t => w >= t).length; };
  G.grownPlants = () => G.roomOwned() ? (S.room.pots || []).filter(p => !p.dead && G.plantStage(p) >= 2).length : 0;
  G.buyPlant = function (id) {
    const P = G.plantDef(id); if (!G.roomOwned()) return { err: '得先有自己的屋子。' };
    if ((S.room.pots || []).filter(p => !p.dead).length >= C.room.pots) return { err: '窗台摆满了。' };
    if (S.money < P.price) return { err: '钱不够。' };
    S.money -= P.price; S.room.pots = (S.room.pots || []).filter(p => !p.dead); S.room.pots.push({ id, wd: 0, lastW: null, planted: G.dayNum() }); G.advance(10); G.log(`买了一盆${P.name}，摆在窗台上。`); return { ok: true };
  };
  G.water = function () {
    if (!G.roomOwned()) return { err: '不在自己屋里。' }; const d = G.dayNum(); let n = 0;
    (S.room.pots || []).forEach(p => { if (!p.dead && p.lastW !== d) { p.lastW = d; n++; } });
    if (!n) return { err: '今天都浇过了。' }; G.advance(5); G.change({ mental: 1 }); G.log(`给窗台上的 ${n} 盆花草浇了水。`); return { ok: true, n };
  };
  G.buyDecor = function (id) {
    const D = C.room.decor.find(x => x.id === id); if (!G.roomOwned()) return { err: '得先有自己的屋子。' };
    if ((S.room.decor || []).includes(id)) return { err: '已经有了。' }; if (S.money < D.price) return { err: '钱不够。' };
    S.money -= D.price; S.room.decor = (S.room.decor || []).concat(id); G.advance(10); G.log(`给屋里添了个${D.name}。`); return { ok: true };
  };
  G.harvest = function (i) { const p = (S.room.pots || [])[i]; if (!p || p.dead) return { err: '没有。' }; const P = G.plantDef(p.id); if (!P.hunger || G.plantStage(p) < 3) return { err: '还没长好。' }; G.change({ hunger: P.hunger, mental: 1 }); S.room.pots.splice(i, 1); G.log(`掐了一把${P.name}，用电热杯煮了碗面。`); return { ok: true }; };
  G.roomTick = function (d) {
    if (!S.room || S.room.evicted) return; const R = C.room;
    if (G.roomOwned()) {
      S.roomDays = (S.roomDays || 0) + (d <= S.room.until ? 1 : 0);
      (S.room.pots || []).forEach(p => { if (p.dead) return; if (p.lastW != null && d - p.lastW <= 2) p.wd = (p.wd || 0) + 1; if (p.lastW == null ? d - p.planted > R.dryDays : d - p.lastW > R.dryDays) { p.dead = true; G.log(`窗台上的${G.plantDef(p.id).name}干死了。`, 'bad'); } });
      if (S.room.lastSlept === d - 1) {
        const bonus = Math.min(R.maxBonus, (S.room.pots || []).filter(p => !p.dead && G.plantStage(p) >= 1).reduce((a, p) => a + G.plantDef(p.id).mental, 0) + (S.room.decor || []).length);
        if (bonus) { G.change({ mental: bonus }); G.log(`在自己屋里醒来，窗台上的花草和小物件让你心里松快了点（精神 +${bonus}）。`, 'good'); }
      }
      const left = S.room.until - d;
      if (left > 0 && left <= R.warnDays && !S.room.warned) { S.room.warned = true; const t = R.warnText.replace('{n}', left); G.log(t, 'warn'); G.queue.push({ title: '房租快到期了', text: t }); }
      if (left <= 0) {
        const over = -left;
        if (over >= R.graceDays) { S.room.evicted = true; S.room.pots = []; if (S.bed && S.bed.id === 'month') S.bed = null; G.log(R.evictText, 'bad'); G.queue.push({ title: '被清屋了', text: R.evictText }); S.evictions = (S.evictions || 0) + 1; }
        else if (over === 0) { const t = R.graceText.replace('{n}', R.graceDays); G.log(t, 'bad'); G.queue.push({ title: '房租到期', text: t }); }
      }
    }
  };
  G.roomOwned0 = G.roomOwned;
  G.noteMet = function (key) { const r = S.npc[key]; if (!r) return; r.lastDay = G.dayNum(); r.recSeen = S.record.count; };
  G.dayCondText = () => { const c = G.dayCond(), E = G.EC(), t = []; if (c.slow) t.push('淡日：活少、压价'); if (c.rain) t.push('下雨：室外的活少'); return t.join(' · '); };
  G.payOwed = function (d) {
    if (!S.owed || !S.owed.length) return;
    const due = S.owed.filter(x => x.day <= d); S.owed = S.owed.filter(x => x.day > d);
    due.forEach(x => { S.money += x.amt; S.earned += x.amt; if (G.noteWage) G.noteWage(x.amt, 'job'); const t = `拖了${x.wait}天的${x.job}工钱 ¥${x.amt} 终于结了。`; G.log(t, 'good'); G.queue.push({ title: '工钱到账', text: t, eff: { money: x.amt } }); });
  };
  G.freeMentalOk = function (k) { const F = (ST.freeMental || {})[k]; if (!F) return false; if (F.where && S.loc !== F.where) return false; if (!G.inHours(F.from, F.to)) return false; return !(S.freeDone && S.freeDone[k] === G.dayNum()); };
  G.freeMental = function (k) { const F = ST.freeMental[k]; if (!G.freeMentalOk(k)) return null; S.freeDone = S.freeDone || {}; S.freeDone[k] = G.dayNum(); G.advance(F.minutes); G.change({ mental: F.mental }); G.log(F.text); return F; };
  G.owedTotal = () => (S.owed || []).reduce((a, x) => a + x.amt, 0);

  // ================= 招工 =================
  G.currentWindow = () => { for (const k in ST.windows) { const w = ST.windows[k]; if (G.inHours(w.from, w.to)) return k; } return null; };
  G.offers = function () {
    const win = G.currentWindow(); if (!win) return [];
    const key = G.dayNum() + '-' + win;
    if (!S.offers || S.offers.key !== key) {
      const W = ST.windows[win], from = hm(W.from), to = hm(W.to);
      const dayBase = S.time - (S.time % 1440);
      const sp = ST.specialDays.find(x => x.days.includes(G.dayNum()));
      const list = [];
      const E = G.EC(), dc = G.dayCond();
      C.jobs.filter(j => j.window === win && G.jobOpen(j)).forEach((j, idx) => {
        let pApp = E.jobAppearP == null ? 1 : E.jobAppearP;
        if (dc.rain && E.rainDay && E.rainDay.outdoor.includes(j.id)) pApp *= E.rainDay.appearMult;
        if (dc.slow) pApp *= 0.8;
        pApp *= (G.seasonJob(j.id).appear || 1);
        const I0 = G.identity();
        if (I0.jobBias && !I0.jobBias.includes(j.id)) pApp *= 0.35;         // 阿珍：招女工的活更多
        if (I0.nightCornerPenalty && win === 'evening' && !j.light) pApp *= 0.4; // 晚高峰路口几乎不要女工
        if (Math.random() > pApp) return;   // 今天这个时段没人招这个活
        const n = 1 + (Math.random() < (E.extraOfferP == null ? 0.6 : E.extraOfferP) && !dc.slow ? 1 : 0), span = Math.max(60, to - from - 60);
        for (let k = 0; k < n; k++) {
          const jit = E.wageJitter == null ? 2 : E.wageJitter;
          let wage = j.wage + ri(-jit, Math.ceil(jit / 2)) * 5;
          if (dc.slow) wage = Math.round(wage * E.slowDay.wageMult / 5) * 5;
          if (G.seasonJob(j.id).pay) wage = Math.round(wage * G.seasonJob(j.id).pay / 5) * 5;
          if (sp && (sp.jobs === 'all' || sp.jobs.includes(j.id))) wage = Math.round(wage * sp.wageMult / 5) * 5;
          const cut = E.agencyCut ? ri(E.agencyCut[0] / 5, E.agencyCut[1] / 5) * 5 : 0;
          // 第一个招工的人会在路口站很久（不受待见的活，中介得喊上好一会儿）；后面的来得晚、走得快
          const appear = dayBase + from + (k === 0 ? ri(0, 20) : Math.floor(k * span / n) + ri(0, 25));
          const gone = k === 0 ? dayBase + to - ri(0, 20) : Math.min(dayBase + to, appear + ri(60, 150));
          list.push({ oid: key + '-' + j.id + '-' + k, job: j.id, wage, cut, appear, gone, recruiter: j.recruiter, winFrom: dayBase + from });
        }
      });
      S.offers = { key, list };
    }
    return S.offers.list.filter(o => o.appear <= S.time && o.gone > S.time && C.jobs.find(j => j.id === o.job).start && G.jobStartAbs(o) > S.time + 20);
  };
  G.jobStartAbs = function (o) { const j = C.jobs.find(x => x.id === o.job); const dayBase = S.time - (S.time % 1440); return dayBase + hm(j.start) + (hm(j.start) < 240 ? 1440 : 0); };
  G.hireChance = function (o) {
    return G.hireInfo(o).p;
  };
  G.hireInfo = function (o) {
    const j = C.jobs.find(x => x.id === o.job), I = G.identity();
    const why = [];
    let p = j.hire;
    why.push({ k: '工种底子', v: '+' + Math.round(j.hire * 100) + '%' });
    const dec = (G.decency() - 50) / 220; p += dec;
    if (Math.abs(dec) > 0.01) why.push({ k: '体面', v: (dec >= 0 ? '+' : '') + Math.round(dec * 100) + '%' });
    if (j.warmHire && G.outfit().warm) { p += j.warmHire; why.push({ k: '穿着厚衣服，不怕冻', v: '+' + Math.round(j.warmHire * 100) + '%' }); }
    const eye = S.skills.eye * 0.015; p += eye;
    if (eye) why.push({ k: '察言观色', v: '+' + Math.round(eye * 100) + '%' });
    if (I.hireBonus) { p += I.hireBonus; why.push({ k: '年轻人', v: '+' + Math.round(I.hireBonus * 100) + '%' }); }
    if (I.age > j.ageSoft) {
      const ageP = (I.age - j.ageSoft) * 0.03; p -= ageP;
      why.push({ k: '年龄偏大', v: '-' + Math.round(ageP * 100) + '%' });
    }
    if (S.attrs.exp >= 7) { p += 0.04; why.push({ k: '阅历', v: '+4%' }); }
    const outf = G.outfit();
    if (outf.hire && outf.hire[j.id]) {
      const hb = outf.hire[j.id]; p += hb;
      why.push({ k: '穿着「' + outf.name + '」', v: '+' + Math.round(hb * 100) + '%', good: 1 });
    } else if (j.id === 'guard' && outf.guard) {
      p += outf.guard; why.push({ k: '保安服', v: '+' + Math.round(outf.guard * 100) + '%', good: 1 });
    }
    if (j.needDecency && G.decency() < j.needDecency) { p *= 0.3; why.push({ k: `体面 ${G.decency()}，不到 ${j.needDecency}（领班嫌你不精神）`, v: '×30%', bad: 1 }); }
    if (j.id === 'guard' && S.flags.hasGuardCert) { p += 0.15; why.push({ k: '有保安证', v: '+15%', good: 1 }); }
    if (j.id === 'waiter' && S.flags.hasHealthCert) { p += 0.1; why.push({ k: '有健康证', v: '+10%', good: 1 }); }
    const T = TH(), sc = S.stats;
    if (sc.stamina <= T.staminaLow) { const d = 0.05 + (T.staminaLow - sc.stamina) / T.staminaLow * 0.25; p -= d; why.push({ k: `体力 ${Math.round(sc.stamina)}（脸色发灰）`, v: '-' + Math.round(d * 100) + '%', bad: 1 }); }
    if (sc.hunger <= T.hungerLow) { const d = 0.04 + (T.hungerLow - sc.hunger) / T.hungerLow * 0.12; p -= d; why.push({ k: `饱腹 ${Math.round(sc.hunger)}（饿得没劲）`, v: '-' + Math.round(d * 100) + '%', bad: 1 }); }
    if (sc.mental <= T.mentalLow) { p -= 0.08; why.push({ k: `精神 ${Math.round(sc.mental)}（魂不守舍）`, v: '-8%', bad: 1 }); }
    if (sc.clean <= T.cleanLow && (j.id === 'food' || j.id === 'antigen')) { p -= 0.15; why.push({ k: '身上有味儿，车间嫌埋汰', v: '-15%', bad: 1 }); }
    if (j.skill && j.skill !== 'eye') { const lv = S.skills[j.skill] || 0; if (lv) { const d = lv * 0.025; p += d; why.push({ k: `${C.skillNames[j.skill]} Lv${lv}`, v: '+' + Math.round(d * 100) + '%', good: 1 }); } }
    if (S.rep < 30) { p -= 0.1; why.push({ k: '口碑差', v: '-10%' }); }
    if (G.hasRecord()) {
      if (j.needClean) { p = 0; why.push({ k: '有案底·此活不要', v: '0%' }); }
      else { const before = p; p = p * Math.pow(j.recordHire, Math.min(S.record.count, 3) ** 0.5); why.push({ k: '有案底', v: '×' + Math.round((p / Math.max(before, 0.01)) * 100) + '%' }); }
    }
    { const E = G.EC(), dc = G.dayCond();
      if (dc.slow && E.slowDay) { p *= E.slowDay.hireMult; why.push({ k: '淡日，人多活少', v: '×' + Math.round(E.slowDay.hireMult * 100) + '%', bad: 1 }); }
      if (o.winFrom != null && E.peakMinutes != null) {
        const W = ST.windows[j.window], len = hm(W.to) - hm(W.from) + (hm(W.to) < hm(W.from) ? 1440 : 0);
        const late = clamp((S.time - o.winFrom - E.peakMinutes) / Math.max(30, len - E.peakMinutes), 0, 1);
        if (late > 0.05) { const m = 1 - late * (E.latePenalty || 0); p *= m; why.push({ k: '来晚了，好位置被抢了', v: '×' + Math.round(m * 100) + '%', bad: 1 }); }
      }
      if (E.hireMult && E.hireMult !== 1) p *= E.hireMult; }
    const lo = j.needClean && G.hasRecord() ? 0 : 0.05;
    const block = G.jobBlock(j);
    if (block) { p = 0; why.push({ k: block, v: '0%', bad: 1 }); }
    p = clamp(p, block ? 0 : lo, 0.97);
    return { p, pct: Math.round(p * 100), why, job: j, block };
  };
  // v1.0.1a：被拒绝的原因文字，每一种都有中文，拿不到就用兜底，绝不出现 undefined / null / NaN
  const REFUSE_WHY = { record: '因为你有案底', recordSoft: '因为你有案底', age: '嫌你岁数大', dirty: '嫌你衣服太脏、不体面', tired: '看你体力不行、站不稳', hungry: '看你饿得发昏', full: '人招满了', empty: '赶到了才发现人早就够了，白跑一趟' };
  const BADTXT = /undefined|null|NaN/;
  G.REFUSE_REASONS = Object.keys(REFUSE_WHY);
  G.refuseWhy = function (reason) { const t = REFUSE_WHY[reason]; return (typeof t === 'string' && t && !BADTXT.test(t)) ? t : '今天没看上你，说不上具体原因'; };
  G.refuseSafe = function (r, j) {
    r = r || {}; const reason = (typeof r.reason === 'string' && REFUSE_WHY[r.reason]) ? r.reason : 'full';
    let line = r.line; if (typeof line !== 'string' || !line.trim() || BADTXT.test(line)) { const pool = (C.refuseLines && C.refuseLines[reason]) || (C.refuseLines && C.refuseLines.full) || []; line = String(pool.length ? pool[Math.floor(Math.random() * pool.length)] : '今天人够了，下次再来吧。').replace('{job}', (j && j.name) || '这活'); }
    return Object.assign({}, r, { reason, line, why: G.refuseWhy(reason) });
  };
  G.tryHire = function (o) { const j = C.jobs.find(x => x.id === o.job); const r = G._tryHire(o); return r && r.ok === false ? G.refuseSafe(r, j) : r; };
  G._tryHire = function (o) {
    const j = C.jobs.find(x => x.id === o.job), I = G.identity();
    G.advance(10);
    const fill = s => s.replace('{job}', j.name);
    if (j.needClean && G.hasRecord()) { S.refused[o.oid] = 1; return { ok: false, reason: 'record', line: fill(pick(C.refuseLines.record)), hard: true }; }
    if (G.jobBlock(j)) { S.refused[o.oid] = 1; return { ok: false, reason: S.stats.stamina < TH().staminaNoJob ? 'tired' : 'hungry', line: S.stats.stamina < TH().staminaNoJob ? fill(pick(C.refuseLines.tired)) : '你嘴唇都白了，先去吃口饭吧，别晕在车上。', hard: true }; }
    const p = G.hireChance(o);
    const roll = S.debugHire != null ? (S.debugHire ? 0 : 1) : Math.random();
    if (roll < p) {
      if (j.fare) { S.money = Math.max(0, S.money - j.fare); G.log(`进城的路费花了 ${j.fare} 元。`); }
      if (j.fareRiskEmpty && Math.random() < j.fareRiskEmpty) { S.refused[o.oid] = 1; G.advance(150); G.change({ mental: -8, stamina: -6 }); G.log(`跑到${j.name}那边，对方说人够了。白跑一趟，路费 ${j.fare || 0} 元打了水漂。`, 'bad'); return { ok: false, reason: 'empty', line: '到了体育馆门口，对方说人够了。你看着手里的地铁票根，把骂人的话咽了回去。', hard: true }; }
      let wage = o.wage, line = null;
      if (G.hasRecord() && j.recordWage < 1) { wage = Math.round(o.wage * j.recordWage / 5) * 5; line = pick(C.recordWageLines).replace('{wage}', wage); }
      return { ok: true, wage, line, p };
    }
    S.refused[o.oid] = 1;
    let reason = 'full';
    if (G.hasRecord() && Math.random() < 0.7) reason = 'recordSoft';
    else if (I.age > j.ageSoft && Math.random() < 0.7) reason = 'age';
    else if (G.decency() < 35) reason = 'dirty';
    else if (S.stats.stamina <= TH().staminaLow) reason = 'tired';
    if (I.refuseMentalMult) { const m = Math.round(2 * I.refuseMentalMult); G.change({ mental: -m }); }
    return { ok: false, reason, line: fill(pick(C.refuseLines[reason])), p };
  };

  // ================= 干活结算 =================
  // v1.0.2：中途「不干了，走人」的结算：约 35% 一分没有，否则按 30%–60% 结，理由每次不一样
  G.quitRoll = function () {
    const none = ['领班把脸一沉：“干一半就走？这活算你没干，一分不给。”', '工头摆摆手：“中途撂挑子的，今天的钱没你的份。”', '会计翻了翻本子：“你这是自己走的，不算工，没有。”', '管事的头也不抬：“走就走，工钱谁来补我的窟窿？没有。”', '老板冷笑一声：“我这里不养半途而废的，一分钱没有。”'];
    const part = ['领班叹口气：“算了，干了多少给你结个零头。”', '工头数了几张零钱塞给你：“就这些，下次别中途溜。”', '会计按小时给你折了折：“干多少算多少，打个折。”', '管事的看你实在干不动了，勉强给你结了一部分。', '老板嘟囔着：“看你可怜，按一半多点给你。”'];
    const r = Math.random(); const pick = a => a[Math.floor(Math.random() * a.length)];
    if (r < .35) return { frac: 0, line: pick(none) };
    return { frac: Math.round((0.3 + Math.random() * 0.3) * 100) / 100, line: pick(part) };
  };
  G.finishJob = function (o, wage, res) {
    const j = C.jobs.find(x => x.id === o.job);
    const total = (hm(j.end) - hm(j.start) + 1440) % 1440;
    const frac = res.completed ? 1 : clamp(res.hoursDone * 60 / total, 0, 1);
    // v1.0 管饭：每份活的那一顿真的会端上来，吃了才补饱腹（在工时中间发生）
    const mealDefs = (j.meal && C.jobMeals && C.jobMeals[j.id]) || null; const eaten = []; const goalMin = Math.round(total * frac); let adv = 0;
    if (mealDefs) mealDefs.forEach(m => { if (frac >= Math.min(1, m.at + 0.05)) { const t = Math.round(goalMin * m.at) - adv; if (t > 0) { G.advance(t, 'work'); adv += t; } const h0 = S.stats.hunger; G.change({ hunger: m.hunger, mental: m.mental || 0 }); eaten.push(Object.assign({}, m, { got: Math.round(S.stats.hunger - h0) })); } });
    G.advance(goalMin - adv, 'work');
    // 吃过饭的一班：干完时饱腹至少回到这一顿的“保底线”，不会吃了饭还饿得发慌
    if (eaten.length) { const fl = Math.max.apply(null, eaten.map(m => m.floor || 0)); if (S.stats.hunger < fl) { const add = fl - S.stats.hunger; S.stats.hunger = fl; eaten[eaten.length - 1].got += Math.round(add); eaten[eaten.length - 1].lift = Math.round(add); } }
    const c = j.cost;
    const tired = (S.stats.stamina <= TH().staminaLow ? 1.15 : 1) * (S.stats.hunger <= 20 ? 1.2 : 1) * ((j.heavy || j.id === 'courier') ? (G.identity().heavyJobMult || 1) : 1);
    { const dm = Math.round((c.mental * (res.mentalMult || 1)) * Math.max(frac, .4));
      // 干一班活本身不会把人直接压垮：最多压到“快崩溃”的线上，给玩家留一口气去缓
      const floor = Math.min(S.stats.mental, TH().mentalForce + 2);
      G.change({ stamina: Math.round(c.stamina * frac * tired * (c.stamina < 0 && G.debuff('loose') ? C.debuffs.loose.workSta : 1)), clean: Math.round(c.clean * frac) });
      S.stats.mental = Math.max(floor, S.stats.mental + dm); }
    if (res.mentalBonus) G.change({ mental: res.mentalBonus });
    { const sj = G.seasonJob(j.id), sea = G.season(); if (sj.sta && frac > 0.3) G.change({ stamina: Math.round(sj.sta * frac) });
      if (sj.chill && !G.outfit().warm && !G.warmed() && Math.random() < sj.chill && C.debuffs.chill && !S.debuffs.some(x => x.id === 'chill')) { S.debuffs.push({ id: 'chill', until: G.dayNum() + C.debuffs.chill.days }); G.log(C.debuffs.chill.text, 'bad'); }
      const hs = sea && sea.heatstroke; if (hs && hs.jobs.includes(j.id) && S.stats.stamina < hs.below && Math.random() < hs.p) { G.change(hs.effects); G.log(hs.text, 'bad'); G.queue.push({ title: '中暑了', text: hs.text, eff: hs.effects }); S.heatstrokes = (S.heatstrokes || 0) + 1; } }
    if (j.meal && !mealDefs && frac > 0.4) { G.change({ hunger: 30 }); }
    let pay = 0;
    let bonus = 0, skillPay = 0, quitInfo = null, payLines = [];
    const E = G.EC();
    const lv = j.skill ? (S.skills[j.skill] || 0) : 0;
    let quitFrac = null, quitLineIn = null;
    if (!res.completed && !res.noPay && j.quitPay !== 'none' && j.quitPay !== 'hourly') {
      const qp = res.quitPay || G.quitRoll();
      quitFrac = qp.frac; quitLineIn = qp.line;
    }
    const spec = {
      wage, completed: !!res.completed && !res.noPay, noPay: !!res.noPay,
      quality: res.quality, qualityPay: j.qualityPay, skillLv: lv, fines: res.fines || 0,
      quitPay: j.quitPay, hourly: j.hourly, hoursDone: res.hoursDone || 0,
      quitFrac, quitLine: quitLineIn, perf: window.STA ? (q, pool) => STA.perfBonus(q, pool) : null
    };
    const draft = window.PAY ? PAY.settleJob(spec) : { pay: 0, bonus: 0, skillPay: 0, lines: [], quitLine: '' };
    let cut = 0, delayed = 0, unpaid = false, gross = draft.pay;
    if (draft.pay > 0 && o.cut) { cut = Math.min(draft.pay, o.cut); S.cutTotal = (S.cutTotal || 0) + cut; G.log(`中介抽走了 ¥${cut}。`); }
    const afterCut = Math.max(0, draft.pay - cut);
    if (afterCut > 0 && res.completed && !res.noPay) {
      const r = Math.random();
      if (r < (E.wageUnpaidP || 0)) { unpaid = true; G.log(`${j.name}的工钱 ¥${afterCut} 没拿到：中介说厂里没打款，电话再打就不接了。`, 'bad'); S.stats.mental = Math.max(Math.min(S.stats.mental, TH().mentalForce + 1), S.stats.mental - 8); S.unpaidTotal = (S.unpaidTotal || 0) + afterCut; }
      else if (r < (E.wageUnpaidP || 0) + (E.wageDelayP || 0)) { const wait = ri(1, 2); delayed = afterCut; S.owed = S.owed || []; S.owed.push({ amt: afterCut, day: G.dayNum() + wait, wait, job: j.name }); G.log(`${j.name}的工钱 ¥${afterCut} 说是“过${wait}天一起结”。`, 'warn'); G.change({ mental: -3 }); }
    }
    const finalPay = window.PAY ? PAY.settleJob(Object.assign({}, spec, { cut, unpaid, delayed: delayed > 0 })) : draft;
    pay = finalPay.pay; bonus = finalPay.bonus; skillPay = finalPay.skillPay; payLines = finalPay.lines;
    if (finalPay.quitLine) quitInfo = { line: finalPay.quitLine, full: wage, frac: quitFrac == null ? 0 : quitFrac };
    S.money += pay; S.earned += pay;
    if (pay > 0) G.noteWage(pay, 'job');
    let firstJob = false;
    if (res.completed) {
      S.jobsDone[j.id] = (S.jobsDone[j.id] || 0) + 1;
      firstJob = S.jobsDone[j.id] === 1;
      S.stats_total.worked++;

      if (j.debuff && !(j.debuff === 'chill' && G.warmed())) G.addDebuff(j.debuff);
    }
    // 技能经验：干得越好涨得越多（跑路/被开除也会涨一点）
    let xp = null;
    if (j.skill) { const amt = Math.max(1, Math.round((res.completed ? 4 : 1) + (res.quality || 0) * 8 + (res.xpBonus || 0))); xp = G.gainXp(j.skill, amt); }
    G.advance(40);
    S.loc = 'corner';
    if (firstJob) {
      G.addAlbum({ id: 'job_' + j.id, kind: 'job', title: '第一次干「' + j.name + '」', caption: '整班拿到 ¥' + pay + '。手还在抖。', amount: pay });
      G.addStamp('job_' + j.id, j.name.slice(0, 4), '第一次');
    }
    if (window.FOOT) FOOT.paidJob(S, j, pay);
    if (res.completed) {
      if (res.quality != null && res.quality >= 0.9) G.grantAch('earn_self');
      if (j.id === 'antigen' && S.stats.mental <= 40) G.grantAch('shadow_line');
      const spd = (ST.specialDays || []).find(x => x.days.includes(G.dayNum(S.time - total)));
      if (spd && spd.wageMult < 1) G.grantAch('student_wave');
      S.dayLedger = S.dayLedger || {}; S.dayLedger.wage = (S.dayLedger.wage || 0) + pay + delayed;
    }
    G.fireEvents('afterJob', { job: j.id, completed: !!res.completed });
    return { pay, lines: payLines, quitLine: quitInfo && quitInfo.line, quitFull: quitInfo && quitInfo.full, quitFrac: quitInfo && quitInfo.frac, frac, j, firstJob, bonus, skillPay, xp, quality: res.quality, cut, delayed, unpaid, gross, meals: eaten, hungerEnd: Math.round(S.stats.hunger) };
  };

  // ================= 吃穿住 =================
  G.buyFood = function (m, opts) {
    opts = opts || {};
    if (S.money < m.price) return { err: '钱不够。' };
    const before = { hunger: S.stats.hunger, mental: S.stats.mental, stamina: S.stats.stamina };
    S.money -= m.price;
    const delta = { hunger: m.hunger || 0, mental: m.mental || 0, stamina: m.stamina || 0 };
    G.change(delta);
    if (!opts.noTime) G.advance(Math.round((opts.minutes || 20) * G.slowMult()));
    G.log(`吃了${m.name}（-${m.price}元）`);
    if (!opts.forced && m.price > 0 && window.FOOT) FOOT.treat(S, { title: '自己请了一顿', caption: '吃了' + m.name + '，花了 ¥' + m.price + '。', amount: m.price });
    return { ok: true, meal: m, delta, before, money: m.price };
  };
  G.buyLeftover = function () {
    const L = C.leftover; if (S.money < L.price) return '钱不够。';
    S.money -= L.price; G.change({ hunger: L.hunger }); G.advance(10);
    if (Math.random() < L.sickChance) { G.change({ stamina: L.sickStamina, mental: -3 }); G.log(L.sickText, 'warn'); return L.sickText; }
    G.log(`买了${L.name}（-${L.price}元），味道还行。`); return null;
  };
  G.buyClothes = function (c, opts) {
    opts = opts || {};
    if (S.owned.includes(c.id)) {
      S.outfit = c.id; if (!opts.noTime) G.advance(5); G.log(`换上了${c.name}。`);
      return { ok: true, owned: true, cloth: c };
    }
    if (S.money < c.price) return { err: '钱不够。' };
    S.money -= c.price; S.owned.push(c.id); S.outfit = c.id; S.boughtDay = S.boughtDay || {}; S.boughtDay[c.id] = G.dayNum(); S.boughtDay = S.boughtDay || {}; S.boughtDay[c.id] = G.dayNum();
    const delta = {};
    if (c.mental) { G.change({ mental: c.mental }); delta.mental = c.mental; }
    if (c.cleanBonus) { S.stats.clean = Math.min(100, S.stats.clean + c.cleanBonus); delta.clean = c.cleanBonus; }
    if (!opts.noTime) G.advance(Math.round(15 * G.slowMult()));
    G.log(`买了${c.name}（-${c.price}元），穿上了。`);
    if (c.tier === 'expensive') G.addAlbum({ id: 'cloth_' + c.id, kind: 'cloth', title: '买下「' + c.name + '」', caption: '花了 ¥' + c.price + '。穿上，腰杆好像直了一点。', amount: c.price });
    return { ok: true, owned: false, cloth: c, delta };
  };
  G.laundry = function () { const L = C.laundry; if (S.money < L.price) return '钱不够。'; S.money -= L.price; S.stats.clean = L.clean; G.advance(L.minutes); G.log('把衣服洗了一遍，人也精神了点。'); return null; };
  // ================= v0.8.1 卖旧衣 / 旧货 =================
  G.sellQuote = function (id) {
    const c = C.clothes.find(x => x.id === id), K = C.broke.sell;
    if (!c || !S.owned.includes(id)) return { err: '你没有这件。' };
    if (S.outfit === id) return { err: '正穿在身上。先换上别的，才能卖这件。', worn: true };
    let price;
    if (c.tier === 'start' || !c.price) price = (K.startValue && K.startValue[id]) || 0;
    else {
      const days = Math.max(0, G.dayNum() - ((S.boughtDay || {})[id] || G.dayNum()));
      const cond = Math.max(K.minCondition, 1 - days * K.wearPerDay);
      price = Math.round(c.price * (K.rate[c.tier] || 0.3) * cond);
    }
    if (price < K.minPrice) return { err: '老板拎起来看了一眼：“这个不值钱，你自己留着穿吧。”', price: 0 };
    return { ok: true, price, cloth: c };
  };
  G.sellCloth = function (id) {
    const q = G.sellQuote(id); if (!q.ok) return q;
    S.owned = S.owned.filter(x => x !== id); S.money += q.price; S.soldTotal = (S.soldTotal || 0) + q.price;
    if (S.flags.tryOn === id) delete S.flags.tryOn;
    G.advance(C.broke.sell.minutes);
    G.log(`把${q.cloth.name}卖给了服装店，换回 ${q.price} 元。`, 'warn');
    if (!S.flags.firstSell) { S.flags.firstSell = G.dayNum(); G.addAlbum({ id: 'sell_' + id, kind: 'cloth', title: '卖掉「' + q.cloth.name + '」', caption: '换回 ¥' + q.price + '。老板往编织袋里一塞。', amount: q.price }); }
    return q;
  };
  G.sellItemQuote = function (name) { const it = C.broke.items[name]; if (!it || !(S.items[name] > 0)) return { err: '身上没有。' }; return { ok: true, price: it.price, it }; };
  G.sellItem = function (name) {
    const q = G.sellItemQuote(name); if (!q.ok) return q;
    S.items[name]--; S.money += q.price; S.soldTotal = (S.soldTotal || 0) + q.price; G.advance(5);
    G.log(`把${name}卖给了收旧货的，换回 ${q.price} 元。`, 'warn'); return q;
  };
  G.sellables = function () {
    const clothes = S.owned.map(id => ({ id, c: C.clothes.find(x => x.id === id), q: G.sellQuote(id) }));
    const items = Object.keys(S.items).filter(k => S.items[k] > 0 && C.broke.items[k]).map(k => ({ name: k, n: S.items[k], price: C.broke.items[k].price, note: C.broke.items[k].note }));
    return { clothes, items };
  };
  // ================= v0.8.1 手里没钱时的路 =================
  G.cheapestMeal = () => Math.min(...C.menu.map(m => m.price), C.leftover ? C.leftover.price : 99);
  G.isBroke = () => S.money < G.cheapestMeal() + (C.broke.hintExtra || 0);
  G.scrapOk = () => C.broke.scrap.where.includes(S.loc) && G.inHours(C.broke.scrap.hours[0], C.broke.scrap.hours[1]);
  G.oddjobOk = () => S.loc === C.broke.oddjob.where && G.isOpen(C.places.find(p => p.id === 'food')) && S.flags.oddjobDay !== G.dayNum();
  G.borrowOk = () => ['corner', 'food', 'bar', 'riverside'].includes(S.loc);
  G.scrap = function (mult) {
    const B = C.broke.scrap; let m = ri(B.money[0], B.money[1]); if (S.loc === 'bar' && G.hourF() >= 19) m += ri(0, B.barBonus); if (mult != null) m = Math.max(mult === 0 ? 0 : 1, Math.round(m * mult));
    G.advance(B.minutes); G.change({ stamina: B.stamina, mental: B.mental }); S.stats.clean = clamp(S.stats.clean + B.clean, 0, 100);
    S.money += m; S.earned += m; S.scrapTotal = (S.scrapTotal || 0) + m; if (m > 0) G.noteWage(m, 'scrap');
    G.log(`捡了两个钟头瓶子，卖了 ${m} 元。`, 'warn'); return { money: m, line: pick(B.lines) };
  };
  G.oddjobP = () => { const B = C.broke.oddjob; return clamp(B.baseP + (G.decency() - 40) / 200 - (G.hasRecord() ? B.recordP : 0), 0.1, 0.9); };
  G.oddjob = function () {
    const B = C.broke.oddjob; S.flags.oddjobDay = G.dayNum();
    const p = G.oddjobP();
    G.advance(15);
    if (Math.random() >= p) { G.log('想帮饭馆打杂换口饭，老板没要。'); return { ok: false, line: pick(B.no), p }; }
    G.advance(B.minutes - 15); G.change({ stamina: B.stamina, mental: B.mental, hunger: B.hunger }); S.stats.clean = clamp(S.stats.clean + B.clean, 0, 100);
    G.log('帮饭馆刷碗拖地，换了一大碗烩面。', 'good'); return { ok: true, line: B.yes, p };
  };
  // 借钱：好感越高越容易；欠着不还，好感每天往下掉
  G.lenders = function () {
    return G.npcList().filter(n => S.npc[n.key] && (S.npc[n.key].talk > 0 || S.loc === 'corner' || (n.where || []).includes(S.loc))).sort((a, b) => S.npc[b.key].aff - S.npc[a.key].aff).slice(0, 6)
      .map(n => ({ n, aff: Math.round(S.npc[n.key].aff), owe: (S.debts || []).find(d => d.npc === n.key && !d.paid), asked: (S.borrowAsk || {})[n.key] === G.dayNum(), p: G.borrowP(n.key) }));
  };
  G.borrowP = function (key) {
    const B = C.broke.borrow, a = S.npc[key].aff;
    if (a < B.minAff) return 0;
    const owing = (S.debts || []).some(d => !d.paid);
    return clamp(B.baseP + a / 100 * B.affP - (G.hasRecord() ? B.recordP : 0) - (owing ? B.owingP : 0), 0.03, 0.92);
  };
  G.borrow = function (key) {
    const B = C.broke.borrow, rel = S.npc[key], n = G.npcList().find(x => x.key === key);
    S.borrowAsk = S.borrowAsk || {}; if (S.borrowAsk[key] === G.dayNum()) return { err: '今天已经开过口了。' };
    S.borrowAsk[key] = G.dayNum(); G.advance(B.minutes);
    const p = G.borrowP(key);
    if (Math.random() >= p) { G.change({ mental: -3 }); G.log(`想找${n.name}借钱，没借到。`); return { ok: false, line: pick(B.refuse), p, n }; }
    const amt = Math.round((B.amount[0] + (B.amount[1] - B.amount[0]) * clamp((rel.aff - B.minAff) / (100 - B.minAff), 0, 1)) / 5) * 5;
    S.money += amt; S.debts = S.debts || []; S.debts.push({ npc: key, name: n.name, amt, day: G.dayNum(), due: G.dayNum() + B.dueDays, paid: false });
    G.log(`${n.name}借给你 ${amt} 元，说好 ${B.dueDays} 天内还。`, 'good');
    return { ok: true, amt, line: pick(B.yes), p, n };
  };
  G.repay = function (idx) {
    const d = (S.debts || [])[idx]; if (!d || d.paid) return { err: '没有这笔账。' };
    if (S.money < d.amt) return { err: '钱不够还。' };
    S.money -= d.amt; d.paid = true; const late = G.dayNum() > d.due;
    if (!late && S.npc[d.npc]) S.npc[d.npc].aff = clamp(S.npc[d.npc].aff + C.broke.borrow.paidAff, 0, 100);
    G.log(`还了${d.name} ${d.amt} 元${late ? '（晚了几天）' : ''}。`, 'good'); return { ok: true, d, late };
  };
  G.debtsTick = function (d) {
    (S.debts || []).forEach(x => { if (!x.paid && d > x.due && S.npc[x.npc]) { S.npc[x.npc].aff = clamp(S.npc[x.npc].aff + C.broke.borrow.lateAff, 0, 100); G.log(`欠${x.name}的 ${x.amt} 元过期没还，他见了你脸色不太好看（好感 ${C.broke.borrow.lateAff}）。`, 'bad'); } });
  };
  G.owedDebt = () => (S.debts || []).filter(d => !d.paid).reduce((a, d) => a + d.amt, 0);
  G.cleanDays = () => G.dayNum() - (S.lastTheftDay || 0);
  G.onStory = function (story) { if (S.stories.length >= 8) G.grantAch('heard_enough'); if (story === '韩叔的电影') G.grantAch('han_speech'); };
  G.bedValid = () => S.bed && S.bed.until > S.time;
  G.sleep = function (lodgeId, minutes) {
    const L = C.lodging.find(l => l.id === lodgeId);
    if (lodgeId === 'street' && G.season() && G.season().noStreet) return { err: G.season().noStreet.text };
    if (L && L.monthly) { if (!G.roomOwned()) return { err: '你没有租月租单间。' }; S.room.lastSlept = G.dayNum(); }
    if (lodgeId === 'shelter') { if (!G.shelterOk()) return { err: '这两天去过了，救助站要先照顾没来过的人。' }; S.flags.shelterDay = G.dayNum(); G.change({ hunger: L.hunger || 0 }); }
    let paid = 0;
    if (!(G.bedValid() && S.bed.id === lodgeId)) {
      if (S.money < L.price) return { err: '钱不够。' };
      S.money -= L.price; paid = L.price; S.bed = { id: lodgeId, until: S.time + 24 * 60 };
      if (L.where === 'inn') S.nightsAtInn = (S.nightsAtInn || 0) + 1;
    }
    if (L.fineIfBeer && S.beersTonight > 0 && S.flags.dormFined !== G.dayNum()) { S.flags.dormFined = G.dayNum(); const f = Math.min(S.money, L.fineIfBeer); S.money -= f; G.log(C.dormFineText + `（-${f} 元）`, 'bad'); G.queue.push({ title: '宿管来了', text: C.dormFineText }); }
    if (L.maxHours) minutes = Math.min(minutes, L.maxHours * 60);
    let chased = false;
    if (L.cold && minutes > 180 && Math.random() < (G.EC().streetChaseP || 0)) { chased = true; minutes = (G.EC().streetChaseHours || 3) * 60; }
    const before = { sta: S.stats.stamina, men: S.stats.mental };
    G.advance(minutes, 'sleep', L);
    let robbed = 0;
    if (Math.random() < L.stealRisk && S.money > 10) { robbed = Math.min(C.robbedMax || 999, Math.round(S.money * rnd(C.robbedRange[0], C.robbedRange[1]))); S.money -= robbed; }
    const cold = L.cold && !G.outfit().warm && !G.warmed();
    G.log(`在${L.name}睡了${Math.round(minutes / 6) / 10}小时${paid ? `（-${paid}元）` : ''}。`);
    if (robbed) G.log(`醒来发现裤兜里少了 ${robbed} 元。谁拿的？床位房里的人早走了一半。`, 'bad');
    if (cold) G.log(C.coldPenalty.text, 'warn');
    if (chased) { G.change({ mental: -5 }); G.log('半夜被保安用手电照醒：“起来起来，这儿不让睡！”你卷起被子，在路边坐到天亮。', 'bad'); }
    // 跨过凌晨 / 睡够 5 小时 → 触发“今天又撑过来了”日终明信片
    if (minutes >= 600 && G.debuff('sore')) G.grantAch('lie_two_days');
    const longEnough = minutes >= 300;
    if (longEnough && G.dayNum() >= 2) {
      S.dayPostcardPending = {
        day: G.dayNum(),
        earnedTodayHint: S.earned,
        money: S.money,
        sent: S.sent,
        stories: S.stories.length,
        worked: S.stats_total.worked
      };
    }
    return { paid, robbed, cold, chased, gain: { sta: Math.round(S.stats.stamina - before.sta), men: Math.round(S.stats.mental - before.men) }, postcard: !!S.dayPostcardPending };
  };
  G.beer = function () { const B = C.bar.beer; if (S.money < B.price) return '钱不够。'; S.money -= B.price; S.beersTonight++; G.change({ mental: S.beersTonight > 3 ? 1 : B.mental, stamina: B.stamina * (S.beersTonight > 3 ? 4 : 1), hunger: B.hunger }); G.advance(30); G.log(S.beersTonight > 3 ? '喝多了，头重脚轻。' : '一瓶冰啤酒下肚，心里松快了点。'); if (window.FOOT) FOOT.treat(S, { title: '自己坐下来喝了一瓶', caption: '烧烤摊上的啤酒，花了 ¥' + B.price + '。', amount: B.price }); return null; };
  G.addAlbum = function (e) {
    if (!S) return false;
    if (!S.album) S.album = [];
    const id = e.id;
    const unique = e.unique !== false;
    if (unique && S.album.find(x => x.id === id)) return false;
    S.album.push({
      id,
      kind: e.kind || 'moment',
      title: e.title,
      caption: e.caption || '',
      amount: e.amount == null ? null : e.amount,
      day: e.day != null ? e.day : G.dayNum(),
      clock: e.clock != null ? e.clock : G.clock()
    });
    return true;
  };
  G.addStamp = function (id, title, tip) {
    if (!S.stamps) S.stamps = [];
    if (S.stamps.find(x => x.id === id)) return false;
    S.stamps.push({ id, title, tip, day: G.dayNum(), clock: G.clock() });
    return true;
  };
  G.sendFee = () => (ST.bank && ST.bank.fee) || 0;
  G.sendMax = () => Math.max(0, S.money - G.sendFee());
  G.send = function (amt) {
    amt = Math.floor(Number(amt) || 0);
    const fee = G.sendFee();
    if (amt <= 0) return { err: '金额要大于 0。' };
    if (amt + fee > S.money) amt = S.money - fee;
    if (amt <= 0) return { err: `身上的钱不够付手续费（¥${fee}）。` };
    const before = S.sent, goal = (G.identity().goal.amount || 0);
    S.money -= amt + fee; S.sent += amt;
    G.advance(S.attrs.phone < 4 ? (ST.bank.minutesSlow || 30) : (ST.bank.minutesPhone || 10));
    if (window.CAST) { const practiced = CAST.practicePhone(S.attrs, S.flags, G.dayNum()); if (practiced.practiced) G.log(`转账按键熟了一点。手机熟练 ${practiced.phone}。`, 'good'); }
    if (G.identity().goal.type !== 'send') G.change({ mental: 3 });
    G.log(`给家里转了 ${amt} 元（手续费 ${fee} 元）。累计已寄回 ${S.sent} 元。`, 'good');
    const hitGoal = goal && before < goal && S.sent >= goal;
    const milestones = [500, 1000, 1500, 2000, 2500, 3000].filter(m => before < m && S.sent >= m);
    if (S.sent >= 3000 && S.idId === 'laozhou') G.grantAch('month_rent');
    if (hitGoal) {
      G.addStamp('send_goal', '月供寄到了', '¥' + S.sent);
      G.addAlbum({ id: 'send_goal', kind: 'send', title: '月供寄到了', caption: '累计寄回 ¥' + S.sent + '。儿子那边，这个月先顶住了。', amount: amt });
    } else if (milestones.length) {
      const m = milestones[milestones.length - 1];
      G.addStamp('send_' + m, '寄出 ¥' + m, '给家里');
      G.addAlbum({ id: 'send_' + m, kind: 'send', title: '寄出 ¥' + m, caption: '又迈过一个整数。给家里。', amount: amt });
    } else {
      G.addAlbum({ id: 'send_' + G.dayNum() + '_' + S.sent, kind: 'send', title: '寄回家 ¥' + amt, caption: '“到账了。”两个字跳出来的时候，鼻子有点酸。', amount: amt, unique: false });
    }
    return { amt, fee, before, after: S.sent, hitGoal, milestones, goal };
  };

  // ================= NPC 聊天 =================
  G.npcList = function () {
    const arr = C.npcs.filter(n => !n.locked || G.unlockedNow('npc', n)).map(n => ({ key: n.id, name: n.name, look: n.look, where: n.where, forgive: n.forgive, recordLine: n.recordLine, talks: n.talks, age: n.age, profile: n.profile, guarded: n.guarded }));
    C.identities.filter(i => i.id !== S.idId && i.npcTalks && i.npcTalks.length).forEach(i => S.npc['id_' + i.id] || (S.npc['id_' + i.id] = { aff: 30, talk: 0 }));
    C.identities.filter(i => i.id !== S.idId && i.npcTalks && i.npcTalks.length).forEach(i => arr.push({ key: 'id_' + i.id, name: i.name, look: i.look, where: C.identityNpcWhere[i.id] || [], forgive: 15, profile: i.profile, guarded: `${i.name}冲你点点头，没多说什么。`, recordLine: `${i.name}看了你一眼，没说话。`, talks: i.npcTalks.map(t => C.identityTalks[t]), age: i.age }));
    return arr;
  };
  G.pickNpc = function (where) {
    const all = G.npcList().filter(n => where === 'any' || n.where.includes(where));
    const fresh = all.filter(n => S.npc[n.key].talk < n.talks.length);
    // 见过一面的人更可能再坐到你旁边，聊得更深
    const met = fresh.filter(n => S.npc[n.key].talk > 0);
    if (met.length && Math.random() < 0.8) return pick(met);
    return (fresh.length ? pick(fresh) : pick(all)) || null;
  };
  G.storiesNeed = () => G.identity().goal.stories || 0;

  // ================= 偷窃 =================
  G.theftTargets = function () {
    return C.theft.targets.filter(t => t.where === S.loc && G.inHours(t.hours[0], t.hours[1]) && !(S.picked[t.id] === G.nightKey()) && (!t.needBed || (G.bedValid() && C.lodging.find(l => l.id === S.bed.id).canPick)));
  };
  G.nightKey = () => G.dayNum(S.time - 6 * 60);
  G.rollTarget = function (t) {
    const w = ri(t.witnesses[0], t.witnesses[1]);
    const tot = t.loot.reduce((a, b) => a + b.weight, 0); let r = Math.random() * tot, loot = t.loot[0];
    for (const l of t.loot) { if ((r -= l.weight) <= 0) { loot = l; break; } }
    const drunkBonus = S.beersTonight > 3 ? 0.15 : 0;
    const R = { t, witnesses: w, loot, alert: clamp(t.alert + drunkBonus, 0, 1), light: t.light };
    R.successP = G.theftSuccessP(R);
    return R;
  };
  // 估计得手概率（小游戏手感另算，这里给玩家看的“大约”）
  G.theftSuccessP = function (R) {
    let p = 0.72 - R.alert * 0.35 - R.light * 0.18 - R.witnesses * 0.07 + S.skills.pick * 0.06 + S.skills.eye * 0.02;
    if (S.beersTonight > 3) p -= 0.12;
    if (G.identity().age >= 50) p -= 0.04; // 手慢一点
    if (G.identity().age <= 25) p += 0.03;
    return clamp(p, 0.08, 0.92);
  };
  G.theftSuccess = function (R) {
    S.picked[R.t.id] = G.nightKey(); S.lastTheftDay = G.dayNum();
    let got;
    if (R.loot.money) { const m = ri(R.loot.money[0], R.loot.money[1]); S.money += m; got = `${m} 元`; S.stats_total.stolen += m; }
    else { G.change({ item: R.loot.item }); got = (R.loot.item === '烟' ? '一包' : R.loot.item === '手套' ? '一副' : '一个') + R.loot.item; }
    if (S.skills.pick < 5) S.skills.pick = Math.min(5, S.skills.pick + C.theft.skillGainOnSuccess);
    G.change({ mental: C.theft.guiltMental }); G.advance(15);
    G.log(`顺手牵羊得手：${got}。心跳得厉害。`, 'bad');
    return got;
  };
  G.theftCaught = function (R) {
    const K = C.theft.caught; S.picked[R.t.id] = G.nightKey(); S.lastTheftDay = G.dayNum(); S.stats_total.caught++;
    S.record.count++; S.record.log.push({ day: G.dayNum(), clock: G.clock(), where: CONFIG.places.find(p => p.id === S.loc).name, what: '盗窃（' + R.t.name + '）' });
    G.change({ stamina: K.beatenStamina, mental: K.mental, rep: K.rep });
    Object.values(S.npc).forEach(n => n.aff = clamp(n.aff + K.npcAffinity, 0, 100));
    let outcome;
    if (S.money >= K.fine) { S.money -= K.fine; G.advance(3 * 60); outcome = `罚款 ${K.fine} 元，在派出所折腾了三个小时。`; }
    else { G.advance(K.detainHours * 60, 'sleep', { recover: { stamina: 3, mental: -1 } }); outcome = `钱不够交罚款，被拘留了 ${K.detainHours} 小时，一天没了。`; S.flags.detained = (S.flags.detained || 0) + 1; }
    G.addDebuff('record'); S.loc = 'corner';
    G.log(`偷窃被抓。${outcome} 留下了案底。`, 'bad');
    return outcome;
  };

  // ================= 胜负 =================
  G.goalProgress = function () {
    const g = G.identity().goal;
    if (g.type === 'cleanLeave') { const cd = G.cleanDays(); return { done: S.money >= g.amount && cd >= g.cleanDays, text: `路费 ${S.money} / ${g.amount} 元 · 手干净 ${Math.min(cd, g.cleanDays)}/${g.cleanDays} 天`, pct: Math.min(1, S.money / g.amount) * (cd >= g.cleanDays ? 1 : 0.95) }; }
    if (g.type === 'settle') { const rd = S.roomDays || 0, pl = G.grownPlants(), tr = Math.max(0, ...Object.values(S.npc).map(r => r.aff)); const done = rd >= g.roomDays && S.money >= g.amount && pl >= g.plants && tr >= g.trust;
      return { done, text: `单间 ${Math.min(rd, g.roomDays)}/${g.roomDays} 天 · 存款 ${S.money}/${g.amount} · 花草 ${Math.min(pl, g.plants)}/${g.plants} 盆 · 最信得过的人 ${Math.round(tr)}/${g.trust}`, pct: (Math.min(1, rd / g.roomDays) + Math.min(1, S.money / g.amount) + Math.min(1, pl / g.plants) + Math.min(1, tr / g.trust)) / 4 }; }
    if (g.type === 'send') return { done: S.sent >= g.amount, text: `${g.debt ? '已还债' : '已寄回'} ${S.sent} / ${g.amount} 元`, pct: Math.min(1, S.sent / g.amount) };
    if (g.type === 'live') {
      const book = S.wageBook || 0;
      const next = (window.CAST ? CAST.MILESTONES : []).find(m => !(S.incomeMiles || {})[m.id]);
      return { done: book >= 3000, text: `累计挣到 ¥${book}` + (next ? ` · 下一档 ¥${next.at}` : ' · 还在往前'), pct: Math.min(1, book / 3000) };
    }
    const jt = Object.keys(S.jobsDone).length;
    const day = G.dayNum();
    const minD = g.minDays || 0;
    const storiesOk = S.stories.length >= g.stories;
    const jobsOk = jt >= g.jobTypes;
    const daysOk = day >= minD;
    const ok = storiesOk && jobsOk && daysOk;
    const parts = [
      `故事 ${S.stories.length}/${g.stories}`,
      `活 ${jt}/${g.jobTypes} 种`,
      minD ? `已待 ${day} 天（满 ${minD} 天）` : `第 ${day} 天`
    ];
    const pct = (Math.min(1, S.stories.length / g.stories) + Math.min(1, jt / g.jobTypes) + (minD ? Math.min(1, day / minD) : 1)) / 3;
    return { done: ok, text: parts.join(' · '), pct, partsOk: storiesOk && jobsOk, daysOk };
  };
  G.canLeave = function () {
    const g = G.identity().goal;
    const pr = G.goalProgress();
    if (!pr.done) return false;
    // 寄钱型：寄够即可走；体验型：满 minDays 且目标齐
    if (g.minDays && G.dayNum() < g.minDays) return false;
    if (g.minDays && G.hourF() < 12 && G.dayNum() === g.minDays) return false;
    return true;
  };
  G.checkEnd = function () {
    if (S.ended) return S.ended;
    const g = G.identity().goal;
    if (S.stats.mental <= 0) return G.end('lose_mental', false);
    if (ST.collapse.maxTimes > 0 && S.collapses >= ST.collapse.maxTimes) return G.end('lose_collapse', false);
    // 开放日历：寄够钱自动胜利；体验型需玩家主动离开，不因天数强制结算
    if (g.type === 'send' && S.sent >= g.amount) return G.end(g.endKey || (g.debt ? 'win_debt' : 'win_send'), true);
    if (g.type === 'settle' && G.goalProgress().done) return G.end(g.endKey || 'win_settle', true);
    return null;
  };
  G.end = function (key, win) { S.ended = { key, win, day: G.dayNum(), clock: G.clock() }; if (win) G.metaWin(S.idId, key); G.log('结局：' + C.endings[key].title, 'big'); G.save(); return S.ended; };
  G.shiftOutlook = function (job) {
    if (!job) return null;
    const hours = ((hm(job.end) - hm(job.start) + 1440) % 1440) / 60;
    const tired = (S.stats.stamina <= TH().staminaLow ? 1.15 : 1) * (S.stats.hunger <= 20 ? 1.2 : 1) * ((job.heavy || job.id === 'courier') ? (G.identity().heavyJobMult || 1) : 1) * (job.cost.stamina < 0 && G.debuff('loose') ? C.debuffs.loose.workSta : 1);
    const meals = (C.jobMeals && C.jobMeals[job.id]) || [];
    const mealHunger = meals.length ? meals[0].hunger : (job.meal ? 30 : 0);
    const o = STA.outlook({
      sta: S.stats.stamina, maxSta: S.maxSta, hunger: S.stats.hunger,
      staCost: job.cost.stamina || 0, tired, awakeHours: 80 / 60, workHours: hours,
      workHungerPerHour: ST.perHourWorkHunger, awakeStaPerHour: ST.perHourAwake.stamina,
      mealHunger, force: TH().staminaForce, noJob: TH().staminaNoJob, hungerForce: TH().hungerForce
    });
    o.hours = Math.round(hours * 10) / 10; o.now = Math.round(S.stats.stamina); o.hungerNow = Math.round(S.stats.hunger);
    const riskText = o.risk === 'faint' ? '干完很可能眼前一黑，被送到卫生室。可以先吃饭或歇一小时。' : o.risk === 'nowork' ? '干完之后体力会低到招工的人不要你，得先睡一觉。' : o.risk === 'hungry' ? '这班会把肚子掏空，收工得马上吃饭，饿着睡也补不回体力。' : '这班干完，按现在的身子还能站住。';
    o.html = `<div class="outlook"><b>这班身子</b><ul>
      <li>现在体力 <b>${o.now}</b> / ${S.maxSta}，饱腹 <b>${o.hungerNow}</b></li>
      <li>这班大约 ${o.hours} 小时，体力约 <b>${o.staHit}</b>（含现在的手软）${o.awakeHit ? `，来回路上再约 ${o.awakeHit}` : ''}</li>
      <li>预计剩下体力 <b>${o.remain}</b>，饱腹大约 <b>${o.hungerLeft}</b>${mealHunger ? '（含管的那顿饭）' : ''}</li>
      </ul><p class="${o.risk === 'ok' ? 'muted' : 'warn'}">${riskText} 晕倒只会进卫生室，不会因此结束游戏，存折里的钱还在。</p></div>`;
    return o;
  };
  G.resumeAfterCollapse = function () {
    if (!S || !S.ended || S.ended.key !== 'lose_collapse') return { err: 'no' };
    const money = S.money;
    const bank = S.life && S.life.bank;
    S.ended = null;
    S.stats.stamina = Math.max(S.stats.stamina, 42);
    S.stats.hunger = Math.max(S.stats.hunger, 36);
    S.stats.mental = Math.max(S.stats.mental, 24);
    S.flags.resumedCollapse = (S.flags.resumedCollapse || 0) + 1;
    G.log('在卫生室醒过来。口袋和存折都没再扣，接着过。', 'good');
    G.save();
    return { ok: true, money: S.money, bank: S.life && S.life.bank, sameMoney: S.money === money, sameBank: (S.life && S.life.bank) === bank };
  };
  G.collapseCheck = function () {
    if (S.ended) return null;
    const starve = (S.starveH || 0) >= TH().starveCollapseHours;
    if (S.stats.stamina > 0 && !starve) return null;
    const K = ST.collapse; S.collapses++; S.starveH = 0; S.flags.collapsedOnce = G.dayNum();
    const before = { sta: Math.round(S.stats.stamina), money: S.money, hunger: Math.round(S.stats.hunger), bank: S.life ? S.life.bank : null };
    const cost = window.STA ? STA.faintFee(S.money) : Math.min(S.money, K.cost); S.money -= cost;
    G.advance(K.hours * 60, 'sleep', { recover: { stamina: 6, mental: 1 } });
    S.stats.hunger = Math.max(S.stats.hunger, 36); S.loc = 'inn'; S.starveH = 0;
    S.stats.stamina = Math.max(S.stats.stamina, 42);
    S.stats.mental = Math.max(S.stats.mental, 12);
    const after = { sta: Math.round(S.stats.stamina), money: S.money, hunger: Math.round(S.stats.hunger), bank: S.life ? S.life.bank : null };
    G.log(`${starve ? '饿得太久' : '体力耗尽'}，晕倒了。卫生室费了 ${cost} 元，存折没动。（第${S.collapses}次）`, 'bad');
    return { cost, n: S.collapses, starve, cause: starve ? '连续挨饿' : '体力到 0', before, after, hours: K.hours };
  };

  // ================= v0.6：状态后果 =================
  function TH() { return ST.thresholds; }
  G.TH = TH;
  // 饿的时候睡觉也回不来体力
  G.hungerRegenMult = () => { const h = S.stats.hunger; return h <= 0 ? 0.2 : h <= 20 ? 0.5 : h <= TH().hungerLow ? 0.75 : 1; };
  // 行动变慢：走路、吃饭、买东西
  G.slowMult = () => { const sc = S.stats; let m = 1; if (sc.stamina <= TH().staminaLow) m += 0.5; if (sc.hunger <= 15) m += 0.3; return m; };
  // 不能去干活的原因
  G.jobBlock = (j) => {
    if (S.stats.stamina < TH().staminaNoJob) return `体力 ${Math.round(S.stats.stamina)}，站都站不稳（<${TH().staminaNoJob} 不能干活）`;
    if (S.stats.hunger < TH().hungerNoJob && !(j && j.light)) return `饱腹 ${Math.round(S.stats.hunger)}，饿得发昏（<${TH().hungerNoJob} 不能干活）`;
    return null;
  };
  // 顶栏警告：返回现在身上有哪些毛病
  G.conds = function () {
    const sc = S.stats, T = TH(), out = [];
    if (sc.stamina <= T.staminaForce + 8) out.push({ id: 'sta', icon: '😵', label: '快倒下了', lv: 'danger', tip: `体力 ${Math.round(sc.stamina)}：到 ${T.staminaForce} 会眼前一黑，强制睡过去；不能接活` });
    else if (sc.stamina <= T.staminaLow) out.push({ id: 'sta', icon: '🥱', label: '体力透支', lv: 'warn', tip: `体力 ${Math.round(sc.stamina)}：手抖、判定区变窄、录取率下降、走路变慢` });
    if (sc.hunger <= 0) out.push({ id: 'hun', icon: '🍚', label: `饿昏了 ${Math.floor(S.starveH || 0)}h`, lv: 'danger', tip: `已经饿了 ${Math.floor(S.starveH || 0)} 小时，到 ${T.starveCollapseHours} 小时会饿晕` });
    else if (sc.hunger <= T.hungerForce + 7) out.push({ id: 'hun', icon: '🍚', label: '饿得发慌', lv: 'danger', tip: `饱腹 ${Math.round(sc.hunger)}：到 ${T.hungerForce} 必须停下吃东西；体力几乎不恢复` });
    else if (sc.hunger <= T.hungerLow) out.push({ id: 'hun', icon: '🍚', label: '饿了', lv: 'warn', tip: `饱腹 ${Math.round(sc.hunger)}：睡觉体力恢复变少、手抖、录取率下降` });
    if (sc.mental <= T.mentalForce + 7) out.push({ id: 'men', icon: '💔', label: '心快碎了', lv: 'danger', tip: `精神 ${Math.round(sc.mental)}：到 ${T.mentalForce} 会蹲在路边缓不过来；到 0 就输了` });
    else if (sc.mental <= T.mentalLow) out.push({ id: 'men', icon: '😞', label: '心里乱', lv: 'warn', tip: `精神 ${Math.round(sc.mental)}：小游戏手抖、录取率下降` });
    if (sc.clean <= T.cleanLow) out.push({ id: 'cln', icon: '🧺', label: '身上有味儿', lv: 'warn', tip: `体面 ${G.decency()}：体面低，食品厂/药厂录取 -15%。去两元店洗衣服` });
    if (S.money < T.moneyLow) out.push({ id: 'mon', icon: '💸', label: '快没钱了', lv: S.money < 4 ? 'danger' : 'warn', tip: `只剩 ¥${S.money}：住不起床位，倒下只能睡街上` });
    return out;
  };
  // 小游戏手感：体力 / 饥饿 / 精神 让手发抖、判定区变窄；技能让判定区变宽
  G.perf = function (skillKey) {
    const sc = S.stats, T = TH(); let shake = 0.6, win = 1, speed = 1; const notes = [];
    if (sc.stamina <= T.staminaLow) { const k = (T.staminaLow - sc.stamina) / T.staminaLow; const w = 0.12 + k * 0.18; shake += 2 + k * 4; win *= 1 - w; speed *= 1 + 0.08 + k * 0.12; notes.push({ t: `体力 ${Math.round(sc.stamina)}：手发抖，判定区 -${Math.round(w * 100)}%`, bad: 1 }); }
    if (sc.hunger <= T.hungerLow) { const k = (T.hungerLow - sc.hunger) / T.hungerLow; const w = 0.08 + k * 0.14; shake += 1 + k * 3; win *= 1 - w; notes.push({ t: `饱腹 ${Math.round(sc.hunger)}：饿得手软，判定区 -${Math.round(w * 100)}%`, bad: 1 }); }
    if (sc.mental <= T.mentalLow) { shake += 2; win *= 0.9; notes.push({ t: `精神 ${Math.round(sc.mental)}：心不在焉，判定区 -10%`, bad: 1 }); }
    let lv = 0;
    if (skillKey) {
      lv = S.skills[skillKey] || 0;
      win *= 1 + lv * 0.12; shake = Math.max(0.3, shake - lv * 0.5); speed *= 1 - lv * 0.03;
      notes.push({ t: `${C.skillNames[skillKey]} Lv${lv}：${lv ? `判定区 +${lv * 12}%${lv >= 3 ? `，熟手补贴 +¥${(lv - 2) * 5}` : ''}` : '生手，判定区没有加成'}`, good: lv > 0 ? 1 : 0 });
    }
    return { shake, win: clamp(win, 0.45, 1.8), speed, notes, lv, skill: skillKey };
  };
  G.xpNeed = lv => C.skillXp.xpBase + lv * C.skillXp.xpStep;
  G.gainXp = function (key, amt) {
    if (!S.xp) S.xp = {}; S.xp[key] = (S.xp[key] || 0) + amt;
    const before = S.skills[key] || 0; let lv = before;
    while (lv < C.skillXp.max && S.xp[key] >= G.xpNeed(lv)) { S.xp[key] -= G.xpNeed(lv); lv++; }
    if (lv >= C.skillXp.max) S.xp[key] = 0;
    S.skills[key] = lv;
    const up = lv > before;
    if (up) { S.lvlups.push({ key, lv }); G.log(`${C.skillNames[key]}升到了 Lv${lv}！`, 'good'); }
    return { key, amt, lv, up, cur: S.xp[key], need: lv >= C.skillXp.max ? 0 : G.xpNeed(lv) };
  };
  // 强制事件：体力≤10 倒下睡、饿到≤8 停下、精神≤8 蹲着缓
  G.forcedCheck = function () {
    if (!S || S.ended) return null;
    const sc = S.stats, T = TH();
    if (sc.stamina <= T.staminaForce) return 'sleep';
    if (sc.hunger <= T.hungerForce) return 'hunger';
    if (sc.mental <= T.mentalForce && sc.mental > 0) return 'mental';
    return null;
  };
  G.forceSleep = function () {
    const T = TH(); let L, where, paid = 0;
    if (G.bedValid()) { L = C.lodging.find(l => l.id === S.bed.id); where = 'bed'; }
    else if (S.money >= C.lodging.find(l => l.id === 'upper').price + 0 && S.money >= T.moneyLow) { L = C.lodging.find(l => l.id === 'upper'); paid = L.price; S.money -= paid; S.bed = { id: L.id, until: S.time + 24 * 60 }; where = 'inn'; }
    else { L = C.lodging.find(l => l.id === 'street'); where = 'street'; }
    S.loc = L.where;
    const before = { sta: S.stats.stamina, men: S.stats.mental, t: S.time };
    const minutes = where === 'street' ? 7 * 60 : 9 * 60;
    G.advance(minutes, 'sleep', L);
    const ns = where === 'street' && G.season() && G.season().noStreet; let frozen = false;
    if (ns) { G.change(ns.effects); G.log(ns.forcedText, 'bad'); frozen = Math.random() < ns.collapseP; S.winterStreet = (S.winterStreet || 0) + 1; }
    let robbed = 0, lostItem = null;
    const risk = where === 'street' ? 0.5 : (L.stealRisk || 0) + 0.1;
    if (Math.random() < risk && S.money > 5) { robbed = Math.min(C.robbedMax || 999, Math.max(3, Math.round(S.money * rnd(0.15, 0.35)))); S.money -= robbed; }
    const items = Object.keys(S.items).filter(k => S.items[k] > 0);
    if (items.length && Math.random() < (where === 'street' ? 0.5 : 0.2)) { lostItem = pick(items); S.items[lostItem]--; }
    S.forced.sleep++; S.flags.collapsedOnce = S.flags.collapsedOnce || G.dayNum();
    // 身体总会缓回来一点，免得刚醒又倒
    S.stats.stamina = Math.max(S.stats.stamina, TH().staminaForce + (where === 'street' ? 26 : 22));
    const cold = L.cold && !G.outfit().warm && !G.warmed();
    G.log(`体力撑不住，${where === 'street' ? '倒在自助厅门口睡了过去' : '一头栽在' + L.name + '上睡死了'}，睡了 ${Math.round(minutes / 60)} 小时。${robbed ? `醒来少了 ${robbed} 元。` : ''}${lostItem ? `丢了${lostItem}。` : ''}`, 'bad');
    if (frozen) S.stats.stamina = Math.max(S.stats.stamina, TH().staminaForce + 12);
    return { where, L, paid, robbed, lostItem, cold, frozen, winterText: ns ? ns.forcedText : '', hours: Math.round(minutes / 60), gain: { sta: Math.round(S.stats.stamina - before.sta), men: Math.round(S.stats.mental - before.men) } };
  };
  // 饿到不行：有钱就被迫去吃最便宜的一口，没钱就蹲着
  G.forceHungerOptions = function () {
    const P = C.places.find(p => p.id === 'food'); const open = G.inHours(P.open, '23:59');
    const avail = open ? C.menu.filter(m => G.inHours(m.from, m.to === '24:00' ? '23:59' : m.to) && m.price <= S.money).sort((a, b) => (b.hunger / b.price) - (a.hunger / a.price)) : [];
    return { open, avail };
  };
  G.forceEat = function (m) {
    S.loc = 'food';
    const r = G.buyFood(m, { minutes: 40, forced: true });
    S.forced.hunger++;
    if (r && r.ok) G.log(`饿得手直哆嗦，被迫停下来吃了${m.name}（-${m.price}元）。`, 'warn');
    return m;
  };
  G.forceRest = function () {
    G.advance(120); S.forced.hunger++;
    let gift = null;
    // 兜里没钱的时候，路口总有人搭把手（不会饿死在街上）
    const broke = S.money < 15;
    if (Math.random() < (broke ? 0.85 : 0.4)) { gift = pick(broke ? ['一盒剩饭（大姐没要钱）', '两个包子和一碗热水', '半个馒头和一根咸菜'] : ['半个馒头', '一个凉了的烧饼', '两个包子']); G.change({ hunger: broke ? 38 : 25, mental: 2 }); }
    else G.change({ mental: -3 });
    G.log(gift ? `饿得蹲在路边，有个工友递来${gift}。` : '饿得蹲在路边，一直熬着。', 'warn');
    return gift;
  };
  G.forceMental = function () { G.advance(120); G.change({ mental: 12, stamina: -2 }); S.forced.mental++; G.log('蹲在台阶上，给家里打了个电话，说着说着就哽住了。', 'warn'); };

  // ================= v0.8 解锁 / 成就 / 新地点 =================
  const META = 'jxq_meta_v1';
  G.meta = () => { try { return JSON.parse(localStorage.getItem(META) || '{}'); } catch (e) { return {}; } };
  G.metaWin = (id, key) => { const m = G.meta(); m.wins = m.wins || []; m.wins.push({ id, key, t: Date.now(), rec: !!(S && G.hasRecord && G.hasRecord()), stories: S ? S.stories.slice() : [] }); try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) { } G.applyMeta(); };
  G.applyMeta = () => { const m = G.meta(); const W = m.wins || []; const won = W.length > 0;
    C.identities.forEach(i => {
      if (i.unlockAfterWin) i.playable = won;
      if (i.unlockMeta === 'record') i.playable = W.some(w => w.rec);                      // 老K：带着案底离开过一次
      if (i.unlockMeta === 'xiaozhou_li') i.playable = W.some(w => w.id === 'xiaozhou' && (w.stories || []).includes('李大姐的劝')); // 阿珍
    }); };
  const TIER = { start: 0, cheap: 1, mid: 2, expensive: 3 };
  G.unlockOk = function (u) {
    if (!u) return true;
    if (u.minDay != null && G.dayNum() < u.minDay) return false;
    if (u.flag && !S.flags[u.flag]) return false;
    if (u.jobDone && !S.jobsDone[u.jobDone]) return false;
    if (u.affinity) for (const k in u.affinity) if (!S.npc[k] || S.npc[k].aff < u.affinity[k]) return false;
    if (u.outfitTierAtLeast) { const need = TIER[u.outfitTierAtLeast]; if (!S.owned.some(id => { const c = C.clothes.find(x => x.id === id); return c && TIER[c.tier] >= need; })) return false; }
    if (u.skills) for (const k in u.skills) if ((S.skills[k] || 0) < u.skills[k]) return false;
    if (u.nightsAtInn != null && (S.nightsAtInn || 0) < u.nightsAtInn) return false;
    if (u.anyOf && !u.anyOf.some(G.unlockOk)) return false;
    return true;
  };
  // 一旦解锁就一直开着；第一次解锁时弹个提示
  G.unlockedNow = function (kind, o) {
    if (!o.locked) return true;
    S.unlocked = S.unlocked || {};
    const key = kind + ':' + o.id;
    if (S.unlocked[key]) return true;
    if (!G.unlockOk(o.unlock)) return false;
    S.unlocked[key] = G.dayNum();
    if (S.unlockInit) { const t = (C.unlockText[kind] || '{name}').replace('{name}', o.name); G.log(t, 'good'); G.queue.push({ title: '解锁', text: t + (kind === 'job' ? `（${o.window === 'morning' ? '早高峰' : '晚高峰'}在路口招人）` : '') }); }
    return true;
  };
  G.isUnlocked = (kind, o) => !o.locked || !!(S && S.unlocked && S.unlocked[kind + ':' + o.id]);
  G.jobOpen = j => G.unlockedNow('job', j);
  G.placeOpen = P => G.unlockedNow('place', P);
  G.checkUnlocks = function () {
    if (!S) return;
    C.jobs.forEach(G.jobOpen); C.places.forEach(G.placeOpen); C.npcs.forEach(n => G.unlockedNow('npc', n));
    S.unlockInit = true;
  };
  G.grantAch = function (id) {
    if (!S || !C.achievements) return false;
    const a = C.achievements.find(x => x.id === id); if (!a) return false;
    S.ach = S.ach || {}; if (S.ach[id]) return false;
    S.ach[id] = { day: G.dayNum(), clock: G.clock() };
    G.addStamp('ach_' + id, a.name, '印章');
    G.addAlbum({ id: 'ach_' + id, kind: 'seal', title: '印章「' + a.name + '」', caption: a.desc });
    const t = C.unlockText.achievement.replace('{name}', '「' + a.name + '」');
    G.log(t, 'good'); G.queue.push({ title: '盖了一枚印章', text: `<span class="seal-inline">${a.name}</span> ${a.desc}` });
    return true;
  };
  // 每天的账：花了多少、挣了多少（给「五十块是一天」用）
  G.closeLedger = function (d) {
    const L = S.dayLedger;
    if (L && L.day === d - 1) {
      const spent = (L.money0 + (S.earned - L.earned0)) - S.money - (S.sent - L.sent0);
      if (L.wage > 0 && spent <= 50) G.grantAch('fifty_a_day');
      const got = S.earned - L.earned0; S.dayEarn = S.dayEarn || []; S.dayEarn[d - 2] = got;
      if (!S.bestDay || got > S.bestDay.amt) S.bestDay = { day: d - 1, amt: got };
      G.log(`昨天一天：挣了 ¥${got}，花掉 ¥${Math.max(0, spent)}${S.sent - L.sent0 > 0 ? `，转回家 ¥${S.sent - L.sent0}` : ''}。`, got > 0 ? 'good' : '');
    }
    S.dayLedger = { day: d, money0: S.money, earned0: S.earned, sent0: S.sent, wage: 0 };
  };
  G.certsTick = function (d) {
    S.certs = S.certs || {};
    Object.keys(S.certs).forEach(k => { const c = S.certs[k]; if (!c.done && c.ready <= d) { c.done = true; const sv = C.agencyServices.find(x => x.id === k); S.flags[sv.flag] = d; G.log(sv.doneText, 'good'); G.queue.push({ title: '证办下来了', text: sv.doneText }); } });
  };
  G.agencyBuy = function (id) {
    const sv = C.agencyServices.find(x => x.id === id); S.certs = S.certs || {};
    if (S.certs[id]) return { err: '已经办过了。' };
    if (sv.needCleanRecord && G.hasRecord()) return { err: '“有底子的办不了，别为难我。”' };
    if (S.money < sv.price) return { err: '钱不够。' };
    S.money -= sv.price; S.certs[id] = { ready: G.dayNum() + sv.days, done: false }; G.advance(20); G.log(`花 ¥${sv.price} 托中介${sv.name}，${sv.days} 天后拿。`);
    return { ok: true, sv };
  };
  G.agencyBoard = function () { G.advance(15); G.change({ mental: -1 }); const t = pick(C.agencyBoard); G.log('看了会儿白板。'); return t; };
  G.netGame = function () { const g = C.netcafe.game; if (S.money < g.price) return { err: '钱不够。' }; S.money -= g.price; G.advance(g.minutes); G.change({ mental: g.mental, stamina: g.stamina, hunger: g.hunger }); G.log(g.text); return { ok: true, g }; };
  // v0.9.1 刮刮乐：四种原创票面，奖金先按概率定，票面再照着摆
  G.scratch = function (tid) {
    const L = C.lotteryShop; S.lottery = S.lottery || { spent: 0, won: 0, day: 0, n: 0 };
    const T = (C.scratchTickets || []).find(t => t.id === tid) || (C.scratchTickets || [])[0];
    if (S.lottery.day !== G.dayNum()) { S.lottery.day = G.dayNum(); S.lottery.n = 0; }
    if (S.lottery.n >= L.maxPerDay) return { err: '老板把刮刮乐收了：“今天别刮了，回去睡吧。”' };
    if (S.money < T.price) return { err: '钱不够。' };
    S.money -= T.price; S.lottery.spent += T.price; S.lottery.n++;
    const prize = window.FX ? FX.drawPrize(T) : 0; const layout = window.FX ? FX.layoutTicket(T, prize) : null;
    S.money += prize; S.lottery.won += prize;
    const F = C.scratchFx || {}; let mental = 0, line;
    const big = prize >= T.price * 5;
    if (prize > 0) { S.lottery.lose = 0; mental = big ? F.bigMental : prize > T.price ? F.winMental : 1; line = pick(big ? F.winBig : F.winSmall); }
    else { S.lottery.lose = (S.lottery.lose || 0) + 1; line = pick(F.lose); if (S.lottery.lose >= (F.streakAt || 3)) { mental = F.streakMental || -3; line += ' ' + F.streak; } }
    // 习惯：连着几天都来刮
    const d = G.dayNum(); if (S.lottery.lastDay !== d) { S.lottery.streakDays = S.lottery.lastDay === d - 1 ? (S.lottery.streakDays || 1) + 1 : 1; S.lottery.lastDay = d; if (S.lottery.streakDays === 3) { G.log(F.habit, 'warn'); line += ' ' + F.habit; } }
    if (mental) G.change({ mental }); G.advance(5);
    G.log(`刮了一张「${T.name}」（¥${T.price}）：${prize ? '中了 ¥' + prize : '没中'}。`, prize >= 50 ? 'good' : '');
    if (prize >= 50 || big) G.addAlbum({ id: 'scratch_' + d + '_' + S.lottery.n, kind: 'moment', title: `刮中 ¥${prize}`, caption: `「${T.name}」¥${T.price} 一张，第 ${d} 天。${line}` });
    S.lottery.best = Math.max(S.lottery.best || 0, prize);
    if (S.lottery.spent - S.lottery.won >= 200) G.grantAch('scratch_hole');
    return { ok: true, t: T, prize, layout, line, mental, net: S.lottery.won - S.lottery.spent, n: S.lottery.n, max: L.maxPerDay, canMore: S.lottery.n < L.maxPerDay && S.money >= T.price };
  };
  // v0.9.1 目标提醒：每 3 天早上一张小卡，第 7/14/21/28 天一张回顾
  G.goalCardTick = function () {
    const R = C.goalReminder; if (!R || S.ended) return null; const d = G.dayNum(), h = G.hour();
    if (d < 2 || h < 4 || h >= 12 || S.goalCardDay === d) return null;
    const big = R.recapDays.includes(d), small = (d - 1) % R.every === 0;
    if (!big && !small) return null;
    S.goalCardDay = d; const pr = G.goalProgress();
    G.log(`${big ? '回顾' : '想了想目标'}：${pr.text}`, 'event');
    if (big) G.addAlbum({ id: 'recap_' + d, kind: 'milestone', title: `第 ${d} 天回顾`, caption: pr.text });
    G.queue.push({ kind: 'goal', big, title: big ? R.bigTitle.replace('{d}', d) : R.smallTitle });
    return big ? 'big' : 'small';
  };
  G.clinic = function (id) {
    const sv = C.clinicServices.find(x => x.id === id); if (S.money < sv.price) return { err: '钱不够。' };
    S.money -= sv.price; G.advance(sv.minutes); G.change({ stamina: sv.stamina, mental: sv.mental, hunger: sv.hunger });
    if (sv.clearDebuff) S.debuffs = S.debuffs.filter(d => !sv.clearDebuff.includes(d.id));
    G.log(`${sv.name}（-${sv.price}元）。${sv.text}`); return { ok: true, sv };
  };
  G.applyMeta();

  G.util = { hm, rnd, ri, pick, clamp };
})();
