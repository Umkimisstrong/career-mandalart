// 목표 카테고리 데이터셋.
// 1레벨 = 삶의 영역(카테고리). 2레벨 세부 카테고리 · 3레벨 행동은 tree.ts, 행동의 단위는 units.ts.
// 각 카테고리는 매슬로우 욕구 단계(1943/1954 5단계 + 1969 자기초월)와
// Kasser & Ryan Aspiration Index(내재적/외재적 목표)에 매핑된다.
// ages 는 그 연령대에서 특히 많이 언급·중시되는 항목 표시 — 근거는 docs/categories.md 의 출처 키 참고.

export type AgeBand = '20s' | '30s' | '40s' | '50s';
export const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: '20s', label: '20대' },
  { id: '30s', label: '30대' },
  { id: '40s', label: '40대' },
  { id: '50s', label: '50대+' },
];

export type MaslowLevel = 1 | 2 | 3 | 4 | 5 | 6;
export const MASLOW: Record<MaslowLevel, { label: string; desc: string }> = {
  1: { label: '생리', desc: '몸과 에너지 — 잠, 식사, 체력' },
  2: { label: '안전', desc: '안정과 대비 — 돈, 집, 보험' },
  3: { label: '소속·사랑', desc: '관계와 공동체' },
  4: { label: '존중', desc: '성취, 인정, 전문성' },
  5: { label: '자아실현', desc: '성장, 경험, 창작' },
  6: { label: '자기초월', desc: '기여, 의미, 유산' },
};

export type Aspiration = 'intrinsic' | 'extrinsic' | 'health';

export type Category = {
  id: string;
  label: string;
  emoji: string;
  maslow: MaslowLevel;
  aspiration: Aspiration;
  // 연령대별로 왜 중요한지 한 줄 근거
  ageNotes?: Partial<Record<AgeBand, string>>;
  sources: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: 'health',
    label: '건강',
    emoji: '💪',
    maslow: 1,
    aspiration: 'health',
    ageNotes: {
      '30s': '근손실이 시작되는 시기 — 근력 운동 습관이 평생 자산',
      '50s': '50~65세 이상에서 건강이 삶의 의미 상위 요인',
    },
    sources: ['kasser-ryan-ai', 'pew-2021-meaning', 'reddit-selfimprovement'],
  },
  {
    id: 'money',
    label: '재무',
    emoji: '💰',
    maslow: 2,
    aspiration: 'extrinsic',
    ageNotes: {
      '20s': '18~29세가 "많은 돈"을 중요하다고 답한 비율이 가장 높음 (35%)',
      '30s': '학자금 상환 · 6개월치 비상금이 대표 목표',
      '40s': '40세까지 연소득 2배 은퇴자금이 흔한 기준선',
      '50s': '50세 이후 물질적 안정이 삶의 의미 상위 — 한국은 전체 1위',
    },
    sources: ['pew-2023-fulfilling', 'pew-2021-meaning', 'finance-milestones'],
  },
  {
    id: 'stability',
    label: '생활 안정',
    emoji: '🏠',
    maslow: 2,
    aspiration: 'extrinsic',
    sources: ['maslow', 'reddit-before-30'],
  },
  {
    id: 'relationship',
    label: '관계 · 가족',
    emoji: '❤️',
    maslow: 3,
    aspiration: 'intrinsic',
    ageNotes: {
      '20s': '18~29세는 친구 · 공동체를 삶의 의미 상위로 꼽음',
      '30s': '30~49세는 다른 연령보다 가족을 더 자주 언급',
      '40s': '30~49세는 다른 연령보다 가족을 더 자주 언급',
    },
    sources: ['pew-2023-fulfilling', 'pew-2021-meaning', 'kasser-ryan-ai'],
  },
  {
    id: 'network',
    label: '네트워크 · 공동체',
    emoji: '🤝',
    maslow: 3,
    aspiration: 'intrinsic',
    sources: ['kasser-ryan-ai', 'pew-2021-meaning'],
  },
  {
    id: 'career',
    label: '커리어',
    emoji: '💼',
    maslow: 4,
    aspiration: 'intrinsic',
    ageNotes: {
      '20s': '다양한 일을 경험하며 방향 찾기',
      '30s': '30~49세에서 일 · 커리어가 삶의 의미 1~2위',
      '40s': '30~49세에서 일 · 커리어가 삶의 의미 1~2위',
      '50s': '65세 이상이 "즐거운 일"을 가장 중시 (78%)',
    },
    sources: ['pew-2023-fulfilling', 'pew-2021-meaning', 'kr-2040-survey'],
  },
  {
    id: 'recognition',
    label: '평판 · 브랜딩',
    emoji: '🌟',
    maslow: 4,
    aspiration: 'extrinsic',
    sources: ['kasser-ryan-ai'],
  },
  {
    id: 'growth',
    label: '학습 · 성장',
    emoji: '📚',
    maslow: 5,
    aspiration: 'intrinsic',
    ageNotes: {
      '20s': '18~29세는 모든 조사국에서 교육 · 배움을 더 자주 언급',
    },
    sources: ['pew-2021-meaning', 'kasser-ryan-ai'],
  },
  {
    id: 'experience',
    label: '경험 · 취미',
    emoji: '✈️',
    maslow: 5,
    aspiration: 'intrinsic',
    ageNotes: {
      '20s': '버킷리스트의 "도전적 활동"(스카이다이빙 등)은 젊은 층에서 훨씬 많음',
      '50s': '나이가 들수록 버킷리스트가 신체 활동보다 정신적 · 내면적으로 바뀜',
    },
    sources: ['bucket-list-study', 'pew-2021-meaning', 'reddit-before-40'],
  },
  {
    id: 'mindset',
    label: '마음 · 의미',
    emoji: '🧘',
    maslow: 5,
    aspiration: 'intrinsic',
    sources: ['kasser-ryan-ai', 'maslow'],
  },
  {
    id: 'contribution',
    label: '기여 · 나눔',
    emoji: '🌱',
    maslow: 6,
    aspiration: 'intrinsic',
    sources: ['kasser-ryan-ai', 'koltko-rivera'],
  },
];

export const categoryById = (id?: string) => CATEGORIES.find(c => c.id === id);
