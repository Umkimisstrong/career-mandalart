// AI 로 내보내기 4단계 — Windows 앱이 연결된 AI 작업 폴더의 gudo.json 을 주기적으로 읽어 구도에 반영한다.
//  - 1분마다 + 창으로 돌아올 때. gudo.json 수정 시각이 그대로면 읽지 않는다.
//  - 바뀐 칸이 있을 때만 반영하고, 반영 전에 폴더 .gudo/backups/ 에 날짜별 백업 (3단계와 같은 규칙 — src/ai/import.ts).
//  - 방향은 폴더 → 앱 하나. 앱에서 고친 것은 「이 폴더에 만들기」로 지시서에 담긴다 (gudo.json 은 AI 의 기록이라 앱이 덮어쓰지 않음).
//  - 쓰기 권한이 없으면(앱을 다시 켠 뒤 등) 묻지 않고 건너뛰고, 화면에 「한 번 가져오기를 눌러 주세요」로 알린다.
import { useEffect, useState } from 'react';
import { Plan } from '../model';
import { backupBeforeImport, hasWrite, progressStamp, readProgress, savedFolder } from './folder';
import type { AiDoc } from './export';
import { applyAiDoc, ImportReport, parseAiDoc } from './import';

export type SyncState = { at: number; changed: number; error?: string };
const states: Record<string, SyncState> = {};
const seen: Record<string, number> = {}; // 목표 → 마지막으로 읽은 gudo.json 수정 시각
const listeners = new Set<() => void>();
const set = (id: string, s: SyncState) => { states[id] = s; listeners.forEach(f => f()); };

export function useSyncState(planId: string): SyncState | undefined {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick(n => n + 1); listeners.add(f); return () => { listeners.delete(f); }; }, []);
  return states[planId];
}

// 한 목표 확인 — 반영할 것이 있으면 읽은 현황과 결과를 돌려준다 (반영은 받는 쪽이 그때의 최신 목표에 — 사이에 고친 것을 덮지 않게)
export async function syncOnce(plan: Plan): Promise<{ doc: AiDoc; report: ImportReport; backup: string } | null> {
  const dir = await savedFolder(plan.id);
  if (!dir) return null;
  const now = Date.now();
  try {
    if (!(await hasWrite(dir))) { set(plan.id, { at: now, changed: 0, error: '폴더 권한이 필요해요 — 「폴더에서 현황 가져오기」를 한 번 눌러 주세요.' }); return null; }
    const stamp = await progressStamp(dir);
    if (stamp === null) { set(plan.id, { at: now, changed: 0, error: `「${dir.name}」 폴더에 gudo.json 이 없어요.` }); return null; }
    if (seen[plan.id] === stamp) { set(plan.id, { at: now, changed: 0 }); return null; }
    const text = (await readProgress(dir)) ?? '';
    const doc = parseAiDoc(text);
    const { report } = applyAiDoc(plan, doc);
    seen[plan.id] = stamp;
    if (!report.changed) { set(plan.id, { at: now, changed: 0 }); return null; }
    const backup = await backupBeforeImport(dir, plan, text);
    set(plan.id, { at: now, changed: report.changed });
    return { doc, report, backup };
  } catch (e) {
    set(plan.id, { at: now, changed: 0, error: (e as Error).message });
    return null;
  }
}

// 자동 동기화 시작 — getPlans 는 늘 최신 목록, onChange 로 반영. 멈출 함수를 돌려준다
export function startAutoSync(getPlans: () => Plan[], onChange: (planId: string, doc: AiDoc, report: ImportReport) => void, every = 60_000): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      for (const p of getPlans()) {
        if (p.aiAuto === false) continue;
        const r = await syncOnce(p);
        if (r) onChange(p.id, r.doc, r.report);
      }
    } finally {
      running = false;
    }
  };
  const timer = setInterval(run, every);
  const onFocus = () => { run(); };
  window.addEventListener('focus', onFocus);
  run();
  return () => { clearInterval(timer); window.removeEventListener('focus', onFocus); };
}
