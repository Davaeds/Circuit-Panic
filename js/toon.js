/* Circuit Panic! — rubber-hose character rig and the cast.
   Every character is built from inked SVG parts: hose limbs (curved strokes),
   white four-finger gloves with several drawn views, pie-cut eyes with lids,
   brows, cheeks and a mouth with drawn shapes. A spring-driven pose is rendered
   at 24 fps, and a light turbulence filter re-seeds 12 times a second so the
   ink lines wobble like hand-drawn animation. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#1c130e', CREAM = '#fbf4e2';
  let uid = 0;

  function el(tag, a, p) {
    const e = document.createElementNS(NS, tag);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  }
  function sa(e, a) { for (const k in a) e.setAttribute(k, a[k]); }
  const R = n => Math.round(n * 10) / 10;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const noise = (t, s) => Math.sin(t * 1.31 + s) * 0.5 + Math.sin(t * 2.17 + s * 1.7) * 0.3 + Math.sin(t * 0.53 + s * 2.3) * 0.4;
  function hexLerp(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    return '#' + [16, 8, 0].map(sh => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t)).toString(16).padStart(2, '0')).join('');
  }

  /* ---------- shared drawings (gloves, shoes, gradients, wobble filters) ---------- */
  const G = `fill="${CREAM}" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"`;
  const finger = (a, len = 24, from = 8) => `<rect x="0" y="-5.5" width="${len}" height="11" rx="5.5" transform="translate(20 0) rotate(${a}) translate(${from} 0)"/>`;
  const cuff = `<path d="M-6 -13 Q3 -17 9 -12 V12 Q3 17 -6 13 Z"/><path d="M2 -14 V14" fill="none" stroke-width="2"/>`;
  /* hand-inked weight: an ink copy of the silhouette nudged down-right sits behind the
     drawing, so outlines read thick on the shadow side and thin on the lit side */
  const INKDROP = `<feOffset in="b" dx="2.2" dy="2.8" result="o"/><feColorMatrix in="o" type="matrix" values="0 0 0 0 .11  0 0 0 0 .075  0 0 0 0 .055  0 0 0 4 -2" result="ink"/><feMerge><feMergeNode in="ink"/><feMergeNode in="b"/></feMerge>`;
  const GRADE = `<feColorMatrix type="matrix" values=".95 .05 0 0 0  .02 .9 .03 0 0  0 .06 .8 0 0  0 0 0 1 0"/>`;
  const gloveShade = `<path d="M9 9 Q21 19 34 7" fill="none" stroke="#cdbf9c" stroke-width="4.5" stroke-linecap="round" opacity=".8"/>`;
  const DEFS = `
  <radialGradient id="gGlassOff" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#fffdf6"/><stop offset=".55" stop-color="#ece4ce"/><stop offset="1" stop-color="#b3a88e"/></radialGradient>
  <radialGradient id="gGlassOn" cx="40%" cy="34%" r="72%"><stop offset="0" stop-color="#fffff2"/><stop offset=".45" stop-color="#ffec86"/><stop offset="1" stop-color="#ef9f24"/></radialGradient>
  <radialGradient id="gGlow"><stop offset="0" stop-color="#ffe98a" stop-opacity=".95"/><stop offset=".35" stop-color="#ffc94a" stop-opacity=".42"/><stop offset="1" stop-color="#ff9a20" stop-opacity="0"/></radialGradient>
  <radialGradient id="gShadow"><stop offset="0" stop-color="#2a140a" stop-opacity=".55"/><stop offset=".6" stop-color="#2a140a" stop-opacity=".25"/><stop offset="1" stop-color="#2a140a" stop-opacity="0"/></radialGradient>
  <linearGradient id="gBrass" x1="0" x2="1"><stop offset="0" stop-color="#7d5616"/><stop offset=".3" stop-color="#f4d680"/><stop offset=".55" stop-color="#d6a846"/><stop offset="1" stop-color="#6e4a12"/></linearGradient>
  <linearGradient id="gPlate" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffaea"/><stop offset=".6" stop-color="#eedfbc"/><stop offset="1" stop-color="#c9b286"/></linearGradient>
  <linearGradient id="gRecep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c7a0"/><stop offset="1" stop-color="#f1e4c6"/></linearGradient>
  <linearGradient id="gSteel" x1="0" x2="1"><stop offset="0" stop-color="#5d5a55"/><stop offset=".35" stop-color="#d2cec4"/><stop offset="1" stop-color="#4c4944"/></linearGradient>
  <linearGradient id="gFuseGlass" x1="0" x2="1"><stop offset="0" stop-color="#b9d3d6"/><stop offset=".35" stop-color="#f3fbfb"/><stop offset="1" stop-color="#9dbcc0"/></linearGradient>
  <linearGradient id="gHolster" x1="0" x2="1"><stop offset="0" stop-color="#b8861c"/><stop offset=".35" stop-color="#f0c247"/><stop offset="1" stop-color="#a77712"/></linearGradient>
  <linearGradient id="gPCB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b8a5c"/><stop offset=".6" stop-color="#43704a"/><stop offset="1" stop-color="#2d5236"/></linearGradient>
  <radialGradient id="gCable" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#e98a6e"/><stop offset=".5" stop-color="#b8392c"/><stop offset="1" stop-color="#7a1c14"/></radialGradient>
  <radialGradient id="gVolume" cx="34%" cy="28%" r="85%"><stop offset="0" stop-color="#fffaf0" stop-opacity=".35"/><stop offset=".45" stop-color="#fffaf0" stop-opacity="0"/><stop offset=".8" stop-color="#5a2e10" stop-opacity=".18"/><stop offset="1" stop-color="#3a1a08" stop-opacity=".42"/></radialGradient>
  <linearGradient id="gBox" x1="0" x2="1"><stop offset="0" stop-color="#6e6a63"/><stop offset=".4" stop-color="#c4bfb4"/><stop offset="1" stop-color="#5a5650"/></linearGradient>
  ${[0, 1, 2, 3].map(i => `<filter id="boil${i}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="1" seed="${i * 7 + 3}"/><feDisplacementMap in="SourceGraphic" scale="1.9" xChannelSelector="R" yChannelSelector="G" result="b"/>${INKDROP}${GRADE}</filter><filter id="boilT${i}" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="1" seed="${i * 7 + 3}"/><feDisplacementMap in="SourceGraphic" scale="1.9" xChannelSelector="R" yChannelSelector="G" result="b"/>${INKDROP}</filter>`).join('')}
  <filter id="inkOnly" x="-8%" y="-8%" width="116%" height="116%"><feOffset in="SourceGraphic" dx="0" dy="0" result="b"/>${INKDROP}${GRADE}</filter>
  <filter id="inkProps" x="-4%" y="-4%" width="108%" height="108%"><feOffset in="SourceGraphic" dx="0" dy="0" result="b"/>${INKDROP}</filter>
  <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="bigBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  <g id="gl-back" ${G}>${finger(-42)}${finger(-14, 26)}${finger(14, 25)}${finger(40, 21)}${finger(-100, 17, 5)}<ellipse cx="20" cy="0" rx="15.5" ry="14.5"/>${gloveShade}<path d="M13 -5.5 H25 M12 0 H26 M13 5.5 H25" fill="none" stroke-width="2.2"/>${cuff}</g>
  <g id="gl-palm" ${G}>${finger(-40, 21)}${finger(-13, 25)}${finger(14, 26)}${finger(42)}${finger(100, 17, 5)}<ellipse cx="20" cy="0" rx="15.5" ry="14.5"/>${gloveShade}<path d="M15 -7 Q24 0 15 7" fill="none" stroke-width="2"/>${cuff}</g>
  <g id="gl-claw" ${G}>${finger(-52, 15)}${finger(-18, 17)}${finger(18, 17)}${finger(52, 15)}${finger(-104, 14, 5)}<ellipse cx="20" cy="0" rx="15" ry="14"/>${gloveShade}<path d="M36 -16 l4 -3 M40 -5 l5 -1 M40 6 l5 1 M36 17 l4 3" fill="none" stroke-width="2.4"/>${cuff}</g>
  <g id="gl-fist" ${G}><rect x="6" y="-17" width="22" height="10" rx="5"/><ellipse cx="21" cy="1" rx="16.5" ry="14.5"/>${gloveShade}<path d="M30 -8 q6 3 1 8 M31 1 q6 3 0 8 M29 9 q4 4 -2 6" fill="none" stroke-width="2.4"/><rect x="8" y="-15" width="20" height="9" rx="4.5" transform="rotate(8 18 -10)"/>${cuff}</g>
  <g id="gl-point" ${G}><rect x="22" y="-13" width="30" height="10" rx="5"/><ellipse cx="21" cy="2" rx="16" ry="14"/><path d="M31 3 q6 3 0 8 M29 10 q4 4 -2 6" fill="none" stroke-width="2.4"/><rect x="8" y="-14" width="19" height="9" rx="4.5" transform="rotate(10 18 -10)"/>${cuff}</g>
  <g id="gl-edge" ${G}><rect x="10" y="-17" width="22" height="10" rx="5" transform="rotate(-28 12 -12)"/><path d="M6 -8 H40 Q46 -9 49 -5 Q53 0 49 5 Q46 9 40 9 H6 Z"/><path d="M18 0.5 H47 M16 -3.5 H38" fill="none" stroke-width="1.8"/><path d="M22 5 Q33 8 44 6" fill="none" stroke="#cdbf9c" stroke-width="3" stroke-linecap="round"/>${cuff}</g>
  <g id="shoe"><path d="M-15 -9 L4 -9 L7 12 L-17 12 Z" fill="#2c1811" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="19" cy="1" rx="26" ry="13.5" fill="#3d2117" stroke="${INK}" stroke-width="3.5"/><ellipse cx="24" cy="-5" rx="11" ry="4" fill="#a3714a" opacity=".85"/><path d="M-17 13 H42" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/></g>
  <g id="probe-red"><rect x="8" y="-5" width="30" height="10" rx="4" fill="#c7322b" stroke="${INK}" stroke-width="2.6"/><path d="M38 0 H56" stroke="#d8d3c8" stroke-width="3.4" stroke-linecap="round"/><path d="M38 0 H56" stroke="${INK}" stroke-width="1" opacity=".4"/></g>
  <g id="probe-black"><rect x="8" y="-5" width="30" height="10" rx="4" fill="#2a2a2c" stroke="${INK}" stroke-width="2.6"/><path d="M38 0 H56" stroke="#d8d3c8" stroke-width="3.4" stroke-linecap="round"/><path d="M38 0 H56" stroke="${INK}" stroke-width="1" opacity=".4"/></g>
  `;

  function installDefs(svg) {
    const defs = el('defs', {}, svg);
    defs.innerHTML = DEFS;
    return defs;
  }

  /* control point for a rubber-hose limb from (sx,sy) to (ex,ey). A positive bend
     always bows the hose away from the body on that limb's side (side -1 = left),
     whether the limb points up, down or across. */
  function elbow(sx, sy, ex, ey, bend, side) {
    const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len, ny = dx / len;
    if (Math.abs(nx) > 0.2 ? nx * side < 0 : ny < 0) { nx = -nx; ny = -ny; }
    return [(sx + ex) / 2 + nx * bend * len, (sy + ey) / 2 + ny * bend * len];
  }

  /* ---------- keyframe sampling ----------
     Richer in-betweens: each field runs on its own track through its keys. A key
     where the move turns round (or the first and last) is a held pose, eased in
     and out as before; a key the move passes THROUGH keeps its speed (a monotone
     cubic, so it never overshoots a key), so arcs flow instead of stopping dead
     at every drawing. Every key is still hit at exactly its time. */
  const TRACKS = new WeakMap();
  function tracksOf(keys) {
    let tr = TRACKS.get(keys);
    if (tr) return tr;
    tr = {};
    for (const k of keys) for (const f in k[1]) (tr[f] || (tr[f] = [])).push([k[0], k[1][f]]);
    TRACKS.set(keys, tr);
    return tr;
  }
  function slope(pts, i) {
    if (i <= 0 || i >= pts.length - 1) return 0;
    const [a, va] = pts[i - 1], [b, vb] = pts[i], [c, vc] = pts[i + 1];
    if (typeof va !== 'number' || typeof vc !== 'number') return 0;
    const d0 = (vb - va) / Math.max(b - a, 1e-4), d1 = (vc - vb) / Math.max(c - b, 1e-4);
    if (d0 * d1 <= 0) return 0;
    return Math.sign(d0) * Math.min(Math.abs(d0 + d1) / 2, 3 * Math.min(Math.abs(d0), Math.abs(d1)));
  }
  function sampleKeys(keys, u) {
    const num = {}, disc = {}, tr = tracksOf(keys);
    for (const f in tr) {
      const pts = tr[f];
      let i = -1;
      for (let j = 0; j < pts.length; j++) if (pts[j][0] <= u) i = j;
      if (i < 0) continue;
      const v = pts[i][1];
      if (typeof v === 'string') { disc[f] = v; continue; }
      const nx = pts[i + 1];
      if (!nx || typeof nx[1] !== 'number' || nx[0] <= pts[i][0]) { num[f] = v; continue; }
      const du = nx[0] - pts[i][0], s = clamp((u - pts[i][0]) / du);
      const m1 = slope(pts, i), m2 = slope(pts, i + 1);
      if (!m1 && !m2) { num[f] = lerp(v, nx[1], easeIO(s)); continue; }
      const s2 = s * s, s3 = s2 * s;
      num[f] = (2 * s3 - 3 * s2 + 1) * v + (s3 - 2 * s2 + s) * m1 * du + (3 * s2 - 2 * s3) * nx[1] + (s3 - s2) * m2 * du;
    }
    return { num, disc };
  }

  /* anticipation: a hop that comes out of nowhere gets a little crouch first, and
     a stretch as it leaves the ground. Takes and shocks (a gasp, pop lines, a
     jolt of glow or alarm) are never wound up: nobody sees those coming. */
  function anticipate(keys) {
    const j = keys.findIndex(k => typeof k[1].hipY === 'number' && k[1].hipY <= -18);
    if (j < 0 || keys[j][0] < 0.08) return keys;
    for (let i = 0; i <= j; i++) {
      const o = keys[i][1];
      if ((o.hipY > 2) || o.pop > 0.4 || o.alarm > 0.3 || o.glow > 0.5 || o.heat > 0.3 || o.mouth === 'gasp' || o.mouth === 'scream') return keys;
    }
    const hop = keys[j][1], dip = Math.min(10, -hop.hipY * 0.2);
    const out = keys.map(k => [k[0], Object.assign({}, k[1])]);
    const J = out[j][1];
    if (J.sy == null) {
      if (out[j + 1]) { J.sy = 1.08; J.sx = 0.94; if (out[j + 1][1].sy == null) Object.assign(out[j + 1][1], { sy: 1, sx: 1 }); }
      else { J.sy = 1; J.sx = 1; }
    }
    if (J.sx == null) J.sx = 1;
    if (J.knee == null) J.knee = 0.1;
    out.splice(j, 0, [keys[j][0] * 0.6, { hipY: dip, sy: 0.9, sx: 1.08, knee: 0.38 }]);
    out.sort((a, b) => a[0] - b[0]);
    return out;
  }

  /* ---------- eye ---------- */
  class Eye {
    constructor(parent, defs) {
      const id = 'eyeclip' + uid++;
      const clip = el('clipPath', { id }, defs);
      this.clipE = el('ellipse', {}, clip);
      this.g = el('g', {}, parent);
      this.white = el('ellipse', { fill: CREAM }, this.g);
      const inner = el('g', { 'clip-path': `url(#${id})` }, this.g);
      this.pupil = el('path', { fill: INK }, inner);
      this.glint = el('ellipse', { fill: CREAM, opacity: 0.9 }, inner);
      this.low = el('path', {}, inner);
      this.lid = el('path', {}, inner);
      this.lowLine = el('path', { fill: 'none', stroke: INK, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, inner);
      this.lidLine = el('path', { fill: 'none', stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round' }, inner);
      this.out = el('ellipse', { fill: 'none', stroke: INK, 'stroke-width': 4.2 }, this.g);
    }
    set(o) {
      const { cx, cy, rx, ry, side } = o;
      const e = { cx: R(cx), cy: R(cy), rx: R(rx), ry: R(ry) };
      sa(this.white, e); sa(this.clipE, e); sa(this.out, e);
      if (o.white && o.white !== this.wc) { this.white.setAttribute('fill', o.white); this.wc = o.white; }
      if (o.pupilColor && o.pupilColor !== this.pc) { this.pupil.setAttribute('fill', o.pupilColor); this.pc = o.pupilColor; }
      const px = cx + o.lx * rx * 0.42, py = cy + o.ly * ry * 0.38;
      const prx = rx * 0.6 * o.pupil, pry = ry * 0.66 * o.pupil;
      const a0 = -1.3, a1 = -0.42;
      this.pupil.setAttribute('d', `M${R(px)},${R(py)} L${R(px + prx * Math.cos(a1))},${R(py + pry * Math.sin(a1))} A${R(prx)},${R(pry)} 0 1 1 ${R(px + prx * Math.cos(a0))},${R(py + pry * Math.sin(a0))} Z`);
      sa(this.glint, { cx: R(px - prx * 0.35), cy: R(py + pry * 0.45), rx: R(prx * 0.16), ry: R(pry * 0.14) });
      const top = cy - ry - 8, xo = cx + side * (rx + 7), xi = cx - side * (rx + 7);
      const lidY = cy - ry + clamp(o.lid) * 2.05 * ry;
      const yo = lidY + o.tilt * ry * 0.45, yi = lidY - o.tilt * ry * 0.45;
      const mid = (yo + yi) / 2 + ry * 0.16;
      this.lid.setAttribute('d', `M${R(xo)},${R(top)} L${R(xi)},${R(top)} L${R(xi)},${R(yi)} Q${R(cx)},${R(mid)} ${R(xo)},${R(yo)} Z`);
      this.lid.setAttribute('fill', o.color);
      this.lidLine.setAttribute('d', `M${R(xi)},${R(yi)} Q${R(cx)},${R(mid)} ${R(xo)},${R(yo)}`);
      this.lidLine.setAttribute('opacity', o.lid > 0.04 ? 1 : 0);
      const bot = cy + ry + 8, lowY = cy + ry - clamp(o.low) * 1.2 * ry;
      this.low.setAttribute('d', `M${R(cx - rx - 7)},${R(bot)} L${R(cx + rx + 7)},${R(bot)} L${R(cx + rx + 7)},${R(lowY)} Q${R(cx)},${R(lowY - ry * 0.3)} ${R(cx - rx - 7)},${R(lowY)} Z`);
      this.low.setAttribute('fill', o.color);
      this.lowLine.setAttribute('d', `M${R(cx - rx - 7)},${R(lowY)} Q${R(cx)},${R(lowY - ry * 0.3)} ${R(cx + rx + 7)},${R(lowY)}`);
      this.lowLine.setAttribute('opacity', o.low > 0.04 ? 1 : 0);
    }
  }

  /* ---------- mouth ---------- */
  class Mouth {
    constructor(parent, defs, lineColor) {
      const id = 'mclip' + uid++;
      const clip = el('clipPath', { id }, defs);
      this.clipP = el('path', {}, clip);
      this.g = el('g', {}, parent);
      this.fill = el('path', { fill: '#4a1410' }, this.g);
      const inner = el('g', { 'clip-path': `url(#${id})` }, this.g);
      this.tongue = el('ellipse', { fill: '#df5a48' }, inner);
      this.teeth = el('path', { fill: CREAM, stroke: INK, 'stroke-width': 2.4 }, inner);
      this.out = el('path', { fill: 'none', stroke: INK, 'stroke-width': 4.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.g);
      this.lineColor = lineColor || INK;
    }
    set(type, x, y, w, open) {
      let d, filled = true, tongue = null, teeth = null;
      const o = clamp(open, 0, 1.3);
      if (type === 'smile') {
        const h = 8 + o * 26;
        d = `M${-w},-3 Q0,5 ${w},-3 Q${w * 0.85},${h} 0,${h} Q${-w * 0.85},${h} ${-w},-3 Z`;
        tongue = [0, h - 3, w * 0.5, 7 + o * 4];
      } else if (type === 'O') {
        const rx = w * (0.38 + o * 0.12), ry = 6 + o * 20;
        d = `M0,${-ry} A${rx},${ry} 0 1 1 0,${ry} A${rx},${ry} 0 1 1 0,${-ry} Z`;
        tongue = [0, ry - 2, rx * 0.7, ry * 0.4];
      } else if (type === 'gasp') {
        const h = 6 + o * 28;
        d = `M${-w},6 Q0,${-8 - o * 4} ${w},6 Q${w * 0.7},${h + 6} 0,${h + 6} Q${-w * 0.7},${h + 6} ${-w},6 Z`;
        tongue = [0, h + 4, w * 0.45, 5 + o * 4];
      } else if (type === 'grit') {
        const h = 9 + o * 12, ww = w * 1.05;
        d = `M${-ww},${-h / 2} Q0,${-h / 2 - 4} ${ww},${-h / 2} Q${ww + 4},0 ${ww},${h / 2} Q0,${h / 2 + 5} ${-ww},${h / 2} Q${-ww - 4},0 ${-ww},${-h / 2} Z`;
        const lines = [];
        for (let i = -2; i <= 2; i++) lines.push(`M${R(i * ww * 0.36)},${-h} V${h}`);
        teeth = `M${-ww - 6},${-h / 2 - 6} H${ww + 6} V${h / 2 + 8} H${-ww - 6} Z ` + lines.join(' ') + ` M${-ww},0 H${ww}`;
      } else if (type === 'grin') {
        const h = 10 + o * 14;
        d = `M${-w * 1.2},-6 Q0,6 ${w * 1.2},-6 Q${w},${h} 0,${h} Q${-w},${h} ${-w * 1.2},-6 Z`;
        const lines = [];
        for (let i = -3; i <= 3; i++) lines.push(`M${R(i * w * 0.3)},-10 V${h}`);
        teeth = `M${-w * 1.4},-12 H${w * 1.4} V${h * 0.45} H${-w * 1.4} Z ` + lines.join(' ');
        tongue = [0, h - 2, w * 0.6, 6];
      } else if (type === 'fangs') {
        const h = 12 + o * 22, ww = w * 1.3;
        d = `M${-ww},-5 Q0,7 ${ww},-5 Q${ww * 0.8},${h} 0,${h + 2} Q${-ww * 0.8},${h} ${-ww},-5 Z`;
        let top = `M${-ww},-9 L${-ww},-4`;
        for (let i = 1; i <= 7; i++) top += ` L${R(-ww + (i * 2 * ww) / 8 - ww / 8)},${i % 2 ? 6 : -2} L${R(-ww + (i * 2 * ww) / 8)},-3`;
        top += ` L${ww},-4 L${ww},-9 Z`;
        let bot = `M${R(-ww * 0.8)},${R(h + 6)}`;
        for (let i = 0; i <= 5; i++) bot += ` L${R(-ww * 0.7 + (i * 1.4 * ww) / 5)},${R(i % 2 ? h - 5 : h + 1)}`;
        bot += ` L${R(ww * 0.8)},${R(h + 6)} Z`;
        teeth = top + ' ' + bot;
        tongue = [0, h - 5, ww * 0.35, 5];
      } else if (type === 'wiregrin') {
        /* a too-wide, lipless grin set with bent copper-wire teeth */
        const h = 7 + o * 18, ww = w * 1.6;
        d = `M${-ww},-4 Q0,${R(3 + o * 6)} ${ww},-4 Q${R(ww * 0.55)},${R(h + 4)} 0,${R(h + 6)} Q${R(-ww * 0.55)},${R(h + 4)} ${-ww},-4 Z`;
        let tt = '';
        for (let i = -4; i <= 4; i++) {
          const tx = i * ww * 0.2, len = 5 + (i % 2 ? 3 : 0) + o * 3;
          tt += `M${R(tx - 1.4)},-6 L${R(tx + 1.6)},-6 L${R(tx + 0.8)},${R(len)} L${R(tx - 0.6)},${R(len)} Z `;
          tt += `M${R(tx - 1.2)},${R(h + 8)} L${R(tx + 1.4)},${R(h + 8)} L${R(tx + 0.6)},${R(h + 2 - len * 0.6)} L${R(tx - 0.4)},${R(h + 2 - len * 0.6)} Z `;
        }
        teeth = tt;
      } else if (type === 'seam') {
        /* a thin lipless seam, stitched shut */
        filled = false;
        let st = `M${-w * 1.1},0 Q0,${R(2 + o * 4)} ${w * 1.1},0`;
        for (let i = -2; i <= 2; i++) st += ` M${R(i * w * 0.42)},-3.5 L${R(i * w * 0.42 + 1)},${R(4.5 + o * 2)}`;
        d = st;
      } else if (type === 'flat') {
        filled = false; d = `M${-w * 0.6},1 Q0,${-3 + o * 4} ${w * 0.6},1`;
      } else if (type === 'frown') {
        filled = false; d = `M${-w * 0.8},6 Q0,${-8 - o * 4} ${w * 0.8},6`;
      } else if (type === 'happy') {
        filled = false; d = `M${-w * 0.8},-2 Q0,${10 + o * 4} ${w * 0.8},-2`;
      } else {
        filled = false; const q = w / 3;
        d = `M${-w},3 q${q},-8 ${2 * q},0 t${2 * q},0 t${2 * q},0`;
      }
      this.g.setAttribute('transform', `translate(${R(x)},${R(y)})`);
      this.out.setAttribute('d', d);
      this.out.setAttribute('stroke', filled ? INK : this.lineColor);
      this.fill.setAttribute('d', d); this.clipP.setAttribute('d', d);
      this.fill.setAttribute('opacity', filled ? 1 : 0);
      if (tongue && filled) sa(this.tongue, { cx: tongue[0], cy: R(tongue[1]), rx: R(tongue[2]), ry: R(tongue[3]), opacity: 1 });
      else this.tongue.setAttribute('opacity', 0);
      this.teeth.setAttribute('fill', type === 'wiregrin' ? '#e0913a' : CREAM);
      this.teeth.setAttribute('stroke-width', type === 'wiregrin' ? 1.4 : 2.4);
      if (teeth && filled) { this.teeth.setAttribute('d', teeth); this.teeth.setAttribute('opacity', 1); }
      else this.teeth.setAttribute('opacity', 0);
    }
  }

  /* ---------- the rig ---------- */
  const POSE0 = {
    hipX: 0, hipY: 0, lean: 0, sx: 1, sy: 1, turn: 0,
    lhx: -26, lhy: 44, rhx: 26, rhy: 44, lbend: 0.3, rbend: 0.3, lga: 0, rga: 0, lgs: 1, rgs: 1,
    lfx: 0, rfx: 0, lfy: 0, rfy: 0, knee: 0.15, ltoe: 0, rtoe: 0,
    lookX: 0, lookY: 0, lid: 0.12, lowLid: 0, browRaise: 0, browTilt: 0, pupil: 1,
    mouthOpen: 0.2, mouthW: 1, glow: 0, stretch: 0, shake: 0, faceY: 0, lever: 1,
    blush: 0, heat: 0, alarm: 0, dial: 0, frizz: 0, pop: 0, sweat: 0, book: 0, dizzy: 0,
    /* hand roll about the forearm, in radians: 0 = back of the glove toward us,
       PI = palm toward us. lroll/rroll are offsets a pose adds on top of the view
       the glove pose asks for; lr/rr are the sprung rolls the renderer draws. */
    lroll: 0, rroll: 0, lr: 0, rr: 0, hood: 0,
  };
  const SPRING = { body: [520, 26], hand: [380, 22], face: [900, 44], glow: [260, 30] };
  const FACE = new Set(['lookX', 'lookY', 'lid', 'lowLid', 'browRaise', 'browTilt', 'pupil', 'mouthOpen', 'mouthW', 'faceY', 'blush', 'pop', 'sweat']);
  const HAND = new Set(['lhx', 'lhy', 'rhx', 'rhy', 'lbend', 'rbend', 'lga', 'rga', 'lgs', 'rgs', 'lroll', 'rroll', 'lr', 'rr']);
  /* open-hand glove views are one drawing seen from different rolls */
  const OPEN = { back: 0, edge: Math.PI / 2, palm: Math.PI };
  const rollOf = pose => (pose in OPEN ? OPEN[pose] : 0);
  let building = null;
  const GLOWY = new Set(['glow', 'heat', 'alarm']);

  class Toon {
    constructor(scene, cfg) {
      this.cfg = cfg;
      this.scene = scene;
      this.root = el('g', { class: 'toon' }, scene.layer);
      this.shadow = el('ellipse', { fill: 'url(#gShadow)' }, this.root);
      this.backG = el('g', {}, this.root);
      this.legG = el('g', {}, this.root);
      this.bodyG = el('g', {}, this.root);
      this.frontG = el('g', {}, this.root);
      this.base = Object.assign({}, POSE0, cfg.pose || {});
      this.p = Object.assign({}, this.base);
      this.v = {};
      for (const k in this.p) this.v[k] = 0;
      this.tgt = Object.assign({}, this.p);
      this.d = Object.assign({ mouth: 'worry', lg: 'back', rg: 'back', lLayer: 'front', rLayer: 'front', screen: '0.00' }, cfg.disc || {});
      this.baseD = Object.assign({}, this.d);
      this.p.lr = this.tgt.lr = rollOf(this.d.lg); this.p.rr = this.tgt.rr = rollOf(this.d.rg);
      this.vols = [];
      this.phase = rand(0, 10);
      this.actions = [];
      this.frame = -1;
      this.blink = 0; this.blinkT = rand(1, 3); this.blinkStart = -1;
      this.sac = [0, 0]; this.sacT = 0;
      this.attn = null; this.hovered = false;
      this.boil = true;
      this.cur = { hx: 0, hy: -cfg.hipH, lean: 0, sx: 1, sy: 1 };
      this.shove = 0; this.touching = false;
      /* the soft body: y = squash (+) / stretch (-), l = drag lean in degrees.
         Each rig gets its own stiffness so no two jiggle in step; cfg.soft scales it */
      this.jig = { y: 0, v: 0, l: 0, lv: 0, k: 780 + (this.phase % 1) * 340, g: cfg.soft == null ? 1 : cfg.soft };
      this.pv = null;
      /* smear frames: speed lines trail the fastest moves (see render) */
      this.rv = [0, 0]; this.rp = null;
      this.smearL = el('path', { fill: 'none', stroke: INK, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0 }, this.root);
      this.root.insertBefore(this.smearL, this.backG);

      this.arms = [];
      if (cfg.arms !== false) {
        const colors = cfg.armColors || [INK, INK];
        [-1, 1].forEach((side, i) => {
          const g = el('g', {}, this.frontG);
          const path = el('path', { fill: 'none', stroke: colors[i], 'stroke-width': cfg.limbW || 8, 'stroke-linecap': 'round' }, g);
          let edge = null;
          if (colors[i] !== INK) { edge = path; path.setAttribute('stroke', INK); path.setAttribute('stroke-width', (cfg.limbW || 8) + 3); const inner = el('path', { fill: 'none', stroke: colors[i], 'stroke-width': (cfg.limbW || 8) - 1.5, 'stroke-linecap': 'round' }, g); edge = inner; }
          const probe = cfg.probes ? el('use', { href: i === 0 ? '#probe-black' : '#probe-red' }, g) : null;
          /* most of the cast wear white gloves; a character may bring its own hands */
          const glove = cfg.hand ? el('g', {}, g) : el('use', { href: '#gl-back' }, g);
          const custom = cfg.hand ? cfg.hand(glove, side) : null;
          this.arms.push({ side, g, path, inner: edge, probe, glove, custom, layer: 'front', pose: 'back' });
        });
      }
      this.legs = [];
      if (cfg.legs !== false) {
        for (const side of [-1, 1]) {
          const foot = el('ellipse', { fill: '#1e0e06', opacity: 0.5 }, this.root);
          this.root.insertBefore(foot, this.backG);
          const path = el('path', { fill: 'none', stroke: INK, 'stroke-width': cfg.legW || cfg.limbW || 8, 'stroke-linecap': 'round' }, this.legG);
          const shoe = el('use', { href: '#shoe' }, this.legG);
          this.legs.push({ side, path, shoe, foot });
        }
      }
      /* thickness: a darker copy of the flat silhouette sits behind the body and
         slides out to one side as the character turns, so plates read as slabs */
      if (cfg.slab) {
        this.slabG = el('g', {}, this.bodyG);
        for (const s of [].concat(cfg.slab)) el('path', { d: s.d, fill: s.fill, stroke: INK, 'stroke-width': s.w || 5, 'stroke-linejoin': 'round' }, this.slabG);
      }
      building = this;
      this.parts = cfg.draw ? cfg.draw(this.bodyG, this) : {};
      building = null;
      /* rim light (High): a warm lit edge just inside the silhouette on the side
         facing the nearest lamp. Plain vector, no filter: the outline is stroked
         again, slid away from the light and clipped to the shape, so it costs a
         phone next to nothing (an extra filter pass per character every frame
         was what made the old one desktop-only). A rig whose outline moves (the
         bulb) feeds its new shape through rimShape(). */
      const rimD = cfg.rim || (cfg.slab ? [].concat(cfg.slab)[0].d : null);
      if (rimD) {
        const id = 'rim' + uid++;
        const cp = el('clipPath', { id }, scene.defs);
        this.rimClip = el('path', { d: typeof rimD === 'string' ? rimD : '' }, cp);
        this.rimG = el('g', { 'clip-path': `url(#${id})`, style: 'display:none', 'pointer-events': 'none' }, this.bodyG);
        if (this.parts.rimBefore) this.bodyG.insertBefore(this.rimG, this.parts.rimBefore);
        this.rimP = el('path', { d: typeof rimD === 'string' ? rimD : '', fill: 'none', stroke: '#ffc56a', 'stroke-width': 7, 'stroke-linejoin': 'round', opacity: 0.55 }, this.rimG);
        this.rimK = '';
        if (this.parts.glass) this.parts.glass.push(this.rimG);
      }
      if (cfg.face) {
        this.faceG = el('g', {}, this.bodyG);
        this.cheeks = [-1, 1].map(() => el('ellipse', { fill: '#ff7f6e', opacity: 0.3 }, this.faceG));
        this.eyes = [new Eye(this.faceG, scene.defs), new Eye(this.faceG, scene.defs)];
        this.brows = [-1, 1].map(() => el('path', { fill: 'none', stroke: cfg.face.lineColor || INK, 'stroke-width': cfg.face.browW || 6, 'stroke-linecap': 'round' }, this.faceG));
        this.mouth = new Mouth(this.faceG, scene.defs, cfg.face.lineColor);
        /* old-cartoon extras: surprise lines that pop around the head, and sweat drops */
        this.popLines = el('path', { fill: 'none', stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round', opacity: 0 }, this.faceG);
        this.drops = [0, 1].map(() => el('path', { fill: '#dff3ff', stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round', opacity: 0 }, this.faceG));
      }
      if (this.parts.over) this.parts.over(this.bodyG);
    }

    /* a rig with a changing outline keeps its rim light on it */
    rimShape(d) {
      if (!this.rimP || d === this.rimDd) return;
      this.rimDd = d; this.rimP.setAttribute('d', d); this.rimClip.setAttribute('d', d);
    }

    /* scene position of a point given in body coordinates */
    world(lx, ly) {
      const c = this.cfg, cur = this.cur;
      const rad = (cur.lean * Math.PI) / 180, cs = Math.cos(rad), sn = Math.sin(rad);
      const x = lx * cur.sx, y = ly * cur.sy;
      return [c.x + (cur.hx + x * cs - y * sn) * c.scale, c.y + (cur.hy + x * sn + y * cs) * c.scale];
    }
    facePos() {
      const c = this.cfg;
      return this.world(c.face ? c.face.x : 0, c.face ? c.face.y : -100);
    }

    /* collision helpers, in scene coordinates */
    handPoints() {
      const c = this.cfg, out = [];
      for (const a of this.arms) {
        if (a.ex == null) continue;
        const gs = (c.gloveScale || 1) * c.scale, r = (a.ang * Math.PI) / 180, tip = c.tipLen || 30;
        out.push([c.x + a.ex * c.scale, c.y + a.ey * c.scale, 13 * gs]);
        out.push([c.x + (a.ex + Math.cos(r) * tip * (c.gloveScale || 1)) * c.scale, c.y + (a.ey + Math.sin(r) * tip * (c.gloveScale || 1)) * c.scale, 15 * gs]);
      }
      return out;
    }
    bodyCircles() {
      const c = this.cfg, out = [];
      for (const h of c.hits || [{ x: 0, y: -110, r: 60 }]) {
        const [x, y] = this.world(h.x, h.y);
        out.push([x, y, h.r * c.scale * Math.max(this.cur.sx, 1)]);
      }
      for (const g of this.legs) if (g.fx != null) out.push([c.x + (g.fx + g.side * 10) * c.scale, c.y + (g.fy - 3) * c.scale, 20 * (c.shoeScale || 1) * c.scale]);
      if (this.parts.hits) for (const [x, y, r] of this.parts.hits()) out.push([c.x + x * c.scale, c.y + y * c.scale, r * c.scale]);
      return out;
    }
    bodyCircle() { return this.bodyCircles()[0]; }

    play(keys, dur, opts = {}) {
      const slot = opts.slot || 'big';
      if (slot === 'big') this.actions = [];
      else if (this.actions.some(a => a.slot === 'big')) return false;
      else this.actions = this.actions.filter(a => a.slot !== slot);
      this.actions.push({ keys: anticipate(keys), dur, t: 0, slot, done: opts.done, cues: (opts.cues || []).map(c => ({ u: c[0], fn: c[1], fired: false })) });
      return true;
    }
    busy(slot) { return this.actions.some(a => !slot || a.slot === slot); }

    life(t, tg) {
      const L = this.cfg.life || {};
      const ph = this.phase;
      const br = Math.sin((t * 2 * Math.PI) / (L.breath || 2.8) + ph);
      tg.sy += 0.03 * br; tg.sx -= 0.02 * br;
      const bt = (window.AudioSys ? AudioSys.beat() : t * 2) * (L.beatMul || 1) + (L.beatOffset || 0);
      const fr = bt - Math.floor(bt);
      const hit = Math.pow(Math.max(0, Math.cos(fr * Math.PI * 2)), 6);
      const bounce = L.bounce == null ? 7 : L.bounce;
      tg.hipY += bounce * hit; tg.sy -= 0.045 * hit * (bounce / 7); tg.sx += 0.035 * hit * (bounce / 7);
      tg.knee += 0.18 * hit; tg.lhy += 3 * hit; tg.rhy += 3 * hit;
      tg.hipX += (L.sway == null ? 4 : L.sway) * noise(t * 0.37, ph);
      tg.lean += (L.lean == null ? 2 : L.lean) * noise(t * 0.29, ph + 2);
      tg.turn += 0.12 * noise(t * 0.19, ph + 4);
      if (t > this.sacT) {
        this.sac = [rand(-0.85, 0.85), rand(-0.5, 0.35)];
        this.sacT = t + rand(0.5, 2.6);
      }
      if (this.attn) {
        const [fx, fy] = this.facePos();
        const dx = this.attn[0] - fx, dy = this.attn[1] - fy;
        tg.lookX = clamp(dx / 220, -1, 1); tg.lookY = clamp(dy / 220, -0.9, 0.9);
        tg.turn += clamp(dx / 900, -0.3, 0.3);
      } else {
        tg.lookX += this.sac[0]; tg.lookY += this.sac[1];
      }
      tg.shake += L.nervous == null ? 0.25 : L.nervous;
      if (t > this.blinkT) {
        this.blinkStart = t;
        this.blinkT = t + (Math.random() < 0.2 ? 0.28 : rand(1.8, 5));
      }
      const bu = (t - this.blinkStart) / 0.16;
      this.blink = bu >= 0 && bu <= 1 ? Math.sin(bu * Math.PI) : 0;
    }

    update(t, dt) {
      const tg = this.tgt;
      Object.assign(tg, this.base);
      Object.assign(this.d, this.baseD);
      this.life(t, tg);
      if (this.brain) this.brain(t, dt, tg, this.d);
      if (!this.touching) this.shove *= Math.exp(-dt * 1.2);
      for (const a of this.actions) {
        a.t += dt;
        const u = clamp(a.t / a.dur);
        const w = clamp(u / 0.04) * clamp((1 - u) / 0.14);
        const k = sampleKeys(a.keys, u);
        /* keyed squash and stretch plays a quarter stronger */
        for (const f in k.num) tg[f] = lerp(tg[f], f === 'sx' || f === 'sy' ? clamp(1 + (k.num[f] - 1) * 1.25, 0.6, 1.5) : k.num[f], w);
        if (w > 0.35) Object.assign(this.d, k.disc);
        for (const c of a.cues) if (!c.fired && u >= c.u) { c.fired = true; try { c.fn(this); } catch (e) { /* a cue must never stop the show */ } }
      }
      tg.hipX += this.shove;
      /* the glove view a pose asks for becomes a roll target, so a hand that goes
         from back to palm really turns over (through edge-on) instead of popping */
      tg.lr = rollOf(this.d.lg) + tg.lroll; tg.rr = rollOf(this.d.rg) + tg.rroll;
      this.actions = this.actions.filter(a => {
        if (a.t < a.dur) return true;
        if (a.done) a.done();
        return false;
      });
      const steps = Math.max(1, Math.ceil(dt * 120));
      const h = dt / steps;
      for (let s = 0; s < steps; s++) {
        for (const k in tg) {
          const [K, C] = FACE.has(k) ? SPRING.face : HAND.has(k) ? SPRING.hand : GLOWY.has(k) ? SPRING.glow : SPRING.body;
          let v = this.v[k] + (tg[k] - this.p[k]) * K * h;
          v *= Math.exp(-C * h);
          this.v[k] = v;
          this.p[k] += v * h;
        }
      }
      /* procedural drivers (walk cycles) write straight into the pose after the
         springs, so planted feet stay planted */
      if (this.drive) this.drive(this.p, t, dt);
      /* secondary motion: the body is soft. Its own inertia squashes it as a move
         pushes off or lands, stretches it while it's flung, and leans its top
         behind a sideways move and on past the stop (follow-through) */
      const vx = this.v.hipX || 0, vy = this.v.hipY || 0, J = this.jig;
      if (this.pv && dt > 0) {
        const ax = clamp((vx - this.pv[0]) / dt, -60000, 60000), ay = clamp((vy - this.pv[1]) / dt, -60000, 60000);
        const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
        for (let s = 0; s < n; s++) {
          J.v += (-J.k * J.y - ay * 0.0065 * J.g) * h; J.v *= Math.exp(-9 * h); J.y += J.v * h;
          J.lv += (-J.k * 0.8 * J.l - ax * 0.32 * J.g) * h; J.lv *= Math.exp(-8 * h); J.l += J.lv * h;
        }
      }
      this.pv = [vx, vy];
      /* how fast the whole rig is being carried (a launch, a walk), in body units */
      const cc = this.cfg;
      if (this.rp && dt > 0) { this.rv = [(cc.x - this.rp[0]) / dt / cc.scale, (cc.y - this.rp[1]) / dt / cc.scale]; if (Math.hypot(this.rv[0], this.rv[1]) > 6000) this.rv = [0, 0]; }
      this.rp = [cc.x, cc.y];
      const f = Math.floor(t * 24);
      if (f !== this.frame) { this.frame = f; this.render(t); }
    }

    render(t) {
      const p = this.p, c = this.cfg, d = this.d;
      const sh = Math.max(0, p.shake);
      const jx = (Math.random() - 0.5) * sh * 4, jr = (Math.random() - 0.5) * sh * 3;
      const hx = p.hipX + jx, hy = -c.hipH + p.hipY;
      /* the soft body (see update): squash keeps its volume, the drag leans it */
      const jy = clamp(this.jig.y, -0.2, 0.24), jl = clamp(this.jig.l, -9, 9);
      const lean = p.lean + jr + jl;
      const rad = (lean * Math.PI) / 180, cs = Math.cos(rad), sn = Math.sin(rad);
      /* yaw: turning toward a side narrows the front face and shows the side slab */
      const yaw = clamp(p.turn, -1, 1) * 1.05, kx = c.slab ? 0.8 + 0.2 * Math.cos(yaw) : 1;
      const sxk = p.sx * kx * (1 + jy * 0.65), syk = p.sy * (1 - jy);
      /* smear frame: on the fastest frames of a take or a launch the whole body
         (limbs included) stretches along its motion, squeezing across it */
      /* (measured: a jolt peaks near 375 body units/s, a bump near 170; being
         carried only counts at launch speed, so walks and runs never smear) */
      const fast = Math.hypot(this.rv[0], this.rv[1]) > 900;
      const svx = (this.v.hipX || 0) + (fast ? this.rv[0] : 0), svy = (this.v.hipY || 0) + (fast ? this.rv[1] : 0), sp = Math.hypot(svx, svy);
      const sm = sp > 260 && sp < 6000 ? Math.min(0.45, (sp - 260) / 330) : 0;
      let M = null;
      if (sm > 0.02) {
        const ca = svx / sp, sa2 = svy / sp, k = 1 + sm, q = 1 / Math.sqrt(k);
        M = [k * ca * ca + q * sa2 * sa2, (k - q) * ca * sa2, k * sa2 * sa2 + q * ca * ca];
      }
      const tf = (x, y) => {
        x *= sxk; y *= syk;
        let dx = x * cs - y * sn, dy = x * sn + y * cs;
        if (M) { const ex = M[0] * dx + M[1] * dy; dy = M[1] * dx + M[2] * dy; dx = ex; }
        return [hx + dx, hy + dy];
      };
      this.cur = { hx, hy, lean, sx: sxk, sy: syk };
      /* overlapping action: the hands trail a fast body move by a few frames */
      const hdx = clamp(-(this.v.hipX || 0) * 0.03, -9, 9), hdy = clamp(-(this.v.hipY || 0) * 0.025, -9, 9);

      const rt = `translate(${R(c.x)},${R(c.y)}) scale(${c.scale})`;
      if (rt !== this.rt) { this.rt = rt; this.root.setAttribute('transform', rt); }
      this.bodyG.setAttribute('transform', `translate(${R(hx)},${R(hy)})${M ? ` matrix(${M[0].toFixed(3)},${M[1].toFixed(3)},${M[1].toFixed(3)},${M[2].toFixed(3)},0,0)` : ''} rotate(${R(lean)}) scale(${R(sxk * 1000) / 1000},${R(syk * 1000) / 1000})`);
      /* ...with three inked speed lines streaming off behind it */
      if (M) {
        const h0 = (c.hits && c.hits[0]) || { x: 0, y: -110, r: 60 }, [bx, by] = tf(h0.x, h0.y);
        const ux = -svx / sp, uy = -svy / sp, r = h0.r, len = r * (0.8 + sm * 2.2), segs = [];
        for (const o of [-0.55, 0, 0.55]) {
          const ox = bx - uy * r * o + ux * r * 0.9, oy = by + ux * r * o + uy * r * 0.9, l = len * (o ? 0.75 : 1);
          segs.push(`M${R(ox)},${R(oy)} L${R(ox + ux * l)},${R(oy + uy * l)}`);
        }
        this.smearL.setAttribute('d', segs.join(' '));
        this.smearL.setAttribute('opacity', R(Math.min(1, sm * 3) * 70) / 100);
        this.smeared = true;
      } else if (this.smeared) { this.smearL.setAttribute('opacity', 0); this.smeared = false; }
      if (this.slabG) {
        const depth = [].concat(c.slab)[0].depth || 12;
        this.slabG.setAttribute('transform', `translate(${R(-Math.sin(yaw) * depth / kx)},0)`);
      }
      for (const v of this.vols) v.setAttribute('transform', `translate(${R(Math.sin(yaw) * 16)},0)`);
      /* line boil: the ink is redrawn every frame, 24 a second on High (four
         drawings), 12 on Low or with the GPU pass off (three). The rig redraws
         at 24 anyway, so the full rate costs a phone nothing extra */
      const bf = window.GFX && GFX.on && GFX.boilFps > 12 ? 24 : 12;
      /* rim light on High: a warm edge on the side facing the nearest lamp
         (scenes list their lamps' x and say when the room is dark) */
      let rim = '';
      const lamps = this.scene.lamps;
      if (this.rimG && bf > 12 && lamps && lamps.length && !this.scene.dark && this.boil && this.scene.boil) {
        const lx = lamps.reduce((m, x) => (Math.abs(x - c.x) < Math.abs(m - c.x) ? x : m), lamps[0]);
        rim = lx >= c.x ? 'R' : 'L';
      }
      if (rim !== this.rimK && this.rimG) {
        this.rimK = rim;
        this.rimG.style.display = rim ? '' : 'none';
        if (rim) this.rimP.setAttribute('transform', rim === 'R' ? 'translate(-7,7)' : 'translate(7,7)');
      }
      const bi = Math.floor(t * bf) % (bf > 12 ? 4 : 3);
      const fv = this.boil && this.scene.boil ? `url(#boil${bi})` : 'url(#inkOnly)';
      /* touch the DOM only when the drawing really changes */
      if (fv !== this.fv) { this.fv = fv; this.root.setAttribute('filter', fv); }

      const air = c.shadowFixed ? 0 : clamp(-p.hipY / 120);
      sa(this.shadow, { cx: c.shadowFixed ? 0 : R(hx * 0.6), cy: 6, rx: R((c.shadowW == null ? 70 : c.shadowW) * (1 - air * 0.4)), ry: R(13 * (1 - air * 0.4)), opacity: R((1 - air * 0.6) * 10) / 10 });

      for (const a of this.arms) {
        const L = a.side < 0;
        const [s0x, s0y] = c.shoulders[L ? 0 : 1];
        const [sx, sy] = tf(s0x, s0y);
        const ex = sx + (L ? p.lhx : p.rhx) + hdx, ey = sy + (L ? p.lhy : p.rhy) + hdy;
        const [cx, cy] = elbow(sx, sy, ex, ey, L ? p.lbend : p.rbend, a.side);
        const dd = `M${R(sx)},${R(sy)} Q${R(cx)},${R(cy)} ${R(ex)},${R(ey)}`;
        a.path.setAttribute('d', dd);
        if (a.inner) a.inner.setAttribute('d', dd);
        a.ex = ex; a.ey = ey; a.ang = ((Math.atan2(ey - cy, ex - cx) * 180) / Math.PI);
        const ang = (Math.atan2(ey - cy, ex - cx) * 180) / Math.PI + (L ? -p.lga : p.rga);
        const gs = (c.gloveScale || 1) * (L ? p.lgs : p.rgs);
        /* roll about the forearm: an open hand foreshortens as it turns and shows
           its back, its edge or its palm depending on which way it faces; a fist,
           claw or pointing hand squashes and mirrors as it rolls over */
        const want = L ? d.lg : d.rg, rc = Math.cos(L ? p.lr : p.rr);
        if (a.custom) {
          a.glove.setAttribute('transform', `translate(${R(ex)},${R(ey)}) rotate(${R(ang)}) scale(${R(gs * 100) / 100},${R((L ? -gs : gs) * 100) / 100})`);
          a.custom.update(want, p, t, a.side);
          const wantL = L ? d.lLayer : d.rLayer;
          const layer = wantL === 'back' ? 'back' : wantL === 'front!' || wantL === 'front' ? 'front' : 'back';
          if (layer !== a.layer) { (layer === 'back' ? this.backG : this.frontG).appendChild(a.g); a.layer = layer; }
          continue;
        }
        let pose = want, fy;
        if (want in OPEN) {
          if (rc > 0.3) { pose = 'back'; fy = rc; } else if (rc < -0.3) { pose = 'palm'; fy = -rc; } else { pose = 'edge'; fy = rc >= 0 ? 1 : -1; }
        } else fy = (rc >= 0 ? 1 : -1) * (0.55 + 0.45 * Math.abs(rc));
        const gy = (L ? -gs : gs) * fy;
        const tr = `translate(${R(ex)},${R(ey)}) rotate(${R(ang)}) scale(${R(gs * 100) / 100},${R(gy * 100) / 100})`;
        a.glove.setAttribute('transform', tr);
        if (a.probe) a.probe.setAttribute('transform', `translate(${R(ex)},${R(ey)}) rotate(${R(ang)}) scale(${R(gs * 100) / 100},${R((L ? -gs : gs) * 100) / 100})`);
        if (pose !== a.pose) { a.glove.setAttribute('href', '#gl-' + pose); a.pose = pose; }
        /* an arm whose hand crosses the body's midline tucks behind the body,
           unless the pose insists on it being in front ('front!') */
        const wantL = L ? d.lLayer : d.rLayer;
        const crosses = a.side * (ex - hx) < -6;
        const layer = wantL === 'back' || (crosses && wantL !== 'front!') ? 'back' : 'front';
        if (layer !== a.layer) { (layer === 'back' ? this.backG : this.frontG).appendChild(a.g); a.layer = layer; }
      }

      /* in profile (walking) both shoes point the way we're going, the feet come in
         under the body and both knees bend forward */
      const prof = this.profile || 0;
      for (const g of this.legs) {
        const L = g.side < 0;
        const [h0x, h0y] = c.hips[L ? 0 : 1];
        const [sx, sy] = tf(h0x, h0y);
        const slide = Math.abs(p.hipX) > 30 ? (p.hipX - Math.sign(p.hipX) * 30) * 0.9 : 0;
        const fx = g.side * c.stance * (prof ? 0.3 : 1) + (L ? p.lfx : p.rfx) + slide, fy = -(L ? p.lfy : p.rfy);
        g.fx = fx; g.fy = fy;
        const ax = fx, ay = fy - 7;
        const [cx, cy] = elbow(sx, sy, ax, ay, p.knee, prof || g.side);
        g.path.setAttribute('d', `M${R(sx)},${R(sy)} Q${R(cx)},${R(cy)} ${R(ax)},${R(ay)}`);
        if (g.foot) sa(g.foot, { cx: R(fx + g.side * 6 * (c.shoeScale || 1)), cy: 3, rx: R(24 * (c.shoeScale || 1)), ry: 5, opacity: R(clamp(1 - (L ? p.lfy : p.rfy) / 40) * 55) / 100 });
        const ss = c.shoeScale || 1, toe = L ? p.ltoe : p.rtoe;
        g.shoe.setAttribute('transform', `translate(${R(fx)},${R(fy)}) scale(${(prof || g.side) * ss},${ss}) rotate(${R(-toe)})`);
      }

      if (this.eyes) {
        const F = c.face, turn = clamp(p.turn, -1, 1);
        const fx0 = F.x + turn * F.turnShift, fy0 = F.y + p.faceY;
        const lidColor = this.parts.lidColor ? this.parts.lidColor(p) : F.lidColor;
        [-1, 1].forEach((s, i) => {
          const far = Math.max(0, turn * s);
          const rx = F.rx * (1 - 0.38 * far), ry = F.ry * (1 - 0.05 * far);
          const cx = fx0 + s * F.spacing * (1 - 0.2 * Math.abs(turn));
          this.eyes[i].set({ cx, cy: fy0, rx, ry, lx: clamp(p.lookX, -1, 1), ly: clamp(p.lookY, -1, 1), pupil: clamp(p.pupil, 0.3, 1.3), lid: Math.max(p.lid, this.blink), low: p.lowLid, tilt: clamp(p.browTilt * 0.55, -1, 1), side: s, color: lidColor, white: F.eyeWhite, pupilColor: F.pupilColor });
          const by = fy0 - ry - 10 - Math.min(p.browRaise, F.maxBrow == null ? 9 : F.maxBrow) * 11;
          const inner = by - p.browTilt * 9, outer = by + p.browTilt * 4;
          const xo = cx + s * rx * 1.05, xi = cx - s * rx * 0.75;
          this.brows[i].setAttribute('d', `M${R(xo)},${R(outer)} Q${R(cx)},${R(Math.min(inner, outer) - 6)} ${R(xi)},${R(inner)}`);
          sa(this.cheeks[i], { cx: R(cx + s * rx * 0.5), cy: R(fy0 + ry * 0.95), rx: R(F.rx * 0.8), ry: R(F.rx * 0.42), opacity: R(clamp((F.blush == null ? 0.28 : F.blush) + p.blush * 0.5) * 100) / 100 });
        });
        this.mouth.set(d.mouth, fx0 + turn * F.turnShift * 0.25, fy0 + F.mouthY, F.mouthW * p.mouthW * (1 - 0.15 * Math.abs(turn)), Math.min(p.mouthOpen, F.maxOpen == null ? 9 : F.maxOpen));
        const reach = F.pop || F.spacing * 2.6;
        if (p.pop > 0.08) {
          const r0 = reach * (0.95 + p.pop * 0.25), r1 = r0 + 10 + p.pop * 16, segs = [];
          for (const a of [-2.5, -2.05, -1.6, -1.1, -0.65]) segs.push(`M${R(fx0 + Math.cos(a) * r0)},${R(fy0 + Math.sin(a) * r0 * 0.9)} L${R(fx0 + Math.cos(a) * r1)},${R(fy0 + Math.sin(a) * r1 * 0.9)}`);
          this.popLines.setAttribute('d', segs.join(' '));
          this.popLines.setAttribute('opacity', R(clamp(p.pop) * 100) / 100);
        } else this.popLines.setAttribute('opacity', 0);
        this.drops.forEach((dr, i) => {
          if (p.sweat < 0.08) { dr.setAttribute('opacity', 0); return; }
          const s = i ? 1 : -1, slide = ((t * 0.8 + i * 0.5) % 1) * F.ry * 1.6;
          const x = fx0 + s * (F.sweatOut == null ? F.spacing + F.rx * 1.9 : F.sweatOut) + s * slide * 0.35, y = fy0 - F.ry * 0.6 + slide, k = 0.8 + clamp(p.sweat) * 0.4;
          dr.setAttribute('d', `M${R(x)},${R(y - 9 * k)} Q${R(x + 7 * k)},${R(y + 3 * k)} ${R(x)},${R(y + 7 * k)} Q${R(x - 7 * k)},${R(y + 3 * k)} ${R(x)},${R(y - 9 * k)} Z`);
          dr.setAttribute('opacity', R(clamp(p.sweat) * 100) / 100);
        });
      }
      if (this.parts.update) this.parts.update(p, t, d);
    }
  }

  /* inner shading + highlight that give flat plates a soft, painted roundness */
  function plateShade(g, x0, y0, x1, y1, r) {
    el('path', { d: `M${x1 - 8},${y0 + r} V${y1 - r} Q${x1 - 8},${y1 - 8} ${x1 - r},${y1 - 8} H${x0 + r}`, fill: 'none', stroke: '#9c7f52', 'stroke-width': 11, opacity: 0.28, 'stroke-linecap': 'round' }, g);
    el('path', { d: `M${x0 + 9},${y1 - r - 10} V${y0 + r} Q${x0 + 9},${y0 + 9} ${x0 + r},${y0 + 9} H${x0 + (x1 - x0) * 0.55}`, fill: 'none', stroke: '#fffdf6', 'stroke-width': 5, opacity: 0.85, 'stroke-linecap': 'round' }, g);
  }

  function volume(g, d, x, y, w, h) {
    const id = 'vol' + uid++;
    const cp = el('clipPath', { id }, g.ownerSVGElement.querySelector('defs'));
    el('path', { d }, cp);
    /* the sheen lives in its own group so it can slide across the plate as the
       character turns, while the clip stays put on the silhouette */
    const holder = el('g', { 'clip-path': `url(#${id})` }, g);
    const r = el('rect', { x: x - 24, y, width: w + 48, height: h, fill: 'url(#gVolume)' }, holder);
    if (building) building.vols.push(r);
  }

  function bulgeShade(g, shadeD, lightD) {
    el('path', { d: shadeD, fill: 'none', stroke: '#9c7f52', 'stroke-width': 12, opacity: 0.3, 'stroke-linecap': 'round' }, g);
    el('path', { d: lightD, fill: 'none', stroke: '#fffdf6', 'stroke-width': 6, opacity: 0.85, 'stroke-linecap': 'round' }, g);
  }

  /* ---------- the cast ---------- */
  function makeBulb(scene, x, y, scale) {
    return new Toon(scene, {
      x, y, scale, hipH: 62, stance: 24, limbW: 7.5, gloveScale: 1.4, shadowW: 78, hits: [{ x: 0, y: -152, r: 72 }, { x: 0, y: -34, r: 30 }],
      shoulders: [[-30, -60], [30, -60]], hips: [[-11, -3], [11, -3]],
      face: { x: 0, y: -160, spacing: 23, rx: 16, ry: 24, mouthY: 42, mouthW: 22, turnShift: 22, browW: 6.5, pop: 100, sweatOut: 86, maxOpen: 1 },
      life: { breath: 2.9, bounce: 7, sway: 4, lean: 2.2, nervous: 0.28 },
      pose: { lhx: -22, lhy: 50, rhx: 22, rhy: 50, lbend: 0.3, rbend: 0.3, browTilt: 0.8, browRaise: 0.35, lid: 0.16, pupil: 0.82, mouthOpen: 0.25, knee: -0.2, glow: 0.1 },
      disc: { lg: 'fist', rg: 'fist', mouth: 'worry' }, rim: true,
      draw(g, tn) {
        const halo = el('circle', { cx: 0, cy: -150, r: 170, fill: 'url(#gGlow)', opacity: 0 }, g);
        el('path', { d: 'M-12,-3 Q0,13 12,-3 Z', fill: INK }, g);
        el('rect', { x: -19, y: -13, width: 38, height: 11, rx: 3, fill: '#2a211c', stroke: INK, 'stroke-width': 4 }, g);
        el('path', { d: 'M-24,-12 L-27,-57 Q0,-63 27,-57 L24,-12 Q0,-7 -24,-12 Z', fill: 'url(#gBrass)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
        for (const yy of [-22, -34, -46]) el('path', { d: `M-25,${yy} Q0,${yy + 7} 26,${yy - 5}`, fill: 'none', stroke: INK, 'stroke-width': 3 }, g);
        const glassOff = el('path', { fill: 'url(#gGlassOff)' }, g);
        const glassOn = el('path', { fill: 'url(#gGlassOn)', opacity: 0 }, g);
        const shade = el('path', { d: 'M44,-92 Q76,-146 46,-202', fill: 'none', stroke: '#7b5a22', 'stroke-width': 15, 'stroke-linecap': 'round', opacity: 0.16 }, g);
        const filament = el('g', { opacity: 0.35 }, g);
        el('path', { d: 'M-8,-58 L-11,-78 M8,-58 L11,-78', stroke: '#6d5f52', 'stroke-width': 2.6, fill: 'none' }, filament);
        const coilD = 'M-11,-78 q2.75,-6 5.5,0 t5.5,0 t5.5,0 t5.5,0';
        el('path', { d: coilD, stroke: '#6d5f52', 'stroke-width': 2.6, fill: 'none' }, filament);
        const coilGlow = el('path', { d: coilD, stroke: '#fff3a8', 'stroke-width': 8, fill: 'none', filter: 'url(#softBlur)', opacity: 0 }, g);
        const coilHot = el('path', { d: coilD, stroke: '#fffbe0', 'stroke-width': 3.2, fill: 'none', opacity: 0 }, g);
        const outline = el('path', { fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
        const hl = el('g', {}, g);
        el('path', { d: 'M-50,-172 Q-44,-202 -16,-212', fill: 'none', stroke: CREAM, 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.92 }, hl);
        el('circle', { cx: -56, cy: -150, r: 4.5, fill: CREAM, opacity: 0.85 }, hl);
        return {
          /* everything made of glass, so a level can shatter it */
          glass: [glassOff, glassOn, outline, halo, hl, shade, coilGlow, coilHot],
          rimBefore: outline,
          lidColor: p => hexLerp('#ece3cb', '#ffe57e', clamp(p.glow)),
          update(p) {
            const rx = 70 - p.stretch * 8, ry = 74 + p.stretch * 16, sh = p.turn * 6;
            const dd = `M-22,-58 C-24,-80 ${R(-rx)},-94 ${R(-rx + sh)},-150 A${R(rx)},${R(ry)} 0 1 1 ${R(rx + sh)},-150 C${R(rx)},-94 24,-80 22,-58 Z`;
            glassOff.setAttribute('d', dd); glassOn.setAttribute('d', dd); outline.setAttribute('d', dd);
            if (tn.rimK) tn.rimShape(dd);
            const gl = clamp(p.glow, 0, 1.5);
            glassOn.setAttribute('opacity', R(clamp(gl * 1.15) * 100) / 100);
            halo.setAttribute('opacity', R(clamp(gl * 0.95) * 100) / 100);
            halo.setAttribute('r', R(150 + gl * 50));
            coilGlow.setAttribute('opacity', R(clamp(gl * 1.4) * 100) / 100);
            coilHot.setAttribute('opacity', R(clamp(gl * 2) * 100) / 100);
            /* a filament short of its voltage runs cool: dull orange, not white
               (written only when the colour changes) */
            const warm = clamp((gl - 0.12) / 0.5), fc = warm >= 1 ? '#fffbe0' : hexLerp('#ff5a0a', '#fffbe0', warm);
            if (fc !== tn.fc) { tn.fc = fc; coilHot.setAttribute('stroke', fc); coilGlow.setAttribute('stroke', warm >= 1 ? '#fff3a8' : hexLerp('#ff7a1a', '#fff3a8', warm)); }
            filament.setAttribute('opacity', R(clamp(0.35 + gl * 0.65) * 100) / 100);
            hl.setAttribute('transform', `translate(${R(-p.turn * 14)},${R(-p.stretch * 10)})`);
            shade.setAttribute('transform', `translate(${R(-p.turn * 8)},0)`);
          },
        };
      },
    });
  }

  /* opts.probe: the working version for the levels, a real receptacle face you
     can put a tester's probes into (long neutral slot, short hot slot, round
     ground hole) and real terminal screws on his sides, so his mouth moves up
     between his eyes and the face */
  function makeOutlet(scene, x, y, scale, opts = {}) {
    const P = !!opts.probe;
    return new Toon(scene, {
      x, y, scale, hipH: 56, stance: 25, limbW: 7.5, gloveScale: 1.32, shadowW: 74, hits: [{ x: 0, y: -165, r: 56 }, { x: 0, y: -72, r: 60 }],
      slab: { d: 'M-48,-200 Q0,-214 48,-200 Q64,-196 62,-176 Q70,-100 58,-36 Q54,-16 34,-16 H-34 Q-54,-16 -58,-36 Q-70,-100 -62,-176 Q-64,-196 -48,-200 Z', fill: '#a8906a', depth: 15 },
      shoulders: [[-50, -112], [50, -112]], hips: [[-17, -22], [17, -22]],
      face: { x: 0, y: -160, spacing: 17, rx: 13, ry: 18.5, mouthY: P ? 38 : 89, mouthW: P ? 15 : 21, turnShift: 7, lidColor: '#efe2c2', browW: 5.5, pop: 92, sweatOut: 76, maxOpen: P ? 0.45 : 0.6, maxBrow: 1.2 },
      life: { breath: 3.4, bounce: 6, beatOffset: 0.5, sway: 5, lean: 3, nervous: 0.22 },
      pose: { lhx: -32, lhy: 52, rhx: 32, rhy: 52, lbend: 0.35, rbend: 0.35, browTilt: 0.6, browRaise: 0.2, pupil: 0.9, knee: 0.1 },
      disc: { lg: 'palm', rg: 'palm', mouth: 'flat' },
      draw(g) {
        el('path', { d: 'M-48,-200 Q0,-214 48,-200 Q64,-196 62,-176 Q70,-100 58,-36 Q54,-16 34,-16 H-34 Q-54,-16 -58,-36 Q-70,-100 -62,-176 Q-64,-196 -48,-200 Z', fill: 'url(#gPlate)', stroke: INK, 'stroke-width': 5.5, 'stroke-linejoin': 'round' }, g);
        volume(g, 'M-48,-200 Q0,-214 48,-200 Q64,-196 62,-176 Q70,-100 58,-36 Q54,-16 34,-16 H-34 Q-54,-16 -58,-36 Q-70,-100 -62,-176 Q-64,-196 -48,-200 Z', -70, -214, 140, 198);
        bulgeShade(g, 'M52,-182 Q63,-104 52,-34 Q46,-24 30,-24', 'M-50,-178 Q-60,-124 -54,-84');
        if (P) {
          el('rect', { x: -41, y: -108, width: 82, height: 76, rx: 26, fill: 'url(#gRecep)', stroke: INK, 'stroke-width': 4 }, g);
          el('path', { d: 'M-32,-96 Q-35,-72 -31,-50', fill: 'none', stroke: '#ffffff', 'stroke-width': 3.5, opacity: 0.7, 'stroke-linecap': 'round' }, g);
          el('rect', { x: -26, y: -97, width: 9, height: 30, rx: 2.5, fill: INK }, g);
          el('rect', { x: 17, y: -94, width: 9, height: 21, rx: 2.5, fill: INK }, g);
          el('path', { d: 'M-8.5,-58 H8.5 V-52 A8.5,8.5 0 0,1 -8.5,-52 Z', fill: INK }, g);
          /* his terminal screws: brass on the hot side, silver on the neutral
             side, the green ground screw at his foot */
          for (const [sx, sy, f] of [[61, -76, 'url(#gScrewBrass)'], [-61, -76, 'url(#gScrewSilver)'], [0, -24, 'url(#gScrewGreen)']]) {
            el('circle', { cx: sx, cy: sy, r: 9, fill: f, stroke: INK, 'stroke-width': 3 }, g);
            el('path', { d: `M${sx - 5},${sy - 2} L${sx + 5},${sy + 2}`, stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, g);
          }
          return {};
        }
        el('rect', { x: -42, y: -100, width: 84, height: 62, rx: 24, fill: 'url(#gRecep)', stroke: INK, 'stroke-width': 4 }, g);
        el('rect', { x: -35, y: -80, width: 6, height: 17, rx: 2, fill: INK }, g);
        el('rect', { x: 29, y: -82, width: 7, height: 20, rx: 2, fill: INK }, g);
        el('circle', { cx: 0, cy: -121, r: 7, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 3 }, g);
        el('path', { d: 'M-4.5,-121 H4.5', stroke: INK, 'stroke-width': 2.2 }, g);
        return {};
      },
    });
  }

  function makeSwitch(scene, x, y, scale, opts = {}) {
    return new Toon(scene, {
      x, y, scale, hipH: 56, stance: 23, limbW: 7, gloveScale: 1.28, shadowW: 66, hits: [{ x: 0, y: -176, r: 48 }, { x: 0, y: -115, r: 52 }, { x: 0, y: -52, r: 48 }],
      slab: { d: 'M-42,-212 Q0,-224 42,-212 Q58,-206 56,-188 Q62,-110 52,-36 Q48,-16 30,-16 H-30 Q-48,-16 -52,-36 Q-62,-110 -56,-188 Q-58,-206 -42,-212 Z', fill: '#a8906a', depth: 15 },
      shoulders: [[-44, -122], [44, -122]], hips: [[-15, -22], [15, -22]],
      face: { x: 0, y: -165, spacing: 16.5, rx: 12.5, ry: 16, mouthY: 105, mouthW: 15, turnShift: 6, lidColor: '#efe2c2', browW: 5.5, pop: 84, sweatOut: 68, maxOpen: 0.75, maxBrow: 0.9 },
      life: { breath: 2.4, bounce: 5, beatMul: 0.5, sway: 3, lean: 2.5, nervous: 0.35 },
      pose: Object.assign({ lhx: -26, lhy: 48, rhx: 26, rhy: 48, browTilt: 0.9, browRaise: 0.5, pupil: 0.75, knee: -0.25, lid: 0.2 }, opts.pose || {}),
      disc: { lg: 'claw', rg: 'claw', mouth: 'grit' },
      draw(g) {
        el('path', { d: 'M-42,-212 Q0,-224 42,-212 Q58,-206 56,-188 Q62,-110 52,-36 Q48,-16 30,-16 H-30 Q-48,-16 -52,-36 Q-62,-110 -56,-188 Q-58,-206 -42,-212 Z', fill: 'url(#gPlate)', stroke: INK, 'stroke-width': 5.5, 'stroke-linejoin': 'round' }, g);
        volume(g, 'M-42,-212 Q0,-224 42,-212 Q58,-206 56,-188 Q62,-110 52,-36 Q48,-16 30,-16 H-30 Q-48,-16 -52,-36 Q-62,-110 -56,-188 Q-58,-206 -42,-212 Z', -62, -224, 124, 208);
        bulgeShade(g, 'M46,-192 Q56,-110 46,-36 Q40,-26 26,-26', 'M-46,-190 Q-54,-140 -50,-100');
        el('circle', { cx: 0, cy: -30, r: 5, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2.5 }, g);
        el('path', { d: 'M-3,-30 H3', stroke: INK, 'stroke-width': 2 }, g);
        if (opts.labels) {
          el('text', { x: 17, y: -119, 'font-family': 'Special Elite, monospace', 'font-size': 10, fill: '#7a6440' }, g).textContent = 'ON';
          el('text', { x: 17, y: -96, 'font-family': 'Special Elite, monospace', 'font-size': 10, fill: '#7a6440' }, g).textContent = 'OFF';
        }
        el('rect', { x: -10, y: -128, width: 20, height: 36, rx: 5, fill: '#3b2a1f', stroke: INK, 'stroke-width': 3.5 }, g);
        const lever = el('g', {}, g);
        el('path', { d: 'M-6,0 L-8,-28 Q0,-35 8,-28 L6,0 Z', fill: 'url(#gPlate)', stroke: INK, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, lever);
        el('path', { d: 'M-3.5,-6 L-4.5,-25', stroke: '#fffdf4', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, lever);
        return {
          update(p) { const lv = clamp(p.lever, -1, 1); lever.setAttribute('transform', `translate(0,-110) scale(1,${R((lv < 0 ? lv * 0.62 : lv) * 100) / 100})`); },
        };
      },
    });
  }

  function makeFuse(scene, x, y, scale) {
    return new Toon(scene, {
      x, y, scale, hipH: 40, stance: 17, limbW: 5.5, gloveScale: 1.05, shoeScale: 0.72, shadowW: 46, hits: [{ x: 0, y: -140, r: 28 }, { x: 0, y: -80, r: 32 }, { x: 0, y: -16, r: 28 }],
      rim: 'M-26,-156 H26 V-128 H22 Q36,-76 22,-24 H26 V0 H-26 V-24 H-22 Q-36,-76 -22,-128 H-26 Z',
      shoulders: [[-31, -84], [31, -84]], hips: [[-9, -2], [9, -2]],
      face: { x: 0, y: -94, spacing: 11, rx: 9.5, ry: 13.5, mouthY: 27, mouthW: 9, turnShift: 5, lidColor: '#e6f1f1', browW: 4, blush: 0.34, pop: 52, sweatOut: 42, maxBrow: 0.9, maxOpen: 0.9 },
      life: { breath: 1.9, bounce: 5, beatOffset: 0.25, sway: 2.5, lean: 2.5, nervous: 0.5 },
      pose: { lhx: -20, lhy: 38, rhx: 20, rhy: 38, browTilt: 1, browRaise: 0.6, pupil: 0.7, knee: -0.3, lid: 0.1, mouthOpen: 0.3 },
      disc: { lg: 'claw', rg: 'claw', mouth: 'worry' },
      draw(g) {
        el('path', { d: 'M-22,-130 Q-36,-76 -22,-22 H22 Q36,-76 22,-130 Z', fill: 'url(#gFuseGlass)' }, g);
        const glassHot = el('path', { d: 'M-22,-130 Q-36,-76 -22,-22 H22 Q36,-76 22,-130 Z', fill: '#ff9a3a', opacity: 0 }, g);
        /* the fuse element only shows near the caps; the face owns the middle of the glass */
        const mid = 'fuseMask' + uid++;
        const mask = el('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: -40, y: -170, width: 80, height: 190 }, scene.defs);
        el('rect', { x: -40, y: -170, width: 80, height: 190, fill: '#fff' }, mask);
        el('ellipse', { cx: 0, cy: -80, rx: 27, ry: 45, fill: '#000' }, mask);
        const inner = el('g', { mask: `url(#${mid})` }, g);
        const element = el('path', { d: 'M0,-130 V-112 M0,-40 V-22', stroke: '#7d7a72', 'stroke-width': 3.2 }, inner);
        const strip = el('path', { d: 'M0,-112 L-3,-100 L3,-88 L-3,-76 L3,-64 L-3,-52 L0,-40', fill: 'none', stroke: '#7d7a72', 'stroke-width': 2.4 }, inner);
        const hot = el('path', { d: 'M0,-130 V-112 L-3,-100 L3,-88 L-3,-76 L3,-64 L-3,-52 L0,-40 V-22', fill: 'none', stroke: '#ffb347', 'stroke-width': 5, filter: 'url(#softBlur)', opacity: 0 }, inner);
        el('path', { d: 'M-22,-130 Q-36,-76 -22,-22 H22 Q36,-76 22,-130 Z', fill: 'none', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, g);
        el('path', { d: 'M-20,-118 Q-28,-78 -20,-38', fill: 'none', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }, g);
        el('path', { d: 'M22,-116 Q30,-76 22,-36', fill: 'none', stroke: '#6f9296', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.35 }, g);
        for (const [y0, y1] of [[-156, -128], [-24, 0]]) {
          el('rect', { x: -26, y: y0, width: 52, height: y1 - y0, rx: 5, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 4 }, g);
          el('path', { d: `M-26,${y0 + 9} H26 M-26,${y1 - 9} H26`, stroke: INK, 'stroke-width': 2, opacity: 0.6 }, g);
        }
        return {
          update(p) {
            const h = clamp(p.heat);
            hot.setAttribute('opacity', R(h * 100) / 100);
            glassHot.setAttribute('opacity', R(h * 32) / 100);
            strip.setAttribute('stroke', hexLerp('#7d7a72', '#ff8a2a', h));
            element.setAttribute('stroke', hexLerp('#7d7a72', '#ff8a2a', h));
          },
        };
      },
    });
  }

  function makeMeter(scene, x, y, scale) {
    let lastScreen = null;
    return new Toon(scene, {
      x, y, scale, hipH: 48, stance: 24, limbW: 7, gloveScale: 1.2, shadowW: 70, hits: [{ x: 0, y: -205, r: 64 }, { x: 0, y: -130, r: 66 }, { x: 0, y: -50, r: 64 }], probes: true, armColors: ['#2a2a2c', '#c7322b'],
      slab: { d: 'M-50,-242 Q0,-252 50,-242 Q62,-238 62,-222 Q68,-110 62,-20 Q60,0 38,0 H-38 Q-60,0 -62,-20 Q-68,-110 -62,-222 Q-62,-238 -50,-242 Z', fill: '#8a6012', depth: 20 },
      shoulders: [[-52, -134], [52, -134]], hips: [[-18, -3], [18, -3]],
      face: { x: 0, y: -136, spacing: 16, rx: 12.5, ry: 17.5, mouthY: 25, mouthW: 13, turnShift: 7, lidColor: '#3b3d42', lineColor: '#f4e7c6', browW: 5, blush: 0.4, pop: 108, sweatOut: 76, maxOpen: 0.55, maxBrow: 0.9 },
      life: { breath: 3.1, bounce: 6, beatOffset: 0.75, sway: 3, lean: 1.8, nervous: 0.18 },
      pose: { lhx: -24, lhy: 52, rhx: 24, rhy: 52, browTilt: 0.5, browRaise: 0.3, pupil: 0.85, knee: 0.1, lid: 0.18 },
      disc: { lg: 'fist', rg: 'fist', mouth: 'flat', screen: '0.00' },
      draw(g) {
        el('path', { d: 'M-50,-242 Q0,-252 50,-242 Q62,-238 62,-222 Q68,-110 62,-20 Q60,0 38,0 H-38 Q-60,0 -62,-20 Q-68,-110 -62,-222 Q-62,-238 -50,-242 Z', fill: 'url(#gHolster)', stroke: INK, 'stroke-width': 5.5, 'stroke-linejoin': 'round' }, g);
        volume(g, 'M-50,-242 Q0,-252 50,-242 Q62,-238 62,-222 Q68,-110 62,-20 Q60,0 38,0 H-38 Q-60,0 -62,-20 Q-68,-110 -62,-222 Q-62,-238 -50,-242 Z', -68, -252, 136, 252);
        el('path', { d: 'M-46,-226 V-40', stroke: '#ffe6a0', 'stroke-width': 5, opacity: 0.7, 'stroke-linecap': 'round' }, g);
        el('rect', { x: -45, y: -229, width: 90, height: 218, rx: 13, fill: '#3b3d42', stroke: INK, 'stroke-width': 3.5 }, g);
        el('rect', { x: -38, y: -224, width: 76, height: 42, rx: 6, fill: '#202226', stroke: INK, 'stroke-width': 2.5 }, g);
        el('rect', { x: -33, y: -220, width: 66, height: 34, rx: 3, fill: '#b7c99b' }, g);
        el('path', { d: 'M-33,-217 H33', stroke: '#8fa276', 'stroke-width': 3 }, g);
        const text = el('text', { x: 0, y: -195, 'text-anchor': 'middle', 'font-family': '"Courier New", Courier, monospace', 'font-weight': 700, 'font-size': 22, fill: '#1d2a16' }, g);
        el('circle', { cx: 0, cy: -56, r: 20, fill: '#26282c', stroke: INK, 'stroke-width': 3.5 }, g);
        for (const [lx, ly, s] of [[-40, -52, 'V'], [27, -52, 'Ω'], [27, -30, 'A']]) {
          el('text', { x: lx, y: ly, 'font-family': 'Special Elite, monospace', 'font-size': 10, fill: '#f4e7c6' }, g).textContent = s;
        }
        const knob = el('g', {}, g);
        el('rect', { x: -5, y: -17, width: 10, height: 34, rx: 5, fill: '#4a4d54', stroke: INK, 'stroke-width': 2.5 }, knob);
        el('path', { d: 'M0,-3 V-14', stroke: '#f4e7c6', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, knob);
        for (const [jx, col] of [[-22, '#1a1a1a'], [0, '#1a1a1a']]) {
          el('circle', { cx: jx, cy: -22, r: 6, fill: col, stroke: INK, 'stroke-width': 2.2 }, g);
          el('circle', { cx: jx, cy: -22, r: 2.2, fill: '#0a0a0a' }, g);
        }
        el('circle', { cx: -38, cy: -22, r: 6, fill: '#c7322b', stroke: INK, 'stroke-width': 2.2 }, g);
        el('circle', { cx: -38, cy: -22, r: 2.2, fill: '#0a0a0a' }, g);
        return {
          update(p, t, d) {
            knob.setAttribute('transform', `translate(0,-56) rotate(${R(p.dial * 45 - 30)})`);
            if (d.screen !== lastScreen) { text.textContent = d.screen; lastScreen = d.screen; }
          },
        };
      },
    });
  }

  /* Sparky Junction (owner-approved, cp-v16): a grumpy steel 4-11/16 box who
     rules over splices and pigtails. Knockout-ring monocle on a bead chain, a
     bow tie of two wire nuts. He stands on the bench with two switches in his
     gangs and the splices in his open belly, so his box never moves: the life
     is in his face plate (it turns, with its own thickness), his brows, his
     monocle (it pops out on a scare and dangles), his tie and his gloves.
     His front is a frame: the gang openings and the belly are see-through, so
     the wires, nuts and screws behind them show. */
  function makeJunction(scene, x, y, scale) {
    const OUT = 'M-131,-322 H131 Q145,-322 145,-308 V-16 Q145,-2 131,-2 H-131 Q-145,-2 -145,-16 V-308 Q-145,-322 -131,-322 Z';
    const gang = (x0, x1) => `M${x0 + 6},-226 H${x1 - 6} Q${x1},-226 ${x1},-220 V-80 Q${x1},-74 ${x1 - 6},-74 H${x0 + 6} Q${x0},-74 ${x0},-80 V-220 Q${x0},-226 ${x0 + 6},-226 Z`;
    const BAY = 'M-129,-62 H129 Q135,-62 135,-56 V-18 Q135,-12 129,-12 H-129 Q-135,-12 -135,-18 V-56 Q-135,-62 -129,-62 Z';
    let mono = null, tie = null, head = null, headSlab = null, outUntil = -9, lastHead = '';
    return new Toon(scene, {
      x, y, scale, hipH: 78, stance: 66, limbW: 8, legW: 9, gloveScale: 1.3, shoeScale: 1.08, shadowW: 160, soft: 0, rim: OUT,
      hits: [{ x: 0, y: -280, r: 64 }, { x: 0, y: -150, r: 120 }],
      shoulders: [[-146, -262], [146, -262]], hips: [[-70, -4], [70, -4]],
      face: { x: 0, y: -292, spacing: 34, rx: 16, ry: 19, mouthY: 34, mouthW: 26, turnShift: 15, lidColor: '#b9bdb7', browW: 7.5, pop: 104, sweatOut: 96, maxOpen: 0.8, maxBrow: 1.1 },
      life: { breath: 4.8, bounce: 0, beatMul: 0.29, beatOffset: 0.2, sway: 0, lean: 0, nervous: 0.04 },
      pose: { lhx: -16, lhy: 168, rhx: 16, rhy: 168, lbend: 0.18, rbend: 0.18, browTilt: -0.9, browRaise: 0, lid: 0.32, pupil: 0.8, mouthOpen: 0.08, knee: 0.05 },
      disc: { lg: 'back', rg: 'back', mouth: 'flat' },
      draw(g) {
        /* the box's depth, down his right side */
        el('path', { d: 'M145,-308 L160,-296 V-12 Q160,4 146,6 L131,-2 Q145,-2 145,-16 Z', fill: '#4a4842', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
        /* the front: one steel frame, the gangs and the belly open */
        const front = el('path', { d: OUT + ' ' + gang(-135, -8) + ' ' + gang(8, 135) + ' ' + BAY, fill: 'url(#gBox)', 'fill-rule': 'evenodd', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
        el('path', { d: OUT + ' ' + gang(-135, -8) + ' ' + gang(8, 135) + ' ' + BAY, fill: 'url(#spangle)', 'fill-rule': 'evenodd' }, g);
        void front;
        /* the 2-gang ring round the openings, with its four little screws */
        el('path', { d: 'M-142,-236 H142 M-142,-64 H142', stroke: '#f2f4f5', 'stroke-width': 2.4, opacity: 0.5 }, g);
        for (const [sx, sy] of [[-72, -232], [72, -232], [-72, -68], [72, -68]]) {
          el('circle', { cx: sx, cy: sy, r: 4.6, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2 }, g);
          el('path', { d: `M${sx - 3},${sy - 1} L${sx + 3},${sy + 1}`, stroke: INK, 'stroke-width': 1.5 }, g);
        }
        /* knockouts down his sides */
        for (const ky of [-150, -100]) for (const kx of [-140, 140]) { el('circle', { cx: kx, cy: ky, r: 7, fill: 'none', stroke: INK, 'stroke-width': 2, opacity: 0.6 }, g); el('circle', { cx: kx, cy: ky, r: 3, fill: INK, opacity: 0.4 }, g); }
        el('path', { d: 'M-136,-300 V-30', stroke: '#e6e8e4', 'stroke-width': 4, opacity: 0.55, 'stroke-linecap': 'round' }, g);
        /* his face plate: a raised blank band, with its own edge for when he turns */
        head = el('g', {}, g);
        headSlab = [-1, 1].map(s => el('path', { d: `M${s * 122},-316 L${s * 138},-306 V-240 L${s * 122},-246 Z`, fill: '#57554f', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0 }, head));
        el('rect', { x: -126, y: -316, width: 252, height: 72, rx: 10, fill: 'url(#gBox)', stroke: INK, 'stroke-width': 4.5 }, head);
        el('rect', { x: -126, y: -316, width: 252, height: 72, rx: 10, fill: 'url(#spangle)' }, head);
        el('path', { d: 'M-114,-306 H90', stroke: '#fbfcfa', 'stroke-width': 3, opacity: 0.6, 'stroke-linecap': 'round' }, head);
        el('path', { d: 'M-116,-252 H116', stroke: '#3c3a35', 'stroke-width': 3, opacity: 0.35 }, head);
        /* the bow tie: two wire nuts, tip to tip, knotted with a twist of copper */
        tie = el('g', { transform: 'translate(0,-236)' }, g);
        for (const s of [-1, 1]) {
          el('path', { d: `M${s * 5},-9 L${s * 34},-16 Q${s * 42},0 ${s * 34},16 L${s * 5},9 Z`, fill: 'url(#gNut)', stroke: INK, 'stroke-width': 3.2, 'stroke-linejoin': 'round' }, tie);
          el('path', { d: `M${s * 13},-10 L${s * 13},10 M${s * 21},-12 L${s * 21},12 M${s * 28},-14 L${s * 28},14`, stroke: '#8a3a06', 'stroke-width': 1.6, opacity: 0.8 }, tie);
          el('path', { d: `M${s * 30},-11 Q${s * 36},-6 ${s * 36},-1`, fill: 'none', stroke: '#ffe0b0', 'stroke-width': 2, opacity: 0.8, 'stroke-linecap': 'round' }, tie);
        }
        el('rect', { x: -7, y: -9, width: 14, height: 18, rx: 4, fill: '#d98a4a', stroke: INK, 'stroke-width': 2.6 }, tie);
        el('path', { d: 'M-5,-4 L5,0 M-5,2 L5,6', stroke: '#8a4a1a', 'stroke-width': 1.6 }, tie);
        return {
          over(gg) {
            /* the monocle: the ring left round a punched-out knockout, a glint,
               and a bead chain down to his tie */
            mono = el('g', {}, gg);
            mono.chain = el('path', { fill: 'none', stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 6' }, mono);
            mono.ring = el('g', {}, mono);
            el('circle', { r: 24, fill: '#e8f0f2', opacity: 0.22 }, mono.ring);
            el('circle', { r: 24, fill: 'none', stroke: INK, 'stroke-width': 9 }, mono.ring);
            el('circle', { r: 24, fill: 'none', stroke: 'url(#gSteel)', 'stroke-width': 5 }, mono.ring);
            el('path', { d: 'M-6,-30 L6,-30 L4,-24 L-4,-24 Z', fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1.8 }, mono.ring);
            el('path', { d: 'M-15,-12 Q-12,-17 -6,-19', fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.85, 'stroke-linecap': 'round' }, mono.ring);
          },
          update(p, t) {
            const yaw = clamp(p.turn, -1, 1) * 1.05;
            /* the face plate turns: narrower front, its edge showing on the far side */
            const kx = R((0.9 + 0.1 * Math.cos(yaw)) * 1000) / 1000, sh = R(-Math.sin(yaw) * 7);
            const ht = `translate(${sh},0) scale(${kx},1)`;
            if (ht !== lastHead) { lastHead = ht; head.setAttribute('transform', ht); headSlab[0].setAttribute('opacity', R(clamp(yaw * 4) * 100) / 100); headSlab[1].setAttribute('opacity', R(clamp(-yaw * 4) * 100) / 100); }
            /* the tie bobs when he talks and jumps when he's startled */
            tie.setAttribute('transform', `translate(${R(sh * 0.6)},${R(-236 - p.pop * 6)}) rotate(${R(Math.sin(t * 9) * 5 * clamp(p.mouthOpen - 0.15) + p.shake * 2 * Math.sin(t * 31))})`);
            /* where his right eye is (the rig's own face maths) */
            const turn = clamp(p.turn, -1, 1), far = Math.max(0, turn);
            const ex = 0 + turn * 15 + 34 * (1 - 0.2 * Math.abs(turn)), ey = -292 + p.faceY, er = 1 - 0.38 * far;
            if (p.pop > 0.75 && t > outUntil) outUntil = t + 1.8;
            const tieAt = [R(sh * 0.6 + 8), -228];
            if (t < outUntil) {
              /* popped out: it swings on its chain under his chin */
              const u = 1 - (outUntil - t) / 1.8, sw = Math.sin(u * 14) * 26 * (1 - u);
              const mx = ex + 10 + sw, my = ey + 70 - 8 * Math.abs(Math.cos(u * 14));
              mono.ring.setAttribute('transform', `translate(${R(mx)},${R(my)}) rotate(${R(sw * 1.2)}) scale(0.9)`);
              mono.chain.setAttribute('d', `M${tieAt[0]},${tieAt[1]} Q${R((tieAt[0] + mx) / 2)},${R(Math.max(tieAt[1], my) + 10)} ${R(mx)},${R(my - 22)}`);
            } else {
              mono.ring.setAttribute('transform', `translate(${R(ex)},${R(ey)}) scale(${R(er * 100) / 100},1)`);
              mono.chain.setAttribute('d', `M${R(ex + 22 * er)},${R(ey + 10)} Q${R(ex + 40)},${R(ey + 40)} ${tieAt[0] + 24},${tieAt[1] + 6}`);
            }
          },
        };
      },
    });
  }

  function makeBoard(scene, x, y, scale, opts = {}) {
    let leds = [], relays = [], heart = null, book = null;
    const t0 = rand(0, 1);
    return new Toon(scene, {
      x, y, scale, hipH: 46, stance: 34, limbW: 8, gloveScale: 1.3, shadowW: 110, hits: [{ x: -52, y: -120, r: 50 }, { x: 52, y: -120, r: 50 }, { x: -52, y: -44, r: 48 }, { x: 52, y: -44, r: 48 }],
      slab: { d: 'M-90,-164 H90 Q98,-164 98,-156 V-10 Q98,-2 90,-2 H-90 Q-98,-2 -98,-10 V-156 Q-98,-164 -90,-164 Z', fill: '#24402b', depth: 10 },
      shoulders: [[-98, -70], [98, -70]], hips: [[-30, -3], [30, -3]],
      face: { x: 0, y: -86, spacing: 20, rx: 14, ry: 19, mouthY: 37, mouthW: 15, turnShift: 10, lidColor: '#43704a', browW: 5.5, blush: 0, pop: 118, sweatOut: 114, maxOpen: 0.6, maxBrow: 1 },
      life: { breath: 3.8, bounce: 4, beatOffset: 0.4, beatMul: 0.5, sway: 2.5, lean: 1.2, nervous: 0.12 },
      pose: { lhx: -46, lhy: 60, rhx: 26, rhy: 52, browTilt: 1.15, browRaise: 0.15, pupil: 0.95, lid: 0.36, knee: 0.05, mouthOpen: 0.25 },
      disc: { lg: 'back', rg: 'back', mouth: 'frown' },
      draw(g) {
        el('rect', { x: -98, y: -164, width: 196, height: 162, rx: 8, fill: 'url(#gPCB)', stroke: INK, 'stroke-width': 5.5 }, g);
        volume(g, 'M-90,-164 H90 Q98,-164 98,-156 V-10 Q98,-2 90,-2 H-90 Q-98,-2 -98,-10 V-156 Q-98,-164 -90,-164 Z', -98, -164, 196, 162);
        el('rect', { x: -90, y: -156, width: 180, height: 146, rx: 5, fill: 'none', stroke: '#dff5e6', 'stroke-width': 1.3, opacity: 0.35 }, g);
        el('path', { d: 'M-92,-88 H-72 M-92,-74 H-80 M72,-36 H90 M64,-82 H90', fill: 'none', stroke: '#8fd6a6', 'stroke-width': 2, opacity: 0.35 }, g);
        for (const [hx, hy] of [[-86, -152], [86, -152], [-86, -14], [86, -14]]) {
          el('circle', { cx: hx, cy: hy, r: 5.5, fill: '#d9d3c4', stroke: INK, 'stroke-width': 2 }, g);
          el('circle', { cx: hx, cy: hy, r: 2.3, fill: '#1a1a1a' }, g);
        }
        const block = (bx, by, n, label, above) => {
          el('rect', { x: bx, y: by, width: n * 11 + 6, height: 17, rx: 2, fill: '#3fa45e', stroke: INK, 'stroke-width': 2.6 }, g);
          for (let i = 0; i < n; i++) {
            el('circle', { cx: bx + 8.5 + i * 11, cy: by + 8.5, r: 4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1.4 }, g);
            el('path', { d: `M${bx + 6 + i * 11},${by + 8.5} h5`, stroke: INK, 'stroke-width': 1.2 }, g);
          }
          if (label) el('text', { x: bx + 2, y: above ? by - 3 : by + 26, 'font-family': 'Special Elite, monospace', 'font-size': 7.5, fill: '#e8fff0' }, g).textContent = label;
        };
        block(-78, -162, 5, 'READERS', false);
        block(-12, -162, 5, '', false);
        block(52, -162, 3, 'INPUTS', false);
        block(-80, -20, 4, '', true);
        block(-18, -20, 4, '', true);
        block(40, -20, 4, '', true);
        el('rect', { x: -84, y: -124, width: 30, height: 30, rx: 2, fill: '#1c1c1e', stroke: INK, 'stroke-width': 2 }, g);
        el('path', { d: 'M-88,-118 h4 M-88,-110 h4 M-88,-102 h4 M-54,-118 h4 M-54,-110 h4 M-54,-102 h4', stroke: '#c9c4bb', 'stroke-width': 2 }, g);
        el('circle', { cx: -79, cy: -119, r: 1.8, fill: '#9a9a9a' }, g);
        el('text', { x: -80, y: -104, 'font-family': 'Special Elite, monospace', 'font-size': 6.5, fill: '#bbb' }, g).textContent = 'CPU';
        el('text', { x: -84, y: -80, 'font-family': 'Special Elite, monospace', 'font-size': 8, fill: '#e8fff0', opacity: 0.8 }, g).textContent = 'LP1502';
        for (let i = 0; i < 2; i++) {
          const rg = el('g', {}, g);
          el('rect', { x: 56, y: -128 + i * 26, width: 30, height: 21, rx: 2, fill: '#2f62b8', stroke: INK, 'stroke-width': 2.5 }, rg);
          el('text', { x: 64, y: -113 + i * 26, 'font-family': 'Special Elite, monospace', 'font-size': 8, fill: '#e6eeff' }, rg).textContent = 'K' + (i + 1);
          relays.push(rg);
        }
        el('circle', { cx: -70, cy: -58, r: 9, fill: '#233f94', stroke: INK, 'stroke-width': 2.5 }, g);
        el('path', { d: 'M-76,-60 h12', stroke: '#9fb2ff', 'stroke-width': 2 }, g);
        el('circle', { cx: 70, cy: -46, r: 8, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 2 }, g);
        for (let i = 0; i < 3; i++) leds.push(el('circle', { cx: 56 + i * 11, cy: -64, r: 3.6, fill: '#5a1a14', stroke: INK, 'stroke-width': 1.2 }, g));
        heart = el('circle', { cx: -20, cy: -142, r: 3.4, fill: '#1f5a2e', stroke: INK, 'stroke-width': 1.2 }, g);
        el('path', { d: 'M-76,-11 c-12,8 -26,4 -32,16 c-4,10 6,14 1,22', fill: 'none', stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g);
        el('path', { d: 'M-76,-11 c-12,8 -26,4 -32,16 c-4,10 6,14 1,22', fill: 'none', stroke: '#c7322b', 'stroke-width': 3.6, 'stroke-linecap': 'round' }, g);
        el('path', { d: 'M-107,27 l-3,5 M-107,27 l1,6 M-107,27 l4,4', stroke: '#e39440', 'stroke-width': 1.6 }, g);
        return {
          /* the book it hides behind: "Card Readers & You", held open, cover facing us */
          over(bg) {
            if (!opts.book) return;
            book = el('g', {}, bg);
            el('path', { d: 'M-60,-62 H60 V2 H-60 Z', fill: '#f3e8cc', stroke: INK, 'stroke-width': 3.5 }, book);
            el('path', { d: 'M-58,-58 H58 M-58,-54 H58', stroke: '#b9a57c', 'stroke-width': 1.4 }, book);
            el('path', { d: 'M-62,-54 Q-30,-60 0,-52 Q30,-60 62,-54 V8 Q30,2 0,10 Q-30,2 -62,8 Z', fill: '#8e2a22', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, book);
            el('path', { d: 'M0,-52 V10', stroke: INK, 'stroke-width': 3 }, book);
            el('path', { d: 'M-56,-46 Q-30,-51 -6,-45 M6,-45 Q30,-51 56,-46', fill: 'none', stroke: '#c85a48', 'stroke-width': 2.5, opacity: 0.8 }, book);
            el('rect', { x: -46, y: -38, width: 30, height: 38, rx: 4, fill: '#3b3d42', stroke: '#f0d9a0', 'stroke-width': 1.8 }, book);
            el('rect', { x: -40, y: -32, width: 18, height: 6, rx: 1.5, fill: '#9fe0b0' }, book);
            el('circle', { cx: -31, cy: -14, r: 5, fill: 'none', stroke: '#f0d9a0', 'stroke-width': 1.6 }, book);
            el('path', { d: 'M-24,-42 l10,-8 h8 l-10,8 Z', fill: '#f0d9a0' }, book);
            el('text', { x: 31, y: -30, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 11, fill: '#f0d9a0' }, book).textContent = 'CARD';
            el('text', { x: 31, y: -17, 'text-anchor': 'middle', 'font-family': 'Rye, Georgia, serif', 'font-size': 9.5, fill: '#f0d9a0', textLength: 46, lengthAdjust: 'spacingAndGlyphs' }, book).textContent = 'READERS';
            el('text', { x: 31, y: -5, 'text-anchor': 'middle', 'font-family': 'Special Elite, monospace', 'font-size': 7.5, fill: '#f0d9a0' }, book).textContent = '& YOU';
          },
          update(p, t) {
            if (book) book.setAttribute('transform', `translate(0,${R(p.book * 34)})`);
            const alarm = p.alarm > 0.3;
            const f = Math.floor(t * 12);
            leds.forEach((l, i) => l.setAttribute('fill', alarm ? ((f + i) % 2 ? '#ff3b2a' : '#5a1a14') : (i === 0 && f % 9 === 0 ? '#ff3b2a' : '#5a1a14')));
            heart.setAttribute('fill', (t + t0) % 1.2 < 0.12 ? '#39ff7a' : '#1f5a2e');
            relays.forEach((r, i) => r.setAttribute('transform', alarm && (f + i) % 2 ? 'translate(0,-2.5)' : ''));
          },
        };
      },
    });
  }

  /* the live wire: a red cable that pokes out of a junction box, with stripped
     copper strands for hair. It hiccups sparks and can't help it. */
  function makeWire(scene, x, y, scale) {
    let cable = [], strands = [], strandHot = [], cableHits = [];
    const toon = new Toon(scene, {
      x, y, scale, hipH: 84, arms: false, legs: false, shadowW: 62, shadowFixed: true, hits: [{ x: 0, y: -34, r: 34 }],
      face: { x: 0, y: -36, spacing: 11.5, rx: 9, ry: 11, mouthY: 23, mouthW: 12, turnShift: 9, lidColor: '#b8392c', browW: 4.2, blush: 0.4, pop: 74, sweatOut: 46, maxOpen: 0.35, maxBrow: 0.5 },
      life: { breath: 2.2, bounce: 5, beatOffset: 0.15, sway: 16, lean: 9, nervous: 0.2 },
      pose: { hipX: 14, lean: -8, browTilt: 0.6, browRaise: 0.4, pupil: 0.8, lid: 0.1, mouthOpen: 0.2 },
      disc: { mouth: 'flat' },
      draw(g, tn) {
        el('path', { d: 'M-46,1 L-36,-12 H36 L46,1 Z', fill: '#9a958a', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, tn.backG);
        el('path', { d: 'M-33,-1 L-26,-9 H26 L33,-1 Z', fill: '#1c1714' }, tn.backG);
        cable = [
          el('path', { fill: '#b8392c', stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, tn.backG),
          el('path', { fill: 'none', stroke: '#ff8d76', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.55 }, tn.backG),
          el('path', { fill: 'none', stroke: '#8e1a14', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.35 }, tn.backG),
        ];
        const box = el('g', {}, tn.frontG);
        el('rect', { x: -46, y: 0, width: 92, height: 46, rx: 4, fill: 'url(#gBox)', stroke: INK, 'stroke-width': 4.5 }, box);
        el('path', { d: 'M-46,6 H46', stroke: INK, 'stroke-width': 2.5 }, box);
        for (const kx of [-24, 24]) el('circle', { cx: kx, cy: 26, r: 8, fill: 'none', stroke: '#4a4640', 'stroke-width': 2.5 }, box);
        el('circle', { cx: 0, cy: 26, r: 4, fill: 'url(#gSteel)', stroke: INK, 'stroke-width': 1.6 }, box);
        el('path', { d: 'M-40,12 V38', stroke: '#e8e4da', 'stroke-width': 3, opacity: 0.6, 'stroke-linecap': 'round' }, box);
        for (let i = 0; i < 5; i++) {
          strands.push([el('path', { fill: 'none', stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g), el('path', { fill: 'none', stroke: '#e8973f', 'stroke-width': 3.4, 'stroke-linecap': 'round' }, g)]);
        }
        el('ellipse', { cx: 0, cy: -34, rx: 31, ry: 40, fill: 'url(#gCable)', stroke: INK, 'stroke-width': 5 }, g);
        el('path', { d: 'M-22,-60 Q-12,-70 6,-70', fill: 'none', stroke: '#ffc2b2', 'stroke-width': 4.5, 'stroke-linecap': 'round', opacity: 0.8 }, g);
        el('path', { d: 'M22,-52 Q30,-30 20,-4', fill: 'none', stroke: '#8e1a14', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.35 }, g);
        for (let i = 0; i < 5; i++) strandHot.push(el('circle', { r: 0, fill: '#fff4b0' }, g));
        return {
          hits: () => cableHits,
          update(p, t) {
            const { hx, hy, lean } = toon.cur;
            const rad = (lean * Math.PI) / 180;
            const dx = -Math.sin(rad), dy = Math.cos(rad);
            /* a tapered rubber-hose body with an S-curve line of action */
            const P0 = [0, 30], P1 = [-hx * 0.9, Math.min(-10, hy * 0.35)], P2 = [hx + dx * 46, hy + dy * 46], P3 = [hx, hy + 4];
            const L = [], Rt = [], mid = [], shadeL = [];
            for (let i = 0; i <= 16; i++) {
              const u = i / 16, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, cc = 3 * (1 - u) * u * u, e = u ** 3;
              const px = a * P0[0] + b * P1[0] + cc * P2[0] + e * P3[0], py = a * P0[1] + b * P1[1] + cc * P2[1] + e * P3[1];
              const tx = 3 * (1 - u) ** 2 * (P1[0] - P0[0]) + 6 * (1 - u) * u * (P2[0] - P1[0]) + 3 * u * u * (P3[0] - P2[0]);
              const ty = 3 * (1 - u) ** 2 * (P1[1] - P0[1]) + 6 * (1 - u) * u * (P2[1] - P1[1]) + 3 * u * u * (P3[1] - P2[1]);
              const n = Math.hypot(tx, ty) || 1, nx = -ty / n, ny = tx / n, w = 16 - u * 5;
              L.push([px + nx * w, py + ny * w]); Rt.push([px - nx * w, py - ny * w]);
              mid.push([px + nx * w * 0.45, py + ny * w * 0.45]); shadeL.push([px - nx * w * 0.55, py - ny * w * 0.55]);
            }
            const pts = a2 => a2.map(q => `${R(q[0])},${R(q[1])}`).join(' L');
            cableHits = [4, 8, 12].map(i => [(L[i][0] + Rt[i][0]) / 2, (L[i][1] + Rt[i][1]) / 2, 15]);
            cable[0].setAttribute('d', `M${pts(L)} L${pts(Rt.reverse())} Z`);
            cable[1].setAttribute('d', `M${pts(mid.slice(1, 14))}`);
            cable[2].setAttribute('d', `M${pts(shadeL.slice(1, 14))}`);
            const fz = clamp(p.frizz, 0, 1.6);
            for (let i = 0; i < 5; i++) {
              const a = (-0.62 + i * 0.31) * (1 + fz * 0.5) + Math.sin(t * 5 + i * 1.7) * 0.06;
              const len = 16 + (i % 2) * 6 + fz * 12;
              const bx = Math.sin(a) * 20, by = -70 - Math.cos(a) * 4;
              const ex = bx + Math.sin(a) * len, ey = by - Math.cos(a) * len;
              const curl = (i % 2 ? 1 : -1) * (6 - fz * 4);
              const sd = `M${R(bx)},${R(by)} Q${R((bx + ex) / 2 + curl)},${R((by + ey) / 2)} ${R(ex)},${R(ey)}`;
              strands[i][0].setAttribute('d', sd); strands[i][1].setAttribute('d', sd);
              sa(strandHot[i], { cx: R(ex), cy: R(ey), r: fz > 0.7 ? R(2 + Math.random() * 3) : 0 });
            }
          },
        };
      },
    });
    return toon;
  }

  /* ---------- the villain: the Frayed Phantom ----------
     root origin = the hole in the wall. A gaunt, hunched cord rises out of the
     plaster like a stooped spine, arches over and lets a long narrow head hang from
     its cut end: a skull-like mask of melted red insulation with hollow sockets and
     pinprick eyes, drips of rubber sagging off the brow and cheeks, and a lipless
     stitched seam of a mouth that can split into a too-wide grin of copper-wire
     teeth. The cut end frays into a mane of copper that drifts like hair under
     water, and two thin cords branch off the neck into long bony copper-strand
     fingers. `hood` is his menace: the mane lifts and spreads, the eyes burn. */
  const PH_RED = '#8e2519', PH_DARK = '#5a130d', PH_HI = '#c9523e', COPPER = '#e0913a';
  /* a hand of 3-4 bony copper strands, knuckle-kinked, curling one at a time */
  function strandHand(g) {
    const knot = el('ellipse', { cx: 2, cy: 0, rx: 6.5, ry: 5.5, fill: PH_RED, stroke: INK, 'stroke-width': 3 }, g);
    const fingers = [0, 1, 2, 3].map(() => {
      const o = el('path', { fill: 'none', stroke: INK, 'stroke-width': 6.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const c = el('path', { fill: 'none', stroke: COPPER, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      const tip = el('circle', { r: 0, fill: '#fff4c0' }, g);
      return { o, c, tip };
    });
    g.appendChild(knot);
    const SPREAD = [-34, -11, 11, 34], LEN = [34, 44, 42, 32];
    return {
      update(pose, p, t) {
        const menace = clamp(p.hood, 0, 1.3);
        fingers.forEach((f, i) => {
          let curl = 0.42, len = LEN[i], spread = SPREAD[i], hide = false;
          if (pose === 'claw') { curl = 0.78; spread *= 1.25; }
          else if (pose === 'fist') { curl = 1.5; len *= 0.75; spread *= 0.6; }
          else if (pose === 'palm') { curl = 0.18; spread *= 1.5; }
          else if (pose === 'point') { if (i === 1) { curl = 0.04; len = 62; spread = -2; } else { curl = 1.55; len *= 0.7; spread *= 0.7; } }
          /* each finger curls and uncurls on its own slow beat */
          if (pose !== 'point' || i !== 1) curl += 0.22 * Math.sin(t * 1.3 + i * 1.7) + menace * 0.1;
          let a = (spread * Math.PI) / 180, x = 6, y = 0, d = `M${x},${y}`;
          const segs = [0.44, 0.33, 0.23];
          for (let k = 0; k < 3; k++) {
            x += Math.cos(a) * len * segs[k]; y += Math.sin(a) * len * segs[k];
            d += ` L${R(x)},${R(y)}`;
            a += curl * (0.7 + k * 0.35);
          }
          f.o.setAttribute('d', d); f.c.setAttribute('d', d);
          sa(f.tip, { cx: R(x), cy: R(y), r: !hide && Math.random() < 0.03 + menace * 0.05 ? R(1.5 + Math.random() * 2.5) : 0 });
        });
      },
    };
  }
  function makeEvilWire(scene, x, y, scale) {
    let cable = [], mane = [], sparks = [], cableHits = [], glow = null, drips = [];
    /* a long skull: a wide cranium, sunken cheeks pinched in under the cheekbones,
       and a narrow jaw that sags to a point */
    const SKULL = 'M-12,4 C-18,-4 -19,-20 -24,-30 C-35,-44 -37,-76 -27,-92 C-17,-104 17,-104 27,-92 C37,-76 35,-44 24,-30 C19,-20 18,-4 12,4 C6,10 -6,10 -12,4 Z';
    const toon = new Toon(scene, {
      x, y, scale, hipH: 150, legs: false, limbW: 4.5, gloveScale: 1, tipLen: 56, shadowW: 0, shadowFixed: true,
      armColors: [PH_RED, PH_RED], shoulders: [[-16, -92], [16, -92]],
      hits: [{ x: 0, y: -50, r: 36 }],
      face: { x: 0, y: -62, spacing: 14, rx: 12, ry: 15, mouthY: 46, mouthW: 12, turnShift: 6, lidColor: '#5a130d', eyeWhite: '#120504', pupilColor: '#fff6c8', lineColor: '#2a0806', browW: 6.5, blush: 0, pop: 88, sweatOut: 50, maxOpen: 1, maxBrow: 0.6 },
      life: { breath: 3.6, bounce: 0, sway: 6, lean: 5, nervous: 0.02 },
      pose: { browTilt: -0.8, browRaise: 0, pupil: 0.3, lid: 0.16, mouthOpen: 0.1, lhx: -34, lhy: 94, rhx: 34, rhy: 94, lbend: 0.35, rbend: 0.35, hood: 0.3 },
      disc: { mouth: 'seam', lg: 'back', rg: 'back', lLayer: 'back', rLayer: 'back' },
      hand: g => strandHand(g),
      draw(g, tn) {
        cable = [
          el('path', { fill: PH_RED, stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, tn.backG),
          el('path', { fill: 'none', stroke: PH_HI, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.6 }, tn.backG),
          el('path', { fill: 'none', stroke: PH_DARK, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.45 }, tn.backG),
        ];
        /* the mane: long copper strands streaming from the cut end like ghost hair */
        for (let i = 0; i < 13; i++) {
          mane.push([el('path', { fill: 'none', stroke: INK, 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g), el('path', { fill: 'none', stroke: i % 3 === 1 ? '#c9782e' : COPPER, 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)]);
          sparks.push(el('circle', { r: 0, fill: '#fff4b0' }, g));
        }
        el('path', { d: SKULL, fill: 'url(#gCable)', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
        volume(g, SKULL, -40, -106, 80, 116);
        /* hollow cheeks under hard cheekbones, a heavy melted brow ridge */
        el('path', { d: 'M-28,-44 Q-20,-38 -18,-18 M28,-44 Q20,-38 18,-18', fill: 'none', stroke: PH_DARK, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.6 }, g);
        el('path', { d: 'M-31,-46 Q-24,-40 -16,-42 M31,-46 Q24,-40 16,-42', fill: 'none', stroke: '#e58a74', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.55 }, g);
        el('path', { d: 'M-28,-80 Q-14,-88 0,-79 Q14,-88 28,-80', fill: 'none', stroke: PH_DARK, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.75 }, g);
        el('path', { d: 'M-19,-94 Q-10,-100 4,-100', fill: 'none', stroke: '#f2b0a0', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.6 }, g);
        /* a nasal hollow: two dark slits */
        el('path', { d: 'M-3.5,-42 L-1.5,-34 M3.5,-42 L1.5,-34', fill: 'none', stroke: INK, 'stroke-width': 2.8, 'stroke-linecap': 'round' }, g);
        /* the cut end at the crown: a ragged rim of insulation where the mane bursts out */
        el('path', { d: 'M-18,-98 L-12,-105 L-6,-100 L0,-107 L6,-100 L12,-105 L18,-98', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
        /* drips of melted rubber (some running from the sockets like tears) that
           slowly stretch and let go */
        for (const [dx, dy, len] of [[-15, -47, 13], [13, -46, 10], [-26, -40, 9], [0, -78, 6], [-5, 7, 10]]) {
          const dg = el('path', { fill: PH_RED, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g);
          drips.push({ dg, dx, dy, len, ph: rand(0, 6) });
        }
        /* pinprick eyes glow in the sockets */
        glow = el('g', { filter: 'url(#softBlur)', opacity: 0.5 }, g);
        for (const s of [-1, 1]) el('ellipse', { cx: s * 14, cy: -62, rx: 7, ry: 7, fill: '#fff2a0' }, glow);
        return {
          hits: () => [],
          update(p, t) {
            const { hx, hy, lean, sy } = toon.cur;
            const hf = clamp(p.hood, 0, 1.3), st = clamp(p.stretch, 0, 1);
            glow.setAttribute('opacity', R((0.3 + 0.2 * Math.sin(t * 4.3) + hf * 0.25) * 100) / 100);
            glow.setAttribute('transform', `translate(${R(clamp(p.turn, -1, 1) * 6)},${R(p.faceY)})`);
            /* melting: each drip slowly stretches, snaps back, stretches again */
            for (const dr of drips) {
              const k = ((t * 0.45 + dr.ph) % 1), L = dr.len * (0.6 + k * 0.9), w = 3.2 - k * 0.8;
              dr.dg.setAttribute('d', `M${dr.dx - w},${dr.dy} Q${R(dr.dx - w * 0.6)},${R(dr.dy + L * 0.7)} ${dr.dx},${R(dr.dy + L)} Q${R(dr.dx + w * 0.6)},${R(dr.dy + L * 0.7)} ${dr.dx + w},${dr.dy} Z`);
            }
            const rad = (lean * Math.PI) / 180, sn = Math.sin(rad), cs = Math.cos(rad);
            /* the neck: out of the wall, onto the back edge of the bench, up like a
               stooped spine and over, so the head hangs from the cut end at its crown.
               Craning up (stretch) straightens him so the head leads. */
            const side = hx >= 20 ? 1 : -1;
            const cx0 = hx + 101 * sy * sn, cy0 = hy - 101 * sy * cs;
            const P0 = [0, 0], P1 = [hx * 0.3 - side * 60, 40];
            const P2 = [cx0 - side * 30 * (1 - st) - sn * 80 * (1 - st), cy0 - 110 * (1 - st) + 130 * st], P3 = [cx0, cy0];
            const L = [], Rt = [], mid = [], shade = [];
            for (let i = 0; i <= 22; i++) {
              const u = i / 22, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, cc = 3 * (1 - u) * u * u, e = u ** 3;
              const px = a * P0[0] + b * P1[0] + cc * P2[0] + e * P3[0], py = a * P0[1] + b * P1[1] + cc * P2[1] + e * P3[1];
              const tx = 3 * (1 - u) ** 2 * (P1[0] - P0[0]) + 6 * (1 - u) * u * (P2[0] - P1[0]) + 3 * u * u * (P3[0] - P2[0]);
              const ty = 3 * (1 - u) ** 2 * (P1[1] - P0[1]) + 6 * (1 - u) * u * (P2[1] - P1[1]) + 3 * u * u * (P3[1] - P2[1]);
              const n = Math.hypot(tx, ty) || 1, nx = -ty / n, ny = tx / n;
              /* thick where it leaves the wall, gaunt at the neck, with a slow peristaltic ripple */
              const w = (15 - u * 6.5) * (1 + 0.08 * Math.sin(u * 14 - t * 2.4));
              L.push([px + nx * w, py + ny * w]); Rt.push([px - nx * w, py - ny * w]);
              mid.push([px + nx * w * 0.45, py + ny * w * 0.45]); shade.push([px - nx * w * 0.5, py - ny * w * 0.5]);
            }
            cableHits = [6, 11, 16, 20].map(i => [(L[i][0] + Rt[i][0]) / 2, (L[i][1] + Rt[i][1]) / 2, 20]);
            const pts = a2 => a2.map(q => `${R(q[0])},${R(q[1])}`).join(' L');
            cable[1].setAttribute('d', `M${pts(mid.slice(2, 20))}`);
            cable[2].setAttribute('d', `M${pts(shade.slice(2, 20))}`);
            cable[0].setAttribute('d', `M${pts(L)} L${pts(Rt.reverse())} Z`);
            /* the mane drifts like hair under water: a slow wave runs up each strand,
               it lifts and fans out when he means harm, and crackles now and then */
            const fz = clamp(p.frizz, 0, 1.6), lift = 0.25 + hf * 0.55 + fz * 0.3;
            for (let i = 0; i < mane.length; i++) {
              const u0 = i / (mane.length - 1) - 0.5;
              /* it streams back and away to the right, as if in a draught from the hole */
              let a = u0 * (1.4 + lift * 0.8) + 0.34 * (1 - hf * 0.5);
              const len = 46 + (i % 3) * 12 + lift * 16 - Math.abs(u0) * 14;
              let x = u0 * 30, y = -100 - (1 - Math.abs(u0)) * 3, d = `M${R(x)},${R(y)}`;
              for (let k = 1; k <= 5; k++) {
                a += 0.2 * Math.sin(t * 0.9 + i * 0.7 - k * 0.8) + u0 * 0.12;
                x += Math.sin(a) * len / 5; y -= Math.cos(a) * len / 5 * (0.75 + lift * 0.25);
                d += ` L${R(x)},${R(y)}`;
              }
              mane[i][0].setAttribute('d', d); mane[i][1].setAttribute('d', d);
              sa(sparks[i], { cx: R(x), cy: R(y), r: Math.random() < 0.012 + fz * 0.3 + hf * 0.02 ? R(1.8 + Math.random() * 3) : 0 });
            }
          },
        };
      },
    });
    return toon;
  }

  /* ---------- the window spider: a knot of badly cabled wires on wire legs ---------- */
  class WireSpider {
    constructor(parent) {
      this.g = el('g', { class: 'spider', opacity: 0 }, parent);
      this.strandO = el('path', { fill: 'none', stroke: INK, 'stroke-width': 5 }, this.g);
      this.strand = el('path', { fill: 'none', stroke: '#6a6a6e', 'stroke-width': 2.4 }, this.g);
      this.legs = [];
      const cols = ['#2a2a2c', '#c7322b', '#f1ead8', '#e0b030', '#7a7a80', '#2f62b8', '#2a2a2c', '#c7322b'];
      for (let i = 0; i < 8; i++) {
        const o = el('path', { fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.g);
        const c = el('path', { fill: 'none', stroke: cols[i], 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.g);
        const tie = el('rect', { width: 5, height: 9, rx: 1.5, fill: '#e8e0cc', stroke: INK, 'stroke-width': 1.5 }, this.g);
        const tip = el('path', { fill: 'none', stroke: '#e39440', 'stroke-width': 2, 'stroke-linecap': 'round' }, this.g);
        this.legs.push({ o, c, tie, tip, side: i < 4 ? -1 : 1, k: i % 4, ph: rand(0, 6) });
      }
      this.body = el('g', {}, this.g);
      el('circle', { cx: 0, cy: 0, r: 27, fill: '#1c1618', stroke: INK, 'stroke-width': 4 }, this.body);
      const wc = ['#c7322b', '#f1ead8', '#e0b030', '#7a7a80', '#2f62b8', '#2a2a2c', '#c7322b', '#f1ead8', '#e0b030', '#7a7a80'];
      for (let i = 0; i < 10; i++) {
        const a = rand(0, Math.PI * 2), b = a + rand(1.6, 3.4), r1 = rand(8, 24), r2 = rand(8, 24);
        const d = `M${R(Math.cos(a) * r1)},${R(Math.sin(a) * r1)} C${R(rand(-26, 26))},${R(rand(-26, 26))} ${R(rand(-26, 26))},${R(rand(-26, 26))} ${R(Math.cos(b) * r2)},${R(Math.sin(b) * r2)}`;
        el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, this.body);
        el('path', { d, fill: 'none', stroke: wc[i], 'stroke-width': 3.4, 'stroke-linecap': 'round' }, this.body);
      }
      for (const [tx, ty, rot] of [[-12, -14, 30], [14, -8, -40], [2, 16, 70]]) el('rect', { x: tx - 3, y: ty - 6, width: 6, height: 12, rx: 1.5, fill: '#e8e0cc', stroke: INK, 'stroke-width': 1.6, transform: `rotate(${rot} ${tx} ${ty})` }, this.body);
      this.eyeG = el('g', {}, this.body);
      this.glow = el('g', { filter: 'url(#softBlur)' }, this.eyeG);
      this.eyes = el('g', {}, this.eyeG);
      for (const [ex, ey, r] of [[-9, 6, 4.2], [9, 6, 4.2], [-17, 0, 2.8], [17, 0, 2.8], [-4, -2, 2.4], [4, -2, 2.4]]) {
        el('circle', { cx: ex, cy: ey, r: r * 1.8, fill: '#ff3a1a', opacity: 0.8 }, this.glow);
        el('circle', { cx: ex, cy: ey, r, fill: '#ff6a3a', stroke: '#3a0604', 'stroke-width': 1 }, this.eyes);
        el('circle', { cx: ex - r * 0.3, cy: ey - r * 0.3, r: r * 0.3, fill: '#fff2c0' }, this.eyes);
      }
      this.state = 'hidden'; this.t = 0;
    }
    peek(x, y, fromX, fromY, onArrive) {
      if (this.state !== 'hidden') return false;
      Object.assign(this, { state: 'in', t: 0, to: [x, y], from: [fromX, fromY], onArrive, arrived: false });
      return true;
    }
    update(dt, time) {
      if (this.state === 'hidden') return;
      this.t += dt;
      let k = 0;
      if (this.state === 'in') { k = easeIO(clamp(this.t / 1.6)); if (this.t > 1.6) { this.state = 'hold'; this.t = 0; } }
      else if (this.state === 'hold') {
        k = 1;
        if (!this.arrived && this.t > 0.2) { this.arrived = true; if (this.onArrive) this.onArrive(); }
        if (this.t > 3) { this.state = 'out'; this.t = 0; }
      } else {
        k = 1 - easeIO(clamp(this.t / 0.7));
        if (this.t > 0.7) { this.state = 'hidden'; this.g.setAttribute('opacity', 0); return; }
      }
      const f = Math.floor(time * 24);
      if (f === this.frame) return;
      this.frame = f;
      const bx = lerp(this.from[0], this.to[0], k) + Math.sin(time * 1.3) * 3, by = lerp(this.from[1], this.to[1], k) + Math.sin(time * 5) * 2;
      this.g.setAttribute('opacity', 1);
      this.strandO.setAttribute('d', `M${R(bx)},0 L${R(bx)},${R(by - 24)}`);
      this.strand.setAttribute('d', `M${R(bx)},0 L${R(bx)},${R(by - 24)}`);
      this.body.setAttribute('transform', `translate(${R(bx)},${R(by)}) rotate(${R(Math.sin(time * 2) * 6)})`);
      const creep = this.state === 'hold' ? 1 : 0.4;
      for (const L of this.legs) {
        const s = L.side, base = -0.9 + L.k * 0.55;
        const wig = Math.sin(time * 9 + L.ph) * 0.18 * creep;
        const hx = bx + s * 20 * Math.cos(base), hy = by + 20 * Math.sin(base);
        const kx = hx + s * 34 * Math.cos(base - 0.5 + wig), ky = hy + 34 * Math.sin(base - 0.5 + wig) - 16;
        const fx = kx + s * 22 * Math.cos(base + 0.9 - wig), fy = ky + 30 * Math.sin(base + 0.9 - wig) + 18;
        const d = `M${R(hx)},${R(hy)} L${R(kx)},${R(ky)} L${R(fx)},${R(fy)}`;
        L.o.setAttribute('d', d); L.c.setAttribute('d', d);
        L.tie.setAttribute('transform', `translate(${R(kx - 2.5)},${R(ky - 4.5)}) rotate(${R(Math.atan2(ky - hy, kx - hx) * 57.3 + 90)} 2.5 4.5)`);
        L.tip.setAttribute('d', `M${R(fx)},${R(fy)} l${R(s * 4)},5 M${R(fx)},${R(fy)} l0,6 M${R(fx)},${R(fy)} l${R(-s * 3)},5`);
      }
      this.eyes.setAttribute('opacity', f % 53 < 2 ? 0.2 : 1);
      this.glow.setAttribute('opacity', R((0.6 + 0.4 * Math.sin(time * 6)) * 100) / 100);
    }
  }

  /* ---------- the gremlin (a living short circuit) ---------- */
  class Gremlin {
    constructor(parent) {
      this.g = el('g', { class: 'gremlin' }, parent);
      this.body = el('g', {}, this.g);
      el('path', { d: 'M-50,40 C-62,-10 -48,-62 -8,-70 C-2,-92 -14,-112 -30,-122 C-6,-118 10,-96 8,-72 C30,-74 44,-96 40,-120 C58,-100 54,-70 38,-58 C60,-38 62,10 50,40 C40,70 18,90 0,120 C-12,90 -40,72 -50,40 Z', fill: '#0e080c', stroke: '#2a1622', 'stroke-width': 3 }, this.body);
      this.eyeGlow = el('g', { filter: 'url(#softBlur)', opacity: 0.8 }, this.body);
      el('ellipse', { cx: -18, cy: -30, rx: 16, ry: 12, fill: '#ffcc2a' }, this.eyeGlow);
      el('ellipse', { cx: 20, cy: -32, rx: 16, ry: 12, fill: '#ffcc2a' }, this.eyeGlow);
      this.eyes = el('g', {}, this.body);
      for (const [ex, ey, rot] of [[-18, -30, 12], [20, -32, -12]]) {
        const e = el('g', { transform: `translate(${ex},${ey}) rotate(${rot})` }, this.eyes);
        el('path', { d: 'M-15,2 Q0,-14 15,2 Q0,10 -15,2 Z', fill: '#ffe45a', stroke: '#fff6b0', 'stroke-width': 1.5 }, e);
        el('ellipse', { cx: rot > 0 ? 3 : -3, cy: 1, rx: 2.6, ry: 6.5, fill: '#b01010' }, e);
      }
      this.grin = el('path', { d: 'M-30,4 Q2,34 34,2 Q2,20 -30,4 Z', fill: '#ffe9b0', stroke: '#fff4d0', 'stroke-width': 1 }, this.body);
      this.teeth = el('path', { d: 'M-22,10 l4,6 l3,-5 l4,7 l3,-6 l4,7 l3,-6 l4,6 l3,-6 l4,5', fill: 'none', stroke: '#0e080c', 'stroke-width': 2.2 }, this.body);
      this.hands = el('g', {}, this.g);
      for (const s of [-1, 1]) el('path', { d: 'M0,0 c-6,-10 -2,-22 6,-26 c-2,8 2,12 6,14 c0,-8 4,-14 10,-16 c-2,8 0,14 4,16 c2,-6 8,-10 12,-10 c-4,8 -2,16 -6,22 Z', fill: '#0e080c', transform: `translate(${s * 34},${60}) scale(${s},1)` }, this.hands);
      this.state = 'hidden'; this.t = 0;
      this.g.setAttribute('opacity', 0);
    }
    peek(x, y, fromX, fromY, onGiggle) {
      if (this.state !== 'hidden') return false;
      this.state = 'in'; this.t = 0; this.to = [x, y]; this.from = [fromX, fromY]; this.onGiggle = onGiggle; this.giggled = false;
      return true;
    }
    update(dt, time) {
      if (this.state === 'hidden') return;
      this.t += dt;
      let k = 0;
      if (this.state === 'in') { k = easeIO(clamp(this.t / 0.9)); if (this.t > 0.9) { this.state = 'hold'; this.t = 0; } }
      else if (this.state === 'hold') {
        k = 1;
        if (this.t > 0.5 && !this.giggled) { this.giggled = true; if (this.onGiggle) this.onGiggle(); }
        if (this.t > 2.4) { this.state = 'out'; this.t = 0; }
      } else if (this.state === 'out') {
        k = 1 - easeIO(clamp(this.t / 0.35));
        if (this.t > 0.35) { this.state = 'hidden'; this.g.setAttribute('opacity', 0); return; }
      }
      const f = Math.floor(time * 24);
      const bob = this.state === 'hold' && this.giggled ? Math.abs(Math.sin(time * 18)) * -6 : 0;
      this.g.setAttribute('opacity', 1);
      this.g.setAttribute('transform', `translate(${R(lerp(this.from[0], this.to[0], k))},${R(lerp(this.from[1], this.to[1], k) + bob)})`);
      this.eyes.setAttribute('transform', `scale(1,${f % 70 < 3 ? 0.1 : 1})`);
      this.eyeGlow.setAttribute('opacity', R((0.55 + 0.35 * Math.sin(time * 7)) * 100) / 100);
      const wide = this.giggled ? 1.25 : 1;
      this.grin.setAttribute('transform', `scale(${wide})`);
      this.teeth.setAttribute('transform', `scale(${wide})`);
    }
  }

  window.Toons = { sampleKeys, el, sa, installDefs, Toon, makeBulb, makeOutlet, makeSwitch, makeFuse, makeMeter, makeBoard, makeWire, makeEvilWire, makeJunction, WireSpider, Gremlin, INK, CREAM, clamp, lerp, rand, pick, R, easeIO, noise, hexLerp };
})();
