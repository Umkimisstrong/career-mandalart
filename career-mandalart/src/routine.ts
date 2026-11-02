// 반복 점검 — 실행 과제 칸을 매일 · 요일마다 · 매주 · 매월 체크하고, 그 기록으로 나를 점검한다.
// 기록은 Cell.log 에 "기간 키" 로 남긴다: 매일 · 요일 = 그날, 매주 = 그 주 월요일, 매월 = 'YYYY-MM'.
// 모든 날짜는 기기의 현지 시각 기준.
import { CENTER, Freq, Plan, Routine, trackedCells } from './model';

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
export const FREQ_LABEL: Record<Freq, string> = { daily: '매일', weekdays: '요일 지정', weekly: '매주 1회', monthly: '매월 1회' };
export const SCOPE_LABEL = { day: '오늘', week: '이번 주', month: '이번 달' } as const;
export type Scope = keyof typeof SCOPE_LABEL;

const pad = (n: number) => String(n).padStart(2, '0');
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const scopeOf = (r: Routine): Scope => (r.freq === 'weekly' ? 'week' : r.freq === 'monthly' ? 'month' : 'day');

// 날짜 d 가 속한 기간의 키
export function periodKey(r: Routine, d: Date): string {
  if (r.freq === 'weekly') return dateKey(mondayOf(d));
  if (r.freq === 'monthly') return monthKey(d);
  return dateKey(d);
}

// 날짜 d 에 점검해야 하는가 (매주 · 매월은 기간 내내 열려 있다)
export function dueOn(r: Routine, d: Date): boolean {
  if (periodKey(r, d) < periodKey(r, parseKey(r.start))) return false;
  if (r.freq === 'weekdays') return (r.days ?? []).includes(d.getDay());
  return true;
}

// today 이전(오늘 기간 제외) 의 점검 기간 키를 최근 것부터 — 시작일 이전은 넣지 않는다
function pastPeriods(r: Routine, today: Date, max: number): string[] {
  const out: string[] = [];
  const first = periodKey(r, parseKey(r.start));
  let d = today;
  for (let guard = 0; out.length < max && guard < 800; guard++) {
    d = r.freq === 'weekly' ? addDays(mondayOf(d), -7)
      : r.freq === 'monthly' ? new Date(d.getFullYear(), d.getMonth() - 1, 1)
      : addDays(d, -1);
    const k = periodKey(r, d);
    if (k < first) break;
    if (dueOn(r, d)) out.push(k);
  }
  return out;
}

export type RoutineStats = {
  key: string; // 지금 기간 키
  checked: boolean; // 지금 기간 체크 여부
  streak: number; // 연속 달성 (지금 기간은 체크했을 때만 포함)
  rate: number; // 최근 기간 달성률 0~1 (지금 기간은 체크했을 때만 포함)
  total: number;
  prevKey?: string; // 바로 전 점검 기간
  missedPrev: boolean; // 바로 전 기간을 놓쳤는가
};

const WINDOW: Record<Freq, number> = { daily: 28, weekdays: 12, weekly: 8, monthly: 6 };

export function routineStats(r: Routine, log: string[] = [], today = new Date()): RoutineStats {
  const done = new Set(log);
  const key = periodKey(r, today);
  const checked = done.has(key);
  const past = pastPeriods(r, today, 400);
  let streak = checked ? 1 : 0;
  for (const k of past) {
    if (!done.has(k)) break;
    streak++;
  }
  const win = past.slice(0, WINDOW[r.freq]);
  const total = win.length + (checked ? 1 : 0);
  const hit = win.filter(k => done.has(k)).length + (checked ? 1 : 0);
  return {
    key, checked, streak, total,
    rate: total ? hit / total : 0,
    prevKey: past[0],
    missedPrev: !!past[0] && !done.has(past[0]),
  };
}

export function toggleKey(log: string[] = [], key: string): string[] {
  return log.includes(key) ? log.filter(k => k !== key) : [...log, key].sort();
}

export function routineLabel(r: Routine): string {
  const days = r.days ?? [];
  let s: string = FREQ_LABEL[r.freq];
  if (r.freq === 'weekdays') {
    const sorted = [...days].sort();
    s = sorted.join() === '1,2,3,4,5' ? '평일' : sorted.join() === '0,6' ? '주말'
      : sorted.length === 7 ? '매일' : sorted.length ? `매주 ${sorted.map(d => WEEKDAYS[d]).join('·')}` : '요일 미정';
  } else if (r.freq === 'weekly' && days.length) s += ` (${WEEKDAYS[days[0]]})`;
  else if (r.freq === 'monthly' && days.length) s += ` (${days[0]}일)`;
  return r.time ? `${s} · ${r.time}` : s;
}

