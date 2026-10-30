# 확인이 필요한 항목

자리를 비운 동안 진행한 작업 중 **직접 확인하거나 결정해야 할 것**을 모아둔 문서입니다.
확인한 항목은 `- [x]` 로 체크해 주세요.

_작성: 2026-10-30_

---

## 1. iPhone에서 직접 확인 (제가 실제 기기로 테스트할 수 없는 것)

- [ ] **설치 안내 배너** — iPhone Safari로 https://career-mandalart.vercel.app 을 열었을 때 화면 아래에 "홈 화면에 앱으로 추가하기" 안내가 뜨는지
  - 안내대로 공유 → 홈 화면에 추가 → 아이콘 생성까지 되는지
  - 홈 화면 아이콘으로 열면 배너가 **안 뜨는지** (이미 설치된 상태)
  - ✕ 로 닫으면 7일 동안 다시 안 뜨는지
- [ ] **카카오톡으로 링크 보내기** — 카톡 대화방에서 링크를 눌렀을 때 "Safari로 열기" 버튼이 뜨고, 눌렀을 때 Safari로 넘어가는지
  - 카카오톡 전용 주소(`kakaotalk://web/openExternal`)를 쓰므로 카톡 버전에 따라 동작이 다를 수 있음
- [ ] **QR로 저장 → 사진 앱 저장 → QR로 불러오기** 전 과정 (지난 작업분, 아직 실기기 미확인)
- [ ] 홈 화면 아이콘 모양 — 지금은 Expo 기본 아이콘(`assets/icon.png`). 디자인 작업 때 교체 필요

> 💡 PC에서 배너 모양만 미리 보기: 주소 끝에 `?install-preview=ios` 또는 `?install-preview=inapp-kakao` 를 붙여 열면 됩니다.

## 2. 공유용 링크 · QR

- 공유 링크: **https://career-mandalart.vercel.app**
- 링크 QR 이미지: [`docs/share/career-mandalart-link-qr.png`](share/career-mandalart-link-qr.png)
  - 다시 만들기: `cd career-mandalart` → `node scripts/share-qr.mjs`
- [ ] 위 QR을 휴대폰 카메라로 찍어 사이트가 열리는지 확인

## 3. 결정이 필요한 것 (보류 중)

- [ ] **앱 정체성 · 디자인 개편** — 이름("커리어 만다라트" 유지 여부), 대표 색, 로고/아이콘, 전체 톤. 결정되면 아이콘 · 배너 · README 를 함께 교체
- [ ] **도메인** — 지금은 `career-mandalart.vercel.app`. 자체 도메인을 쓸지 (Vercel 에서 연결, 비용 발생)
- [ ] **Reddit 정량 수집** — Reddit 개발자 앱 등록(본인 계정 필요) 후 연령대별 목표 글 키워드 분석을 할지
- [ ] **Vercel 플러그인 / MCP 연결** — Vercel 가이드의 나머지 단계 (Claude 설정에 영구 반영되는 변경이라 보류)
- [ ] **Node.js 22 업그레이드** — 이 PC 에서 `npx expo start` (Expo Go) 로 개발하려면 필요. 현재 20.10
- [ ] 웹 클립 프로필(`.mobileconfig`) 방식 — 경고 화면 문제로 **보류**. 필요하면 가족 · 지인용으로만 별도 제작

## 4. 이번에 자동으로 처리한 것 (확인만)

- 설치 안내 배너 추가 후 GitHub `main` 에 push → Vercel 자동 배포
- FEATURES.md · README 갱신
