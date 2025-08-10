const CACHE_NAME = 'yeonsan-genius-v1.0.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/bgm1.mp3',
  '/bgm2.mp3',
  '/correct.mp3',
  '/wrong.mp3',
  '/hint.mp3',
  '/click.mp3',
  '/complete.mp3',
  '/genius.mp3',
  // problems 파일들
  '/problems_1.json',
  '/problems_2.json',
  '/problems_3.json',
  '/problems_4.json',
  '/problems_5.json',
  '/problems_6.json',
  '/problems_7.json',
  '/problems_8.json',
  '/problems_9.json',
  '/problems_10.json'
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열림');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('캐시 실패:', err);
      })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 패치 이벤트 (오프라인 지원)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 찾으면 반환
        if (response) {
          return response;
        }
        
        // 네트워크 요청
        return fetch(event.request).then(response => {
          // 유효한 응답이 아니면 그대로 반환
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 응답 복사
          const responseToCache = response.clone();
          
          // 캐시에 저장
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // 오프라인일 때 기본 페이지 반환
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  // 게임 데이터 동기화 로직
  console.log('게임 데이터 동기화 중...');
}