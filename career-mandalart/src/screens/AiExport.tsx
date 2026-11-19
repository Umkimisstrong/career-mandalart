// AI 로 내보내기 — 단계마다 사용자가 다음에 할 일을 안내한다. 설계 docs/ai-sessions.md
//   1. AI 에게 알려 줄 내 상황 (필수) → 2. 방법 고르기 (대화형 AI · 폴더에서 세션) → 3. 다음에 할 일 (버튼이 그 자리에)
//   다음 단계는 앞 단계를 마쳐야 아래에 나타난다 (미리 보이면 어수선해서 — 사용자 결정 2026-11-19)
// 폴더 고르기는 Windows 앱에서만 (웹 · 휴대폰은 파일 받기 — 사용자 결정 2026-11-19)
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { aiGuide, aiJson, aiPrompt, buildAiDoc } from '../ai/export';
import { copyText, saveText } from '../ai/file';
import { canWrite, Folder, folderSupported, forgetFolder, pickFolder, rememberFolder, savedFolder, writeWorkspace } from '../ai/folder';
import type { AgeBand } from '../categories/data';
import { Appear, Tap } from '../components/Motion';
import { desktop } from '../desktop';
import { Plan } from '../model';
import { useTheme } from '../theme';

type Props = { plan: Plan; age?: AgeBand; onNote: (note: string) => void; onBack: () => void };
type Way = 'chat' | 'folder';

const START = 'GUDO.md 를 읽고 시작해 줘';

