// 3x3 블록 하나를 크게 보고 칸을 편집한다.
import { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  useWindowDimensions, View,
} from 'react-native';
import { AgeBand, catInfo, categoryById } from '../categories/data';
import { guideSub } from '../categories/tree';
import { composeText } from '../categories/units';
import BoardCell, { Ink, paintCell } from '../components/BoardCell';
import { ActionBuilder, GoalCategoryPicker } from '../components/CategoryPicker';
import { Appear, Tap } from '../components/Motion';
import RoutinePicker from '../components/RoutinePicker';
import { layoutBlock } from '../components/ShapeLayout';
import { ActionSpec, blocksOf, canGrow, CENTER, Cell, cellRole, cellsIn, getCell, growSlots, Plan, PlanSize, progress, Routine, sizeOf, SubItem } from '../model';
import { ShapeIcon } from '../components/Icons';
import { routineLabel, routineStats } from '../routine';
import { useBoard, useTheme } from '../theme';

type Props = {
  plan: Plan;
  block: number;
  age?: AgeBand;
  custom: Record<string, string[]>;
  onBack: () => void;
  onChangeBlock: (block: number) => void;
  onEdit: (block: number, cell: number, patch: Partial<Cell>) => void;
  // 팀 목표: 이 기기에서 고칠 수 있는 칸인지 (없으면 모두 가능)
  canEdit?: (block: number, cell: number) => boolean;
  // 3 · 5칸 버전: 실행 과제 칸 열기(on) · 빼기
  onGrow: (block: number, cell: number, on: boolean) => void;
  // 실행 과제를 핵심 목표로 새 목표 펼치기 (이미 펼쳤으면 그 목표 열기) · 펼친 목표 이름 찾기
  onExpand: (block: number, cell: number, size: PlanSize) => void;
  planTitle: (id: string) => string | undefined;
  onAge: (age: AgeBand | undefined) => void;
  onAddCustom: (catId: string, label: string) => void;
};

const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const ROLE_LABEL = { core: '핵심 목표', goal: '세부 목표', action: '실행 과제' } as const;

