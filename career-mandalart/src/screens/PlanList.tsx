// 메인 화면 — 「목록」(크기 · 점검 필터)과 「만들기」(크기 → 템플릿 여부 → 연령대)를 탭으로 나눈다.
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BellIcon, InfoIcon, ShapeIcon, TrashIcon } from '../components/Icons';
import { APP_NAME, APP_NAME_EN, APP_TAGLINE_EN } from '../brand';
import { AGE_BANDS, AgeBand } from '../categories/data';
import { buildPlan, templateOf } from '../categories/templates';
import PlanPreview from '../components/PlanPreview';
import { CENTER, Plan, PLAN_SIZES, PlanSize, progress, sizeLabel, sizeOf } from '../model';
import { routineItems } from '../routine';
import { useTheme } from '../theme';

// 목록 필터 — 전체 · 크기별 · 반복 점검이 걸린 목표
export type Filter = 'all' | PlanSize | 'check';
export type Home = { tab: 'list' | 'create'; filter: Filter };
// 템플릿 — 연령대 또는 시그니처(16살 오타니의 81칸)
export type TemplatePick = AgeBand | 'ohtani' | null;

type Props = {
  plans: Plan[];
  home: Home;
  onHome: (home: Home) => void;
  age?: AgeBand;
  onOpen: (id: string) => void;
  onCreate: (title: string, size: PlanSize, template: TemplatePick) => void;
  onDelete: (id: string) => void;
  onBackup: () => void;
  onScanQr: () => void;
  onTheme: () => void;
  onAbout: () => void;
  onTemplates: (age?: AgeBand) => void;
  onToday: () => void;
  // 데스크톱 앱에서만: 바탕화면에 띄운 목표 id · 띄우기 켜고 끄기
  widget?: string[];
  onWidget: (id: string) => void;
  notice?: { text: string; error?: boolean };
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

export default function PlanList(props: Props) {
  const { plans, home, onHome, onAbout, onTheme, notice } = props;
  const { t, ui } = useTheme();
  const items = routineItems(plans);
  const left = items.filter(i => i.dueToday && !i.stats.checked).length;
  const tab = (id: Home['tab'], label: string) => {
    const on = home.tab === id;
    return (
      <Pressable key={id} onPress={() => onHome({ ...home, tab: id })}
        style={[styles.tab, { backgroundColor: on ? t.primary : 'transparent' }]}>
        <Text style={{ color: on ? t.onPrimary : t.sub, fontWeight: on ? '800' : '600', fontSize: 15 }}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.titleRow}>
        <Pressable onPress={onAbout} hitSlop={6} style={styles.titleBtn} accessibilityLabel="앱 소개">
          <Text style={[ui.h1, { flexShrink: 1 }]} numberOfLines={1}>
            {APP_NAME} <Text style={[styles.nameEn, { color: t.accent }]}>{APP_NAME_EN} · {APP_TAGLINE_EN}</Text>
          </Text>
          <InfoIcon color={t.accent} />
        </Pressable>
        <Pressable onPress={() => onHome({ tab: 'list', filter: 'check' })} hitSlop={6}
          style={[styles.iconBtn, { borderColor: t.border, backgroundColor: t.surface }]} accessibilityLabel="오늘의 점검 알림">
          <BellIcon color={left ? t.primary : t.sub} />
          {left > 0 && (
            <View style={[styles.badge, { backgroundColor: t.accent }]}>
              <Text style={[styles.badgeText, { color: t.on(t.accent) }]}>{left}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onTheme} hitSlop={6} style={[styles.themeBtn, { borderColor: t.border, backgroundColor: t.surface }]}>
          <Text style={[styles.themeText, { color: t.text }]}>테마변경</Text>
        </Pressable>
      </View>

      <View style={[styles.tabs, { borderColor: t.border, backgroundColor: t.surface }]}>
        {tab('list', `목록 ${plans.length}`)}
        {tab('create', '＋ 만들기')}
      </View>

      {!!notice?.text && (
        <Text style={[ui.sub, { color: notice.error ? '#DC2626' : t.primary, fontWeight: '700' }]}>{notice.text}</Text>
      )}

      {home.tab === 'list' ? <ListTab {...props} /> : <CreateTab {...props} />}
    </ScrollView>
  );
}

function ListTab({ plans, home, onHome, onOpen, onDelete, onScanQr, onBackup, onToday, widget, onWidget }: Props) {
  const { t, ui } = useTheme();
  const items = routineItems(plans);
  const today = items.filter(i => i.scope === 'day' && i.dueToday);
  const left = items.filter(i => i.dueToday && !i.stats.checked).length;
  const missed = items.filter(i => i.stats.missedPrev).length;
  const checkIds = new Set(items.map(i => i.planId));
  const shown = plans
    .filter(p => home.filter === 'all' ? true : home.filter === 'check' ? checkIds.has(p.id) : sizeOf(p) === home.filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // 필터 버튼 — 전체만 글자, 점검은 종, 크기는 모양 아이콘. 한 줄에 같은 너비로
  const chip = (f: Filter, label: string) => {
    const on = home.filter === f;
    const fg = on ? t.onPrimary : t.sub;
    return (
      <Pressable key={String(f)} onPress={() => onHome({ ...home, filter: f })} accessibilityLabel={label}
        style={[styles.filter, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
        {f === 'all' ? <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: '800', fontSize: 13 }}>{label}</Text>
          : f === 'check' ? <BellIcon color={fg} size={18} />
          : <ShapeIcon color={on ? t.onPrimary : t.text} shape={f} size={24} />}
      </Pressable>
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.filters}>
        {chip('all', '전체')}
        {chip('check', '점검')}
        {PLAN_SIZES.map(n => chip(n, `${n * n}칸`))}
      </View>

      {home.filter === 'check' && (
        <Pressable onPress={onToday} style={[styles.story, { backgroundColor: t.surface, borderColor: missed ? t.accent : t.primary, borderWidth: 2 }]}>
          <Text style={styles.storyStar}>{items.length && !left ? '✅' : '📋'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.storyTitle, { color: t.text }]}>
              오늘의 점검{items.length ? ` · 오늘 ${today.filter(i => i.stats.checked).length}/${today.length}` : ''}
            </Text>
            <Text style={[styles.storySub, { color: missed ? t.accent : t.sub }]}>
              {!items.length ? '실행 과제에 매일 · 매주 · 매월 반복 점검과 알림을 걸어 보세요'
                : missed ? `놓친 기록 ${missed}개 · 남은 점검 ${left}개` : left ? `남은 점검 ${left}개` : '이번 기간 점검을 모두 마쳤어요'}
            </Text>
          </View>
          <Text style={{ color: t.sub, fontSize: 18 }}>›</Text>
        </Pressable>
      )}

      {!shown.length && (
        <View style={[styles.empty, { borderColor: t.border }]}>
          <Text style={[ui.sub, { textAlign: 'center' }]}>
            {!plans.length ? '아직 목표가 없어요.' : home.filter === 'check' ? '반복 점검이 걸린 목표가 없어요.' : '이 크기의 목표가 없어요.'}
          </Text>
          {!plans.length && (
            <Pressable style={ui.btnPrimary} onPress={() => onHome({ ...home, tab: 'create' })}>
              <Text style={ui.btnPrimaryText}>＋ 첫 목표 만들기</Text>
            </Pressable>
          )}
        </View>
      )}

      {shown.map(p => {
        const pr = progress(p);
        const core = p.blocks[CENTER][CENTER].text;
        const n = sizeOf(p);
        const due = items.filter(i => i.planId === p.id && i.dueToday && !i.stats.checked).length;
        return (
          <Pressable key={p.id} style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, borderLeftColor: t.primary }]} onPress={() => onOpen(p.id)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: t.text }]}>
                {p.title}<Text style={{ color: t.sub, fontSize: 12, fontWeight: '600' }}>  {n}칸</Text>
              </Text>
              <Text style={[styles.cardCore, { color: t.sub }]} numberOfLines={1}>{core || '핵심 목표를 정해보세요'}</Text>
              <View style={ui.bar}>
                <View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} />
              </View>
              <Text style={[styles.meta, { color: t.sub }]}>
                {n === 1 ? '목표' : '실행 과제'} {pr.done}/{pr.filled} 완료 · {new Date(p.updatedAt).toLocaleDateString()}
                {due ? <Text style={{ color: t.accent, fontWeight: '700' }}>  · 🔔 오늘 {due}개</Text> : null}
              </Text>
              {widget && (
                <Pressable onPress={() => onWidget(p.id)} hitSlop={6}
                  style={[styles.pin, { borderColor: widget.includes(p.id) ? t.primary : t.border, backgroundColor: widget.includes(p.id) ? t.primary : t.surface }]}>
                  <Text style={{ color: widget.includes(p.id) ? t.onPrimary : t.sub, fontSize: 12, fontWeight: '700' }}>
                    {widget.includes(p.id) ? '☑ 바탕화면에 띄움' : '☐ 바탕화면에 띄우기'}
                  </Text>
                </Pressable>
              )}
            </View>
            <Pressable hitSlop={10} accessibilityLabel="삭제" style={styles.del}
              onPress={() => confirm(`'${p.title}'을(를) 삭제할까요?`, () => onDelete(p.id))}>
              <TrashIcon color="#DC2626" />
            </Pressable>
          </Pressable>
        );
      })}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Pressable style={[ui.btn, { flex: 1 }]} onPress={onScanQr}>
          <Text style={ui.btnText}>QR로 불러오기</Text>
        </Pressable>
        <Pressable style={[ui.btn, { flex: 1 }]} onPress={onBackup}>
          <Text style={ui.btnText}>백업 · 복원</Text>
        </Pressable>
      </View>
    </View>
  );
}

