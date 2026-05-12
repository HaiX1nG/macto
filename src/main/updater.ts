import pkg from 'electron-updater'
import type { UpdateInfo } from 'electron-updater'
import { Notification, ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'

const { autoUpdater } = pkg

export interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  total: number
  transferred: number
}

export class AppUpdater {
  private window: BrowserWindow | null = null
  private updateAvailable = false
  private updateDownloaded = false
  private latestVersion: string | null = null

  constructor() {
    this.setupAutoUpdater()
    this.setupIPC()
  }

  setWindow(window: BrowserWindow) {
    this.window = window
  }

  private setupAutoUpdater() {
    // Don't auto download, we'll prompt the user
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    // Check for updates on startup (in production)
    if (process.env.NODE_ENV === 'production') {
      // Delay check to allow app to fully start
      setTimeout(() => {
        this.checkForUpdates(false)
      }, 3000)
    }

    // Event: Checking for update
    autoUpdater.on('checking-for-update', () => {
      this.sendToRenderer('update:checking', null)
    })

    // Event: Update available
    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.updateAvailable = true
      this.latestVersion = info.version
      this.sendToRenderer('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      })

      // Show notification
      this.showNotification(
        'Update Available',
        `Version ${info.version} is available. Click to download.`
      )
    })

    // Event: Update not available
    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.sendToRenderer('update:not-available', {
        version: info.version,
      })
    })

    // Event: Download progress
    autoUpdater.on('download-progress', (progress: UpdateProgress) => {
      this.sendToRenderer('update:progress', {
        bytesPerSecond: progress.bytesPerSecond,
        percent: progress.percent,
        total: progress.total,
        transferred: progress.transferred,
      })
    })

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      this.updateDownloaded = true
      this.sendToRenderer('update:downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      })

      // Show notification
      this.showNotification(
        'Update Ready',
        `Version ${info.version} has been downloaded. Restart to install.`
      )
    })

    // Event: Error
    autoUpdater.on('error', (error: Error) => {
      this.sendToRenderer('update:error', {
        message: error.message,
      })
    })
  }

  private setupIPC() {
    // Check for updates
    ipcMain.handle('update:check', async () => {
      return this.checkForUpdates(true)
    })

    // Download update
    ipcMain.handle('update:download', async () => {
      return this.downloadUpdate()
    })

    // Install update
    ipcMain.handle('update:install', async () => {
      return this.quitAndInstall()
    })

    // Get current version
    ipcMain.handle('update:get-version', async () => {
      return {
        currentVersion: autoUpdater.currentVersion.version,
        latestVersion: this.latestVersion,
        updateAvailable: this.updateAvailable,
        updateDownloaded: this.updateDownloaded,
      }
    })
  }

  async checkForUpdates(notifyUser = true): Promise<{
    available: boolean
    version?: string
    error?: string
  }> {
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result && result.updateInfo) {
        return {
          available: result.updateInfo.version !== autoUpdater.currentVersion.version,
          version: result.updateInfo.version,
        }
      }
      return { available: false }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (notifyUser) {
        this.sendToRenderer('update:error', { message })
      }
      return { available: false, error: message }
    }
  }

  async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    if (!this.updateAvailable) {
      return { success: false, error: 'No update available' }
    }

    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  quitAndInstall(): { success: boolean } {
    if (!this.updateDownloaded) {
      return { success: false }
    }

    // Use setImmediate to allow the IPC response to be sent first
    setImmediate(() => {
      autoUpdater.quitAndInstall()
    })

    return { success: true }
  }

  private sendToRenderer(channel: string, data: unknown) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data)
    }
  }

  private showNotification(title: string, body: string) {
    if (Notification.isSupported()) {
      const notification = new Notification({ title, body })
      notification.on('click', () => {
        if (this.window) {
          this.window.show()
          this.window.focus()
        }
      })
      notification.show()
    }
  }
}

// Singleton instance
export const appUpdater = new AppUpdater()
