// 테마 고르기 한 부품 — 앱 테마 · 블록 기본 테마 · 목표마다의 블록 테마가 같이 쓴다.
// 가족 탭(색상 · 우드 · 음식 · 계절) → 하위 테마. 블록 테마면 그림 방식(블록마다 그림 · 퍼즐 그림)과 「완료할수록 그림 완성」도.
// 나만의 색 섞기면 섞을 색. 가족 탭은 보기만 바꾸고, 하위 테마를 눌러야 바뀐다.
import { ReactNode, useState } from 'react';
import { Image, StyleSheet, Switch, Text, View } from 'react-native';
import { PICTURES, PictureFamily, PictureId, picturesOf } from '../pictures';
import {
  ART_LABELS, ArtMode, BlockTheme, Board, buildBoard, buildTheme, DEFAULT_CUSTOM, FAMILIES, Family, SWATCHES, Theme, THEME_LABELS, ThemeId, useTheme,
} from '../theme';
import { Appear, Tap } from './Motion';

const COLOR_ORDER: ThemeId[] = ['default', 'northstar', 'mono', 'signature', 'custom'];
const ART_ORDER: ArtMode[] = ['motif', 'puzzle'];
const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

type Props = {
  value: BlockTheme;
  onChange: (next: BlockTheme) => void;
  // 블록 테마 고르기 — 그림 방식 · 그림 완성을 보이고, 하위 테마 그림은 판 모양으로. 아니면 앱 테마 (그림은 화면 색)
  board?: boolean;
};

