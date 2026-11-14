import fs from 'fs';
import vm from 'vm';

const gp = fs.readFileSync(new URL('../js/gp.js', import.meta.url), 'utf8');
const fish = fs.readFileSync(new URL('../js/gp-fish.js', import.meta.url), 'utf8');
const sandbox = { window: {}, CONFIG: { fishKinds: [{ name: '鲫鱼' }, { name: '鲤鱼' }, { name: '草鱼' }, { name: '小黑鱼' }] }, console, Math, performance: { now: () => 0 } };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(gp + '\n' + fish, sandbox);
const GP = sandbox.GP;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function play(kindD, mode, seed) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const g = GP.fishBoot({ n: '鲫鱼', d: kindD }, rnd);
  g.phase = 'fight'; g.prog = 0.36; g.biteAt = 0;
  const obs = [];
  let held = false, next = 0.28, t = 0;
  const dt = 1 / 60;
  const delay = mode === 'slow' ? 0.55 : mode === 'fast' ? 0.08 : 0.32;
  const decideEvery = mode === 'slow' ? 0.2 : 0.12;
  while (t < 28 && g.phase === 'fight') {
    obs.push({ t, fish: g.fish, hook: g.hook, hh: g.hh });
    if (mode === 'hold') { g.held = true; g.drag = null; }
    else if (mode === 'never') { g.held = false; g.drag = null; }
    else if (mode === 'drag') {
      const past = obs.filter(o => o.t <= t - delay).pop() || obs[0];
      g.drag = past.fish; g.held = false;
    } else if (t >= next) {
      const past = obs.filter(o => o.t <= t - delay).pop() || obs[0];
      const mid = past.hook + past.hh / 2;
      const err = past.fish - mid;
      if (err < -16) held = true; else if (err > 16) held = false;
      g.held = held; g.drag = null;
      next += decideEvery;
    }
    GP.fishStep(g, dt);
    t += dt;
  }
  return { caught: !!g.caught || g.phase === 'done' && g.prog >= 1, prog: g.prog, t, phase: g.phase };
}

function missBite() {
  const g = GP.fishBoot({ n: '鲫鱼', d: 0.4 }, Math.random);
  g.biteAt = 0.2; g.mercy = 1;
  let lost = false;
  for (let i = 0; i < 400 && g.phase !== 'lost'; i++) {
    const ev = GP.fishStep(g, 0.05);
    if (ev.lost) lost = true;
  }
  return { lost: g.phase === 'lost' || lost, mercyUsed: g.mercy === 0 };
}

const rates = {};
for (const mode of ['human', 'slow', 'fast', 'drag', 'hold']) {
  let c = 0; const N = mode === 'human' || mode === 'drag' ? 24 : 12;
  for (let i = 0; i < N; i++) if (play(0.4, mode, 1000 + i * 17).caught) c++;
  rates[mode] = { caught: c, n: N, rate: Math.round(c / N * 100) };
}
const hard = { caught: 0, n: 16 };
for (let i = 0; i < 16; i++) if (play(0.7, 'human', 3000 + i * 13).caught) hard.caught++;
const miss = missBite();
console.log(JSON.stringify({ rates, hard, miss }, null, 2));
const humanOk = rates.human.rate >= 70;
const slowSome = rates.slow.rate >= 25;
const holdFails = rates.hold.rate <= 40;
const missFails = miss.lost;
if (!humanOk || !slowSome || !holdFails || !missFails) {
  console.error('FISH LIMITS', { humanOk, slowSome, holdFails, missFails });
  process.exit(1);
}
console.log('fish normal-rate checks passed');
