// 勇闯酒仙桥 v0.9.1 · 时间感 / 昼夜图 / 目标提醒 / 刮刮乐 / 小互动 数据
// ---- 昼夜图：同一构图的白天/夜里版本；dusk 不写就用白天图 + 暖色罩 ----
CONFIG.phaseImgs = {
  corner:    { dawn: "img/bg-corner-dawn.jpg", day: "img/bg-corner-day.jpg", night: "img/bg-corner-night.jpg" },
  food:      { day: "img/bg-food.jpg", night: "img/bg-food-night.jpg" },
  clothes:   { dawn: "img/bg-clothes.jpg", day: "img/bg-clothes-day.jpg", night: "img/bg-clothes-night.jpg" },
  bar:       { day: "img/bg-bar-day.jpg", night: "img/bg-bar.jpg" },
  bank:      { day: "img/bg-bank-day.jpg", night: "img/bg-bank.jpg" },
  lottery:   { day: "img/bg-lottery-day.jpg", night: "img/bg-lottery.jpg" },
  clinic:    { day: "img/bg-clinic.jpg", night: "img/bg-clinic-night.jpg" },
  agency:    { day: "img/bg-agency.jpg", night: "img/bg-agency-night.jpg" },
  riverside: { dawn: "img/bg-riverside.jpg", day: "img/bg-riverside.jpg", night: "img/bg-riverside-night.jpg" },
  dormtower: { dawn: "img/bg-dormtower.jpg", dusk: "img/bg-dormtower.jpg", day: "img/bg-dormtower-day.jpg", night: "img/bg-dormtower-night.jpg" }
  // inn / netcafe：没有窗户的屋里，一张图
};
CONFIG.mapImgs = { day: "img/map-town.jpg", night: "img/map-town-night.jpg" };
// 图的时段：05–07 清早 / 07–17 白天 / 17–19 傍晚 / 19–05 夜里
CONFIG.imgPhases = [ { id: "night", from: 0, to: 5 }, { id: "dawn", from: 5, to: 7 }, { id: "day", from: 7, to: 17 }, { id: "dusk", from: 17, to: 19 }, { id: "night", from: 19, to: 24 } ];
// 钟上的时段名
CONFIG.clockPhases = [
  { from: 0, to: 4, name: "深夜", icon: "🌌" }, { from: 4, to: 7, name: "清晨", icon: "🌅" }, { from: 7, to: 11, name: "上午", icon: "🌤️" },
  { from: 11, to: 13, name: "中午", icon: "☀️" }, { from: 13, to: 17, name: "下午", icon: "🌤️" }, { from: 17, to: 19, name: "傍晚", icon: "🌇" },
  { from: 19, to: 24, name: "夜里", icon: "🌙" }
];
// 日出日落（按季节，小时）
CONFIG.sunTimes = { spring: [5.9, 18.6], summer: [4.9, 19.6], autumn: [6.2, 17.8], winter: [7.1, 17.0], _: [6, 18] };
// 时间流逝的小字
CONFIG.timeBeat = {
  minMinutes: 120,
  toNight: "出来天已经黑了", toDay: "出来天已经亮了", toDusk: "太阳快落山了", toDeep: "已经是后半夜", preDawn: "天还没亮透", toNoon: "已经晌午了", same: "一晃 {h} 个钟头"
};

// ---- 目标提醒：每 3 天早上一张小卡；第 7/14/21/28 天一张大的回顾 ----
CONFIG.goalReminder = {
  every: 3, recapDays: [7, 14, 21, 28], paceDays: 30,
  smallTitle: "早上，想一想目标",
  bigTitle: "第 {d} 天 · 回头看一眼",
  lines: {
    xiaozhou: { ahead: "账本上的数比我想的好看一点。别飘。", behind: "又一个早上。手机里妈问吃了没，我回了个“吃了”。", flat: "日子在过，钱没怎么动。得换个活试试。" },
    laozhou:  { ahead: "腰还撑得住，钱也寄回去了一些。再干一阵。", behind: "老了，抢活抢不过年轻人。可家里等着呢。", flat: "攒下的钱总被一顿饭、一张床吃掉。" },
    xiaolin:  { ahead: "学费那根线，好像真能够着。", behind: "离开学的日子越来越近，卡里的数没跟上。", flat: "白天累，晚上睡不着，数字没长。" },
    laok:     { ahead: "手是干净的，兜里也鼓了点。这次也许真能走。", behind: "路口有人招手，说那边来钱快。我把手插回兜里。", flat: "又一天没犯事，可也没攒下。" },
    azhen:    { ahead: "债一笔一笔往下划，夜里能睡着了。", behind: "催债的短信比工钱来得准时。", flat: "还得慢，但还在还。" },
    ayuan:    { ahead: "窗台上的绿萝又冒了片新叶。这间屋子快像个家了。", behind: "房租、花盆、人情，一样都不能落下。", flat: "日子安静得像没过。可安静也是我要的。" },
    _:        { ahead: "比想的好一点。", behind: "得抓紧了。", flat: "还在路上。" }
  }
};

