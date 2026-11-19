// AI 로 내보내기 2단계 — 폴더를 골라 시작 파일을 바로 만든다 (파일 시스템 접근 API).
// 되는 곳: Windows 앱(Electron) · PC Chrome · Edge. 안 되는 곳: iPhone Safari · Firefox · 휴대폰 → 1단계 파일 받기.
// 고른 폴더는 목표마다 IndexedDB 에 기억한다 (3단계 「현황 가져오기」가 같은 폴더를 읽는다).
import { aiGuide, aiJson, aiReadme, AiDoc } from './export';

type Dir = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>;
};
export type Folder = Dir;

export const folderSupported = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// 고른 폴더. 창을 닫았거나 브라우저가 막으면 오류(이름 · 메시지를 화면에 보여 원인을 알 수 있게)
export async function pickFolder(): Promise<Folder | null> {
  const pick = (window as unknown as { showDirectoryPicker: (o: object) => Promise<Dir> }).showDirectoryPicker.bind(window);
  // 옵션 없이 연다 — 고르는 단계와 「수정 허용」 단계를 나눠서(canWrite), Chrome 이 허용 창 없이 취소로 돌려주는 경우를 피한다
  return await pick({});
}

// ---- 목표마다 고른 폴더 기억 (IndexedDB) ----
const DB = 'gudo-ai', STORE = 'folders';
function db(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((ok, fail) => {
    const req = run(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
}
export const rememberFolder = (planId: string, dir: Folder) => tx('readwrite', s => s.put(dir, planId)).then(() => undefined);
export const forgetFolder = (planId: string) => tx('readwrite', s => s.delete(planId)).then(() => undefined);
export async function savedFolder(planId: string): Promise<Folder | null> {
  try { return ((await tx('readonly', s => s.get(planId))) as Folder | undefined) ?? null; } catch { return null; }
}

// 쓰기 권한 — 기억한 폴더는 브라우저를 다시 열면 한 번 더 허락을 받아야 한다 (버튼을 누를 때 묻는다)
export async function canWrite(dir: Folder): Promise<boolean> {
  const o = { mode: 'readwrite' as const };
  if (!dir.queryPermission) return true;
  if ((await dir.queryPermission(o)) === 'granted') return true;
  return (await dir.requestPermission?.(o)) === 'granted';
}

async function readText(dir: FileSystemDirectoryHandle, name: string): Promise<string | null> {
  try { return await (await (await dir.getFileHandle(name)).getFile()).text(); } catch { return null; }
}
async function writeText(dir: FileSystemDirectoryHandle, name: string, text: string) {
  const w = await (await dir.getFileHandle(name, { create: true })).createWritable();
  await w.write(text);
  await w.close();
}

export type WriteResult = { written: string[]; kept: string[] };

// 시작 파일 만들기. AI 가 쓰고 있는 것은 덮어쓰지 않는다:
//  GUDO.md — 앱의 지시서라 늘 새로 씀 · gudo.json — 없을 때만 (있으면 진행 기록이라 그대로, 다른 목표 것이면 멈춤)
//  세부 목표 폴더 README.md — 없을 때만
export async function writeWorkspace(dir: Folder, doc: AiDoc): Promise<WriteResult> {
  const written: string[] = [], kept: string[] = [];
  const old = await readText(dir, 'gudo.json');
  if (old !== null) {
    let id: unknown;
    try { id = JSON.parse(old).planId; } catch { /* 깨진 파일 */ }
    if (id !== doc.planId) throw new Error('이 폴더에는 다른 목표의 gudo.json 이 있어요. 빈 폴더나 이 목표의 폴더를 골라 주세요.');
    kept.push('gudo.json');
  } else {
    await writeText(dir, 'gudo.json', aiJson(doc));
    written.push('gudo.json');
  }
  await writeText(dir, 'GUDO.md', aiGuide(doc));
  written.push('GUDO.md');
  for (const g of doc.goals) {
    if (!g.mine) continue; // 팀 담당자는 내 세부 목표 폴더만
    const sub = await dir.getDirectoryHandle(g.folder, { create: true });
    if ((await readText(sub, 'README.md')) !== null) { kept.push(`${g.folder}/README.md`); continue; }
    await writeText(sub, 'README.md', aiReadme(doc, g));
    written.push(`${g.folder}/README.md`);
  }
  return { written, kept };
}

// ---- 3단계: 현황 가져오기 ----

// 폴더의 gudo.json 읽기 (없으면 null)
export async function readProgress(dir: Folder): Promise<string | null> {
  return readText(dir, 'gudo.json');
}

const pad = (n: number) => String(n).padStart(2, '0');
// 가져오기 전 백업 — 폴더/.gudo/backups/YYYY-MM-DD-HHMMSS.json 에 「가져오기 전 앱의 목표」와 「받은 gudo.json」을 함께
export async function backupBeforeImport(dir: Folder, appPlan: unknown, incoming: string, now = new Date()): Promise<string> {
  const g = await dir.getDirectoryHandle('.gudo', { create: true });
  const b = await g.getDirectoryHandle('backups', { create: true });
  const name = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`;
  let received: unknown = incoming;
  try { received = JSON.parse(incoming); } catch { /* 글 그대로 */ }
  await writeText(b, name, JSON.stringify({ savedAt: now.toISOString(), app: appPlan, received }, null, 2));
  return `.gudo/backups/${name}`;
}

// ---- 4단계: 자동 동기화 ----

// 묻지 않고 쓰기 권한만 확인 (자동으로 돌 때는 허락 창을 띄울 수 없다)
export async function hasWrite(dir: Folder): Promise<boolean> {
  if (!dir.queryPermission) return true;
  try { return (await dir.queryPermission({ mode: 'readwrite' })) === 'granted'; } catch { return false; }
}

// gudo.json 마지막 수정 시각 — 바뀌지 않았으면 읽지 않는다 (없으면 null)
export async function progressStamp(dir: Folder): Promise<number | null> {
  try { return (await (await dir.getFileHandle('gudo.json')).getFile()).lastModified; } catch { return null; }
}
