# 목표 카테고리 설계 근거

81칸을 채울 때 고르는 **3단계 목표 카테고리** 데이터의 설계 방법과 출처입니다.
데이터 파일: [`data.ts`](../career-mandalart/src/categories/data.ts) (1레벨) · [`tree.ts`](../career-mandalart/src/categories/tree.ts) (2 · 3레벨) · [`units.ts`](../career-mandalart/src/categories/units.ts) (단위)

## 1. 구조

```
매슬로우 단계 (6)
 └ 1레벨 카테고리 (11)        ← 가운데 9칸 (핵심 목표 · 세부 목표)에서 선택
    └ 2레벨 세부 카테고리 (6~9) ← 바깥 블록 8칸에 기본 안내 (빈 칸에 "+ 운동"처럼 표시), 다른 카테고리로 바꿀 수 있음
       └ 3레벨 행동 (2~6)       ← 실행 과제 칸에서 선택 / 직접 입력 / 카테고리에 추가
          └ 단위 (모두 선택)    ← ⏰ 시간: 언제 · 얼마나 · 언제까지 / 📍 장소: 어디서 · 어디로 / 🔢 수량: 숫자 + 단위(회 · 일 · 개 · 권 · 차 …, 최대 3개)
```

- 칸 문장은 고른 값으로 자동 완성된다: `매주 토요일 공원에서 달리기 5km · 3개월 안에`. 직접 고친 문장은 덮어쓰지 않는다.
- 2레벨 정렬 · 표시: 내 연령대에서 많이 언급된 영역(★) → 키워드 자산 v1 에 그 영역을 가리키는 말이 있는 영역(🔎) → 원래 순서.
  - 연령대(`ages`)는 기존 속성 아이템의 연령대 근거(아래 3절)를 영역 단위로 옮긴 것이다.
  - 키워드(`kw`)는 [keyword-assets/v1](../keyword-assets/v1/keywords.json) 카테고리별 한국어 키워드 중 그 영역을 직접 가리키는 말이다. 예: 건강 › 운동 = 달리기 · 러닝, 학습 › 외국어 = 외국어, 기여 › 환경 = 기후 변화.
- 3레벨 행동은 기존 속성 아이템(예: "주 3회 운동", "한 달에 책 2권")에서 숫자를 빼고 동사형으로 나눈 것이다. 숫자 · 기간 · 장소는 단위로 사용자가 정한다. 각 행동에는 기본 수량 단위가 있다 (달리기 → km, 책 읽기 → 권).
- 칸에는 선택 내용(`Cell.spec`)이 함께 저장되어 다시 열면 그대로 복원된다. QR 에는 완성된 문장만 담긴다.

| 매슬로우 단계 | 카테고리 | Aspiration Index 분류 |
|---|---|---|
| 1 생리 | 💪 건강 | 건강 (독립 요인) |
| 2 안전 | 💰 재무 · 🏠 생활 안정 | 외재적 (부) |
| 3 소속 · 사랑 | ❤️ 관계 · 가족 · 🤝 네트워크 · 공동체 | 내재적 (관계 · 공동체) |
| 4 존중 | 💼 커리어 · 🌟 평판 · 브랜딩 | 내재적(커리어) / 외재적 (명성 · 이미지) |
| 5 자아실현 | 📚 학습 · 성장 · ✈️ 경험 · 취미 · 🧘 마음 · 의미 | 내재적 (개인 성장) |
| 6 자기초월 | 🌱 기여 · 나눔 | 내재적 (공동체 기여) |

## 2. 설계 원칙

1. **상위 축은 매슬로우 6단계.** 널리 알려진 5단계(1943/1954)에 Maslow가 1969년 추가한 **자기초월**을 더했습니다 (Koltko-Rivera, 2006). 아래 단계가 안정되어야 위 단계 목표가 지속된다는 직관을 카테고리 순서로 보여줍니다.
2. **카테고리 경계는 Aspiration Index.** Kasser & Ryan의 7개 인생 목표 영역(부 · 명성 · 이미지 / 관계 · 개인 성장 · 공동체 기여 / 건강)은 수십 개국에서 검증된 분류라 카테고리를 나누는 기준으로 썼습니다. 내재적 목표 달성이 행복감과 더 강하게 연결된다는 연구 결과가 있어, 외재적 카테고리(재무 · 평판)도 넣되 내재적 카테고리를 더 촘촘히 구성했습니다.
3. **커리어 앱이므로 '일'을 독립 카테고리로.** Pew 2023 조사에서 "즐거운 일 · 커리어"가 충만한 삶의 1위 요소(71%)였고, 한국 25~44세 조사에서도 '일'이 청년기 과업 1위(38.1%)였습니다.
4. **연령대 태그는 근거가 있는 곳에만.** 조사 결과나 반복적으로 등장하는 연령별 조언이 있는 아이템에만 붙였습니다. 태그가 없는 아이템은 전 연령 공통입니다.

## 3. 연령대별 근거 요약

