// 목표 1개를 한눈에 보이는 이미지 카드(1080×1350)로 만들어 SNS · 사진 앱에 저장한다.
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Switch, Text, useWindowDimensions, View } from 'react-native';
import { Plan } from '../model';
import { saveQrPng } from '../qr/image';
import { cardModel } from '../share/card';
import { renderCard } from '../share/render';
import { useTheme } from '../theme';

type Props = { plan: Plan; onBack: () => void };

export default function CardShare({ plan, onBack }: Props) {
  const { t, ui } = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width, 480) - 32;
  const [hideActions, setHideActions] = useState(false);
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    renderCard(cardModel(plan, t, { hideActions }))
      .then(url => alive && setPng(url))
      .catch(e => alive && setError((e as Error).message));
    return () => { alive = false; };
  }, [plan, t, hideActions]);

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
          <Image source={{ uri: png }} style={{ width: size, height: size * (1350 / 1080), borderRadius: 12 }} resizeMode="contain" />
        )}
        {!png && !error && <Text style={ui.sub}>카드 만드는 중…</Text>}

        <View style={{ width: size, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ flex: 1, color: t.text, fontSize: 15 }}>실행 과제 글자 숨기기</Text>
          <Switch value={hideActions} onValueChange={setHideActions} />
        </View>

        {png && (
          <Pressable style={[ui.btnPrimary, { width: size }]} onPress={() => saveQrPng(png, fileName).catch(e => setError(e.message))}>
            <Text style={ui.btnPrimaryText}>이미지 저장 / 공유</Text>
          </Pressable>
        )}
        <Text style={[ui.sub, { width: size }]}>
          {Platform.OS === 'web'
            ? '인스타그램 · 유튜브 커뮤니티에 올리기 좋은 세로(4:5) 이미지입니다. 글자를 숨기면 색과 ✓ 만 남습니다.'
            : '이미지 카드는 웹(브라우저 · 홈 화면 앱)에서 만들 수 있습니다.'}
        </Text>
      </ScrollView>
    </View>
  );
}
