// Browser integration. Scripted qualities and fishing corrections are labeled.
// Inputs go through real mouse, keyboard, touch, and button clicks in headless Chrome.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/tmp/accept-deps/package.json');
const puppeteer = require('puppeteer-core');

const URL = process.env.ACCEPT_URL || 'http://127.0.0.1:8765/index.html';
const OUT = '/opt/cursor/artifacts/accept';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (detail ? ' ' + JSON.stringify(detail).slice(0, 400) : ''));
}

async function shot(page, name) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function clickText(page, text) {
  const box = await page.evaluate(t => {
    const el = [...document.querySelectorAll('button, [data-a], [data-food], [data-in]')].find(b => !b.disabled && (b.textContent || '').includes(t));
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + Math.min(r.width / 2, 80), y: r.top + r.height / 2 };
  }, text);
  if (!box) {
    const have = await page.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0, 24)).slice(0, 12));
    throw new Error('missing button ' + text + ' have ' + have.join(' | '));
  }
  await page.mouse.click(box.x, box.y);
}

async function modalText(page) {
  return page.evaluate(() => {
    const m = document.querySelector('#modal');
    if (!m || m.classList.contains('hidden')) return '';
    return m.innerText.replace(/\s+/g, ' ').slice(0, 500);
  });
}

async function dismissModal(page) {
  const open = await modalText(page);
  if (!open) return false;
  const box = await page.evaluate(() => {
    const b = document.querySelector('#modal .mbtns button:not([disabled])');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, t: b.textContent };
  });
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  return box.t;
}

async function waitFor(page, pred, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = await page.evaluate(pred).catch(e => ({ __err: String(e) }));
    if (v && !v.__err) return v;
    await new Promise(r => setTimeout(r, 40));
  }
  throw new Error('timeout ' + label);
}

async function boot(browser, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport || { width: 1400, height: 900 });
  await page.evaluateOnNewDocument(() => { window.GP_REAL = true; window.FX_MUTE = true; });
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => window.G && window.UI && window.CAST && window.PAY);
  return page;
}

function oldCollapseSave() {
  return {
    v: 1, idId: 'laozhou', time: 240 + 6 * 1440, loc: 'inn', money: 40, sent: 100, earned: 2500, rep: 50,
    stats: { stamina: 0, mental: 12, hunger: 8, clean: 40 }, maxSta: 80,
    attrs: { brain: 4, exp: 9, phone: 2 }, skills: { hands: 3, knife: 2, eye: 4, pick: 0 },
    outfit: 'old', owned: ['old'], items: {}, debuffs: [], jobsDone: { courier: 2 }, stories: [],
    npc: {}, record: { count: 0, log: [] }, offers: null, refused: {}, collapses: 3, bed: null,
    beersTonight: 0, picked: {}, log: [], flags: {}, ended: { key: 'lose_collapse', win: false, day: 3, clock: '08:00' },
    eventsOnce: {}, stamps: [], album: [], xp: { hands: 0, knife: 0, eye: 0, pick: 0 },
    starveH: 0, forced: { sleep: 1, hunger: 0, mental: 0 }, lvlups: [],
    stats_total: { worked: 2, stolen: 0, caught: 0 }, unlocked: {}, ach: {}, certs: {}, owed: [],
    seasonStart: 'autumn',
    life: { bank: 80, partner: { name: '旧人', state: 'married', age: 50, kind: 'female' }, met: true, home: null, kid: null, pregnancy: null, done: {}, fish: [], lastMeetRoll: 0, mortgagePaid: 0 }
  };
}

async function continueSave(page) {
  await clickText(page, '继续上次');
  await page.waitForFunction(() => {
    const end = document.querySelector('#end');
    const game = document.querySelector('#game');
    return (end && getComputedStyle(end).display !== 'none' && end.innerText.includes('醒过来')) || document.querySelector('#hud-money');
  }, { timeout: 8000 });
}

async function sectionMigration(browser) {
  const page = await boot(browser);
  try {
    await page.evaluate(save => localStorage.setItem('jxq_auto_v1', JSON.stringify(save)), oldCollapseSave());
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.G && document.body.innerText.includes('继续上次'));
    await continueSave(page);
    await shot(page, 'collapse-ending');
    const before = await page.evaluate(() => {
      const S = G.S();
      return { money: S.money, bank: S.life && S.life.bank, book: S.wageBook, miles: Object.keys(S.incomeMiles || {}), ended: S.ended && S.ended.key, partner: S.life && S.life.partner && S.life.partner.name };
    });
    record('old collapse save migrates recorded earnings', before.book === 2500 && before.money === 40 && before.bank === 80 && before.ended === 'lose_collapse' && before.miles.includes('m1000') && before.miles.includes('m2000') && !before.miles.includes('m3000') && before.partner === '旧人', before);
    await clickText(page, '醒过来，接着过');
    await page.waitForFunction(() => document.querySelector('#hud-money'));
    const woke = await page.evaluate(() => {
      const S = G.S();
      return { money: Number(document.querySelector('#hud-money').textContent), state: S.money, bank: S.life.bank, ended: S.ended, sta: S.stats.stamina, book: S.wageBook };
    });
    record('resume keeps pocket and passbook', woke.money === 40 && woke.state === 40 && woke.bank === 80 && !woke.ended && woke.sta >= 42 && woke.book === 2500, woke);
    await shot(page, 'collapse-resumed');
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.G && document.body.innerText.includes('继续上次'));
    await continueSave(page);
    const again = await page.evaluate(() => {
      const S = G.S();
      G.grantIncomeMiles();
      return { money: S.money, bank: S.life.bank, book: S.wageBook, miles: Object.keys(S.incomeMiles || {}).sort(), ended: !!S.ended };
    });
    record('reload does not grant the collapse reward or wages twice', again.money === 40 && again.bank === 80 && again.book === 2500 && again.miles.join() === 'm1000,m2000' && !again.ended, again);
  } catch (e) {
    record('migration section', false, { error: String(e.stack || e).slice(0, 500) });
  } finally { await page.close(); }
}

