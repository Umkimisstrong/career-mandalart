// DB 대신 텍스트(JSON)로 백업/복원. 화면에서는 「백업 코드」라고 부른다 — 공유 시트로 메모앱·메일·드라이브 어디로든 보낼 수 있다.
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { Store } from '../model';
import { exportJson, importJson } from '../storage';
import { useTheme } from '../theme';

type Props = {
  store: Store;
  onBack: () => void;
  // 복원한 뒤 목록(또는 하나뿐이면 그 목표)으로 바로 이동 — ids = 백업 코드에 들어 있던 목표
  onImport: (next: Store, ids: string[]) => void;
};

export default function Backup({ store, onBack, onImport }: Props) {
  const { ui } = useTheme();
  const json = exportJson(store);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');

  const share = async () => {
    try {
      await Share.share({ message: json, title: '구도 백업 코드' });
    } catch (e) {
      setMsg(`공유 실패: ${(e as Error).message}`);
    }
  };

  const restore = () => {
    try {
      const next = importJson(store, paste);
      const ids = (JSON.parse(paste).plans as { id: string }[]).map(p => p.id);
      setPaste('');
      onImport(next, ids);
    } catch (e) {
      setMsg(`복원 실패: ${(e as Error).message}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>백업 · 복원</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontWeight: '700' }}>백업하기</Text>
        <Text style={ui.sub}>모든 목표는 이 기기에만 저장돼요. 아래 「백업 코드」(모든 목표를 담은 글자 묶음)를 메모 · 메일 · 메시지로 보관해 두면 다른 기기에서 그대로 되살릴 수 있어요.</Text>
        <Pressable style={ui.btnPrimary} onPress={share}><Text style={ui.btnPrimaryText}>백업 코드 보내기 · 저장</Text></Pressable>
        <TextInput value={json} editable={false} multiline style={[ui.input, { height: 140, fontSize: 11 }]} />

        <Text style={{ fontWeight: '700', marginTop: 12 }}>복원하기</Text>
        <Text style={ui.sub}>보관해 둔 백업 코드를 통째로 붙여넣으세요. 같은 목표가 이미 있으면 백업 코드의 내용으로 바뀌어요.</Text>
        <TextInput
          value={paste} onChangeText={setPaste} multiline placeholder="백업 코드 붙여넣기"
          style={[ui.input, { height: 140, fontSize: 11 }]}
        />
        <Pressable style={ui.btn} onPress={restore} disabled={!paste.trim()}>
          <Text style={ui.btnText}>복원하기</Text>
        </Pressable>
        {!!msg && <Text style={ui.sub}>{msg}</Text>}
      </ScrollView>
    </View>
  );
}
