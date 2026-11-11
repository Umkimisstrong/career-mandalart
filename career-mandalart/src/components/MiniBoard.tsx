// 목표 하나를 작게 그린 판 — 테마 고르기의 미리보기. 판 색 · 그림은 감싼 BoardProvider 의 것 (useBoard).
// 테마가 바뀌면 칸들이 다시 차례로 나타난다.
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CENTER, cellRole, cellsIn, getCell, Plan, sizeOf } from '../model';
import { useBoard } from '../theme';
import BoardCell, { Ink, paintCell } from './BoardCell';
import { layoutPlan } from './ShapeLayout';

// demo = 예시 목표: 글자가 있는 실행 과제 칸을 하나 걸러 완료로 보여 완료 색 · 그림 완성까지 미리 본다
export default function MiniBoard({ plan, demo }: { plan: Plan; demo?: boolean }) {
  const board = useBoard();
  const { width } = useWindowDimensions();
  const size = sizeOf(plan);
  const lay = layoutPlan(size, Math.min(width - 32, 340) - 12, 4, size === 1 ? 160 : 40, b => cellsIn(plan, b));
  const font = Math.max(6, Math.min(size === 1 ? 16 : 9, lay.cell * 0.2));
  return (
    <View style={[styles.tray, { backgroundColor: board.mat }]}>
      <View style={{ width: lay.width, height: lay.height }}>
        {lay.cells.map(({ block: b, cell: c, x, y }) => {
          const v = getCell(plan, b, c);
          const role = cellRole(b, c);
          const done = demo ? role === 'action' && !!v.text && c % 2 === 0 : (role === 'action' || size === 1) && v.done;
          const paint = paintCell(board, b, c, { done });
          const head = b === CENTER || c === CENTER;
          return (
            <BoardCell key={`${board.key}-${b}-${c}`} x={x} y={y} size={lay.cell} inset={1} paint={paint} picture={lay.picture}
              delay={Math.round((x + y) / lay.cell) * 22}>
              {!!v.text && (
                <Ink paint={paint} style={{ paddingHorizontal: 2, paddingVertical: 1 }}>
                  <Text numberOfLines={2} style={{ color: paint.ink, fontSize: font, lineHeight: font * 1.2, textAlign: 'center', fontWeight: head ? '800' : '500' }}>
                    {v.text}
                  </Text>
                </Ink>
              )}
            </BoardCell>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { alignSelf: 'center', padding: 6, borderRadius: 22 },
});
