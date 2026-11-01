// 반복 점검을 캘린더 파일(.ics)로 — iPhone 웹 앱은 닫혀 있을 때 알림을 보낼 수 없어서,
// 알림 시각이 있는 칸을 반복 일정 + 알림(VALARM)으로 만들어 기기 캘린더가 대신 울리게 한다.
import { addDays, dateKey, dueOn, parseKey, RoutineItem } from './routine';

const APP_URL = 'https://career-mandalart.vercel.app';
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// 한 줄 75바이트 제한 — UTF-8 바이트 수로 접는다 (한글 3바이트)
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const n = ch.codePointAt(0)! < 0x80 ? 1 : ch.codePointAt(0)! < 0x800 ? 2 : ch.codePointAt(0)! < 0x10000 ? 3 : 4;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function rrule(item: RoutineItem): string {
  const r = item.routine;
  if (r.freq === 'daily') return 'FREQ=DAILY';
  if (r.freq === 'weekdays') return `FREQ=WEEKLY;BYDAY=${(r.days ?? []).map(d => BYDAY[d]).join(',')}`;
  if (r.freq === 'weekly') return `FREQ=WEEKLY;BYDAY=${BYDAY[r.days?.[0] ?? 1]}`;
  return `FREQ=MONTHLY;BYMONTHDAY=${r.days?.[0] ?? 1}`;
}

// 시작일 이후 규칙에 맞는 첫 날 (DTSTART 가 규칙과 어긋나면 일부 캘린더가 날짜를 하나 더 만든다)
function firstDay(item: RoutineItem): Date {
  const r = item.routine;
  let d = parseKey(r.start);
  for (let i = 0; i < 62; i++, d = addDays(d, 1)) {
    if (!dueOn(r, d)) continue;
    if (r.freq === 'weekly' && d.getDay() !== (r.days?.[0] ?? 1)) continue;
    if (r.freq === 'monthly' && d.getDate() !== (r.days?.[0] ?? 1)) continue;
    return d;
  }
  return parseKey(r.start);
}

export function buildIcs(items: RoutineItem[], now = new Date()): { text: string; count: number } {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const events = items.filter(i => i.routine.time).map(item => {
    const day = dateKey(firstDay(item)).replace(/-/g, '');
    const time = item.routine.time!.replace(':', '') + '00';
    return [
      'BEGIN:VEVENT',
      `UID:${item.planId}-${item.block}-${item.cell}@gudo`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${day}T${time}`,
      'DURATION:PT15M',
      `RRULE:${rrule(item)}`,
      `SUMMARY:🔁 ${esc(item.text)}`,
      `DESCRIPTION:${esc(`${item.goal} — 구도 「오늘의 점검」에서 체크하세요 ${APP_URL}`)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(item.text)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    ];
  });
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GUDO//Routine//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:구도 반복 점검',
    ...events.flat(),
    'END:VCALENDAR',
  ];
  return { text: lines.map(fold).join('\r\n') + '\r\n', count: events.length };
}
