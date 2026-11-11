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
| QR 저장소 | 청사진 1개 = QR 이미지 1장. `src/qr/codec.ts`: 저장 칸 73개 튜플 JSON(5번째 cats · 6번째 size · 7번째 extra · 8번째 블록 테마 선택) → deflate(fflate) → base45 → `MDA1:` 접두사. 영숫자 모드 용량 4296자 초과 시 메모 제외, 그래도 넘치면 오류. 불러오면 항상 새 id 로 추가 |
| QR 읽기 | 웹: `image.web.ts` 파일 선택(사진/촬영) + jsQR. 네이티브: `QrScan.tsx` expo-camera `CameraView`. 생성: 웹 qrcode→canvas PNG(제목 캡션), 네이티브 react-native-svg |
| 로컬 Git 자동배포 | 로컬 bare 저장소 + post-receive 훅 → `scripts/deploy.mjs` → EAS Update/Build |
| 사용자 기기 | 사용자는 **iPhone** 사용. 다른 사람에게도 보여주고 싶어함 |
| iPhone 배포 경로 | ① Vercel 웹 배포(+홈 화면 추가) — 무료, 즉시 ② Expo Go — 개발용 ③ TestFlight/App Store — Apple 개발자 계정($99/년) 필요 |

| 목표 카테고리 | **3단계.** 1레벨 `src/categories/data.ts` 매슬로우 6단계 × 11개 카테고리(가운데 9칸) → 2레벨 `tree.ts` SUBS 세부 카테고리(ages · kw=키워드 자산 근거, 바깥 블록 빈 칸에 `guideSub` 로 기본 안내) → 3레벨 행동(`행동/기본단위`) + `units.ts` 단위(시간: 언제·얼마나·언제까지 / 장소: 어디서·어디로 / 수량: 숫자+단위 최대 3) → `composeText` 로 칸 문장 자동 완성. 선택은 `Cell.spec`(ActionSpec)에 저장, QR 에는 문장만. 연령대 태그 10s~90s (9단계). **템플릿** `src/categories/templates.ts`: 연령대별 81칸 9종(`"sub:행동 @언제 ~얼마나 #수량 ^까지 &어디서 =어디로"` → `parseAction` → `planFromTemplate`), 화면 `src/screens/Templates.tsx`, 근거 `docs/templates.md`. 핵심 · 세부 목표 칸 `Cell.cat` = 카테고리 id (칸 편집 창은 카테고리 선택이 내용 입력보다 위), 실행 과제 칸은 블록 카테고리 속성 추천. 사용자 추가 속성은 `Store.custom`, 연령대는 `Store.age`. 근거·출처는 `docs/categories.md` |
| 테마 | **두 층.** ① **앱 테마** `Store.theme`(ThemeSetting: id · colors · family · variant) — 블록을 뺀 화면 전체 톤앤매너, `useTheme()` 의 `{ t, ui }`. ② **블록 테마** `BlockTheme = { family, variant, colors?, art?: 'motif'|'puzzle', reveal? }` — 보드 칸만, **목표마다** `Plan.blockTheme`, 기본 `Store.blockTheme`, 둘 다 없으면 앱 테마와 같게(`blockThemeFor(store, plan)`). 보드 토큰은 `buildBoard` → `BoardProvider`/`useBoard()`. 계열: 색상(default · northstar · mono · signature · custom) · 우드(숲속 · 나무 마을) · 음식(케이크 · 라면 · 피자) · 계절(봄 · 여름 · 가을 · 겨울), 그림 표 `src/pictures.ts`(PICTURES), 퍼즐 그림 `assets/scenes/*.png`. `reveal`(완료할수록 그림 완성) = 퍼즐에서 안 한 칸 흐리게(작은 창은 블록 완료율만큼). 칸 그리기 `src/components/BoardCell.tsx`(paintCell → Paint.alpha), 움직임 `src/components/Motion.tsx`(Tap · Appear · useEase, 동작 줄이기 존중). 화면: 설정 `ThemeSettings.tsx`(앱 테마 / 블록 기본 테마), 목표별 `PlanTheme.tsx`(목표 화면 「테마」), 공용 `ThemePicker` · `MiniBoard`. 블록 테마는 팀 코드로 안 보냄(기기마다), QR 8번째 튜플로 보냄. 색 하드코딩 금지. 웹 글꼴 Jua · Gowun Dodum |
| 청사진 크기 | `Plan.size` 1 · 3 · 5 · 7 · 9 (없으면 9 = 81칸 시그니처, 기본값 유지). 저장 구조는 그대로 9×9, `model.ts` 의 `blocksOf(size)` · `cellsOf(size, block)`(3칸은 세부 목표 묶음이 세로 [1,4,7]) · `slotPos`(7칸은 위 · 아래 줄 반 칸 안으로 = 육각) · `trackedCells`(완료 · 반복 점검 칸, 1칸은 핵심 목표). 화면 배치 `src/components/ShapeLayout.ts`. QR 6번째 튜플 = size (9 면 생략). **3 · 5칸은 세부 목표 묶음마다 빈 자리에 실행 과제 칸을 더 열 수 있다**(최대 3×3) — `Plan.extra`(블록 → 칸), `cellsIn` · `growSlots` · `setExtra`, 블록 화면 ＋ · 「이 칸 빼기」, QR 7번째 튜플 · 팀 코드 `x` 로 전달. 7칸(육각)은 자리가 어긋나 제외 |
| 반복 점검 · 알림 | `src/routine.ts`: 실행 과제 `Cell.routine`(freq daily · weekdays · weekly · monthly, days, time 'HH:MM', start) + `Cell.log`(체크한 기간 키: 일 = 날짜, 주 = 그 주 월요일, 월 = 'YYYY-MM'). `routineStats`(연속 · 달성률 · 놓친 전 기간), `routineItems`, `dayGrid`, `upcoming`. 화면 `src/screens/Today.tsx`(오늘의 점검), 칸 편집 ⑤ `src/components/RoutinePicker.tsx`. 알림 `src/notify.ts`(expo-notifications 로컬 알림, 35일 · 최대 60개 예약, 체크한 기간 제외) / `notify.web.ts`(열려 있을 때 알림 · 앱 배지) + `src/ics.ts`(캘린더 반복 일정 + VALARM). `Store.notify` = 알림 켬. routine · log 는 QR 에 담지 않음(JSON 백업에는 포함) |
| Windows 데스크톱 · 위젯 | `career-mandalart/desktop/` Electron(main.cjs · preload.cjs). 큰 창 = Vercel 웹 앱, 작은 창 = 같은 주소 `?widget=<목표 id>` → `src/screens/Widget.tsx`(저장 안 함, storage 이벤트로 읽기만). 다리 `src/desktop.ts`(window.gudoDesktop). `Store.widget` = 띄울 목표 id. 창 위치 · 크기 · 항상 위는 userData/widgets.json. 빌드 `cd desktop && npm install && node node_modules/electron/install.js && npm run dist` → `out/GUDO-Setup-*.exe` (npm 12 는 install script 를 막아 electron 바이너리를 직접 받아야 함). 로컬 시험 `npm run dev`(localhost:8090). **자동 업데이트(1.2.0~)**: `desktop/updater.cjs`(electron-updater, generic provider = GitHub `releases/latest/download`), 새 버전 배포 = `desktop/package.json` version 올리고 `npm run release` → 릴리스 `desktop-v<버전>`. 배포 링크(설치 · 덮어 설치) https://github.com/Umkimisstrong/career-mandalart/releases/latest/download/GUDO-Setup.exe. 다른 GitHub 릴리스를 만들면 latest 가 바뀌어 업데이트가 깨지니 주의. 화면 변경은 Vercel 배포만으로 반영(릴리스 불필요) |
| 칸보다 많은 일 | 블록당 실행 과제는 최대 8칸(3×3). 더 필요하면 ① `Cell.items`(하위 할 일 체크리스트, 칸 편집 창 · 칸에 ☑ n/m · 팀 코드 `i` 로 전달, QR 에는 없음) ② 「새 목표로 펼치기」 — 실행 과제를 핵심 목표로 새 목표 생성, `Cell.child` ↔ `Plan.parent` 로 서로 이동(↗ · ↖) |
| 팀 목표 | **서버 없이.** 만들기 ② 「팀 목표」 → 세부 목표 = 균형성과표(BSC) 카테고리, 이 기기가 관리자. `src/team.ts`: `Plan.team`(id · role · block · owners · stamps), 초대장 · 갱신 코드(링크 `?team=` · QR `GDT1:`), `receiveTeamCode`(보낸 사람이 고칠 수 있는 블록만, 더 최근일 때만). 담당자는 자기 블록만 편집, 관리자만 복제 · 삭제. 화면 `src/screens/Team.tsx`. 체크리스트 수준 · 실시간 없음(사용자 결정 2026-11-09). 근거 · 결정 `docs/team.md` |
| 호스팅 | Vercel 무료 플랜만 사용, 자체 도메인 없음 (사용자 결정 2026-11-01) |
| 키워드 자산 | **카테고리의 베이스 데이터.** `keyword-assets/` (README · dictionary.ko.json 검수 사전 · v1/keywords.json). 빌드: `node research/build-keyword-assets.mjs` → 앱용 `src/categories/keywordWeights.json` (연령대별 카테고리 비율 · 한국어 키워드). 원문 미저장, 버전 폴더로 관리 |
| 키워드 조사 | `research/collect-keywords.mjs` (HN Algolia · Mastodon 공개 API, 원문 미저장 · 집계만) → `research/output/keywords.json`, 보고서 `docs/research/keywords-2026-11.md` |
| 앱 정체성 | **이름 확정: 구도 GUDO · Nine Ways** — 九道(9개의 길) · 求道(길을 구한다) · 構圖(짜임). 이름 · 한영 설명은 `src/brand.ts`, 소개 화면 `src/screens/About.tsx`. (경위) "만다라트"는 대중에게 낯섦 → 개인(목표 설계) + 기업(팀 성과 · 방향성) 겸용, [목적을 향해 가기 위한] 상징어. 후보는 `docs/identity.md` (North Nine 방향 선호, 별·북극성·지표 조합 5선: North Nine · StarMark · NineStar · Polaris Nine · North Index). 디자인 컨셉 = 북극성 · 별 (`northstar` 테마). 앱의 배경 = 오타니 쇼헤이 → `src/screens/Story.tsx` (보도 확인 사실만, `ohtaniPlan()` 예시). 데이터 · QR 형식은 이름과 무관하게 유지 |
| 데이터 수집 제약 | Reddit 비인증 JSON 은 403, 우회 시도는 정책상 차단됨. 정량 수집이 필요하면 Reddit OAuth 앱 등록 후 공식 API 사용 |

