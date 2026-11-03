// 색을 입힐 수 있는 작은 선 아이콘 (react-native-svg) — 이모지는 테마 색을 따르지 않아서.
import Svg, { Circle, Path } from 'react-native-svg';

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

export function InfoIcon({ color, size = 18 }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...line(color)} />
      <Path d="M12 11v6M12 7.5v.5" {...line(color)} />
    </Svg>
  );
}
