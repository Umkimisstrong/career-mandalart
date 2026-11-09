// 만들기 전에 결과를 살짝 보는 팝업 — 고른 크기 모양대로 모든 칸을 작게 그린다.
// 핵심 · 세부 목표 칸은 블록 색으로 진하게, 실행 과제 칸은 연하게.
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CENTER, getCell, Plan, sizeLabel, sizeOf } from '../model';
import { mix, useTheme } from '../theme';
import { layoutPlan } from './ShapeLayout';

// onCreate 가 없으면(아직 다 고르지 않음) 닫기 버튼만
type Props = { plan: Plan | null; sub?: string; onClose: () => void; onCreate?: () => void };

export default function PlanPreview({ plan, sub, onClose, onCreate }: Props) {
  const { t, ui } = useTheme();
  const { width } = useWindowDimensions();
  if (!plan) return null;
  const size = sizeOf(plan);
  const w = Math.min(width - 64, 420);
  const lay = layoutPlan(size, w, size === 9 ? 4 : 6, size === 1 ? 160 : 96);
  const font = Math.max(6, Math.min(11, lay.cell * 0.17));

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* 카드 안을 눌러도 닫히지 않게 */}
        <Pressable style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]} onPress={() => {}}>
          <ScrollView contentContainerStyle={{ gap: 12, alignItems: 'center' }}>
            <View style={{ alignSelf: 'stretch' }}>
              <Text style={[styles.title, { color: t.text }]} numberOfLines={2}>{plan.title}</Text>
              <Text style={[ui.sub, { fontSize: 12, marginTop: 2 }]}>{size * size}칸 · {sizeLabel(size)}{sub ? ` · ${sub}` : ''}</Text>
            </View>
            <View style={{ width: lay.width, height: lay.height }}>
              {lay.cells.map(c => {
                const cell = getCell(plan, c.block, c.cell);
                const head = c.block === CENTER || c.cell === CENTER;
                const bg = head ? t.blocks[c.block === CENTER ? c.cell : c.block] : mix(t.blocks[c.block], t.surface, 0.72);
                return (
                  <View key={`${c.block}-${c.cell}`}
                    style={[styles.cell, { left: c.x, top: c.y, width: lay.cell, height: lay.cell, backgroundColor: bg, borderRadius: Math.max(3, lay.cell * 0.14) }]}>
                    <Text style={{ color: head ? t.on(bg) : t.text, fontSize: font, lineHeight: font * 1.2, fontWeight: head ? '800' : '500', textAlign: 'center' }}
                      numberOfLines={3}>
                      {cell.text || (c.block === CENTER && c.cell === CENTER ? '핵심 목표' : head ? '세부 목표' : '')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[ui.btn, { flex: 1 }]} onPress={onClose}><Text style={ui.btnText}>닫기</Text></Pressable>
            {onCreate && <Pressable style={[ui.btnPrimary, { flex: 1 }]} onPress={onCreate}><Text style={ui.btnPrimaryText}>이대로 만들기</Text></Pressable>}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, maxHeight: '90%', borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '800' },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center', padding: 2, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: 8 },
});