export default function BlockEditor({
  plan, block, age, custom, onBack, onChangeBlock, onEdit, onAge, onAddCustom, canEdit, onGrow, onExpand, planTitle,
}: Props) {
  const { width } = useWindowDimensions();
  const { t, ui } = useTheme();
  const board = useBoard();
  const size = Math.min(width, 520) - 32;
  const shape = sizeOf(plan);
  // 칸을 더 열 수 있는 블록은 3×3 전체 자리로 그리고, 빈 자리에 ＋ 를 둔다
  const growable = canGrow(shape) && block !== CENTER && (!canEdit || canEdit(block, 0));
  const slots = growable ? growSlots(plan, block) : [];
  const lay = growable
    ? layoutBlock(9, block, size, 8, 160, [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(c => cellsIn(plan, block).includes(c) || slots.includes(c)))
    : layoutBlock(shape, block, size, 8, shape === 1 ? 220 : 160, cellsIn(plan, block));
  const cellSize = lay.cell;
  const [editing, setEditing] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const owner = plan.team?.owners[block === CENTER ? CENTER : block];

  const center = getCell(plan, block, CENTER);
  const pr = progress(plan, block);
  const headerTitle = block === CENTER ? '핵심 블록' : center.text || `세부 목표 ${blocksOf(shape).filter(b => b !== CENTER).indexOf(block) + 1}`;
  const blockCat = block === CENTER ? undefined : center.cat;

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>{headerTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 16 }}>
        <View style={{ width: lay.width, height: lay.height }}>
          {lay.cells.map(({ cell: c, x, y }) => {
            // 아직 열지 않은 자리 — 누르면 칸을 열고 바로 입력
            if (slots.includes(c)) {
              return (
                <BoardCell key={`${board.key}-${c}`} x={x} y={y} size={cellSize} delay={c * 40}
                  paint={{ bg: 'transparent', ink: t.sub }} style={[styles.ghost, { borderColor: t.sub }]}
                  label="실행 과제 칸 더하기" onPress={() => { onGrow(block, c, true); setEditing(c); }}>
                  <Text style={{ fontSize: 26, color: t.sub }}>＋</Text>
                </BoardCell>
              );
            }
            const v = getCell(plan, block, c);
            const role = cellRole(block, c);
            const isAction = role === 'action';
            // 완료 · 반복 점검을 다는 칸 (1칸 버전은 핵심 목표 칸)
            const tracked = isAction || shape === 1;
            const paint = paintCell(board, block, c, { done: tracked && v.done });
            // 퍼즐 그림 위 작은 표시는 흰 알약 위 진한 글자, 그 밖은 칸 글자색
            const mark = paint.pill ? board.text : paint.ink;
            // 비어 있는 실행 과제 칸에는 블록 카테고리의 세부 카테고리를 미리 안내한다
            const guide = isAction && !v.text ? guideSub(blockCat, c, age) : undefined;
            return (
              <BoardCell
                key={`${board.key}-${c}`}
                x={x} y={y} size={cellSize} paint={paint} picture={lay.picture}
                delay={c * 40}
                label={v.text || ROLE_LABEL[role]}
                onPress={() => (canEdit && !canEdit(block, c) ? setLocked(true) : setEditing(c))}
                onLongPress={() => block === CENTER && c !== CENTER && onChangeBlock(c)}
                style={styles.big}
              >
                <Text style={[styles.role, { color: mark, opacity: paint.pill ? 0.9 : 0.6 }, !!paint.pill && styles.badge]}>
                  {ROLE_LABEL[role]}{role !== 'action' && catInfo(v.cat) ? ` · ${catInfo(v.cat)!.emoji}` : ''}
                </Text>
                <Ink paint={paint} style={styles.pill}>
                  <Text
                    numberOfLines={paint.motif ? 3 : 4}
                    style={[
                      styles.txt,
                      { color: paint.ink },
                      role !== 'action' && [{ fontWeight: role === 'core' ? '800' : '700' } as const, ui.titleFont],
                      !v.text && { opacity: 0.6, fontWeight: '400' },
                    ]}
                  >
                    {v.text || (guide ? `+ ${guide.label}` : '+ 입력')}
                  </Text>
                </Ink>
                {v.done && <Text style={[styles.check, { color: board.doneBorder }, !!paint.pill && styles.badge]}>✓</Text>}
                {/* 하위 할 일 · 펼친 목표 표시 */}
                {(!!v.items?.length || !!v.child) && (
                  <Text style={[styles.sub, { color: mark }, !!paint.pill && styles.badge]} numberOfLines={1}>
                    {v.items?.length ? `☑ ${v.items.filter(i => i.done).length}/${v.items.length}` : ''}{v.items?.length && v.child ? ' ' : ''}{v.child ? '↗' : ''}
                  </Text>
                )}
                {tracked && v.routine && !v.done && (() => {
                  const st = routineStats(v.routine, v.log);
                  return (
                    <Text style={[styles.loop, { color: st.checked ? board.doneBorder : mark }, !!paint.pill && styles.badge]} numberOfLines={1}>
                      {st.checked ? '✓' : '🔁'}{st.streak > 1 ? ` 🔥${st.streak}` : ''}
                    </Text>
                  );
                })()}
              </BoardCell>
            );
          })}
        </View>

        {(block !== CENTER || shape === 1) && (
          <View style={{ width: size, gap: 6 }}>
            <View style={ui.bar}><View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} /></View>
            <Text style={ui.sub}>{shape === 1 ? `목표 ${pr.done}/${pr.filled} 완료 · 칸을 눌러 반복 점검 · 알림도 걸 수 있어요` : `이 블록 실행 과제 ${pr.done}/${pr.filled} 완료`}</Text>
          </View>
        )}
        {/* 팀 목표: 담당자 · 고칠 수 없는 칸을 눌렀을 때 안내 */}
        {plan.team && (
          <Text style={[ui.sub, { width: size, color: locked ? t.accent : t.sub, fontWeight: locked ? '700' : '400' }]}>
            {locked
              ? `🔒 이 칸은 ${block === CENTER || !owner ? '관리자' : `${owner} 님`}만 고칠 수 있어요`
              : owner ? `담당 · ${owner}` : '담당자 없음'}
          </Text>
        )}
        {block === CENTER && shape !== 1 && (
          <Text style={[ui.sub, { width: size }]}>세부 목표 칸을 길게 누르면 해당 블록으로 이동합니다.</Text>
        )}

        {/* 블록 빠른 이동 — 이 크기에서 쓰는 블록만 */}
        {shape !== 1 && <View style={[styles.mini, { width: 3 * 40 + 8 }]}>
          {IDX.map(b => !blocksOf(shape).includes(b) ? <View key={b} style={styles.miniCell} /> : (
            <Tap
              key={b}
              onPress={() => onChangeBlock(b)}
              hover={1.1}
              style={[styles.miniCell, { backgroundColor: board.blocks[b] }, b === block && [styles.miniActive, { borderColor: t.text }]]}
            >
              {board.art?.mode === 'motif'
                ? <Text style={{ fontSize: 18 }}>{board.art.motifs[b]}</Text>
                : (
                  <Text style={{ fontSize: 10, color: board.on(board.blocks[b]) }} numberOfLines={1}>
                    {b === CENTER ? '핵심' : getCell(plan, CENTER, b).text.slice(0, 3) || b + 1}
                  </Text>
                )}
            </Tap>
          ))}
        </View>}
      </ScrollView>

      {editing !== null && (
        <CellEditor
          role={cellRole(block, editing)}
          trackable={cellRole(block, editing) === 'action' || shape === 1}
          cell={getCell(plan, block, editing)}
          blockCat={blockCat}
          guide={guideSub(blockCat, editing, age)?.id}
          age={age}
          custom={custom}
          onAge={onAge}
          onAddCustom={onAddCustom}
          // 새로 연 칸을 비운 채 닫으면 칸도 다시 닫는다
          onClose={() => { if (plan.extra?.[block]?.includes(editing) && !getCell(plan, block, editing).text) onGrow(block, editing, false); setEditing(null); }}
          onSave={patch => { onEdit(block, editing, patch); setEditing(null); }}
          onRemove={plan.extra?.[block]?.includes(editing) ? () => { onGrow(block, editing, false); setEditing(null); } : undefined}
          childTitle={getCell(plan, block, editing).child ? planTitle(getCell(plan, block, editing).child!) : undefined}
          onExpand={(size, patch) => { onEdit(block, editing, patch); onExpand(block, editing, size); setEditing(null); }}
        />
      )}
    </View>
  );
}

