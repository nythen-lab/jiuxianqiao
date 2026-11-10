// ===================== v0.8 解锁内容（第一批） =====================
// 新工作 5 种、新地点 4 个、新身份小林、新工友韩叔、6 枚成就印章。
// unlock 条件（都可以组合）：
//   minDay 第几天起 / anyOf [ {…}, {…} ] 任一满足 / flag 某个标记（办证、晕倒过、受过工伤…）
//   affinity { npcId: 好感 } / jobDone 干过某个活 / outfitTierAtLeast "mid" 买过中档以上衣服
// unlockHint：没解锁时，街上 / 招工栏里显示的提示（例：「第3天开放」）。
window.CONFIG = window.CONFIG || {};

CONFIG.unlockText = {
  job: "街上多了一份活：{name}",
  place: "你发现了新地方：{name}",
  identity: "可以试试新的身份了：{name}",
  npc: "你认识了新的人：{name}",
  achievement: "盖了一枚印章：{name}"
};

// ---------- 新工作 ----------
CONFIG.jobs.push(
  {
    id: "mover", name: "装卸搬运", window: "morning",
    start: "08:00", end: "12:00", wage: 150, meal: false, ride: "招工的小货车",
    shout: "装卸！四个钟头，一百五，能扛的来！",
    desc: "搬箱子、抬货上车。时间短、来钱快，可是要抢，也费腰。箱子越重越晃，码不稳就塌。",
    hire: 0.55, ageSoft: 48, needClean: false, recordHire: 0.7, recordWage: 0.9,
    cost: { stamina: -40, mental: -8, clean: -20 }, heavy: true,
    quitPay: "none", game: "mover", debuff: "sore", skill: "hands", qualityPay: 35,
    recruiter: "liu", hours: 4,
    locked: true, unlock: { minDay: 2 }, unlockHint: "第2天开放"
  },
  {
    id: "print", name: "印刷厂包装", window: "morning",
    start: "08:00", end: "20:00", wage: 180, meal: true, ride: "中介的面包车",
    shout: "印刷厂！包装装箱，一百八管一餐！",
    desc: "在车间里码书、装箱、封箱。比快递轻一点，但站一天也累；地上有时有水，小心脚滑。",
    hire: 0.68, ageSoft: 50, needClean: false, recordHire: 0.65, recordWage: 0.85,
    cost: { stamina: -35, mental: -12, clean: -15 },
    quitPay: "none", game: "print", debuff: null, skill: "hands", qualityPay: 30,
    recruiter: "liu",
    locked: true, unlock: { minDay: 3 }, unlockHint: "第3天开放"
  },
  {
    id: "green", name: "绿化铺草皮", window: "morning",
    start: "08:00", end: "17:00", wage: 195, meal: true, ride: "工头的小面包",
    shout: "单位绿化！铺草皮清杂草，一百九十五，招几个就走！",
    desc: "单位迎检，临时铺草皮、清杂草。招人少，抢得到就赚；草皮要对齐、拍实。",
    hire: 0.45, ageSoft: 55, needClean: false, recordHire: 0.75, recordWage: 0.9,
    cost: { stamina: -38, mental: -6, clean: -22 }, heavy: true,
    quitPay: "none", game: "green", debuff: null, skill: "hands", qualityPay: 40,
    recruiter: "zhao",
    locked: true, unlock: { minDay: 4, anyOf: [{ affinity: { li: 40 } }, { minDay: 6 }] },
    unlockHint: "第4天后和李大姐熟了会有；不然第6天开放"
  },
  {
    id: "waiter", name: "酒店端盘", window: "morning",
    start: "10:00", end: "20:00", wage: 215, meal: true, ride: "坐公交自己去",
    shout: "酒店服务员！十个钟头两百一十五，要干净利索的！",
    desc: "端盘子、收台、对客人笑。不太费蛮力，但要体面、要健康证，领班盯得紧，盘子不能洒。",
    hire: 0.42, ageSoft: 45, needClean: false, recordHire: 0.5, recordWage: 0.85,
    cost: { stamina: -25, mental: -15, clean: -5 }, needDecency: 60,
    quitPay: "none", game: "waiter", debuff: null, skill: "eye", qualityPay: 25,
    recruiter: "sun",
    locked: true, unlock: { minDay: 5, anyOf: [{ flag: "hasHealthCert" }, { outfitTierAtLeast: "mid" }] },
    unlockHint: "第5天起，办了健康证或穿得像样才有"
  },
  {
    id: "dishwash", name: "后厨洗碗", window: "evening",
    start: "17:00", end: "23:00", wage: 140, meal: true, ride: "走过去",
    shout: "饭店后厨洗碗！晚班一百四，管一碗饭！",
    desc: "热水、油污、碗摞成山。不挑年龄，来钱稳，就是手上起皮、衣服一股味。",
    hire: 0.78, ageSoft: 62, needClean: false, recordHire: 0.8, recordWage: 0.9,
    cost: { stamina: -26, mental: -8, clean: -30 },
    quitPay: "hourly", hourly: 18, game: "dishwash", debuff: null, skill: "hands", qualityPay: 20,
    recruiter: "sun", light: true,   // light=轻活：饿得发昏（饱腹<10）也能去，管饭
    locked: true, unlock: { minDay: 2 }, unlockHint: "第2天开放"
  }
);

