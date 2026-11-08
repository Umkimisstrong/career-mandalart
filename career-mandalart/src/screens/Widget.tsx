// 바탕화면에 띄워 두는 작은 창 — 목표 하나의 가운데 묶음(핵심 목표 + 세부 목표)을 그 크기 모양대로 보여 준다.
// 오늘 해야 할 반복 점검이 남은 세부 목표 칸은 천천히 깜빡인다. 칸을 누르면 이 창 안에서 그 칸의 실행 과제를 펼친다
// (핵심 목표 칸 = 오늘 할 일 모음). 펼친 목록의 줄을 누르면 체크 — 반복 점검은 이번 기간 체크, 그 밖은 완료.
// 큰 창과 같은 저장소를 쓰고, 서로 저장하면 storage 이벤트로 바로 따라 바뀐다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { categoryById } from '../categories/data';
import { layoutBlock } from '../components/ShapeLayout';
import { desktop } from '../desktop';
import { cellsOf, CENTER, getCell, Plan, progress, setCell, sizeOf, Store } from '../model';
import { periodKey, RoutineItem, routineItems, routineLabel, Scope, toggleKey } from '../routine';
import { loadStore, saveStore, STORE_KEY } from '../storage';
import { buildTheme, ThemeProvider, useTheme } from '../theme';

const CELL = 76;
const GAP = 5;
const PAD = 10;
const DETAIL_W = 280;
// 펼친 목록이 길면 이 높이에서 스크롤 (data-nodrag = 데스크톱 앱에서 끌기 대신 스크롤)
const LIST_MAX = 380;
const NODRAG = { dataSet: { nodrag: '1' } } as object;

export default function WidgetApp({ id }: { id: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [now, setNow] = useState(() => new Date());
  const theme = useMemo(() => buildTheme(store?.theme), [store?.theme]);

  useEffect(() => {
    const reload = () => loadStore().then(setStore);
    reload();
    // 큰 창이 저장하면 같은 저장소를 쓰는 이 창에 storage 이벤트가 온다
    const onStorage = (e: StorageEvent) => { if (e.key === STORE_KEY) reload(); };
    window.addEventListener('storage', onStorage);
    // 날짜가 바뀌거나 놓친 이벤트가 있어도 1분마다 다시 맞춘다
    const timer = setInterval(() => { setNow(new Date()); reload(); }, 60_000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(timer); };
  }, []);

  // 줄 하나 체크 — 큰 창이 그 사이 저장했을 수 있으니 저장소에서 새로 읽어 고친다
  const toggle = async (b: number, c: number) => {
    const s = await loadStore();
    const p = s.plans.find(x => x.id === id);
    if (!p) return;
    const cell = getCell(p, b, c);
    const patch = cell.routine && !cell.done
      ? { log: toggleKey(cell.log, periodKey(cell.routine, new Date())) }
      : { done: !cell.done };
    const next = { ...s, plans: s.plans.map(x => (x.id === id ? setCell(p, b, c, patch) : x)) };
    await saveStore(next);
    setStore(next);
  };

  const plan = store?.plans.find(p => p.id === id);
  return (
    <ThemeProvider value={theme}>
      {plan ? <WidgetBody plan={plan} now={now} onToggle={toggle} /> : <Missing loaded={!!store} />}
    </ThemeProvider>
  );
}

// 창 크기를 내용에 맞춘다 — 내용이 바뀔 때마다 실제 크기를 재서 데스크톱 앱에 알린다
const fit = (e: LayoutChangeEvent) => {
  const { width, height } = e.nativeEvent.layout;
  desktop?.resize(Math.ceil(width), Math.ceil(height));
};

// 세부 목표 문장을 칸에 맞게 줄인다: 「건강 · 체력과 비주얼 관리」 → 「건강」, 「수익 엔진 ① 구도 앱 (1순위)」 → 「구도 앱」
const short = (text: string) =>
  text.split(' · ')[0].replace(/^.*?[①-⑳]\s*/, '').replace(/\s*\([^)]*\)/g, '').trim() || text;