// ---- 刮刮乐：原创票面（不是任何真实彩票），返奖约 55–62% ----
CONFIG.scratchTickets = [
  { id: "xiaoxing", name: "小确幸", price: 2, color: "#e9b949", ink: "#6b3b00", art: "🍀", rule: "6 格里刮出 3 个一样的图案，就中这个图案下面的钱。",
    kind: "three", cells: 6, symbols: [ { s: "🍀", p: 500 }, { s: "🍬", p: 50 }, { s: "🧧", p: 10 }, { s: "🍊", p: 4 }, { s: "🥟", p: 2 } ],
    table: [ { p: 0, w: 6960 }, { p: 2, w: 2200 }, { p: 4, w: 600 }, { p: 10, w: 220 }, { p: 50, w: 18 }, { p: 500, w: 2 } ] },
  { id: "kaimen", name: "开门见喜", price: 5, color: "#d65a4a", ink: "#fff3e0", art: "🏮", rule: "刮开「幸运号」两个数。下面 8 个「我的号」里，跟幸运号一样的，就中它下面的钱。",
    kind: "match", lucky: 2, cells: 8, prizes: [5, 5, 10, 10, 20, 20, 100, 1000],
    table: [ { p: 0, w: 7060 }, { p: 5, w: 2000 }, { p: 10, w: 600 }, { p: 20, w: 300 }, { p: 100, w: 36 }, { p: 1000, w: 4 } ] },
  { id: "bubugao", name: "节节高", price: 10, color: "#3f8f6b", ink: "#effbe9", art: "🎋", rule: "三行，每行三个图案。哪一行三个都一样，就中那一行右边的钱。",
    kind: "rows", rows: 3, symbols: ["🎋", "🐟", "🔔", "🌙", "🍑"],
    table: [ { p: 0, w: 7245 }, { p: 10, w: 1800 }, { p: 20, w: 700 }, { p: 50, w: 200 }, { p: 200, w: 50 }, { p: 2000, w: 5 } ] },
  { id: "jinfanwan", name: "金饭碗", price: 20, color: "#2f4f86", ink: "#ffe9a8", art: "🍚", rule: "刮开 3 个「幸运号」。下面 12 个「我的号」，对上一个中一个。",
    kind: "match", lucky: 3, cells: 12, prizes: [20, 20, 20, 40, 40, 40, 100, 100, 500, 500, 5000, 20],
    table: [ { p: 0, w: 7297 }, { p: 20, w: 1700 }, { p: 40, w: 700 }, { p: 100, w: 250 }, { p: 500, w: 50 }, { p: 5000, w: 3 } ] }
];
CONFIG.scratchFx = {
  winSmall: [ "回本了。手指在玻璃柜台上敲了两下。", "中了一点。老板头也不抬：“再来一张？”", "小钱，可心里亮了一下。" ],
  winBig:   [ "你盯着那几个格子看了三遍。是真的。", "老板站起来了：“哟！”店里几个人都回头看你。", "手有点抖。今天的工钱，有了。" ],
  lose:     [ "谢谢惠顾。粉末糊了一手。", "差一个。总是差一个。", "唉。", "你把票揉成一团，又展开看了一眼。" ],
  streak:   "连着几张都没中，心里空了一块。",
  habit:    "你发现自己路过彩票店，脚步会慢下来。",
  winMental: 3, bigMental: 8, streakAt: 3, streakMental: -3
};

