#!/usr/bin/env node
// 앱 아이콘 만들기 — 「북극성 격자」: 남색 밤하늘에 3×3 판, 가운데 금빛 칸에 북극성.
// 색은 북극성 테마(src/theme.ts northstar)와 같다. 바깥 라이브러리 없이 node 만으로 PNG 를 그린다 (4×4 슈퍼샘플링).
//   node scripts/make-icons.mjs   → assets/*.png · desktop/icon.png 를 다시 만든다
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const NAVY = [0x0B, 0x10, 0x26];
const DEEP = [0x24, 0x38, 0x6E];
const MID = [0x34, 0x50, 0x8F];
const GOLD = [0xF5, 0xC4, 0x51];
const WHITE = [0xFF, 0xFF, 0xFF];

// 512 기준 좌표. 칸 96 · 틈 20 · 판 92..420
const TILE = 96, GAP = 20, START = 92, R = 22;
const tiles = [];
for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
  const i = row * 3 + col;
  tiles.push({ x: START + col * (TILE + GAP), y: START + row * (TILE + GAP), i });
}
// 네 꼭짓점 별 (가운데 칸 안)
const star = [[256, 220], [264, 248], [292, 256], [264, 264], [256, 292], [248, 264], [220, 256], [248, 248]];

const inRound = (px, py, x, y, w, h, r) => {
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
};
const inPoly = (px, py, pts) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// 한 점(512 좌표)의 색. 없으면 null(투명)
//  bg: 'round' 둥근 사각 바탕 · 'full' 꽉 찬 바탕 · 'none' 바탕 없음
//  scale: 판 · 별을 가운데 기준으로 줄임 (마스커블 · 안드로이드 안전 영역)
//  mono: 흰색 실루엣 (안드로이드 모노크롬 — 별은 구멍) · plain: 바탕만
function sample(px, py, { bg, scale = 1, mono = false, plain = false }) {
  const qx = 256 + (px - 256) / scale, qy = 256 + (py - 256) / scale;
  for (const t of plain ? [] : tiles) {
    if (!inRound(qx, qy, t.x, t.y, TILE, TILE, R)) continue;
    if (t.i === 4 && inPoly(qx, qy, star)) return mono ? null : NAVY;
    if (mono) return WHITE;
    return t.i === 4 ? GOLD : t.i % 2 === 0 ? DEEP : MID;
  }
  if (bg === 'full') return NAVY;
  if (bg === 'round' && inRound(px, py, 0, 0, 512, 512, 112)) return NAVY;
  return null;
}

// w × h 그림. 가로로 긴 그림(스토어 넓은 타일)은 높이 h 만큼의 정사각 아이콘을 가운데에 두고 양옆은 바탕으로 채운다
function render(size, opts, h = size) {
  const w = size, side = Math.min(w, h), ox = (w - side) / 2, oy = (h - side) / 2;
  const SS = 4;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const px = ((x + (sx + 0.5) / SS - ox) * 512) / side, py = ((y + (sy + 0.5) / SS - oy) * 512) / side;
      const inside = px >= 0 && px <= 512 && py >= 0 && py <= 512;
      const c = inside ? sample(px, py, opts) : opts.bg === 'full' ? NAVY : null;
      if (c) { r += c[0]; g += c[1]; b += c[2]; a++; }
    }
    const o = (y * w + x) * 4;
    if (a) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; }
    out[o + 3] = Math.round((a / (SS * SS)) * 255);
  }
  return out;
}

// ---- PNG 쓰기 (RGBA 8bit, 또는 alpha 를 버린 RGB) ----
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const v of buf) c = CRC[(c ^ v) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function png(size, rgba, rgb = false, h = size) {
  const w = size, ch = rgb ? 3 : 4;
  const raw = Buffer.alloc(h * (w * ch + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * ch + 1)] = 0;
    for (let x = 0; x < w; x++) for (let k = 0; k < ch; k++) raw[y * (w * ch + 1) + 1 + x * ch + k] = rgba[(y * w + x) * 4 + k];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = rgb ? 2 : 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const jobs = [
  // iOS · 스토어 아이콘: 꽉 찬 정사각형, 투명 없음 (모서리는 기기가 둥글게) — 웹 apple-touch-icon 도 이것
  ['assets/icon.png', 1024, { bg: 'full' }, true],
  ['assets/splash-icon.png', 1024, { bg: 'round' }],
  // 웹 · 홈 화면 (any) — 둥근 사각
  ['assets/pwa-192.png', 192, { bg: 'round' }],
  ['assets/pwa-512.png', 512, { bg: 'round' }],
  ['assets/favicon.png', 48, { bg: 'round' }],
  // 마스커블 — 꽉 찬 바탕, 판은 안전 영역(가운데 80%) 안으로
  ['assets/pwa-maskable-512.png', 512, { bg: 'full', scale: 0.8 }],
  // 안드로이드 적응형 아이콘 — 전경은 가운데 66% 안전 영역, 바탕은 남색
  ['assets/android-icon-foreground.png', 512, { bg: 'none', scale: 0.62 }],
  ['assets/android-icon-background.png', 512, { bg: 'full', plain: true }],
  ['assets/android-icon-monochrome.png', 432, { bg: 'none', scale: 0.62, mono: true }],
  // Windows 앱 (창 · 작업 표시줄 · 설치 파일)
  ['desktop/icon.png', 512, { bg: 'round' }],
  // Microsoft Store (MSIX) 타일 — desktop/build/appx/ (electron-builder 가 이름으로 찾는다). 타일은 꽉 찬 바탕
  ['desktop/build/appx/StoreLogo.png', 50, { bg: 'full', scale: 0.8 }],
  ['desktop/build/appx/Square44x44Logo.png', 44, { bg: 'full', scale: 0.8 }],
  ['desktop/build/appx/Square150x150Logo.png', 150, { bg: 'full', scale: 0.7 }],
  ['desktop/build/appx/Wide310x150Logo.png', 310, { bg: 'full', scale: 0.7 }, false, 150],
];
mkdirSync('desktop/build/appx', { recursive: true });
for (const [file, size, opts, rgb, h] of jobs) {
  writeFileSync(file, png(size, render(size, opts, h ?? size), rgb, h ?? size));
  console.log(`✓ ${file} (${size}${h ? `×${h}` : ''})`);
}
