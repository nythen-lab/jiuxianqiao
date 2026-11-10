// ===================== v0.9 酒仙桥镇地图 =====================
// pins：每个地点在地图图上的位置（百分比，左上角为 0,0）。走路时间按两点距离算。
// deco：地图上只看不进的地方（干活时才去）。玩家可见文案不写真实地名。
window.CONFIG = window.CONFIG || {};
CONFIG.townMap = {
  img: "img/map-town.jpg",
  walk: { base: 5, perPct: 0.22, min: 5, max: 25, step: 5 },   // 分钟 = base + 距离(%) × perPct，按 5 分钟取整
  pins: {
    corner:    [49, 79],
    food:      [37, 55],
    clothes:   [14, 70],
    inn:       [44, 38],
    bar:       [25, 76],
    bank:      [61, 73],
    netcafe:   [81, 61],
    lottery:   [75, 79],
    clinic:    [69, 54],
    agency:    [91, 82],
    riverside: [66, 30],
    dormtower: [90, 40]
  },
  deco: [
    { label: "冷库", x: 15, y: 28, note: "冷库搬运的活在这儿干，早高峰在路口招人" },
    { label: "大桥 · 桥洞", x: 45, y: 19, note: "过了桥就是城里。冬天桥洞下也有人睡" },
    { label: "工地", x: 86, y: 8, note: "工地小工的活在城那头，坐中介的车去" }
  ]
};

// v0.9.1 每种住处一张画：鼠标移到「睡××」上，左边画面就换成这张，下面一行字说清楚花这个钱买到什么
CONFIG.bedViews = {
  upper:   { img: "img/bed-upper.jpg",   cap: "贴着天花板，一屋十几号人，翻个身床就晃；东西只能挂在床栏上。" },
  lower:   { img: "img/bed-lower.jpg",   cap: "多花 6 块，能拉块布帘子，包和箱子塞床底下，上下床不用爬。" },
  room:    { img: "img/bed-room.jpg",    cap: "一张床一个床头柜，门上有锁，没人打呼噜也没人翻你的包；洗漱去公共卫生间。" },
  month:   { img: "img/bed-month.jpg",   cap: "一扇小窗、一张桌子、挂钩上是自己的衣服——住久了，有点像个家。" },
  street:  { img: "img/bed-street.jpg",  cap: "一张纸板一条旧毯子，背包当枕头；不花钱，但冷，也可能被人翻兜。" },
  shelter: { img: "img/bed-shelter.jpg", cap: "行军床、军绿棉被、暖气和热水，免费，隔一晚才能再来。" }
};
