# AGENTS.md — 구도 GUDO 앱 AI 작업 규칙

이 폴더는 **구도 GUDO · Nine Ways** 앱(Expo / React Native, 웹 · iOS · Android, Windows 는 `desktop/` Electron)이다.
작업 전에 루트 [`../CLAUDE.md`](../CLAUDE.md)(결정 사항 · 데이터 규칙 · 현재 상태)와 [`README.md`](README.md)(명령 · 배포)를 읽는다. 기능 목록 · 이력은 [`../FEATURES.md`](../FEATURES.md).

## 꼭 지킬 것

- **서버 · DB 없음.** 데이터는 기기 저장소에 JSON 하나(`career-mandalart/store/v1`). 서버 · 로그인 · 외부 전송을 넣지 않는다 (팀 목표도 코드 주고받기로).
- **옛 이름 식별자는 바꾸지 않는다.** 저장소 · Vercel 프로젝트 · 저장 키 · bundle id · QR 접두사(`MDA1:` · `GDT1:`)는 그대로. 화면 · 문서의 이름은 「구도 GUDO · Nine Ways」, 사용자에게 보이는 말은 「목표」(옛 말 「청사진」 쓰지 않음), 「백업 코드」(「JSON 백업」 쓰지 않음).
- **세부 목표는 `getCell` / `setCell` 로만** 읽고 쓴다. 바깥 블록 가운데 칸은 저장하지 않고 `blocks[4][b]` 를 참조한다.
- **크기 규칙은 `model.ts` 함수로** — `blocksOf(size)` · `cellsIn(plan, block)` · `growSlots` · `trackedCells`. 화면 배치는 `src/components/ShapeLayout.ts`.
- **저장 형식을 바꾸면** `version` 을 올리고 `isStore` / `loadStore` 에 옮기기 코드를 넣는다. QR 튜플(`src/qr/codec.ts`) · 팀 코드(`src/team.ts`)는 예전 코드를 계속 읽을 수 있게 뒤에만 덧붙인다.
- **색 하드코딩 금지.** 화면 색은 `useTheme()` 의 `{ t, ui }`, 판의 칸 색은 `useBoard()`. 칸 그리기는 `BoardCell` · `paintCell` 하나로.
- **움직임은 `src/components/Motion.tsx`**(Tap · Appear · useEase) — 기기 「동작 줄이기」를 존중한다.
- **팀 목표 권한**: 담당자는 자기 블록 실행 과제만(`canEditBlock`), 관리자만 이름 · 핵심 · 세부 목표 · 복제 · 삭제.
- **Windows 릴리스는 `desktop/` 에서 `npm run release` 로만.** 다른 GitHub 릴리스를 만들면 `latest` 가 바뀌어 자동 업데이트가 깨진다. 화면만 바뀐 변경은 Vercel 배포로 충분하다.
- 공개 저장소다. 개인 정보 · 루트 `my-goals/`(git 제외) 내용을 코드 · 문서 · 커밋에 넣지 않는다. Vercel 무료 플랜은 비상업용이라 결제 · 광고 · 판매 링크를 넣지 않는다.

## 구조

| 위치 | 하는 일 |
|---|---|
| `App.tsx` | 화면 전환(상태 `route`: list · plan(전체 / 블록) · team · today · calendar · theme · look · card · qr · scan · backup · templates · about · story · version), 자동 저장, `?widget=` · `?team=` 처리. **Expo Router 는 쓰지 않는다** |
| `src/model.ts` | Plan · Cell · Store, 크기 · 칸 규칙, 진행률, 예시 목표 |
| `src/storage.ts` | 저장 · 불러오기, 백업 코드 내보내기 · 병합 |
| `src/theme.ts` · `src/pictures.ts` | 앱 테마 · 블록 테마 토큰(`buildBoard`), 그림 표, 퍼즐 그림 `assets/scenes/` |
| `src/team.ts` | 팀 초대장 · 갱신 코드, `receiveTeamCode`, `canEditBlock` |
| `src/routine.ts` · `notify(.web).ts` · `ics.ts` | 반복 점검 계산 · 알림 예약 · 캘린더 파일 |
| `src/calendar.ts` | 일정(`Store.events`) · 한 줄 형식 해석 |
| `src/categories/` | 매슬로우 · BSC 카테고리, 세부 카테고리 · 행동, 단위, 연령대 템플릿(`buildPlan`) |
| `src/qr/` · `src/share/` | QR 코덱 · 이미지, 이미지 카드 |
| `src/desktop.ts` | Windows 앱 다리 `window.gudoDesktop` |
| `src/components/` · `src/screens/` | 공용 부품 · 화면 |
| `desktop/` | Electron: main · preload · updater · release |
| `scripts/` | `pwa.mjs`(웹 빌드 후 PWA 주입) · `share-qr.mjs` · (미사용) 로컬 Git → EAS |

## 명령

```bash
npm run typecheck       # 끝내기 전에 반드시 (pre-commit 훅도 검사)
npx expo start          # 개발 서버
npm run build:web       # 웹 빌드 확인
npx expo install <pkg>  # 패키지 추가는 항상 이걸로 — SDK 에 맞는 버전
```

UI 를 바꿨으면 루트 `.claude/skills/verify-gudo`(git 제외, 이 PC 에만) 로 실제 앱을 조작해 확인한다.

## Expo 는 자주 바뀐다 — 기억을 믿지 말 것

SDK 마다 API 가 바뀐다. Expo · React Native API 를 쓰기 전에 `package.json` 의 `expo` 주 버전(지금 58)을 확인하고 `https://docs.expo.dev/versions/v58.0.0/` 또는 https://docs.expo.dev/llms.txt 를 본다.

- `ios/` · `android/` 는 만들어지는 폴더다(CNG). 손으로 만들거나 고치지 말고 `app.json` · config plugin 으로 설정한다.
- Expo Go 는 들어 있는 네이티브 모듈만 쓴다. 네이티브 코드가 있는 라이브러리를 더하면 development build 가 필요하다.
- EAS CLI 는 `npx eas-cli@latest <명령>` 으로 쓴다.
