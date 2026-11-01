// 칸 편집 창 안의 목표 카테고리 선택기 (3단계).
//  - 핵심 · 세부 목표 칸 : 1레벨 카테고리 (매슬로우 단계별)
//  - 실행 과제 칸        : 2레벨 세부 카테고리 → 3레벨 행동 → 단위(시간 · 장소 · 수량)
//    블록 카테고리의 세부 카테고리가 기본으로 안내되고, 다른 카테고리 탭으로 바꿀 수 있다.
//    직접 쓴 행동은 그 카테고리에 추가해 다음에 다시 고를 수 있다 (Store.custom).
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  AGE_BANDS, AgeBand, CATEGORIES, categoryById, MASLOW, MaslowLevel,
} from '../categories/data';
import { rankSubs, subById } from '../categories/tree';
import { QTY_MAX, QTY_UNITS, UNIT_GROUPS, UnitField } from '../categories/units';
import type { ActionSpec } from '../model';
import { useTheme } from '../theme';
import WEIGHTS from '../categories/keywordWeights.json';

// 키워드 자산(keyword-assets) 기반: 카테고리를 이야기한 글의 비율(%) — 연령대를 고르면 그 연령대 기준
// 수집 자료에 없는 연령대(10대 · 60대 이상)는 전체 비율을 쓴다
const weightOf = (id: string, age?: AgeBand) =>
  (age && (WEIGHTS.byAge as Record<string, Record<string, number>>)[age]?.[id]) ?? (WEIGHTS.total as Record<string, number>)[id] ?? 0;
const keywordsOf = (id: string) => (WEIGHTS.keywords as Record<string, string[]>)[id] ?? [];

const LEVELS = Object.keys(MASLOW).map(Number) as MaslowLevel[];

function useChip() {
  const { t } = useTheme();
  const base = { backgroundColor: t.surface, borderColor: t.border };
  const on = { backgroundColor: t.primary, borderColor: t.primary };
  return {
    t,
    box: (sel: boolean) => (sel ? on : base),
    text: (sel: boolean) => (sel ? { color: t.onPrimary, fontWeight: '700' as const } : { color: t.text }),
  };
}

