// 81칸 전체 청사진. 블록을 누르면 해당 블록 편집 화면으로 들어간다.
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { CENTER, cellRole, getCell, Plan, progress } from '../model';
import { blockColor, blockTextColor, ui } from '../theme';

type Props = {
  plan: Plan;
  onBack: () => void;
  onRename: (title: string) => void;
  onOpenBlock: (block: number) => void;
};

const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function Overview({ plan, onBack, onRename, onOpenBlock }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.min(width, 640) - 32;
  const cell = (size - 2 * 6) / 9; // 블록 사이 간격 6px
  const pr = progress(plan);

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <TextInput value={plan.title} onChangeText={onRename} style={ui.headerTitle} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 14 }}>
        <View style={[styles.grid, { width: size, gap: 6 }]}>
          {IDX.map(b => (
            <Pressable
              key={b}
              onPress={() => onOpenBlock(b)}
              style={[styles.block, { width: cell * 3, borderColor: blockColor(b) }]}
            >
              {IDX.map(c => {
                const v = getCell(plan, b, c);
                const role = cellRole(b, c);
                const filled = role !== 'action';
                return (
                  <View
                    key={c}
                    style={[
                      styles.cell,
                      { width: cell, height: cell },
                      filled && { backgroundColor: blockColor(b === CENTER ? c : b) },
                      role === 'core' && { backgroundColor: blockColor(CENTER) },
                      v.done && styles.done,
                    ]}
                  >
                    <Text
                      numberOfLines={3}
                      style={[
                        styles.txt,
                        { fontSize: Math.max(7, cell / 5.2) },
                        role === 'core' && { color: blockTextColor(CENTER), fontWeight: '800' },
                        role === 'goal' && { fontWeight: '700' },
                        v.done && styles.doneText,
                      ]}
                    >
                      {v.text}
                    </Text>
                  </View>
                );
              })}
            </Pressable>
          ))}
        </View>

        <View style={{ width: size, gap: 6 }}>
          <View style={ui.bar}><View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} /></View>
          <Text style={ui.sub}>실행 과제 {pr.done}/{pr.filled} 완료 · 블록을 눌러 설계하세요</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  block: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 0, borderRadius: 6, overflow: 'hidden' },
  cell: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: '#D1D5DB', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', padding: 1,
  },
  txt: { textAlign: 'center', color: '#111827' },
  done: { backgroundColor: '#D1FAE5' },
  doneText: { color: '#047857' },
});