| 연령대 | 두드러지는 목표 | 근거 |
|---|---|---|
| 20대 | 돈(많은 돈을 중요시 35%, 전 연령 최고) · 친구 · 공동체 · 교육 · 배움 · 취미 · 도전적 경험 · 커리어 탐색 · 비상금 · 연금 시작 | pew-2023-fulfilling, pew-2021-meaning, bucket-list-study, finance-milestones |
| 30대 | 커리어 · 가족(다른 연령보다 자주 언급) · 학자금 상환 · 6개월 비상금 · 근력 운동 시작 | pew-2021-meaning, finance-milestones, reddit-selfimprovement |
| 40대 | 커리어 · 가족 · 은퇴자금 연소득 2배 · 일과 가정 균형(40대에서 '일 우선' ≈ '둘 다 중요') | pew-2021-meaning, finance-milestones, kostat-2017 |
| 50대+ | 물질적 안정(한국은 전 연령 1위) · 건강 · 은퇴 · 지역 사회 · 즐거운 일(65세 이상 78%) · 내면적 버킷리스트 | pew-2021-meaning, pew-2023-fulfilling, bucket-list-study |

## 4. 출처

| 키 | 출처 |
|---|---|
| `maslow` | Maslow, A. H. (1943, 1954). 욕구 위계 5단계 |
| `koltko-rivera` | Koltko-Rivera, M. E. (2006). *Rediscovering the later version of Maslow's hierarchy of needs: Self-transcendence…* Review of General Psychology 10(4) — [academia.edu](https://www.academia.edu/3089048) |
| `kasser-ryan-ai` | Kasser & Ryan, **Aspiration Index** — 7개 목표 영역 × 5문항 — [selfdeterminationtheory.org](https://selfdeterminationtheory.org/aspirations-index), [Schmuck, Kasser & Ryan 2000](https://selfdeterminationtheory.org/SDT/documents/2000_SchmuckKasserRyan_SIR.pdf) |
| `pew-2023-fulfilling` | Pew Research Center (2023.09). *What makes for a fulfilling life* — 미국 성인 약 5,000명 — [링크](https://www.pewresearch.org/social-trends/2023/09/14/what-makes-for-a-fulfilling-life/) |
| `pew-2021-meaning` | Pew Research Center (2021.11). *What makes life meaningful? Globally, answers sometimes vary by age* — 17개국 — [링크](https://www.pewresearch.org/fact-tank/2021/11/23/what-makes-life-meaningful-globally-answers-sometimes-vary-by-age/), [Korea Times 보도](https://www.koreatimes.co.kr/amp/southkorea/society/20211202/koreans-pick-material-well-being-as-top-source-of-meaning-in-life-survey) |
| `bucket-list-study` | Periyakoil et al., Stanford — 미국 성인 3,056명 버킷리스트 분석 (91.2% 보유, 여행 78.5%, 도전적 활동 15%) — [Quartz](https://qz.com/work/1205589/making-a-bucket-list-now-leads-to-fewer-regrets-later) |
| `kr-2040-survey` | 국민통합위원회 발주 2040세대 가족 · 노동 인식 조사 (25~44세 2,690명) — 청년기 과업: 일 38.1% · 개인생활 23.1% · 파트너십 22% · 자녀 16.8% |
| `kostat-2017` | 통계청 2017 사회조사 일 · 가정 우선순위 — [서울신문 보도](https://www.seoul.co.kr/news/society/2017/11/08/20171108012006) |
| `finance-milestones` | 연령대별 재무 목표 가이드 — [moneyfit.org](https://www.moneyfit.org/financial-goals-for-various-stages-of-life/), [njcfe.org](https://njcfe.org/4-financial-goals-you-need-to-meet-by-age-40/) |
| `reddit-selfimprovement` | r/selfimprovement "30 전에 이룰 목표" 스레드 — 30대 근손실 전 운동 습관 조언 |
| `reddit-before-30` | Reddit · 블로그의 "30 전에 할 것" 목록 — 독립, 집, 차, 결혼 등 |
| `reddit-before-40` | Reddit 답변 모음 "40 전에 할 것" — [Ranker](https://www.ranker.com/list/things-to-do-before-forty/blue-velvet) |

## 5. 한계와 다음 단계

- **Reddit 원문 대량 수집은 하지 못했습니다.** Reddit 공개 API가 비인증 요청을 막고 있어(403), 이번 데이터는 검색으로 확인 가능한 Reddit 스레드 · 답변 모음과 공개 설문 연구를 근거로 정리했습니다. 정량 분석(연령대별 키워드 빈도)을 하려면 Reddit 개발자 앱 등록 후 OAuth API로 수집하는 것이 정식 경로입니다.
- 연령대 태그는 "이 연령대에서 특히 자주 등장"이라는 의미이며, 다른 연령대에 맞지 않는다는 뜻은 아닙니다.
- 사용자가 "카테고리에 추가"한 아이템은 기기에만 저장되며, 이 데이터셋을 개선하는 피드백으로 쓸 수 있습니다.
