// ╔══════════════════════════════════════════════════════════════╗
// ║  AlefMaster — Service Worker v6                              ║
// ║  Sefaria bypass + safe JSON cache + debug logs              ║
// ╚══════════════════════════════════════════════════════════════╝

const CACHE_VERSION = 'v6';
const CACHE_STATIC  = `alefmaster-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `alefmaster-dynamic-${CACHE_VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './data/kriyah_data.json',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);
    try {
      await cache.addAll(PRECACHE);
    } catch(e) {
      console.warn('[SW] addAll falló, intentando uno a uno:', e.message);
      await Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] No cacheado:', url, err.message))
        )
      );
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => { console.log('[SW] Eliminando cache obsoleto:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if(request.method !== 'GET') return;
  if(!url.protocol.startsWith('http')) return;
  if(request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  // SEFARIA: bypass total — nunca interceptar ni cachear
  if(url.hostname.includes('sefaria.org')) return;

  if(request.destination === 'document' || request.headers.get('accept')?.includes('text/html')){
    event.respondWith(networkFirst(request)); return;
  }
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC)); return;
  }
  if(url.hostname.includes('cdn.') || url.hostname.includes('jsdelivr')){
    event.respondWith(cacheFirst(request, CACHE_STATIC)); return;
  }
  if(url.pathname.endsWith('.mp3')){
    event.respondWith(cacheFirst(request, CACHE_DYNAMIC)); return;
  }
  if(url.pathname.endsWith('kriyah_data.json')){
    event.respondWith(cacheFirst(request, CACHE_STATIC)); return;
  }
  if(url.pathname.endsWith('.json')){
    event.respondWith(cacheFirstSafeJson(request, CACHE_DYNAMIC)); return;
  }
  event.respondWith(cacheFirst(request, CACHE_STATIC));
});

self.addEventListener('push', event => {
  const data = event.data?.json() ?? { title:'AlefMaster', body:'¡Hora de practicar hebreo! 🌟', icon:'./icons/icon-192.png' };
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: data.icon || './icons/icon-192.png',
    badge: './icons/icon-192.png', tag: 'alefmaster-reminder', renotify: true, data: { url: './' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for(const c of list){ if(c.url.includes('alefmaster') || c.url.includes('masteralef')) return c.focus(); }
      return clients.openWindow(targetUrl);
    })
  );
});

async function networkFirst(req){
  try {
    const res = await fetch(req);
    if(res.ok){ const cache = await caches.open(CACHE_STATIC); cache.put(req, res.clone()); }
    return res;
  } catch {
    const cached = await caches.match(req);
    if(cached) return cached;
    if(req.destination === 'document' || req.mode === 'navigate') return caches.match('./index.html');
    return new Response('Sin conexión', { status: 503 });
  }
}

async function cacheFirst(req, cacheName){
  const cached = await caches.match(req);
  if(cached){ console.log('[SW] CACHE HIT:', req.url); return cached; }
  console.log('[SW] FETCH REAL:', req.url);
  try {
    const res = await fetch(req);
    if(res.ok){ const cache = await caches.open(cacheName); cache.put(req, res.clone()); }
    return res;
  } catch {
    if(req.destination === 'document' || req.mode === 'navigate')
      return caches.match('./index.html') || new Response('Sin conexión', { status:503 });
    const emptyTypes = { image:'image/gif', audio:'audio/mpeg', style:'text/css',
      script:'text/javascript', font:'font/woff2', json:'application/json' };
    return new Response('', { status:503, headers:{ 'Content-Type': emptyTypes[req.destination] || 'application/octet-stream' }});
  }
}

async function cacheFirstSafeJson(req, cacheName){
  const cached = await caches.match(req);
  if(cached){ console.log('[SW] CACHE HIT (json):', req.url); return cached; }
  console.log('[SW] FETCH REAL (json):', req.url);
  try {
    const res = await fetch(req);
    if(res.ok){
      const ct = res.headers.get('content-type') || '';
      if(ct.includes('json') || ct.includes('text/plain')){
        const valid = await res.clone().json().then(()=>true).catch(()=>false);
        if(valid){ const cache = await caches.open(cacheName); cache.put(req, res.clone()); console.log('[SW] JSON cacheado OK:', req.url); }
        else console.warn('[SW] JSON inválido, NO cacheado:', req.url);
      }
    }
    return res;
  } catch {
    return new Response('{}', { status:503, headers:{ 'Content-Type':'application/json' }});
  }
}

async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh = fetch(req).then(res => { if(res.ok) cache.put(req, res.clone()); return res; }).catch(()=>null);
  return cached || await fresh;
}
