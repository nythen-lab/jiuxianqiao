import { createRequire } from 'module';
const require = createRequire('/tmp/accept-deps/package.json');
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', `--user-data-dir=/tmp/chrome-print-${Date.now()}`]
});
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.evaluateOnNewDocument(() => { window.GP_REAL = true; window.FX_MUTE = true; });
await page.setViewport({ width: 1400, height: 900 });
await page.goto('http://127.0.0.1:8766/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => window.GP && window.G);
await page.evaluate(() => { G.newGame('xiaozhou'); G.S().flags.gp_seen_print = 1; UI.show('game'); UI.render(); GP.play('print'); });
await page.waitForFunction(() => window.GP.cur && GP.cur.id === 'print' && GP.cur.env.phase === 'play', { timeout: 8000 });
await page.keyboard.press('d');
const key = await page.evaluate(() => ({ press: GP.cur.game.press[0], miss: GP.cur.game.hits.miss, stage: GP.cur.game.stage }));
ok('D lights the cyan lane through the real key path', key.press > 0, key);
await page.keyboard.press('ArrowDown');
const arrow = await page.evaluate(() => GP.cur.game.press[1] > 0);
ok('arrow down lights the red lane', arrow);
const touch = await page.evaluate(() => { GP.cur.game.pointer('down', 160, 420); return GP.cur.game.press[0] > 0; });
ok('a lane press lights the stamp', touch);
const scored = await page.evaluate(() => {
  const g = GP.cur.game;
  const before = g.hits.miss;
  g.stage = 'practice';
  g.notes.push({ t: g.songNow() - 1, lane: 0, state: 0, practice: true, fall: 1.4 });
  g.update(0.05);
  const afterPractice = g.hits.miss;
  g.stage = 'work';
  g.notes.push({ t: g.songNow() - 1, lane: 1, state: 0, practice: false, fall: 1.4 });
  g.update(0.05);
  return { before, afterPractice, afterWork: g.hits.miss, quality: GP.printQuality(g.hits) };
});
ok('practice miss is not scored and a work miss counts once', scored.afterPractice === scored.before && scored.afterWork === scored.before + 1 && scored.quality < 1, scored);
const clock = await page.evaluate(() => {
  const g = GP.cur.game;
  const t0 = g.songNow();
  return new Promise(resolve => setTimeout(() => resolve({
    state: g.clock.ctx && g.clock.ctx.state,
    advanced: g.songNow() - t0,
    heard: g.heard,
    visual: g.clock.visual,
    bpm: g.bpm,
    chords: g.allowChords
  }), 200));
});
ok('the chart clock is the audio context when it is running', clock.advanced > 0.05 && clock.bpm === 72 && clock.chords === false, clock);
await browser.close();
if (bad) process.exit(1);
console.log('print input checks passed');
