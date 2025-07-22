const CACHE_NAME = '연상천재-v1.0.0';
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
  // 문제 파일들 (필요한 만큼 추가)
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
  console.log('🔧 Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 파일들 캐싱 중...');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .then(() => {
        console.log('✅ 모든 파일 캐싱 완료!');
        self.skipWaiting(); // 즉시 활성화
      })
      .catch(error => {
        console.warn('⚠️ 일부 파일 캐싱 실패:', error);
        // 핵심 파일들만 캐싱
        return caches.open(CACHE_NAME).then(cache => {
          return cache.addAll([
            '/',
            '/index.html',
            '/manifest.json'
          ]);
        });
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker 활성화됨');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // 즉시 제어권 획득
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  // POST 요청이나 외부 도메인은 캐시하지 않음
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 발견되면 반환
        if (response) {
          console.log('📦 캐시에서 로드:', event.request.url);
          return response;
        }

        // 네트워크에서 가져오기
        console.log('🌐 네트워크에서 로드:', event.request.url);
        return fetch(event.request).then(response => {
          // 유효한 응답인지 확인
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답을 복제해서 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.error('❌ 네트워크 요청 실패:', error);
          
          // 오프라인일 때 기본 응답
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          throw error;
        });
      })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 백그라운드 동기화 실행');
  }
});

// 푸시 알림 (선택사항)
self.addEventListener('push', event => {
  console.log('🔔 푸시 알림 수신:', event);
  
  const options = {
    body: '새로운 라운드가 해제되었습니다!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore', 
        title: '게임하기',
        icon: '/icon-192.png'
      },
      {
        action: 'close', 
        title: '닫기',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('연상천재', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', event => {
  console.log('🔔 알림 클릭됨:', event);
  event.notification.close();

  if (event.action === 'explore') {
    // 게임 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});