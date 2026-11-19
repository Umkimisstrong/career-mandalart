// AI 로 내보내기 (1단계) — 목표 하나를 AI 세션이 읽을 수 있는 두 파일로 만든다. 설계 docs/ai-sessions.md
//   GUDO.md   본부 지시서: 목표 구조 · 세션 규칙 · 진행 기록 규칙 (사람과 AI 가 모두 읽는 글)
//   gudo.json 진행 현황: 칸마다 id(블록-칸) · 문장 · 완료 · 상태 · 메모 — AI 가 고치고, 다음 단계에서 앱이 가져온다
// 앱은 AI 를 부르지 않는다. 사용자가 파일을 폴더에 두거나 프롬프트를 붙여넣는다.
import { catInfo } from '../categories/data';
import { blocksOf, CENTER, cellsIn, getCell, Plan, sizeOf } from '../model';
import { routineLabel } from '../routine';

export const AI_FORMAT = 'gudo-ai/1';

export type AiStatus = 'todo' | 'doing' | 'done' | 'skip';
export type AiTask = {
  id: string; // "블록-칸" — 앱으로 되돌릴 때의 열쇠 (바꾸지 않는다)
  text: string;
  done: boolean;
  status: AiStatus;
  note: string;
  routine?: string; // 반복 점검 (읽기 전용 안내)
  items?: { text: string; done: boolean }[];
  updatedAt: string | null; // AI 가 고칠 때 ISO 시각
};
export type AiGoal = {
  no: number; // 세부 목표 번호 1..
  id: string; // 세부 목표 칸 "4-블록"
  block: number;
  text: string;
  category?: string;
  folder: string; // 이 세부 목표 세션의 작업 폴더
  mine: boolean; // 팀 목표에서 내가 맡은 블록 (개인 목표는 모두 true)
  tasks: AiTask[];
};
export type AiDoc = {
  format: typeof AI_FORMAT;
  planId: string;
  title: string;
  size: number;
  exportedAt: string;
  team: null | { role: 'admin' | 'member'; myBlock: number | null; myGoal: string | null };
  core: { id: string; text: string; note: string; category?: string };
  goals: AiGoal[];
};

// 폴더 이름에 쓸 수 없는 글자를 뺀다
const folderName = (no: number, text: string) =>
  `${String(no).padStart(2, '0')}-${(text.trim() || `세부 목표 ${no}`).replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30)}`;

export function buildAiDoc(plan: Plan, now = new Date()): AiDoc {
  const size = sizeOf(plan);
  const team = plan.team;
  const myBlock = team?.role === 'member' ? team.block ?? null : null;
  const core = getCell(plan, CENTER, CENTER);
  const goals = blocksOf(size).filter(b => b !== CENTER).map((b, i): AiGoal => {
    const g = getCell(plan, CENTER, b);
    return {
      no: i + 1,
      id: `${CENTER}-${b}`,
      block: b,
      text: g.text,
      category: catInfo(g.cat)?.label,
      folder: folderName(i + 1, g.text),
      mine: !team || team.role === 'admin' || myBlock === b,
      tasks: cellsIn(plan, b).filter(c => c !== CENTER).map(c => ({ c, v: getCell(plan, b, c) })).filter(({ v }) => v.text.trim()).map(({ c, v }) => ({
        id: `${b}-${c}`,
        text: v.text,
        done: v.done,
        status: v.done ? 'done' : 'todo',
        note: v.note,
        ...(v.routine ? { routine: routineLabel(v.routine) } : {}),
        ...(v.items?.length ? { items: v.items.map(it => ({ text: it.text, done: it.done })) } : {}),
        updatedAt: null,
      })),
    };
  });
  return {
    format: AI_FORMAT,
    planId: plan.id,
    title: plan.title,
    size,
    exportedAt: now.toISOString(),
    team: team ? { role: team.role, myBlock, myGoal: myBlock !== null ? getCell(plan, CENTER, myBlock).text || null : null } : null,
    core: { id: `${CENTER}-${CENTER}`, text: core.text, note: core.note, category: catInfo(core.cat)?.label },
    goals,
  };
}

export const aiJson = (doc: AiDoc) => JSON.stringify(doc, null, 2);

const check = (done: boolean) => (done ? '[x]' : '[ ]');

