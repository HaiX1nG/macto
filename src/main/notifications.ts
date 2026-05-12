import { Notification, nativeImage, type BrowserWindow } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  roomId?: number
  senderId?: number
  onClick?: () => void
}

export interface NotificationClickData {
  roomId?: number
  senderId?: number
}

type NotificationClickCallback = (data: NotificationClickData) => void

class NotificationManager {
  private notificationClickCallbacks: Set<NotificationClickCallback> = new Set()
  private mainWindow: BrowserWindow | null = null
  private isDebugEnabled: boolean = false

  /**
   * Initialize the notification manager with the main window reference
   */
  setWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  /**
   * Set debug mode
   */
  setDebug(enabled: boolean): void {
    this.isDebugEnabled = enabled
  }

  /**
   * Register a callback for notification clicks
   */
  onNotificationClick(callback: NotificationClickCallback): () => void {
    this.notificationClickCallbacks.add(callback)
    return () => {
      this.notificationClickCallbacks.delete(callback)
    }
  }

  /**
   * Get the app icon path for notifications
   */
  private getNotificationIconPath(): string | null {
    // In development, check src/main/assets/icons
    const devAssetsDir = path.resolve(__dirname, '../../src/main/assets/icons')
    const prodAssetsDir = path.resolve(__dirname, 'assets/icons')

    // Also check for app icon in resources
    const resourcesDir = path.resolve(__dirname, '../../resources')

    // Determine which directory to use
    let iconsDir: string
    if (this.isDebugEnabled && fs.existsSync(devAssetsDir)) {
      iconsDir = devAssetsDir
    } else {
      iconsDir = prodAssetsDir
    }

    // Try different icon formats based on platform
    const iconNames: string[] = []

    if (process.platform === 'win32') {
      // Windows: Prefer .ico format
      iconNames.push('app.ico', 'tray.ico', 'app.png', 'tray.png')
    } else if (process.platform === 'darwin') {
      // macOS: Use PNG (can also use .icns)
      iconNames.push('app.png', 'icon.png', 'tray.png')
    } else {
      // Linux: Use PNG
      iconNames.push('app.png', 'icon.png', 'tray.png')
    }

    for (const iconName of iconNames) {
      const iconPath = path.join(iconsDir, iconName)
      if (fs.existsSync(iconPath)) {
        return iconPath
      }
    }

    // Check resources directory for app icon
    const resourceIconNames = ['icon.png', 'icon.ico', 'icon.icns']
    for (const iconName of resourceIconNames) {
      const iconPath = path.join(resourcesDir, iconName)
      if (fs.existsSync(iconPath)) {
        return iconPath
      }
    }

    return null
  }

  /**
   * Create a native image for the notification icon
   */
  private createNotificationIcon(): Electron.NativeImage | null {
    const iconPath = this.getNotificationIconPath()

    if (!iconPath) {
      return null
    }

    try {
      const icon = nativeImage.createFromPath(iconPath)
      if (icon.isEmpty()) {
        return null
      }

      // Resize for notification (typically 64x64 or 128x128)
      return icon.resize({ width: 64, height: 64 })
    } catch {
      return null
    }
  }

  /**
   * Check if notifications are supported on this platform
   */
  isSupported(): boolean {
    return Notification.isSupported()
  }

  /**
   * Show a desktop notification
   */
  showNotification(options: NotificationOptions): Notification | null {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported on this platform')
      return null
    }

    const { title, body, roomId, senderId } = options

    // Create notification icon
    const icon = this.createNotificationIcon()

    // Create the notification
    const notification: Electron.Notification = new Notification({
      title,
      body,
      icon: icon || undefined,
      silent: false, // Play system notification sound
    })

    // Handle notification click
    notification.on('click', () => {
      // Focus the main window
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) {
          this.mainWindow.restore()
        }
        this.mainWindow.show()
        this.mainWindow.focus()
      }

      // Notify all registered callbacks
      const clickData: NotificationClickData = { roomId, senderId }
      this.notificationClickCallbacks.forEach(callback => {
        try {
          callback(clickData)
        } catch (err) {
          console.error('Error in notification click callback:', err)
        }
      })

      // Close the notification
      notification.close()
    })

    // Handle notification close
    ;(notification as Electron.Notification).on('close', () => {
      // Notification was closed
    })

    // Handle errors - Electron Notification events may not be fully typed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(notification as any).on('error', (err: Error) => {
      console.error('Notification error:', err)
    })

    // Show the notification
    notification.show()

    return notification
  }

  /**
   * Show a simple notification (for backward compatibility)
   */
  show(title: string, body: string): Notification | null {
    return this.showNotification({ title, body })
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager()

// Also export the class for testing
export default NotificationManager
