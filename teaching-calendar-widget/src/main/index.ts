import { app, BrowserWindow, Tray, Menu, screen, ipcMain, nativeImage, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

function getPreloadPath(): string {
  const outPreload = path.join(__dirname, '../preload/preload.js')
  if (fs.existsSync(outPreload)) return outPreload
  const srcPreload = path.join(process.cwd(), 'src', 'preload', 'preload.js')
  if (fs.existsSync(srcPreload)) {
    const outDir = path.dirname(outPreload)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
    fs.copyFileSync(srcPreload, outPreload)
    return outPreload
  }
  return outPreload
}

function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    minWidth: 400,
    minHeight: 600,
    maxWidth: 600,
    maxHeight: 900,
    x: width - 420,
    y: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: getPreloadPath(),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  const isDev = process.env.NODE_ENV_ELECTRON_VITE === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Handle file drops at the window level (works even with transparent windows)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault()
      handleFileDrop(url.replace('file:///', '').replace(/\//g, '\\'))
    }
  })

  // Handle dragged files
  mainWindow.on('focus', () => {
    // Reset any pending drag state
  })
}

function handleFileDrop(filePath: string): void {
  if (!mainWindow || !fs.existsSync(filePath)) return

  const ext = path.extname(filePath).toLowerCase()
  const allowed = ['.xls', '.xlsx', '.csv', '.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx']
  if (!allowed.includes(ext)) return

  const content = fs.readFileSync(filePath)
  const buffer = Buffer.from(content).buffer

  mainWindow.webContents.send('file:dropped', {
    fileName: path.basename(filePath),
    buffer: Array.from(new Uint8Array(buffer))
  })
}

// IPC: open file dialog as fallback
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '教学日历', extensions: ['xls', 'xlsx', 'csv', 'pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'] }
    ]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// IPC: read file and send to renderer
ipcMain.handle('file:read', async (_event, filePath: string) => {
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath)
  return {
    fileName: path.basename(filePath),
    buffer: Array.from(new Uint8Array(content))
  }
})

function createTray(): void {
  const iconPath = path.join(__dirname, '../../resources/icon.png')

  if (!fs.existsSync(iconPath)) {
    // Generate a simple tray icon programmatically
    const size = 16
    const canvas = nativeImage.createEmpty()
    const buf = Buffer.alloc(size * size * 4)
    for (let i = 0; i < size * size; i++) {
      buf[i * 4] = 96      // R
      buf[i * 4 + 1] = 165 // G
      buf[i * 4 + 2] = 250 // B
      buf[i * 4 + 3] = 255 // A
    }
    const img = nativeImage.createFromBuffer(buf, { width: size, height: size })
    tray = new Tray(img)
  } else {
    tray = new Tray(iconPath)
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示/隐藏', click: () => toggleWindow() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  tray.setToolTip('教学日历挂件')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    toggleWindow()
  })
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

// IPC handlers
ipcMain.handle('widget:close', () => {
  mainWindow?.hide()
})

ipcMain.handle('widget:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('widget:get-position', () => {
  if (!mainWindow) return { x: 0, y: 0 }
  const [x, y] = mainWindow.getPosition()
  return { x, y }
})

ipcMain.handle('widget:set-position', (_event, pos: { x: number; y: number }) => {
  mainWindow?.setPosition(pos.x, pos.y)
})

ipcMain.handle('widget:get-size', () => {
  if (!mainWindow) return { width: 480, height: 520 }
  const [width, height] = mainWindow.getSize()
  return { width, height }
})

ipcMain.handle('widget:set-size', (_event, size: { width: number; height: number }) => {
  mainWindow?.setSize(size.width, size.height)
})

app.whenReady().then(() => {
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
