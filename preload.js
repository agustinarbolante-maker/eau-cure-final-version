const { contextBridge } = require('electron');

// Expose limited APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
});