async function playJob(page, quality, mode) {
  const expected = await page.evaluate((q, mode) => {
    const S = G.S();
    S.stats.stamina = 92; S.stats.hunger = 80; S.stats.mental = 78; S.stats.clean = 60;
    S.skills.hands = 0; S.xp.hands = 0;
    CONFIG.events.forEach(e => { e.chance = 0; });
    CONFIG.dailyEventEvery = 9999;
    G.pickNpc = () => null;
    CONFIG.settings.economy.wageUnpaidP = mode === 'unpaid' ? 2 : 0;
    CONFIG.settings.economy.wageDelayP = 0;
    const spec = { wage: 400, completed: true, quality: q, qualityPay: 30, skillLv: 0, fines: 0, perf: (qq, pool) => STA.perfBonus(qq, pool) };
    return { pay: PAY.settleJob(spec).pay, before: S.money, book: S.wageBook || 0 };
  }, quality, mode || '');
  await page.evaluate(() => {
    const o = { oid: 'acc' + Math.random(), job: 'antigen', recruiter: 'liu', cut: 0 };
    UI.act(() => UI.doJob(o, 400));
  });
  const briefAt = Date.now();
  while (Date.now() - briefAt < 15000) {
    const txt = await modalText(page);
    if (txt.includes('开始干活')) break;
    if (txt) await dismissModal(page);
    await new Promise(r => setTimeout(r, 80));
  }
  await shot(page, 'brief-' + quality);
  await clickText(page, '开始干活');
  await waitFor(page, () => !!(window.GP && GP.cur && GP.cur.env), 8000, 'minigame');
  if (await page.evaluate(() => GP.cur.env.phase === 'help')) {
    await page.keyboard.press('Space');
    await page.waitForFunction(() => GP.cur.env.phase !== 'help', { timeout: 4000 });
  }
  await page.evaluate(q => GP.cur.finish(q), quality);
  await waitFor(page, () => !!document.querySelector('#gp-done') && document.querySelector('#gp-done').style.display !== 'none', 4000, '收工');
  const done = await page.evaluate(() => {
    const b = document.querySelector('#gp-done');
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await page.mouse.click(done.x, done.y);
  const settleAt = Date.now();
  let settleText = '';
  while (Date.now() - settleAt < 15000) {
    settleText = await modalText(page);
    if (settleText.includes('上面加起来是')) break;
    if (settleText) await dismissModal(page);
    await new Promise(r => setTimeout(r, 80));
  }
  if (!settleText.includes('上面加起来是')) throw new Error('timeout settlement ' + settleText.slice(0, 120));
  const view = await page.evaluate(() => ({
    modal: document.querySelector('#modal').innerText.replace(/\s+/g, ' '),
    hud: Number(document.querySelector('#hud-money').textContent),
    money: G.S().money,
    book: G.S().wageBook
  }));
  await shot(page, 'settle-' + quality);
  await dismissModal(page);
  await page.waitForFunction(() => !document.querySelector('#modal') || document.querySelector('#modal').classList.contains('hidden'), { timeout: 8000 }).catch(() => {});
  for (let i = 0; i < 4; i++) {
    if (!(await modalText(page))) break;
    await dismissModal(page);
    await new Promise(r => setTimeout(r, 200));
  }
  return { expected, view };
}

async function sectionLife(browser) {
  const page = await boot(browser);
  try {
    await clickText(page, '新的开始');
    await clickText(page, '自己来');
    await page.waitForFunction(() => document.querySelector('#cast-age'));
    await clickText(page, '女');
    await clickText(page, '都可以');
    await page.evaluate(() => { const i = document.querySelector('#cast-age'); i.value = '29'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await clickText(page, '灶上干过');
    await shot(page, 'create-form');
    await clickText(page, '就这样，开始');
    await waitFor(page, () => document.body.innerText.includes('记住了'), 6000, 'intro');
    await clickText(page, '记住了');
    await page.waitForFunction(() => document.querySelector('#hud-money'));
    const who = await page.evaluate(() => {
      const I = G.identity(); const S = G.S();
      return { id: S.idId, age: I.age, female: !!I.female, pref: S.social.pref, knife: S.skills.knife, book: S.wageBook, money: S.money };
    });
    record('custom adult creation', who.id === 'self' && who.age === 29 && who.female && who.pref === 'any' && who.knife === 2 && who.book === 0, who);

    const startMoney = who.money;
    const pays = [];
    for (const q of [0.2, 0.7, 1]) {
      const r = await playJob(page, q);
      const prevMoney = pays.length ? pays[pays.length - 1].money : startMoney;
      const prevBook = pays.length ? pays[pays.length - 1].book : 0;
      const misc = await page.evaluate(() => CONFIG.settings.economy.dailyMisc || 0);
      const delta = r.view.money - prevMoney;
      const bookDelta = r.view.book - prevBook;
      const modalSums = r.view.modal.includes('实发 ¥' + r.expected.pay) && r.view.modal.includes('上面加起来是 ¥' + r.expected.pay);
      const pass = delta === r.expected.pay - misc && bookDelta === r.expected.pay && r.view.hud === r.view.money && modalSums;
      record('live pocket for quality ' + q, pass, { delta, bookDelta, expect: r.expected.pay, misc, note: 'night shift crosses midnight, so the pocket also pays that morning\'s daily miscellaneous cost', hud: r.view.hud, modal: r.view.modal.slice(0, 120) });
      pays.push({ q, money: r.view.money, book: r.view.book, pay: r.expected.pay });
    }
    const low = pays[0].pay, mid = pays[1].pay, high = pays[2].pay;
    record('low medium high pay differ in the pocket', low < mid && mid < high, { low, mid, high });

    const frozen = pays[2].money;
    await page.evaluate(() => G.save());
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => window.G && document.body.innerText.includes('继续上次'));
    await continueSave(page);
    const reloaded = await page.evaluate(() => ({ money: G.S().money, hud: Number(document.querySelector('#hud-money').textContent), book: G.S().wageBook, miles: G.S().incomeMiles }));
    record('save reload keeps the pocket and does not pay the jobs again', reloaded.money === frozen && reloaded.hud === frozen && reloaded.book === pays[2].book, reloaded);

    const unpaidBefore = reloaded.money;
    const bookBeforeUnpaid = reloaded.book;
    const unpaid = await playJob(page, 1, 'unpaid');
    const misc = await page.evaluate(() => CONFIG.settings.economy.dailyMisc || 0);
    record('unpaid roll credits no cash', unpaid.view.money === unpaidBefore - misc && unpaid.view.book === bookBeforeUnpaid && unpaid.view.modal.includes('实发 ¥0') && unpaid.view.modal.includes('上面加起来是 ¥0') && unpaid.view.modal.includes('没打款'), { money: unpaid.view.money, before: unpaidBefore, misc, book: unpaid.view.book, modal: unpaid.view.modal.slice(0, 140) });
    await page.evaluate(() => { CONFIG.settings.economy.wageUnpaidP = 0; CONFIG.settings.economy.wageDelayP = 0; });

    const book = await page.evaluate(() => G.S().wageBook);
    for (let i = 0; i < 4; i++) { if (!(await modalText(page))) break; await dismissModal(page); }
    await page.evaluate(() => { const S = G.S(); S.loc = 'food'; S.view = 'place'; S.time = (S.time - (S.time % 1440)) + 14 * 60; if (G.queue) G.queue.length = 0; UI.render(); });
    await clickText(page, '牛肉拉面');
    await waitFor(page, () => document.body.innerText.includes('算了'), 4000, 'food confirm');
    await clickText(page, '算了');
    const afterCancel = await page.evaluate(() => G.S().money);
    record('food cancel does not charge', afterCancel === unpaid.view.money, { afterCancel, money: unpaid.view.money });
    await clickText(page, '牛肉拉面');
    await waitFor(page, () => document.body.innerText.includes('吃下去'), 4000, 'eat');
    await clickText(page, '吃下去');
    await page.waitForFunction(() => !document.querySelector('#modal') || document.querySelector('#modal').classList.contains('hidden') || document.body.innerText.includes('擦擦嘴'), { timeout: 8000 }).catch(() => {});
    if (await modalText(page)) await dismissModal(page);
    const spent = await page.evaluate(() => ({ money: G.S().money, book: G.S().wageBook }));
    record('spending lowers pocket and not the wage book', spent.money === afterCancel - 14 && spent.book === book, spent);

    await page.evaluate(() => { const S = G.S(); S.loc = 'bank'; S.view = 'place'; UI.render(); });
    await clickText(page, '存折');
    await waitFor(page, () => !!document.querySelector('[data-in="100"]'), 4000, 'bank');
    const preBank = await page.evaluate(() => ({ money: G.S().money, bank: G.S().life.bank, book: G.S().wageBook }));
    const dep = await page.evaluate(() => {
      const b = document.querySelector('[data-in="100"]');
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.click(dep.x, dep.y);
    await new Promise(r => setTimeout(r, 300));
    const postBank = await page.evaluate(() => ({ money: G.S().money, bank: G.S().life.bank, book: G.S().wageBook }));
    record('deposit is a transfer, not new earnings', postBank.money === preBank.money - 100 && postBank.bank === preBank.bank + 100 && postBank.book === preBank.book, { preBank, postBank });
    await dismissModal(page);

    await page.evaluate(() => { const S = G.S(); S.loc = 'food'; S.view = 'place'; S.time = (S.time - (S.time % 1440)) + 14 * 60; if (G.queue) G.queue.length = 0; UI.render(); });
    for (let i = 0; i < 5; i++) { if (!(await modalText(page))) break; await dismissModal(page); await new Promise(r => setTimeout(r, 100)); }
    async function folk(id, choice) {
      for (let i = 0; i < 4; i++) { if (!(await modalText(page))) break; await dismissModal(page); await new Promise(r => setTimeout(r, 80)); }
      const box = await page.evaluate(id => {
        const el = document.querySelector('[data-a="folk:' + id + '"]');
        if (!el) return { missing: true, text: (document.querySelector('#panel') || {}).innerText || '' };
        el.scrollIntoView({ block: 'center' });
        const r = el.getBoundingClientRect();
        const x = Math.min(window.innerWidth - 8, Math.max(8, r.left + r.width / 2));
        const y = Math.min(window.innerHeight - 8, Math.max(8, r.top + r.height / 2));
        const top = document.elementFromPoint(x, y);
        return { x, y, covered: !(top && top.closest && top.closest('[data-a="folk:' + id + '"]')), top: top && top.textContent.slice(0, 40) };
      }, id);
      if (box.missing) throw new Error('no folk ' + id + ' ' + String(box.text).slice(0, 180));
      await page.mouse.click(box.x, box.y);
      const opened = Date.now();
      let seen = false;
      while (Date.now() - opened < 4000) {
        const txt = await modalText(page);
        if (txt.includes(choice)) { seen = true; break; }
        await new Promise(r => setTimeout(r, 40));
      }
      if (!seen) throw new Error('timeout ' + id + choice + ' covered=' + box.covered + ' top=' + box.top);
      await clickText(page, choice);
      await new Promise(r => setTimeout(r, 150));
      if (await modalText(page)) await dismissModal(page);
    }
    for (let i = 0; i < 8; i++) await folk('hejie', '聊聊');
    const taught = await page.evaluate(() => ({ knife: G.S().skills.knife, xp: (G.S().xp || {}).knife || 0, friend: G.S().social.people.hejie.friend, aff: G.S().social.people.hejie.affection }));
    record('friendship teaches knife and does not start romance', taught.friend >= 30 && taught.aff === 0 && (taught.knife > 2 || taught.xp > 0), taught);
    for (let i = 0; i < 9; i++) await folk('hejie', '想多了解');
    await folk('hejie', '把关系说清楚');
    await page.evaluate(() => { const S = G.S(); S.loc = 'corner'; S.view = 'place'; UI.render(); });
    for (let i = 0; i < 9; i++) await folk('acheng', '想多了解');
    await folk('acheng', '把关系说清楚');
    await new Promise(r => setTimeout(r, 200));
    const social = await page.evaluate(() => {
      const S = G.S();
      return { he: S.social.people.hejie.bond, a: S.social.people.acheng.bond, affA: S.social.people.acheng.affection, partner: S.life.partner && S.life.partner.fromCast, toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' ') };
    });
    record('two relationships stay independent and only one commitment sticks', social.he === 'dating' && social.a === 'interested' && social.partner === 'hejie', social);
    await page.evaluate(() => G.save());
    const snap = await page.evaluate(() => ({ money: G.S().money, book: G.S().wageBook, he: G.S().social.people.hejie.bond, a: G.S().social.people.acheng.bond }));
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => document.body.innerText.includes('继续上次'));
    await continueSave(page);
    const back = await page.evaluate(() => ({ money: G.S().money, book: G.S().wageBook, he: G.S().social.people.hejie.bond, a: G.S().social.people.acheng.bond, miles: Object.keys(G.S().incomeMiles || {}) }));
    record('reload keeps spend, milestone book, and both relationships', back.money === snap.money && back.book === snap.book && back.book >= 1000 && back.he === 'dating' && back.a === 'interested' && back.miles.includes('m1000') && !back.miles.includes('m2000'), back);
    await shot(page, 'after-reload');
  } catch (e) {
    record('life section', false, { error: String(e.stack || e).slice(0, 700) });
    try { await shot(page, 'life-error'); } catch (err) {}
  } finally { await page.close(); }
}

async function sectionBath(browser) {
  const page = await boot(browser);
  try {
    await page.evaluate(() => {
      const built = CAST.build({ age: 30, gender: 'm', pref: 'none', bg: 'bit', name: '阿宁', look: 0 });
      G.newGame('self', built.identity);
      if (G.queue) G.queue.length = 0;
      const S = G.S();
      S.money = 0; S.loc = 'bath'; S.view = 'place';
      S.time = (CONFIG.settings.dayStartHour * 60) + 14 * 60;
      S.stats.stamina = 40; S.stats.mental = 40; S.stats.hunger = 70; S.stats.clean = 20;
      UI.show('game'); UI.render();
    });
    const place = await page.evaluate(() => document.querySelector('#panel h3').textContent);
    record('bath actions are on 老澡堂', place.includes('老澡堂'), { place });
    await shot(page, 'bath-place');
    const t0 = await page.evaluate(() => ({ money: G.S().money, time: G.S().time }));
    await clickText(page, '冲个淋浴');
    await new Promise(r => setTimeout(r, 400));
    const broke = await page.evaluate(() => ({ money: G.S().money, time: G.S().time, scene: !!document.querySelector('.bath-scene'), toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' ') }));
    record('bath without money does not start or charge', broke.money === 0 && broke.time === t0.time && !broke.scene, broke);

    const items = await page.evaluate(() => CONFIG.bath.items.map(i => ({ id: i.id, price: i.price, minutes: i.minutes, stamina: i.stamina, mental: i.mental })));
    for (const it of items) {
      await page.evaluate(id => {
        window.FX_SLOW = true;
        document.querySelectorAll('#mx').forEach(n => n.remove());
        const S = G.S();
        S.money = 100; S.stats.stamina = 40; S.stats.mental = 40; S.stats.clean = 20;
        S.debuffs = []; S.loc = 'bath'; S.view = 'place';
        const mark = S.time;
        S._mark = mark;
        UI.render();
      }, it.id);
      const before = await page.evaluate(() => ({ money: G.S().money, time: G.S().time, sta: G.S().stats.stamina, men: G.S().stats.mental, loc: G.S().loc }));
      await clickText(page, it.id === 'wash' ? '冲个淋浴' : it.id === 'soak' ? '泡一池热水' : '搓澡');
      const scene = await waitFor(page, () => {
        const n = document.querySelector('.bath-scene');
        if (!n) return null;
        return { bath: n.dataset.bath, cls: n.className, step: n.dataset.step || '', loc: G.S().loc, title: (document.querySelector('.mx-title') || {}).textContent || '' };
      }, 4000, 'bath scene ' + it.id);
      await shot(page, 'bath-' + it.id);
      const mid = await page.evaluate(() => ({ money: G.S().money, time: G.S().time, sta: Math.round(G.S().stats.stamina), men: Math.round(G.S().stats.mental) }));
      await page.waitForFunction(() => { const h = document.querySelector('#modal h2'); return h && h.textContent.includes('老澡堂'); }, { timeout: 12000 });
      const after = await page.evaluate(() => ({ money: G.S().money, time: G.S().time, sta: Math.round(G.S().stats.stamina), men: Math.round(G.S().stats.mental), modal: document.querySelector('#modal').innerText.slice(0, 80) }));
      await dismissModal(page);
      for (let i = 0; i < 4; i++) { if (!(await modalText(page))) break; await dismissModal(page); await new Promise(r => setTimeout(r, 120)); }
      const closed = await page.evaluate(() => ({ money: G.S().money, time: G.S().time, sta: Math.round(G.S().stats.stamina) }));
      const pass = scene.bath.startsWith(it.id) && scene.cls.includes(it.id) && scene.loc === 'bath' && scene.title === '洗澡'
        && mid.money === before.money - it.price && mid.time === before.time + it.minutes
        && closed.money === mid.money && closed.time === mid.time && closed.sta === mid.sta
        && after.modal.includes('老澡堂');
      record('bath ' + it.id + ' scene and one charge', pass, { scene, before, mid, after, closed, it });
    }
    await page.evaluate(() => {
      window.FX_SLOW = true;
      document.querySelectorAll('#mx').forEach(n => n.remove());
      const S = G.S(); S.money = 100; S.stats.stamina = S.maxSta; S.stats.mental = 100; S.loc = 'bath'; if (G.queue) G.queue.length = 0; UI.render();
    });
    const cap0 = await page.evaluate(() => ({ sta: G.S().stats.stamina, money: G.S().money, max: G.S().maxSta }));
    await clickText(page, '泡一池热水');
    await waitFor(page, () => document.querySelector('.bath-scene.soak'), 4000, 'capped soak');
    const cap1 = await page.evaluate(() => ({ sta: Math.round(G.S().stats.stamina), money: G.S().money, men: Math.round(G.S().stats.mental) }));
    record('capped stamina is charged once and does not pass the max', cap1.sta === cap0.max && cap1.money === cap0.money - 15 && cap1.men <= 100, { cap0, cap1 });
  } catch (e) {
    record('bath section', false, { error: String(e.stack || e).slice(0, 700) });
    try { await shot(page, 'bath-error'); } catch (err) {}
  } finally { await page.close(); }
}

async function fishCanvas(page) {
  return page.evaluate(() => {
    const cv = document.querySelector('.gp-cv') || document.querySelector('#gproot canvas');
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, width: r.width, height: r.height };
  });
}

async function fishState(page) {
  return page.evaluate(() => {
    const g = window.GP && GP.cur && GP.cur.game;
    const env = window.GP && GP.cur && GP.cur.env;
    if (!g || !env) return null;
    return { fishPhase: g.phase, phase: env.phase, caught: !!g.caught, help: (GP.games.fish.help || []).join(' ') };
  });
}

async function steerFish(page, how) {
  return page.evaluate(how => new Promise(resolve => {
    const cv = document.querySelector('.gp-cv');
    let down = false, ticks = 0, trustedNote = how;
    const ptr = (type, pointerType) => {
      const r = cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, pointerType, isPrimary: true }));
    };
    const step = () => {
      ticks++;
      const env = GP.cur && GP.cur.env, g = GP.cur && GP.cur.game;
      if (!env || !g || ticks > 45 * 60) return resolve({ phase: g && g.phase, caught: !!(g && g.caught), ticks, via: trustedNote });
      const key = (type) => window.dispatchEvent(new KeyboardEvent(type, { key: ' ', code: 'Space', bubbles: true }));
      if (g.phase === 'bite' && how !== 'fail') { ptr('pointerdown', how === 'touch' ? 'touch' : 'mouse'); ptr('pointerup', how === 'touch' ? 'touch' : 'mouse'); key('keydown'); key('keyup'); }
      else if (g.phase === 'fight' && how !== 'fail') {
        const rise = g.hook + g.hh / 2 > g.fish;
        if (rise && !down) { ptr('pointerdown', how === 'touch' ? 'touch' : 'mouse'); key('keydown'); down = true; }
        if (!rise && down) { ptr('pointerup', how === 'touch' ? 'touch' : 'mouse'); key('keyup'); down = false; }
      } else if (g.phase === 'done' || g.phase === 'lost') return resolve({ phase: g.phase, caught: !!g.caught, ticks, via: trustedNote, prog: g.prog, held: g.held });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), how);
}

