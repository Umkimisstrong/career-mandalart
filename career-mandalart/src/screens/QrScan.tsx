// 네이티브(iOS/Android) 전용: 카메라로 만다라트 QR 을 비춰 읽는다. 웹은 사진 선택(pickQrFromImage)을 쓴다.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Plan } from '../model';
import { decodePlan, isPlanQr } from '../qr/codec';
import { ui } from '../theme';

type Props = { onBack: () => void; onImport: (plan: Plan) => void };

export default function QrScan({ onBack, onImport }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [msg, setMsg] = useState('만다라트 QR 을 화면 가운데에 맞춰주세요.');
  const handled = useRef(false);

  const onScanned = ({ data }: { data: string }) => {
    if (handled.current) return;
    if (!isPlanQr(data)) {
      setMsg('커리어 만다라트 QR 이 아닙니다.');
      return;
    }
    try {
      handled.current = true;
      onImport(decodePlan(data));
    } catch (e) {
      handled.current = false;
      setMsg((e as Error).message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>QR로 불러오기</Text>
      </View>
      {!permission ? null : !permission.granted ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Text style={ui.sub}>QR 을 읽으려면 카메라 권한이 필요합니다.</Text>
          <Pressable style={ui.btnPrimary} onPress={requestPermission}>
            <Text style={ui.btnPrimaryText}>카메라 허용</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onScanned}
          />
          <View style={styles.frame} pointerEvents="none" />
          <Text style={styles.msg}>{msg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute', top: '20%', left: '12%', right: '12%', aspectRatio: 1,
    borderWidth: 3, borderColor: '#fff', borderRadius: 16,
  },
  msg: {
    position: 'absolute', bottom: 40, left: 16, right: 16, textAlign: 'center', color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.55)', padding: 10, borderRadius: 10, overflow: 'hidden',
  },
});
