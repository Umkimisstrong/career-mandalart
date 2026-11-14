# 구도 GUDO · Nine Ways — 앱

만다라트(9×9 목표표) 방식으로 목표를 설계 · 실행 · 점검하는 앱. 코드 하나로 iOS · Android · 웹, 그리고 Windows 앱(Electron)까지.
앱 소개와 기능 설명은 [루트 README](../README.md), 기능 목록 · 이력은 [FEATURES.md](../FEATURES.md).

```
핵심 목표 1  →  세부 목표 8  →  세부 목표마다 실행 과제 8  (= 81칸, 크기 9)
크기 1 · 3 · 5 · 7 칸도 같은 규칙 (가운데 = 핵심, 둘레 = 세부 목표)
```

> 저장소 · Vercel 프로젝트 · 저장 키 · bundle id 는 옛 이름 `career-mandalart` 를 그대로 씁니다 (바꾸면 기존 링크 · 홈 화면 앱 · 저장 데이터가 끊김).

## 기술 스펙

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Expo SDK 58 + React Native 0.88** (react-native-web) | 코드 하나로 iOS · Android · Web |
| 언어 | TypeScript | 커밋 전 타입 검사(pre-commit 훅) |
| 데이터 | **DB 없음** — AsyncStorage(웹은 localStorage) 에 JSON 1개, 키 `career-mandalart/store/v1` | 기기에만 저장, 서버 · 계정 불필요 |
| 옮기기 | 백업 코드(모든 목표) · QR 이미지(목표 1개) · 팀 초대장 / 갱신 코드 | 기기 변경 · 다른 사람과 나누기 |
| 웹 배포 | Vercel 무료 플랜 — GitHub `main` push 하면 자동 | 링크만 보내면 누구나 씀, 홈 화면에 추가 |
| Windows | `desktop/` Electron — 큰 창 = 웹 앱, 작은 창 = `?widget=<목표 id>` | 바탕화면 작은 창 · 트레이 |
| Windows 업데이트 | electron-updater, GitHub 릴리스 `latest` | 설치본이 스스로 새 버전 받기 |

필요 환경: **Node.js 22.13 이상** (개발 PC 는 26.13), Git.

## 실행 · 검사

```bash
npm install
npx expo start          # Expo Go 로 iPhone / Android 에서 실행 (터미널 QR), w = 웹
npm run typecheck       # tsc --noEmit
npm run build:web       # dist/ 에 웹 + PWA 빌드 (Vercel 이 실행)
```

- PC 에서 설치 안내 배너 미리 보기: 주소 끝에 `?install-preview=ios` 또는 `?install-preview=inapp-kakao`
- 공유용 링크 QR 다시 만들기: `node scripts/share-qr.mjs` → `../docs/share/career-mandalart-link-qr.png`

## 휴대폰에서 열기

| 방법 | 비용 | 다른 사람 공유 | 비고 |
|---|---|---|---|
| **웹 + 홈 화면에 추가** | 무료 | 링크만 보내면 됨 | 가장 쉬움. 데이터는 각자 브라우저에 저장. 화면은 열 때마다 최신 |
| Expo Go | 무료 | 같은 Wi-Fi 또는 `npx expo start --tunnel` | 개발 · 시험용, PC 가 켜져 있어야 함 |
| TestFlight / App Store | Apple 개발자 $99/년 | 초대 링크 / 스토어 | `npx eas-cli@latest build -p ios` + `submit` (아직 안 함) |

iPhone 은 Safari 로 주소를 연 뒤 **공유 → 홈 화면에 추가**, Android 는 「앱 설치」 버튼(또는 ⋮ 메뉴)으로 아이콘이 생기고 주소창 없이 열립니다.

## 웹 배포 (Vercel)

- 루트 `vercel.json` 이 이 폴더(`career-mandalart/`)를 빌드합니다 (`npm run build:web` → `dist/`).
- `main` 에 push 하면 1~2분 안에 https://career-mandalart.vercel.app 이 새로 배포됩니다.
- `scripts/pwa.mjs` 가 빌드 뒤 PWA 메타 · manifest · 서비스 워커(`sw.js`) · 화면 빌드 표시(`gudo-build`)를 넣습니다. 버전 화면의 「화면 빌드」가 이 값입니다.
- 호스팅 선택 근거는 [docs/hosting.md](../docs/hosting.md).

