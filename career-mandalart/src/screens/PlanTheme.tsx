// 목표 하나의 블록 테마 — 이 목표의 판(전체 · 블록 화면 · 작은 창 · 이미지 카드)만 바뀐다. 앱 화면 색은 그대로.
// 「앱 기본 따라가기」를 고르면 블록 기본 테마를 따른다. 위의 판은 이 목표 그대로라 고를 때마다 바로 바뀐다.
import { Pressable, ScrollView, Text, View } from 'react-native';
import MiniBoard from '../components/MiniBoard';
import ThemePicker, { FollowCard } from '../components/ThemePicker';
import { Plan } from '../model';
import { BlockTheme, lookLabel, useTheme } from '../theme';

type Props = {
  plan: Plan;
  // 지금 이 목표의 판 (고른 것 또는 따라가는 기본)
  look: BlockTheme;
  // 따로 고르지 않으면 따라갈 블록 기본 테마
  fallback: BlockTheme;
  onChange: (look: BlockTheme | undefined) => void;
  onBack: () => void;
};

export default function PlanTheme({ plan, look, fallback, onChange, onBack }: Props) {
  const { ui } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>블록 테마</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <MiniBoard plan={plan} />
        <Text style={[ui.sub, { textAlign: 'center', marginTop: -4 }]} numberOfLines={2}>
          「{plan.title}」의 판만 바뀌어요 · 앱 화면 색은 「테마변경」에서
        </Text>
        <FollowCard label="앱 기본 따라가기" desc={`블록 기본 테마 · ${lookLabel(fallback)}`} on={!plan.blockTheme} onPress={() => onChange(undefined)} />
        <ThemePicker board value={look} onChange={onChange} />
      </ScrollView>
    </View>
  );
}
