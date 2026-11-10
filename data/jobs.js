// ===================== 工作（日结活） =====================
// 字段说明：
//   window     在哪个招工时段出现：morning=早高峰白班，evening=晚高峰夜班
//   start/end  上班、下班时间（end 比 start 小，表示干到第二天早上）
//   wage       工钱（元/天）      meal: 是否管饭（管饭会补饱腹）
//   ride       怎么去：显示在坐车画面里
//   hire       基础录取率 0–1（越大越好招）
//   ageSoft    超过这个年龄，每多一岁录取率 -3%
//   needClean  true = 要求没有案底（有案底会给找短期工或保安日结带来麻烦）
//   recordHire 有案底时录取率乘以多少（0.5 = 减半）
//   recordWage 有案底时工钱打几折（0.8 = 八折）
//   cost       干完一整班的消耗（体力、精神、干净程度）
//   quitPay    中途跑路/被开除怎么算钱："none" 白干；"hourly" 按小时算
//   game       用哪个小游戏（courier / guard / food / antigen）
//   debuff     干完后的后遗症（见文件最后的 CONFIG.debuffs）
//   skill      这份活用到哪个技能（hands 手脚麻利 / knife 刀工 / eye 察言观色）：等级越高判定区越宽、录取率越高
//   qualityPay 干得好坏对工钱的影响：工钱 += (质量 - 0.7) × qualityPay（可能是扣钱）
window.CONFIG = window.CONFIG || {};

CONFIG.jobs = [
  {
    id: "courier", name: "快递分拣", window: "morning",
    start: "07:00", end: "19:00", wage: 235, meal: true, ride: "中介的面包车",
    shout: "快递分拣！十二个小时两百三十五，管一顿午饭！",
    desc: "重复、累，搬一天货浑身酸痛。中途跑路就等于白干。",
    hire: 0.78, ageSoft: 48, needClean: false, recordHire: 0.6, recordWage: 0.8,
    cost: { stamina: -58, mental: -20, clean: -25 },
    quitPay: "none", game: "courier", debuff: "sore", skill: "hands", qualityPay: 40,
    recruiter: "liu"
  },
  {
    id: "guard", name: "临时安保", window: "morning",
    start: "07:00", end: "19:00", wage: 175, meal: true, ride: "中介的面包车",
    shout: "保安！站岗的！十二个小时一百七十五，要身份证，要查底子！",
    desc: "不累，就是熬时间。站岗不能玩手机，查岗的来了要赶紧收起来。要求没有案底。",
    hire: 0.66, ageSoft: 58, needClean: true, recordHire: 0, recordWage: 1,
    cost: { stamina: -15, mental: -22, clean: -8 },
    quitPay: "none", game: "guard", debuff: null, skill: "eye", qualityPay: 0,
    recruiter: "zhao"
  },
  {
    id: "food", name: "食品厂夜班", window: "evening",
    start: "19:00", end: "06:00", wage: 200, meal: false, ride: "厂里的通勤车",
    shout: "食品厂夜班，晚七点到早六点，两百，微信群里报名的也在这上车！",
    desc: "规矩多：换鞋、穿防尘服、洗手15秒。然后站在案板前切五花培根，切得匀不匀直接算钱；长期工大姐还嫌你切太快。",
    hire: 0.66, ageSoft: 52, needClean: false, recordHire: 0.6, recordWage: 0.85,
    cost: { stamina: -34, mental: -10, clean: -12 },
    quitPay: "none", game: "food", debuff: null, skill: "knife", qualityPay: 70,
    recruiter: "sun"
  },
  {
    id: "antigen", name: "抗原药厂夜班", window: "evening",
    start: "20:00", end: "08:00", wage: 245, meal: true, ride: "一辆气派的旅游大巴",
    shout: "药厂！插试纸条，晚八点到早八点，两百四十五管一餐！大巴车接送！",
    desc: "坐着插条，不累身体，累心：没收手机、不知道几点、线长一直骂。干不好当场开除，按小时结钱。",
    hire: 0.74, ageSoft: 55, needClean: false, recordHire: 0.7, recordWage: 0.85,
    cost: { stamina: -20, mental: -45, clean: -8 },
    quitPay: "hourly", hourly: 15.8, game: "antigen", debuff: "shadow", skill: "hands", qualityPay: 30,
    recruiter: "liu"
  }
];

// 干完活留下的后遗症
CONFIG.debuffs = {
  sore:   { name: "浑身酸痛", days: 2, staminaRecover: 0.7, text: "干完一天快递，浑身酸痛了好几天。" },
  shadow: { name: "车间阴影", days: 3, mentalRecover: 0.5, text: "一闭眼就是流水线和线长的骂声。" },
  record: { name: "刚出派出所", days: 2, mentalRecover: 0.6, text: "走在街上总觉得有人在看你。" }
};

// 招工的人被拒绝时说的话（按原因）。{job} 会换成工作名。
CONFIG.refuseLines = {
  record:     ["我们这活要查底子，有案底的不要。", "你那事儿街上都传遍了，{job}不敢用你。", "身份证一刷就出来了，别耽误我时间。"],
  recordSoft: ["你有底子吧？算了算了，今天人够了。", "听说你手脚不干净……下回吧。"],
  age:        ["岁数大了，干不动，下一个！", "{job}要年轻的，您歇着吧。"],
  dirty:      ["你这身衣服太埋汰了，进不了厂。", "回去洗洗再来吧。"],
  full:       ["人招满了，车要开了。", "下一个，下一个，满了！"],
  tired:      ["看你脸色，站都站不稳，别到时候倒在线上。"]
};
// 有案底时，招工的人主动压价说的话
CONFIG.recordWageLines = ["你有底子，我也不是不能要你，就是工钱得少给点：{wage}元，爱干不干。"];

// 技能：名字和效果说明（显示在招工、人物卡里）
CONFIG.skillNames = { hands: "手脚麻利", knife: "刀工", eye: "察言观色", pick: "顺手" };
CONFIG.skillFx = {
  hands: "每级：分拣/插条判定区 +12%、传送带慢 3%、相关活录取 +2.5%",
  knife: "每级：切肉合格范围 +12%、手更稳、食品厂录取 +2.5%",
  eye:   "每级：所有活录取 +1.5%；安保查岗提前看见",
  pick:  "每级：顺手牵羊圆圈更大、更快到手"
};
// 每升一级需要的经验：第 n 级 → n+1 级需要 xpBase + n × xpStep
CONFIG.skillXp = { xpBase: 8, xpStep: 5, max: 5 };