export default function AiExport({ plan, age, onNote, onBack }: Props) {
  const { t, ui } = useTheme();
  const [note, setNote] = useState('');
  const [show, setShow] = useState(false);
  const [way, setWay] = useState<Way | null>(null);
  const doc = useMemo(() => buildAiDoc(plan, new Date(), age), [plan, age]);
  const prompt = useMemo(() => aiPrompt(doc), [doc]);
  const tasks = doc.goals.reduce((n, g) => n + g.tasks.length, 0);
  const member = doc.team?.role === 'member';
  const myGoal = doc.goals.find(g => g.block === doc.team?.myBlock);
  const web = Platform.OS === 'web';
  // 폴더에 바로 만들기는 Windows 앱만. 웹 · 휴대폰은 파일을 받아 직접 넣는다
  const folders = !!desktop && folderSupported();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (folders) savedFolder(plan.id).then(setFolder); }, [plan.id]);

  // 내 상황은 「다음」을 눌러야 마친 것으로 (적는 도중에 다음 단계가 튀어나오지 않게). 이미 적어 둔 목표는 바로 열린 채로
  const [opened, setOpened] = useState(!!plan.aiNote?.trim());
  const step1 = opened && !!plan.aiNote?.trim();
  const step2 = step1 && way !== null;

  // 폴더에 시작 파일 만들기 — 고른 폴더는 이 목표에 기억해 다음에 같은 곳에 다시 쓴다
  const writeTo = async (dir: Folder | null) => {
    if (!dir || busy) return;
    setBusy(true);
    try {
      if (!(await canWrite(dir))) { setNote('폴더에 쓸 권한을 받지 못했어요. 다시 눌러 허락해 주세요.'); return; }
      const r = await writeWorkspace(dir, doc);
      await rememberFolder(plan.id, dir);
      setFolder(dir);
      setNote(`「${dir.name}」 폴더에 만들었어요: ${r.written.join(' · ')}${r.kept.length ? ` — 이미 있던 ${r.kept.join(' · ')} 은(는) 진행 기록이라 그대로 두었어요` : ''}.`);
    } catch (e) {
      setNote((e as Error).message || '폴더에 쓰지 못했어요.');
    } finally {
      setBusy(false);
    }
  };
  const choose = async () => {
    // 고르지 않았거나 창을 닫으면 조용히 끝나지 않게 알린다
    try {
      const dir = await pickFolder();
      if (!dir) { setNote('이 기기에서는 폴더를 고를 수 없어요. 파일 받기를 써 주세요.'); return; }
      await writeTo(dir);
    } catch (e) {
      const err = e as Error;
      setNote(err.name === 'AbortError' ? '폴더를 고르지 않았어요. 다시 눌러 폴더 안으로 들어가 「폴더 선택」을 눌러 주세요.' : `폴더를 열지 못했어요 (${err.name}: ${err.message}).`);
    }
  };
  const unlink = async () => { await forgetFolder(plan.id); setFolder(null); setNote('이 목표와 폴더의 연결을 끊었어요. 폴더 안 파일은 그대로예요.'); };

  const copy = async (text: string, done: string) => {
    const ok = await copyText(text);
    if (web) setNote(ok ? done : '복사하지 못했어요. 아래 「프롬프트 보기」에서 직접 골라 복사하세요.');
  };
  const save = async (name: string, text: string, type: string) => {
    await saveText(name, text, type);
    if (web) setNote(`${name} 을(를) 받았어요 — 작업 폴더에 넣으세요.`);
  };

  // ---- 그리기 도우미 ----
  const head = (n: string, label: string, done: boolean, hint?: string) => (
    <View style={styles.stepRow}>
      <View style={[styles.stepNum, { backgroundColor: done ? t.primary : t.surface, borderColor: done ? t.primary : t.border }]}>
        <Text style={{ color: done ? t.onPrimary : t.sub, fontSize: 12, fontWeight: '800' }}>{done ? '✓' : n}</Text>
      </View>
      <Text style={[styles.step, { color: t.text }]}>{label}</Text>
      {!!hint && <Text style={{ color: t.sub, fontSize: 12 }}>{hint}</Text>}
    </View>
  );
  const card = (id: Way, label: string, sub: string) => {
    const on = way === id;
    return (
      <Tap onPress={() => { setWay(id); setNote(''); }} accessibilityLabel={label}
        style={[styles.choice, { borderColor: on ? t.primary : t.border, backgroundColor: on ? t.primary : t.surface, borderRadius: t.radius.card }]}>
        <Text style={[{ color: on ? t.onPrimary : t.text, fontWeight: '800', fontSize: 15 }, ui.titleFont]}>{label}</Text>
        <Text style={{ color: on ? t.onPrimary : t.sub, fontSize: 12, marginTop: 4, opacity: 0.9 }}>{sub}</Text>
      </Tap>
    );
  };
  // 다음에 할 일 한 줄 — 번호 · 설명 · (있으면) 그 자리의 버튼
  const todo = (n: number, text: string, action?: ReactNode) => (
    <View key={n} style={styles.todo}>
      <Text style={[styles.todoNum, { color: t.primary }]}>{n}</Text>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={[styles.p, { color: t.text }]}>{text}</Text>
        {action}
      </View>
    </View>
  );

  const chatTodos = [
    todo(1, '프롬프트를 복사하세요. 지시서와 진행 현황(JSON)이 한 번에 들어 있어요.',
      <Tap style={ui.btnPrimary} onPress={() => copy(prompt, '복사했어요 — 이제 AI 대화창에 붙여넣으세요.')}>
        <Text style={ui.btnPrimaryText}>{web ? '프롬프트 복사' : '프롬프트 보내기'}</Text>
      </Tap>),
    todo(2, 'Claude · ChatGPT · Gemini 에서 새 대화를 열고 붙여넣으세요.'),
    todo(3, 'AI 가 목표 요약과 세션 계획을 보여 주면, 읽어 보고 「승인」하거나 고칠 점을 답하세요.'),
    todo(4, '진행하면서 AI 가 돌려주는 gudo.json(진행 현황)은 보관해 두세요. 구도로 가져오기는 다음 업데이트에서 열려요.'),
  ];
  const folderTodos = folders ? [
    todo(1, folder ? `연결된 폴더 「${folder.name}」 에 시작 파일을 만들거나, 다른 폴더를 고르세요.` : '진행을 관리할 폴더를 고르세요. GUDO.md · gudo.json · 세부 목표 폴더가 바로 만들어져요.',
      <View style={{ gap: 8 }}>
        {folder && (
          <View style={[styles.folder, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.p, { color: t.text, flex: 1 }]} numberOfLines={1}>📁 {folder.name}</Text>
            <Pressable onPress={unlink} hitSlop={8} accessibilityLabel="폴더 연결 끊기"><Text style={ui.sub}>연결 끊기</Text></Pressable>
          </View>
        )}
        <View style={styles.row}>
          {folder && (
            <Tap style={[ui.btnPrimary, { flex: 1 }]} onPress={() => writeTo(folder)} accessibilityLabel="이 폴더에 다시 만들기">
              <Text style={ui.btnPrimaryText}>{busy ? '만드는 중…' : '이 폴더에 만들기'}</Text>
            </Tap>
          )}
          <Tap style={[folder ? ui.btn : ui.btnPrimary, { flex: 1 }]} onPress={choose} accessibilityLabel="폴더 고르기">
            <Text style={folder ? ui.btnText : ui.btnPrimaryText}>{folder ? '다른 폴더' : '📁 폴더 고르기'}</Text>
          </Tap>
        </View>
        <Text style={ui.sub}>AI 가 기록 중인 gudo.json · README.md 는 덮어쓰지 않고, 지시서(GUDO.md)만 새로 써요.</Text>
      </View>),
    todo(2, '그 폴더에서 AI 도구(예: Claude Code)를 여세요.'),
    todo(3, `AI 에게 「${START}」라고 입력하세요.`,
      <Tap style={ui.btn} onPress={() => copy(START, '문장을 복사했어요 — AI 에 붙여넣으세요.')}><Text style={ui.btnText}>문장 복사</Text></Tap>),
    todo(4, 'AI 가 세션 계획을 보여 주면 확인 · 승인하세요. 이후 진행은 세부 목표 폴더의 README.md 와 gudo.json 에 기록돼요.'),
  ] : [
    todo(1, '진행을 관리할 폴더를 하나 만드세요 (예: 바탕화면에 「구도-목표 이름」).'),
    todo(2, '두 파일을 받아 그 폴더에 넣으세요.',
      <View style={styles.row}>
        <Tap style={[ui.btn, { flex: 1 }]} onPress={() => save('GUDO.md', aiGuide(doc), 'text/markdown')}><Text style={ui.btnText}>GUDO.md 받기</Text></Tap>
        <Tap style={[ui.btn, { flex: 1 }]} onPress={() => save('gudo.json', aiJson(doc), 'application/json')}><Text style={ui.btnText}>gudo.json 받기</Text></Tap>
      </View>),
    todo(3, `그 폴더에서 AI 도구(예: Claude Code)를 열고 「${START}」라고 입력하세요.`,
      <Tap style={ui.btn} onPress={() => copy(START, '문장을 복사했어요 — AI 에 붙여넣으세요.')}><Text style={ui.btnText}>문장 복사</Text></Tap>),
    todo(4, 'AI 가 세션 계획을 보여 주면 확인 · 승인하세요. Windows 앱에서는 폴더를 골라 파일을 바로 만들 수 있어요.'),
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <Pressable onPress={onBack}><Text style={ui.back}>‹ 전체</Text></Pressable>
        <Text style={ui.headerTitle} numberOfLines={1}>AI 로 내보내기</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, borderRadius: t.radius.card }]}>
          <Text style={[styles.h, { color: t.text }, ui.titleFont]}>「{plan.title}」</Text>
          <Text style={ui.sub}>핵심 목표 「{doc.core.text || '비어 있음'}」 · 세부 목표 {doc.goals.length}개 · 실행 과제 {tasks}개</Text>
          <Text style={[styles.p, { color: t.text }]}>
            {member
              ? myGoal
                ? `팀 목표 전체를 맥락으로 담고, AI 에게는 「${myGoal.no}. ${myGoal.text || '내 세부 목표'}」 담당 세션만 만들도록 적어요.`
                : '보기 전용으로 받은 팀 목표예요. AI 는 세션을 만들지 않고 정리 · 질문만 도와요.'
              : '핵심 목표가 본부 세션, 세부 목표마다 세션 하나, 실행 과제는 결과물이 나올 때만 세션을 열도록 AI 에게 지시서를 만들어 줘요.'}
          </Text>
        </View>

        {/* 1. 내 상황 (필수) */}
        {head('1', 'AI 에게 알려 줄 내 상황', step1, '필수')}
        <TextInput
          value={plan.aiNote ?? ''}
          onChangeText={onNote}
          multiline
          placeholder="예: 백엔드 개발, 5년 차, 정보처리기사 있음 · AWS 준비 중, 주 5시간, 클라우드 아키텍트"
          placeholderTextColor={t.sub}
          accessibilityLabel="AI 에게 알려 줄 내 상황"
          style={[ui.input, { minHeight: 84, textAlignVertical: 'top', borderColor: step1 ? t.border : t.primary }]}
        />
        <Text style={ui.sub}>
          직무 · 분야 / 경력 / 가진 · 따고 싶은 자격증 / 주당 쓸 수 있는 시간 / 10년 후 되고 싶은 모습 — 이 다섯 가지를 적으면 AI 가 되묻지 않고 내게 맞춰 계획을 세워요.{doc.me.age ? ` 연령대(${doc.me.age})도 함께 담겨요.` : ''} 이 기기에만 저장돼요.
        </Text>
        {!step1 && (
          <Tap style={ui.btnPrimary} accessibilityLabel="다음"
            onPress={() => (plan.aiNote?.trim() ? (setOpened(true), setNote('')) : setNote('먼저 내 상황을 적어 주세요.'))}>
            <Text style={ui.btnPrimaryText}>다음</Text>
          </Tap>
        )}

        {/* 2. 방법 고르기 — 내 상황을 마치면 나타난다 */}
        {step1 && (
          <Appear style={{ gap: 10 }}>
            {head('2', '방법 고르기', step2)}
            <View style={styles.row}>
              {card('chat', '💬 대화형 AI', '프롬프트를 복사해 Claude · ChatGPT · Gemini 대화창에 붙여넣기')}
              {card('folder', '📁 폴더에서 세션', folders ? '폴더를 고르면 시작 파일을 만들고, 그 폴더에서 AI 도구로 진행' : '시작 파일을 받아 폴더에 넣고, 그 폴더에서 AI 도구로 진행')}
            </View>
          </Appear>
        )}

        {/* 3. 다음에 할 일 — 방법을 고르면 나타난다 (바꾸면 다시) */}
        {step2 && (
          <Appear key={way} style={{ gap: 12 }}>
            {head('3', '다음에 할 일', false)}
            {way === 'chat' ? chatTodos : folderTodos}
          </Appear>
        )}

        {!!note && <Text style={[ui.sub, { color: t.primary, fontWeight: '700' }]}>{note}</Text>}

        {step1 && (
          <Pressable onPress={() => setShow(!show)} accessibilityLabel="프롬프트 보기">
            <Text style={[ui.back, { paddingVertical: 4 }]}>{show ? '▾ 프롬프트 접기' : '▸ 프롬프트 보기'}</Text>
          </Pressable>
        )}
        {step1 && show && (
          <View style={[styles.pre, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text selectable style={[styles.mono, { color: t.text }]}>{prompt}</Text>
          </View>
        )}

        <Text style={ui.sub}>구도는 AI 에 아무것도 보내지 않아요. 내보낸 내용은 직접 붙여넣거나 넣은 곳에만 있어요.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { borderWidth: 1, padding: 16, gap: 6 },
  h: { fontSize: 18 },
  p: { fontSize: 14, lineHeight: 21 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  stepNum: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  step: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, borderWidth: 1, padding: 14 },
  todo: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  todoNum: { width: 18, fontSize: 15, fontWeight: '800', lineHeight: 21, textAlign: 'center' },
  folder: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  pre: { borderWidth: 1, borderRadius: 12, padding: 12 },
  mono: { fontSize: 12, lineHeight: 18, fontFamily: Platform.select({ web: 'ui-monospace, Consolas, monospace', default: undefined }) },
});
