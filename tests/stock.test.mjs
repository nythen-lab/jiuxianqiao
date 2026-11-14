import fs from 'fs';
import vm from 'vm';

const sandbox = {
  console,
  CONFIG: {},
  document: { querySelector() { return null; }, addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  navigator: { webdriver: true }
};
sandbox.window = sandbox;
sandbox.state = {
  day: 6, money: 200, time: 0,
  life: { bank: 80, ledger: [] },
  net: null,
  stats: {}, attrs: {}, flags: {}
};
sandbox.G = {
  S: () => sandbox.state,
  dayNum: () => sandbox.state.day,
  advance() {},
  log() {},
  change() {},
  season() { return { id: 'autumn' }; }
};
sandbox.TOWN = { available(k) { return sandbox.state.day >= (k === 'stock' ? 6 : 1); } };
sandbox.LIFE = { st: () => sandbox.state.life };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../data/net.js', import.meta.url), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(new URL('../js/net.js', import.meta.url), 'utf8'), sandbox);
const NET = sandbox.NET;
const N = sandbox.CONFIG.net;
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };

function reset(over) {
  sandbox.state.day = 6;
  sandbox.state.money = 200;
  sandbox.state.life.bank = 80;
  sandbox.state.life.ledger = [];
  sandbox.state.net = { min: 180, posts: [], read: {}, acct: null, flags: {}, daily: {} };
  if (over) Object.assign(sandbox.state.net, over);
}

reset();
ok('no account cannot buy', NET.buy('jxsp', '1').err === '先开户。');
ok('day gate blocks a fresh account', (() => { sandbox.state.day = 5; const r = NET.openAccount({ signed: true, risk: 'steady', name: '本人' }); sandbox.state.day = 6; return r.err === '证券开户第6天开放。' && !sandbox.state.net.acct; })());
const opened = NET.openAccount({ signed: true, risk: 'steady', name: '本人' });
ok('fresh account opens with no brokerage cash', opened.ok && sandbox.state.net.acct.cash === 0 && sandbox.state.money === 190);
const unfunded = NET.buy('yddz', '1');
ok('fresh account names the fee and the transfer', unfunded.err && unfunded.err.includes('手续费') && unfunded.err.includes('口袋转入') && unfunded.err.includes('存折转入') && !sandbox.state.net.acct.hold.yddz);
ok('zero shares are rejected', NET.buy('yddz', '0').err.includes('大于 0'));
ok('a fraction is rejected', NET.buy('yddz', '1.5').err.includes('整数') && NET.buy('yddz', '1。5').err.includes('整数'));
ok('a negative is rejected', NET.buy('yddz', '-2').err.includes('负数'));
ok('an overlarge quantity is rejected', NET.buy('yddz', '1234567890').err.includes('太大'));

const px = NET.price('yddz');
const one = NET.shareCost('yddz', 1);
sandbox.state.net.acct.cash = one.amt;
const short = NET.buy('yddz', '1');
ok('price without the fee is not enough', short.err && short.err.includes('手续费') && short.err.includes('口袋转入') && sandbox.state.net.acct.cash === one.amt && !sandbox.state.net.acct.hold.yddz, { px, one, short });

sandbox.state.net.acct.cash = one.total;
sandbox.state.net.min = N.costs.trade - 1;
const timed = NET.buy('yddz', '1');
ok('expired net time does not take the money', timed.err && timed.err.includes('上网时间') && sandbox.state.net.acct.cash === one.total && !sandbox.state.net.acct.hold.yddz, timed);

sandbox.state.net.min = 100;
const bought = NET.buy('yddz', '1');
ok('a funded fresh account can buy one share', bought.ok && bought.fee >= 1 && sandbox.state.net.acct.hold.yddz.n === 1 && sandbox.state.net.acct.cash === 0, bought);

reset();
sandbox.state.net.acct = { day: 3, cash: 100, hold: { jxsp: { n: 2, cost: 40 } }, fees: 1, realized: 0, risk: 'steady' };
const max = NET.maxShares('jxsp');
ok('a preexisting account can buy up to the fee-aware maximum', max >= 1 && NET.buy('jxsp', String(max + 1)).err.includes('最多能买 ' + max));
const more = NET.buy('jxsp', '1');
ok('a preexisting holding grows', more.ok && sandbox.state.net.acct.hold.jxsp.n === 3, more);
const cashAfter = sandbox.state.net.acct.cash;
const sold = NET.sell('jxsp', '1');
ok('selling returns cash after the fee', sold.ok && sandbox.state.net.acct.hold.jxsp.n === 2 && sandbox.state.net.acct.cash > cashAfter, sold);
ok('selling more than you hold fails', NET.sell('jxsp', '9').err.includes('最多'));
ok('the account survives a save round trip', JSON.parse(JSON.stringify(sandbox.state.net.acct)).hold.jxsp.n === 2);

if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('stock checks passed');
