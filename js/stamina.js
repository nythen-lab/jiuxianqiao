// 体力预估、晕倒费用、手艺加成。纯计算，方便测试。不改小游戏操作。
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // 卫生室费用：最多拿走口袋的一小部分，并尽量留下吃饭的钱。不碰存折。
  function faintFee(money) {
    money = Math.max(0, Math.floor(Number(money) || 0));
    if (money <= 0) return 0;
    const keep = money >= 30 ? 25 : (money >= 12 ? 8 : 0);
    const pct = Math.floor(money * 0.12);
    const ask = Math.min(60, Math.max(money >= 80 ? 16 : 0, pct));
    return Math.max(0, Math.min(money - keep, ask));
  }
  // 干完一整班：说好的工钱是底。手艺只加不减。q<=0.4 不加，q>=1 加满 qualityPay。
  function perfBonus(quality, pool) {
    const q = clamp(quality == null ? 0 : Number(quality), 0, 1);
    const t = clamp((q - 0.4) / 0.6, 0, 1);
    return Math.round(t * (Number(pool) || 0) / 5) * 5;
  }
  // 开工前的估计。staCost 是这份活写好的体力消耗（负数）。
  function outlook(o) {
    o = o || {};
    const tired = o.tired == null ? 1 : o.tired;
    const staHit = Math.round((o.staCost || 0) * tired);
    const awakeHit = Math.round((o.awakeStaPerHour || 0) * (o.awakeHours || 0));
    const remain = clamp((o.sta || 0) + staHit + awakeHit, 0, o.maxSta || 100);
    const hungerLeft = clamp((o.hunger || 0) + (o.workHungerPerHour || 0) * (o.workHours || 0) + (o.mealHunger || 0), 0, 100);
    let risk = 'ok';
    if (remain <= (o.force == null ? 10 : o.force)) risk = 'faint';
    else if (remain < (o.noJob == null ? 15 : o.noJob)) risk = 'nowork';
    else if (hungerLeft <= (o.hungerForce == null ? 8 : o.hungerForce)) risk = 'hungry';
    return { staHit, awakeHit, remain: Math.round(remain), hungerLeft: Math.round(hungerLeft), risk };
  }
  // 标明是推演，不是某一次真实游玩。数字来自当前配置的快递班 + 上铺 + 一顿面。
  function daySketch(cfg) {
    cfg = cfg || {};
    const sta0 = cfg.sta0 == null ? 90 : cfg.sta0;
    const jobSta = cfg.jobSta == null ? -58 : cfg.jobSta;
    const awakeH = cfg.awakeH == null ? 5 : cfg.awakeH;
    const awakeRate = cfg.awakeRate == null ? -2.2 : cfg.awakeRate;
    const sleepH = cfg.sleepH == null ? 8 : cfg.sleepH;
    const sleepRate = cfg.sleepRate == null ? 10 : cfg.sleepRate;
    const afterJob = Math.max(0, sta0 + jobSta + awakeH * awakeRate);
    const afterSleep = Math.min(cfg.maxSta || 100, afterJob + sleepH * sleepRate);
    const wage = cfg.wage == null ? 235 : cfg.wage;
    const cut = cfg.cut == null ? 10 : cfg.cut;
    const bed = cfg.bed == null ? 22 : cfg.bed;
    const meal = cfg.meal == null ? 14 : cfg.meal;
    const misc = cfg.misc == null ? 5 : cfg.misc;
    return {
      label: 'simulation',
      afterJob: Math.round(afterJob),
      afterSleep: Math.round(afterSleep),
      income: wage - cut,
      living: bed + meal + misc,
      left: wage - cut - bed - meal - misc,
      note: '推演：干完快递、醒着再耗几小时、上铺睡八小时。不是实测对局。'
    };
  }
  window.STA = { faintFee, perfBonus, outlook, daySketch };
})();
