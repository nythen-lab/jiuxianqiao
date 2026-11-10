// ===================== 身份 =====================
// v0.3：开放日历。老周寄回约一个月房贷月供；小周至少体验两周。
window.CONFIG = window.CONFIG || {};

CONFIG.identities = [
  {
    id: "xiaozhou",
    name: "小周",
    age: 20,
    tag: "大学生 · 来体验生活",
    playable: true,
    look: { skin: "#f1c9a5", hair: "short", hairColor: "#2b2522", shirt: "#4f7fa8", glasses: true, age: 20 },
    comic: [
      { scene: "campus",  title: "校园",   text: "小周，二十岁，社会学大二。导师随口一句：“你去酒仙桥看看——那些凌晨五点等活的人，每天在想什么？”" },
      { scene: "notebook", title: "笔记本", text: "他翻开新买的笔记本，第一页写着：不要只采访数字，要听故事。暑假，他决定自己去干一遍。" },
      { scene: "subway",  title: "地铁",   text: "背着双肩包，坐地铁到同济南路，再一路往南。过了凉水河，桥南边是窄街、矮房子和密密麻麻的招牌。" },
      { scene: "street",  title: "桥南",   text: "“酒仙桥到了。”天还黑着，路口已经站满了人。有人捂着保温杯，有人盯着中介门口的白板。" },
      { scene: "crowd",   title: "路口",   text: "他想知道：那些人为什么站在这里，又怎样才能离开。他自己，至少要在这里待上两个星期。" }
    ],
    goalText: "至少待满 14 天，听到 8 段工友的故事，并且干过至少 3 种不同的活。达成后可随时离开。",
    goalBullets: [
      "至少待满 14 天（第 14 天中午以后才能走）",
      "听到 8 段工友的故事（坐车、聊天时收集）",
      "干过至少 3 种不同的活",
      "没有天数上限——想多待就多待；撑不住了才算输"
    ],
    goal: { type: "stories", stories: 8, jobTypes: 3, minDays: 14 },
    startMoney: 400,
    stats: { stamina: 90, mental: 75, hunger: 70, clean: 80 },
    maxStamina: 100,
    attrs: { brain: 9, exp: 2, phone: 9 },
    skills: { hands: 1, knife: 0, eye: 2, pick: 0 },
    outfit: "student",
    hireBonus: 0.05,
    npcTalks: ["zhou_a", "zhou_b"]
  },
  {
    id: "laozhou",
    name: "老周",
    age: 55,
    tag: "给儿子还房贷",
    playable: true,
    look: { skin: "#c9926a", hair: "grey", hairColor: "#8d8a86", shirt: "#6b5a45", glasses: false, age: 55, wrinkles: true },
    comic: [
      { scene: "village", title: "老家",   text: "老周，五十五岁，河北人。儿子在县城买了房，每个月要还三千多的房贷。" },
      { scene: "phone",   title: "电话",   text: "儿媳刚生了孩子，儿子的厂子又放了长假。电话里儿子没说要钱——老周听得出来。" },
      { scene: "money",   title: "三百块", text: "他把仅剩的三百块钱叠好，塞进内衣口袋。同村人说：“北京东南边有个酒仙桥，干一天结一天。”" },
      { scene: "street",  title: "上车",   text: "夜里上了长途大巴。他不太会用手机里那些程序，可他会干活。" },
      { scene: "crowd",   title: "酒仙桥", text: "天还没亮，他站在路口。他得往家里寄够一个月的月供——三千块。寄够了就能走，不着急定日子。" }
    ],
    goalText: "给家里寄回 3,000 元（约一个月房贷月供）。寄够了就可以提前离开。",
    goalBullets: [
      "随时点顶栏「寄钱」或走到「银行自助厅」给家里转账，金额自己填，累计寄回 ¥3,000",
      "床位、吃饭、杂七杂八，一天少说七八十；日结一百四到两百四，还要被中介抽成、碰上下雨没活：省着花、天天抢，大约三个星期能攒够",
      "没有天数上限——寄够了随时走；撑不住了才算输"
    ],
    goal: { type: "send", amount: 3000 },
    startMoney: 300,
    stats: { stamina: 75, mental: 70, hunger: 70, clean: 55 },
    maxStamina: 80,
    attrs: { brain: 4, exp: 9, phone: 2 },
    skills: { hands: 3, knife: 2, eye: 4, pick: 0 },
    outfit: "old",
    hireBonus: 0,
    npcTalks: ["laozhou_a", "laozhou_b"]
  },
  { id: "xiaolin", name: "小林", age: 30, tag: "受过伤的青年 · 欠债一万", playable: false,
    look: { skin: "#d8a983", hair: "short", hairColor: "#1e1a18", shirt: "#3d4a3e", age: 30 } },
  { id: "laok", name: "老K", age: 35, tag: "身上有事的人", playable: false,
    look: { skin: "#c99a74", hair: "cap", hairColor: "#222", shirt: "#2a2a2e", age: 35, beard: true } },
  { id: "azhen", name: "阿珍", age: 22, tag: "想攒学费的姑娘", playable: false,
    look: { skin: "#f0c8a8", hair: "long", hairColor: "#2a1f1c", shirt: "#b5545c", age: 22 } }
];
