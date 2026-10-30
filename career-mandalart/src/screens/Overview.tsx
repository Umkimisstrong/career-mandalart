// 81칸 전체 청사진. 블록을 누르면 해당 블록 편집 화면으로 들어간다.
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { CENTER, cellRole, getCell, Plan, progress } from '../model';
import { useTheme } from '../theme';

type Props = {
  plan: Plan;
  onBack: () => void;
  onRename: (title: string) => void;
  onOpenBlock: (block: number) => void;
  onQr: () => void;
};

const IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export default function Overview({ plan, onBack, onRename, onOpenBlock, onQr }: Props) {
  const { width } = useWindowDimensions();
  const { t, ui } = useTheme();
  const size = Math.min(width, 640) - 32;
  const cell = (size - 2 * 6) / 9; // 블록 사이 간격 6px
  const pr = progress(plan);

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <TextInput value={plan.title} onChangeText={onRename} style={ui.headerTitle} />
        <Pressable onPress={onQr} hitSlop={8}><Text style={ui.back}>QR 저장</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 14 }}>
        <View style={[styles.grid, { width: size, gap: 6 }]}>
          {IDX.map(b => (
            <Pressable
              key={b}
              onPress={() => onOpenBlock(b)}
              style={[styles.block, { width: cell * 3 }]}
            >
              {IDX.map(c => {
                const v = getCell(plan, b, c);
                const role = cellRole(b, c);
                const bg = role === 'action'
                  ? (v.done ? t.done : t.surface)
                  : t.blocks[role === 'core' ? CENTER : b === CENTER ? c : b];
                return (
                  <View
                    key={c}
                    style={[styles.cell, { width: cell, height: cell, backgroundColor: bg, borderColor: t.border }]}
                  >
                    <Text
                      numberOfLines={3}
                      style={[
                        styles.txt,
                        { fontSize: Math.max(7, cell / 5.2), color: role === 'action' ? t.text : t.on(bg) },
                        role === 'core' && { fontWeight: '800' },
                        role === 'goal' && { fontWeight: '700' },
                        role === 'action' && v.done && { color: t.doneText },
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
    borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: 1,
  },
  txt: { textAlign: 'center' },
});
