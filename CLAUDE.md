# 01. Career — 프로젝트 요약 (AI 컨텍스트)

이 폴더는 **구도 GUDO · Nine Ways** (옛 이름 커리어 만다라트) 앱 프로젝트다. 저장소 · Vercel · 저장 키 · bundle id 는 옛 이름(`career-mandalart`) 유지. AI 는 작업 전에 이 파일과 `career-mandalart/AGENTS.md`, `career-mandalart/README.md` 를 읽는다.

## 목적
오타니 쇼헤이의 만다라트(9×9 목표 달성표)처럼 개인이 커리어 청사진을 설계·기획·추적하는 모바일 앱.
- 핵심 목표 1 → 세부 목표 8 → 세부 목표마다 실행 과제 8 (총 81칸)
- 여러 개의 청사진(계획)을 만들 수 있고, 실행 과제별 완료 체크로 진행률을 본다.

## 사용자 요구사항 (결정됨)
| 요구 | 결정 |
|---|---|
| iOS + Android 모두 지원 | Expo SDK 58 + React Native 0.88 + TypeScript (웹도 같은 코드로 동작) |
| DB 없이 정보 관리 | AsyncStorage 에 JSON 1개 (`career-mandalart/store/v1` 키). 웹에서는 localStorage |
| 데이터 이동 | JSON 내보내기(공유 시트) / 붙여넣기 복원, 같은 id 는 덮어쓰기 병합 |
| QR 저장소 | 청사진 1개 = QR 이미지 1장. `src/qr/codec.ts`: 저장 칸 73개 튜플 JSON(5번째 cats · 6번째 size 선택) → deflate(fflate) → base45 → `MDA1:` 접두사. 영숫자 모드 용량 4296자 초과 시 메모 제외, 그래도 넘치면 오류. 불러오면 항상 새 id 로 추가 |
| QR 읽기 | 웹: `image.web.ts` 파일 선택(사진/촬영) + jsQR. 네이티브: `QrScan.tsx` expo-camera `CameraView`. 생성: 웹 qrcode→canvas PNG(제목 캡션), 네이티브 react-native-svg |
| 로컬 Git 자동배포 | 로컬 bare 저장소 + post-receive 훅 → `scripts/deploy.mjs` → EAS Update/Build |
| 사용자 기기 | 사용자는 **iPhone** 사용. 다른 사람에게도 보여주고 싶어함 |
| iPhone 배포 경로 | ① Vercel 웹 배포(+홈 화면 추가) — 무료, 즉시 ② Expo Go — 개발용 ③ TestFlight/App Store — Apple 개발자 계정($99/년) 필요 |

