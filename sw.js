const CACHE_NAME = 'yeonsang-genius-v2.3.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  // 문제 파일들은 동적으로 캐싱
];

// Service Worker 설치
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Install complete, skip waiting');
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 같은 도메인의 요청만 처리
  if (url.origin !== location.origin) {
    return;
  }

  // problems_*.json 파일 처리
  if (url.pathname.includes('problems_') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            console.log('[SW] Cache hit:', url.pathname);
            return response;
          }
          console.log('[SW] Fetching:', url.pathname);
          return fetch(request).then(response => {
            // 성공적인 응답만 캐싱
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 응답 복제 후 캐싱
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
            return response;
          });
        })
    );
    return;
  }

  // 음악 파일 처리 (캐싱하지 않음)
  if (url.pathname.includes('.mp3')) {
    event.respondWith(fetch(request));
    return;
  }

  // 기본 전략: 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          // 기본 HTML, CSS, JS만 캐싱
          if (request.method === 'GET' && 
              (url.pathname === '/' || 
               url.pathname.endsWith('.html') || 
               url.pathname.endsWith('.css') || 
               url.pathname.endsWith('.js'))) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        });
      })
      .catch(() => {
        // 오프라인 폴백
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// 백그라운드 동기화 (옵션)
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
});

// 푸시 알림 (옵션)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
});