// 목표 1개를 SNS 공유용 이미지 카드(세로 4:5)로 그릴 배치. 그리기(render.web.ts)는 이 값만 보고 칠한다.
// 칸 칠은 앱의 판과 같은 paintCell — 그 목표의 블록 테마 색 · 블록마다 그림 · 퍼즐 그림 조각(흐리게 포함)이 그대로 나온다.
import type { ImageSourcePropType } from 'react-native';
import { APP_FULL, APP_TAGLINE_EN } from '../brand';
import { Paint, paintCell, pillColor } from '../components/BoardCell';
import { layoutPlan } from '../components/ShapeLayout';
import { cellRole, cellsIn, getCell, Plan, progress, sizeLabel, sizeOf } from '../model';
import type { Board } from '../theme';

export type CardCell = {
  x: number;
  y: number;
  size: number;
  text: string;
  role: 'core' | 'goal' | 'action';
  done: boolean;
  paint: Paint;
  // 퍼즐 그림 위 글자를 얹는 알약 색
  pill?: string;
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
  // 판 받침 — 칸 둘레와 틈으로 보이는 쟁반
  tray: { x: number; y: number; w: number; h: number; r: number; color: string };
  // 퍼즐 그림 한 장이 놓이는 자리 (카드 px) — 칸마다 이 그림에서 제 자리만큼 잘라 그린다
  scene?: { uri: string; x: number; y: number; size: number };
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
const TRAY = 18;

// require() 한 그림 — 웹에서는 { uri } (네이티브는 숫자지만 카드는 웹에서만 만든다)
const uriOf = (src: ImageSourcePropType) =>
  typeof src === 'string' ? src : src && typeof src === 'object' && 'uri' in src ? src.uri : undefined;

export function cardModel(plan: Plan, board: Board, opts: { hideActions: boolean }): CardModel {
  const shape = sizeOf(plan);
  const boxW = W - SIDE * 2 - TRAY * 2;
  const boxH = MAP_BOTTOM - MAP_TOP - TRAY * 2;
  // layoutPlan 은 너비에만 맞추므로, 세로로 넘치면 칸 최대 크기를 줄여 다시 잰다 (블록 사이 간격은 고정이라 두어 번 반복)
  let maxCell = shape === 1 ? 560 : 200;
  let lay = layoutPlan(shape, boxW, GAP, maxCell, b => cellsIn(plan, b));
  for (let i = 0; i < 4 && lay.height > boxH; i++) {
    maxCell = lay.cell * (boxH / lay.height);
    lay = layoutPlan(shape, boxW, GAP, maxCell, b => cellsIn(plan, b));
  }
  const ox = (W - lay.width) / 2;
  const oy = MAP_TOP + TRAY + (boxH - lay.height) / 2;
  // 칸 둘레 틈 — 앱의 판처럼 조각을 띄운다
  const inset = shape === 9 ? 3 : 6;

  const cells = lay.cells.map(({ block: b, cell: c, x, y }): CardCell => {
    const v = getCell(plan, b, c);
    const role = cellRole(b, c);
    const done = (role === 'action' || shape === 1) && v.done;
    const paint = paintCell(board, b, c, { done });
    const text = role === 'action' && opts.hideActions ? '' : v.text.trim();
    return {
      x: ox + x + inset, y: oy + y + inset, size: lay.cell - inset * 2, text, role, done, paint,
      ...(paint.pill ? { pill: pillColor(board, paint.pill) } : {}),
    };
  });

  const uri = board.art?.mode === 'puzzle' ? uriOf(board.art.scene) : undefined;
  const pr = progress(plan);
  return {
    width: W,
    height: H,
    bg: board.bg,
    ink: board.text,
    sub: board.sub,
    border: board.border,
    check: board.doneBorder,
    radius: 28,
    tray: { x: ox - TRAY, y: oy - TRAY, w: lay.width + TRAY * 2, h: lay.height + TRAY * 2, r: 44, color: board.mat },
    ...(uri ? { scene: { uri, x: ox + lay.picture.x, y: oy + lay.picture.y, size: lay.picture.size } } : {}),
    title: { text: plan.title.trim() || '나의 목표', y: 128 },
    subtitle: { text: `${sizeLabel(shape)} · 완료 ${pr.done}/${pr.filled}`, y: 190 },
    brand: { text: `${APP_FULL} · ${APP_TAGLINE_EN}`, y: H - 50 },
    cells,
  };
}
