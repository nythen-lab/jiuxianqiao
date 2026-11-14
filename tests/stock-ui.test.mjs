import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/tmp/accept-deps/package.json');
const puppeteer = require('puppeteer-core');
const OUT = '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=/tmp/chrome-stockui-${Date.now()}`]
});
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => window.G && window.NET && window.UI);
await page.evaluate(() => {
  G.newGame('xiaozhou');
  G.S().time += 5 * 1440;
  G.S().loc = 'netcafe';
  G.S().view = 'place';
  G.S().money = 220;
  LIFE.st().bank = 90;
  G.S().stats.stamina = 70; G.S().stats.hunger = 70; G.S().stats.mental = 70;
  G.S().net = { min: 180, posts: [], read: {}, acct: null, flags: {}, daily: {} };
  UI.show('game'); UI.render();
});
async function clickIn(sel) {
  const box = await page.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + Math.min(r.width / 2, 80), y: r.top + r.height / 2 };
  }, sel);
  if (!box) throw new Error('missing ' + sel);
  await page.mouse.click(box.x, box.y);
}
await clickIn('#panel [data-a=netsurf]');
await page.waitForSelector('#nethub');
await clickIn('.net-tab[data-id=stock]');
const gate = await page.evaluate(() => document.querySelector('#nethub').innerText.includes('我要开户'));
ok('day 6 shows the account button', gate);
await clickIn('[data-a=acctstart]');
await page.evaluate(() => document.querySelectorAll('#nethub input[type=radio]').forEach((el, i) => { if (i % 3 === 1) el.click(); }));
await clickIn('[data-a=af1]');
await page.waitForSelector('#net-sign');
const pad = await page.evaluate(() => { const c = document.querySelector('#net-sign'); const r = c.getBoundingClientRect(); return { x: r.left + 40, y: r.top + 50 }; });
await page.mouse.move(pad.x, pad.y); await page.mouse.down();
for (let i = 0; i < 14; i++) await page.mouse.move(pad.x + i * 24, pad.y + Math.sin(i) * 12);
await page.mouse.up();
await clickIn('#af-sign-ok');
await clickIn('[data-a=af3]');
await page.waitForFunction(() => document.body.innerText.includes('证券户现在是 ¥0'), { timeout: 5000 });
const opened = await page.evaluate(() => {
  const t = document.querySelector('#nethub').innerText;
  const body = document.querySelector('.net-body').getBoundingClientRect();
  const note = document.querySelector('.net-msg.bad');
  const nr = note ? note.getBoundingClientRect() : null;
  return { t: t.replace(/\s+/g, ' ').slice(0, 420), note: note && note.textContent, noteIn: !!(nr && nr.top >= body.top && nr.bottom <= body.bottom + 2), cash: G.S().net.acct.cash };
});
ok('opening the account says where the money is and what to press', opened.cash === 0 && opened.note && opened.note.includes('口袋转入') && opened.note.includes('手续费') && opened.noteIn, opened);
await page.screenshot({ path: OUT + '/stock-after-open.png' });
await clickIn('.stk[data-id=yddz]');
const ticket = await page.evaluate(() => {
  const body = document.querySelector('.net-body').getBoundingClientRect();
  const buy = document.querySelector('[data-a=buy]').getBoundingClientRect();
  const qty = document.querySelector('#net-qty').getBoundingClientRect();
  return { buyIn: buy.top >= body.top - 1 && buy.bottom <= body.bottom + 2, qtyIn: qty.bottom <= body.bottom + 2, disabled: document.querySelector('[data-a=buy]').disabled, hint: document.querySelector('.net-det .net-msg').textContent };
});
ok('the buy control is on screen and still pressable', ticket.buyIn && ticket.qtyIn && ticket.disabled === false && ticket.hint.includes('夜灯电子'), ticket);
await page.focus('#net-qty');
await page.keyboard.type('1');
await clickIn('[data-a=buy]');
const denied = await page.evaluate(() => ({ msg: document.querySelector('.net-msg.bad').textContent, hold: G.S().net.acct.hold }));
ok('buying before a transfer explains the fee and the next button', denied.msg.includes('手续费') && denied.msg.includes('口袋转入') && !denied.hold.yddz, denied);
await page.screenshot({ path: OUT + '/stock-need-funds.png' });
const amt = await page.evaluate(() => { const el = document.querySelector('#net-amt'); el.focus(); return true; });
ok('transfer field is there', amt);
await page.focus('#net-amt');
await page.keyboard.type('40');
await clickIn('[data-a=tin][data-id=pocket]');
await page.waitForFunction(() => G.S().net.acct.cash === 40);
await page.focus('#net-qty');
await page.keyboard.type('1');
await clickIn('[data-a=buy]');
await page.waitForFunction(() => G.S().net.acct.hold.yddz && G.S().net.acct.hold.yddz.n === 1);
const bought = await page.evaluate(() => ({ cash: G.S().net.acct.cash, n: G.S().net.acct.hold.yddz.n, fee: G.S().net.acct.fees, msg: document.querySelector('.net-msg').textContent }));
ok('a click buy spends brokerage cash and keeps the share', bought.n === 1 && bought.fee >= 1 && bought.cash < 40 && bought.msg.includes('买入'), bought);
await page.evaluate(() => { document.querySelector('#net-qty').value = '1'; });
await clickIn('[data-a=sell]');
await page.waitForFunction(() => !G.S().net.acct.hold.yddz);
const sold = await page.evaluate(() => ({ hold: G.S().net.acct.hold, cash: G.S().net.acct.cash, msg: document.querySelector('.net-msg').textContent }));
ok('a click sell clears the share and returns cash', !sold.hold.yddz && sold.cash > bought.cash && sold.msg.includes('卖出'), sold);
await page.evaluate(() => G.save());
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.G && window.NET);
const saved = await page.evaluate(() => { G.loadAuto(); return { cash: G.S().net.acct.cash, hold: G.S().net.acct.hold, day: G.S().net.acct.day }; });
ok('the brokerage account reloads', saved.day === 6 && !saved.hold.yddz && saved.cash === sold.cash, saved);

const early = await browser.newPage();
await early.setViewport({ width: 1280, height: 800 });
await early.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'load' });
await early.waitForFunction(() => window.NET);
const day5 = await early.evaluate(() => {
  G.newGame('xiaozhou');
  G.S().loc = 'netcafe'; G.S().view = 'place'; G.S().money = 100;
  G.S().net = { min: 180, posts: [], read: {}, acct: null, flags: {}, daily: {} };
  UI.show('game'); UI.render();
  return G.dayNum();
});
ok('the early page is still before the stock day', day5 < 6, day5);
await early.evaluate(() => document.querySelector('#panel [data-a=netsurf]').click());
await early.waitForSelector('#nethub');
await early.evaluate(() => document.querySelector('.net-tab[data-id=stock]').click());
const earlyText = await early.evaluate(() => document.querySelector('#nethub').innerText);
ok('before day 6 the screen names the day and keeps the button', earlyText.includes('第 6 天') && earlyText.includes('我要开户') && !earlyText.includes('买入'), earlyText.slice(0, 240));

await browser.close();
if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('stock ui checks passed');
