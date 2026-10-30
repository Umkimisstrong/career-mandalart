<div align="center">

# 🎯 Career Mandalart · 커리어 만다라트

**오타니 쇼헤이의 만다라트로, 나의 커리어 청사진을 설계하세요.**

하나의 꿈을 8개의 방향으로, 8개의 방향을 64개의 실행으로.

![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Platforms](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)
![No Database](https://img.shields.io/badge/database-none-10B981)

### 👉 [바로 써보기 — career-mandalart.vercel.app](https://career-mandalart.vercel.app)

</div>

---

## 만다라트란?

만다라트(Mandal-Art)는 9×9 격자에 목표를 쪼개어 적는 목표 설계 기법입니다.
오타니 쇼헤이가 고등학교 1학년 때 **"8개 구단 드래프트 1순위"** 라는 꿈을 이 표로 설계한 것으로 유명합니다.

| | | | | | | | | |
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| · | · | · | · | · | · | · | · | · |
| · | **목표1** | · | · | **목표2** | · | · | **목표3** | · |
| · | · | · | · | · | · | · | · | · |
| · | · | · | **목표1** | **목표2** | **목표3** | · | · | · |
| · | **목표4** | · | **목표4** | ⭐ **핵심** | **목표5** | · | **목표5** | · |
| · | · | · | **목표6** | **목표7** | **목표8** | · | · | · |
| · | · | · | · | · | · | · | · | · |
| · | **목표6** | · | · | **목표7** | · | · | **목표8** | · |
| · | · | · | · | · | · | · | · | · |

> 가운데 블록의 세부 목표 8개가 바깥 8개 블록의 중심이 되고, 각 블록의 `·` 8칸이 실행 과제입니다.

| 단계 | 개수 | 예시 |
|---|---|---|
| ★ **핵심 목표** | 1 | 10년 후 업계 최고의 전문가 |
| **세부 목표** | 8 | 전문성 · 리더십 · 네트워크 · 건강 · 재무 · 브랜딩 · 학습 · 마인드셋 |
| **실행 과제** | 64 | 핵심 자격증 취득 · 기술 블로그 주 1회 · 컨퍼런스 발표 … |

이 앱은 그 81칸을 **커리어 설계**에 맞춰 휴대폰에서 만들고, 고치고, 실천 여부를 추적할 수 있게 해줍니다.

---

## ✨ 주요 기능

| | 기능 | 설명 |
|---|---|---|
| 🗂 | **여러 개의 청사진** | "2030 커리어", "이직 준비", "올해 목표"처럼 계획을 여러 개 만들고 관리 |
| 🔭 | **81칸 전체 보기** | 9개 블록을 한 화면에서 색상별로 보고, 블록을 눌러 확대 |
| ✏️ | **3×3 블록 편집** | 칸마다 내용 + 메모(기한·측정 기준)를 입력 |
| 🔗 | **자동 연결** | 가운데 블록의 세부 목표를 고치면 바깥 블록의 중심도 함께 바뀜 |
| 🧭 | **목표 카테고리** | 매슬로우 6단계 × 11개 삶의 영역. 세부 목표는 카테고리로, 실행 과제는 연령대별 추천 속성 중에서 고르거나 직접 추가 ([근거](docs/categories.md)) |
| ✅ | **실행 체크 & 진행률** | 실행 과제를 완료 처리하면 블록별 / 전체 진행률이 갱신 |
| 💾 | **자동 저장** | 입력하는 즉시 기기에 저장. 로그인도 서버도 필요 없음 |
| 🔳 | **QR로 저장 / 불러오기** | 청사진 하나를 QR 이미지 한 장으로 사진 앱에 저장하고, 그 사진을 읽어 81칸을 그대로 복원 |
| 📤 | **JSON 백업 / 복원** | 모든 청사진을 한 번에 내보내고, 붙여넣기로 다른 기기에서 복원 |
| 📱 | **홈 화면 앱** | iPhone Safari에서 "홈 화면에 추가"하면 앱처럼 실행 |

---

> 📋 전체 기능 목록과 작업 이력은 **[FEATURES.md](FEATURES.md)** 에서 볼 수 있습니다.

---

## 📱 사용 흐름

```
 청사진 목록 ──▶ 81칸 전체 보기 ──▶ 블록 편집(3×3) ──▶ 칸 편집
     │                                   │                 ├ 내용
     │                                   │                 ├ 메모 · 기한
     └─▶ 백업 / 복원                      └─ 블록 빠른 이동   └ 완료 체크
```

1. **청사진 만들기** — 이름을 정하고 새 만다라트를 엽니다.
2. **핵심 목표** — 가운데 칸에 커리어의 최종 목표를 적습니다.
3. **세부 목표 8개** — 핵심 목표를 이루기 위한 8가지 방향을 적습니다.
4. **실행 과제 64개** — 각 방향마다 구체적이고 측정 가능한 행동 8개를 적습니다.
5. **실천하고 체크** — 해낸 과제를 완료로 표시하고 진행률을 확인합니다.

> 💡 **팁** 가운데 블록에서 세부 목표 칸을 **길게 누르면** 해당 블록으로 바로 이동합니다.

---

## 🔒 데이터는 어디에 저장되나요?

**데이터베이스도, 서버도, 회원가입도 없습니다.**

모든 내용은 사용 중인 기기 안에 JSON 하나로만 저장됩니다.

| 환경 | 저장 위치 |
|---|---|
| iOS / Android 앱 | 앱 전용 로컬 저장소 (AsyncStorage) |
| 웹 / iPhone 홈 화면 앱 | 브라우저 localStorage |

- 내 계획은 **나만** 볼 수 있습니다. 어디에도 전송되지 않습니다.
- 대신 앱을 지우거나 기기를 바꾸면 데이터도 사라지므로, **QR 이미지** 또는 **JSON**으로 보관하세요.

### 🔳 QR 한 장이 곧 저장소

| 저장 | 불러오기 |
|---|---|
| 전체 보기 화면 오른쪽 위 **QR 저장** → **이미지 저장 / 공유** → 사진 앱에 저장 | 목록 화면 **QR로 불러오기** → 사진 보관함에서 QR 이미지 선택 (iPhone은 바로 촬영도 가능) |

- QR 안에 청사진의 **제목 · 81칸 내용 · 완료 체크 · 메모**가 모두 들어갑니다. 서버에 올라가지 않고 이미지 자체에 담깁니다.
- 친구에게 QR 이미지를 보내면 친구도 같은 청사진을 자기 앱에 펼칠 수 있습니다. 불러온 청사진은 **새 복사본**으로 추가되어 기존 계획을 덮어쓰지 않습니다.
- 81칸을 가득 채운 일반적인 계획은 메모까지 한 장에 들어갑니다. 내용이 아주 길면 메모를 빼고 담으며, 그래도 넘치면 JSON 백업을 안내합니다.
- 압축(deflate) 후 QR 영숫자 모드에 최적화된 base45로 인코딩합니다 — `src/qr/codec.ts`.

<details>
<summary>저장 형식 보기</summary>

```json
{
  "version": 1,
  "plans": [
    {
      "id": "lz3k9a-x1y2z3",
      "title": "나의 커리어 청사진",
      "createdAt": 1793330000000,
      "updatedAt": 1793330000000,
      "blocks": [
        [ { "text": "핵심 자격증 취득", "note": "2027년 상반기", "done": false }, "... 9칸" ],
        "... 9블록"
      ]
    }
  ]
}
```

`blocks[4][4]` 가 핵심 목표, `blocks[4][i]` 가 세부 목표이며 바깥 블록 `i` 의 중심 칸과 같은 값입니다.

</details>

---

## 🚀 사용해보기

### iPhone에서 (가장 쉬운 방법)
1. **https://career-mandalart.vercel.app** 을 **Safari**로 엽니다.
2. 하단 **공유 버튼** → **홈 화면에 추가**를 누릅니다.
3. 홈 화면의 아이콘으로 실행하면 주소창 없이 앱처럼 동작합니다.

### 개발 환경에서 실행
필요 환경: **Node.js 22.13+**

```bash
git clone https://github.com/Umkimisstrong/career-mandalart.git
cd career-mandalart/career-mandalart
npm install
npx expo start
```

- 휴대폰에 **Expo Go** 앱을 설치하고 터미널의 QR 코드를 찍으면 iOS / Android에서 바로 실행됩니다.
- 터미널에서 `w` 를 누르면 웹 브라우저로 열립니다.

---

## 🛠 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 앱 프레임워크 | Expo SDK 58 · React Native 0.88 · React 19 |
| 언어 | TypeScript |
| 저장소 | AsyncStorage (DB 없음) |
| 웹 | react-native-web · PWA 메타 주입 |
| 배포 | Vercel(웹) · EAS Update / Build(iOS·Android) · 로컬 Git 훅 |

---

## 📦 배포

| 대상 | 방법 |
|---|---|
| **웹 / iPhone 홈 화면** | Vercel에 이 저장소 연결 (루트 `vercel.json` 이 하위 폴더 빌드를 지정). 이후 `main` 에 push 할 때마다 자동 배포 |
| **iOS / Android OTA** | `git push local develop` (preview) / `git push local main` (production) — 로컬 Git 훅이 EAS Update 실행 |
| **스토어 빌드** | `git tag v1.0.0 && git push local v1.0.0` → EAS 클라우드에서 iOS + Android 빌드 |

자세한 설정 방법은 [career-mandalart/README.md](career-mandalart/README.md)를 참고하세요.

---

## 📁 프로젝트 구조

```
.
├── CLAUDE.md                  AI 어시스턴트용 프로젝트 요약
└── career-mandalart/
    ├── App.tsx                화면 전환 + 자동 저장
    ├── src/
    │   ├── model.ts           만다라트 데이터 모델 · 좌표 규칙 · 진행률
    │   ├── storage.ts         로컬 저장 · JSON 백업 / 복원
    │   ├── theme.ts           공통 스타일 · 블록 색상
    │   ├── qr/
    │   │   ├── codec.ts       청사진 ↔ QR 문자열 (deflate + base45)
    │   │   └── image.web.ts   QR PNG 생성 · 저장 · 사진에서 읽기 (웹)
    │   └── screens/
    │       ├── PlanList.tsx   청사진 목록
    │       ├── Overview.tsx   81칸 전체 보기
    │       ├── BlockEditor.tsx 3×3 블록 편집
    │       ├── Backup.tsx     JSON 백업 / 복원
    │       ├── QrShare.tsx    QR로 저장
    │       └── QrScan.tsx     카메라로 QR 읽기 (iOS · Android 앱)
    ├── scripts/               배포 · PWA · 로컬 Git 설정 스크립트
    ├── app.json · eas.json    Expo / EAS 설정
    └── vercel.json            Vercel 웹 배포 설정
```

---

## 🗺 로드맵

- [ ] 실행 과제별 기한 & 리마인더 알림
- [ ] 9×9 만다라트를 이미지로 저장 / 공유
- [ ] 다크 모드
- [ ] 템플릿 (개발자 · 디자이너 · 기획자 커리어 예시)
- [ ] 주간 회고 기록

---

<div align="center">

**꿈을 81칸으로 나누면, 오늘 할 일이 보입니다.**

Made by [@Umkimisstrong](https://github.com/Umkimisstrong)

</div>
