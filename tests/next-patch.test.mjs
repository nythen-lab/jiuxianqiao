import fs from 'fs';
import vm from 'vm';
const noop = new Proxy(function () {}, { get: () => noop, apply: () => noop });
const sandbox = {
  window: {},
  document: { createElement: () => ({ width: 0, height: 0, getContext: () => noop }), addEventListener() {}, removeEventListener() {} },
  performance: { now: () => 0 },
  AudioContext: function () { this.currentTime = 0; this.state = 'running'; this.createGain = () => ({ gain: { value: 1 }, connect() {} }); this.createOscillator = () => ({ frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }); this.destination = {}; }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ['js/gp.js', 'js/gp-errand.js', 'js/gp-skewer.js', 'js/gp-print.js']) {
  vm.runInContext(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'), sandbox);
}
const GP = sandbox.window.GP;
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inside = (a, b) => a.x >= b.x - 0.1 && a.y >= b.y - 0.1 && a.x + a.w <= b.x + b.w + 0.1 && a.y + a.h <= b.y + b.h + 0.1;

ok('delivery starts slow', GP.errandPace(0, true) === 0.48 && GP.errandPace(0, false) === 0.48);
ok('delivery speeds up only after drops and stays capped', GP.errandPace(2, false) < GP.errandPace(1, false) && GP.errandPace(30, false) === 0.2);

const lay = GP.skewerLayout();
ok('every skewer tile sits inside the board', lay.tiles.every(t => inside(t, lay.board)));
ok('collected skewers stay inside the grill', lay.rack.every(s => inside(s, lay.grill)));
ok('stats sit below the grill and clear of the hint', lay.stats.y >= lay.grill.y + lay.grill.h && !overlap(lay.stats, lay.hint) && lay.hint.y >= lay.stats.y + lay.stats.h);
ok('paths may use the outside ring, tiles do not', lay.tiles.every(t => t.c >= 1 && t.c <= 8 && t.r >= 1 && t.r <= 6));

const slow = GP.printWindows(72), fast = GP.printWindows(104);
ok('early rhythm window is wider than the later one', slow.good > fast.good && slow.perfect > fast.perfect);
ok('beginner chart has no chords and stays slow', !GP.printPace(0).chords && GP.printPace(8).bpm === 78 && GP.printPace(16).chords && GP.printPace(80).bpm === 104);
const note = [{ lane: 0, t: 1, state: 0 }];
ok('a near press is late, not a miss and not perfect', GP.printJudge(note, 0, 1.2, slow).kind === 'late');
note[0].state = 2;
ok('the same sheet is not judged twice', GP.printJudge(note, 0, 1.2, slow).kind === 'stray');
ok('a press far from the sheet is only an empty press', GP.printJudge([{ lane: 0, t: 1, state: 0 }], 0, 1.6, slow).kind === 'stray');
const q = GP.printQuality({ perfect: 10, good: 11, miss: 0, stray: 0, maxCombo: 8 });
ok('settlement uses only scored sheets', q > 0.7 && q <= 1);
ok('practice is not inside the scored object', GP.printQuality({ perfect: 0, good: 0, miss: 0, stray: 0, maxCombo: 0 }) === 0);

if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('next patch checks passed');
