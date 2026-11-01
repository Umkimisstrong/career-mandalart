// 만다라트 데이터 모델 — DB 없이 JSON 하나로 모든 계획을 표현한다.
//
// 9개 블록 × 9개 칸. 블록/칸 인덱스는 3x3 격자를 왼쪽 위부터 0..8 로 센다.
// 가운데 블록(4)의 가운데 칸(4) = 핵심 목표.
// 가운데 블록의 나머지 8칸 = 세부 목표이며, 같은 번호의 바깥 블록 가운데 칸과 동일하다.
// 그래서 바깥 블록의 가운데 칸은 저장하지 않고 blocks[4][b] 를 참조한다.

import type { AgeBand } from './categories/data';
import type { ThemeSetting } from './theme';

export const CENTER = 4;

export type Cell = {
  text: string;
  note: string;
  done: boolean;
  // 핵심 목표 · 세부 목표 칸에 지정한 목표 카테고리 id (src/categories/data.ts)
  cat?: string;
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
  // 사용자가 "카테고리에 추가"한 속성 — 카테고리 id → 라벨 목록
  custom?: Record<string, string[]>;
  // 추천 아이템을 고를 때 기준이 되는 내 연령대
  age?: AgeBand;
  // 화면 테마 (src/theme.ts)
  theme?: ThemeSetting;
};

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

// 오타니 쇼헤이가 하나마키히가시고 1학년 때 세운 목표 달성표의 뼈대.
// 중심 목표 · 8개 세부 목표는 보도로 확인된 내용이고, 실행 과제는 공개적으로 전해지는 일상 실천만 넣었다.
// 나머지 칸은 비워 두어 사용자가 자기 방식으로 채워 보게 한다.
export function ohtaniPlan(): Plan {
  let p = newPlan('오타니 쇼헤이의 81칸 (고교 1학년)');
  p = setCell(p, CENTER, CENTER, { text: '8구단 드래프트 1순위' });
  const goals: [number, string, string][] = [
    [0, '몸 만들기', 'health'],
    [1, '제구', 'career'],
    [2, '구위', 'career'],
    [3, '멘탈', 'mindset'],
    [5, '160km/h', 'career'],
    [6, '인간성', 'relationship'],
    [7, '운', 'mindset'],
    [8, '변화구', 'career'],
  ];
  goals.forEach(([b, text, cat]) => { p = setCell(p, CENTER, b, { text, cat }); });
  ['인사하기', '휴지 줍기'].forEach((t, i) => { p = setCell(p, 7, i, { text: t }); });
  ['감사', '배려', '예의'].forEach((t, i) => { p = setCell(p, 6, i, { text: t }); });
  return p;
}

export function samplePlan(): Plan {
  let p = newPlan('나의 커리어 청사진');
  const goals = ['전문성', '리더십', '네트워크', '건강', '', '재무', '브랜딩', '학습', '마인드셋'];
  const cats = ['career', 'career', 'network', 'health', '', 'money', 'recognition', 'growth', 'mindset'];
  p = setCell(p, CENTER, CENTER, { text: '10년 후 업계 최고의 전문가' });
  goals.forEach((g, i) => { if (i !== CENTER) p = setCell(p, CENTER, i, { text: g, cat: cats[i] }); });
  ['핵심 자격증 취득', '사이드 프로젝트 1개/분기', '기술 블로그 주 1회', '컨퍼런스 발표'].forEach((t, i) => {
    p = setCell(p, 0, [0, 1, 2, 3][i], { text: t });
  });
  return p;
}
