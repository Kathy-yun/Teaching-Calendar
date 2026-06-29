const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('widgetAPI', {
  close: () => ipcRenderer.invoke('widget:close'),
  minimize: () => ipcRenderer.invoke('widget:minimize'),
  getPosition: () => ipcRenderer.invoke('widget:get-position'),
  setPosition: (pos) => ipcRenderer.invoke('widget:set-position', pos),
  getSize: () => ipcRenderer.invoke('widget:get-size'),
  setSize: (size) => ipcRenderer.invoke('widget:set-size', size),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  onFileDropped: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('file:dropped', handler)
    return () => ipcRenderer.removeListener('file:dropped', handler)
  },
  // ---- Persistence API ----
  storeSave: (key, data) => ipcRenderer.invoke('store:save', key, data),
  storeLoad: (key) => ipcRenderer.invoke('store:load', key),
  storeClear: () => ipcRenderer.invoke('store:clear')
})
