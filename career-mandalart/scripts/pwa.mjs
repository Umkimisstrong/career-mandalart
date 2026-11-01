#!/usr/bin/env node
// `expo export --platform web` 결과(dist/)를 iPhone 홈 화면 앱(PWA)으로 쓸 수 있게 다듬는다.
// Safari → 공유 → "홈 화면에 추가" 하면 주소창 없이 앱처럼 열린다.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const app = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const theme = '#F3F4F6';
// 링크 미리보기(카카오톡 · 메시지)용 소개 — 한국어 + 영문
const description = '九道 아홉 갈래 길 · 求道 길을 구하다 · 構圖 목표의 짜임 — One purpose, nine ways: an 81-cell goal map.';

copyFileSync('assets/icon.png', join(dist, 'apple-touch-icon.png'));
copyFileSync('assets/icon.png', join(dist, 'icon-512.png'));

writeFileSync(join(dist, 'manifest.json'), JSON.stringify({
  name: app.name,
  short_name: '구도',
  start_url: '/',
  display: 'standalone',
  background_color: theme,
  theme_color: theme,
  icons: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));

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
console.log(`[pwa] ${dist}/ 에 iPhone 홈 화면 설정을 추가했습니다.`);
