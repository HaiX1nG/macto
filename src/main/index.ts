import { app, BrowserWindow, Tray, Menu, nativeImage, screen } from 'electron'
import path from 'node:path'
import { createRequire } from 'node:module'
import { IPCManager } from './ipc/index'

const require = createRequire(import.meta.url)

// 确保只有一个实例在运行
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
})

// Handle strict security
if (process.env.NODE_ENV === 'production') {
  try {
    const sourceMapSupport = require('source-map-support')
    sourceMapSupport.install()
  } catch {
    // source-map-support not available
  }
}

const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true'

// Install extensions
async function installExtensions() {
  try {
    const installer = require('electron-devtools-installer')
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']

    for (const extension of extensions) {
      try {
        const extId = installer[extension]
        await installer.installExtension(extId, { forceDownload })
      } catch (_e) {
        // Error installing extension
      }
    }
  } catch (_e) {
    // electron-devtools-installer not available
  }
}

const createWindow = () => {
  try {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.bounds

    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      x: Math.floor((width - 1200) / 2),
      y: Math.floor((height - 800) / 2),
      frame: true,
      backgroundColor: '#ffffff',
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: isDebug
          ? path.join(__dirname, '../preload/index.mjs')
          : path.join(__dirname, '../preload/index.mjs'),
      },
    })

    win.loadURL(
      isDebug
        ? 'http://localhost:5173'
        : new URL('../renderer/index.html', import.meta.url).href
    )

    if (isDebug) {
      win.webContents.openDevTools()
    }

    // 监听 ready-to-show 事件
    win.on('ready-to-show', () => {
      win.show()
      win.focus()
    })

    return win
  } catch (_e) {
    // Error creating window
    return null
  }
}

let tray: Tray | null = null
let win: BrowserWindow | null = null

const createTray = () => {
  const iconPath = path.resolve(__dirname, '..', '..', 'assets', 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    tray = new Tray(nativeImage.createEmpty())
  } else {
    tray = new Tray(icon)
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => win?.show() },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.setIgnoreDoubleClickEvents(true)
  tray.on('click', () => win?.show())

  return tray
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(async () => {
  if (isDebug) {
    installExtensions().catch(console.error)
  }

  win = createWindow()
  if (!win) {
    app.quit()
    process.exit(1)
  }

  // Initialize IPC Manager for handling IPC calls
  new IPCManager(win)

  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      win = createWindow()
    } else {
      win?.show()
      win?.focus()
    }
  })
})

app.on('quit', () => {
  if (tray) {
    tray.destroy()
  }
})
