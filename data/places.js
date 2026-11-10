// ===================== 地点、商品、住处 =====================
// 地点会按顺序从左到右画在街上。open/close 是营业时间（close 小于 open 表示开到第二天）。
window.CONFIG = window.CONFIG || {};

CONFIG.places = [
  { id: "corner",  name: "人力市场路口", sign: "劳务 · 日结", open: "00:00", close: "24:00",
    desc: "十字路口、花坛、中介门店。早上五点和下午四点到六点，等活的人最多。" },
  { id: "food",    name: "老马清真饭馆", sign: "清真 · 拉面 饺子", open: "04:00", close: "24:00",
    desc: "早点、拉面、饺子、盒饭，也有贵一点的铁锅炖。点开能看见菜长什么样。" },
  { id: "clothes", name: "服装店（地摊到品牌）",  sign: "服装 鞋袜 · 试穿", open: "09:00", close: "21:00",
    desc: "从二三十块的地摊货，到两三百的品牌冲锋衣、西装外套都有。门口有投币洗衣机。试穿能看上身效果。" },
  { id: "inn",     name: "平安旅社",     sign: "平安旅社 床位 单间", open: "00:00", close: "24:00",
    desc: "床位按天算钱，要谨防同屋人的顺手牵羊。" },
  { id: "bar",     name: "老地方烧烤",   sign: "老地方烧烤 · 啤酒", open: "17:00", close: "03:00",
    desc: "撸串、喝啤酒、吹牛。夜里总有喝多了的人趴在桌上。" },
  { id: "bank",    name: "银行自助厅·公交站", sign: "24h 自助银行", open: "00:00", close: "24:00",
    desc: "可以给家里转账。夜里有人在这里铺被子睡觉；这里也是离开酒仙桥的车站。" }
];

// 饭馆菜单：hunger/mental/stamina=数值；flavor=吃的时候弹出的味道文案；dish=素描图种类
CONFIG.menu = [
  { id: "bun",      name: "小笼包+豆浆",   price: 9,  hunger: 35, mental: 2, stamina: 2, from: "04:00", to: "10:00",
    note: "早点摊，等活前垫一口", dish: "bun",
    flavor: "包子皮还烫嘴，豆浆灌下去，胃里终于有点热气。" },
  { id: "noodle",   name: "牛肉拉面加卤蛋", price: 14,  hunger: 45, mental: 3, stamina: 3, from: "06:00", to: "24:00",
    note: "12 元一碗，卤蛋 2 元", dish: "noodle",
    flavor: "热汤灌进胃里，眼睛都亮了。面劲道，卤蛋刚好。" },
  { id: "dumpling", name: "羊肉饺子一大盘", price: 18, hunger: 50, mental: 4, stamina: 4, from: "10:00", to: "24:00",
    note: "热乎、管饱", dish: "dumpling",
    flavor: "醋一蘸，羊肉香气扑上来。吃完额头冒了汗。" },
  { id: "boxmeal",  name: "两荤一素盒饭",   price: 16, hunger: 65, mental: 2, stamina: 5, from: "10:00", to: "21:00",
    note: "米饭馒头管饱", dish: "box",
    flavor: "米饭压得瓷实，两块红烧肉化在嘴里。这顿算吃明白了。" },
  { id: "sausage",  name: "炸淀粉肠",       price: 4,  hunger: 12, mental: 1, stamina: 0, from: "04:00", to: "24:00",
    note: "便宜的小零嘴", dish: "sausage",
    flavor: "外皮焦脆，油星迸在舌头上。也就两口的事。" },
  { id: "stew",     name: "铁锅炖大盘",     price: 48, hunger: 78, mental: 8, stamina: 10, from: "11:00", to: "22:00",
    note: "贵一点，但能吃得心满意足", dish: "stew",
    flavor: "粉条吸饱了汤，土豆软烂，肉香在嘴里停了很久。这一顿值回票价。" },
  { id: "lamb",     name: "烤羊肉串拼盘",   price: 62, hunger: 70, mental: 10, stamina: 6, from: "16:00", to: "24:00",
    note: "饭馆也做烧烤，比路边摊干净点", dish: "bbq",
    flavor: "孜然和辣椒糊在唇上，肉汁顺着牙缝往下走。撑得想靠一会儿。" }
];
// 路口的剩饭盒饭：便宜但可能闹肚子
CONFIG.leftover = { name: "大姐的剩饭盒饭", price: 6, hunger: 45, mental: 0, stamina: 1, from: "16:00", to: "19:00",
  sickChance: 0.25, sickText: "吃完闹肚子了，跑了好几趟厕所。", sickStamina: -12,
  dish: "leftover", flavor: "味道怪怪的，但便宜。咽下去就算了。" };

