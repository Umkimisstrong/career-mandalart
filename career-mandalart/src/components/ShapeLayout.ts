// 청사진 크기(1 · 3 · 5 · 7 · 9)에 맞춰 칸을 놓을 자리(px)를 계산한다 — 전체 화면 · 블록 화면 공용.
import { blocksOf, cellsOf, CENTER, PlanSize, slotPos } from '../model';

export type Placed = { block: number; cell: number; x: number; y: number };
// 퍼즐 그림 한 장이 놓이는 자리 (판 기준 px, 정사각) — 칸마다 이 그림에서 제 자리만큼 잘라 보인다
export type Picture = { x: number; y: number; size: number };

// 전체 화면: 쓰는 블록 × 블록 안 쓰는 칸. 블록 사이는 gap px 띄운다.
// cellsFor = 블록마다 그릴 칸 (기본: 크기 모양, 목표에 더 연 칸이 있으면 cellsIn)
// 그림은 81칸 판 전체에 펼친다 — 작은 모양은 81칸에서 제 자리만 보인다
export function layoutPlan(size: PlanSize, width: number, gap: number, maxCell: number, cellsFor = (b: number) => cellsOf(size, b)) {
  const units = blocksOf(size).flatMap(b => {
    const bp = slotPos(size, b);
    return cellsFor(b).map(c => {
      const cp = slotPos(size, c);
      return { block: b, cell: c, ux: bp.col * 3 + cp.col, uy: bp.row * 3 + cp.row, gx: bp.col, gy: bp.row };
    });
  });
  const lay = place(units, width, gap, maxCell);
  return { ...lay, picture: { x: lay.origin.x, y: lay.origin.y, size: 9 * lay.cell + 2 * gap } };
}

// 블록 화면: 블록 하나의 칸들. 칸 사이는 gap px.
// 그림은 전체 화면에서 이 블록이 차지하는 1/3 × 1/3 이 블록 크기에 맞게 커진다
export function layoutBlock(size: PlanSize, block: number, width: number, gap: number, maxCell: number, cells = cellsOf(size, block)) {
  const units = cells.map(c => {
    const cp = slotPos(size, c);
    return { block, cell: c, ux: cp.col, uy: cp.row, gx: cp.col, gy: cp.row };
  });
  const lay = place(units, width, gap, maxCell);
  const frame = 3 * lay.cell + 2 * gap;
  const bp = slotPos(size, block);
  return { ...lay, picture: { x: lay.origin.x - bp.col * frame, y: lay.origin.y - bp.row * frame, size: 3 * frame } };
}

type Unit = { block: number; cell: number; ux: number; uy: number; gx: number; gy: number };

// origin = 모양을 잘라 낸 온전한 판(81칸 · 3×3)의 왼쪽 위가 그려지는 자리
function place(units: Unit[], width: number, gap: number, maxCell: number) {
  const span = (k: 'ux' | 'gx') => {
    const v = units.map(u => u[k]);
    return [Math.min(...v), Math.max(...v)];
  };
  const [ux0, ux1] = span('ux');
  const [gx0, gx1] = span('gx');
  const uy0 = Math.min(...units.map(u => u.uy));
  const gy0 = Math.min(...units.map(u => u.gy));
  const cell = Math.min(maxCell, (width - (gx1 - gx0) * gap) / (ux1 - ux0 + 1));
  const cells: Placed[] = units.map(u => ({
    block: u.block, cell: u.cell,
    x: (u.ux - ux0) * cell + (u.gx - gx0) * gap,
    y: (u.uy - uy0) * cell + (u.gy - gy0) * gap,
  }));
  const w = Math.max(...cells.map(c => c.x)) + cell;
  const h = Math.max(...cells.map(c => c.y)) + cell;
  return { cell, cells, width: w, height: h, origin: { x: -(ux0 * cell + gx0 * gap), y: -(uy0 * cell + gy0 * gap) } };
}

export const isCore = (b: number, c: number) => b === CENTER && c === CENTER;
