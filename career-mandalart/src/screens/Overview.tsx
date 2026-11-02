// 청사진 전체 보기 (81칸 · 또는 1 · 3 · 5 · 7칸 버전의 모양대로). 칸을 누르면 그 블록 편집 화면으로 들어간다.
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { layoutPlan } from '../components/ShapeLayout';
import { CENTER, cellRole, getCell, Plan, progress, sizeOf } from '../model';
import { useTheme } from '../theme';

type Props = {
  plan: Plan;
  onBack: () => void;
  onRename: (title: string) => void;
  onOpenBlock: (block: number) => void;
  onQr: () => void;
};

export default function Overview({ plan, onBack, onRename, onOpenBlock, onQr }: Props) {
  const { width } = useWindowDimensions();
  const { t, ui } = useTheme();
  const size = Math.min(width, 640) - 32;
  const shape = sizeOf(plan);
  const lay = layoutPlan(shape, size, 6, shape === 1 ? 180 : 110); // 블록 사이 간격 6px
  const cell = lay.cell;
  const pr = progress(plan);

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <TextInput value={plan.title} onChangeText={onRename} style={ui.headerTitle} />
        <Pressable onPress={onQr} hitSlop={8}><Text style={ui.back}>QR 저장</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 14 }}>
        <View style={{ width: lay.width, height: lay.height }}>
          {lay.cells.map(({ block: b, cell: c, x, y }) => {
            const v = getCell(plan, b, c);
            const role = cellRole(b, c);
            const tracked = role === 'action' || shape === 1;
            const bg = tracked && role === 'action'
              ? (v.done ? t.done : t.surface)
              : t.blocks[role === 'core' ? CENTER : b === CENTER ? c : b];
            return (
              <Pressable
                key={`${b}-${c}`}
                onPress={() => onOpenBlock(b)}
                style={[styles.cell, {
                  left: x, top: y, width: cell, height: cell, backgroundColor: bg, borderColor: t.border,
                  borderRadius: shape === 9 ? 0 : 6,
                }, shape === 1 && v.done && { borderColor: t.doneBorder, borderWidth: 3 }]}
              >
                <Text
                  numberOfLines={shape === 1 ? 6 : 3}
                  style={[
                    styles.txt,
                    { fontSize: Math.min(16, Math.max(7, cell / 5.2)), color: role === 'action' ? t.text : t.on(bg) },
                    role === 'core' && { fontWeight: '800' },
                    role === 'goal' && { fontWeight: '700' },
                    role === 'action' && v.done && { color: t.doneText },
                  ]}
                >
                  {v.text || (shape !== 9 && role !== 'action' ? (role === 'core' ? '핵심 목표' : '세부 목표') : '')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ width: size, gap: 6 }}>
          <View style={ui.bar}><View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} /></View>
          <Text style={ui.sub}>
            {shape === 1 ? `목표 ${pr.done}/${pr.filled} 완료 · 칸을 눌러 적어 보세요` : `실행 과제 ${pr.done}/${pr.filled} 완료 · 블록을 눌러 설계하세요`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    position: 'absolute', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: 1,
  },
  txt: { textAlign: 'center' },
});
