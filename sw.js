// ══════════════════════════════════════════════════════════════════
// AlefMaster — Service Worker
// Estrategia: Cache First para assets estáticos, Network First para datos
// ══════════════════════════════════════════════════════════════════

const CACHE_NAME    = 'alefmaster-v1';
const DATA_CACHE    = 'alefmaster-data-v1';

// Assets que se cachean en el install (shell de la app)
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

// ── INSTALL ───────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Install error:', err))
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────
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

// ── FETCH ─────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo interceptar GET del mismo origen o assets conocidos
  if(event.request.method !== 'GET') return;

  // Fuentes de Google → cache con stale-while-revalidate
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
    return;
  }

  // CDN externos (Tailwind, confetti) → cache first, no falla si no hay red
  if(url.hostname.includes('cdn') || url.hostname.includes('jsdelivr')){
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Solo interceptar el mismo origen
  if(url.origin !== self.location.origin) return;

  // Torah JSON (diccionario + parashot) → cache first (no cambian nunca)
  if(url.pathname.includes('/data/torah/')){
    event.respondWith(cacheFirst(event.request, DATA_CACHE));
    return;
  }

  // Audios → cache first (pesados, no cambian)
  if(url.pathname.includes('/audios/')){
    event.respondWith(cacheFirst(event.request, DATA_CACHE));
    return;
  }

  // Shell (index.html, imágenes) → network first con fallback a cache
  event.respondWith(networkFirst(event.request, CACHE_NAME));
});

// ── ESTRATEGIAS ───────────────────────────────────────────────────

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
