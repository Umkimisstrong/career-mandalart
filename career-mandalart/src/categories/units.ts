// 3레벨 행동에 붙이는 기본 단위 — 시간(언제 · 얼마나 · 언제까지) / 장소(어디서 · 어디로) / 수량(몇 일 · 몇 개 · 몇 회 …).
// 모두 선택 사항이고, 추천값 외에 직접 입력도 된다.
// 고른 값으로 칸 문장을 만든다: "매주 토요일 도서관에서 단어 외우기 1시간 · 50개 · 3개월 안에"
import type { ActionSpec } from '../model';

export type UnitField = 'when' | 'howLong' | 'until' | 'where' | 'whereTo';

export const UNIT_GROUPS: { id: string; label: string; icon: string; fields: { id: UnitField; label: string; options: string[] }[] }[] = [
  {
    id: 'time', label: '시간', icon: '⏰',
    fields: [
      { id: 'when', label: '언제', options: ['매일', '평일', '주말', '매주 월요일', '매주 토요일', '아침', '출근 전', '점심', '퇴근 후', '자기 전', '매월 1일', '분기마다'] },
      { id: 'howLong', label: '얼마나', options: ['10분', '15분', '30분', '1시간', '2시간', '반나절', '하루'] },
      { id: 'until', label: '언제까지', options: ['이번 주까지', '이번 달까지', '3개월 안에', '6개월 안에', '올해 안에', '1년 안에', '3년 안에', '5년 안에'] },
    ],
  },
  {
    id: 'place', label: '장소', icon: '📍',
    fields: [
      { id: 'where', label: '어디서', options: ['집', '회사', '카페', '도서관', '헬스장', '공원', '학원', '온라인'] },
      { id: 'whereTo', label: '어디로', options: ['국내', '해외', '제주', '일본', '유럽', '미국', '동남아'] },
    ],
  },
];

export const QTY_UNITS = ['회', '일', '시간', '분', '개', '권', '편', '명', '만원', 'km', 'kg', '페이지', '점', '차', '곳', '잔', '보', '곡', '장', '강', '문제'];
export const QTY_MAX = 3;

// 직접 입력한 날짜 등은 "까지"를 붙여 준다
const untilText = (s: string) => (/(까지|안에|내|전)$/.test(s) ? s : `${s}까지`);

// 받침이 있으면 "으로", 없거나 ㄹ 받침이면 "로" (한글이 아니면 "(으)로")
function ro(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}(으)로`;
  const jong = code % 28;
  return `${word}${jong === 0 || jong === 8 ? '로' : '으로'}`;
}

export function composeText(spec: ActionSpec): string {
  const head = [
    spec.when,
    spec.where && `${spec.where}에서`,
    spec.whereTo && ro(spec.whereTo),
    spec.act,
  ].filter(Boolean).join(' ');
  const tail = [
    spec.howLong,
    ...(spec.qty ?? []).filter(q => q.n.trim()).map(q => `${q.n.trim()}${q.unit}`),
    spec.until && untilText(spec.until),
  ].filter(Boolean).join(' · ');
  return [head, tail].filter(Boolean).join(' ');
}
