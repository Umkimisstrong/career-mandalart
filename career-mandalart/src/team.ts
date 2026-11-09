// 팀 목표 — 서버 없이 같은 목표를 여럿이 본다 (docs/team.md).
// 누구나 자기 기기에 구도가 있고, 관리자가 블록마다 초대장(링크 · QR)을 보낸다. 받은 사람은 같은 목표 전체를 보고
// 자기 블록만 고친다. 바뀐 내용은 「갱신 코드」로 메신저 등 다른 매개를 통해 주고받는다 — 실시간 동기화는 없다.
//
// 코드 형식: 링크 = https://…/?team=<base64url(deflate(JSON))>, QR = "GDT1:" + base45(같은 바이트)
// 받는 쪽 규칙: 보낸 사람이 고칠 수 있는 블록(관리자 = 전부, 담당자 = 자기 블록)만, 그 블록이 더 최근에 바뀐 경우에만 반영.
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';
import { CENTER, newPlan, Plan, PLAN_SIZES, PlanSize, sizeOf } from './model';
import { base45Decode, base45Encode } from './qr/codec';

export type TeamRole = 'admin' | 'member';

export type Team = {
  id: string; // 팀 id — 관리자 기기에서 처음 만든 목표의 id
  role: TeamRole;
  block?: number; // 담당자: 맡은 블록 (없으면 보기만)
  owners: string[]; // 블록 0..8 담당자 이름 (관리자가 정함, 가운데 4 = 관리자)
  stamps: number[]; // 블록 0..8 마지막으로 바뀐 시각 — 더 최근 것이 이긴다
};

export const isTeam = (p: Plan) => !!p.team;
export const isAdmin = (p: Plan) => p.team?.role === 'admin';

// 이 기기에서 고칠 수 있는 블록인가 (저장 위치 기준 — 세부 목표 칸은 가운데 블록 = 관리자 몫)
export function canEditBlock(p: Plan, storedBlock: number): boolean {
  if (!p.team || p.team.role === 'admin') return true;
  return p.team.block === storedBlock && storedBlock !== CENTER;
}

// 블록 b · 칸 c 가 실제로 저장되는 블록 (바깥 블록의 가운데 칸 = 가운데 블록의 세부 목표 칸)
export const storedBlock = (b: number, c: number) => (b !== CENTER && c === CENTER ? CENTER : b);

// 개인 목표를 팀 목표로 — 이 기기가 관리자
export function makeTeam(p: Plan, admin: string): Plan {
  const now = Date.now();
  return { ...p, team: { id: p.id, role: 'admin', owners: Array.from({ length: 9 }, (_, i) => (i === CENTER ? admin : '')), stamps: Array(9).fill(now) } };
}

// 칸을 고친 뒤 그 블록 시각을 올린다
export function touch(p: Plan, b: number, c: number): Plan {
  if (!p.team) return p;
  const stamps = [...p.team.stamps];
  stamps[storedBlock(b, c)] = Date.now();
  return { ...p, team: { ...p.team, stamps } };
}

// ---- 주고받는 코드 ----

export type TeamKind = 'invite' | 'update';

type Payload = {
  v: 1;
  id: string;
  k: TeamKind;
  from: number; // 보낸 사람: -1 = 관리자, 0..8 = 그 블록 담당자
  to?: number; // 초대장: 맡길 블록
  t: string; // 목표 이름
  s: PlanSize;
  o: string[]; // 담당자 이름
  u: number[]; // 블록 시각
  // 블록마다 [칸 9개 문장, 완료 칸 번호들, (가운데 블록만) 카테고리] — 보낸 사람이 고칠 수 없는 블록은 0
  b: ([string[], number[], string[]?] | 0)[];
  x?: Record<number, number[]>; // 3 · 5칸 버전에서 더 연 칸 — 보낸 사람이 고칠 수 있는 블록만
  i?: Record<number, Record<number, [string, number][]>>; // 하위 할 일 [문장, 완료 1/0] — 블록 → 칸
};

const PREFIX = 'GDT1:';

function payloadOf(p: Plan, k: TeamKind, to?: number): Payload {
  const team = p.team!;
  const from = team.role === 'admin' ? -1 : team.block ?? -2;
  const mine = (b: number) => from === -1 || from === b;
  return {
    v: 1, id: team.id, k, from, ...(to !== undefined ? { to } : {}),
    t: p.title, s: sizeOf(p), o: team.owners, u: team.stamps,
    b: p.blocks.map((row, b) => !mine(b) ? 0 : [
      row.map(c => c.text),
      row.flatMap((c, i) => (c.done ? [i] : [])),
      ...(b === CENTER ? [row.map(c => c.cat ?? '')] : []),
    ] as [string[], number[], string[]?]),
    ...(p.extra ? { x: Object.fromEntries(Object.entries(p.extra).filter(([b]) => mine(Number(b)))) } : {}),
    i: Object.fromEntries(p.blocks.flatMap((row, b) => {
      if (!mine(b)) return [];
      const cells = Object.fromEntries(row.flatMap((c, i) => (c.items?.length ? [[i, c.items.map(x => [x.text, x.done ? 1 : 0] as [string, number])]] : [])));
      return Object.keys(cells).length ? [[b, cells]] : [];
    })),
  };
}

const bytesOf = (p: Payload) => deflateSync(strToU8(JSON.stringify(p)), { level: 9 });

