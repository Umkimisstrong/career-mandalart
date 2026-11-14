# 무료 호스팅 · 도메인 선택 가이드

결론부터: **Vercel 무료(Hobby) 플랜만 쓰고, 자체 도메인은 두지 않습니다** (사용자 결정 2026-11-01). 이미 비용 0원으로 배포 중이고, 서버가 필요 없는 앱(DB 없음 · 정적 웹)이라 VM을 따로 운영할 이유가 없습니다.

| 무엇 | 어디서 | 비용 |
|---|---|---|
| 웹 앱 (휴대폰 홈 화면 앱 · Windows 앱 큰 창도 이 주소) | Vercel — `career-mandalart.vercel.app`, GitHub `main` push 자동 배포 | 0원 |
| Windows 설치 파일 · 자동 업데이트 | GitHub 릴리스 `latest` (`desktop-v<버전>`) | 0원 |
| 데이터 | 각자 기기 (서버 없음) | 0원 |

⚠️ Vercel Hobby 는 **개인 · 비상업용**입니다. 판매 · 회사 업무용으로 열기 전에 호스팅을 다시 정합니다 (아래 Cloudflare Pages 가 무료 · 상업 이용 가능한 대안).

## 1. 선택지 비교

| 서비스 | 비용 | 무료 주소 | 맞는 용도 | 이 앱에 맞나 |
|---|---|---|---|---|
| **Vercel (현재)** | 0원 (Hobby, 개인 · 비상업) | `career-mandalart.vercel.app` | 정적 웹 · Next.js · 서버리스 함수 | ✅ 이미 사용 중, GitHub push 자동 배포 |
| Cloudflare Pages | 0원, 트래픽 무제한 | `○○.pages.dev` | 정적 웹 | ✅ 대안. 상업적 이용도 무료 |
| Netlify | 0원 (월 대역폭 한도) | `○○.netlify.app` | 정적 웹 | ✅ 대안 |
| GitHub Pages | 0원 | `umkimisstrong.github.io/○○` | 정적 웹 | ⚠️ 가능하지만 빌드 설정을 직접 해야 함 |
| **Oracle Cloud Always Free** | 0원 (카드 인증 필요) | 없음 (IP 주소) | 리눅스 VM — 백엔드 서버 · DB · 봇 | ❌ 지금은 과함 |

### Oracle Cloud는 언제 쓰나?
친구분 방식(Oracle Cloud + 리눅스)은 **직접 서버를 운영**하는 방식입니다. ARM VM(최대 4코어 · 24GB)을 평생 무료로 주기 때문에, 나중에 아래 같은 것이 필요해지면 좋은 선택입니다.
- 사용자 계정 · 서버 DB · 여러 기기 동기화
- Reddit 등 데이터를 정기적으로 수집하는 스크립트(크론 작업)
- AI 추천 API 서버

대신 리눅스 보안 업데이트 · 방화벽 · HTTPS 인증서 · 장애 대응을 **직접** 해야 하고, 무료 계정은 사용량이 적으면 VM이 회수될 수 있습니다. 지금처럼 서버가 없는 앱에는 관리 부담만 늘어납니다.

## 2. 도메인

| 방법 | 비용 | 예시 |
|---|---|---|
| 지금 주소 그대로 | 0원 | `career-mandalart.vercel.app` |
| 유료 도메인 구입 → Vercel 연결 | 연 1~2만 원 (.com · .kr · .app 등) | `mandalart.app` |
| 무료 도메인 | 0원 | `eu.org` 하위 도메인 (심사 수 주 소요) 등 — 신뢰도 · 안정성이 낮아 비추천 |

**결정:** 자체 도메인 없이 지금 주소를 씁니다. 저장소 · Vercel 주소를 「구도」 이름으로 바꾸는 것도 보류 — 바꾸면 이미 보낸 링크 · 홈 화면 앱 · 각 기기 저장 데이터(주소마다 따로 저장)가 끊깁니다.

## 3. 정리
- 지금: **Vercel 유지 (0원)** + Windows 앱은 GitHub 릴리스 — 할 일 없음
- 상업적 이용 전: Cloudflare Pages 무료 이전 검토 (주소가 바뀌면 사용자에게 백업 코드로 옮기도록 안내 필요)
- 서버 기능(메일 · 알림톡 일정 알림, 실시간 팀 목표 등)이 필요해지면: Oracle Cloud Always Free VM 또는 Supabase 검토 — [calendar.md](calendar.md) · [team.md](team.md)