// ---- 小互动：每个地点动作的 3–10 秒小戏。第一次看完整，之后可以跳过 ----
// type: beat（动画+字幕）/ collect（点着捡）/ wipe（拖着擦）/ dial（拨号）/ spin（洗衣机）/ count（数钱盖章）
CONFIG.micro = {
  scrap:   { type: "collect", title: "捡瓶子", targets: ["🥤", "🧴", "🥫", "🍾", "🥤", "🧃", "🥫", "🧴"], need: 6, secs: 9, sfx: "pop",
             after: { sprite: "⚖️", lines: ["收废品的老头把袋子挂上秤，秤砣往外拨了拨。", "“{money} 块，拿好。”"], sfx: "coin" } },
  oddjob:  { type: "wipe", title: "帮老板收拾", hint: "按住拖动，把桌子擦干净", secs: 8, sfx: "wipe",
             after: { sprite: "🍚", lines: ["老板端出一碗剩饭，上面盖了几片肉。"], sfx: "clink" } },
  laundry: { type: "spin", title: "洗衣服", secs: 6, lines: ["投币。", "滚筒转起来，水声哗哗。", "拧干，搭在晾衣绳上。"] },
  send:    { type: "count", title: "汇款", secs: 5, lines: ["一张一张地数。", "柜员盖章——咚。", "回执吐出来，热乎乎的。"] },
  call:    { type: "dial", title: "给家里打电话", secs: 8, lines: ["“喂？吃了没？”", "“吃了吃了。这边挺好的。”", "“钱够不够花？”", "“够。你们注意身体。”"] },
  sleep:   { type: "beat", title: "睡觉", secs: 4, cls: "mx-sleep", sprite: "💤", lines: ["灯灭了。", "隔壁的呼噜声，楼下的电动车。", "你数着数着就睡着了。"], sfx: "zzz", clock: true },
  street:  { type: "beat", title: "铺纸板", secs: 5, cls: "mx-card", sprite: "📦", lines: ["把纸板拆开，一层一层铺在地上。", "外套盖在身上，书包当枕头。", "风从桥洞那头灌过来。"], sfx: "paper", clock: true },
  netgame: { type: "choose", title: "通宵网吧", secs: 6, cls: "mx-net", sprite: "🖥️", ask: "屏幕亮了。干点啥？",
             options: [ { t: "打两把游戏", line: "耳机里一阵枪响，时间过得飞快。" }, { t: "刷招工信息", line: "一条条往下划，记下两个电话。" }, { t: "趴着睡会儿", line: "键盘压着脸，醒来脸上印着字母。" } ], sfx: "beep" },
  clinic:  { type: "beat", title: "村卫生室", secs: 5.5, cls: "mx-clinic", deco: "clinic", lines: ["大夫看了一眼，没多问。", "消毒水凉凉的，纱布一圈一圈缠上。", "“少碰水，过两天再来换。”"], sfx: "" },
  agency:  { type: "form", title: "劳务中介", secs: 7, fields: ["姓名", "身份证号", "联系电话", "意向工种"], lines: ["你把表格推回去。", "交钱，收据上盖了个红戳。"], sfx: "stamp" },
  chat:    { type: "chat", title: "路口闲聊", secs: 9 },
  fish:    { type: "fish", title: "河边钓鱼", secs: 8, lines: ["浮漂一沉——", "提竿！"], sfx: "splash" },
  karaoke: { type: "beat", title: "河边唱歌", secs: 6, cls: "mx-sing", deco: "sing", lines: ["音箱滋滋啦啦响。", "你跟着唱，跑调也没人管。", "唱完有人鼓掌，是个大爷。"], sfx: "sing" },
  rest:    { type: "idle", title: "歇一会", secs: 5, cls: "mx-rest", lines: ["找个台阶坐下，腿慢慢不抖了。"], clock: true,
    pool: { morning: ["早班的车一辆接一辆，没人看你。", "太阳刚爬上楼顶，背上有一点点暖。"], day: ["日头正毒，影子缩成一小团。", "旁边的大爷在剥花生，壳子落了一地。"], evening: ["收工的人流过来了，到处是饭菜的味道。", "天一点点暗下来，路灯一盏接一盏亮。"], night: ["风有点凉，把领口拉紧。", "夜里的路口安静了，只剩远处的车声。"] } },
  wait:    { type: "idle", title: "等", secs: 4.5, cls: "mx-wait", lines: ["看人来人往，车一辆接一辆。"], clock: true,
    pool: { morning: ["有人拎着编织袋匆匆走过去，没回头。", "一辆面包车停了停，又开走了。"], day: ["时间过得很慢，影子慢慢挪。", "有人蹲在墙根抽烟，一句话也不说。"], evening: ["有人收摊，有人刚来。", "远处工地的灯亮了。"], night: ["夜里等人的，都不怎么说话。", "手机屏幕亮了又灭。"] } },
  board:   { type: "beat", title: "看白板", secs: 4.5, cls: "mx-board", deco: "board", lines: ["白板上的字擦了又写，写了又擦。"], sfx: "" },
  rent:    { type: "beat", title: "交房租", secs: 4.5, cls: "mx-key", deco: "rent", lines: ["房东数了数钱，把钥匙放在你手心里。", "钥匙有点凉。"], sfx: "" },
  borrow:  { type: "bubbles", title: "开口借钱", secs: 5, lines: ["“那个……手头有点紧。”", "“……要多少？”", "“下礼拜一定还。”", "对方沉默了一会儿。"] },
  cloth_pay: { type: "count", title: "付钱", secs: 4, stamp: "已付", noReceipt: true, lines: ["数出几张钱，递过去。", "老板把价签一剪。", "“穿着走？”"] },
  mirror:  { type: "mirror", title: "照镜子", secs: 4.5, lines: ["你站到镜子前，把衣角拽平。", "……"] },
  commute: { type: "beat", title: "赶路", secs: 3.5, cls: "mx-ride", sprite: "🚐", lines: ["车身晃了一路。"], sfx: "", clock: true },
  shiftend:{ type: "beat", title: "一班干完", secs: 4, cls: "mx-shift", sprite: "⏱️", lines: ["一点一点熬过去。"], sfx: "tick", clock: true },
  free:    { type: "beat", title: "透口气", secs: 4, cls: "mx-free", sprite: "🌊", lines: ["风吹过来，脑子里那根弦松了一点。"], sfx: "wind" }
};

