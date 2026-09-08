import { ipcMain, desktopCapturer, Notification, app, type BrowserWindow } from 'electron'
import fs from 'node:fs'
import type { IPCPayloads } from '@shared/types/ipc'
import { notificationManager } from '../notifications'

// Hardware acceleration settings file path
let hardwareAccelerationSettingsPath: string | null = null

export class IPCManager {
  private readonly window: BrowserWindow

  constructor(window: BrowserWindow) {
    this.window = window
    // Initialize hardware acceleration settings path
    hardwareAccelerationSettingsPath = `${app.getPath('userData')}/hardware-acceleration.json`
    this.setupListeners()
  }

  private setupListeners() {
    // Session IPC handlers
    this.setupSessionHandlers()
    // Voice IPC handlers
    this.setupVoiceHandlers()
    // Screen IPC handlers
    this.setupScreenHandlers()
    // Audio IPC handlers
    this.setupAudioHandlers()
    // System IPC handlers
    this.setupSystemHandlers()
    // Hardware acceleration handlers
    this.setupHardwareAccelerationHandlers()
  }

  private setupSessionHandlers() {
    // Create session
    ipcMain.handle('session:create', async (_event, payload: IPCPayloads['session:create']) => {
      const sessionId = crypto.randomUUID()
      this.window.webContents.send('session:created', { sessionId, name: payload.name })
      return { sessionId }
    })

    // Join session
    ipcMain.handle('session:join', async (_event, payload: IPCPayloads['session:join']) => {
      this.window.webContents.send('session:joined', { sessionId: payload.sessionId })
      return { success: true }
    })

    // Leave session
    ipcMain.handle('session:leave', async (_event, payload: IPCPayloads['session:leave']) => {
      this.window.webContents.send('session:left', { sessionId: payload.sessionId })
      return { success: true }
    })

    // List sessions
    ipcMain.handle('session:list', async () => {
      return { sessions: [] }
    })
  }

  private setupVoiceHandlers() {
    // Start voice capture
    ipcMain.handle('voice:start', async () => {
      this.window.webContents.send('voice:started')
      return { success: true }
    })

    // Stop voice capture
    ipcMain.handle('voice:stop', async () => {
      this.window.webContents.send('voice:stopped')
      return { success: true }
    })

    // Set volume
    ipcMain.handle('voice:set-volume', async (_event, payload: IPCPayloads['voice:set-volume']) => {
      this.window.webContents.send('voice:volume-changed', { volume: payload.volume })
      return { success: true }
    })

    // Set mute
    ipcMain.handle('voice:set-mute', async (_event, payload: IPCPayloads['voice:set-mute']) => {
      this.window.webContents.send('voice:mute-changed', { muted: payload.muted })
      return { success: true }
    })
  }

  private setupScreenHandlers() {
    // Get screen sources for picker
    ipcMain.handle('screen:get-sources', async () => {
      try {
        const sources = await desktopCapturer.getSources({
          types: ['screen', 'window'],
          thumbnailSize: { width: 200, height: 150 }
        })
        return sources.map(source => ({
          id: source.id,
          name: source.name,
          thumbnail: source.thumbnail.toDataURL()
        }))
      } catch (err) {
        console.error('Failed to get screen sources:', err)
        return []
      }
    })

    // Start screen sharing
    ipcMain.handle('screen:start', async (_event, payload: IPCPayloads['screen:start']) => {
      const streamId = crypto.randomUUID()
      this.window.webContents.send('screen:started', { streamId, sessionId: payload.sessionId })
      return { success: true, streamId }
    })

    // Stop screen sharing
    ipcMain.handle('screen:stop', async (_event, payload: IPCPayloads['screen:stop']) => {
      this.window.webContents.send('screen:stopped', { sessionId: payload.sessionId })
      return { success: true }
    })

    // Set screen control
    ipcMain.handle('screen:set-control', async (_event, payload: IPCPayloads['screen:set-control']) => {
      this.window.webContents.send('screen:control-changed', { enabled: payload.enabled })
      return { success: true }
    })
  }

