// 색을 입힐 수 있는 작은 선 아이콘 (react-native-svg) — 이모지는 테마 색을 따르지 않아서.
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { blocksOf, PlanSize, slotPos } from '../model';

type P = { color: string; size?: number };
const line = (color: string) => ({ stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' });

export function TrashIcon({ color, size = 18 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" {...line(color)} />
    </Svg>
  );
}

export function BellIcon({ color, size = 20 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0" {...line(color)} />
    </Svg>
  );
}

export function CalendarIcon({ color, size = 20 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={5.5} width={16} height={14.5} rx={3} {...line(color)} />
      <Path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" {...line(color)} />
      <Circle cx={9} cy={14.5} r={0.6} {...line(color)} />
      <Circle cx={15} cy={14.5} r={0.6} {...line(color)} />
    </Svg>
  );
}

export function InfoIcon({ color, size = 18 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...line(color)} />
      <Path d="M12 11v6M12 7.5v.5" {...line(color)} />
    </Svg>
  );
}

export function HomeIcon({ color, size = 16 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 11l8-7 8 7M6 9.5V20h4v-6h4v6h4V9.5" {...line(color)} />
    </Svg>
  );
}

// 접기 · 펴기 — open 이면 아래(▾), 아니면 오른쪽(▸)
export function ChevronIcon({ color, size = 16, open }: P & { open: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={open ? 'M6 9l6 6 6-6' : 'M9 6l6 6-6 6'} {...line(color)} />
    </Svg>
  );
}

// 목표 크기 모양 — 9: 3×3, 7: 육각, 5: 십자, 3: 가로 줄, 1: 한 칸 (가운데 칸은 진하게)
export function ShapeIcon({ color, size = 20, shape }: P & { shape: PlanSize }) {
  const u = 7.4;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* 1칸은 한 칸을 크게 */}
      {shape === 1 && <Rect x={6} y={6} width={12} height={12} rx={2.5} fill={color} />}
      {shape !== 1 && blocksOf(shape).map(i => {
        const { col, row } = slotPos(shape, i);
        return (
          <Rect key={i} x={1 + col * u + 0.6} y={1 + row * u + 0.6} width={u - 1.2} height={u - 1.2} rx={1.4}
            fill={color} opacity={i === 4 ? 1 : 0.6} />
        );
      })}
    </Svg>
  );
}
