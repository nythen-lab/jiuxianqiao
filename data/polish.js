// ===================== v0.9 打磨：更多随机事件 / 工友记性 / 结局小结 =====================
// 注意：玩家可见文案一律用「酒仙桥」，不要写真实地名。
window.CONFIG = window.CONFIG || {};

// 四季：开局选季节（选身份后），之后每 daysPer 天换一季。没有晴雨天气，只有季节。
// mods：awakeSta/awakeHun 醒着时体力/饱腹消耗倍数；outdoorSta 在室外待着时体力额外倍数；
// jobs：{工种: { appear 出现概率倍数, pay 工钱倍数, sta 干完额外体力 }}；warmPrice 厚衣服价钱倍数
CONFIG.seasons = {
  daysPer: 10, defaultStart: "autumn",
  outdoorPlaces: ["corner", "bank", "bar", "riverside"],
  outdoorJobs: ["green", "site", "stage", "mover", "guard", "courier"],
  list: [
    { id: "spring", name: "春", icon: "🌱", tip: "开春了，绿化的活多起来", text: "开春了。花坛边冒出一点绿，绿化队的车来得勤了。",
      mods: { awakeSta: 1, awakeHun: 1 }, jobs: { green: { appear: 1.5 } }, warmPrice: 0.85 },
    { id: "summer", name: "夏", icon: "☀️", tip: "热，在外头站着掉体力快；室外的活多给钱，小心中暑", text: "入夏了。柏油路晒得发软，台阶上的人都挤到树荫底下。",
      mods: { awakeSta: 1, awakeHun: 1, outdoorSta: 1.35 }, jobs: { green: { pay: 1.1, sta: -6 }, site: { pay: 1.1, sta: -8 }, stage: { pay: 1.1, sta: -6 }, mover: { pay: 1.05, sta: -6 }, coldstore: { appear: 1.3 } },
      heatstroke: { jobs: ["green", "site", "stage", "mover"], p: 0.18, below: 55, text: "太阳底下干到下午，眼前一花，蹲下就起不来了——中暑了。工友把你架到阴凉处灌了半瓶水。", effects: { stamina: -18, mental: -6 } },
      warmPrice: 0.7 },
    { id: "autumn", name: "秋", icon: "🍂", tip: "不冷不热，活最好找", text: "入秋了。早上的风开始有点凉，正是干活的好时候。",
      mods: { awakeSta: 1, awakeHun: 1 }, jobs: { stage: { appear: 1.3 } }, warmPrice: 1 },
    { id: "winter", name: "冬", icon: "❄️", tip: "冷，饿得快、掉体力快；睡不了街上；得有厚衣服", text: "入冬了。凌晨的路口哈气成霜，没有厚衣服根本站不住。",
      mods: { awakeSta: 1.15, awakeHun: 1.2, noWarmSta: 1.35 }, jobs: { green: { appear: 0.15 }, site: { appear: 0.6, sta: -8 }, stage: { appear: 0.7, sta: -6 }, mover: { sta: -6 }, coldstore: { pay: 1.15, sta: -10, chill: 0.6 } },
      noStreet: { text: "数九寒天，在自助厅门口躺一夜会冻出人命。你哆嗦着站起来——得找个有门的地方。", forcedText: "实在没地方去，你缩在自助厅门口熬了一夜。手脚冻得没了知觉，天亮时差点没站起来。", effects: { mental: -10, stamina: -8 }, collapseP: 0.25 },
      warmPrice: 1.35 }
  ]
};

// 工友的记性：聊天时开头先来一句（按顺序取第一条满足的）
CONFIG.npcMemory = {
  owe: "“上回借你的 {amt} 块，记着点啊。”",
  repaid: "“钱的事你办得敞亮，够意思。”",
  record: "他看了你一眼，眼神有点躲：“听说你前两天……算了，不说了。”",
  longGone: "“好几天没见你了，还以为你回老家了。”",
  sameDay: "“又是你啊，今天第二回了。”",
  close: "“来了？坐。”他往旁边挪了挪。"
};

// 结局小结用的文案
CONFIG.endSummary = {
  title: "这一趟",
  noFriend: "没交下什么朋友",
  sparkTitle: "每天挣到的钱"
};

// —— 更多随机事件（日常池 / 路口 / 早上 / 下班后）——
CONFIG.events.push(
  { id: "lostDog", trigger: "daily", weight: 0.8, need: { minDay: 3 },
    text: "一条瘸腿的黄狗跟了你半条街。你把半个馒头掰给它，它在路口蹲到了天黑。", effects: { mental: 3, hunger: -2 } },
  { id: "phoneCall", trigger: "daily", weight: 1,
    text: "家里打来电话，问你吃饭没有。你说吃了，吃的是肉。挂了电话，在台阶上坐了很久。", effects: { mental: -2 } },
  { id: "foundCoins", trigger: "daily", weight: 0.7,
    text: "早点摊底下滚出来几个钢镚，你弯腰捡了，正好够一根油条。", effects: { money: 3 } },
  { id: "chargeShare", trigger: "corner", chance: 0.1,
    text: "有个小伙子手机没电了，借你的充电宝充了十分钟，非要塞给你一根烟。", effects: { mental: 1, item: "烟" } },
  { id: "chengguan", trigger: "corner", chance: 0.08, need: { minDay: 2 },
    text: "蓝马甲一来，路边卖鞋垫的大姐抱起摊子就跑，掉了一双在你脚边。你追上去还给了她。", effects: { mental: 2 } },
  { id: "afterBeer", trigger: "afterJob", chance: 0.12,
    text: "下班路上，一起干活的人招呼你：“走，喝一口去？”你摆摆手，他拍了拍你的肩膀：“行，那明天见。”", effects: { mental: 2 } }
);

// 目标里程碑：到 1/4、一半、3/4 时提一句，收进相册
CONFIG.milestones = [
  { at: 0.25, title: "走了四分之一", text: "算了算账，离目标走了四分之一。不多，但是真的。" },
  { at: 0.5, title: "过半了", text: "过半了。晚上躺在床位上，第一次觉得这事能成。" },
  { at: 0.75, title: "就差最后一截", text: "就差最后一截了。路口的风好像也没那么硬了。" }
];

// 留给 v0.9 之后的扩展位：人物小传和外貌（现在为空，不影响游戏）
// 身份：profile: { bio: "人物小传", appearance: "外貌描写" }；工友：同样的 profile 字段。
(CONFIG.identities || []).forEach(i => { i.profile = i.profile || { bio: "", appearance: "" }; });
(CONFIG.npcs || []).forEach(n => { n.profile = n.profile || { bio: "", appearance: "" }; });

// 冬天的去处：冬季救助站（银行·车站旁，免费，隔一晚才能再去，给一碗热粥）
CONFIG.lodging.push({ id: "shelter", name: "冬季救助站", where: "bank", price: 0, season: "winter", everyNights: 2, hunger: 20,
  recover: { stamina: 9, mental: 2 }, stealRisk: 0.05, canPick: false, note: "铁架床、军绿被子，进门先登记，工作人员给盛了一碗热粥" });
