import fs from 'fs';
import vm from 'vm';
const sandbox = { window: {}, document: { createElement() { return { getContext() { return { scale() {}, measureText() { return { width: 0 }; }, font: '' }; }, width: 0, height: 0 }; } } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(new URL('../js/gp.js', import.meta.url), 'utf8'), sandbox);
const GP = sandbox.window.GP;
let bad = 0;
const ok = (n, c, extra) => { if (!c) { bad++; console.error('FAIL', n, extra === undefined ? '' : JSON.stringify(extra)); } else console.log('ok', n); };
const board = { x: 252, y: 66, w: 10 * 27, h: 16 * 27 };
const legend = GP.hintPill(480);
ok('the on-canvas legend would cover the crate board', GP.boxesOverlap(legend, board), { legend, boardBottom: board.y + board.h, pillTop: legend.y });
const above = { x: 252, y: 66, w: 270, h: 390 };
ok('a board that stops above the legend does not intersect it', !GP.boxesOverlap(GP.hintPill(480), above));
ok('external hints are taken off the board', GP.hintHitsPlay({ hintExternal: true, playBox: board }, '← → 移动', null));
ok('a short hint still leaves a high playfield alone', !GP.hintHitsPlay({ playBox: above }, '短', { font: '', measureText() { return { width: 32 }; } }));
if (bad) { console.error(bad + ' failed'); process.exit(1); }
console.log('move layout checks passed');
