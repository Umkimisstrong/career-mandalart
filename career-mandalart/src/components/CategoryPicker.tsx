// 칸 편집 창 안의 목표 카테고리 선택기.
//  - 세부 목표 칸: 매슬로우 단계별로 묶인 상위 카테고리를 고른다.
//  - 실행 과제 칸: 블록의 카테고리(또는 다른 카테고리)의 하위 속성을 고르거나,
//    직접 입력한 내용을 그 카테고리에 추가한다.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AGE_BANDS, AgeBand, CATEGORIES, categoryById, MASLOW, MaslowLevel,
} from '../categories/data';
import { useTheme } from '../theme';

const LEVELS = Object.keys(MASLOW).map(Number) as MaslowLevel[];

export function GoalCategoryPicker({ selected, onSelect }: {
  selected?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const { t } = useTheme();
  const on = { backgroundColor: t.primary, borderColor: t.primary };
  const onText = { color: t.onPrimary };
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.title}>목표 카테고리</Text>
      {LEVELS.map(level => (
        <View key={level} style={styles.levelRow}>
          <Text style={styles.level}>{level} {MASLOW[level].label}</Text>
          <View style={[styles.wrap, { flex: 1 }]}>
            {CATEGORIES.filter(c => c.maslow === level).map(c => {
              const sel = c.id === selected;
              return (
                <Pressable key={c.id} onPress={() => onSelect(sel ? undefined : c.id)} style={[styles.chip, sel && on]}>
                  <Text style={[styles.chipText, sel && [styles.chipTextOn, onText]]}>{c.emoji} {c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

export function ActionItemPicker({ initialCat, text, age, custom, onAge, onPick, onAddCustom }: {
  initialCat?: string;
  text: string;
  age?: AgeBand;
  custom: Record<string, string[]>;
  onAge: (age: AgeBand | undefined) => void;
  onPick: (label: string) => void;
  onAddCustom: (catId: string, label: string) => void;
}) {
  const { t } = useTheme();
  const on = { backgroundColor: t.primary, borderColor: t.primary };
  const onText = { color: t.onPrimary };
  const [catId, setCatId] = useState(initialCat ?? CATEGORIES[0].id);
  const cat = categoryById(catId) ?? CATEGORIES[0];
  const mine = custom[cat.id] ?? [];
  const rec = (ages?: AgeBand[]) => !!age && !!ages?.includes(age);
  const items = [...cat.items].sort((a, b) => Number(rec(b.ages)) - Number(rec(a.ages)));
  const trimmed = text.trim();
  const canAdd = !!trimmed && !mine.includes(trimmed) && !cat.items.some(i => i.label === trimmed);

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.title}>추천 실행 과제</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 6, alignItems: 'flex-start' }}
      >
        {CATEGORIES.map(c => {
          const sel = c.id === cat.id;
          return (
            <Pressable key={c.id} onPress={() => setCatId(c.id)} style={[styles.tab, sel && on]}>
              <Text style={[styles.chipText, sel && [styles.chipTextOn, onText]]}>{c.emoji} {c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.wrap, { alignItems: 'center' }]}>
        <Text style={styles.level}>내 연령대</Text>
        {AGE_BANDS.map(a => {
          const sel = a.id === age;
          return (
            <Pressable key={a.id} onPress={() => onAge(sel ? undefined : a.id)} style={[styles.ageChip, sel && on]}>
              <Text style={[styles.ageText, sel && onText]}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!age && !!cat.ageNotes?.[age] && <Text style={styles.note}>💡 {cat.ageNotes[age]}</Text>}

      <View style={styles.wrap}>
        {items.map(i => (
          <Pressable key={i.label} onPress={() => onPick(i.label)} style={[styles.item, rec(i.ages) && styles.itemRec]}>
            <Text style={styles.itemText}>{rec(i.ages) ? '★ ' : ''}{i.label}</Text>
          </Pressable>
        ))}
        {mine.map(label => (
          <Pressable key={`mine-${label}`} onPress={() => onPick(label)} style={[styles.item, styles.itemMine]}>
            <Text style={styles.itemText}>✎ {label}</Text>
          </Pressable>
        ))}
      </View>

      {canAdd && (
        <Pressable onPress={() => onAddCustom(cat.id, trimmed)} style={styles.add}>
          <Text style={styles.addText}>+ 「{trimmed}」을(를) {cat.emoji} {cat.label}에 추가</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 13, fontWeight: '700', color: '#374151' },
  levelRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  level: { width: 64, fontSize: 11, color: '#6B7280', paddingTop: 7 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
    borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  tab: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
    borderColor: '#D1D5DB', backgroundColor: '#fff',
  },
  chipText: { fontSize: 13, color: '#111827' },
  chipTextOn: { fontWeight: '700' },
  ageChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, backgroundColor: '#E5E7EB' },
  ageText: { fontSize: 12, color: '#374151' },
  note: { fontSize: 12, color: '#1E40AF', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 },
  item: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  itemRec: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  itemMine: { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
  itemText: { fontSize: 13, color: '#111827' },
  add: { padding: 10, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#10B981' },
  addText: { fontSize: 13, color: '#047857', textAlign: 'center' },
});
