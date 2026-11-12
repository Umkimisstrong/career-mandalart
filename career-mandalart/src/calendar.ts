// 캘린더 일정 — 목표와 별개로 날짜가 정해진 일. Store.events 에 저장한다.
// 한 줄 형식: 「날짜 시간 할 일 ~얼마나 !알림」 (순서는 자유, 날짜 · 시간 · 얼마나 · 알림은 빼도 된다)
//   11/20 19:00 영어 스터디 ~1시간 !       → 19시에 알림
//   내일 오후 3시 치과 !30분               → 30분 전에 알림
//   다음 주 토요일 이사 준비               → 알림 없음
// 알림(alarm)은 지금은 기기 알림(휴대폰 푸시 · Windows 알림 · 웹 알림)으로 울리고,
// 나중에 알림톡 · 메일 같은 다른 길(channel)이 생겨도 같은 「몇 분 전」 값을 쓴다.
import { addDays, dateKey, dueOn, parseKey, RoutineItem, WEEKDAYS } from './routine';

export type CalEvent = {
  id: string;
  date: string; // 'YYYY-MM-DD' (현지 날짜)
  time?: string; // 'HH:MM' — 없으면 하루 종일
  title: string;
  dur?: string; // 얼마나 — '1시간' · '30분'
  alarm?: number; // 몇 분 전에 알릴까 (0 = 그 시각) · 없으면 알림 없음
  done?: boolean;
  updatedAt: number;
};

export type Parsed = { date?: string; time?: string; title: string; dur?: string; alarm?: number };

const pad = (n: number) => String(n).padStart(2, '0');
const WD = '일월화수목금토';

// 연도 없는 날짜는 올해 — 반년 넘게 지난 날이면 내년으로 본다 (12월에 「1/3」을 넣을 때)
function nearYear(m: number, d: number, base: Date): Date {
  const x = new Date(base.getFullYear(), m - 1, d);
  return +x < +addDays(base, -183) ? new Date(base.getFullYear() + 1, m - 1, d) : x;
}

export function parseLine(line: string, base = new Date()): Parsed {
  let s = ` ${line.trim()} `;
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = s.match(re);
    if (!m) return;
    fn(m);
    s = s.replace(m[0], ' ');
  };
  const out: Parsed = { title: '' };
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const setDate = (d: Date) => { if (!isNaN(+d) && !out.date) out.date = dateKey(d); };

  // 알림 — ! (그 시각) · !10 · !10분 · !1시간 (전)
  take(/\s!\s*(?:(\d+)\s*(분|시간)?\s*전?)?(?=\s)/, m => {
    out.alarm = m[1] ? Number(m[1]) * (m[2] === '시간' ? 60 : 1) : 0;
  });
  // 얼마나 — ~1시간 · ~30분 · ~1시간 30분 · ~1.5시간
  take(/\s~\s*(\d+(?:\.\d+)?\s*시간(?:\s*\d+\s*분)?|\d+\s*분)(?=\s)/, m => { out.dur = m[1].replace(/\s+/g, ''); });

  // 날짜
  take(/\s(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?=\s)/, m => setDate(new Date(+m[1], +m[2] - 1, +m[3])));
  take(/\s(\d{1,2})[/.](\d{1,2})(?=\s)/, m => setDate(nearYear(+m[1], +m[2], today)));
  take(/\s(\d{1,2})월\s*(\d{1,2})일(?=\s)/, m => setDate(nearYear(+m[1], +m[2], today)));
  take(/\s(오늘|내일|모레|글피)(?=\s)/, m => setDate(addDays(today, ['오늘', '내일', '모레', '글피'].indexOf(m[1]))));
  // 요일 — 「토요일」 · 「다음 주 토」 · 「이번주 금요일」 (한 글자 요일만 쓰면 「월 정산」 같은 말과 헷갈려서 주 · 요일을 붙인다)
  take(/\s(?:(이번|다음|다다음)\s*주\s*([일월화수목금토])(?:요일)?|([일월화수목금토])요일)(?=\s)/, m => {
    const wd = WD.indexOf(m[2] ?? m[3]);
    if (m[1]) {
      const monday = addDays(today, -((today.getDay() + 6) % 7));
      const weeks = ['이번', '다음', '다다음'].indexOf(m[1]);
      setDate(addDays(monday, weeks * 7 + ((wd + 6) % 7)));
    } else {
      setDate(addDays(today, (wd - today.getDay() + 7) % 7));
    }
  });
  // 「20일」 — 이번 달, 이미 지났으면 다음 달
  take(/\s(\d{1,2})일(?=\s)/, m => {
    const d = new Date(today.getFullYear(), today.getMonth(), +m[1]);
    setDate(+d < +today ? new Date(today.getFullYear(), today.getMonth() + 1, +m[1]) : d);
  });

  // 시간 — 19:00 · 7시 · 오후 3시 · 오전 10시 30분 · 3시 반
  take(/\s(?:(오전|오후|아침|낮|저녁|밤)\s*)?(\d{1,2})(?::(\d{2})|\s*시(?:\s*(\d{1,2})\s*분|\s*(반))?)(?=\s)/, m => {
    let h = +m[2];
    const min = m[3] ? +m[3] : m[4] ? +m[4] : m[5] ? 30 : 0;
    const pm = m[1] === '오후' || m[1] === '저녁' || m[1] === '밤' || (m[1] === '낮' && h < 6);
    if (pm && h < 12) h += 12;
    if (m[1] === '오전' && h === 12) h = 0;
    // 「3시 회의」처럼 오전 · 오후 없이 1~6시는 오후로 본다 (풀어 보기에 그대로 보여 주니 고칠 수 있다)
    if (!m[1] && !m[3] && h >= 1 && h <= 6) h += 12;
    if (h <= 23 && min <= 59) out.time = `${pad(h)}:${pad(min)}`;
  });

  out.title = s.replace(/\s+/g, ' ').trim();
  return out;
}

