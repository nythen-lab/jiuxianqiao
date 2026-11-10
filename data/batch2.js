// ===================== v0.9 解锁内容（第二批） =====================
// 新身份 老K / 阿珍、新工作 冷库搬运 / 拆装舞台 / 工地小工、新地点 凉水河公园 / 中介宿舍楼、
// 新工友「老大」、三十青春 / 王哥 / 小伙 的新对话、剩下 4 枚印章。
window.CONFIG = window.CONFIG || {};

// ---------- 新工作 ----------
CONFIG.jobs.push(
  { id: "coldstore", name: "冷库搬运", window: "morning",
    start: "07:00", end: "15:00", wage: 150, meal: true, ride: "厂车出城",
    shout: "冷库！搬冻货清点，一百五，发军大衣！",
    desc: "进冷库搬不重的冻品，半小时一轮。不累，就是扛冻；有人会躲厕所偷懒，被抓到要挨骂。",
    hire: 0.7, ageSoft: 52, needClean: false, recordHire: 0.7, recordWage: 0.85,
    cost: { stamina: -22, mental: -6, clean: -8 }, warmHire: 0.08,
    quitPay: "none", game: "coldstore", debuff: "chill", skill: "hands", qualityPay: 15,
    recruiter: "liu", locked: true, unlock: { minDay: 6 }, unlockHint: "第6天起；有厚衣服更容易要你" },
  { id: "stage", name: "拆装舞台", window: "morning",
    start: "09:00", end: "18:00", wage: 200, meal: false, ride: "公交地铁自费",
    shout: "体育馆拆舞台！两百一天，路费自理！",
    desc: "进城拆搭舞台。工钱看着不少，来回路费十多块；到了也可能人满，白跑一趟。",
    hire: 0.4, ageSoft: 48, needClean: false, recordHire: 0.6, recordWage: 0.9,
    cost: { stamina: -32, mental: -10, clean: -18 }, heavy: true,
    quitPay: "none", game: "stage", debuff: null, skill: "hands", qualityPay: 30,
    recruiter: "zhao", fare: 14, fareRiskEmpty: 0.2,
    locked: true, unlock: { minDay: 7, skills: { hands: 2 } }, unlockHint: "第7天起，手脚麻利 Lv2 才有人带你进城" },
  { id: "site", name: "工地小工", window: "morning",
    start: "07:00", end: "17:00", wage: 170, meal: true, ride: "工地班车",
    shout: "工地小工！搬材料递砖刀，一百七管午饭！",
    desc: "给泥瓦师傅打杂：搬沙子、递材料、清场地。比装卸更杂，跟着熟手能学点门道。",
    hire: 0.5, ageSoft: 50, needClean: false, recordHire: 0.65, recordWage: 0.85,
    cost: { stamina: -45, mental: -10, clean: -28 }, heavy: true,
    quitPay: "none", game: "site", debuff: "sore", skill: "hands", qualityPay: 35,
    recruiter: "zhao", locked: true, unlock: { minDay: 8, affinity: { lin: 50 } }, unlockHint: "第8天起，和林叔混熟（好感50）他才带你去" }
);
CONFIG.debuffs.chill = { name: "受了寒", days: 2, staminaRecover: 0.8, text: "冷库里冻过，这两天总想裹紧点。" };

// ---------- 新地点 ----------
CONFIG.places.push(
  { id: "riverside", name: "凉水河公园", sign: "河边 · 钓鱼", open: "06:00", close: "22:00",
    desc: "桥上有人钓鱼，岸边有时支着移动卡拉OK。长期工周末来这儿打窝；你来，多半是散心。",
    locked: true, unlock: { minDay: 5 }, unlockHint: "第5天开放" },
  { id: "dormtower", name: "中介宿舍楼", sign: "员工宿舍 外人免进", open: "00:00", close: "24:00",
    desc: "整栋包给几家公司。楼道贴着罚款条例：抽烟、喝酒、赌博都要罚。床位按天摊下来更便宜，事也更多。",
    locked: true, unlock: { minDay: 8, anyOf: [{ nightsAtInn: 5 }, { affinity: { liu: 30 } }] }, unlockHint: "第8天起，在旅社住满5晚才进得去" }
);
CONFIG.lodging.push(
  { id: "monthBed", name: "宿舍楼床位", where: "dormtower", price: 18,
    recover: { stamina: 9, mental: 1 }, stealRisk: 0.1, canPick: true,
    note: "按月算摊到每天更便宜，但喝了酒回来可能被罚款", fineIfBeer: 20 }
);
// 河边：免费散心、傍晚卡拉OK、看人钓鱼（能碰到韩叔）
CONFIG.settings.freeMental.riverwalk = { label: "沿着河边走一圈", sub: "免费 · 40 分钟 · 每天一次", minutes: 40, mental: 8, from: "06:00", to: "21:30", where: "riverside",
  text: "河水不太干净，可风是凉的。钓鱼的人一动不动，你在旁边站了一会儿，心慢慢静下来。" };