## Windows 앱 (`desktop/`)

```bash
cd desktop
npm install
node node_modules/electron/install.js   # npm 12 는 install script 를 막아 electron 바이너리를 직접 받음
npm run dev                              # localhost:8090 웹 앱으로 시험 (먼저 웹을 그 포트로 띄움)
npm run dist                             # out/GUDO-Setup-*.exe 만들기 (배포 안 함)
```

- 큰 창은 Vercel 웹 앱을 그대로 엽니다. 그래서 **화면만 바뀐 변경은 Vercel 배포만으로 Windows 앱에도 반영**됩니다 (릴리스 불필요).
- 작은 창은 같은 주소 `?widget=<목표 id>` → `src/screens/Widget.tsx`. 저장하지 않고 storage 이벤트로 읽기만 합니다. 창 위치 · 크기 · 항상 위는 userData `widgets.json`.
- 트레이: 구도 열기 · 작은 창 모두 앞으로 · Windows 시작할 때 실행 · 버전 · 업데이트 · 종료.
- **새 Windows 앱 버전 내보내기**: `desktop/package.json` 의 version 을 올리고 `npm run release` → GitHub 릴리스 `desktop-v<버전>` 이 생기고, 설치본들이 자동으로 받습니다.
  - 설치 · 덮어 설치 링크(고정): https://github.com/Umkimisstrong/career-mandalart/releases/latest/download/GUDO-Setup.exe
  - ⚠️ 다른 GitHub 릴리스를 만들면 `latest` 가 바뀌어 자동 업데이트가 깨집니다. 릴리스는 `npm run release` 로만.

## 데이터 구조

`src/model.ts` 참고. 전체 데이터는 JSON 하나입니다 (`Store`).

```json
{ "version": 1, "plans": [ { "id": "...", "title": "...", "size": 9, "blocks": [[{ "text": "", "note": "", "done": false }, "...9칸"], "...9블록"] } ], "events": [] }
```

- 크기와 상관없이 9×9 로 저장하고, 크기별로 쓰는 칸은 `blocksOf(size)` · `cellsIn(plan, block)` 이 정합니다.
- 바깥 블록의 가운데 칸은 저장하지 않고 가운데 블록의 세부 목표를 참조합니다 (`getCell` · `setCell`). 세부 목표를 한 곳에서 고치면 양쪽이 같이 바뀝니다.
- 형식을 바꾸면 `version` 을 올리고 `isStore` / `loadStore` 에 옮기기 코드를 넣습니다.
- QR 형식(`MDA1:` 접두사, 튜플 순서)은 `src/qr/codec.ts`, 팀 코드(`?team=` · `GDT1:`)는 `src/team.ts`.

## (미사용) 로컬 Git → EAS 자동배포

스토어 앱을 낼 때를 위해 남겨 둔 파이프라인입니다. 지금 배포는 Vercel(웹) · GitHub 릴리스(Windows) 만 씁니다.

```
[작업 폴더] --git push local--> [~/git-server/career-mandalart.git]
                                    └ post-receive 훅 → scripts/deploy.mjs
                                       ├ npm ci · tsc · 번들 검사
                                       └ EAS update / build
```

| 명령 | 결과 |
|---|---|
| `npm run setup:git` | 로컬 bare 저장소 · 훅 1회 설정 |
| `npm run deploy:dry` | EAS 호출 없이 파이프라인만 점검 |
| `git push local develop` / `main` | 검사 후 preview / production 채널 EAS Update |
| `git tag v1.1.0` → `git push local v1.1.0` | iOS + Android 스토어용 빌드 |

처음 쓸 때는 `npx eas-cli@latest login` · `init` · `update:configure` 와 첫 빌드가 필요합니다 (iOS 는 Apple 개발자 계정). 배포 로그: `~/git-server/career-mandalart.git/deploy.log`.
