# 키워드 자산 (Keyword Assets)

[인간 · 삶 · 목표 · 목적 · 꿈] 에 대해 사람들이 실제로 쓰는 말을 모아, **목표 카테고리의 베이스 데이터**로 관리하는 곳입니다.

## 구성

| 파일 | 내용 | 누가 고치나 |
|---|---|---|
| `dictionary.ko.json` | 영어 키워드 → 한국어 번역 사전. **여기 있는 단어만 자산에 들어감** (사람이 검수한 단어만). 값이 `{ ko, cats }` 이면 지정한 카테고리에서만 사용 | 사람 (검수) |
| `v1/keywords.json` | 자산 본체 — 시드 5개 · 카테고리 11개별 키워드(영/한, 등장 수, 비율, 점수), 카테고리 비율, 연령대별 비율, 출처 · 수집일 · 방법 | 빌드 스크립트 |
| `v1/untranslated.json` | 상위에 올랐지만 사전에 없는 단어 — 다음 검수 때 의미 있는 것만 사전에 추가 | 빌드 스크립트 |
| `../career-mandalart/src/categories/keywordWeights.json` | 앱에 싣는 최소 데이터 (연령대별 카테고리 비율 · 카테고리별 한국어 키워드 6개) | 빌드 스크립트 |

## 흐름

```
research/collect-keywords.mjs      공개 API 수집 → research/output/keywords.json (집계만, 원문 없음)
        │
research/build-keyword-assets.mjs  특징 단어 추출 + 사전 검수 → keyword-assets/v1/*
        │                                                     → 앱 keywordWeights.json
        ▼
앱 실행 과제 추천 — 연령대에 맞춰 카테고리 순서 정렬 · "사람들이 자주 쓴 말" 표시
앱 2레벨 세부 카테고리 — src/categories/tree.ts 의 kw 가 v1 한국어 키워드를 참조 (🔎 표시 · 정렬)
```

## 갱신 절차

```bash
node research/collect-keywords.mjs        # 1. 다시 수집 (약 5분)
# 2. keyword-assets/v1/untranslated.json 를 보고 의미 있는 단어를 dictionary.ko.json 에 추가
node research/build-keyword-assets.mjs    # 3. 자산 · 앱 데이터 재생성
```

- 데이터 구조가 바뀌면 `v2/` 폴더를 새로 만들고 스크립트의 `VERSION` 을 올립니다. 이전 버전은 지우지 않습니다.
- 새 출처를 추가하면 `collect-keywords.mjs` 의 `sources` 와 이 문서의 출처 표를 함께 갱신합니다.

## 출처 (v1, 2026-11-01 수집)

| 출처 | 접근 | 규모 |
|---|---|---|
| Hacker News — Algolia 공개 검색 API | 인증 없음 | 시드 글 약 11,800건 + 연령 보강 검색 약 10,500건 |
| Mastodon — mastodon.social 공개 해시태그 타임라인 | 인증 없음 | 약 640건 (영어, 스팸 · 홍보 제외) |

## 원칙
- **원문을 저장 · 재배포하지 않습니다.** 단어 빈도와 비율만 남깁니다.
- 로그인 · 키 발급 · 약관상 수집 금지인 곳은 쓰지 않습니다.
- 편향을 기록합니다: v1 은 영어권 · 기술직 비중이 높아 커리어 관련 비율이 실제보다 높을 수 있습니다. 한국어 자료가 추가되면 별도 출처로 구분해 합칩니다.

## 분석 보고서
- [docs/research/keywords-2026-11.md](../docs/research/keywords-2026-11.md)