CONFIG.riverside = {
  karaoke: { name: "移动卡拉OK唱一首", price: 5, minutes: 20, mental: 9, from: "18:00", to: "21:30",
    text: "你点了一首老歌，跑调跑到了河对岸。围着的几个人起哄鼓掌，你笑得停不下来。" },
  fish: { name: "蹲着看人钓鱼", minutes: 60, mental: 4, stamina: 3,
    text: "老头的浮漂一沉，拉上来一条巴掌大的鲫鱼。他冲你扬了扬：“晚上加个菜。”" }
};
CONFIG.dormFineText = "宿管闻到你一身酒味，掏出本子：“喝酒罚款二十，按条例来。”";

// 韩叔也会去河边
(function () { const h = CONFIG.npcs.find(n => n.id === "han"); if (h && !h.where.includes("riverside")) h.where.push("riverside"); })();

// ---------- 新工友：「老大」（爱炫耀、难相处） ----------
CONFIG.npcs.push({ id: "bossman", name: "老大", age: 41, where: ["guard", "courier", "bar"], forgive: 0,
  look: { skin: "#c8946c", hair: "short", hairColor: "#141414", shirt: "#26344f", age: 41 },
  recordLine: "老大斜你一眼：“手脚不干净的，离我远点。”",
  locked: true, unlock: { minDay: 6, anyOf: [{ jobDone: "guard" }, { minDay: 9 }] }, unlockHint: "干过保安，或第9天后",
  talks: [
    { opener: "“我白天站岗，晚上跑闪送，一个月比你们多挣一倍。”他把手机屏幕怼到你脸前，“看见没，这是流水。”",
      options: [
        { text: "“厉害，怎么做到的？”", reply: "“勤快呗！不像那些‘大神’，干一天歇三天。”他说得很大声，旁边有人翻了个白眼。", aff: 4 },
        { text: "“那你睡觉吗？”", reply: "他愣了一下：“……车上眯一会儿。”然后又补了一句，“年轻，扛得住。”", aff: 2, mental: 1 }
      ] },
    { opener: "（他难得没炫耀）“我老婆说我像个陀螺。孩子开家长会，我一次都没去过。”", story: "老大的陀螺",
      options: [
        { text: "“下次请一天假去吧”", reply: "“一天？一天两百多呢……”他算着算着，没再说话。", aff: 10, mental: 2 },
        { text: "拍拍他的肩", reply: "他躲了一下，又没躲：“行了行了，别整这个。”", aff: 8, mental: 2 }
      ] }
  ] });

// ---------- 已有工友的新对话 ----------
(function () {
  const add = (id, t) => { const n = CONFIG.npcs.find(x => x.id === id); if (n) n.talks.push(t); };
  add("thirty", { opener: "你在彩票店门口撞见他。桌上的粉末像一场小雪。“三十青春今天……又刮了。”他不敢看你。", story: "三十青春的无底洞",
    options: [
      { text: "“先吃饭，再想发财”", reply: "他捏着一张没刮的：“三十青春……试试。明天。”你们都知道明天很难。", aff: 8, mental: 2 },
      { text: "陪他刮一张（-10 元）", money: -10, reply: "谢谢惠顾。他反而松了口气：“一起输，没那么丢人。”", aff: 10, mental: 1 }
    ] });
  add("wang", { opener: "“上月塞隔音棉，一天好几百！”他拍胸。停了停：“这月……就干了两天。房东催了。”", story: "王哥的淡季",
    options: [
      { text: "“有活就干，别挑了”", reply: "他苦笑：“我也想通了。总比白待强。”", aff: 8 },
      { text: "“我请你喝碗粥”（-6 元）", money: -6, reply: "他没拒绝。喝完说：“下回好活，喊你。”", aff: 12, mental: 3 }
    ] });
  add("kid", { opener: "“我跑过两天外卖。电动车、超时、差评……”他摇头，“还是回去站岗。我发誓这次干满一年。”", story: "小伙的外卖",
    options: [
      { text: "“我信你一次”", reply: "他点头点得很重。这句誓言你听过不止一次。", aff: 8, mental: 2 },
      { text: "“先干满一个月再说”", reply: "“一个月……”他掰手指，“行，先一个月。”", aff: 10 }
    ] });
})();