  private setupAudioHandlers() {
    // Get audio sources (application audio)
    ipcMain.handle('audio:get-sources', async () => {
      try {
        // Get all windows with audio capability
        const sources = await desktopCapturer.getSources({
          types: ['window', 'screen'],
          thumbnailSize: { width: 1, height: 1 } // We don't need thumbnails for audio
        })
        // Log for debugging
        // eslint-disable-next-line no-console
        console.log('Audio sources found:', sources.map(s => s.name))
        // Filter and return only id and name
        return sources.map(source => ({
          id: source.id,
          name: source.name
        }))
      } catch (err) {
        console.error('Failed to get audio sources:', err)
        return []
      }
    })
  }

  private setupSystemHandlers() {
    // Show desktop notification
    ipcMain.handle('system:notification', async (_event, payload: IPCPayloads['system:notification']) => {
      try {
        const notification = notificationManager.showNotification({
          title: payload.title,
          body: payload.body,
          roomId: payload.roomId,
          senderId: payload.senderId,
        })

        // Send notification click event to renderer
        notification?.on('click', () => {
          this.window.webContents.send('system:notification-click', {
            roomId: payload.roomId,
            senderId: payload.senderId,
          })
        })

        return { success: true }
      } catch (err) {
        console.error('Failed to show notification:', err)
        return { success: false }
      }
    })

    // Check if notifications are supported
    ipcMain.handle('system:notification-supported', async () => {
      return Notification.isSupported()
    })

    // Set notification enabled state
    ipcMain.handle('system:notification-set-enabled', async (_event, payload: { enabled: boolean }) => {
      // Store in app user data for persistence
      const { app } = await import('electron')
      const settingsPath = `${app.getPath('userData')}/notification-settings.json`
      try {
        const settings = { enabled: payload.enabled }
        fs.writeFileSync(settingsPath, JSON.stringify(settings))
        return { success: true }
      } catch {
        return { success: false }
      }
    })

    // Get notification enabled state
    ipcMain.handle('system:notification-get-enabled', async () => {
      const { app } = await import('electron')
      const settingsPath = `${app.getPath('userData')}/notification-settings.json`
      try {
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
          return { enabled: settings.enabled ?? true }
        }
        return { enabled: true }
      } catch {
        return { enabled: true }
      }
    })
  }

  private setupHardwareAccelerationHandlers() {
    // Get hardware acceleration state
    ipcMain.handle('hardware-acceleration:get', async () => {
      if (!hardwareAccelerationSettingsPath) {
        return { enabled: app.commandLine.hasSwitch('disable-gpu') === false }
      }
      try {
        if (fs.existsSync(hardwareAccelerationSettingsPath)) {
          const settings = JSON.parse(fs.readFileSync(hardwareAccelerationSettingsPath, 'utf-8'))
          return { enabled: settings.enabled ?? true }
        }
        // Default to true if no settings file exists
        return { enabled: true }
      } catch {
        return { enabled: true }
      }
    })

    // Set hardware acceleration state
    ipcMain.handle('hardware-acceleration:set', async (_event, payload: IPCPayloads['hardware-acceleration:set']) => {
      if (!hardwareAccelerationSettingsPath) {
        return { success: false, requiresRestart: true }
      }
      try {
        const settings = { enabled: payload.enabled }
        fs.writeFileSync(hardwareAccelerationSettingsPath, JSON.stringify(settings))
        // Hardware acceleration change requires app restart to take effect
        return { success: true, requiresRestart: true }
      } catch (err) {
        console.error('Failed to save hardware acceleration settings:', err)
        return { success: false, requiresRestart: true }
      }
    })

    // Relaunch the app
    ipcMain.handle('app:relaunch', async () => {
      try {
        app.relaunch()
        app.quit()
        return { success: true }
      } catch (err) {
        console.error('Failed to relaunch app:', err)
        return { success: false }
      }
    })
  }

  sendNotification(title: string, body: string) {
    this.window.webContents.send('system:notification', { title, body })
  }
}
