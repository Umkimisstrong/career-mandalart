// 앱 이름과 이름의 뜻 — 화면 · QR 캡션 · 소개 페이지가 함께 쓴다.
// 이름이 바뀌어도 저장 데이터 · QR 형식(MDA1:)은 그대로 둔다.
export const APP_NAME = '구도';
export const APP_NAME_EN = 'GUDO';
export const APP_TAGLINE_EN = 'Nine Ways';
export const APP_FULL = `${APP_NAME} ${APP_NAME_EN}`;

// 구도(GUDO)의 세 가지 뜻 — 한국어 설명과, 해외 사용자를 위한 영문 설명
export type Meaning = { hanja: string; ko: string; en: string; title: string; titleEn: string; body: string; bodyEn: string };

export const MEANINGS: Meaning[] = [
  {
    hanja: '九道',
    ko: '아홉 구 · 길 도',
    en: 'nine · way',
    title: '9개의 길',
    titleEn: 'Nine Ways',
    body: '하나의 목적을 가운데 두고, 그곳에 닿는 여덟 갈래 길과 그 길을 걷는 방법을 그립니다. 핵심 목표 1 · 세부 목표 8 · 실행 과제 64.',
    bodyEn: 'One purpose at the center, eight paths leading to it, and eight steps on each path — a map of 81 cells showing every way to your goal.',
  },
  {
    hanja: '求道',
    ko: '구할 구 · 길 도',
    en: 'seek · the Way',
    title: '길을 구한다',
    titleEn: 'Seeking the Way',
    body: '동양에서 "도(道)를 구한다"는 것은 정답을 받는 일이 아니라, 매일의 수행으로 스스로 길을 찾아가는 일입니다. 작은 실천 하나하나가 그 길입니다.',
    bodyEn: 'In Eastern thought, gudo (求道) means seeking the Way — not being handed an answer, but finding your path through daily practice. Each small action is part of the journey.',
  },
  {
    hanja: '構圖',
    ko: '얽을 구 · 그림 도',
    en: 'compose · picture',
    title: '짜임',
    titleEn: 'Composition',
    body: '그림의 구도처럼, 목표와 행동이 한 장 안에서 어떻게 짜여 있는지 한눈에 봅니다. 개인의 계획도, 팀의 방향도 하나의 판으로 정렬합니다.',
    bodyEn: 'Like the composition of a painting, see at a glance how goals and actions fit together on one page — aligning a personal plan or a whole team’s direction.',
  },
];

export const DESCRIPTION = '아홉 갈래 길로 목적을 설계하는 81칸 목표 지도';
export const DESCRIPTION_EN = 'An 81-cell goal map: one purpose, nine ways.';
