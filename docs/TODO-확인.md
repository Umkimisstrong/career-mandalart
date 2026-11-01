# 확인이 필요한 항목

**직접 확인하거나 결정해야 할 것**을 모아둔 문서입니다. 확인한 항목은 `- [x]` 로 체크해 주세요.

_최종 갱신: 2026-10-30_

---

## 1. iPhone에서 직접 확인

- [x] 설치 안내 배너 · 카카오톡 Safari로 열기 · QR 저장/불러오기 — **확인 완료 (사용자 테스트)**
- [ ] **테마 4종** — 목록 화면 오른쪽 위 테마 버튼 → 기본 / 흑·백 / 만다라트 시그니처 / 나만의 색 섞기. 색이 마음에 드는지, 글자가 잘 보이는지
- [ ] 홈 화면 아이콘 모양 — 지금은 Expo 기본 아이콘(`assets/icon.png`). 정체성 작업 때 교체

## 2. 공유용 링크 · QR

- 공유 링크: **https://career-mandalart.vercel.app**
- 링크 QR 이미지: [`docs/share/career-mandalart-link-qr.png`](share/career-mandalart-link-qr.png) (`node scripts/share-qr.mjs` 로 재생성)
- PC에서 설치 안내 미리 보기: 주소 끝에 `?install-preview=ios` 또는 `?install-preview=inapp-kakao`

## 3. 결정 사항

| 항목 | 결정 / 상태 |
|---|---|
| 디자인 · 테마 | ✅ 사용자 선택형 테마 4종 구현 (기본 · 흑백 · 만다라트 시그니처 · 2~4색 섞기) |
| 호스팅 · 도메인 | ✅ **Vercel 무료 플랜만 사용, 자체 도메인 없음** (결정). 비교는 [hosting.md](hosting.md) |
| 데이터 수집 | ✅ 추가 절차 없는 공개 API로 [인간 · 삶 · 목표 · 목적 · 꿈] 키워드 조사 완료 → [research/keywords-2026-11.md](research/keywords-2026-11.md) |
| Vercel 플러그인 / MCP | ✅ 지금은 불필요 — 설치하지 않음 (아래 설명) |
| Node.js | ✅ **26.13 LTS 로 업그레이드 완료**. Expo 58 · Vercel CLI · gh 정상 동작 확인 |
| 웹 클립 프로필 | 🗑️ 제외 (관리 대상 아님) |

### 남은 결정
- [ ] **앱 이름** — 후보: ⭐ North Nine · 지향(志向) · Telos(기존 앱과 겹침) → [identity.md](identity.md)
- [ ] **조사 결과 반영 여부** — 연령대 추천 · 안내 문구 개선 6가지 ([보고서 5장](research/keywords-2026-11.md))
- [ ] 아이콘 · 로고 — 이름 확정 후

### Vercel 플러그인 / MCP 란?
- **플러그인(스킬)**: Claude 에게 "Vercel 사용 설명서"를 미리 읽혀두는 것. Vercel 작업 시 더 정확한 명령을 쓰게 됨
- **MCP 서버 연결**: Claude 가 CLI 를 거치지 않고 Vercel 계정에 직접 접속해 배포 상태 · 로그 · 설정을 조회 · 변경하는 통로
- **지금 필요 없는 이유**: 이미 `vercel.cmd` CLI 로 배포 확인 · 로그 조회를 하고 있고, 배포는 GitHub push 로 자동. Vercel 설정을 자주 바꾸게 되면 그때 연결해도 늦지 않음
