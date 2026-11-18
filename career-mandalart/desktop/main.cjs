// 구도 GUDO Windows 데스크톱 앱 — 웹 앱(Cloudflare Pages)을 큰 창으로 열고, 고른 목표를 바탕화면 작은 창(항상 위)으로 띄운다.
// 데이터는 이 앱 안의 저장소(localStorage)에 따로 저장된다. 다른 기기와는 「백업 코드」 · QR 로 옮긴다.
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { checkSilent, installNow, onChange, startUpdater, updateInfo } = require('./updater.cjs');

const arg = process.argv.find(a => a.startsWith('--url='));
const HOME = 'https://gudo.pages.dev';
const BASE = (arg ? arg.slice(6) : process.env.GUDO_URL) || HOME;
// 1.2.x 까지 쓰던 주소. 저장 공간은 주소마다 따로라, 처음 한 번 그쪽 데이터를 새 주소로 옮긴다 (moveOldStore)
const OLD = 'https://career-mandalart.vercel.app';
const STORE_KEY = 'career-mandalart/store/v1';
const ICON = path.join(__dirname, 'icon.png');
// 시험용: --profile=<폴더> 로 실제 앱과 다른 저장소 · 설정을 쓴다 (npm run dev)
const profile = process.argv.find(a => a.startsWith('--profile='));
if (profile) app.setPath('userData', path.resolve(profile.slice(10)));
const CONFIG = () => path.join(app.getPath('userData'), 'widgets.json');
const ZOOMS = { 작게: 0.8, 보통: 1, 크게: 1.25 };

// 띄운 작은 창 목록 · 위치 · 크기 · 항상 위 — 다음 실행 때 그대로
let config = { ids: [], bounds: {}, zoom: {}, onTop: {} };
let main = null;
let tray = null;
let quitting = false;
const widgets = new Map(); // 목표 id → BrowserWindow

function loadConfig() {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG(), 'utf8')) }; } catch { /* 처음 실행 */ }
}
function saveConfig() {
  try { fs.writeFileSync(CONFIG(), JSON.stringify(config, null, 2)); } catch { /* 무시 */ }
}

// 옛 주소 저장 공간 → 새 주소 저장 공간 (같은 PC 안에서만). 앱 화면을 띄우기 전에, 숨은 창으로
// 두 주소의 작은 파일(manifest.json)을 열어 그 주소의 localStorage 를 읽고 쓴다. 앱 화면을 열면 앱이 빈 데이터를
// 먼저 저장해 버리므로 앱은 열지 않는다. 새 주소에 이미 데이터가 있으면 덮어쓰지 않고, 옛 데이터도 지우지 않는다.
// 끝나면 moved.json 을 남겨 다시 하지 않는다 — 인터넷이 안 돼 실패하면 다음 실행 때 다시.
async function moveOldStore() {
  const flag = path.join(app.getPath('userData'), 'moved.json');
  if (BASE !== HOME || fs.existsSync(flag)) return;
  const win = new BrowserWindow({ show: false });
  const read = `localStorage.getItem(${JSON.stringify(STORE_KEY)})`;
  try {
    await win.loadURL(`${OLD}/manifest.json`);
    const old = await win.webContents.executeJavaScript(read);
    let moved = false;
    if (old) {
      await win.loadURL(`${HOME}/manifest.json`);
      if (!(await win.webContents.executeJavaScript(read))) {
        await win.webContents.executeJavaScript(`localStorage.setItem(${JSON.stringify(STORE_KEY)}, ${JSON.stringify(old)})`);
        moved = true;
      }
    }
    fs.writeFileSync(flag, JSON.stringify({ at: new Date().toISOString(), from: OLD, moved }));
  } catch { /* 다음 실행 때 다시 */ }
  win.destroy();
}

function openMain(show = true) {
  if (main) { if (show) { main.show(); main.focus(); } return main; }
  main = new BrowserWindow({
    width: 440, height: 860, minWidth: 360, show, icon: ICON, title: '구도 GUDO',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') },
  });
  main.loadURL(BASE);
  // 소개 화면의 출처 링크 등은 기본 브라우저로
  main.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  // 닫기 = 숨기기 (작은 창은 계속 떠 있다). 완전히 끄려면 트레이 → 종료
  main.on('close', e => { if (!quitting) { e.preventDefault(); main.hide(); } });
  return main;
}

function defaultBounds(i) {
  const { workArea } = screen.getPrimaryDisplay();
  return { x: workArea.x + workArea.width - 270, y: workArea.y + 20 + i * 280 };
}

