// ══════════════════════════════════════════════════════════════════
// AlefMaster — Service Worker v2
// Cambiar CACHE_NAME invalida el caché anterior automáticamente
// ══════════════════════════════════════════════════════════════════

const CACHE_NAME    = 'alefmaster-v2';  // ← incrementado para invalidar caché viejo
const DATA_CACHE    = 'alefmaster-data-v2';

const SHELL_ASSETS = [
  './',
  './index.html',
  './img/bereshit.png',
  './img/shekel-verde.svg',
  './img/shekel-amarillo.svg',
  './img/shekel-azul.svg',
  './img/shekel-azul-ok.svg',
  './img/shekel-verde-ok.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install error:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if(event.request.method !== 'GET') return;

  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }

  if(url.hostname.includes('cdn') || url.hostname.includes('jsdelivr')){
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  if(url.origin !== self.location.origin) return;

  if(url.pathname.includes('/data/torah/')){
    event.respondWith(cacheFirst(event.request, DATA_CACHE));
    return;
  }

  if(url.pathname.includes('/audios/')){
    event.respondWith(cacheFirst(event.request, DATA_CACHE));
    return;
  }

  event.respondWith(networkFirst(event.request, CACHE_NAME));
});

async function cacheFirst(request, cacheName){
  const cached = await caches.match(request);
  if(cached) return cached;
  try {
    const response = await fetch(request);
    if(response.ok){
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName){
  try {
    const response = await fetch(request);
    if(response.ok){
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch(e) {
    const cached = await caches.match(request);
    return cached || new Response('Sin conexión', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName){
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if(response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise;
}
