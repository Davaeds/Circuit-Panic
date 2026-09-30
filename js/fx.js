/* Circuit Panic! — effects: SVG particles (sparks, bolts, smoke), the old-film
   overlay (grain, dust, hairs, scratches, flicker) and the iris wipe. */
(function () {
  'use strict';
  const { el, sa, R, rand, pick, INK } = window.Toons;

  const star = s => `M0,${-s} L${s * 0.28},${-s * 0.28} L${s},0 L${s * 0.28},${s * 0.28} L0,${s} L${-s * 0.28},${s * 0.28} L${-s},0 L${-s * 0.28},${-s * 0.28} Z`;

  class Particles {
    constructor(layer) { this.layer = layer; this.list = []; }
    spark(x, y, n = 10, power = 1) {
      /* real light: a spray of sparks flashes orange onto whatever is near */
      if (window.GFX && GFX.on) GFX.flashAt(this.layer, x, y, { r: 140 + 90 * power, c: [1, 0.7, 0.3], k: Math.min(1.4, 0.35 + n * 0.05) * power, life: 0.3 });
      for (let i = 0; i < n; i++) {
        const e = el('path', { d: star(rand(5, 10)), fill: '#fff6b8', stroke: '#ff9b1a', 'stroke-width': 2 }, this.layer);
        const a = rand(-Math.PI, 0.3), sp = rand(150, 420) * power;
        this.list.push({ e, kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 900, life: rand(0.25, 0.65), t: 0, r: rand(0, 90), vr: rand(-720, 720) });
      }
    }
    bolt(x1, y1, x2, y2) {
      const n = 7; let d = `M${R(x1)},${R(y1)}`;
      for (let i = 1; i < n; i++) {
        const k = i / n;
        d += ` L${R(x1 + (x2 - x1) * k + rand(-16, 16))},${R(y1 + (y2 - y1) * k + rand(-16, 16))}`;
      }
      d += ` L${R(x2)},${R(y2)}`;
      /* an arc throws hard blue-white light, flickering, for a blink */
      if (window.GFX && GFX.on) GFX.flashAt(this.layer, (x1 + x2) / 2, (y1 + y2) / 2, { r: Math.max(170, Math.hypot(x2 - x1, y2 - y1) * 0.9), c: [0.8, 0.88, 1], k: 1.25, life: 0.16, flicker: true });
      const g = el('g', {}, this.layer);
      el('path', { d, fill: 'none', stroke: '#ffd23a', 'stroke-width': 12, opacity: 0.45, 'stroke-linejoin': 'round', filter: 'url(#softBlur)' }, g);
      el('path', { d, fill: 'none', stroke: '#fffbe6', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, g);
      this.list.push({ e: g, kind: 'bolt', life: 0.14, t: 0 });
    }
    /* inked cartoon puffs: a three-lobed cloud with a single outline */
    smoke(x, y, n = 4, s = 1, drift = 0) {
      for (let i = 0; i < n; i++) {
        const e = el('path', { d: 'M-12,6 C-21,6 -21,-6 -12,-6 C-12,-17 3,-19 5,-10 C11,-19 24,-10 17,-2 C25,3 18,13 10,10 C6,17 -8,15 -12,6 Z', fill: '#e9e0d0', stroke: INK, 'stroke-width': 2.4, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }, this.layer);
        this.list.push({ e, kind: 'smoke', x: x + rand(-8, 8) * s, y: y + rand(-6, 6) * s, vx: (rand(-18, 18) + drift) * s, vy: rand(-70, -35) * s, life: rand(0.9, 1.5), t: 0, r0: rand(0.45, 0.65) * s, r1: rand(1.2, 1.7) * s, rot: rand(-20, 20) });
      }
    }
    /* glass shards; given a floor, they fall to it, bounce, skid and lie there
       a moment, each landing with a tiny impact star */
    shards(x, y, n = 14, floor = null) {
      for (let i = 0; i < n; i++) {
        const s = rand(6, 14);
        const e = el('path', { d: `M0,${-s} L${s * 0.7},${s * 0.5} L${-s * 0.6},${s * 0.4} Z`, fill: '#f4f1e6', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, this.layer);
        const a = rand(-Math.PI, 0), sp = rand(220, 520);
        this.list.push({ e, kind: floor == null ? 'spark' : 'shard', floor, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 1100, life: floor == null ? rand(0.8, 1.3) : rand(2.2, 3), t: 0, r: rand(0, 360), vr: rand(-900, 900), hits: 0 });
      }
    }
    /* plaster crumbs knocked off a hole's edge: little chunks that drop and bounce */
    crumbs(x, y, n = 6, floor = 594) {
      for (let i = 0; i < n; i++) {
        const s = rand(2.5, 5);
        const e = el('path', { d: `M${-s},0 L${-s * 0.2},${-s} L${s},${-s * 0.3} L${s * 0.5},${s * 0.7} Z`, fill: '#c9b28c', stroke: '#3a2414', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, this.layer);
        this.list.push({ e, kind: 'shard', floor, x: x + rand(-14, 14), y, vx: rand(-60, 60), vy: rand(-80, 20), g: 1200, life: rand(1.2, 1.8), t: 0, r: rand(0, 360), vr: rand(-400, 400), hits: 1 });
      }
    }
    confetti(x, y, n = 40) {
      const cols = ['#ffd84a', '#e5352b', '#fbf4e2', '#3f9a5e', '#2f62b8'];
      for (let i = 0; i < n; i++) {
        const e = el('rect', { x: -5, y: -3, width: 10, height: 6, fill: pick(cols), stroke: INK, 'stroke-width': 1.2 }, this.layer);
        const a = rand(-Math.PI * 0.9, -Math.PI * 0.1), sp = rand(300, 700);
        this.list.push({ e, kind: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 700, life: rand(1.4, 2.4), t: 0, r: rand(0, 360), vr: rand(-720, 720) });
      }
    }
    /* a cartoon impact: an inked star burst that pops and fades where two things touch */
    bonk(x, y, s = 1) {
      let d = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, r = i % 2 ? 6 : 15;
        d += (i ? 'L' : 'M') + R(Math.cos(a) * r) + ',' + R(Math.sin(a) * r);
      }
      const e = el('path', { d: d + 'Z', fill: '#fff4c8', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, this.layer);
      this.list.push({ e, kind: 'bonk', x, y, s, life: 0.32, t: 0, rot: rand(0, 45) });
    }
    clear() { this.list.forEach(p => p.e.remove()); this.list = []; }
    update(dt) {
      /* particles spawned while updating (a shard's landing star) join next frame */
      const cur = this.list;
      this.list = [];
      const born = this.list;
      this.list = cur.filter(p => {
        p.t += dt;
        const u = p.t / p.life;
        if (u >= 1) { p.e.remove(); return false; }
        if (p.kind === 'spark') {
          p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          sa(p.e, { transform: `translate(${R(p.x)},${R(p.y)}) rotate(${R(p.r)}) scale(${R((1 - u) * 100) / 100})` });
        } else if (p.kind === 'shard') {
          p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
          if (p.y > p.floor) {
            p.y = p.floor;
            if (p.vy > 90) { if (!p.hits++) this.bonk(p.x, p.floor - 3, 0.3); p.vy *= -0.3; p.vx *= 0.55; p.vr *= 0.4; }
            else { p.vy = 0; p.vx *= 0.8; p.vr *= 0.7; }
          }
          sa(p.e, { transform: `translate(${R(p.x)},${R(p.y)}) rotate(${R(p.r)}) scale(${R(Math.min(1, (1 - u) * 4) * 100) / 100})` });
        } else if (p.kind === 'smoke') {
          p.x += p.vx * dt; p.y += p.vy * dt;
          sa(p.e, { transform: `translate(${R(p.x)},${R(p.y)}) rotate(${R(p.rot + u * 30)}) scale(${R((p.r0 + (p.r1 - p.r0) * u) * 100) / 100})`, opacity: R((1 - u * u) * 90) / 100 });
        } else if (p.kind === 'bonk') {
          const k = p.s * (0.5 + Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * 0.9);
          sa(p.e, { transform: `translate(${R(p.x)},${R(p.y)}) rotate(${R(p.rot)}) scale(${R(k * 100) / 100})`, opacity: R((1 - u * u) * 100) / 100 });
        } else if (p.kind === 'bolt') {
          p.e.setAttribute('opacity', Math.random() < 0.5 ? 1 : 0.4);
        }
        return true;
      }).concat(born);
    }
  }

  const Film = {
    init(canvas, flicker) {
      this.c = canvas; this.fl = flicker;
      canvas.width = 480; canvas.height = 270;
      this.x = canvas.getContext('2d');
      this.tex = [];
      for (let i = 0; i < 4; i++) {
        const cv = document.createElement('canvas');
        cv.width = 240; cv.height = 135;
        const cx = cv.getContext('2d');
        const img = cx.createImageData(240, 135);
        for (let p = 0; p < img.data.length; p += 4) {
          const v = Math.random();
          const light = v > 0.5;
          img.data[p] = img.data[p + 1] = light ? 255 : 20;
          img.data[p + 2] = light ? 235 : 10;
          img.data[p + 3] = Math.random() < 0.5 ? Math.floor(Math.random() * 13) : 0;
        }
        cx.putImageData(img, 0, 0);
        this.tex.push(cv);
      }
      this.last = -1; this.scratch = null; this.enabled = true;
    },
    frame(t) {
      const f = Math.floor(t * 24);
      if (f === this.last) return;
      this.last = f;
      const x = this.x;
      x.clearRect(0, 0, 480, 270);
      if (!this.enabled) { this.fl.style.opacity = 0; return; }
      /* on High the GPU pass draws the grain; the specks, hairs and scratches stay here */
      if (this.grain !== false) x.drawImage(this.tex[f % 4], -rand(0, 20), -rand(0, 12), 520, 292);
      const specks = Math.random() < 0.1 ? 1 : 0;
      for (let i = 0; i < specks; i++) {
        x.fillStyle = Math.random() < 0.7 ? 'rgba(18,10,6,.75)' : 'rgba(255,245,220,.6)';
        x.beginPath();
        x.ellipse(rand(0, 480), rand(0, 270), rand(0.6, 2.4), rand(0.6, 2), rand(0, 3), 0, Math.PI * 2);
        x.fill();
      }
      if (Math.random() < 0.006) {
        x.strokeStyle = 'rgba(18,10,6,.6)'; x.lineWidth = 0.8;
        const hx = rand(20, 460), hy = rand(20, 250);
        x.beginPath(); x.moveTo(hx, hy);
        x.bezierCurveTo(hx + rand(-30, 30), hy + rand(-20, 20), hx + rand(-30, 30), hy + rand(-20, 20), hx + rand(-40, 40), hy + rand(-30, 30));
        x.stroke();
      }
      if (!this.scratch && Math.random() < 0.003) this.scratch = { x: rand(30, 450), n: Math.floor(rand(8, 30)) };
      if (this.scratch) {
        this.scratch.x += rand(-1.5, 1.5);
        x.strokeStyle = 'rgba(255,244,215,.14)'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(this.scratch.x, 0); x.lineTo(this.scratch.x + rand(-2, 2), 270); x.stroke();
        if (--this.scratch.n <= 0) this.scratch = null;
      }
      this.fl.style.opacity = (Math.random() * 0.018).toFixed(3);
    },
  };

  /* Iris: a black mask with a round hole. r is in px of the frame. */
  const Iris = {
    init(node, frame) { this.n = node; this.frame = frame; this.set(0, 0.5, 0.5); },
    max() { const b = this.frame.getBoundingClientRect(); return Math.hypot(b.width, b.height); },
    set(r, cx, cy) {
      this.r = r;
      if (cx != null) { this.n.style.setProperty('--cx', cx * 100 + '%'); this.n.style.setProperty('--cy', cy * 100 + '%'); }
      this.n.style.setProperty('--r', Math.max(0, r) + 'px');
      this.n.style.display = r >= this.max() ? 'none' : 'block';
    },
    run(to, dur, cx, cy) {
      const from = this.r >= 9999 ? this.max() : this.r;
      if (cx != null) this.set(from, cx, cy);
      const target = to === 'open' ? this.max() + 4 : to === 'closed' ? 0 : to;
      return new Promise(res => {
        const t0 = performance.now();
        const step = now => {
          const u = Math.min(1, (now - t0) / (dur * 1000));
          const k = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          this.set(from + (target - from) * k);
          if (u < 1) requestAnimationFrame(step); else { if (to === 'open') this.r = 99999; res(); }
        };
        requestAnimationFrame(step);
      });
    },
  };

  window.FX = { Particles, Film, Iris };
})();
