// 오늘의 점검 — 반복 점검 칸을 기간(오늘 · 이번 주 · 이번 달)마다 체크하고, 쌓인 기록으로 나를 점검한다.
// "내가 기록하고, 기록이 나를 제어한다": 놓친 것 · 연속 기록 · 최근 달성률 · 28일 잔디를 한 화면에.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { buildIcs } from '../ics';
import { Plan } from '../model';
import { exportCalendar, notifyGranted, NOTIFY_KIND, requestNotify } from '../notify';
import { addDays, dateKey, dayGrid, parseKey, routineItems, RoutineItem, routineLabel, Scope, SCOPE_LABEL, WEEKDAYS } from '../routine';
import { useTheme } from '../theme';

type Props = {
  plans: Plan[];
  notify: boolean;
  onBack: () => void;
  onToggle: (planId: string, block: number, cell: number, key: string) => void;
  onOpenBlock: (planId: string, block: number) => void;
  onNotify: (on: boolean) => void;
};

const SCOPES: Scope[] = ['day', 'week', 'month'];
// 놓친 기간 이름 — 하루 단위는 어제가 아닐 수 있다 (요일 지정: 지난 금요일 등)
function prevLabel(item: RoutineItem, now: Date): string {
  if (item.scope === 'week') return '지난주';
  if (item.scope === 'month') return '지난달';
  const k = item.stats.prevKey!;
  if (k === dateKey(addDays(now, -1))) return '어제';
  const d = parseKey(k);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}
const pct = (r: number) => `${Math.round(r * 100)}%`;

