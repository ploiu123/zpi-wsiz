const { contextBridge } = require('electron');

// Expose minimal API to renderer
contextBridge.exposeInMainWorld('zloteMiody', {
  platform: process.platform,
  isDesktopApp: true,
  version: '1.0.0',
});
