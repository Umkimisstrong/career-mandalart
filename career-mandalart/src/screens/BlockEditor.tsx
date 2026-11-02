// 3x3 블록 하나를 크게 보고 칸을 편집한다.
import { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  useWindowDimensions, View,
} from 'react-native';
import { AgeBand, categoryById } from '../categories/data';
import { guideSub } from '../categories/tree';
import { composeText } from '../categories/units';
import { ActionBuilder, GoalCategoryPicker } from '../components/CategoryPicker';
import RoutinePicker from '../components/RoutinePicker';
import { layoutBlock } from '../components/ShapeLayout';
import { ActionSpec, blocksOf, CENTER, Cell, cellRole, getCell, Plan, progress, Routine, sizeOf } from '../model';
import { routineLabel, routineStats } from '../routine';
import { useTheme } from '../theme';

type Props = {
  plan: Plan;
  block: number;
  age?: AgeBand;
  custom: Record<string, string[]>;
  onBack: () => void;
  onChangeBlock: (block: number) => void;
  onEdit: (block: number, cell: number, patch: Partial<Cell>) => void;
  onAge: (age: AgeBand | undefined) => void;
  onAddCustom: (catId: string, label: string) => void;
};

const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const ROLE_LABEL = { core: '핵심 목표', goal: '세부 목표', action: '실행 과제' } as const;

export default function BlockEditor({
  plan, block, age, custom, onBack, onChangeBlock, onEdit, onAge, onAddCustom,
}: Props) {
  const { width } = useWindowDimensions();
  const { t, ui } = useTheme();
  const size = Math.min(width, 520) - 32;
  const shape = sizeOf(plan);
  const lay = layoutBlock(shape, block, size, 8, shape === 1 ? 220 : 160);
  const cellSize = lay.cell;
  const [editing, setEditing] = useState<number | null>(null);

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
            const v = getCell(plan, block, c);
            const role = cellRole(block, c);
            const isAction = role === 'action';
            // 완료 · 반복 점검을 다는 칸 (1칸 버전은 핵심 목표 칸)
            const tracked = isAction || shape === 1;
            const color = role === 'core' ? t.blocks[CENTER] : role === 'goal' ? t.blocks[block === CENTER ? c : block]
              : v.done ? t.done : t.surface;
            const fg = isAction ? (v.done ? t.doneText : t.text) : t.on(color);
            // 비어 있는 실행 과제 칸에는 블록 카테고리의 세부 카테고리를 미리 안내한다
            const guide = isAction && !v.text ? guideSub(blockCat, c, age) : undefined;
            return (
              <Pressable
                key={c}
                onPress={() => setEditing(c)}
                onLongPress={() => block === CENTER && c !== CENTER && onChangeBlock(c)}
                style={[
                  styles.cell,
                  { left: x, top: y, width: cellSize, height: cellSize, backgroundColor: color, borderColor: t.border },
                  v.done && tracked && { borderColor: t.doneBorder, borderWidth: isAction ? 1 : 3 },
                ]}
              >
                <Text style={[styles.role, { color: fg, opacity: 0.6 }]}>
                  {ROLE_LABEL[role]}{role !== 'action' && categoryById(v.cat) ? ` · ${categoryById(v.cat)!.emoji}` : ''}
                </Text>
                <Text
                  numberOfLines={4}
                  style={[
                    styles.txt,
                    { color: fg },
                    role === 'core' && { fontWeight: '800' },
                    role === 'goal' && { fontWeight: '700' },
                    !v.text && { opacity: 0.45, fontWeight: '400' },
                  ]}
                >
                  {v.text || (guide ? `+ ${guide.label}` : '+ 입력')}
                </Text>
                {v.done && <Text style={[styles.check, { color: t.doneBorder }]}>✓</Text>}
                {tracked && v.routine && !v.done && (() => {
                  const st = routineStats(v.routine, v.log);
                  return (
                    <Text style={[styles.loop, { color: st.checked ? t.doneBorder : t.sub }]} numberOfLines={1}>
                      {st.checked ? '✓' : '🔁'}{st.streak > 1 ? ` 🔥${st.streak}` : ''}
                    </Text>
                  );
                })()}
              </Pressable>
            );
          })}
        </View>

        {(block !== CENTER || shape === 1) && (
          <View style={{ width: size, gap: 6 }}>
            <View style={ui.bar}><View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} /></View>
            <Text style={ui.sub}>{shape === 1 ? `목표 ${pr.done}/${pr.filled} 완료 · 칸을 눌러 반복 점검 · 알림도 걸 수 있어요` : `이 블록 실행 과제 ${pr.done}/${pr.filled} 완료`}</Text>
          </View>
        )}
        {block === CENTER && shape !== 1 && (
          <Text style={[ui.sub, { width: size }]}>세부 목표 칸을 길게 누르면 해당 블록으로 이동합니다.</Text>
        )}

        {/* 블록 빠른 이동 — 이 크기에서 쓰는 블록만 */}
        {shape !== 1 && <View style={[styles.mini, { width: 3 * 40 + 8 }]}>
          {IDX.map(b => !blocksOf(shape).includes(b) ? <View key={b} style={styles.miniCell} /> : (
            <Pressable
              key={b}
              onPress={() => onChangeBlock(b)}
              style={[styles.miniCell, { backgroundColor: t.blocks[b] }, b === block && [styles.miniActive, { borderColor: t.text }]]}
            >
              <Text style={{ fontSize: 10, color: t.on(t.blocks[b]) }} numberOfLines={1}>
                {b === CENTER ? '핵심' : getCell(plan, CENTER, b).text.slice(0, 3) || b + 1}
              </Text>
            </Pressable>
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
          onClose={() => setEditing(null)}
          onSave={patch => { onEdit(block, editing, patch); setEditing(null); }}
        />
      )}
    </View>
  );
}

function CellEditor({ role, trackable, cell, blockCat, guide, age, custom, onAge, onAddCustom, onClose, onSave }: {
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
}) {
  const { t, ui } = useTheme();
  const [text, setText] = useState(cell.text);
  const [note, setNote] = useState(cell.note);
  const [done, setDone] = useState(cell.done);
  const [cat, setCat] = useState(cell.cat);
  const [routine, setRoutine] = useState<Routine | undefined>(cell.routine);
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

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        {/* 시트 바깥(어두운 배경)을 누르면 취소와 같이 닫는다 */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="편집 닫기" />
        <ScrollView style={[styles.sheetScroll, { backgroundColor: t.bg }]} contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
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
            <Pressable
              style={[ui.btnPrimary, { flex: 1 }]}
              onPress={() => onSave({ text: text.trim(), note, done, ...(role !== 'action' ? { cat } : { spec }), ...(trackable ? { routine } : {}) })}
            >
              <Text style={ui.btnPrimaryText}>저장</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cell: {
    position: 'absolute', borderRadius: 12, borderWidth: 1, padding: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  role: { position: 'absolute', top: 6, left: 8, fontSize: 9 },
  txt: { fontSize: 14, textAlign: 'center' },
  check: { position: 'absolute', bottom: 6, right: 8, fontWeight: '800' },
  loop: { position: 'absolute', bottom: 5, left: 8, fontSize: 10, fontWeight: '700' },
  mini: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniCell: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  miniActive: { opacity: 1, borderWidth: 2 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetScroll: {
    flexGrow: 0, maxHeight: '88%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  sheet: { padding: 20, gap: 12, paddingBottom: 36 },
  sheetTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '800' },
});