export default function Today({ plans, notify, onBack, onToggle, onOpenBlock, onNotify }: Props) {
  const { t, ui } = useTheme();
  const [granted, setGranted] = useState<boolean | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { notifyGranted().then(setGranted); }, [notify]);

  const now = new Date();
  const items = routineItems(plans, now);
  const grid = dayGrid(plans, now, 28);
  const missed = items.filter(i => i.stats.missedPrev);
  const due = (s: Scope) => items.filter(i => i.scope === s && i.dueToday);
  const today = due('day');
  const todayDone = today.filter(i => i.stats.checked).length;
  const gridDue = grid.reduce((a, g) => a + g.due, 0);
  const gridDone = grid.reduce((a, g) => a + g.done, 0);
  const best = items.reduce((a, i) => Math.max(a, i.stats.streak), 0);
  const restDay = items.filter(i => i.scope === 'day' && !i.dueToday);
  const card = { backgroundColor: t.surface, borderColor: t.border };

  const toggleNotify = async (on: boolean) => {
    if (on && !(await requestNotify())) {
      setMsg(NOTIFY_KIND === 'web' ? '브라우저가 알림을 막았어요. 아래 캘린더 등록을 쓰세요.' : '설정 앱에서 구도 알림을 허용해 주세요.');
      setGranted(false);
      onNotify(false);
      return;
    }
    setMsg('');
    setGranted(on || granted);
    onNotify(on);
  };

  const saveIcs = async () => {
    const { text, count } = buildIcs(items);
    if (!count) return setMsg('알림 시각을 정한 칸이 없어요. 칸 편집 창 ⑤에서 알림 시각을 고르세요.');
    await exportCalendar(text);
    setMsg(`${count}개 일정 파일을 만들었어요. iPhone: 다운로드 목록에서 파일을 눌러 「모두 추가」 / PC: 캘린더에서 가져오기`);
  };

  const Row = ({ item, late }: { item: RoutineItem; late?: boolean }) => {
    const key = late ? item.stats.prevKey! : item.stats.key;
    const on = late ? false : item.stats.checked;
    return (
      <View style={[styles.row, { borderColor: t.border }]}>
        <Pressable
          onPress={() => onToggle(item.planId, item.block, item.cell, key)}
          style={[styles.box, { borderColor: on ? t.doneBorder : t.border, backgroundColor: on ? t.done : t.surface }]}
          accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={item.text}
          hitSlop={8}
        >
          <Text style={{ color: t.doneText, fontWeight: '800' }}>{on ? '✓' : ''}</Text>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onOpenBlock(item.planId, item.block)}>
          <Text style={[styles.itemText, { color: t.text }, on && { opacity: 0.55, textDecorationLine: 'line-through' }]}>{item.text}</Text>
          <Text style={[styles.meta, { color: t.sub }]} numberOfLines={1}>
            {late ? `${prevLabel(item, now)} 기록 남기기 · ` : ''}{routineLabel(item.routine)}
            {item.stats.streak > 0 ? ` · 🔥 ${item.stats.streak}연속` : ''}
            {item.stats.total ? ` · 최근 ${pct(item.stats.rate)}` : ''} · {item.goal}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>오늘의 점검</Text>
      </View>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={[styles.date, { color: t.sub }]}>
          {now.getMonth() + 1}월 {now.getDate()}일 ({WEEKDAYS[now.getDay()]}) · 내가 기록하고, 기록이 나를 이끈다
        </Text>

        {!items.length ? (
          <View style={[styles.box2, card]}>
            <Text style={[styles.h2, { color: t.text }]}>아직 반복 점검할 칸이 없어요</Text>
            <Text style={[ui.sub]}>청사진 → 블록 → 실행 과제 칸을 열고 「⑤ 반복 점검 · 알림」에서 매일 · 요일 · 매주 · 매월을 고르세요.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.stats, card]}>
              <Stat label="오늘" value={`${todayDone}/${today.length}`} big color={t.text} sub={t.sub} />
              <Stat label="최근 28일" value={gridDue ? pct(gridDone / gridDue) : '–'} color={t.text} sub={t.sub} />
              <Stat label="최고 연속" value={`🔥 ${best}`} color={t.text} sub={t.sub} />
              <Stat label="놓친 것" value={String(missed.length)} color={missed.length ? t.accent : t.text} sub={t.sub} />
            </View>
            {!!today.length && (
              <View style={ui.bar}><View style={[ui.barFill, { width: `${Math.round((todayDone / today.length) * 100)}%` }]} /></View>
            )}

            {!!missed.length && (
              <View style={[styles.section, { borderColor: t.accent }]}>
                <Text style={[styles.h2, { color: t.accent }]}>⚠ 놓친 기록 {missed.length}</Text>
                <Text style={[styles.meta, { color: t.sub }]}>실제로 했다면 지금 남기세요. 하지 않았다면 그대로 두는 것도 기록입니다.</Text>
                {missed.map(i => <Row key={`m-${i.planId}-${i.block}-${i.cell}`} item={i} late />)}
              </View>
            )}

            {SCOPES.map(s => {
              const list = due(s);
              if (!list.length) return null;
              const done = list.filter(i => i.stats.checked).length;
              return (
                <View key={s} style={[styles.section, { borderColor: t.border }]}>
                  <Text style={[styles.h2, { color: t.text }]}>{SCOPE_LABEL[s]} <Text style={{ color: t.sub, fontWeight: '400' }}>{done}/{list.length}</Text></Text>
                  {list.map(i => <Row key={`${s}-${i.planId}-${i.block}-${i.cell}`} item={i} />)}
                </View>
              );
            })}
            {!!restDay.length && (
              <Text style={[styles.meta, { color: t.sub }]}>오늘은 쉬는 요일: {restDay.map(i => i.text).join(' · ')}</Text>
            )}

            <View style={[styles.section, { borderColor: t.border }]}>
              <Text style={[styles.h2, { color: t.text }]}>최근 28일 <Text style={{ color: t.sub, fontWeight: '400' }}>매일 · 요일 점검</Text></Text>
              <View style={styles.grid}>
                {WEEKDAYS.map((w, i) => (
                  <Text key={w} style={[styles.gridHead, { color: t.sub }]}>{WEEKDAYS[(grid[0].day + i) % 7]}</Text>
                ))}
                {grid.map(g => {
                  const r = g.due ? g.done / g.due : 0;
                  return (
                    <View
                      key={g.key}
                      style={[styles.gridCell, { borderColor: t.border, backgroundColor: g.due ? (r ? t.primary : t.surface) : 'transparent', opacity: g.due ? 0.25 + 0.75 * r : 1 }]}
                      accessibilityLabel={`${g.key} ${g.done}/${g.due}`}
                    >
                      {g.due > 0 && r === 0 && <Text style={{ color: t.accent, fontSize: 10 }}>·</Text>}
                    </View>
                  );
                })}
              </View>
              <Text style={[styles.meta, { color: t.sub }]}>진할수록 그날 많이 지켰어요 · 빨간 점은 하나도 못 한 날</Text>
            </View>
          </>
        )}

        <View style={[styles.section, { borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.h2, { color: t.text, flex: 1 }]}>🔔 알림</Text>
            <Switch value={notify && granted !== false} onValueChange={toggleNotify} />
          </View>
          <Text style={[styles.meta, { color: t.sub }]}>
            {NOTIFY_KIND === 'native'
              ? '칸에 정한 알림 시각에 휴대폰 알림을 보냅니다. 이미 체크한 기간에는 울리지 않아요. 앞으로 5주치를 예약하니 가끔 앱을 열어 주세요.'
              : '웹 앱은 닫혀 있을 때 알림을 보낼 수 없어요. 켜 두면 앱이 열려 있는 동안 알림을 보내고, 홈 화면 아이콘에 오늘 남은 개수를 표시합니다(지원 기기만). 앱을 닫아도 울리게 하려면 아래 캘린더 등록을 쓰세요.'}
          </Text>
          {NOTIFY_KIND === 'web' && (
            <Pressable style={ui.btn} onPress={saveIcs}>
              <Text style={ui.btnText}>📅 캘린더에 알림 등록 (.ics 파일)</Text>
            </Pressable>
          )}
          {!!msg && <Text style={[styles.meta, { color: t.accent }]}>{msg}</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, big, color, sub }: { label: string; value: string; big?: boolean; color: string; sub: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ color, fontSize: big ? 22 : 17, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: sub, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  date: { fontSize: 13 },
  box2: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  stats: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, paddingVertical: 14 },
  section: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  h2: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth },
  box: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: 7 * 36 + 6 * 4, alignSelf: 'center' },
  gridHead: { width: 36, textAlign: 'center', fontSize: 11 },
  gridCell: { width: 36, height: 28, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
