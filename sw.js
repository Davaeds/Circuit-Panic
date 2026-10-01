/* Circuit Panic! — offline support. Precaches the whole game so it plays with no
   connection; fonts are cached the first time they load. Bump VERSION to roll
   out an update. */
const VERSION = 'cp-v18';
const CORE = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/toon.js', 'js/audio.js', 'js/fx.js', 'js/gfx.js', 'js/circuit.js', 'js/app.js', 'js/menu.js', 'js/level.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !isFont) return;
  /* the showcase gallery (playable snapshot copies) is never cached or served from here */
  if (url.origin === location.origin && url.pathname.includes('/showcase/')) return;
  /* cache first, then refresh the cached copy in the background */
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: url.origin === location.origin });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
