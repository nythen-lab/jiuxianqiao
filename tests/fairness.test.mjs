import fs from 'fs';
import vm from 'vm';

const code = fs.readFileSync(new URL('../js/stamina.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const STA = sandbox.window.STA;
let failed = 0;
const eq = (name, cond, extra) => {
  if (!cond) { failed++; console.error('FAIL', name, extra || ''); }
  else console.log('ok', name);
};

eq('fee leaves food money', STA.faintFee(200) <= 60 && STA.faintFee(200) <= 200 - 25);
eq('fee zero when broke', STA.faintFee(0) === 0);
eq('fee never exceeds pocket', STA.faintFee(18) <= 18);
eq('large pocket is capped', STA.faintFee(5000) <= 60 && STA.faintFee(5000) < 5000);

eq('poor craft adds nothing', STA.perfBonus(0.2, 40) === 0);
eq('mid craft is between', STA.perfBonus(0.7, 40) > 0 && STA.perfBonus(0.7, 40) < 40);
eq('high craft pays the pool', STA.perfBonus(1, 40) === 40);
eq('high beats mid beats low', STA.perfBonus(0.95, 70) > STA.perfBonus(0.65, 70) && STA.perfBonus(0.65, 70) > STA.perfBonus(0.3, 70));
eq('bonus never cuts base', STA.perfBonus(0, 70) === 0);

const faint = STA.outlook({ sta: 40, maxSta: 100, hunger: 70, staCost: -58, tired: 1, awakeHours: 1.4, workHours: 12, workHungerPerHour: -4, awakeStaPerHour: -2.2, mealHunger: 54, force: 10, noJob: 15, hungerForce: 8 });
eq('low stamina shift warns faint', faint.risk === 'faint' && faint.remain <= 10, faint);

const ok = STA.outlook({ sta: 90, maxSta: 100, hunger: 70, staCost: -58, tired: 1, awakeHours: 1.4, workHours: 12, workHungerPerHour: -4, awakeStaPerHour: -2.2, mealHunger: 54, force: 10, noJob: 15, hungerForce: 8 });
eq('rested shift is not a faint', ok.risk !== 'faint' && ok.remain > 15, ok);

const day = STA.daySketch();
eq('sim day recovers with sleep', day.afterSleep > day.afterJob && day.afterSleep >= 70, day);
eq('sim paycheck covers bed meal misc', day.left > 80, day);
console.log('SIMULATION', JSON.stringify(day));

if (failed) { console.error(failed + ' failed'); process.exit(1); }
console.log('all fairness checks passed');
