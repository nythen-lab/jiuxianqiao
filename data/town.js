// Fictional town expansion, v1.0.2. Core jobs remain open on their previous schedule.
(function () {
const C = CONFIG;
C.places.push({ id:'temple', name:'慈云寺', sign:'静心 · 求签 · 庙会', open:'00:00', close:'24:00', desc:'一方清静的院子，一棵老银杏。烧香、坐坐、帮忙干活，都凭自愿。这里不许诺发财，也不收贵重供奉。', locked:true, unlock:{ minDay:5 }, unlockHint:'第5天有人指路' });
C.phaseImgs.temple = { day:'img/bg-temple.jpg', night:'img/bg-temple-night.jpg' };
C.townMap.pins.temple = [43, 25];
C.debuffs.peace = { name:'心安', good:true, days:3, mentalRecover:1.15, text:'心里安定一点，睡觉精神多恢复15%。签文只是寄语，不预测命运。' };
C.townDays = [
[1,'forum','酒仙桥论坛','网吧可以看帖子、写街头见闻，回复会慢慢到。'],
[2,'bath','老澡堂与晚班洗碗','热水能解乏；后厨洗碗可玩消消乐。'],
[3,'lottery','好运来彩票店','小钱买个盼头，饭钱别押进去。'],
[4,'clinic','村卫生室','受伤受寒时可以看病，别硬扛。'],
[5,'temple','慈云寺','院子里可以静坐、烧香、扫落叶挣零钱。'],
[6,'stock','网吧证券开户','六支虚构股票每日涨跌；风险自担。'],
[7,'fair','第一回小庙会','每逢第7天摆摊，记住客人要的东西再配对。'],
[8,'fold','香火铺叠纸供','铺子缺人，照折痕折纸供，按手艺付钱。'],
[9,'birthday','幸福酒楼过生日','不用等人来请，给自己过一个像样的生日。'],
[10,'movie','网吧点播电影','四部虚构小电影，看完心里松一点。'],
[11,'special','酒楼招牌席','蒸鱼、炖肉、热面上桌，辛苦钱也值得花在自己身上。'],
[12,'wish','慈云寺许愿','写下一个小心愿，不求灵验，只记得自己想要什么。'],
[13,'reunion','老朋友聚聚','把认识的工友请到一桌，聊聊旧事。'],
[14,'umbrella','香火铺的旧伞','花8块买把伞，下雨走路不再淋湿。']
];
C.feasts = [
{id:'treat',name:'请客吃饭',price:48,min:90,mental:10,stamina:6,hunger:42,aff:5,day:1,dishes:['noodle','dumpling','stew'],lines:['老板把热面端上来，葱花还在汤面打转。大家把碗往中间碰了碰：“今天吃好。”','工友夹起一块肉，笑着说：“挣了钱就该热热闹闹吃一顿。”']},
{id:'birthday',name:'给自己过生日',price:68,min:120,mental:16,stamina:9,hunger:55,aff:4,day:9,dishes:['noodle','fish','dumpling'],lines:['长寿面卧着一个荷包蛋，老板替你点了一小根蜡烛。你闭眼许了愿。','有人唱得跑了调，大伙笑着拍桌子。你忽然觉得，今天不是一个人。']},
{id:'special',name:'尝一回招牌席',price:98,min:120,mental:20,stamina:14,hunger:70,aff:6,day:11,dishes:['fish','lamb','stew'],lines:['蒸鱼细嫩，炖肉软烂。你慢慢吃，没人催你，今天这桌菜就是犒劳自己的。','锅盖掀开，香气一下子涌出来。老板说：“慢慢吃，够了还能添汤。”']},
{id:'reunion',name:'老朋友聚聚',price:88,min:150,mental:18,stamina:10,hunger:60,aff:8,day:13,dishes:['stew','dumpling','lamb'],lines:['“还记得第一次一起搬货吗？”一提起来，大家的话匣子就关不上了。','从老家聊到明天的活，再聊回小时候。菜凉了又热，谁也不急着走。']}
];
})();
// Visual pins follow the painted streets. walkPins stay the older distances, so travel minutes do not change.
(function () {
  const M = CONFIG.townMap;
  M.walkPins = JSON.parse(JSON.stringify(M.pins));
  const view = {
    corner: [50, 50], food: [28, 64], clothes: [14, 72], inn: [18, 24], bar: [24, 84],
    bank: [66, 74], bath: [38, 72], netcafe: [82, 58], lottery: [74, 88], clinic: [62, 30],
    agency: [92, 76], riverside: [78, 20], dormtower: [94, 42], temple: [10, 40],
    sales: [8, 56], hall: [40, 84], kinder: [54, 90], home: [72, 48]
  };
  Object.keys(view).forEach(id => { if (M.pins[id]) M.pins[id] = view[id]; });
  const notes = {};
  (M.deco || []).forEach(d => { notes[d.label] = d.note; });
  M.deco = [
    { label: '冷库', x: 30, y: 8, note: notes['冷库'] || '' },
    { label: '大桥 · 桥洞', x: 48, y: 11, note: notes['大桥 · 桥洞'] || '' },
    { label: '工地', x: 86, y: 6, note: notes['工地'] || '' }
  ];
})();
