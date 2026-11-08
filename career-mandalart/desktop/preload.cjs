// 웹 앱에 window.gudoDesktop 을 넣어 준다 — src/desktop.ts 의 DesktopBridge 와 짝.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gudoDesktop', {
  setWidgets: ids => ipcRenderer.send('gudo:widgets', ids),
  resize: (w, h) => ipcRenderer.send('gudo:resize', w, h),
  open: (id, block) => ipcRenderer.send('gudo:open', id, block),
  onOpen: cb => ipcRenderer.on('gudo:open', (_e, id, block) => cb(id, block)),
  onUnpin: cb => ipcRenderer.on('gudo:unpin', (_e, id) => cb(id)),
});
