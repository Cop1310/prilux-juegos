// sw.js — Juegos I+D Prilux
// Estrategia: RED PRIMERO para la página (index.html) -> siempre bajas la última
// versión si hay conexión, y sigue funcionando offline con la copia en caché.
// Sube el número de VERSION (v7 -> v8 -> v9...) solo cuando cambies iconos/manifest.

const VERSION = 'prilux-v7';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalar: precachea el núcleo (sin fallar si algún icono no está) y toma el control ya
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then(cache =>
      Promise.allSettled(CORE.map(url => cache.add(url)))
    )
  );
});

// Activar: borra cachés antiguas y reclama las pestañas abiertas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Peticiones
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // La PÁGINA: red primero. Si hay conexión, siempre la versión nueva.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // El resto (iconos, manifest): caché primero, y si no está, a la red.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
