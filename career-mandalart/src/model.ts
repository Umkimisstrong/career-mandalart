// 만다라트 데이터 모델 — DB 없이 JSON 하나로 모든 계획을 표현한다.
//
// 9개 블록 × 9개 칸. 블록/칸 인덱스는 3x3 격자를 왼쪽 위부터 0..8 로 센다.
// 가운데 블록(4)의 가운데 칸(4) = 핵심 목표.
// 가운데 블록의 나머지 8칸 = 세부 목표이며, 같은 번호의 바깥 블록 가운데 칸과 동일하다.
// 그래서 바깥 블록의 가운데 칸은 저장하지 않고 blocks[4][b] 를 참조한다.

export const CENTER = 4;

export type Cell = {
  text: string;
  note: string;
  done: boolean;
};

export type Plan = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  blocks: Cell[][];
};

export type Store = {
  version: 1;
  plans: Plan[];
};

export const BLOCK_COLORS = [
  '#F28B82', '#FBBC04', '#FFF475',
  '#CCFF90', '#1F2937', '#A7FFEB',
  '#AECBFA', '#D7AEFB', '#FDCFE8',
];

const emptyCell = (): Cell => ({ text: '', note: '', done: false });

export function newPlan(title: string): Plan {
  const now = Date.now();
  return {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    createdAt: now,
    updatedAt: now,
    blocks: Array.from({ length: 9 }, () => Array.from({ length: 9 }, emptyCell)),
  };
}

// 바깥 블록 가운데 칸 ↔ 가운데 블록 세부목표 칸을 하나로 묶어주는 좌표 변환
function resolve(block: number, cell: number): [number, number] {
  return block !== CENTER && cell === CENTER ? [CENTER, block] : [block, cell];
}

export function getCell(plan: Plan, block: number, cell: number): Cell {
  const [b, c] = resolve(block, cell);
  return plan.blocks[b][c];
}

export function setCell(plan: Plan, block: number, cell: number, patch: Partial<Cell>): Plan {
  const [b, c] = resolve(block, cell);
  const blocks = plan.blocks.map((row, bi) =>
    bi === b ? row.map((v, ci) => (ci === c ? { ...v, ...patch } : v)) : row,
  );
  return { ...plan, blocks, updatedAt: Date.now() };
}

export function cellRole(block: number, cell: number): 'core' | 'goal' | 'action' {
  if (block === CENTER && cell === CENTER) return 'core';
  if (block === CENTER || cell === CENTER) return 'goal';
  return 'action';
}

// 실행 과제(바깥 블록의 가장자리 64칸) 중 내용이 있는 칸 기준 진행률
export function progress(plan: Plan, onlyBlock?: number) {
  let filled = 0;
  let done = 0;
  plan.blocks.forEach((row, b) => {
    if (b === CENTER || (onlyBlock !== undefined && b !== onlyBlock)) return;
    row.forEach((c, i) => {
      if (i === CENTER || !c.text.trim()) return;
      filled++;
      if (c.done) done++;
    });
  });
  return { filled, done, ratio: filled ? done / filled : 0 };
}

export function isStore(v: unknown): v is Store {
  const s = v as Store;
  return (
    !!s && s.version === 1 && Array.isArray(s.plans) &&
    s.plans.every(p => typeof p.id === 'string' && Array.isArray(p.blocks) && p.blocks.length === 9 &&
      p.blocks.every(r => Array.isArray(r) && r.length === 9))
  );
}

export function samplePlan(): Plan {
  let p = newPlan('나의 커리어 청사진');
  const goals = ['전문성', '리더십', '네트워크', '건강', '', '재무', '브랜딩', '학습', '마인드셋'];
  p = setCell(p, CENTER, CENTER, { text: '10년 후 업계 최고의 전문가' });
  goals.forEach((g, i) => { if (i !== CENTER) p = setCell(p, CENTER, i, { text: g }); });
  ['핵심 자격증 취득', '사이드 프로젝트 1개/분기', '기술 블로그 주 1회', '컨퍼런스 발표'].forEach((t, i) => {
    p = setCell(p, 0, [0, 1, 2, 3][i], { text: t });
  });
  return p;
}