function Missing({ loaded }: { loaded: boolean }) {
  const { t } = useTheme();
  return (
    <View onLayout={fit} style={[styles.shell, { backgroundColor: t.surface, borderColor: t.border, width: 200 }]}>
      <Text style={{ color: t.sub, fontSize: 12, textAlign: 'center', paddingVertical: 18 }}>{loaded ? '목표를 찾을 수 없어요' : '불러오는 중…'}</Text>
    </View>
  );
}

function WidgetBody({ plan, now, onToggle }: { plan: Plan; now: Date; onToggle: (b: number, c: number) => void }) {
  const { t } = useTheme();
  const size = sizeOf(plan);
  // 펼친 칸 — null = 모양 그대로, CENTER = 오늘 할 일 모음, 그 밖 = 그 세부 목표의 실행 과제
  const [open, setOpen] = useState<number | null>(null);
  const all = routineItems([plan], now);
  const todo = all.filter(i => i.dueToday && !i.stats.checked);
  const missed = all.filter(i => i.stats.missedPrev).length;

  return (
    <View onLayout={fit} style={[styles.shell, { backgroundColor: t.surface, borderColor: t.border }, open !== null && { width: DETAIL_W }]}>
      {open === null
        ? <Grid plan={plan} todo={todo} missed={missed} onOpen={c => (size === 1 ? desktop?.open(plan.id, null) : setOpen(c))} />
        : open === CENTER
          ? <Today plan={plan} all={all} onToggle={onToggle} onBack={() => setOpen(null)} />
          : <Detail plan={plan} block={open} all={all} onToggle={onToggle} onBack={() => setOpen(null)} />}
      {/* 펼친 화면에서는 큰 창으로 가는 길 하나만 */}
      {open !== null && (
        <Pressable accessibilityRole="button" onPress={() => desktop?.open(plan.id, open === CENTER ? null : open)} style={styles.more}>
          <Text style={{ color: t.sub, fontSize: 11, fontWeight: '600' }}>큰 창에서 열기 ›</Text>
        </Pressable>
      )}
    </View>
  );
}

function Pill({ n, missed }: { n: number; missed: number }) {
  const { t } = useTheme();
  const on = n > 0;
  return (
    <View style={[styles.pill, { backgroundColor: on ? t.accent : t.done }]}>
      <Text style={[styles.pillText, { color: on ? t.on(t.accent) : t.doneBorder }]}>
        {on ? `오늘 ${n}` : '✓ 오늘 끝'}{missed ? ` · 놓침 ${missed}` : ''}
      </Text>
    </View>
  );
}

function Grid({ plan, todo, missed, onOpen }: { plan: Plan; todo: RoutineItem[]; missed: number; onOpen: (cell: number) => void }) {
  const { t } = useTheme();
  const size = sizeOf(plan);
  const lay = layoutBlock(size, CENTER, 10_000, GAP, CELL);
  const due = new Map<number, number>();
  todo.forEach(i => due.set(i.block, (due.get(i.block) ?? 0) + 1));

  return (
    <View style={{ width: Math.max(lay.width, 150) }}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>{plan.title}</Text>
        <Pill n={todo.length} missed={missed} />
      </View>
      <View style={{ width: lay.width, height: lay.height, alignSelf: 'center' }}>
        {lay.cells.map(c => {
          const g = plan.blocks[CENTER][c.cell];
          const core = c.cell === CENTER;
          const pr = core ? progress(plan) : progress(plan, c.cell);
          return (
            <Cell key={c.cell} x={c.x} y={c.y} size={lay.cell} core={core}
              emoji={core ? '★' : categoryById(g.cat)?.emoji}
              label={core ? g.text || '핵심 목표' : short(g.text)}
              ratio={pr.ratio} color={t.blocks[c.cell]} due={due.get(c.cell) ?? 0}
              onPress={() => onOpen(c.cell)} />
          );
        })}
      </View>
    </View>
  );
}

