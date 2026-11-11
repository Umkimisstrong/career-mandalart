// 테마 고르기 — 두 겹. 「앱 테마」 = 판을 뺀 화면(바탕 · 글자 · 버튼 · 글꼴), 「블록 기본 테마」 = 자기 블록 테마가 없는 목표의 판.
// 위의 미리보기 판은 블록 기본 테마로 그린 예시 목표 — 고를 때마다 조각이 차례로 다시 맞춰진다.
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MiniBoard from '../components/MiniBoard';
import { Tap } from '../components/Motion';
import ThemePicker, { FollowCard } from '../components/ThemePicker';
import { samplePlan } from '../model';
import { BlockTheme, blockThemeOf, BoardProvider, buildBoard, lookLabel, ThemeId, ThemeSetting, useTheme } from '../theme';

type Props = {
  setting?: ThemeSetting;
  // 블록 기본 테마 (Store.blockTheme) — 없으면 앱 테마와 같은 모양
  block?: BlockTheme;
  onBack: () => void;
  onChange: (setting: ThemeSetting) => void;
  onBlock: (block: BlockTheme | undefined) => void;
};

type Tab = 'app' | 'block';
const TABS: { id: Tab; label: string }[] = [{ id: 'app', label: '앱 테마' }, { id: 'block', label: '블록 기본 테마' }];

export default function ThemeSettings({ setting, block, onBack, onChange, onBlock }: Props) {
  const { t, ui } = useTheme();
  const [tab, setTab] = useState<Tab>('app');
  const plan = useMemo(samplePlan, []);
  const app = blockThemeOf(setting);
  const look = block ?? app;
  // 앱 테마는 예전 저장 형식 그대로 — 가족 · 하위 테마 · 섞은 색만 바꾸고 art(판이 따르던 그림 방식)는 그대로 둔다
  const setApp = (bt: BlockTheme) => onChange(bt.family === 'color'
    ? { ...setting, family: 'color', id: bt.variant as ThemeId, colors: bt.colors }
    : { ...(setting ?? { id: 'default' }), family: bt.family, variant: bt.variant, colors: bt.colors });

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>테마</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={[styles.tabs, { backgroundColor: t.surface, borderColor: t.border }]}>
          {TABS.map(x => {
            const on = x.id === tab;
            return (
              <Tap key={x.id} onPress={() => setTab(x.id)} shadow={on} hover={1.04}
                style={[styles.tab, { backgroundColor: on ? t.primary : 'transparent' }]}>
                <Text style={[{ color: on ? t.onPrimary : t.sub, fontSize: 15, fontWeight: on ? '800' : '600' }, on && ui.titleFont]}>{x.label}</Text>
              </Tap>
            );
          })}
        </View>

        <BoardProvider value={buildBoard(look)}>
          <MiniBoard plan={plan} demo />
        </BoardProvider>
        <Text style={[ui.sub, { textAlign: 'center', marginTop: -4 }]}>
          {tab === 'app'
            ? block ? '앱 테마는 판을 뺀 화면의 색 · 글꼴이에요. 판은 「블록 기본 테마」로 그려요.' : '판도 지금은 앱 테마와 같은 모양이에요. 「블록 기본 테마」에서 따로 고를 수 있어요.'
            : '자기 블록 테마가 없는 목표의 판이에요. 목표마다 따로 고르려면 목표 화면의 「테마」.'}
        </Text>

        {tab === 'app'
          ? <ThemePicker key="app" value={app} onChange={setApp} />
          : (
            <View key="block" style={{ gap: 14 }}>
              <FollowCard label="앱 테마와 같게" desc={`앱 테마를 바꾸면 판도 따라 바뀌어요 · ${lookLabel(app)}`} on={!block} onPress={() => onBlock(undefined)} />
              <ThemePicker board value={look} onChange={onBlock} />
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 4, gap: 4 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 999 },
});
