// ===================== 基础设定（数值都可以直接改） =====================
// v0.6：数值有真实后果（强制睡觉 / 饿到停工 / 技能改变小游戏），银行随时转账，切肉小游戏重做。
window.CONFIG = window.CONFIG || {};

CONFIG.settings = {
  title: "勇闯酒仙桥",
  subtitle: "网页小样 v1.0.5",
  openCalendar: true,       // true = 没有强制结算日；日历一直往前走
  // 软提示用（不强制结束）：建议体验天数，写在目标卡上
  softPaceTip: "没有天数上限，想玩多久玩多久。撑不住了才算输。",
  dayStartHour: 4,          // 每天从凌晨几点算起（04:00 慢慢苏醒）
  arriveTime: "04:30",      // 第一天几点到达酒仙桥

  // 每小时自然消耗（醒着的时候）
  perHourAwake: { stamina: -2.2, mental: -0.6, hunger: -3.5 },
  perHourWorkHunger: -4,    // 干活时每小时饿多少（管饭的活会补一顿）
  starving: { stamina: -4, mental: -2 },
  perHourSleepHunger: -2.5,
  // maxTimes: 0 表示晕倒只进卫生室，不因次数结束游戏。费用由 STA.faintFee 按口袋封顶。
  collapse: { cost: 60, hours: 8, maxTimes: 0 },

  // v0.6 状态门槛：低于这些数，就会有看得见的后果
  thresholds: {
    staminaLow: 30,      // ≤30：手抖、录取率降、小游戏判定区变窄、走路变慢
    staminaForce: 10,    // ≤10：眼前一黑，强制倒下睡觉（时间直接跳过去）
    staminaNoJob: 15,    // <15：招工的人不要你，也上不了车
    hungerLow: 30,       // ≤30：体力恢复减半、手抖、录取率降
    hungerForce: 8,      // ≤8：饿得发昏，必须停下来吃东西或歇着
    hungerNoJob: 10,     // <10：饿得站不住，不能去干活
    starveCollapseHours: 8, // 饿到 0 连续多少小时就饿晕（算一次晕倒）
    mentalLow: 25,       // ≤25：心里乱，小游戏手抖、录取率降
    mentalForce: 8,      // ≤8：蹲在路边缓不过来，被迫歇两小时
    cleanLow: 25,        // ≤25：身上有味儿，厂里车间不太要你
    moneyLow: 20         // <20：住不起床位，只能睡街上
  },
  // 银行转账手续费（ATM 跨行汇款）
  bank: { fee: 2, feeText: "跨行手续费 ¥2 / 笔", minutesPhone: 10, minutesSlow: 30 },

  windows: {
    morning: { from: "04:00", to: "07:00", label: "早高峰 · 抢白班" },
    evening: { from: "16:00", to: "19:30", label: "晚高峰 · 抢夜班" }
  },

  phases: [
    { from: 0,  to: 4,  name: "深夜" },
    { from: 4,  to: 5,  name: "天还黑着" },
    { from: 5,  to: 9,  name: "早高峰" },
    { from: 9,  to: 12, name: "上午" },
    { from: 12, to: 16, name: "午后" },
    { from: 16, to: 20, name: "晚高峰" },
    { from: 20, to: 24, name: "夜里" }
  ],

  // 特殊日子：按绝对天数触发一次（开放日历仍按第 N 天算）
  // 寒暑假学生工压价；购物节快递涨价
  specialDays: [
    { days: [5, 6], text: "放假了，一大帮学生工涌进酒仙桥。“学生工来了，工价又要低了。”", wageMult: 0.85, jobs: "all" },
    { days: [11, 12], text: "快到购物节，快递分拣涨价了！", wageMult: 1.5, jobs: ["courier"] },
    { days: [25, 26], text: "又一批学生工过来了，工价又往下压。", wageMult: 0.85, jobs: "all" },
    { days: [40, 41], text: "又一个购物节临近，快递分拣又涨价了。", wageMult: 1.5, jobs: ["courier"] }
  ],

  allowEarlyLeave: true,

  // ===== v0.8 经济：日子要紧巴巴的 =====
  economy: {
    hireMult: 1,                 // 所有活的录取率再乘一个数（想更难就调小）
    agencyCut: [5, 15],         // 每份活中介抽成（元，随机），到手 = 工钱 − 抽成
    wageJitter: 4,               // 喊价上下浮动几档（每档 5 元）
    jobAppearP: 0.9,            // 每个工种在一个招工时段里出现的概率（不是每天都有）
    extraOfferP: 0.45,           // 同一工种再来第二个招工的人的概率
    peakMinutes: 50,             // 时段开始后多少分钟内是“抢活”的好时候
    latePenalty: 0.45,           // 过了好时候，录取率最多再降多少（到时段结束）
    slowDayP: 0.18,             // 淡日：活少、压价
    slowDay: { hireMult: 0.75, wageMult: 0.88, text: "今天活少，路口站满了人，招工的挑三拣四，工价也往下压。" },
    rainDayP: 0.12,              // 下雨：室外的活（保安、快递装卸）少一半
    rainDay: { outdoor: ["guard", "courier"], appearMult: 0.5, text: "下了一夜雨，路口积着水。室外的活少了一大半，大家缩在屋檐下。" },
    wageDelayP: 0.12,            // 工钱拖到第二、三天才给
    wageUnpaidP: 0.025,          // 干完了，工钱却拿不到（中介跑了 / 扯皮）
    dailyMisc: 5,                // 每天的零碎开销：话费、充电、热水、烟或纸巾
    dailyMiscText: "话费、充电、打热水、买包纸巾，零零碎碎又是 ¥{n}。",
    streetChaseP: 0.4,           // 睡街上被保安撵起来的概率（只睡了三个钟头）
    streetChaseHours: 3
  },
  // 不花钱的喘口气：每天各一次（省钱的人靠这个撑精神）
  freeMental: {
    callhome: { label: "给家里打个电话", sub: "免费 · 20 分钟 · 每天一次", minutes: 20, mental: 6, from: "07:00", to: "23:00",
      text: "电话那头说家里都好。你嗯嗯地应着，挂了以后心里踏实了一点。" },
    river: { label: "去河边听人唱歌", sub: "免费 · 40 分钟 · 傍晚到夜里 · 每天一次", minutes: 40, mental: 7, from: "18:00", to: "23:30", where: "corner",
      text: "河边的移动卡拉OK又支起来了。有人唱《一路上有你》，你跟着哼了两句。" }
  }
};
