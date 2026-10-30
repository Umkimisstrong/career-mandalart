// 청사진 1개 ↔ QR 문자열 변환. DB 없이 QR 이미지 자체가 저장 매체가 된다.
//
// 형식: "MDA1:" + base45(deflate(JSON 튜플))
//  - base45 는 QR 의 영숫자 모드 문자만 써서 바이트 모드와 거의 같은 밀도로 담기고,
//    어떤 스캐너가 읽어도 문자열이 깨지지 않는다 (RFC 9285).
//  - JSON 튜플은 키 이름 없이 저장 칸 73개(바깥 블록 중심 제외)만 담아 크기를 줄인다.
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { CENTER, newPlan, Plan } from '../model';

const PREFIX = 'MDA1:';
// QR 버전 40 · 오류정정 L 의 영숫자 최대 용량
export const QR_CAPACITY = 4296;

// 저장되는 칸 좌표 목록 (바깥 블록의 가운데 칸은 blocks[4][b] 와 같으므로 제외)
const SLOTS: [number, number][] = [];
for (let b = 0; b < 9; b++) {
  for (let c = 0; c < 9; c++) {
    if (b !== CENTER && c === CENTER) continue;
    SLOTS.push([b, c]);
  }
}

// cats(5번째)는 가운데 블록 9칸의 카테고리 id — 이전 버전 QR 에는 없을 수 있다
type Packed = [title: string, texts: string[], notes: string[] | 0, done: number[], cats?: string[]];

const trimEnd = (a: string[]) => {
  let n = a.length;
  while (n > 0 && !a[n - 1]) n--;
  return a.slice(0, n);
};

function pack(plan: Plan, withNotes: boolean): Packed {
  const texts = trimEnd(SLOTS.map(([b, c]) => plan.blocks[b][c].text));
  const notes = withNotes ? trimEnd(SLOTS.map(([b, c]) => plan.blocks[b][c].note)) : [];
  const done = SLOTS.flatMap(([b, c], i) => (plan.blocks[b][c].done ? [i] : []));
  const cats = trimEnd(plan.blocks[CENTER].map(c => c.cat ?? ''));
  const packed: Packed = [plan.title, texts, notes.length ? notes : 0, done];
  if (cats.length) packed.push(cats);
  return packed;
}

export type Encoded = { text: string; droppedNotes: boolean };

export function encodePlan(plan: Plan): Encoded {
  for (const withNotes of [true, false]) {
    const bytes = deflateSync(strToU8(JSON.stringify(pack(plan, withNotes))), { level: 9 });
    const text = PREFIX + base45Encode(bytes);
    if (text.length <= QR_CAPACITY) return { text, droppedNotes: !withNotes && hasNotes(plan) };
  }
  throw new Error('내용이 너무 길어 QR 한 장에 담을 수 없습니다. JSON 백업을 이용하세요.');
}

const hasNotes = (plan: Plan) => plan.blocks.some(r => r.some(c => !!c.note));

export function isPlanQr(text: string) {
  return text.startsWith(PREFIX);
}

// 스캔한 QR 을 새 청사진으로 복원 (항상 새 id 로 만들어 기존 계획을 덮어쓰지 않음)
export function decodePlan(text: string): Plan {
  if (!isPlanQr(text)) throw new Error('커리어 만다라트 QR 이 아닙니다.');
  let packed: Packed;
  try {
    packed = JSON.parse(strFromU8(inflateSync(base45Decode(text.slice(PREFIX.length)))));
  } catch {
    throw new Error('QR 데이터가 손상되었습니다.');
  }
  const [title, texts, notes, done, cats = []] = packed;
  const plan = newPlan(title || '불러온 청사진');
  const doneSet = new Set(done);
  SLOTS.forEach(([b, c], i) => {
    plan.blocks[b][c] = {
      text: texts[i] ?? '',
      note: (notes || [])[i] ?? '',
      done: doneSet.has(i),
    };
  });
  cats.forEach((id, i) => { if (id) plan.blocks[CENTER][i].cat = id; });
  return plan;
}

// ---- base45 (RFC 9285) ----
const B45 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

function base45Encode(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 2) {
    if (i + 1 < bytes.length) {
      let n = bytes[i] * 256 + bytes[i + 1];
      const c = n % 45; n = (n - c) / 45;
      const d = n % 45; const e = (n - d) / 45;
      out += B45[c] + B45[d] + B45[e];
    } else {
      const n = bytes[i];
      out += B45[n % 45] + B45[Math.floor(n / 45)];
    }
  }
  return out;
}

function base45Decode(str: string): Uint8Array {
  const v = [...str].map(ch => {
    const i = B45.indexOf(ch);
    if (i < 0) throw new Error('bad base45');
    return i;
  });
  const out: number[] = [];
  for (let i = 0; i < v.length; i += 3) {
    if (i + 2 < v.length) {
      const n = v[i] + v[i + 1] * 45 + v[i + 2] * 2025;
      if (n > 0xffff) throw new Error('bad base45');
      out.push(n >> 8, n & 0xff);
    } else {
      if (i + 1 >= v.length) throw new Error('bad base45');
      const n = v[i] + v[i + 1] * 45;
      if (n > 0xff) throw new Error('bad base45');
      out.push(n);
    }
  }
  return Uint8Array.from(out);
}
