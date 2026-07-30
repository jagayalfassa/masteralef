// ╔══════════════════════════════════════════════════════════════╗
// ║  AlefMaster — Service Worker PRO                             ║
// ║  Para actualizar: cambiar CACHE_VERSION abajo                ║
// ╚══════════════════════════════════════════════════════════════╝

const CACHE_VERSION = 'v10';
const CACHE_STATIC  = `alefmaster-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `alefmaster-dynamic-${CACHE_VERSION}`;

// Shell de la app — se cachea en install
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
];

// ── INSTALL ───────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_STATIC);

    // Shell crítico — addAll atómico: si falla, el SW no instala
    // Garantiza que index.html y recursos core siempre estén offline
    try {
      await cache.addAll(PRECACHE);
    } catch(e) {
      console.warn('[SW] addAll falló, intentando uno a uno:', e.message);
      // Fallback: intentar cada uno individualmente
      await Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] No cacheado:', url, err.message))
        )
      );
    }

    await self.skipWaiting(); // activar inmediatamente
  })());
});

// ── ACTIVATE — limpiar caches viejos ─────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_DYNAMIC)
          .map(k => { console.log('[SW] Eliminando cache:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim()) // tomar control inmediato
  );
});

// ── FETCH ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if(request.method !== 'GET') return;
  if(url.hostname.endsWith('.supabase.co')){ return; }
  if(!url.protocol.startsWith('http')) return;
  // Edge case Chrome: evita errores silenciosos con requests only-if-cached cross-origin
  if(request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  // HTML → Network First
  if(request.destination === 'document' || request.headers.get('accept')?.includes('text/html')){
    event.respondWith(networkFirst(request));
    return;
  }

  // Fuentes Google → Stale While Revalidate
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
    return;
  }

  // CDN externos (Tailwind, confetti) → Cache First
  if(url.hostname.includes('cdn.') || url.hostname.includes('jsdelivr')){
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Audio mp3 → Cache First (dinámico, se cachea al escuchar)
  if(url.pathname.endsWith('.mp3')){
    event.respondWith(cacheFirst(request, CACHE_DYNAMIC));
    return;
  }

  // JSON datos (parasha, tefilot) → Stale While Revalidate (correcciones sin bump de versión)
  if(url.pathname.endsWith('.json')){
    event.respondWith(staleWhileRevalidate(request, CACHE_DYNAMIC));
    return;
  }

  // Todo lo demás → Cache First estático
  event.respondWith(cacheFirst(request, CACHE_STATIC));
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────
self.addEventListener('push', event => {
  let data;
  try {
    data = event.data?.json();
  } catch(e) {
    data = null;
  }
  if(!data){
    data = {
      title: 'AlefMaster',
      body: '¡Hora de practicar hebreo! 🌟',
      icon: './icons/icon-192.png',
    };
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon || './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag:   'alefmaster-reminder',
      renotify: true,
      data: { url: './' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Si la app ya está abierta → hacer foco
        for(const client of list){
          if(client.url.includes('alefmaster') || client.url.includes('masteralef')){
            return client.focus();
          }
        }
        // Si no → abrir nueva ventana
        return clients.openWindow(url);
      })
  );
});

// ── ESTRATEGIAS ───────────────────────────────────────────────
async function networkFirst(req){
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
    ]);
    if(res.ok){
      const cache = await caches.open(CACHE_STATIC);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if(cached) return cached;
    // Solo usar fallback HTML para navigation requests
    if(req.destination === 'document' || req.mode === 'navigate'){
      return caches.match('./index.html');
    }
    return new Response('Sin conexión', { status: 503 });
  }
}

async function cacheFirst(req, cacheName){
  const cached = await caches.match(req);
  if(cached) return cached;
  try {
    const res = await fetch(req);
    if(res.ok){
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    // Solo devolver index.html para navigation requests (documentos HTML)
    // Para imágenes, audio, JS, CSS → devolver 503 limpio, no HTML
    if(req.destination === 'document' || req.mode === 'navigate'){
      const fallback = await caches.match('./index.html');
      return fallback || new Response('Sin conexión', { status: 503 });
    }
    // Assets no-document: respuesta vacía con tipo correcto para no romper la UI
    const emptyTypes = {
      'image': 'image/gif',
      'audio': 'audio/mpeg',
      'style': 'text/css',
      'script': 'text/javascript',
      'font':  'font/woff2',
    };
    const ct = emptyTypes[req.destination] || 'application/octet-stream';
    return new Response('', { status: 503, headers: { 'Content-Type': ct } });
  }
}

async function staleWhileRevalidate(req, cacheName){
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then(res => { if(res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
  return cached || await fresh || new Response('{}', { status: 503, headers: {'Content-Type':'application/json'} });
}