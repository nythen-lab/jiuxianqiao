// v1.0.1 零工：每个地点的小活儿（见 data/gigs.js）
(function () {
  const C = window.CONFIG, G0 = window.G, A = window.ART; const GG = C.gigs; const { pick, ri, clamp } = G0.util;
  const SS = () => G0.S();
  const today = () => { const s = SS(); s.flags = s.flags || {}; const d = G0.dayNum(); if (!s.flags.gigs || s.flags.gigs.day !== d) s.flags.gigs = { day: d, counts: {}, total: 0, money: 0 }; return s.flags.gigs; };
  const byId = id => GG.list.find(x => x.id === id);
  const inWin = g => { const h = g.hours; for (let i = 0; i < h.length; i += 2) if (G0.inHours(h[i], h[i + 1])) return true; return false; };
  const openPlace = loc => { const P = C.places.find(p => p.id === loc); return !!P && G0.isOpen(P); };
  window.GIGS = {
    list: loc => GG.list.filter(g => g.place === loc && openPlace(loc) && inWin(g) && (!g.needScrap || (SS().scrapTotal || 0) > 0)),
    left: g => g.cap - (today().counts[g.id] || 0),
    pay(g) { const t = today(), n = t.counts[g.id] || 0; let m = ri(g.pay[0], g.pay[1]); m = Math.round(m * Math.pow(GG.repeatMult, n) * (t.total >= 4 ? GG.tiredMult : 1)); return m; },
    ok(g) {
      const s = SS(), t = today(), TH = G0.TH();
      if (t.total >= GG.dailyTotalCap) return '今天零工已经干得够多了，歇歇吧。';
      if (this.left(g) <= 0) return '这活儿今天已经干过了，明天再来。';
      if (s.stats.hunger < TH.hungerNoJob) return '饿得站不住，先吃点东西。';
      if (s.stats.stamina < g.minStamina) return '腿软得很，先歇会儿再干。';
      return null;
    },
    async run(id) {
      const g = byId(id), s = SS(); if (!g) return; const why = this.ok(g); if (why) return UI.toast(why, 'bad');
      const t = today(); let m = this.pay(g); const roll = Math.random(); let line = pick(g.lines), kind = 'normal';
      if (roll < 0.12) { m = Math.max(3, Math.round(m * 0.6)); kind = 'bad'; line = pick(g.bad); } else if (roll > 0.9) { const tip = ri(3, 8); m += tip; kind = 'tip'; line = pick(g.tip); }
      const cfg = Object.assign({}, g.micro); cfg.title = g.micro.title;
      if (window.FX) await FX.micro('gig_' + g.id, { cfg, money: m, bg: A.placeImg(s.loc, G0.hourF()) });
      G0.advance(g.minutes, 'work'); G0.change({ stamina: g.stamina, mental: g.mental });
      s.money += m; s.earned = (s.earned || 0) + m; s.gigTotal = (s.gigTotal || 0) + m; t.counts[g.id] = (t.counts[g.id] || 0) + 1; t.total++; t.money += m;
      G0.log(`${g.name}，挣了 ¥${m}。`, kind === 'bad' ? 'warn' : 'good');
      try { FX.sfx && FX.sfx.play('coin'); } catch (e) { }
      UI.toast(`${g.name} +¥${m}`);
      await UI.modal({ title: g.name, bg: A.placeImg(s.loc, G0.hourF()), html: `<p>${line}</p>${UI.effText({ money: m, stamina: g.stamina, mental: g.mental })}<p class="muted tiny">今天零工已经挣了 <b>¥${t.money}</b>（${t.total}/${GG.dailyTotalCap} 次）。${kind === 'tip' ? ' 还收到一点小费。' : kind === 'bad' ? ' 今天运气一般。' : ''}</p>`, buttons: [{ text: '收好钱' }] });
    }
  };
  // 每种零工都有自己的小互动
  C.micro = C.micro || {}; GG.list.forEach(g => { C.micro['gig_' + g.id] = g.micro; });
  // 接进地点面板和行动分发
  const hasOld = LIFE.has; LIFE.has = k => k === 'gig' || hasOld(k);
  const panelOld = LIFE.panel;
  LIFE.panel = function (loc, btn, open) {
    const r = panelOld.apply(this, arguments);
    GIGS.list(loc).forEach(g => { if (GIGS.left(g) > 0) r.acts.push(btn('gig:' + g.id, g.name, `${g.sub} · ¥${g.pay[0]}–${g.pay[1]}${g.cap > 1 ? ` · 今天还能 ${GIGS.left(g)} 次` : ''}`)); });
    const t = today(); if (t.total >= GG.dailyTotalCap) r.html += '<p class="muted tiny">今天的零工已经干满了。</p>';
    return r;
  };
  const doOld = LIFE.doAct;
  LIFE.doAct = function (k, v) { if (k === 'gig') return UI.act(() => GIGS.run(v)); return doOld.apply(this, arguments); };
  { const ic = UI.actIcon; UI.actIcon = id => id.split(':')[0] === 'gig' ? ({ dish: '🍽️', errand: '🛵', skewer: '🍢', flyer: '📄', move: '📦', queue: '🎫', sort: '♻️' }[id.split(':')[1]] || '💴') : ic(id); }
})();
