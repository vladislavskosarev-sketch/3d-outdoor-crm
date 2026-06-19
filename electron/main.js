const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    frame: true, // Native window frame (highly stable, supports Windows snapping)
    autoHideMenuBar: true, // Hides the classic file/edit menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Check if we are running in dev mode
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Auto-updater events
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('checking-for-update', () => {
      if (mainWindow) mainWindow.webContents.send('update-message', { status: 'checking', text: 'Проверка обновлений...' });
    });
    autoUpdater.on('update-available', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-message', { status: 'available', text: 'Доступна новая версия. Скачивание...' });
    });
    autoUpdater.on('update-not-available', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-message', { status: 'not-available', text: 'У вас последняя версия.' });
    });
    autoUpdater.on('error', (err) => {
      if (mainWindow) mainWindow.webContents.send('update-message', { status: 'error', text: 'Ошибка обновления: ' + err.toString() });
    });
    autoUpdater.on('download-progress', (progressObj) => {
      if (mainWindow) {
        mainWindow.webContents.send('update-message', { 
          status: 'downloading', 
          percent: Math.round(progressObj.percent),
          text: `Загрузка обновления: ${Math.round(progressObj.percent)}%` 
        });
      }
    });
    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow) mainWindow.webContents.send('update-message', { status: 'downloaded', text: 'Обновление загружено. Перезапуск программы...' });
      setTimeout(() => {
        autoUpdater.quitAndInstall();
      }, 4000);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