// 칸의 「언제」 단위로 반복 주기 · 알림 시각을 추천한다
export function suggestRoutine(when: string | undefined, today = new Date()): Routine | undefined {
  if (!when) return undefined;
  const start = dateKey(today);
  const TIMES: Record<string, string> = { 아침: '07:00', '출근 전': '07:30', 점심: '12:00', '퇴근 후': '19:00', '자기 전': '22:30' };
  if (TIMES[when] || when === '매일') return { freq: 'daily', start, time: TIMES[when] };
  if (when === '평일') return { freq: 'weekdays', days: [1, 2, 3, 4, 5], start };
  if (when === '주말') return { freq: 'weekdays', days: [0, 6], start };
  const wd = when.match(/매주 ([일월화수목금토])요일/);
  if (wd) return { freq: 'weekdays', days: [WEEKDAYS.indexOf(wd[1])], start };
  const md = when.match(/매월 (\d{1,2})일/);
  if (md) return { freq: 'monthly', days: [Number(md[1])], start };
  if (/주 \d회/.test(when)) return { freq: 'weekly', start };
  return undefined;
}

// 모든 청사진의 반복 점검 칸 (완료된 과제 · 빈 칸 제외)
export type RoutineItem = {
  planId: string;
  planTitle: string;
  goal: string;
  block: number;
  cell: number;
  text: string;
  routine: Routine;
  log: string[];
  scope: Scope;
  dueToday: boolean;
  stats: RoutineStats;
};

export function routineItems(plans: Plan[], today = new Date()): RoutineItem[] {
  const out: RoutineItem[] = [];
  for (const p of plans) {
    for (const [b, i] of trackedCells(p)) {
      const c = p.blocks[b][i];
      if (!c.routine || !c.text.trim() || c.done) continue;
      out.push({
        planId: p.id, planTitle: p.title, goal: b === CENTER && i === CENTER ? p.title : p.blocks[CENTER][b].text, block: b, cell: i,
        text: c.text, routine: c.routine, log: c.log ?? [], scope: scopeOf(c.routine),
        dueToday: dueOn(c.routine, today), stats: routineStats(c.routine, c.log, today),
      });
    }
  }
  return out;
}

// 최근 n 일 하루 점검(매일 · 요일) 달성 — 잔디 그래프용
export function dayGrid(plans: Plan[], today = new Date(), n = 28) {
  const cells: { r: Routine; log: Set<string> }[] = [];
  for (const p of plans) {
    for (const [b, i] of trackedCells(p)) {
      const c = p.blocks[b][i];
      if (c.routine && scopeOf(c.routine) === 'day' && c.text.trim()) cells.push({ r: c.routine, log: new Set(c.log) });
    }
  }
  return Array.from({ length: n }, (_, j) => {
    const d = addDays(today, j - n + 1);
    const k = dateKey(d);
    const due = cells.filter(c => k >= c.r.start && dueOn(c.r, d));
    return { key: k, day: d.getDay(), due: due.length, done: due.filter(c => c.log.has(k)).length };
  });
}

// 알림 시각 r.time 에 맞는 앞으로의 알림 — 이미 체크한 기간은 건너뛴다 (체크하면 그 기간 알림이 사라진다)
export function upcoming(items: RoutineItem[], now = new Date(), horizonDays = 35, max = 60) {
  const out: { at: Date; item: RoutineItem }[] = [];
  for (const item of items) {
    const { routine: r } = item;
    if (!r.time) continue;
    const [h, m] = r.time.split(':').map(Number);
    const done = new Set(item.log);
    for (let off = 0; off < horizonDays; off++) {
      const day = addDays(now, off);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      if (at <= now || !dueOn(r, day) || done.has(periodKey(r, day))) continue;
      const pick = r.days?.[0];
      if (r.freq === 'weekly' && pick !== undefined && day.getDay() !== pick) continue;
      if (r.freq === 'monthly' && day.getDate() !== (pick ?? 1)) continue;
      out.push({ at, item });
    }
  }
  return out.sort((a, b) => +a.at - +b.at).slice(0, max);
}
