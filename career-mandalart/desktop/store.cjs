// Microsoft Store 패키지(MSIX/AppX) 만들기 — npm run dist:store → out/GUDO-Store.appx
// 스토어가 서명하므로 인증서가 필요 없다. 패키지 이름 · 게시자 값은 Partner Center 「제품 ID」 페이지 값으로
// package.json build.appx 의 TODO 를 바꿔 넣는다 (docs/microsoft-store.md).
// electron-builder 에 들어 있는 makeappx 가 이 PC 에서 실행되지 않아(side-by-side 오류) 설치된 Windows SDK 의 도구를 쓴다.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = 'C:/Program Files (x86)/Windows Kits/10/bin';
const kits = fs.existsSync(root)
  ? fs.readdirSync(root).filter(v => /^10\./.test(v) && fs.existsSync(path.join(root, v, 'x64', 'makeappx.exe'))).sort().reverse()
  : [];
if (!kits.length) {
  console.error('Windows SDK(makeappx.exe)를 찾지 못했어요. Visual Studio Installer 나 winget install Microsoft.WindowsSDK.10.0.26100 으로 Windows SDK 를 설치하세요.');
  process.exit(1);
}
const kit = path.join(root, kits[0], 'x64');
const pkg = require('./package.json');
if (/TODO/.test(JSON.stringify(pkg.build.appx))) console.warn('⚠ build.appx 에 아직 TODO 값이 있어요 — 시험용 패키지는 만들어지지만 스토어에 올리려면 Partner Center 값으로 바꿔야 해요.');
console.log(`Windows SDK ${kits[0]} 의 makeappx 사용`);
execSync('npx electron-builder --win appx --publish never', { stdio: 'inherit', env: { ...process.env, ELECTRON_BUILDER_WINDOWS_KITS_PATH: kit } });
