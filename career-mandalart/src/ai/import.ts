// AI 로 내보내기 3단계 — AI 세션이 고친 gudo.json(진행 현황)을 구도 목표에 반영한다. 설계 docs/ai-sessions.md
// 규칙
//  - 같은 목표(planId)의 파일만 받는다.
//  - AI 가 손댄 실행 과제(updatedAt 이 있는 것)만 반영한다 — 내보낸 그대로인 칸은 앱의 값을 지킨다.
//  - 칸 문장이 내보낸 뒤 앱에서 바뀌었으면 그 칸은 건너뛴다 (다른 일을 가리킬 수 있어서).
//  - 반영하는 것: 완료(done) · AI 상태 · 진행 메모(Cell.ai) · 하위 할 일 완료(문장이 같은 것). 사용자 메모(note)는 건드리지 않는다.
//  - 팀 담당자는 자기 블록만 (canEditBlock).
import { AI_FORMAT, AiDoc, AiStatus } from './export';
import { getCell, Plan, setCell } from '../model';
import { canEditBlock, storedBlock, touch } from '../team';

const STATUSES: AiStatus[] = ['todo', 'doing', 'done', 'skip'];

// 붙여넣은 글에서 gudo.json 찾기 — JSON 그대로이거나, AI 답 속 ```json 블록이거나
export function parseAiDoc(text: string): AiDoc {
  const tries = [text.trim()];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/g);
  fence?.forEach(f => tries.push(f.replace(/^```(?:json)?\s*/, '').replace(/```$/, '').trim()));
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a >= 0 && b > a) tries.push(text.slice(a, b + 1));
  for (const t of tries) {
    try {
      const d = JSON.parse(t) as AiDoc;
      if (d && d.format === AI_FORMAT && typeof d.planId === 'string' && Array.isArray(d.goals)) return d;
    } catch { /* 다음 후보 */ }
  }
  throw new Error('구도 진행 현황(gudo.json)을 찾지 못했어요. AI 가 돌려준 gudo.json 전체를 붙여넣어 주세요.');
}

export type ImportReport = { done: number; doing: number; changed: number; skipped: number; locked: number; total: number };

export function applyAiDoc(plan: Plan, doc: AiDoc): { plan: Plan; report: ImportReport } {
  if (doc.planId !== plan.id) throw new Error('다른 목표의 진행 현황이에요. 이 목표에서 내보낸 gudo.json 을 가져와 주세요.');
  const report: ImportReport = { done: 0, doing: 0, changed: 0, skipped: 0, locked: 0, total: 0 };
  let next = plan;
  for (const g of doc.goals) {
    for (const t of g.tasks ?? []) {
      report.total++;
      const count = () => { if (t.status === 'done' || t.done) report.done++; else if (t.status === 'doing') report.doing++; };
      if (!t.updatedAt) { count(); continue; } // AI 가 손대지 않은 칸
      const m = /^(\d)-(\d)$/.exec(t.id ?? '');
      if (!m) { report.skipped++; continue; }
      const b = +m[1], c = +m[2];
      if (!canEditBlock(next, storedBlock(b, c))) { report.locked++; continue; }
      const cell = getCell(next, b, c);
      if (!cell.text.trim() || cell.text.trim() !== (t.text ?? '').trim()) { report.skipped++; continue; }
      count();
      const status: AiStatus = STATUSES.includes(t.status) ? t.status : t.done ? 'done' : 'todo';
      const done = status === 'done' || !!t.done;
      const items = cell.items?.map(it => {
        const hit = t.items?.find(x => x.text.trim() === it.text.trim());
        return hit ? { ...it, done: !!hit.done } : it;
      });
      const ai = { status, ...(t.note?.trim() ? { note: t.note.trim() } : {}), at: t.updatedAt };
      const same = cell.done === done && JSON.stringify(cell.ai) === JSON.stringify(ai) && JSON.stringify(items) === JSON.stringify(cell.items);
      if (same) continue;
      next = setCell(next, b, c, { done, ai, ...(items ? { items } : {}) });
      if (next.team) next = touch(next, b, c);
      report.changed++;
    }
  }
  return { plan: next, report };
}

export const reportText = (r: ImportReport) =>
  `진행 현황을 가져왔어요 — 바뀐 칸 ${r.changed}개 (전체 ${r.total}개 중 완료 ${r.done} · 진행 중 ${r.doing})`
  + (r.skipped ? ` · 문장이 바뀌어 건너뛴 칸 ${r.skipped}개` : '')
  + (r.locked ? ` · 내 블록이 아니라 건너뛴 칸 ${r.locked}개` : '');