function Cell({ x, y, size, core, emoji, label, ratio, color, due, onPress }: {
  x: number; y: number; size: number; core: boolean; emoji?: string; label: string; ratio: number; color: string; due: number; onPress: () => void;
}) {
  const { t } = useTheme();
  const pulse = usePulse(due > 0);
  const fg = t.on(color);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} accessibilityLabel={label}
      style={[styles.cell, { left: x, top: y, width: size, height: size, backgroundColor: color }]}>
      {due > 0 && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glow, {
          borderColor: t.accent, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
        }]} />
      )}
      {!!emoji && <Text style={[styles.emoji, { color: fg }]}>{emoji}</Text>}
      <Text style={[styles.label, { color: fg }, core && styles.coreLabel]} numberOfLines={core ? 3 : 2}>{label}</Text>
      {/* 실행 과제 완료 비율 — 칸 아래 얇은 줄 */}
      {!core && ratio > 0 && (
        <View style={[styles.track, { backgroundColor: 'rgba(127,127,127,0.25)' }]}>
          <View style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', backgroundColor: fg, opacity: 0.75, borderRadius: 2 }} />
        </View>
      )}
      {due > 0 && (
        <View style={[styles.badge, { backgroundColor: t.accent }]}>
          <Text style={[styles.badgeText, { color: t.on(t.accent) }]}>{due}</Text>
        </View>
      )}
    </Pressable>
  );
}

function DetailHead({ emoji, title, right, color, onBack }: { emoji?: string; title: string; right?: string; color: string; onBack: () => void }) {
  const { t } = useTheme();
  const fg = t.on(color);
  return (
    <Pressable accessibilityRole="button" onPress={onBack} style={[styles.dHead, { backgroundColor: color }]} accessibilityLabel="뒤로">
      <Text style={[styles.back, { color: fg }]}>‹</Text>
      {!!emoji && <Text style={{ fontSize: 14, color: fg }}>{emoji}</Text>}
      <Text style={[styles.dTitle, { color: fg }]} numberOfLines={2}>{title}</Text>
      {!!right && <Text style={[styles.dRight, { color: fg }]}>{right}</Text>}
    </Pressable>
  );
}

// 세부 목표 하나의 실행 과제 — 완료 ✓ · 오늘 할 것(깜빡) · 이번 기간 끝 · 그 밖
function Detail({ plan, block, all, onToggle, onBack }: {
  plan: Plan; block: number; all: RoutineItem[]; onToggle: (b: number, c: number) => void; onBack: () => void;
}) {
  const { t } = useTheme();
  const g = plan.blocks[CENTER][block];
  const pr = progress(plan, block);
  const rows = cellsOf(sizeOf(plan), block).filter(c => c !== CENTER)
    .map(c => ({ c, cell: plan.blocks[block][c], item: all.find(i => i.block === block && i.cell === c) }))
    .filter(r => r.cell.text.trim());
  return (
    <View>
      <DetailHead emoji={categoryById(g.cat)?.emoji} title={g.text || '세부 목표'} right={`${pr.done}/${pr.filled}`} color={t.blocks[block]} onBack={onBack} />
      {!rows.length && <Text style={[styles.empty, { color: t.sub }]}>아직 실행 과제가 없어요</Text>}
      <ScrollView style={{ maxHeight: LIST_MAX }} {...NODRAG}>
        {rows.map(({ c, cell, item }) => (
          <Row key={c} text={cell.text} onPress={() => onToggle(block, c)}
            state={cell.done ? 'done' : item?.dueToday && !item.stats.checked ? 'due' : item?.stats.checked ? 'checked' : 'none'}
            sub={cell.routine && !cell.done ? routineLabel(cell.routine) : undefined} />
        ))}
      </ScrollView>
    </View>
  );
}

const GROUPS: [Scope, string][] = [['day', '오늘'], ['week', '이번 주'], ['month', '이번 달']];

