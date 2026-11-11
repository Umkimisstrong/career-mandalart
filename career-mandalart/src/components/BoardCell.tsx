// 판의 칸 하나 — 전체 화면 · 블록 화면 · 만들기 미리보기 · 바탕화면 작은 창이 같이 쓴다.
// 그 목표의 블록 테마(useBoard) 그림 방식대로 바탕을 칠한다: 색 / 블록마다 그림(목표 칸에 그림 하나) /
// 퍼즐 그림(판 전체 그림에서 제 자리 조각). 칸 안의 글자 · 표시는 판마다 다르므로 children 으로 받는다.
// 그림 위 글자는 <Ink> 로 감싸면 알약 위에 얹힌다.
import { ReactNode } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CENTER, cellRole } from '../model';
import { Board, mix, useBoard } from '../theme';
import { Appear, Tap, useEase } from './Motion';
import type { Picture } from './ShapeLayout';

export type Paint = {
  bg: string;
  ink: string;
  // 블록마다 그림: 핵심 · 세부 목표 칸에 올리는 그림
  motif?: string;
  // 퍼즐 그림: 글자를 얹는 알약 — 어떤 그림 위에서도 읽히게
  pill?: 'light' | 'dark' | 'done';
  // 완료 테두리 — 바탕색으로 완료를 보일 수 없을 때 (퍼즐 칸 · 1칸 버전 핵심 목표)
  ring?: string;
  // 퍼즐 그림 조각의 불투명도 — 흐리게 한 조각은 받침 색이 비친다
  alpha?: number;
};

// 칸 [block, cell] 의 칠. tint = 실행 과제 칸에도 블록 색을 옅게 (미리보기)
// ratio = 이 칸이 묶음 전체를 대표할 때(작은 창의 핵심 · 세부 목표 칸) 그 묶음의 완료 비율
export function paintCell(t: Board, block: number, cell: number, o: { done?: boolean; tint?: boolean; ratio?: number } = {}): Paint {
  const role = cellRole(block, cell);
  const tone = role === 'core' ? CENTER : block === CENTER ? cell : block;
  const ring = o.done ? t.doneBorder : undefined;
  if (t.art?.mode === 'puzzle') {
    // 완료할수록 그림 완성: 실행 과제 조각은 끝내면 또렷, 묶음을 대표하는 칸은 그 비율만큼, 그 밖의 목표 칸은 늘 또렷.
    // reveal 이 아니면 모든 조각을 똑같이 흐리게 (이미지 카드의 배경 흐리게)
    const clear = !t.reveal ? 0 : role === 'action' ? (o.done ? 1 : 0) : o.ratio ?? 1;
    const alpha = 1 - t.fade * (1 - clear);
    if (role === 'core') return { bg: t.mat, ink: '#FFFFFF', pill: 'dark', ring, alpha };
    return o.done ? { bg: t.mat, ink: t.doneText, pill: 'done', ring, alpha } : { bg: t.mat, ink: t.text, pill: 'light', alpha };
  }
  if (role !== 'action') {
    const bg = t.blocks[tone];
    return { bg, ink: t.on(bg), motif: t.art?.motifs[tone], ring };
  }
  // 그림 테마는 옅은 블록 색과 완료 색이 비슷할 수 있어 테두리도 단다
  if (o.done) return { bg: t.done, ink: t.doneText, ring: t.art ? ring : undefined };
  return { bg: t.art || o.tint ? mix(t.blocks[block], t.surface, 0.68) : t.surface, ink: t.text };
}

type Props = {
  x: number;
  y: number;
  size: number;
  paint: Paint;
  // 퍼즐 그림이 놓이는 자리 (layoutPlan · layoutBlock 의 picture). 없으면 그림 없이 바탕색
  picture?: Picture;
  // 칸 둘레 틈 (px) — 칸끼리 붙은 판에서 퍼즐 조각처럼 띄운다
  inset?: number;
  // 차례로 나타나기 (ms)
  delay?: number;
  label?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export default function BoardCell({ x, y, size, paint, picture, inset = 0, delay = 0, label, onPress, onLongPress, style, children }: Props) {
  const t = useBoard();
  const s = size - inset * 2;
  const left = x + inset;
  const top = y + inset;
  const radius = Math.min(16, s * 0.24);
  const scene = t.art?.mode === 'puzzle' && picture ? t.art.scene : undefined;
  const alpha = useEase(paint.alpha ?? 1);
  return (
    <Tap
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      disabled={!onPress && !onLongPress}
      onPress={onPress}
      onLongPress={onLongPress}
      hover={s < 56 ? 1.18 : 1.05}
      press={s < 56 ? 0.86 : 0.93}
      style={{ position: 'absolute', left, top, width: s, height: s, borderRadius: radius }}
    >
      <Appear kind="pop" delay={delay} style={[
        styles.face,
        { borderRadius: radius, backgroundColor: paint.bg },
        !scene && { borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
        !!paint.ring && { borderWidth: 2, borderColor: paint.ring },
        style,
      ]}>
        {scene && picture && (
          <Animated.Image source={scene} style={{ position: 'absolute', left: picture.x - left, top: picture.y - top, width: picture.size, height: picture.size, opacity: alpha }} />
        )}
        {!!paint.motif && <Text style={{ fontSize: Math.max(9, s * 0.26), lineHeight: Math.max(11, s * 0.32) }}>{paint.motif}</Text>}
        {children}
      </Appear>
    </Tap>
  );
}

const PILL = { light: 'rgba(255,255,255,0.88)', dark: 'rgba(40,34,52,0.84)' };
export const pillColor = (t: Board, pill: NonNullable<Paint['pill']>) => (pill === 'done' ? t.done : PILL[pill]);

// 칸 글자 감싸기 — 퍼즐 그림이면 알약 위에, 아니면 그대로
export function Ink({ paint, style, children }: { paint: Paint; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const t = useBoard();
  if (!paint.pill) return <>{children}</>;
  return (
    <View style={[styles.pill, { backgroundColor: pillColor(t, paint.pill) }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 5, paddingVertical: 2, maxWidth: '100%' },
});
