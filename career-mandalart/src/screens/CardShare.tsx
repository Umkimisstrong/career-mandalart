// 목표 1개를 한눈에 보이는 이미지 카드(1080×1350)로 만들어 SNS · 사진 앱에 저장한다.
// 판은 그 목표의 블록 테마 그대로. 그림 테마면 퍼즐 그림을 켜고 끄고, 그림을 얼마나 흐리게 할지 고른다.
import { useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { Plan } from '../model';
import { saveQrPng } from '../qr/image';
import { cardModel } from '../share/card';
import { renderCard } from '../share/render';
import { Tap } from '../components/Motion';
import { BlockTheme, buildBoard, REVEAL, useTheme } from '../theme';

type Props = { plan: Plan; look: BlockTheme; onBack: () => void };

// 배경 흐리게 0 · 10 · … · 100%
const STEPS = Array.from({ length: 11 }, (_, i) => i / 10);

export default function CardShare({ plan, look, onBack }: Props) {
  const { t, ui } = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width, 480) - 32;
  const [hideActions, setHideActions] = useState(false);
  const picture = look.family !== 'color';
  const [puzzle, setPuzzle] = useState(picture && look.art === 'puzzle');
  const [blur, setBlur] = useState(look.art === 'puzzle' && look.reveal ? REVEAL : 0);
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState('');

  // 퍼즐 그림을 끄면 같은 그림 테마의 「블록마다 그림」으로
  const base = buildBoard({ ...look, art: puzzle ? 'puzzle' : 'motif' });
  const board = useMemo(() => ({ ...base, fade: puzzle ? blur : 0 }), [base, puzzle, blur]);

  useEffect(() => {
    let alive = true;
    renderCard(cardModel(plan, board, { hideActions }))
      .then(url => alive && setPng(url))
      .catch(e => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, [plan, board, hideActions]);

  const fileName = `gudo-card-${plan.title.replace(/[\\/:*?"<>|\s]+/g, '_')}.png`;

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>이미지 카드</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, alignItems: 'center' }}>
        {!!error && <Text style={{ color: '#DC2626', width: size }}>{error}</Text>}

        {png && (
          <Image source={{ uri: png }} style={{ width: size, height: size * (1350 / 1080), borderRadius: 12 }} resizeMode="contain" accessibilityLabel="이미지 카드 미리보기" />
        )}
        {!png && !error && <Text style={ui.sub}>카드 만드는 중…</Text>}

        <View style={[styles.row, { width: size }]}>
          <Text style={[styles.label, { color: t.text }]}>실행 과제 글자 숨기기</Text>
          <Switch value={hideActions} onValueChange={setHideActions} accessibilityLabel="실행 과제 글자 숨기기" />
        </View>
        {picture && (
          <View style={[styles.row, { width: size }]}>
            <Text style={[styles.label, { color: t.text }]}>퍼즐 그림</Text>
            <Switch value={puzzle} onValueChange={setPuzzle} accessibilityLabel="퍼즐 그림" />
          </View>
        )}
        {puzzle && (
          <View style={{ width: size, gap: 8 }}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: t.text }]}>배경 흐리게</Text>
              <Text style={{ color: t.sub, fontWeight: '700', fontSize: 14 }}>{Math.round(blur * 100)}%</Text>
            </View>
            <View style={styles.steps}>
              {STEPS.map(v => (
                <Tap key={v} onPress={() => setBlur(v)} hover={1.15} press={0.8} shadow={false}
                  accessibilityLabel={`배경 흐리게 ${Math.round(v * 100)}%`}
                  style={[styles.step, { backgroundColor: v <= blur ? t.primary : t.border }]} />
              ))}
            </View>
            <Text style={ui.sub}>
              {look.reveal ? '아직 못 한 조각만 흐려지고, 끝낸 조각은 또렷하게 남아요.' : '그림 전체가 흐려져 글자가 더 잘 보여요.'}
            </Text>
          </View>
        )}

        {png && (
          <Tap style={[ui.btnPrimary, { width: size }]} onPress={() => saveQrPng(png, fileName).catch(e => setError(e.message))}>
            <Text style={ui.btnPrimaryText}>이미지 저장 / 공유</Text>
          </Tap>
        )}
        <Text style={[ui.sub, { width: size }]}>
          {Platform.OS === 'web'
            ? '인스타그램 · 유튜브 커뮤니티에 올리기 좋은 세로(4:5) 이미지입니다. 판은 이 목표의 블록 테마로 그리고, 글자를 숨기면 색 · 그림과 ✓ 만 남습니다.'
            : '이미지 카드는 웹(브라우저 · 홈 화면 앱)에서 만들 수 있습니다.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { flex: 1, fontSize: 15 },
  steps: { flexDirection: 'row', gap: 4 },
  step: { flex: 1, height: 16, borderRadius: 8 },
});