// ---------- 新身份：老K / 阿珍 ----------
(function () {
  const K = CONFIG.identities.find(x => x.id === "laok");
  Object.assign(K, {
    playable: false, unlockMeta: "record", unlockHint: "带着案底离开过一次酒仙桥后解锁",
    tag: "身上有事的人 · 想干干净净走",
    comic: [
      { scene: "street", title: "老K", text: "老K三十五，在南边跟人看过场子，进去过一回。出来以后，没人问他从前，也没人敢用他。" },
      { scene: "phone", title: "老朋友", text: "以前的朋友隔三岔五打电话：“有个来钱快的活，干不干？”他每次都挂得很慢。" },
      { scene: "money", title: "路费", text: "他想攒两千五路费，回老家跟着表哥学开挖掘机。干干净净地走。" },
      { scene: "crowd", title: "酒仙桥", text: "路口的人都在看他手上的疤。他把袖子往下拽了拽，站进了人堆里。" }
    ],
    goalText: "攒够 ¥2,500 路费（揣在身上），并且最后 7 天手是干净的（没有顺手牵羊），然后坐车离开。",
    goalBullets: [
      "钱揣在自己身上（不用寄），到 ¥2,500 就够路费",
      "离开前连续 7 天不偷——偷一次，干净天数重新算",
      "手巧、眼尖，顺手牵羊更容易得手；可招工的人更不待见他（录取 -8%）",
      "攒够、手干净了，去银行·车站坐车走"
    ],
    goal: { type: "cleanLeave", amount: 2500, cleanDays: 7 },
    startMoney: 150,
    stats: { stamina: 80, mental: 55, hunger: 70, clean: 40 },
    maxStamina: 95,
    attrs: { brain: 6, exp: 7, phone: 5 },
    skills: { hands: 2, knife: 1, eye: 3, pick: 2 },
    outfit: "old", hireBonus: -0.08,
    npcTalks: ["laok_a", "laok_b"]
  });
  const Z = CONFIG.identities.find(x => x.id === "azhen");
  Object.assign(Z, {
    playable: false, unlockMeta: "xiaozhou_li", unlockHint: "用小周听过李大姐的劝、并离开酒仙桥后解锁",
    tag: "想攒学费的姑娘",
    comic: [
      { scene: "village", title: "阿珍", text: "阿珍二十二，高考差了几分，在县城奶茶店干了两年。她想去读个大专，学护理。" },
      { scene: "money", title: "五千块", text: "学费四千。家里说弟弟也要上学，让她自己想办法。" },
      { scene: "phone", title: "群", text: "她在招工群里潜水了一个月，发现女孩能干的活不多：绿化、印刷厂、后厨、端盘子。" },
      { scene: "crowd", title: "酒仙桥", text: "天还黑着，路口全是男人。她把头发扎紧，站到了中介旁边。" }
    ],
    goalText: "攒够 ¥4,000 学费，寄回家里让妈妈保管。寄满就能走。",
    goalBullets: [
      "点顶栏「寄钱」或去银行自助厅转账，累计寄回 ¥4,000",
      "招女工的活多：绿化、印刷、端盘、洗碗、食品厂；快递装卸这些活很少有人叫她",
      "晚高峰路口几乎不要女工，夜里也别在外面待太晚",
      "手机用得溜、手脚麻利，年轻，录取率 +4%"
    ],
    goal: { type: "send", amount: 4000, endKey: "win_tuition" },
    startMoney: 260,
    stats: { stamina: 85, mental: 70, hunger: 70, clean: 75 },
    maxStamina: 100,
    attrs: { brain: 7, exp: 3, phone: 8 },
    skills: { hands: 2, knife: 1, eye: 3, pick: 0 },
    outfit: "student", hireBonus: 0.04,
    jobBias: ["green", "print", "waiter", "dishwash", "food", "antigen"],
    nightCornerPenalty: true,
    npcTalks: ["azhen_a", "azhen_b"]
  });
})();
CONFIG.identityTalks.laok_a = { opener: "一个戴鸭舌帽的男人蹲在台阶上抽烟，手背上有道疤。“看什么看？”顿了顿，他又把烟盒递过来，“……抽吗？”",
  options: [
    { text: "接过来", reply: "“你是新来的吧。”他吐了口烟，“别跟那些叫你‘来钱快’的人走。”", aff: 8, mental: 1 },
    { text: "摇摇头", reply: "他把烟盒揣回去：“也好。少一样毛病。”", aff: 5 }
  ] };