const b64url = (bytes: Uint8Array) => {
  let s = '';
  bytes.forEach(x => { s += String.fromCharCode(x); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = (str: string) => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, ch => ch.charCodeAt(0));
};

export const APP_URL = 'https://career-mandalart.vercel.app';

// 초대장 · 갱신 코드 — 링크(메신저용)와 QR 문자열(사진용)
export function teamCode(p: Plan, k: TeamKind, to?: number): { link: string; qr: string } {
  const bytes = bytesOf(payloadOf(p, k, to));
  return { link: `${APP_URL}/?team=${b64url(bytes)}`, qr: PREFIX + base45Encode(bytes) };
}

export const isTeamQr = (text: string) => text.startsWith(PREFIX);

// 링크 · QR 문자열 · 링크의 코드 부분 어느 것이든 받는다
export function parseTeamCode(text: string): Payload {
  const s = text.trim();
  let bytes: Uint8Array;
  try {
    if (isTeamQr(s)) bytes = base45Decode(s.slice(PREFIX.length));
    else {
      const m = s.match(/[?&]team=([A-Za-z0-9_-]+)/);
      bytes = unb64url(m ? m[1] : s);
    }
    const p = JSON.parse(strFromU8(inflateSync(bytes))) as Payload;
    if (p.v !== 1 || !p.id || !Array.isArray(p.b) || p.b.length !== 9) throw new Error();
    return p;
  } catch {
    throw new Error('구도 팀 코드가 아니에요. 링크나 코드를 빠짐없이 붙여넣었는지 확인해 주세요.');
  }
}

export type MergeResult = { plans: Plan[]; planId: string; changed: number; message: string };

// 받은 코드를 내 목표들에 반영한다
export function receiveTeamCode(plans: Plan[], text: string): MergeResult {
  const pay = parseTeamCode(text);
  const local = plans.find(p => p.team?.id === pay.id);

  // 처음 받는 팀 — 초대장이면 담당자로, 관리자의 갱신이면 보기 전용으로 새로 만든다
  if (!local) {
    if (pay.from !== -1) throw new Error('이 팀 목표가 이 기기에 없어요. 먼저 관리자에게 초대장을 받아 주세요.');
    const base = newPlan(pay.t, PLAN_SIZES.includes(pay.s) ? pay.s : 9);
    const plan: Plan = { ...base, team: { id: pay.id, role: 'member', block: pay.k === 'invite' ? pay.to : undefined, owners: pay.o, stamps: Array(9).fill(0) } };
    const merged = apply(plan, pay);
    const who = pay.to !== undefined ? pay.o[pay.to] : '';
    return {
      plans: [...plans, merged.plan], planId: plan.id, changed: merged.changed,
      message: pay.k === 'invite' ? `「${pay.t}」 팀에 들어왔어요${who ? ` — ${who} 님 블록` : ''}` : `「${pay.t}」 팀 목표를 받았어요 (보기 전용)`,
    };
  }

  let plan = local;
  // 관리자가 보낸 초대장 — 맡은 블록을 바꾼다 (관리자 기기 자신에게는 적용하지 않음)
  if (pay.k === 'invite' && pay.from === -1 && plan.team!.role === 'member') {
    plan = { ...plan, team: { ...plan.team!, block: pay.to } };
  }
  const merged = apply(plan, pay);
  return {
    plans: plans.map(p => (p.id === local.id ? merged.plan : p)), planId: local.id, changed: merged.changed,
    message: merged.changed ? `「${pay.t}」 블록 ${merged.changed}개를 새 내용으로 바꿨어요` : '이미 최신이에요 — 바뀐 내용이 없어요',
  };
}

function apply(plan: Plan, pay: Payload): { plan: Plan; changed: number } {
  const team = plan.team!;
  const fromAdmin = pay.from === -1;
  const blocks = plan.blocks.map(r => r.slice());
  const stamps = [...team.stamps];
  const extra: Record<number, number[]> = { ...plan.extra };
  let changed = 0;
  pay.b.forEach((blk, b) => {
    if (!blk) return;
    // 담당자가 보낸 코드는 그 담당자 블록만
    if (!fromAdmin && pay.from !== b) return;
    if ((pay.u[b] ?? 0) <= (stamps[b] ?? 0)) return;
    const [texts, done, cats] = blk;
    blocks[b] = blocks[b].map((cell, i) => {
      // 바깥 블록의 가운데 칸은 저장하지 않는다 (가운데 블록의 세부 목표를 본다)
      if (b !== CENTER && i === CENTER) return cell;
      const items = pay.i?.[b]?.[i]?.map(([text, d]) => ({ text, done: !!d }));
      return { ...cell, text: texts[i] ?? '', done: done.includes(i), items: items?.length ? items : undefined, ...(cats ? { cat: cats[i] || undefined } : {}) };
    });
    stamps[b] = pay.u[b];
    if (pay.x?.[b]?.length) extra[b] = pay.x[b]; else delete extra[b];
    changed++;
  });
  const next: Plan = {
    ...plan, blocks, extra, updatedAt: changed ? Date.now() : plan.updatedAt,
    ...(fromAdmin ? { title: pay.t, size: pay.s === 9 ? undefined : pay.s } : {}),
    team: { ...team, stamps, ...(fromAdmin ? { owners: pay.o } : {}) },
  };
  if (next.size === undefined) delete next.size;
  return { plan: next, changed };
}

// 팀 목표 복제 (관리자) — 내용 그대로 새 팀 목표로, 이 기기가 관리자
export function copyTeam(p: Plan): Plan {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  return { ...p, id, title: `${p.title} (복제)`, createdAt: now, updatedAt: now, team: { ...p.team!, id, role: 'admin', block: undefined, stamps: Array(9).fill(now) } };
}
