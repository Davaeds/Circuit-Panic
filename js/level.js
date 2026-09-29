/* Circuit Panic! — Level 1, "Flip the Switch".
   The same late-night workshop as the menu. On the left the house's service panel
   hangs on the plank wall, fed by a conduit from the ceiling; in the middle, under
   the green shop lamp, the practice board carries a steel device box with the
   nervous switch standing in it, and a porcelain lampholder with the bulb on top.
   Off to the right there's a hole in the plaster, and the bench in front is the
   stage anyone walks on along. The player runs real, sagging cables between
   binding screws, wraps them clockwise, pigtails doubled screws with a wire nut,
   grounds the switch box, tests for voltage with a neon pen, and calls in the
   Inspector, who traces the job terminal by terminal.
   The rule for everything that happens: circuit.js decides what physically
   happens (does the bulb light, does the breaker trip, is that metal live, where
   exactly is the mistake), and this file only exaggerates that outcome for
   comedy. */
(function () {
  'use strict';
  const T = window.Toons, A = window.AudioSys, App = window.App, C = window.Circuit, { Particles } = window.FX;
  const { el, sa, R, rand, pick, clamp, INK } = T;
  const svg = App.svg;
  const BR = '#3a2414';
  const easeOutBack = u => 1 + 2.4 * Math.pow(u - 1, 3) + 1.4 * Math.pow(u - 1, 2);

  const LEVEL = {
    id: 1, name: 'Flip the Switch', goal: 'switch', par: 4, requireGround: true,
    objective: 'Wire the panel, switch and bulb so the switch turns the bulb ON and OFF, and ground the switch box.',
    components: [{ id: 'P', type: 'source' }, { id: 'S1', type: 'sp' }, { id: 'L1', type: 'bulb' }],
    names: {
      'P.hot': 'the panel HOT', 'P.neu': 'the panel NEUTRAL bar', 'P.gnd': 'the panel GROUND bar',
      'S1.a': 'the switch\'s left brass screw', 'S1.b': 'the switch\'s right brass screw', 'S1.g': 'the switch box\'s green GROUND screw',
      'L1.brass': 'the lampholder\'s BRASS screw', 'L1.silver': 'the lampholder\'s SILVER screw',
    },
    winText: 'The switch breaks the hot, the hot lands on brass, the neutral comes home on silver, and the box is grounded. Textbook.',
    hints: [
      'Power leaves the panel on the HOT screw and comes home on the NEUTRAL bar. Everything in between is the path.',
      'A switch is a gate in the HOT wire. Run a wire from the panel\'s HOT to one of my switch buddy\'s screws.',
      'From the switch\'s other screw, go to my BRASS screw. Brass is for hot!',
      'My SILVER screw goes back to the panel\'s NEUTRAL bar. That closes the loop.',
      'Don\'t forget the ground: a GREEN wire from the panel\'s GROUND bar to the green screw on the switch box. It carries no current unless something goes wrong.',
      'Then flip the breaker ON and try the switch. Gently. Please.',
    ],
  };
  const COLOR_NAME = { '#1c1c1e': 'black', '#f1ead8': 'white', '#c7322b': 'red', '#3f8a4c': 'green' };
  /* touch screens get bigger targets and a stronger pull toward screws */
  const TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  const HIT = TOUCH ? 44 : 30, SNAP = TOUCH ? 72 : 48;

  App.defs.insertAdjacentHTML('beforeend', `
    <linearGradient id="gPly" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c38c"/><stop offset=".55" stop-color="#d6aa6e"/><stop offset="1" stop-color="#b98a55"/></linearGradient>
    <linearGradient id="gCab" x1="0" x2="1"><stop offset="0" stop-color="#6f7376"/><stop offset=".28" stop-color="#b4b8bb"/><stop offset=".62" stop-color="#9a9ea1"/><stop offset="1" stop-color="#606467"/></linearGradient>
    <linearGradient id="gCabIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16171a"/><stop offset=".22" stop-color="#26282c"/><stop offset="1" stop-color="#34373c"/></linearGradient>
    <linearGradient id="gDoor" x1="0" x2="1"><stop offset="0" stop-color="#55595c"/><stop offset="1" stop-color="#8d9194"/></linearGradient>
    <linearGradient id="gGalv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fa4a8"/><stop offset=".42" stop-color="#d9dcde"/><stop offset="1" stop-color="#767b7f"/></linearGradient>
    <linearGradient id="gBakelite" x1="0" x2="1"><stop offset="0" stop-color="#0e0e10"/><stop offset=".35" stop-color="#303036"/><stop offset="1" stop-color="#0a0a0c"/></linearGradient>
    <linearGradient id="gHandle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf4de"/><stop offset=".55" stop-color="#e6d6b2"/><stop offset="1" stop-color="#b7a178"/></linearGradient>
    <radialGradient id="gJewelOn" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#fff4cc"/><stop offset=".32" stop-color="#ff7a48"/><stop offset="1" stop-color="#b0160b"/></radialGradient>
    <radialGradient id="gJewelOff" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#8e4d42"/><stop offset=".5" stop-color="#4a1712"/><stop offset="1" stop-color="#220705"/></radialGradient>
    <radialGradient id="gRedGlow"><stop offset="0" stop-color="#ff9a6a" stop-opacity=".85"/><stop offset=".45" stop-color="#ff6a3a" stop-opacity=".3"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gNeon"><stop offset="0" stop-color="#ffd0a0" stop-opacity=".95"/><stop offset=".4" stop-color="#ff7a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff5a10" stop-opacity="0"/></radialGradient>
    <radialGradient id="gPorc" cx="38%" cy="28%" r="85%"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eee7d8"/><stop offset="1" stop-color="#b4ab98"/></radialGradient>
    <radialGradient id="gScrewBrass" cx="35%" cy="32%"><stop offset="0" stop-color="#fff3b8"/><stop offset=".5" stop-color="#d9a93e"/><stop offset="1" stop-color="#6e4a10"/></radialGradient>
    <radialGradient id="gScrewSilver" cx="35%" cy="32%"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b9b6ae"/><stop offset="1" stop-color="#55524c"/></radialGradient>
    <radialGradient id="gScrewDark" cx="35%" cy="32%"><stop offset="0" stop-color="#9a9a9a"/><stop offset=".45" stop-color="#3a3a3a"/><stop offset="1" stop-color="#0e0e0e"/></radialGradient>
    <radialGradient id="gScrewGreen" cx="35%" cy="32%"><stop offset="0" stop-color="#c8f0c0"/><stop offset=".5" stop-color="#3f9a4a"/><stop offset="1" stop-color="#1a4a22"/></radialGradient>
    <linearGradient id="gGndBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c79a"/><stop offset=".5" stop-color="#c98a4e"/><stop offset="1" stop-color="#8a5226"/></linearGradient>
    <filter id="xray" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 .9  0 0 0 1 0"/></filter>
    <linearGradient id="gNut" x1="0" x2="1"><stop offset="0" stop-color="#b85a10"/><stop offset=".4" stop-color="#ffab4a"/><stop offset="1" stop-color="#a84a08"/></linearGradient>
    <linearGradient id="gPen" x1="0" x2="1"><stop offset="0" stop-color="#b9862c"/><stop offset=".4" stop-color="#ffe6a0"/><stop offset="1" stop-color="#a8761c"/></linearGradient>
    <radialGradient id="gRoomDark" cx="50%" cy="40%" r="72%"><stop offset=".5" stop-color="#0a0503" stop-opacity="0"/><stop offset="1" stop-color="#0a0503" stop-opacity=".62"/></radialGradient>
    <radialGradient id="gSoot"><stop offset="0" stop-color="#0d0806" stop-opacity=".9"/><stop offset=".55" stop-color="#1a0f0a" stop-opacity=".45"/><stop offset="1" stop-color="#1a0f0a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gWarm"><stop offset="0" stop-color="#ffe49a" stop-opacity=".75"/><stop offset=".4" stop-color="#ffc85a" stop-opacity=".3"/><stop offset="1" stop-color="#ff9a20" stop-opacity="0"/></radialGradient>
    <pattern id="spangle" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M4,6 L16,2 L22,12 L10,18 Z M26,24 L40,22 L42,36 L30,40 Z M6,30 L14,28 L18,40 L4,42 Z" fill="#ffffff" opacity=".16"/><path d="M28,4 L38,8 L34,16 L24,14 Z M18,20 L26,22 L22,30 Z" fill="#000000" opacity=".07"/></pattern>
    <clipPath id="phClip"><rect x="-40" y="-40" width="1400" height="484"/><rect x="-40" y="-40" width="1190" height="800"/><path d="M1168,462 L1186,448 L1204,456 L1222,444 L1240,460 L1250,480 L1242,504 L1222,516 L1202,510 L1182,516 L1166,500 L1162,480 Z"/></clipPath>
  `);

  const root = el('g', { id: 'levelRoot', style: 'display:none' }, svg);
  const shakeG = el('g', {}, root);
  const L = {};
  /* depth, back to front: the wall and its hardware, the cables, the characters
     who live on the board, the screw heads, then anything standing or reaching in
     the room in front of the wall (the Phantom, the Inspector on the bench), then
     the player's own hand-held tools, the light and the effects */
  ['wall', 'board', 'bench', 'parts', 'holder', 'tags', 'soot', 'wshadow', 'plates', 'wires', 'nuts', 'cast', 'terms', 'phantom', 'fore', 'drag', 'ui', 'lamp', 'light', 'dark', 'fx', 'bubble', 'flash'].forEach(n => { L[n] = el('g', {}, shakeG); });
  ['board', 'bench', 'parts', 'holder', 'tags'].forEach(n => L[n].setAttribute('filter', 'url(#inkOnly)'));
  L.phantom.setAttribute('clip-path', 'url(#phClip)');
  /* light, effects, the blackout and the talk never swallow clicks */
  ['soot', 'wshadow', 'lamp', 'light', 'dark', 'fx', 'bubble', 'flash'].forEach(n => L[n].setAttribute('pointer-events', 'none'));

  /* scene clock, advanced by update() */
  let now = 0;
  const ev = { flash: -9, shake: -9, black0: -9, black1: -9, arc: -9, arcA: null, arcB: null, pilot: -9, soot: -9, sootOn: false, cord0: -9, cord1: -9, kick: -9, tripT: -9, dip: -9 };
  const wait = s => new Promise(r => setTimeout(r, s * 1000));

  /* ---------- the workshop wall ---------- */
  el('rect', { x: -20, y: -20, width: 1320, height: 620, fill: 'url(#gWallB)' }, L.wall);
  const planks = [];
  for (let x = 0; x <= 1280; x += 58) planks.push(`M${x},26 V600`);
  el('path', { d: planks.join(' '), stroke: '#2a180e', 'stroke-width': 2.5, opacity: 0.35 }, L.wall);
  for (let i = 0; i < 10; i++) el('ellipse', { cx: i % 2 ? rand(8, 50) : rand(1234, 1272), cy: rand(60, 530), rx: rand(3, 6), ry: rand(6, 11), fill: 'none', stroke: '#2a180e', 'stroke-width': 1.5, opacity: 0.3 }, L.wall);
  const lampPool = el('ellipse', { cx: 640, cy: 40, rx: 660, ry: 620, fill: 'url(#gLampPool)' }, L.wall);
  el('rect', { x: -20, y: -20, width: 1320, height: 46, fill: '#2e1c10' }, L.wall);
  el('path', { d: 'M-20,26 H1300', stroke: INK, 'stroke-width': 4 }, L.wall);
  for (let x = 40; x < 1280; x += 160) el('rect', { x, y: -10, width: 26, height: 48, fill: '#3a2414', stroke: INK, 'stroke-width': 3 }, L.wall);
  el('rect', { x: 380, y: 138, width: 776, height: 396, rx: 10, fill: '#140904', opacity: 0.55, filter: 'url(#bigBlur)' }, L.wall);
  /* the right-hand strip of wall: a coil of spare cable on a nail, and a hole
     punched through the plaster low down, where something lives */
  const HOLE = { x: 1206, y: 486 };
  el('path', { d: 'M1168,462 L1186,448 L1204,456 L1222,444 L1240,460 L1250,480 L1242,504 L1222,516 L1202,510 L1182,516 L1166,500 L1162,480 Z', fill: 'url(#gHole)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.wall);
  el('path', { d: 'M1176,474 L1192,468 M1212,466 L1230,474 M1186,498 L1206,502', stroke: '#6a4a36', 'stroke-width': 3, opacity: 0.7 }, L.wall);
  el('path', { d: 'M1168,462 L1150,448 L1140,452 M1250,480 L1268,470 L1278,476 M1222,444 L1228,424 L1240,418 M1182,516 L1172,526', fill: 'none', stroke: '#2a180e', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, L.wall);
  for (const [cx, cy, r] of [[1160, 530, 5], [1178, 536, 3.5], [1246, 532, 4]]) el('path', { d: `M${cx - r},${cy} L${cx},${cy - r} L${cx + r * 1.2},${cy - r * 0.2} L${cx + r * 0.6},${cy + r * 0.5} Z`, fill: '#c9b28c', stroke: BR, 'stroke-width': 1.6 }, L.wall);
  /* and a second, smaller hole punched through right beside the panel, just
     about an arm's reach from the breaker */
  const HOLE2 = { x: 335, y: 262 };
  el('path', { d: 'M316,232 L328,222 L342,229 L356,222 L362,244 L356,264 L362,284 L348,294 L332,288 L316,294 L308,272 L312,250 Z', fill: 'url(#gHole)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.wall);
  el('path', { d: 'M322,246 L336,240 M332,276 L348,280', stroke: '#6a4a36', 'stroke-width': 2.5, opacity: 0.7 }, L.wall);
  el('path', { d: 'M328,222 L326,204 L334,196 M348,294 L352,312 M316,294 L310,306', fill: 'none', stroke: '#2a180e', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, L.wall);
  el('circle', { cx: 1206, cy: 176, r: 4, fill: '#9a9a9a', stroke: INK, 'stroke-width': 2 }, L.wall);
  for (let i = 0; i < 4; i++) {
    const rx = 34 - i * 2, ry = 58 - i * 3, cy = 238 + i * 3;
    el('ellipse', { cx: 1206 + i * 1.5, cy, rx, ry, fill: 'none', stroke: INK, 'stroke-width': 9 }, L.wall);
    el('ellipse', { cx: 1206 + i * 1.5, cy, rx, ry, fill: 'none', stroke: '#2c2c31', 'stroke-width': 5.5 }, L.wall);
  }
  el('path', { d: 'M1178,214 Q1190,190 1210,188', fill: 'none', stroke: '#9696a0', 'stroke-width': 2, opacity: 0.7 }, L.wall);
  el('path', { d: 'M1234,286 Q1250,330 1244,366 L1246,376', fill: 'none', stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round' }, L.wall);
  el('path', { d: 'M1234,286 Q1250,330 1244,366', fill: 'none', stroke: '#2c2c31', 'stroke-width': 5.5, 'stroke-linecap': 'round' }, L.wall);
  el('path', { d: 'M1244,366 L1246,378', stroke: '#d98a4a', 'stroke-width': 3, 'stroke-linecap': 'round' }, L.wall);

  /* ---------- the practice board: a sheet of plywood screwed to the wall ---------- */
  const BD = { x0: 360, y0: 118, x1: 1130, y1: 512 };
  el('path', { d: `M${BD.x1},${BD.y0 + 2} L${BD.x1 + 14},${BD.y0 + 12} L${BD.x1 + 14},${BD.y1 + 12} L${BD.x0 + 14},${BD.y1 + 12} L${BD.x0},${BD.y1} L${BD.x1},${BD.y1} Z`, fill: '#94643a', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.board);
  el('path', { d: `M${BD.x0 + 10},${BD.y1 + 5} H${BD.x1 + 8} M${BD.x0 + 14},${BD.y1 + 8.5} H${BD.x1 + 11} M${BD.x1 + 5},${BD.y0 + 14} V${BD.y1 + 4} M${BD.x1 + 9},${BD.y0 + 16} V${BD.y1 + 7}`, stroke: '#5e3a1c', 'stroke-width': 1.4, opacity: 0.8 }, L.board);
  el('rect', { x: BD.x0, y: BD.y0, width: BD.x1 - BD.x0, height: BD.y1 - BD.y0, rx: 5, fill: 'url(#gPly)', stroke: INK, 'stroke-width': 5 }, L.board);
  const grainB = [];
  for (let i = 0; i < 12; i++) { const y = BD.y0 + 16 + i * 32 + rand(-6, 6); grainB.push(`M${BD.x0 + 4},${R(y)} C${R(rand(500, 650))},${R(y + rand(-12, 12))} ${R(rand(800, 950))},${R(y + rand(-12, 12))} ${BD.x1 - 4},${R(y + rand(-8, 8))}`); }
  el('path', { d: grainB.join(' '), fill: 'none', stroke: '#a87a45', 'stroke-width': 2, opacity: 0.45 }, L.board);
  for (const [cx, cy, rx] of [[470, 460, 16], [1050, 176, 12], [820, 420, 9]]) el('ellipse', { cx, cy, rx, ry: rx * 0.45, fill: 'none', stroke: '#a3713e', 'stroke-width': 2, opacity: 0.5 }, L.board);
  el('rect', { x: BD.x0 + 14, y: BD.y0 + 14, width: BD.x1 - BD.x0 - 28, height: BD.y1 - BD.y0 - 28, rx: 4, fill: 'none', stroke: '#a3261c', 'stroke-width': 2.5, opacity: 0.35, 'stroke-dasharray': '26 8 4 8' }, L.board);
  for (const [x, y] of [[BD.x0 + 22, BD.y0 + 22], [BD.x1 - 22, BD.y0 + 22], [BD.x0 + 22, BD.y1 - 22], [BD.x1 - 22, BD.y1 - 22]]) {
    el('circle', { cx: x, cy: y, r: 9, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 2.5 }, L.board);
    el('path', { d: `M${x - 5},${y - 3} L${x + 5},${y + 3}`, stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, L.board);
  }
  el('text', { x: 860, y: 158, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 19, 'letter-spacing': 3, fill: '#7d4f24', opacity: 0.6 }, L.board).textContent = 'PRACTICE BOARD No. 1';
  el('path', { d: 'M752,166 H968', stroke: '#7d4f24', 'stroke-width': 2, opacity: 0.4, 'stroke-dasharray': '10 6' }, L.board);

  /* ---------- the bench in front, with a few things left lying about ---------- */
  el('path', { d: 'M24,548 H1256 L1280,600 H0 Z', fill: 'url(#gBenchTop)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, L.bench);
  const grainT = [];
  for (let i = 0; i < 5; i++) { const y = 556 + i * 9; grainT.push(`M${R(rand(10, 200))},${y} C${R(rand(300, 500))},${R(y + rand(-3, 3))} ${R(rand(700, 900))},${R(y + rand(-3, 3))} ${R(rand(1080, 1270))},${y}`); }
  el('path', { d: grainT.join(' '), fill: 'none', stroke: '#6a3f1f', 'stroke-width': 1.6, opacity: 0.4 }, L.bench);
  el('rect', { x: -5, y: 600, width: 1290, height: 26, fill: '#7a4a26', stroke: INK, 'stroke-width': 4 }, L.bench);
  el('path', { d: 'M0,606 H1280', stroke: '#c79566', 'stroke-width': 3, opacity: 0.6 }, L.bench);
  el('rect', { x: -5, y: 626, width: 1290, height: 110, fill: 'url(#gBenchFront)', stroke: INK, 'stroke-width': 4 }, L.bench);
  /* the props keep to the left end: the rest of the bench is a clear lane for
     anyone walking on */
  const spool = el('g', { transform: 'translate(-56,0)' }, L.bench);
  el('ellipse', { cx: 150, cy: 590, rx: 32, ry: 9, fill: '#6a4428', stroke: INK, 'stroke-width': 3 }, spool);
  el('rect', { x: 126, y: 564, width: 48, height: 26, fill: '#c7322b', stroke: INK, 'stroke-width': 3 }, spool);
  el('path', { d: 'M126,570 Q150,574 174,570 M126,576 Q150,580 174,576 M126,582 Q150,586 174,582', fill: 'none', stroke: '#7a1c14', 'stroke-width': 1.6, opacity: 0.8 }, spool);
  el('path', { d: 'M132,566 V588', stroke: '#ff9a84', 'stroke-width': 2.4, opacity: 0.6 }, spool);
  el('ellipse', { cx: 150, cy: 562, rx: 32, ry: 9, fill: '#8a5a30', stroke: INK, 'stroke-width': 3 }, spool);
  el('ellipse', { cx: 150, cy: 562, rx: 9, ry: 3, fill: '#3a2414' }, spool);
  el('path', { d: 'M174,574 C196,578 204,592 232,590 C246,589 250,584 258,586', fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, spool);
  el('path', { d: 'M174,574 C196,578 204,592 232,590 C246,589 250,584 258,586', fill: 'none', stroke: '#c7322b', 'stroke-width': 3, 'stroke-linecap': 'round' }, spool);
  el('path', { d: 'M258,586 L266,588', stroke: '#d98a4a', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, spool);
  const drv = el('g', { transform: 'translate(-46,2)' }, L.bench);
  el('path', { d: 'M318,588 L372,582', stroke: '#9a9a9a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, drv);
  el('path', { d: 'M318,588 L372,582', stroke: INK, 'stroke-width': 1, opacity: 0.4 }, drv);
  el('rect', { x: 368, y: 574, width: 44, height: 15, rx: 7, fill: '#d0983a', stroke: INK, 'stroke-width': 2.8, transform: 'rotate(-6 390 581)' }, drv);
  const pl = el('g', { transform: 'translate(430,588) rotate(-8)' }, L.bench);
  el('path', { d: 'M-40,-3 L0,-2 L0,3 L-40,4 Z', fill: '#8c8f94', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, pl);
  el('path', { d: 'M0,-2 C20,-8 44,-12 66,-12 Q70,-6 66,-4 C44,-3 20,2 4,4 Z', fill: '#c7322b', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, pl);
  el('path', { d: 'M2,2 C22,6 44,12 64,14 Q66,8 62,6 C42,3 22,-1 2,-2 Z', fill: '#b02a22', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, pl);
  el('circle', { cx: 0, cy: 0, r: 4.5, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2 }, pl);
  const jar = el('g', { transform: 'translate(-590,0)' }, L.bench);
  el('path', { d: 'M1128,596 V560 Q1128,554 1134,554 H1170 Q1176,554 1176,560 V596 Z', fill: '#cfe3e0', opacity: 0.55, stroke: BR, 'stroke-width': 3 }, jar);
  for (let i = 0; i < 8; i++) el('path', { d: `M${1134 + (i % 4) * 10},${592 - Math.floor(i / 4) * 12} l5,-10 l5,10 Z`, fill: pick(['#f28c1c', '#f2d21c', '#d8342a']), stroke: BR, 'stroke-width': 1.2 }, jar);
  el('rect', { x: 1124, y: 546, width: 56, height: 10, rx: 2, fill: '#a0998a', stroke: BR, 'stroke-width': 2.5 }, jar);

  /* little paper labels, tacked on */
  function tag(x, y, text, rot = 0, g = L.tags) {
    const w = text.length * 8.6 + 18;
    const t = el('g', { transform: `translate(${x},${y}) rotate(${rot})` }, g);
    el('rect', { x: -w / 2, y: -11, width: w, height: 22, rx: 2, fill: '#f3e6c4', stroke: BR, 'stroke-width': 2 }, t);
    el('text', { x: 3, y: 5.5, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 14, fill: '#3a2414' }, t).textContent = text;
    el('circle', { cx: -w / 2 + 6, cy: -2, r: 2.6, fill: '#c7322b', stroke: BR, 'stroke-width': 1 }, t);
    return t;
  }

  /* ---------- the service panel: riveted steel, door swung open, on the bare
     wall and fed from above by a steel conduit ---------- */
  const PX = -26, PY = -20;
  const panel = el('g', { transform: `translate(${PX},${PY})` }, L.parts);
  el('rect', { x: 104, y: 158, width: 244, height: 366, rx: 12, fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, panel);
  el('rect', { x: 206, y: 36, width: 20, height: 116, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3.5 }, panel);
  el('path', { d: 'M211,40 V146', stroke: '#f2f2ee', 'stroke-width': 2, opacity: 0.6 }, panel);
  el('rect', { x: 201, y: 92, width: 30, height: 14, rx: 2, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, panel);
  el('path', { d: 'M196,70 H206 M226,70 H236 M206,62 Q216,56 226,62 V78 Q216,84 206,78 Z', fill: '#8c8f94', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, panel);
  for (const x of [193, 239]) el('circle', { cx: x, cy: 70, r: 3.4, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.4 }, panel);
  el('path', { d: 'M200,140 H232 L236,148 H196 Z', fill: '#6c6f72', stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M96,152 L36,178 L36,484 L96,508 Z', fill: 'url(#gDoor)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M86,174 L46,190 L46,470 L86,488 Z', fill: '#9a9ea1', opacity: 0.55, stroke: INK, 'stroke-width': 2 }, panel);
  el('rect', { x: 38, y: 300, width: 10, height: 36, rx: 4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, panel);
  el('rect', { x: 96, y: 148, width: 240, height: 364, rx: 10, fill: 'url(#gCab)', stroke: INK, 'stroke-width': 5 }, panel);
  el('path', { d: 'M104,160 V500', stroke: '#e3e6e8', 'stroke-width': 3, opacity: 0.55, 'stroke-linecap': 'round' }, panel);
  for (const x of [105, 327]) for (let y = 170; y <= 496; y += 41) el('circle', { cx: x, cy: y, r: 3.2, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.4 }, panel);
  el('rect', { x: 114, y: 166, width: 204, height: 328, rx: 5, fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, panel);
  el('path', { d: 'M118,172 H314', stroke: '#000', 'stroke-width': 8, opacity: 0.3 }, panel);
  el('rect', { x: 134, y: 176, width: 164, height: 26, rx: 3, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 2.5 }, panel);
  el('text', { x: 216, y: 194, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 13.5, fill: INK, 'letter-spacing': 1 }, panel).textContent = 'SERVICE PANEL';
  for (const x of [141, 291]) el('circle', { cx: x, cy: 189, r: 2.4, fill: '#7a5a1a', stroke: INK, 'stroke-width': 1 }, panel);
  el('path', { d: 'M206,316 V330 H284', fill: 'none', stroke: INK, 'stroke-width': 12, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M206,316 V330 H284', fill: 'none', stroke: '#c8743a', 'stroke-width': 7, 'stroke-linejoin': 'round' }, panel);
  el('path', { d: 'M204,318 V328 H284', fill: 'none', stroke: '#f2b27a', 'stroke-width': 1.8, opacity: 0.8 }, panel);
  el('rect', { x: 280, y: 314, width: 40, height: 32, rx: 4, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, panel);
  const dir = el('g', { transform: 'rotate(-2 190 372)' }, panel);
  el('rect', { x: 134, y: 348, width: 108, height: 52, rx: 2, fill: '#efe3c2', stroke: INK, 'stroke-width': 2 }, dir);
  el('path', { d: 'M140,362 H236 M140,376 H236 M140,390 H236', stroke: '#9ab0c8', 'stroke-width': 1, opacity: 0.8 }, dir);
  el('text', { x: 142, y: 360, 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#3a2a1a' }, dir).textContent = 'CKT 1 ... PRACTICE';
  el('text', { x: 142, y: 374, 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#3a2a1a' }, dir).textContent = 'KILL POWER';
  el('text', { x: 142, y: 388, 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#a3261c' }, dir).textContent = 'BEFORE WIRING!';
  el('path', { d: 'M142,391 H232', stroke: '#a3261c', 'stroke-width': 1.4 }, dir);
  /* the neutral bar and the ground bar, bonded together here in the service
     panel and nowhere else */
  el('rect', { x: 132, y: 412, width: 190, height: 18, rx: 3, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, panel);
  el('rect', { x: 132, y: 448, width: 190, height: 18, rx: 3, fill: 'url(#gGndBar)', stroke: INK, 'stroke-width': 3 }, panel);
  el('rect', { x: 136, y: 424, width: 12, height: 30, rx: 2, fill: '#c98a4e', stroke: INK, 'stroke-width': 2.2 }, panel);
  el('circle', { cx: 142, cy: 421, r: 5, fill: 'url(#gScrewGreen)', stroke: INK, 'stroke-width': 1.8 }, panel);
  el('text', { x: 154, y: 443, 'font-family': 'Special Elite, monospace', 'font-size': 8.5, fill: '#cfc6ae', 'letter-spacing': 1 }, panel).textContent = 'BONDED HERE ONLY';
  for (const [x, y, f] of [[166, 421, 'url(#gScrewSilver)'], [192, 421, 'url(#gScrewSilver)'], [166, 457, 'url(#gScrewGreen)'], [192, 457, 'url(#gScrewGreen)']]) {
    el('circle', { cx: x, cy: y, r: 5.5, fill: f, stroke: INK, 'stroke-width': 1.8 }, panel);
    el('path', { d: `M${x - 3},${y - 2} L${x + 3},${y + 2}`, stroke: INK, 'stroke-width': 1.6 }, panel);
  }
  el('rect', { x: 146, y: 496, width: 140, height: 18, rx: 3, fill: '#c7322b', stroke: INK, 'stroke-width': 2.5 }, panel);
  el('text', { x: 216, y: 509, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 10, fill: '#fbeac0', 'letter-spacing': 1 }, panel).textContent = 'DANGER · 120 VOLTS';
  el('circle', { cx: 276, cy: 240, r: 12, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 2.5 }, panel);
  const jewel = el('circle', { cx: 276, cy: 240, r: 8, fill: 'url(#gJewelOff)', stroke: INK, 'stroke-width': 2 }, panel);
  el('path', { d: 'M272,236 Q274,233 278,233', fill: 'none', stroke: '#fff', 'stroke-width': 1.8, opacity: 0.8, 'stroke-linecap': 'round' }, panel);
  el('text', { x: 276, y: 266, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 9, fill: '#cfc6ae' }, panel).textContent = 'PILOT';
  const jewelGlow = el('circle', { cx: 276 + PX, cy: 240 + PY, r: 34, fill: 'url(#gRedGlow)', opacity: 0, style: 'mix-blend-mode:screen' }, L.light);

  /* the main breaker: a black bakelite toggle with a cream handle */
  const breaker = el('g', { class: 'clicky', role: 'button', tabindex: 0, 'aria-label': 'Main breaker' }, el('g', { transform: `translate(${PX},${PY})` }, L.parts));
  el('rect', { x: 144, y: 212, width: 96, height: 110, rx: 9, fill: 'url(#gBakelite)', stroke: INK, 'stroke-width': 3.5 }, breaker);
  el('path', { d: 'M150,220 H234', stroke: '#55555c', 'stroke-width': 2, opacity: 0.7, 'stroke-linecap': 'round' }, breaker);
  el('text', { x: 158, y: 229, 'font-family': 'Special Elite, monospace', 'font-size': 9, fill: '#cfc6ae' }, breaker).textContent = 'CKT 1 15A';
  el('text', { x: 228, y: 250, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#e6dcc0' }, breaker).textContent = 'ON';
  el('text', { x: 228, y: 300, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 9.5, fill: '#e6dcc0' }, breaker).textContent = 'OFF';
  el('rect', { x: 166, y: 234, width: 50, height: 74, rx: 7, fill: '#050506', stroke: '#3e3e46', 'stroke-width': 2 }, breaker);
  const hUnder = el('rect', { x: 172, width: 38, rx: 4, fill: '#7d6a48', stroke: INK, 'stroke-width': 2.5 }, breaker);
  const hFace = el('rect', { x: 169, width: 44, height: 28, rx: 6, fill: 'url(#gHandle)', stroke: INK, 'stroke-width': 3 }, breaker);
  const hGrip = el('path', { fill: 'none', stroke: '#a8916a', 'stroke-width': 2, 'stroke-linecap': 'round' }, breaker);
  const tripFlag = el('g', { opacity: 0 }, breaker);
  el('path', { d: 'M238,262 H270 L276,270 L270,278 H238 Z', fill: '#f28c1c', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, tripFlag);
  el('text', { x: 255, y: 274, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 10, fill: INK }, tripFlag).textContent = 'TRIP';
  const brk = { p: -1, v: 0 };
  const BRK_AT = [192 + PX, 268 + PY];

  /* ---------- the steel device box the switch stands in ---------- */
  const box = el('g', {}, L.parts);
  el('rect', { x: 574, y: 196, width: 150, height: 300, rx: 12, fill: '#140904', opacity: 0.45, filter: 'url(#softBlur)' }, box);
  for (const y of [172, 482]) {
    el('rect', { x: 614, y, width: 52, height: 20, rx: 6, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3 }, box);
    el('circle', { cx: 640, cy: y + 10, r: 5, fill: 'url(#gScrewSilver)', stroke: INK, 'stroke-width': 1.8 }, box);
    el('path', { d: `M636,${y + 8} L644,${y + 12}`, stroke: INK, 'stroke-width': 1.6 }, box);
  }
  for (const [x0, x1] of [[532, 582], [698, 748]]) {
    el('rect', { x: x0, y: 302, width: x1 - x0, height: 36, rx: 7, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3 }, box);
    el('path', { d: `M${x0 + 6},${308} H${x1 - 6}`, stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.6, 'stroke-linecap': 'round' }, box);
  }
  /* the grounding tab welded to the box, with its green screw */
  el('path', { d: 'M592,470 H546 Q538,470 538,478 V508 Q538,516 546,516 H592 Z', fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, box);
  el('path', { d: 'M546,476 H586', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.6, 'stroke-linecap': 'round' }, box);
  el('rect', { x: 566, y: 186, width: 148, height: 298, rx: 10, fill: 'url(#gGalv)', stroke: INK, 'stroke-width': 5 }, box);
  el('rect', { x: 566, y: 186, width: 148, height: 298, rx: 10, fill: 'url(#spangle)' }, box);
  el('rect', { x: 574, y: 194, width: 132, height: 282, rx: 7, fill: 'none', stroke: '#f2f4f5', 'stroke-width': 2, opacity: 0.55 }, box);
  el('rect', { x: 582, y: 202, width: 116, height: 266, rx: 5, fill: 'url(#gCabIn)', stroke: INK, 'stroke-width': 3 }, box);
  el('path', { d: 'M586,208 H694', stroke: '#000', 'stroke-width': 7, opacity: 0.3 }, box);
  el('path', { d: 'M596,456 H684', stroke: '#55595c', 'stroke-width': 5, 'stroke-linecap': 'round' }, box);

  /* ---------- the porcelain keyless lampholder on a turned wooden block ---------- */
  const HX = -80;
  const holder = el('g', { transform: `translate(${HX},0)` }, L.holder);
  el('path', { d: 'M912,456 V504 Q1020,544 1128,504 V456 Z', fill: '#8a5a30', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, holder);
  el('path', { d: 'M920,500 Q1020,534 1120,500', fill: 'none', stroke: '#c79566', 'stroke-width': 2.5, opacity: 0.6 }, holder);
  el('ellipse', { cx: 1020, cy: 456, rx: 108, ry: 26, fill: '#a26e3e', stroke: INK, 'stroke-width': 4 }, holder);
  el('path', { d: 'M930,442 V488 Q1020,522 1110,488 V442 Z', fill: 'url(#gPorc)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, holder);
  el('path', { d: 'M946,454 V484', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.75, 'stroke-linecap': 'round' }, holder);
  el('path', { d: 'M1094,452 V486', stroke: '#8f8676', 'stroke-width': 8, opacity: 0.35, 'stroke-linecap': 'round' }, holder);
  el('ellipse', { cx: 1020, cy: 442, rx: 90, ry: 24, fill: '#f8f3e8', stroke: INK, 'stroke-width': 5 }, holder);
  el('ellipse', { cx: 1020, cy: 442, rx: 40, ry: 11.5, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, holder);
  el('path', { d: 'M986,441 Q1020,450 1054,441 M990,436 Q1020,444 1050,436', fill: 'none', stroke: '#7a5316', 'stroke-width': 1.6, opacity: 0.8 }, holder);
  for (const [x0, x1] of [[916, 952], [1088, 1124]]) el('rect', { x: x0, y: 454, width: x1 - x0, height: 24, rx: 4, fill: x0 < 1000 ? 'url(#gGold)' : 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, holder);

  /* ---------- terminals: binding screws with washers ---------- */
  const TERMS = {
    'P.hot': { x: 300 + PX, y: 330 + PY, kind: 'dark', label: 'HOT', tx: 300 + PX, ty: 296 + PY, name: 'Panel HOT' },
    'P.neu': { x: 300 + PX, y: 421 + PY, kind: 'silver', label: 'NEUTRAL', tx: 240 + PX, ty: 421 + PY, name: 'Panel NEUTRAL bar' },
    'P.gnd': { x: 300 + PX, y: 457 + PY, kind: 'green', label: 'GROUND', tx: 242 + PX, ty: 457 + PY, name: 'Panel GROUND bar' },
    'S1.a': { x: 550, y: 320, kind: 'brass', label: 'BRASS', tx: 522, ty: 360, name: 'Switch left BRASS' },
    'S1.b': { x: 730, y: 320, kind: 'brass', label: 'BRASS', tx: 758, ty: 360, name: 'Switch right BRASS' },
    'S1.g': { x: 558, y: 493, kind: 'green', label: 'GROUND', tx: 490, ty: 493, name: 'Switch box green GROUND' },
    'L1.brass': { x: 934 + HX, y: 466, kind: 'brass', label: 'BRASS', tx: 876 + HX, ty: 470, name: 'Bulb BRASS' },
    'L1.silver': { x: 1106 + HX, y: 466, kind: 'silver', label: 'SILVER', tx: 1170 + HX, ty: 470, name: 'Bulb SILVER' },
  };
  const fillOf = { brass: 'url(#gScrewBrass)', silver: 'url(#gScrewSilver)', dark: 'url(#gScrewDark)', green: 'url(#gScrewGreen)' };
  for (const [id, tm] of Object.entries(TERMS)) {
    tag(tm.tx, tm.ty, tm.label, id.charCodeAt(3) % 2 ? -2.5 : 2);
    el('ellipse', { cx: tm.x + 2.5, cy: tm.y + 4, rx: 17, ry: 15, fill: '#1a0c05', opacity: 0.35 }, L.plates);
    el('circle', { cx: tm.x, cy: tm.y, r: 16, fill: fillOf[tm.kind === 'dark' ? 'brass' : tm.kind === 'green' ? 'silver' : tm.kind], stroke: INK, 'stroke-width': 2.5 }, L.plates);
    const g = el('g', { class: 'term', 'data-term': id, tabindex: 0, role: 'button', 'aria-label': `${tm.name} terminal` }, L.terms);
    tm.ring = el('circle', { cx: tm.x, cy: tm.y, r: 23, fill: 'none', stroke: '#ffe27a', 'stroke-width': 4, opacity: 0 }, g);
    el('circle', { cx: tm.x, cy: tm.y, r: 11.5, fill: fillOf[tm.kind], stroke: INK, 'stroke-width': 3.2 }, g);
    tm.slot = el('path', { d: 'M-7,0 H7', stroke: INK, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${tm.x - 7},${tm.y - 4} A8,8 0 0,1 ${tm.x - 1},${tm.y - 8}`, fill: 'none', stroke: '#fff', 'stroke-width': 1.8, opacity: 0.85, 'stroke-linecap': 'round' }, g);
    el('circle', { cx: tm.x, cy: tm.y, r: HIT, fill: 'transparent', class: 'hit' }, g);
    tm.g = g; tm.rot = (id.length * 37) % 180 - 60; tm.spin = -9; tm.spinDir = 1;
  }
  const ownerOf = id => (id.startsWith('S1') ? 'sw' : id.startsWith('L1') ? 'bulb' : 'panel');

  /* ---------- the cast ---------- */
  const scene = { defs: App.defs, layer: L.cast, get boil() { return App.boil; } };
  const sw = T.makeSwitch(scene, 640, 468, 0.8, { labels: true, pose: { lever: -1 } });
  const bulb = T.makeBulb(scene, 1020 + HX, 440, 0.8);
  /* the Inspector is the old multimeter from the menu, in his peaked cap. He
     stands on the bench, in front of everything on the wall, so he lives in the
     foreground layer; his wrapper lets him spin through the air and flash like
     an X-ray when he gets zapped */
  const inspWrap = el('g', {}, L.fore);
  const insp = T.makeMeter({ defs: App.defs, layer: inspWrap, get boil() { return App.boil; } }, 1400, 594, 0.62);
  sw.root.setAttribute('class', 'toon clicky');
  bulb.root.setAttribute('class', 'toon clicky');
  insp.root.style.display = 'none';
  /* each keeps its own rhythm: the bulb droops and trembles, the switch fidgets,
     the Inspector barely moves at all */
  Object.assign(bulb.cfg.life, { breath: 3.6, bounce: 3, beatMul: 0.5, beatOffset: 0.3, sway: 2, lean: 3.2, nervous: 0.34 });
  Object.assign(sw.cfg.life, { breath: 2.2, bounce: 4, beatMul: 1, beatOffset: 0.15, sway: 2.4, lean: 2.2, nervous: 0.26 });
  Object.assign(insp.cfg.life, { breath: 4.2, bounce: 0, sway: 0.8, lean: 0.5, nervous: 0.02 });
  {
    /* hair that only shows when it's standing on end */
    insp.hair = el('path', { d: 'M-40,-250 L-52,-300 M-24,-252 L-26,-318 M-8,-254 L2,-324 M10,-254 L24,-318 M28,-252 L50,-300 M44,-248 L66,-280', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0 }, insp.bodyG);
    const cap = el('g', {}, insp.bodyG);
    insp.cap = cap;
    el('path', { d: 'M-50,-246 Q-46,-292 0,-296 Q46,-292 50,-246 Z', fill: '#2c3a52', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, cap);
    el('path', { d: 'M-48,-258 H48', stroke: '#1a2436', 'stroke-width': 7 }, cap);
    el('path', { d: 'M-66,-244 Q0,-236 70,-246 Q72,-238 64,-234 Q0,-226 -64,-234 Q-72,-238 -66,-244 Z', fill: '#18202e', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, cap);
    el('path', { d: 'M0,-286 L5,-276 L16,-275 L8,-268 L10,-257 L0,-263 L-10,-257 L-8,-268 L-16,-275 L-5,-276 Z', fill: 'url(#gGold)', stroke: INK, 'stroke-width': 2 }, cap);
    el('path', { d: 'M-30,-286 Q-10,-292 12,-290', fill: 'none', stroke: '#6b82a6', 'stroke-width': 4, opacity: 0.8, 'stroke-linecap': 'round' }, cap);
    const clip = el('g', { transform: 'translate(-64,-120) rotate(-10)' }, insp.bodyG);
    el('rect', { x: -26, y: -36, width: 52, height: 70, rx: 4, fill: '#9a6a3a', stroke: INK, 'stroke-width': 3.5 }, clip);
    el('rect', { x: -21, y: -28, width: 42, height: 58, fill: '#fbf1d4', stroke: INK, 'stroke-width': 2 }, clip);
    el('path', { d: 'M-16,-14 H14 M-16,-4 H14 M-16,6 H8 M-16,16 H12', stroke: '#8a9ab0', 'stroke-width': 1.6 }, clip);
    el('rect', { x: -12, y: -42, width: 24, height: 12, rx: 3, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, clip);
    insp.ticks = el('path', { d: '', fill: 'none', stroke: '#c7322b', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, clip);
  }
  /* the Frayed Phantom, from the menu, lives in the hole in the wall */
  const phScene = { defs: App.defs, layer: L.phantom, get boil() { return App.boil; } };
  const ph = T.makeEvilWire(phScene, HOLE.x, HOLE.y, 0.62);
  Object.assign(ph.cfg.life, { breath: 3.4, bounce: 0, sway: 5, lean: 4, nervous: 0.02 });
  ph.root.style.display = 'none';
  ph.root.style.cursor = 'pointer';
  const particles = new Particles(L.fx);

  /* ---------- the shop lamp and the light it throws ---------- */
  const lamp = { g: el('g', {}, L.lamp), coneG: el('g', { style: 'mix-blend-mode:screen', opacity: 0.85 }, L.light), th: 0.02, w: 0 };
  el('path', { d: 'M0,-4 V34', stroke: INK, 'stroke-width': 3 }, lamp.g);
  el('path', { d: 'M-12,34 H12 V44 H-12 Z', fill: '#3a3a3a', stroke: INK, 'stroke-width': 3 }, lamp.g);
  el('path', { d: 'M-12,44 Q-46,50 -52,72 H52 Q46,50 12,44 Z', fill: 'url(#gShade)', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, lamp.g);
  el('path', { d: 'M-34,56 Q-22,49 -8,48', fill: 'none', stroke: '#bfe8d2', 'stroke-width': 3, opacity: 0.8, 'stroke-linecap': 'round' }, lamp.g);
  lamp.bulbE = el('ellipse', { cx: 0, cy: 74, rx: 14, ry: 9, fill: '#fff4c8', stroke: INK, 'stroke-width': 2.5 }, lamp.g);
  lamp.cone = el('path', { d: 'M-40,72 L-470,500 L470,500 L40,72 Z', fill: 'url(#gCone)' }, lamp.coneG);
  const benchPool = el('ellipse', { cx: 640, cy: 574, rx: 470, ry: 42, fill: 'url(#gBenchPool)', style: 'mix-blend-mode:screen' }, L.light);
  const bulbGlow = el('ellipse', { rx: 330, ry: 270, fill: 'url(#gWarm)', opacity: 0, style: 'mix-blend-mode:screen' }, L.light);
  const vign = el('rect', { x: -20, y: -20, width: 1320, height: 760, fill: 'url(#gRoomDark)' }, L.dark);
  const darkRect = el('rect', { x: -20, y: -20, width: 1320, height: 760, fill: '#050308', opacity: 0 }, L.dark);
  const darkEyes = [sw, bulb, ph].map(c => {
    const g = el('g', { opacity: 0 }, L.dark);
    const evil = c === ph;
    return { c, g, e: [0, 1].map(() => ({ w: el('ellipse', evil ? { fill: '#fff2a0', opacity: 0.25, filter: 'url(#softBlur)' } : { fill: '#f4ecd8' }, g), p: el('ellipse', { fill: evil ? '#fff8d8' : '#0a0606' }, g) })) };
  });
  const soots = [];
  const cord = el('path', { fill: 'none', stroke: INK, 'stroke-width': 3, opacity: 0 }, L.cast);
  L.cast.insertBefore(cord, L.cast.firstChild);

  /* ---------- speech bubble ---------- */
  const bub = el('g', { opacity: 0 }, L.bubble);
  const bubShadow = el('path', { fill: '#140904', opacity: 0.35, transform: 'translate(5,7)' }, bub);
  const bubBox = el('path', { fill: '#fffaf0', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, bub);
  const bubText = el('text', { 'font-family': 'Special Elite, "Courier New", monospace', 'font-size': 17, fill: INK }, bub);
  const bubS = { t0: -9, until: -9, tip: [918, 214] };
  function say(text, secs = 6, who = 'bulb') {
    if (who === 'bulb' && st.blown) who = 'sw';
    const words = text.split(' '), lines = [];
    let line = '';
    for (const w of words) { if ((line + ' ' + w).trim().length > 28) { lines.push(line.trim()); line = w; } else line += ' ' + w; }
    if (line.trim()) lines.push(line.trim());
    while (bubText.firstChild) bubText.firstChild.remove();
    const tip = who === 'sw' ? [618, 236] : who === 'insp' ? insp.world(-34, -300) : [918, 214];
    const w = Math.max(...lines.map(l => l.length)) * 9.3 + 34, h = lines.length * 22 + 24;
    /* the bubble keeps clear of the work order tacked up in the top-right corner */
    const x = who === 'bulb' ? clamp(tip[0] - w + 40, 560, 890 - w) : clamp(tip[0] - w * 0.55, 380, 890 - w);
    const y = Math.max(104, tip[1] - 30 - h);
    lines.forEach((ln, i) => { el('tspan', { x: R(x + 17), y: R(y + 29 + i * 22) }, bubText).textContent = ln; });
    const b0 = clamp(tip[0] + 14, x + 16, x + w - 44), b1 = b0 + 28;
    const d = `M${R(x + 10)},${R(y)} H${R(x + w - 10)} Q${R(x + w)},${R(y)} ${R(x + w)},${R(y + 10)} V${R(y + h - 10)} Q${R(x + w)},${R(y + h)} ${R(x + w - 10)},${R(y + h)} H${R(b1)} L${R(tip[0])},${R(tip[1])} L${R(b0)},${R(y + h)} H${R(x + 10)} Q${R(x)},${R(y + h)} ${R(x)},${R(y + h - 10)} V${R(y + 10)} Q${R(x)},${R(y)} ${R(x + 10)},${R(y)} Z`;
    bubBox.setAttribute('d', d); bubShadow.setAttribute('d', d);
    bubS.t0 = now; bubS.until = now + secs; bubS.tip = tip;
    A.sfx.squeak();
  }

  /* ---------- state ---------- */
  const st = { wires: [], power: false, trip: false, sw: 0, color: '#1c1c1e', blown: false, faultLock: false, hint: 0, lastRes: null, won: false, shorts: 0, hookOk: 0, tester: false, inspecting: false, told: {} };
  const flash = el('rect', { x: -20, y: -20, width: 1320, height: 760, fill: '#fff4c8', opacity: 0 }, L.flash);
  const look = { x: 0, y: 0, until: -9 };
  const glance = (x, y, secs = 1.4) => { look.x = x; look.y = y; look.until = now + secs; };
  const once = (key, fn) => { if (st.told[key]) return; st.told[key] = true; fn(); };
  let lastInput = 0;

  /* ---------- cables: verlet ropes pinned at the screws, sagging under gravity ---------- */
  const GRAV = 1500, FLOOR = 594;
  function makeRope(ax, ay, bx, by, n = 16) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), x = ax + (bx - ax) * u, y = ay + (by - ay) * u - Math.sin(u * Math.PI) * 30;
      pts.push({ x, y, px: x, py: y });
    }
    return { pts, seg: Math.hypot(bx - ax, by - ay) / (n - 1), still: 0, sleep: false };
  }
  const slackFor = dist => 16 + dist * 0.05;
  function fitRope(r, ax, ay, bx, by, slack) { const d = Math.hypot(bx - ax, by - ay); r.seg = (d + (slack == null ? slackFor(d) : slack)) / (r.pts.length - 1); }
  function stepRope(r, h, pa, pb) {
    const p = r.pts, n = p.length;
    let moved = 0;
    for (const q of p) {
      const vx = (q.x - q.px) * 0.985, vy = (q.y - q.py) * 0.985;
      q.px = q.x; q.py = q.y;
      q.x += vx; q.y += vy + GRAV * h * h;
    }
    for (let it = 0; it < 12; it++) {
      if (pa) { p[0].x = pa[0]; p[0].y = pa[1]; }
      if (pb) { p[n - 1].x = pb[0]; p[n - 1].y = pb[1]; }
      for (let i = 0; i < n - 1; i++) {
        const a = p[i], b = p[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6, diff = (d - r.seg) / d;
        const wa = i === 0 && pa ? 0 : 1, wb = i + 1 === n - 1 && pb ? 0 : 1, s = wa + wb;
        if (!s) continue;
        a.x += (dx * diff * wa) / s; a.y += (dy * diff * wa) / s;
        b.x -= (dx * diff * wb) / s; b.y -= (dy * diff * wb) / s;
      }
    }
    /* a little bending stiffness so it reads as cable, not string */
    for (let i = 1; i < n - 1; i++) {
      const q = p[i];
      q.x += ((p[i - 1].x + p[i + 1].x) / 2 - q.x) * 0.06;
      q.y += ((p[i - 1].y + p[i + 1].y) / 2 - q.y) * 0.06;
    }
    if (pa) { p[0].x = pa[0]; p[0].y = pa[1]; }
    if (pb) { p[n - 1].x = pb[0]; p[n - 1].y = pb[1]; }
    for (const q of p) {
      if (q.y > FLOOR) { q.y = FLOOR; q.px = q.x - (q.x - q.px) * 0.4; }
      moved = Math.max(moved, Math.abs(q.x - q.px) + Math.abs(q.y - q.py));
    }
    r.still = moved < 0.03 ? r.still + 1 : 0;
    if (r.still > 120) r.sleep = true;
  }
  const wake = r => { r.sleep = false; r.still = 0; };
  function smoothD(pts) {
    let d = `M${R(pts[0].x)},${R(pts[0].y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C${R(p1.x + (p2.x - p0.x) / 6)},${R(p1.y + (p2.y - p0.y) / 6)} ${R(p2.x - (p3.x - p1.x) / 6)},${R(p2.y - (p3.y - p1.y) / 6)} ${R(p2.x)},${R(p2.y)}`;
    }
    return d;
  }
  function cutFront(pts, amt) {
    let rem = amt;
    while (pts.length > 2) {
      const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (d > rem) { const k = rem / d; pts[0] = { x: pts[0].x + (pts[1].x - pts[0].x) * k, y: pts[0].y + (pts[1].y - pts[0].y) * k }; return pts; }
      rem -= d; pts.shift();
    }
    return pts;
  }
  /* the bare copper end wrapped round the screw, under its head. s is how far
     it's wrapped, in radians: positive is clockwise (the finished hook is ~300°) */
  function hook(tm, e, s = 5.2, tail = 0) {
    const a = Math.atan2(e.y - tm.y, e.x - tm.x), r = 13.5, a2 = a + s;
    let d = `M${R(e.x)},${R(e.y)} L${R(tm.x + Math.cos(a) * r)},${R(tm.y + Math.sin(a) * r)} `;
    if (Math.abs(s) >= 0.05) d += `A${r},${r} 0 ${Math.abs(s) > Math.PI ? 1 : 0},${s > 0 ? 1 : 0} ${R(tm.x + Math.cos(a2) * r)},${R(tm.y + Math.sin(a2) * r)} `;
    /* while it's being wrapped, the loose end of the copper runs out to the grip */
    if (tail) d += `L${R(tm.x + Math.cos(a2) * tail)},${R(tm.y + Math.sin(a2) * tail)} `;
    return d;
  }
  const WCOL = { '#1c1c1e': ['#2c2c31', '#9696a0'], '#f1ead8': ['#f1ead8', '#ffffff'], '#c7322b': ['#c7322b', '#ff9f8a'], '#3f8a4c': ['#3f8a4c', '#9fe0a8'] };
  function wireEls(parent, color, shadowParent, clickable) {
    const g = el('g', { class: clickable ? 'wire' : 'wire-x' }, parent);
    const cols = WCOL[color] || WCOL['#1c1c1e'];
    const o = { g, color };
    o.shadow = el('path', { fill: 'none', stroke: '#1a0c05', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.24, transform: 'translate(7,11)' }, shadowParent || g);
    o.glow = el('path', { fill: 'none', stroke: '#ffd23a', 'stroke-width': 24, 'stroke-linecap': 'round', opacity: 0 }, g);
    o.cuInk = el('path', { fill: 'none', stroke: INK, 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    o.cu = el('path', { fill: 'none', stroke: '#d98a4a', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    o.cuHi = el('path', { fill: 'none', stroke: '#ffd6ae', 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: 0.9, transform: 'translate(-.6,-.8)' }, g);
    o.ink = el('path', { fill: 'none', stroke: INK, 'stroke-width': 13, 'stroke-linecap': 'round' }, g);
    o.core = el('path', { class: 'wcore', fill: 'none', stroke: cols[0], 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    o.hi = el('path', { fill: 'none', stroke: cols[1], 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.75, transform: 'translate(-1.2,-2.2)' }, g);
    o.flow = el('path', { fill: 'none', stroke: '#fff6b8', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': '4 26', opacity: 0 }, g);
    /* the Inspector's chalk line as he follows this wire */
    o.trace = el('path', { fill: 'none', stroke: '#fff3a0', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '10 12', opacity: 0 }, g);
    o.hit = el('path', { fill: 'none', stroke: 'transparent', 'stroke-width': TOUCH ? 44 : 26, class: 'wire-hit' }, g);
    if (!clickable) { o.hit.remove(); g.style.pointerEvents = 'none'; }
    return o;
  }
  function removeEls(o) { o.g.remove(); o.shadow.remove(); }
  /* how a rope end is drawn: a screw (hooked round it), { t: screw, s: sweep }
     (being wrapped right now), 'free' (a bare copper tip), 'nut' (it disappears
     into a wire nut) or null (nothing) */
  function drawRope(o, r, endA, endB) {
    let body = r.pts.map(q => ({ x: q.x, y: q.y }));
    const trim = e => (e === 'free' ? 9 : e === 'nut' ? 4 : 18);
    if (endA) body = cutFront(body, trim(endA));
    if (endB) body = cutFront(body.reverse(), trim(endB)).reverse();
    const d = smoothD(body);
    for (const k of ['shadow', 'glow', 'ink', 'core', 'hi', 'flow', 'trace']) o[k].setAttribute('d', d);
    if (o.hit.parentNode) o.hit.setAttribute('d', d);
    let cd = '';
    const P = r.pts, n = P.length;
    const tip = (e, b, p) => (e === 'free' ? `M${R(b.x)},${R(b.y)} L${R(p.x)},${R(p.y)} ` : e && e.t ? hook(e.t, b, e.s, 30) : e && e !== 'nut' ? hook(e, b) : '');
    cd += tip(endA, body[0], P[0]);
    cd += tip(endB, body[body.length - 1], P[n - 1]);
    o.cuInk.setAttribute('d', cd); o.cu.setAttribute('d', cd); o.cuHi.setAttribute('d', cd);
  }

  /* ---------- placed wires and their pigtails ---------- */
  const vis = new Map();
  const loose = [];
  const pig = {};
  const countAt = id => st.wires.filter(w => w.a === id || w.b === id).length;
  const pinOf = id => (pig[id] ? pig[id].J : [TERMS[id].x, TERMS[id].y]);
  const endOf = id => (pig[id] ? 'nut' : TERMS[id]);
  function syncWires(fromRope) {
    for (const [w, v] of vis) if (!st.wires.includes(w)) { removeEls(v.o); vis.delete(w); }
    for (const w of st.wires) {
      if (vis.has(w)) continue;
      const [ax, ay] = pinOf(w.a), [bx, by] = pinOf(w.b);
      const rope = fromRope && fromRope.w === w ? fromRope.rope : makeRope(ax, ay, bx, by);
      fitRope(rope, ax, ay, bx, by); wake(rope);
      const o = wireEls(L.wires, w.color, L.wshadow, true);
      o.g.addEventListener('click', e => {
        e.stopPropagation();
        const [x, y] = App.toScene(e);
        cutWire(st.wires.indexOf(w), x, y);
      });
      vis.set(w, { rope, o, hot: false, current: false, dir: 1 });
    }
    /* a doubled screw keeps its pigtail; a screw back down to one wire loses it */
    for (const id of Object.keys(pig)) if (countAt(id) < 2) dropPigtail(id);
    for (const id of Object.keys(TERMS)) if (countAt(id) >= 2 && !pig[id]) makePigtail(id, null, true);
    for (const [w, v] of vis) { const [ax, ay] = pinOf(w.a), [bx, by] = pinOf(w.b); fitRope(v.rope, ax, ay, bx, by); wake(v.rope); v.dirty = true; }
  }
  function shakeWires(k) {
    for (const r of allRopes()) {
      wake(r);
      for (const q of r.pts) { q.px -= rand(-5, 5) * k; q.py -= rand(-8, 3) * k; }
    }
  }
  const allRopes = () => [...[...vis.values()].map(v => v.rope), ...Object.values(pig).map(p => p.rope)];

  /* F. the pigtail: a short jumper from the screw to a wire nut, and every
     conductor for that screw twisted together inside the nut */
  function pigDir(id, extra) {
    const t = TERMS[id];
    let dx = 0, dy = 0;
    const others = st.wires.filter(w => w.a === id || w.b === id).map(w => TERMS[w.a === id ? w.b : w.a]);
    if (extra) others.push(TERMS[extra]);
    for (const o of others) { const d = Math.hypot(o.x - t.x, o.y - t.y) || 1; dx += (o.x - t.x) / d; dy += (o.y - t.y) / d; }
    const d = Math.hypot(dx, dy);
    return d < 0.2 ? [0, 1] : [dx / d, dy / d];
  }
  const PIG_AT = { 'P.hot': [0.95, 0.55], 'P.neu': [0.95, 0.3], 'P.gnd': [0.95, 0.35], 'S1.a': [-0.8, -0.65], 'S1.b': [0.8, -0.65], 'S1.g': [-0.9, -0.5], 'L1.brass': [-0.55, 0.95], 'L1.silver': [0.55, 0.95] };
  function makePigtail(id, extra, snug) {
    const t = TERMS[id];
    if (!pig[id]) {
      /* each screw has an open patch of board beside it where the nut can sit,
         out of everyone's way */
      const [ux, uy] = PIG_AT[id] || pigDir(id, extra);
      const J = [t.x + ux * 58, t.y + uy * 58];
      const first = st.wires.find(w => w.a === id || w.b === id);
      const rope = makeRope(t.x, t.y, J[0], J[1], 7);
      fitRope(rope, t.x, t.y, J[0], J[1], 10);
      const o = wireEls(L.wires, first ? first.color : st.color, L.wshadow, false);
      const nut = el('g', { class: 'nut clicky', role: 'button', tabindex: 0, 'aria-label': 'Wire nut: twist it on' }, L.nuts);
      el('ellipse', { cx: 0, cy: 3, rx: 16, ry: 5, fill: '#1a0c05', opacity: 0.3, transform: 'translate(4,8)' }, nut);
      const body = el('g', {}, nut);
      el('path', { d: 'M-13,2 Q-14,-12 -8,-24 Q0,-32 8,-24 Q14,-12 13,2 Q0,7 -13,2 Z', fill: 'url(#gNut)', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, body);
      const ribs = el('path', { d: '', fill: 'none', stroke: '#8a3a06', 'stroke-width': 1.6 }, body);
      el('path', { d: 'M-8,-18 Q-7,-24 -3,-26', fill: 'none', stroke: '#ffe0b0', 'stroke-width': 2, opacity: 0.8, 'stroke-linecap': 'round' }, body);
      el('circle', { cx: 0, cy: -8, r: 26, fill: 'transparent' }, nut);
      const arrow = el('path', { d: 'M-22,-30 A26,26 0 0,1 22,-30 M22,-30 l-9,0 M22,-30 l2,-9', fill: 'none', stroke: '#ffe27a', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0 }, nut);
      const pg = { J, rope, o, nut, body, ribs, arrow, rot: 0, turn: 0, snug: false, twists: 0, res: null };
      nut.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); twistClick(id); });
      nut.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); twistClick(id); } });
      pig[id] = pg;
    }
    const pg = pig[id];
    if (!snug) { pg.snug = false; pg.twists = 0; }
    else pg.snug = true;
    for (const [w, v] of vis) if (w.a === id || w.b === id) { const [ax, ay] = pinOf(w.a), [bx, by] = pinOf(w.b); fitRope(v.rope, ax, ay, bx, by); wake(v.rope); }
    return pg;
  }
  function dropPigtail(id) {
    const pg = pig[id];
    if (!pg) return;
    removeEls(pg.o); pg.nut.remove();
    delete pig[id];
  }
  function twistClick(id) {
    const pg = pig[id];
    if (!pg || pg.snug || !pg.res) return;
    pg.twists++; pg.turn = now;
    A.sfx.ratchet();
    particles.spark(pg.J[0], pg.J[1] - 14, 2, 0.2);
    if (pg.twists >= 3) {
      pg.snug = true;
      particles.bonk(pg.J[0], pg.J[1] - 12, 0.8);
      A.sfx.pop();
      const r = pg.res; pg.res = null; r(true);
    }
  }
  function twistNut(id) {
    return new Promise(res => {
      const pg = pig[id];
      pg.res = res;
      once('pigtail', () => say('Two wires on one screw? On the job you pigtail them. Twist the wire nut on: click it three times!', 7, ownerOf(id) === 'sw' ? 'sw' : 'bulb'));
      status('Twist the wire nut on: click it (or press Enter) three times, clockwise.');
      try { pg.nut.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
    });
  }

  function evaluate() {
    const res = C.evaluate(LEVEL.components, st.wires, { S1: st.sw }, st.power && !st.blown);
    st.lastRes = res;
    const info = C.wireInfo(res, LEVEL.components, st.wires);
    info.forEach((wi, i) => {
      const w = st.wires[i], v = vis.get(w);
      if (!v) return;
      v.hot = wi.hot; v.current = wi.current;
      v.dir = Math.abs(res.V[w.a] || 0) >= Math.abs(res.V[w.b] || 0) ? 1 : -1;
    });
    for (const [id, pg] of Object.entries(pig)) { const v = res.V[id]; pg.hot = v != null && Math.abs(v) > 1; }
    const br = res.bulbs.L1 ? res.bulbs.L1.bright : 0;
    bulb.lit = st.blown ? 0 : br;
    A.sfx.hum(bulb.lit > 0.5 && App.current === 'level');
    if (res.short && !st.faultLock && !st.inspecting) deadShort(res);
    return res;
  }
  const isHot = id => !!(st.lastRes && st.lastRes.V[id] != null && Math.abs(st.lastRes.V[id]) > 1);

  /* ---------- performances for this scene ---------- */
  const K = {
    brace: () => ({ d: 1.1, k: [[0.1, { lid: 1, sy: 0.9, shake: 1.4, mouth: 'grit', lhx: -12, lhy: -30, rhx: 12, rhy: -30, lg: 'fist', rg: 'fist', sweat: 1 }], [0.8, { lid: 0.9 }]] }),
    joy: () => ({ d: 2.2, k: [[0.08, { sy: 0.85, hipY: 8 }], [0.2, { sy: 1.15, hipY: -40, lfy: 36, rfy: 30, lhx: -66, lhy: -80, rhx: 66, rhy: -84, lg: 'palm', rg: 'palm', lroll: 0.3, rroll: -0.3, mouth: 'smile', mouthOpen: 0.9, lowLid: 0.45, browTilt: -0.4, browRaise: 0.9, pupil: 1 }], [0.36, { hipY: 4, sy: 0.9, lfy: 0, rfy: 0 }], [0.5, { hipY: -22, lfy: 20, rfy: 16, sy: 1.08 }], [0.64, { hipY: 0, lfy: 0, rfy: 0, sy: 1 }]], cues: [[0.2, () => A.sfx.boing()]] }),
    confused: () => ({ d: 2.4, k: [[0.1, { turn: 0.4, lookX: 0.6, lookY: 0.4, browTilt: 0.2, browRaise: 0.6, mouth: 'flat', rhx: 42, rhy: -132, rg: 'claw', rroll: 0.4 }], [0.4, { turn: -0.3, lookX: -0.6 }], [0.7, { turn: 0.3 }]] }),
    panicPop: () => ({ d: 0.6, k: [[0.05, { glow: 1.6, stretch: 1.4, sy: 1.25, sx: 1.1, shake: 3, pupil: 0.3, mouth: 'gasp', mouthOpen: 1.3, browRaise: 1.6, lhx: -50, lhy: -60, rhx: 50, rhy: -60, lg: 'palm', rg: 'palm', lid: 0, pop: 1.2 }], [0.9, { stretch: 1.6, sy: 1.35 }]] }),
    shaky: () => ({ d: 2.4, k: [[0.1, { shake: 1.8, mouth: 'worry', browTilt: 1.2, browRaise: 0.8, pupil: 0.6, lhx: -14, lhy: 30, rhx: 14, rhy: 28, lg: 'fist', rg: 'fist', knee: -0.5, sweat: 1 }], [0.8, { shake: 1.2 }]] }),
    startle: p => ({ d: 1.5, k: [[0.08, { sy: 1 - 0.14 * p, hipY: 8 * p, lid: 0.4 }], [0.22, { sy: 1 + 0.2 * p, hipY: -50 * p, lfy: 40 * p, rfy: 32 * p, lhx: -66, lhy: -70, rhx: 66, rhy: -74, pop: 1, lg: 'palm', rg: 'back', rroll: -0.5, mouth: 'gasp', mouthOpen: 1, pupil: 0.45, browRaise: 1.3, lid: 0 }], [0.45, { hipY: 6, sy: 0.9, lfy: 0, rfy: 0 }], [0.7, { hipY: 0, sy: 1, mouth: 'grit', shake: 1 }]] }),
    /* hands up, palms out toward the panel: "whoa, whoa, WHOA" */
    whoa: () => ({ d: 1.6, k: [[0.06, { hipX: 8, lean: 7, sy: 1.08, lhx: -74, lhy: -46, rhx: 34, rhy: -118, lg: 'palm', rg: 'palm', lroll: 0.2, rroll: -0.3, mouth: 'gasp', mouthOpen: 1, pop: 1, browRaise: 1.4, pupil: 0.45, lid: 0, turn: -0.45, lookX: -1, lookY: 0.2, sweat: 1 }], [0.3, { lhy: -56, rhy: -110, pop: 0.3 }], [0.45, { lhy: -44, rhy: -122 }], [0.8, { hipX: 0, lean: 0, sy: 1 }]] }),
    /* a wire lands on your screw: it tickles */
    tickle: s => ({ d: 1.3, k: [[0.05, { sy: 0.9, sx: 1.07, lid: 0.55, lowLid: 0.5, mouth: 'smile', mouthOpen: 0.55, blush: 1, shake: 2.4, turn: 0.35 * s, lean: -5 * s, lroll: 0.7, rroll: -0.7 }], [0.45, { shake: 1.4, sy: 1.04 }], [0.85, { shake: 0.2, sy: 1, blush: 0 }]] }),
    swFlinch: () => ({ d: 0.8, k: [[0.1, { sy: 0.9, lid: 0.8, mouth: 'grit' }], [0.4, { sy: 1.04, lid: 0.1 }]] }),
    /* breaker on: the switch covers its eyes, then peeks through its fingers */
    swCover: () => ({ d: 2, k: [[0.08, { sy: 0.93, lhx: 26, lhy: -46, rhx: -26, rhy: -46, lg: 'back', rg: 'back', lLayer: 'front!', rLayer: 'front!', shake: 1.3, mouth: 'grit', mouthOpen: 0.45, browRaise: 0.9 }], [0.5, { rhx: -34, rhy: -22, rroll: 0.5, lookX: 0.8, lookY: 0.2, pupil: 0.5, lid: 0 }], [0.85, { sy: 1 }]] }),
    swShrug: () => ({ d: 1.9, k: [[0.1, { sy: 0.94, hipY: 4, lhx: -50, lhy: -26, rhx: 50, rhy: -26, lg: 'palm', rg: 'palm', lroll: 0.25, rroll: -0.25, browRaise: 1.1, browTilt: 0.7, mouth: 'flat', mouthOpen: 0.3, turn: 0.35, lookX: 1, lookY: -0.2 }], [0.35, { hipY: 0, sy: 1.04 }], [0.8, { sy: 1 }]] }),
    swCheer: () => ({ d: 2, k: [[0.12, { hipY: -30, lfy: 26, rfy: 20, lhx: -40, lhy: -80, rhx: 40, rhy: -80, lg: 'palm', rg: 'palm', mouth: 'smile', mouthOpen: 0.7, browTilt: -0.3, lowLid: 0.4 }], [0.35, { hipY: 0, lfy: 0, rfy: 0 }]] }),
    /* the Inspector: a tip of the cap, a tick on the clipboard, a stern point */
    capTip: () => ({ d: 1.4, k: [[0.15, { rhx: -20, rhy: -150, rg: 'fist', lean: -4, lid: 0.35, mouth: 'happy', mouthOpen: 0.3, browRaise: 0.6 }], [0.55, { rhy: -140 }], [0.85, {}]] }),
    tick: () => ({ d: 0.7, k: [[0.1, { rhx: -70, rhy: -8, rg: 'fist', lookX: -0.7, lookY: 0.8, lid: 0.3 }], [0.35, { rhx: -64, rhy: -2 }], [0.55, { rhx: -72, rhy: -12 }]] }),
    point: s => ({ d: 1.3, k: [[0.12, { rhx: 70 * s, rhy: -60, rg: 'fist', turn: 0.4 * s, lookX: s, browTilt: 1, mouth: 'flat' }], [0.8, {}]] }),
    probe: () => ({ d: 1.8, k: [[0.12, { lhx: -54, lhy: -40, rhx: 54, rhy: -40, lroll: 0.2, rroll: -0.2, lookX: 0, lookY: 0.6, browTilt: 0.8, lid: 0.25, dial: 1 }], [0.85, { dial: 1 }]] }),
    /* the bulb, bypassed by a short: not a flicker of light, just a scream */
    scream: () => ({ d: 1.1, k: [[0.05, { stretch: 1.2, sy: 1.22, sx: 1.08, shake: 3, pupil: 0.3, mouth: 'gasp', mouthOpen: 1.3, browRaise: 1.6, lhx: -50, lhy: -60, rhx: 50, rhy: -60, lg: 'palm', rg: 'palm', lid: 0, pop: 1.2, sweat: 1 }], [0.7, { stretch: 0.6, sy: 1.08 }]] }),
    /* zapped: every limb straight out, eyes like saucers */
    zapped: () => ({ d: 1.2, k: [[0.02, { sy: 1.3, sx: 0.86, lhx: -80, lhy: -90, rhx: 80, rhy: -96, lg: 'palm', rg: 'palm', lroll: 0.6, rroll: -0.6, lfy: 30, rfy: 36, lfx: -30, rfx: 30, mouth: 'gasp', mouthOpen: 1, pupil: 0.3, browRaise: 1.6, lid: 0, pop: 1.3, shake: 5 }], [0.9, { shake: 3 }]] }),
    dazed: () => ({ d: 2.2, k: [[0.05, { sy: 0.82, sx: 1.12, hipY: 8, lean: -8, lhx: -40, lhy: 30, rhx: 40, rhy: 30, lg: 'back', rg: 'back', mouth: 'worry', mouthOpen: 0.5, lid: 0.45, pupil: 0.5, browTilt: 1.2, dizzy: 1 }], [0.5, { lean: 8 }], [0.9, { lean: 0, sy: 1, sx: 1, hipY: 0 }]] }),
    stomp: () => ({ d: 1.4, k: [[0.1, { hipY: -16, sy: 1.12, lhx: -30, lhy: -110, lg: 'fist', mouth: 'grit', mouthOpen: 0.8, browTilt: -1.4, browRaise: 0, lid: 0.3, shake: 1.2 }], [0.3, { hipY: 4, sy: 0.9, lhy: -120 }], [0.5, { hipY: -10, sy: 1.08, lhy: -104 }], [0.8, { hipY: 0, sy: 1 }]] }),
  };

  /* hover: they stiffen up and sweat when the pointer gets near */
  const hoverStiff = (toon, tg, d) => {
    if (!toon.hovered || toon.actions.length) return;
    tg.sy += 0.04; tg.pupil = 0.55; tg.shake += 0.7; tg.browRaise = 1; tg.lid = 0; tg.sweat = 1;
    d.mouth = 'grit'; tg.mouthOpen = 0.35;
  };
  bulb.brain = (t, dt, tg, d) => {
    const lit = bulb.lit || 0;
    if (lit > 0.9) {
      tg.glow = 1; d.mouth = 'smile'; tg.mouthOpen = 0.55; tg.lowLid = 0.35; tg.browTilt = -0.3; tg.browRaise = 0.6; tg.pupil = 1;
      tg.lhx = -50 + 6 * Math.sin(t * 6); tg.lhy = -40; tg.rhx = 50 - 6 * Math.sin(t * 6); tg.rhy = -40; d.lg = 'palm'; d.rg = 'palm'; tg.knee = 0.2; tg.shake = 0;
      tg.lroll = 0.3 * Math.sin(t * 3); tg.rroll = -0.3 * Math.sin(t * 3 + 1);
    } else if (lit > 0.05) {
      tg.glow = lit; d.mouth = 'worry'; tg.lid = 0.5;
    } else {
      /* fretting hands that keep turning over */
      tg.lroll = 0.5 + 0.4 * Math.sin(t * 1.6); tg.rroll = -0.5 - 0.4 * Math.sin(t * 1.6 + 1.1);
      tg.lhy += 2 * Math.sin(t * 5); tg.rhy += 2 * Math.sin(t * 5 + 1.3);
      if (st.power) { tg.shake += 0.9; tg.sweat = 1; tg.pupil = 0.6; tg.browRaise = 1; d.mouth = 'grit'; tg.mouthOpen = 0.3; }
      hoverStiff(bulb, tg, d);
    }
    /* the Phantom's fingers creeping close: lean well away and don't look */
    if (PH.st === 'creep' || PH.st === 'grab') {
      tg.hipX -= 16; tg.lean -= 9; tg.turn = -0.5; tg.sweat = 1; tg.shake += 1.2; tg.pupil = 0.4; tg.browRaise = 1.4; d.mouth = 'gasp'; tg.mouthOpen = 0.6;
      bulb.attn = ph.facePos();
    }
  };
  sw.brain = (t, dt, tg, d) => {
    tg.lever = st.sw ? 1 : -1;
    if (bulb.lit > 0.9) { d.mouth = 'happy'; tg.mouthOpen = 0.5; tg.browTilt = 0; tg.shake = 0.05; tg.lowLid = 0.3; }
    else if (st.power) { tg.shake += 0.6; tg.sweat = 0.8; }
    /* standing in a metal box that's live: he can feel it */
    if (st.power && isHot('S1.g')) { tg.shake += 2.2; tg.sweat = 1; tg.pupil = 0.45; tg.browRaise = 1.2; d.mouth = 'grit'; tg.mouthOpen = 0.5; }
    hoverStiff(sw, tg, d);
  };

  /* ---------- actions ---------- */
  function setPower(on, silent) {
    if (st.blown && on) { say('No bulb in the socket! Wait for the new one.', 4, 'sw'); return; }
    st.power = on;
    if (on) st.trip = false;
    if (!silent) { A.sfx.clunk(on); brk.v += on ? 9 : -9; }
    status(on ? 'Breaker ON. Hands off the wires! Try the switch (click it, or press S).' : 'Breaker OFF. Safe to wire. Drag from one screw to another.');
    if (on) {
      cancelLead(); cancelJob();
      if (!st.inspecting) {
        const m = K.brace(); bulb.play(m.k, m.d);
        const m2 = K.swCover(); sw.play(m2.k, m2.d);
      }
      glance(276 + PX, 240 + PY, 0.8);
      setTimeout(() => {
        if (!st.power || st.inspecting) return;
        const res = evaluate();
        if (res.short) return;
        if (isHot('S1.g')) once('tingle', () => setTimeout(() => say('Why do I feel... tingly? Is my BOX live?! Somebody check it with the tester!', 6, 'sw'), 600));
        if (bulb.lit > 0.9) { A.sfx.select(); const m3 = K.joy(); bulb.play(m3.k, m3.d); glance(1020 + HX, 300, 1.5); }
        else if (st.wires.length === 0) say('Nothing\'s even connected! Turn it off and wire me up first.');
        else if (bulb.lit === 0 && st.sw === 1) { const m3 = K.confused(); bulb.play(m3.k, m3.d); cricket(); }
      }, 450);
    } else evaluate();
  }
  function flipSwitch(quiet) {
    if (!App.running) return;
    const litBefore = bulb.lit;
    st.sw = st.sw ? 0 : 1;
    sw.base.lever = st.sw ? 1 : -1;
    A.sfx.click();
    const m = K.swFlinch(); sw.play(m.k, m.d, { slot: 'small' });
    const [fx, fy] = sw.facePos();
    glance(fx, fy, 0.8);
    if (st.power) {
      const res = evaluate();
      if (res.short || quiet) return;
      if (bulb.lit > 0.9 && litBefore < 0.9) { const m2 = K.joy(); bulb.play(m2.k, m2.d); }
      else if (bulb.lit > 0.9 && litBefore > 0.9) {
        once('bypass', () => { const m2 = K.swShrug(); sw.play(m2.k, m2.d); say('Hey... the switch isn\'t even in my path. Flipping it does nothing!', 6); });
      } else if (bulb.lit === 0 && st.sw === 1 && st.wires.length) { const m2 = K.confused(); bulb.play(m2.k, m2.d); cricket(); }
    }
  }
  function blockLive(id) {
    A.sfx.buzzer(); A.sfx.fizzle();
    const tm = TERMS[id] || TERMS['P.hot'];
    particles.spark(tm.x, tm.y, 7, 0.45);
    if (cursor) particles.bolt(tm.x, tm.y, cursor[0], cursor[1]);
    ev.pilot = now + 0.9; ev.kick = now;
    brk.v += 6;
    say('Breaker\'s ON! Kill the power before you touch any wires.', 4);
    if (!st.blown) { const m = K.whoa(); bulb.play(m.k, m.d); }
    const m2 = K.swFlinch(); sw.play(m2.k, m2.d, { slot: 'small' });
    glance(tm.x, tm.y, 1);
    status('The wires are LIVE. Flip the breaker OFF (click it, or press B) before touching them. The Tester shows what\'s live.');
  }
  /* straight in, no questions: used when a wire is fully landed (and by tests) */
  function addWire(a, b, rope, landed) {
    if (a === b || !TERMS[a] || !TERMS[b]) return false;
    if (st.wires.some(w => (w.a === a && w.b === b) || (w.a === b && w.b === a))) { A.sfx.boing(); return false; }
    const w = { a, b, color: st.color };
    st.wires.push(w);
    syncWires(rope ? { w, rope } : null);
    if (!landed) { tighten(b, !!pig[b]); if (!rope) tighten(a, !!pig[a]); }
    evaluate();
    save();
    return true;
  }
  /* the screw runs down tight on the copper: a ratchet, a spark and a squirm from whoever owns it */
  function tighten(id, quiet) {
    const tm = TERMS[id];
    if (!quiet) { tm.spin = now; tm.spinDir = 1; A.sfx.ratchet(); particles.bonk(tm.x, tm.y, 0.75); particles.spark(tm.x, tm.y, 4, 0.28); }
    glance(tm.x, tm.y, 1.1);
    const who = ownerOf(id);
    if (who === 'sw') { const m = K.tickle(tm.x > sw.cfg.x ? 1 : -1); sw.play(m.k, m.d, { slot: 'small' }); }
    else if (who === 'bulb' && !st.blown) { const m = K.tickle(tm.x > bulb.cfg.x ? 1 : -1); bulb.play(m.k, m.d, { slot: 'small' }); }
    else ev.pilot = Math.max(ev.pilot, now + 0.3);
  }
  function makeLoose(rope, k, color, pins, delay) {
    const P = rope.pts, n = P.length;
    const cut = clamp(k, 2, n - 3);
    const mk = (pts, pin) => {
      const r = { pts: pts.map(q => ({ x: q.x, y: q.y, px: q.px, py: q.py })), seg: rope.seg, still: 0, sleep: false };
      loose.push({ rope: r, o: wireEls(L.wires, color), pin, t0: now, drop: now + delay + rand(0.35, 0.55) });
    };
    mk(P.slice(0, cut + 1), pins[0] ? { end: 'a', at: pins[0] } : null);
    mk(P.slice(cut), pins[1] ? { end: 'b', at: pins[1] } : null);
  }
  const pinFor = id => ({ id, get x() { return pinOf(id)[0]; }, get y() { return pinOf(id)[1]; } });
  function cutWire(i, x, y) {
    if (i < 0 || i >= st.wires.length || st.inspecting) return;
    if (st.power) { blockLive(st.wires[i].a); return; }
    if (lead || job) { cancelLead(); cancelJob(); return; }
    if (st.tester) return;
    const w = st.wires[i], v = vis.get(w);
    let k = Math.floor(v.rope.pts.length / 2);
    if (x != null) { let bd = 1e9; v.rope.pts.forEach((q, j) => { const d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; k = j; } }); }
    const cx = v.rope.pts[k].x, cy = v.rope.pts[k].y;
    makeLoose(v.rope, k, w.color, [pinFor(w.a), pinFor(w.b)], 0);
    st.wires.splice(i, 1);
    syncWires(); evaluate(); save();
    A.sfx.snip();
    particles.bonk(cx, cy, 0.8); particles.spark(cx, cy, 3, 0.2);
    glance(cx, cy, 0.9);
  }
  function clearWires() {
    if (st.inspecting) return;
    if (st.power) { blockLive(); return; }
    if (!st.wires.length) return;
    cancelLead(); cancelJob();
    st.wires.forEach((w, i) => {
      const v = vis.get(w);
      makeLoose(v.rope, Math.floor(v.rope.pts.length / 2), w.color, [pinFor(w.a), pinFor(w.b)], i * 0.09);
      setTimeout(() => A.sfx.snip(), i * 90);
    });
    st.wires = []; syncWires(); evaluate(); save();
  }
  function cricket() { if (!A.ready) return; setTimeout(() => { A.sfx.hover(); setTimeout(() => A.sfx.hover(), 90); }, 500); }

  /* ---------- running a wire: drag, or click one screw then another ---------- */
  let lead = null, cursor = null;
  const termAt = (x, y, r = 34, skip = null) => {
    let best = null, bd = r;
    for (const [id, tm] of Object.entries(TERMS)) { if (id === skip) continue; const dd = Math.hypot(tm.x - x, tm.y - y); if (dd < bd) { bd = dd; best = id; } }
    return best;
  };
  function startLead(id, mode) {
    cancelLead(true);
    const [x, y] = pinOf(id);
    const rope = makeRope(x, y, x + 1, y + 1, 16);
    lead = { from: id, mode, rope, o: wireEls(L.drag, st.color), hand: { x, y }, target: null, moved: false, retract: -1 };
    A.sfx.tick();
  }
  function cancelLead(instant) {
    if (!lead) return;
    if (instant) { removeEls(lead.o); lead = null; return; }
    if (lead.retract < 0) { lead.retract = now; A.sfx.boing(); }
  }

  /* ---------- C + F. landing a wire: wrap it round the screw, pigtail doubled screws ---------- */
  let job = null;
  /* the wrap control lives right on the screw: a dashed guide round the head and
     a brass grip on the end of the copper. Drag the grip round the screw and the
     copper wraps with it. Clockwise (the way a screw tightens) holds; the other
     way gets squeezed out when the screw goes down. */
  const WR = 38, WRAP_OK = 4.6, WRAP_BAD = -3.8;
  const wrapUI = el('g', { opacity: 0 }, L.ui);
  el('circle', { r: WR, fill: 'none', stroke: '#1a0c05', 'stroke-width': 7, opacity: 0.25 }, wrapUI);
  el('circle', { r: WR, fill: 'none', stroke: '#fff3a0', 'stroke-width': 3, 'stroke-dasharray': '6 8', opacity: 0.85 }, wrapUI);
  const wrapHint = el('path', { fill: 'none', stroke: '#9fe0a8', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, wrapUI);
  const wrapGrip = el('g', { class: 'clicky wrapgrip', role: 'slider', tabindex: 0, 'aria-label': 'Wrap the copper round the screw: drag the grip around it, or use the arrow keys' }, wrapUI);
  el('circle', { r: TOUCH ? 32 : 22, fill: 'transparent' }, wrapGrip);
  el('circle', { r: 13, fill: 'url(#gGold)', stroke: INK, 'stroke-width': 3 }, wrapGrip);
  el('path', { d: 'M-6,-3 H6 M-6,1 H6 M-6,5 H6', stroke: '#7a5316', 'stroke-width': 1.6 }, wrapGrip);
  el('circle', { cx: -4, cy: -5, r: 2.4, fill: '#fff6d8', opacity: 0.8 }, wrapGrip);
  const angDiff = d => { while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  function askWrap(id) {
    return new Promise(res => {
      const t = TERMS[id], P = job.rope.pts, q = P[Math.max(0, P.length - 4)];
      job.wrap = { t, id, a0: Math.atan2(q.y - t.y, q.x - t.x), s: 0, res, drag: false, last: 0 };
      job.endB = { t, s: 0 };
      wrapUI.setAttribute('transform', `translate(${t.x},${t.y})`);
      wrapUI.style.display = ''; wrapUI.setAttribute('opacity', 1);
      const a = job.wrap.a0;
      /* after a slip, show which way the screw turns */
      wrapHint.setAttribute('d', `M${R(Math.cos(a) * (WR + 12))},${R(Math.sin(a) * (WR + 12))} A${WR + 12},${WR + 12} 0 1,1 ${R(Math.cos(a + 4.4) * (WR + 12))},${R(Math.sin(a + 4.4) * (WR + 12))} l-9,-4 m9,4 l1,-10`);
      wrapHint.setAttribute('opacity', st.wrapMissed ? 0.9 : 0);
      once('wrap', () => say('Now wrap the copper round the screw: drag the brass grip around it. Which way does a screw tighten?', 7, ownerOf(id) === 'sw' ? 'sw' : 'bulb'));
      status('Wrap it: drag the brass grip around the screw' + (TOUCH ? ' with your finger.' : ' (arrow keys work too).'));
      try { wrapGrip.focus({ preventScroll: true }); } catch (e) { /* no focus */ }
    });
  }
  function hideWrap() { wrapUI.setAttribute('opacity', 0); wrapUI.style.display = 'none'; }
  hideWrap();
  function wrapBy(d) {
    const w = job && job.wrap;
    if (!w) return;
    w.s = clamp(w.s + d, -5.6, 5.6);
    job.endB = { t: w.t, s: w.s };
    if (Math.abs(d) > 0.02 && Math.floor(Math.abs(w.s) / 1.2) !== Math.floor(Math.abs(w.s - d) / 1.2)) A.sfx.tick();
    if (w.s >= WRAP_OK || w.s <= WRAP_BAD) {
      const r = w.res;
      job.wrap = null;
      hideWrap();
      r(w.s > 0);
    }
  }
  wrapGrip.addEventListener('pointerdown', e => {
    const w = job && job.wrap;
    if (!w) return;
    e.stopPropagation(); e.preventDefault();
    const [x, y] = App.toScene(e);
    w.drag = true; w.last = Math.atan2(y - w.t.y, x - w.t.x);
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
  });
  wrapGrip.addEventListener('keydown', e => {
    if (!job || !job.wrap) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); wrapBy(Math.PI / 4); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); wrapBy(-Math.PI / 4); }
  });
  async function landWire(from, target, rope, o) {
    if (from === target || st.wires.some(w => (w.a === from && w.b === target) || (w.a === target && w.b === from))) {
      A.sfx.boing(); removeEls(o); return;
    }
    job = { from, target, rope, o, endB: 'free', pinB: [TERMS[target].x, TERMS[target].y] };
    const me = job;
    if (countAt(target) === 0) {
      if (st.hookOk < 3) {
        const ok = await askWrap(target);
        hideWrap();
        if (job !== me) return;
        if (!ok) { slipOff(); return; }
        st.hookOk++; st.wrapMissed = false;
        if (st.hookOk === 3) setTimeout(() => say('You\'ve got the hang of wrapping. I\'ll wrap them clockwise for you from now on.', 5), 700);
      }
      job.endB = TERMS[target];
      tighten(target);
    }
    for (const id of [target, from]) {
      if (countAt(id) === 0) continue;
      const pg = makePigtail(id, id === target ? from : target, false);
      if (id === target) { job.endB = 'nut'; job.pinB = pg.J; }
      else job.pinA = pg.J;
      const ok = await twistNut(id);
      if (job !== me || !ok) return;
    }
    const j = job;
    job = null;
    removeEls(j.o);
    addWire(from, target, j.rope, true);
    status(st.power ? 'Breaker ON.' : 'Wire landed. Breaker OFF, safe to keep wiring.');
  }
  /* hooked backwards: tightening the screw squeezes the copper right out */
  function slipOff() {
    const j = job;
    job = null;
    const t = TERMS[j.target];
    t.spin = now; t.spinDir = 1;
    A.sfx.ratchet(); setTimeout(() => A.sfx.boing(), 180);
    particles.bonk(t.x, t.y, 0.9);
    const last = j.rope.pts[j.rope.pts.length - 1];
    last.px = last.x + 14; last.py = last.y + 10;
    loose.push({ rope: j.rope, o: j.o, pin: { end: 'a', at: pinFor(j.from) }, t0: now, drop: now + 0.9 });
    st.hookOk = 0; st.wrapMissed = true;
    say('Backwards! A screw tightens clockwise, so wire wrapped the other way gets squeezed right out. Wrap it clockwise.', 7, ownerOf(j.target) === 'sw' ? 'sw' : 'bulb');
    status('The wire slipped off the screw. Run it again, and wrap it clockwise.');
  }
  function cancelJob() {
    if (!job) return;
    const j = job;
    job = null;
    hideWrap();
    for (const [id, pg] of Object.entries(pig)) if (!pg.snug && pg.res) { pg.res = null; if (countAt(id) >= 2) pg.snug = true; else dropPigtail(id); }
    loose.push({ rope: j.rope, o: j.o, pin: { end: 'a', at: pinFor(j.from) }, t0: now, drop: now + 0.4 });
    A.sfx.boing();
  }

  /* ---------- B. the neon voltage tester ---------- */
  const pen = el('g', { opacity: 0 }, L.ui);
  pen.setAttribute('pointer-events', 'none');
  const penGlow = el('circle', { cx: 0, cy: -58, r: 34, fill: 'url(#gNeon)', opacity: 0, style: 'mix-blend-mode:screen' }, pen);
  el('path', { d: 'M0,0 L-3.2,-14 L3.2,-14 Z', fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }, pen);
  el('rect', { x: -2.6, y: -30, width: 5.2, height: 17, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2 }, pen);
  el('rect', { x: -8, y: -96, width: 16, height: 68, rx: 7, fill: 'url(#gPen)', stroke: INK, 'stroke-width': 3 }, pen);
  el('rect', { x: -4.5, y: -74, width: 9, height: 26, rx: 4, fill: '#3a2a1a', stroke: INK, 'stroke-width': 2 }, pen);
  const neon = el('ellipse', { cx: 0, cy: -61, rx: 2.6, ry: 9, fill: '#6a3a22' }, pen);
  el('rect', { x: -8, y: -110, width: 16, height: 16, rx: 5, fill: '#c7322b', stroke: INK, 'stroke-width': 3 }, pen);
  el('path', { d: 'M8,-104 Q14,-100 12,-60', fill: 'none', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, pen);
  el('path', { d: 'M-4,-90 V-80', stroke: '#fff6d8', 'stroke-width': 2.4, opacity: 0.8, 'stroke-linecap': 'round' }, pen);
  const tester = { at: null, hot: false };
  const btnTester = document.getElementById('btnTester');
  function setTester(on) {
    st.tester = on;
    btnTester.setAttribute('aria-pressed', String(on));
    App.frame.classList.toggle('testing', on);
    if (on) { cancelLead(); cancelJob(); A.sfx.tick(); status('Neon tester in hand: touch a screw. It glows if that screw is live. (T puts it down.)'); once('tester', () => say('The neon tester! Touch any screw: if it glows, it\'s LIVE. Test before you touch!', 7)); }
    else { tester.at = null; status(st.power ? 'Breaker ON. Hands off the wires!' : 'Breaker OFF. Safe to wire.'); }
  }
  function testAt(id) {
    const hot = isHot(id);
    tester.at = id; tester.hot = hot;
    glance(TERMS[id].x, TERMS[id].y, 1);
    if (hot) {
      A.sfx.neon();
      once('testHot', () => say('It glows! That screw is LIVE. Hands off until the breaker is OFF.', 6));
      if (!st.blown && !bulb.actions.length) { const m = K.startle(0.35); bulb.play(m.k, m.d); }
    } else {
      A.sfx.tick();
      once(st.power ? 'testDeadOn' : 'testDeadOff', () => say(st.power ? 'No glow on that one. Neutral, or not connected: it isn\'t carrying the push.' : 'No glow: dead. With the breaker OFF, that\'s what safe looks like.', 6));
    }
  }

  /* ---------- the dead short: a set piece ---------- */
  function soot(x, y, r) { soots.push(el('ellipse', { cx: x, cy: y, rx: r, ry: r * 0.8, fill: 'url(#gSoot)', opacity: 0 }, L.soot)); }
  /* What a bolted fault really does: fault current, an arc where hot meets
     neutral (or ground), and the breaker trips instantly. The bulb is bypassed,
     so it doesn't blow; it just screams. The shop lamp is on another circuit, so
     it only dips as the voltage sags. The cartoon part is the size of it all. */
  function arcBlast(fault) {
    const p1 = TERMS[fault.at[0]], p2 = TERMS[fault.at[1]] || p1;
    bubS.until = Math.min(bubS.until, now);
    cancelLead(); cancelJob();
    ev.arc = now + 0.5; ev.arcA = p1; ev.arcB = p2;
    particles.spark(p1.x, p1.y, 26, 1.2); particles.spark(p2.x, p2.y, 14, 0.9);
    particles.bonk(p1.x, p1.y, 2); particles.smoke(p1.x, p1.y, 5, 1);
    ev.flash = now; ev.shake = now; ev.dip = now;
    lamp.w += 1.6;
    shakeWires(1.4);
    for (const v of vis.values()) v.surge = now + 0.4;
    A.duck(4);
    A.sfx.zap(); A.sfx.boom();
    soot(p1.x, p1.y, 36);
    ev.sootOn = true; ev.soot = now;
    if (!st.blown) { const m = K.scream(); bulb.play(m.k, m.d); }
    const m2 = K.startle(1); sw.play(m2.k, m2.d);
    /* the breaker trips: its handle snaps to the middle, the flag drops */
    setTimeout(() => {
      st.power = false; st.trip = true; ev.tripT = now;
      brk.v -= 14; A.sfx.clunk(false);
      evaluate();
    }, 90);
  }
  async function deadShort(res) {
    st.faultLock = true; st.shorts++;
    const a = C.analyze(LEVEL, st.wires);
    const fault = a.faults.find(f => f.trips && f.state.S1 === st.sw) || a.faults.find(f => f.trips) || { code: 'short', at: res.shortPairs[0], trips: true, state: { S1: st.sw } };
    arcBlast(fault);
    status(`Breaker TRIPPED: ${fault.code === 'ground-fault' ? 'hot touched ground' : 'hot met neutral'} at ${C.nameOf(LEVEL, fault.at[0])}. Reset it OFF, then fix the wiring.`);
    if (A.settings.scares) setTimeout(() => phantomAfterShort(), 900);
    await wait(0.5);
    const m3 = K.shaky(); bulb.play(m3.k, m3.d);
    await wait(A.settings.scares ? 3.6 : 2.2);
    if (App.current !== 'level') { st.faultLock = false; return; }
    const d = C.describe(LEVEL, fault);
    showResult({ pass: false, tripped: true, danger: true, title: d.title, msg: d.msg + ' The breaker did its job. Reset it by switching it fully OFF, fix the wiring, then try again.' });
  }
  function newBulb() {
    st.blown = false; st.faultLock = false;
    ev.sootOn = false; ev.soot = now;
    status('Breaker OFF. Safe to wire. Drag from one screw to another.');
    bulb.root.style.display = '';
    bulb.actions = [];
    bulb.p.hipY = -600; bulb.p.lfy = 618; bulb.p.rfy = 608; bulb.v.hipY = bulb.v.lfy = bulb.v.rfy = 0;
    ev.cord0 = now; ev.cord1 = now + 2.8 * 0.62;
    const land = () => { A.sfx.thud(); particles.bonk(1020 + HX, 440, 1.1); particles.smoke(976 + HX, 442, 2, 0.5, -30); particles.smoke(1064 + HX, 442, 2, 0.5, 30); };
    bulb.play([
      /* feet dangle with the body (the rig's feet are measured up from the socket) */
      [0, { hipY: -600, lhx: 26, lhy: -196, rhx: -26, rhy: -196, lg: 'fist', rg: 'fist', lLayer: 'front!', rLayer: 'front!', lfy: 618, rfy: 608, knee: 0.7, lookY: 1, mouth: 'worry', browRaise: 1.1, sweat: 1, pupil: 0.6, shake: 0.8 }],
      [0.5, { hipY: -26, lfy: 38, rfy: 30 }],
      [0.56, { hipY: 0, sy: 0.8, sx: 1.14, lfy: 0, rfy: 0, lookY: 0.5 }],
      [0.64, { sy: 1.06, sx: 0.96, lhx: -22, lhy: 50, rhx: 22, rhy: 50, lg: 'fist', rg: 'fist', lookY: 0 }],
      [0.72, { turn: 0.55, sy: 1 }], [0.78, { turn: -0.55 }], [0.84, { turn: 0.5 }], [0.9, { turn: 0 }],
    ], 2.8, { cues: [[0.01, () => A.sfx.slide(false)], [0.56, land], [0.72, () => A.sfx.ratchet()], [0.78, () => A.sfx.ratchet()], [0.84, () => A.sfx.ratchet()], [0.95, () => { say('P-please get it right this time...', 5); const m = K.shaky(); bulb.play(m.k, m.d); }]] });
    evaluate();
  }

  /* ---------- A. the Inspector: traces the job terminal by terminal ---------- */
  const IN = { st: 'off', v: 0, dir: -1, ph: 0, goal: 820, skip: false, aim: null, fly: null, xray: -9, dazed: -9, capFly: null };
  const iwait = s => new Promise(r => {
    const t0 = now;
    const tick = () => { if (IN.skip || now - t0 >= s) r(); else setTimeout(tick, 50); };
    setTimeout(tick, 50);
  });
  const walkTo = x => new Promise(r => {
    if (Math.abs(x - insp.cfg.x) < 6) { r(); return; }
    IN.goal = x; IN.dir = x < insp.cfg.x ? -1 : 1; IN.st = 'walk'; IN.arrive = r;
  });
  /* where he stands on the bench to reach a terminal with his probe */
  const standAt = id => clamp(TERMS[id].x + (TERMS[id].x < 330 ? 74 : 36), 340, 1110);
  const marks = el('g', {}, L.ui);
  marks.setAttribute('pointer-events', 'none');
  const capFly = el('g', { opacity: 0 }, L.fx);
  el('path', { d: 'M-31,-2 Q-29,-30 0,-32 Q29,-30 31,-2 Z', fill: '#2c3a52', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, capFly);
  el('path', { d: 'M-41,0 Q0,5 43,-1 Q44,4 40,6 Q0,11 -40,6 Q-44,4 -41,0 Z', fill: '#18202e', stroke: INK, 'stroke-width': 2.6 }, capFly);
  el('path', { d: 'M0,-26 L3,-20 L10,-19 L5,-15 L6,-8 L0,-12 L-6,-8 L-5,-15 L-10,-19 L-3,-20 Z', fill: 'url(#gGold)', stroke: INK, 'stroke-width': 1.4 }, capFly);
  const dizzy = [0, 1, 2].map(() => el('path', { d: 'M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z', fill: '#ffe45a', stroke: INK, 'stroke-width': 2, opacity: 0 }, L.fx));
  function markOK(id) {
    const t = TERMS[id];
    el('path', { d: `M${t.x + 16},${t.y - 26} l6,7 l12,-16`, fill: 'none', stroke: '#1a0c05', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.35 }, marks);
    el('path', { d: `M${t.x + 16},${t.y - 26} l6,7 l12,-16`, fill: 'none', stroke: '#b8f0a0', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, marks);
  }
  function markBad(id) {
    const t = TERMS[id];
    el('circle', { cx: t.x, cy: t.y, r: 27, fill: 'none', stroke: '#ff5a3a', 'stroke-width': 4, 'stroke-dasharray': '7 5' }, marks);
  }
  insp.brain = (t, dt, tg, d) => {
    insp.profile = IN.st === 'walk' ? IN.dir : 0;
    tg.browTilt = 0.9; tg.lid = 0.3;
    if (IN.st === 'walk') {
      const ph2 = IN.ph, cyc = Math.cos(2 * Math.PI * ph2);
      tg.hipY += -5 * (0.5 - 0.5 * Math.cos(4 * Math.PI * ph2));
      tg.turn = IN.dir * 0.55; tg.lean += IN.dir * 3; tg.knee = 0.25;
      tg.rhx = 24 + IN.dir * 14 * cyc; tg.rhy += 3 * Math.abs(Math.sin(2 * Math.PI * ph2));
      tg.lhx = -34; tg.lhy = 30; d.lg = 'fist'; d.rg = 'fist';
      d[IN.dir > 0 ? 'rLayer' : 'lLayer'] = 'back';
      insp.attn = null; tg.lookX = IN.dir * 0.7;
      return;
    }
    if (IN.st === 'fly' || IN.st === 'zap') return;
    /* clipboard hand tucked in; the red probe reaches for whatever he's examining */
    tg.lhx = -34; tg.lhy = 30;
    const aim = IN.aim;
    if (aim) {
      const [sx, sy] = insp.world(52, -134);
      const dx = aim[0] - sx, dy = aim[1] - sy, dd = Math.hypot(dx, dy) || 1, k = Math.max(0, dd - 34) / dd;
      tg.rhx = (dx * k) / insp.cfg.scale; tg.rhy = (dy * k) / insp.cfg.scale; d.rg = 'fist'; d.rLayer = 'front';
      tg.lean += clamp(dx / 16, -9, 9); tg.turn = clamp(dx / 200, -0.5, 0.5);
      insp.attn = aim; tg.browTilt = 1.1; tg.lid = 0.25; d.mouth = 'flat';
    }
    if (now < IN.dazed) { tg.shake += 1; tg.lid = 0.45; tg.pupil = 0.5; d.mouth = 'worry'; tg.mouthOpen = 0.4; }
  };
  insp.drive = p => {
    if (IN.st !== 'walk') return;
    const T0 = 0.5, A0 = (70 * T0) / (4 * insp.cfg.scale), H = 12, ph2 = IN.ph;
    [['lfx', 'lfy', 'ltoe', 0], ['rfx', 'rfy', 'rtoe', 0.5]].forEach(([kx, ky, kt, o]) => {
      const u = (((ph2 + o) % 1) + 1) % 1;
      let x, y;
      if (u < 0.5) { x = A0 * (1 - 4 * u); y = 0; } else { const q = (u - 0.5) * 2; x = A0 * (-1 + 2 * q); y = H * Math.sin(Math.PI * q); }
      p[kx] = IN.dir * x; p[ky] = y; p[kt] = y > 1 ? (u < 0.8 ? -14 : 12) : 0;
      insp.v[kx] = 0; insp.v[ky] = 0;
    });
  };
  function inspTick(dt) {
    if (IN.st === 'fly') {
      const F = IN.fly, u = clamp((now - F.t0) / F.dur);
      insp.cfg.x = F.x0 + (F.x1 - F.x0) * u;
      insp.cfg.y = F.y0 - F.h * 4 * u * (1 - u);
      if (u >= 1) {
        insp.cfg.y = 594; IN.st = 'stand';
        inspWrap.removeAttribute('transform');
        A.sfx.thud(); A.sfx.boing();
        particles.bonk(insp.cfg.x, 560, 1.4); particles.smoke(insp.cfg.x - 20, 590, 2, 0.6, -30); particles.smoke(insp.cfg.x + 20, 590, 2, 0.6, 30);
        ev.shake = now - 0.3;
        if (F.done) F.done();
      }
      return;
    }
    if (IN.st !== 'walk') return;
    IN.ph += dt / 0.5;
    const step2 = (IN.skip ? 1200 : 240) * dt * IN.dir;
    insp.cfg.x += step2;
    if ((IN.dir < 0 && insp.cfg.x <= IN.goal) || (IN.dir > 0 && insp.cfg.x >= IN.goal)) {
      insp.cfg.x = IN.goal; IN.st = 'stand';
      insp.p.lfx = insp.p.rfx = insp.p.lfy = insp.p.rfy = 0;
      if (IN.arrive) { const r = IN.arrive; IN.arrive = null; r(); }
    } else if (Math.floor(IN.ph * 2) !== Math.floor((IN.ph - dt / 0.5) * 2)) A.sfx.tiptoe();
  }
  const inspScreen = s => { insp.d.screen = s; insp.baseD.screen = s; };
  /* a short line for the bubble; the full write-up goes on the report */
  const spoken = f => `${C.describe(LEVEL, f).title.replace(/!$/, '')}! Right here at ${C.nameOf(LEVEL, f.at[0])}.`;
  /* he tells the switch where he wants it, and it obeys */
  async function setSwitchFor(s, why) {
    if (st.sw === s) return;
    say(`Switch, ${s ? 'ON' : 'OFF'}${why ? ': ' + why : '!'}`, 2.2, 'insp');
    await iwait(0.6);
    st.sw = s; sw.base.lever = s ? 1 : -1; A.sfx.click();
    const m = K.swFlinch(); sw.play(m.k, m.d, { slot: 'small' });
    evaluate();
    await iwait(0.4);
  }
  /* the wire (if any) that runs straight between two terminals gets his chalk line */
  function traceBetween(a, b) {
    for (const [w, v] of vis) if ((w.a === a && w.b === b) || (w.a === b && w.b === a)) v.trace = now + 1.6;
  }
  async function inspectorRun() {
    if (st.inspecting || st.blown || App.cardOpen || App.busy || st.faultLock) return;
    const an = C.analyze(LEVEL, st.wires);
    const route = C.route(LEVEL, st.wires);
    /* the fault he walks into first, following the job out from the HOT */
    let fault = null;
    for (const id of route) { fault = an.faults.find(f => f.at[0] === id); if (fault) break; }
    fault = fault || an.primary;
    const report = fault ? Object.assign({ pass: false, rows: an.rows, fault }, C.describe(LEVEL, fault)) : { pass: true, title: 'Wired right!', msg: LEVEL.winText, rows: an.rows };
    cancelLead(true); cancelJob(); setTester(false);
    st.inspecting = true; IN.skip = false; IN.aim = null;
    while (marks.firstChild) marks.firstChild.remove();
    insp.root.style.display = ''; insp.cfg.x = 1370; insp.cfg.y = 594; insp.actions = [];
    insp.cap.style.display = ''; insp.hair.setAttribute('opacity', 0);
    inspScreen('- - -'); insp.ticks.setAttribute('d', '');
    A.sfx.slide(true);
    status('The Inspector is tracing the job, screw by screw. (Tap or click to hurry him along.)');
    /* 1. the source: breaker first */
    await walkTo(340);
    say('Inspection! Breaker first.', 2, 'insp');
    IN.aim = BRK_AT;
    await iwait(0.9);
    if (st.power || st.trip) {
      say(st.trip ? 'Tripped? Reset it OFF.' : 'It\'s ON?! Nobody works on it live.', 2.4, 'insp');
      await iwait(0.5);
      st.trip = false; st.power = false; brk.v -= 9; A.sfx.clunk(false); evaluate();
      await iwait(0.6);
    } else { inspScreen('OFF'); A.sfx.beep(); await iwait(0.6); }
    IN.aim = null;
    /* 2. out along the wiring, one connection at a time */
    let prev = null, switched = false;
    const target = fault ? fault.at[0] : null;
    for (const id of route) {
      if (!switched && ownerOf(id) === 'sw' && fault && fault.danger && fault.state && fault.state.S1 != null) {
        switched = true;
        await setSwitchFor(fault.state.S1, fault.state.S1 ? 'let\'s check it closed.' : 'the safe way.');
      }
      await walkTo(standAt(id));
      if (prev) traceBetween(prev, id);
      prev = id;
      IN.aim = [TERMS[id].x, TERMS[id].y];
      inspScreen('OHMS'); A.sfx.beep();
      await iwait(0.55);
      if (id === target) break;
      inspScreen('OK');
      markOK(id); A.sfx.typeKey();
      const n = route.indexOf(id);
      insp.ticks.setAttribute('d', (insp.ticks.getAttribute('d') || '') + ` M${-12 + (n % 2) * 14},${-18 + Math.floor(n / 2) * 10} l3,3 l6,-7`);
      await iwait(0.35);
    }
    /* 3. the problem, and what happens next */
    if (fault) {
      markBad(target);
      inspScreen('? ? ?');
      say('Hmm... now what have we got here?', 2.4, 'insp');
      await iwait(0.9);
      if (fault.danger && A.settings.scares) {
        report.danger = true;
        await accident(fault);
        if (App.current !== 'level' || !st.inspecting) return;
      } else if (fault.danger) {
        report.danger = true;
        inspScreen('DANGER');
        say(spoken(fault) + ' Energized, that would be dangerous.', 4, 'insp');
        await iwait(2.6);
      } else {
        inspScreen('NO');
        say(spoken(fault), 3.2, 'insp');
        await iwait(2.4);
      }
    } else {
      /* 4. nothing wrong anywhere: energize and try every switch position, live */
      IN.aim = null;
      say('Every connection checks out. Energizing!', 2.2, 'insp');
      await iwait(0.8);
      insp.play(K.point(-1).k, K.point(-1).d);
      await iwait(0.4);
      st.power = true; st.trip = false; brk.v += 9; A.sfx.clunk(true); particles.bonk(BRK_AT[0], BRK_AT[1] - 20, 0.6);
      const m = K.brace(); bulb.play(m.k, m.d);
      for (let i = 0; i < an.rows.length; i++) {
        const row = an.rows[i];
        await iwait(0.4);
        await setSwitchFor(row.state.S1);
        evaluate();
        inspScreen(row.lit.L1 > 0.9 ? 'LIT' : 'DARK');
        insp.play(K.tick().k, K.tick().d, { slot: 'small' });
        A.sfx.typeKey();
        await iwait(0.7);
      }
      st.power = false; brk.v -= 9; A.sfx.clunk(false);
      await setSwitchFor(0);
      evaluate();
      say('Mm-hm. Mm-HM. Report\'s ready.', 2, 'insp');
      await iwait(1.2);
    }
    IN.skip = false; IN.aim = null;
    if (App.current !== 'level' || !st.inspecting) return;
    showResult(report);
    if (report.pass) {
      st.won = true; save();
      setTimeout(() => { particles.confetti(640, 300, 60); A.sfx.fanfare(); }, (0.3 + an.rows.length * 0.28 + 0.35) * 1000);
      const m = K.joy(); bulb.play(m.k, m.d);
      const m2 = K.swCheer(); sw.play(m2.k, m2.d);
    } else {
      const m = K.confused(); if (!st.blown) bulb.play(m.k, m.d);
      const m2 = K.swShrug(); sw.play(m2.k, m2.d);
    }
  }
  /* 6. The accident: while he's bent over the fault with the power safely OFF,
     the Phantom slithers out of the hole by the panel and flips the breaker ON.
     circuit.js decides what that does; this only makes it big. */
  async function accident(fault) {
    const F = fault.at[0];
    inspScreen('HMM');
    await phantomSabotage();
    if (App.current !== 'level') return;
    st.power = true;
    const hit = C.touch(LEVEL, st.wires, { S1: st.sw }, F);
    if (hit.trips) arcBlast(fault);
    else { evaluate(); particles.spark(TERMS[F].x, TERMS[F].y, 16, 0.9); }
    if (hit.shock) await zapAndLaunch(F, hit.arc);
    if (App.current !== 'level') return;
    /* back on his feet, right by the panel */
    say('WHO turned that breaker ON?!', 2.4, 'insp');
    const k = K.stomp(); insp.play(k.k, k.d);
    await wait(1.3);
    IN.aim = BRK_AT;
    await wait(0.5);
    if (st.trip) say('Tripped, at least. Good breaker. Resetting it OFF.', 2.6, 'insp');
    st.trip = false; st.power = false;
    brk.v -= 12; A.sfx.clunk(false); evaluate();
    particles.bonk(BRK_AT[0], BRK_AT[1], 0.8);
    await wait(1);
    IN.aim = null;
    inspScreen('DANGER');
    say(spoken(fault), 3.6, 'insp');
    await wait(2.6);
  }
  function zapAndLaunch(F, arc) {
    return new Promise(res => {
      IN.st = 'zap'; IN.aim = null; IN.xray = now + 0.7;
      const [hx, hy] = insp.world(0, -200);
      particles.bolt(TERMS[F].x, TERMS[F].y, hx, hy); particles.bolt(TERMS[F].x, TERMS[F].y, hx + 20, hy - 30);
      particles.spark(TERMS[F].x, TERMS[F].y, 18, 1);
      insp.hair.setAttribute('opacity', 1);
      const z = K.zapped(); insp.play(z.k, z.d);
      A.sfx.zap(); A.sfx.neon(); setTimeout(() => A.sfx.ahh(), 150);
      inspScreen(arc ? 'ARC!!' : '!!!!');
      setTimeout(() => {
        /* launched: the cap goes one way, he goes the other, and he lands by the panel */
        const x0 = insp.cfg.x, x1 = x0 > 520 ? 372 : x0 + 420;
        insp.cap.style.display = 'none';
        IN.capFly = { t0: now, x: x0, y: 594 - 300 * 0.62, vx: x1 < x0 ? 160 : -160, vy: -560 };
        IN.fly = { t0: now, dur: 1.05, x0, y0: 594, x1, h: 250, spin: x1 < x0 ? -720 : 720, done: () => { IN.dazed = now + 2.2; const dz = K.dazed(); insp.play(dz.k, dz.d); setTimeout(res, 900); } };
        IN.st = 'fly';
        A.sfx.whoosh();
      }, 650);
    });
  }
  async function inspectorLeave() {
    if (IN.st === 'off') return;
    while (marks.firstChild) marks.firstChild.remove();
    insp.play(K.capTip().k, K.capTip().d);
    await wait(0.9);
    walkTo(1370).then(() => { insp.root.style.display = 'none'; IN.st = 'off'; insp.cap.style.display = ''; insp.hair.setAttribute('opacity', 0); capFly.setAttribute('opacity', 0); IN.capFly = null; });
    st.inspecting = false;
    status(st.won ? 'Approved! Keep tinkering, or head back to the menu.' : 'Breaker OFF. Fix the wiring, then call the Inspector again.');
  }

  /* ---------- D. the Frayed Phantom, who lives in the hole in the wall ---------- */
  /* he can use either hole: the big one low on the right, or the little one right
     beside the panel. His cord always runs back into whichever he came out of. */
  const PH = { st: 'hid', hole: HOLE, x: HOLE.x, y: HOLE.y + 90, gx: HOLE.x, gy: HOLE.y + 90, t0: 0, target: null, reach: 0, spd: 3, alpha: 1, alphaGoal: 1 };
  const inside = h => [h.x, h.y + (h === HOLE ? 90 : 4)];
  const phW = (wx, wy) => [(wx - PH.hole.x) / ph.cfg.scale, (wy - PH.hole.y) / ph.cfg.scale + ph.cfg.hipH];
  const phArm = (tg, side, px, py) => {
    const [sx, sy] = ph.world(side < 0 ? -16 : 16, -92), s = ph.cfg.scale;
    tg[side < 0 ? 'lhx' : 'rhx'] = (px - sx) / s; tg[side < 0 ? 'lhy' : 'rhy'] = (py - sy) / s;
  };
  const phGo = (x, y, spd = 3) => { PH.gx = x; PH.gy = y; PH.spd = spd; };
  ph.brain = (t, dt, tg, d) => {
    const k = 1 - Math.exp(-dt * PH.spd);
    PH.x += (PH.gx - PH.x) * k; PH.y += (PH.gy - PH.y) * k;
    const [hx, hy] = phW(PH.x, PH.y);
    tg.hipX += hx; tg.hipY += hy;
    tg.hipY += 6 * Math.sin(t * 0.8); tg.hipX += 3 * Math.sin(t * 0.53 + 1); tg.lean += 6 * Math.sin(t * 0.41);
    tg.lhx = -30; tg.lhy = 92; tg.rhx = 30; tg.rhy = 92; d.lg = 'back'; d.rg = 'back'; d.lLayer = d.rLayer = 'back';
    tg.turn = -0.3; tg.lookX = -0.8; tg.pupil = 0.3; tg.hood = 0.4;
    if (PH.st === 'peek') { d.mouth = 'wiregrin'; tg.mouthOpen = 0.45 + 0.2 * Math.sin(t * 9); tg.lean -= 10; tg.lid = 0.3; }
    else if (PH.st === 'creep' || PH.st === 'grab') {
      const p = PH.target;
      d.mouth = PH.st === 'grab' ? 'wiregrin' : 'seam'; tg.mouthOpen = PH.st === 'grab' ? 0.8 : 0.05; tg.lean -= 14; tg.turn = -0.45;
      if (p) {
        ph.attn = [p.x, p.y];
        const [sx, sy] = ph.world(-16, -92);
        const u = PH.reach;
        phArm(tg, -1, sx + (p.x - sx) * u, sy + (p.y - sy) * u);
        d.lg = PH.st === 'grab' ? 'fist' : 'claw'; d.lLayer = 'front!';
      }
    } else if (PH.st === 'hiss') {
      d.mouth = 'wiregrin'; tg.mouthOpen = 1; tg.lhx = -36; tg.lhy = 20; tg.rhx = 36; tg.rhy = 20; d.lg = d.rg = 'claw'; d.lLayer = d.rLayer = 'front'; tg.shake += 1.5; tg.hood = 1;
    } else if (PH.st === 'zap') {
      d.mouth = 'O'; tg.mouthOpen = 1; tg.shake += 4; tg.lhx = -40; tg.lhy = -20; tg.rhx = 40; tg.rhy = -20; d.lg = d.rg = 'palm'; d.lLayer = d.rLayer = 'front'; tg.pupil = 0.6;
    } else if (PH.st === 'flee') { d.mouth = 'O'; tg.mouthOpen = 0.6; }
    else if (PH.st === 'sneak' || PH.st === 'flick') {
      /* one long bony finger for the breaker handle, and that grin */
      d.mouth = PH.st === 'flick' ? 'wiregrin' : 'seam'; tg.mouthOpen = PH.st === 'flick' ? 0.7 : 0.05;
      tg.lean -= 12; tg.turn = -0.45; tg.lid = 0.35; tg.hood = 0.9;
      const p = PH.target;
      if (p) {
        ph.attn = p;
        const [sx, sy] = ph.world(-16, -92);
        phArm(tg, -1, sx + (p[0] - sx) * PH.reach, sy + (p[1] - sy) * PH.reach);
        d.lg = 'point'; d.lLayer = 'front!';
      }
    }
  };
  function phShow(hole = HOLE) {
    if (ph.root.style.display === 'none' || PH.hole !== hole) {
      PH.hole = hole; ph.cfg.x = hole.x; ph.cfg.y = hole.y;
      ph.root.style.display = '';
      [PH.x, PH.y] = inside(hole); PH.gx = PH.x; PH.gy = PH.y;
      /* the side hole has no wall in front of it to hide him, so he fades in from the dark */
      PH.alpha = hole === HOLE ? 1 : 0; PH.alphaGoal = 1;
      L.phantom.setAttribute('clip-path', hole === HOLE ? 'url(#phClip)' : '');
      if (hole !== HOLE) L.phantom.removeAttribute('clip-path');
    }
  }
  function phHide() {
    PH.st = 'hid';
    const [x, y] = inside(PH.hole);
    phGo(x, y, 4);
    if (PH.hole !== HOLE) PH.alphaGoal = 0;
    setTimeout(() => { if (PH.st === 'hid') { ph.root.style.display = 'none'; PH.hole = HOLE; ph.cfg.x = HOLE.x; ph.cfg.y = HOLE.y; L.phantom.setAttribute('clip-path', 'url(#phClip)'); } }, 1100);
  }
  /* out of the little hole by the panel, one bony finger, and the breaker goes ON */
  async function phantomSabotage() {
    phShow(HOLE2);
    PH.st = 'lurk'; PH.target = null; PH.reach = 0;
    phGo(HOLE2.x - 4, HOLE2.y - 4, 3);
    A.sfx.freeze();
    await wait(0.7);
    PH.st = 'sneak'; phGo(302, 238, 2.2);
    PH.target = [BRK_AT[0] + 2, BRK_AT[1] + 22];
    await wait(0.9);
    for (let u = 0; u <= 1; u += 0.1) { PH.reach = u; await wait(0.05); }
    await wait(0.25);
    /* flick: the handle goes up */
    PH.st = 'flick';
    PH.target = [BRK_AT[0] + 2, BRK_AT[1] - 16];
    A.sfx.clunk(true); brk.v += 11;
    particles.bonk(BRK_AT[0], BRK_AT[1] - 10, 0.7);
    await wait(0.12);
    /* he's gone before anyone looks round */
    setTimeout(() => { A.sfx.laugh(false); PH.reach = 0; PH.st = 'flee'; phHide(); }, 350);
  }
  async function phantomAfterShort() {
    phShow();
    PH.st = 'lurk'; phGo(HOLE.x - 6, HOLE.y - 40, 2.2);
    await wait(2.1);
    PH.st = 'peek'; phGo(HOLE.x - 30, HOLE.y - 118, 3);
    A.sfx.laugh(false); A.sfx.fizzle();
    await wait(1.5);
    phHide();
  }
  async function phantomSwipe() {
    const cands = [];
    for (const [w, v] of vis) v.rope.pts.forEach((q, i) => { if (i > 1 && i < v.rope.pts.length - 2 && q.x > 780 && q.y > 300) cands.push([w, q]); });
    if (!cands.length) return;
    const [w, q] = cands.reduce((a, b) => (b[1].x > a[1].x ? b : a));
    PH.target = q; PH.wire = w; PH.reach = 0;
    phShow();
    PH.st = 'lurk'; phGo(HOLE.x - 16, HOLE.y - 110, 2);
    A.sfx.freeze();
    await wait(1.4);
    if (PH.st !== 'lurk') return;
    PH.st = 'creep'; phGo(Math.max(1090, q.x + 150), clamp(q.y - 150, 250, 380), 1.2);
    once('phantom', () => setTimeout(() => say('Eek! Shoo him! Click him before he grabs a wire!', 4), 400));
    const t0 = now;
    while (PH.st === 'creep' && now - t0 < 5 && App.current === 'level') {
      PH.reach = clamp((now - t0) / 4.4);
      await wait(0.05);
    }
    if (PH.st !== 'creep') return;
    if (App.current !== 'level' || lead || job || st.inspecting) { PH.st = 'flee'; phHide(); return; }
    PH.st = 'grab';
    if (!st.wires.includes(w)) { phHide(); return; }
    const v = vis.get(w);
    if (st.power && v && (v.hot || v.current)) {
      /* grabbed a live one: bitten */
      PH.st = 'zap';
      particles.bolt(q.x, q.y, PH.x, PH.y - 60); particles.spark(q.x, q.y, 14, 0.8); particles.smoke(PH.x, PH.y - 60, 3, 0.8);
      A.sfx.zap(); ev.flash = now - 0.3;
      await wait(0.8);
      PH.st = 'flee'; say('Ha! Live wires bite. Even him.', 4);
      await wait(0.4);
      phHide();
      return;
    }
    /* he yanks it off both screws and drags it down his hole */
    A.sfx.laugh(false);
    const i = st.wires.indexOf(w);
    st.wires.splice(i, 1);
    const k = v.rope.pts.indexOf(q);
    loose.push({ rope: v.rope, o: wireEls(L.wires, w.color), pin: { end: 'mid', k, at: { get x() { return PH.handX; }, get y() { return PH.handY; } } }, t0: now, drop: now + 2.2 });
    for (const id of [w.a, w.b]) { TERMS[id].spin = now; TERMS[id].spinDir = -1; }
    A.sfx.ratchet();
    syncWires(); evaluate(); save();
    status('The Phantom swiped a wire! Run it again.');
    await wait(0.5);
    PH.st = 'flee';
    phHide();
    setTimeout(() => say('He took one of my wires! The nerve!', 4), 300);
  }
  ph.root.addEventListener('click', e => {
    e.stopPropagation();
    if (PH.st !== 'creep' && PH.st !== 'lurk' && PH.st !== 'peek') return;
    PH.st = 'hiss'; A.sfx.fizzle(); A.sfx.buzzer();
    particles.bonk(PH.x, PH.y - 60, 1);
    setTimeout(() => { PH.st = 'flee'; phHide(); status('Shoo! He\'s back in his hole.'); }, 700);
  });

  /* ---------- the report, with the stamp and the Journeyman's card ---------- */
  const resultCard = document.getElementById('resultCard');
  const stamp = document.getElementById('resultStamp');
  const punch = document.getElementById('punchCard');
  function grade() {
    const named = st.wires.map(w => ({ a: w.a, b: w.b, color: COLOR_NAME[w.color] || 'black' }));
    return { noShort: st.shorts === 0, colors: C.colorCheck(LEVEL, named).ok, fewest: st.wires.length <= LEVEL.par, noHints: st.hint === 0 };
  }
  function showResult(r) {
    document.getElementById('resultTitle').textContent = r.title;
    document.getElementById('resultMsg').textContent = r.msg;
    const table = document.getElementById('resultTable');
    table.innerHTML = '';
    const nRows = r.rows ? r.rows.length : 0;
    if (r.rows) {
      table.hidden = false;
      const head = table.createTHead().insertRow();
      ['Switch', 'Bulb'].forEach(h => { const th = document.createElement('th'); th.textContent = h; head.appendChild(th); });
      const body = table.createTBody();
      r.rows.forEach((row, i) => {
        const tr = body.insertRow();
        tr.style.setProperty('--i', i);
        tr.insertCell().textContent = row.state.S1 ? 'ON' : 'OFF';
        const b = row.res.short ? 'SHORT!' : row.lit.L1 > 0.9 ? 'LIT' : row.lit.L1 > 0.05 ? 'dim' : 'dark';
        const c = tr.insertCell(); c.textContent = b; c.className = b === 'LIT' ? 'lit' : b === 'SHORT!' ? 'bad' : '';
        setTimeout(() => A.sfx.typeKey(), (0.25 + i * 0.28) * 1000);
      });
    } else table.hidden = true;
    const sd = 0.3 + nRows * 0.28;
    stamp.textContent = r.pass ? 'Approved' : r.tripped ? 'Tripped' : r.danger ? 'Danger!' : 'Rejected';
    stamp.className = 'stamp ' + (r.pass ? 'pass' : 'fail');
    stamp.style.setProperty('--d', sd + 's');
    void stamp.offsetWidth;
    stamp.classList.add('go');
    setTimeout(() => A.sfx.stamp(), (sd + 0.12) * 1000);
    /* E. the Journeyman's card, punched for every bit of craft */
    punch.hidden = !r.pass;
    if (r.pass) {
      const g = grade();
      let n = 0;
      punch.querySelectorAll('li').forEach(li => {
        const got = !!g[li.dataset.k];
        li.classList.toggle('got', got);
        if (got) { li.style.setProperty('--pd', (sd + 0.5 + n * 0.25) + 's'); setTimeout(() => A.sfx.tick(), (sd + 0.5 + n * 0.25) * 1000); n++; }
      });
      let best = 0;
      try { best = Math.max(n, +(localStorage.getItem('circuitPanic.level1.card') || 0)); localStorage.setItem('circuitPanic.level1.card', best); } catch (e) { best = n; }
      document.getElementById('punchScore').textContent = `${n}/4` + (best > n ? ` (best ${best}/4)` : '');
    }
    resultCard.classList.toggle('pass', !!r.pass);
    document.getElementById('resultRetry').textContent = st.blown ? 'New bulb, please' : r.pass ? 'Keep tinkering' : 'Back to the board';
    document.getElementById('resultMenu').hidden = !r.pass;
    App.showCard('resultCard', () => { if (st.blown) newBulb(); st.faultLock = false; if (st.inspecting) inspectorLeave(); });
  }
  document.getElementById('resultMenu').addEventListener('click', () => { App.closeCard(); App.go('menu', { from: [640, 360] }); });

  /* ---------- input ---------- */
  const busy = () => !App.running || App.cardOpen || App.busy || st.inspecting;
  L.terms.addEventListener('pointerdown', e => {
    const g = e.target.closest('.term');
    if (!g || busy()) return;
    e.preventDefault();
    const id = g.dataset.term;
    cursor = App.toScene(e);
    if (st.tester) { testAt(id); return; }
    if (job) return;
    if (st.power) { blockLive(id); return; }
    if (st.blown) { say('Hang on, I\'m being replaced!', 3, 'sw'); return; }
    if (lead && lead.mode === 'pending' && lead.retract < 0) {
      if (lead.from !== id) finishLead(id); else cancelLead();
      return;
    }
    startLead(id, 'drag');
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
  });
  function finishLead(target) {
    const l = lead;
    lead = null;
    landWire(l.from, target, l.rope, l.o);
  }
  svg.addEventListener('pointermove', e => {
    if (App.current !== 'level') return;
    cursor = App.toScene(e);
    lastInput = now;
    /* dragging the wrap grip round the screw */
    const w = job && job.wrap;
    if (w && w.drag) {
      const ang = Math.atan2(cursor[1] - w.t.y, cursor[0] - w.t.x);
      const d = angDiff(ang - w.last);
      w.last = ang;
      wrapBy(d);
      return;
    }
    if (st.tester) {
      const at = termAt(cursor[0], cursor[1], TOUCH ? 44 : 30);
      if (at !== tester.at) { if (at) testAt(at); else tester.at = null; }
      return;
    }
    if (!lead || lead.retract >= 0) return;
    const a = TERMS[lead.from];
    if (Math.hypot(cursor[0] - a.x, cursor[1] - a.y) > 12) lead.moved = true;
    const tg = termAt(cursor[0], cursor[1], SNAP, lead.from);
    if (tg !== lead.target) { lead.target = tg; if (tg) { A.sfx.tick(); TERMS[tg].pulse = now; } }
  });
  svg.addEventListener('pointercancel', () => {
    if (job && job.wrap) job.wrap.drag = false;
    if (lead && lead.mode === 'drag') cancelLead();
  });
  svg.addEventListener('pointerup', e => {
    if (job && job.wrap && job.wrap.drag) { job.wrap.drag = false; return; }
    if (!lead || lead.mode !== 'drag') return;
    cursor = App.toScene(e);
    if (!lead.moved) { lead.mode = 'pending'; status((TOUCH ? 'Now tap' : 'Now click') + ' a second screw to connect them, or tap empty board to cancel.'); return; }
    const target = termAt(cursor[0], cursor[1], SNAP, lead.from);
    if (target) finishLead(target); else cancelLead();
  });
  svg.addEventListener('click', e => {
    if (App.current !== 'level') return;
    lastInput = now;
    if (st.inspecting && IN.st !== 'off') { IN.skip = true; return; }
    if (lead && lead.mode === 'pending' && !e.target.closest('.term')) { cancelLead(); status(st.power ? 'Breaker ON.' : 'Breaker OFF. Safe to wire.'); }
  });
  L.terms.addEventListener('keydown', e => {
    const g = e.target.closest('.term');
    if (!g || (e.key !== 'Enter' && e.key !== ' ') || busy()) return;
    e.preventDefault();
    const id = g.dataset.term;
    if (st.tester) { testAt(id); return; }
    if (job) return;
    if (st.power) { blockLive(id); return; }
    if (st.blown) return;
    if (lead && lead.mode === 'pending' && lead.from !== id) finishLead(id);
    else if (lead && lead.from === id) cancelLead();
    else { startLead(id, 'pending'); const tm = TERMS[id]; cursor = [tm.x + 40, tm.y + 60]; }
  });
  /* a tripped breaker has to be pushed fully OFF to reset before it'll go ON */
  function resetBreaker() {
    st.trip = false; st.power = false;
    A.sfx.clunk(false); brk.v -= 9;
    evaluate();
    status('Breaker reset to OFF. Fix the wiring before you switch it back ON.');
  }
  const toggleBreaker = () => { if (busy() || st.faultLock) return; if (st.trip) resetBreaker(); else setPower(!st.power); };
  breaker.addEventListener('click', e => { e.stopPropagation(); toggleBreaker(); });
  breaker.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBreaker(); } });
  sw.root.addEventListener('click', e => { e.stopPropagation(); if (!busy()) flipSwitch(); });
  bulb.root.addEventListener('click', e => { e.stopPropagation(); if (!busy() && !st.blown) { const m = K.startle(0.5); bulb.play(m.k, m.d); A.sfx.squeak(); } });
  insp.root.addEventListener('click', e => { e.stopPropagation(); if (IN.st !== 'off') IN.skip = true; });
  for (const toon of [sw, bulb]) {
    toon.root.addEventListener('pointerenter', () => { toon.hovered = true; });
    toon.root.addEventListener('pointerleave', () => { toon.hovered = false; });
  }

  /* ---------- HUD ---------- */
  const hud = document.getElementById('hud');
  const statusEl = document.getElementById('status');
  function status(text) {
    if (statusEl.textContent === text) return;
    statusEl.textContent = text;
    statusEl.classList.remove('typed'); void statusEl.offsetWidth; statusEl.classList.add('typed');
  }
  document.querySelectorAll('.swatch').forEach(b => b.addEventListener('click', () => {
    st.color = b.dataset.color;
    document.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', String(s === b)));
    A.sfx.tick();
  }));
  btnTester.addEventListener('click', () => { if (!busy()) setTester(!st.tester); });
  document.getElementById('btnHint').addEventListener('click', () => { if (st.inspecting) return; say(LEVEL.hints[st.hint % LEVEL.hints.length], 8); st.hint++; });
  document.getElementById('btnInspect').addEventListener('click', () => { if (!App.cardOpen) inspectorRun(); });
  document.getElementById('btnClear').addEventListener('click', clearWires);
  document.getElementById('btnMenu').addEventListener('click', () => { if (!App.busy && !st.inspecting && !st.faultLock) App.go('menu', { from: [640, 360] }); });
  window.addEventListener('keydown', e => {
    if (App.current !== 'level' || App.cardOpen || !App.running) return;
    lastInput = now;
    if (st.inspecting) { if (e.key === 'Escape' || e.key === ' ') IN.skip = true; return; }
    if (job && job.wrap && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { wrapBy(e.key === 'ArrowRight' ? Math.PI / 4 : -Math.PI / 4); return; }
    if (e.key === 's' || e.key === 'S') flipSwitch();
    else if (e.key === 'b' || e.key === 'B') toggleBreaker();
    else if (e.key === 't' || e.key === 'T') setTester(!st.tester);
    else if (e.key === 'Escape') { if (st.tester) setTester(false); cancelLead(); cancelJob(); }
  });

  function save() { try { localStorage.setItem('circuitPanic.level1', JSON.stringify({ wires: st.wires, won: st.won })); } catch (e) { /* storage unavailable */ } }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem('circuitPanic.level1') || 'null');
      if (s && Array.isArray(s.wires)) { st.wires = s.wires.filter(w => TERMS[w.a] && TERMS[w.b]).map(w => ({ a: w.a, b: w.b, color: WCOL[w.color] ? w.color : '#1c1c1e' })); st.won = !!s.won; }
    } catch (e) { /* storage unavailable */ }
  }

  /* ---------- per-frame work ---------- */
  let acc = 0;
  function physics(dt) {
    acc = Math.min(acc + dt, 0.1);
    const h = 1 / 120;
    while (acc >= h) {
      acc -= h;
      for (const [w, v] of vis) if (!v.rope.sleep) stepRope(v.rope, h, pinOf(w.a), pinOf(w.b));
      for (const [id, pg] of Object.entries(pig)) if (!pg.rope.sleep) stepRope(pg.rope, h, [TERMS[id].x, TERMS[id].y], pg.J);
      for (const l of loose) {
        const pinned = l.pin && now < l.drop;
        if (l.pin && l.pin.end === 'mid') {
          if (pinned) { const q = l.rope.pts[l.pin.k]; q.x = l.pin.at.x; q.y = l.pin.at.y; }
          stepRope(l.rope, h, null, null);
          if (pinned) { const q = l.rope.pts[l.pin.k]; q.x = l.pin.at.x; q.y = l.pin.at.y; }
        } else {
          const pin = pinned ? [l.pin.at.x, l.pin.at.y] : null;
          stepRope(l.rope, h, l.pin && l.pin.end === 'a' ? pin : null, l.pin && l.pin.end === 'b' ? pin : null);
        }
      }
      if (lead) {
        const a = pinOf(lead.from);
        let tx, ty;
        if (lead.retract >= 0) { const u = clamp((now - lead.retract) / 0.28); tx = lead.hand.x + (a[0] - lead.hand.x) * u; ty = lead.hand.y + (a[1] - lead.hand.y) * u; }
        else if (lead.target) { tx = TERMS[lead.target].x; ty = TERMS[lead.target].y; }
        else if (cursor) { tx = cursor[0]; ty = cursor[1]; }
        else { tx = a[0] + 30; ty = a[1] + 50; }
        const k = 1 - Math.exp(-h * (lead.target ? 38 : 24));
        lead.hand.x += (tx - lead.hand.x) * k; lead.hand.y += (ty - lead.hand.y) * k;
        const d = Math.hypot(lead.hand.x - a[0], lead.hand.y - a[1]);
        lead.rope.seg = (d + (lead.retract >= 0 ? 2 : slackFor(d) * 0.7)) / (lead.rope.pts.length - 1) + 0.01;
        stepRope(lead.rope, h, a, [lead.hand.x, lead.hand.y]);
      }
      if (job) {
        const a = job.pinA || pinOf(job.from), b = job.pinB;
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        job.rope.seg += ((d + slackFor(d)) / (job.rope.pts.length - 1) - job.rope.seg) * 0.02;
        stepRope(job.rope, h, a, b);
      }
    }
    if (lead && lead.retract >= 0 && now - lead.retract > 0.3) { removeEls(lead.o); lead = null; }
    for (let i = loose.length - 1; i >= 0; i--) {
      const l = loose[i], u = (now - l.drop) / 0.5;
      if (u >= 1) { removeEls(l.o); loose.splice(i, 1); }
    }
  }

  function render(t, f) {
    /* cables */
    for (const [w, v] of vis) {
      if (!v.rope.sleep || v.dirty !== false) { drawRope(v.o, v.rope, endOf(w.a), endOf(w.b)); v.dirty = !v.rope.sleep; }
      const surge = now < (v.surge || 0);
      v.o.glow.setAttribute('opacity', surge ? (f % 2 ? 0.8 : 0.3) : v.current ? R((0.24 + 0.08 * Math.sin(t * 9)) * 100) / 100 : v.hot ? 0.16 : 0);
      v.o.flow.setAttribute('opacity', v.current ? 1 : 0);
      const tr2 = now < (v.trace || 0);
      v.o.trace.setAttribute('opacity', tr2 ? 0.9 : 0);
      if (tr2) v.o.trace.setAttribute('stroke-dashoffset', R((t * 60) % 22));
      if (v.current) v.o.flow.setAttribute('stroke-dashoffset', R(((-t * 90 * v.dir) % 30 + 30) % 30));
    }
    for (const [id, pg] of Object.entries(pig)) {
      drawRope(pg.o, pg.rope, TERMS[id], 'nut');
      pg.o.glow.setAttribute('opacity', pg.hot ? 0.16 : 0);
      const tu = clamp((now - pg.turn) / 0.25);
      const rot = (pg.twists + (tu < 1 ? tu - 1 : 0)) * 120;
      const wob = pg.snug ? 0 : 8 * Math.sin(t * 6);
      pg.nut.setAttribute('transform', `translate(${R(pg.J[0])},${R(pg.J[1])}) rotate(${R(wob)})`);
      let rd = '';
      for (let i = 0; i < 4; i++) { const x = -9 + ((i * 6 + rot / 20) % 18); rd += `M${R(x)},${R(-2 - Math.abs(x) * 0.2)} L${R(x * 0.7)},${R(-20 + Math.abs(x) * 0.3)} `; }
      pg.ribs.setAttribute('d', rd);
      pg.arrow.setAttribute('opacity', !pg.snug && pg.res ? R((0.6 + 0.4 * Math.sin(t * 8)) * 100) / 100 : 0);
    }
    for (const l of loose) {
      const pinned = l.pin && now < l.drop && l.pin.end !== 'mid';
      const at = pinned ? (l.pin.at.id && pig[l.pin.at.id] ? 'nut' : l.pin.at.id ? TERMS[l.pin.at.id] : null) : null;
      drawRope(l.o, l.rope, pinned && l.pin.end === 'a' ? at : null, pinned && l.pin.end === 'b' ? at : null);
      const u = (now - l.drop) / 0.5;
      l.o.g.setAttribute('opacity', u > 0 ? R((1 - u) * 100) / 100 : 1);
      l.o.shadow.setAttribute('opacity', u > 0 ? 0 : 0.24);
    }
    if (lead) drawRope(lead.o, lead.rope, endOf(lead.from), 'free');
    if (job) drawRope(job.o, job.rope, endOf(job.from), job.endB);
    /* screws spin down tight (or back out); rings show where a wire can land */
    for (const [id, tm] of Object.entries(TERMS)) {
      const su = (now - tm.spin) / 0.42;
      const rot = tm.rot + (su >= 0 && su < 1 ? (1 - Math.pow(1 - su, 3)) * 540 * tm.spinDir : 0);
      if (su >= 1) { tm.rot = (tm.rot + 540 * tm.spinDir) % 360; tm.spin = -9; }
      tm.slot.setAttribute('transform', `translate(${tm.x},${tm.y}) rotate(${R(rot)})`);
      let op = 0, r = 23, sw2 = 4;
      if (lead && lead.retract < 0) {
        if (id === lead.from) { op = 0.95; r = 21; }
        else if (id === lead.target) { op = 1; r = 25 + 3 * Math.sin(t * 16); sw2 = 5.5; }
        else { op = 0.35 + 0.2 * Math.sin(t * 5 + tm.x * 0.01); }
      } else if (job && job.wrap && job.wrap.id === id) { op = 0.5; r = 18; }
      else if (st.tester && tester.at === id) { op = 0.9; r = 22; }
      const pu = (now - (tm.pulse || -9)) / 0.3;
      if (pu >= 0 && pu < 1) r += 10 * (1 - pu);
      sa(tm.ring, { opacity: R(op * 100) / 100, r: R(r), 'stroke-width': sw2 });
    }
    /* the wrap grip rides the end of the copper; let go early and it springs back */
    if (job && job.wrap) {
      const w = job.wrap;
      if (!w.drag && Math.abs(w.s) > 0.01) { w.s *= 0.8; job.endB = { t: w.t, s: w.s }; }
      const a = w.a0 + w.s;
      wrapGrip.setAttribute('transform', `translate(${R(Math.cos(a) * WR)},${R(Math.sin(a) * WR)})`);
    }
    /* the neon tester follows the pointer and snaps to a screw */
    if (st.tester && cursor) {
      const tp = tester.at ? [TERMS[tester.at].x, TERMS[tester.at].y] : cursor;
      const lit = tester.at && isHot(tester.at);
      pen.setAttribute('opacity', 1);
      pen.setAttribute('transform', `translate(${R(tp[0])},${R(tp[1])}) rotate(32)`);
      neon.setAttribute('fill', lit ? (f % 3 ? '#ffb070' : '#ff8a3a') : '#6a3a22');
      penGlow.setAttribute('opacity', lit ? R((0.75 + 0.25 * Math.sin(t * 40)) * 100) / 100 : 0);
    } else pen.setAttribute('opacity', 0);
    /* the breaker handle: a sprung throw with a little overshoot */
    const bp = brk.p, fc = 271 - bp * 20, uh = Math.abs(bp) * 11;
    sa(hFace, { y: R(fc - 14) });
    sa(hUnder, { y: R(bp >= 0 ? fc + 12 : fc - 12 - uh), height: R(Math.max(0.1, uh)), opacity: uh > 1 ? 1 : 0 });
    hGrip.setAttribute('d', `M176,${R(fc - 5)} H206 M176,${R(fc + 3)} H206`);
    tripFlag.setAttribute('opacity', st.trip ? 1 : 0);
    tripFlag.setAttribute('transform', st.trip ? `translate(${R((1 - clamp((now - ev.tripT) / 0.25)) * -16)},0)` : '');
    /* pilot jewel */
    const blink = now < ev.pilot && f % 4 < 2;
    const pilotOn = (st.power && !blink) || (!st.power && blink);
    jewel.setAttribute('fill', pilotOn ? 'url(#gJewelOn)' : 'url(#gJewelOff)');
    jewelGlow.setAttribute('opacity', pilotOn ? R((0.75 + 0.15 * Math.sin(t * 13)) * 100) / 100 : 0);
    /* the lamp swings on its cord; the blackout kills it */
    const acc2 = (-9.8 / 2.2) * Math.sin(lamp.th) - 0.9 * lamp.w + 0.2 * Math.sin(t * 0.5);
    lamp.w += acc2 / 24; lamp.th += lamp.w / 24;
    const tr = `translate(640,22) rotate(${R(lamp.th * 57.3)})`;
    lamp.g.setAttribute('transform', tr); lamp.coneG.setAttribute('transform', tr);
    const black = now > ev.black0 && now < ev.black1;
    const stutter = black && (Math.random() < 0.08 || (now > ev.black1 - 0.35 && f % 3 === 0));
    /* the shop lamp is on another circuit: a fault only makes it dip and flicker */
    const dipping = now - ev.dip < 0.45;
    const lampOn = black && !stutter ? 0 : dipping ? (Math.random() < 0.5 ? 0.3 : 0.75) : 1;
    lamp.cone.setAttribute('opacity', lampOn);
    lamp.bulbE.setAttribute('fill', lampOn > 0.6 ? '#fff4c8' : lampOn > 0 ? '#c8b070' : '#5a4a30');
    lampPool.setAttribute('opacity', lampOn);
    benchPool.setAttribute('opacity', lampOn);
    benchPool.setAttribute('cx', R(640 + Math.sin(lamp.th) * 520));
    darkRect.setAttribute('opacity', black ? (stutter ? 0.5 : 0.96) : 0);
    for (const de of darkEyes) {
      const c = de.c, F = c.cfg.face, evil = c === ph;
      if (!black || c.root.style.display === 'none') { de.g.setAttribute('opacity', 0); continue; }
      de.g.setAttribute('opacity', 1);
      const blinkNow = !evil && (f + Math.floor(c.phase * 10)) % 36 < 2;
      const turn = clamp(c.p.turn, -1, 1);
      [-1, 1].forEach((s, i) => {
        const [ex, ey] = c.world(F.x + turn * F.turnShift + s * F.spacing, F.y + c.p.faceY);
        const k = evil ? 1 : 1.2;
        const rx = F.rx * c.cfg.scale * k, ry = F.ry * c.cfg.scale * k * (blinkNow ? 0.12 : 1), jit = evil ? 0 : rand(-0.8, 0.8);
        sa(de.e[i].w, { cx: R(ex + jit), cy: R(ey), rx: R(rx), ry: R(ry) });
        sa(de.e[i].p, { cx: R(ex + jit + clamp(c.p.lookX, -1, 1) * rx * 0.4), cy: R(ey + clamp(c.p.lookY, -1, 1) * ry * 0.35), rx: R(rx * (evil ? 0.2 : 0.3)), ry: R(ry * (evil ? 0.18 : 0.34)) });
      });
    }
    /* the arc: lightning jumping between the shorted screws */
    if (now < ev.arc && ev.arcA) {
      if (f % 2 === 0) particles.bolt(ev.arcA.x, ev.arcA.y, ev.arcB.x + rand(-10, 10), ev.arcB.y + rand(-10, 10));
      if (Math.random() < 0.5) { const p = pick([ev.arcA, ev.arcB]); particles.spark(p.x, p.y, 3, 0.6); }
    }
    /* soot fades in with the bang and out when the new bulb arrives */
    const su2 = clamp((now - ev.soot) / (ev.sootOn ? 0.2 : 1.2));
    const sop = ev.sootOn ? su2 : 1 - su2;
    for (const s of soots) s.setAttribute('opacity', R(sop * 100) / 100);
    if (!ev.sootOn && su2 >= 1 && soots.length) { soots.forEach(s => s.remove()); soots.length = 0; }
    /* the lit bulb warms the whole corner of the room */
    const lit = st.blown ? 0 : clamp(bulb.p.glow);
    const [blx, bly] = bulb.world(0, -150);
    sa(bulbGlow, { cx: R(blx), cy: R(bly + 30), opacity: R(clamp(lit - 0.12) * 80) / 100 });
    vign.setAttribute('opacity', R((1 - lit * 0.35) * 100) / 100);
    /* the replacement bulb comes down on a cord */
    if (now > ev.cord0 && now < ev.cord1 + 0.6) {
      const [hx, hy] = bulb.world(0, -236);
      const up = clamp((now - ev.cord1) / 0.6);
      cord.setAttribute('d', `M${R(hx)},-20 L${R(hx)},${R(hy + (-20 - hy) * up)}`);
      cord.setAttribute('opacity', up < 1 ? 1 : 0);
    } else cord.setAttribute('opacity', 0);
    /* speech bubble pops in and fades out */
    const bu = (now - bubS.t0) / 0.22;
    const bs = bu < 1 ? 0.5 + 0.5 * easeOutBack(clamp(bu)) : 1;
    const bo = now < bubS.until ? 1 : clamp(1 - (now - bubS.until) / 0.25);
    bub.setAttribute('opacity', R(bo * 100) / 100);
    bub.setAttribute('transform', `translate(${R(bubS.tip[0])},${R(bubS.tip[1])}) scale(${R(bs * 100) / 100}) translate(${R(-bubS.tip[0])},${R(-bubS.tip[1])})`);
    flash.setAttribute('opacity', R(Math.max(0, 0.7 - (now - ev.flash) * 2.2) * 100) / 100);
    const sh = Math.max(0, 0.6 - (now - ev.shake)) * 20;
    shakeG.setAttribute('transform', sh > 0 ? `translate(${R(rand(-sh, sh))},${R(rand(-sh, sh))})` : '');
    breaker.setAttribute('transform', now - ev.kick < 0.4 ? `translate(${R(rand(-1.5, 1.5))},0)` : '');
    /* the Inspector: spinning through the air, X-ray flashes, a flying cap, stars */
    if (IN.st === 'fly' && IN.fly) {
      const u = clamp((now - IN.fly.t0) / IN.fly.dur);
      inspWrap.setAttribute('transform', `rotate(${R(IN.fly.spin * u)} ${R(insp.cfg.x)} ${R(insp.cfg.y - 90)})`);
    }
    inspWrap.setAttribute('filter', now < IN.xray && f % 2 ? 'url(#xray)' : '');
    if (IN.capFly) {
      const c = IN.capFly, ct = now - c.t0;
      const y = Math.min(588, c.y + c.vy * ct + 900 * ct * ct);
      capFly.setAttribute('opacity', 1);
      capFly.setAttribute('transform', `translate(${R(c.x + c.vx * Math.min(ct, 1.2))},${R(y)}) rotate(${R(y < 588 ? ct * 540 : 12)})`);
    }
    dizzy.forEach((s, i) => {
      if (now > IN.dazed || IN.st === 'off') { s.setAttribute('opacity', 0); return; }
      const [hx, hy] = insp.world(0, -250), a = t * 5 + (i * Math.PI * 2) / 3;
      s.setAttribute('opacity', 1);
      s.setAttribute('transform', `translate(${R(hx + Math.cos(a) * 44)},${R(hy + Math.sin(a) * 12)}) rotate(${R(t * 200)})`);
    });
  }

  /* ---------- screen lifecycle ---------- */
  let lastF = -1;
  App.register('level', {
    enter() {
      root.style.display = ''; hud.hidden = false;
      now = performance.now() / 1000; lastInput = now;
      st.blown = false; st.faultLock = false; st.trip = false; st.sw = 0; sw.base.lever = -1; st.inspecting = false;
      bulb.root.style.display = ''; bulb.actions = []; sw.actions = [];
      insp.root.style.display = 'none'; IN.st = 'off'; IN.aim = null; IN.capFly = null; IN.dazed = -9; IN.xray = -9;
      insp.cfg.y = 594; inspWrap.removeAttribute('transform'); inspWrap.removeAttribute('filter');
      insp.cap.style.display = ''; insp.hair.setAttribute('opacity', 0); capFly.setAttribute('opacity', 0);
      while (marks.firstChild) marks.firstChild.remove();
      ph.root.style.display = 'none'; PH.st = 'hid'; PH.hole = HOLE; ph.cfg.x = HOLE.x; ph.cfg.y = HOLE.y; L.phantom.setAttribute('clip-path', 'url(#phClip)');
      ev.sootOn = false; soots.forEach(s => s.remove()); soots.length = 0;
      ev.black0 = ev.black1 = ev.arc = -9;
      for (const id of Object.keys(pig)) dropPigtail(id);
      load(); syncWires();
      setPower(false, true);
      setTester(false);
      brk.p = -1; brk.v = 0;
      document.getElementById('objective').textContent = LEVEL.objective;
      document.getElementById('levelName').textContent = `Level ${LEVEL.id}: ${LEVEL.name}`;
    },
    shown() {
      say(st.wires.length ? 'Welcome back. The breaker\'s off, I checked. Twice.' : 'Oh! You\'re wiring ME? Okay. Okay. Hint button\'s down on the bench if you need it.', 6);
    },
    exit() { root.style.display = 'none'; hud.hidden = true; A.sfx.hum(false); particles.clear(); cancelLead(true); if (job) { removeEls(job.o); job = null; hideWrap(); } setTester(false); },
    update(t, dt) {
      now = t;
      physics(dt);
      inspTick(dt);
      /* the breaker handle springs toward where it's been thrown */
      const bt = st.power ? 1 : st.trip ? 0 : -1;
      brk.v += (bt - brk.p) * 520 * dt; brk.v *= Math.exp(-18 * dt); brk.p += brk.v * dt;
      const fresh = cursor && (lead || sw.hovered || bulb.hovered || st.tester);
      for (const toon of [sw, bulb]) {
        toon.attn = fresh ? cursor : st.inspecting && IN.st !== 'off' ? insp.facePos() : now < look.until ? [look.x, look.y] : null;
        toon.update(t, dt);
      }
      if (IN.st !== 'off') { insp.attn = IN.st === 'walk' ? null : IN.aim || bulb.facePos(); insp.update(t, dt); }
      if (ph.root.style.display !== 'none') {
        PH.alpha += (PH.alphaGoal - PH.alpha) * Math.min(1, dt * 5);
        ph.root.style.opacity = R(PH.alpha * 100) / 100;
        ph.update(t, dt);
        const hp = ph.handPoints();
        if (hp.length) { PH.handX = hp[1][0]; PH.handY = hp[1][1]; }
      }
      /* the Phantom gets ideas when the player wanders off */
      if (A.settings.scares && PH.st === 'hid' && ph.root.style.display === 'none' && now - lastInput > 28 && st.wires.length && !busy() && !lead && !job && !st.blown) {
        lastInput = now;
        phantomSwipe();
      }
      particles.update(dt);
      const f = Math.floor(t * 24);
      if (f === lastF) return;
      lastF = f;
      render(t, f);
    },
  });

  window.CircuitLevel = { LEVEL, st, TERMS, addWire, setPower, toggleBreaker, flipSwitch, inspect: inspectorRun, clearWires, cutWire, newBulb, landWire, setTester, testAt, phantomSwipe, phantomSabotage, wrapBy, sw, bulb, insp, ph, PH, IN, vis, pig, ev, K, say, get job() { return job; }, get lead() { return lead; } };
})();
