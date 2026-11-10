// ===================== 随机事件 =====================
// trigger:
//   morning   新的一天开始（凌晨过 4 点）
//   daily     每天（或隔天）必抽一次的日常池，和好坏都有
//   afterJob  下班后
//   corner    傍晚在路口逛
//   sleepDorm 睡醒时（代码里也可触发）
// chance 0–1；once=true 一局只一次；days 只在这些绝对天数
// need: identity / job / phoneBelow / ageAbove / ageBelow / hasRecord / minDay / maxDay / skillPickBelow
// weight: daily 池里的相对权重（默认 1）
// 注意：玩家可见文案一律用「酒仙桥」，不要写真实地名。
window.CONFIG = window.CONFIG || {};

CONFIG.dailyEventEvery = 1; // 每 N 天抽一次日常事件（1=每天）

CONFIG.events = [
  // —— 固定 / 条件事件 ——
  { id: "cold", trigger: "morning", chance: 0.22, text: "凌晨的风很硬。台阶上等活的人缩到了酒店门廊下。", effects: { mental: -2 } },
  { id: "barber", trigger: "morning", chance: 0.1, text: "路边理发摊的大爷冲你招手：“五块钱，剪精神点好找活！”你剪了。", effects: { money: -5, clean: 15, mental: 2 } },
  { id: "phoneLost", trigger: "afterJob", chance: 0.12, need: { job: "antigen" }, once: true,
    text: "下班领手机，筐里翻了三遍也没找到你那部。中介说找厂子，厂子说找中介。最后在角落里找到了，屏幕碎了。", effects: { mental: -8 } },
  { id: "appPay", trigger: "afterJob", chance: 0.55, need: { job: "antigen", phoneBelow: 4 }, once: true,
    text: "工钱打进了一个小程序。你点来点去，就是领不出来。折腾到中午，才找人帮你弄好。", effects: { mental: -6, stamina: -5 } },
  { id: "extraPile", trigger: "afterJob", chance: 0.22, need: { job: "courier" },
    text: "快下班时被调去堆满快递的工位：“干不完不准下班！”多干了一个小时，没多给钱。", effects: { stamina: -8, mental: -5 } },
  { id: "fight", trigger: "corner", chance: 0.16, text: "路口有两个人吵起来了，围观的人越来越多，有人起哄。蓝马甲巡查员赶过来把人群赶散了。", effects: { mental: -1 } },
  { id: "card", trigger: "corner", chance: 0.07, once: true, text: "有个人凑过来小声问：“办卡不？一张五百。”你摇摇头走开了。这种钱拿了，是要进去的。", effects: {} },
  { id: "karaoke", trigger: "corner", chance: 0.12, text: "凉水河边又支起了移动卡拉OK，有人在唱《一路上有你》。你站着听完了一首。", effects: { mental: 5 } },
  { id: "student", trigger: "morning", chance: 1, days: [5], once: true, need: { identity: "xiaozhou" },
    text: "路口来了一大帮学生工。老工友斜眼看你：“又是你们这些学生，工价都给压下来了。”", effects: { mental: -3 } },
  { id: "sonCall", trigger: "morning", chance: 1, days: [10], once: true, need: { identity: "laozhou" },
    text: "儿子打来电话：“爸，你在那边别太累。”你说：“看大门，轻省得很。”挂了电话，你在台阶上坐了很久。", effects: { mental: 6 } },
  { id: "sonCall2", trigger: "morning", chance: 1, days: [21], once: true, need: { identity: "laozhou" },
    text: "儿子又来电话：“爸，这个月月供快到期了。”你摸了摸口袋，说：“再干几天。”", effects: { mental: -2 } },

  // —— 日常池（每天抽 1 条，带 weight）——
  { id: "find5", trigger: "daily", weight: 4, text: "路边墙根下有一张皱巴巴的五块钱。你捡起来，塞进裤兜。", effects: { money: 5, mental: 2 } },
  { id: "freeBun", trigger: "daily", weight: 4, text: "早点摊老板多给你塞了两个包子：“新来的吧，垫垫肚子。”", effects: { hunger: 20, mental: 3 } },
  { id: "treatNoodle", trigger: "daily", weight: 3, need: { minDay: 3 }, text: "昨天一起干活的大哥请你吃了碗拉面：“别客气，都出来混。”", effects: { hunger: 35, mental: 5, money: 0 } },
  { id: "rainSoak", trigger: "daily", weight: 7, text: "突然一阵雨，你没带伞，衣服湿透了。体面掉了不少。", effects: { clean: -30, mental: -4, stamina: -8 } },
  { id: "phoneAlmost", trigger: "daily", weight: 6, text: "手机差点从裤兜滑出去。你蹲下去捡起来，手心全是汗。", effects: { mental: -2 } },
  { id: "shortPay", trigger: "daily", weight: 7, need: { minDay: 2 }, text: "昨天那份活，中介少给了四十。你追了两句，对方说“车费、水费都扣了”。你咽了回去。", effects: { money: -40, mental: -6, rep: -2 } },
  { id: "minorHurt", trigger: "daily", weight: 6, need: { minDay: 2 }, text: "搬东西时腰闪了一下。不算大事，但一整天都隐隐作痛。", effects: { stamina: -20, mental: -4 } },
  { id: "roommateTalk", trigger: "daily", weight: 6, need: { minDay: 2 }, text: "床位房里有人小声传：谁谁手脚不干净。你装作睡着了。", effects: { mental: -3 } },
  { id: "kindSmoke", trigger: "daily", weight: 5, need: { ageAbove: 40 }, text: "等活时有人递来一根烟。你不会抽，但他把打火机塞你手里：“拿着，夜里有用。”", effects: { mental: 4, item: "打火机" } },
  { id: "youngLecture", trigger: "daily", weight: 5, need: { ageBelow: 28 }, text: "一个大叔拍你肩：“年轻人别在这儿耗着，能回去就回去。”你点点头，把话记在本子上。", effects: { mental: 2 } },
  { id: "foundGlove", trigger: "daily", weight: 4, text: "路口花坛边捡到一副半新的手套。戴上干活不磨手。", effects: { mental: 2, item: "手套" } },
  { id: "recordWhisper", trigger: "daily", weight: 4, need: { hasRecord: true }, text: "有人在你背后嘀咕。你假装没听见，可招工的目光好像更冷了。", effects: { mental: -5, rep: -3 } },
  { id: "luckyWage", trigger: "daily", weight: 2, need: { minDay: 4 }, text: "中介多塞了十块：“昨天干得还行。”你愣了一下。", effects: { money: 10, mental: 4 } },
  { id: "stomach", trigger: "daily", weight: 5, text: "昨晚的剩饭盒饭开始报复。你跑了两趟厕所。", effects: { stamina: -15, hunger: -20, mental: -4 } },
  { id: "warmSun", trigger: "daily", weight: 4, text: "中午太阳好，你在台阶上眯了一会儿。醒来精神好多了。", effects: { mental: 6, stamina: 4 } },
  { id: "pickTempt", trigger: "daily", weight: 3, need: { skillPickBelow: 2, minDay: 3 }, text: "夜里路过银行自助厅，看见有人睡得很沉。一个念头闪过，你加快脚步走开了。", effects: { mental: -1 } },
  { id: "expTip", trigger: "daily", weight: 4, need: { identity: "laozhou" }, text: "有个年轻中介想糊弄你签字。你凭老经验一眼看出坑，骂了他两句走开。", effects: { mental: 3, rep: 1 } },
  { id: "fever", trigger: "daily", weight: 5, need: { minDay: 3 }, text: "夜里着了凉，早上起来头昏脑涨，发起烧来。去小诊所拿了两盒药，三十五块。", effects: { money: -35, stamina: -22, mental: -6 } },
  { id: "screenCrack", trigger: "daily", weight: 3, need: { minDay: 3 }, once: true, text: "手机从兜里滑出来摔在台阶上，屏幕裂成了蜘蛛网。路边修手机的要了六十。", effects: { money: -60, mental: -6 } },
  { id: "depositScam", trigger: "daily", weight: 3, need: { minDay: 4 }, once: true, text: "有个中介说能介绍“包吃住长期工”，先交一百押金。交完人就找不着了，电话也成了空号。", effects: { money: -100, mental: -10, rep: -2 } },
  { id: "shoeBroke", trigger: "daily", weight: 4, need: { minDay: 5 }, text: "鞋底开胶了，走一步啪嗒一下。路边补鞋的收了十五。", effects: { money: -15, mental: -2 } },
  { id: "homeAsk", trigger: "daily", weight: 3, need: { minDay: 6, identity: "laozhou" }, text: "老伴打电话说家里的药吃完了。你让她先去村卫生室赊着，心里又压了一块石头。", effects: { mental: -6 } },
  { id: "notePage", trigger: "daily", weight: 4, need: { identity: "xiaozhou" }, text: "你在本子上又记下一页：谁说了什么，工价多少，心里什么滋味。", effects: { mental: 3 } }
];

CONFIG.endings = {
  win_stories: { title: "离开酒仙桥", text: "你在酒仙桥商业街站坐上了公交车。笔记本里记满了名字：林叔、王哥、李大姐……车过凉水河，你回头看了一眼那个路口。那里的人，明天凌晨五点还会站在那里。" },
  win_send:    { title: "月供寄到了", text: "转账成功的提示音响起。你把手机举得很远，眯着眼看了好几遍那个数字——三千块，一个月的月供。儿子回了一条语音，你没舍得点开，先买了一张回家的车票。" },
  lose_mental: { title: "撑不下去了", text: "那天早上，你没有去路口。你在床上躺到中午，然后收拾东西，买了一张回家的票。有些日子，熬不过去，也不丢人。" },
  lose_collapse: { title: "倒下了", text: "第三次晕倒以后，卫生室的医生说：“你这身体不能再这么干了。”你攒下的钱，大半交了药费。" },
  lose_time_send: { title: "钱没攒够", text: "你给儿子打电话，说再干几天。电话那头沉默了很久。" },
  lose_time_stories: { title: "什么也没听懂", text: "你干了活、吃了苦，却没能真正走进他们的生活。也许下一次，你会多听一听。" }
};
