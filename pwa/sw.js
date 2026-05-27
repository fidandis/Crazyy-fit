const CACHE = 'crazyy-fit-v60';
const OFFLINE_FALLBACK = './404.html';
const ASSETS = [
  './',
  './index.html',
  './404.html',
  './landing.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon.svg',
  './css/app.css',
  './js/core.js',
  './js/fitness.js',
  './js/coach.js',
  './js/tabata.js',
  './js/clients.js',
  './js/onboarding.js',
  './js/workout.js',
  './js/home.js',
  './js/features.js',
  './js/ai.js',
  './js/macros.js',
  './js/nutrition.js',
  'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap'
];

// Install — cache everything except index.html
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Skip waiting when told to
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Push notifications — show when app is in background
self.addEventListener('push', e => {
  let data = { title: 'CrazyyFit', body: '', url: '/' };
  try { data = Object.assign(data, JSON.parse(e.data?.text() || '{}')); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    './icons/icon-192.png',
      badge:   './icons/icon-192.png',
      tag:     'crazyyfit-push',
      renotify: true,
      data:    { url: data.url },
    })
  );
});

// Tap notification → open / focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes(self.location.origin));
      if (match) return match.focus();
      return clients.openWindow(target);
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Share target: OS hands us files via multipart POST. Stash the first image
  // into the share-cache under a known key, then redirect to the app so it
  // can pick it up after login.
  if (e.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData();
        const files = (fd.getAll('photos') || []).concat(fd.getAll('files') || []);
        const file = files.find(f => f && typeof f === 'object' && f.type && f.type.startsWith('image/'));
        if (file) {
          const cache = await caches.open('share-cache');
          await cache.put('/_shared_photo', new Response(file, { headers: { 'Content-Type': file.type } }));
        }
      } catch (_) {}
      return Response.redirect('./index.html?share=photo', 303);
    })());
    return;
  }

  // Only handle GET requests; let the browser handle POST/PUT directly
  if (e.request.method !== 'GET') return;

  // Always network for API calls
  if (url.hostname === 'api.anthropic.com' || url.hostname.endsWith('.supabase.co')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // Network-first for HTML navigations — always try latest, fall back to cache then offline page.
  // Cache the bare URL (no query string) so transient params like ?share=photo and Apple Shortcut
  // ingestion URLs (?client=&cal=&dur=...) don't pollute the cache.
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    const cacheKey = new Request(url.origin + url.pathname, { method: 'GET' });
    e.respondWith(
      fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(cacheKey, clone));
        return response;
      }).catch(() =>
        caches.match(cacheKey)
          .then(cached => cached || caches.match('./index.html'))
          .then(cached => cached || caches.match(OFFLINE_FALLBACK))
      )
    );
    return;
  }

  // Cache-first for everything else (fonts, manifest, js, css, icons)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
