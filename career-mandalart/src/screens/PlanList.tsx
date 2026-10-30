import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CENTER, Plan, progress } from '../model';
import { ui } from '../theme';

type Props = {
  plans: Plan[];
  onOpen: (id: string) => void;
  onCreate: (title: string) => void;
  onDelete: (id: string) => void;
  onBackup: () => void;
  onScanQr: () => void;
  notice?: string;
};

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert('확인', message, [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: onYes },
  ]);
}

export default function PlanList({ plans, onOpen, onCreate, onDelete, onBackup, onScanQr, notice }: Props) {
  const [title, setTitle] = useState('');

  const create = () => {
    onCreate(title.trim() || '새 청사진');
    setTitle('');
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={ui.h1}>커리어 만다라트</Text>
      <Text style={ui.sub}>핵심 목표 1 · 세부 목표 8 · 실행 과제 64</Text>

      <View style={styles.newRow}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="새 청사진 이름 (예: 2030 커리어)"
          style={[ui.input, { flex: 1 }]}
          onSubmitEditing={create}
        />
        <Pressable style={ui.btnPrimary} onPress={create}>
          <Text style={ui.btnPrimaryText}>만들기</Text>
        </Pressable>
      </View>

      {[...plans].sort((a, b) => b.updatedAt - a.updatedAt).map(p => {
        const pr = progress(p);
        const core = p.blocks[CENTER][CENTER].text;
        return (
          <Pressable key={p.id} style={styles.card} onPress={() => onOpen(p.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardCore} numberOfLines={1}>{core || '핵심 목표를 정해보세요'}</Text>
              <View style={ui.bar}>
                <View style={[ui.barFill, { width: `${Math.round(pr.ratio * 100)}%` }]} />
              </View>
              <Text style={styles.meta}>
                실행 과제 {pr.done}/{pr.filled} 완료 · {new Date(p.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <Pressable hitSlop={10} onPress={() => confirm(`'${p.title}'을(를) 삭제할까요?`, () => onDelete(p.id))}>
              <Text style={styles.del}>삭제</Text>
            </Pressable>
          </Pressable>
        );
      })}

      {!!notice && <Text style={[ui.sub, { color: '#DC2626' }]}>{notice}</Text>}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <Pressable style={[ui.btn, { flex: 1 }]} onPress={onScanQr}>
          <Text style={ui.btnText}>QR로 불러오기</Text>
        </Pressable>
        <Pressable style={[ui.btn, { flex: 1 }]} onPress={onBackup}>
          <Text style={ui.btnText}>JSON 백업 / 복원</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  newRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cardCore: { fontSize: 14, color: '#4B5563', marginTop: 4, marginBottom: 10 },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  del: { color: '#DC2626', fontSize: 13 },
});
