// 목표 1개를 SNS 공유용 이미지 카드(세로 4:5)로 그릴 배치. 그리기(render.web.ts)는 이 값만 보고 칠한다.
import { APP_FULL, APP_TAGLINE_EN } from '../brand';
import { layoutPlan } from '../components/ShapeLayout';
import { CENTER, cellRole, cellsIn, getCell, Plan, progress, sizeLabel, sizeOf } from '../model';
import type { Theme } from '../theme';

export type CardCell = {
  x: number;
  y: number;
  size: number;
  text: string;
  role: 'core' | 'goal' | 'action';
  fill: string;
  ink: string;
  done: boolean;
};

export type CardModel = {
  width: number;
  height: number;
  bg: string;
  ink: string;
  sub: string;
  border: string;
  check: string;
  radius: number;
  title: { text: string; y: number };
  subtitle: { text: string; y: number };
  brand: { text: string; y: number };
  cells: CardCell[];
};

const W = 1080;
const H = 1350;
const SIDE = 56;
const MAP_TOP = 250;
const MAP_BOTTOM = H - 110;
const GAP = 12;

export function cardModel(plan: Plan, t: Theme, opts: { hideActions: boolean }): CardModel {
  const shape = sizeOf(plan);
  const boxW = W - SIDE * 2;
  const boxH = MAP_BOTTOM - MAP_TOP;
  // layoutPlan 은 너비에만 맞추므로, 세로로 넘치면 칸 최대 크기를 줄여 다시 잰다 (블록 사이 간격은 고정이라 두어 번 반복)
  let maxCell = shape === 1 ? 560 : 200;
  let lay = layoutPlan(shape, boxW, GAP, maxCell, b => cellsIn(plan, b));
  for (let i = 0; i < 4 && lay.height > boxH; i++) {
    maxCell = lay.cell * (boxH / lay.height);
    lay = layoutPlan(shape, boxW, GAP, maxCell, b => cellsIn(plan, b));
  }
  const ox = (W - lay.width) / 2;
  const oy = MAP_TOP + (boxH - lay.height) / 2;

  const cells = lay.cells.map(({ block: b, cell: c, x, y }): CardCell => {
    const v = getCell(plan, b, c);
    const role = cellRole(b, c);
    const tracked = role === 'action' || shape === 1;
    const done = tracked && v.done;
    const fill = role === 'action'
      ? (v.done ? t.done : t.surface)
      : t.blocks[role === 'core' ? CENTER : b === CENTER ? c : b];
    const ink = role === 'action' ? (v.done ? t.doneText : t.text) : t.on(fill);
    const text = role === 'action' && opts.hideActions ? '' : v.text.trim();
    return { x: ox + x, y: oy + y, size: lay.cell, text, role, fill, ink, done };
  });

  const pr = progress(plan);
  return {
    width: W,
    height: H,
    bg: t.bg,
    ink: t.text,
    sub: t.sub,
    border: t.border,
    check: t.doneBorder,
    radius: shape === 9 ? 4 : 10,
    title: { text: plan.title.trim() || '나의 목표', y: 128 },
    subtitle: { text: `${sizeLabel(shape)} · 완료 ${pr.done}/${pr.filled}`, y: 190 },
    brand: { text: `${APP_FULL} · ${APP_TAGLINE_EN}`, y: H - 50 },
    cells,
  };
}