// 衣服：decency=体面；warm=挡风；guard=保安加分；hire={工种:加分}；colors/style 给上身素描用
// tier: cheap / mid / expensive / start
CONFIG.clothes = [
  { id: "student", name: "学生T恤", price: 0, tier: "start", decency: 45, warm: false, hidden: true,
    colors: { top: "#4f7fa8", pants: "#3a4550", style: "tee" }, note: "来时穿的" },
  { id: "old", name: "旧夹克", price: 0, tier: "start", decency: 30, warm: false, hidden: true,
    colors: { top: "#6b5a48", pants: "#3a3530", style: "jacket" }, note: "洗得发白的旧夹克" },

  // —— 便宜（地摊 / 两元店）——
  { id: "tshirt", name: "二手T恤", price: 20, tier: "cheap", decency: 40, warm: false,
    colors: { top: "#c45c3e", pants: "#3a4550", style: "tee" }, note: "地摊二三十块一件",
    cleanBonus: 4 },
  { id: "guardsuit", name: "二手保安服", price: 25, tier: "cheap", decency: 45, warm: false, guard: 0.12,
    colors: { top: "#26344f", pants: "#1f2a3d", style: "uniform", accent: "#c9a227" },
    note: "兜里还掏出一个吉他拨片", hire: { guard: 0.12 } },
  { id: "hoodie", name: "地摊卫衣", price: 28, tier: "cheap", decency: 42, warm: true,
    colors: { top: "#5a6e4a", pants: "#3a3530", style: "hoodie" }, note: "帽子能挡点风",
    cleanBonus: 3 },
  { id: "army", name: "迷彩军大衣", price: 48, tier: "cheap", decency: 35, warm: true,
    colors: { top: "#5a6b3c", pants: "#3a4530", style: "coat", pattern: "camo" },
    note: "两元店 48 块，略能挡风" },

  // —— 冬装（v0.9 四季：冬天贵、夏天便宜）——
  { id: "padded", name: "加厚棉袄", price: 118, tier: "mid", decency: 46, warm: true, winter: true,
    colors: { top: "#4a3b33", pants: "#2e2a28", style: "coat" }, note: "里头絮的是真棉花，冬天站一早上不打哆嗦", mental: 1 },
  { id: "cottonset", name: "棉服 + 棉鞋一套", price: 188, tier: "mid", decency: 52, warm: true, winter: true,
    colors: { top: "#36485a", pants: "#2a2f36", style: "coat" }, note: "连脚都捂住了，冬天干活不冻手脚", mental: 2, hire: { coldstore: 0.06 } },

  // —— 中档 ——
  { id: "workpolo", name: "干净的工装Polo", price: 68, tier: "mid", decency: 58, warm: false,
    colors: { top: "#2f6b4f", pants: "#2a3530", style: "polo" },
    note: "进食品厂、药厂看着顺眼",
    hire: { food: 0.06, antigen: 0.06 }, cleanBonus: 8, mental: 2 },
  { id: "jacket", name: "冲锋衣外套", price: 99, tier: "mid", decency: 70, warm: true,
    colors: { top: "#355a7a", pants: "#2a3038", style: "jacket", accent: "#c9d4de" },
    note: "穿上像个正经上班的",
    hire: { courier: 0.04, food: 0.03 }, cleanBonus: 6, mental: 3 },
  { id: "darkpants", name: "黑长裤+白衬衫", price: 118, tier: "mid", decency: 74, warm: false,
    colors: { top: "#f2efe8", pants: "#1a1a1a", style: "shirt" },
    note: "端盘子、进车间都更体面",
    hire: { food: 0.05, antigen: 0.05, courier: 0.03, guard: 0.03 }, cleanBonus: 10, mental: 3 },

  // —— 贵的（品牌 / 像样）——
  { id: "down", name: "厚实羽绒服", price: 198, tier: "expensive", decency: 78, warm: true,
    colors: { top: "#8b3b33", pants: "#2a2420", style: "puffer" },
    note: "夜里露宿也不那么怕冻",
    hire: { courier: 0.03, guard: 0.05 }, cleanBonus: 6, mental: 4 },
  { id: "brand", name: "品牌冲锋衣", price: 268, tier: "expensive", decency: 88, warm: true,
    colors: { top: "#1e3a5f", pants: "#1a2430", style: "brand", accent: "#e8c96a" },
    note: "长期工年轻人爱穿的那种；招工的人会多看两眼",
    hire: { courier: 0.08, food: 0.05, antigen: 0.05, guard: 0.04 }, cleanBonus: 10, mental: 6 },
  { id: "office", name: "像样的西装外套", price: 320, tier: "expensive", decency: 95, warm: false,
    colors: { top: "#2c2c34", pants: "#1a1a20", style: "suit", accent: "#c9a227" },
    note: "去中介谈长期、见领导都有底气；体面拉满",
    hire: { courier: 0.06, food: 0.08, antigen: 0.07, guard: 0.10 }, cleanBonus: 12, mental: 8 }
];
CONFIG.laundry = { name: "投币洗衣机", price: 10, clean: 100, minutes: 60 };
CONFIG.tierNames = { start: "随身", cheap: "地摊·便宜", mid: "中档", expensive: "品牌·贵" };

