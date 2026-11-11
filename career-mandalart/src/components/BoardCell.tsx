// 판의 칸 하나 — 전체 화면 · 블록 화면 · 만들기 미리보기 · 바탕화면 작은 창이 같이 쓴다.
// 테마의 그림 방식대로 바탕을 칠한다: 색 / 블록마다 그림(목표 칸에 그림 하나) / 퍼즐 그림(판 전체 그림에서 제 자리 조각).
// 칸 안의 글자 · 표시는 판마다 다르므로 children 으로 받는다. 그림 위 글자는 <Ink> 로 감싸면 알약 위에 얹힌다.
import { ReactNode } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { CENTER, cellRole } from '../model';
import { mix, Theme, useTheme } from '../theme';
import { Appear, Tap } from './Motion';
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
};

// 칸 [block, cell] 의 칠. tint = 실행 과제 칸에도 블록 색을 옅게 (미리보기)
export function paintCell(t: Theme, block: number, cell: number, o: { done?: boolean; tint?: boolean } = {}): Paint {
  const role = cellRole(block, cell);
  const tone = role === 'core' ? CENTER : block === CENTER ? cell : block;
  const ring = o.done ? t.doneBorder : undefined;
  if (t.art?.mode === 'puzzle') {
    if (role === 'core') return { bg: t.mat, ink: '#FFFFFF', pill: 'dark', ring };
    return o.done ? { bg: t.mat, ink: t.doneText, pill: 'done', ring } : { bg: t.mat, ink: t.text, pill: 'light' };
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
  const { t } = useTheme();
  const s = size - inset * 2;
  const left = x + inset;
  const top = y + inset;
  const radius = Math.min(16, s * 0.24);
  const scene = t.art?.mode === 'puzzle' && picture ? t.art.scene : undefined;
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
          <Image source={scene} style={{ position: 'absolute', left: picture.x - left, top: picture.y - top, width: picture.size, height: picture.size }} />
        )}
        {!!paint.motif && <Text style={{ fontSize: Math.max(9, s * 0.26), lineHeight: Math.max(11, s * 0.32) }}>{paint.motif}</Text>}
        {children}
      </Appear>
    </Tap>
  );
}

const PILL = { light: 'rgba(255,255,255,0.88)', dark: 'rgba(40,34,52,0.84)' };

// 칸 글자 감싸기 — 퍼즐 그림이면 알약 위에, 아니면 그대로
export function Ink({ paint, style, children }: { paint: Paint; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const { t } = useTheme();
  if (!paint.pill) return <>{children}</>;
  return (
    <View style={[styles.pill, { backgroundColor: paint.pill === 'done' ? t.done : PILL[paint.pill] }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  face: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 5, paddingVertical: 2, maxWidth: '100%' },
});