| 목표 카테고리 | **3단계.** 1레벨 `src/categories/data.ts` 매슬로우 6단계 × 11개 카테고리(가운데 9칸) → 2레벨 `tree.ts` SUBS 세부 카테고리(ages · kw=키워드 자산 근거, 바깥 블록 빈 칸에 `guideSub` 로 기본 안내) → 3레벨 행동(`행동/기본단위`) + `units.ts` 단위(시간: 언제·얼마나·언제까지 / 장소: 어디서·어디로 / 수량: 숫자+단위 최대 3) → `composeText` 로 칸 문장 자동 완성. 선택은 `Cell.spec`(ActionSpec)에 저장, QR 에는 문장만. 연령대 태그 10s~90s (9단계). **템플릿** `src/categories/templates.ts`: 연령대별 81칸 9종(`"sub:행동 @언제 ~얼마나 #수량 ^까지 &어디서 =어디로"` → `parseAction` → `planFromTemplate`), 화면 `src/screens/Templates.tsx`, 근거 `docs/templates.md`. 핵심 · 세부 목표 칸 `Cell.cat` = 카테고리 id (칸 편집 창은 카테고리 선택이 내용 입력보다 위), 실행 과제 칸은 블록 카테고리 속성 추천. 사용자 추가 속성은 `Store.custom`, 연령대는 `Store.age`. 근거·출처는 `docs/categories.md` |
| 테마 | `src/theme.ts`: `buildTheme(Store.theme)` → 색 토큰(bg/surface/text/primary/done/blocks[9]/on()) + `makeUi`. 화면은 `useTheme()` 로 `{ t, ui }` 사용, 색 하드코딩 금지. 테마: default · northstar(밤하늘 · 금빛) · mono · signature(흰/파랑 #005A9C/빨강 #EF3E42) · custom(2~4색). 설정 화면 `ThemeSettings.tsx` |
| 청사진 크기 | `Plan.size` 1 · 3 · 5 · 7 · 9 (없으면 9 = 81칸 시그니처, 기본값 유지). 저장 구조는 그대로 9×9, `model.ts` 의 `blocksOf(size)` · `cellsOf(size, block)`(3칸은 세부 목표 묶음이 세로 [1,4,7]) · `slotPos`(7칸은 위 · 아래 줄 반 칸 안으로 = 육각) · `trackedCells`(완료 · 반복 점검 칸, 1칸은 핵심 목표). 화면 배치 `src/components/ShapeLayout.ts`. QR 6번째 튜플 = size (9 면 생략) |
| 반복 점검 · 알림 | `src/routine.ts`: 실행 과제 `Cell.routine`(freq daily · weekdays · weekly · monthly, days, time 'HH:MM', start) + `Cell.log`(체크한 기간 키: 일 = 날짜, 주 = 그 주 월요일, 월 = 'YYYY-MM'). `routineStats`(연속 · 달성률 · 놓친 전 기간), `routineItems`, `dayGrid`, `upcoming`. 화면 `src/screens/Today.tsx`(오늘의 점검), 칸 편집 ⑤ `src/components/RoutinePicker.tsx`. 알림 `src/notify.ts`(expo-notifications 로컬 알림, 35일 · 최대 60개 예약, 체크한 기간 제외) / `notify.web.ts`(열려 있을 때 알림 · 앱 배지) + `src/ics.ts`(캘린더 반복 일정 + VALARM). `Store.notify` = 알림 켬. routine · log 는 QR 에 담지 않음(JSON 백업에는 포함) |
| 호스팅 | Vercel 무료 플랜만 사용, 자체 도메인 없음 (사용자 결정 2026-11-01) |
| 키워드 자산 | **카테고리의 베이스 데이터.** `keyword-assets/` (README · dictionary.ko.json 검수 사전 · v1/keywords.json). 빌드: `node research/build-keyword-assets.mjs` → 앱용 `src/categories/keywordWeights.json` (연령대별 카테고리 비율 · 한국어 키워드). 원문 미저장, 버전 폴더로 관리 |
| 키워드 조사 | `research/collect-keywords.mjs` (HN Algolia · Mastodon 공개 API, 원문 미저장 · 집계만) → `research/output/keywords.json`, 보고서 `docs/research/keywords-2026-11.md` |
| 앱 정체성 | **이름 확정: 구도 GUDO · Nine Ways** — 九道(9개의 길) · 求道(길을 구한다) · 構圖(짜임). 이름 · 한영 설명은 `src/brand.ts`, 소개 화면 `src/screens/About.tsx`. (경위) "만다라트"는 대중에게 낯섦 → 개인(목표 설계) + 기업(팀 성과 · 방향성) 겸용, [목적을 향해 가기 위한] 상징어. 후보는 `docs/identity.md` (North Nine 방향 선호, 별·북극성·지표 조합 5선: North Nine · StarMark · NineStar · Polaris Nine · North Index). 디자인 컨셉 = 북극성 · 별 (`northstar` 테마). 앱의 배경 = 오타니 쇼헤이 → `src/screens/Story.tsx` (보도 확인 사실만, `ohtaniPlan()` 예시). 데이터 · QR 형식은 이름과 무관하게 유지 |
| 데이터 수집 제약 | Reddit 비인증 JSON 은 403, 우회 시도는 정책상 차단됨. 정량 수집이 필요하면 Reddit OAuth 앱 등록 후 공식 API 사용 |

## 폴더 구조
```
career-mandalart/
  App.tsx                 화면 전환(list / backup / plan(overview|block)) + 자동 저장
  src/model.ts            데이터 모델, 좌표 규칙, 진행률, 샘플 데이터
  src/storage.ts          AsyncStorage 저장/로드, JSON 내보내기/가져오기
  src/theme.ts            공통 스타일, 블록 색상
  src/screens/            PlanList, Overview(81칸), BlockEditor(3x3 + 칸 편집 모달), Today(오늘의 점검), Backup, QrShare, QrScan
  src/routine.ts · notify(.web).ts · ics.ts  반복 점검 계산 · 알림 · 캘린더 파일
  src/categories/data.ts  목표 카테고리 데이터셋
  src/components/CategoryPicker.tsx  세부 목표 카테고리 선택 / 실행 과제 속성 추천
  src/qr/                 QR 코덱(codec.ts), 웹 이미지 생성·읽기(image.web.ts)
docs/categories.md        카테고리 설계 근거와 출처
docs/hosting.md · docs/data-collection.md  무료 호스팅 비교 / 목표 데이터 수집 방법
docs/TODO-확인.md         사용자 확인 · 결정 대기 목록
FEATURES.md               기능 목록 & 작업 이력 (기능 추가 시 갱신)
  scripts/deploy.mjs      배포 파이프라인 (ref 별: develop→preview OTA, main→production OTA, v* 태그→스토어 빌드)
  scripts/post-receive    bare 저장소에 설치되는 훅 템플릿
  scripts/setup-local-git.ps1  로컬 Git 서버 1회 설정
  scripts/pwa.mjs         웹 빌드 후 iPhone 홈 화면 앱(PWA) 메타/manifest 주입
  .githooks/pre-commit    커밋 전 tsc 검사
  eas.json, vercel.json   EAS 빌드 프로필 / Vercel 웹 배포 설정
```

## 데이터 모델 핵심 규칙 (`src/model.ts`)
- `Plan.blocks: Cell[9][9]`, 블록·칸 인덱스는 3×3 을 왼쪽 위부터 0..8. `CENTER = 4`.
- `blocks[4][4]` = 핵심 목표, `blocks[4][i]` = 세부 목표 i.
- 바깥 블록 b 의 가운데 칸은 **저장하지 않고** `blocks[4][b]` 를 참조 (`getCell`/`setCell` 의 `resolve`). 세부 목표는 반드시 이 함수로 읽고 쓴다.
- 진행률 = 바깥 블록 가장자리(실행 과제) 중 텍스트가 있는 칸 기준 완료 비율.
- 저장 형식 `{ version: 1, plans: Plan[] }`. 형식을 바꾸면 version 을 올리고 `isStore`/`loadStore` 에 마이그레이션 추가.

## 명령어
```bash
npm install
npx expo start          # Expo Go 로 iPhone/Android 에서 실행 (QR)
npm run typecheck
npm run build:web       # dist/ 에 웹 + PWA 빌드 (Vercel 이 실행)
npm run setup:git       # 로컬 Git 자동배포 1회 설정
npm run deploy:dry      # EAS 호출 없이 배포 파이프라인 점검
```

## 현재 상태 (2026-10-30)
- 완료: 앱 4개 화면, 로컬 저장, JSON 백업/복원, EAS/로컬 Git 배포 스크립트, Vercel 설정, PWA 메타 주입.
- 검증: tsc 통과, 웹 번들 빌드 성공, 375px 모바일 뷰에서 편집·완료·저장·진행률 동작 확인.
- GitHub: https://github.com/Umkimisstrong/career-mandalart (public, 저장소 루트 = 이 폴더)
- Vercel: https://career-mandalart.vercel.app — GitHub `main` push 시 자동 배포. 루트 `vercel.json` 이 `career-mandalart/` 하위 폴더를 빌드하도록 지정 (Vercel 프로젝트 Root Directory 는 비워둠).
- QR 기능: 웹에서 81칸 + 메모 + 완료 체크 왕복(생성 PNG → jsQR 디코드 → 복원) 일치 확인. 세부 목표 카테고리도 QR 에 포함(5번째 튜플). 네이티브 카메라 스캔은 미검증.
- 카테고리 기능: 웹 375px 에서 세부 목표 카테고리 선택, 연령대 추천(★), 속성 선택 입력, 직접 추가(Store.custom) 동작 확인.
- 미검증: 실제 iPhone 실행, 로컬 Git 훅 push, EAS update/build.
- 환경: Git·GitHub CLI·Vercel CLI 설치·로그인 완료. Node **26.13 LTS** (Expo 58 지원) — `npm run build:web`, `npx expo start` 로컬 실행 가능.
- Windows PowerShell 실행 정책 때문에 `vercel` 대신 `vercel.cmd` 로 호출해야 함.
- `scripts/setup-local-git.ps1` 은 `career-mandalart/` 를 저장소 루트로 가정하고 작성됨 — 지금은 상위 폴더가 저장소이므로 사용 전 경로 수정 필요.

## 다음 할 일 후보
- Node 22 / Git 설치 → `npm run setup:git` → `eas init`
- Vercel 연결 후 iPhone Safari → 공유 → 홈 화면에 추가
- 아이디어: 칸별 기한/리마인더, 이미지로 내보내기(공유용 9×9 카드), 다크 모드
