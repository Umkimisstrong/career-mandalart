// 데스크톱 앱 자동 업데이트 — GitHub Releases 의 최신 릴리스(latest.yml · GUDO-Setup.exe)를 확인해 받아 둔다.
// 화면(웹 앱)은 열 때마다 Vercel 에서 받으니 따로 업데이트가 필요 없고, 여기서는 앱 껍데기(작은 창 · 트레이)만 바뀐다.
// 받은 뒤 「지금 다시 시작」을 고르면 바로, 아니면 다음에 끌 때 설치된다.
const { app, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const HOURS = 6;
let updater = null;
let state = '최신 버전 확인 전';
let ready = null; // 받아 둔 새 버전 (다시 시작하면 적용)
let checkedAt = null;
const listeners = [];
// 버전 화면에 보여 줄 상태
const info = () => ({ version: app.getVersion(), state, ready, checkedAt, packaged: app.isPackaged });
const emit = () => listeners.forEach(cb => cb(info()));
function set(next) { state = next; emit(); }

function log(msg) {
  try { fs.appendFileSync(path.join(app.getPath('userData'), 'update.log'), `${new Date().toISOString()} ${msg}\n`); } catch { /* 무시 */ }
}

// onQuit: 설치하려고 끌 때 트레이에 남지 않고 정말 끝내도록 main 에 알린다
let quit = () => {};
function startUpdater(onQuit) {
  quit = onQuit;
  if (!app.isPackaged) { state = '개발 실행 — 업데이트 확인 안 함'; return; }
  ({ autoUpdater: updater } = require('electron-updater'));
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.disableWebInstaller = true;
  updater.logger = { info: log, warn: log, error: log, debug: () => {} };

  updater.on('checking-for-update', () => { checkedAt = Date.now(); set('업데이트 확인 중…'); });
  updater.on('update-not-available', () => {
    set(`최신 버전 (${app.getVersion()})`);
  });
  updater.on('update-available', i => set(`새 버전 ${i.version} 받는 중…`));
  updater.on('download-progress', p => set(`새 버전 받는 중… ${Math.round(p.percent)}%`));
  updater.on('error', err => {
    set('업데이트 확인 실패 (인터넷 연결 확인)');
    log(`error ${err && err.message}`);
  });
  updater.on('update-downloaded', async info => {
    ready = info.version;
    set(`새 버전 ${info.version} 준비됨 — 다시 시작하면 적용`);
    const { response } = await dialog.showMessageBox({
      type: 'info', title: '구도 GUDO 업데이트',
      message: `새 버전 ${info.version} 을 받았어요.`,
      detail: '지금 다시 시작해서 적용할까요? 「나중에」를 고르면 다음에 구도를 끌 때 적용돼요.',
      buttons: ['지금 다시 시작', '나중에'], defaultId: 0, cancelId: 1,
    });
    if (response === 0) installNow();
  });

  const check = () => updater.checkForUpdates().catch(e => log(`check ${e && e.message}`));
  setTimeout(check, 10_000);
  setInterval(check, HOURS * 3600_000);
}

const updateState = () => state;

// 버전 화면에서: 조용히 확인 (창 없이 상태만 바뀜) · 받아 둔 버전 바로 적용 · 상태 구독
function checkSilent() { if (updater) updater.checkForUpdates().catch(() => {}); }
function installNow() { if (!updater || !ready) return; quit(); updater.quitAndInstall(true, true); }
function onChange(cb) { listeners.push(cb); }

module.exports = { startUpdater, checkSilent, installNow, onChange, updateState, updateInfo: info };
