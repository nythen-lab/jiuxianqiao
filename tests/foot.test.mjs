import fs from 'fs';
import vm from 'vm';
const sandbox = { window: {} };
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../js/cast.js', import.meta.url), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(new URL('../js/foot.js', import.meta.url), 'utf8'), ctx);
const C = sandbox.window.CAST, F = sandbox.window.FOOT;
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };

const save = { money: 10, earned: 2500, album: [], flags: {}, log: [{ text: 'a' }, { text: 'b' }], jobsDone: { courier: 1 }, social: { people: {} } };
C.migrateSave(save);
const first = C.claim(save);
ok('milestones still grant once from recorded wages', first.map(m => m.id).join() === 'm1000,m2000');
const cash = save.money;
F.migrate(save);
ok('an existing save does not replay onboarding', save.flags.introSeen === 1);
ok('claimed miles are copied into the album without a second reward', save.money === cash && save.album.filter(e => e.id === 'wage_m1000' || e.id === 'wage_m2000').length === 2 && C.claim(save).length === 0);
const cards = save.album.length;
F.migrate(save);
ok('album backfill does not duplicate', save.album.length === cards);

const fresh = { flags: {}, album: [], incomeMiles: {}, wageBook: 0, social: { people: {} } };
ok('a new game has no paid job yet', !F.paidJob(fresh, { id: 'x', name: '活' }, 0) && !fresh.flags.footJob);
ok('a new game has no treat yet', !fresh.flags.footTreat);
const linked = { flags: {}, album: [{ id: 'job_courier', kind: 'job', amount: 180, title: '第一次干「快递」' }] };
F.paidJob(linked, { id: 'courier', name: '快递' }, 180);
ok('first paid job uses the existing album card', linked.flags.footJob === 'job_courier' && linked.album.length === 1);
F.paidJob(linked, { id: 'site', name: '工地' }, 200);
ok('a second paid job does not add another footprint', linked.flags.footJob === 'job_courier' && linked.album.length === 1);

const meal = { flags: {}, album: [] };
F.treat(meal, { title: '自己请了一顿', caption: '吃了面条', amount: 14 });
F.treat(meal, { title: '再来一顿', amount: 20 });
ok('the first treat is recorded once', meal.album.length === 1 && meal.album[0].amount === 14 && meal.flags.footTreat === 'foot_treat');

const book = { wageBook: 1000, earned: 1000 };
C.note(book, 40, 'reward');
C.note(book, 200, 'deposit');
ok('rewards and deposits do not erase or inflate the book', book.wageBook === 1000);
C.note(book, 50, 'job');
ok('later wages still advance it', book.wageBook === 1050);

const known = { flags: {}, album: [], incomeMiles: { m1000: 1 }, social: { people: { hejie: { friend: 20, affection: 0, bond: 'none' } } }, earned: 1000, wageBook: 1000 };
F.migrate(known);
ok('known friendship is commemorated without inventing a job or a treat', known.flags.footFriend === 'foot_friend' && !known.flags.footJob && !known.flags.footTreat && known.album.some(e => e.id === 'foot_friend'));

if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('foot checks passed');
