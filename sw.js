// AION Academy — Service Worker for PWA
const CACHE_NAME = 'aion-autonomous-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/academy.html',
  '/chat.html',
  '/autonomy.html',
  '/manifest.json',
  '/icons/aion-company.svg'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('AION: Caching files');
        return cache.addAll(urlsToCache).catch(err => console.log('Cache error:', err));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — Network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          return caches.match('/index.html');
        });
      })
  );
});
