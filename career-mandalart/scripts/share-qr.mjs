#!/usr/bin/env node
// 서비스 주소를 담은 공유용 QR 이미지를 만든다. 포스터 · 카톡 · 발표 자료에 붙여 쓰는 용도.
//   node scripts/share-qr.mjs [url] [출력경로]
import QRCode from 'qrcode';

const url = process.argv[2] ?? 'https://career-mandalart.vercel.app';
const out = process.argv[3] ?? '../docs/share/career-mandalart-link-qr.png';

await QRCode.toFile(out, url, { errorCorrectionLevel: 'M', margin: 4, width: 1024 });
console.log(`[share-qr] ${url} → ${out}`);
