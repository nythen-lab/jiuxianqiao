// ===================== NPC 与对话 =====================
// 招工的人（recruiters）：在人力市场路口喊活。
// 工友（npcs）：坐车、撸串时能聊天。每个工友有几段对话（talks），按顺序解锁。
//   where    在哪儿能碰到：job 的 id（坐车时）、"bar"（烧烤摊）
//   forgive  你有案底时，好感度要到多少他才肯理你（越大越难）
//   recordLine  有案底、好感又不够时，他说的话
// 每段对话：opener=他先说的话；options=你可以怎么回；story=聊完这段，你“听到了一个故事”（大学生的目标要用）
//   options 里：aff=好感变化，mental=精神变化，needItem=需要身上有某样东西才能选，giveItem=送出去
window.CONFIG = window.CONFIG || {};

CONFIG.recruiters = {
  liu:  { name: "刘中介", look: { skin: "#d9a57c", hair: "short", hairColor: "#1b1b1b", shirt: "#2f2f35", age: 40, cap: false } },
  zhao: { name: "赵队长", look: { skin: "#cf9d76", hair: "cap", hairColor: "#1b1b1b", shirt: "#26344f", age: 45 } },
  sun:  { name: "孙姐（微信群群主）", look: { skin: "#eabf9c", hair: "perm", hairColor: "#3b2a22", shirt: "#8a4b5c", age: 42 } }
};

