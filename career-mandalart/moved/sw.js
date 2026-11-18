// 옛 주소에 남아 있던 앱 서비스 워커를 정리한다 — 캐시를 비우고 스스로 등록을 푼다 (이사 안내만 보이게)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then(cs => cs.forEach(c => c.navigate(c.url))),
));
