// 청사진 크기(1 · 3 · 5 · 7 · 9)에 맞춰 칸을 놓을 자리(px)를 계산한다 — 전체 화면 · 블록 화면 공용.
import { blocksOf, cellsOf, CENTER, PlanSize, slotPos } from '../model';

export type Placed = { block: number; cell: number; x: number; y: number };

// 전체 화면: 쓰는 블록 × 블록 안 쓰는 칸. 블록 사이는 gap px 띄운다.
export function layoutPlan(size: PlanSize, width: number, gap: number, maxCell: number) {
  const units = blocksOf(size).flatMap(b => {
    const bp = slotPos(size, b);
    return cellsOf(size, b).map(c => {
      const cp = slotPos(size, c);
      return { block: b, cell: c, ux: bp.col * 3 + cp.col, uy: bp.row * 3 + cp.row, gx: bp.col, gy: bp.row };
    });
  });
  return place(units, width, gap, maxCell);
}

// 블록 화면: 블록 하나의 칸들. 칸 사이는 gap px.
export function layoutBlock(size: PlanSize, block: number, width: number, gap: number, maxCell: number) {
  const units = cellsOf(size, block).map(c => {
    const cp = slotPos(size, c);
    return { block, cell: c, ux: cp.col, uy: cp.row, gx: cp.col, gy: cp.row };
  });
  return place(units, width, gap, maxCell);
}

type Unit = { block: number; cell: number; ux: number; uy: number; gx: number; gy: number };

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
  return { cell, cells, width: w, height: h };
}

export const isCore = (b: number, c: number) => b === CENTER && c === CENTER;