CONFIG.npcs = [
  { id: "lin", name: "林叔", age: 58, where: ["courier", "guard", "bar"], forgive: 20,
    look: { skin: "#c58f68", hair: "grey", hairColor: "#9a9792", shirt: "#4d5a4a", age: 58, wrinkles: true },
    recordLine: "林叔叹了口气：“孩子，那事儿我听说了。先别跟我说话，让我缓缓。”",
    talks: [
      { opener: "“头一回来吧？我给你算笔账：床位二十五，早饭五块，公交五块多，晚饭十块，水三块多——一天五十，饿不死。”",
        options: [
          { text: "“那一天挣一百五，能剩一百？”", reply: "“能剩。前提是你天天有活，天天不生病。”他笑了一下，没再说话。", aff: 5 },
          { text: "“五十块……我在学校一顿饭就……”", reply: "“那你就别在这儿说。”他摆摆手，“在这儿，五十块是一天。”", aff: -2, mental: -2 }
        ] },
      { opener: "“我年轻时候在工地，后来腰坏了，只能干点轻省的。现在就想把孙子的学费攒出来。”", story: "林叔的账本",
        options: [
          { text: "递上一根烟", needItem: "烟", giveItem: "烟", reply: "他接过烟别在耳朵上：“懂事。以后有好活我喊你。”", aff: 15 },
          { text: "“您孙子上几年级了？”", reply: "“三年级，考了全班第五。”他掏出手机给你看照片，屏幕裂了一道缝。", aff: 8, mental: 3 }
        ] }
    ] },
  { id: "wang", name: "王哥", age: 36, where: ["courier", "antigen", "bar"], forgive: 10,
    look: { skin: "#d39c72", hair: "short", hairColor: "#191919", shirt: "#8b3b33", age: 36 },
    recordLine: "王哥上下打量你：“哟，大名人。离我兜远点。”",
    talks: [
      { opener: "“我跟你说，我哪天不挣个两百多？上礼拜搬家具，三个小时一百五！”",
        options: [
          { text: "“哥你真厉害”", reply: "“那当然！”他拍拍你的肩，声音大得前排的人都回头。", aff: 6 },
          { text: "“那你怎么还坐这车？”", reply: "王哥愣了一下：“……今天这不是没好活嘛。”", aff: -3 }
        ] },
      { opener: "（月底，他第一次没说话。快下车时才开口）“这个月其实就干了九天。房东催我了。”", story: "王哥的两百块",
        options: [
          { text: "“明天一起去抢早班？”", reply: "“行，五点，花坛那儿。”他终于又笑了。", aff: 10, mental: 2 },
          { text: "不说话，陪他坐着", reply: "车窗外的厂房一栋接一栋。过了很久，他说：“谢了。”", aff: 6, mental: 1 }
        ] }
    ] },
  { id: "li", name: "李大姐", age: 38, where: ["food", "bar"], forgive: 30,
    look: { skin: "#ecbc97", hair: "perm", hairColor: "#4a2c22", shirt: "#a8475a", age: 38, lipstick: true },
    recordLine: "李大姐把头扭到一边：“手脚不干净的人，我们组不收。”",
    talks: [
      { opener: "“换鞋的时候慢点，监工盯着摄像头呢，洗手不够十五秒要罚钱。”她一边说一边帮你把口罩拉好。",
        options: [
          { text: "“谢谢大姐！”", reply: "“谢啥，出门在外都不容易。”", aff: 8, mental: 3 },
          { text: "“这么多规矩，烦死了”", reply: "“烦也得守。人家是正经厂子。”", aff: -1 }
        ] },
      { opener: "“我十几岁就出来打工了。你年纪轻轻的，能读书就回去读书，学门手艺也行，别在这儿耗着。”", story: "李大姐的劝",
        options: [
          { text: "“大姐，那你后悔吗？”", reply: "她把烫过的头发往耳后一别：“后悔有啥用？我闺女在念高中，学习比我强。”", aff: 10, mental: 4 },
          { text: "“我就是来挣点快钱”", reply: "“快钱？”她笑出声，“这儿哪有快钱，只有快的日子。”", aff: 4 }
        ] }
    ] },
  { id: "thirty", name: "三十青春", age: 30, where: ["guard", "antigen", "bar"], forgive: 0,
    look: { skin: "#e0ad86", hair: "messy", hairColor: "#2a2420", shirt: "#3f6b5e", age: 30 },
    recordLine: "“三十青春不嫌弃你。”他咧嘴笑，“三十青春也有过几回。”",
    talks: [
      { opener: "“三十青春今天手气不错！”他从兜里掏出一沓刮刮乐，“中了二十！”",
        options: [
          { text: "“那你一共买了多少？”", reply: "“……三十青春不算这个。”他把卡片塞回兜里。", aff: 2 },
          { text: "“恭喜恭喜”", reply: "“下回三十青春请你吃串！”", aff: 6, mental: 2 }
        ] },
      { opener: "“三十青春以前在南方干电子厂，干得可好了。后来……后来就到这儿了。三十青春每天都想，明天就中个大的。”", story: "三十青春的彩票",
        options: [
          { text: "“要不先存一点？”", reply: "他想了很久：“三十青春试试。”第二天，他又站在了彩票店门口。", aff: 6 },
          { text: "“我陪你刮一张”（-5元）", money: -5, reply: "没中。他拍拍你：“下回，下回一定。”", aff: 10, mental: 3 }
        ] }
    ] },
  { id: "chen", name: "陈老板", age: 34, where: ["guard", "bar"], forgive: 0,
    look: { skin: "#d6a37c", hair: "short", hairColor: "#141414", shirt: "#2b2b30", age: 34, beard: true },
    recordLine: "“谁还没犯过浑。”陈老板灌了一口啤酒，“别有下回就行。”",
    talks: [
      { opener: "“大家叫我陈老板，因为我一分钱没有。”他笑着骂了几句世道，“这世上就没有公平。”",
        options: [
          { text: "“那你为啥还干？”", reply: "“不干吃啥？我又不是神仙。”", aff: 5 },
          { text: "跟着一起骂", reply: "他越骂越起劲，周围几个人也跟着笑。你心里松快了一点。", aff: 8, mental: 4 }
        ] },
      { opener: "“我去年骑自行车从北京骑到拉萨，想当网红。路上拍了几百条视频，播放量加起来不到一万。”", story: "陈老板的拉萨",
        options: [
          { text: "“那一路好看吗？”", reply: "他沉默了一会儿：“好看。真好看。那是我这辈子最自由的一个月。”", aff: 12, mental: 5 },
          { text: "“网红哪那么好当”", reply: "“是啊。”他把啤酒瓶捏得咔咔响，“哪有那么好当。”", aff: -2, mental: -3 }
        ] }
    ] },
  { id: "kid", name: "小伙", age: 30, where: ["guard", "courier"], forgive: 15,
    look: { skin: "#e3b38c", hair: "short", hairColor: "#251f1b", shirt: "#425a86", age: 30 },
    recordLine: "小伙往旁边挪了挪：“哥，我妈说别跟那种人走太近。”",
    talks: [
      { opener: "“我只干保安。长期的也干过，五六家吧，每家干几天就跑了。”",
        options: [
          { text: "“为啥跑啊？”", reply: "“说不上来。就是早上醒了，不想去了。”", aff: 5 },
          { text: "“我也想跑”", reply: "他笑了：“那咱俩谁也别笑话谁。”", aff: 7, mental: 2 }
        ] },
      { opener: "“这回我发誓，下一家我一定咬牙干下去，干满一年。”他说得很认真，像在说给自己听。", story: "小伙的誓言",
        options: [
          { text: "“我信你”", reply: "他用力点头。你们都知道这句话他说过很多遍了。", aff: 10, mental: 2 },
          { text: "“上次你也这么说”", reply: "他没生气，只是低下头：“嗯。”", aff: 0, mental: -2 }
        ] }
    ] },
  { id: "zhangge", name: "张大哥", age: 45, where: ["antigen", "food"], forgive: 20,
    look: { skin: "#c9946c", hair: "short", hairColor: "#2a2622", shirt: "#6b6b3f", age: 45 },
    recordLine: "张大哥把手机攥紧了，没说话。",
    talks: [
      { opener: "“你会弄这个吗？”他递过来一部旧手机，“上回的工钱打进那个什么小程序里了，我换了号，就领不出来了。”",
        options: [
          { text: "帮他弄（需要手机熟练度 6 以上）", needPhone: 6, reply: "你折腾了二十分钟，终于把钱提出来了。张大哥一个劲儿说谢谢，非要塞给你一包烟。", aff: 18, item: "烟", mental: 5 },
          { text: "“我也不太会……”", reply: "“没事没事，我再问问别人。”他把手机揣回兜里，又掏出来看了一眼。", aff: 2 }
        ] },
      { opener: "“一百多块钱，我跑了三趟中介，人家说找厂子，厂子说找中介。”他摇摇头，“咱们这种人，丢了钱都不知道找谁。”", story: "张大哥的小程序",
        options: [
          { text: "“下次我帮你记着”", reply: "“好，好。”他把你的名字存进手机，用的是大字体。", aff: 8, mental: 2 },
          { text: "“得去劳动监察投诉”", reply: "“投诉？”他像听见一个外国词，“那得耽误几天活啊。”", aff: 3 }
        ] }
    ] },
  { id: "liu2", name: "老刘", age: 50, where: ["courier", "food", "bar"], forgive: 10,
    look: { skin: "#b98663", hair: "bald", hairColor: "#777", shirt: "#5d4a3a", age: 60, wrinkles: true },
    recordLine: "老刘闷声说：“我穷，可我没拿过别人一分钱。”",
    talks: [
      { opener: "“身份证上我五十，看着像六十吧？”他自己先笑了，“中介都嫌我老，一个月就找到七八天活。”",
        options: [
          { text: "“那去干门卫呢？”", reply: "“门卫一个月两三千，不够花。干日结，能挣得多。”他说得很笃定。", aff: 5 },
          { text: "“您看着挺精神的”", reply: "“精神有啥用，人家看脸。”他摸了摸花白的头发。", aff: 7, mental: 2 }
        ] },
      { opener: "（他掰着指头算）“一天一百五，一个月七八天……”算着算着，他不说话了。", story: "老刘的算术",
        options: [
          { text: "陪他再算一遍", reply: "算出来比门卫少。他看了你一眼：“明天我去问问门卫。”", aff: 12, mental: 3 },
          { text: "岔开话题", reply: "你们聊起了老家的庄稼。他眼睛亮了一下。", aff: 6, mental: 2 }
        ] }
    ] }
];

