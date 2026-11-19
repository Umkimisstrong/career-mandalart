// AI 로 내보내기 — 목표를 AI 세션의 시작 파일로. ① 프롬프트 복사 ② 폴더 고르기(2단계) 또는 GUDO.md · gudo.json 받기. 설계 docs/ai-sessions.md
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { aiGuide, aiJson, aiPrompt, buildAiDoc } from '../ai/export';
import { copyText, saveText } from '../ai/file';
import { canWrite, Folder, folderSupported, forgetFolder, pickFolder, rememberFolder, savedFolder, writeWorkspace } from '../ai/folder';
import type { AgeBand } from '../categories/data';
import { Tap } from '../components/Motion';
import { Plan } from '../model';
import { useTheme } from '../theme';

type Props = { plan: Plan; age?: AgeBand; onNote: (note: string) => void; onBack: () => void };

export default function AiExport({ plan, age, onNote, onBack }: Props) {
  const { t, ui } = useTheme();
  const [note, setNote] = useState('');
  const [show, setShow] = useState(false);
  const doc = useMemo(() => buildAiDoc(plan, new Date(), age), [plan, age]);
  const guide = useMemo(() => aiGuide(doc), [doc]);
  const prompt = useMemo(() => aiPrompt(doc), [doc]);
  const tasks = doc.goals.reduce((n, g) => n + g.tasks.length, 0);
  const member = doc.team?.role === 'member';
  const myGoal = doc.goals.find(g => g.block === doc.team?.myBlock);
  const web = Platform.OS === 'web';
  const folders = folderSupported();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (folders) savedFolder(plan.id).then(setFolder); }, [plan.id]);

  // 폴더에 시작 파일 만들기 — 고른 폴더는 이 목표에 기억해 다음에 같은 곳에 다시 쓴다
  const writeTo = async (dir: Folder | null) => {
    if (!dir || busy) return;
    setBusy(true);
    try {
      if (!(await canWrite(dir))) { setNote('폴더에 쓸 권한을 받지 못했어요. 다시 눌러 허락해 주세요.'); return; }
      const r = await writeWorkspace(dir, doc);
      await rememberFolder(plan.id, dir);
      setFolder(dir);
      setNote(`「${dir.name}」 폴더에 만들었어요: ${r.written.join(' · ')}${r.kept.length ? ` — 이미 있던 ${r.kept.join(' · ')} 은(는) 진행 기록이라 그대로 두었어요` : ''}. 이 폴더에서 AI 를 열어 「GUDO.md 를 읽고 시작해 줘」라고 하세요.`);
    } catch (e) {
      setNote((e as Error).message || '폴더에 쓰지 못했어요.');
    } finally {
      setBusy(false);
    }
  };
  const choose = async () => {
    // 고르지 않았거나 브라우저가 폴더 창을 막으면(앱 안 미리보기 창 등) 조용히 끝나지 않게 알린다
    try {
      const dir = await pickFolder();
      if (!dir) {
        setNote('폴더를 받지 못했어요. 폴더를 고른 뒤 뜨는 「사이트에서 파일을 보도록 · 수정하도록 허용」 창에서 둘 다 「허용」을 눌러야 해요. 바탕화면 · 문서 · 사용자 폴더 자체는 브라우저가 막으니 그 안에 만든 새 폴더를 고르세요.');
        return;
      }
      await writeTo(dir);
    } catch (e) {
      setNote(`폴더를 열지 못했어요: ${(e as Error).message} — Windows 앱이나 Chrome · Edge 에서 해 보세요.`);
    }
  };
  const unlink = async () => { await forgetFolder(plan.id); setFolder(null); setNote('이 목표와 폴더의 연결을 끊었어요. 폴더 안 파일은 그대로예요.'); };

  const copy = async () => {
    const ok = await copyText(prompt);
    if (web) setNote(ok ? '복사했어요 — Claude · ChatGPT · Gemini 대화창에 붙여넣으세요.' : '복사하지 못했어요. 아래 「프롬프트 보기」에서 직접 골라 복사하세요.');
  };
  const save = async (name: string, text: string, type: string) => {
    await saveText(name, text, type);
    if (web) setNote(`${name} 을(를) 받았어요 — 작업 폴더에 넣으세요.`);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>AI 로 내보내기</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, borderRadius: t.radius.card }]}>
          <Text style={[styles.h, { color: t.text }, ui.titleFont]}>「{plan.title}」</Text>
          <Text style={ui.sub}>
            핵심 목표 「{doc.core.text || '비어 있음'}」 · 세부 목표 {doc.goals.length}개 · 실행 과제 {tasks}개
          </Text>
          <Text style={[styles.p, { color: t.text }]}>
            {member
              ? myGoal
                ? `팀 목표 전체를 맥락으로 담고, AI 에게는 「${myGoal.no}. ${myGoal.text || '내 세부 목표'}」 담당 세션만 만들도록 적어요.`
                : '보기 전용으로 받은 팀 목표예요. AI 는 세션을 만들지 않고 정리 · 질문만 도와요.'
              : '핵심 목표가 본부 세션, 세부 목표마다 세션 하나, 실행 과제는 결과물이 나올 때만 세션을 열고, 빈 세부 목표는 실행 과제 제안부터 하도록 적어요.'}
          </Text>
        </View>

        <Text style={[styles.step, { color: t.text }]}>AI 에게 알려 줄 내 상황 <Text style={[ui.sub, { fontWeight: '400' }]}>(선택)</Text></Text>
        <TextInput
          value={plan.aiNote ?? ''}
          onChangeText={onNote}
          multiline
          placeholder={'예: 백엔드 개발, 5년 차, 정보처리기사 있음 · AWS 준비 중, 주 5시간, 클라우드 아키텍트'}
          placeholderTextColor={t.sub}
          accessibilityLabel="AI 에게 알려 줄 내 상황"
          style={[ui.input, { minHeight: 84, textAlignVertical: 'top' }]}
        />
        <Text style={ui.sub}>
          직무 · 분야 / 경력 / 가진 · 따고 싶은 자격증 / 주당 쓸 수 있는 시간 / 10년 후 되고 싶은 모습 — 이 다섯 가지를 적으면 AI 가 되묻지 않고 내게 맞춰 세워요.{doc.me.age ? ` 연령대(${doc.me.age})도 함께 담겨요.` : ''} 이 기기에만 저장돼요.
        </Text>

        <Text style={[styles.step, { color: t.text }]}>① 대화형 AI 에 바로 쓰기</Text>
        <Tap style={ui.btnPrimary} onPress={copy}>
          <Text style={ui.btnPrimaryText}>{web ? '프롬프트 복사' : '프롬프트 보내기'}</Text>
        </Tap>
        <Text style={ui.sub}>지시서와 진행 현황(JSON)이 한 번에 들어 있어요. 진행할 때마다 AI 가 바뀐 현황을 같은 형식으로 돌려줘요.</Text>

        <Text style={[styles.step, { color: t.text }]}>② 폴더에서 세션 시작하기</Text>
        {folders && (
          <>
            {folder && (
              <View style={[styles.folder, { backgroundColor: t.surface, borderColor: t.border }]}>
                <Text style={[styles.p, { color: t.text, flex: 1 }]} numberOfLines={1}>📁 {folder.name}</Text>
                <Pressable onPress={unlink} hitSlop={8} accessibilityLabel="폴더 연결 끊기"><Text style={ui.sub}>연결 끊기</Text></Pressable>
              </View>
            )}
            <View style={styles.row}>
              {folder && (
                <Tap style={[ui.btnPrimary, { flex: 1 }]} onPress={() => writeTo(folder)} accessibilityLabel="이 폴더에 다시 만들기">
                  <Text style={ui.btnPrimaryText}>{busy ? '만드는 중…' : '이 폴더에 다시 만들기'}</Text>
                </Tap>
              )}
              <Tap style={[folder ? ui.btn : ui.btnPrimary, { flex: 1 }]} onPress={choose} accessibilityLabel="폴더 고르기">
                <Text style={folder ? ui.btnText : ui.btnPrimaryText}>{folder ? '다른 폴더' : '📁 폴더 고르기'}</Text>
              </Tap>
            </View>
            <Text style={ui.sub}>
              진행을 관리할 폴더를 고르면 GUDO.md · gudo.json · 세부 목표 폴더(README.md)를 바로 만들어요. AI 가 기록 중인 gudo.json · README.md 는 덮어쓰지 않고, 지시서(GUDO.md)만 새로 써요. 파일로 받으려면 아래 버튼을 쓰세요.
            </Text>
          </>
        )}
        <View style={styles.row}>
          <Tap style={[ui.btn, { flex: 1 }]} onPress={() => save('GUDO.md', guide, 'text/markdown')}>
            <Text style={ui.btnText}>GUDO.md 받기</Text>
          </Tap>
          <Tap style={[ui.btn, { flex: 1 }]} onPress={() => save('gudo.json', aiJson(doc), 'application/json')}>
            <Text style={ui.btnText}>gudo.json 받기</Text>
          </Tap>
        </View>
        {!folders && (
          <Text style={ui.sub}>
            진행을 관리할 폴더를 하나 만들어 두 파일을 넣고, 그 폴더에서 AI(예: Claude Code)를 열어 「GUDO.md 를 읽고 시작해 줘」라고 하세요.
            AI 가 세부 목표 폴더를 만들고 gudo.json 에 진행을 기록해요. (폴더 고르기는 Windows 앱 · PC Chrome · Edge 에서 돼요)
          </Text>
        )}

        {!!note && <Text style={[ui.sub, { color: t.primary, fontWeight: '700' }]}>{note}</Text>}

        <Pressable onPress={() => setShow(!show)} accessibilityLabel="프롬프트 보기">
          <Text style={[ui.back, { paddingVertical: 4 }]}>{show ? '▾ 프롬프트 접기' : '▸ 프롬프트 보기'}</Text>
        </Pressable>
        {show && (
          <View style={[styles.pre, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text selectable style={[styles.mono, { color: t.text }]}>{prompt}</Text>
          </View>
        )}

        <Text style={ui.sub}>
          구도는 AI 에 아무것도 보내지 않아요. 내보낸 내용은 직접 붙여넣거나 넣은 곳에만 있어요. 진행 현황을 구도로 다시 가져오는 기능은 다음 단계에서 열려요.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { borderWidth: 1, padding: 16, gap: 6 },
  h: { fontSize: 18 },
  p: { fontSize: 14, lineHeight: 21 },
  step: { fontSize: 15, fontWeight: '800', marginTop: 6 },
  row: { flexDirection: 'row', gap: 8 },
  folder: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  pre: { borderWidth: 1, borderRadius: 12, padding: 12 },
  mono: { fontSize: 12, lineHeight: 18, fontFamily: Platform.select({ web: 'ui-monospace, Consolas, monospace', default: undefined }) },
});
