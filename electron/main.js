const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const getNotesPath = () => path.join(app.getPath('userData'), 'notes.json');

function readNotes() {
  const p = getNotesPath();
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return {};
  }
}

function writeNotes(data) {
  fs.writeFileSync(getNotesPath(), JSON.stringify(data, null, 2), 'utf-8');
}

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 860,
    height: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
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

ipcMain.handle('notes:load', () => readNotes());
ipcMain.handle('notes:save', (_e, data) => {
  writeNotes(data);
  return true;
});