// 만들기 — 한 단계를 고르면 다음 단계가 열린다: ① 크기 → ② 빈 칸 / 템플릿 → ③ 연령대(템플릿일 때) → 이름 · 미리보기 · 만들기
function CreateTab({ age, onCreate }: Props) {
  const { t, ui } = useTheme();
  const [title, setTitle] = useState('');
  const [size, setSize] = useState<PlanSize | null>(null);
  const [useTpl, setUseTpl] = useState<boolean | null>(null);
  const [pick, setPick] = useState<AgeBand | 'ohtani' | null>(null);
  const [preview, setPreview] = useState<Plan | null>(null);
  const tpl = pick && pick !== 'ohtani' ? templateOf(pick) : undefined;
  // 지금까지 고른 단계 수 — 다음 단계는 이 값으로 연다
  const step2 = size !== null;
  const step3 = step2 && useTpl === true;
  const ready = step2 && (useTpl === false || (useTpl === true && pick !== null));
  const choice = useTpl ? pick : null;

  const create = () => {
    if (!ready) return;
    onCreate(title.trim(), size!, choice);
    setTitle(''); setSize(null); setUseTpl(null); setPick(null); setPreview(null);
  };
  // 크기만 골라도 볼 수 있다 — 템플릿 · 연령대까지 골랐으면 채운 모습으로
  const open = () => { if (size !== null) setPreview(buildPlan(title.trim(), size, choice)); };

  const card = (on: boolean, label: string, sub: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={[styles.choice, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
      <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: '800', fontSize: 15 }}>{label}</Text>
      <Text style={{ color: on ? t.onPrimary : t.sub, fontSize: 11, marginTop: 2, opacity: 0.9 }}>{sub}</Text>
    </Pressable>
  );
  // 아직 열리지 않은 단계 — 흐리게, 누를 수 없게
  const lock = (on: boolean) => (on ? null : { opacity: 0.35, pointerEvents: 'none' as const });
  const head = (n: string, label: string, done: boolean, hint?: string, right?: React.ReactNode) => (
    <View style={styles.stepRow}>
      <View style={[styles.stepNum, { backgroundColor: done ? t.primary : t.surface, borderColor: done ? t.primary : t.border }]}>
        <Text style={{ color: done ? t.onPrimary : t.sub, fontSize: 12, fontWeight: '800' }}>{done ? '✓' : n}</Text>
      </View>
      <Text style={[styles.step, { color: t.text }]}>{label}</Text>
      {!!hint && <Text style={{ color: t.sub, fontSize: 12 }}>{hint}</Text>}
      {right}
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      {head('1', '크기', step2, undefined, (
        <Pressable onPress={open} disabled={size === null} accessibilityLabel="미리보기"
          style={[styles.peek, { borderColor: size === null ? t.border : t.primary, opacity: size === null ? 0.4 : 1 }]}>
          <Text style={{ color: size === null ? t.sub : t.primary, fontSize: 12, fontWeight: '800' }}>미리보기</Text>
        </Pressable>
      ))}
      {/* 81칸이 부담되면 작은 버전으로 — 9 가 시그니처 */}
      <View style={styles.sizeRow}>
        {PLAN_SIZES.map(n => {
          const on = n === size;
          return (
            <Pressable key={n} onPress={() => setSize(n)} accessibilityLabel={`${n * n}칸으로 만들기`}
              style={[styles.sizeChip, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
              <ShapeIcon color={on ? t.onPrimary : t.text} shape={n} size={26} />
              <Text style={{ color: on ? t.onPrimary : t.sub, fontSize: 10 }}>{n * n}칸</Text>
            </Pressable>
          );
        })}
      </View>
      {size !== null && (
        <Text style={[ui.sub, { fontSize: 12 }]}>
          {size === 9 ? '시그니처 81칸 — ' : `작은 목표 ${size * size}칸 — `}{sizeLabel(size)}
        </Text>
      )}

      <View style={[{ gap: 10 }, lock(step2)]}>
        {head('2', '시작 방법', useTpl !== null)}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {card(useTpl === false, '빈 칸으로', '처음부터 직접 쓰기', () => setUseTpl(false))}
          {card(useTpl === true, '템플릿 채우기', '예시로 채운 뒤 고치기', () => setUseTpl(true))}
        </View>
      </View>

      {useTpl !== false && (
        <View style={[{ gap: 10 }, lock(step3)]}>
          {head('3', '연령대', pick !== null && step3, age && !pick ? `추천 ${AGE_BANDS.find(a => a.id === age)?.label}` : undefined)}
          <View style={styles.chips}>
            {AGE_BANDS.map(a => {
              const on = a.id === pick;
              return (
                <Pressable key={a.id} onPress={() => setPick(a.id)}
                  style={[styles.chip, { borderColor: on || (a.id === age && !pick) ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface }]}>
                  <Text style={{ color: on ? t.onPrimary : t.text, fontWeight: on ? '800' : '500', fontSize: 13 }}>{a.label}</Text>
                </Pressable>
              );
            })}
            {/* 시그니처 — 연령대와 상관없이 항상 마지막 */}
            <Pressable onPress={() => setPick('ohtani')}
              style={[styles.chip, { borderColor: t.accent, backgroundColor: pick === 'ohtani' ? t.accent : t.surface }]}>
              <Text style={{ color: pick === 'ohtani' ? t.on(t.accent) : t.accent, fontWeight: '800', fontSize: 13 }}>★ 16살 오타니</Text>
            </Pressable>
          </View>
          {step3 && pick !== null && (
            <Text style={[ui.sub, { fontSize: 12 }]} numberOfLines={2}>
              {pick === 'ohtani' ? '16살 오타니가 81칸에 적은 꿈 — 핵심 목표 「8구단 드래프트 1순위」' : `${tpl?.theme} — 핵심 목표 「${tpl?.core}」`}
              {size !== 9 ? ` · ${size! * size!}칸에 들어가는 자리만 채워요` : ''}
            </Text>
          )}
        </View>
      )}

      <View style={[{ gap: 10 }, lock(ready)]}>
        {head(useTpl === false ? '3' : '4', '이름', !!title.trim(), '비우면 자동')}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="예: 2030 커리어"
          style={ui.input}
          onSubmitEditing={create}
        />
        <Pressable style={[ui.btnPrimary, { marginTop: 4 }]} onPress={create}>
          <Text style={ui.btnPrimaryText}>{useTpl ? '✨ 템플릿으로 만들기' : '만들기'}</Text>
        </Pressable>
      </View>

      {/* 다 고르기 전에는 모양만 보는 미리보기 — 「이대로 만들기」 대신 닫기만 */}
      <PlanPreview plan={preview} onClose={() => setPreview(null)} onCreate={ready ? create : undefined}
        sub={choice ? (choice === 'ohtani' ? '16살 오타니' : `${AGE_BANDS.find(a => a.id === choice)?.label} 템플릿`) : '빈 칸'} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nameEn: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  iconBtn: { width: 40, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  themeBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, height: 38, justifyContent: 'center' },
  themeText: { fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filters: { flexDirection: 'row', gap: 5 },
  filter: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  step: { fontSize: 14, fontWeight: '800' },
  peek: { marginLeft: 'auto', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  stepNum: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  choice: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  sizeRow: { flexDirection: 'row', gap: 6 },
  sizeChip: { flex: 1, alignItems: 'center', paddingVertical: 7, gap: 3, borderRadius: 10, borderWidth: 1 },
  story: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  storyStar: { fontSize: 24 },
  storyTitle: { fontSize: 15, fontWeight: '700' },
  storySub: { fontSize: 12, marginTop: 2 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 20, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16,
    borderRadius: 14, borderWidth: 1, borderLeftWidth: 4,
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardCore: { fontSize: 14, marginTop: 4, marginBottom: 10 },
  meta: { fontSize: 12, marginTop: 6 },
  del: { padding: 2 },
  pin: { alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
});