// ---------- 新地点 ----------
CONFIG.places.push(
  { id: "netcafe", name: "通宵网吧", sign: "网吧 · 通宵", open: "00:00", close: "24:00",
    desc: "屏幕闪个不停。有人开黑，有人趴在椅子上睡觉，角落堆着行李。一夜二十块，还能打游戏。",
    locked: true, unlock: { minDay: 1 }, unlockHint: "第1天开放" },
  { id: "lottery", name: "好运来彩票店", sign: "彩票 · 刮刮乐 · 四种票", open: "09:00", close: "22:00",
    desc: "刮刮乐的粉末落了一桌。有人一张接一张刮，有人只是坐着避寒。发财的梦在这儿最便宜，也最贵。",
    locked: true, unlock: { minDay: 3 }, unlockHint: "第3天开放" },
  { id: "clinic", name: "村卫生室", sign: "卫生室 · 输液", open: "08:00", close: "20:00",
    desc: "两张输液椅，消毒水味道。腰闪了、受寒了、干崩了，都可以来这里花点钱缓一缓。",
    locked: true, unlock: { anyOf: [{ flag: "collapsedOnce" }, { flag: "jobInjury" }, { minDay: 4 }] },
    unlockHint: "第4天开放（晕倒或受伤后会提前有人指路）" },
  { id: "agency", name: "劳务中介门店", sign: "日结 · 短期 · 长期", open: "09:00", close: "19:00",
    desc: "白板上花花绿绿写着工价。有人嗑瓜子玩手机，有人贴二维码拉群。能办证、找长期，也会被人悄悄问办卡。",
    locked: true, unlock: { minDay: 2 }, unlockHint: "第2天开放" }
);
// 网吧通宵从旅社挪到网吧
(CONFIG.lodging.find(l => l.id === "netbar") || {}).where = "netcafe";

CONFIG.netcafe = { game: { name: "打两小时游戏", price: 8, minutes: 120, mental: 9, stamina: -4, hunger: -8,
  text: "耳机里枪声乱响，你连赢了两把。抬头一看，两个钟头没了。" } };
CONFIG.lotteryShop = { price: 10, maxPerDay: 8,
  table: [
    { w: 52, money: 0, text: "谢谢惠顾。粉末糊了一手。" },
    { w: 28, money: 5, text: "中了五块。不够回本。" },
    { w: 14, money: 20, text: "中了二十！心里又痒了一下。" },
    { w: 5, money: 50, text: "五十！你听见自己咽了口唾沫。" },
    { w: 1, money: 200, text: "两百——今天的工钱有了。你知道自己还会再刮。" }
  ] };
