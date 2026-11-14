// 美术：全部用 SVG 现画（不用任何图片素材）
(function () {
  const INK = '#2a2420';
  const A = {};
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const m = v => Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f)));
    return '#' + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1); };
  A.shade = shade;

  // ---------- 头像 ----------
  A.portrait = function (lk, opts) {
    lk = lk || {}; opts = opts || {};
    const skin = lk.skin || '#e0b08a', hc = lk.hairColor || '#222', sh = lk.shirt || '#556';
    const old = (lk.age || 30) >= 50;
    let hair = '';
    switch (lk.hair) {
      case 'grey': case 'short': hair = `<path d="M27 46 Q26 20 50 18 Q74 20 73 46 Q70 32 60 30 Q48 27 38 31 Q30 35 27 46Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`; break;
      case 'bald': hair = `<path d="M27 50 Q28 40 31 38 L31 52Z M73 50 Q72 40 69 38 L69 52Z" fill="${hc}" stroke="${INK}" stroke-width="1.5"/>`; break;
      case 'messy': hair = `<path d="M26 48 Q22 22 44 17 L48 22 L54 15 L58 22 Q78 20 74 48 Q70 34 62 33 L56 28 L50 33 L44 28 Q32 32 26 48Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`; break;
      case 'perm': hair = `<path d="M22 60 Q14 30 34 20 Q50 10 66 20 Q86 30 78 60 Q80 46 72 38 Q60 30 50 32 Q38 30 28 38 Q20 46 22 60Z" fill="${hc}" stroke="${INK}" stroke-width="2"/><g fill="${shade(hc,.15)}"><circle cx="30" cy="30" r="6"/><circle cx="44" cy="22" r="7"/><circle cx="58" cy="22" r="7"/><circle cx="70" cy="31" r="6"/></g>`; break;
      case 'long': hair = `<path d="M24 92 Q16 40 32 22 Q50 10 68 22 Q84 40 76 92 L68 92 Q72 56 66 40 Q56 30 50 31 Q40 30 34 40 Q28 56 32 92Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`; break;
      case 'tied': hair = `<path d="M32 50 Q30 28 50 22 Q70 28 68 50 Q64 38 50 36 Q36 38 32 50Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>
        <ellipse cx="64" cy="8" rx="12" ry="10" fill="${hc}" stroke="${INK}" stroke-width="2"/>
        <path d="M50 20 C48 6 58 2 64 10 C66 16 58 20 52 20Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>
        <path d="M56 16 Q64 20 72 12" fill="none" stroke="${shade(hc, .45)}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M70 14 Q88 26 82 46 Q74 28 66 20Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`; break;
      case 'cap': hair = `<path d="M25 44 Q26 18 50 17 Q74 18 75 44 Z" fill="${sh === '#26344f' ? '#1f2c46' : '#3a3a3a'}" stroke="${INK}" stroke-width="2"/><path d="M48 40 Q70 38 88 44 Q70 47 50 46Z" fill="#2b2b2b" stroke="${INK}" stroke-width="2"/>`; break;
    }
    const wr = (lk.wrinkles || old) ? `<path d="M36 41 Q40 39 44 41 M56 41 Q60 39 64 41 M38 69 Q41 71 43 69 M57 69 Q60 71 62 69 M34 30 Q50 27 66 30" stroke="${shade(skin,-.35)}" stroke-width="1.2" fill="none"/>` : '';
    const gl = lk.glasses ? `<g fill="none" stroke="${INK}" stroke-width="1.8"><circle cx="40" cy="52" r="7"/><circle cx="60" cy="52" r="7"/><path d="M47 52 L53 52"/></g>` : '';
    const beard = lk.beard ? `<path d="M34 64 Q36 82 50 84 Q64 82 66 64 Q60 74 50 74 Q40 74 34 64Z" fill="${shade(hc,.25)}" opacity=".55"/>` : '';
    const lip = lk.lipstick ? '#b23a48' : shade(skin, -.35);
    const mood = opts.mood || 'neutral';
    const mouth = mood === 'angry' ? `<path d="M42 72 Q50 67 58 72" stroke="${INK}" stroke-width="2.4" fill="none"/>` :
      mood === 'smile' ? `<path d="M41 69 Q50 77 59 69" stroke="${lip}" stroke-width="2.6" fill="none"/>` :
      `<path d="M43 71 Q50 73 57 71" stroke="${lip}" stroke-width="2.4" fill="none"/>`;
    const brows = mood === 'angry' ? `<path d="M33 41 L45 45 M67 41 L55 45" stroke="${INK}" stroke-width="2.6"/>` : `<path d="M34 43 Q39 40 45 43 M55 43 Q61 40 66 43" stroke="${shade(hc,-.2)}" stroke-width="2.4" fill="none"/>`;
    const bg = opts.bg === false ? '' : `<rect width="100" height="120" rx="10" fill="${opts.bg || '#efe6d4'}"/>`;
    return `<svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" class="portrait">${bg}
      <path d="M8 120 Q10 92 32 88 L68 88 Q90 92 92 120Z" fill="${sh}" stroke="${INK}" stroke-width="2.4"/>
      <path d="M40 88 L50 100 L60 88" fill="${shade(sh,-.2)}" stroke="${INK}" stroke-width="1.6"/>
      <rect x="42" y="74" width="16" height="16" fill="${shade(skin,-.12)}"/>
      <ellipse cx="26" cy="54" rx="5" ry="7" fill="${skin}" stroke="${INK}" stroke-width="2"/><ellipse cx="74" cy="54" rx="5" ry="7" fill="${skin}" stroke="${INK}" stroke-width="2"/>
      <path d="M27 46 Q27 22 50 22 Q73 22 73 46 L72 62 Q70 82 50 84 Q30 82 28 62Z" fill="${skin}" stroke="${INK}" stroke-width="2.4"/>
      ${beard}${hair}${brows}
      <circle cx="40" cy="52" r="2.6" fill="${INK}"/><circle cx="60" cy="52" r="2.6" fill="${INK}"/>
      <path d="M50 54 Q48 62 51 63" stroke="${shade(skin,-.3)}" stroke-width="1.6" fill="none"/>
      ${mouth}${wr}${gl}
      <ellipse cx="36" cy="64" rx="5" ry="3" fill="#d8735f" opacity=".18"/><ellipse cx="64" cy="64" rx="5" ry="3" fill="#d8735f" opacity=".18"/>
    </svg>`;
  };

  // ---------- 小人（街上的） ----------
  A.figure = function (x, y, c, opts) {
    opts = opts || {}; const s = opts.s || 1; const skin = opts.skin || '#d9a57c';
    if (opts.sleep) {
      return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="-6" rx="26" ry="8" fill="${c}" stroke="${INK}" stroke-width="2"/><circle cx="-24" cy="-10" r="6" fill="${skin}" stroke="${INK}" stroke-width="2"/><path d="M-14 -16 q5 -5 10 0" stroke="#fff" opacity=".5" fill="none"/></g>`;
    }
    const bob = opts.anim ? ` class="bob" style="animation-delay:${(x * 13 % 900)}ms"` : '';
    return `<g transform="translate(${x},${y}) scale(${s})"><g${bob}>
      <rect x="-6" y="-14" width="5" height="14" fill="#3a3530"/><rect x="1" y="-14" width="5" height="14" fill="#3a3530"/>
      <path d="M-10 -14 L-9 -38 Q0 -44 9 -38 L10 -14Z" fill="${c}" stroke="${INK}" stroke-width="2"/>
      <circle cx="0" cy="-46" r="7.5" fill="${skin}" stroke="${INK}" stroke-width="2"/>
      ${opts.hat ? `<path d="M-8 -49 Q0 -58 8 -49Z" fill="${opts.hat}" stroke="${INK}" stroke-width="1.5"/>` : `<path d="M-7.5 -48 Q0 -57 7.5 -48 Q3 -51 -7.5 -48Z" fill="#231e1b"/>`}
      ${opts.phone ? `<rect x="5" y="-34" width="4" height="7" fill="#9fd" stroke="${INK}" stroke-width="1"/>` : ''}
    </g></g>`;
  };

  // ---------- 天空颜色 ----------
  function sky(h) {
    if (h < 4.5 || h >= 21) return ['#141a2c', '#28304a', 'night'];
    if (h < 6) return ['#28304d', '#c98a6e', 'dawn'];
    if (h < 8) return ['#7d9bb8', '#f0c9a0', 'morning'];
    if (h < 16) return ['#9fbdd3', '#ece3cf', 'day'];
    if (h < 18.5) return ['#7b7aa2', '#f1b07f', 'dusk'];
    return ['#2c2c4e', '#7c5a6e', 'evening'];
  }
  A.isDark = h => h < 6 || h >= 18.5;

  // ---------- 街景 ----------
  A.street = function (S, G) {
    const h = G.hourF(); const [s1, s2, mode] = sky(h); const dark = A.isDark(h);
    const W = 1280, H = 430, base = 330;
    let o = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" id="streetsvg">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
    <radialGradient id="lamp"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".75"/><stop offset="1" stop-color="#ffe7a8" stop-opacity="0"/></radialGradient>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#000" stroke-opacity=".07" stroke-width="2"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    if (mode === 'night' || mode === 'evening') for (let i = 0; i < 40; i++) o += `<circle cx="${(i * 97) % W}" cy="${(i * 53) % 110 + 8}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity="${.3 + (i % 4) * .15}"/>`;
    if (mode === 'day' || mode === 'morning') o += `<circle cx="1120" cy="60" r="26" fill="#fff4d6" opacity=".9"/>`;
    if (mode === 'night') o += `<circle cx="1140" cy="56" r="16" fill="#f3ecd2"/><circle cx="1148" cy="50" r="14" fill="${s1}"/>`;
    // 远处的厂房（亦庄开发区）
    const far = dark ? '#262a3e' : (mode === 'dusk' ? '#8a7690' : '#a8b3bd');
    o += `<path d="M0 230 L0 190 L80 190 L80 160 L96 160 L96 190 L200 190 L200 175 L330 175 L330 150 L345 150 L345 175 L470 175 L470 196 L600 196 L600 165 L640 165 L640 196 L760 196 L760 172 L900 172 L900 150 L914 150 L914 172 L1050 172 L1050 190 L1180 190 L1180 168 L1280 168 L1280 230Z" fill="${far}"/>`;
    // 楼
    const B = [
      { id: 'corner', w: '#cbb79a', hgt: 250, sign: '#b33a2e', st: '#fff3d6' },
      { id: 'food', w: '#d7c6a6', hgt: 230, sign: '#2f6b4f', st: '#fff' },
      { id: 'clothes', w: '#c9b5a8', hgt: 245, sign: '#d99a2b', st: '#2a2420' },
      { id: 'inn', w: '#bfae94', hgt: 285, sign: '#7d2a2a', st: '#ffe9b0' },
      { id: 'bar', w: '#b9a58f', hgt: 220, sign: '#c0392b', st: '#fff2c4' },
      { id: 'bank', w: '#c6cbcf', hgt: 255, sign: '#2a5d9b', st: '#fff' }
    ];
    B.forEach((b, i) => {
      const P = CONFIG.places.find(p => p.id === b.id); const x = 12 + i * 211, w = 200, top = base - b.hgt;
      const open = G.isOpen(P); const wall = dark ? shade(b.w, -.45) : b.w;
      const here = S.loc === b.id;
      o += `<g class="bld${here ? ' here' : ''}" data-loc="${b.id}">
        <rect x="${x}" y="${top}" width="${w}" height="${b.hgt}" fill="${wall}" stroke="${INK}" stroke-width="3"/>
        <rect x="${x}" y="${top}" width="${w}" height="${b.hgt}" fill="url(#hatch)"/>
        <rect x="${x - 4}" y="${top - 8}" width="${w + 8}" height="10" fill="${shade(wall, -.25)}" stroke="${INK}" stroke-width="2.5"/>`;
      // 楼上的窗
      for (let r = 0; r < Math.floor((b.hgt - 130) / 52); r++) for (let c = 0; c < 3; c++) {
        const lit = dark ? ((i * 7 + r * 3 + c * 5 + S.day) % 4 !== 0) : false;
        o += `<rect x="${x + 22 + c * 58}" y="${top + 20 + r * 52}" width="40" height="32" fill="${lit ? '#f6d48a' : (dark ? '#2b3145' : '#8fa6b4')}" stroke="${INK}" stroke-width="2"/><line x1="${x + 42 + c * 58}" y1="${top + 20 + r * 52}" x2="${x + 42 + c * 58}" y2="${top + 52 + r * 52}" stroke="${INK}" stroke-width="1.5"/>`;
      }
      // 招牌
      const sy = base - 128;
      o += `<rect x="${x + 8}" y="${sy}" width="${w - 16}" height="34" fill="${b.sign}" stroke="${INK}" stroke-width="2.5"/>
        <text x="${x + w / 2}" y="${sy + 24}" text-anchor="middle" font-size="${P.sign.length > 9 ? 14 : 17}" font-weight="700" fill="${b.st}">${P.sign}</text>`;
      // 门面
      const fy = sy + 40, fh = base - fy;
      if (open) {
        o += `<rect x="${x + 14}" y="${fy}" width="${w - 28}" height="${fh}" fill="${dark ? '#f2cf86' : '#5b5048'}" stroke="${INK}" stroke-width="2.5"/>`;
        if (dark) o += `<rect x="${x + 14}" y="${fy}" width="${w - 28}" height="${fh}" fill="#ffd27a" opacity=".25"/>`;
      } else {
        o += `<rect x="${x + 14}" y="${fy}" width="${w - 28}" height="${fh}" fill="${dark ? '#4a4f5c' : '#9aa0a6'}" stroke="${INK}" stroke-width="2.5"/>`;
        for (let k = fy + 6; k < base; k += 7) o += `<line x1="${x + 14}" y1="${k}" x2="${x + w - 14}" y2="${k}" stroke="${INK}" stroke-opacity=".35"/>`;
        o += `<text x="${x + w / 2}" y="${fy + 30}" text-anchor="middle" font-size="12" fill="#fff" opacity=".7">已打烊</text>`;
      }
      // 每栋楼的小细节
      if (b.id === 'corner') {
        ['快递190/天', '保安 查底子', '药厂 大巴接送'].forEach((t, k) => o += `<g transform="rotate(${k % 2 ? 3 : -3} ${x + 40 + k * 60} ${top + 140})"><rect x="${x + 16 + k * 60}" y="${top + 125 + (k % 2) * 8}" width="54" height="30" fill="#e6463a" stroke="${INK}" stroke-width="1.5"/><text x="${x + 43 + k * 60}" y="${top + 144 + (k % 2) * 8}" font-size="8.5" text-anchor="middle" fill="#fff8d0">${t}</text></g>`);
        o += `<rect x="${x + 24}" y="${base + 4}" width="150" height="16" rx="3" fill="#6e8a5a" stroke="${INK}" stroke-width="2"/><path d="M${x + 30} ${base + 4} q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0 q8 -14 16 0" fill="#7fa266" stroke="${INK}" stroke-width="1.5"/><rect x="${x + 176}" y="${base - 36}" width="10" height="56" fill="#3a6ea5" stroke="${INK}" stroke-width="2"/>`;
      }
      if (b.id === 'food') o += `<path d="M${x + 60} ${fy - 2} q-8 -16 0 -30 q8 -14 0 -28 M${x + 140} ${fy - 2} q-8 -16 0 -30" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" class="steam"/><rect x="${x + 70}" y="${fy + 24}" width="60" height="22" fill="#eee5d4" stroke="${INK}" stroke-width="2"/><text x="${x + 100}" y="${fy + 39}" font-size="10" text-anchor="middle" fill="#2f6b4f">拉面 9 元</text>`;
      if (b.id === 'clothes' && open) [0, 1, 2, 3].forEach(k => o += `<path d="M${x + 30 + k * 38} ${fy + 8} l-10 10 l4 4 l4 -3 l0 30 l24 0 l0 -30 l4 3 l4 -4 l-10 -10 q-10 6 -20 0Z" fill="${['#4d6b3c', '#7a6d4e', '#355a7a', '#8b3b33'][k]}" stroke="${INK}" stroke-width="1.8"/>`);
      if (b.id === 'clothes') o += `<rect x="${x + 150}" y="${base - 46}" width="36" height="46" fill="#e8e8e8" stroke="${INK}" stroke-width="2"/><circle cx="${x + 168}" cy="${base - 24}" r="11" fill="#9fc3d8" stroke="${INK}" stroke-width="2"/>`;
      if (b.id === 'inn') {
        o += `<rect x="${x + 154}" y="${top + 10}" width="30" height="${110}" fill="#7d2a2a" stroke="${INK}" stroke-width="2"/>`;
        '平安旅社'.split('').forEach((c, k) => o += `<text x="${x + 169}" y="${top + 36 + k * 25}" font-size="18" text-anchor="middle" fill="#ffe9b0" font-weight="700">${c}</text>`);
        if (open) o += `<g stroke="${INK}" stroke-width="2" fill="none"><rect x="${x + 30}" y="${fy + 12}" width="56" height="44"/><line x1="${x + 30}" y1="${fy + 34}" x2="${x + 86}" y2="${fy + 34}"/></g><text x="${x + 120}" y="${fy + 40}" font-size="11" fill="${dark ? '#5a3a20' : '#eadbb8'}">床位15元起</text>`;
      }
      if (b.id === 'bar') {
        if (open) {
          for (let k = 0; k < 6; k++) o += `<circle cx="${x + 16 + k * 34}" cy="${fy - 6 + (k % 2) * 4}" r="7" fill="#e8402f" stroke="${INK}" stroke-width="1.5" class="${dark ? 'glow' : ''}"/>`;
          o += `<rect x="${x + 20}" y="${base - 26}" width="60" height="10" fill="#555" stroke="${INK}" stroke-width="2"/><path d="M${x + 32} ${base - 30} q-6 -12 2 -24 q8 -12 0 -24" stroke="#ddd" stroke-opacity=".6" stroke-width="5" fill="none" class="steam"/>`;
          o += `<rect x="${x + 110}" y="${base - 30}" width="70" height="8" fill="#c8b48e" stroke="${INK}" stroke-width="2"/><line x1="${x + 116}" y1="${base - 22}" x2="${x + 116}" y2="${base}" stroke="${INK}" stroke-width="3"/><line x1="${x + 174}" y1="${base - 22}" x2="${x + 174}" y2="${base}" stroke="${INK}" stroke-width="3"/>`;
          [0, 1, 2].forEach(k => o += `<rect x="${x + 118 + k * 20}" y="${base - 44}" width="6" height="14" fill="#3e7d4a" stroke="${INK}" stroke-width="1"/>`);
        }
      }
      if (b.id === 'bank') {
        o += `<rect x="${x + 30}" y="${fy + 6}" width="70" height="${fh - 6}" fill="${dark ? '#bfe0ff' : '#9ec7e6'}" stroke="${INK}" stroke-width="2.5" opacity=".9"/><rect x="${x + 50}" y="${fy + 20}" width="30" height="40" fill="#5b6a78" stroke="${INK}" stroke-width="2"/>`;
        o += `<line x1="${x + 170}" y1="${base}" x2="${x + 170}" y2="${base - 120}" stroke="${INK}" stroke-width="4"/><rect x="${x + 140}" y="${base - 140}" width="60" height="34" rx="4" fill="#2a5d9b" stroke="${INK}" stroke-width="2"/><text x="${x + 170}" y="${base - 126}" text-anchor="middle" font-size="10" fill="#fff">🚌 公交站</text><text x="${x + 170}" y="${base - 112}" text-anchor="middle" font-size="9" fill="#fff">酒仙桥商业街</text>`;
      }
      o += `<rect x="${x}" y="${top - 10}" width="${w}" height="${b.hgt + 30}" fill="transparent" class="hit"/>`;
      o += `<text x="${x + w / 2}" y="${top - 16}" text-anchor="middle" class="bname">${P.name}</text></g>`;
    });
    // 地面
    o += `<rect x="0" y="${base}" width="${W}" height="24" fill="${dark ? '#4a4845' : '#9c9488'}" stroke="${INK}" stroke-width="2"/>
      <rect x="0" y="${base + 24}" width="${W}" height="${H - base - 24}" fill="${dark ? '#2e2d2f' : '#6d6a66'}"/>`;
    for (let k = 0; k < W; k += 90) o += `<rect x="${k + 20}" y="${base + 62}" width="44" height="5" fill="#e8e2cf" opacity=".6"/>`;
    // 路灯
    for (let k = 220; k < W; k += 422) { o += `<line x1="${k}" y1="${base + 20}" x2="${k}" y2="${base - 150}" stroke="${INK}" stroke-width="4"/><path d="M${k} ${base - 150} q14 0 18 10" stroke="${INK}" stroke-width="4" fill="none"/><rect x="${k + 10}" y="${base - 142}" width="18" height="7" fill="${dark ? '#ffe7a8' : '#ccc'}" stroke="${INK}" stroke-width="1.5"/>`;
      if (dark) o += `<ellipse cx="${k + 19}" cy="${base + 10}" rx="90" ry="60" fill="url(#lamp)"/>`; }
    // 人群
    const crowd = G.crowdAt(h);
    const cols = ['#5a6b7a', '#7a5a43', '#3f5747', '#6b4a5a', '#8a7a5a', '#3d3d48', '#9a4b3b', '#55607a'];
    for (let k = 0; k < crowd; k++) {
      const cx = 30 + ((k * 37) % 190) + (k > 12 ? 8 : 0), cy = base + 18 + ((k * 17) % 26);
      o += A.figure(cx, cy, cols[k % cols.length], { s: .9, anim: true, phone: k % 5 === 0, hat: k % 7 === 3 ? '#b33a2e' : null });
    }
    // 晚上烧烤摊的客人
    if (h >= 18 || h < 2) for (let k = 0; k < 4; k++) o += A.figure(12 + 4 * 211 + 110 + k * 20, base + 2, cols[(k + 3) % 8], { s: .8 });
    // 夜里睡在外面的人
    if (h >= 23 || h < 5) { o += A.figure(12 + 5 * 211 + 70, base + 20, '#6b5a45', { sleep: true }); o += A.figure(12 + 5 * 211 + 130, base + 22, '#4a5a6b', { sleep: true, s: .9 }); o += A.figure(90, base + 22, '#5b4a3b', { sleep: true }); }
    // 玩家
    const pi = B.findIndex(b => b.id === S.loc); const px = 12 + pi * 211 + 100;
    const pl = G.identity().look;
    o += `<g class="player"><ellipse cx="${px}" cy="${base + 52}" rx="20" ry="5" fill="#000" opacity=".25"/>${A.figure(px, base + 52, pl.shirt, { s: 1.35, skin: pl.skin })}
      <g class="pin"><path d="M${px} ${base - 26} l-10 -14 h20z" fill="#f2c14e" stroke="${INK}" stroke-width="2"/><rect x="${px - 26}" y="${base - 62}" width="52" height="22" rx="6" fill="#f2c14e" stroke="${INK}" stroke-width="2"/><text x="${px}" y="${base - 46}" text-anchor="middle" font-size="13" font-weight="700" fill="${INK}">${G.identity().name}</text></g></g>`;
    if (dark) o += `<rect width="${W}" height="${H}" fill="#0b1030" opacity="${h >= 21 || h < 4.5 ? .28 : .15}" pointer-events="none"/>`;
    o += `</svg>`;
    return o;
  };

  // ---------- 小传插画 ----------
  A.bioScene = function (scene, look) {
    const W = 900, H = 380; let o = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="bioscene">`;
    const fig = (x, y, s) => A.figure(x, y, look.shirt, { s: s || 2.2, skin: look.skin });
    switch (scene) {
      case 'campus':
        o += `<rect width="${W}" height="${H}" fill="#cfe0e6"/><rect x="0" y="300" width="${W}" height="80" fill="#9fb58a"/>
        <rect x="80" y="110" width="420" height="190" fill="#d8c9b0" stroke="${INK}" stroke-width="3"/><path d="M60 110 L290 40 L520 110Z" fill="#8b4b3b" stroke="${INK}" stroke-width="3"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${110 + i * 78}" y="150" width="44" height="60" fill="#8fb0c4" stroke="${INK}" stroke-width="2"/>`).join('')}
        <rect x="260" y="230" width="60" height="70" fill="#5b4a3b" stroke="${INK}" stroke-width="3"/>
        <circle cx="700" cy="170" r="80" fill="#6f9a5a" stroke="${INK}" stroke-width="3"/><rect x="690" y="230" width="20" height="80" fill="#6b4a33" stroke="${INK}" stroke-width="3"/>${fig(600, 330)}`; break;
      case 'subway':
        o += `<rect width="${W}" height="${H}" fill="#3a4250"/><rect x="0" y="80" width="${W}" height="190" rx="20" fill="#d9dde2" stroke="${INK}" stroke-width="3"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${40 + i * 170}" y="110" width="120" height="70" rx="8" fill="#22324a" stroke="${INK}" stroke-width="2"/>`).join('')}
        <rect x="0" y="200" width="${W}" height="14" fill="#c0392b"/><text x="450" y="60" fill="#fff" font-size="22" text-anchor="middle">→ 同济南路</text>${fig(450, 330)}`; break;
      case 'street':
        o += `<rect width="${W}" height="${H}" fill="#f0c9a0"/><rect x="0" y="0" width="${W}" height="150" fill="#9fb4c8"/>
        <path d="M0 150 L120 150 L120 90 L300 90 L300 150 L900 150 L900 180 L0 180Z" fill="#8a96a3"/>
        <rect x="0" y="230" width="${W}" height="50" fill="#5f8fb0"/><path d="M0 245 q40 -8 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#cde" fill="none" stroke-width="2"/>
        <rect x="180" y="210" width="540" height="20" fill="#b6a68c" stroke="${INK}" stroke-width="3"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${20 + i * 110}" y="${290 + (i % 2) * 6}" width="90" height="${90}" fill="${['#c9b59a', '#bfa98a', '#d2c0a4'][i % 3]}" stroke="${INK}" stroke-width="2.5"/>`).join('')}${fig(450, 215, 1.6)}`; break;
      case 'crowd':
        o += `<rect width="${W}" height="${H}" fill="#2d3550"/><rect y="200" width="${W}" height="180" fill="#5a5856"/><circle cx="760" cy="80" r="30" fill="#f6d48a" opacity=".5"/>`;
        for (let i = 0; i < 26; i++) o += A.figure(60 + (i * 67) % 800, 270 + (i * 29) % 90, ['#5a6b7a', '#7a5a43', '#3f5747', '#6b4a5a', '#8a7a5a'][i % 5], { s: 1.6, phone: i % 4 === 0 });
        o += `<rect x="600" y="150" width="160" height="70" fill="#e6463a" stroke="${INK}" stroke-width="2"/><text x="680" y="192" text-anchor="middle" fill="#fff" font-size="20">快递 190 一天</text>${fig(450, 370, 2.4)}`; break;
      case 'village':
        o += `<rect width="${W}" height="${H}" fill="#e7d9b8"/><rect y="250" width="${W}" height="130" fill="#b8a15a"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `<path d="M${i * 100} 380 L${i * 100 + 50} 250" stroke="#8c7a3a" stroke-width="3"/>`).join('')}
        <rect x="120" y="140" width="220" height="110" fill="#d9c7a3" stroke="${INK}" stroke-width="3"/><path d="M100 140 L230 80 L360 140Z" fill="#8a5a3b" stroke="${INK}" stroke-width="3"/><rect x="210" y="190" width="40" height="60" fill="#5b4a3b"/>${fig(600, 330)}`; break;
      case 'leave':
        o += `<defs><linearGradient id="ls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5b8a"/><stop offset="1" stop-color="#f1b07f"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#ls)"/><circle cx="700" cy="170" r="46" fill="#ffd99a"/>
        <path d="M0 200 L90 200 L90 150 L104 150 L104 200 L260 200 L260 170 L420 170 L420 200 L900 200 L900 230 L0 230Z" fill="#7d6a86"/>
        <rect x="0" y="230" width="${W}" height="40" fill="#5f8fb0"/><rect x="0" y="270" width="${W}" height="110" fill="#6d6a66"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${20 + i * 150}" y="325" width="70" height="6" fill="#e8e2cf" opacity=".6"/>`).join('')}
        <g class="busgo"><rect x="250" y="190" width="400" height="120" rx="18" fill="#3f74b5" stroke="${INK}" stroke-width="4"/><rect x="250" y="270" width="400" height="12" fill="#f2c14e"/>
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${270 + i * 74}" y="206" width="60" height="50" rx="6" fill="#fbe3b8" stroke="${INK}" stroke-width="2.5"/>`).join('')}
        <circle cx="330" cy="314" r="22" fill="${INK}"/><circle cx="570" cy="314" r="22" fill="${INK}"/><circle cx="330" cy="314" r="8" fill="#999"/><circle cx="570" cy="314" r="8" fill="#999"/>
        <circle cx="448" cy="228" r="11" fill="${look.skin}" stroke="${INK}" stroke-width="2"/><path d="M436 256 q12 -18 24 0" fill="${look.shirt}" stroke="${INK}" stroke-width="2"/>
        <text x="600" y="232" font-size="14" fill="${INK}">酒仙桥 → 回家</text></g>`; break;
      case 'phone':
        o += `<rect width="${W}" height="${H}" fill="#2b2a33"/><circle cx="450" cy="120" r="200" fill="#f6d48a" opacity=".18"/><rect x="200" y="260" width="500" height="20" fill="#7a5a3b" stroke="${INK}" stroke-width="3"/>
        <path d="M430 60 L470 60 L500 140 L400 140Z" fill="#f2c14e" stroke="${INK}" stroke-width="3"/><line x1="450" y1="140" x2="450" y2="260" stroke="${INK}" stroke-width="4"/>${fig(330, 300, 2.4)}<rect x="350" y="170" width="16" height="26" fill="#9fd" stroke="${INK}" stroke-width="2"/>`; break;
      case 'notebook':
        o += `<rect width="${W}" height="${H}" fill="#e8dcc4"/><rect x="180" y="60" width="540" height="280" rx="8" fill="#f7f1e2" stroke="${INK}" stroke-width="3"/>
        <line x1="240" y1="110" x2="660" y2="110" stroke="#c9b89a" stroke-width="2"/>
        ${[0,1,2,3,4].map(i => `<line x1="240" y1="${150+i*36}" x2="620" y2="${150+i*36}" stroke="#d7c9ae" stroke-width="2"/>`).join('')}
        <text x="260" y="145" font-size="18" fill="${INK}">不要只采访数字，要听故事。</text>
        <rect x="620" y="200" width="70" height="90" fill="#4f7fa8" stroke="${INK}" stroke-width="2" transform="rotate(-8 655 245)"/>
        ${fig(120, 330, 1.8)}`; break;
      case 'money':
        o += `<rect width="${W}" height="${H}" fill="#2f3540"/><circle cx="700" cy="90" r="50" fill="#f6d48a" opacity=".25"/>
        <rect x="280" y="120" width="340" height="200" rx="10" fill="#3d4a3e" stroke="${INK}" stroke-width="3"/>
        ${[0,1,2,3,4].map(i => `<rect x="${310+i*8}" y="${150+i*6}" width="260" height="40" rx="4" fill="#6f9a5a" stroke="${INK}" stroke-width="2" opacity="${1-i*0.12}"/>`).join('')}
        <text x="450" y="175" text-anchor="middle" font-size="22" fill="#f3ead8">¥ 300</text>
        ${fig(160, 330, 2.0)}<text x="160" y="360" text-anchor="middle" font-size="14" fill="#cfc6b4">揣进内衣口袋</text>`; break;

    }
    return o + `</svg>`;
  };

  // ---------- 坐车 ----------
  A.bus = function (kind, h) {
    const dark = A.isDark(h); const big = /大巴/.test(kind); const wall = big ? '#4b5468' : '#5a5148';
    let o = `<svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" class="busbg"><rect width="900" height="300" fill="${dark ? '#151a2c' : '#a9c4d6'}"/>`;
    o += `<g class="scroll">`;
    for (let i = 0; i < 30; i++) o += `<rect x="${i * 70}" y="${70 + (i * 37) % 40}" width="${46 + (i * 13) % 30}" height="${120}" fill="${dark ? '#2a3048' : '#8794a1'}"/>`;
    if (dark) for (let i = 0; i < 30; i++) o += `<rect x="${i * 70 + 14}" y="${90 + (i * 37) % 40}" width="8" height="8" fill="#f6d48a"/>`;
    for (let i = 0; i < 30; i++) o += `<line x1="${i * 70}" y1="150" x2="${i * 70}" y2="60" stroke="${dark ? '#333a55' : '#6d7a86'}" stroke-width="3"/>`;
    o += `</g>`;
    let holes = ''; for (let i = 0; i < 3; i++) { const x = 40 + i * 290; holes += `M${x + 12} 30 h226 a12 12 0 0 1 12 12 v106 a12 12 0 0 1 -12 12 h-226 a12 12 0 0 1 -12 -12 v-106 a12 12 0 0 1 12 -12z`; }
    o += `<path d="M0 0 H900 V300 H0Z ${holes}" fill="${wall}" fill-rule="evenodd" stroke="${INK}" stroke-width="3"/>`;
    o += `<rect x="0" y="170" width="900" height="130" fill="${big ? '#3a4152' : '#463e36'}"/>`;
    for (let i = 0; i < 4; i++) o += `<rect x="${30 + i * 220}" y="185" width="170" height="90" rx="12" fill="${big ? '#6a2e3a' : '#5d5a55'}" stroke="${INK}" stroke-width="3"/>`;
    if (big) o += `<rect x="0" y="0" width="900" height="16" fill="#2a2f3d"/>`;
    return o + `</svg>`;
  };

  // ---------- v0.7 上身试穿（全身素描） ----------
  A.playerLook = function (overrideCloth) {
    const I = (window.G && G.S() && G.identity) ? G.identity() : null;
    const base = (I && I.look) ? Object.assign({}, I.look) : { skin: '#e0b08a', hair: 'short', hairColor: '#222', shirt: '#556', age: 30 };
    const cloth = overrideCloth || (window.G && G.outfit ? G.outfit() : null);
    if (cloth && cloth.colors && cloth.colors.top) base.shirt = cloth.colors.top;
    return base;
  };

  A.outfitBody = function (look, cloth, opts) {
    look = look || {}; opts = opts || {};
    cloth = cloth || { colors: { top: look.shirt || '#556', pants: '#3a3530', style: 'tee' }, name: '便装' };
    const col = cloth.colors || { top: '#556', pants: '#3a3530', style: 'tee' };
    const skin = look.skin || '#e0b08a', hc = look.hairColor || '#222';
    const top = col.top || '#556', pants = col.pants || '#3a3530', accent = col.accent || shade(top, .25);
    const style = col.style || 'tee';
    const W = opts.w || 160, H = opts.h || 240;
    const label = opts.label !== false;
    // 头发简化
    let hair = `<path d="M62 58 Q60 34 80 32 Q100 34 98 58 Q94 46 86 44 Q80 42 74 44 Q66 48 62 58Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`;
    if (look.hair === 'grey' || look.hair === 'short') hair = `<path d="M62 58 Q60 36 80 34 Q100 36 98 58 Q94 46 86 44 Q74 42 62 58Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`;
    if (look.hair === 'long') hair = `<path d="M58 50 Q50 28 80 26 Q110 28 102 52 L108 112 Q96 92 88 68 Q80 56 72 68 Q62 94 52 112Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`;
    if (look.hair === 'tied') hair = `<path d="M64 58 Q62 36 80 34 Q98 36 96 58 Q92 46 80 44 Q68 46 64 58Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="98" cy="26" rx="11" ry="9" fill="${hc}" stroke="${INK}" stroke-width="2"/>
      <path d="M86 32 Q98 16 108 30" fill="${hc}" stroke="${INK}" stroke-width="2"/>
      <path d="M90 30 Q100 34 106 26" fill="none" stroke="${shade(hc, .45)}" stroke-width="2.4"/>`;
    if (look.hair === 'bald') hair = '';
    if (look.hair === 'messy') hair = `<path d="M60 60 Q54 34 72 30 L76 38 L84 28 L88 38 Q106 32 100 60 Q96 48 88 46 L80 40 L72 46 Q64 48 60 60Z" fill="${hc}" stroke="${INK}" stroke-width="2"/>`;
    if (look.glasses) hair += `<g fill="none" stroke="${INK}" stroke-width="1.6"><circle cx="72" cy="64" r="5"/><circle cx="88" cy="64" r="5"/><path d="M77 64 L83 64"/></g>`;
    // 上装按 style
    let torso = '';
    if (style === 'tee' || style === 'polo') {
      torso = `<path d="M52 92 L48 150 L112 150 L108 92 Q80 100 52 92Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M52 92 L40 118 L48 122 L56 98Z" fill="${top}" stroke="${INK}" stroke-width="2"/>
        <path d="M108 92 L120 118 L112 122 L104 98Z" fill="${top}" stroke="${INK}" stroke-width="2"/>
        <path d="M68 92 Q80 102 92 92" fill="${shade(skin,-.08)}" stroke="${INK}" stroke-width="1.6"/>`;
      if (style === 'polo') torso += `<path d="M74 92 L80 108 L86 92" fill="none" stroke="${INK}" stroke-width="1.8"/><circle cx="80" cy="100" r="1.6" fill="${accent}"/>`;
    } else if (style === 'hoodie') {
      torso = `<path d="M50 88 L46 150 L114 150 L110 88 Q80 98 50 88Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M58 78 Q80 68 102 78 L108 92 Q80 100 52 92Z" fill="${shade(top,.1)}" stroke="${INK}" stroke-width="2"/>
        <path d="M50 88 L36 120 L46 124 L58 96Z M110 88 L124 120 L114 124 L102 96Z" fill="${top}" stroke="${INK}" stroke-width="2"/>
        <ellipse cx="80" cy="118" rx="18" ry="10" fill="${shade(top,-.12)}" stroke="${INK}" stroke-width="1.5"/>`;
    } else if (style === 'uniform') {
      torso = `<path d="M52 90 L48 150 L112 150 L108 90 Q80 98 52 90Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M52 90 L38 116 L48 120 L58 96Z M108 90 L122 116 L112 120 L102 96Z" fill="${top}" stroke="${INK}" stroke-width="2"/>
        <rect x="72" y="100" width="16" height="22" rx="2" fill="${accent}" stroke="${INK}" stroke-width="1.5"/>
        <path d="M80 90 L80 150" stroke="${accent}" stroke-width="2"/>
        <circle cx="76" cy="108" r="1.4" fill="${INK}"/><circle cx="76" cy="116" r="1.4" fill="${INK}"/>`;
    } else if (style === 'coat' || style === 'jacket' || style === 'brand') {
      torso = `<path d="M48 88 L44 152 L116 152 L112 88 Q80 96 48 88Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M48 88 L32 122 L44 126 L58 96Z M112 88 L128 122 L116 126 L102 96Z" fill="${shade(top,-.08)}" stroke="${INK}" stroke-width="2"/>
        <path d="M80 92 L80 152" stroke="${INK}" stroke-width="1.8"/>
        <path d="M58 110 L72 108 M88 108 L102 110" stroke="${accent}" stroke-width="2"/>`;
      if (style === 'brand') torso += `<rect x="96" y="118" width="10" height="6" rx="1" fill="${accent}" stroke="${INK}" stroke-width="1"/>`;
      if (col.pattern === 'camo') torso += `<g opacity=".35" fill="${shade(top,.25)}"><circle cx="60" cy="118" r="5"/><circle cx="78" cy="130" r="6"/><circle cx="98" cy="120" r="5"/><circle cx="70" cy="140" r="4"/></g>`;
    } else if (style === 'shirt' || style === 'suit') {
      torso = `<path d="M54 90 L50 150 L110 150 L106 90 Q80 98 54 90Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M54 90 L40 116 L50 120 L60 96Z M106 90 L120 116 L110 120 L100 96Z" fill="${top}" stroke="${INK}" stroke-width="2"/>
        <path d="M80 90 L80 150" stroke="${INK}" stroke-width="1.6"/>
        <path d="M72 90 L80 108 L88 90" fill="${shade(top,-.15)}" stroke="${INK}" stroke-width="1.5"/>`;
      if (style === 'suit') torso += `<path d="M50 90 L64 128 L80 100 L96 128 L110 90" fill="none" stroke="${shade(top,-.25)}" stroke-width="2"/><rect x="74" y="112" width="12" height="4" fill="${accent}"/>`;
    } else if (style === 'puffer') {
      torso = `<path d="M46 86 L42 154 L118 154 L114 86 Q80 94 46 86Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>
        <path d="M46 86 L30 118 L42 122 L56 94Z M114 86 L130 118 L118 122 L104 94Z" fill="${shade(top,-.1)}" stroke="${INK}" stroke-width="2"/>
        ${[0,1,2,3,4].map(i => `<path d="M50 ${100+i*10} Q80 ${96+i*10} 110 ${100+i*10}" fill="none" stroke="${shade(top,-.2)}" stroke-width="1.6"/>`).join('')}
        <path d="M72 86 Q80 78 88 86" fill="${shade(top,.1)}" stroke="${INK}" stroke-width="1.5"/>`;
    } else {
      torso = `<path d="M52 92 L48 150 L112 150 L108 92 Q80 100 52 92Z" fill="${top}" stroke="${INK}" stroke-width="2.4"/>`;
    }
    const legs = `<path d="M52 150 L48 210 L72 210 L76 150Z" fill="${pants}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M84 150 L88 210 L112 210 L108 150Z" fill="${pants}" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="60" cy="214" rx="14" ry="5" fill="#2a2420"/><ellipse cx="100" cy="214" rx="14" ry="5" fill="#2a2420"/>`;
    const arms = ''; // already in torso sleeves
    const head = `<ellipse cx="80" cy="68" rx="22" ry="26" fill="${skin}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="72" cy="66" r="2.2" fill="${INK}"/><circle cx="88" cy="66" r="2.2" fill="${INK}"/>
      <path d="M74 78 Q80 82 86 78" stroke="${INK}" stroke-width="1.8" fill="none"/>
      ${hair}
      <rect x="72" y="88" width="16" height="10" fill="${shade(skin,-.1)}"/>`;
    const tag = label ? `<text x="80" y="${H - 8}" text-anchor="middle" font-size="12" fill="${INK}" font-family="sans-serif">${(cloth.name || '').slice(0, 10)}</text>` : '';
    const glow = opts.glow ? `<ellipse cx="80" cy="140" rx="54" ry="70" fill="#f6d48a" opacity=".18"/>` : '';
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="outfit-body">${glow}${head}${torso}${legs}${tag}</svg>`;
  };

  A.clothThumb = function (cloth) {
    cloth = cloth || {};
    const col = cloth.colors || { top: '#888', pants: '#444', style: 'tee' };
    const top = col.top, pants = col.pants || '#333', accent = col.accent || shade(top, .2);
    const style = col.style || 'tee';
    let body = `<path d="M18 28 L14 78 L66 78 L62 28 Q40 36 18 28Z" fill="${top}" stroke="${INK}" stroke-width="2"/>
      <path d="M18 28 L6 48 L16 52 L26 34Z M62 28 L74 48 L64 52 L54 34Z" fill="${top}" stroke="${INK}" stroke-width="1.8"/>
      <path d="M28 78 L26 96 L38 96 L40 78Z M42 78 L44 96 L56 96 L54 78Z" fill="${pants}" stroke="${INK}" stroke-width="1.8"/>`;
    if (style === 'uniform') body += `<rect x="34" y="40" width="12" height="16" fill="${accent}" stroke="${INK}" stroke-width="1"/>`;
    if (style === 'brand' || style === 'suit') body += `<rect x="48" y="52" width="8" height="5" fill="${accent}" stroke="${INK}" stroke-width="1"/>`;
    if (style === 'hoodie') body += `<path d="M26 18 Q40 10 54 18 L62 28 Q40 34 18 28Z" fill="${shade(top,.1)}" stroke="${INK}" stroke-width="1.8"/>`;
    if (col.pattern === 'camo') body += `<g opacity=".4" fill="${shade(top,.3)}"><circle cx="30" cy="48" r="4"/><circle cx="48" cy="56" r="5"/></g>`;
    // hanger
    return `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" class="cloth-thumb"><path d="M40 8 Q40 4 44 4 Q48 4 48 8" fill="none" stroke="${INK}" stroke-width="2"/><path d="M16 22 L40 12 L64 22" fill="none" stroke="${INK}" stroke-width="2"/>${body}</svg>`;
  };

  // ---------- v0.7 菜品素描 ----------
  A.dish = function (meal) {
    const id = (typeof meal === 'string') ? meal : (meal && (meal.dish || meal.id)) || 'box';
    const IN = INK;
    let art = '';
    if (id === 'noodle') {
      art = `<ellipse cx="70" cy="78" rx="52" ry="16" fill="#c9b79a" stroke="${IN}" stroke-width="2.5"/>
        <ellipse cx="70" cy="70" rx="48" ry="28" fill="#e8c96a" stroke="${IN}" stroke-width="2.5"/>
        <ellipse cx="70" cy="62" rx="40" ry="18" fill="#c45c3e" stroke="${IN}" stroke-width="2"/>
        ${[0,1,2,3,4,5].map(i => `<path d="M${40+i*10} 58 q8 10 0 20" fill="none" stroke="#f3e2b0" stroke-width="2.2"/>`).join('')}
        <ellipse cx="88" cy="58" rx="10" ry="8" fill="#e8d4a0" stroke="${IN}" stroke-width="1.8"/>
        <circle cx="88" cy="56" r="2.5" fill="#5a3a20"/>
        <path d="M108 40 q16 -8 20 10" stroke="${IN}" stroke-width="2.5" fill="none"/>
        <path d="M55 42 q-4 -14 2 -22 M70 38 q0 -16 6 -24 M85 42 q4 -14 0 -22" stroke="#ddd" stroke-width="2" fill="none" opacity=".7" class="steam"/>`;
    } else if (id === 'dumpling') {
      art = `<ellipse cx="70" cy="82" rx="54" ry="14" fill="#d7c6a6" stroke="${IN}" stroke-width="2.5"/>
        <ellipse cx="70" cy="74" rx="50" ry="20" fill="#f7f1e2" stroke="${IN}" stroke-width="2"/>
        ${[[40,62],[55,55],[70,52],[85,55],[100,62],[48,70],[70,68],[92,70]].map(([x,y],i) =>
          `<ellipse cx="${x}" cy="${y}" rx="12" ry="9" fill="#f3ead8" stroke="${IN}" stroke-width="1.8" transform="rotate(${(i%3-1)*12} ${x} ${y})"/>`).join('')}
        <path d="M50 40 q-2 -12 4 -18 M70 36 q0 -14 4 -20 M90 40 q2 -12 -2 -18" stroke="#ddd" stroke-width="2" fill="none" class="steam"/>`;
    } else if (id === 'box' || id === 'leftover') {
      const dirty = id === 'leftover';
      art = `<rect x="22" y="40" width="96" height="64" rx="6" fill="${dirty ? '#d9c7a3' : '#fffaf0'}" stroke="${IN}" stroke-width="2.5"/>
        <line x1="70" y1="40" x2="70" y2="104" stroke="${IN}" stroke-width="1.5"/>
        <line x1="22" y1="72" x2="118" y2="72" stroke="${IN}" stroke-width="1.5"/>
        <ellipse cx="46" cy="56" rx="14" ry="8" fill="#8b3b33" stroke="${IN}" stroke-width="1.5"/>
        <ellipse cx="94" cy="56" rx="12" ry="7" fill="#5a6b3c" stroke="${IN}" stroke-width="1.5"/>
        <ellipse cx="46" cy="88" rx="16" ry="9" fill="#f3ead8" stroke="${IN}" stroke-width="1.5"/>
        <ellipse cx="94" cy="88" rx="14" ry="8" fill="#c45c3e" stroke="${IN}" stroke-width="1.5"/>
        ${dirty ? `<path d="M30 48 q20 8 40 -4" stroke="#8a7a5a" stroke-width="1.5" fill="none" opacity=".5"/>` : ''}`;
    } else if (id === 'bun') {
      art = `<ellipse cx="70" cy="90" rx="40" ry="10" fill="#c9b79a" stroke="${IN}" stroke-width="2"/>
        ${[0,1,2].map(i => `<ellipse cx="${48+i*22}" cy="${70-i}" rx="16" ry="12" fill="#f7f1e2" stroke="${IN}" stroke-width="2"/><path d="M${40+i*22} ${70-i} q8 -6 16 0" fill="none" stroke="#d7c6a6" stroke-width="1.5"/>`).join('')}
        <ellipse cx="110" cy="78" rx="14" ry="18" fill="#f3ead8" stroke="${IN}" stroke-width="2"/>
        <ellipse cx="110" cy="70" rx="10" ry="4" fill="#fff" opacity=".5"/>
        <path d="M55 48 q-2 -12 2 -18 M75 44 q0 -14 4 -20" stroke="#ddd" stroke-width="2" fill="none" class="steam"/>`;
    } else if (id === 'sausage') {
      art = `<ellipse cx="70" cy="88" rx="36" ry="8" fill="#c9b79a" stroke="${IN}" stroke-width="2"/>
        <path d="M30 70 Q50 40 90 55 Q110 62 118 70 Q100 78 70 75 Q40 72 30 70Z" fill="#c45c3e" stroke="${IN}" stroke-width="2.4"/>
        <path d="M40 62 Q60 50 88 58" fill="none" stroke="#e8c96a" stroke-width="2"/>
        <rect x="24" y="66" width="10" height="6" rx="2" fill="#e8d4a0" stroke="${IN}" stroke-width="1.5"/>`;
    } else if (id === 'stew') {
      art = `<ellipse cx="70" cy="92" rx="54" ry="14" fill="#6b4a3a" stroke="${IN}" stroke-width="2.5"/>
        <ellipse cx="70" cy="78" rx="50" ry="28" fill="#8b3b33" stroke="${IN}" stroke-width="2.5"/>
        <ellipse cx="70" cy="70" rx="42" ry="18" fill="#a05030" stroke="${IN}" stroke-width="2"/>
        <ellipse cx="55" cy="68" rx="10" ry="7" fill="#d9a57c" stroke="${IN}" stroke-width="1.5"/>
        <ellipse cx="80" cy="64" rx="12" ry="8" fill="#c9b79a" stroke="${IN}" stroke-width="1.5"/>
        <ellipse cx="95" cy="72" rx="8" ry="6" fill="#5a6b3c" stroke="${IN}" stroke-width="1.5"/>
        ${[0,1,2,3].map(i => `<path d="M${45+i*14} 50 q-3 -14 2 -22" stroke="#ddd" stroke-width="2" fill="none" class="steam"/>`).join('')}`;
    } else if (id === 'bbq') {
      art = `<rect x="20" y="78" width="100" height="18" rx="3" fill="#6b5a48" stroke="${IN}" stroke-width="2"/>
        ${[0,1,2,3].map(i => {
          const x = 32 + i * 22;
          return `<line x1="${x}" y1="40" x2="${x}" y2="88" stroke="#3a3530" stroke-width="2.5"/>
            <ellipse cx="${x}" cy="52" rx="8" ry="6" fill="#8b3b33" stroke="${IN}" stroke-width="1.5"/>
            <ellipse cx="${x}" cy="64" rx="8" ry="6" fill="#c45c3e" stroke="${IN}" stroke-width="1.5"/>
            <ellipse cx="${x}" cy="76" rx="8" ry="5" fill="#5a6b3c" stroke="${IN}" stroke-width="1.5"/>`;
        }).join('')}
        <path d="M40 30 q10 -8 20 0 M70 26 q8 -10 18 0" stroke="#aaa" stroke-width="2" fill="none" opacity=".6"/>`;
    } else if (id === 'beer') {
      art = `<rect x="50" y="40" width="40" height="60" rx="4" fill="#e8c96a" stroke="${IN}" stroke-width="2.5"/>
        <rect x="50" y="40" width="40" height="14" fill="#f7f1e2" stroke="${IN}" stroke-width="2"/>
        <path d="M90 55 Q108 58 108 78 Q108 92 90 90" fill="none" stroke="${IN}" stroke-width="2.5"/>
        <ellipse cx="70" cy="100" rx="22" ry="6" fill="#c9b79a" stroke="${IN}" stroke-width="2"/>
        <path d="M58 48 q4 -6 8 0 q4 6 8 0" fill="#fff" opacity=".5"/>`;
    } else {
      art = `<ellipse cx="70" cy="80" rx="40" ry="20" fill="#f3ead8" stroke="${IN}" stroke-width="2.5"/>`;
    }
    return `<svg viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg" class="dish-art">${art}</svg>`;
  };

  window.ART = A;
})();
