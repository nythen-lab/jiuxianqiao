import fs from 'fs';
import vm from 'vm';
function load(file, sandbox) {
  vm.runInContext(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), vm.createContext(sandbox));
}
const sandbox = { window: {} };
load('../js/stamina.js', sandbox);
load('../js/pay.js', sandbox);
const PAY = sandbox.window.PAY, STA = sandbox.window.STA;
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : extra); } else console.log('ok', n); };
const perf = (q, pool) => STA.perfBonus(q, pool);
function job(over) {
  return PAY.settleJob(Object.assign({ wage: 200, qualityPay: 40, skillLv: 0, perf }, over));
}
const low = job({ completed: true, quality: 0.2 });
const mid = job({ completed: true, quality: 0.7 });
const high = job({ completed: true, quality: 1 });
ok('poor craft does not cut the promised wage', low.pay === 200 && low.bonus === 0);
ok('mid craft is between', mid.bonus > low.bonus && mid.bonus < high.bonus && mid.pay === 220);
ok('high craft pays the pool', high.bonus === 40 && high.pay === 240);
ok('lines sum to credited cash', [low, mid, high].every(x => x.sum === x.pay && x.lines.reduce((a, l) => a + l.amt, 0) === x.pay));
const skilled = job({ completed: true, quality: 1, skillLv: 4, fines: 10, cut: 15 });
ok('skill fine and cut stay in the sum', skilled.pay === 200 + 40 + 10 - 10 - 15 && skilled.sum === skilled.pay, skilled);
const none = job({ completed: false, quitPay: 'none', hoursDone: 4 });
ok('quit none pays nothing', none.pay === 0 && none.sum === 0);
const hourly = job({ completed: false, quitPay: 'hourly', hourly: 15.8, hoursDone: 4.2 });
ok('hourly uses the stated rate', hourly.pay === Math.round(3 * 15.8) && hourly.sum === hourly.pay, hourly);
const early = job({ noPay: true, quitPay: 'hourly', hourly: 15.8, hoursDone: 0 });
ok('leaving before start pays nothing', early.pay === 0);
const rolled = job({ completed: false, quitPay: 'roll', quitFrac: 0 });
const part = job({ completed: false, quitPay: 'roll', quitFrac: 0.45 });
ok('gig-style quit can be zero or a fraction', rolled.pay === 0 && part.pay === Math.round(200 * 0.45) && part.sum === part.pay);
const held = job({ completed: true, quality: 1, unpaid: true });
ok('unpaid credits zero and the lines still balance', held.pay === 0 && held.sum === 0);
const gigLow = PAY.settleGig({ base: 30, mult: 0.45 + 0.85 * 0.2, quit: false, tip: 0 });
const gigHigh = PAY.settleGig({ base: 30, mult: 0.45 + 0.85 * 1, quit: false, tip: 6 });
ok('gig quality changes pay', gigHigh.pay > gigLow.pay + 10 && gigLow.sum === gigLow.pay && gigHigh.sum === gigHigh.pay, { gigLow, gigHigh });
const gigQuit = PAY.settleGig({ base: 30, mult: 1, quit: true, frac: 0, tip: 8 });
ok('quit gig drops the tip and can pay zero', gigQuit.pay === 0 && gigQuit.sum === 0);
console.log(JSON.stringify({ low: low.pay, mid: mid.pay, high: high.pay, gigLow: gigLow.pay, gigHigh: gigHigh.pay }));
if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('pay checks passed');
