// 自己的角色、成人社交、累计工钱档。纯数据，存档迁移不编造没记下的收入。
(function () {
  const BACKGROUNDS = [
    { id: 'kitchen', name: '灶上干过', blurb: '刀和火候你摸过。', outfit: 'old', money: 280, maxStamina: 100, stats: { stamina: 86, mental: 72, hunger: 74, clean: 58 }, attrs: { brain: 5, exp: 6, phone: 5 }, skills: { hands: 1, knife: 2, eye: 1, pick: 0 } },
    { id: 'errand', name: '跑过腿', blurb: '腿脚快，认路。', outfit: 'old', money: 260, maxStamina: 100, stats: { stamina: 92, mental: 70, hunger: 68, clean: 60 }, attrs: { brain: 5, exp: 5, phone: 6 }, skills: { hands: 2, knife: 0, eye: 1, pick: 0 } },
    { id: 'books', name: '读过些书', blurb: '字和手机都还行，手上的茧少一点。', outfit: 'student', money: 360, maxStamina: 100, stats: { stamina: 82, mental: 76, hunger: 70, clean: 72 }, attrs: { brain: 8, exp: 3, phone: 8 }, skills: { hands: 0, knife: 0, eye: 2, pick: 0 } },
    { id: 'bit', name: '什么都沾过一点', blurb: '没有特别擅长的，也没有空白。', outfit: 'old', money: 300, maxStamina: 100, stats: { stamina: 88, mental: 72, hunger: 70, clean: 64 }, attrs: { brain: 6, exp: 5, phone: 6 }, skills: { hands: 1, knife: 1, eye: 1, pick: 0 } },
    { id: 'fresh', name: '刚进城', blurb: '口袋薄，人还精神。', outfit: 'old', money: 180, maxStamina: 100, stats: { stamina: 90, mental: 74, hunger: 70, clean: 66 }, attrs: { brain: 5, exp: 2, phone: 5 }, skills: { hands: 0, knife: 0, eye: 1, pick: 0 } }
  ];
  const LOOKS = {
    x: [
      { id: 'short', label: '短发', look: { skin: '#d8a983', hair: 'short', hairColor: '#1e1a18', shirt: '#3d4a3e' } },
      { id: 'long', label: '长发', look: { skin: '#f1c9a5', hair: 'long', hairColor: '#2a1f1c', shirt: '#4f7fa8' } },
      { id: 'cap', label: '帽子', look: { skin: '#c99a74', hair: 'cap', hairColor: '#222', shirt: '#2a2a2e' } }
    ],
    m: [
      { id: 'short', label: '短发', look: { skin: '#d8a983', hair: 'short', hairColor: '#1e1a18', shirt: '#3d4a3e' } },
      { id: 'grey', label: '灰发', look: { skin: '#c9926a', hair: 'grey', hairColor: '#8d8a86', shirt: '#6b5a45' } },
      { id: 'cap', label: '帽子', look: { skin: '#c99a74', hair: 'cap', hairColor: '#222', shirt: '#2a2a2e' } }
    ],
    f: [
      { id: 'crop', label: '短发', look: { skin: '#f0c8a8', hair: 'short', hairColor: '#2a1f1c', shirt: '#b5545c' } },
      { id: 'long', label: '长发', look: { skin: '#f1c9a5', hair: 'long', hairColor: '#2a1f1c', shirt: '#4f7fa8' } },
      { id: 'tied', label: '束发', look: { skin: '#e0b48f', hair: 'long', hairColor: '#3a2a22', shirt: '#6b5a45' } }
    ]
  };
  const PEOPLE = [
    { id: 'hejie', name: '何姐', age: 34, gender: 'f', place: 'food', job: '饭馆后厨', home: '桥南平房', look: { skin: '#e0b48f', hair: 'long', hairColor: '#3a2a22', shirt: '#b5545c', age: 34 }, teach: { skill: 'knife', xp: 12, text: '何姐让你看她怎么片肉。刀工经验 +12。' } },
    { id: 'acheng', name: '阿成', age: 28, gender: 'm', place: 'corner', job: '跑腿', home: '网吧楼上', look: { skin: '#d8a983', hair: 'short', hairColor: '#1e1a18', shirt: '#3d4a3e', age: 28 }, teach: { skill: 'hands', xp: 12, text: '阿成把近路告诉你。手脚麻利经验 +12。' } },
    { id: 'laowu', name: '老吴', age: 46, gender: 'm', place: 'riverside', job: '看摊', home: '河边平房', look: { skin: '#c9926a', hair: 'grey', hairColor: '#8d8a86', shirt: '#6b5a45', age: 46, wrinkles: true }, teach: { skill: 'eye', xp: 12, text: '老吴教你看人的脸色。察言观色经验 +12。' } },
    { id: 'linwan', name: '林晚', age: 31, gender: 'f', place: 'netcafe', job: '网管', home: '通宵网吧值班室', look: { skin: '#f0c8a8', hair: 'short', hairColor: '#2a1f1c', shirt: '#4f7fa8', age: 31 }, teach: { phone: 1, text: '林晚把转账那几步点给你看。手机熟练 +1。' } }
  ];
  const MILESTONES = [
    { id: 'm1000', at: 1000, mental: 8, money: 0, text: '手里的工开始能攒下一点了。', reward: '精神 +8' },
    { id: 'm2000', at: 2000, mental: 6, money: 0, xp: { hands: 10 }, text: '路熟了，手脚也跟着稳一点。', reward: '手脚麻利经验 +10，精神 +6' },
    { id: 'm3000', at: 3000, mental: 8, money: 40, text: '三千是你自己挣来的。想走可以走，想留就留。茶钱不算进累计。', reward: '茶钱 ¥40（不算进累计），精神 +8' },
    { id: 'm4500', at: 4500, mental: 6, money: 0, text: '还在往前。没有截止日期。', reward: '精神 +6' }
  ];
  const SKIP = { deposit: 1, withdraw: 1, loan: 1, reward: 1, interest: 1 };
  function ageOk(age) {
    if (typeof age !== 'number' || !Number.isInteger(age)) return '年龄填一个整数。';
    if (age < 18 || age > 70) return '这版只从 18 岁写到 70 岁。';
    return '';
  }
  function build(raw) {
    raw = raw || {};
    const ageErr = ageOk(raw.age);
    if (ageErr) return { error: ageErr };
    const bg = BACKGROUNDS.find(b => b.id === raw.bg) || BACKGROUNDS.find(b => b.id === 'bit');
    const gender = raw.gender === 'f' || raw.gender === 'm' ? raw.gender : 'x';
    const pref = ['m', 'f', 'any', 'none'].includes(raw.pref) ? raw.pref : 'none';
    let name = String(raw.name || '').trim();
    if (!name) name = '你';
    if (name.length > 6 || /[<>]/.test(name) || name.indexOf('马驹桥') >= 0) return { error: '名字用六个字以内的虚构称呼。' };
    const pack = LOOKS[gender] || LOOKS.x;
    const pick = pack[Math.abs(Number(raw.look) || 0) % pack.length];
    const look = Object.assign({ age: raw.age }, pick.look);
    if (raw.age >= 50) look.wrinkles = true;
    const stats = Object.assign({}, bg.stats);
    let maxStamina = bg.maxStamina;
    if (raw.age >= 60) { maxStamina = Math.min(maxStamina, 92); stats.stamina = Math.min(stats.stamina, 82); }
    else if (raw.age >= 50) maxStamina = Math.min(maxStamina, 96);
    stats.stamina = Math.min(stats.stamina, maxStamina);
    const identity = {
      id: 'self', name, age: raw.age, gender, pref, female: gender === 'f',
      tag: bg.name, bg: bg.id,
      look, outfit: bg.outfit, startMoney: bg.money, maxStamina,
      stats, attrs: Object.assign({}, bg.attrs), skills: Object.assign({}, bg.skills),
      goal: { type: 'live', marks: [1000, 2000, 3000] },
      goalText: '靠自己挣到的钱，先后攒到 1000、2000、3000。花掉不算倒退。攒到三千，想走可以走，不想走就接着过。',
      goalBullets: ['累计的是工钱和卖东西的钱，不是口袋里还剩多少', '存钱、取钱、借钱不算新收入', '每一档有一次实在的回报，没有截止日期'],
      npcTalks: []
    };
    return { identity, pref };
  }
  function blankRel() { return { friend: 0, affection: 0, bond: 'none', taught: false }; }
  function relOf(save, id) {
    save.social = save.social || { people: {} };
    save.social.people = save.social.people || {};
    if (!save.social.people[id]) save.social.people[id] = blankRel();
    return save.social.people[id];
  }
  function person(id) { return PEOPLE.find(p => p.id === id) || null; }
  function takenId(save) {
    const p = save.life && save.life.partner;
    if (p && (p.state === 'dating' || p.state === 'married')) return p.fromCast || '__old__';
    const people = (save.social && save.social.people) || {};
    return Object.keys(people).find(id => people[id].bond === 'dating' || people[id].bond === 'married') || null;
  }
  function chat(save, id) {
    const npc = person(id); if (!npc) return { error: 'who' };
    const r = relOf(save, id);
    r.friend = Math.min(100, r.friend + 4);
    let teach = null;
    if (!r.taught && r.friend >= 30 && npc.teach) { r.taught = true; teach = npc.teach; }
    return { ok: true, friend: r.friend, affection: r.affection, teach, minutes: 20, mental: 2 };
  }
  function court(save, id, playerAge) {
    const npc = person(id); if (!npc) return { error: 'who' };
    if ((playerAge || 0) < 18 || npc.age < 18) return { error: 'minor' };
    const pref = (save.social && save.social.pref) || 'none';
    if (pref === 'none' || (pref !== 'any' && pref !== npc.gender)) return { error: 'pref' };
    const r = relOf(save, id);
    if (r.bond === 'none') r.bond = 'interested';
    r.affection = Math.min(100, r.affection + 6);
    r.friend = Math.min(100, r.friend + 2);
    return { ok: true, bond: r.bond, affection: r.affection, friend: r.friend };
  }
  function commit(save, id) {
    const npc = person(id); if (!npc) return { error: 'who' };
    const held = takenId(save);
    if (held && held !== id) return { error: 'taken' };
    const r = relOf(save, id);
    if (r.bond !== 'interested' && r.bond !== 'dating') return { error: 'bond' };
    if (r.affection < 50) return { error: 'aff' };
    r.bond = 'dating';
    return { ok: true, partner: { fromCast: id, name: npc.name, kind: npc.gender === 'f' ? 'female' : 'male', age: npc.age, look: npc.look, job: npc.job, home: npc.home, aff: r.affection, state: 'dating', talks: 0, dates: 1, today: { day: 0, n: 0 }, gifts: {} } };
  }
  function note(state, amt, source) {
    state.wageBook = Math.max(0, Math.round(Number(state.wageBook) || 0));
    amt = Math.round(Number(amt) || 0);
    if (amt <= 0 || SKIP[source]) return state.wageBook;
    state.wageBook += amt;
    return state.wageBook;
  }
  function claim(state) {
    state.incomeMiles = state.incomeMiles || {};
    const got = [];
    MILESTONES.forEach(m => {
      if ((state.wageBook || 0) >= m.at && !state.incomeMiles[m.id]) {
        state.incomeMiles[m.id] = 1;
        got.push(m);
      }
    });
    return got;
  }
  function migrateSave(S) {
    if (!S) return S;
    if (!S.social) S.social = { pref: (S.custom && S.custom.pref) || 'none', people: {} };
    if (!S.social.people) S.social.people = {};
    if (S.wageBook == null) {
      S.wageBook = Math.max(0, Math.round(Number(S.earned) || 0));
      S.wageFromEarned = true;
    }
    if (!S.incomeMiles) S.incomeMiles = {};
    if (S.idId === 'self' && !S.custom) {
      const built = build({ gender: 'x', age: 30, bg: 'bit', name: '你', pref: 'none', look: 0 });
      S.custom = built.identity;
    }
    return S;
  }
  function bondWord(bond) {
    return bond === 'married' ? '已结婚' : bond === 'dating' ? '在一起' : bond === 'interested' ? '在了解' : '朋友';
  }
  function practicePhone(attrs, flags, day) {
    attrs = attrs || {}; flags = flags || {};
    if ((attrs.phone || 0) >= 9) return { practiced: false, phone: attrs.phone || 0, capped: true };
    if (flags.phoneDay === day) return { practiced: false, phone: attrs.phone || 0 };
    flags.phoneDay = day;
    attrs.phone = (attrs.phone || 0) + 1;
    return { practiced: true, phone: attrs.phone };
  }
  window.CAST = {
    BACKGROUNDS, LOOKS, PEOPLE, MILESTONES, people: PEOPLE,
    ageOk, build, relOf, person, takenId, chat, court, commit, note, claim, migrateSave, bondWord, practicePhone
  };
})();
