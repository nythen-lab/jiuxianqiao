// 勇闯酒仙桥 · 结局分享图 v0.4（竖版 1080×1440，朋友圈友好）
(function () {
  const W = 1080, H = 1440;
  const INK = '#2a2420', PAPER = '#f3ead8', GOLD = '#f2c14e', RED = '#b33a2e', GREEN = '#3f7a4c', BLUE = '#3f74b5';
  const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function fillStroke(ctx) { ctx.fill(); ctx.stroke(); }
  function wrap(ctx, text, x, y, maxW, lineH, maxLines) {
    let rest = text, lines = 0;
    while (rest.length && lines < (maxLines || 6)) {
      let i = rest.length;
      while (i > 0 && ctx.measureText(rest.slice(0, i)).width > maxW) i--;
      const slice = rest.slice(0, i);
      const br = Math.max(slice.lastIndexOf('。'), slice.lastIndexOf('，'), slice.lastIndexOf('；'), slice.lastIndexOf(' '));
      const cut = (br > 6 && i < rest.length) ? br + 1 : i;
      ctx.fillText(rest.slice(0, cut), x, y);
      rest = rest.slice(cut); y += lineH; lines++;
    }
    return y;
  }
  function paperBg(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f7efdc'); g.addColorStop(1, '#e8dcc4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(42,36,32,0.04)';
    for (let y = 0; y < H; y += 5) for (let x = (y % 10); x < W; x += 5) ctx.fillRect(x, y, 1.1, 1.1);
    ctx.strokeStyle = INK; ctx.lineWidth = 12;
    rr(ctx, 24, 24, W - 48, H - 48, 32); ctx.stroke();
    ctx.lineWidth = 3; rr(ctx, 46, 46, W - 92, H - 92, 22); ctx.stroke();
  }
  const TXT = '#f3ead8', LINE = 'rgba(255,226,180,0.35)', PANEL = 'rgba(14,14,20,0.72)', MUTED = '#c9bda8';
  function artBg(ctx, win) {
    ctx.fillStyle = '#16161c'; ctx.fillRect(0, 0, W, H);
    const A = window.ART; const im = A && A.imgCache && A.imgCache[win ? A.IMG.corner.dawn : A.IMG.corner.night];
    if (im && im.complete && im.naturalWidth) { const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight); const w = im.naturalWidth * sc, h = im.naturalHeight * sc; ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); }
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(10,10,14,0.55)'); g.addColorStop(0.5, 'rgba(10,10,14,0.35)'); g.addColorStop(1, 'rgba(10,10,14,0.8)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(232,162,74,0.85)'; ctx.lineWidth = 6; rr(ctx, 30, 30, W - 60, H - 60, 28); ctx.stroke();
  }
  function portrait(ctx, look, x, y, sc) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc || 1, sc || 1);
    ctx.fillStyle = look.shirt || '#4f7fa8'; ctx.strokeStyle = INK; ctx.lineWidth = 5;
    rr(ctx, -42, 22, 84, 78, 16); fillStroke(ctx);
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fillStyle = look.skin || '#f1c9a5'; fillStroke(ctx);
    ctx.fillStyle = look.hairColor || '#2b2522';
    ctx.beginPath(); ctx.ellipse(0, -18, 38, 20, 0, Math.PI, 0); ctx.fill();
    if (look.glasses) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(-14, 4, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(14, 4, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(3, 4); ctx.stroke();
    }
    if (look.wrinkles) {
      ctx.strokeStyle = 'rgba(42,36,32,0.35)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-20, 14); ctx.lineTo(-8, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, 16); ctx.lineTo(20, 14); ctx.stroke();
    }
    ctx.restore();
  }
  function stamp(ctx, x, y, w, h, text, color, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.strokeStyle = color; ctx.lineWidth = 5;
    rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.stroke();
    ctx.fillStyle = color; ctx.font = `bold ${Math.round(h * 0.38)}px ${FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 2);
    ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  function oneLiner(S, I, E) {
    const win = S.ended.win, day = S.ended.day;
    if (win && I.goal.debt) return `${day} 天，还掉 ¥${S.sent} 的债。剩下的，慢慢来。`;
    if (win && I.goal.type === 'send') return `${day} 天，寄回家 ¥${S.sent}。一个月的月供，先顶住了。`;
    if (win) return `${day} 天，听了 ${S.stories.length} 个故事。笔记本写满了。`;
    if (S.ended.key === 'lose_mental') return `第 ${day} 天，精神撑不住了。熬不过去，也不丢人。`;
    if (S.ended.key === 'lose_collapse') return `晕倒 ${S.collapses} 次以后，卫生室说：别再这么干了。`;
    return E && E.title ? E.title : (win ? '离开了酒仙桥' : '没能离开');
  }

  window.ShareCard = {
    build(S, I, E) {
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      artBg(ctx, !!(S.ended && S.ended.win));
      const win = !!(S.ended && S.ended.win);
      const day = (S.ended && S.ended.day) || G.dayNum();
      const bigNum = I.goal && I.goal.type === 'send' ? S.sent : day;
      const bigLabel = I.goal && I.goal.type === 'send' ? (I.goal.debt ? '还掉的债（元）' : '寄回家（元）') : '撑过的天数';
      const jobs = Object.keys(S.jobsDone || {});
      const jobNames = jobs.map(k => ((CONFIG.jobs || []).find(j => j.id === k) || {}).name || k);

      // 顶栏
      ctx.fillStyle = TXT; ctx.font = `bold 56px ${FONT}`;
      ctx.fillText('勇闯酒仙桥', 90, 130);
      ctx.fillStyle = MUTED; ctx.font = `26px ${FONT}`;
      ctx.fillText('酒仙桥日结 · 一局闯关', 90, 172);
      stamp(ctx, 920, 140, 160, 78, win ? '离开了' : '没离开', win ? '#8fdc98' : '#ff8a76', -0.16);

      // 身份条
      ctx.fillStyle = PANEL; ctx.strokeStyle = LINE; ctx.lineWidth = 5;
      rr(ctx, 90, 210, 900, 200, 22); fillStroke(ctx);
      portrait(ctx, I.look || {}, 200, 292, 1.12);
      ctx.fillStyle = TXT; ctx.font = `bold 44px ${FONT}`;
      ctx.fillText(`${I.name} · ${I.age}岁`, 320, 280);
      ctx.fillStyle = '#f08a76'; ctx.font = `26px ${FONT}`;
      ctx.fillText(I.tag || '', 320, 325);
      ctx.fillStyle = MUTED; ctx.font = `24px ${FONT}`;
      ctx.fillText(`第 ${day} 天 · ${(S.ended && S.ended.clock) || ''}`, 320, 365);
      ctx.fillStyle = (S.record && S.record.count) ? RED : GREEN;
      ctx.font = `bold 24px ${FONT}`;
      ctx.fillText(S.record && S.record.count ? `有案底 ×${S.record.count}` : '无案底 · 清清白白', 320, 400);

      // 大数字
      ctx.fillStyle = PANEL; ctx.strokeStyle = LINE; ctx.lineWidth = 5;
      rr(ctx, 90, 440, 900, 220, 24); fillStroke(ctx);
      ctx.fillStyle = MUTED; ctx.font = `24px ${FONT}`;
      ctx.fillText(bigLabel, 130, 495);
      ctx.fillStyle = TXT; ctx.font = `bold 120px ${FONT}`;
      ctx.fillText(String(bigNum), 120, 615);
      ctx.fillStyle = GOLD; ctx.font = `bold 36px ${FONT}`;
      ctx.fillText(I.goal && I.goal.type === 'send' ? `目标 ¥${I.goal.amount}` : `故事 ${S.stories.length} · 活 ${jobs.length} 种`, 520, 600);

      // 印章行：工种 / 故事 / 案底
      ctx.fillStyle = PANEL; ctx.strokeStyle = LINE; ctx.lineWidth = 4;
      rr(ctx, 90, 690, 900, 160, 18); fillStroke(ctx);
      ctx.fillStyle = MUTED; ctx.font = `22px ${FONT}`;
      ctx.fillText('这一程盖过的章', 120, 730);
      const stamps = [];
      jobNames.slice(0, 4).forEach(n => stamps.push({ t: n.slice(0, 4), c: BLUE }));
      Object.keys(S.ach || {}).slice(0, 2).forEach(k => { const a = (CONFIG.achievements || []).find(x => x.id === k); if (a) stamps.push({ t: a.name.slice(0, 4), c: '#e8a24a' }); });
      if (S.stories && S.stories.length) stamps.push({ t: `故事×${S.stories.length}`, c: GOLD });
      if (S.record && S.record.count) stamps.push({ t: '案底', c: RED });
      if (!stamps.length) stamps.push({ t: '空白', c: '#999' });
      stamps.slice(0, 6).forEach((st, i) => stamp(ctx, 160 + i * 140, 800, 120, 56, st.t, st.c, (i % 2 ? 0.08 : -0.06)));

      // 金句
      ctx.fillStyle = win ? 'rgba(30,48,34,0.78)' : 'rgba(58,26,24,0.78)';
      ctx.strokeStyle = LINE; ctx.lineWidth = 5;
      rr(ctx, 90, 880, 900, 230, 20); fillStroke(ctx);
      ctx.fillStyle = MUTED; ctx.font = `22px ${FONT}`;
      ctx.fillText('一句留给朋友圈', 120, 925);
      ctx.fillStyle = TXT; ctx.font = `bold 36px ${FONT}`;
      wrap(ctx, oneLiner(S, I, E), 120, 985, 820, 48, 3);

      // 底
      ctx.fillStyle = TXT; ctx.font = `bold 48px ${FONT}`;
      ctx.fillText('《勇闯酒仙桥》', 90, 1210);
      ctx.fillStyle = MUTED; ctx.font = `24px ${FONT}`;
      ctx.fillText('网页小样 v0.8 · 想玩多久玩多久', 90, 1260);
      ctx.fillText('扫自己的生活 · 再闯一次', 90, 1305);
      stamp(ctx, 920, 1260, 130, 100, '日结', RED, 0.18);

      return canvas;
    },
    download(canvas, filename) {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename || `勇闯酒仙桥-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    }
  };
})();
