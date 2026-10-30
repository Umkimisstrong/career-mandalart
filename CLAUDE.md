# 01. Career — 프로젝트 요약 (AI 컨텍스트)

이 폴더는 **커리어 만다라트** 앱 프로젝트다. AI 는 작업 전에 이 파일과 `career-mandalart/AGENTS.md`, `career-mandalart/README.md` 를 읽는다.

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
| QR 저장소 | 청사진 1개 = QR 이미지 1장. `src/qr/codec.ts`: 저장 칸 73개 튜플 JSON → deflate(fflate) → base45 → `MDA1:` 접두사. 영숫자 모드 용량 4296자 초과 시 메모 제외, 그래도 넘치면 오류. 불러오면 항상 새 id 로 추가 |
| QR 읽기 | 웹: `image.web.ts` 파일 선택(사진/촬영) + jsQR. 네이티브: `QrScan.tsx` expo-camera `CameraView`. 생성: 웹 qrcode→canvas PNG(제목 캡션), 네이티브 react-native-svg |
| 로컬 Git 자동배포 | 로컬 bare 저장소 + post-receive 훅 → `scripts/deploy.mjs` → EAS Update/Build |
| 사용자 기기 | 사용자는 **iPhone** 사용. 다른 사람에게도 보여주고 싶어함 |
| iPhone 배포 경로 | ① Vercel 웹 배포(+홈 화면 추가) — 무료, 즉시 ② Expo Go — 개발용 ③ TestFlight/App Store — Apple 개발자 계정($99/년) 필요 |

| 목표 카테고리 | `src/categories/data.ts`: 매슬로우 6단계(자기초월 포함) × 11개 카테고리 × 하위 속성, 연령대 태그(20s/30s/40s/50s). 세부 목표 칸 `Cell.cat` = 카테고리 id, 실행 과제 칸은 블록 카테고리 속성 추천. 사용자 추가 속성은 `Store.custom`, 연령대는 `Store.age`. 근거·출처는 `docs/categories.md` |
| 데이터 수집 제약 | Reddit 비인증 JSON 은 403, 우회 시도는 정책상 차단됨. 정량 수집이 필요하면 Reddit OAuth 앱 등록 후 공식 API 사용 |

## 폴더 구조
```
career-mandalart/
  App.tsx                 화면 전환(list / backup / plan(overview|block)) + 자동 저장
  src/model.ts            데이터 모델, 좌표 규칙, 진행률, 샘플 데이터
  src/storage.ts          AsyncStorage 저장/로드, JSON 내보내기/가져오기
  src/theme.ts            공통 스타일, 블록 색상
  src/screens/            PlanList, Overview(81칸), BlockEditor(3x3 + 칸 편집 모달), Backup, QrShare, QrScan
  src/categories/data.ts  목표 카테고리 데이터셋
  src/components/CategoryPicker.tsx  세부 목표 카테고리 선택 / 실행 과제 속성 추천
  src/qr/                 QR 코덱(codec.ts), 웹 이미지 생성·읽기(image.web.ts)
docs/categories.md        카테고리 설계 근거와 출처
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
- 환경: Git·GitHub CLI·Vercel CLI 설치·로그인 완료. Node 는 아직 **20.10 (Expo 58 은 22.13+ 필요)** — 로컬 실행 전 업그레이드 필요.
- Windows PowerShell 실행 정책 때문에 `vercel` 대신 `vercel.cmd` 로 호출해야 함.
- `scripts/setup-local-git.ps1` 은 `career-mandalart/` 를 저장소 루트로 가정하고 작성됨 — 지금은 상위 폴더가 저장소이므로 사용 전 경로 수정 필요.

## 다음 할 일 후보
- Node 22 / Git 설치 → `npm run setup:git` → `eas init`
- Vercel 연결 후 iPhone Safari → 공유 → 홈 화면에 추가
- 아이디어: 칸별 기한/리마인더, 이미지로 내보내기(공유용 9×9 카드), 다크 모드
