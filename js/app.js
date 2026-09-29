/* Circuit Panic! — app shell: shared stage, settings, intro, screen switching
   (with an iris wipe) and the one animation loop that drives everything. */
(function () {
  'use strict';
  const T = window.Toons, A = window.AudioSys, { Film, Iris } = window.FX;

  const svg = document.getElementById('stage');
  const frame = document.getElementById('frame');
  const defs = T.installDefs(svg);

  /* phones and tablets: bigger targets, no hover dependence, and no page
     scrolling, rubber-banding or pinch/double-tap zoom while you play */
  const TOUCH = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
  document.documentElement.classList.toggle('touch', TOUCH);
  if (TOUCH) {
    const begin = document.querySelector('.intro-card .begin');
    if (begin) begin.textContent = 'Tap to begin';
    document.getElementById('intro').setAttribute('aria-label', 'Tap to begin');
  }
  const stop = e => { if (e.touches && e.touches.length > 1) e.preventDefault(); };
  document.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('.card')) e.preventDefault(); }, { passive: false });
  document.addEventListener('touchstart', stop, { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  /* installable, offline-capable web app: only where a service worker can work
     (https or localhost), and never inside an embedded preview sandbox */
  const swOK = 'serviceWorker' in navigator && window.isSecureContext && window.top === window.self && /^https?:$/.test(location.protocol);
  if (swOK) {
    window.addEventListener('load', () => {
      /* only if the worker file is actually deployed next to the page */
      fetch('sw.js', { method: 'HEAD', cache: 'no-store' }).then(r => (r.ok ? navigator.serviceWorker.register('sw.js') : Promise.reject(new Error('no sw')))).then(reg => {
        /* a new version waits until the next launch, unless the player says reload */
        reg.addEventListener('updatefound', () => {
          const w = reg.installing;
          if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              const n = document.createElement('button');
              n.type = 'button'; n.id = 'updateNote'; n.textContent = 'New version ready: tap to reload';
              n.addEventListener('click', () => { w.postMessage('skipWaiting'); });
              document.getElementById('frame').appendChild(n);
            }
          });
        });
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded && document.getElementById('updateNote')) { reloaded = true; location.reload(); } });
      }).catch(() => { /* offline support is a bonus, never a requirement */ });
    });
  }

  const App = {
    svg, defs, frame, screens: {}, current: null, running: false, busy: false,
    prefs: null,
    register(name, screen) { this.screens[name] = screen; },
    toScene(ev) {
      const m = svg.getScreenCTM();
      if (!m) return [640, 360];
      const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      const p = pt.matrixTransform(m.inverse());
      return [p.x, p.y];
    },
    async go(name, opts = {}) {
      if (this.busy) return;
      this.busy = true;
      const [cx, cy] = opts.from || [640, 360];
      A.sfx.slide(false);
      await Iris.run('closed', 0.7, cx / 1280, cy / 720);
      if (this.current) this.screens[this.current].exit();
      this.current = name;
      this.screens[name].enter(opts);
      await new Promise(r => setTimeout(r, 250));
      A.sfx.slide(true);
      await Iris.run('open', 0.8, 0.5, 0.5);
      this.busy = false;
      if (this.screens[name].shown) this.screens[name].shown();
    },
    wait: s => new Promise(r => setTimeout(r, s * 1000)),
  };
  window.App = App;

  /* ---------- cards (paper sheets over the scene) ---------- */
  let openCard = null, cardReturn = null;
  App.showCard = function (id, onClose) {
    if (openCard) openCard.hidden = true;
    openCard = document.getElementById(id);
    openCard.hidden = false;
    cardReturn = onClose || null;
    const btn = openCard.querySelector('button, input');
    if (btn) btn.focus();
  };
  App.closeCard = function () {
    if (!openCard) return;
    openCard.hidden = true; openCard = null;
    A.sfx.tick();
    const cb = cardReturn; cardReturn = null;
    if (cb) cb();
  };
  Object.defineProperty(App, 'cardOpen', { get: () => !!openCard });
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => App.closeCard()));

  /* ---------- settings ---------- */
  const ui = {
    music: document.getElementById('musicVol'), sfx: document.getElementById('sfxVol'),
    scares: document.getElementById('scares'), film: document.getElementById('filmFx'),
    musicBtn: document.getElementById('musicToggle'),
  };
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saved = (() => { try { return JSON.parse(localStorage.getItem('circuitPanic.settings') || 'null'); } catch (e) { return null; } })();
  const prefs = Object.assign({ music: 55, sfx: 80, scares: true, film: !reduce, musicOn: true }, saved || {});
  App.prefs = prefs;
  App.boil = prefs.film;
  function applyPrefs() {
    A.settings.music = prefs.musicOn ? prefs.music / 100 : 0;
    A.settings.sfx = prefs.sfx / 100;
    A.settings.scares = prefs.scares;
    A.apply();
    Film.enabled = prefs.film;
    App.boil = prefs.film;
    ui.musicBtn.textContent = prefs.musicOn ? 'Music: on' : 'Music: off';
    ui.musicBtn.setAttribute('aria-pressed', String(prefs.musicOn));
    try { localStorage.setItem('circuitPanic.settings', JSON.stringify(prefs)); } catch (e) { /* storage unavailable */ }
  }
  App.applyPrefs = applyPrefs;
  ui.music.value = prefs.music; ui.sfx.value = prefs.sfx; ui.scares.checked = prefs.scares; ui.film.checked = prefs.film;
  ui.music.addEventListener('input', () => { prefs.music = +ui.music.value; if (prefs.music > 0) prefs.musicOn = true; applyPrefs(); });
  ui.sfx.addEventListener('input', () => { prefs.sfx = +ui.sfx.value; applyPrefs(); });
  ui.sfx.addEventListener('change', () => A.sfx.squeak());
  ui.scares.addEventListener('change', () => { prefs.scares = ui.scares.checked; applyPrefs(); if (prefs.scares) A.sfx.laugh(false); });
  ui.film.addEventListener('change', () => { prefs.film = ui.film.checked; applyPrefs(); });
  ui.musicBtn.addEventListener('click', () => { prefs.musicOn = !prefs.musicOn; applyPrefs(); });
  applyPrefs();

  window.addEventListener('keydown', e => {
    if (openCard && e.key === 'Escape') { App.closeCard(); e.preventDefault(); }
  });

  /* ---------- intro: title card, film-leader countdown, iris open ---------- */
  const intro = document.getElementById('intro');
  const leader = document.getElementById('leader');
  const leaderNum = document.getElementById('leaderNum');
  Film.init(document.getElementById('grain'), document.getElementById('flicker'));
  Iris.init(document.getElementById('iris'), frame);
  let introStarted = false;
  async function begin() {
    if (introStarted) return;
    introStarted = true;
    A.init();
    applyPrefs();
    intro.classList.add('counting');
    /* a real film leader: each number holds for a full second while the sweep
       hand goes round once, with a blip as the number changes */
    for (const n of [3, 2, 1]) {
      leaderNum.textContent = n;
      leader.classList.remove('start');
      A.sfx.tick(); A.sfx.beep();
      const t0 = performance.now();
      await new Promise(res => {
        const step = () => {
          const u = Math.min(1, (performance.now() - t0) / 1000);
          leader.style.setProperty('--a', u * 360 + 'deg');
          if (u < 1) setTimeout(step, 16); else res();
        };
        step();
      });
    }
    leaderNum.textContent = 'START';
    leader.classList.add('start');
    leader.style.setProperty('--a', '0deg');
    A.sfx.select();
    await new Promise(res => setTimeout(res, 380));
    intro.hidden = true;
    A.startMusic();
    App.running = true;
    const s = App.screens[App.current];
    if (s.started) s.started();
    await Iris.run('open', 1.1, 0.5, 0.5);
    if (s.shown) s.shown();
  }
  intro.addEventListener('click', begin);
  intro.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); } });
  window.addEventListener('keydown', e => { if (!introStarted && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); begin(); } });

  /* ---------- the loop ---------- */
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!App.paused) {
      const t = now / 1000;
      if (App.current) App.screens[App.current].update(t, dt);
      Film.frame(t);
    }
    requestAnimationFrame(loop);
  }
  App.start = function (first) {
    App.current = first;
    App.screens[first].enter({});
    requestAnimationFrame(loop);
  };
})();
