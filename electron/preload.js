const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the React renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onUpdateMessage: (callback) => {
    ipcRenderer.on('update-message', (event, text) => callback(text));
  },
  checkForUpdates: () => ipcRenderer.send('check-for-updates')
});

