// 3x3 블록 하나를 크게 보고 칸을 편집한다.
import { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  useWindowDimensions, View,
} from 'react-native';
import { AgeBand, categoryById } from '../categories/data';
import { ActionItemPicker, GoalCategoryPicker } from '../components/CategoryPicker';
import { CENTER, Cell, cellRole, getCell, Plan, progress } from '../model';
import { blockColor, blockTextColor, ui } from '../theme';

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
  const size = Math.min(width, 520) - 32;
  const cellSize = (size - 16) / 3;
  const [editing, setEditing] = useState<number | null>(null);

  const center = getCell(plan, block, CENTER);
  const pr = progress(plan, block);
  const headerTitle = block === CENTER ? '핵심 블록' : center.text || `세부 목표 ${block < CENTER ? block + 1 : block}`;
  const blockCat = block === CENTER ? undefined : center.cat;

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>{headerTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 16 }}>
        <View style={[styles.grid, { width: size }]}>
          {IDX.map(c => {
            const v = getCell(plan, block, c);
            const role = cellRole(block, c);
            const color = role === 'core' ? blockColor(CENTER) : role === 'goal' ? blockColor(block === CENTER ? c : block) : '#fff';
            return (
              <Pressable
                key={c}
                onPress={() => setEditing(c)}
                onLongPress={() => block === CENTER && c !== CENTER && onChangeBlock(c)}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize, backgroundColor: color },
                  v.done && role === 'action' && styles.done,
                ]}
              >
                <Text style={[styles.role, role === 'core' && { color: '#D1D5DB' }]}>
                  {ROLE_LABEL[role]}{role === 'goal' && categoryById(v.cat) ? ` · ${categoryById(v.cat)!.emoji}` : ''}
                </Text>
                <Text
                  numberOfLines={4}
                  style={[
                    styles.txt,
                    role === 'core' && { color: blockTextColor(CENTER), fontWeight: '800' },
                    role === 'goal' && { fontWeight: '700' },
                    !v.text && styles.placeholder,
                    v.done && styles.doneText,
                  ]}
                >
                  {v.text || '+ 입력'}
                </Text>
                {v.done && <Text style={styles.check}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        {block !== CENTER && (
          <View style={{ width: size, gap: 6 }}>
            <View style={ui.bar}><View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} /></View>
            <Text style={ui.sub}>이 블록 실행 과제 {pr.done}/{pr.filled} 완료</Text>
          </View>
        )}
        {block === CENTER && (
          <Text style={[ui.sub, { width: size }]}>세부 목표 칸을 길게 누르면 해당 블록으로 이동합니다.</Text>
        )}

        {/* 블록 빠른 이동 */}
        <View style={[styles.mini, { width: 3 * 40 + 8 }]}>
          {IDX.map(b => (
            <Pressable
              key={b}
              onPress={() => onChangeBlock(b)}
              style={[styles.miniCell, { backgroundColor: blockColor(b) }, b === block && styles.miniActive]}
            >
              <Text style={{ fontSize: 10, color: blockTextColor(b) }} numberOfLines={1}>
                {b === CENTER ? '핵심' : getCell(plan, CENTER, b).text.slice(0, 3) || b + 1}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {editing !== null && (
        <CellEditor
          role={cellRole(block, editing)}
          cell={getCell(plan, block, editing)}
          blockCat={blockCat}
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

function CellEditor({ role, cell, blockCat, age, custom, onAge, onAddCustom, onClose, onSave }: {
  role: keyof typeof ROLE_LABEL;
  cell: Cell;
  blockCat?: string;
  age?: AgeBand;
  custom: Record<string, string[]>;
  onAge: (age: AgeBand | undefined) => void;
  onAddCustom: (catId: string, label: string) => void;
  onClose: () => void;
  onSave: (patch: Partial<Cell>) => void;
}) {
  const [text, setText] = useState(cell.text);
  const [note, setNote] = useState(cell.note);
  const [done, setDone] = useState(cell.done);
  const [cat, setCat] = useState(cell.cat);

  // 카테고리를 고를 때 제목이 비어 있거나 이전 카테고리 이름 그대로면 새 카테고리 이름으로 채운다
  const selectCat = (id: string | undefined) => {
    const prev = categoryById(cat)?.label;
    if (!text.trim() || text === prev) setText(categoryById(id)?.label ?? '');
    setCat(id);
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <ScrollView style={styles.sheetScroll} contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>{ROLE_LABEL[role]}</Text>
          <TextInput
            autoFocus value={text} onChangeText={setText} multiline maxLength={60}
            placeholder={role === 'action' ? '예: 매주 토요일 2시간 영어 공부' : '목표를 짧고 명확하게'}
            style={[ui.input, { minHeight: 60 }]}
          />
          <TextInput
            value={note} onChangeText={setNote} multiline
            placeholder="메모 · 기한 · 측정 기준 (선택)"
            style={[ui.input, { minHeight: 80 }]}
          />
          {role === 'goal' && <GoalCategoryPicker selected={cat} onSelect={selectCat} />}
          {role === 'action' && (
            <ActionItemPicker
              initialCat={blockCat}
              text={text}
              age={age}
              custom={custom}
              onAge={onAge}
              onPick={label => setText(label)}
              onAddCustom={onAddCustom}
            />
          )}
          {role === 'action' && (
            <Pressable style={[ui.btn, done && { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]} onPress={() => setDone(!done)}>
              <Text style={ui.btnText}>{done ? '✓ 완료됨' : '완료로 표시'}</Text>
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={[ui.btn, { flex: 1 }]} onPress={onClose}><Text style={ui.btnText}>취소</Text></Pressable>
            <Pressable
              style={[ui.btnPrimary, { flex: 1 }]}
              onPress={() => onSave({ text: text.trim(), note, done, ...(role === 'goal' ? { cat } : {}) })}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  role: { position: 'absolute', top: 6, left: 8, fontSize: 9, color: '#6B7280' },
  txt: { fontSize: 14, textAlign: 'center', color: '#111827' },
  placeholder: { color: '#9CA3AF', fontWeight: '400' },
  done: { backgroundColor: '#D1FAE5', borderColor: '#10B981' },
  doneText: { color: '#047857' },
  check: { position: 'absolute', bottom: 6, right: 8, color: '#10B981', fontWeight: '800' },
  mini: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniCell: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  miniActive: { opacity: 1, borderWidth: 2, borderColor: '#111827' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetScroll: {
    flexGrow: 0, maxHeight: '88%', backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  sheet: { padding: 20, gap: 12, paddingBottom: 36 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
});
