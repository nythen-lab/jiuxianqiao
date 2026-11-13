// ===================== v1.0 数据：澡堂 / 人生阶梯 / 管饭 / 回家电话 / 四季 =====================
// 注意：玩家可见文案一律用「酒仙桥」，不写真实地名，不写出处。
window.CONFIG = window.CONFIG || {};
(function () {
  const C = window.CONFIG;

  // ---------- 新地点 ----------
  C.places.push(
    { id: "bath", name: "老澡堂", sign: "澡堂 · 搓澡 · 热水", open: "06:00", close: "23:00",
      desc: "红塑料凳，大池子，雾气糊满窗。几块钱就能把一身灰洗下去——也是这一带少有的、人和人不用端着的地方。",
      locked: true, hidden: true, unlock: { minDay: 2 }, unlockHint: "第2天开放" },
    { id: "sales", name: "安居里售楼处", sign: "新盘 · 首付三成 · 看房", open: "09:00", close: "18:00",
      desc: "玻璃房子外挂着红白气球，沙盘上的小楼亮着一排灯。你不一定买得起，但看看总是不要钱的。"
    },
    { id: "hall", name: "幸福礼堂", sign: "婚宴 · 喜庆 · 摆酒", open: "08:00", close: "20:00",
      desc: "红桌布、红灯笼、红幕布。管事的大姐说，一年到头，这里最忙的就是这一排周末。",
      locked: true, hidden: true, unlock: { flag: "hallOpen" } },
    { id: "kinder", name: "向阳幼儿园", sign: "幼儿园 · 小班 · 中班", open: "07:30", close: "17:30",
      desc: "墙上画着熊猫和兔子。栏杆里的滑梯一直有人排队，栏杆外的大人一直有人站着。",
      locked: true, hidden: true, unlock: { flag: "kinderOpen" } },
    { id: "home", name: "我的小家", sign: "自己的家 · 有一把钥匙", open: "00:00", close: "24:00",
      desc: "不大，一张沙发，一个小冰箱。钥匙在自己兜里，门一关，就是自己的。",
      locked: true, hidden: true, unlock: { flag: "ownsHome" } }
  );
  C.lodging.push({ id: "home", name: "自己家的床", where: "home", price: 0, recover: { stamina: 15, mental: 9 }, stealRisk: 0, canPick: false,
    note: "不花钱，没人翻包，睡得最踏实" });

  C.phaseImgs.sales  = { day: "img/bg-sales.jpg",  night: "img/bg-sales-night.jpg" };
  C.phaseImgs.kinder = { day: "img/bg-kinder.jpg", night: "img/bg-kinder-night.jpg" };
  C.phaseImgs.home   = { day: "img/bg-home.jpg",   night: "img/bg-home-night.jpg" };

  // 地图上的位置
  Object.assign(C.townMap.pins, { bath: [55, 46], hall: [24, 45], sales: [8, 54], kinder: [31, 31], home: [78, 47] });

  // 11. 公园（河边）从不打烊
  const rv = C.places.find(x => x.id === "riverside"); if (rv) { rv.open = "00:00"; rv.close = "24:00"; rv.sign = "河边 · 钓鱼 · 散步（不打烊）"; }
  if (C.settings && C.settings.freeMental && C.settings.freeMental.riverwalk) { C.settings.freeMental.riverwalk.from = "00:00"; C.settings.freeMental.riverwalk.to = "24:00"; }
  if (C.riverside && C.riverside.karaoke) { C.riverside.karaoke.to = "23:30"; }

  // ---------- 四季：地图、颗粒 ----------
  C.mapImgs = Object.assign(C.mapImgs || {}, { seasons: {
    spring: { day: "img/map-town-spring.jpg", night: "img/map-town-spring-night.jpg" },
    summer: { day: "img/map-town-summer.jpg", night: "img/map-town-summer-night.jpg" },
    autumn: { day: "img/map-town.jpg", night: "img/map-town-night.jpg" },
    winter: { day: "img/map-town-winter.jpg", night: "img/map-town-winter-night.jpg" }
  } });
  C.seasons.outdoorPlaces = ["corner", "bank", "bar", "riverside", "sales", "kinder"];
  C.seasonFx = {
    spring: { n: 14, particle: "petal" }, summer: { n: 7, particle: "glare" },
    autumn: { n: 16, particle: "leaf" }, winter: { n: 34, particle: "snow" }
  };
  C.winterNag = {
    morning: "夜里又降了温，早上起来哈气成冰。你身上还是单衣——再不添件厚的，干活、站街都会越来越吃力。",
    banner: "天冷了，你还没有厚衣服。体力掉得更快——最便宜的棉服 ¥{p}。",
    toast: "风像刀子。没有厚衣服在外头站着，体力会掉得更快。"
  };

  // ---------- 澡堂 ----------
  C.bath = {
    items: [
      { id: "wash", name: "冲个淋浴", price: 6, minutes: 30, dec: 20, stamina: 4, mental: 3, text: "喷头不太热，水压倒挺足。你把头发搓了两遍，泡沫顺着肩膀流下去，灰色的。" },
      { id: "soak", name: "泡一池热水", price: 15, minutes: 60, dec: 32, stamina: 9, mental: 7, clear: true, text: "水烫得你龇牙，泡了两分钟，腰上的酸劲儿一点点松开。池子边几个老头在慢悠悠聊天，没人看你。" },
      { id: "rub", name: "搓澡 + 泡澡", price: 35, minutes: 90, dec: 45, stamina: 14, mental: 11, clear: true, text: "搓澡师傅一巴掌下去，一条灰卷从胳膊上滚下来，他笑：“有一阵子没洗了吧？”你也笑。搓完整个人轻了一圈。" }
    ],
    decPerClean: 0.45,
    winterBonus: { stamina: 3, mental: 3, text: "大冬天，热水一冲，整个人才算真的活过来。" }
  };

  // v1.0.1：澡堂只说「体面」。内部的 clean 由 dec 换算（体面 = 衣服 + 干净×0.45），保证洗完体面真的涨 dec
  C.bath.items.forEach(it => { it.clean = Math.min(100, Math.round(it.dec / 0.45)); });

  // ---------- 鱼 ----------
  C.fishKinds = [
    { name: "鲫鱼", sell: [8, 14], hunger: 40, mental: 4 },
    { name: "鲤鱼", sell: [16, 26], hunger: 50, mental: 5 },
    { name: "草鱼", sell: [14, 22], hunger: 48, mental: 5 },
    { name: "小黑鱼", sell: [6, 10], hunger: 34, mental: 3 }
  ];
  C.fishUse = {
    noFish: "手里还没有鱼。去河边蹲着，说不定哪天浮漂就沉了。",
    sellLine: "饭馆老板接过桶，掂了掂：“新鲜。”他从抽屉里数出几张钱，没讲价。",
    cook: { price: 6, minutes: 40, text: "后厨的师傅把鱼刮了鳞、拍了姜，扔进锅里炖。汤熬到发白，端出来的时候满屋都是香味。" },
    gift: { aff: 8, text: "对方愣了一下，接过袋子往里看了一眼，笑了：“哟，这么大一条！回头我给你留个好位置。”" }
  };

  // ---------- 人生（不是清单：全靠遇见、好感、事件自然冒出来）----------
  C.life = {
    ageYearDays: 365,
    minMarryAge: { m: 22, f: 20 }, kidMaxAge: { m: 52, f: 42 },
    bankGoal1: 3000,
    meet: { minDay: 8, where: ["riverside", "food", "bath"], p: 0.33 },
    bride: 2000,
    weddings: [
      { name: "简单：领证 + 一桌饭", price: 600, aff: 2, tables: 3, line: "没有婚纱，没有司仪。两家人挤了一桌，菜不多，酒是真的。你们都说：“就这样，挺好。”" },
      { name: "像样：十来桌酒席", price: 2400, aff: 5, tables: 12, line: "红幕布下，大姐的麦克风有点啸叫，满屋的人都在笑。你们给每一桌敬了酒，手心全是汗。" },
      { name: "隆重：全套仪式 + 摄像", price: 5200, aff: 9, tables: 24, line: "彩带炸开的那一下，对方的眼睛红了。摄像师追着你们拍，礼堂里挤满了老乡和工友。这一天，所有人都在替你们高兴。" }
    ],
    downRate: 0.3, feeRate: 0.02, payDays: 10,
    houses: [
      { id: "old1", name: "老楼一居", area: 38, tag: "六层老楼 · 没电梯", total: 24000, monthly: 450, text: "窗户朝南，楼道的灯一半不亮。但这是你自己的门，没人会再来涨房租。" },
      { id: "est2", name: "安居里两居", area: 62, tag: "新小区 · 有绿化", total: 46000, monthly: 800, text: "客厅能放下一张饭桌，卧室留一个小房间，将来给孩子。" },
      { id: "tower3", name: "带电梯的新楼", area: 88, tag: "高层 · 电梯 · 带车位", total: 82000, monthly: 1400, text: "站在阳台上看得到河。你想了想，没敢往下看价格那一行。" }
    ],
    // v1.0.1 存折利息：年利率 3%。游戏里一年 = 四季 × 每季 10 天 = 40 天（日历年 365 天太长，玩家一局根本看不见），
    // 所以按“游戏年”折算：每天 3%/40 = 0.075%（存 ¥10000 每天约 ¥7.5，一个季度 ≈ ¥75）。
    // 不可刷：只按存折余额算、不复利到口袋、每天只结一次、余额超过 capBank 的部分不再计息；比起日薪 150~250，它是“踏实感”不是“财路”。
    interest: { annual: 0.03, yearDays: 40, capBank: 50000 },
    partnerDaily: 40, kidDaily: 12, babyDays: 12,
    kinderAge: 15, kinderFee: 300, kinderDays: 10,
    gifts: [
      { id: "flower", name: "一小束花（路边摊）", price: 15, aff: 4 },
      { id: "fruit", name: "一袋水果", price: 28, aff: 6 },
      { id: "scarf", name: "一条围巾", price: 80, aff: 12, once: true },
      { id: "radio", name: "一个小收音机", price: 180, aff: 18, once: true }
    ]
  };
  C.lifeEndings = {
    win_home: { title: "有了自己的家", text: "你把门关上，把灯打开。屋子不大，可是每一盏灯都是你的。你们俩在沙发上坐了很久，谁都没说话，窗外有人在放不知道哪家的喜事爆竹。日子，往上走了一格。" },
    win_family: { title: "一家人", text: "接孩子的路上，夕阳把三个人的影子拉得很长。孩子骑在你脖子上，手里攥着一朵小红花。你突然想起刚来酒仙桥那天，在路口站着的自己。那个人，现在也有人在家等了。" },
    win_together: { title: "一起把日子过下去", text: "没有孩子的屋子，安静，也不空。你们俩晚上各捧一碗热汤，电视里放着没人看的节目。年纪是不饶人的，但有个人能一起变老，就是这辈子最大的福气。" }
  };

  // ---------- 她 / 他 ----------
  C.partnerDefs = {
    female: { names: ["阿梅", "小芸", "晓兰", "秀娟", "春燕"], job: "在饭馆后厨帮工", home: "老家离这里不远，周末回去一趟",
      look: { skin: "#f0c8a8", hair: "long", hairColor: "#2a1f1c", shirt: "#c46a72" } },
    male: { names: ["大军", "志强", "小亮", "建国", "老石"], job: "在附近的装修队干活", home: "一个人在外头租房住",
      look: { skin: "#d8a983", hair: "short", hairColor: "#1e1a18", shirt: "#4a6a58" } },
    widow: { names: ["桂芬", "素琴", "凤英", "玉珍"], job: "在小区门口摆摊卖菜", home: "孩子都在外地，一个人住",
      look: { skin: "#e3bd9c", hair: "grey", hairColor: "#9a9692", shirt: "#7a5a6a", wrinkles: true } }
  };
  C.partnerLines = {
    meet: {
      riverside: ["河边的风有点凉。你在长椅上坐着，旁边有个人也在看水。「{name}」对你笑了笑，说：“这儿的夕阳还行吧。”", "你们没聊几句。{name}说自己{job}，今天是出来透透气的。临走前回头看了你一眼。"],
      food: ["拉面馆里只剩一张空桌，你跟对面的人搭了个桌。那人叫{name}，{job}，吃面的时候总是先把汤吹凉。", "付钱的时候，{name}多看了你一眼：“你也是常来的吧？下回我请你加个蛋。”"],
      bath: ["澡堂门口的石阶上，有人在晾毛巾。是{name}，{job}。你们就着小卖部的瓶装水聊了几句，居然聊到了各自的老家。", "{name}说：“洗完澡，人才像个人。”你们都笑了。"]
    },
    chat: ["聊了聊最近的活。对方认真地听，没插话，最后说：“不容易。”就这三个字，让人心里一暖。", "说起老家的事。对方给你讲了小时候偷挖红薯被追着跑的故事，你笑得肚子疼。", "聊了聊以后。谁都没说得太满，但话里都有对方。", "对方问起你今天吃了什么。你支吾说随便对付了点——对方皱了皱眉，下次就多给你带一份。"],
    walk: ["沿着河边慢慢走。夕阳把水面染成一层碎金，对方的影子落在你的影子旁边。", "路灯一盏一盏亮起来。你们谁也没提回去的事，一直走到桥洞那头才折回来。", "风有点凉，对方把围巾往你这边扯了扯。你没说话，慢慢把步子放小了。"],
    dine: ["你要了一碗面，给对方的碗里多卧了个蛋。对方没客气，吃得很认真。", "热腾腾的汤冒着白气，对面的人眉毛上都挂着小水珠。你突然觉得，这顿饭比哪顿都香。", "吃到一半，对方把自己碗里的肉夹给你：“你干活累，你多吃点。”"],
    confess: {
      ok: "对方低着头，半天没抬起来。然后很轻很轻地“嗯”了一声：“我也是……早就想听你说这个了。”",
      no: "对方沉默了一会儿，说：“我挺喜欢跟你聊天的……就是，再等等吧。”语气不重，可也没松口。"
    },
    proposeOk: "“要是哪天你真准备好了……我愿意。”对方说这话的时候，脸红到了耳根。",
    weddingScene: ["红幕布缓缓拉开。", "麦克风里传来管事大姐的声音：“新人入场！”", "满桌的人都站起来鼓掌。"]
  };

  // ---------- 回家电话 ----------
  C.callPools = {
    open: {
      morning: ["“喂？这么早？吃早饭了吗？”", "“喂？你那边天亮了吧？起这么早？”", "“喂——喂？听得见吗？我这边信号不好。”"],
      day: ["“喂？正好我也想给你打呢。”", "“哎，是你啊。刚吃完饭，你吃了没？”", "“喂？今天怎么这时候打？”"],
      night: ["“这么晚还没睡？”", "“喂？是不是又加班了？别累着。”", "“都这点了，你还不睡？”"]
    },
    me: ["“嗯，我挺好的。”", "“没事，都挺好。”", "“知道啦，你别操心。”", "“吃了，吃了。”", "“嗯嗯，你放心。”"],
    money: {
      broke: ["“钱够用不？不够我这边……”“够，够用。”（你没敢说兜里剩多少。）", "“你别省着不吃饭。”“没省，真没省。”（你看了一眼空空的兜。）"],
      ok: ["“别太拼，钱够花就行。”“嗯，够花。”", "“你寄回来的我都给你攒着呢。”“妈，你自己花。”"],
      rich: ["“你这是发财了？说话都有劲儿了。”“哪有。”（你嘴角止不住往上翘。）", "“有钱别乱花，存着。”“存着呢，存折里。”"]
    },
    event: {
      record: ["“有人来家里问了你的事……”“没事，误会，我会处理。”", "“你可千万别学坏。”“不会的，我心里有数。”"],
      injured: ["“怎么听着有气无力的？是不是又累着了？”“有点腰酸，没事。”", "“你身子骨可别硬撑。”“嗯，我知道。”"],
      debt: ["“你欠人家的钱，别拖。”“我在还，快了。”", "“欠着钱，觉睡得着不？”“睡得着，我慢慢还。”"],
      dating: ["“你最近语气不一样了，有情况？”“……没有，真没有。”（你耳朵有点烫。）", "“是不是遇到什么人了？”“就是个认识的人，您别瞎猜。”"],
      married: ["“媳妇/对象好不好？”“好，特别好。”“那就行，好好过。”", "“你们俩有空回来一趟，我给你们做好吃的。”“好，等过几天。”"],
      home: ["“房子买了？真的假的？”“真的，钥匙在我这儿。”“哎呀……”（电话里传来吸鼻子的声音。）", "“有自己的地方了，我就放心了。”“嗯，您放心。”"],
      kid: ["“孩子呢？让我听听。”“孩子在睡，下回。”“那你替我亲亲。”", "“孩子最近长高没？”“长了一截，裤脚又短了。”"]
    },
    early: ["“刚去，还习惯吗？住哪儿？”", "“人生地不熟，别被人骗了。”", "“你吃饭了没？有没有地方住？”"],
    middle: ["“干了这些天，手上有茧了吧？”", "“你别总吃泡面，对身体不好。”", "“找着稳定点的活没有？”"],
    late: ["“你都去了那么久了，什么时候回来看看？”", "“你有出息了，我们都跟着高兴。”", "“差不多就回家吧，别太逞强。”"],
    season: {
      spring: ["“开春了，你那边是不是该换薄点的衣服了？”", "“家里的桃花开了，你要是在多好。”"],
      summer: ["“天这么热，记得多喝水，别中暑。”", "“你那边晒不晒？别硬扛。”"],
      autumn: ["“入秋了，早晚凉，你多穿点。”", "“家里在收玉米，满院子都是黄的。”"],
      winter: ["“天冷了，你那边下雪没有？有棉衣没有？”", "“冬天别在外头站太久，手脚冻坏了可不是闹着玩的。”", "“快过年了，你回不回来？”"]
    },
    close: ["“行，你忙你的，我挂了。”", "“好，有事就打电话，别硬撑。”", "“挂了啊，你早点睡。”", "“那……我不耽误你了。照顾好自己。”"]
  };
  C.callFamily = {
    xiaozhou: { who: "妈妈", ask: ["“你同学都找着实习了，你那边咋样？”", "“你到底是在哪儿‘体验生活’？电话里总是吵吵闹闹的。”"], me: "“都挺好的。”" },
    laozhou: { who: "儿子", ask: ["“爸，房贷我那边还撑得住，你别太累。”", "“爸，你别总舍不得吃，听见没？”"], me: "“嗯。”" },
    xiaolin: { who: "妹妹", ask: ["“哥，你欠的那些债……你别一个人扛。”", "“哥，妈让我问你，过年能不能回来。”"], me: "“嗯。”" },
    laok: { who: "老朋友", ask: ["“你那边咋样？……别什么都往心里放。”"], me: "“嗯。”" },
    azhen: { who: "妈妈", ask: ["“学费的事你别急，家里能凑一点。”", "“你一个姑娘家在外面，别太省，晚上早点回住的地方。”"], me: "“知道。”" },
    ayuan: { who: "妹妹", ask: ["“哥，你那儿冷不冷？”", "“哥，我考试成绩出来了，你猜多少？”"], me: "“嗯。”" }
  };

  // ---------- 管饭：每份活真的有一顿 ----------
  // at = 在这份活的第几成时开饭；tier = 好/凑合/差；hunger = 吃下去补多少饱腹
  // v1.0.1：这一顿吃下去要“顶用”——补得多、开饭晚一点（吃完后面少饿几个钟头），
  // 并且吃过饭的一班干完时，饱腹至少回到 floor（按好/凑合/差）
  const TIER = { "好": { hunger: 64, floor: 54 }, "凑合": { hunger: 54, floor: 44 }, "差": { hunger: 44, floor: 36 } };
  const D = (at, tier, dish, name, hunger, mental, flavor, text) => ({ at: Math.max(at, 0.55), tier, dish, name, hunger: TIER[tier].hunger, floor: TIER[tier].floor, mental, flavor, text });
  { const fj = C.jobs.find(x => x.id === "food"); if (fj) { fj.meal = true; fj.shout = fj.shout.replace("两百，", "两百，管一顿夜班饭，"); } }
  C.jobMeals = {
    courier: [D(0.5, "凑合", "workbox", "分拣站盒饭", 42, -1, "米饭压得实实的，菜只有两片白菜叶。你蹲在传送带边上，三口两口就扒完了。", "不到十分钟，铃一响，又得起身。")],
    guard: [D(0.5, "凑合", "workbox", "岗亭盒饭", 40, 0, "盒饭是小区物业送来的，凉了。你就着岗亭里的小太阳，吃得还挺香。", "")],
    coldstore: [D(0.45, "好", "canteen", "食堂热饭", 58, 4, "冷库边上的小食堂，一勺肉、一勺菜、一大碗热汤。热气扑上脸，手指才慢慢有了知觉。", "干冷库的活，就盼这一口热的。")],
    site: [D(0.5, "好", "canteen", "工地大锅饭", 60, 3, "大铁盆里炖着土豆和肥肉，馒头管够。工友们蹲成一排，吃得呼噜呼噜响。", "吃饭的时候，大家的话也多了。")],
    print: [D(0.5, "差", "bland", "寡淡的盒饭", 34, -3, "米饭夹生，菜汤像白开水。你一边嚼一边想：这算是饭吗。", "饭是管了，可也就是管了。")],
    green: [D(0.5, "差", "mantou", "冷馒头 + 咸菜", 30, -3, "工头从车斗里扔出一袋馒头，凉的，咸菜是塑料袋装的。你坐在草皮上，一口一口啃。", "没有汤，噎得慌，你到处找水。")],
    waiter: [D(0.55, "好", "canteen", "后厨员工餐", 50, 3, "客人没动过的红烧肉，被厨师长端给了服务员们。大家排队分着吃，说笑着，仿佛不是在干活。", "")],
    dishwash: [D(0.5, "好", "stew", "厨房剩下的炖菜", 52, 2, "师傅把锅底舀给你：“刚出锅的，别嫌弃。”你嘴上说不饿，筷子却先动了。", "")],
    food: [D(0.55, "好", "canteen", "工厂夜班饭", 0, 3, "后半夜，食堂阿姨推出一大盆米饭和炖菜。穿着防尘服的人排成一队，勺子磕着铁盆叮当响。", "一碗热饭下肚，手指才又灵活起来。")],
    antigen: [D(0.45, "凑合", "boxmeal", "厂里的夜宵盒饭", 44, 0, "后半夜，食堂阿姨推出一车盒饭。热的，吃得人鼻子发酸。", "")]
  };
})();

// ---------- 动画（接 js/fx2.js） ----------
(function () {
  const M = CONFIG.micro || (CONFIG.micro = {});
  M.commute = { type: "ride", title: "赶路", secs: 3.6, lines: ["车晃了一路，到了。"], clock: true };
  M.shiftend = { type: "shift", title: "一班干完", secs: 4, lines: ["一点一点熬过去。"] };
  M.netgame = { type: "moba", title: "网吧开黑 · 两局", secs: 17 };
  M.bath = { type: "bath", title: "洗澡", secs: 5.5, lines: ["热水浇下来，一天的灰顺着脚边流走。", "雾气糊了整面镜子。"] };
  M.wedding = { type: "wedding", title: "婚礼", secs: 9, lines: CONFIG.partnerLines.weddingScene };
  M.karaoke.secs = 8;
})();
