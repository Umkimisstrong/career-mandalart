// 웹 전용: 이미지 카드 배치(card.ts)를 캔버스에 그려 PNG 로 만든다. 저장 · 공유는 qr/image 의 saveQrPng.
import type { CardCell, CardModel } from './card';

const FONT = '-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
const font = (px: number, weight: string) => `${weight} ${px}px ${FONT}`;

// 퍼즐 그림은 한 번만 내려받는다 — 흐리게 정도를 바꿀 때마다 다시 그리므로
const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(uri: string): Promise<HTMLImageElement> {
  let p = images.get(uri);
  if (!p) {
    p = new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => { images.delete(uri); fail(new Error('퍼즐 그림을 불러오지 못했어요.')); };
      img.src = uri;
    });
    images.set(uri, p);
  }
  return p;
}

export async function renderCard(m: CardModel): Promise<string> {
  const img = m.scene ? await loadImage(m.scene.uri) : undefined;
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

  roundRect(ctx, m.tray.x, m.tray.y, m.tray.w, m.tray.h, m.tray.r);
  ctx.fillStyle = m.tray.color;
  ctx.fill();
  for (const c of m.cells) drawCell(ctx, c, m, img);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = m.sub;
  ctx.font = font(26, '600');
  ctx.fillText(m.brand.text, m.width / 2, m.brand.y);
  return canvas.toDataURL('image/png');
}

function drawCell(ctx: CanvasRenderingContext2D, c: CardCell, m: CardModel, img?: HTMLImageElement) {
  const r = Math.min(m.radius, c.size * 0.24);
  roundRect(ctx, c.x, c.y, c.size, c.size, r);
  ctx.fillStyle = c.paint.bg;
  ctx.fill();
  // 퍼즐 조각 — 판 전체 그림에서 이 칸 자리만 잘라, 흐리게 한 만큼 받침 색이 비치게
  const piece = m.scene && img ? m.scene : undefined;
  if (piece && img) {
    const k = img.naturalWidth / piece.size;
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = c.paint.alpha ?? 1;
    ctx.drawImage(img, (c.x - piece.x) * k, (c.y - piece.y) * k, c.size * k, c.size * k, c.x, c.y, c.size, c.size);
    ctx.restore();
  }
  // 1칸 버전의 핵심 목표처럼 블록 색 칸이 완료면 완료색이 블록 색과 겹칠 수 있어 ✓ 는 글자색으로 표시한다
  const check = c.role === 'action' ? m.check : c.paint.ink;
  const stroke = c.paint.ring ?? (c.done ? check : piece ? undefined : m.border);
  if (stroke) {
    roundRect(ctx, c.x, c.y, c.size, c.size, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = c.done ? 3 : 1.5;
    ctx.stroke();
  }

  if (c.done && piece) {
    // 그림 위 ✓ 는 오른쪽 위 흰 동그라미 위에 — 크게 그리면 다 맞춘 조각을 가린다
    const cx = c.x + c.size * 0.8;
    const cy = c.y + c.size * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, c.size * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.fillStyle = m.check;
    ctx.font = font(Math.round(c.size * 0.17), '800');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', cx, cy + c.size * 0.01);
  } else if (c.done) {
    // 글자를 숨긴 칸은 ✓ 만 남으니 가운데에 크게, 글자가 있으면 오른쪽 위 구석에 작게
    const big = !c.text && !c.paint.motif;
    const px = Math.round(c.size * (big ? 0.42 : 0.2));
    ctx.fillStyle = check;
    ctx.font = font(px, '800');
    ctx.textAlign = big ? 'center' : 'right';
    ctx.textBaseline = big ? 'middle' : 'top';
    ctx.fillText('✓', big ? c.x + c.size / 2 : c.x + c.size - c.size * 0.06, big ? c.y + c.size / 2 : c.y + c.size * 0.04);
  }

  const pad = c.size * 0.09;
  // ✓ 가 글자를 가리지 않도록 완료 칸은 위쪽 띠를 비운다
  const band = c.done ? c.size * 0.14 : 0;
  const inner = c.size - pad * 2 - band;
  // 블록마다 그림 — 글자 위에 그림 하나 (앱의 칸과 같은 비율)
  const motifH = c.paint.motif ? c.size * 0.32 : 0;
  if (!c.text) {
    if (c.paint.motif) drawMotif(ctx, c, c.y + c.size / 2);
    return;
  }

  const boxH = inner - motifH;
  const weight = c.role === 'core' ? '800' : c.role === 'goal' ? '700' : '500';
  const maxPx = Math.max(14, c.size * (c.role === 'action' ? 0.2 : 0.23));
  const minPx = Math.max(13, Math.min(22, c.size * 0.14));
  const textW = c.size - pad * 2 - (c.pill ? c.size * 0.06 : 0);
  const { lines, px } = fitText(ctx, c.text, textW, boxH, weight, maxPx, minPx);
  const lh = px * 1.22;
  const top = c.y + pad + band + (inner - motifH - lines.length * lh) / 2;
  if (c.paint.motif) drawMotif(ctx, c, top + motifH / 2);
  const textTop = top + motifH;
  ctx.font = font(px, weight);
  if (c.pill) {
    const tw = Math.max(...lines.map(ln => ctx.measureText(ln).width));
    const pw = Math.min(tw + px * 0.9, c.size - pad);
    const ph = lines.length * lh + px * 0.3;
    roundRect(ctx, c.x + (c.size - pw) / 2, textTop - px * 0.15, pw, ph, Math.min(pw, ph) / 2);
    ctx.fillStyle = c.pill;
    ctx.fill();
  }
  ctx.fillStyle = c.paint.ink;
  ctx.font = font(px, weight);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => ctx.fillText(ln, c.x + c.size / 2, textTop + lh / 2 + i * lh));
}

function drawMotif(ctx: CanvasRenderingContext2D, c: CardCell, y: number) {
  ctx.font = font(Math.round(c.size * 0.26), '400');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = c.paint.ink;
  ctx.fillText(c.paint.motif!, c.x + c.size / 2, y);
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
