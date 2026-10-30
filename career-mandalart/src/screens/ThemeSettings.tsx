// 테마 선택: 기본 / 흑백 / 만다라트 시그니처 / 나만의 색 섞기(2~4색)
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CENTER } from '../model';
import {
  buildTheme, DEFAULT_CUSTOM, SWATCHES, Theme, THEME_LABELS, ThemeId, ThemeSetting, useTheme,
} from '../theme';

type Props = {
  setting?: ThemeSetting;
  onBack: () => void;
  onChange: (setting: ThemeSetting) => void;
};

const ORDER: ThemeId[] = ['default', 'mono', 'signature', 'custom'];
const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function ThemeSettings({ setting, onBack, onChange }: Props) {
  const { t, ui } = useTheme();
  const current = setting?.id ?? 'default';
  const [colors, setColors] = useState<string[]>(setting?.colors ?? DEFAULT_CUSTOM);

  const toggle = (c: string) => {
    const next = colors.includes(c) ? colors.filter(x => x !== c) : colors.length < 4 ? [...colors, c] : colors;
    setColors(next);
    if (next.length >= 2) onChange({ id: 'custom', colors: next });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>테마</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {ORDER.map(id => {
          const preview = buildTheme(id === 'custom' ? { id, colors: colors.length >= 2 ? colors : DEFAULT_CUSTOM } : { id });
          const selected = id === current;
          return (
            <Pressable
              key={id}
              onPress={() => onChange(id === 'custom' ? { id, colors: colors.length >= 2 ? colors : DEFAULT_CUSTOM } : { id })}
              style={[
                styles.card,
                { backgroundColor: t.surface, borderColor: selected ? t.primary : t.border },
                selected && { borderWidth: 2 },
              ]}
            >
              <MiniGrid theme={preview} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, { color: t.text }]}>{THEME_LABELS[id].label}</Text>
                <Text style={ui.sub}>{THEME_LABELS[id].desc}</Text>
              </View>
              {selected && <Text style={{ color: t.primary, fontWeight: '800', fontSize: 18 }}>✓</Text>}
            </Pressable>
          );
        })}

        {current === 'custom' && (
          <View style={[styles.mixer, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.name, { color: t.text }]}>섞을 색 고르기 ({colors.length}/4)</Text>
            <Text style={ui.sub}>2~4가지를 고르세요. 첫 번째 색이 핵심 목표 · 버튼 색, 나머지가 세부 목표를 번갈아 채웁니다.</Text>
            <View style={styles.swatches}>
              {SWATCHES.map(c => {
                const order = colors.indexOf(c);
                return (
                  <Pressable
                    key={c}
                    onPress={() => toggle(c)}
                    style={[styles.swatch, { backgroundColor: c }, order >= 0 && { borderColor: t.text, borderWidth: 3 }]}
                    accessibilityLabel={`색 ${c}`}
                  >
                    {order >= 0 && <Text style={styles.order}>{order + 1}</Text>}
                  </Pressable>
                );
              })}
            </View>
            {colors.length < 2 && <Text style={[ui.sub, { color: '#DC2626' }]}>최소 2가지 색을 골라주세요.</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MiniGrid({ theme }: { theme: Theme }) {
  return (
    <View style={[styles.mini, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      {IDX.map(b => (
        <View
          key={b}
          style={[styles.miniCell, { backgroundColor: theme.blocks[b] }, b === CENTER && { borderRadius: 4 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  mini: { width: 60, height: 60, padding: 4, gap: 2, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 10, borderWidth: 1 },
  miniCell: { width: 16, height: 16, borderRadius: 3 },
  mixer: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
  },
  order: { color: '#fff', fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
});