export default function ThemePicker({ value, onChange, board }: Props) {
  const { t, ui } = useTheme();
  // 저장된 값이 모르는 가족이면 색상 탭부터 (판은 theme.ts 가 색상 기본으로 그린다)
  const [family, setFamily] = useState<Family>(FAMILIES.some(f => f.id === value.family) ? value.family : 'color');
  const [colors, setColors] = useState<string[]>(value.colors ?? DEFAULT_CUSTOM);
  const mixed = colors.length >= 2 ? colors : DEFAULT_CUSTOM;
  const art: ArtMode = value.art === 'puzzle' ? 'puzzle' : 'motif';
  // 보고 있는 가족이 지금 고른 가족인가
  const here = value.family === family;
  // 고른 것만 바꾸고 나머지(섞던 색 · 그림 방식 · 그림 완성)는 그대로 둔다
  const pickColor = (id: ThemeId) => onChange({ ...value, family: 'color', variant: id, ...(id === 'custom' ? { colors: mixed } : {}) });
  const pickPicture = (fam: PictureFamily, variant: PictureId, mode = art) => onChange({ ...value, family: fam, variant, art: mode });

  const toggle = (c: string) => {
    const next = colors.includes(c) ? colors.filter(x => x !== c) : colors.length < 4 ? [...colors, c] : colors;
    setColors(next);
    if (next.length >= 2) onChange({ ...value, family: 'color', variant: 'custom', colors: next });
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.tabs, { backgroundColor: t.surface, borderColor: t.border }]}>
        {FAMILIES.map(f => {
          const on = f.id === family;
          return (
            <Tap key={f.id} onPress={() => setFamily(f.id)} shadow={on} hover={1.06}
              style={[styles.tab, { backgroundColor: on ? t.primary : 'transparent' }]} accessibilityLabel={`${f.label} 테마`}>
              <Text style={[{ color: on ? t.onPrimary : t.sub, fontSize: 14, fontWeight: on ? '800' : '600' }, on && ui.titleFont]} numberOfLines={1}>{f.label}</Text>
              {value.family === f.id && <View style={[styles.dot, { backgroundColor: on ? t.onPrimary : t.primary }]} />}
            </Tap>
          );
        })}
      </View>
      <Text style={[ui.sub, { marginTop: -6 }]}>{FAMILIES.find(f => f.id === family)!.desc}</Text>

      {board && family !== 'color' && (
        <View style={styles.artRow}>
          {ART_ORDER.map(mode => {
            const on = here && art === mode;
            return (
              <Tap key={mode} onPress={() => pickPicture(family, here ? value.variant as PictureId : picturesOf(family)[0], mode)}
                style={[styles.art, { backgroundColor: on ? t.primary : t.surface, borderColor: on ? t.primary : t.border }]}>
                <Text style={[{ color: on ? t.onPrimary : t.text, fontSize: 15, fontWeight: '800' }, ui.titleFont]}>
                  {mode === 'motif' ? '🧩 ' : '🖼️ '}{ART_LABELS[mode].label}
                </Text>
                <Text style={{ color: on ? t.onPrimary : t.sub, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{ART_LABELS[mode].desc}</Text>
              </Tap>
            );
          })}
        </View>
      )}

      {board && family !== 'color' && here && art === 'puzzle' && (
        <Appear style={[styles.reveal, { backgroundColor: t.surface, borderColor: value.reveal ? t.primary : t.border }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.name, { color: t.text }, ui.titleFont]}>✨ 완료할수록 그림 완성</Text>
            <Text style={ui.sub}>아직 못 한 칸은 흐리게, 끝낸 칸은 또렷하게 — 바탕화면 작은 창에서도</Text>
          </View>
          <Switch value={!!value.reveal} onValueChange={on => onChange({ ...value, reveal: on })} accessibilityLabel="완료할수록 그림 완성" />
        </Appear>
      )}

      {/* 탭을 바꾸면 하위 테마 카드가 차례로 들어온다 */}
      <View key={family} style={{ gap: 10 }}>
        {family === 'color'
          ? COLOR_ORDER.map((id, i) => {
            const look: BlockTheme = { family: 'color', variant: id, colors: mixed };
            return (
              <VariantCard key={id} delay={i * 50} selected={here && value.variant === id}
                label={THEME_LABELS[id].label} desc={THEME_LABELS[id].desc} onPress={() => pickColor(id)}
                thumb={board ? <MiniGrid board={buildBoard(look)} /> : <AppSwatch theme={buildTheme({ id, colors: mixed })} />} />
            );
          })
          : picturesOf(family).map((id, i) => (
            <VariantCard key={id} delay={i * 50} selected={here && value.variant === id}
              label={PICTURES[id].name} desc={PICTURES[id].desc} onPress={() => pickPicture(family, id)}
              thumb={!board
                ? <AppSwatch theme={buildTheme({ id: 'default', family, variant: id })} />
                : art === 'puzzle'
                  ? <Image source={PICTURES[id].scene} style={styles.scene} accessibilityLabel={`${PICTURES[id].name} 그림`} />
                  : <MiniGrid board={buildBoard({ family, variant: id, art: 'motif' })} />} />
          ))}
      </View>

      {family === 'color' && here && value.variant === 'custom' && (
        <Appear style={[styles.mixer, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Text style={[styles.name, { color: t.text }, ui.titleFont]}>섞을 색 고르기 ({colors.length}/4)</Text>
          <Text style={ui.sub}>
            2~4가지를 고르세요. {board ? '첫 번째 색이 핵심 목표, 나머지가 세부 목표를 번갈아 채웁니다.' : '첫 번째 색이 버튼 · 바탕, 마지막 색이 완료 표시 색이 됩니다.'}
          </Text>
          <View style={styles.swatches}>
            {SWATCHES.map(c => {
              const order = colors.indexOf(c);
              return (
                <Tap
                  key={c}
                  onPress={() => toggle(c)}
                  hover={1.15}
                  style={[styles.swatch, { backgroundColor: c }, order >= 0 && { borderColor: t.text, borderWidth: 3 }]}
                  accessibilityLabel={`색 ${c}`}
                >
                  {order >= 0 && <Text style={styles.order}>{order + 1}</Text>}
                </Tap>
              );
            })}
          </View>
          {colors.length < 2 && <Text style={[ui.sub, { color: '#DC2626' }]}>최소 2가지 색을 골라주세요.</Text>}
        </Appear>
      )}
    </View>
  );
}

function VariantCard({ label, desc, thumb, selected, delay, onPress }: {
  label: string; desc: string; thumb: ReactNode; selected: boolean; delay: number; onPress: () => void;
}) {
  const { t, ui } = useTheme();
  return (
    <Appear delay={delay}>
      <Tap onPress={onPress} hover={1.02} accessibilityLabel={label}
        style={[styles.card, { backgroundColor: t.surface, borderColor: selected ? t.primary : t.border }, selected && { borderWidth: 2 }]}>
        {thumb}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.name, { color: t.text }, ui.titleFont]}>{label}</Text>
          <Text style={ui.sub}>{desc}</Text>
        </View>
        {selected && <Text style={{ color: t.primary, fontWeight: '800', fontSize: 18 }}>✓</Text>}
      </Tap>
    </Appear>
  );
}