function CellEditor({ role, trackable, cell, blockCat, guide, age, custom, onAge, onAddCustom, onClose, onSave, onRemove, childTitle, onExpand }: {
  role: keyof typeof ROLE_LABEL;
  trackable: boolean; // 완료 · 반복 점검을 다는 칸
  cell: Cell;
  blockCat?: string;
  guide?: string;
  age?: AgeBand;
  custom: Record<string, string[]>;
  onAge: (age: AgeBand | undefined) => void;
  onAddCustom: (catId: string, label: string) => void;
  onClose: () => void;
  onSave: (patch: Partial<Cell>) => void;
  onRemove?: () => void; // 더 연 칸만 — 칸을 닫는다
  childTitle?: string; // 이미 펼친 목표가 있으면 그 이름
  onExpand: (size: PlanSize, patch: Partial<Cell>) => void; // 지금 고친 내용을 저장하고 펼친다
}) {
  const { t, ui } = useTheme();
  const [text, setText] = useState(cell.text);
  const [note, setNote] = useState(cell.note);
  const [done, setDone] = useState(cell.done);
  const [cat, setCat] = useState(cell.cat);
  const [routine, setRoutine] = useState<Routine | undefined>(cell.routine);
  const [items, setItems] = useState<SubItem[]>(cell.items ?? []);
  const [newItem, setNewItem] = useState('');
  const addItem = () => { if (newItem.trim()) { setItems([...items, { text: newItem.trim(), done: false }]); setNewItem(''); } };
  // 실행 과제: 저장된 선택을 복원하고, 빈 칸이면 블록의 안내 세부 카테고리로 시작
  const [spec, setSpec] = useState<ActionSpec>(
    cell.spec ?? (cell.text ? {} : { cat: blockCat, sub: guide }),
  );
  const composed = composeText(spec);

  // 문장이 비었거나 자동으로 만든 그대로면 새 선택으로 다시 만든다 (직접 고친 문장은 유지)
  const changeSpec = (next: ActionSpec) => {
    if (!text.trim() || text === composed) setText(composeText(next));
    setSpec(next);
  };

  // 카테고리를 고를 때 제목이 비어 있거나 이전 카테고리 이름 그대로면 새 카테고리 이름으로 채운다
  const selectCat = (id: string | undefined) => {
    const prev = categoryById(cat)?.label;
    if (!text.trim() || text === prev) setText(categoryById(id)?.label ?? '');
    setCat(id);
  };

  const patch = (): Partial<Cell> => ({
    text: text.trim(), note, done, ...(role !== 'action' ? { cat } : { spec, items: items.length ? items : undefined }), ...(trackable ? { routine } : {}),
  });

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        {/* 시트 바깥(어두운 배경)을 누르면 취소와 같이 닫는다 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="편집 닫기" />
        <Appear kind="sheet" style={styles.sheetWrap}>
        <ScrollView style={[styles.sheetScroll, { backgroundColor: t.bg, borderTopLeftRadius: t.radius.card, borderTopRightRadius: t.radius.card }]} contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sheetTitle, { color: t.text }]}>{ROLE_LABEL[role]}</Text>
          {/* 카테고리를 먼저 고르고, 그 아래에서 내용을 입력한다 */}
          {role !== 'action' && <GoalCategoryPicker selected={cat} onSelect={selectCat} />}
          {role === 'action' && (
            <ActionBuilder
              spec={spec}
              blockCat={blockCat}
              typed={text === composed ? '' : text}
              age={age}
              custom={custom}
              onAge={onAge}
              onChange={changeSpec}
              onAddCustom={onAddCustom}
            />
          )}
          {role === 'action' && (
            <Text style={[styles.label, { color: t.text }]}>④ 칸에 들어갈 문장 <Text style={{ color: t.sub, fontWeight: '400' }}>고른 내용으로 자동 완성 · 직접 고쳐도 됩니다</Text></Text>
          )}
          <TextInput
            value={text} onChangeText={setText} multiline maxLength={role === 'action' ? 80 : 60}
            placeholder={role === 'action' ? '예: 매주 토요일 2시간 영어 공부' : '목표를 짧고 명확하게'}
            style={[ui.input, { minHeight: 60 }]}
          />
          <TextInput
            value={note} onChangeText={setNote} multiline
            placeholder="메모 · 기한 · 측정 기준 (선택)"
            style={[ui.input, { minHeight: 80 }]}
          />
          {/* 실행 과제: 하위 할 일 — 칸 하나에 여러 일을 체크리스트로 */}
          {role === 'action' && (
            <View style={{ gap: 6 }}>
              <Text style={[styles.label, { color: t.text }]}>하위 할 일 <Text style={{ color: t.sub, fontWeight: '400' }}>{items.length ? `${items.filter(i => i.done).length}/${items.length} 완료` : '이 과제를 잘게 나눠 체크'}</Text></Text>
              {items.map((it, i) => (
                <View key={i} style={styles.item}>
                  <Pressable onPress={() => setItems(items.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} hitSlop={6}
                    style={[styles.box, { borderColor: it.done ? t.doneBorder : t.border, backgroundColor: it.done ? t.done : t.surface }]}>
                    {it.done && <Text style={{ color: t.doneBorder, fontSize: 12, fontWeight: '900' }}>✓</Text>}
                  </Pressable>
                  <Text style={[{ flex: 1, color: it.done ? t.sub : t.text, fontSize: 14 }, it.done && { textDecorationLine: 'line-through' }]}>{it.text}</Text>
                  <Pressable onPress={() => setItems(items.filter((_, j) => j !== i))} hitSlop={6} accessibilityLabel="할 일 지우기">
                    <Text style={{ color: t.sub, fontSize: 16 }}>×</Text>
                  </Pressable>
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput value={newItem} onChangeText={setNewItem} onSubmitEditing={addItem} placeholder="할 일 추가" style={[ui.input, { flex: 1, paddingVertical: 8 }]} />
                <Pressable style={[ui.btn, { paddingVertical: 8 }]} onPress={addItem}><Text style={ui.btnText}>추가</Text></Pressable>
              </View>
            </View>
          )}
          {trackable && <RoutinePicker routine={routine} when={spec.when} onChange={setRoutine} step={role === 'action' ? '⑤' : '②'} />}
          {trackable && (
            <Pressable style={[ui.btn, done && { backgroundColor: t.done, borderColor: t.doneBorder }]} onPress={() => setDone(!done)}>
              <Text style={ui.btnText}>{role === 'action' ? (done ? '✓ 과제 완료됨' : '과제 전체를 완료로 표시') : (done ? '✓ 목표 달성' : '목표 달성으로 표시')}</Text>
            </Pressable>
          )}
          {trackable && routine && (
            <Text style={[ui.sub, { marginTop: -6 }]}>
              주기마다의 체크는 「오늘의 점검」에서 합니다 ({routineLabel(routine)}). 과제 전체를 완료하면 점검 목록에서 빠집니다.
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[ui.btn, { flex: 1 }]} onPress={onClose}><Text style={ui.btnText}>취소</Text></Pressable>
            <Tap
              style={[ui.btnPrimary, { flex: 1 }]}
              onPress={() => onSave(patch())}
            >
              <Text style={ui.btnPrimaryText}>저장</Text>
            </Tap>
          </View>
          {/* 실행 과제를 핵심 목표로 — 새 목표로 펼치기 */}
          {role === 'action' && (
            <View style={[styles.expand, { borderColor: t.border }]}>
              {childTitle ? (
                <Pressable style={ui.btn} onPress={() => onExpand(9, patch())}>
                  <Text style={ui.btnText} numberOfLines={1}>↗ 펼친 목표 열기 · {childTitle}</Text>
                </Pressable>
              ) : (
                <>
                  <Text style={[styles.label, { color: t.text }]}>새 목표로 펼치기 <Text style={{ color: t.sub, fontWeight: '400' }}>이 과제를 핵심 목표로</Text></Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {([9, 7, 5, 3] as PlanSize[]).map(n => (
                      <Tap key={n} disabled={!text.trim()} onPress={() => onExpand(n, patch())} accessibilityLabel={`${n * n}칸으로 펼치기`}
                        style={[styles.sizeBtn, { borderColor: t.border, backgroundColor: t.surface, opacity: text.trim() ? 1 : 0.4 }]}>
                        <ShapeIcon color={t.text} shape={n} size={22} />
                        <Text style={{ color: t.sub, fontSize: 10 }}>{n * n}칸</Text>
                      </Tap>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
          {onRemove && (
            <Pressable onPress={onRemove} style={{ alignSelf: 'center', padding: 6 }}>
              <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '700' }}>이 칸 빼기</Text>
            </Pressable>
          )}
        </ScrollView>
        </Appear>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sub: { position: 'absolute', right: 6, top: 4, fontSize: 10, fontWeight: '700' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  expand: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 8 },
  sizeBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, gap: 2, borderRadius: 16, borderWidth: 1 },
  ghost: { borderStyle: 'dashed', borderWidth: 1.5, opacity: 0.7 },
  big: { padding: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  // 퍼즐 그림 위 작은 표시 — 흰 알약
  badge: { backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 999, paddingHorizontal: 5, overflow: 'hidden' },
  role: { position: 'absolute', top: 6, left: 8, fontSize: 9 },
  txt: { fontSize: 14, textAlign: 'center' },
  check: { position: 'absolute', bottom: 6, right: 8, fontWeight: '800' },
  loop: { position: 'absolute', bottom: 5, left: 8, fontSize: 10, fontWeight: '700' },
  mini: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniCell: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  miniActive: { opacity: 1, borderWidth: 2 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrap: { maxHeight: '88%' },
  sheetScroll: { flexGrow: 0 },
  sheet: { padding: 20, gap: 12, paddingBottom: 36 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '800' },
});
