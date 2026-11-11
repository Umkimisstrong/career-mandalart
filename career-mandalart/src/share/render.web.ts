// 웹 전용: 이미지 카드 배치(card.ts)를 캔버스에 그려 PNG 로 만든다. 저장 · 공유는 qr/image 의 saveQrPng.
import type { CardCell, CardModel } from './card';

const FONT = '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
const font = (px: number, weight: string) => `${weight} ${px}px ${FONT}`;

export async function renderCard(m: CardModel): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = m.width;
  canvas.height = m.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = m.bg;
  ctx.fillRect(0, 0, m.width, m.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = m.ink;
  fillLine(ctx, m.title.text, m.width / 2, m.title.y, m.width - 120, 68, 36, '800');
  ctx.fillStyle = m.sub;
  ctx.font = font(32, '500');
  ctx.fillText(m.subtitle.text, m.width / 2, m.subtitle.y, m.width - 120);

  for (const c of m.cells) drawCell(ctx, c, m);

  ctx.fillStyle = m.sub;
  ctx.font = font(26, '600');
  ctx.fillText(m.brand.text, m.width / 2, m.brand.y);
  return canvas.toDataURL('image/png');
}

function drawCell(ctx: CanvasRenderingContext2D, c: CardCell, m: CardModel) {
  roundRect(ctx, c.x, c.y, c.size, c.size, Math.min(m.radius, c.size / 6));
  ctx.fillStyle = c.fill;
  ctx.fill();
  // 1칸 버전의 핵심 목표처럼 블록 색 칸이 완료면 완료색이 블록 색과 겹칠 수 있어 글자색으로 표시한다
  const check = c.role === 'action' ? m.check : c.ink;
  ctx.strokeStyle = c.done ? check : m.border;
  ctx.lineWidth = c.done ? 3 : 1.5;
  ctx.stroke();

  if (c.done) {
    // 글자를 숨긴 칸은 ✓ 만 남으니 가운데에 크게, 글자가 있으면 오른쪽 위 구석에 작게
    const big = !c.text;
    const px = Math.round(c.size * (big ? 0.42 : 0.2));
    ctx.fillStyle = check;
    ctx.font = font(px, '800');
    ctx.textAlign = big ? 'center' : 'right';
    ctx.textBaseline = big ? 'middle' : 'top';
    ctx.fillText('✓', big ? c.x + c.size / 2 : c.x + c.size - c.size * 0.06, big ? c.y + c.size / 2 : c.y + c.size * 0.04);
  }
  if (!c.text) return;

  const pad = c.size * 0.09;
  // ✓ 가 글자를 가리지 않도록 완료 칸은 위쪽 띠를 비운다
  const band = c.done ? c.size * 0.14 : 0;
  const boxH = c.size - pad * 2 - band;
  const weight = c.role === 'core' ? '800' : c.role === 'goal' ? '700' : '500';
  const maxPx = Math.max(14, c.size * (c.role === 'action' ? 0.2 : 0.23));
  const minPx = Math.max(13, Math.min(22, c.size * 0.14));
  const { lines, px } = fitText(ctx, c.text, c.size - pad * 2, boxH, weight, maxPx, minPx);
  const lh = px * 1.22;
  ctx.fillStyle = c.ink;
  ctx.font = font(px, weight);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const top = c.y + pad + band + boxH / 2 - (lines.length * lh) / 2 + lh / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, c.x + c.size / 2, top + i * lh));
}

// 한국어는 띄어쓰기 없이 길게 쓰는 경우가 많아 글자 단위로 줄을 나눈다 (띄어쓰기가 있으면 그 자리를 먼저 쓴다).
// 큰 글씨부터 줄여 가며 칸에 다 들어가는 크기를 찾고, 가장 작은 크기로도 넘치면 마지막 줄을 … 로 자른다.
function fitText(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, weight: string, maxPx: number, minPx: number) {
  // 먼저 낱말이 중간에서 끊기지 않는 크기를 찾는다 (「네트워/크」보다 조금 작은 「네트워크」가 읽기 쉽다)
  for (let px = Math.floor(maxPx); px >= minPx; px--) {
    ctx.font = font(px, weight);
    if (!text.split(/\s+/).every(word => ctx.measureText(word).width <= w)) continue;
    const lines = wrap(ctx, text, w);
    if (lines.length * px * 1.22 <= h) return { lines, px };
  }
  for (let px = Math.floor(maxPx); px >= minPx; px--) {
    ctx.font = font(px, weight);
    const lines = wrap(ctx, text, w);
    if (lines.length * px * 1.22 <= h) return { lines, px };
  }
  const px = Math.ceil(minPx);
  ctx.font = font(px, weight);
  const all = wrap(ctx, text, w);
  const keep = Math.max(1, Math.floor(h / (px * 1.22)));
  const lines = all.slice(0, keep);
  if (all.length > keep) {
    let last = lines[keep - 1];
    while (last && ctx.measureText(`${last}…`).width > w) last = last.slice(0, -1);
    lines[keep - 1] = `${last.trimEnd()}…`;
  }
  return { lines, px };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, w: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const ch of Array.from(para)) {
      if (!line && ch === ' ') continue;
      if (line && ctx.measureText(line + ch).width > w) {
        // 띄어쓰기가 있으면 그 자리에서 넘겨 낱말이 덜 끊기게 한다
        let cut = ch === ' ' ? -1 : line.lastIndexOf(' ');
        if (cut > 0 && ctx.measureText(line.slice(cut + 1) + ch).width > w) cut = -1;
        out.push((cut > 0 ? line.slice(0, cut) : line).trimEnd());
        line = cut > 0 ? line.slice(cut + 1) + ch : ch === ' ' ? '' : ch;
      } else {
        line += ch;
      }
    }
    if (line) out.push(line.trimEnd());
  }
  return out;
}

function fillLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, maxPx: number, minPx: number, weight: string) {
  let px = maxPx;
  ctx.font = font(px, weight);
  while (px > minPx && ctx.measureText(text).width > w) ctx.font = font(--px, weight);
  ctx.fillText(text, x, y, w);
}

// ctx.roundRect 는 iOS 16 미만 Safari 에 없어 직접 그린다
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
