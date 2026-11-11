// 연령대별 템플릿으로 81칸을 한 번에 채운다 — 처음 쓰는 사람용. 맨 끝은 시그니처(16살 오타니의 81칸).
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AGE_BANDS, AgeBand, categoryById } from '../categories/data';
import { parseAction, planFromTemplate, templateOf, TEMPLATES } from '../categories/templates';
import { composeText } from '../categories/units';
import { Plan } from '../model';
import { Tap } from '../components/Motion';
import { useTheme } from '../theme';

type Props = {
  age?: AgeBand;
  onBack: () => void;
  onUse: (plan: Plan, age: AgeBand) => void;
  onStory: () => void;
  onOhtani: () => void;
};

export default function Templates({ age, onBack, onUse, onStory, onOhtani }: Props) {
  const { t, ui } = useTheme();
  const [sel, setSel] = useState<AgeBand | 'ohtani'>(age ?? '30s');
  const [open, setOpen] = useState<number | null>(null);
  const tpl = (sel !== 'ohtani' && templateOf(sel)) || TEMPLATES[0];
  const label = AGE_BANDS.find(a => a.id === sel)?.label ?? '';
  const card = { backgroundColor: t.surface, borderColor: t.border };
  // 미리보기 3×3: 가운데 = 핵심 목표
  const grid = [...tpl.goals.slice(0, 4).map(g => g.text), tpl.core, ...tpl.goals.slice(4).map(g => g.text)];

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 만들기</Text></Pressable>
        <Text style={ui.headerTitle}>템플릿으로 시작</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[styles.lead, { color: t.sub }]}>
          연령대를 고르면 81칸이 미리 채워진 목표를 만들어 드려요. 만든 뒤 칸마다 내 상황에 맞게 고치면 됩니다.
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
          {/* 시그니처 — 연령대와 상관없이 항상 마지막 */}
          <Pressable onPress={() => { setSel('ohtani'); setOpen(null); }}
            style={[styles.age, { borderColor: t.accent, backgroundColor: sel === 'ohtani' ? t.accent : t.surface }]}>
            <Text style={{ color: sel === 'ohtani' ? t.on(t.accent) : t.accent, fontWeight: '800', fontSize: 14 }}>★ 16살 오타니</Text>
          </Pressable>
        </View>

        {sel === 'ohtani' ? (
          <>
            <View style={[styles.box, card]}>
              <Text style={[styles.theme, { color: t.text }]}>★ 16살 오타니가 81칸에 적은 꿈</Text>
              <Text style={[styles.basis, { color: t.sub }]}>고교 1학년 오타니 쇼헤이가 쓴 81칸 — 핵심 목표 「8구단 드래프트 1순위」. 구도 앱이 시작된 이야기예요.</Text>
            </View>
            <Pressable style={ui.btn} onPress={onStory}><Text style={ui.btnText}>이야기 보기 ›</Text></Pressable>
            <Tap style={ui.btnPrimary} onPress={onOhtani}><Text style={ui.btnPrimaryText}>★ 오타니의 81칸으로 시작</Text></Tap>
          </>
        ) : (<>
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

        <Tap style={ui.btnPrimary} onPress={() => onUse(planFromTemplate(tpl, label), sel as AgeBand)}>
          <Text style={ui.btnPrimaryText}>✨ {label} 템플릿으로 81칸 채우기</Text>
        </Tap>

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
        </>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  lead: { fontSize: 14, lineHeight: 21 },
  ages: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  age: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  box: { borderWidth: 1, borderRadius: 22, padding: 14, gap: 6 },
  theme: { fontSize: 15, fontWeight: '800', lineHeight: 22 },
  basis: { fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignSelf: 'center', width: 300, padding: 5, borderWidth: 1, borderRadius: 22 },
  cell: { width: 91, height: 76, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 5 },
  cellText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  core: { fontSize: 11, fontWeight: '800' },
  h2: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  goal: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 4 },
  goalTitle: { fontSize: 14, fontWeight: '800' },
  act: { fontSize: 13, lineHeight: 19 },
  more: { fontSize: 12, fontWeight: '700' },
});
