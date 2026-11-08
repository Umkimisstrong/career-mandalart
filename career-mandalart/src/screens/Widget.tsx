// 바탕화면에 띄워 두는 작은 창 — 목표 하나의 가운데 묶음(핵심 목표 + 세부 목표)을 그 크기 모양대로 보여 준다.
// 오늘 해야 할 반복 점검이 남은 세부 목표 칸은 천천히 깜빡인다. 큰 창에서 바꾸면 바로 따라 바뀐다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { layoutBlock } from '../components/ShapeLayout';
import { desktop } from '../desktop';
import { CENTER, Plan, sizeOf, Store } from '../model';
import { routineItems } from '../routine';
import { loadStore, STORE_KEY } from '../storage';
import { buildTheme, ThemeProvider, useTheme } from '../theme';

const CELL = 72;
const GAP = 4;
const PAD = 8;
const HEAD = 24;

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

  const plan = store?.plans.find(p => p.id === id);
  return (
    <ThemeProvider value={theme}>
      {plan ? <WidgetBody plan={plan} now={now} /> : <Missing loaded={!!store} />}
    </ThemeProvider>
  );
}

function Missing({ loaded }: { loaded: boolean }) {
  const { t } = useTheme();
  useEffect(() => { desktop?.resize(200, 80); }, []);
  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.border, width: 200, height: 80, justifyContent: 'center' }]}>
      <Text style={{ color: t.sub, fontSize: 12, textAlign: 'center' }}>{loaded ? '목표를 찾을 수 없어요' : '불러오는 중…'}</Text>
    </View>
  );
}

function WidgetBody({ plan, now }: { plan: Plan; now: Date }) {
  const { t } = useTheme();
  const size = sizeOf(plan);
  // 가운데 묶음 칸 = 핵심 목표(4) + 세부 목표들. 1칸 버전은 핵심 목표 하나
  const lay = layoutBlock(size, CENTER, 10_000, GAP, CELL);
  const items = routineItems([plan], now).filter(i => i.dueToday && !i.stats.checked);
  // 칸 → 남은 점검 수 (세부 목표 칸 = 그 블록의 실행 과제들, 1칸 버전은 핵심 목표 칸)
  const due = new Map<number, number>();
  items.forEach(i => due.set(i.block === CENTER ? CENTER : i.block, (due.get(i.block === CENTER ? CENTER : i.block) ?? 0) + 1));
  const missed = routineItems([plan], now).filter(i => i.stats.missedPrev).length;
  const width = lay.width + PAD * 2;
  const height = lay.height + PAD * 2 + HEAD;

  useEffect(() => { desktop?.resize(Math.ceil(width), Math.ceil(height)); }, [width, height]);

  return (
    <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.border, width, height }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>{plan.title}</Text>
        <Text style={[styles.count, { color: items.length ? t.accent : t.sub }]}>
          {items.length ? `오늘 ${items.length}` : '✓ 오늘 끝'}{missed ? ` · 놓침 ${missed}` : ''}
        </Text>
      </View>
      <View style={{ width: lay.width, height: lay.height }}>
        {lay.cells.map(c => {
          const text = plan.blocks[CENTER][c.cell].text;
          const n = due.get(c.cell) ?? 0;
          return (
            <Cell key={c.cell} x={c.x} y={c.y} size={lay.cell} text={text} core={c.cell === CENTER}
              color={t.blocks[c.cell]} due={n}
              onPress={() => desktop?.open(plan.id, c.cell === CENTER || size === 1 ? null : c.cell)} />
          );
        })}
      </View>
    </View>
  );
}

function Cell({ x, y, size, text, core, color, due, onPress }: {
  x: number; y: number; size: number; text: string; core: boolean; color: string; due: number; onPress: () => void;
}) {
  const { t } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!due) { pulse.setValue(0); return; }
    // 천천히 깜빡 — 1.4초 밝아지고 1.4초 돌아온다
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [due, pulse]);

  return (
    <Pressable onPress={onPress} accessibilityLabel={text || (core ? '핵심 목표' : '세부 목표')}
      style={[styles.cell, { left: x, top: y, width: size, height: size, backgroundColor: color }]}>
      {/* 깜빡이는 테두리 · 빛 */}
      {due > 0 && (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.glow, {
          borderColor: t.accent, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          backgroundColor: 'rgba(255,255,255,0.22)',
        }]} />
      )}
      <Text style={[styles.cellText, { color: t.on(color) }, core && { fontWeight: '800' }]} numberOfLines={3}>
        {text || (core ? '핵심 목표' : '')}
      </Text>
      {due > 0 && (
        <View style={[styles.dot, { backgroundColor: t.accent }]}>
          <Text style={[styles.dotText, { color: t.on(t.accent) }]}>{due}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 14, padding: PAD, paddingTop: 0, overflow: 'hidden' },
  head: { height: HEAD, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 12, fontWeight: '700' },
  count: { fontSize: 11, fontWeight: '800' },
  cell: { position: 'absolute', borderRadius: 10, alignItems: 'center', justifyContent: 'center', padding: 4, overflow: 'hidden' },
  cellText: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  glow: { borderWidth: 3, borderRadius: 10 },
  dot: { position: 'absolute', top: 3, right: 3, minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 9, fontWeight: '800' },
});
