// 我的足迹：和相册共用同一条记录。领过的回报不发第二次，没发生过的事不补写。
(function () {
  const MILES = [
    { id: 'm1000', at: 1000, title: '累计挣到 ¥1000' },
    { id: 'm2000', at: 2000, title: '累计挣到 ¥2000' },
    { id: 'm3000', at: 3000, title: '累计挣到 ¥3000' },
    { id: 'm4500', at: 4500, title: '还在往前' }
  ];

  function albumHas(S, id) { return !!((S.album || []).find(e => e.id === id)); }
  function add(S, e) {
    if (albumHas(S, e.id)) return false;
    if (window.G && G.addAlbum && G.S && G.S() === S) return G.addAlbum(e);
    S.album = S.album || [];
    S.album.push({ day: 1, clock: '00:00', kind: 'moment', caption: '', amount: null, title: '', ...e });
    return true;
  }

  function paidJob(S, job, pay) {
    if (!S || !(pay > 0) || !job) return false;
    S.flags = S.flags || {};
    if (S.flags.footJob) return false;
    const card = 'job_' + job.id;
    if (albumHas(S, card)) S.flags.footJob = card;
    else { S.flags.footJob = 'foot_paid'; add(S, { id: 'foot_paid', kind: 'job', title: '第一份工钱', caption: '「' + job.name + '」这一班拿到 ¥' + pay + '。', amount: pay }); }
    return true;
  }

  function treat(S, spec) {
    if (!S) return false;
    S.flags = S.flags || {};
    if (S.flags.footTreat) return false;
    spec = spec || {};
    S.flags.footTreat = 'foot_treat';
    add(S, { id: 'foot_treat', kind: 'treat', title: spec.title || '给自己留了一笔', caption: spec.caption || '不是任务，是你自己想歇一歇。', amount: spec.amount == null ? null : spec.amount });
    return true;
  }

  function noteFriend(S, person) {
    if (!S || !person) return false;
    S.flags = S.flags || {};
    if (S.flags.footFriend) return false;
    S.flags.footFriend = 'foot_friend';
    add(S, { id: 'foot_friend', kind: 'story', title: '有人跟你说话了', caption: person.name + '记住了你。这不是安排好的关系。' });
    return true;
  }

  function migrate(S) {
    if (!S) return S;
    S.flags = S.flags || {};
    if (!S.flags.introSeen) S.flags.introSeen = 1;
    if (!S.flags.footJob) {
      const paid = (S.album || []).find(e => e.kind === 'job' && e.amount > 0);
      if (paid) S.flags.footJob = paid.id;
    }
    MILES.forEach(m => {
      if (S.incomeMiles && S.incomeMiles[m.id] && !albumHas(S, 'wage_' + m.id)) {
        add(S, { id: 'wage_' + m.id, kind: 'milestone', title: m.title, caption: '这一档早就到了。补进相册，回报不再发一次。' });
      }
    });
    const people = (S.social && S.social.people) || {};
    const known = Object.keys(people).find(id => people[id] && ((people[id].friend || 0) >= 12 || (people[id].bond && people[id].bond !== 'none')));
    if (known && !S.flags.footFriend) {
      S.flags.footFriend = 'foot_friend';
      const who = window.CAST && window.CAST.person ? window.CAST.person(known) : null;
      if (!albumHas(S, 'foot_friend')) add(S, { id: 'foot_friend', kind: 'story', title: '有人跟你说话了', caption: (who ? who.name : '镇上的人') + '那边已经有来往。这次只补一张，不再加好感。' });
    }
    return S;
  }

  function board(S) {
    S = S || {};
    const miles = S.incomeMiles || {};
    const flags = S.flags || {};
    const nodes = [
      { id: 'arrive', title: '走进酒仙桥', text: '天还没亮，你站在路口。', done: true, album: albumHas(S, 'arrive') ? 'arrive' : '', art: 'dawn' },
      { id: 'job', title: '第一份工钱', text: flags.footJob ? '这一班记在相册里。花掉也不抹掉。' : '干完一班、工钱进来的那天再记。', done: !!flags.footJob, album: flags.footJob || '', art: 'job' },
      { id: 'treat', title: '第一顿自己请的', text: flags.footTreat ? '你给自己留过一次。' : '吃饭、洗澡，或坐下来歇一歇。不是任务。', done: !!flags.footTreat, album: flags.footTreat || '', art: 'treat' }
    ];
    MILES.forEach(m => {
      const done = !!miles[m.id];
      nodes.push({
        id: m.id, title: m.title,
        text: done ? '这一档的回报领过了，不会再领。' : '攒到就记一笔。没有日子限制，花钱不倒扣。',
        done, album: done ? 'wage_' + m.id : '', art: m.id === 'm4500' && !done ? 'later' : 'mile',
        silhouette: m.id === 'm4500' && !done
      });
    });
    nodes.push({
      id: 'friend', title: '有人跟你说话了',
      text: flags.footFriend ? '你自己开口的，不是安排好的。' : '想认识就认识。不认识，也完全可以。',
      done: !!flags.footFriend, album: flags.footFriend || '', art: 'friend', optional: true,
      silhouette: !flags.footFriend
    });
    nodes.push({ id: 'later', title: '还没写下的一天', text: '走到了再记。没有要你完成的人生清单。', done: false, album: '', art: 'later', silhouette: true });
    return { nodes, book: S.wageBook || 0 };
  }

  function pips(S) {
    const b = board(S);
    return b.nodes.filter(n => !n.silhouette || n.done).slice(0, 6).map(n => `<i class="${n.done ? 'on' : ''}"></i>`).join('');
  }

  window.FOOT = { MILES, paidJob, treat, noteFriend, migrate, board, pips };
})();
