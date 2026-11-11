// 만들기 전에 결과를 살짝 보는 팝업 — 고른 크기 모양대로 모든 칸을 작게 그린다.
// 핵심 · 세부 목표 칸은 블록 색으로 진하게, 실행 과제 칸은 연하게.
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CENTER, getCell, Plan, sizeLabel, sizeOf } from '../model';
import { useTheme } from '../theme';
import BoardCell, { Ink, paintCell } from './BoardCell';
import { Appear, Tap } from './Motion';
import { layoutPlan } from './ShapeLayout';

// onCreate 가 없으면(아직 다 고르지 않음) 닫기 버튼만
type Props = { plan: Plan | null; sub?: string; onClose: () => void; onCreate?: () => void };

export default function PlanPreview({ plan, sub, onClose, onCreate }: Props) {
  const { t, ui } = useTheme();
  const { width } = useWindowDimensions();
  if (!plan) return null;
  const size = sizeOf(plan);
  const w = Math.min(width - 64, 420) - 12;
  const lay = layoutPlan(size, w, size === 9 ? 4 : 6, size === 1 ? 160 : 96);
  const font = Math.max(6, Math.min(11, lay.cell * 0.17));

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Appear kind="modal" style={styles.wrap}>
          {/* 카드 안을 눌러도 닫히지 않게 */}
          <Pressable style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, borderRadius: t.radius.card }]} onPress={() => {}}>
            <ScrollView contentContainerStyle={{ gap: 12, alignItems: 'center' }}>
              <View style={{ alignSelf: 'stretch' }}>
                <Text style={[styles.title, { color: t.text }, ui.titleFont]} numberOfLines={2}>{plan.title}</Text>
                <Text style={[ui.sub, { fontSize: 12, marginTop: 2 }]}>{size * size}칸 · {sizeLabel(size)}{sub ? ` · ${sub}` : ''}</Text>
              </View>
              <View style={[styles.tray, { backgroundColor: t.mat }]}>
                <View style={{ width: lay.width, height: lay.height }}>
                  {lay.cells.map(c => {
                    const cell = getCell(plan, c.block, c.cell);
                    const head = c.block === CENTER || c.cell === CENTER;
                    const paint = paintCell(t, c.block, c.cell, { tint: true });
                    const text = cell.text || (c.block === CENTER && c.cell === CENTER ? '핵심 목표' : head ? '세부 목표' : '');
                    return (
                      <BoardCell key={`${t.key}-${c.block}-${c.cell}`} x={c.x} y={c.y} size={lay.cell} inset={1}
                        paint={paint} picture={lay.picture} delay={120 + Math.round((c.x + c.y) / lay.cell) * 16}>
                        {!!text && (
                          <Ink paint={paint} style={{ paddingHorizontal: 3, paddingVertical: 1 }}>
                            <Text style={{ color: paint.ink, fontSize: font, lineHeight: font * 1.2, fontWeight: head ? '800' : '500', textAlign: 'center' }}
                              numberOfLines={paint.motif ? 2 : 3}>
                              {text}
                            </Text>
                          </Ink>
                        )}
                      </BoardCell>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
            <View style={styles.actions}>
              <Tap style={[ui.btn, { flex: 1 }]} onPress={onClose}><Text style={ui.btnText}>닫기</Text></Tap>
              {onCreate && <Tap style={[ui.btnPrimary, { flex: 1 }]} onPress={onCreate}><Text style={ui.btnPrimaryText}>이대로 만들기</Text></Tap>}
            </View>
          </Pressable>
        </Appear>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  wrap: { width: '100%', maxWidth: 460, maxHeight: '90%' },
  card: { borderWidth: 1, padding: 16, gap: 12, flexShrink: 1 },
  tray: { padding: 6, borderRadius: 18 },
  title: { fontSize: 16, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 8 },
});
