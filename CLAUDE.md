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
| 로컬 Git 자동배포 | 로컬 bare 저장소 + post-receive 훅 → `scripts/deploy.mjs` → EAS Update/Build |
| 사용자 기기 | 사용자는 **iPhone** 사용. 다른 사람에게도 보여주고 싶어함 |
| iPhone 배포 경로 | ① Vercel 웹 배포(+홈 화면 추가) — 무료, 즉시 ② Expo Go — 개발용 ③ TestFlight/App Store — Apple 개발자 계정($99/년) 필요 |

## 폴더 구조
```
career-mandalart/
  App.tsx                 화면 전환(list / backup / plan(overview|block)) + 자동 저장
  src/model.ts            데이터 모델, 좌표 규칙, 진행률, 샘플 데이터
  src/storage.ts          AsyncStorage 저장/로드, JSON 내보내기/가져오기
  src/theme.ts            공통 스타일, 블록 색상
  src/screens/            PlanList, Overview(81칸), BlockEditor(3x3 + 칸 편집 모달), Backup
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
- 미검증: 실제 iPhone 실행, Git 훅 실제 push, EAS update/build, Vercel 실제 배포.
- 환경 이슈: 이 PC 는 **Node 20.10 (Expo 58 은 22.13+ 필요)**, **Git 미설치**. 둘 다 설치해야 로컬 실행/배포 가능.

## 다음 할 일 후보
- Node 22 / Git 설치 → `npm run setup:git` → `eas init`
- Vercel 연결 후 iPhone Safari → 공유 → 홈 화면에 추가
- 아이디어: 칸별 기한/리마인더, 이미지로 내보내기(공유용 9×9 카드), 다크 모드
