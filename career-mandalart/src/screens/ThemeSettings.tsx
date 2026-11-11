// 테마 고르기 — 가족(색상 · 우드 · 음식 · 계절) → 하위 테마 → 그림 가족이면 그림 방식(블록마다 그림 · 퍼즐 그림),
// 나만의 색 섞기면 섞을 색. 위의 미리보기 판은 고를 때마다 조각이 차례로 다시 맞춰진다.
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import BoardCell, { Ink, paintCell } from '../components/BoardCell';
import { Appear, Tap } from '../components/Motion';
import { layoutPlan } from '../components/ShapeLayout';
import { CENTER, cellRole, getCell, samplePlan } from '../model';
import { PICTURES, PictureFamily, PictureId, picturesOf } from '../pictures';
import {
  ART_LABELS, ArtMode, buildTheme, DEFAULT_CUSTOM, FAMILIES, Family, SWATCHES, Theme, THEME_LABELS, ThemeId, ThemeSetting, useTheme,
} from '../theme';

type Props = {
  setting?: ThemeSetting;
  onBack: () => void;
  onChange: (setting: ThemeSetting) => void;
};

const COLOR_ORDER: ThemeId[] = ['default', 'northstar', 'mono', 'signature', 'custom'];
const ART_ORDER: ArtMode[] = ['motif', 'puzzle'];
const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function ThemeSettings({ setting, onBack, onChange }: Props) {
  const { t, ui } = useTheme();
  // 보고 있는 가족 탭 — 하위 테마를 눌러야 바뀐다
  const [family, setFamily] = useState<Family>(t.family);
  const [colors, setColors] = useState<string[]>(setting?.colors ?? DEFAULT_CUSTOM);
  const mixed = colors.length >= 2 ? colors : DEFAULT_CUSTOM;
  const art = t.art?.mode ?? setting?.art ?? 'motif';
  // 고른 것만 바꾸고 나머지(섞던 색 · 그림 방식)는 그대로 둔다
  const apply = (next: Partial<ThemeSetting>) => onChange({ ...(setting ?? { id: 'default' }), ...next });
  const pickColor = (id: ThemeId) => apply({ family: 'color', id, ...(id === 'custom' ? { colors: mixed } : {}) });
  const pickPicture = (fam: PictureFamily, variant: PictureId, mode = art) => apply({ family: fam, variant, art: mode });

  const toggle = (c: string) => {
    const next = colors.includes(c) ? colors.filter(x => x !== c) : colors.length < 4 ? [...colors, c] : colors;
    setColors(next);
    if (next.length >= 2) apply({ family: 'color', id: 'custom', colors: next });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>테마</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <SampleBoard />

        <View style={[styles.tabs, { backgroundColor: t.surface, borderColor: t.border }]}>
          {FAMILIES.map(f => {
            const on = f.id === family;
            return (
              <Tap key={f.id} onPress={() => setFamily(f.id)} shadow={on} hover={1.06}
                style={[styles.tab, { backgroundColor: on ? t.primary : 'transparent' }]} accessibilityLabel={`${f.label} 테마`}>
                <Text style={[{ color: on ? t.onPrimary : t.sub, fontSize: 14, fontWeight: on ? '800' : '600' }, on && ui.titleFont]} numberOfLines={1}>{f.label}</Text>
                {t.family === f.id && <View style={[styles.dot, { backgroundColor: on ? t.onPrimary : t.primary }]} />}
              </Tap>
            );
          })}
        </View>
        <Text style={[ui.sub, { marginTop: -6 }]}>{FAMILIES.find(f => f.id === family)!.desc}</Text>

        {family !== 'color' && (
          <View style={styles.artRow}>
            {ART_ORDER.map(mode => {
              const on = t.family === family && art === mode;
              return (
                <Tap key={mode} onPress={() => pickPicture(family, t.family === family ? t.variant as PictureId : picturesOf(family)[0], mode)}
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

        {/* 탭을 바꾸면 하위 테마 카드가 차례로 들어온다 */}
        <View key={family} style={{ gap: 10 }}>
          {family === 'color'
            ? COLOR_ORDER.map((id, i) => (
              <VariantCard key={id} delay={i * 50} selected={t.family === 'color' && t.variant === id}
                label={THEME_LABELS[id].label} desc={THEME_LABELS[id].desc} onPress={() => pickColor(id)}
                thumb={<MiniGrid theme={buildTheme(id === 'custom' ? { id, colors: mixed } : { id })} />} />
            ))
            : picturesOf(family).map((id, i) => (
              <VariantCard key={id} delay={i * 50} selected={t.family === family && t.variant === id}
                label={PICTURES[id].name} desc={PICTURES[id].desc} onPress={() => pickPicture(family, id)}
                thumb={art === 'puzzle'
                  ? <Image source={PICTURES[id].scene} style={styles.scene} accessibilityLabel={`${PICTURES[id].name} 그림`} />
                  : <MiniGrid theme={buildTheme({ id: 'default', family, variant: id, art: 'motif' })} />} />
            ))}
        </View>

        {family === 'color' && t.variant === 'custom' && (
          <Appear style={[styles.mixer, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.name, { color: t.text }, ui.titleFont]}>섞을 색 고르기 ({colors.length}/4)</Text>
            <Text style={ui.sub}>2~4가지를 고르세요. 첫 번째 색이 핵심 목표 · 버튼 색, 나머지가 세부 목표를 번갈아 채웁니다.</Text>
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
      </ScrollView>
    </View>
  );
}

function VariantCard({ label, desc, thumb, selected, delay, onPress }: {
  label: string; desc: string; thumb: React.ReactNode; selected: boolean; delay: number; onPress: () => void;
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

// 하위 테마 카드의 작은 3×3 — 블록 색 (블록마다 그림이면 그림도)
function MiniGrid({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.mini, { backgroundColor: theme.mat, borderColor: theme.border }]}>
      {IDX.map(b => (
        <View key={b} style={[styles.miniCell, { backgroundColor: theme.blocks[b] }]}>
          {!!theme.art && <Text style={styles.miniMotif}>{theme.art.motifs[b]}</Text>}
        </View>
      ))}
    </View>
  );
}

// 지금 테마로 그린 예시 목표 81칸 — 테마가 바뀌면 칸들이 다시 차례로 나타난다
function SampleBoard() {
  const { t } = useTheme();
  const { width } = useWindowDimensions();
  const plan = useMemo(samplePlan, []);
  const lay = layoutPlan(9, Math.min(width - 32, 340) - 12, 4, 40);
  const font = Math.max(6, Math.min(9, lay.cell * 0.2));
  return (
    <View style={[styles.sample, { backgroundColor: t.mat }]}>
      <View style={{ width: lay.width, height: lay.height }}>
        {lay.cells.map(({ block: b, cell: c, x, y }) => {
          const v = getCell(plan, b, c);
          const paint = paintCell(t, b, c, { done: cellRole(b, c) === 'action' && !!v.text && c % 2 === 0 });
          const head = b === CENTER || c === CENTER;
          return (
            <BoardCell key={`${t.key}-${b}-${c}`} x={x} y={y} size={lay.cell} inset={1} paint={paint} picture={lay.picture}
              delay={Math.round((x + y) / lay.cell) * 22}>
              {!!v.text && (
                <Ink paint={paint} style={{ paddingHorizontal: 2, paddingVertical: 1 }}>
                  <Text numberOfLines={2} style={{ color: paint.ink, fontSize: font, lineHeight: font * 1.2, textAlign: 'center', fontWeight: head ? '800' : '500' }}>
                    {v.text}
                  </Text>
                </Ink>
              )}
            </BoardCell>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sample: { alignSelf: 'center', padding: 6, borderRadius: 22 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 4, gap: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 999 },
  dot: { position: 'absolute', top: 5, right: 10, width: 6, height: 6, borderRadius: 3 },
  artRow: { flexDirection: 'row', gap: 8 },
  art: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  scene: { width: 64, height: 64, borderRadius: 16 },
  // 안쪽 54 = 64 - 테두리 2 - 여백 8 = 칸 16 × 3 + 틈 3 × 2
  mini: { width: 64, height: 64, padding: 4, gap: 3, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, borderWidth: 1 },
  miniCell: { width: 16, height: 16, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  miniMotif: { fontSize: 10, lineHeight: 13 },
  mixer: { padding: 16, borderRadius: 22, borderWidth: 1, gap: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  order: { color: '#fff', fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
});
