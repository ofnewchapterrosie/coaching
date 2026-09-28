const CACHE = 'echelon-plan-v2';
const SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Supabase-Daten und die App-Seite selbst: network-first (immer aktuell wenn online,
// letzter Stand wenn offline). Icons/Manifest: cache-first.
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const networkFirst = url.includes('supabase.co') || e.request.mode === 'navigate' || url.endsWith('index.html');
  if (networkFirst) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