// 따로 고르지 않고 윗단계 테마를 따라가기 (블록 기본 테마 → 앱 테마, 목표 → 블록 기본 테마)
export function FollowCard({ label, desc, on, onPress }: { label: string; desc: string; on: boolean; onPress: () => void }) {
  const { t } = useTheme();
  return (
    <VariantCard label={label} desc={desc} selected={on} delay={0} onPress={onPress}
      thumb={<View style={[styles.follow, { backgroundColor: t.bg, borderColor: t.border }]}><Text style={{ fontSize: 26 }}>🔗</Text></View>} />
  );
}

// 블록 테마 카드의 작은 3×3 — 블록 색 (블록마다 그림이면 그림도)
function MiniGrid({ board }: { board: Board }) {
  return (
    <View style={[styles.mini, { backgroundColor: board.mat, borderColor: board.border }]}>
      {IDX.map(b => (
        <View key={b} style={[styles.miniCell, { backgroundColor: board.blocks[b] }]}>
          {!!board.art && <Text style={styles.miniMotif}>{board.art.motifs[b]}</Text>}
        </View>
      ))}
    </View>
  );
}

// 앱 테마 카드의 작은 화면 — 바탕 위 카드 · 글자 · 버튼 · 강조색
function AppSwatch({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.app, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={[styles.appCard, { backgroundColor: theme.surface, borderColor: theme.border }]} />
      <View style={[styles.appLine, { backgroundColor: theme.text }]} />
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={[styles.appBtn, { backgroundColor: theme.primary }]} />
        <View style={[styles.appDot, { backgroundColor: theme.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 4, gap: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 999 },
  dot: { position: 'absolute', top: 5, right: 10, width: 6, height: 6, borderRadius: 3 },
  artRow: { flexDirection: 'row', gap: 8 },
  art: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8 },
  reveal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, borderWidth: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  scene: { width: 64, height: 64, borderRadius: 16 },
  follow: { width: 64, height: 64, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // 안쪽 54 = 64 - 테두리 2 - 여백 8 = 칸 16 × 3 + 틈 3 × 2
  mini: { width: 64, height: 64, padding: 4, gap: 3, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, borderWidth: 1 },
  miniCell: { width: 16, height: 16, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  miniMotif: { fontSize: 10, lineHeight: 13 },
  app: { width: 64, height: 64, padding: 8, gap: 5, borderRadius: 16, borderWidth: 1 },
  appCard: { height: 14, borderRadius: 5, borderWidth: 1 },
  appLine: { height: 5, width: '70%', borderRadius: 3, opacity: 0.75 },
  appBtn: { flex: 1, height: 14, borderRadius: 7 },
  appDot: { width: 14, height: 14, borderRadius: 7 },
  mixer: { padding: 16, borderRadius: 22, borderWidth: 1, gap: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  order: { color: '#fff', fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
});
