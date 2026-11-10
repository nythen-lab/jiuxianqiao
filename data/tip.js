// ===================== v0.9.4 请作者喝杯咖啡 =====================
// 用法：1) 把收款码放到 img/tip-wechat.png 和 img/tip-alipay.png；
//       2) 把下面 wechatImg / alipayImg 填成 'img/tip-wechat.png' / 'img/tip-alipay.png'（留空 = 不加载，不会有 404）。
// 只放一张也行；图片打不开会自动隐藏那一格，两张都打不开 → 整个功能隐藏。
// 爱发电是主要入口：afdianUrl 不为空时弹窗里有「去爱发电支持」按钮（没有二维码图也会显示）；微信 / 支付宝在下面作为备选。
window.CONFIG = window.CONFIG || {};
CONFIG.tip = {
  enabled: true,
  wechatImg: '',      // 放好图后改成 'img/tip-wechat.png'
  alipayImg: '',      // 放好图后改成 'img/tip-alipay.png'
  afdianUrl: 'https://afdian.com/a/jiuxiaoqian',
  afdianImg: 'img/tip-afdian.png',   // 爱发电主页二维码（主要入口）
  afdianScan: '扫码在爱发电支持作者',
  afdianBtn: '去爱发电支持',
  button: '☕ 请作者喝杯咖啡',
  title: '请作者喝杯咖啡',
  line: '这个小镇是一个人慢慢做出来的。觉得好玩的话，1 块钱也是鼓励。',
  body: '不打赏也完全没关系，能玩到就很开心了。想说什么，点「反馈」告诉我。',
  thanks: '谢谢你，真的。',
  endLine: '这个小镇是一个人慢慢做出来的。觉得好玩的话，1 块钱也是鼓励。',
  dayPromptAfterDays: 5,        // 玩满几天后温和地问一次（关掉就不再出现）
  storageKey: 'jxq_tip_dismissed_v1'
};