// 핵심 목표 칸 — 이 목표 전체에서 오늘 할 점검 (오늘 · 이번 주 · 이번 달로 나눠서). 체크한 줄도 ✓ 로 남겨 되돌릴 수 있게
function Today({ plan, all, onToggle, onBack }: {
  plan: Plan; all: RoutineItem[]; onToggle: (b: number, c: number) => void; onBack: () => void;
}) {
  const { t } = useTheme();
  const due = all.filter(i => i.dueToday);
  const todo = due.filter(i => !i.stats.checked);
  return (
    <View>
      <DetailHead emoji="★" title="오늘 할 일" right={todo.length ? `${todo.length}` : '✓'} color={t.blocks[CENTER]} onBack={onBack} />
      {!due.length && <Text style={[styles.empty, { color: t.sub }]}>오늘 할 점검이 없어요</Text>}
      <ScrollView style={{ maxHeight: LIST_MAX }} {...NODRAG}>
        {GROUPS.map(([scope, label]) => {
          const list = due.filter(i => i.scope === scope);
          if (!list.length) return null;
          const left = list.filter(i => !i.stats.checked).length;
          return (
            <View key={scope}>
              <Text style={[styles.group, { color: t.sub }]}>{label} · {left ? `${left} 남음` : '끝'}</Text>
              {list.map(i => (
                <Row key={`${i.block}-${i.cell}`} text={i.text} state={i.stats.checked ? 'checked' : 'due'}
                  onPress={() => onToggle(i.block, i.cell)}
                  sub={`${short(plan.blocks[CENTER][i.block]?.text ?? '')} · ${routineLabel(i.routine)}`} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Row({ text, state, sub, onPress }: { text: string; state: 'done' | 'due' | 'checked' | 'none'; sub?: string; onPress: () => void }) {
  const { t } = useTheme();
  const pulse = usePulse(state === 'due');
  return (
    <Pressable accessibilityRole="button" onPress={onPress} accessibilityLabel={text}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: 'rgba(127,127,127,0.15)' }]}>
      <View style={styles.mark}>
        {state === 'due'
          ? <Animated.View style={[styles.dot, { backgroundColor: t.accent, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }]} />
          : state === 'none'
            ? <View style={[styles.dot, styles.hollow, { borderColor: t.border }]} />
            : <Text style={{ color: state === 'done' ? t.doneBorder : t.accent, fontSize: 12, fontWeight: '900' }}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowText, { color: state === 'done' ? t.sub : t.text }, state === 'done' && styles.strike]}>{text}</Text>
        {!!sub && <Text style={[styles.rowSub, { color: state === 'due' ? t.accent : t.sub }]}>{sub}{state === 'checked' ? ' · 이번 기간 완료' : ''}</Text>}
      </View>
    </Pressable>
  );
}

// 천천히 깜빡 — 1.4초 밝아지고 1.4초 돌아온다
function usePulse(on: boolean) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [on, pulse]);
  return pulse;
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', top: 0, left: 0, borderWidth: 1, borderRadius: 18, padding: PAD, overflow: 'hidden' },
  head: { height: 26, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  title: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: -0.2 },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10.5, fontWeight: '800' },
  cell: { position: 'absolute', borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 6, paddingBottom: 10, overflow: 'hidden' },
  emoji: { fontSize: 15, marginBottom: 2 },
  label: { fontSize: 11.5, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  coreLabel: { fontSize: 10.5, fontWeight: '800' },
  track: { position: 'absolute', left: 12, right: 12, bottom: 5, height: 3, borderRadius: 2, overflow: 'hidden' },
  glow: { borderWidth: 3, borderRadius: 14 },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 9.5, fontWeight: '900' },
  dHead: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 4 },
  back: { fontSize: 18, fontWeight: '700', marginTop: -2 },
  dTitle: { flex: 1, fontSize: 12.5, fontWeight: '800', letterSpacing: -0.3 },
  dRight: { fontSize: 11, fontWeight: '800', opacity: 0.85 },
  row: { flexDirection: 'row', gap: 8, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8 },
  mark: { width: 14, alignItems: 'center', paddingTop: 2 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 2 },
  hollow: { borderWidth: 1.5, backgroundColor: 'transparent' },
  rowText: { fontSize: 12, lineHeight: 17, fontWeight: '600', letterSpacing: -0.2 },
  rowSub: { fontSize: 10.5, marginTop: 1 },
  strike: { textDecorationLine: 'line-through' },
  group: { fontSize: 10.5, fontWeight: '800', marginTop: 6, marginBottom: 1, paddingHorizontal: 4, letterSpacing: 0.3 },
  empty: { fontSize: 12, textAlign: 'center', paddingVertical: 14 },
  more: { alignSelf: 'flex-end', paddingTop: 6, paddingHorizontal: 4 },
});
