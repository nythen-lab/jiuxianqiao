// 勇闯酒仙桥 v0.9 · 写实风格场景（左边大画面 + 人物热点 + 统一大小的地点卡）
// 每个地点一张画；路口分清晨 / 白天 / 夜里三张。其他地点按时间加一层色调。
(function () {
  const A = window.ART, C = window.CONFIG;
  const IMG = A.IMG = {
    title: 'img/bg-title.jpg',
    corner: { dawn: 'img/bg-corner-dawn.jpg', day: 'img/bg-corner-day.jpg', night: 'img/bg-corner-night.jpg' },
    place: id => `img/bg-${id}.jpg`,
    job: id => `img/bg-job-${id}.jpg`,
    dish: { bun: 'img/dish-bun.jpg', noodle: 'img/dish-noodle.jpg', dumpling: 'img/dish-dumpling.jpg', boxmeal: 'img/dish-boxmeal.jpg', box: 'img/dish-boxmeal.jpg',
      leftover: 'img/dish-boxmeal.jpg', sausage: 'img/dish-sausage.jpg', stew: 'img/dish-stew.jpg', lamb: 'img/dish-lamb.jpg', bbq: 'img/dish-lamb.jpg', beer: 'img/dish-lamb.jpg' }
  };
  // 时段：dawn 4–7:30 / day 7:30–17 / dusk 17–19 / night
  A.timeMode = h => (h >= 5 && h < 7) ? 'dawn' : (h >= 7 && h < 17) ? 'day' : (h >= 17 && h < 19) ? 'dusk' : 'night';
  A.placeImg = function (id, h) {
    const f = window.FX && FX.placeImg(id, h); if (f) return f;
    if (id === 'corner') { const m = A.timeMode(h); return IMG.corner[m === 'dusk' ? 'night' : m]; }
    return IMG.place(id);
  };
  // 预加载（分享图要用）
  const cache = A.imgCache = {};
  A.loadImg = function (src) { if (!cache[src]) { const im = new Image(); im.src = src; cache[src] = im; } return cache[src]; };
  A.loadImg(IMG.title); Object.values(IMG.corner).forEach(A.loadImg);

  // 菜：有画就用画
  const oldDish = A.dish;
  A.dish = function (meal) {
    const id = (typeof meal === 'string') ? meal : (meal && (meal.dish || meal.id)) || 'box';
    const src = IMG.dish[id] || (meal && IMG.dish[meal.id]);
    if (src) return `<img class="dish-img" src="${src}" alt="" draggable="false">`;
    return oldDish(meal);
  };

  const ORDER = ['corner', 'food', 'clothes', 'inn', 'bar', 'bank', 'netcafe', 'lottery', 'clinic', 'agency', 'riverside', 'dormtower'];
  const SHORT = { corner: '人力市场', food: '清真饭馆', clothes: '服装店', inn: '平安旅社', bar: '烧烤摊', bank: '银行·车站', netcafe: '通宵网吧', lottery: '彩票店', clinic: '卫生室', agency: '劳务中介', riverside: '凉水河公园', dormtower: '宿舍楼' };
  const ICON = { corner: '👷', food: '🍜', clothes: '👕', inn: '🛏️', bar: '🍢', bank: '🏦', netcafe: '🖥️', lottery: '🎟️', clinic: '💊', agency: '📋', riverside: '🎣', dormtower: '🏢' };
  A.placeIcon = id => ICON[id] || '📍';
  A.placeShort = id => SHORT[id] || id;

  // v0.9：左边大画面 = 地点画 + 名牌 + 人物热点；底部两排同样大小的地点卡（锁着的变灰 + 🔒 + 条件）
  A.mapTiles = function (S, G, big) {
    const h = G.hourF();
    const places = ORDER.map(id => C.places.find(p => p.id === id)).filter(Boolean).concat(C.places.filter(p => !ORDER.includes(p.id)));
    return places.map(p => {
      const unl = G.isUnlocked ? G.isUnlocked('place', p) : true;
      if (!unl) return `<div class="bld locked" data-lock="${p.id}" title="${p.unlockHint || '还没开放'}"><div class="th"><i>🔒</i></div><div class="bt"><b>？？？</b><small>${p.unlockHint || '还没开放'}</small></div></div>`;
      const o = G.isOpen(p), here = S.loc === p.id;
      return `<div class="bld${here ? ' here' : ''}${o ? '' : ' shut'}" data-loc="${p.id}" title="${p.name}${big ? '' : ' · ' + (here ? '你在这儿' : o ? `走过去 ${G.travelMin ? G.travelMin(S.loc, p.id) : 10} 分钟` : '已打烊')}"><div class="th" style="background-image:url(${A.placeImg(p.id, h)})"><i>${ICON[p.id] || ''}</i></div><div class="bt"><b>${SHORT[p.id] || p.name}</b><small>${here ? '你在这儿' : o ? '走过去 10 分钟' : '已打烊'}</small>${big ? `<em>${p.desc || ''}</em>` : ''}</div><span class="hit"></span></div>`;
    }).join('');
  };
  // v0.9 酒仙桥镇地图：一张画 + HTML 地名标签和图钉
  A.townMap = function (S, G, badges) {
    const M = C.townMap, h = G.hourF(), mode = A.timeMode(h); badges = badges || {};
    const sea = G.season ? G.season() : null;
    const pins = ORDER.map(id => C.places.find(p => p.id === id)).filter(p => p && M.pins[p.id]).map(p => {
      const [x, y] = M.pins[p.id]; const unl = G.isUnlocked ? G.isUnlocked('place', p) : true; const here = S.loc === p.id; const o = G.isOpen(p); const edge = x >= 84 ? ' er' : x <= 14 ? ' el' : '';
      if (!unl) return `<button class="pin locked${edge}" data-lock="${p.id}" style="--x:${x};--y:${y}" title="${p.unlockHint || '还没开放'}"><i>🔒</i><span class="pl"><b>？？？</b><small>${p.unlockHint || '还没开放'}</small></span></button>`;
      const m = G.travelMin(S.loc, p.id);
      return `<button class="pin${edge}${here ? ' here' : ''}${o ? '' : ' shut'}" data-pin="${p.id}" style="--x:${x};--y:${y}" title="${p.name}"><i>${ICON[p.id] || '📍'}</i><span class="pl"><b>${SHORT[p.id] || p.name}</b><small>${here ? '你在这儿 · 点进去' : `${m} 分钟${o ? '' : ' · 已打烊'}`}</small></span>${badges[p.id] ? `<em class="pbadge">${badges[p.id]}</em>` : ''}</button>`;
    }).join('');
    const deco = (M.deco || []).map(d => `<span class="mdeco" style="--x:${d.x};--y:${d.y}" title="${d.note || ''}">${d.label}</span>`).join('');
    return `<div class="townmap" data-mode="${mode}" data-season="${sea ? sea.id : ''}"><div class="tm-img" style="background-image:url(${window.FX ? FX.mapImg(h) : M.img})"></div><div class="tm-tint ${mode}"></div><div class="tm-season"></div>
      <div class="scn-plaque tm-plaque"><b>酒仙桥镇</b><small>点地方走过去 · 时间按远近算</small></div>${deco}${pins}</div>`;
  };

  // v0.9.1 住处的画和「我的房间」窗台叠层
  A.bedView = id => (C.bedViews || {})[id] || (id === 'netbar' ? { img: IMG.place('netcafe') } : id === 'monthBed' ? { img: IMG.place('dormtower') } : null);
  A.roomOverlay = function (S, G) {
    if (!S.room) return '';
    const pots = (S.room.pots || []).slice(0, 4).map((p, i) => { const P = G.plantDef(p.id); const st = G.plantStage(p);
      return `<span class="rov-pot${p.dead ? ' dead' : ''}" style="--i:${i}" title="${P.name}">${p.dead ? '🥀' : P.icon[Math.max(0, Math.min(st, 3))]}<i></i></span>`; }).join('');
    const d = S.room.decor || [];
    return `<div class="rov">${pots}${d.includes('lights') ? '<span class="rov-lights"></span>' : ''}${d.includes('radio') ? '<span class="rov-radio">📻</span>' : ''}${d.includes('rug') ? '<span class="rov-rug"></span>' : ''}${d.includes('photo') ? '<span class="rov-photo">🖼️</span>' : ''}</div>`;
  };
  A.scene = function (S, G, people) {
    const h = G.hourF(), mode = A.timeMode(h);
    const P = C.places.find(p => p.id === S.loc) || C.places[0];
    const open = G.isOpen(P);
    const OUT = { corner: 1, bank: 1, riverside: 1, dormtower: 1 }; const tint = S.loc === 'corner' ? (mode === 'dusk' ? 'dusk' : '') : (OUT[S.loc] ? mode : (mode === 'day' ? '' : mode + '-in'));
    const realNight = window.FX && FX.hasNightImg(S.loc) && FX.isDark(h) && FX.placeImg(S.loc, h) === (C.phaseImgs[S.loc] || {}).night;
    const tintC = realNight ? 'nightimg' : tint;
    const spots = (people || []).map(x => `<button class="spot ${x.kind}" data-spot="${x.kind}:${x.key}" title="${x.tip || x.name}"><span class="pt card">${A.portrait(x.look)}</span><b>${x.name}</b><small>${x.sub || ''}</small></button>`).join('');
    return `<div class="scn" data-mode="${mode}">
      <div class="scn-img" style="background-image:url(${A.placeImg(S.loc, h)})"></div>
      <div class="scn-tint ${tintC}"></div><div class="scn-season s-${G.season ? G.season().id : ''}"></div>${open ? '' : '<div class="scn-shut">已打烊</div>'}
      <div class="scn-vig"></div><div class="scn-over"></div><div class="scn-cap hidden"></div>
      <div class="scn-plaque"><b>${P.name}</b><small>${P.sign}${open ? '' : ' · 已打烊'}</small></div>
      ${spots ? `<div class="scn-spots">${spots}</div>` : ''}
      <button class="scn-back" id="scn-back" title="回到酒仙桥镇地图">← 回地图</button>
    </div>`;
  };
})();