CONFIG.clinicServices = [
  { id: "ointment", name: "红花油 + 躺一会儿", price: 30, minutes: 40, clearDebuff: ["sore"], stamina: 10, mental: 2,
    text: "大夫在你腰上搓了半天红花油，火辣辣的，倒是松快了。" },
  { id: "drip", name: "输液一瓶", price: 80, minutes: 120, stamina: 25, mental: 5, hunger: -10,
    text: "针扎进手背，药水一滴一滴往下走。你靠着椅背睡着了。" }
];
CONFIG.agencyServices = [
  { id: "guardCert", name: "代办保安证", price: 60, days: 3, flag: "hasGuardCert", needCleanRecord: true,
    text: "中介拍拍胸脯：“没前科的都能办，三天出证。办了好活优先叫你。”", doneText: "保安证办下来了。招保安的看你的眼神不一样了。" },
  { id: "healthCert", name: "代办健康证", price: 45, days: 2, flag: "hasHealthCert",
    text: "体检单在他抽屉里变来变去。你付了钱，他让你过两天来拿。", doneText: "健康证拿到了，小红本揣在兜里。酒店端盘的活能去问了。" }
];
CONFIG.agencyBoard = [
  "白板上写：长期工，包吃住，月薪六千——底下一行小字：前三个月压工资。",
  "“十一小时两百一，干满七天另给两百。”你算了算，觉得哪里不对。",
  "“招保安，年龄十八到五十五，有证优先。”",
  "“电子厂，女工优先，需健康证。”",
  "“装卸，日结，能吃苦。”下面一串电话号码，被人划掉了两个。"
];

// ---------- 新身份：小林（任意身份通关一次后解锁，存在本机浏览器里） ----------
(function () {
  const i = CONFIG.identities.find(x => x.id === "xiaolin");
  Object.assign(i, {
    age: 25, tag: "受过伤的青年 · 欠债一万",
    playable: false, unlockAfterWin: true, unlockHint: "用任意身份离开酒仙桥一次后解锁",
    comic: [
      { scene: "street", title: "十年", text: "小林十五岁出门干活：工地、厂子、后厨学徒，样样碰过，样样没留下。" },
      { scene: "phone", title: "救我", text: "临时工群里他很少说话，偶尔冒出两个字：救我。半是玩笑，半是真的。" },
      { scene: "money", title: "一万", text: "腿上打过钢钉，身上还背着一万多的债。重活，成了别人的事。" },
      { scene: "crowd", title: "酒仙桥", text: "家里养了一阵，又出来了。债还在，人还在路口。他想试着再撑一撑。" }
    ],
    goalText: "还掉 3,000 块债（一共欠一万）。还到了就可以离开；撑不住了才算输。",
    goalBullets: [
      "点顶栏「还债」或去银行自助厅转账，累计还掉 ¥3,000",
      "腿上有旧伤：装卸、快递、铺草皮这些重活，体力消耗 ×1.5",
      "开局只有 ¥80，第一晚的床位都得精打细算",
      "没有天数上限——还到了就走"
    ],
    goal: { type: "send", amount: 3000, debt: true, debtTotal: 10000 },
    startMoney: 80,
    stats: { stamina: 60, mental: 50, hunger: 60, clean: 50 },
    maxStamina: 70,
    attrs: { brain: 5, exp: 6, phone: 6 },
    skills: { hands: 1, knife: 1, eye: 2, pick: 0 },
    outfit: "old", hireBonus: 0, heavyJobMult: 1.5,
    npcTalks: ["xiaolin_a", "xiaolin_b"]
  });
  i.look = Object.assign({}, i.look, { age: 25 });
})();
CONFIG.identityTalks.xiaolin_a = { opener: "一个瘦削的年轻人蹲在你旁边，只说了两个字：“……救我。”见你愣住，又补一句：“开玩笑的。有烟吗？”",
  options: [
    { text: "递烟", needItem: "烟", giveItem: "烟", reply: "他吸了一口，没看你：“我不是要钱。就是……习惯了。”", aff: 10, mental: 1 },
    { text: "“你还好吗？”", reply: "“还能怎样。”他扯了下嘴角，“一天算一天。”", aff: 6 }
  ] };
CONFIG.identityTalks.xiaolin_b = { opener: "“我十五岁就出来了。工地、厂子、后厨……现在重活干不了。”他拍拍自己的腿，“债还在。人还在。”", story: "小林的一万块",
  options: [
    { text: "“那你还打算干啥？”", reply: "“轻省的。保安，洗碗，能坐着的。再不行就回家躺一阵。”", aff: 8, mental: 2 },
    { text: "沉默地坐着", reply: "风从路口吹过来。他说：“谢了。有人肯听，就行。”", aff: 12, mental: 3 }
  ] };