// 본부 지시서. 특정 AI 에 묶이지 않는 보통 글로 쓴다.
export function aiGuide(doc: AiDoc): string {
  const member = doc.team?.role === 'member';
  const mine = doc.goals.filter(g => g.mine);
  const lines: string[] = [];
  const p = (...s: string[]) => lines.push(...s);

  p(`# 구도 GUDO — 「${doc.title}」 본부 지시서`, '');
  p('이 폴더는 구도(GUDO · Nine Ways) 앱에서 내보낸 목표 하나를 AI 세션으로 진행하는 작업 공간입니다.',
    '사람이 정한 목표 구조를 그대로 따르고, 진행 상황은 `gudo.json` 에 기록합니다. 구도 앱은 나중에 이 파일을 읽어 현황을 맞춥니다.', '');

  if (doc.team) {
    p('## 내 역할', '');
    if (member && doc.team.myBlock !== null) {
      const g = doc.goals.find(x => x.block === doc.team!.myBlock);
      p(`- 이것은 **팀 목표**입니다. 나는 **${g?.no}번 세부 목표 「${g?.text || '(이름 없음)'}」 담당자**입니다.`,
        '- 다른 세부 목표는 팀의 맥락을 이해하기 위한 **읽기 전용 정보**입니다.',
        `- 본부 세션과 다른 세부 목표 세션은 **만들지 않습니다.** 내 세부 목표(\`${g?.folder}/\`) 세션 하나에서 시작합니다.`,
        '- `gudo.json` 에서도 내 세부 목표(`"mine": true`)의 실행 과제만 고칩니다.', '');
    } else if (member) {
      p('- 이것은 **팀 목표**를 보기 전용으로 받은 것입니다. 맡은 세부 목표가 없으므로 **세션을 만들지 않고**, 내용 정리 · 질문 답변만 합니다.', '');
    } else {
      p('- 이것은 **팀 목표**이고, 나는 **관리자**입니다. 본부 세션에서 전체를 보고, 세부 목표마다 담당자가 따로 진행할 수 있습니다.', '');
    }
  }

  p('## 목표 구조', '');
  p(`- ★ **핵심 목표**: ${doc.core.text || '(아직 비어 있음)'}${doc.core.category ? ` _(${doc.core.category})_` : ''}`);
  if (doc.core.note) p(`  - 메모: ${doc.core.note}`);
  for (const g of doc.goals) {
    p(`- **${g.no}. ${g.text || '(세부 목표 비어 있음)'}**${g.category ? ` _(${g.category})_` : ''}${doc.team && g.mine && member ? ' ← 내 담당' : ''} — 폴더 \`${g.folder}/\``);
    if (!g.tasks.length) p('  - (실행 과제 없음)');
    for (const t of g.tasks) {
      p(`  - ${check(t.done)} \`${t.id}\` ${t.text}${t.routine ? ` _(반복: ${t.routine})_` : ''}`);
      if (t.note) p(`    - 메모: ${t.note}`);
      for (const it of t.items ?? []) p(`    - ${check(it.done)} ${it.text}`);
    }
  }
  p('');

  p('## 세션 규칙', '');
  if (member) {
    p('1. 내 세부 목표 세션 하나만 엽니다. 이 세션이 이 폴더의 시작점입니다.',
      '2. 내 실행 과제 중 실제 작업(조사 · 문서 · 코드 · 연락 준비 등)이 필요한 것만 하위 세션(또는 하위 작업)으로 나눕니다. 필요 없으면 만들지 않습니다.');
  } else {
    p('1. **본부 세션** = 핵심 목표. 전체 그림을 들고 있고, 세부 목표 세션을 엽니다. 직접 실행 과제를 하지 않습니다.',
      `2. **세부 목표 세션**은 세부 목표마다 하나씩 **반드시** 엽니다 (${mine.length}개). 이름은 폴더 이름과 같게 합니다.`,
      '3. **실행 과제 세션**은 그 과제에 실제 작업(조사 · 문서 · 코드 · 연락 준비 등)이 있을 때만 엽니다. 체크만 하면 되는 과제는 세션을 만들지 않습니다.');
  }
  p('- 하위 세션(또는 하위 에이전트)을 열 수 있는 도구라면 실제 세션으로 엽니다. 대화 하나만 쓸 수 있다면 이 대화 안에서 세부 목표별로 단락을 나눠 진행합니다.',
    '- 세션을 끝낼 때는 그 세부 목표 폴더의 `README.md` 에 한 일 · 남은 일 · 다음 사람이 알아야 할 것을 남깁니다 (인수인계).', '');

  p('## 진행 기록 규칙 (`gudo.json`)', '');
  p('- 고쳐도 되는 것: 실행 과제의 `status`(`todo` · `doing` · `done` · `skip`), `done`(`status` 가 `done` 이면 `true`), `note`(진행 메모 · 결과 위치), `items` 의 `done`, 그리고 고친 시각 `updatedAt`(ISO).',
    '- 고치지 않는 것: `id`, 목표 · 실행 과제 문장(`text`), 세부 목표 구성, `format` · `planId`. 목표를 바꾸고 싶으면 제안만 하고, 사람이 구도 앱에서 고칩니다.',
    '- 새 실행 과제가 필요하면 `gudo.json` 에 넣지 말고 그 세부 목표 `README.md` 에 「제안」으로 적습니다.',
    '- 반복 점검(`routine`)이 걸린 과제는 사람이 구도 앱에서 매일 · 매주 체크합니다. AI 는 준비 · 기록을 돕습니다.', '');

  p('## 시작하기', '');
  p(member
    ? '이 지시서를 읽었으면, 내 세부 목표의 실행 과제를 살펴보고 무엇부터 할지 짧게 계획을 세운 뒤 사람에게 확인받고 시작하세요.'
    : '이 지시서를 읽었으면 본부 세션으로서: ① 목표 구조를 한 문단으로 요약하고 ② 세부 목표 세션들을 열 계획(어떤 실행 과제에 세션이 필요한지)을 보여 준 뒤 ③ 사람에게 확인받고 시작하세요.');
  return lines.join('\n');
}

// 대화형 AI 에 바로 붙여넣는 프롬프트 — 지시서 + 진행 현황 JSON
export function aiPrompt(doc: AiDoc): string {
  return [
    aiGuide(doc),
    '',
    '---',
    '',
    '아래는 `gudo.json` (진행 현황) 입니다. 파일을 만들 수 없는 환경이라면, 진행할 때마다 바뀐 `gudo.json` 전체를 이 형식 그대로 답에 붙여 주세요.',
    '',
    '```json',
    aiJson(doc),
    '```',
  ].join('\n');
}