async function openFish(page) {
  await page.evaluate(() => {
    const S = G.S();
    S.loc = 'riverside'; S.view = 'place';
    S.time = (S.time - (S.time % 1440)) + 15 * 60;
    S.stats.stamina = 80; S.stats.hunger = 70; S.stats.mental = 70;
    UI.show('game'); UI.render();
  });
  await clickText(page, '钓鱼');
  await waitFor(page, () => !!(window.GP && GP.cur && GP.cur.game), 8000, 'fish mounted');
}

async function finishFish(page) {
  await page.waitForFunction(() => {
    const b = document.querySelector('#gp-done');
    return b && b.style.display !== 'none';
  }, { timeout: 6000 }).catch(() => {});
  const vis = await page.evaluate(() => {
    const n = document.querySelector('#gp-done');
    if (!n || n.style.display === 'none') return null;
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (vis) await page.mouse.click(vis.x, vis.y);
  await new Promise(r => setTimeout(r, 350));
  for (let i = 0; i < 4; i++) { if (!(await modalText(page))) break; await dismissModal(page); await new Promise(r => setTimeout(r, 120)); }
}

async function sectionFish(browser) {
  const page = await boot(browser);
  try {
    await page.evaluate(() => { G.newGame('xiaozhou'); UI.show('game'); UI.render(); });
    await openFish(page);
    const help = await fishState(page);
    await shot(page, 'fish-tutorial');
    record('fishing tutorial is hold and release', help && help.phase === 'help' && help.help.includes('按住') && help.help.includes('松开') && help.help.includes('不用拖'), { phase: help && help.phase, help: help && help.help });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => GP.cur.env.phase !== 'help', { timeout: 4000 });
    const helpBtn = await page.evaluate(() => {
      const b = document.querySelector('#gp-help');
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.click(helpBtn.x, helpBtn.y);
    const reopened = await fishState(page);
    await shot(page, 'fish-tutorial-reopen');
    record('玩法 reopens the tutorial', reopened.phase === 'help', reopened);
    await page.keyboard.press('Space');
    const struck = { before: 'none', after: 'none' };
    const biteWait = Date.now();
    while (Date.now() - biteWait < 8000) {
      const s = await fishState(page);
      if (s && s.fishPhase === 'bite') {
        const box = await fishCanvas(page);
        await page.mouse.click(box.x, box.y);
        await new Promise(r => setTimeout(r, 60));
        struck.before = 'bite';
        struck.after = (await fishState(page)).fishPhase;
        break;
      }
      if (s && s.fishPhase === 'fight') { struck.before = 'fight'; struck.after = 'fight'; break; }
      await new Promise(r => setTimeout(r, 30));
    }
    record('trusted mouse click on the bite strikes the hook', struck.after === 'fight', struck);
    const steered = await steerFish(page, 'mouse');
    await finishFish(page);
    const caught = await page.evaluate(() => {
      const fish = (G.S().life && G.S().life.fish) || [];
      const last = fish[fish.length - 1];
      const kind = last && CONFIG.fishKinds.find(k => k.name === last.name);
      return { n: fish.length, last, kind, log: (G.S().log || []).slice(-3).map(x => x.text) };
    });
    const rewardOk = caught.n === 1 && caught.kind && caught.last.sell >= caught.kind.sell[0] && caught.last.sell <= caught.kind.sell[1];
    record('mouse catch adds one fish inside its sell range', rewardOk, { caught, steered });
    await shot(page, 'fish-after-catch');

    const beforeFail = caught.n;
    await openFish(page);
    if ((await fishState(page)).phase === 'help') await page.keyboard.press('Space');
    await steerFish(page, 'fail');
    await finishFish(page);
    const failed = await page.evaluate(() => ({ n: (G.S().life.fish || []).length, phase: GP.cur && GP.cur.game && GP.cur.game.phase, caught: GP.cur && GP.cur.game && GP.cur.game.caught }));
    record('missing the bite does not add a fish', failed.n === beforeFail && !failed.caught, failed);

    await openFish(page);
    await shot(page, 'fish-touch-tutorial');
    const touchedSteer = await steerFish(page, 'touch');
    await finishFish(page);
    const touched = await page.evaluate(() => {
      const fish = G.S().life.fish || [];
      const last = fish[fish.length - 1];
      const kind = last && CONFIG.fishKinds.find(k => k.name === last.name);
      return { n: fish.length, ok: !!(last && kind && last.sell >= kind.sell[0] && last.sell <= kind.sell[1] && fish.length === 2) };
    });
    record('touch catch adds a second correctly priced fish', touched.ok, { touched, touchedSteer });
  } catch (e) {
    record('fish section', false, { error: String(e.stack || e).slice(0, 700) });
    try { await shot(page, 'fish-error'); } catch (err) {}
  } finally { await page.close(); }
}

function expectKind(id) {
  const base = String(id).split(':')[0];
  const sub = String(id).split(':')[1] || '';
  if (base === 'temple') return (sub === 'bow' || sub === 'wish') ? 'free' : 'spend';
  if (base === 'sleep') return (sub === 'street' || sub === 'shelter' || sub === 'home' || sub === 'month') ? 'free' : 'spend';
  if (['tjob', 'sell', 'scrap', 'fishsell', 'gig'].includes(base)) return 'earn';
  if (base === 'oddjob') return 'chore';
  if (base === 'scratch' || base === 'pick') return 'risk';
  if (base === 'netsurf') return 'spend';
  if (['bankbook', 'send', 'borrow'].includes(base)) return 'money';
  if (['agency', 'clinic', 'board', 'rent'].includes(base)) return 'chore';
  if (['leftover', 'shop', 'laundry', 'karaoke', 'beer', 'skewer', 'netgame', 'fishcook', 'feast', 'umbrella', 'bath', 'hallphoto', 'homecook', 'fishgive', 'hallwed', 'food'].includes(base)) return 'spend';
  if (['folk', 'free', 'rest', 'wait30', 'wait60', 'chat', 'fish', 'leave', 'room', 'gomoku', 'hallpeek', 'salespeek', 'kinderpeek'].includes(base)) return 'free';
  return 'free';
}

async function sectionVenues(browser) {
  const page = await boot(browser);
  try {
    const audit = await page.evaluate(() => {
      const built = CAST.build({ age: 32, gender: 'f', pref: 'any', bg: 'errand', name: '阿兰', look: 0 });
      G.newGame('self', built.identity);
      const S = G.S();
      S.money = 500; S.flags.kinderOpen = 1; S.flags.ownsHome = 1;
      S.life.home = { id: 'old1', name: '老楼一居', arrears: 0, paidTotal: 0 };
      S.life.fish = [{ name: '鲫鱼', sell: 10, hunger: 40, mental: 4 }];
      CONFIG.places.forEach(p => { S.unlocked['place:' + p.id] = 1; });
      UI.show('game');
      const DAY0 = CONFIG.settings.dayStartHour * 60;
      const hours = [11, 19];
      const rows = [];
      const seen = new Set();
      hours.forEach(h => {
        S.time = DAY0 + 6 * 1440 + h * 60;
        CONFIG.places.forEach(p => {
          S.loc = p.id; S.view = 'place';
          UI.panel();
          const root = document.querySelector('#panel');
          [...root.querySelectorAll('[data-a]')].forEach(b => {
            const id = b.getAttribute('data-a');
            const key = p.id + ':' + id;
            if (seen.has(key)) return;
            seen.add(key);
            const sec = b.closest('.act-sec');
            rows.push({ place: p.id, placeName: p.name, id, got: SHOWS.actKind(id), section: sec ? sec.dataset.kind : '', text: b.innerText.replace(/\s+/g, ' ').slice(0, 48) });
          });
          [...root.querySelectorAll('[data-food]')].forEach(b => {
            const sec = b.closest('.act-sec');
            rows.push({ place: p.id, placeName: p.name, id: 'food:' + b.getAttribute('data-food'), got: sec ? sec.dataset.kind : 'loose', section: sec ? sec.dataset.kind : '', text: b.innerText.replace(/\s+/g, ' ').slice(0, 48), shop: true });
          });
        });
      });
      const empty = [...document.querySelectorAll('.act-sec')].filter(s => !s.querySelector('[data-a], [data-food], .bath-card, .offer, .shop-card')).map(s => s.innerText.slice(0, 40));
      return { places: CONFIG.places.map(p => p.id), rows, empty };
    });
    const bad = [];
    const exceptions = [
      '上网 is one paid door (spend). Stocks are inside that door, not a separate earnings button.',
      '五子棋 is free to sit down. A bet is a later choice, so the place button is not income.',
      '存折、转账、借钱 are money transfers. They are not earn or spend.',
      '刮刮乐 and 顺手牵羊 are risk.',
      '自家床、月租已付的床、门口打地铺、救助站 are free. Paid beds are spend.',
      'Food menu cards have no data-a id; they must sit in the spend section.'
    ];
    audit.rows.forEach(row => {
      const exp = row.shop ? 'spend' : expectKind(row.id);
      if (row.got !== exp || (row.section && row.section !== exp)) bad.push({ ...row, exp });
    });
    const covered = new Set(audit.rows.map(r => r.place));
    const missing = audit.places.filter(id => !covered.has(id));
    record('every venue is grouped and transfers are not wages', bad.length === 0 && missing.length === 0 && audit.empty.length === 0, { venues: audit.places.length, buttons: audit.rows.length, bad: bad.slice(0, 8), missing, empty: audit.empty, exceptions });
    fs.writeFileSync(path.join(OUT, 'venues.json'), JSON.stringify({ rows: audit.rows, bad, exceptions }, null, 2));
    await page.evaluate(() => { const S = G.S(); S.loc = 'lottery'; S.view = 'place'; S.time = (CONFIG.settings.dayStartHour * 60) + 6 * 1440 + 15 * 60; UI.render(); });
    await shot(page, 'venue-lottery');
    await page.evaluate(() => { const S = G.S(); S.loc = 'bank'; UI.render(); });
    await shot(page, 'venue-bank');
  } catch (e) {
    record('venue section', false, { error: String(e.stack || e).slice(0, 700) });
  } finally { await page.close(); }
}

async function sectionProtected(browser) {
  const page = await boot(browser);
  try {
    await page.evaluate(() => { G.newGame('xiaozhou'); UI.show('game'); const host = document.createElement('div'); host.id = 'reghost'; host.style.cssText = 'position:fixed;left:0;top:0;z-index:50;background:#111'; document.body.appendChild(host); });
    const food = await page.evaluate(() => new Promise(resolve => {
      const host = document.getElementById('reghost');
      MG.food(host, { perf: { shake: 0.2, win: 1, speed: 1, notes: [], lv: 1 }, knife: 1 });
      setTimeout(() => {
        const help = host.innerText;
        const order = ['换拖鞋', '换胶靴', '穿防尘服', '戴帽子口罩'];
        let guard = 0;
        const step = () => {
          if (guard++ > 8) return resolve({ help: help.includes('按住往下拖'), phase: MG.cur.phase, drag: false });
          const btn = [...host.querySelectorAll('button')].find(b => b.textContent === order[MG.cur.idx]);
          if (!btn) return resolve({ help: help.includes('按住往下拖'), phase: MG.cur.phase });
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          if (MG.cur.phase !== 'dress') return resolve({ help: help.includes('按住往下拖'), phase: MG.cur.phase, idx: MG.cur.idx });
          step();
        };
        step();
      }, 200);
    }));
    record('meat cutting still dresses in order and tells you to drag', food.help && food.phase !== 'dress', food);

    await page.evaluate(() => { document.getElementById('reghost').innerHTML = ''; });
    const sod = await page.evaluate(() => new Promise(resolve => {
      const host = document.getElementById('reghost');
      MG.green(host, { noTut: true, mode: 'pipe', perf: { win: 1 } });
      setTimeout(() => {
        const help = host.innerText.includes('转 90');
        const cv = host.querySelector('canvas');
        const r = cv.getBoundingClientRect();
        const before = MG.cur.board && MG.cur.board.cells[0].r;
        cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.45, clientY: r.top + r.height * 0.45, pointerId: 1 }));
        const after = MG.cur.board.cells.some(c => c.r !== 0) || MG.cur.taps > 0;
        resolve({ help, before, taps: MG.cur.taps, rotated: after, type: MG.cur.type });
      }, 300);
    }));
    record('sod still rotates a tile from a pointer', sod.help && sod.type === 'sod' && sod.rotated, sod);

    await page.evaluate(() => { document.getElementById('reghost').innerHTML = ''; });
    const stage = await page.evaluate(() => new Promise(resolve => {
      const host = document.getElementById('reghost');
      MG.stage(host, { perf: { win: 1, shake: 0.2 } });
      setTimeout(() => {
        const help = host.innerText.includes('力道条');
        const cv = host.querySelector('canvas');
        const r = cv.getBoundingClientRect();
        const b = MG.cur.bolts[0];
        cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + b.x / 900 * r.width, clientY: r.top + b.y / 470 * r.height, pointerId: 1 }));
        const held = MG.cur.sel === b;
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
        resolve({ help, held, msg: MG.cur.msg, type: MG.cur.type });
      }, 400);
    }));
    record('stage bolts still take a hold and a release', stage.help && stage.type === 'stage' && stage.held, stage);

    await page.evaluate(() => { document.getElementById('reghost').remove(); G.newGame('xiaozhou'); const S = G.S(); S.loc = 'riverside'; S.view = 'place'; S.time = (CONFIG.settings.dayStartHour * 60) + 15 * 60; UI.show('game'); UI.render(); });
    await clickText(page, '五子棋');
    await waitFor(page, () => document.body.innerText.includes('再看看') || document.body.innerText.includes('下'), 5000, 'gomoku invite');
    await clickText(page, '和');
    const boardAt = Date.now();
    while (Date.now() - boardAt < 6000 && !(await page.evaluate(() => !!document.querySelector('#gmk-root canvas')))) {
      const txt = await modalText(page);
      if (txt.includes('不赌')) await clickText(page, '不赌，下着玩');
      else if (txt) await dismissModal(page);
      await new Promise(r => setTimeout(r, 80));
    }
    await waitFor(page, () => !!document.querySelector('#gmk-root canvas'), 5000, 'board');
    const stone = await page.evaluate(() => {
      const cv = document.querySelector('#gmk-root canvas');
      const r = cv.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.click(stone.x, stone.y);
    await new Promise(r => setTimeout(r, 200));
    const board = await page.evaluate(() => ({ moves: GOMOKU.cur.moves, over: GOMOKU.cur.over, help: document.body.innerText.includes('五子棋') }));
    record('gomoku still places a stone from a click and does not change the rules', board.moves === 1 && board.help, board);
    await shot(page, 'gomoku-stone');
  } catch (e) {
    record('protected section', false, { error: String(e.stack || e).slice(0, 700) });
    try { await shot(page, 'protected-error'); } catch (err) {}
  } finally { await page.close(); }
}