## 폴더 구조
```
career-mandalart/
  App.tsx                 화면 전환(list · plan(overview|block) · team · today · backup · qr · version …) + 자동 저장, ?widget= · ?team= 처리
  src/model.ts            데이터 모델(Plan · Cell · Store), 크기 · 칸 규칙(blocksOf · cellsIn · growSlots), 진행률, 샘플
  src/storage.ts          AsyncStorage(웹 localStorage) 저장 · 로드, 백업 코드(JSON) 내보내기 · 가져오기
  src/theme.ts            테마 토큰 · 공통 스타일
  src/team.ts             팀 목표: 초대장 · 갱신 코드 형식, 받기 규칙(receiveTeamCode), 권한(canEditBlock)
  src/desktop.ts          Windows 데스크톱 앱과의 다리(window.gudoDesktop), WIDGET_ID
  src/routine.ts · notify(.web).ts · ics.ts  반복 점검 계산 · 알림 · 캘린더 파일
  src/categories/         data.ts(개인 매슬로우 + 팀 BSC 카테고리) · tree.ts · units.ts · templates.ts(연령대 템플릿 · buildPlan)
  src/components/         CategoryPicker · RoutinePicker · ShapeLayout · PlanPreview · Icons(휴지통 · 종 · 모양 아이콘) · InstallBanner
  src/screens/            PlanList(목록 · 만들기 탭) · Overview · BlockEditor(칸 편집 · 하위 할 일 · 펼치기 · 칸 늘리기) · Today · Team · Widget · Version · Backup · QrShare · QrScan · Templates · Story · About · ThemeSettings
  src/share/              이미지 카드: card.ts(배치 모델 cardModel) · render.web.ts(캔버스 그리기), 화면 CardShare
  src/qr/                 QR 코덱(codec.ts, base45 공용), 웹 이미지 생성 · 읽기(image.web.ts)
  desktop/                Windows 데스크톱 앱(Electron): main.cjs(큰 창 · 작은 창 · 트레이) · preload.cjs · updater.cjs(자동 업데이트) · release.cjs(npm run release)
  scripts/pwa.mjs         웹 빌드 후 PWA 메타 · manifest · 서비스 워커 · 화면 빌드 표시(gudo-build) 주입
  scripts/deploy.mjs · post-receive · setup-local-git.ps1  로컬 Git → EAS 배포 파이프라인 (미사용)
  .githooks/pre-commit    커밋 전 tsc 검사
  eas.json, vercel.json   EAS 빌드 프로필 / Vercel 웹 배포 설정
docs/                     categories · templates · team(조직 확장 근거 · 결정) · hosting · identity · research …
FEATURES.md               기능 목록 & 작업 이력 (기능 추가 시 갱신)
.claude/skills/verify-gudo/  (git 제외) 앱을 사용자처럼 조작해 증명하는 검증 스킬 — 기능 지도 features/
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

## 현재 상태 (2026-11-11)
- 배포: 웹 https://career-mandalart.vercel.app (GitHub `main` push → Vercel 자동). Windows 앱 1.2.1 — 설치 · 업데이트 링크 https://github.com/Umkimisstrong/career-mandalart/releases/latest/download/GUDO-Setup.exe, 설치본은 GitHub 릴리스로 자동 업데이트.
- 기능 목록 · 이력은 FEATURES.md. 크기(1 · 3 · 5 · 7 · 9) · 단계별 만들기 · 미리보기 · 반복 점검 · 팀 목표 · 칸 늘리기 · 하위 할 일 · 펼치기 · 데스크톱 작은 창 · 버전 화면까지.
- 검증: 2026-11-11 verify-gudo 로 목록 · 만들기 · 칸 편집 · 팀 · 작은 창 5개 기능을 실제 앱에서 증명. 미검증: 실제 iPhone · Android 화면, 휴대폰 알림, 네이티브 카메라 QR, 작은 창 실제 마우스 클릭.
- 판매 시작 기준(사용자 결정): ① 사용자 10명 피드백 ② 디자인 · 테마 확정 ③ 9×9 이미지 카드 — ③ 완료(2026-11-11, 목표 화면 「카드」 · 퍼즐 그림 · 흐림 조절), ② **확정**(2026-11-11 사용자: 둥근 파스텔 UI · 움직임 · 앱 테마 / 블록 테마 두 층 · 4계열 · 퍼즐 그림). 남은 기준 ① 10명 피드백.
- 알려진 빈틈: 팀 목표 실행 과제 편집 창에 개인(매슬로우) 추천이 뜸. 기기끼리 데이터 자동 동기화 없음(백업 코드 · QR 로 옮김).
- GitHub: https://github.com/Umkimisstrong/career-mandalart (public). 루트 `vercel.json` 이 `career-mandalart/` 를 빌드.
- 환경: Node 26.13, Git · GitHub CLI · Vercel CLI 로그인. PowerShell 에서는 `vercel.cmd`. 데스크톱 빌드는 `career-mandalart/desktop` 에서 (npm 12 는 electron 바이너리를 `node node_modules/electron/install.js` 로 직접 받음).

## 다음 할 일 후보
- 팀 목표 실행 과제 편집 창을 BSC 에 맞는 추천으로 (지금은 개인 카테고리 추천)
- 캘린더 메뉴 (달력에서 반복 점검 · 일정 보기, 형식에 맞춘 일정 입력)
- 실제 휴대폰 점검 (화면 · 알림 · 카메라 QR)
