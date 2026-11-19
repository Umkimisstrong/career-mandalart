# Microsoft Store 등록 준비

구도 Windows 앱을 Microsoft Store 에 올리는 절차와 준비물. 체크리스트 전체는 [launch-checklist.md](launch-checklist.md).

_작성: 2026-11-19_

## 1. 방식 — MSIX(스토어 패키지)

| | MSIX (선택) | EXE · MSI 설치 파일 |
|---|---|---|
| 서명 | **Microsoft 가 서명** — 인증서 필요 없음 | 개발자가 공인 코드 서명 인증서로 서명 (유료) |
| 업데이트 | 스토어가 맡음 | 앱이 직접 |
| 만들기 | `cd career-mandalart/desktop && npm run dist:store` → `out/GUDO-Store.appx` | — |

- 스토어판은 앱 안의 GitHub 자동 업데이트를 끈다 (`updater.cjs` — `process.windowsStore`). 「Windows 시작할 때 실행」 트레이 메뉴도 숨긴다 (스토어 앱은 Windows 설정 › 시작 앱에서).
- 화면(웹 앱)은 지금처럼 `gudo.pages.dev` 에서 받으므로, 화면만 바뀐 변경은 스토어 재심사 없이 반영된다. 껍데기(작은 창 · 트레이)를 바꿀 때만 새 패키지를 올린다.
- 패키지를 만드는 PC 에 **Windows SDK** 가 있어야 한다 (`store.cjs` 가 `C:/Program Files (x86)/Windows Kits/10/bin/<버전>/x64/makeappx.exe` 를 찾는다. electron-builder 에 들어 있는 makeappx 는 이 PC 에서 실행되지 않음).
- 기존 GitHub 설치본(`GUDO-Setup.exe`)은 그대로 둔다. 둘은 저장 공간이 따로라, 옮길 때는 「백업 · 복원」의 백업 코드를 쓴다.

## 2. 순서

| # | 할 일 | 누가 |
|---|---|---|
| 1 | [Partner Center](https://partner.microsoft.com/dashboard) 에서 **개인 개발자 계정** 만들기 (무료, 신원 확인) | 사용자 |
| 2 | 앱 만들기 → 「MSIX or PWA app」 → 이름 **「구도 GUDO」** 예약 (안 되면 「GUDO · Nine Ways」) | 사용자 |
| 3 | 제품 관리 › **제품 ID(Product identity)** 페이지의 세 값을 알려 주기: `Package/Identity/Name` · `Package/Identity/Publisher` · `Package/Identity/PublisherDisplayName` | 사용자 → AI |
| 4 | `desktop/package.json` 의 `build.appx` TODO 세 칸을 그 값으로 바꾸고 `npm run dist:store` | AI |
| 5 | 제출 만들기: 가격(무료) · 시장 · 연령 등급 설문 · 아래 4절 소개 문구 · 스크린샷 · 개인정보처리방침 주소 · `GUDO-Store.appx` 올리기 | 사용자 (문구 · 그림은 AI 가 준비) |
| 6 | 심사 (보통 몇 시간 ~ 3영업일). 「runFullTrust 를 왜 쓰나」 질문이 오면: 「Electron 데스크톱 앱이라 필요합니다(바탕화면 작은 창 · 트레이)」 | 사용자 |

## 3. 제출에 들어가는 값

| 항목 | 값 |
|---|---|
| 앱 이름 | 구도 GUDO |
| 카테고리 | 생산성 (Productivity) |
| 가격 | 무료 |
| 개인정보처리방침 | https://gudo.pages.dev/privacy |
| 지원 연락처 | gudonineway@gmail.com |
| 웹사이트 | https://gudo.pages.dev |
| 연령 등급 | 모든 연령 (수집 정보 없음 · 사용자 간 대화 없음 · 구매 없음) |
| 패키지 버전 | `desktop/package.json` version + `.0` (예: 1.3.1.0). 제출할 때마다 올린다 |

## 4. 스토어 소개 문구 (초안)

> ⚠️ 스토어 문구 · 스크린샷에 유명인 이름 · 사진은 쓰지 않는다 (심사 · 퍼블리시티권). 앱 안 이야기 화면은 별개.

### 한국어

**짧은 설명**
하나의 목적을 아홉 갈래 길로 — 81칸 목표 지도를 그리고, 바탕화면에 띄워 두고, AI 세션으로 진행하세요.

**설명**
구도(GUDO · Nine Ways)는 만다라트(9×9 목표표) 방식으로 목표를 설계하고 실천을 점검하는 앱입니다.

- 핵심 목표 하나 → 세부 목표 8개 → 실행 과제 64개. 부담되면 1 · 3 · 5 · 7칸으로 작게 시작
- 연령대별 템플릿과 카테고리 추천으로 빈 칸 앞에서 막히지 않게
- 반복 점검 · 오늘의 점검 · 캘린더 · 알림으로 매일의 실천을 기록
- 바탕화면 작은 창 — 목표를 띄워 두고 바로 체크
- AI 로 내보내기 — 목표 구조 그대로 Claude · ChatGPT · Gemini 세션을 시작하고, 진행 현황을 다시 가져와 칸에 반영
- 팀 목표 — 서버 없이 초대장으로 블록마다 담당자를 정해 함께 보기
- 테마 · 퍼즐 그림 · 이미지 카드
- 회원가입 · 서버 없음. 모든 내용은 내 PC 에만 저장

**주요 기능 (Product features, 줄마다 하나)**
- 81칸 목표 지도 (1 · 3 · 5 · 7 · 9칸)
- 연령대별 템플릿 · 카테고리 추천
- 반복 점검 · 캘린더 · 알림
- 바탕화면 작은 창
- AI 세션 내보내기 · 진행 현황 자동 동기화
- 서버 없이 팀 목표
- 회원가입 없음 · 내 PC 에만 저장

**검색 키워드**: 만다라트, 목표, 계획, 습관, 체크리스트, AI, 생산성

### English

**Short description**
One purpose, nine ways — map your goals on 81 cells, keep them on your desktop, and run them as AI sessions.

**Description**
GUDO (Nine Ways) helps you design goals with the Mandal-Art 9×9 method and track daily practice.

- One core goal → 8 sub-goals → 64 actions. Start small with 1, 3, 5 or 7 cells
- Age-based templates and category suggestions
- Routines, today's check, calendar and reminders
- Desktop mini window to keep a goal in sight and check it off
- Export to AI — start Claude, ChatGPT or Gemini sessions with your goal structure and sync progress back
- Team goals without a server — invite owners per block
- Themes, puzzle pictures and image cards
- No sign-up, no server. Everything stays on your PC

**Keywords**: mandalart, goals, planner, habits, checklist, AI, productivity

## 5. 스크린샷

- 데스크톱용: 1366×768 이상 (권장 1920×1080), PNG, 1~10장.
- 후보: ① 81칸 전체 화면 ② 블록 · 칸 편집 ③ 바탕화면 작은 창 ④ AI 로 내보내기(단계 안내) ⑤ 오늘의 점검 · 캘린더 ⑥ 테마 · 퍼즐 그림.
- 만들 때는 예시 목표만 쓴다 (개인 목표 · 이름이 보이지 않게).
