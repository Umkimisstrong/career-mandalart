#!/usr/bin/env node
// `expo export --platform web` 결과(dist/)를 설치형 웹 앱(PWA)으로 다듬는다.
//  - iPhone: Safari → 공유 → "홈 화면에 추가" 하면 주소창 없이 앱처럼 열린다.
//  - Android: Chrome 이 「앱 설치」를 띄워 앱 서랍에 아이콘이 생긴다 (manifest 192 · 512 · 마스커블 아이콘 + 서비스 워커).
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const theme = '#F3F4F6';
// 링크 미리보기(카카오톡 · 메시지)용 소개 — 한국어 + 영문
const description = '九道 아홉 갈래 길 · 求道 길을 구하다 · 構圖 목표의 짜임 — One purpose, nine ways: an 81-cell goal map.';

copyFileSync('assets/icon.png', join(dist, 'apple-touch-icon.png'));
copyFileSync('assets/pwa-192.png', join(dist, 'icon-192.png'));
copyFileSync('assets/pwa-512.png', join(dist, 'icon-512.png'));
copyFileSync('assets/pwa-maskable-512.png', join(dist, 'icon-maskable-512.png'));

writeFileSync(join(dist, 'manifest.json'), JSON.stringify({
  id: '/',
  name: app.name,
  short_name: '구도',
  description,
  lang: 'ko',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: theme,
  theme_color: theme,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// 서비스 워커: 항상 네트워크 먼저(배포하면 바로 새 버전), 오프라인이면 마지막으로 받은 화면.
// 설치형 앱 조건 + iPhone 홈 화면 앱의 알림(서비스 워커 알림)에 쓰인다.
const version = Date.now().toString(36);
writeFileSync(join(dist, 'sw.js'), `const CACHE = 'gudo-${version}';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => (cs[0] ? cs[0].focus() : self.clients.openWindow('/'))));
});
`);

const head = [
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  `<meta name="apple-mobile-web-app-title" content="구도">`,
  `<meta name="theme-color" content="${theme}">`,
  `<meta name="description" content="${description}">`,
  `<meta property="og:title" content="${app.name} · Nine Ways">`,
  `<meta property="og:description" content="${description}">`,
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/manifest.json">',
  "<script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))</script>",
].join('\n    ');

const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8').replace('<html lang="en">', '<html lang="ko">');
if (!html.includes('apple-mobile-web-app-capable')) {
  html = html.replace('</head>', `    ${head}\n  </head>`);
}
// 노치/홈 인디케이터 영역까지 그리도록 viewport-fit=cover
html = html.replace(/<meta name="viewport" content="([^"]*)"/, (m, c) =>
  c.includes('viewport-fit') ? m : `<meta name="viewport" content="${c}, viewport-fit=cover"`);
writeFileSync(indexPath, html);
console.log(`[pwa] ${dist}/ 에 홈 화면 앱(iPhone) · 설치형 앱(Android) 설정을 추가했습니다.`);
