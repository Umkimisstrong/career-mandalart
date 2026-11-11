// 목표 전체 보기 (81칸 · 또는 1 · 3 · 5 · 7칸 버전의 모양대로). 칸을 누르면 그 블록 편집 화면으로 들어간다.
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import BoardCell, { Ink, paintCell } from '../components/BoardCell';
import { layoutPlan } from '../components/ShapeLayout';
import { CENTER, cellRole, cellsIn, getCell, Plan, progress, sizeOf } from '../model';
import { useTheme } from '../theme';

type Props = {
  plan: Plan;
  onBack: () => void;
  onRename?: (title: string) => void; // 없으면 이름 고치기 막음 (팀 담당자)
  onOpenBlock: (block: number) => void;
  onQr: () => void;
  onCard: () => void;
  onTeam?: () => void; // 팀 목표만
  parentTitle?: string; // 다른 목표의 실행 과제에서 펼친 목표면 그 목표 이름
  onParent?: () => void;
  // 팀 링크 · 코드를 받은 결과처럼, 이 목표로 넘어오며 알릴 문장
  notice?: { text: string; error?: boolean };
};

export default function Overview({ plan, onBack, onRename, onOpenBlock, onQr, onCard, onTeam, parentTitle, onParent, notice }: Props) {
  const { width } = useWindowDimensions();
  const { t, ui } = useTheme();
  const size = Math.min(width, 640) - 32;
  const shape = sizeOf(plan);
  // 판 받침 둘레 TRAY px 를 빼고 놓는다. 블록 사이 간격 6px
  const lay = layoutPlan(shape, size - TRAY * 2, 6, shape === 1 ? 180 : 110, b => cellsIn(plan, b));
  const cell = lay.cell;
  const pr = progress(plan);

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <TextInput value={plan.title} onChangeText={onRename} editable={!!onRename} style={ui.headerTitle} />
        <Pressable onPress={onCard} hitSlop={8}><Text style={ui.back}>카드</Text></Pressable>
        {onTeam
          ? <Pressable onPress={onTeam} hitSlop={8}><Text style={ui.back}>👥 팀</Text></Pressable>
          : <Pressable onPress={onQr} hitSlop={8}><Text style={ui.back}>QR 저장</Text></Pressable>}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center', gap: 14 }}>
        {!!notice?.text && (
          <Text style={[ui.sub, { alignSelf: 'stretch', color: notice.error ? '#DC2626' : t.primary, fontWeight: '700' }]}>{notice.text}</Text>
        )}
        {!!parentTitle && (
          <Pressable onPress={onParent} style={{ alignSelf: 'stretch' }}>
            <Text style={[ui.sub, { color: t.accent }]} numberOfLines={1}>↖ 「{parentTitle}」의 실행 과제에서 펼친 목표</Text>
          </Pressable>
        )}
        <View style={[styles.tray, { backgroundColor: t.mat, borderRadius: t.radius.card }]}>
          <View style={{ width: lay.width, height: lay.height }}>
            {lay.cells.map(({ block: b, cell: c, x, y }) => {
              const v = getCell(plan, b, c);
              const role = cellRole(b, c);
              const tracked = role === 'action' || shape === 1;
              const paint = paintCell(t, b, c, { done: tracked && v.done });
              const owner = role === 'goal' ? plan.team?.owners[b === CENTER ? c : b] : undefined;
              const text = (v.text || (shape !== 9 && role !== 'action' ? (role === 'core' ? '핵심 목표' : '세부 목표') : ''))
                + (owner ? `\n· ${owner}` : ''); // 팀 목표: 세부 목표 칸에 담당자 이름
              return (
                <BoardCell
                  key={`${t.key}-${b}-${c}`}
                  x={x} y={y} size={cell} inset={shape === 9 ? 1.5 : 2}
                  paint={paint} picture={lay.picture}
                  // 왼쪽 위에서 오른쪽 아래로 물결처럼 차례로
                  delay={Math.round((x + y) / cell) * 18}
                  label={text || undefined}
                  onPress={() => onOpenBlock(b)}
                >
                  {!!text && (
                    <Ink paint={paint}>
                      <Text
                        numberOfLines={shape === 1 ? 6 : paint.motif ? 2 : 3}
                        style={[
                          styles.txt,
                          { fontSize: Math.min(16, Math.max(7, cell / 5.2)), color: paint.ink },
                          role !== 'action' && [{ fontWeight: role === 'core' ? '800' : '700' }, ui.titleFont],
                        ]}
                      >
                        {text}
                      </Text>
                    </Ink>
                  )}
                </BoardCell>
              );
            })}
          </View>
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

const TRAY = 6;

const styles = StyleSheet.create({
  tray: { padding: TRAY },
  txt: { textAlign: 'center' },
});