// ---- 吃饭：按价钱分档。cheap 三两口、good 慢慢吃 ----
CONFIG.chatPool = [
  ["“听说工地又拖钱了。”", "“哪个工地？……那家我先不去了。”"],
  ["“早点来，五点就有车。”", "“五点……那得四点半就在这儿等。”"],
  ["“吃了没？”", "“还没，等挣了这一单。”"],
  ["“后街那家面馆，便宜管饱。”", "“记着了，谢谢哥。”"],
  ["“小伙子，头一回来？”", "“嗯，刚到没几天。”"],
  ["“夜里冷，纸板多垫两层。”", "“好，我记着。”"],
  ["“中介那边的押金，别多给。”", "“嗯……我心里有数。”"],
  ["“我老家那边也这样，一到冬天就停工。”", "“是啊，都不容易。”"],
  ["“那个仓库干一天结一天，就是冷。”", "“冷我能扛。”"],
  ["“有烟没？”", "“不抽，对不住。”"],
  ["“你这鞋还能穿不？”", "“还行，再对付一阵。”"],
  ["“干活别逞强，腰要紧。”", "“嗯，谢谢。”"]
];
CONFIG.eatFx = {
  cheap:  { type: "eat", secs: 4.2, bites: 3, open: "三两口的事。", belly: "垫了垫。胃还在叫，可手不抖了。", sfxEnd: "" },
  normal: { type: "eat", secs: 6, bites: 5, open: "热气扑到脸上。", belly: "一股热乎劲从胃里散开，肩膀松下来了。", sfxEnd: "" },
  good:   { type: "eat", secs: 8.2, bites: 7, open: "香气先到，筷子后到。", belly: "整个人都暖透了。这顿，吃明白了。", sfxEnd: "sighgood",
            lines: ["先喝一口汤。", "", "慢一点，不赶时间。", "", "咽下去的时候眼睛都眯起来了。"] },
  kinds: {
    noodle: { utensil: "🥢", sfxBite: "slurp", sfxChew: "chew" }, dumpling: { utensil: "🥢", sfxBite: "crunch", sfxChew: "chew" },
    bun: { utensil: "🥢", sfxBite: "crunch", sfxChew: "chew" }, sausage: { utensil: "🥢", sfxBite: "crunch" },
    box: { utensil: "🥄", sfxBite: "chew" }, boxmeal: { utensil: "🥄", sfxBite: "chew" }, leftover: { utensil: "🥄", sfxBite: "chew" },
    stew: { utensil: "🥄", sfxBite: "chew", sfxChew: "chew" }, lamb: { utensil: "🥢", sfxBite: "chew", sfxChew: "crunch" }, bbq: { utensil: "🥢", sfxBite: "chew" },
    beer: { utensil: "🍺", sfxBite: "glug" }
  }
};
