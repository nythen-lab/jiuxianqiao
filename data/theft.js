// ===================== 顺手牵羊（偷窃）与案底 =====================
// 参考《天国：拯救》的扒窃：靠近目标 → 按住鼠标，让“手”留在晃动的圆圈里 → 进度满了就到手。
// 手出了圈、目标警觉、旁边有人看着、灯光亮，都会让“惊觉值”上涨，满了就被抓。
// 注意：偷睡着的人是本游戏的设计。
window.CONFIG = window.CONFIG || {};

CONFIG.theft = {
  // 可以下手的目标。where=在哪个地点出现；hours=几点到几点；
  // alert=警觉度 0–1（睡着的人低，喝多的中等）；light=光线 0–1；witnesses=周围可能有几个人看着 [最少, 最多]
  // loot=可能偷到的东西：money 是 [最少, 最多] 元；item 是物品；time=要摸多久（秒）
  targets: [
    { id: "dorm",   where: "inn",    hours: ["22:00", "04:00"], name: "床位房里睡熟的室友", needBed: true,
      alert: 0.25, light: 0.15, witnesses: [0, 2],
      desc: "鼾声此起彼伏。他的裤子挂在床头，裤兜鼓鼓的。",
      loot: [ { money: [15, 60], time: 2.6, weight: 6 }, { money: [60, 120], time: 3.6, weight: 2 }, { item: "烟", time: 2.0, weight: 3 } ] },
    { id: "sleeper", where: "bank",  hours: ["23:00", "04:30"], name: "在自助厅门口打地铺的人",
      alert: 0.35, light: 0.45, witnesses: [0, 1],
      desc: "他把被褥铺在台阶上，手机和钱包压在枕头底下。玻璃门里的灯一直亮着。",
      loot: [ { money: [5, 30], time: 2.2, weight: 6 }, { money: [30, 80], time: 3.4, weight: 2 }, { item: "烟", time: 1.8, weight: 2 } ] },
    { id: "corner",  where: "corner", hours: ["00:00", "04:30"], name: "花坛边裹着大衣睡着的人",
      alert: 0.3, light: 0.3, witnesses: [0, 1],
      desc: "路口只剩几盏路灯。他缩在大衣里，鞋子当枕头。",
      loot: [ { money: [5, 25], time: 2.0, weight: 6 }, { item: "烟", time: 1.6, weight: 3 } ] },
    { id: "drunk",   where: "bar",    hours: ["21:00", "03:00"], name: "喝多了趴在桌上的客人",
      alert: 0.5, light: 0.8, witnesses: [1, 4],
      desc: "他趴在一堆空啤酒瓶中间，钱包从后兜露出一个角。烧烤摊的灯泡很亮，邻桌还在划拳。",
      loot: [ { money: [40, 150], time: 3.2, weight: 5 }, { money: [150, 260], time: 4.2, weight: 1 } ] }
  ],

  // 小游戏手感
  circleBase: 46,        // 圆圈基础半径（像素），每级“顺手”技能 +6
  circlePerSkill: 6,
  driftBase: 40,         // 圆圈晃动速度，警觉越高晃得越快
  driftAlert: 150,
  outsideSuspicion: 55,  // 手在圈外时，每秒惊觉值上涨
  baseSuspicion: 4,      // 就算手在圈内，每秒也会慢慢上涨（乘以警觉度）
  witnessChance: 0.10,   // 每有一个旁人、每秒被看见的概率（再乘以光线）
  witnessJump: 35,       // 被旁人瞥见时，惊觉值一下涨多少
  skillGainOnSuccess: 1, // 成功一次，“顺手”技能 +1（最高 5）
  guiltMental: -6,       // 偷完心里发虚，精神变化

  // 被抓之后
  caught: {
    fine: 200,                 // 治安罚款（钱不够就改为拘留）
    detainHours: 24,           // 拘留多久（游戏时间小时）：直接跳过一天
    beatenStamina: -20,        // 被事主揍了一顿
    mental: -18,
    npcAffinity: -15,          // 所有工友好感度下降
    rep: -30                   // 街头口碑下降
  },
  // 被抓时的台词（随机挑一句）
  caughtLines: [
    "你的手还没抽出来，手腕就被一把攥住了：“抓小偷！”",
    "他突然睁开眼睛，跟你对视了一秒，然后大喊起来。",
    "“干嘛呢你！”旁边有人站了起来，手电光照在你脸上。"
  ],
  // 派出所里的话
  policeLines: [
    "派出所的民警翻着记录：“盗窃，金额不大，治安处罚。记录会留着。”",
    "“年纪轻轻的干点什么不好？”民警把你的身份证拍在桌上。"
  ],
  // 游戏里怎么称呼“案底”
  recordName: "案底",
  recordExplain: "被抓过一次就会留下“案底”（日结一般不看，但找短期工和保安日结会有麻烦）。有案底：招工的更容易拒绝你，安保不要你，有的人会压你工钱，工友也会疏远你。"
};
