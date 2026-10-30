// 청사진 1개를 QR 이미지로 만들어 사진 앱에 저장한다. 이 이미지만 있으면 어느 기기에서든 복원 가능.
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import QRCode from 'qrcode';
import { SvgXml } from 'react-native-svg';
import { Plan } from '../model';
import { encodePlan } from '../qr/codec';
import { makeQrPng, saveQrPng } from '../qr/image';
import { useTheme } from '../theme';

type Props = { plan: Plan; onBack: () => void };

export default function QrShare({ plan, onBack }: Props) {
  const { ui } = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width, 480) - 32;
  const [png, setPng] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [droppedNotes, setDroppedNotes] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const enc = encodePlan(plan);
        setDroppedNotes(enc.droppedNotes);
        if (Platform.OS === 'web') {
          const url = await makeQrPng(enc.text, plan.title);
          if (alive) setPng(url);
        } else {
          const xml = await QRCode.toString(enc.text, { type: 'svg', errorCorrectionLevel: 'L', margin: 2 });
          if (alive) setSvg(xml);
        }
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => { alive = false; };
  }, [plan]);

  const fileName = `mandalart-${plan.title.replace(/[\\/:*?"<>|\s]+/g, '_')}.png`;

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>QR로 저장</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, alignItems: 'center' }}>
        <Text style={[ui.sub, { width: size }]}>
          이 QR 이미지 한 장에 「{plan.title}」의 81칸이 모두 들어 있습니다. 사진 앱에 저장해 두면 앱을 지우거나
          기기를 바꿔도 「QR로 불러오기」로 그대로 펼칠 수 있습니다.
        </Text>

        {!!error && <Text style={{ color: '#DC2626', width: size }}>{error}</Text>}

        {png && (
          <Image source={{ uri: png }} style={{ width: size, height: size * (1240 / 1120), borderRadius: 12 }} resizeMode="contain" />
        )}
        {svg && (
          <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 12 }}>
            <SvgXml xml={svg} width={size - 24} height={size - 24} />
          </View>
        )}
        {!png && !svg && !error && <Text style={ui.sub}>QR 만드는 중…</Text>}

        {droppedNotes && (
          <Text style={[ui.sub, { width: size, color: '#B45309' }]}>
            메모까지 담기에는 내용이 많아 메모는 제외했습니다. 메모까지 보관하려면 JSON 백업을 함께 이용하세요.
          </Text>
        )}

        {png && (
          <Pressable style={[ui.btnPrimary, { width: size }]} onPress={() => saveQrPng(png, fileName).catch(e => setError(e.message))}>
            <Text style={ui.btnPrimaryText}>이미지 저장 / 공유</Text>
          </Pressable>
        )}
        <Text style={[ui.sub, { width: size }]}>
          {Platform.OS === 'web'
            ? 'iPhone: 「이미지 저장 / 공유」 → 「이미지 저장」을 누르거나, 이미지를 길게 눌러 「사진 앱에 저장」하세요.'
            : '화면을 캡처해 사진 앱에 보관하세요.'}
        </Text>
      </ScrollView>
    </View>
  );
}
