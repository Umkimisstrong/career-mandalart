// 캘린더 — 달력에서 반복 점검 · 일정 · 완료 기록을 보고, 한 줄 형식으로 일정을 넣는다.
// 일정은 목표와 별개(Store.events). 반복 점검 · 완료 기록은 목표 칸의 routine · log 를 그대로 보여 준다.
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Appear, Tap } from '../components/Motion';
import { alarmLabel, byTime, CalEvent, dateLabel, formatLine, monthDays, newEvent, parseLine, routineOnDay } from '../calendar';
import { buildIcs } from '../ics';
import { Plan } from '../model';
import { exportCalendar, NOTIFY_KIND, requestNotify } from '../notify';
import { dateKey, parseKey, periodKey, routineItems, RoutineItem, routineLabel, WEEKDAYS } from '../routine';
import { useTheme } from '../theme';

type Filter = 'all' | 'routine' | 'event' | 'done';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'routine', label: '🔁 반복 점검' },
  { id: 'event', label: '📌 일정' },
  { id: 'done', label: '✓ 완료 기록' },
];
const EXAMPLES = ['내일 오후 3시 치과 !30분', '11/20 19:00 영어 스터디 ~1시간 !', '다음 주 토요일 이사 준비', '20일 월세 이체 !'];

type Props = {
  plans: Plan[];
  events: CalEvent[];
  notify: boolean;
  onBack: () => void;
  onEvents: (fn: (events: CalEvent[]) => CalEvent[]) => void;
  onToggleRoutine: (planId: string, block: number, cell: number, key: string) => void;
  onOpenBlock: (planId: string, block: number) => void;
  onNotify: (on: boolean) => void;
};

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert('확인', message, [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: onYes },
  ]);
}

