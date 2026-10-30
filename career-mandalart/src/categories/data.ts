// 목표 카테고리 데이터셋.
// 상위 = 삶의 영역(카테고리), 하위 = 실행 과제로 고를 수 있는 속성(아이템).
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

export type CategoryItem = {
  label: string;
  ages?: AgeBand[];
};

export type Category = {
  id: string;
  label: string;
  emoji: string;
  maslow: MaslowLevel;
  aspiration: Aspiration;
  // 연령대별로 왜 중요한지 한 줄 근거
  ageNotes?: Partial<Record<AgeBand, string>>;
  sources: string[];
  items: CategoryItem[];
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
    items: [
      { label: '주 3회 운동', ages: ['20s', '30s', '40s'] },
      { label: '근력 운동 습관 만들기', ages: ['30s', '40s'] },
      { label: '하루 7시간 수면' },
      { label: '목표 체중 관리' },
      { label: '연 1회 종합 건강검진', ages: ['40s', '50s'] },
      { label: '금연 · 절주' },
      { label: '건강한 식단 (주 5일 집밥)' },
      { label: '하프 · 풀코스 마라톤 완주', ages: ['20s', '30s'] },
      { label: '정신건강 상담 · 번아웃 관리', ages: ['20s', '30s'] },
      { label: '만성질환 관리 (혈압 · 혈당)', ages: ['50s'] },
      { label: '매일 걷기 8천 보', ages: ['50s'] },
    ],
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
    items: [
      { label: '비상금 6개월치 모으기', ages: ['20s', '30s'] },
      { label: '학자금 · 부채 상환', ages: ['20s', '30s'] },
      { label: '연금 · 퇴직계좌 개설', ages: ['20s'] },
      { label: '월 저축률 30%' },
      { label: '투자 공부 · 첫 투자', ages: ['20s'] },
      { label: '연봉 목표 달성', ages: ['20s', '30s'] },
      { label: '내 집 마련 자금', ages: ['30s', '40s'] },
      { label: '은퇴자금 연소득 2배 (40세)', ages: ['40s'] },
      { label: '부수입 · 파이프라인 만들기' },
      { label: '자녀 교육비 준비', ages: ['40s'] },
      { label: '은퇴 후 월 현금흐름 설계', ages: ['50s'] },
    ],
  },
  {
    id: 'stability',
    label: '생활 안정',
    emoji: '🏠',
    maslow: 2,
    aspiration: 'extrinsic',
    sources: ['maslow', 'reddit-before-30'],
    items: [
      { label: '독립 · 자취 시작', ages: ['20s'] },
      { label: '내 집 마련', ages: ['30s', '40s'] },
      { label: '차량 구입' },
      { label: '필요한 보험 정리', ages: ['30s'] },
      { label: '집 정리 · 미니멀 라이프' },
      { label: '운전면허 취득', ages: ['20s'] },
      { label: '살고 싶은 도시로 이주' },
      { label: '유언장 · 상속 정리', ages: ['50s'] },
    ],
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
    items: [
      { label: '가까운 친구와 정기 모임' },
      { label: '연애 · 좋은 파트너 만나기', ages: ['20s', '30s'] },
      { label: '결혼', ages: ['30s'] },
      { label: '자녀 계획 · 육아', ages: ['30s', '40s'] },
      { label: '부모님과 월 1회 시간 보내기' },
      { label: '가족 여행 연 1회', ages: ['30s', '40s', '50s'] },
      { label: '배우자와 주 1회 데이트', ages: ['30s', '40s'] },
      { label: '오래된 친구에게 먼저 연락하기' },
      { label: '부모님 노후 함께 준비', ages: ['40s', '50s'] },
      { label: '손주 · 다음 세대와 시간', ages: ['50s'] },
    ],
  },
  {
    id: 'network',
    label: '네트워크 · 공동체',
    emoji: '🤝',
    maslow: 3,
    aspiration: 'intrinsic',
    sources: ['kasser-ryan-ai', 'pew-2021-meaning'],
    items: [
      { label: '업계 모임 · 컨퍼런스 참석', ages: ['20s', '30s'] },
      { label: '멘토 찾기', ages: ['20s'] },
      { label: '스터디 · 동호회 활동' },
      { label: '커뮤니티 직접 운영' },
      { label: '링크드인 · 프로필 정리', ages: ['20s', '30s'] },
      { label: '분기마다 새로운 사람 3명 만나기' },
      { label: '지역 사회 모임 참여', ages: ['50s'] },
    ],
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
    items: [
      { label: '좋아하는 일 · 직무 찾기', ages: ['20s'] },
      { label: '핵심 자격증 취득', ages: ['20s', '30s'] },
      { label: '승진 · 직급 목표', ages: ['30s', '40s'] },
      { label: '이직 · 커리어 전환', ages: ['20s', '30s'] },
      { label: '전문 분야 깊이 파기', ages: ['30s'] },
      { label: '팀 리딩 · 관리자 경험', ages: ['30s', '40s'] },
      { label: '사이드 프로젝트 출시', ages: ['20s', '30s'] },
      { label: '창업 · 독립', ages: ['30s', '40s'] },
      { label: '연봉 협상 성공' },
      { label: '해외 근무 · 글로벌 경력', ages: ['20s', '30s'] },
      { label: '두 번째 커리어 준비', ages: ['40s', '50s'] },
      { label: '경력 정리 · 자문 · 강의', ages: ['50s'] },
    ],
  },
  {
    id: 'recognition',
    label: '평판 · 브랜딩',
    emoji: '🌟',
    maslow: 4,
    aspiration: 'extrinsic',
    sources: ['kasser-ryan-ai'],
    items: [
      { label: '포트폴리오 완성', ages: ['20s'] },
      { label: '블로그 · 뉴스레터 주 1회' },
      { label: '컨퍼런스 · 세미나 발표', ages: ['30s', '40s'] },
      { label: '책 출간', ages: ['40s', '50s'] },
      { label: 'SNS 팔로워 목표' },
      { label: '업계 수상 · 인증' },
      { label: '유튜브 · 팟캐스트 시작' },
      { label: '외모 · 스타일 관리' },
    ],
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
    items: [
      { label: '외국어 회화 가능 수준', ages: ['20s', '30s'] },
      { label: '한 달에 책 2권' },
      { label: '대학원 · 학위', ages: ['20s', '30s'] },
      { label: '새로운 기술 하나 배우기' },
      { label: '온라인 강의 수료' },
      { label: '글쓰기 습관' },
      { label: '코딩 · AI 활용 능력' },
      { label: '평생 배우고 싶은 분야 정하기', ages: ['50s'] },
    ],
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
    items: [
      { label: '가보고 싶은 나라 여행' },
      { label: '한 달 살기' },
      { label: '스카이다이빙 · 번지점프', ages: ['20s', '30s'] },
      { label: '악기 배우기' },
      { label: '요리 실력 키우기' },
      { label: '사진 · 그림 등 창작 취미' },
      { label: '등산 · 캠핑' },
      { label: '공연 · 전시 월 1회' },
      { label: '혼자 떠나는 여행', ages: ['20s', '30s'] },
      { label: '정원 가꾸기 · 귀촌 준비', ages: ['50s'] },
    ],
  },
  {
    id: 'mindset',
    label: '마음 · 의미',
    emoji: '🧘',
    maslow: 5,
    aspiration: 'intrinsic',
    sources: ['kasser-ryan-ai', 'maslow'],
    items: [
      { label: '매일 10분 명상' },
      { label: '일기 · 회고 쓰기' },
      { label: '감사 일기' },
      { label: '나의 가치관 · 원칙 정리' },
      { label: '디지털 디톡스' },
      { label: '실패를 기록하고 배우기' },
      { label: '일과 삶의 균형 지키기', ages: ['30s', '40s'] },
      { label: '인생 회고록 쓰기', ages: ['50s'] },
    ],
  },
  {
    id: 'contribution',
    label: '기여 · 나눔',
    emoji: '🌱',
    maslow: 6,
    aspiration: 'intrinsic',
    sources: ['kasser-ryan-ai', 'koltko-rivera'],
    items: [
      { label: '정기 봉사 활동' },
      { label: '정기 기부' },
      { label: '후배 멘토링', ages: ['30s', '40s', '50s'] },
      { label: '지식 무료 공유 (강의 · 오픈소스)' },
      { label: '사회 문제 해결 프로젝트' },
      { label: '재단 · 장학금 설립', ages: ['50s'] },
      { label: '다음 세대에 남길 유산 정리', ages: ['50s'] },
    ],
  },
];

export const categoryById = (id?: string) => CATEGORIES.find(c => c.id === id);
