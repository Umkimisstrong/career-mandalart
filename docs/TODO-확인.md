# 확인이 필요한 항목

**직접 확인하거나 결정해야 할 것**을 모아둔 문서입니다. 확인한 항목은 `- [x]` 로 체크해 주세요.

_최종 갱신: 2026-11-14_

---

## 1. 실제 휴대폰 · PC 에서 직접 확인

컴퓨터 안 브라우저 · Windows 앱으로는 증명했지만(2026-11-11 · 11-12), 실제 기기에서는 아직 못 본 것들입니다.

- [x] 설치 안내 배너 · 카카오톡 Safari로 열기 · QR 저장/불러오기 — **확인 완료 (사용자 테스트)**
- [ ] **iPhone · Android 화면** — 메인 「목록 / ＋ 만들기」, 전체 · 블록 화면, 칸 편집 창이 휴대폰 너비에서 잘 보이는지
- [ ] **휴대폰 알림** — 실행 과제에 반복 점검 · 알림 시각을 걸고(칸 편집 ⑤), 🔔 「오늘의 점검」에서 알림을 켠 뒤 그 시각에 울리는지. 캘린더 일정의 「!30분」 알림도
- [ ] **캘린더 파일(.ics)** — 오늘의 점검 「📅 캘린더에 알림 등록」 파일을 iPhone 캘린더에 넣었을 때 반복 일정 · 알림이 잘 들어가는지
- [ ] **네이티브 카메라 QR** — Expo Go 에서 「QR로 불러오기」 카메라로 읽기
- [ ] **Windows 작은 창** — 실제 마우스로 칸 누르기 · 끌어 옮기기 · 오른쪽 클릭 메뉴
- [ ] **이미지 카드** — 목표 화면 「카드」로 만든 4:5 이미지가 인스타그램 등에 올렸을 때 글자가 잘 보이는지 (퍼즐 그림 · 배경 흐리게)
- [ ] **오타니 이야기** — 소개 화면 「★ 이 앱이 시작된 이야기」. 문구 · 타임라인 사실관계 · 톤 확인

## 2. 공유용 링크 · QR

- 공유 링크: **https://career-mandalart.vercel.app**
- Windows 앱 설치 · 덮어 설치: **https://github.com/Umkimisstrong/career-mandalart/releases/latest/download/GUDO-Setup.exe**
- 링크 QR 이미지: [`docs/share/career-mandalart-link-qr.png`](share/career-mandalart-link-qr.png) (`node scripts/share-qr.mjs` 로 재생성)
- PC에서 설치 안내 미리 보기: 주소 끝에 `?install-preview=ios` 또는 `?install-preview=inapp-kakao`

## 3. 결정 사항

| 항목 | 결정 / 상태 |
|---|---|
| 앱 이름 | ✅ **구도 GUDO · Nine Ways** (2026-11-01) → [identity.md](identity.md) |
| 디자인 · 테마 | ✅ **확정 (2026-11-11)** — 둥근 파스텔 UI · 움직임 · 앱 테마 / 블록 테마 두 층 · 4계열(색상 · 우드 · 음식 · 계절) · 퍼즐 그림 |
| 호스팅 · 도메인 | ✅ **Vercel 무료 플랜만, 자체 도메인 없음** (2026-11-01) → [hosting.md](hosting.md) |
| 팀 목표 | ✅ 서버 없이 초대장 · 갱신 코드, 체크리스트 수준 (2026-11-09) → [team.md](team.md) |
| 캘린더 | ✅ 일정은 목표와 별개, 메인 머리 📅 (2026-11-12) → [calendar.md](calendar.md) |
| 데이터 수집 | ✅ 공개 API로 키워드 조사 완료 → [research/keywords-2026-11.md](research/keywords-2026-11.md) |
| Node.js | ✅ 26.13 LTS |
| Vercel 플러그인 / MCP | ✅ 지금은 불필요 — `vercel.cmd` CLI 와 GitHub push 자동 배포로 충분 |

### 남은 결정
- [ ] 사용자 10명 피드백 받기 — 누구에게, 어떤 질문으로
- [ ] 「만다라트 시그니처」 테마 이름 — 그대로 둘지, 「구도 시그니처」로 바꿀지
- [ ] GitHub 저장소 · Vercel 주소(`career-mandalart`) 이름 변경 여부 — 바꾸면 기존 링크 · 홈 화면 앱이 끊길 수 있어 보류
- [ ] **조사 결과 반영 여부** — 연령대 추천 · 안내 문구 개선 6가지 ([보고서 5장](research/keywords-2026-11.md))
- [ ] 아이콘 · 로고 — 북극성 + 3×3 격자 모티프
- [ ] 일정 알림을 메일 · 알림톡으로 넓힐지 — 서버 · 유료 발송이 필요 ([calendar.md](calendar.md))
