import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire('/tmp/accept-deps/package.json');
const puppeteer = require('puppeteer-core');
const OUT = '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=/tmp/chrome-place-${Date.now()}`]
});
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };

async function boot(width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  await page.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.G && window.TOWN && window.ART && window.UI);
  return page;
}
function pins(page) {
  return page.evaluate(() => ({
    day: G.dayNum(),
    placeNew: Object.assign({}, G.S().placeNew),
    fresh: [...document.querySelectorAll('.pin.fresh')].map(p => ({ id: p.dataset.pin, badge: (p.querySelector('.pnew') || {}).textContent || '', title: p.title, recruit: (p.querySelector('.pbadge') || {}).textContent || '' })),
    cornerRecruit: (document.querySelector('.pin[data-pin=corner] .pbadge') || {}).textContent || '',
    cornerFresh: !!document.querySelector('.pin[data-pin=corner].fresh'),
    netLabel: (document.querySelector('.pin[data-pin=netcafe] b') || {}).textContent || '',
    netClass: (document.querySelector('.pin[data-pin=netcafe]') || {}).className || '',
    screenZ: getComputedStyle(document.querySelector('.screen')).zIndex,
    queue: (G.queue || []).map(q => q.title + ' ' + String(q.text).replace(/<[^>]+>/g, ' '))
  }));
}

const desk = await boot(1280, 800);
await desk.evaluate(() => { G.newGame('xiaozhou'); UI.show('game'); G.S().view = 'map'; UI.render(); });
const day1 = await pins(desk);
ok('a new save does not mark starting places as newly unlocked', day1.fresh.length === 0 && !day1.placeNew.netcafe, day1);
ok('day-one news is not described as a new map place', day1.queue.some(t => t.includes('不是新地点') && t.includes('酒仙桥论坛')) && !day1.queue.some(t => t.includes('地图上新开了')), day1.queue);
ok('recruitment badge and pin geometry stay', (!day1.cornerRecruit || day1.cornerRecruit === '招工中') && day1.cornerFresh === false && day1.netLabel.includes('网吧') && day1.netClass.includes('pull-l') && day1.screenZ === '1', day1);

await desk.evaluate(() => { G.queue.length = 0; G.advance(1440); UI.show('game'); G.S().view = 'map'; UI.render(); });
const day2 = await pins(desk);
const ids = day2.fresh.map(p => p.id).sort();
ok('the new day marks only the places that just opened', ids.includes('bath') && ids.includes('agency') && !ids.includes('netcafe') && !ids.includes('lottery'), day2);
ok('each new pin has the badge and the halo class', day2.fresh.every(p => p.badge === '新解锁' && p.title.includes('新解锁')), day2);
ok('the morning line names the pin and is not a stock unlock', day2.queue.some(t => t.includes('地图上新开了') && t.includes('新解锁') && t.includes('老澡堂') && t.includes('劳务中介')) && !day2.queue.some(t => t.includes('证券')), day2.queue);

const opened = await desk.evaluate(() => {
  const before = JSON.stringify(G.S().placeNew);
  G.S().view = 'place'; UI.render();
  UI.toMap();
  return { before, after: JSON.stringify(G.S().placeNew), still: !!document.querySelector('.pin.fresh') };
});
ok('opening the map does not clear the new-place mark', opened.before === opened.after && opened.still, opened);

await desk.screenshot({ path: OUT + '/place-fresh-desktop.png' });
const motion = await desk.evaluate(() => getComputedStyle(document.querySelector('.pin.fresh')).animationName);
ok('the halo moves when motion is allowed', motion === 'freshhalo', motion);
await desk.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
const still = await desk.evaluate(() => {
  const pin = document.querySelector('.pin.fresh');
  const cs = getComputedStyle(pin);
  return { animation: cs.animationName, shadow: cs.boxShadow, badge: pin.querySelector('.pnew').textContent };
});
ok('reduced motion keeps a static halo and the badge', still.animation === 'none' && still.shadow !== 'none' && still.badge === '新解锁', still);