// 没被选中的身份当 NPC 时说的话（id 写在 identities.js 的 npcTalks 里）
CONFIG.identityTalks = {
  zhou_a: { opener: "一个背双肩包的年轻人凑过来：“叔，我是来做调研的学生，能跟您聊聊吗？”",
    options: [
      { text: "“问吧，别写我名字就行”", reply: "他认真地在手机上记，记到你一天花多少钱时，手停了一下。", aff: 8, mental: 3 },
      { text: "“学生不好好上学，跑这儿来干嘛”", reply: "“就是想知道你们……我们，每天在想什么。”他挠挠头。", aff: 3 }
    ] },
  zhou_b: { opener: "小周递给你一瓶水：“叔，您跟我说说，您为什么来这儿？”", story: "小周的笔记本",
    options: [
      { text: "说起家里的事", reply: "他听完很久没说话，最后说：“我以后要把这些写下来。”", aff: 10, mental: 4 },
      { text: "“为了活着呗”", reply: "他把这四个字写在本子第一页。", aff: 6 }
    ] },
  laozhou_a: { opener: "一个头发花白的大爷拿着手机凑过来：“小伙子，这个转账……是点这里吗？”",
    options: [
      { text: "手把手教他", reply: "“哎，原来这么简单。”他把步骤写在烟盒背面。", aff: 12, mental: 3 },
      { text: "“我也赶时间”", reply: "他点点头，又去问下一个人了。", aff: -2 }
    ] },
  laozhou_b: { opener: "老周看着窗外：“我儿子说不用我寄钱。可他不说，我也知道他难。”", story: "老周的月供",
    options: [
      { text: "“您儿子知道您在这儿吗？”", reply: "“说是在工地看大门。”他笑了笑，“轻省活。”", aff: 10, mental: 2 },
      { text: "“您也得顾着自己身体”", reply: "“身体？”他拍拍膝盖，“还能用。”", aff: 8, mental: 1 }
    ] }
};
// 没选中的身份当 NPC 时会出现在哪里
CONFIG.identityNpcWhere = { xiaozhou: ["food", "guard", "bar"], laozhou: ["courier", "guard", "antigen", "bar"] };
