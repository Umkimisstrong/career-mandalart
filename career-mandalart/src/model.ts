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
  // 실행 과제 칸: 고른 세부 카테고리 · 행동 · 단위 (다시 편집할 때 복원용, 화면에는 text 를 쓴다)
  spec?: ActionSpec;
  // 실행 과제 칸: 반복 점검 주기 · 알림 (src/routine.ts). done 은 과제 전체 완료, log 는 주기마다의 체크
  routine?: Routine;
  // 체크한 기간 키 목록 — 매일 · 요일: 'YYYY-MM-DD', 매주: 그 주 월요일 'YYYY-MM-DD', 매월: 'YYYY-MM'
  log?: string[];
};

// daily 매일 · weekdays 고른 요일마다 · weekly 주 1회 · monthly 월 1회
export type Freq = 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type Routine = {
  freq: Freq;
  // weekdays: 점검할 요일들 / weekly: 알림 요일 하나 (0=일 … 6=토) / monthly: 알림 날짜 하나 (1~31)
  days?: number[];
  // 알림 시각 'HH:MM' — 없으면 알림 없이 점검만
  time?: string;
  // 시작일 'YYYY-MM-DD' — 이전 기간은 놓친 것으로 세지 않는다
  start: string;
};

// 2레벨(세부 카테고리) · 3레벨(행동) 선택과 단위 — src/categories/tree.ts, units.ts
export type ActionSpec = {
  cat?: string;
  sub?: string;
  act?: string;
  when?: string;
  howLong?: string;
  until?: string;
  where?: string;
  whereTo?: string;
  qty?: { n: string; unit: string }[];
};

export type Plan = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  blocks: Cell[][];
  // 청사진 크기 — 없으면 9 (81칸 시그니처). 작은 버전도 같은 9×9 저장 구조에서 일부 칸만 쓴다.
  size?: PlanSize;
};

// 1 · 3 · 5 · 7 · 9칸 버전 — N칸 한 묶음 = 가운데 1 + 둘레 N-1.
// 가운데 묶음의 둘레 칸 = 세부 목표 N-1개, 세부 목표마다 같은 모양 묶음 하나 (가운데 = 그 세부 목표, 둘레 = 실행 과제)
//   9: 3×3 (81칸)       7: 육각 꽃 (위 2 · 가운데 3 · 아래 2)
//   5: 십자              3: 가로 줄(가운데 묶음) + 세로 줄(세부 목표 묶음)      1: 핵심 목표 한 칸
export type PlanSize = 1 | 3 | 5 | 7 | 9;
export const PLAN_SIZES: PlanSize[] = [9, 7, 5, 3, 1];
const SHAPE: Record<PlanSize, number[]> = {
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  5: [1, 3, 4, 5, 7],
  3: [3, 4, 5],
  1: [4],
};
export const sizeOf = (plan: Plan): PlanSize => plan.size ?? 9;
// 이 크기에서 쓰는 블록 (= 가운데 묶음에서 쓰는 칸)
export const blocksOf = (size: PlanSize) => SHAPE[size];
// 블록 b 안에서 쓰는 칸 — 3칸 버전의 세부 목표 묶음은 세로 줄
export const cellsOf = (size: PlanSize, block: number) =>
  size === 3 && block !== CENTER ? [1, 4, 7] : SHAPE[size];
// 3×3 안 위치 (열 · 행) — 7칸 버전은 위 · 아래 줄을 반 칸씩 안으로 당겨 육각형으로
export function slotPos(size: PlanSize, i: number): { col: number; row: number } {
  const row = Math.floor(i / 3);
  let col = i % 3;
  if (size === 7 && row !== 1) col = col === 0 ? 0.5 : 1.5;
  return { col, row };
}
// 완료 · 반복 점검을 다는 칸 [블록, 칸] — 실행 과제 칸들 (1칸 버전은 핵심 목표 칸 하나)
export function trackedCells(plan: Plan): [number, number][] {
  const size = sizeOf(plan);
  if (size === 1) return [[CENTER, CENTER]];
  return blocksOf(size).filter(b => b !== CENTER)
    .flatMap(b => cellsOf(size, b).filter(c => c !== CENTER).map(c => [b, c] as [number, number]));
}
export const sizeLabel = (size: PlanSize) =>
  size === 1 ? '목표 1개' : `세부 목표 ${size - 1} · 실행 과제 ${(size - 1) ** 2}`;

export type Store = {
  version: 1;
  plans: Plan[];
  // 사용자가 "카테고리에 추가"한 속성 — 카테고리 id → 라벨 목록
  custom?: Record<string, string[]>;
  // 추천 아이템을 고를 때 기준이 되는 내 연령대
  age?: AgeBand;
  // 화면 테마 (src/theme.ts)
  theme?: ThemeSetting;
  // 반복 점검 알림을 켰는지 (네이티브: 로컬 알림 예약, 웹: 앱 아이콘 배지 · 열려 있을 때 알림)
  notify?: boolean;
};

const emptyCell = (): Cell => ({ text: '', note: '', done: false });

export function newPlan(title: string, size: PlanSize = 9): Plan {
  const now = Date.now();
  return {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    createdAt: now,
    updatedAt: now,
    blocks: Array.from({ length: 9 }, () => Array.from({ length: 9 }, emptyCell)),
    ...(size !== 9 ? { size } : {}),
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

// 실행 과제(81칸이면 바깥 블록의 가장자리 64칸) 중 내용이 있는 칸 기준 진행률. 1칸 버전은 핵심 목표 칸
export function progress(plan: Plan, onlyBlock?: number) {
  let filled = 0;
  let done = 0;
  for (const [b, i] of trackedCells(plan)) {
    const c = plan.blocks[b][i];
    if ((onlyBlock !== undefined && b !== onlyBlock) || !c.text.trim()) continue;
    filled++;
    if (c.done) done++;
  }
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
