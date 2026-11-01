// 칸 편집 창의 ⑤ 반복 점검 · 알림 — 주기(매일 · 요일 · 매주 · 매월)와 알림 시각을 고른다.
import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Freq, Routine } from '../model';
import { dateKey, FREQ_LABEL, routineLabel, suggestRoutine, WEEKDAYS } from '../routine';
import { useChip } from './CategoryPicker';

const FREQS: (Freq | null)[] = [null, 'daily', 'weekdays', 'weekly', 'monthly'];
const TIMES = ['07:00', '08:00', '12:00', '18:00', '21:00', '22:00'];
const MONTH_DAYS = [1, 5, 10, 15, 20, 25];
const isTime = (s: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(s);

export default function RoutinePicker({ routine, when, onChange }: {
  routine?: Routine;
  when?: string; // 칸의 「언제」 단위 — 추천에 쓴다
  onChange: (r: Routine | undefined) => void;
}) {
  const { t, box, text } = useChip();
  const [typedTime, setTypedTime] = useState('');
  const suggest = routine ? undefined : suggestRoutine(when);

  const pickFreq = (f: Freq | null) => {
    if (!f) return onChange(undefined);
    const today = new Date();
    const days = f === 'weekdays' ? [1, 3, 5] : f === 'weekly' ? [today.getDay()] : f === 'monthly' ? [1] : undefined;
    onChange({ freq: f, days, time: routine?.time, start: routine?.start ?? dateKey(today) });
  };
  const set = (patch: Partial<Routine>) => routine && onChange({ ...routine, ...patch });
  const toggleDay = (d: number) => {
    const cur = routine?.days ?? [];
    const next = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort();
    if (next.length) set({ days: next });
  };

  const chip = (key: string | number, label: string, sel: boolean, onPress: () => void) => (
    <Pressable key={key} onPress={onPress} style={[styles.chip, box(sel)]}>
      <Text style={[styles.chipText, text(sel)]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.group, { borderColor: t.border }]}>
      <Text style={[styles.title, { color: t.text }]}>
        ⑤ 반복 점검 · 알림 <Text style={[styles.small, { color: t.sub }]}>주기마다 「오늘의 점검」에 올라오고 기록이 쌓입니다</Text>
      </Text>
      {suggest && (
        <Pressable onPress={() => onChange(suggest)} style={[styles.suggest, { borderColor: t.primary }]}>
          <Text style={{ color: t.primary, fontSize: 13, fontWeight: '700' }}>💡 「{when}」에 맞춰 {routineLabel(suggest)} 점검하기</Text>
        </Pressable>
      )}
      <View style={styles.wrap}>
        {FREQS.map(f => chip(f ?? 'none', f ? FREQ_LABEL[f] : '안 함', (routine?.freq ?? null) === f, () => pickFreq(f)))}
      </View>

      {routine?.freq === 'weekdays' && (
        <Row label="요일" color={t.sub}>
          {WEEKDAYS.map((w, d) => chip(d, w, !!routine.days?.includes(d), () => toggleDay(d)))}
        </Row>
      )}
      {routine?.freq === 'weekly' && (
        <Row label="알림 요일" color={t.sub}>
          {WEEKDAYS.map((w, d) => chip(d, w, routine.days?.[0] === d, () => set({ days: [d] })))}
        </Row>
      )}
      {routine?.freq === 'monthly' && (
        <Row label="알림 날짜" color={t.sub}>
          {MONTH_DAYS.map(d => chip(d, `${d}일`, routine.days?.[0] === d, () => set({ days: [d] })))}
          <TextInput
            keyboardType="number-pad" maxLength={2} placeholder="직접"
            value={routine.days?.[0] && !MONTH_DAYS.includes(routine.days[0]) ? String(routine.days[0]) : ''}
            onChangeText={s => { const n = Number(s); if (n >= 1 && n <= 31) set({ days: [n] }); }}
            style={[styles.input, { borderColor: t.border, color: t.text, width: 56 }]}
            placeholderTextColor={t.sub}
          />
        </Row>
      )}
      {routine && (
        <Row label="알림 시각" color={t.sub}>
          {chip('none', '알림 없음', !routine.time, () => set({ time: undefined }))}
          {TIMES.map(tm => chip(tm, tm, routine.time === tm, () => set({ time: tm })))}
          <TextInput
            value={typedTime || (routine.time && !TIMES.includes(routine.time) ? routine.time : '')}
            onChangeText={s => { setTypedTime(s); if (isTime(s)) set({ time: s.padStart(5, '0') }); }}
            placeholder="06:30" maxLength={5}
            style={[styles.input, { borderColor: t.border, color: t.text, width: 68 }]}
            placeholderTextColor={t.sub}
          />
        </Row>
      )}
      {routine && (
        <Text style={[styles.small, { color: t.sub }]}>
          {routineLabel(routine)} · {routine.start} 부터 기록
          {routine.freq === 'monthly' && routine.days?.[0] && routine.days[0] > 28 ? ' · 그 날짜가 없는 달은 알림이 없을 수 있어요' : ''}
        </Text>
      )}
    </View>
  );
}

function Row({ label, color, children }: { label: string; color: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      <View style={[styles.wrap, { flex: 1 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 8 },
  title: { fontSize: 13, fontWeight: '800' },
  small: { fontSize: 12, lineHeight: 18, fontWeight: '400' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  rowLabel: { width: 56, fontSize: 12, paddingTop: 7 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, textAlign: 'center' },
  suggest: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 10 },
});
