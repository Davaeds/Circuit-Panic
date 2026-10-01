/* Circuit Panic! — the main menu: a home electrician's workbench late at night.
   A live wire has burst out of the wall. Mostly it lurks, coiled above its hole,
   watching. Every so often it creeps up on one of the nervous parts on the bench
   and pokes it. Now and then the fuse and the light switch try to sneak across
   the back of the bench; the wire reaches for them and they run for it. The access
   control board keeps its nose in a book, and something made of badly cabled wire
   lives outside the window. When the wire bonks its head on the shop lamp the
   whole room shorts out and only eyes are left in the dark. */
(function () {
  'use strict';
  const T = window.Toons, A = window.AudioSys, App = window.App, { Particles } = window.FX;
  const { el, sa, R, rand, pick, clamp, INK } = T;
  const svg = App.svg;
  const BR = '#3a2414';

  App.defs.insertAdjacentHTML('beforeend', `
    <linearGradient id="gWallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3122"/><stop offset=".55" stop-color="#6e4a31"/><stop offset="1" stop-color="#553624"/></linearGradient>
    <radialGradient id="gLampPool" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#ffe0a0" stop-opacity=".42"/><stop offset=".55" stop-color="#ffd690" stop-opacity=".12"/><stop offset="1" stop-color="#ffd690" stop-opacity="0"/></radialGradient>
    <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161a3c"/><stop offset="1" stop-color="#3f3766"/></linearGradient>
    <linearGradient id="gBenchTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e5f37"/><stop offset="1" stop-color="#c08a55"/></linearGradient>
    <linearGradient id="gBenchFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a341c"/><stop offset="1" stop-color="#3a2011"/></linearGradient>
    <linearGradient id="gPeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a87547"/><stop offset="1" stop-color="#855a33"/></linearGradient>
    <pattern id="pegHoles" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="2.6" fill="#4a2e18"/></pattern>
    <linearGradient id="gShade" x1="0" x2="1"><stop offset="0" stop-color="#1f4a3a"/><stop offset=".45" stop-color="#3f8a6c"/><stop offset="1" stop-color="#173a2d"/></linearGradient>
    <linearGradient id="gCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".30"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>
    <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe392"/><stop offset=".5" stop-color="#d7a13a"/><stop offset="1" stop-color="#855a14"/></linearGradient>
    <linearGradient id="gTitleCream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8dc"/><stop offset=".6" stop-color="#f8e2a4"/><stop offset="1" stop-color="#e9b95a"/></linearGradient>
    <linearGradient id="gTitleRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".5" stop-color="#e5352b"/><stop offset="1" stop-color="#961016"/></linearGradient>
    <linearGradient id="gEnamel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c5243"/><stop offset="1" stop-color="#17302a"/></linearGradient>
    <radialGradient id="gBenchPool"><stop offset="0" stop-color="#ffd996" stop-opacity=".5"/><stop offset=".6" stop-color="#ffcf80" stop-opacity=".2"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/></radialGradient>
    <radialGradient id="gHole" cx="45%" cy="45%" r="60%"><stop offset="0" stop-color="#050203"/><stop offset=".7" stop-color="#1a0e0a"/><stop offset="1" stop-color="#3a2216"/></radialGradient>
    <clipPath id="winClip"><rect x="84" y="94" width="192" height="192"/></clipPath>
    <filter id="dof" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation="1.1"/></filter>
  `);

  const root = el('g', { id: 'menuRoot' }, svg);
  const L = {};
  ['wall', 'window', 'spider', 'winFront', 'props', 'bench', 'villain', 'title', 'sign', 'lamps', 'cast', 'light', 'fx', 'dark', 'flash'].forEach(n => { L[n] = el('g', {}, root); });
  ['props', 'bench', 'winFront'].forEach(n => L[n].setAttribute('filter', 'url(#inkOnly)'));
  L.sign.setAttribute('filter', 'url(#inkProps)');
  /* light, effects and the blackout sit over the cast but must never swallow clicks */
  ['light', 'fx', 'dark', 'flash', 'lamps', 'title'].forEach(n => L[n].setAttribute('pointer-events', 'none'));

  /* ---------- the room ---------- */
  el('rect', { x: 0, y: 0, width: 1280, height: 480, fill: 'url(#gWallB)' }, L.wall);
  const boards = [];
  for (let x = 0; x < 1280; x += 58) boards.push(`M${x},30 V480`);
  el('path', { d: boards.join(' '), stroke: '#2a180e', 'stroke-width': 2.5, opacity: 0.35 }, L.wall);
  for (let i = 0; i < 14; i++) el('ellipse', { cx: rand(20, 1260), cy: rand(60, 460), rx: rand(3, 6), ry: rand(6, 11), fill: 'none', stroke: '#2a180e', 'stroke-width': 1.5, opacity: 0.3 }, L.wall);
  const LAMPX = [300, 930];
  const pools = LAMPX.map(x => el('ellipse', { cx: x, cy: 100, rx: 330, ry: 420, fill: 'url(#gLampPool)', 'data-nobake': 1 }, L.wall));
  el('rect', { x: 0, y: 0, width: 1280, height: 30, fill: '#2e1c10' }, L.wall);
  el('path', { d: 'M0,30 H1280', stroke: INK, 'stroke-width': 4 }, L.wall);
  for (let x = 40; x < 1280; x += 160) el('rect', { x, y: 0, width: 26, height: 42, fill: '#3a2414', stroke: INK, 'stroke-width': 3 }, L.wall);

  /* window with the night outside */
  el('rect', { x: 70, y: 80, width: 220, height: 220, rx: 4, fill: '#5a3a22', stroke: BR, 'stroke-width': 5 }, L.window);
  el('rect', { x: 84, y: 94, width: 192, height: 192, fill: 'url(#gNight)' }, L.window);
  el('circle', { cx: 232, cy: 138, r: 46, fill: '#f6ecc8', opacity: 0.12 }, L.window);
  el('circle', { cx: 232, cy: 138, r: 25, fill: '#f6ecc8', stroke: '#c9bb90', 'stroke-width': 2 }, L.window);
  el('circle', { cx: 224, cy: 132, r: 5, fill: '#ddd0a8' }, L.window);
  el('path', { d: 'M84,250 C120,236 150,244 170,226 C186,212 200,214 214,200 M150,240 C160,262 150,276 162,286 M84,220 C100,222 112,230 124,242', fill: 'none', stroke: '#0e0f22', 'stroke-width': 7, 'stroke-linecap': 'round' }, L.window);
  for (let i = 0; i < 9; i++) el('circle', { cx: rand(90, 270), cy: rand(100, 200), r: rand(0.8, 1.8), fill: '#fff8d8', opacity: rand(0.4, 0.9) }, L.window);
  const spider = new T.WireSpider(el('g', { 'clip-path': 'url(#winClip)' }, L.spider));
  el('path', { d: 'M180,94 V286 M84,190 H276', stroke: '#5a3a22', 'stroke-width': 9 }, L.winFront);
  el('path', { d: 'M180,94 V286 M84,190 H276', stroke: BR, 'stroke-width': 2, opacity: 0.6 }, L.winFront);
  el('rect', { x: 58, y: 296, width: 244, height: 16, rx: 3, fill: '#6a4428', stroke: BR, 'stroke-width': 4 }, L.winFront);

  /* shelf: radio, jar of wire nuts, can of screwdrivers */
  el('rect', { x: 40, y: 384, width: 300, height: 11, rx: 2, fill: '#7a4e2c', stroke: BR, 'stroke-width': 3.5 }, L.props);
  el('path', { d: 'M70,395 v22 h14 M300,395 v22 h-14', fill: 'none', stroke: BR, 'stroke-width': 4 }, L.props);
  const radio = el('g', {}, L.props);
  el('path', { d: 'M86,384 V338 Q86,296 132,296 Q178,296 178,338 V384 Z', fill: '#7a4424', stroke: BR, 'stroke-width': 4 }, radio);
  const cloth = el('path', { d: 'M100,368 V340 Q100,312 132,312 Q164,312 164,340 V368 Z', fill: '#d0ab70', stroke: BR, 'stroke-width': 2.5 }, radio);
  el('path', { d: 'M114,368 V330 M132,368 V318 M150,368 V330', stroke: '#6a3a1c', 'stroke-width': 5 }, radio);
  const dial = el('circle', { cx: 132, cy: 376, r: 5, fill: '#ffd47a', stroke: BR, 'stroke-width': 2 }, radio);
  el('path', { d: 'M212,384 V346 Q212,340 218,340 H246 Q252,340 252,346 V384 Z', fill: '#cfe3e0', opacity: 0.55, stroke: BR, 'stroke-width': 3 }, L.props);
  for (let i = 0; i < 9; i++) el('path', { d: `M${218 + (i % 3) * 10},${378 - Math.floor(i / 3) * 10} l5,-9 l5,9 Z`, fill: pick(['#f28c1c', '#f2d21c', '#d8342a']), stroke: BR, 'stroke-width': 1.2 }, L.props);
  el('rect', { x: 210, y: 334, width: 44, height: 8, rx: 2, fill: '#a0998a', stroke: BR, 'stroke-width': 2.5 }, L.props);
  el('rect', { x: 270, y: 350, width: 36, height: 34, fill: '#b5402f', stroke: BR, 'stroke-width': 3 }, L.props);
  el('path', { d: 'M280,350 L276,318 M290,350 L292,312 M298,350 L304,322', stroke: '#8b8b8b', 'stroke-width': 3 }, L.props);
  for (const [x, y, c] of [[276, 318, '#e0a030'], [292, 312, '#c7322b'], [304, 322, '#2a2a2c']]) el('rect', { x: x - 5, y: y - 16, width: 10, height: 18, rx: 4, fill: c, stroke: BR, 'stroke-width': 2 }, L.props);

  /* the practice sheet pinned to the wall */
  const sheet = el('g', { transform: 'translate(-34,-42) rotate(-3 410 300)' }, L.props);
  el('rect', { x: 352, y: 246, width: 118, height: 124, fill: '#efe4c4', stroke: BR, 'stroke-width': 2.5 }, sheet);
  el('path', { d: 'M366,290 H390 M396,284 L410,276 M410,290 H426 L440,290 M432,300 H456 V330 H366 V290 M444,318 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0', fill: 'none', stroke: '#4a3a2a', 'stroke-width': 2 }, sheet);
  el('text', { x: 362, y: 266, 'font-family': 'Special Elite, monospace', 'font-size': 10.5, fill: '#4a3a2a' }, sheet).textContent = 'PRACTICE BOARD #1';
  el('text', { x: 362, y: 356, 'font-family': 'Special Elite, monospace', 'font-size': 9, fill: '#8a2a1a' }, sheet).textContent = 'switch the HOT!';
  el('circle', { cx: 411, cy: 252, r: 5, fill: '#d8342a', stroke: BR, 'stroke-width': 2 }, sheet);

  /* pegboard with tools */
  const peg = el('g', {}, L.props);
  el('rect', { x: 880, y: 70, width: 360, height: 372, rx: 4, fill: 'url(#gPeg)', stroke: BR, 'stroke-width': 4 }, peg);
  el('rect', { x: 880, y: 70, width: 360, height: 372, fill: 'url(#pegHoles)', opacity: 0.8 }, peg);
  const tool = { stroke: BR, 'stroke-width': 3, 'stroke-linejoin': 'round' };
  const pl = el('g', { transform: 'translate(1010,110) rotate(12)' }, peg);
  el('path', Object.assign({ d: 'M-8,0 L-14,-40 Q-6,-48 0,-40 L2,0 Z M8,0 L14,-40 Q6,-48 0,-40 L-2,0 Z', fill: '#8c8f94' }, tool), pl);
  el('path', Object.assign({ d: 'M-8,0 C-14,30 -20,70 -24,100 Q-18,106 -12,100 C-8,70 -4,30 -2,4 Z M8,0 C14,30 20,70 24,100 Q18,106 12,100 C8,70 4,30 2,4 Z', fill: '#c7322b' }, tool), pl);
  el('circle', Object.assign({ cx: 0, cy: 0, r: 6, fill: '#b9b4aa' }, tool), pl);
  [[1060, '#e0a030'], [1090, '#c7322b'], [1120, '#2a2a2c']].forEach(([x, c], i) => {
    el('path', { d: `M${x},98 V${170 + i * 8}`, stroke: '#9a9a9a', 'stroke-width': 5, 'stroke-linecap': 'round' }, peg);
    el('rect', Object.assign({ x: x - 9, y: 76, width: 18, height: 34, rx: 8, fill: c }, tool), peg);
  });
  const spool = (cx, cy, r, c) => {
    el('circle', Object.assign({ cx, cy, r, fill: c }, tool), peg);
    for (let k = r - 7; k > 10; k -= 6) el('circle', { cx, cy, r: k, fill: 'none', stroke: '#000', 'stroke-width': 1.6, opacity: 0.25 }, peg);
    el('circle', Object.assign({ cx, cy, r: 10, fill: '#6a4428' }, tool), peg);
  };
  spool(1190, 150, 44, '#c7322b'); spool(1130, 250, 32, '#f1ead8'); spool(1200, 258, 34, '#2a2a2c');
  el('path', Object.assign({ d: 'M964,292 L1046,276 L1048,288 L966,304 Z', fill: '#a8753f' }, tool), peg);
  el('path', Object.assign({ d: 'M1040,258 L1064,254 L1070,302 L1046,306 Z', fill: '#7d8187' }, tool), peg);
  el('rect', Object.assign({ x: 1010, y: 318, width: 190, height: 38, rx: 6, fill: '#b8322a' }, tool), peg);
  el('rect', { x: 1016, y: 324, width: 178, height: 26, rx: 4, fill: 'none', stroke: '#f3e2b8', 'stroke-width': 2 }, peg);
  el('text', { x: 1105, y: 342, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 12, textLength: 160, lengthAdjust: 'spacingAndGlyphs', fill: '#f3e2b8' }, peg).textContent = 'ALWAYS KILL THE POWER';

  /* where the villain came from: a hole punched through the plaster, with the
     outlet cover it used to live behind hanging off by one screw */
  const HOLE = { x: 790, y: 432 };
  el('path', { d: 'M752,408 L770,396 L786,404 L806,392 L822,410 L834,428 L826,450 L808,462 L786,456 L764,462 L748,446 L744,426 Z', fill: 'url(#gHole)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.props);
  el('path', { d: 'M760,420 L776,414 M796,412 L814,420 M770,444 L790,448', stroke: '#6a4a36', 'stroke-width': 3, opacity: 0.7 }, L.props);
  el('path', { d: 'M752,408 L730,394 L716,398 M834,428 L858,418 L872,424 M806,392 L812,372 L826,366 M764,462 L752,470', fill: 'none', stroke: '#2a180e', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, L.props);
  for (const [cx, cy, r] of [[742, 474, 5], [760, 478, 3.5], [838, 474, 4], [852, 478, 2.5]]) el('path', { d: `M${cx - r},${cy} L${cx},${cy - r} L${cx + r * 1.2},${cy - r * 0.2} L${cx + r * 0.6},${cy + r * 0.5} Z`, fill: '#c9b28c', stroke: BR, 'stroke-width': 1.6 }, L.props);
  const plate = el('g', { transform: 'translate(718,436) rotate(-24)' }, L.props);
  el('rect', { x: -14, y: 0, width: 28, height: 42, rx: 5, fill: '#e9dcc0', stroke: INK, 'stroke-width': 3 }, plate);
  el('path', { d: 'M-5,12 v6 M5,12 v8 M-5,28 v6 M5,28 v8', stroke: INK, 'stroke-width': 2.4 }, plate);
  el('circle', { cx: 0, cy: 3, r: 2.4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1 }, plate);
  /* the whole back wall is painted on watercolour paper (GPU quality only) */
  const G = window.GFX;
  const wallPaper = G ? G.paper(root, 0, 0, 1280, 480, { before: L.bench }) : null;

  /* hanging shop lamps */
  const lamps = LAMPX.map((x, i) => {
    const g = el('g', {}, L.lamps);
    const coneG = el('g', { style: 'mix-blend-mode:screen', opacity: 0.8 }, L.light);
    const cone = el('path', { d: 'M-34,26 L-190,440 L190,440 L34,26 Z', fill: 'url(#gCone)' }, coneG);
    el('path', { d: 'M0,-60 V-4', stroke: INK, 'stroke-width': 3 }, g);
    el('path', { d: 'M-12,-4 H12 V6 H-12 Z', fill: '#3a3a3a', stroke: INK, 'stroke-width': 3 }, g);
    el('path', { d: 'M-12,6 Q-42,12 -46,30 H46 Q42,12 12,6 Z', fill: 'url(#gShade)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M-30,16 Q-20,10 -8,9', fill: 'none', stroke: '#bfe8d2', 'stroke-width': 3, opacity: 0.8, 'stroke-linecap': 'round' }, g);
    const bulbE = el('ellipse', { cx: 0, cy: 32, rx: 13, ry: 9, fill: '#fff4c8', stroke: INK, 'stroke-width': 2.5 }, g);
    return { g, coneG, cone, bulbE, x, th: rand(-0.05, 0.05), w: 0, phase: i * 2 };
  });

  /* ---------- title and sign ---------- */
  const title = el('g', {}, L.title);
  const titleText = (txt, y, size, fill) => {
    const base = { x: 640, y, 'text-anchor': 'middle', 'font-family': 'Rye, "Playfair Display", Georgia, serif', 'font-size': size, 'letter-spacing': 2 };
    el('text', Object.assign({}, base, { fill: INK, transform: 'translate(5,6)' }), title).textContent = txt;
    const t = el('text', Object.assign({}, base, { fill, stroke: INK, 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }), title);
    t.textContent = txt;
    return t;
  };
  titleText('CIRCUIT', 96, 66, 'url(#gTitleCream)');
  titleText('PANIC!', 170, 90, '#5c1a15');
  const panicOn = el('text', { x: 640, y: 170, 'text-anchor': 'middle', 'font-family': 'Rye, "Playfair Display", Georgia, serif', 'font-size': 90, 'letter-spacing': 2, fill: 'url(#gTitleRed)', stroke: INK, 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, title);
  panicOn.textContent = 'PANIC!';
  const bolt = (x, y, s, flip) => el('path', { d: 'M0,-40 L-18,4 L-2,4 L-12,40 L20,-10 L4,-10 L14,-40 Z', transform: `translate(${x},${y}) scale(${flip ? -s : s},${s})`, fill: '#ffd84a', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, title);
  const bolts = [bolt(462, 138, 0.8, false), bolt(818, 138, 0.8, true)];
  el('path', { d: 'M476,184 H516 V210 H476 L488,197 Z M804,184 H764 V210 H804 L792,197 Z', fill: '#c9a770', stroke: INK, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, title);
  el('path', { d: 'M504,180 H776 V206 H504 Z', fill: '#f0dfb0', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, title);
  el('text', { x: 640, y: 198, 'text-anchor': 'middle', 'font-family': '"Special Elite", "Courier New", monospace', 'font-size': 13, textLength: 250, lengthAdjust: 'spacingAndGlyphs', fill: INK }, title).textContent = 'A NERVOUS LITTLE WIRING PICTURE';

  const SG = { x: 510, y: 226, w: 260, h: 146 };
  el('path', { d: `M560,${SG.y} L640,214 L720,${SG.y}`, fill: 'none', stroke: '#2a2a2a', 'stroke-width': 2.5 }, L.sign);
  el('circle', { cx: 640, cy: 214, r: 4, fill: '#9a9a9a', stroke: INK, 'stroke-width': 2 }, L.sign);
  el('rect', { x: SG.x, y: SG.y, width: SG.w, height: SG.h, rx: 12, fill: 'url(#gEnamel)', stroke: INK, 'stroke-width': 5 }, L.sign);
  el('rect', { x: SG.x + 14, y: SG.y + 14, width: SG.w - 28, height: SG.h - 28, rx: 6, fill: 'none', stroke: '#e9dcb8', 'stroke-width': 2.5 }, L.sign);
  const chase = [];
  const addLight = (x, y) => {
    const glow = el('circle', { cx: x, cy: y, r: 9, fill: 'url(#gGlow)', opacity: 0 }, L.sign);
    const b = el('circle', { cx: x, cy: y, r: 3.8, fill: '#6b4a22', stroke: INK, 'stroke-width': 1.6 }, L.sign);
    chase.push({ b, glow, on: null });
  };
  for (let x = SG.x + 20; x <= SG.x + SG.w - 20; x += 20) addLight(x, SG.y + 7);
  for (let y = SG.y + 26; y <= SG.y + SG.h - 22; y += 20) addLight(SG.x + SG.w - 7, y);
  for (let x = SG.x + SG.w - 20; x >= SG.x + 20; x -= 20) addLight(x, SG.y + SG.h - 7);
  for (let y = SG.y + SG.h - 26; y >= SG.y + 22; y -= 20) addLight(SG.x + 7, y);

  /* ---------- the workbench ---------- */
  el('path', { d: 'M20,470 H1260 L1280,562 H0 Z', fill: 'url(#gBenchTop)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.bench);
  const grain = [];
  for (let i = 0; i < 9; i++) { const y = 480 + i * 9.5; grain.push(`M${R(rand(10, 200))},${y} C${R(rand(300, 500))},${R(y + rand(-3, 3))} ${R(rand(700, 900))},${R(y + rand(-3, 3))} ${R(rand(1080, 1270))},${y}`); }
  el('path', { d: grain.join(' '), fill: 'none', stroke: '#6a3f1f', 'stroke-width': 1.6, opacity: 0.4 }, L.bench);
  el('rect', { x: -5, y: 562, width: 1290, height: 30, fill: '#7a4a26', stroke: INK, 'stroke-width': 4 }, L.bench);
  el('path', { d: 'M0,568 H1280', stroke: '#c79566', 'stroke-width': 3, opacity: 0.6 }, L.bench);
  el('rect', { x: -5, y: 592, width: 1290, height: 140, fill: 'url(#gBenchFront)', stroke: INK, 'stroke-width': 4 }, L.bench);
  for (const [x0, x1] of [[60, 390], [470, 810], [890, 1220]]) {
    el('rect', { x: x0, y: 610, width: x1 - x0, height: 80, rx: 4, fill: '#5e371d', stroke: '#24130a', 'stroke-width': 4 }, L.bench);
    el('path', { d: `M${x0 + 8},618 H${x1 - 8}`, stroke: '#8a5a34', 'stroke-width': 2.5, opacity: 0.6 }, L.bench);
    el('rect', { x: (x0 + x1) / 2 - 26, y: 642, width: 52, height: 12, rx: 6, fill: 'url(#gBrass)', stroke: INK, 'stroke-width': 3 }, L.bench);
  }
  if (G) G.paper(root, 0, 468, 1280, 252, { flip: true, opacity: 0.85, before: L.villain });
  /* small props live at the front edge of the bench, clear of the back lane the
     fuse and switch walk along */
  const PROPS = [];
  const prop = (g, x, y, r) => { PROPS.push({ g, x, y, r, wob: -9 }); return g; };
  const nut = (x, y, c) => prop(el('path', { d: `M${x - 8},${y} Q${x},${y + 4} ${x + 8},${y} L${x + 3},${y - 14} Q${x},${y - 16} ${x - 3},${y - 14} Z`, fill: c, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, L.bench), x, y - 7, 9);
  nut(600, 556, '#f28c1c'); nut(626, 550, '#f2d21c'); nut(752, 558, '#d8342a'); nut(1082, 556, '#f28c1c');
  const grommet = el('g', {}, L.bench);
  el('ellipse', { cx: 690, cy: 553, rx: 22, ry: 9, fill: '#1f1f22', stroke: INK, 'stroke-width': 3 }, grommet);
  el('ellipse', { cx: 690, cy: 551, rx: 9, ry: 4, fill: '#8e5f37' }, grommet);
  prop(grommet, 690, 551, 20);
  const driver = el('g', {}, L.bench);
  el('path', { d: 'M206,560 L252,555', stroke: '#9a9a9a', 'stroke-width': 4, 'stroke-linecap': 'round' }, driver);
  el('rect', { x: 248, y: 548, width: 34, height: 13, rx: 6, fill: '#d0983a', stroke: INK, 'stroke-width': 2.5, transform: 'rotate(-5 265 554)' }, driver);
  prop(driver, 244, 556, 12);

  const flash = el('rect', { x: 0, y: 0, width: 1280, height: 720, fill: '#fff4c8', opacity: 0, 'pointer-events': 'none' }, L.flash);

  /* ---------- cast ---------- */
  /* (lamps and dark tell the rig where the rim light comes from, and when it's out) */
  const scene = { defs: App.defs, layer: L.cast, get boil() { return App.boil; }, lamps: LAMPX, get dark() { return now > ev.black0 && now < ev.black1; } };
  const villainScene = { defs: App.defs, layer: L.villain, get boil() { return App.boil; }, lamps: LAMPX, get dark() { return now > ev.black0 && now < ev.black1; } };
  /* the two walkers are built first so the front row is drawn over them: they use
     the back lane of the bench, further from the camera */
  const LANE = 490;
  const fuse = T.makeFuse(scene, -300, LANE, 0.5);
  const sw = T.makeSwitch(scene, -400, LANE, 0.46);
  const bulb = T.makeBulb(scene, 150, 552, 0.66);
  const outlet = T.makeOutlet(scene, 330, 540, 0.58);
  const meter = T.makeMeter(scene, 985, 532, 0.56);
  const board = T.makeBoard(scene, 1176, 520, 0.5, { book: true });
  const wire = T.makeEvilWire(villainScene, HOLE.x, HOLE.y, 0.82);
  const cast = [bulb, fuse, meter, sw, outlet, board, wire];
  ['bulb', 'fuse', 'meter', 'switch', 'outlet', 'board', 'wire'].forEach((n, i) => { cast[i].name = n; });
  for (const c of cast) c.lane = 'front';
  fuse.lane = sw.lane = 'back'; wire.lane = 'any';
  for (const c of [fuse, sw]) { c.root.style.display = 'none'; c.shown = false; }
  bulb.root.id = 'bulbToon';
  /* nobody moves in lockstep: each part has its own rhythm and nervous habit */
  Object.assign(bulb.cfg.life, { breath: 3.6, bounce: 3, beatMul: 0.5, beatOffset: 0.3, sway: 2, lean: 3.2, nervous: 0.42 });   /* trembly, droopy */
  Object.assign(outlet.cfg.life, { breath: 2.1, bounce: 4, beatMul: 1.5, beatOffset: 0.15, sway: 5, lean: 2.6, nervous: 0.3 }); /* fidgety */
  Object.assign(meter.cfg.life, { breath: 4.4, bounce: 1.5, beatMul: 1, beatOffset: 0.55, sway: 0.8, lean: 0.5, nervous: 0.08 }); /* steady, stiff */
  Object.assign(board.cfg.life, { breath: 5.5, bounce: 1, beatMul: 0.25, beatOffset: 0.8, sway: 1.4, lean: 0.8, nervous: 0.04 }); /* slow, sighing reader */
  Object.assign(fuse.cfg.life, { breath: 1.4, bounce: 0, sway: 1.5, lean: 1.5, nervous: 0.65 });                                 /* jittery */
  Object.assign(sw.cfg.life, { breath: 2.4, bounce: 0, sway: 2, lean: 2, nervous: 0.3 });
  Object.assign(wire.cfg.life, { breath: 3.4, bounce: 0, sway: 6, lean: 5, nervous: 0.02 });                                     /* slow, predatory */
  const particles = new Particles(L.fx);

  /* light that belongs to the room */
  const benchPools = lamps.map(l => el('ellipse', { cx: l.x, cy: 522, rx: 240, ry: 48, fill: 'url(#gBenchPool)', style: 'mix-blend-mode:screen' }, L.light));
  const bulbLight = el('ellipse', { rx: 250, ry: 190, fill: 'url(#gGlow)', opacity: 0, style: 'mix-blend-mode:screen' }, L.light);

  /* blackout: the room goes black and only eyes are left (the villain's glow
     yellow). The panicking bulb is the one thing still lit. */
  const darkRect = el('rect', { x: 0, y: 0, width: 1280, height: 720, fill: '#050308', opacity: 0 }, L.dark);
  const darkBulb = el('ellipse', { rx: 190, ry: 170, fill: 'url(#gGlow)', opacity: 0, style: 'mix-blend-mode:screen' }, L.dark);
  const bulbLit = el('use', { href: '#bulbToon', opacity: 0 }, L.dark);
  const darkEyes = cast.map(c => {
    const g = el('g', { opacity: 0 }, L.dark);
    const evil = c === wire;
    /* the phantom has no eye whites: only two pinpricks burning in the dark */
    const e = [0, 1].map(() => ({ w: el('ellipse', evil ? { fill: '#fff2a0', opacity: 0.25, filter: 'url(#softBlur)' } : { fill: '#f4ecd8' }, g), p: el('ellipse', { fill: evil ? '#fff8d8' : '#0a0606' }, g) }));
    return { c, g, e };
  });
  const stars = [0, 1, 2].map(() => el('path', { d: 'M0,-9 L2.6,-2.6 L9,0 L2.6,2.6 L0,9 L-2.6,2.6 L-9,0 L-2.6,-2.6 Z', fill: '#ffe45a', stroke: INK, 'stroke-width': 2, opacity: 0 }, L.fx));

  /* ---------- performances ---------- */
  const K = {
    flinch: s => ({ d: 1.2, k: [[0.06, { sy: 0.9, sx: 1.06, lid: 0.5, hipY: 4 }], [0.2, { sy: 1.05, pupil: 0.55, browRaise: 1, lookX: s, turn: 0.3 * s }], [0.75, { lookX: s }]] }),
    bumped: s => ({ d: 1.1, k: [[0.04, { hipX: -14 * s, hipY: -10, lean: -8 * s, sy: 0.86, sx: 1.15, lid: 0.55, mouth: 'gasp', mouthOpen: 0.7, pop: 1, browRaise: 1.1 }], [0.2, { hipY: 0, sy: 1.06, sx: 0.96, lean: 6 * s }], [0.36, { lean: -5 * s, pop: 0 }], [0.52, { lean: 3 * s, hipX: -7 * s, lid: 0.1, lookX: s }], [0.75, { lean: 0, hipX: -4 * s, sy: 1, mouth: 'grit', mouthOpen: 0.3 }]] }),
    /* the big one: something jabbed you */
    jolt: s => ({ d: 1.9, k: [
      [0.03, { hipX: -10 * s, hipY: -46, sy: 1.3, sx: 0.84, lean: -10 * s, lhx: -46, lhy: -70, rhx: 46, rhy: -74, lg: 'palm', rg: 'palm', lroll: 0.4, rroll: -0.4, mouth: 'gasp', mouthOpen: 1.1, pupil: 0.32, browRaise: 1.5, lid: 0, pop: 1.2, sweat: 1, glow: 1.2, alarm: 1, heat: 1, turn: 0.35 * s, lookX: s, screen: '!!!' }],
      [0.2, { hipY: 8, sy: 0.82, sx: 1.18, lean: 4 * s, pop: 0.6 }],
      [0.32, { hipY: -6, sy: 1.08, sx: 0.95, lean: -3 * s }],
      [0.46, { hipY: 0, sy: 1, sx: 1, lean: 0, lhx: -26, lhy: 20, rhx: 26, rhy: 20, lg: 'fist', rg: 'fist', mouth: 'grit', mouthOpen: 0.6, shake: 1.8, glow: 0.3, pop: 0, screen: '120V' }],
      [0.85, { shake: 0.8, lid: 0.2, mouth: 'worry', alarm: 0, heat: 0, turn: 0 }]], cues: [[0.03, () => A.sfx.boing()]] }),
    gulp: () => ({ d: 1.1, k: [[0.15, { sy: 0.9, sx: 1.08, mouth: 'flat', mouthOpen: 0, lid: 0.42 }], [0.38, { sy: 1.07, sx: 0.95, faceY: -5, lid: 0.08, pupil: 0.6 }], [0.6, { sy: 1, faceY: 0 }]], cues: [[0.3, () => A.sfx.gulp()]] }),
    footShift: () => ({ d: 1.6, k: [[0.2, { lfy: 12, lfx: -8, hipX: -5, lean: -2 }], [0.4, { lfy: 0 }], [0.58, { rfy: 10, rfx: 7, hipX: 4, lean: 2 }], [0.8, { rfy: 0 }]] }),
    /* nervous hands: both gloves slowly turn over and back, like someone fretting */
    fidget: () => ({ d: 2.4, k: [[0.15, { lroll: 1.2, rroll: -1.2, lhx: -16, rhx: 16, lhy: 40, rhy: 40, lg: 'back', rg: 'back', mouth: 'worry', lookY: 0.4 }], [0.4, { lroll: 2.9, rroll: -2.9 }], [0.62, { lroll: 0.6, rroll: -0.6 }], [0.82, { lroll: 2.4, rroll: -2.4 }], [0.95, { lroll: 0, rroll: 0 }]] }),
    checkFilament: () => ({ d: 3.2, k: [
      [0.12, { lookY: 1, lookX: 0.15, lean: 5, browTilt: 1, rhx: 30, rhy: -30, rg: 'point', mouth: 'flat' }], [0.3, { glow: 0.2, pupil: 0.7 }],
      [0.38, { glow: 0.9, pupil: 0.42, mouth: 'gasp', mouthOpen: 0.7, shake: 1.1, stretch: 0.5, sy: 1.08, browRaise: 1.2, pop: 0.8 }], [0.5, { glow: 0.45, pop: 0 }], [0.58, { glow: 0.85 }],
      [0.7, { glow: 0.12, stretch: 0, sy: 0.93, mouth: 'worry', lid: 0.5, shake: 0.2, rhx: 22, rhy: 50, rg: 'fist', lookY: 0.2 }], [0.9, { lid: 0.2, sy: 1 }]], cues: [[0.38, () => A.sfx.fizzle()]] }),
    coverEyes: () => ({ d: 2.6, k: [
      [0.1, { lhx: 7, lhy: -70, rhx: -7, rhy: -70, lg: 'palm', rg: 'palm', lbend: 0.35, rbend: 0.35, lid: 0.9, mouth: 'grit', mouthOpen: 0.4, shake: 1, sy: 0.94, knee: -0.4, glow: 0.4, sweat: 1 }],
      [0.4, { rhy: -44, lid: 0.2, pupil: 0.45, lookX: -0.6, lookY: -0.4 }], [0.55, { rhy: -70, lid: 0.9 }], [0.72, { rhy: -46, lid: 0.3 }], [0.85, { rhy: -70 }]] }),
    panicGlow: () => ({ d: 2.6, k: [[0.05, { glow: 1.3, pop: 1, sweat: 1, lhx: -66, lhy: -70, rhx: 66, rhy: -76, lg: 'palm', rg: 'palm', mouth: 'gasp', mouthOpen: 1.1, pupil: 0.4, browRaise: 1.4, shake: 2, stretch: 0.8 }],
      [0.18, { glow: 0.1 }], [0.28, { glow: 1.2, pop: 0 }], [0.42, { glow: 0.15 }], [0.56, { glow: 1.1 }], [0.72, { glow: 0.3, stretch: 0 }], [0.9, { lhx: -22, lhy: 50, rhx: 22, rhy: 50 }]] }),
    handsFace: () => ({ d: 2.4, k: [[0.12, { rhx: -6, rhy: -20, rbend: 0.35, rg: 'palm', mouth: 'O', mouthOpen: 1, pupil: 0.48, browRaise: 1.2, sy: 1.1, sx: 0.93, lid: 0, knee: -0.4, pop: 1, sweat: 1, shake: 1.4 }], [0.4, { pop: 0 }], [0.85, { shake: 1.2 }]] }),
    /* the outlet can't watch: palms over its own eyes, peeking between them */
    outletPeek: () => ({ d: 2.8, k: [[0.08, { lhx: 30, lhy: -52, rhx: -30, rhy: -54, lbend: 0.45, rbend: 0.45, lg: 'palm', rg: 'palm', lid: 0.9, mouth: 'grit', mouthOpen: 0.4, sy: 0.94, shake: 1.2 }], [0.4, { rhy: -24, rroll: 0.8, lid: 0.1, pupil: 0.4, lookX: 1 }], [0.6, { rhy: -54, rroll: 0, lid: 0.9 }], [0.9, { lhy: 50, rhy: 50, lhx: -36, rhx: 36, lid: 0.2 }]] }),
    /* a friendly wave: the hand turns over and back as it waves */
    wave: (s, dur = 2.4) => ({ d: dur, k: [[0.1, { [s > 0 ? 'rhx' : 'lhx']: 30 * s, [s > 0 ? 'rhy' : 'lhy']: -104, [s > 0 ? 'rg' : 'lg']: 'back', mouth: 'smile', mouthOpen: 0.12, lowLid: 0.3, lookX: s, turn: 0.4 * s, browRaise: 0.9 }],
      [0.25, { [s > 0 ? 'rroll' : 'lroll']: 2.6, [s > 0 ? 'rhx' : 'lhx']: 40 * s }], [0.4, { [s > 0 ? 'rroll' : 'lroll']: 0.3, [s > 0 ? 'rhx' : 'lhx']: 24 * s }], [0.55, { [s > 0 ? 'rroll' : 'lroll']: 2.6, [s > 0 ? 'rhx' : 'lhx']: 40 * s }], [0.7, { [s > 0 ? 'rroll' : 'lroll']: 0 }],
      [0.85, { [s > 0 ? 'rhx' : 'lhx']: 36 * s, [s > 0 ? 'rhy' : 'lhy']: 50, turn: 0 }]], cues: [[0.2, () => A.sfx.squeak()]] }),
    /* the switch waves back, flicking its lever in greeting */
    waveBack: s => ({ d: 1.8, k: [[0.12, { [s > 0 ? 'rhx' : 'lhx']: 26 * s, [s > 0 ? 'rhy' : 'lhy']: -96, [s > 0 ? 'rg' : 'lg']: 'palm', lever: -1, lookX: s }], [0.3, { [s > 0 ? 'rroll' : 'lroll']: -2.2, lever: 1 }], [0.5, { [s > 0 ? 'rroll' : 'lroll']: 0, lever: -1 }], [0.7, { lever: 1 }]], cues: [[0.3, () => A.sfx.click()], [0.5, () => A.sfx.click()]] }),
    /* a shy wave on the move with the near hand, turning over as it waves */
    walkWave: () => ({ d: 1.9, k: [[0.12, { lhx: 16, lhy: -86, lg: 'back', lLayer: 'front', mouth: 'smile', mouthOpen: 0.15, browRaise: 0.7, lid: 0.15, pupil: 0.8 }],
      [0.26, { lroll: 2.7, lhx: 24 }], [0.42, { lroll: 0.2, lhx: 12 }], [0.58, { lroll: 2.7, lhx: 24 }], [0.74, { lroll: 0 }], [0.92, { mouth: 'worry' }]], cues: [[0.2, () => A.sfx.squeak()]] }),
    probeUp: () => ({ d: 2.4, k: [[0.1, { lhx: -40, lhy: -80, rhx: 40, rhy: -80, lg: 'fist', rg: 'fist', screen: '!!!', mouth: 'gasp', mouthOpen: 1, pupil: 0.45, dial: 3, sy: 1.1, lfy: 18, rfy: 18, hipY: -24, pop: 1 }], [0.35, { hipY: 6, sy: 0.9, lfy: 0, rfy: 0, pop: 0 }], [0.5, { screen: ' OL ', hipY: 0, sy: 1 }], [0.85, { screen: ' OL ' }]], cues: [[0.1, () => A.sfx.beep()], [0.5, () => A.sfx.beep()]] }),
    bookUp: () => ({ d: 2.6, k: [[0.08, { book: -1.25, shake: 1.8, lid: 0.9, alarm: 1, sy: 0.94 }], [0.85, { book: -1.25, alarm: 1 }]], cues: [[0.08, () => A.sfx.clack()]] }),
    pageFlip: () => ({ d: 1.4, k: [[0.2, { book: 0.18, lookY: 0.9 }], [0.4, { book: 0 }], [0.6, { lookY: 0.7 }]], cues: [[0.25, () => A.sfx.tick()]] }),
    peekOver: () => ({ d: 3, k: [[0.15, { book: 0.55, lookX: -1, lookY: -0.1, lid: 0, pupil: 0.55, browRaise: 0.9, mouth: 'grit', mouthOpen: 0.3 }], [0.6, { book: 0.55, lookX: -1 }], [0.72, { book: -0.3, lid: 0.3 }], [0.95, { book: 0 }]], cues: [[0.7, () => A.sfx.gulp()]] }),
    probeTap: () => ({ d: 2, k: [[0.1, { rhy: 40, lookY: 0.8, lookX: 0.4 }], [0.2, { rhy: 30 }], [0.3, { rhy: 42 }], [0.4, { rhy: 30 }], [0.5, { rhy: 42 }]], cues: [[0.3, () => A.sfx.tick()], [0.5, () => A.sfx.tick()]] }),
    snarl: () => ({ d: 1.2, k: [[0.1, { hood: 1.05, mouth: 'wiregrin', mouthOpen: 1, frizz: 1.2, lid: 0, pupil: 0.2, browTilt: -1.5, sy: 1.08, lg: 'claw', rg: 'claw' }], [0.7, { hood: 1, frizz: 1 }], [1, { hood: 0.3, frizz: 0 }]], cues: [[0.1, () => A.sfx.fizzle()]] }),
    selected: () => ({ d: 2.3, k: [
      [0.06, { sy: 0.82, sx: 1.14, hipY: 12, mouth: 'flat', lid: 0.5, knee: 0.45 }],
      [0.16, { sy: 1.3, sx: 0.8, hipY: -90, turn: -0.8, lean: -10, lhx: -66, lhy: -92, rhx: 30, rhy: -104, lg: 'palm', rg: 'palm', mouth: 'gasp', mouthOpen: 1.2, pupil: 0.4, browRaise: 1.5, glow: 1.3, stretch: 1, lfy: 78, rfy: 66, lookX: -1, lid: 0, pop: 1 }],
      [0.3, { turn: 0.8, lean: 10, hipY: -100, lfy: 84, rfy: 72, lhx: -30, lhy: -102, rhx: 66, rhy: -90, lg: 'edge', rg: 'back', lookX: 1, pop: 0 }],
      [0.42, { turn: 0, lean: 0, hipY: 14, sy: 0.78, sx: 1.18, lfy: 0, rfy: 0, lhx: -44, lhy: -40, rhx: 44, rhy: -40, lg: 'claw', rg: 'claw', stretch: -0.4 }],
      [0.55, { hipY: -10, sy: 1.08, sx: 0.96, lhx: -22, lhy: -80, rhx: 22, rhy: -80, lg: 'fist', rg: 'fist', mouth: 'grit', mouthOpen: 0.8, shake: 1.5, glow: 1 }],
      [0.8, { hipY: 0, sy: 1, rg: 'point', rhx: 64, rhy: -18, mouth: 'worry', shake: 0.8, glow: 0.4, turn: 0.4, lookX: 1 }]], cues: [[0.42, () => A.sfx.thud()]] }),
  };
  const play = (c, m, slot) => c.play(m.k, m.d, { slot: slot || 'big', cues: m.cues });

  /* ---------- scene time ---------- */
  let now = 0;
  const ev = { bonk: 8, peek: 30, panicOff: 0, flash: -9, black0: -9, black1: -9, rattle: 0, beep: 0 };

  /* ---------- the villain ---------- */
  /* head position (the bottom of the head) in scene coordinates -> rig offsets */
  const wpos = (wx, wy) => [(wx - HOLE.x) / wire.cfg.scale, (wy - HOLE.y) / wire.cfg.scale + wire.cfg.hipH];
  const LURK = [850, 318];
  /* each victim: where he sneaks to (waypoints clear every head and the tools on
     the pegboard), which claw he pokes with and the spot he pokes. Heading left he
     slips in behind the hanging menu sign, peeks one eye round its edge, then drops
     down out of sight line to strike. */
  const PLANS = {
    outlet: { c: outlet, side: -1, path: [[780, 332], [548, 332], [504, 332, 1.2], [470, 478]], back: [[532, 332], [780, 332]], cp: [362, 458] },
    meter: { c: meter, side: 1, path: [[824, 452], [858, 426]], cp: [951, 408] },
  };
  const V = { x: LURK[0], y: LURK[1], st: 'lurk', t0: 0, path: [], spd: 60, plan: null, last: null, nextPoke: 13, hit: false, reachFor: null, look: null, lookUntil: 0, lookP: null, frozen: false };
  const goPath = (pts, spd, st) => { V.path = pts.map(p => p.slice()); V.spd = spd; V.st = st; V.t0 = now; V.hold = 0; };
  const armTo = (tg, side, px, py) => {
    const [sx, sy] = wire.world(side < 0 ? -16 : 16, -92), s = wire.cfg.scale;
    tg[side < 0 ? 'lhx' : 'rhx'] = (px - sx) / s; tg[side < 0 ? 'lhy' : 'rhy'] = (py - sy) / s;
  };
  /* his own wandering attention while he lurks: a slow, lagging stare from part to part */
  const lurkLook = (t, dt) => {
    if (t > V.lookUntil) {
      const out = walkers.filter(w => w.c.shown);
      V.look = out.length && Math.random() < 0.6 ? pick(out).c : pick([outlet, meter, bulb, board, outlet, meter]);
      V.lookUntil = t + rand(1.4, 3.2);
    }
    const p = V.look.facePos(), k = 1 - Math.exp(-dt * 2.2);
    V.lookP = V.lookP ? [V.lookP[0] + (p[0] - V.lookP[0]) * k, V.lookP[1] + (p[1] - V.lookP[1]) * k] : p;
    return V.lookP;
  };
  wire.brain = (t, dt, tg, d) => {
    const P = V.plan, st = V.st;
    /* creeping is step, step, pause... and a dead freeze whenever the mark looks his way */
    /* hidden = most of the skull is behind the sign (so a freeze always shows his face) */
    const fx = wire.world(0, -62)[0];
    const behindSign = fx + 30 > SG.x && fx - 12 < SG.x + SG.w && V.y < SG.y + SG.h - 20;
    V.frozen = st === 'creep' && P && P.c.glancingV && !behindSign;
    let spd = V.spd;
    if (st === 'creep') spd *= V.frozen ? 0 : 0.2 + 0.8 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.25)), 0.6);
    /* waypoints may carry a pause: [x, y, seconds] */
    if (V.path.length && t > (V.hold || 0)) {
      const [px, py, pause] = V.path[0], dx = px - V.x, dy = py - V.y, dist = Math.hypot(dx, dy), step = spd * dt;
      if (dist <= step) { V.x = px; V.y = py; V.path.shift(); if (pause) V.hold = t + pause; } else { V.x += (dx / dist) * step; V.y += (dy / dist) * step; }
    }
    const [hx, hy] = wpos(V.x, V.y);
    tg.hipX += hx; tg.hipY += hy;
    /* he never stands still: a slow ghostly hover and a drifting head tilt */
    tg.hipY += 6 * Math.sin(t * 0.8); tg.hipX += 3 * Math.sin(t * 0.53 + 1); tg.lean += 6 * Math.sin(t * 0.41);
    if (st === 'lurk' || st === 'peer') {
      /* hunched over his hole, long fingers hanging, watching the parts one by one */
      if (st === 'peer') wire.attn = null; else if (!wire.hovered) wire.attn = lurkLook(t, dt);
      if (st === 'peer') { tg.lhx = -30; tg.lhy = 92; tg.rhx = 30; tg.rhy = 92; }
      if (wire.hovered) { d.mouth = 'wiregrin'; tg.mouthOpen = 0.45; tg.hood = 0.9; }
    } else if (st === 'creep' || st === 'windup' || st === 'jab') {
      const s = P.side;
      tg.lean += 8 * s; tg.turn = 0.35 * s; tg.lid = 0.4; tg.pupil = 0.28; tg.browTilt = -1.2; tg.hood = 0.45;
      d.mouth = 'seam'; tg.mouthOpen = 0.05;
      const lead = s < 0 ? 'l' : 'r', rear = s < 0 ? 'r' : 'l';
      if (st === 'creep') {
        wire.attn = null;
        /* sinking low and gliding, in little drifts and pauses; fingers dangling and
           curling one at a time, the pinprick eyes flicking from the mark and back */
        const drift = t * Math.PI * 1.25;
        tg.sy = 0.88; tg.hipY += 22 - 4 * Math.abs(Math.sin(drift)); tg.hipX += 6 * s * Math.sin(drift * 0.5);
        tg.lean += 4 * Math.sin(drift * 0.5);
        tg.lhx = -30; tg.lhy = 80; tg.rhx = 30; tg.rhy = 80; d.lg = 'back'; d.rg = 'back';
        const dart = Math.floor(t * 1.6) % 3;
        tg.lookX = dart === 2 ? -0.7 * s : s; tg.lookY = dart === 1 ? -0.3 : 0.25;
        if (V.frozen) {
          /* caught: he goes still as a ghost, fingers splayed, the pinpricks shrink */
          tg.hipY += 8; tg.sy = 0.84; tg.lid = 0; tg.pupil = 0.2; d.mouth = 'seam'; tg.mouthOpen = 0; tg.browRaise = 0.6; tg.browTilt = 0.3;
          d.lg = 'palm'; d.rg = 'palm'; tg.lookX = s; tg.lookY = 0.1;
        }
      } else if (st === 'windup') {
        wire.attn = P.c.facePos();
        /* anticipation: he draws back, the seam splits into that grin, one long
           finger uncurls beside his skull */
        tg.hipX -= 16 * s; tg.lean -= 12 * s; tg.hood = 0.9; tg.lid = 0; tg.pupil = 0.22; d.mouth = 'wiregrin'; tg.mouthOpen = 0.35; tg.sy = 1.04;
        tg[lead + 'hx'] = 30 * s; tg[lead + 'hy'] = 30; d[lead + 'g'] = 'point';
        tg[rear + 'hx'] = -30 * s; tg[rear + 'hy'] = 88;
      } else {
        wire.attn = P.c.facePos();
        tg.hood = 0.9; tg.lid = 0; d.mouth = 'wiregrin'; tg.mouthOpen = 0.3; tg.lean += 6 * s;
        /* the wrist stops a finger-length short so the fingertip lands on the spot */
        armTo(tg, s, P.cp[0] - s * 46, P.cp[1]);
        tg[lead + 'bend'] = 0.08; d[lead + 'g'] = 'point';
        tg[rear + 'hx'] = -30 * s; tg[rear + 'hy'] = 88;
      }
    } else if (st === 'snicker') {
      /* a bony hand to that seam of a mouth, shoulders shaking: heh heh heh */
      const s = P ? P.side : 1, lead = s < 0 ? 'l' : 'r', rear = s < 0 ? 'r' : 'l';
      tg.sy += 0.05 * Math.sin(t * 30); tg.hipY += 3 * Math.sin(t * 30);
      d.mouth = 'wiregrin'; tg.mouthOpen = 0.7; tg.lowLid = 0.5; tg.lid = 0.3; tg.hood = 1; tg.turn = 0.2 * s;
      tg[lead + 'hx'] = -2 * s; tg[lead + 'hy'] = 58; d[lead + 'g'] = 'claw'; d[lead + 'Layer'] = 'front!';
      tg[rear + 'hx'] = -30 * s; tg[rear + 'hy'] = 90;
      wire.attn = P ? P.c.facePos() : null;
    } else if (st === 'slink') {
      /* gliding home, low and pleased with himself, a look back */
      tg.sy = 0.88; tg.hood = 0.6; d.mouth = 'seam'; tg.mouthOpen = 0.15; tg.lowLid = 0.35;
      tg.lhx = -30; tg.lhy = 86; tg.rhx = 30; tg.rhy = 86; d.lg = 'back'; d.rg = 'back';
      wire.attn = P ? P.c.facePos() : lurkLook(t, dt);
      if (P) tg.turn = -0.3 * P.side;
    } else if (st === 'reach') {
      /* the pair wander into range: long elastic fingers stretch after them but
         never quite get there */
      const f = V.reachFor;
      tg.hood = 0.8; tg.lid = 0.05; tg.pupil = 0.24; d.mouth = 'wiregrin'; tg.mouthOpen = 0.4 + 0.15 * Math.sin(t * 6); tg.frizz = 0.4;
      if (f) {
        const [fx, fy] = f.facePos(), s = fx > V.x ? 1 : -1;
        wire.attn = [fx, fy]; tg.lean += 12 * s; tg.turn = 0.4 * s;
        const [sx, sy] = wire.world(s < 0 ? -16 : 16, -92), dd = Math.hypot(fx - sx, fy - sy) || 1, reach = Math.min(dd - 128, 130);
        let px = sx + ((fx - sx) / dd) * Math.max(40, reach), py = sy + ((fy - sy) / dd) * Math.max(40, reach);
        /* never let the reaching hand (or the arm) vanish behind the menu sign: while
           they're still far off to the left he claws down past its corner instead */
        if (px < SG.x + SG.w + 20 && py < SG.y + SG.h + 40) { px = Math.max(px, SG.x + SG.w - 6); py = Math.max(py, SG.y + SG.h + 38); }
        armTo(tg, s, px, py);
        tg[s < 0 ? 'lbend' : 'rbend'] = 0.25; d[s < 0 ? 'lg' : 'rg'] = 'claw'; d[s < 0 ? 'lLayer' : 'rLayer'] = 'front';
        tg[s < 0 ? 'rhx' : 'lhx'] = -30 * s; tg[s < 0 ? 'rhy' : 'lhy'] = 88;
      }
    } else if (st === 'recoil') {
      /* one of them charges straight at him: he rears up out of the way, fingers splayed */
      const f = V.reachFor, s = f && f.cfg.x > V.x ? 1 : -1;
      tg.hood = 1.2; tg.lid = 0; tg.pupil = 0.2; d.mouth = 'O'; tg.mouthOpen = 0.8; tg.browRaise = 0.6; tg.browTilt = 0.3; tg.sy = 1.08;
      tg.lhx = -44; tg.lhy = 10; tg.rhx = 50; tg.rhy = 6; d.lg = 'palm'; d.rg = 'palm'; d.lLayer = d.rLayer = 'front';
      wire.attn = f ? f.facePos() : null; tg.lean -= 8 * s;
    } else if (st === 'hiss') {
      const f = V.reachFor, s = f && f.cfg.x > V.x ? 1 : -1;
      tg.hood = 1.25; tg.frizz = 1; d.mouth = 'wiregrin'; tg.mouthOpen = 1; tg.lid = 0.05; tg.pupil = 0.22;
      tg.lhx = -36; tg.lhy = 20; tg.rhx = 36; tg.rhy = 20; d.lg = 'claw'; d.rg = 'claw'; d.lLayer = d.rLayer = 'front';
      wire.attn = f && onStage(f) ? f.facePos() : null; tg.lean += 8 * s;
    }
  };
  function startPoke() {
    const opts = Object.keys(PLANS).filter(k => k !== V.last);
    const k = Math.random() < 0.75 ? pick(opts) : pick(Object.keys(PLANS));
    V.plan = PLANS[k]; V.last = k; V.hit = false;
    goPath(V.plan.path, V.plan.c === outlet ? 120 : 60, 'creep');
    A.sfx.slide(false);
  }
  function onPoke(victim, x, y) {
    V.hit = true; V.st = 'snicker'; V.t0 = now;
    particles.bonk(x, y, 1.9); particles.spark(x, y, 9, 0.5);
    A.sfx.zap(); A.sfx.boing(); setTimeout(() => A.sfx.laugh(false), 350);
    play(victim, K.jolt(x > victim.cfg.x ? 1 : -1));
    if (victim !== bulb) setTimeout(() => play(bulb, K.coverEyes()), 200);
    if (victim !== outlet) setTimeout(() => play(outlet, K.handsFace()), 260);
    setTimeout(() => play(board, K.peekOver()), 320);
  }
  function villainTick(t) {
    const st = V.st;
    /* sound for the sneak: a pizzicato tiptoe on each step, a held note on a freeze */
    if (st === 'creep') {
      const stepN = Math.floor(t * 1.25);
      if (!V.frozen && stepN !== V.stepN && App.running) A.sfx.tiptoe();
      V.stepN = stepN;
      if (V.frozen && !V.wasFrozen) A.sfx.freeze();
    }
    V.wasFrozen = V.frozen;
    if (st === 'creep' && !V.path.length) { V.st = 'windup'; V.t0 = t; A.sfx.squeak(); }
    else if (st === 'windup' && t - V.t0 > 0.75) { V.st = 'jab'; V.t0 = t; A.sfx.whoosh(); }
    else if (st === 'jab') {
      /* the fingertip arriving on the spot is a hit even if the round hit shapes
         don't quite meet the victim's outline there */
      const hp = wire.handPoints(), tip = hp[V.plan.side < 0 ? 1 : 3];
      if (!V.hit && tip && Math.hypot(tip[0] - V.plan.cp[0], tip[1] - V.plan.cp[1]) < tip[2] + 4) { note('poke', V.plan.c.name); onPoke(V.plan.c, tip[0], tip[1]); }
      else if (t - V.t0 > 0.9) { V.st = 'snicker'; V.t0 = t; }
    }
    else if (st === 'snicker' && t - V.t0 > 1.7) goPath((V.plan.back || V.plan.path.slice().reverse().slice(1)).concat([LURK]), 115, 'slink');
    else if (st === 'slink' && !V.path.length) { V.st = 'lurk'; V.plan = null; V.nextPoke = Math.max(V.nextPoke, t + rand(10, 16)); }
    else if (st === 'recoil' && !V.path.length) { V.st = 'hiss'; V.t0 = t; play(wire, K.snarl(), 'small'); }
    else if (st === 'hiss' && t - V.t0 > 1.3) { V.reachFor = null; goPath([LURK], 80, 'slink'); }
    if (V.st === 'lurk' && App.running) {
      if (t > ev.bonk && WK.st === 'off') { peerBonk(); ev.bonk = t + rand(16, 22); }
      else if (t > V.nextPoke && WK.st === 'off') startPoke();
    }
  }
  /* the lamp bonk is an accident: he cranes up to peer over the meter at the board's
     book, too busy looking to notice the shop lamp right above him. Clonk. Short.
     When the lights come back he looks up at the lamp, blinks, and shakes a fist. */
  function peerBonk() {
    V.st = 'peer'; V.t0 = now;
    const lx = LAMPX[1] - Math.sin(lamps[1].th) * 41, top = 60 + Math.cos(lamps[1].th) * 41;
    const s = wire.cfg.scale;
    /* the skull's crown sits 99 units above his chin; craning, he's stretched tall */
    const H = 104 * s;
    const [ax, ay] = wpos(868, 262), [bx, by] = wpos(lx - 10, top + H * 1.16 + 14), [cx, cy] = wpos(lx - 3, top + H * 1.18 + 6);
    const [dx, dy] = wpos(lx - 36, top + H + 70), [nx, ny] = wpos(LURK[0], LURK[1]);
    const cur = wpos(V.x, V.y);
    wire.play([
      [0.02, { hipX: cur[0], hipY: cur[1] }],
      [0.14, { hipX: ax, hipY: ay, sy: 1.1, stretch: 1, lookX: 1, lookY: 0.7, turn: 0.45, browRaise: 0.6, browTilt: 0, mouth: 'O', mouthOpen: 0.15, lid: 0.05, pupil: 0.34, hood: 0.3 }],
      [0.26, { hipX: bx, hipY: by, sy: 1.16, lookX: 1, lookY: 0.9 }],
      [0.3, { hipX: cx, hipY: cy, sy: 1.18 }],
      [0.33, { hipX: cx, hipY: cy + 18, sy: 0.74, sx: 1.25, lid: 1, mouth: 'O', mouthOpen: 0.9, pop: 1.2, lookY: -1 }],
      [0.4, { hipX: dx, hipY: dy, sy: 1, sx: 1, stretch: 0.4, lean: -14, dizzy: 1, lid: 0.55, pupil: 0.3, mouthOpen: 0.4, pop: 0, lookY: 0 }],
      [0.62, { hipX: dx, hipY: dy, dizzy: 1, lean: 10 }],
      /* lights back on: the double take */
      [0.68, { dizzy: 0, lean: 0, stretch: 0, lookX: 0.3, lookY: -1, lid: 0, pupil: 0.42, browRaise: 0.8, mouth: 'seam', mouthOpen: 0 }],
      [0.72, { lid: 0.9 }], [0.74, { lid: 0, pupil: 0.24 }],
      [0.8, { browTilt: -1.6, browRaise: 0, mouth: 'wiregrin', mouthOpen: 0.45, hood: 1.2, rhx: 34, rhy: -12, rg: 'fist', rLayer: 'front', lookY: -1 }],
      [0.84, { rhy: -22 }], [0.87, { rhy: -8 }], [0.9, { rhy: -22 }],
      [1, { hipX: nx, hipY: ny, hood: 0.3, mouth: 'seam', mouthOpen: 0.1, rhx: 34, rhy: 94, rg: 'back' }]], 7.5,
      { cues: [[0.3, () => { shortOut(); A.sfx.thud(); }], [0.8, () => A.sfx.buzzer()]],
        done: () => { V.st = 'lurk'; V.x = LURK[0]; V.y = LURK[1]; V.nextPoke = Math.max(V.nextPoke, now + 4); } });
  }

  /* ---------- the walkers: the fuse and the switch try to cross the bench ---------- */
  const BEAT = 60 / 124;
  const WK = { st: 'off', next: 18, t0: 0, ph: 0, phOff: 0, reached: false };
  /* each walker keeps its own heading and speed so they can scatter; each has a
     friend on the front row to wave at on the way past */
  const walkers = [{ c: fuse, off: 0, greet: bulb }, { c: sw, off: -170, greet: outlet }];
  for (const w of walkers) Object.assign(w, { dir: 1, v: 0, ph: 0, waved: false, runT: 0 });
  function startWalk(t) {
    for (const w of walkers) { w.c.cfg.x = -70 + w.off; w.dir = 1; w.v = 70; w.waved = false; w.c.actions = []; }
    WK.st = 'walk'; WK.t0 = t; WK.reached = false;
    WK.phOff = WK.ph - A.beat() * 0.5;
  }
  /* they scatter: the one in front bolts right past him (he rears out of the way),
     the one behind turns tail and runs back the way they came */
  function flee() {
    if (WK.st === 'run') return;
    WK.st = 'run'; WK.t0 = now;
    const [lead, back] = walkers;
    lead.dir = 1; back.dir = -1;
    for (const w of walkers) { w.v = 0; w.runT = now + (w === lead ? 0.3 : 0.14); }
    A.sfx.slide(true);
    if (V.st === 'reach') goPath([[888, 240]], 560, 'recoil');
  }
  function walkerTick(t, dt) {
    if (WK.st === 'off') {
      if (t > WK.next && V.st === 'lurk' && App.running) startWalk(t);
      return;
    }
    if (WK.st === 'walk') WK.ph = A.beat() * 0.5 + WK.phOff;
    for (const w of walkers) {
      if (WK.st === 'run') {
        /* a beat of legs windmilling on the spot, then zoom, kicking up dust */
        w.ph += dt / (t < w.runT ? 0.08 : 0.2);
        w.v = t < w.runT ? 0 : 360;
        w.dust = (w.dust || 0) - dt;
        if (w.dust <= 0 && w.c.cfg.x > -40 && w.c.cfg.x < 1320) {
          w.dust = t < w.runT ? 0.05 : 0.09;
          particles.smoke(w.c.cfg.x - w.dir * 10, w.c.cfg.y - 4, 1, t < w.runT ? 0.45 : 0.35, -w.dir * 90);
        }
      } else w.ph = WK.ph + (w.off ? 0.12 : 0);
      if (WK.st !== 'notice') w.c.cfg.x += w.dir * w.v * dt;
      /* a shy little wave to their friend on the front row, who waves back */
      const g = w.greet, dx = g.cfg.x - w.c.cfg.x;
      if (WK.st === 'walk' && !w.waved && dx > (g === bulb ? 70 : 104) && dx < (g === bulb ? 170 : 150)) {
        w.waved = true;
        play(w.c, K.walkWave(), 'small');
        setTimeout(() => play(g, K.wave(-1, 1.7), 'small'), 260);
      }
    }
    const lead = walkers[0].c;
    /* nearing his hole: he uncoils and reaches for the one in front */
    if (WK.st === 'walk' && !WK.reached && lead.cfg.x > 600 && V.st === 'lurk') {
      WK.reached = true; V.reachFor = lead;
      goPath([[838, 392]], 60, 'reach');
    }
    if (WK.st === 'walk' && V.st === 'reach' && t - V.t0 > 1.25) {
      WK.st = 'notice'; WK.t0 = t;
      A.sfx.pop();
      for (const w of walkers) { w.v = 0; play(w.c, { d: 0.6, k: [[0.05, { pop: 1.2, sy: 1.14, sx: 0.9, hipY: -12, mouth: 'O', mouthOpen: 0.9, lid: 0, pupil: 0.32, browRaise: 1.5, lhx: -22, lhy: -46, rhx: 22, rhy: -46, lg: 'palm', rg: 'palm' }], [0.9, { pop: 0.6 }]] }, 'small'); }
    }
    if (WK.st === 'notice' && t - WK.t0 > 0.6) {
      flee();
      play(outlet, K.outletPeek()); setTimeout(() => play(bulb, K.coverEyes()), 150);
    }
    const gone = walkers.every(w => w.c.cfg.x < -90 || w.c.cfg.x > 1370);
    if (gone && t - WK.t0 > 2) {
      WK.st = 'off'; WK.next = t + rand(18, 25);
      for (const w of walkers) { w.c.cfg.x = -400; w.c.actions = []; }
    }
  }
  /* walk and run cycles: feet planted on the bench, body bob, arm swing with the
     gloves turning as they swing; running is hands-over-heads */
  for (const w of walkers) {
    const c = w.c;
    c.brain = (t, dt, tg, d) => {
      c.profile = WK.st === 'off' ? 0 : w.dir;
      if (WK.st === 'off') return;
      const dir = w.dir, ph = w.ph, cyc = Math.cos(2 * Math.PI * ph);
      const run = WK.st === 'run', notice = WK.st === 'notice';
      const bob = run ? 10 : 6;
      if (!notice) tg.hipY += -bob * (0.5 - 0.5 * Math.cos(4 * Math.PI * ph));
      tg.turn = dir * (notice ? 0.75 : run ? 0.4 : 0.55);
      tg.lean += notice ? -dir * 6 : dir * (run ? 14 : 5);
      tg.knee = run ? 0.4 : 0.25;
      if (run) {
        /* full 1930s panic: arms windmilling wildly round and over the head in
           opposite circles, gloves flapping open, body pitched way forward (or
           rocked back while the legs spin on the spot), eyes like saucers */
        const [s0, s1] = c.cfg.shoulders, top = c === sw ? -222 : -168;
        const scramble = now < w.runT;
        /* each one flails to its own ragged rhythm: the tempo lurches, the circles
           swell and pinch, arms get flung high overhead and whip back down */
        const o = w.off ? 1.7 : 0, sp = (scramble ? 26 : 19) * (w.off ? 1.13 : 1);
        const f = t * sp + 0.9 * Math.sin(t * 5.3 + o), g = t * sp * 0.87 + 1.1 * Math.sin(t * 4.1 + o * 2);
        const R0 = (c === sw ? 40 : 33) * (1 + 0.35 * Math.sin(t * 7.7 + o));
        const R1 = (c === sw ? 40 : 33) * (1 + 0.35 * Math.sin(t * 6.3 + o + 2));
        const flingL = Math.max(0, Math.sin(t * 3.7 + o)) ** 3 * 26, flingR = Math.max(0, Math.sin(t * 3.1 + o + 2.4)) ** 3 * 26;
        tg.lhx = -26 - flingL * 0.4 + R0 * 1.15 * Math.cos(f); tg.lhy = top - s0[1] - 18 - flingL + R0 * Math.sin(f);
        tg.rhx = 26 + flingR * 0.4 + R1 * 1.15 * Math.cos(-g + Math.PI); tg.rhy = top - s1[1] - 18 - flingR + R1 * Math.sin(-g + Math.PI);
        tg.lbend = 0.45 + 0.35 * Math.sin(f * 2); tg.rbend = 0.45 + 0.35 * Math.sin(g * 2 + 1);
        d.lg = 'palm'; d.rg = 'palm'; d.lLayer = d.rLayer = 'front';
        tg.lroll = 1.1 * Math.sin(f * 1.5); tg.rroll = -1.1 * Math.sin(g * 1.5 + 1);
        tg.lean += scramble ? -dir * 22 : dir * 12;
        tg.sy += 0.08 * Math.sin(t * 40); tg.hipY -= scramble ? 8 : 4;
        tg.sweat = 1; d.mouth = 'gasp'; tg.mouthOpen = 1.1; tg.pupil = 0.3; tg.browRaise = 1.6; tg.lid = 0; tg.shake += 1.2; tg.pop = 1;
        c.attn = null; tg.lookX = -dir * 0.9; tg.lookY = -0.2;
      } else if (!notice) {
        const sw0 = c === sw ? 26 : 20, S = c === sw ? 18 : 14;
        tg.lhx = -sw0 - dir * S * cyc; tg.rhx = sw0 + dir * S * cyc;
        tg.lhy += 4 * Math.abs(Math.sin(2 * Math.PI * ph)); tg.rhy += 4 * Math.abs(Math.sin(2 * Math.PI * ph));
        d.lg = 'back'; d.rg = 'back'; tg.lroll = 0.9 * cyc; tg.rroll = -0.9 * cyc;
        /* three-quarter view: the arm on the far side swings behind the body */
        d[dir > 0 ? 'rLayer' : 'lLayer'] = 'back';
        tg.browRaise = 0.9; tg.pupil = 0.62; tg.sweat = V.st === 'reach' ? 1 : 0;
        /* they look at the friend they're about to wave to, else nervously ahead */
        const gdx = w.greet.cfg.x - c.cfg.x;
        if (V.st === 'reach') c.attn = wire.facePos();
        else if (gdx > 20 && gdx < 240) c.attn = w.greet.facePos();
        else { c.attn = null; tg.lookX = dir * 0.6 + 0.3 * Math.sin(t * 0.9 + w.off); }
      } else c.attn = wire.facePos();
    };
    c.drive = p => {
      if (WK.st !== 'walk' && WK.st !== 'run') return;
      /* the scramble on the spot is a blur of knees; the getaway takes huge strides */
      const run = WK.st === 'run', dir = w.dir, scramble = run && now < w.runT, T0 = run ? (scramble ? 0.08 : 0.2) : 2 * BEAT;
      const A0 = scramble ? 22 : ((run ? 360 : 70) * T0) / (4 * c.cfg.scale), H = scramble ? 30 : run ? 34 : 14;
      const ph = w.ph;
      [['lfx', 'lfy', 'ltoe', 0], ['rfx', 'rfy', 'rtoe', 0.5]].forEach(([kx, ky, kt, o]) => {
        const u = (((ph + o) % 1) + 1) % 1;
        let x, y;
        if (u < 0.5) { x = A0 * (1 - 4 * u); y = 0; } else { const q = (u - 0.5) * 2; x = A0 * (-1 + 2 * q); y = H * Math.sin(Math.PI * q); }
        /* toe lifts as the foot swings through, heel-first as it lands */
        p[kx] = dir * x; p[ky] = y; p[kt] = y > 1 ? (u < 0.8 ? -14 : 12) : 0;
        c.v[kx] = 0; c.v[ky] = 0;
      });
    };
  }

  /* ---------- scene events ---------- */
  function shortOut() {
    const t = now;
    const lx = LAMPX[1] - Math.sin(lamps[1].th) * 36, ly = 60 + Math.cos(lamps[1].th) * 36;
    particles.spark(lx, ly, 22, 1.1);
    for (let i = 0; i < 4; i++) particles.bolt(lx, ly, lx + rand(-220, 220), ly + rand(40, 260));
    particles.bonk(lx, ly + 20, 1.8);
    particles.smoke(lx, ly, 3, 0.8);
    lamps[1].w += 3.2; lamps[0].w += 0.8;
    ev.flash = t; ev.black0 = t + 0.12; ev.black1 = t + 2.5; ev.panicOff = t + 2.5; ev.rattle = t + 0.6;
    A.duck(3); A.sfx.zap(); A.sfx.boom(); setTimeout(() => A.sfx.buzzer(), 400);
    const terror = [[bulb, K.panicGlow()], [outlet, K.outletPeek()], [meter, K.probeUp()], [board, K.bookUp()]];
    terror.forEach(([c, m], i) => setTimeout(() => play(c, m), 60 + i * 50));
    if (WK.st === 'walk' || WK.st === 'notice') flee();
  }
  function spiderPeek() {
    spider.peek(190, 205, 190, 20, () => {
      A.sfx.clack(); A.sfx.fizzle();
      play(bulb, K.coverEyes());
      [outlet, meter].forEach(c => play(c, K.flinch(-1), 'small'));
    });
  }

  /* ---------- collisions: anything touching gets an impact ---------- */
  const pairKey = (a, b) => [a.name, b.name].sort().join('+');
  const contacts = new Map();
  /* a short history of impacts, handy for checking the choreography */
  const impacts = [];
  const note = (kind, what) => { impacts.push([Math.round(now * 10) / 10, kind, what]); if (impacts.length > 60) impacts.shift(); };
  const onStage = c => c.cfg.x > -60 && c.cfg.x < 1340;
  function bump(a, b, pa, pb, t) {
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy) || 1;
    const x = pa[0] + (dx / d) * Math.min(pa[2], d), y = pa[1] + (dy / d) * Math.min(pa[2], d);
    const vil = a === wire ? b : b === wire ? a : null;
    if (vil && V.plan && vil === V.plan.c && (V.st === 'jab' || V.st === 'windup' || V.st === 'creep' || V.st === 'snicker')) {
      /* the poke already landed: the fingertip lingering there is not a second hit */
      if (V.hit) return;
      /* the impact goes where the fingertip is, at the victim's edge, not on its face */
      const hp = wire.handPoints(), tip = hp[V.plan.side < 0 ? 1 : 3] || [x, y];
      if (!V.hit) { note('poke', vil.name); onPoke(vil, tip[0], tip[1]); }
      return;
    }
    const over = pa[2] + pb[2] - d;
    if (over > 0) {
      const s = Math.sign(dx) || 1;
      if (a !== wire) a.shove -= (s * over * 0.5) / a.cfg.scale;
      if (b !== wire) b.shove += (s * over * 0.5) / b.cfg.scale;
      a.touching = b.touching = true;
    }
    const key = pairKey(a, b);
    if ((contacts.get(key) || 0) > t) return;
    contacts.set(key, t + 1.2);
    note('bump', key);
    particles.bonk(x, y, 1.5); particles.spark(x, y, 5, 0.3);
    A.sfx.boing();
    for (const who of [a, b]) {
      if (who === wire) play(wire, K.snarl(), 'small');
      else play(who, K.bumped(x > who.cfg.x ? 1 : -1), WK.st !== 'off' && who.lane === 'back' ? 'small' : 'big');
    }
  }
  function touchProp(c, pr, t) {
    const key = c.name + pr.x;
    if ((contacts.get(key) || 0) > t) return;
    contacts.set(key, t + 1.2);
    note('prop', c.name + '@' + pr.x);
    pr.wob = t;
    particles.bonk(pr.x, pr.y - pr.r, 0.8);
    A.sfx.tick();
  }
  function collide(t) {
    const live = cast.filter(onStage);
    const shapes = live.map(c => ({ c, all: c.bodyCircles().concat(c.handPoints()) }));
    cast.forEach(c => { c.touching = false; });
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i].c, b = shapes[j].c;
        if (a.lane !== b.lane && a.lane !== 'any' && b.lane !== 'any') continue;
        let hit = null;
        for (const pa of shapes[i].all) { for (const pb of shapes[j].all) if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < pa[2] + pb[2]) { hit = [pa, pb]; break; } if (hit) break; }
        if (hit) bump(a, b, hit[0], hit[1], t);
      }
      for (const pr of PROPS) if (shapes[i].all.some(q => Math.hypot(q[0] - pr.x, q[1] - pr.y) < q[2] + pr.r)) touchProp(shapes[i].c, pr, t);
    }
  }

  /* ---------- personalities ---------- */
  const flick = { next: 3, end: 0 };
  const hoverStiff = (toon, tg, d) => {
    if (!toon.hovered) return;
    tg.sy += 0.05; tg.pupil = 0.5; tg.shake += 0.8; tg.browRaise = 1; tg.lid = 0; tg.sweat = 1;
    d.mouth = 'grit'; tg.mouthOpen = 0.4;
  };
  bulb.brain = (t, dt, tg, d) => {
    /* fretting hands that keep turning over */
    tg.lroll = 0.55 + 0.45 * Math.sin(t * 1.6); tg.rroll = -0.55 - 0.45 * Math.sin(t * 1.6 + 1.1);
    tg.lhy += 2.5 * Math.sin(t * 5); tg.rhy += 2.5 * Math.sin(t * 5 + 1.3);
    if (t > flick.next) { flick.end = t + rand(0.25, 0.6); flick.next = t + rand(3, 8); }
    if (t < flick.end) tg.glow = Math.floor(t * 24) % 3 === 0 ? 0.75 : 0.12;
    hoverStiff(bulb, tg, d);
  };
  outlet.brain = (t, dt, tg, d) => {
    tg.lroll = 0.35 * Math.sin(t * 1.3); tg.rroll = -0.35 * Math.sin(t * 1.5 + 2);
    tg.knee = -0.15;
    hoverStiff(outlet, tg, d);
  };
  const vDist = c => { const [fx, fy] = c.facePos(), [wx, wy] = wire.facePos(); return Math.hypot(fx - wx, fy - wy); };
  meter.brain = (t, dt, tg, d) => {
    /* the meter is the room's early warning: it reads the live wire as it comes
       closer, beeping faster and faster */
    const dist = vDist(meter);
    const near = dist < 180;
    if (near) {
      const k = clamp((dist - 90) / 90);
      d.screen = k < 0.35 ? (Math.floor(t * 8) % 2 ? '120V' : 'LIVE') : Math.floor(t * 4) % 2 ? '120V' : '118V';
      tg.dial = 1; tg.browRaise = 1; tg.pupil = 0.5; tg.sweat = k < 0.4 ? 1 : 0; d.mouth = k < 0.4 ? 'grit' : 'flat';
      if (App.running && t > ev.beep) { A.sfx.beep(); ev.beep = t + 0.12 + 0.7 * k; }
      /* probes clutched tight to its sides, trembling */
      tg.lhx = -14; tg.rhx = 14; tg.lhy = 46 + 2 * Math.sin(t * 30); tg.rhy = 46 - 2 * Math.sin(t * 30); tg.shake += 0.6;
    } else d.screen = ['0.00', '0.00', '0.01', '0.00'][Math.floor(t * 0.8) % 4];
    hoverStiff(meter, tg, d);
  };
  board.brain = (t, dt, tg, d) => {
    /* reading "Card Readers & You": hands on the sides of the book, below the eyes */
    const bk = board.p.book * 34;
    tg.lhx = 12; tg.lhy = 40 + bk; tg.rhx = -12; tg.rhy = 40 + bk; d.lg = 'fist'; d.rg = 'fist';
    tg.lbend = 0.3; tg.rbend = 0.3; tg.lga = 72; tg.rga = 72;
    tg.lid = 0.38; d.mouth = 'flat';
    /* reading: the eyes track slowly along the lines of the page */
    if (board.look === 'book') { tg.lookX = -0.5 + ((t * 0.35) % 1) * 1.1; tg.lookY = 0.75; }
    hoverStiff(board, tg, d);
  };

  /* ---------- attention: who looks at what ----------
     Nobody stares at one point. Each part picks what to look at from its own
     habits, holds it for its own length of time, and its gaze catches up with a
     lag that suits it. The live wire's head is tracked where it actually is. The
     mark of a creep looks away most of the time and only glances his way now and
     then (and he freezes when it does); everyone else watches him in horror. */
  const PERS = {
    bulb: { rate: 7, dur: [0.7, 2.2], pick: [['villain', 5], ['outlet', 1.5], ['down', 1.2], ['away', 2]] },
    outlet: { rate: 9, dur: [0.6, 1.8], pick: [['villain', 4], ['bulb', 2.5], ['down', 1], ['away', 2]] },
    meter: { rate: 3, dur: [1.6, 3.6], pick: [['down', 4], ['villain', 3.5], ['board', 1.5]] },
    board: { rate: 2, dur: [2, 5], pick: [['book', 8], ['villain', 1.6], ['meter', 0.6]] },
  };
  const pickW = list => { let r = Math.random() * list.reduce((s, x) => s + x[1], 0); for (const [k, w] of list) { r -= w; if (r <= 0) return k; } return list[0][0]; };
  let menuT = -9;
  function lookPoint(c, what) {
    const [fx, fy] = c.facePos();
    if (what === 'villain') return wire.facePos();
    if (what === 'down' || what === 'book') return [fx + (c === board ? 0 : 20), fy + 260];
    if (what === 'away') return [fx + (c.awayDir || 1) * 300, fy - 90];
    if (what === 'menu') return menuFocus || [640, 300];
    if (what && what.facePos) return what.facePos();
    const other = { bulb, outlet, meter, board }[what];
    return other ? other.facePos() : wire.facePos();
  }
  function attend(c, t, dt, cursorFresh) {
    const P = PERS[c.name];
    const mark = V.plan && V.plan.c, hunting = V.st === 'creep', striking = V.st === 'windup' || V.st === 'jab' || V.st === 'snicker';
    let what;
    c.glancingV = false;
    if (c.hovered && cursorFresh) what = [cursor.x, cursor.y];
    else if (hunting && c === mark) {
      /* the mark hasn't noticed him... except for a quick glance every so often */
      if (!c.gNext || t > c.gNext + 3) c.gNext = t + rand(1.4, 2.4);
      if (t > c.gNext) { c.gUntil = t + rand(0.55, 0.8); c.gNext = t + rand(2.2, 3.6); }
      c.glancingV = t < c.gUntil;
      if (c.glancingV) what = 'villain';
      else { if (t > c.lookUntil || c.look === 'villain') { c.look = pick(['down', 'away', c === outlet ? 'bulb' : 'board']); c.lookUntil = t + rand(1, 2); c.awayDir = pick([-1, 1]); } what = c.look; }
    } else if (hunting || striking || V.st === 'reach' || V.st === 'recoil' || V.st === 'hiss') what = 'villain';
    else if (t - menuT < 1.5 && (c === bulb || c === outlet)) what = 'menu';
    else if (WK.st === 'walk' && walkers.some(w => w.greet === c && Math.abs(w.c.cfg.x - c.cfg.x) < 260)) what = walkers.find(w => w.greet === c).c;
    else if (c === meter && vDist(meter) < 200) what = 'villain';
    else {
      if (t > (c.lookUntil || 0)) { c.look = pickW(P.pick); c.lookUntil = t + rand(P.dur[0], P.dur[1]); c.awayDir = pick([-1, 1]); }
      what = c.look;
    }
    if (c === board) board.look = what;
    const p = Array.isArray(what) ? what : lookPoint(c, what), k = 1 - Math.exp(-dt * P.rate);
    c.attnP = c.attnP ? [c.attnP[0] + (p[0] - c.attnP[0]) * k, c.attnP[1] + (p[1] - c.attnP[1]) * k] : p;
    c.attn = c.attnP;
  }

  const IDLE = [
    () => play(bulb, pick([K.checkFilament, K.gulp, K.footShift, K.fidget])(), 'small'),
    () => play(outlet, pick([K.gulp, K.footShift])(), 'small'),
    () => play(board, pick([K.pageFlip, K.peekOver, K.pageFlip])(), 'small'),
    () => play(meter, K.probeTap(), 'small'),
  ];

  /* ---------- pointer & menu ---------- */
  const cursor = { x: 640, y: 360, moved: -10 };
  let menuFocus = null, active = false;
  App.frame.addEventListener('pointermove', e => {
    if (!active) return;
    const [x, y] = App.toScene(e);
    cursor.x = x; cursor.y = y; cursor.moved = performance.now() / 1000;
  });
  for (const toon of cast) {
    toon.root.style.cursor = 'pointer';
    toon.root.addEventListener('pointerenter', () => { toon.hovered = true; });
    toon.root.addEventListener('pointerleave', () => { toon.hovered = false; });
    toon.root.addEventListener('click', () => {
      if (!App.running || !active) return;
      const s = cursor.x > toon.cfg.x ? 1 : -1;
      /* everybody answers a poke from the player in their own way */
      if (toon === wire) { play(wire, K.snarl(), 'small'); A.sfx.laugh(false); A.sfx.fizzle(); }
      else if (toon === bulb) { play(bulb, K.jolt(s)); A.sfx.squeak(); }
      else if (toon === outlet) { play(outlet, K.handsFace()); A.sfx.squeak(); }
      else if (toon === meter) { play(meter, K.probeUp()); }
      else if (toon === board) { play(board, K.bookUp()); }
      else { play(toon, K.bumped(s), 'small'); A.sfx.squeak(); }
    });
  }

  const nav = document.getElementById('menu');
  const items = [...document.querySelectorAll('.menu-item')];
  let sel = 0;
  function focusItem(i, sound = true) {
    sel = (i + items.length) % items.length;
    items.forEach((b, k) => b.classList.toggle('sel', k === sel));
    const r = items[sel].getBoundingClientRect(), fr = svg.getBoundingClientRect();
    menuFocus = [((r.left + r.width / 2 - fr.left) / fr.width) * 1280, ((r.top + r.height / 2 - fr.top) / fr.height) * 720];
    if (sound) menuT = now;
    if (sound && App.running) A.sfx.hover();
  }
  items.forEach((b, i) => {
    b.addEventListener('pointerenter', () => { if (sel !== i || !menuFocus) focusItem(i); });
    b.addEventListener('pointerleave', () => { menuFocus = null; });
    b.addEventListener('focus', () => focusItem(i, false));
    b.addEventListener('click', () => activate(i));
  });
  async function activate(i) {
    if (!App.running || App.busy || App.cardOpen || !active) return;
    const what = items[i].dataset.go;
    focusItem(i, false);
    A.sfx.select();
    if (what === 'start') {
      play(bulb, K.selected());
      await App.wait(1.4);
      App.go('level', { from: bulb.facePos() });
    } else {
      App.showCard(what === 'how' ? 'howCard' : 'settingsCard', () => items[sel].focus());
    }
  }
  window.addEventListener('keydown', e => {
    if (!App.running || !active || App.cardOpen) return;
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); focusItem(sel + 1); items[sel].focus(); }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); focusItem(sel - 1); items[sel].focus(); }
  });

  /* ---------- the job sign ----------
     "Start Wiring" lowers an old painted plank sign into the scene on two
     chains: it drops, the chains snap taut with a clink, it bounces and swings
     to rest. Picking a job plays the iris onto the bulb (unchanged); backing
     out yanks the sign back up into the dark. */
  const sign = document.getElementById('levelCard');
  if (sign) {
    const still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const S = { y: 0, vy: 0, th: 0, w: 0, mode: 'off', raf: 0, last: 0, bounces: 0 };
    const frameH = () => App.frame.getBoundingClientRect().height || 720;
    const apply = () => { sign.style.transform = `translate(-50%, ${S.y.toFixed(1)}px) rotate(${S.th.toFixed(4)}rad)`; };
    const step = ts => {
      const dt = Math.min(0.033, Math.max(0.001, (ts - S.last) / 1000)); S.last = ts;
      const H = frameH(), g = H * 5.2;
      if (S.mode === 'drop') {
        S.vy += g * dt; S.y += S.vy * dt;
        if (S.y >= 0) {
          /* the chains snap tight: a clink, and the sign bounces back up a little */
          if (S.vy > H * 0.25) {
            A.sfx.clink(Math.min(1, S.vy / (H * 2.4)));
            if (!S.bounces) { S.w += (Math.random() < 0.5 ? -1 : 1) * 0.35; A.sfx.thud(); }
            S.bounces++;
            S.vy = -S.vy * 0.32;
          } else S.vy = 0;
          S.y = 0;
        }
      } else if (S.mode === 'yank') {
        S.vy -= g * 1.7 * dt; S.y += S.vy * dt;
        if (S.y < -(sign.offsetTop + sign.offsetHeight + 60)) { S.mode = 'off'; sign.hidden = true; sign.style.transform = ''; }
      }
      /* it swings from the ceiling, heavy and damped */
      const L = Math.max(60, sign.offsetTop + sign.offsetHeight * 0.5);
      S.w += (-(g / L) * 0.6 * Math.sin(S.th) - 1.4 * S.w) * dt; S.th += S.w * dt;
      apply();
      const settled = S.mode === 'drop' && S.y === 0 && S.vy === 0 && Math.abs(S.w) < 0.002 && Math.abs(S.th) < 0.0015;
      if (settled) { S.th = 0; apply(); }
      S.raf = S.mode !== 'off' && !settled ? requestAnimationFrame(step) : 0;
    };
    const run = () => { if (!S.raf) { S.last = performance.now(); S.raf = requestAnimationFrame(step); } };
    App.cardFx.levelCard = {
      show() {
        sign.style.transformOrigin = `50% ${-sign.offsetTop}px`;
        if (still) { S.mode = 'off'; sign.style.transform = 'translate(-50%, 0)'; return; }
        S.mode = 'drop'; S.y = -(sign.offsetTop + sign.offsetHeight + 30); S.vy = 0; S.th = (Math.random() - 0.5) * 0.05; S.w = 0; S.bounces = 0;
        apply(); A.sfx.slide(false); run();
      },
      hide() {
        if (still) { sign.hidden = true; return; }
        S.mode = 'yank'; S.vy = -frameH() * 0.5; S.w += (Math.random() < 0.5 ? -1 : 1) * 0.3;
        A.sfx.clink(0.7); A.sfx.whoosh(); run();
      },
    };
    /* arrow keys walk the list (Enter picks, Escape backs out) */
    sign.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const bs = [...sign.querySelectorAll('button:not(:disabled)')];
      const i = bs.indexOf(document.activeElement);
      e.preventDefault(); e.stopPropagation();
      bs[(i + (e.key === 'ArrowDown' ? 1 : -1) + bs.length) % bs.length].focus();
      A.sfx.hover();
    });
  }

  const REDUCE_M = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  /* parallax: the back wall is further off than the bench (the reference plane,
     with the sign and its buttons), the lamps hang nearer. On a desktop the planes
     really slide against each other with the mouse; on a phone, a tilt (when the
     sensor reports one; we never prompt for it) pans the compositor camera, which
     costs nothing, and otherwise the slow drift carries on alone. */
  const TOUCH_M = document.documentElement.classList.contains('touch');
  const PAR = { x: 0, y: 0, tilt: null, zero: null, back: '', front: '' };
  window.addEventListener('deviceorientation', e => {
    if (e.gamma == null || e.beta == null) return;
    if (!PAR.zero) PAR.zero = [e.gamma, e.beta];
    PAR.tilt = [clamp((e.gamma - PAR.zero[0]) / 15, -1, 1), clamp((e.beta - PAR.zero[1]) / 15, -1, 1)];
  });
  function parallax(fresh, on) {
    let tx = 0, ty = 0;
    if (on && PAR.tilt) [tx, ty] = PAR.tilt;
    else if (on && fresh && !TOUCH_M) { tx = clamp((cursor.x - 640) / 640, -1, 1); ty = clamp((cursor.y - 360) / 360, -1, 1); }
    PAR.x += (tx - PAR.x) * 0.18; PAR.y += (ty - PAR.y) * 0.18;
    if (TOUCH_M) return;
    const back = on ? `translate(${R(-PAR.x * 4)},${R(-PAR.y * 2.5)})` : '';
    const front = on ? `translate(${R(PAR.x * 9)},${R(PAR.y * 5)})` : '';
    if (back !== PAR.back) { PAR.back = back; for (const g of [L.wall, L.window, L.spider, L.winFront, L.props, wallPaper, PAR.dofW && PAR.dofW.img]) if (g) { if (back) g.setAttribute('transform', back); else g.removeAttribute('transform'); } }
    if (front !== PAR.front) { PAR.front = front; for (const g of [L.lamps, L.light]) { if (front) g.setAttribute('transform', front); else g.removeAttribute('transform'); } }
  }
  /* where each plane sits right now, for the light pass */
  const parBack = () => (TOUCH_M ? [0, 0] : [-PAR.x * 4, -PAR.y * 2.5]);
  const parFront = () => (TOUCH_M ? [0, 0] : [PAR.x * 9, PAR.y * 5]);

  /* ---------- screen lifecycle ---------- */
  let lastFrame = -1;
  const idleT = { next: 0 };
  function schedule(t) {
    ev.bonk = t + 8; ev.peek = t + 30; idleT.next = t + 2;
    V.nextPoke = t + 15; WK.next = t + 22;
  }
  App.register('menu', {
    enter() {
      active = true; root.style.display = ''; nav.hidden = false;
      now = performance.now() / 1000;
      schedule(now);
    },
    started() { schedule(now || performance.now() / 1000); },
    shown() { focusItem(sel, false); items[sel].focus({ preventScroll: true }); },
    exit() { active = false; root.style.display = 'none'; nav.hidden = true; nav.classList.remove('dark'); menuFocus = null; particles.clear(); },
    update(t, dt) {
      now = t;
      if (App.running && !App.busy) {
        villainTick(t);
        walkerTick(t, dt);
        if (t > ev.peek) { if (A.settings.scares) spiderPeek(); ev.peek = t + rand(26, 38); }
        if (t > idleT.next) { pick(IDLE)(); idleT.next = t + rand(2.6, 4.4); }
      }
      const cursorFresh = t - cursor.moved < 1.6;
      for (const toon of cast) {
        if (toon !== wire && toon.lane === 'front') attend(toon, t, dt, cursorFresh);
        else if (toon === wire && toon.hovered && cursorFresh && V.st === 'lurk') toon.attn = [cursor.x, cursor.y];
        /* the walkers are only drawn while they're out on the bench */
        if (toon.lane === 'back') {
          const out = WK.st !== 'off';
          if (out !== toon.shown) { toon.root.style.display = out ? '' : 'none'; toon.shown = out; }
          if (!out) continue;
        }
        toon.update(t, dt);
      }
      spider.update(dt, t);
      if (App.running) collide(t);
      particles.update(dt);
      const f = Math.floor(t * 24);
      if (f === lastFrame) return;
      lastFrame = f;

      const black = t > ev.black0 && t < ev.black1;
      const stutter = black && Math.random() < 0.1;
      nav.classList.toggle('dark', black && !stutter);
      /* with the GPU pass on, the room's light is real light (js/gfx.js) and the
         painted-on pools and glows step aside */
      const gl = !!(G && G.on);
      /* the camera drifts, slow as breathing; the sign's buttons ride along */
      /* (one compositor transform via App.camera: the stage, the light pass and the
         buttons move together, and nothing is re-rasterized. Never less zoom than
         the pan needs, so no edge of the room ever shows.) */
      const drift = gl && !REDUCE_M && App.current === 'menu';
      parallax(cursorFresh, drift);
      /* the music: the theremin while the Phantom is on the prowl, strings in the
       blackout, a sleepy pad once nobody's touched anything for a while */
      if (A.mood && App.running) A.mood({ danger: black ? 1 : 0, phantom: V.st !== 'lurk' && !black ? 0.8 : 0, idle: !black && t - cursor.moved > 20 ? 0.5 : 0 });
      /* depth of field (High, phones too): the back wall and the night outside a
         touch soft, so the cast reads in front of them. A once-baked blurred
         bitmap (GFX.dof), never a live filter */
      const dof = gl && G.q === 'high';
      if (dof !== PAR.dof) { PAR.dof = dof; if (!PAR.dofW && dof && G.dof) { PAR.dofW = G.dof([L.wall, L.window], { x: 0, y: 0, w: 1280, h: 480 }); PAR.back = null; } if (PAR.dofW) PAR.dofW.set(dof); }
      const [pfx, pfy] = parFront(), [pbx, pby] = parBack();
      if (drift) App.camera(1.02 + 0.006 * Math.sin(t * 0.21), 4.5 * Math.sin(t * 0.13) + (TOUCH_M ? PAR.x * 4 : 0), 2 * Math.sin(t * 0.17 + 1) + (TOUCH_M ? PAR.y * 2.5 : 0));
      else if (App.current === 'menu') App.camera();
      if (gl) { G.clear(); G.ambient(black ? [0.15, 0.15, 0.2] : [0.72, 0.68, 0.64]); }
      lamps.forEach((l, i) => {
        const acc = -9.8 / 2.2 * Math.sin(l.th) - 0.8 * l.w + 0.25 * Math.sin(t * 0.6 + l.phase);
        l.w += acc / 24; l.th += l.w / 24;
        const tr = `translate(${l.x},60) rotate(${R(l.th * 57.3)})`;
        l.g.setAttribute('transform', tr); l.coneG.setAttribute('transform', tr);
        const on = black && !stutter ? 0 : 1;
        l.cone.setAttribute('opacity', on);
        /* on a phone the GPU spot draws the beam; the SVG one (a big screen-blended
           shape re-rasterized every frame as the lamp swings) steps aside */
        l.coneG.style.display = gl && G.touch ? 'none' : '';
        l.bulbE.setAttribute('fill', on ? '#fff4c8' : '#5a4a30');
        pools[i].setAttribute('opacity', gl ? 0 : on);
        benchPools[i].setAttribute('opacity', gl ? 0 : on);
        benchPools[i].setAttribute('cx', R(l.x + Math.sin(l.th) * 460));
        if (gl && on) {
          /* the shade throws a spot down its own axis, so the pool swings with it:
             a cone from a point just behind the shade, the hot spot where it meets
             the bench, and bloom round the bulb itself */
          const sn = Math.sin(l.th), cs = Math.cos(l.th), dir = [-sn, cs];
          G.cone(l.x + sn * 64 + pfx, 60 - cs * 64 + pfy, 900, [0.5, 0.42, 0.3], dir, 0.95, 0.83);
          G.light(l.x - sn * (462 / cs), 528, 270, 62, [0.3, 0.25, 0.17]);
          G.glow(l.x - sn * 38 + pfx, 60 + cs * 38 + pfy, 64, [1, 0.93, 0.75], 1.5);
        }
      });
      darkRect.setAttribute('opacity', black ? (stutter ? 0.55 : gl ? 0.9 : 0.97) : 0);
      const [blx, bly] = bulb.world(0, -150);
      const lit = black ? clamp(bulb.p.glow) : 0;
      sa(bulbLight, { cx: R(blx), cy: R(bly + 40), opacity: gl ? 0 : R(clamp(bulb.p.glow - 0.15) * 70) / 100 });
      sa(darkBulb, { cx: R(blx), cy: R(bly), opacity: gl ? 0 : R(lit * 85) / 100 });
      bulbLit.setAttribute('opacity', R(lit * 100) / 100);
      if (gl) {
        /* a lit bulb really lights the room round it, with bloom at the glass */
        const bg = clamp(bulb.p.glow - 0.1, 0, 1.4);
        G.light(blx, bly + 30, 430, 360, [0.62 * bg, 0.5 * bg, 0.3 * bg]);
        G.glow(blx, bly, 130, [1, 0.9, 0.62], 1.7 * bg);
        /* moonlight through the window, the title's red neon, the sign's chase
           lights and the radio dial */
        G.light(185 + pbx, 200 + pby, 380, 320, black ? [0.2, 0.25, 0.44] : [0.1, 0.12, 0.22]);
        if (!black) {
          const neon = t < ev.panicOff && f % 2 === 0 ? 0.15 : 1;
          G.light(640, 142, 330, 120, [0.42 * neon, 0.09 * neon, 0.05 * neon]);
          G.light(640, 300, 220, 130, [0.16, 0.13, 0.08]);
          G.glow(132, 376, 34, [1, 0.72, 0.3], 0.7);
        }
        /* soft contact shadows under everybody standing on the bench */
        for (const c of [bulb, outlet, meter, board, fuse, sw]) if (!c.root.style.display) G.shadowOf(c, 0.42, c.cfg.x < 640 ? LAMPX[0] : LAMPX[1]);
      }
      for (const de of darkEyes) {
        const c = de.c, F = c.cfg.face;
        if (!black || (c === bulb && lit > 0.5) || !onStage(c)) { de.g.setAttribute('opacity', 0); continue; }
        de.g.setAttribute('opacity', 1);
        const blinkNow = (f + Math.floor(c.phase * 10)) % 40 < 2;
        const turn = clamp(c.p.turn, -1, 1);
        [-1, 1].forEach((s, i) => {
          const [ex, ey] = c.world(F.x + turn * F.turnShift + s * F.spacing, F.y + c.p.faceY);
          const scared = c === wire ? 1 : 1.15;
          const rx = F.rx * c.cfg.scale * scared, ry = F.ry * c.cfg.scale * scared * (blinkNow ? 0.12 : 1);
          const jit = c === wire ? 0 : rand(-0.6, 0.6);
          sa(de.e[i].w, { cx: R(ex + jit), cy: R(ey), rx: R(rx), ry: R(ry) });
          sa(de.e[i].p, { cx: R(ex + jit + clamp(c.p.lookX, -1, 1) * rx * 0.4), cy: R(ey + clamp(c.p.lookY, -1, 1) * ry * 0.35), rx: R(rx * (c === wire ? 0.2 : 0.32)), ry: R(ry * (c === wire ? 0.18 : 0.36)) });
        });
        /* in the dark the eyes glow: the Phantom's pinpricks burn yellow, the
           others' whites just catch enough light to show a little face */
        if (gl && !stutter) {
          const [mx, my] = c.world(F.x + turn * F.turnShift, F.y + c.p.faceY), sc = c.cfg.scale;
          if (c === wire) G.glow(mx, my, F.spacing * sc * 3.2, [1, 0.78, 0.3], 2.6);
          else G.glow(mx, my, F.spacing * sc * 3.4, [0.95, 0.92, 0.82], 1.05);
        }
      }
      const [wx, wy] = wire.world(0, -104);
      stars.forEach((s, i) => {
        if (wire.p.dizzy < 0.4) { s.setAttribute('opacity', 0); return; }
        const a = t * 5 + (i * Math.PI * 2) / 3;
        s.setAttribute('opacity', black ? 0 : 1);
        s.setAttribute('transform', `translate(${R(wx + Math.cos(a) * 46)},${R(wy + Math.sin(a) * 12)}) rotate(${R(t * 200)})`);
      });
      for (const pr of PROPS) {
        const u = (t - pr.wob) / 0.5;
        pr.g.setAttribute('transform', u >= 0 && u < 1 ? `rotate(${R(Math.sin(u * 20) * 14 * (1 - u))} ${pr.x} ${pr.y + pr.r})` : '');
      }
      peg.setAttribute('transform', t < ev.rattle ? `translate(${R(rand(-1.8, 1.8))},${R(rand(-1, 1))})` : '');
      title.setAttribute('transform', `rotate(${R(Math.sin(t * 0.8) * 0.7)} 640 130) translate(0,${R(Math.sin(t * 1.7) * 2)})`);
      if (App.boil) title.setAttribute('filter', `url(#boilT${Math.floor(t * 12) % 3})`); else title.removeAttribute('filter');
      const off = t < ev.panicOff && f % 2 === 0;
      panicOn.setAttribute('opacity', off ? 0 : 1);
      bolts.forEach((b, i) => b.setAttribute('opacity', off ? 0.3 : (Math.floor(t * 3 + i) % 5 === 0 ? 0.55 : 1)));
      flash.setAttribute('opacity', R(Math.max(0, 0.6 - (t - ev.flash) * 3) * 100) / 100);
      const speed = menuFocus ? 14 : 8;
      chase.forEach((c, i) => {
        const on = black ? false : (i + Math.floor(t * speed)) % 3 === 0;
        if (on !== c.on) { c.on = on; c.b.setAttribute('fill', on ? '#fff1b0' : '#6b4a22'); c.glow.setAttribute('opacity', on ? 0.85 : 0); }
      });
      const beat = A.beat(), hit = Math.pow(Math.max(0, Math.cos((beat % 1) * Math.PI * 2)), 6);
      cloth.setAttribute('transform', `translate(132,340) scale(${R((1 + hit * 0.05) * 100) / 100}) translate(-132,-340)`);
      dial.setAttribute('fill', black ? '#6a5530' : '#ffd47a');
    },
  });

  window.CircuitMenu = { cast, K, play, bonk: peerBonk, shortOut, peek: spiderPeek, poke: startPoke, walk: () => startWalk(now), V, WK, PLANS, LURK, ev, impacts };
})();
