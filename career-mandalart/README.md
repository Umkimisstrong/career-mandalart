# 커리어 만다라트

오타니 쇼헤이의 만다라트(9×9 목표 달성표) 방식으로 커리어를 설계하는 iOS/Android 앱.

```
핵심 목표 1  →  세부 목표 8  →  세부 목표마다 실행 과제 8  (= 81칸)
```

## 기술 스펙

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Expo SDK 58 + React Native 0.88** | 코드 하나로 iOS·Android·Web 동시 지원 |
| 언어 | TypeScript | 타입 검사로 커밋 전 오류 차단 |
| 데이터 | **DB 없음** — AsyncStorage 에 JSON 1개 | 기기에만 저장, 서버·계정 불필요 |
| 백업 | JSON 내보내기(공유 시트) / 붙여넣기 복원 | 기기 변경·여러 기기 간 이동 |
| 배포 | 로컬 bare Git 저장소 + post-receive 훅 → EAS | push 하면 자동 검사·배포 |
| 업데이트 | EAS Update (OTA) | 스토어 심사 없이 JS 변경 즉시 반영 |

필요 환경: **Node.js 22.13 이상**, Git for Windows, Expo 계정(무료).

## 실행

```bash
npm install
npx expo start
```

휴대폰에 **Expo Go** 앱을 설치하고 터미널의 QR 코드를 찍으면 iOS/Android 에서 바로 실행됩니다. `w` 를 누르면 웹 브라우저로 열립니다.

## iPhone 에서 열기

| 방법 | 비용 | 다른 사람 공유 | 비고 |
|---|---|---|---|
| **Vercel 웹 배포 + 홈 화면 추가** | 무료 | 링크만 보내면 됨 | 가장 쉬움. 데이터는 각자 Safari 에 저장 |
| Expo Go | 무료 | 같은 Wi-Fi 또는 `npx expo start --tunnel` | 개발·테스트용, PC 가 켜져 있어야 함 |
| TestFlight / App Store | Apple 개발자 $99/년 | 초대 링크(최대 1만명) / 스토어 | `eas build -p ios` + `eas submit` |

### Vercel 배포
1. 이 폴더를 GitHub 저장소로 push (또는 `npx vercel` CLI 사용)
2. vercel.com → Add New Project → 저장소 선택 → **Root Directory: `career-mandalart`**
3. 빌드 설정은 `vercel.json` 이 지정 (`npm run build:web` → `dist/`)
4. 이후 GitHub 에 push 할 때마다 자동 재배포

iPhone 에서는 Safari 로 주소를 연 뒤 **공유 → 홈 화면에 추가** 를 누르면 아이콘이 생기고, 주소창 없이 앱처럼 열립니다.

## 데이터 구조 (DB 대신 JSON)

`src/model.ts` 참고. 전체 데이터는 아래 JSON 하나입니다.

```json
{ "version": 1, "plans": [ { "id": "...", "title": "...", "blocks": [[{ "text": "", "note": "", "done": false }, ...9], ...9] } ] }
```

바깥 블록의 가운데 칸은 저장하지 않고 가운데 블록의 세부 목표를 참조하므로, 세부 목표를 한 곳에서 고치면 양쪽이 같이 바뀝니다.

## 로컬 Git 자동배포

```
[작업 폴더] --git push local--> [~/git-server/career-mandalart.git]
                                    └ post-receive 훅
                                       ├ 배포 폴더에 체크아웃
                                       ├ npm ci · tsc · 번들 검사
                                       └ EAS update / build
```

### 1회 설정

```bash
npm run setup:git
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest update:configure
npx eas-cli@latest build --profile preview --platform android
```

- `eas init` 이 `app.json` 에 projectId 를 넣어줍니다. 변경분을 커밋하세요.
- 처음 한 번은 앱 자체를 빌드해 설치해야 OTA 업데이트를 받을 수 있습니다 (Android 는 preview APK 를 바로 설치, iOS 는 Apple 개발자 계정 필요).
- Windows 에서는 iOS 를 로컬 빌드할 수 없으므로 iOS 빌드는 EAS 클라우드에서 수행됩니다.

### 일상 사용

| 명령 | 결과 |
|---|---|
| `git commit` | pre-commit 훅이 타입 검사 |
| `git push local develop` | 검사 후 **preview** 채널 OTA 배포 |
| `git push local main` | 검사 후 **production** 채널 OTA 배포 |
| `git tag v1.1.0` → `git push local v1.1.0` | iOS + Android 스토어용 빌드 시작 |
| `npm run deploy:dry` | EAS 호출 없이 배포 파이프라인만 점검 |

배포 로그: `~/git-server/career-mandalart.git/deploy.log`
