const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('notesAPI', {
  load: () => ipcRenderer.invoke('notes:load'),
  save: (data) => ipcRenderer.invoke('notes:save', data),
});