CONFIG.identityNpcWhere.xiaolin = ["guard", "dishwash", "bar"];
CONFIG.endings.win_debt = { title: "先还上三千", text: "转账成功。你盯着那串数字看了很久——一万里的三千。不多，可这是你自己一天一天抠下来的。你在群里打了两个字，删掉，又换成：“还活着。”" };

// ---------- 新工友：韩叔（干过装卸，或第 6 天后在烧烤摊碰到） ----------
CONFIG.npcs.push({ id: "han", name: "韩叔", age: 48, where: ["mover", "bar"], forgive: 5,
  look: { skin: "#b98962", hair: "messy", hairColor: "#1a1a1a", shirt: "#1e1e1e", age: 48 },
  recordLine: "韩叔摆摆手：“练武的不怕闲话。你把心放正就行。”",
  locked: true, unlock: { anyOf: [{ jobDone: "mover" }, { minDay: 6 }] }, unlockHint: "干过装卸，或第6天后",
  talks: [
    { opener: "他撸起袖子，青筋鼓着：“大侠扬名以前，也在码头扛过包。你怕费力气？”",
      options: [
        { text: "“不怕，怎么干？”", reply: "“腰沉住，腿发力。别跟箱子较劲，跟自己的呼吸较劲。”他示范了一下，旁边有人起哄。", aff: 8, mental: 2 },
        { text: "“我就是来挣钱的”", reply: "“挣钱也要像个人。”他不生气，把一副手套甩给你。", aff: 4, item: "手套" }
      ] },
    { opener: "“为了宣传我写的剧本，我拿脑袋开过啤酒瓶，缝了十几针。”他指指发际线，“疼。可比没人看见我强。”",
      options: [
        { text: "“值吗？”", reply: "“问值不值的人，成不了角儿。”他笑了，“可我还是希望——值。”", aff: 10, mental: 3 },
        { text: "“悠着点，叔”", reply: "他沉默了一秒：“……谢谢。这儿很少有人这么说。”", aff: 12, mental: 4 }
      ] },
    { opener: "他忽然站直，对着来来往往的人朗诵起来。口音不标准，可每个字都用了力气：“你们不是牲口，你们是人……”", story: "韩叔的电影",
      options: [
        { text: "站着听完", reply: "有人拍视频，有人躲开。他鞠了一躬，眼眶有点红：“有一天，我会把片子拍出来。”", aff: 15, mental: 6 },
        { text: "小声鼓掌", reply: "他朝你眨眨眼，像在片场接到了下一个机位。", aff: 12, mental: 5 }
      ] }
  ] });

// ---------- 新事件 ----------
CONFIG.events.push(
  { id: "printSlip", trigger: "afterJob", chance: 0.12, need: { job: "print" },
    text: "车间地上有水，你滑了一下，膝盖青了一块。有人说：“去卫生室看看吧，别硬撑。”", effects: { stamina: -15, mental: -3, flag: "jobInjury" } },
  { id: "pressDay", trigger: "corner", chance: 0.1, need: { minDay: 4 },
    text: "有人压低声音：“这活前三天压着不给，干满了一起结。”周围几个人摇摇头走开了。", effects: { mental: -1 } }
);

// ---------- 成就印章（★ 第一批 6 枚，盖进相册） ----------
CONFIG.achievements = [
  { id: "lie_two_days", name: "干一天要躺两天", desc: "干完快递浑身酸痛，一觉睡了十个钟头。" },
  { id: "fifty_a_day", name: "五十块是一天", desc: "一天花销不超过五十，还挣到了工钱。" },
  { id: "student_wave", name: "学生工来了", desc: "工价被学生工压低的日子里，你还是上了车。" },
  { id: "no_card", name: "不办卡", desc: "有人问你办卡，你摇摇头走开了。" },
  { id: "earn_self", name: "对得起自己", desc: "有一份活，干到了九成以上的质量。" },
  { id: "month_rent", name: "寄出月供", desc: "给家里寄满了三千。" }
];
