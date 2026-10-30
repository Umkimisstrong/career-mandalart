#!/usr/bin/env node
// 로컬 Git 서버(bare repo)의 post-receive 훅이 호출하는 배포 스크립트.
//
//   node scripts/deploy.mjs <ref> [commitMessage]
//
//   refs/heads/develop  → 검사 후 OTA 업데이트 (preview 채널)
//   refs/heads/main     → 검사 후 OTA 업데이트 (production 채널)
//   refs/tags/v*        → 검사 후 iOS+Android 스토어 빌드 (EAS 클라우드)
//
// --dry 를 붙이면 EAS 명령은 출력만 하고 실행하지 않는다.
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const [ref, message = 'deploy'] = args.filter(a => a !== '--dry');

const run = (cmd, { eas = false } = {}) => {
  console.log(`$ ${cmd}`);
  if (eas && dry) return;
  execSync(cmd, { stdio: 'inherit' });
};

const CHANNELS = { 'refs/heads/main': 'production', 'refs/heads/develop': 'preview' };
const channel = CHANNELS[ref];
const isRelease = /^refs\/tags\/v\d/.test(ref ?? '');

if (!channel && !isRelease) {
  console.log(`[deploy] ${ref}: 배포 대상 아님, 건너뜀`);
  process.exit(0);
}

console.log(`[deploy] ${ref} 배포 시작 ${new Date().toISOString()}`);
run('npm ci --no-audit --no-fund');
run('npx tsc --noEmit');
run('npx expo export --platform web --output-dir dist-check'); // 번들이 깨지지 않는지 확인

const msg = JSON.stringify(message);
if (channel) {
  run(`npx eas-cli@latest update --channel ${channel} --message ${msg} --non-interactive`, { eas: true });
} else {
  run('npx eas-cli@latest build --platform all --profile production --non-interactive --no-wait', { eas: true });
}
console.log('[deploy] 완료');