export default function CalendarScreen({ plans, events, notify, onBack, onEvents, onToggleRoutine, onOpenBlock, onNotify }: Props) {
  const { t, ui } = useTheme();
  const now = new Date();
  const todayKey = dateKey(now);
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [sel, setSel] = useState(todayKey);
  const [filter, setFilter] = useState<Filter>('all');
  const [line, setLine] = useState('');
  const [editId, setEditId] = useState<string>();
  const [msg, setMsg] = useState('');

  const items = useMemo(() => routineItems(plans, now), [plans]); // eslint-disable-line react-hooks/exhaustive-deps
  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of [...events].sort(byTime)) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [events]);

  // 하루에 보일 것 — 필터에 맞게
  const dayOf = (key: string) => {
    const d = parseKey(key);
    const evs = byDay.get(key) ?? [];
    const rts = items.filter(i => key >= i.routine.start && routineOnDay(i, d))
      .map(i => ({ item: i, key: periodKey(i.routine, d), checked: i.log.includes(periodKey(i.routine, d)) }));
    return {
      events: filter === 'routine' ? [] : filter === 'done' ? evs.filter(e => e.done) : evs,
      routines: filter === 'event' ? [] : filter === 'done' ? rts.filter(r => r.checked) : rts,
      done: evs.filter(e => e.done).length + rts.filter(r => r.checked).length,
    };
  };

  const parsed = line.trim() ? parseLine(line, now) : undefined;
  const target = parsed?.date ?? sel;
  const save = () => {
    if (!parsed?.title) return setMsg('할 일을 적어 주세요. 예) 내일 오후 3시 치과 !30분');
    const p = { ...parsed, date: target };
    onEvents(list => (editId
      ? list.map(e => (e.id === editId ? { ...e, ...p, updatedAt: Date.now() } : e))
      : [...list, newEvent(p)]));
    const d = parseKey(target);
    setSel(target);
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setLine('');
    setEditId(undefined);
    setMsg(p.alarm !== undefined && !notify ? '알림이 꺼져 있어요. 아래 「🔔 알림 켜기」를 누르면 그 시각에 알려 드려요.' : `${dateLabel(target, now)}에 넣었어요.`);
  };
  const edit = (e: CalEvent) => { setEditId(e.id); setLine(formatLine(e)); setMsg(''); };
  const toggleDone = (e: CalEvent) => onEvents(list => list.map(x => (x.id === e.id ? { ...x, done: !x.done, updatedAt: Date.now() } : x)));
  const remove = (e: CalEvent) => confirm(`「${e.title}」 일정을 지울까요?`, () => {
    onEvents(list => list.filter(x => x.id !== e.id));
    if (editId === e.id) { setEditId(undefined); setLine(''); }
  });

  const turnOnNotify = async () => {
    if (!(await requestNotify())) {
      setMsg(NOTIFY_KIND === 'web' ? '브라우저가 알림을 막았어요. 아래 캘린더 파일로 기기 캘린더에 넣어 두세요.' : '설정 앱에서 구도 알림을 허용해 주세요.');
      return;
    }
    onNotify(true);
    setMsg('알림을 켰어요. 일정 시각에 알려 드려요.');
  };
  const saveIcs = async () => {
    const { text, count } = buildIcs(items, now, events);
    if (!count) return setMsg('내보낼 일정이 없어요.');
    await exportCalendar(text);
    setMsg(`${count}개를 캘린더 파일로 만들었어요. iPhone: 다운로드 목록에서 파일을 눌러 「모두 추가」 / PC: 캘린더에서 가져오기`);
  };

  const days = monthDays(month);
  const day = dayOf(sel);
  const selDate = parseKey(sel);
  const future = sel > todayKey;
  const hasAlarm = events.some(e => !e.done && e.alarm !== undefined && e.date >= todayKey);
  const shift = (n: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const card = { backgroundColor: t.surface, borderColor: t.border };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Tap onPress={onBack} shadow={false}><Text style={ui.back}>‹ 목록</Text></Tap>
        <Text style={ui.headerTitle}>캘린더</Text>
        <Tap onPress={() => { setSel(todayKey); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }}
          style={[styles.chip, { borderColor: t.border, backgroundColor: t.bg }]}>
          <Text style={[styles.chipText, { color: t.text }]}>오늘</Text>
        </Tap>
      </View>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={[styles.section, card]}>
          <View style={styles.monthRow}>
            <Tap onPress={() => shift(-1)} hitSlop={8} style={styles.arrow} accessibilityLabel="지난달"><Text style={[styles.arrowText, { color: t.text }]}>‹</Text></Tap>
            <Text style={[styles.month, { color: t.text }, ui.titleFont]}>{month.getFullYear()}년 {month.getMonth() + 1}월</Text>
            <Tap onPress={() => shift(1)} hitSlop={8} style={styles.arrow} accessibilityLabel="다음 달"><Text style={[styles.arrowText, { color: t.text }]}>›</Text></Tap>
          </View>
          <View style={styles.filters}>
            {FILTERS.map(f => {
              const on = filter === f.id;
              return (
                <Tap key={f.id} onPress={() => setFilter(f.id)} shadow={on}
                  style={[styles.chip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
                  <Text style={[styles.chipText, { color: on ? t.onPrimary : t.sub }]}>{f.label}</Text>
                </Tap>
              );
            })}
          </View>
          <View style={styles.grid}>
            {WEEKDAYS.map((w, i) => (
              <Text key={w} style={[styles.head, { color: i === 0 ? t.accent : t.sub }]}>{w}</Text>
            ))}
          </View>
          {/* 달을 넘기면 날짜들이 차례로 다시 튀어 오른다 */}
          <View key={dateKey(month)} style={styles.grid}>
            {days.map((d, i) => {
              const k = dateKey(d);
              const out = d.getMonth() !== month.getMonth();
              const info = dayOf(k);
              const isSel = k === sel;
              const isToday = k === todayKey;
              return (
                <Appear key={k} kind="pop" delay={Math.min(i, 41) * 8} style={styles.cellWrap}>
                  <Tap onPress={() => setSel(k)} hover={1.06} shadow={isSel}
                    style={[styles.cell, {
                      backgroundColor: isSel ? t.primary : 'transparent',
                      borderColor: isToday ? t.accent : 'transparent',
                    }]}
                    accessibilityLabel={`${dateLabel(k, now)} 일정 ${info.events.length} 반복 ${info.routines.length} 완료 ${info.done}`}>
                    <Text style={[styles.dayNum, {
                      color: isSel ? t.onPrimary : d.getDay() === 0 ? t.accent : t.text,
                      opacity: out ? 0.35 : 1, fontWeight: isToday || isSel ? '800' : '600',
                    }]}>{d.getDate()}</Text>
                    <View style={styles.dots}>
                      {info.events.slice(0, 2).map(e => (
                        <View key={e.id} style={[styles.dot, { backgroundColor: isSel ? t.onPrimary : t.accent, opacity: e.done ? 0.4 : out ? 0.4 : 1 }]} />
                      ))}
                      {info.routines.length > 0 && filter !== 'done' && (
                        <View style={[styles.dot, { backgroundColor: isSel ? t.onPrimary : t.primary, opacity: out ? 0.3 : 0.75 }]} />
                      )}
                    </View>
                    {info.done > 0 && (
                      <Text style={[styles.doneNum, { color: isSel ? t.onPrimary : t.doneBorder }]}>✓{info.done}</Text>
                    )}
                  </Tap>
                </Appear>
              );
            })}
          </View>
          <Text style={[styles.meta, { color: t.sub, textAlign: 'center' }]}>
            <Text style={{ color: t.accent }}>●</Text> 일정  <Text style={{ color: t.primary }}>●</Text> 반복 점검  <Text style={{ color: t.doneBorder }}>✓</Text> 완료한 수
          </Text>
        </View>

        <View style={[styles.section, card]}>
          <Text style={[styles.h2, { color: t.text }]}>{dateLabel(sel, now)}</Text>
          {!day.events.length && !day.routines.length && (
            <Text style={[styles.meta, { color: t.sub }]}>
              {filter === 'done' ? '이날 완료한 기록이 없어요.' : '이날은 비어 있어요. 아래에 한 줄로 일정을 넣어 보세요.'}
            </Text>
          )}
          {day.events.map(e => (
            <Appear key={e.id} kind="rise">
              <View style={[styles.row, { borderColor: t.border }]}>
                <Tap onPress={() => toggleDone(e)} shadow={false} hitSlop={8}
                  style={[styles.box, { borderColor: e.done ? t.doneBorder : t.border, backgroundColor: e.done ? t.done : t.surface }]}
                  accessibilityRole="checkbox" accessibilityState={{ checked: !!e.done }} accessibilityLabel={`${e.title} 완료`}>
                  <Text style={{ color: t.doneText, fontWeight: '800' }}>{e.done ? '✓' : ''}</Text>
                </Tap>
                <Tap onPress={() => edit(e)} shadow={false} hover={1} style={{ flex: 1 }} accessibilityLabel={`${e.title} 고치기`}>
                  <Text style={[styles.itemText, { color: t.text }, e.done && styles.struck]}>📌 {e.title}</Text>
                  <Text style={[styles.meta, { color: t.sub }]} numberOfLines={1}>
                    {e.time ?? '하루 종일'}{e.dur ? ` · ${e.dur}` : ''}{e.alarm !== undefined ? ` · 🔔 ${alarmLabel(e.alarm)}` : ''}
                    {editId === e.id ? ' · 고치는 중' : ''}
                  </Text>
                </Tap>
                <Tap onPress={() => remove(e)} shadow={false} hitSlop={8} style={styles.del} accessibilityLabel={`${e.title} 지우기`}>
                  <Text style={{ color: t.sub, fontSize: 16 }}>✕</Text>
                </Tap>
              </View>
            </Appear>
          ))}
          {day.routines.map(({ item, key, checked }) => (
            <RoutineRow key={`${item.planId}-${item.block}-${item.cell}`} item={item} checked={checked} locked={future}
              onToggle={() => onToggleRoutine(item.planId, item.block, item.cell, key)}
              onOpen={() => onOpenBlock(item.planId, item.block)} />
          ))}
          {future && !!day.routines.length && (
            <Text style={[styles.meta, { color: t.sub }]}>반복 점검은 그날이 되면 체크할 수 있어요.</Text>
          )}
        </View>

        <View style={[styles.section, card]}>
          <Text style={[styles.h2, { color: t.text }]}>{editId ? '✏️ 일정 고치기' : '＋ 일정 넣기'}</Text>
          <Text style={[styles.meta, { color: t.sub }]}>
            한 줄로 적어요: <Text style={{ color: t.text, fontWeight: '700' }}>날짜 시간 할 일 ~얼마나 !알림</Text>
            {'\n'}날짜를 빼면 고른 날({selDate.getMonth() + 1}/{selDate.getDate()}), 「!」만 쓰면 그 시각, 「!30분」은 30분 전에 알려요.
          </Text>
          <TextInput
            value={line}
            onChangeText={v => { setLine(v); setMsg(''); }}
            onSubmitEditing={save}
            placeholder="내일 오후 3시 치과 !30분"
            placeholderTextColor={t.sub}
            style={ui.input}
            returnKeyType="done"
            accessibilityLabel="일정 한 줄"
          />
          {parsed && (
            <Appear kind="rise" style={styles.fields}>
              <Field label="날짜" value={dateLabel(target, now)} hint={parsed.date ? undefined : '고른 날'} />
              <Field label="시간" value={parsed.time ?? '하루 종일'} />
              <Field label="할 일" value={parsed.title || '—'} warn={!parsed.title} />
              {!!parsed.dur && <Field label="얼마나" value={parsed.dur} />}
              <Field label="알림" value={parsed.alarm !== undefined ? `🔔 ${alarmLabel(parsed.alarm)}` : '없음'} />
            </Appear>
          )}
          <View style={styles.filters}>
            {EXAMPLES.map(x => (
              <Tap key={x} onPress={() => { setLine(x); setMsg(''); }} shadow={false}
                style={[styles.chip, { borderColor: t.border, backgroundColor: t.bg }]}>
                <Text style={[styles.chipText, { color: t.sub }]}>{x}</Text>
              </Tap>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {editId && (
              <Tap onPress={() => { setEditId(undefined); setLine(''); }} style={[ui.btn, { flex: 1 }]}>
                <Text style={ui.btnText}>취소</Text>
              </Tap>
            )}
            <Tap onPress={save} disabled={!parsed?.title} style={[ui.btnPrimary, { flex: 2, opacity: parsed?.title ? 1 : 0.45 }]}>
              <Text style={ui.btnPrimaryText}>{editId ? '고친 대로 저장' : `${dateLabel(target, now).split(' (')[0]}에 넣기`}</Text>
            </Tap>
          </View>
          {!!msg && <Text style={[styles.meta, { color: t.accent }]}>{msg}</Text>}
        </View>

        <View style={[styles.section, card]}>
          <Text style={[styles.h2, { color: t.text }]}>🔔 일정 알림</Text>
          <Text style={[styles.meta, { color: t.sub }]}>
            {NOTIFY_KIND === 'native'
              ? '「!」를 붙인 일정은 정한 시각에 휴대폰 알림으로 알려요. 끝낸 일정은 울리지 않아요.'
              : '「!」를 붙인 일정은 앱이 열려 있는 동안 알림으로 알려요 (Windows 앱은 Windows 알림). 앱을 닫아도 울리게 하려면 캘린더 파일로 기기 캘린더에 넣어 두세요.'}
          </Text>
          {!notify && hasAlarm && (
            <Tap onPress={turnOnNotify} style={ui.btnPrimary}><Text style={ui.btnPrimaryText}>🔔 알림 켜기</Text></Tap>
          )}
          {notify && <Text style={[styles.meta, { color: t.primary, fontWeight: '700' }]}>알림 켜짐 · 끄기는 「오늘의 점검」에서</Text>}
          {NOTIFY_KIND === 'web' && (
            <Tap onPress={saveIcs} style={ui.btn}><Text style={ui.btnText}>📅 캘린더 파일로 내보내기 (.ics)</Text></Tap>
          )}
        </View>
      </ScrollView>
    </View>
  );

  function Field({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
    return (
      <View style={[styles.field, { borderColor: warn ? t.accent : t.border, backgroundColor: t.bg }]}>
        <Text style={[styles.fieldLabel, { color: t.sub }]}>{label}{hint ? ` · ${hint}` : ''}</Text>
        <Text style={[styles.fieldValue, { color: warn ? t.accent : t.text }]} numberOfLines={1}>{value}</Text>
      </View>
    );
  }

  function RoutineRow({ item, checked, locked, onToggle, onOpen }: { item: RoutineItem; checked: boolean; locked: boolean; onToggle: () => void; onOpen: () => void }) {
    return (
      <View style={[styles.row, { borderColor: t.border }]}>
        <Tap onPress={onToggle} disabled={locked} shadow={false} hitSlop={8}
          style={[styles.box, { borderColor: checked ? t.doneBorder : t.border, backgroundColor: checked ? t.done : t.surface, opacity: locked ? 0.4 : 1 }]}
          accessibilityRole="checkbox" accessibilityState={{ checked, disabled: locked }} accessibilityLabel={`${item.text} 점검`}>
          <Text style={{ color: t.doneText, fontWeight: '800' }}>{checked ? '✓' : ''}</Text>
        </Tap>
        <Tap onPress={onOpen} shadow={false} hover={1} style={{ flex: 1 }}>
          <Text style={[styles.itemText, { color: t.text }, checked && styles.struck]}>🔁 {item.text}</Text>
          <Text style={[styles.meta, { color: t.sub }]} numberOfLines={1}>{routineLabel(item.routine)} · {item.goal}</Text>
        </Tap>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { borderWidth: 1, borderRadius: 22, padding: 12, gap: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 19, fontWeight: '800' },
  arrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 24, fontWeight: '700', marginTop: -2 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  head: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '700', paddingVertical: 2 },
  cellWrap: { width: `${100 / 7}%`, padding: 2 },
  cell: { height: 54, borderRadius: 14, borderWidth: 2, alignItems: 'center', paddingTop: 4, gap: 3 },
  dayNum: { fontSize: 14 },
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  doneNum: { fontSize: 10, fontWeight: '800' },
  h2: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  box: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  del: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 15, fontWeight: '600' },
  struck: { opacity: 0.55, textDecorationLine: 'line-through' },
  meta: { fontSize: 12, lineHeight: 18 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  field: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, minWidth: 90, flexGrow: 1 },
  fieldLabel: { fontSize: 10.5, fontWeight: '700' },
  fieldValue: { fontSize: 14, fontWeight: '700' },
});
