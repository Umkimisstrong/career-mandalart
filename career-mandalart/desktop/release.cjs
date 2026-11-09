// 데스크톱 앱 새 버전 올리기 — npm run release (package.json 의 version 을 먼저 올린다)
// GitHub 릴리스 desktop-v<버전> 에 GUDO-Setup.exe · blockmap · latest.yml 을 올리면
// ① 고정 링크 releases/latest/download/GUDO-Setup.exe 가 새 설치 파일이 되고 ② 설치된 앱이 스스로 받아 간다.
const { execFileSync } = require('child_process');
const { version } = require('./package.json');

const tag = `desktop-v${version}`;
const files = ['out/GUDO-Setup.exe', 'out/GUDO-Setup.exe.blockmap', 'out/latest.yml'];
// 이번 버전에 바뀐 것 — 환경 변수 NOTES 에 줄마다 하나 (예: NOTES="버전 화면 추가" npm run release)
const changes = (process.env.NOTES ?? '').split('
').filter(Boolean).map(l => `- ${l}`);
const notes = [
  `구도 GUDO Windows 데스크톱 앱 ${version}`,
  '',
  ...changes,
  '- 설치 · 업데이트: https://github.com/Umkimisstrong/career-mandalart/releases/latest/download/GUDO-Setup.exe',
  '- 1.2.0 이상이 설치돼 있으면 앱이 스스로 받아서 다시 시작할 때 적용합니다 (트레이 → 업데이트 확인)',
  '- 서명 없는 앱이라 처음 실행 시 「Windows의 PC 보호」 → 추가 정보 → 실행',
].join('\n');
execFileSync('gh', ['release', 'create', tag, ...files, '-R', 'Umkimisstrong/career-mandalart', '--target', 'main', '--title', `구도 GUDO Windows ${version}`, '--notes', notes], { stdio: 'inherit' });
