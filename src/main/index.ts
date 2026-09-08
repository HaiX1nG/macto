import { app, BrowserWindow, Tray, Menu, nativeImage, screen } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { IPCManager } from './ipc/index'
import { appUpdater } from './updater'
import { notificationManager } from './notifications'
import { appMenu } from './menu'
import { logger } from './logger'

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

/**
 * Get the appropriate tray icon path based on platform
 * - macOS: Uses template icons for proper dark/light mode support
 * - Windows: Uses .ico format
 * - Linux: Uses standard PNG
 */
const getTrayIconPath = (): string => {
  // In development, assets are in src/main/assets
  // In production, assets are copied to out/main/assets
  const devAssetsDir = path.resolve(__dirname, '../../src/main/assets/icons')
  const prodAssetsDir = path.resolve(__dirname, 'assets/icons')

  // Determine which directory to use
  let iconsDir: string
  if (isDebug && fs.existsSync(devAssetsDir)) {
    iconsDir = devAssetsDir
  } else {
    iconsDir = prodAssetsDir
  }

  if (process.platform === 'darwin') {
    // macOS: Use template icon for automatic dark/light mode adaptation
    // Template icons should be black shapes with transparent background
    // macOS automatically adjusts the color based on menu bar appearance
    const isRetina = screen.getPrimaryDisplay().scaleFactor > 1
    const templateIcon = isRetina ? 'trayTemplate@2x.png' : 'trayTemplate.png'
    const templatePath = path.join(iconsDir, templateIcon)

    // Check if template icon exists, fall back to regular icon
    if (fs.existsSync(templatePath)) {
      return templatePath
    }

    // Fallback to regular icon
    const regularIcon = isRetina ? 'tray@2x.png' : 'tray.png'
    return path.join(iconsDir, regularIcon)
  }

  if (process.platform === 'win32') {
    // Windows: Prefer .ico format for best compatibility
    const icoPath = path.join(iconsDir, 'tray.ico')
    if (fs.existsSync(icoPath)) {
      return icoPath
    }
    // Fallback to PNG
    return path.join(iconsDir, 'tray.png')
  }

  // Linux and others: Use standard PNG
  return path.join(iconsDir, 'tray.png')
}

/**
 * Create tray icon with proper sizing for the platform
 */
const createTrayIcon = (): ReturnType<typeof nativeImage.createFromPath> => {
  const iconPath = getTrayIconPath()

  // Check if file exists
  if (!fs.existsSync(iconPath)) {
    console.warn('Tray icon not found at:', iconPath)
    return nativeImage.createEmpty()
  }

  const icon = nativeImage.createFromPath(iconPath)

  if (icon.isEmpty()) {
    console.warn('Failed to load tray icon from:', iconPath)
    return nativeImage.createEmpty()
  }

  // On macOS, mark template icons for automatic appearance adaptation
  if (process.platform === 'darwin' && iconPath.includes('Template')) {
    return icon.resize({ width: 16, height: 16 })
  }

  // Resize icon for tray (typically 16x16 or 22x22 depending on platform)
  if (process.platform === 'darwin') {
    // macOS tray icons should be 22x22 for standard displays
    return icon.resize({ width: 22, height: 22 })
  } else if (process.platform === 'win32') {
    // Windows tray icons are typically 16x16
    return icon.resize({ width: 16, height: 16 })
  }

  // Linux: Use 22x22
  return icon.resize({ width: 22, height: 22 })
}

const createTray = () => {
  const icon = createTrayIcon()

  if (icon.isEmpty()) {
    console.warn('Creating tray with empty icon')
  }

  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Macto',
      click: () => {
        if (win) {
          if (win.isMinimized()) win.restore()
          win.show()
          win.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    },
  ])

  tray.setContextMenu(contextMenu)
  tray.setIgnoreDoubleClickEvents(true)

  // On Windows and Linux, show window on single click
  // On macOS, this is handled by the context menu
  if (process.platform !== 'darwin') {
    tray.on('click', () => {
      if (win) {
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
      }
    })
  }

  // Handle tray icon balloon/notification on Windows
  if (process.platform === 'win32') {
    tray.on('double-click', () => {
      if (win) {
        if (win.isMinimized()) win.restore()
        win.show()
        win.focus()
      }
    })
  }

  return tray
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(async () => {
  // Initialize logger
  logger.info('App starting', { version: app.getVersion(), platform: process.platform })

  // Set native menu
  appMenu.create()

  if (isDebug) {
    installExtensions().catch(console.error)
  }

  win = createWindow()
  if (!win) {
    logger.error('Failed to create main window')
    app.quit()
    process.exit(1)
  }

  logger.info('Main window created')

  // Initialize IPC Manager for handling IPC calls
  new IPCManager(win)

  // Initialize auto-updater with window reference
  appUpdater.setWindow(win)

  // Initialize notification manager with window reference
  notificationManager.setWindow(win)
  notificationManager.setDebug(isDebug)

  createTray()

  logger.info('App ready')

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
