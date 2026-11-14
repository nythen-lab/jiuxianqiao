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
      const t = today(); const bg = A.placeImg(s.loc, G0.hourF());
      // v1.0.2：每种零工是一个真正的小游戏（见 js/gp-*.js）；出岔子时退回老的小互动，按一般水平结算
      let res = null;
      if (window.GP && GP.games[g.id]) { try { res = await GP.play(g.id, { bg, minutes: g.minutes, hours: g.minutes / 60, forceBrief: true, payNote: window.PAY ? PAY.gigNote(g) : null }); } catch (e) { console.error(e); res = null; } }
      if (res && res.noPay) { await UI.modal({ title: g.name, bg, html: '<p>还没开始干活，这单没有工钱，也不占今天的次数。</p>', buttons: [{ text: '先去别处' }] }); return; }
      if (!res || res.fallback) { const cfg = Object.assign({}, g.micro); if (window.FX) await FX.micro('gig_' + g.id, { cfg, money: 0, bg }); res = Object.assign({ completed: true, quality: .62, lines: [] }, res || {}); }
      const q = clamp(res.quality == null ? .62 : res.quality, 0, 1), quit = !!res.quit;
      const base = this.pay(g), mult = GP.perfMult(q); const roll = Math.random(); let line = pick(g.lines), kind = 'normal', tip = 0;
      if (q < .3) { kind = 'bad'; line = pick(g.bad); } else if (!quit && q >= .85 && roll < .45) { tip = ri(3, 8); kind = 'tip'; line = pick(g.tip); }
      const settled = window.PAY ? PAY.settleGig({ base, mult, quit, frac: quit ? (res.quitPay ? res.quitPay.frac : 0.45) : 1, tip }) : null;
      let m = settled ? settled.pay : (quit ? Math.round(base * mult * (res.quitPay ? res.quitPay.frac : .45)) : Math.max(3, Math.round(base * mult)) + tip);
      const frac = quit ? clamp((res.hoursDone || 0) / Math.max(.1, g.minutes / 60), .25, 1) : 1; const minutes = Math.round(g.minutes * frac);
      G0.advance(minutes, 'work'); G0.change({ stamina: Math.round(g.stamina * frac), mental: Math.round(g.mental * frac) + (q >= .85 ? 1 : 0) });
      s.money += m; s.earned = (s.earned || 0) + m; if (m > 0 && G0.noteWage) G0.noteWage(m, 'gig'); s.gigTotal = (s.gigTotal || 0) + m; t.counts[g.id] = (t.counts[g.id] || 0) + 1; t.total++; t.money += m;
      G0.log(`${g.name}（${GP.grade(q).w}），挣了 ¥${m}。`, kind === 'bad' ? 'warn' : 'good');
      try { FX.sfx && FX.sfx.play('coin'); } catch (e) { }
      UI.toast(`${g.name} +¥${m}`);
      const gr = GP.grade(q), stars = '★'.repeat(gr.s) + '☆'.repeat(3 - gr.s);
      const ledger = settled ? settled.lines : [];
      const calc = `<ul class="pay-lines">${ledger.map(x => `<li><span>${x.name}</span><b>${x.amt < 0 ? '−' : '+'}¥${Math.abs(x.amt)}</b></li>`).join('')}</ul><p class="pay-sum">手艺 <b>${gr.w}</b> ${stars} · 实发 <b class="up">¥${m}</b> · 上面加起来是 ¥${ledger.reduce((a, x) => a + x.amt, 0)}</p>`;
      const det = (res.lines || []).length ? `<ul class="gig-lines">${res.lines.map(x => `<li>${x}</li>`).join('')}</ul>` : '';
      await UI.modal({ title: g.name, bg, html: `<p>${line}</p>${calc}${det}${UI.effText({ money: m, stamina: Math.round(g.stamina * frac), mental: Math.round(g.mental * frac) })}<p class="muted tiny">干了 ${minutes} 分钟。今天零工已经挣了 <b>¥${t.money}</b>（${t.total}/${GG.dailyTotalCap} 次）。${kind === 'tip' ? ' 还收到一点小费。' : kind === 'bad' ? ' 今天手艺不太行，工钱打了折。' : ''}</p>`, buttons: [{ text: '收好钱' }] });
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
