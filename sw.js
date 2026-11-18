/* 갈매기 1300 - 앱 화면을 기기에 저장해 두어 인터넷이 약해도 열리게 합니다.
   기록 데이터는 Firebase가 따로 저장·동기화하므로 여기서는 화면 파일만 다룹니다. */
const CACHE = 'gull1300-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png',
  './img/finish.jpg', './img/swim.jpg', './img/bike.jpg', './img/run.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase 데이터 통신은 건드리지 않음
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('googleapis.com') && url.pathname.includes('/google.firestore')) return;
  const sameOrigin = url.origin === location.origin;
  const isLib = url.hostname === 'www.gstatic.com' || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (sameOrigin) {
    // 화면 파일: 새 버전 우선, 안 되면 저장본
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (isLib) {
    // Firebase 라이브러리·글꼴: 저장본 우선
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
});
