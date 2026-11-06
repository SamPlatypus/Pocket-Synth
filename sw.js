// Offline support for Pocket Synth Pro.
// Serves the saved copy straight away, then quietly fetches any update for next time.
const CACHE = 'pocket-synth-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const fresh = fetch(req).then(async (res) => {
    if (res && res.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(req, res.clone());
    }
    return res;
  });
  event.waitUntil(fresh.catch(() => {}));
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true }) ||
      (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    if (cached) return cached;
    try { return await fresh; } catch (e) { return Response.error(); }
  })());
});
