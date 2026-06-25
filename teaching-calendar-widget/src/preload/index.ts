import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('widgetAPI', {
  close: () => ipcRenderer.invoke('widget:close'),
  minimize: () => ipcRenderer.invoke('widget:minimize'),
  getPosition: () => ipcRenderer.invoke('widget:get-position'),
  setPosition: (pos: { x: number; y: number }) => ipcRenderer.invoke('widget:set-position', pos),
  getSize: () => ipcRenderer.invoke('widget:get-size'),
  setSize: (size: { width: number; height: number }) => ipcRenderer.invoke('widget:set-size', size)
})