CONFIG.identityTalks.laok_b = { opener: "“我进去过。”老K说得很平，“出来那天，我妈在门口等了一上午。现在我就想攒个路费，干干净净回去。”", story: "老K的路费",
  options: [
    { text: "“你会的”", reply: "他没说话，用鞋底把烟头碾灭了，碾了很久。", aff: 10, mental: 2 },
    { text: "“有活我叫你”", reply: "“行。”他第一次抬眼看你，“我记着。”", aff: 12, mental: 2 }
  ] };
CONFIG.identityTalks.azhen_a = { opener: "一个扎马尾的姑娘站在中介旁边，抱着一个旧书包。“叔，绿化那边……还要人吗？”",
  options: [
    { text: "“去问问孙姐”", reply: "她冲你笑了一下：“谢谢！”跑过去的时候书包里哗啦哗啦响，是课本。", aff: 8, mental: 2 },
    { text: "“这儿不适合姑娘”", reply: "她的笑收了一点：“我知道。可我要攒学费。”", aff: 4 }
  ] };
CONFIG.identityTalks.azhen_b = { opener: "“我想学护理。”阿珍掰着手指，“四千块学费，我算过了，干三十天，一天不歇。”", story: "阿珍的学费",
  options: [
    { text: "“也得歇歇”", reply: "“歇一天少一百多呢。”她想了想，“……那就一个礼拜歇半天。”", aff: 10, mental: 2 },
    { text: "“到时候我去看你”", reply: "她笑出了声：“那你可得把病养好了再来，我不给熟人打针。”", aff: 12, mental: 3 }
  ] };
CONFIG.identityNpcWhere.laok = ["guard", "bar", "corner"];
CONFIG.identityNpcWhere.azhen = ["green", "print", "food"];
CONFIG.endings.win_clean = { title: "干干净净地走", text: "售票员撕下车票递给你。兜里两千五，一张都不烫手。车开出去很远，你才把袖子往上捋了捋，露出那道疤——它就只是一道疤了。" };
CONFIG.endings.win_tuition = { title: "学费攒够了", text: "妈妈在电话里哭了：“四千，一分不少，我给你存着。”你挂了电话，在银行门口的台阶上坐了很久。下个月，你要去报到了。" };

// ---------- 新事件 ----------
CONFIG.events.push(
  { id: "fullQuota", trigger: "afterJob", chance: 0.06, need: { minDay: 3 },
    text: "回来的车上，中介说明天那家厂名额满了，让大家自己再找。车厢里骂成一片。", effects: { mental: -3 } },
  { id: "coldDodge", trigger: "afterJob", chance: 0.25, need: { job: "coldstore" },
    text: "集合清点少了一个人。有人笑话：“他进去干活了。”全场哄笑。中介骂骂咧咧：“我还没见过谁主动干活的。”", effects: { mental: 2 } },
  { id: "lotteryBleed", trigger: "daily", weight: 3, need: { minDay: 3, flag: "visitedLottery" },
    text: "路过彩票店，手指有点痒。你站了三秒，走了——今天没刮。", effects: { mental: 1 } },
  { id: "hanRecite", trigger: "daily", weight: 2, need: { minDay: 6, unlockedNpc: "han" },
    text: "凉水河边有人在大声朗诵。口音不正，可路过的人都停了一下。你认出是韩叔。", effects: { mental: 4 } }
);

// ---------- 第二批印章 ----------
CONFIG.achievements.push(
  { id: "shadow_line", name: "流水线阴影", desc: "药厂下了班，心里那根弦还绷着（精神 ≤40）。" },
  { id: "scratch_hole", name: "刮刮乐无底洞", desc: "刮刮乐一共净亏了两百。" },
  { id: "heard_enough", name: "听懂了", desc: "听满了八段工友的故事。" },
  { id: "han_speech", name: "韩叔的演讲", desc: "在河边听韩叔把那段话念完。" }
);