// 住处：price 每晚多少钱；recover 每小时恢复；stealRisk 睡着时被偷的概率
CONFIG.lodging = [
  { id: "upper",  name: "床位·上铺",  where: "inn",  price: 22, recover: { stamina: 10, mental: 3 }, stealRisk: 0.18, canPick: true,
    note: "几张上下铺摆一屋，鼾声、脚臭、半夜有人进出" },
  { id: "lower",  name: "床位·下铺",  where: "inn",  price: 28, recover: { stamina: 11, mental: 3 }, stealRisk: 0.14, canPick: true,
    note: "比上铺方便，路过的人顺手一拿也方便" },
  { id: "room",   name: "单间（公共卫浴）", where: "inn", price: 80, recover: { stamina: 13, mental: 6 }, stealRisk: 0, canPick: false,
    note: "有门有锁，冬天有暖气" },
  { id: "netbar", name: "网吧通宵",   where: "inn",  price: 20, recover: { stamina: 5,  mental: 3 }, stealRisk: 0.08, canPick: false, maxHours: 7,
    note: "一夜十几块，还能玩游戏，只是睡得不舒服" },
  { id: "street", name: "在自助厅门口打地铺", where: "bank", price: 0, recover: { stamina: 5, mental: 1 }, stealRisk: 0.25, canPick: false, cold: true,
    note: "不花钱。没有厚衣服的话，夜里冻得睡不着；保安常来撵人" }
];
CONFIG.coldPenalty = { stamina: -3, text: "夜风从门缝钻进来，冻得一宿没睡踏实。" };
CONFIG.robbedRange = [0.10, 0.25];
CONFIG.robbedMax = 120;

// 烧烤摊
CONFIG.bar = {
  beer:   { name: "冰啤酒一瓶", price: 10, mental: 7, stamina: -2, hunger: 3, dish: "beer",
    flavor: "冰气冲鼻，灌下去胸口一凉。今晚又多了一瓶。" },
  skewer: { name: "撸串（和工友拼一桌）", price: 58, mental: 12, hunger: 40, stamina: 2, chat: true, dish: "bbq",
    flavor: "烟火气糊在衣服上，串油顺着手指往下滴。跟工友瞎扯着，肚子慢慢热起来。" }
};