function openWidget(id, i) {
  if (widgets.has(id)) return;
  const b = config.bounds[id] || defaultBounds(i);
  const win = new BrowserWindow({
    x: b.x, y: b.y, width: 240, height: 270, frame: false, transparent: true, resizable: false,
    skipTaskbar: true, alwaysOnTop: config.onTop[id] !== false, show: false, icon: ICON,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), zoomFactor: config.zoom[id] || 1 },
  });
  win.loadURL(`${BASE}/?widget=${encodeURIComponent(id)}`);
  // 창 전체로 끌어 옮기고, 칸(버튼)만 누를 수 있게
  win.webContents.on('did-finish-load', () => {
    win.webContents.insertCSS(`
      html, body, #root { background: transparent !important; -webkit-app-region: drag; overflow: hidden; }
      [role="button"], [tabindex] { -webkit-app-region: no-drag; cursor: pointer; }
      [data-nodrag] { -webkit-app-region: no-drag; }
      ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-button { display: none; }
      ::-webkit-scrollbar-thumb { background: rgba(127, 127, 127, 0.35); border-radius: 3px; }
    `);
  });
  win.once('ready-to-show', () => win.showInactive());
  win.on('moved', () => { const [x, y] = win.getPosition(); config.bounds[id] = { x, y }; saveConfig(); });
  win.on('closed', () => widgets.delete(id));
  win.webContents.on('context-menu', () => widgetMenu(id, win).popup({ window: win }));
  widgets.set(id, win);
}

function widgetMenu(id, win) {
  const zoom = config.zoom[id] || 1;
  return Menu.buildFromTemplate([
    { label: '구도 열기', click: () => { openMain(); main.webContents.send('gudo:open', id, null); } },
    { type: 'separator' },
    { label: '항상 위에', type: 'checkbox', checked: win.isAlwaysOnTop(), click: m => {
      win.setAlwaysOnTop(m.checked); config.onTop[id] = m.checked; saveConfig();
    } },
    { label: '크기', submenu: Object.entries(ZOOMS).map(([label, z]) => ({
      label, type: 'radio', checked: zoom === z, click: () => {
        config.zoom[id] = z; saveConfig();
        win.webContents.setZoomFactor(z);
        win.webContents.reload(); // 내용 크기를 다시 알려 받아 창 크기를 맞춘다
      },
    })) },
    { type: 'separator' },
    { label: '바탕화면에서 내리기', click: () => {
      // 큰 창의 목록 체크도 같이 풀리도록 큰 창에 알린다
      openMain(false);
      main.webContents.send('gudo:unpin', id);
      setWidgets(config.ids.filter(w => w !== id));
    } },
  ]);
}

function setWidgets(ids) {
  config.ids = ids;
  saveConfig();
  for (const [id, win] of widgets) if (!ids.includes(id)) win.close();
  ids.forEach((id, i) => openWidget(id, i));
}

function buildTray() {
  tray = new Tray(nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 }));
  tray.setToolTip('구도 GUDO');
  const login = () => app.getLoginItemSettings().openAtLogin;
  const menu = () => Menu.buildFromTemplate([
    { label: '구도 열기', click: () => openMain() },
    { label: '작은 창 모두 앞으로', click: () => widgets.forEach(w => w.showInactive()) },
    { type: 'separator' },
    { label: 'Windows 시작할 때 실행', type: 'checkbox', checked: login(), click: m => {
      app.setLoginItemSettings({ openAtLogin: m.checked, args: ['--hidden'] });
    } },
    { type: 'separator' },
    { label: `버전 · 업데이트 (v${app.getVersion()})`, click: () => { openMain(); main.webContents.send('gudo:page', 'version'); } },
    { type: 'separator' },
    { label: '종료', click: () => { quitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(menu());
  tray.on('right-click', () => tray.setContextMenu(menu()));
  tray.on('click', () => openMain());
}

// 버전 화면 — 상태 묻기 · 확인 · 바로 적용, 상태가 바뀌면 큰 창에 알린다
ipcMain.handle('gudo:info', () => updateInfo());
ipcMain.on('gudo:check', () => checkSilent());
ipcMain.on('gudo:install', () => installNow());
onChange(i => main && main.webContents.send('gudo:update', i));

ipcMain.on('gudo:widgets', (_e, ids) => { if (Array.isArray(ids)) setWidgets(ids.filter(x => typeof x === 'string')); });
ipcMain.on('gudo:resize', (e, w, h) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win === main) return;
  const z = win.webContents.getZoomFactor();
  win.setContentSize(Math.ceil(w * z), Math.ceil(h * z));
});
ipcMain.on('gudo:open', (_e, id, block) => {
  openMain();
  main.webContents.send('gudo:open', id, block);
});

// 두 번 실행하면 이미 떠 있는 큰 창을 보여 준다
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => openMain());
  app.whenReady().then(async () => {
    app.setAppUserModelId('app.gudo.desktop');
    // 인터넷이 느려도 10초 넘게 기다리지 않는다
    await Promise.race([moveOldStore(), new Promise(r => setTimeout(r, 10000))]);
    loadConfig();
    buildTray();
    // 작은 창이 있고 「시작할 때 실행」으로 켜졌으면 큰 창은 숨긴 채로 (트레이에서 열기)
    const hidden = process.argv.includes('--hidden') && config.ids.length > 0;
    openMain(!hidden);
    config.ids.forEach((id, i) => openWidget(id, i));
    startUpdater(() => { quitting = true; });
  });
  app.on('before-quit', () => { quitting = true; });
  app.on('window-all-closed', () => { /* 트레이에 남는다 */ });
}
