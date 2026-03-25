const CACHE_NAME = 'gastos-v1';
const assets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&display=swap'
];

// Instalação do ServiceWorker (Cache Inicial)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(assets);
      })
  );
});

// Busca os recursos localmente offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se estiver no cache, retorna, senão faz requisição à rede
        return response || fetch(event.request);
      })
  );
});