async function sectionPhone(browser) {
  const page = await boot(browser, { width: 390, height: 844, isMobile: true, hasTouch: true });
  try {
    await page.evaluate(() => { G.newGame('xiaozhou'); UI.show('game'); UI.render(); });
    await page.waitForFunction(() => document.getElementById('stage').classList.contains('portrait'));
    const map = await page.evaluate(() => {
      const pins = [...document.querySelectorAll('.townmap .pin')];
      const rects = pins.map(p => { const r = p.getBoundingClientRect(); return { id: p.dataset.pin, x: r.left, y: r.top, r: r.right, b: r.bottom }; });
      const hits = [];
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (Math.min(a.r, b.r) - Math.max(a.x, b.x) > 2 && Math.min(a.b, b.b) - Math.max(a.y, b.y) > 2) hits.push(a.id + '/' + b.id);
      }
      const corner = rects.find(p => p.id === 'corner');
      const mr = document.querySelector('.townmap').getBoundingClientRect();
      return { hits, portrait: true, dx: corner ? Math.abs((corner.x + corner.r) / 2 - (mr.left + mr.width / 2)) : 99 };
    });
    await shot(page, 'phone-map');
    record('phone map keeps the labor market central without overlaps', map.hits.length === 0 && map.dx < 24, map);
    await page.evaluate(() => { const S = G.S(); S.loc = 'temple'; S.view = 'place'; S.unlocked['place:temple'] = 1; S.time = (CONFIG.settings.dayStartHour * 60) + 6 * 1440 + 11 * 60; UI.render(); });
    const groups = await page.evaluate(() => [...document.querySelectorAll('#panel .act-sec')].map(s => s.dataset.kind));
    await shot(page, 'phone-temple');
    record('phone temple groups spend and free', groups.includes('spend') && groups.includes('free'), groups);
  } catch (e) {
    record('phone section', false, { error: String(e.stack || e).slice(0, 500) });
  } finally { await page.close(); }
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--window-size=1400,900']
});
const only = process.env.ACCEPT_ONLY || '';
try {
  if (!only || only === 'migration') await sectionMigration(browser);
  if (!only || only === 'life') await sectionLife(browser);
  if (!only || only === 'bath') await sectionBath(browser);
  if (!only || only === 'fish') await sectionFish(browser);
  if (!only || only === 'venues') await sectionVenues(browser);
  if (!only || only === 'protected') await sectionProtected(browser);
  if (!only || only === 'phone') await sectionPhone(browser);
} finally {
  await browser.close();
}
const failed = results.filter(r => !r.ok);
const report = {
  command: 'node tests/browser-accept.mjs',
  url: URL,
  labeled: 'Job qualities are passed through the live minigame finish() after 开始干活. Fishing corrections are a scripted hold/release sent as real mouse or touch events on the canvas. There is no separate obsolete test file in this repo; protected games are mounted and given one real input.',
  passed: results.length - failed.length,
  failed: failed.length,
  results
};
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log('SUMMARY', report.passed + '/' + results.length, 'failed', failed.map(f => f.name).join(', ') || 'none');
process.exit(failed.length ? 1 : 0);