// 일정을 다시 한 줄로 — 고치기를 누르면 입력칸에 이 줄이 들어간다
export function formatLine(e: CalEvent): string {
  const d = parseKey(e.date);
  return [
    `${d.getMonth() + 1}/${d.getDate()}`,
    e.time,
    e.title,
    e.dur && `~${e.dur}`,
    e.alarm !== undefined && (e.alarm ? `!${alarmLabel(e.alarm).replace(' 전', '')}` : '!'),
  ].filter(Boolean).join(' ');
}

export function alarmLabel(min: number): string {
  if (!min) return '그 시각';
  if (min % 60 === 0) return `${min / 60}시간 전`;
  return `${min}분 전`;
}

export function dateLabel(key: string, base = new Date()): string {
  const d = parseKey(key);
  const diff = Math.round((+d - +new Date(base.getFullYear(), base.getMonth(), base.getDate())) / 86400000);
  const rel = diff === 0 ? ' · 오늘' : diff === 1 ? ' · 내일' : diff === -1 ? ' · 어제' : '';
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})${rel}`;
}

export const newEvent = (p: Parsed & { date: string }): CalEvent => ({
  id: `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  date: p.date, time: p.time, title: p.title, dur: p.dur, alarm: p.alarm, updatedAt: Date.now(),
});

// 날짜 · 시각 순 (하루 종일 일정은 그날 맨 앞)
export const byTime = (a: CalEvent, b: CalEvent) =>
  a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '');

// 알림이 울릴 때 — 시각이 없는 일정은 그날 아침 9시 기준
export function alarmAt(e: CalEvent): Date | undefined {
  if (e.alarm === undefined) return undefined;
  const d = parseKey(e.date);
  const [h, m] = (e.time ?? '09:00').split(':').map(Number);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m - e.alarm);
}

// 앞으로 울릴 일정 알림 (끝낸 일정 제외)
export function eventAlarms(events: CalEvent[], now = new Date(), horizonDays = 35) {
  const end = +addDays(now, horizonDays);
  return events.flatMap(e => {
    const at = alarmAt(e);
    return !e.done && at && +at > +now && +at < end ? [{ at, event: e }] : [];
  });
}

export function alarmText(e: CalEvent) {
  return {
    title: `📌 ${e.time ? `${e.time} ` : ''}${e.title}`,
    body: e.alarm ? `${alarmLabel(e.alarm).replace(' 전', '')} 뒤 시작${e.dur ? ` · ${e.dur}` : ''}` : e.dur ? `지금 · ${e.dur}` : '지금 할 일이에요',
  };
}

// 반복 점검을 달력의 하루에 놓는다 — 매주 · 매월은 기간 내내 열려 있지만 달력에는 정한 요일 · 날짜에만 (없으면 월요일 · 1일)
export function routineOnDay(item: RoutineItem, d: Date): boolean {
  const r = item.routine;
  if (!dueOn(r, d)) return false;
  if (r.freq === 'weekly') return d.getDay() === (r.days?.[0] ?? 1);
  if (r.freq === 'monthly') return d.getDate() === (r.days?.[0] ?? 1);
  return true;
}

// 달력 한 장 — 일요일부터 6주 (42칸)
export function monthDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

