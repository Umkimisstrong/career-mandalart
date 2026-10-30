// DB 대신 JSON 텍스트로 백업/복원. 공유 시트로 메모앱·메일·드라이브 어디로든 보낼 수 있다.
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { Store } from '../model';
import { exportJson, importJson } from '../storage';
import { ui } from '../theme';

type Props = {
  store: Store;
  onBack: () => void;
  onImport: (next: Store) => void;
};

export default function Backup({ store, onBack, onImport }: Props) {
  const json = exportJson(store);
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState('');

  const share = async () => {
    try {
      await Share.share({ message: json, title: 'career-mandalart.json' });
    } catch (e) {
      setMsg(`공유 실패: ${(e as Error).message}`);
    }
  };

  const restore = () => {
    try {
      onImport(importJson(store, paste));
      setPaste('');
      setMsg('복원했습니다. 같은 ID 의 청사진은 덮어썼습니다.');
    } catch (e) {
      setMsg(`복원 실패: ${(e as Error).message}`);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 목록</Text></Pressable>
        <Text style={ui.headerTitle}>백업 / 복원</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontWeight: '700' }}>내보내기</Text>
        <Text style={ui.sub}>모든 데이터는 이 기기에만 저장됩니다. 기기를 바꾸기 전 JSON 을 보관하세요.</Text>
        <Pressable style={ui.btnPrimary} onPress={share}><Text style={ui.btnPrimaryText}>JSON 공유하기</Text></Pressable>
        <TextInput value={json} editable={false} multiline style={[ui.input, { height: 140, fontSize: 11 }]} />

        <Text style={{ fontWeight: '700', marginTop: 12 }}>가져오기</Text>
        <TextInput
          value={paste} onChangeText={setPaste} multiline placeholder="백업한 JSON 을 붙여넣으세요"
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