await desk.evaluate(() => { G.queue.length = 0; });
const box = await desk.evaluate(() => {
  const el = document.querySelector('.pin[data-pin=bath]');
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  return { x: r.left + Math.min(16, r.width / 2), y: r.top + Math.min(16, r.height / 2) };
});
await desk.mouse.click(box.x, box.y);
await desk.waitForFunction(() => !G.S().placeNew.bath, { timeout: 4000 });
await desk.evaluate(() => UI.toMap());
const afterEnter = await pins(desk);
ok('the first entry clears only that place', !afterEnter.placeNew.bath && afterEnter.placeNew.agency && afterEnter.fresh.some(p => p.id === 'agency') && !afterEnter.fresh.some(p => p.id === 'bath'), afterEnter);

const locked = await desk.evaluate(() => {
  const before = JSON.stringify(G.S().placeNew);
  UI.go('lottery');
  return { before, after: JSON.stringify(G.S().placeNew), loc: G.S().loc };
});
ok('a locked place does not count as a visit', locked.before === locked.after && locked.loc !== 'lottery', locked);

await desk.evaluate(() => G.save());
await desk.reload({ waitUntil: 'load' });
await desk.waitForFunction(() => window.G && window.UI);
await desk.evaluate(() => { G.loadAuto(); UI.show('game'); G.S().view = 'map'; UI.render(); });
const reloaded = await pins(desk);
ok('the remaining mark survives reload', reloaded.placeNew.agency && !reloaded.placeNew.bath && reloaded.fresh.some(p => p.id === 'agency'), reloaded);

const phone = await boot(390, 844);
await phone.evaluate(() => {
  G.newGame('xiaozhou');
  G.advance(1440);
  G.queue.length = 0;
  UI.show('game');
  G.S().view = 'map';
  UI.render();
});
await phone.screenshot({ path: OUT + '/place-fresh-phone.png' });
const mobile = await phone.evaluate(() => {
  const pin = document.querySelector('.pin.fresh');
  const badge = pin && pin.querySelector('.pnew');
  const br = badge ? badge.getBoundingClientRect() : null;
  return { portrait: document.querySelector('#stage').classList.contains('portrait'), id: pin && pin.dataset.pin, badge: badge && badge.textContent, visible: !!(br && br.width > 0 && br.height > 0) };
});
ok('the phone map shows the badge on a portrait pin', mobile.portrait && mobile.badge === '新解锁' && mobile.visible, mobile);

const oldPage = await boot(1280, 800);
await oldPage.evaluate(() => {
  G.newGame('xiaozhou');
  const S = G.S();
  S.time += 9 * 1440;
  S.unlockInit = true;
  S.unlocked = S.unlocked || {};
  ['netcafe', 'agency', 'bath', 'lottery', 'clinic', 'temple', 'riverside'].forEach(id => { S.unlocked['place:' + id] = 1; });
  delete S.placeNew;
  G.save();
});
await oldPage.reload({ waitUntil: 'load' });
await oldPage.waitForFunction(() => window.G && window.UI);
await oldPage.evaluate(() => { G.loadAuto(); UI.show('game'); G.S().view = 'map'; UI.render(); });
const migrated = await pins(oldPage);
ok('an old save does not light up places it already had', Object.keys(migrated.placeNew).length === 0 && migrated.fresh.length === 0, migrated);
await oldPage.evaluate(() => { G.queue.length = 0; G.advance(1440); UI.show('game'); G.S().view = 'map'; UI.render(); });
const later = await pins(oldPage);
ok('the next day still does not restamp historic places', !later.fresh.some(p => ['netcafe', 'agency', 'bath', 'lottery', 'clinic', 'temple', 'riverside'].includes(p.id)), later);

await browser.close();
if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('place marker checks passed');
