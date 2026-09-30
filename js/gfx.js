/* Circuit Panic! — the GPU pass. The art stays code-drawn SVG; this one small
   WebGL layer sits over the stage with mix-blend-mode: hard-light (50% grey
   changes nothing, darker multiplies, lighter screens) and does the lighting a
   camera would see: real falloff from the shop lamps and a lit bulb, bloom where
   light runs past white, flashes from sparks and arcs that light whatever is near
   them, soft contact shadows, a vignette, a warm grade and fine film grain. It
   also paints, once, a watercolour paper texture for the backgrounds.
   Screens describe their light (in stage units) 24 times a second; the pass is
   drawn 24 times a second too. Quality: High / Low / Off (Auto picks Low on weak
   phones and drops to Low if a phone can't keep up). With no WebGL, or Off, the
   old CSS film layers carry on exactly as before. */
(function () {
  'use strict';
  const NSVG = 'http://www.w3.org/2000/svg';
  const TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  const WEAK = TOUCH && ((navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 3);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };

  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const HEAD = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
`;
  /* the light pass. Each light: position and radii in stage px, colour with its
     intensity folded in, and a kind (<0 a glow with a hot core, 0 a broad pool,
     1..4 a spot cone using uD[kind-1] = direction, cos inner, cos outer) */
  const LIGHT = `
uniform vec4 uP[NL];
uniform vec4 uC[NL];
uniform vec4 uD[4];
uniform vec4 uS[NS];
uniform int uN;
uniform int uNS;
uniform vec3 uAmb;
uniform vec3 uGrade;
uniform float uGrain;
uniform float uVig;
uniform float uSeed;
uniform float uBloom;
void main(){
  vec2 P = vec2(v.x * 1280.0, (1.0 - v.y) * 720.0);
  vec3 e = uAmb;
  for (int i = 0; i < NL; i++) {
    if (i >= uN) break;
    vec4 p = uP[i];
    vec4 c = uC[i];
    vec2 r = P - p.xy;
    float s = 1.0 - smoothstep(0.0, 1.0, length(r / p.zw));
    float f = c.a < 0.0 ? s * s * s : s;
    if (c.a > 0.5) {
      vec4 k = c.a < 1.5 ? uD[0] : c.a < 2.5 ? uD[1] : c.a < 3.5 ? uD[2] : uD[3];
      float along = dot(r, k.xy);
      f *= smoothstep(k.w, k.z, along / max(length(r), 0.001)) * smoothstep(0.07, 0.12, along / p.z);
    }
    e += c.rgb * f;
  }
  float sh = 1.0;
  for (int i = 0; i < NS; i++) {
    if (i >= uNS) break;
    vec4 o = uS[i];
    float q = length((P - o.xy) / vec2(o.z, o.z * 0.3));
    sh *= 1.0 - o.w * (1.0 - smoothstep(0.0, 1.0, q));
  }
  e *= sh;
  vec2 c = (v - 0.5) * vec2(1.0, 1.1);
  e *= 1.0 - uVig * smoothstep(0.3, 0.8, length(c));
  e *= uGrade;
  e *= 1.0 + (hash(floor(gl_FragCoord.xy) + uSeed) - 0.5) * uGrain;
  vec3 lo = e * 0.5;
  vec3 hi = 0.5 + 0.5 * min(vec3(1.0), (e - 1.0) * uBloom);
  gl_FragColor = vec4(mix(lo, hi, step(1.0, e)), 1.0);
}`;
  /* watercolour paper, painted once: a warped wash with pigment pooled at its
     edges (the dark "backrun" rims), granulation and a little paper fibre. It is
     drawn as brown or cream at a low alpha, so plain "over" blending darkens the
     pooled pigment and lifts the bare paper. */
  const PAPER = `
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return s;}
void main(){
  vec2 p = v * vec2(5.2, 2.9);
  float w = fbm(p + 1.4 * vec2(fbm(p * 0.8 + 3.0), fbm(p * 0.8 + 11.0)));
  float rim = 1.0 - smoothstep(0.0, 0.03, abs(w - 0.55));
  float rim2 = 1.0 - smoothstep(0.0, 0.022, abs(w - 0.40));
  float g = fbm(v * vec2(380.0, 214.0)) - 0.5;
  float fib = vn(v * vec2(1300.0, 70.0)) - 0.5;
  float dk = smoothstep(0.45, 0.78, w) * 0.15 + rim * 0.09 + rim2 * 0.05 + max(g, 0.0) * 0.16 + max(fib, 0.0) * 0.035;
  float lt = smoothstep(0.42, 0.2, w) * 0.09 + max(-g, 0.0) * 0.07;
  dk = clamp(dk, 0.0, 0.3); lt = clamp(lt, 0.0, 0.15);
  gl_FragColor = vec4(vec3(0.2, 0.1, 0.04) * dk + vec3(1.0, 0.94, 0.8) * lt, dk + lt);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
    return s;
  }
  function program(gl, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'a');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
    return p;
  }
  const strength = l => Math.max(l[4], l[5], l[6]) * Math.sqrt(l[2] * l[3]);

  const GFX = {
    ok: false, on: false, q: 'off', want: 'auto', film: true, touch: TOUCH,
    NL: 12, NS: 8, L: [], S: [], D: [], F: [], amb: [1, 1, 1], grade: [1, 0.965, 0.9], vig: 0.42,
    k: 1, ox: 0, oy: 0, papers: [], paperURL: null, last: -1, ema: 0, slow: 0, tPrev: 0,
    autoLow: store.get('circuitPanic.gfxAutoLow') === '1',

    init(frame, want, film) {
      this.frame = frame; this.film = film !== false;
      let cv = document.getElementById('gfx');
      if (!cv) { cv = document.createElement('canvas'); cv.id = 'gfx'; cv.setAttribute('aria-hidden', 'true'); frame.insertBefore(cv, document.getElementById('stage').nextSibling); }
      this.cv = cv;
      try {
        const opt = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
        this.gl = cv.getContext('webgl', opt) || cv.getContext('experimental-webgl', opt);
        if (this.gl) { this.build(); this.ok = true; }
      } catch (e) { this.ok = false; this.gl = null; }
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; this.apply(); });
      cv.addEventListener('webglcontextrestored', () => { try { this.build(); this.ok = true; } catch (e) { this.ok = false; } this.apply(); });
      if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(frame);
      else window.addEventListener('resize', () => this.resize());
      this.setQuality(want || 'auto');
    },
    build() {
      const gl = this.gl;
      const mv = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 64;
      this.NL = mv >= 200 ? 24 : 12; this.NS = mv >= 200 ? 12 : 8;
      this.prog = program(gl, `#define NL ${this.NL}\n#define NS ${this.NS}\n` + HEAD + LIGHT);
      this.u = {};
      for (const n of ['uP', 'uC', 'uD', 'uS', 'uN', 'uNS', 'uAmb', 'uGrade', 'uGrain', 'uVig', 'uSeed', 'uBloom']) this.u[n] = gl.getUniformLocation(this.prog, n);
      this.bP = new Float32Array(this.NL * 4); this.bC = new Float32Array(this.NL * 4);
      this.bD = new Float32Array(16); this.bS = new Float32Array(this.NS * 4);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.disable(gl.BLEND);
      this.last = -1;
    },

    /* ---------- quality ---------- */
    resolve(want) { return !this.ok ? 'off' : want === 'auto' ? (WEAK || this.autoLow ? 'low' : 'high') : want; },
    setQuality(want) { this.want = want || 'auto'; this.apply(); },
    setFilm(on) { this.film = on !== false; this.apply(); },
    apply() {
      const q = this.resolve(this.want);
      this.q = q; this.on = q !== 'off';
      document.documentElement.classList.toggle('gfx', this.on);
      if (this.cv) this.cv.style.display = this.on ? '' : 'none';
      for (const im of this.papers) im.style.display = this.on ? '' : 'none';
      /* High draws the grain on the GPU; Low and Off keep the old grain canvas */
      if (window.FX && FX.Film) FX.Film.grain = !(this.on && q === 'high');
      this.boilFps = q === 'high' ? 24 : 12;
      if (this.on) { this.resize(); if (!this.paperURL) this.makePaper(); }
      this.last = -1;
    },
    resize() {
      if (!this.on || !this.cv) return;
      const b = this.frame.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const s = this.q === 'high' ? (TOUCH ? 1 : Math.min(dpr, 1.5)) : 0.5;
      const w = Math.max(16, Math.round(Math.min(b.width * s, this.q === 'high' ? 2400 : 900))), h = Math.max(9, Math.round((w * 9) / 16));
      if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
      this.last = -1;
    },
    makePaper() {
      const gl = this.gl, cv = this.cv, pw = 1024, ph = 576, ow = cv.width, oh = cv.height;
      try {
        cv.width = pw; cv.height = ph;
        gl.viewport(0, 0, pw, ph);
        const prog = program(gl, HEAD + PAPER);
        gl.useProgram(prog);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const c2 = document.createElement('canvas');
        c2.width = pw; c2.height = ph;
        c2.getContext('2d').drawImage(cv, 0, 0);
        gl.deleteProgram(prog);
        this.paperURL = 'pending';
        c2.toBlob(b => {
          if (!b) { this.paperURL = null; return; }
          this.paperURL = URL.createObjectURL(b);
          for (const im of this.papers) im.setAttribute('href', this.paperURL);
          /* the startup title card is painted on the same paper */
          document.documentElement.style.setProperty('--paperTex', `url(${this.paperURL})`);
        }, 'image/png');
      } catch (e) { this.paperURL = null; }
      cv.width = ow; cv.height = oh; this.last = -1;
    },

    /* ---------- what the screens say about their light ---------- */
    clear() { this.L.length = 0; this.S.length = 0; this.D.length = 0; this.k = 1; this.ox = 0; this.oy = 0; },
    /* a screen with a camera (Level 2 is pulled back) gives its world scale */
    view(k, ox = 0, oy = 0) { this.k = k; this.ox = ox; this.oy = oy; },
    ambient(c) { this.amb = c; },
    light(x, y, rx, ry, c, kind = 0) {
      if (Math.max(c[0], c[1], c[2]) < 0.004) return;
      this.L.push([x * this.k + this.ox, y * this.k + this.oy, rx * this.k, ry * this.k, c[0], c[1], c[2], kind]);
    },
    glow(x, y, r, c, k) { if (k > 0.004) this.light(x, y, r, r, [c[0] * k, c[1] * k, c[2] * k], -1); },
    /* a spot: apex, reach, colour, unit direction, cos of the inner and outer edge */
    cone(x, y, r, c, dir, cin, cout) {
      if (this.D.length >= 4) return this.light(x, y, r, r, c, 0);
      this.D.push([dir[0], dir[1], cin, cout]);
      this.light(x, y, r, r, c, this.D.length);
    },
    shadow(x, y, rx, k) { if (k > 0.01) this.S.push([x * this.k + this.ox, y * this.k + this.oy, rx * this.k, Math.min(0.9, k)]); },
    /* a soft contact shadow under a rig; it leans away from the key light at lx */
    shadowOf(t, k = 0.4, lx = null) {
      const c = t.cfg, cur = t.cur || { hx: 0 };
      if (!c || (t.root && t.root.style.display === 'none')) return;
      const air = c.shadowFixed ? 0 : Math.max(0, Math.min(1, -((t.p && t.p.hipY) || 0) / 120));
      const rx = (c.shadowW == null ? 70 : c.shadowW) * c.scale * 1.45 * (1 - air * 0.3);
      let x = c.x + (c.shadowFixed ? 0 : cur.hx * 0.6) * c.scale;
      if (lx != null) x += Math.max(-1, Math.min(1, (x - lx) / 520)) * rx * 0.28;
      this.shadow(x, c.y + 4 * c.scale, rx, k * (1 - air * 0.7));
    },
    /* a short burst of light (a spark, an arc) in stage px */
    flash(x, y, o = {}) {
      if (!this.on) return;
      if (this.F.length > 7) this.F.shift();
      this.F.push({ x, y, r: o.r || 200, c: o.c || [1, 0.75, 0.35], k: o.k == null ? 1 : o.k, life: o.life || 0.3, flicker: !!o.flicker, t0: performance.now() / 1000 });
    },
    /* ...given in the coordinates of an SVG layer (cameras and shakes included) */
    flashAt(layer, x, y, o) {
      if (!this.on) return;
      try {
        const svg = layer.ownerSVGElement, a = layer.getScreenCTM(), b = svg && svg.getScreenCTM();
        if (a && b) { const m = b.inverse().multiply(a); const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f; x = X; y = Y; }
      } catch (e) { /* fall back to the raw point */ }
      this.flash(x, y, o);
    },
    /* the background's painted paper: an <image> laid over a static layer */
    paper(parent, x, y, w, h, o = {}) {
      const im = document.createElementNS(NSVG, 'image');
      for (const [k, v] of Object.entries({ x, y, width: w, height: h, preserveAspectRatio: 'none', 'pointer-events': 'none', opacity: o.opacity == null ? 1 : o.opacity })) im.setAttribute(k, v);
      if (o.flip) im.setAttribute('transform', `translate(${2 * x + w},0) scale(-1,1)`);
      if (this.paperURL && this.paperURL !== 'pending') im.setAttribute('href', this.paperURL);
      im.style.display = this.on ? '' : 'none';
      parent.appendChild(im);
      this.papers.push(im);
      return im;
    },

    /* ---------- the draw, 24 times a second ---------- */
    render(t) {
      /* phones on Auto that can't hold ~40 fps drop to Low (and remember it) */
      const dt = this.tPrev ? t - this.tPrev : 0;
      this.tPrev = t;
      if (dt > 0 && dt < 0.25) this.ema += (dt - this.ema) * 0.05;
      if (TOUCH && this.want === 'auto' && this.q === 'high' && dt > 0 && dt < 0.25) {
        this.slow = this.ema > 1 / 40 ? this.slow + dt : 0;
        if (this.slow > 4) { this.autoLow = true; store.set('circuitPanic.gfxAutoLow', '1'); this.apply(); if (this.onAuto) this.onAuto(); }
      }
      if (!this.on || !this.ok) return;
      const f = Math.floor(t * 24);
      if (f === this.last) return;
      this.last = f;
      const gl = this.gl, u = this.u;
      const list = this.L.slice();
      this.F = this.F.filter(fl => t - fl.t0 < fl.life);
      for (const fl of this.F) {
        const w = 1 - (t - fl.t0) / fl.life;
        const k = fl.k * w * w * (fl.flicker && Math.random() < 0.5 ? 0.45 : 1);
        list.push([fl.x, fl.y, fl.r, fl.r, fl.c[0] * k, fl.c[1] * k, fl.c[2] * k, 0]);
      }
      if (list.length > this.NL) { list.sort((a, b) => strength(b) - strength(a)); list.length = this.NL; }
      const P = this.bP, C = this.bC;
      list.forEach((l, i) => { P.set([l[0], l[1], Math.max(1, l[2]), Math.max(1, l[3])], i * 4); C.set([l[4], l[5], l[6], l[7]], i * 4); });
      this.D.forEach((d, i) => this.bD.set(d, i * 4));
      const S = this.S.slice(0, this.NS);
      S.forEach((s, i) => this.bS.set(s, i * 4));
      gl.viewport(0, 0, this.cv.width, this.cv.height);
      gl.useProgram(this.prog);
      gl.uniform4fv(u.uP, P); gl.uniform4fv(u.uC, C); gl.uniform4fv(u.uD, this.bD); gl.uniform4fv(u.uS, this.bS);
      gl.uniform1i(u.uN, list.length); gl.uniform1i(u.uNS, S.length);
      gl.uniform3fv(u.uAmb, this.amb); gl.uniform3fv(u.uGrade, this.grade);
      gl.uniform1f(u.uGrain, this.film && this.q === 'high' ? (TOUCH ? 0.06 : 0.075) : 0);
      gl.uniform1f(u.uVig, this.vig); gl.uniform1f(u.uSeed, (f % 89) * 7.31); gl.uniform1f(u.uBloom, 0.85);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
  window.GFX = GFX;
})();