export function GoalCategoryPicker({ selected, onSelect }: {
  selected?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const { t, box, text } = useChip();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[styles.title, { color: t.text }]}>① 목표 카테고리</Text>
      {LEVELS.map(level => (
        <View key={level} style={styles.levelRow}>
          <Text style={[styles.level, { color: t.sub }]}>{level} {MASLOW[level].label}</Text>
          <View style={[styles.wrap, { flex: 1 }]}>
            {CATEGORIES.filter(c => c.maslow === level).map(c => {
              const sel = c.id === selected;
              return (
                <Pressable key={c.id} onPress={() => onSelect(sel ? undefined : c.id)} style={[styles.chip, box(sel)]}>
                  <Text style={[styles.chipText, text(sel)]}>{c.emoji} {c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

export function ActionBuilder({ spec, blockCat, typed, age, custom, onAge, onChange, onAddCustom }: {
  spec: ActionSpec;
  blockCat?: string;
  typed: string; // 직접 입력한 행동 (카테고리에 추가 버튼용)
  age?: AgeBand;
  custom: Record<string, string[]>;
  onAge: (age: AgeBand | undefined) => void;
  onChange: (spec: ActionSpec) => void;
  onAddCustom: (catId: string, label: string) => void;
}) {
  const { t, box, text } = useChip();
  const catId = spec.cat ?? blockCat ?? CATEGORIES[0].id;
  const cat = categoryById(catId) ?? CATEGORIES[0];
  const subs = rankSubs(cat.id, age);
  const sub = subById(cat.id, spec.sub);
  const mine = custom[cat.id] ?? [];
  const set = (patch: Partial<ActionSpec>) => onChange({ ...spec, ...patch });

  // 블록 카테고리를 맨 앞에, 나머지는 사람들이 많이 이야기한 순서로
  const tabs = [...CATEGORIES].sort((a, b) =>
    Number(b.id === blockCat) - Number(a.id === blockCat) || weightOf(b.id, age) - weightOf(a.id, age));
  const words = keywordsOf(cat.id);
  const pct = Math.round(weightOf(cat.id, age));
  const rec = (ages?: AgeBand[]) => !!age && !!ages?.includes(age);

  const act = sub?.acts.find(a => a.label === spec.act);
  const pickAct = (label: string, unit?: string) => {
    const sel = spec.act === label;
    const qty = spec.qty?.length ? spec.qty : unit ? [{ n: '', unit }] : undefined;
    set({ act: sel ? undefined : label, qty: sel ? spec.qty : qty });
  };
  const trimmed = typed.trim();
  const canAdd = !!trimmed && !mine.includes(trimmed) && !sub?.acts.some(a => a.label === trimmed);

  return (
    <View style={{ gap: 12 }}>
      {/* 2레벨: 세부 카테고리 */}
      <Text style={[styles.title, { color: t.text }]}>① 세부 카테고리</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 6, alignItems: 'flex-start' }}>
        {tabs.map(c => {
          const sel = c.id === cat.id;
          return (
            <Pressable key={c.id} onPress={() => onChange({ ...spec, cat: c.id, sub: undefined, act: undefined })}
              style={[styles.chip, box(sel)]}>
              <Text style={[styles.chipText, text(sel)]}>{c.emoji} {c.label}{c.id === blockCat ? ' · 이 블록' : ''}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.wrap, { alignItems: 'center' }]}>
        <Text style={[styles.small, { color: t.sub }]}>내 연령대</Text>
        {AGE_BANDS.map(a => {
          const sel = a.id === age;
          return (
            <Pressable key={a.id} onPress={() => onAge(sel ? undefined : a.id)} style={[styles.ageChip, box(sel)]}>
              <Text style={[styles.ageText, text(sel)]}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {!!age && !!cat.ageNotes?.[age] && <Text style={[styles.small, { color: t.sub }]}>💡 {cat.ageNotes[age]}</Text>}
      {words.length > 0 && (
        <Text style={[styles.small, { color: t.sub }]}>
          🔎 {age ? `${AGE_BANDS.find(a => a.id === age)?.label} 글의 ${pct}%` : `목표 이야기의 ${pct}%`}가 이 영역을 언급 · 자주 쓴 말: {words.join(' · ')}
        </Text>
      )}

      <View style={styles.wrap}>
        {subs.map(s => {
          const sel = s.id === sub?.id;
          return (
            <Pressable key={s.id} onPress={() => set({ cat: cat.id, sub: sel ? undefined : s.id, act: undefined })}
              style={[styles.chip, box(sel), !sel && rec(s.ages) && { borderColor: t.primary }]}>
              <Text style={[styles.chipText, text(sel)]}>
                {rec(s.ages) ? '★ ' : ''}{s.label}{s.kw?.length ? ' 🔎' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 3레벨: 행동 */}
      <Text style={[styles.title, { color: t.text }]}>② 행동{sub ? ` — ${sub.label}` : ''}</Text>
      {!sub && mine.length === 0 && <Text style={[styles.small, { color: t.sub }]}>세부 카테고리를 고르면 행동이 나옵니다.</Text>}
      <View style={styles.wrap}>
        {sub?.acts.map(a => {
          const sel = a.label === spec.act;
          return (
            <Pressable key={a.label} onPress={() => pickAct(a.label, a.unit)} style={[styles.item, box(sel)]}>
              <Text style={[styles.chipText, text(sel)]}>{a.label}</Text>
            </Pressable>
          );
        })}
        {mine.map(label => {
          const sel = label === spec.act;
          return (
            <Pressable key={`mine-${label}`} onPress={() => pickAct(label)}
              style={[styles.item, box(sel), !sel && { borderColor: t.done, borderStyle: 'dashed' }]}>
              <Text style={[styles.chipText, text(sel)]}>✎ {label}</Text>
            </Pressable>
          );
        })}
      </View>
      {canAdd && (
        <Pressable onPress={() => onAddCustom(cat.id, trimmed)} style={[styles.add, { borderColor: t.border }]}>
          <Text style={[styles.small, { color: t.text, textAlign: 'center' }]}>+ 「{trimmed}」을(를) {cat.emoji} {cat.label} 행동에 추가</Text>
        </Pressable>
      )}

      {/* 단위: 시간 · 장소 · 수량 — 원하는 것만 */}
      <Text style={[styles.title, { color: t.text }]}>③ 단위 <Text style={[styles.small, { color: t.sub }]}>원하는 것만 고르세요</Text></Text>
      {UNIT_GROUPS.map(g => (
        <View key={g.id} style={[styles.group, { borderColor: t.border }]}>
          <Text style={[styles.groupTitle, { color: t.text }]}>{g.icon} {g.label}</Text>
          {g.fields.map(f => (
            <UnitRow key={f.id} label={f.label} options={f.options} value={spec[f.id]}
              onChange={v => set({ [f.id]: v } as Partial<Record<UnitField, string>>)} />
          ))}
        </View>
      ))}
      <View style={[styles.group, { borderColor: t.border }]}>
        <Text style={[styles.groupTitle, { color: t.text }]}>🔢 수량</Text>
        {(spec.qty ?? []).map((q, i) => (
          <View key={i} style={{ gap: 6 }}>
            <View style={[styles.wrap, { alignItems: 'center' }]}>
              <TextInput
                value={q.n} keyboardType="numeric" placeholder="몇"
                onChangeText={n => set({ qty: spec.qty!.map((x, j) => (j === i ? { ...x, n } : x)) })}
                style={[styles.num, { borderColor: t.border, color: t.text, backgroundColor: t.surface }]}
                placeholderTextColor={t.sub}
              />
              <Text style={[styles.chipText, { color: t.text, fontWeight: '700' }]}>{q.unit}</Text>
              <Pressable onPress={() => set({ qty: spec.qty!.filter((_, j) => j !== i) })} hitSlop={8}>
                <Text style={[styles.small, { color: t.sub }]}>✕ 빼기</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}
              contentContainerStyle={{ gap: 4 }}>
              {QTY_UNITS.map(u => (
                <Pressable key={u} onPress={() => set({ qty: spec.qty!.map((x, j) => (j === i ? { ...x, unit: u } : x)) })}
                  style={[styles.ageChip, box(u === q.unit)]}>
                  <Text style={[styles.ageText, text(u === q.unit)]}>{u}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ))}
        {(spec.qty?.length ?? 0) < QTY_MAX && (
          <Pressable onPress={() => set({ qty: [...(spec.qty ?? []), { n: '', unit: act?.unit ?? '회' }] })}>
            <Text style={[styles.small, { color: t.accent, fontWeight: '700' }]}>+ 수량 추가 (몇 일 · 몇 개 · 몇 회 · 몇 차 …)</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// 추천값 칩 + 직접 입력. 같은 칩을 다시 누르면 해제.
function UnitRow({ label, options, value, onChange }: {
  label: string; options: string[]; value?: string; onChange: (v: string | undefined) => void;
}) {
  const { t, box, text } = useChip();
  const isCustom = !!value && !options.includes(value);
  const [typing, setTyping] = useState(isCustom);
  return (
    <View style={styles.unitRow}>
      <Text style={[styles.unitLabel, { color: t.sub }]}>{label}</Text>
      <View style={{ flex: 1, gap: 6 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 4 }}>
          {options.map(o => (
            <Pressable key={o} onPress={() => { setTyping(false); onChange(value === o ? undefined : o); }}
              style={[styles.ageChip, box(value === o)]}>
              <Text style={[styles.ageText, text(value === o)]}>{o}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setTyping(!typing)} style={[styles.ageChip, box(typing)]}>
            <Text style={[styles.ageText, text(typing)]}>✎ 직접</Text>
          </Pressable>
        </ScrollView>
        {typing && (
          <TextInput
            value={isCustom ? value : ''} onChangeText={v => onChange(v || undefined)}
            placeholder={`${label} 직접 입력`} placeholderTextColor={t.sub}
            style={[styles.unitInput, { borderColor: t.border, color: t.text, backgroundColor: t.surface }]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 13, fontWeight: '800' },
  small: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  levelRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  level: { width: 64, fontSize: 11, paddingTop: 7 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13 },
  item: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  ageChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  ageText: { fontSize: 12 },
  add: { padding: 10, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed' },
  group: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  groupTitle: { fontSize: 13, fontWeight: '700' },
  unitRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  unitLabel: { width: 52, fontSize: 12, paddingTop: 5 },
  unitInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
  num: { width: 72, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, textAlign: 'center' },
});
