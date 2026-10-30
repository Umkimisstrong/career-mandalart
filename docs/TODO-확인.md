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
| 호스팅 · 도메인 | ✅ **Vercel 무료 유지** 권장. 비교와 이유는 [hosting.md](hosting.md) |
| Reddit · 데이터 수집 | 📋 필요한 작업과 대체 창구 정리 → [data-collection.md](data-collection.md). 진행하려면 아래 결정 필요 |
| Vercel 플러그인 / MCP | ✅ 지금은 불필요 — 설치하지 않음 (아래 설명) |
| Node.js | ✅ **26.13 LTS 로 업그레이드 완료**. Expo 58 · Vercel CLI · gh 정상 동작 확인 |
| 웹 클립 프로필 | 🗑️ 제외 (관리 대상 아님) |

### 남은 결정
- [ ] **앱 정체성** — 이름("커리어 만다라트" 유지 여부), 로고/아이콘, 기본 테마를 무엇으로 할지
- [ ] **데이터 수집 진행 여부** — 추천 순서: ① World Values Survey + KOSIS (공식 통계, 바로 가능) ② Reddit API (Reddit 앱 등록을 본인이 해야 함) ③ Hacker News
- [ ] **자체 도메인** — 이름이 확정되면 구입할지 (연 1~2만 원)

### Vercel 플러그인 / MCP 란?
- **플러그인(스킬)**: Claude 에게 "Vercel 사용 설명서"를 미리 읽혀두는 것. Vercel 작업 시 더 정확한 명령을 쓰게 됨
- **MCP 서버 연결**: Claude 가 CLI 를 거치지 않고 Vercel 계정에 직접 접속해 배포 상태 · 로그 · 설정을 조회 · 변경하는 통로
- **지금 필요 없는 이유**: 이미 `vercel.cmd` CLI 로 배포 확인 · 로그 조회를 하고 있고, 배포는 GitHub push 로 자동. Vercel 설정을 자주 바꾸게 되면 그때 연결해도 늦지 않음
