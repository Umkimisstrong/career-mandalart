// AI 로 내보내기 (1단계) — 목표를 AI 세션의 시작 파일로. 프롬프트 복사 · GUDO.md · gudo.json 받기. 설계 docs/ai-sessions.md
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { aiGuide, aiJson, aiPrompt, buildAiDoc } from '../ai/export';
import { copyText, saveText } from '../ai/file';
import { Tap } from '../components/Motion';
import { Plan } from '../model';
import { useTheme } from '../theme';

type Props = { plan: Plan; onBack: () => void };

export default function AiExport({ plan, onBack }: Props) {
  const { t, ui } = useTheme();
  const [note, setNote] = useState('');
  const [show, setShow] = useState(false);
  const doc = useMemo(() => buildAiDoc(plan), [plan]);
  const guide = useMemo(() => aiGuide(doc), [doc]);
  const prompt = useMemo(() => aiPrompt(doc), [doc]);
  const tasks = doc.goals.reduce((n, g) => n + g.tasks.length, 0);
  const member = doc.team?.role === 'member';
  const myGoal = doc.goals.find(g => g.block === doc.team?.myBlock);
  const web = Platform.OS === 'web';

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
              : '핵심 목표가 본부 세션, 세부 목표마다 세션 하나, 실행 과제는 작업이 필요할 때만 세션을 열도록 적어요.'}
          </Text>
        </View>

        <Text style={[styles.step, { color: t.text }]}>① 대화형 AI 에 바로 쓰기</Text>
        <Tap style={ui.btnPrimary} onPress={copy}>
          <Text style={ui.btnPrimaryText}>{web ? '프롬프트 복사' : '프롬프트 보내기'}</Text>
        </Tap>
        <Text style={ui.sub}>지시서와 진행 현황(JSON)이 한 번에 들어 있어요. 진행할 때마다 AI 가 바뀐 현황을 같은 형식으로 돌려줘요.</Text>

        <Text style={[styles.step, { color: t.text }]}>② 폴더에서 세션 시작하기</Text>
        <View style={styles.row}>
          <Tap style={[ui.btn, { flex: 1 }]} onPress={() => save('GUDO.md', guide, 'text/markdown')}>
            <Text style={ui.btnText}>GUDO.md 받기</Text>
          </Tap>
          <Tap style={[ui.btn, { flex: 1 }]} onPress={() => save('gudo.json', aiJson(doc), 'application/json')}>
            <Text style={ui.btnText}>gudo.json 받기</Text>
          </Tap>
        </View>
        <Text style={ui.sub}>
          진행을 관리할 폴더를 하나 만들어 두 파일을 넣고, 그 폴더에서 AI(예: Claude Code)를 열어 「GUDO.md 를 읽고 시작해 줘」라고 하세요.
          AI 가 세부 목표 폴더를 만들고 gudo.json 에 진행을 기록해요.
        </Text>

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
  pre: { borderWidth: 1, borderRadius: 12, padding: 12 },
  mono: { fontSize: 12, lineHeight: 18, fontFamily: Platform.select({ web: 'ui-monospace, Consolas, monospace', default: undefined }) },
});
