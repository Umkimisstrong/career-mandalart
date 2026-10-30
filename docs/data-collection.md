# "삶의 목표" 데이터 수집 가이드

목표 카테고리(`src/categories/data.ts`)의 연령대별 추천을 **정량 데이터**로 보강하기 위한 방법입니다.

---

## 1. Reddit 정량 수집 — 필요한 작업

### 1-1. 사전 준비 (본인이 직접)
| 단계 | 내용 |
|---|---|
| ① Reddit 계정 | 일반 계정이면 충분 (이메일 인증 완료) |
| ② 앱 등록 | https://www.reddit.com/prefs/apps → "create another app" → 유형 **script** 선택, redirect uri 는 `http://localhost:8080` |
| ③ 키 확보 | 앱 이름 아래 **client id**, **secret** 메모 (절대 GitHub 에 올리지 않기 — `.env` 에 보관) |
| ④ 약관 확인 | Reddit **Data API Terms** · **Developer Terms** 동의. 비상업 · 개인 연구는 무료 등급(분당 100회 요청) |
| ⑤ 용도 제한 | 원문 재배포 금지, AI 모델 학습용 사용은 별도 계약 필요 → **통계(빈도 · 비율)만 앱에 반영** |

### 1-2. 수집 파이프라인 (제가 만들어 드릴 수 있는 부분)
```
① 수집      PRAW(Python) 로 대상 서브레딧의 글 · 댓글 가져오기
② 연령 추정  본문의 "I'm 28", "in my 30s", "turning 40" 같은 표현을 정규식으로 → 20대/30대/40대/50대+
③ 목표 추출  "my goal is…", "I want to…", "bucket list", "by 30 I…" 문장 추출
④ 분류      키워드 사전 + 문장 임베딩(또는 LLM)으로 11개 카테고리 · 속성에 매핑
⑤ 집계      연령대 × 카테고리 빈도표 → 상위 속성에 ★ 가중치
⑥ 반영      data.ts 의 ages 태그 · 정렬 순서를 집계 결과로 갱신 (원문은 저장하지 않음)
```

**대상 서브레딧 후보**
| 서브레딧 | 특징 |
|---|---|
| r/AskReddit | "30 전에 할 일", "40대가 20대에게" 류 대형 스레드 |
| r/selfimprovement · r/getdisciplined · r/DecidingToBeBetter | 자기계발 목표 · 습관 |
| r/careerguidance · r/cscareerquestions | 커리어 목표 (이 앱 핵심) |
| r/personalfinance · r/financialindependence | 재무 목표, 나이 언급 많음 |
| r/AskMenOver30 · r/AskWomenOver30 · r/AskOldPeople | 연령대가 명확 |
| r/bucketlist | 버킷리스트 |

**예상 소요:** 앱 등록 10분(본인) + 파이프라인 구축 · 1회 수집 · 분석 반나절(제가 진행). 정기 수집을 원하면 Oracle Cloud VM 등에서 주 1회 실행.

---

## 2. Reddit 말고 쓸 수 있는 창구

### 공식 통계 · 설문 (가장 신뢰도 높음, 추천)
| 출처 | 접근 | 무엇을 얻나 |
|---|---|---|
| **World Values Survey (WVS)** | 무료 다운로드 (회원가입) | 100여 개국 · 한국 포함. 일 · 가족 · 친구 · 여가 · 종교 · 정치의 "삶에서의 중요도"를 **연령별**로 분석 가능 — 이 앱 카테고리와 가장 잘 맞음 |
| **KOSIS 국가통계포털 · 사회조사** | 무료 OpenAPI (공공데이터포털 키 발급) | 한국인의 일 · 가정 우선순위, 여가, 삶의 만족도를 연령대별로 |
| **한국보건사회연구원 · 청년삶 실태조사** | 원자료 신청 | 청년층 목표 · 결혼 · 출산 · 주거 인식 |
| Pew Research Center | 원자료 무료 공개 | 미국 · 국제 비교 (이미 근거로 사용 중) |
| European Social Survey | 무료 | 유럽 연령대별 가치관 |

### 온라인 커뮤니티 (생생한 표현, 정제 필요)
| 출처 | 접근 | 비고 |
|---|---|---|
| **Hacker News (Algolia API)** | 인증 없이 무료 | "Ask HN: goals", 커리어 · 창업 목표가 많아 커리어 앱에 적합 |
| YouTube Data API | 무료 할당량 (Google 키) | "30대가 해야 할 일" 류 영상 댓글 |
| Mastodon / Bluesky 공개 API | 무료 | 해시태그 #goals 등 |
| 브런치 · 블로그 | 공식 API 없음 | 크롤링은 약관 위반 소지 — 수동 샘플링만 권장 |
| 블라인드 · 네이버 카페 · 더쿠 등 | 공식 API 없음 | 로그인 · 크롤링 금지 약관 → **사용 비추천** |

### 앱 자체 데이터 (장기적으로 가장 가치 있음)
- 사용자가 "카테고리에 추가"한 항목(`Store.custom`)과 선택한 연령대는 실제 수요 데이터입니다.
- 지금은 기기 안에만 저장되므로, 나중에 **익명 · 동의 기반 통계 전송**을 붙이면 데이터셋을 계속 개선할 수 있습니다 (서버 필요 → Oracle Cloud 등).

---

## 3. 추천 순서
1. **World Values Survey + KOSIS** 로 연령대별 가중치의 뼈대 만들기 (공식 데이터, 약관 문제 없음)
2. **Reddit API + Hacker News** 로 구체적인 실행 과제 표현 보강
3. 앱 사용자 데이터(동의 기반)로 지속 개선
