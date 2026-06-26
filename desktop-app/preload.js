const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isDesktopApp: true,
  platform: process.platform,
});

contextBridge.exposeInMainWorld('zloteMiody', {
  platform: process.platform,
  isDesktopApp: true,
  version: '1.0.0',
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  }
});