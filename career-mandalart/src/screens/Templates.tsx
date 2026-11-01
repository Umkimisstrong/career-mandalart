// 연령대별 템플릿으로 81칸을 한 번에 채운다 — 처음 쓰는 사람용.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AGE_BANDS, AgeBand, categoryById } from '../categories/data';
import { parseAction, planFromTemplate, templateOf, TEMPLATES } from '../categories/templates';
import { composeText } from '../categories/units';
import { Plan } from '../model';
import { useTheme } from '../theme';

type Props = { age?: AgeBand; onBack: () => void; onUse: (plan: Plan, age: AgeBand) => void };

export default function Templates({ age, onBack, onUse }: Props) {
  const { t, ui } = useTheme();
  const [sel, setSel] = useState<AgeBand>(age ?? '30s');
  const [open, setOpen] = useState<number | null>(null);
  const tpl = templateOf(sel) ?? TEMPLATES[0];
  const label = AGE_BANDS.find(a => a.id === sel)?.label ?? '';
  const card = { backgroundColor: t.surface, borderColor: t.border };
  // 미리보기 3×3: 가운데 = 핵심 목표
  const grid = [...tpl.goals.slice(0, 4).map(g => g.text), tpl.core, ...tpl.goals.slice(4).map(g => g.text)];

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>템플릿으로 시작</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[styles.lead, { color: t.sub }]}>
          연령대를 고르면 81칸이 미리 채워진 청사진을 만들어 드려요. 만든 뒤 칸마다 내 상황에 맞게 고치면 됩니다.
        </Text>

        <View style={styles.ages}>
          {AGE_BANDS.map(a => {
            const on = a.id === sel;
            return (
              <Pressable key={a.id} onPress={() => { setSel(a.id); setOpen(null); }}
                style={[styles.age, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
                <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: on ? '800' : '500', fontSize: 14 }}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.box, card]}>
          <Text style={[styles.theme, { color: t.text }]}>{tpl.theme}</Text>
          <Text style={[styles.basis, { color: t.sub }]}>근거 · {tpl.basis}</Text>
        </View>

        <View style={[styles.grid, { borderColor: t.border }]}>
          {grid.map((g, i) => {
            const bg = t.blocks[i];
            return (
              <View key={i} style={[styles.cell, { backgroundColor: bg }]}>
                <Text style={[styles.cellText, { color: t.on(bg) }, i === 4 && styles.core]} numberOfLines={4}>{g}</Text>
              </View>
            );
          })}
        </View>

        <Pressable style={ui.btnPrimary} onPress={() => onUse(planFromTemplate(tpl, label), sel)}>
          <Text style={ui.btnPrimaryText}>✨ {label} 템플릿으로 81칸 채우기</Text>
        </Pressable>

        <Text style={[styles.h2, { color: t.text }]}>세부 목표 8 · 실행 과제 64 미리보기</Text>
        {tpl.goals.map((g, i) => {
          const c = categoryById(g.cat);
          const expanded = open === i;
          const lines = g.actions.map(a => composeText(parseAction(a, g.cat)));
          return (
            <Pressable key={i} onPress={() => setOpen(expanded ? null : i)} style={[styles.goal, card]}>
              <Text style={[styles.goalTitle, { color: t.text }]}>
                {c?.emoji} {g.text} <Text style={{ color: t.sub, fontWeight: '400', fontSize: 12 }}>{c?.label}</Text>
              </Text>
              {(expanded ? lines : lines.slice(0, 2)).map((l, j) => (
                <Text key={j} style={[styles.act, { color: t.sub }]}>· {l}</Text>
              ))}
              {!expanded && <Text style={[styles.more, { color: t.accent }]}>+ {lines.length - 2}개 더 보기</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  lead: { fontSize: 14, lineHeight: 21 },
  ages: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  age: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  box: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  theme: { fontSize: 15, fontWeight: '800', lineHeight: 22 },
  basis: { fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignSelf: 'center', width: 300, padding: 5, borderWidth: 1, borderRadius: 14 },
  cell: { width: 91, height: 76, borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 5 },
  cellText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  core: { fontSize: 11, fontWeight: '800' },
  h2: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  goal: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  goalTitle: { fontSize: 14, fontWeight: '800' },
  act: { fontSize: 13, lineHeight: 19 },
  more: { fontSize: 12, fontWeight: '700' },
});
