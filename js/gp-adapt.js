// v1.0.2 · 正式工作改用新的经典小游戏。自动化测试（webdriver 且没开 GP_REAL）时仍走老小游戏，老游戏也始终留作兜底。
(function () {
  if (!window.MG || !window.GP) return;
  const real = () => !(navigator.webdriver && !window.GP_REAL);
  [['site', 'site'], ['coldstore', 'cold'], ['print', 'print'], ['antigen', 'flip'], ['dishwash', 'dish']].forEach(([mg, gp]) => {
    const old = MG[mg]; if (!old) return;
    MG['old_' + mg] = old;
    MG[mg] = function (root, o) {
      if (!real() || !GP.games[gp]) return old(root, o);
      const jb = (window.CONFIG && CONFIG.jobs || []).find(x => x.game === mg); const hm = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); }; const hours = jb ? ((hm(jb.end) - hm(jb.start) + 1440) % 1440) / 60 : undefined;
      return GP.mount(gp, root, Object.assign({ hours }, o, { noTut: false })).then(r => r, e => { console.error(e); return old(root, o); });
    };
  });
})();

// Cleaning fallback and meal-for-work use the same polished germ/stain match-3, not whack-a-mole.
if (window.GP && GP.games.dish) { GP.games.oddjobFallback = GP.games.oddjob; GP.reg('oddjob', Object.assign({}, GP.games.dish, { title:'饭馆打杂 · 擦桌消消乐', hours:1.5, minutes:90 })); }
