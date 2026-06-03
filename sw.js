// Service worker mínimo para Panzer POS / Admin.
// Estrategia RED-PRIMERO: siempre intenta la versión más nueva (no sirve caché viejo);
// si no hay internet, sirve lo último que cargó. Habilita el botón "Instalar" de la PWA.
const CACHE = 'panzer-cache-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;            // no tocar POST/PUT (ventas, rpc, etc.)
  e.respondWith(
    fetch(req)
      .then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        } catch (_) {}
        return res;
      })
      .catch(() => caches.match(req))          // sin internet → último guardado
  );
});
